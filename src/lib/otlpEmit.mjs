// Hand-rolled OTLP/HTTP JSON dual-emit for short-lived Cursor hooks.
// Sends metrics (+ a generation span) to LaunchDarkly Observability (or any
// OTLP collector). Fail-soft: never throws into the hook path.

import { randomBytes } from 'node:crypto';
import { estimateUsd } from './cursorPricing.mjs';

export const DEFAULT_OTLP_ENDPOINT = 'https://otel.observability.app.launchdarkly.com:4318';

export const EVENT_KEYS = {
  durationTotal: '$ld:ai:duration:total',
  tokensTotal: '$ld:ai:tokens:total',
  tokensInput: '$ld:ai:tokens:input',
  tokensOutput: '$ld:ai:tokens:output',
  generationSuccess: '$ld:ai:generation:success',
  generationError: '$ld:ai:generation:error',
};

function log(...parts) {
  process.stderr.write(`[otlp] ${parts.join(' ')}\n`);
}

function attrString(key, value) {
  if (value === undefined || value === null || value === '') return null;
  return { key, value: { stringValue: String(value) } };
}

function attrDouble(key, value) {
  if (!Number.isFinite(value)) return null;
  return { key, value: { doubleValue: value } };
}

function compactAttrs(attrs) {
  return attrs.filter(Boolean);
}

function nanoNow() {
  return `${BigInt(Date.now()) * 1_000_000n}`;
}

function hexId(bytes) {
  return randomBytes(bytes).toString('hex');
}

/**
 * Resolve OTLP config from bridge config + env.
 * Env wins: OTLP_DISABLED=1, OTEL_EXPORTER_OTLP_ENDPOINT.
 */
export function resolveOtlpConfig(bridgeConfig = {}, { sdkKey } = {}) {
  if (process.env.OTLP_DISABLED === '1' || process.env.OTLP_DISABLED === 'true') {
    return { enabled: false, endpoint: DEFAULT_OTLP_ENDPOINT, sdkKey };
  }
  const otlp = bridgeConfig.otlp && typeof bridgeConfig.otlp === 'object' ? bridgeConfig.otlp : {};
  const enabled = otlp.enabled !== false;
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || otlp.endpoint || DEFAULT_OTLP_ENDPOINT;
  return { enabled, endpoint: String(endpoint).replace(/\/$/, ''), sdkKey };
}

/** Shared resource attributes for LD Observability project binding. */
export function buildResourceAttributes(sdkKey) {
  return compactAttrs([
    attrString('service.name', 'cursor-agentcontrol-bridge'),
    attrString('service.namespace', 'agentcontrol'),
    sdkKey ? attrString('launchdarkly.project_id', sdkKey) : null,
  ]);
}

/** Common datapoint / span attributes from an LD track() call. */
export function buildTrackAttributes(context, data = {}) {
  const email = context?.key;
  return compactAttrs([
    attrString('user.id', email),
    attrString('user.email', email),
    attrString('gen_ai.system', data.providerName),
    attrString('provider', data.providerName),
    attrString('gen_ai.request.model', data.modelName),
    attrString('variation_key', data.variationKey),
    attrString('config_key', data.configKey),
    attrString('run_id', data.runId),
  ]);
}

/**
 * Map one LD track event into zero or more metric datapoints and optional span.
 * Pure — unit-tested.
 */
export function mapTrackEvent(eventKey, context, data, metricValue, { timeUnixNano } = {}) {
  const ts = timeUnixNano || nanoNow();
  const attrs = buildTrackAttributes(context, data || {});
  const value = typeof metricValue === 'number' ? metricValue : 0;
  const metrics = [];
  let span = null;

  switch (eventKey) {
    case EVENT_KEYS.generationSuccess:
      metrics.push({
        name: 'agent.generation',
        unit: '1',
        sumValue: 1,
        attributes: [...attrs, attrString('outcome', 'success')],
        timeUnixNano: ts,
      });
      span = {
        name: 'agent.generation',
        attributes: [...attrs, attrString('outcome', 'success')],
        statusCode: 1, // STATUS_CODE_OK
        startTimeUnixNano: ts,
        endTimeUnixNano: ts,
      };
      break;
    case EVENT_KEYS.generationError:
      metrics.push({
        name: 'agent.generation',
        unit: '1',
        sumValue: 1,
        attributes: [...attrs, attrString('outcome', 'error')],
        timeUnixNano: ts,
      });
      span = {
        name: 'agent.generation',
        attributes: [...attrs, attrString('outcome', 'error')],
        statusCode: 2, // STATUS_CODE_ERROR
        startTimeUnixNano: ts,
        endTimeUnixNano: ts,
      };
      break;
    case EVENT_KEYS.durationTotal:
      if (value > 0) {
        metrics.push({
          name: 'agent.duration_ms',
          unit: 'ms',
          sumValue: value,
          attributes: attrs,
          timeUnixNano: ts,
        });
      }
      break;
    case EVENT_KEYS.tokensTotal:
      if (value > 0) {
        metrics.push({
          name: 'agent.tokens',
          unit: '1',
          sumValue: value,
          attributes: [...attrs, attrString('token_type', 'total')],
          timeUnixNano: ts,
        });
      }
      break;
    case EVENT_KEYS.tokensInput:
      if (value > 0) {
        metrics.push({
          name: 'agent.tokens',
          unit: '1',
          sumValue: value,
          attributes: [...attrs, attrString('token_type', 'input')],
          timeUnixNano: ts,
        });
      }
      break;
    case EVENT_KEYS.tokensOutput:
      if (value > 0) {
        metrics.push({
          name: 'agent.tokens',
          unit: '1',
          sumValue: value,
          attributes: [...attrs, attrString('token_type', 'output')],
          timeUnixNano: ts,
        });
      }
      break;
    default:
      break;
  }

  return { metrics, span };
}

