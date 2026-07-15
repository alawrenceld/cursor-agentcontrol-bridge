import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapTrackEvent,
  buildMetricsPayload,
  buildTracesPayload,
  buildTrackAttributes,
  resolveOtlpConfig,
  createOtlpEmitter,
  DEFAULT_OTLP_ENDPOINT,
  EVENT_KEYS,
} from '../src/lib/otlpEmit.mjs';

const ctx = { kind: 'user', key: 'alex@example.com' };
const data = {
  runId: 'run-1',
  configKey: 'cursor-agent-usage',
  variationKey: 'auto',
  modelName: 'auto',
  providerName: 'cursor',
};

test('mapTrackEvent maps generation success to metric + span', () => {
  const { metrics, span } = mapTrackEvent(EVENT_KEYS.generationSuccess, ctx, data, 1, {
    timeUnixNano: '100',
  });
  assert.equal(metrics.length, 1);
  assert.equal(metrics[0].name, 'agent.generation');
  assert.equal(metrics[0].sumValue, 1);
  assert.ok(metrics[0].attributes.some((a) => a.key === 'outcome' && a.value.stringValue === 'success'));
  assert.ok(metrics[0].attributes.some((a) => a.key === 'user.email'));
  assert.equal(span.name, 'agent.generation');
  assert.equal(span.statusCode, 1);
});

test('mapTrackEvent maps tokens and duration', () => {
  const tokens = mapTrackEvent(EVENT_KEYS.tokensInput, ctx, data, 42, { timeUnixNano: '1' });
  assert.equal(tokens.metrics[0].name, 'agent.tokens');
  assert.ok(tokens.metrics[0].attributes.some((a) => a.key === 'token_type' && a.value.stringValue === 'input'));
  assert.equal(tokens.span, null);

  const dur = mapTrackEvent(EVENT_KEYS.durationTotal, ctx, data, 1500, { timeUnixNano: '1' });
  assert.equal(dur.metrics[0].name, 'agent.duration_ms');
  assert.equal(dur.metrics[0].sumValue, 1500);
});

test('mapTrackEvent ignores unknown event keys', () => {
  const { metrics, span } = mapTrackEvent('$ld:ai:feedback:user:positive', ctx, data, 1);
  assert.equal(metrics.length, 0);
  assert.equal(span, null);
});

test('buildTrackAttributes includes model and provider', () => {
  const attrs = buildTrackAttributes(ctx, data);
  const asMap = Object.fromEntries(attrs.map((a) => [a.key, a.value.stringValue]));
  assert.equal(asMap['user.email'], 'alex@example.com');
  assert.equal(asMap['gen_ai.request.model'], 'auto');
  assert.equal(asMap.provider, 'cursor');
  assert.equal(asMap.variation_key, 'auto');
});

test('buildMetricsPayload shapes OTLP JSON with launchdarkly.project_id', () => {
  const { metrics } = mapTrackEvent(EVENT_KEYS.generationSuccess, ctx, data, 1, {
    timeUnixNano: '99',
  });
  const body = buildMetricsPayload(metrics, 'sdk-test');
  assert.equal(body.resourceMetrics.length, 1);
  const resourceAttrs = body.resourceMetrics[0].resource.attributes;
  assert.ok(resourceAttrs.some((a) => a.key === 'launchdarkly.project_id' && a.value.stringValue === 'sdk-test'));
  assert.equal(body.resourceMetrics[0].scopeMetrics[0].metrics[0].name, 'agent.generation');
  assert.equal(body.resourceMetrics[0].scopeMetrics[0].metrics[0].sum.isMonotonic, true);
});

test('buildTracesPayload includes span ids and status', () => {
  const { span } = mapTrackEvent(EVENT_KEYS.generationError, ctx, data, 1, { timeUnixNano: '5' });
  const body = buildTracesPayload([span], 'sdk-test');
  const s = body.resourceSpans[0].scopeSpans[0].spans[0];
  assert.equal(s.name, 'agent.generation');
  assert.equal(s.status.code, 2);
  assert.equal(s.traceId.length, 32);
  assert.equal(s.spanId.length, 16);
});