function groupMetricsByName(datapoints) {
  const byName = new Map();
  for (const dp of datapoints) {
    const key = `${dp.name}\0${dp.unit || ''}`;
    if (!byName.has(key)) byName.set(key, { name: dp.name, unit: dp.unit, points: [] });
    byName.get(key).points.push(dp);
  }
  return [...byName.values()];
}

/** Build ExportMetricsServiceRequest JSON body. */
export function buildMetricsPayload(datapoints, sdkKey) {
  const metrics = groupMetricsByName(datapoints).map((group) => ({
    name: group.name,
    unit: group.unit || '1',
    description: group.name,
    sum: {
      aggregationTemporality: 1, // AGGREGATION_TEMPORALITY_DELTA
      isMonotonic: true,
      dataPoints: group.points.map((dp) => ({
        attributes: compactAttrs(dp.attributes),
        timeUnixNano: dp.timeUnixNano,
        asDouble: dp.sumValue,
      })),
    },
  }));

  return {
    resourceMetrics: [
      {
        resource: { attributes: buildResourceAttributes(sdkKey) },
        scopeMetrics: [
          {
            scope: { name: 'cursor-agentcontrol-bridge', version: '0.2.0' },
            metrics,
          },
        ],
      },
    ],
  };
}

/** Build ExportTraceServiceRequest JSON body. */
export function buildTracesPayload(spans, sdkKey) {
  const otlpSpans = spans.map((s) => {
    const traceId = hexId(16);
    const spanId = hexId(8);
    return {
      traceId,
      spanId,
      name: s.name,
      kind: 1, // INTERNAL
      startTimeUnixNano: s.startTimeUnixNano,
      endTimeUnixNano: s.endTimeUnixNano,
      attributes: compactAttrs(s.attributes),
      status: { code: s.statusCode ?? 0 },
    };
  });

  return {
    resourceSpans: [
      {
        resource: { attributes: buildResourceAttributes(sdkKey) },
        scopeSpans: [
          {
            scope: { name: 'cursor-agentcontrol-bridge', version: '0.2.0' },
            spans: otlpSpans,
          },
        ],
      },
    ],
  };
}

async function postJson(url, body, { fetchImpl = fetch, dryRun = false } = {}) {
  if (dryRun) {
    log(`DRY_RUN POST ${url}`, JSON.stringify(body).slice(0, 500));
    return { ok: true, dryRun: true };
  }
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`${response.status} ${url}: ${text.slice(0, 200)}`);
  }
  return { ok: true };
}

/**
 * Create a buffering OTLP emitter. Call record() from track(); flush() on close().
 */
export function createOtlpEmitter({
  enabled = true,
  endpoint = DEFAULT_OTLP_ENDPOINT,
  sdkKey = null,
  dryRun = false,
  fetchImpl = fetch,
} = {}) {
  const metricsBuf = [];
  const spansBuf = [];
  const base = String(endpoint || DEFAULT_OTLP_ENDPOINT).replace(/\/$/, '');

  return {
    enabled: Boolean(enabled) && Boolean(sdkKey),
    record(eventKey, context, data, metricValue) {
      if (!enabled || !sdkKey) return;
      try {
        const { metrics, span } = mapTrackEvent(eventKey, context, data, metricValue);
        metricsBuf.push(...metrics);
        if (span) spansBuf.push(span);
      } catch (err) {
        log(`record failed: ${err.message}`);
      }
    },
    /**
     * Catalog-estimated USD — same rates as sync:models / Monitoring cost join.
     * cost_source=ld_catalog so Observability totals match the plugin ≈$.
     */
    recordEstimatedCost(context, data, { input = 0, output = 0 } = {}) {
      if (!enabled || !sdkKey) return;
      try {
        const usd = estimateUsd({
          variationKey: data?.variationKey,
          inputTokens: input,
          outputTokens: output,
        });
        if (usd == null || !(usd > 0)) return;
        metricsBuf.push({
          name: 'agent.cost_usd',
          unit: 'USD',
          sumValue: usd,
          attributes: [
            ...buildTrackAttributes(context, data || {}),
            attrString('cost_source', 'ld_catalog'),
          ],
          timeUnixNano: nanoNow(),
        });
      } catch (err) {
        log(`recordEstimatedCost failed: ${err.message}`);
      }
    },
    async flush({ timeoutMs = 2500 } = {}) {
      if (!enabled || !sdkKey) return { skipped: true };
      if (metricsBuf.length === 0 && spansBuf.length === 0) return { empty: true };

      const metricsBody = metricsBuf.length ? buildMetricsPayload(metricsBuf.splice(0), sdkKey) : null;
      const tracesBody = spansBuf.length ? buildTracesPayload(spansBuf.splice(0), sdkKey) : null;

      const run = async () => {
        const results = {};
        if (metricsBody) {
          results.metrics = await postJson(`${base}/v1/metrics`, metricsBody, { fetchImpl, dryRun });
        }
        if (tracesBody) {
          results.traces = await postJson(`${base}/v1/traces`, tracesBody, { fetchImpl, dryRun });
        }
        return results;
      };

      try {
        return await Promise.race([
          run(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('otlp flush timeout')), timeoutMs).unref?.(),
          ),
        ]);
      } catch (err) {
        log(`flush failed: ${err.message}`);
        return { error: err.message };
      }
    },
  };
}