test('resolveOtlpConfig respects OTLP_DISABLED and endpoint env', () => {
  const prevDis = process.env.OTLP_DISABLED;
  const prevEp = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  try {
    delete process.env.OTLP_DISABLED;
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    assert.equal(resolveOtlpConfig({}, { sdkKey: 'sdk' }).enabled, true);
    assert.equal(resolveOtlpConfig({}, { sdkKey: 'sdk' }).endpoint, DEFAULT_OTLP_ENDPOINT);

    process.env.OTLP_DISABLED = '1';
    assert.equal(resolveOtlpConfig({ otlp: { enabled: true } }, { sdkKey: 'sdk' }).enabled, false);

    delete process.env.OTLP_DISABLED;
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://localhost:4318';
    assert.equal(resolveOtlpConfig({}, { sdkKey: 'sdk' }).endpoint, 'http://localhost:4318');
  } finally {
    if (prevDis === undefined) delete process.env.OTLP_DISABLED;
    else process.env.OTLP_DISABLED = prevDis;
    if (prevEp === undefined) delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    else process.env.OTEL_EXPORTER_OTLP_ENDPOINT = prevEp;
  }
});

test('createOtlpEmitter flushes metrics and traces via fetch', async () => {
  const posts = [];
  const fetchImpl = async (url, init) => {
    posts.push({ url, body: JSON.parse(init.body) });
    return { ok: true, text: async () => '' };
  };
  const emitter = createOtlpEmitter({
    enabled: true,
    endpoint: 'https://example.test:4318',
    sdkKey: 'sdk-x',
    fetchImpl,
  });
  emitter.record(EVENT_KEYS.generationSuccess, ctx, data, 1);
  emitter.record(EVENT_KEYS.durationTotal, ctx, data, 2000);
  const result = await emitter.flush();
  assert.ok(result.metrics);
  assert.ok(result.traces);
  assert.equal(posts.length, 2);
  assert.ok(posts[0].url.endsWith('/v1/metrics'));
  assert.ok(posts[1].url.endsWith('/v1/traces'));
});

test('createOtlpEmitter is no-op without sdkKey', async () => {
  const emitter = createOtlpEmitter({ enabled: true, sdkKey: null });
  emitter.record(EVENT_KEYS.generationSuccess, ctx, data, 1);
  assert.deepEqual(await emitter.flush(), { skipped: true });
});

test('recordEstimatedCost emits agent.cost_usd with cost_source=ld_catalog', async () => {
  const posts = [];
  const fetchImpl = async (url, init) => {
    posts.push({ url, body: JSON.parse(init.body) });
    return { ok: true, text: async () => '' };
  };
  const emitter = createOtlpEmitter({
    enabled: true,
    endpoint: 'https://example.test:4318',
    sdkKey: 'sdk-x',
    fetchImpl,
  });
  // auto: $1.25/M in, $6/M out → 1e6 in + 1e6 out = $7.25
  emitter.recordEstimatedCost(ctx, data, { input: 1_000_000, output: 1_000_000 });
  const result = await emitter.flush();
  assert.ok(result.metrics);
  assert.equal(posts.length, 1);
  const metric = posts[0].body.resourceMetrics[0].scopeMetrics[0].metrics[0];
  assert.equal(metric.name, 'agent.cost_usd');
  assert.equal(metric.unit, 'USD');
  assert.equal(metric.sum.dataPoints[0].asDouble, 7.25);
  const attrs = Object.fromEntries(
    metric.sum.dataPoints[0].attributes.map((a) => [a.key, a.value.stringValue]),
  );
  assert.equal(attrs.cost_source, 'ld_catalog');
  assert.equal(attrs.variation_key, 'auto');
});

test('recordEstimatedCost skips unpriced variations', async () => {
  const posts = [];
  const fetchImpl = async (url, init) => {
    posts.push({ url, body: JSON.parse(init.body) });
    return { ok: true, text: async () => '' };
  };
  const emitter = createOtlpEmitter({
    enabled: true,
    endpoint: 'https://example.test:4318',
    sdkKey: 'sdk-x',
    fetchImpl,
  });
  emitter.recordEstimatedCost(ctx, { ...data, variationKey: 'composer' }, { input: 100, output: 10 });
  assert.deepEqual(await emitter.flush(), { empty: true });
  assert.equal(posts.length, 0);
});
