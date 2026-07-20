#!/usr/bin/env node
// Local OTLP/HTTP receiver for VS Code Copilot Chat → AgentUsageEvent sinks.
//
// Default: http://127.0.0.1:4319/v1/traces
// Point github.copilot.chat.otel.otlpEndpoint at that base URL.

import http from 'node:http';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

process.env.LD_AGENTCONTROL_PROVIDER = 'copilot';

import {
  resolveRuntime,
  resolveVariation,
  buildTrackData,
  userContext,
  createLdTracker,
  AGENT_MODEL_ATTR,
} from '../../lib/ldTrack.mjs';
import { applyAgentUsageEvent } from '../../lib/agentUsageEvent.mjs';
import { extractChatUsageFromOtlpTraces } from '../../lib/copilotOtlpMap.mjs';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4319;
const MAX_SEEN = 5_000;

function logLine(stateDir, msg) {
  try {
    mkdirSync(stateDir, { recursive: true });
    appendFileSync(path.join(stateDir, 'receiver.log'), `${new Date().toISOString()} ${msg}\n`);
  } catch {
    // ignore
  }
  process.stderr.write(`[copilot-otel] ${msg}\n`);
}

function seenPath(stateDir) {
  return path.join(stateDir, 'otlp-span-ids.json');
}

function loadSeen(stateDir) {
  const file = seenPath(stateDir);
  if (!existsSync(file)) return new Set();
  try {
    const arr = JSON.parse(readFileSync(file, 'utf8'));
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSeen(stateDir, seen) {
  const arr = [...seen];
  const trimmed = arr.length > MAX_SEEN ? arr.slice(arr.length - MAX_SEEN) : arr;
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(seenPath(stateDir), `${JSON.stringify(trimmed)}\n`);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj ?? {});
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function handleTraces(bodyBuf, stateDir, seen) {
  let body;
  try {
    body = JSON.parse(bodyBuf.toString('utf8') || '{}');
  } catch (err) {
    logLine(stateDir, `invalid JSON: ${err.message}`);
    return { accepted: 0, skipped: 0 };
  }

  // Re-resolve each batch so edits to hookUserEmail / sdkKey apply without restart.
  let runtime;
  try {
    runtime = resolveRuntime({ provider: 'copilot' });
  } catch (err) {
    logLine(stateDir, `config error: ${err.message}`);
    return { accepted: 0, skipped: 0 };
  }
  stateDir = runtime.stateDir;
  const { config, sdkKey } = runtime;

  const partials = extractChatUsageFromOtlpTraces(body);
  let accepted = 0;
  let skipped = 0;
  const email = config.hookUserEmail || process.env.LD_HOOK_USER_EMAIL;
  if (!email || email === 'you@example.com') {
    logLine(stateDir, 'missing hookUserEmail — set it in ~/.copilot/ld-agentcontrol.json');
    return { accepted: 0, skipped: partials.length };
  }
  const rawKey = sdkKey || process.env.LD_SDK_KEY || '';
  const resolvedKey =
    !rawKey || rawKey === 'sdk-REPLACE_ME' || rawKey.startsWith('sdk-REPLACE')
      ? ''
      : rawKey;
  const dryRun = process.env.DRY_RUN === '1' || !resolvedKey;
  if (!resolvedKey && process.env.DRY_RUN !== '1') {
    logLine(stateDir, 'missing sdkKey — ledger-only mode (set sdkKey or LD_SDK_KEY for LD track)');
  }

  const tracker = await createLdTracker({ sdkKey: resolvedKey || undefined, stateDir, dryRun });
  const context = userContext(email);

  try {
    for (const partial of partials) {
      if (seen.has(partial.runId)) {
        skipped += 1;
        continue;
      }
      const variationKey = resolveVariation(config, partial.model);
      if (!variationKey) {
        logLine(stateDir, `unmapped model "${partial.model}" — skipped`);
        skipped += 1;
        seen.add(partial.runId);
        continue;
      }

      const evalCtx = {
        ...context,
        [AGENT_MODEL_ATTR]: variationKey,
      };
      try {
        await tracker.evaluate(config.aiConfigKey, evalCtx);
      } catch (err) {
        logLine(stateDir, `evaluate failed: ${err.message}`);
      }

      const trackData = buildTrackData({
        runId: partial.runId,
        configKey: config.aiConfigKey,
        variationKey,
        version: config.aiConfigVersion,
        modelName: partial.model,
        providerName: config.providerName || 'copilot',
        extra: {
          conversationId: partial.conversationId,
          source: 'otel',
        },
      });

      applyAgentUsageEvent(tracker, evalCtx, trackData, {
        provider: 'copilot',
        providerName: config.providerName || 'copilot',
        model: partial.model,
        userKey: email,
        source: 'otel',
        outcome: partial.outcome,
        tokens: partial.tokens,
        startedAt: partial.startedAt,
        endedAt: partial.endedAt,
        conversationId: partial.conversationId,
        configKey: config.aiConfigKey,
        variationKey,
        runId: partial.runId,
        version: config.aiConfigVersion,
      });

      seen.add(partial.runId);
      accepted += 1;
      logLine(
        stateDir,
        `chat span ${partial.runId.slice(0, 8)}… model=${partial.model} ` +
          `var=${variationKey} tokens=${partial.tokens.total} outcome=${partial.outcome}`,
      );
    }
  } finally {
    try {
      await tracker.close();
    } catch (err) {
      logLine(stateDir, `tracker.close: ${err.message}`);
    }
    saveSeen(stateDir, seen);
  }

  return { accepted, skipped };
}

function createServer(initialRuntime) {
  const seen = loadSeen(initialRuntime.stateDir);
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
        sendJson(res, 200, { ok: true, provider: 'copilot', service: 'agentcontrol-otlp-receiver' });
        return;
      }
      if (req.method === 'POST' && (url.pathname === '/v1/metrics' || url.pathname === '/v1/logs')) {
        await readBody(req);
        sendJson(res, 200, {});
        return;
      }
      if (req.method === 'POST' && url.pathname === '/v1/traces') {
        const buf = await readBody(req);
        const result = await handleTraces(buf, initialRuntime.stateDir, seen);
        sendJson(res, 200, result);
        return;
      }
      sendJson(res, 404, { error: 'not_found' });
    } catch (err) {
      logLine(initialRuntime.stateDir, `request error: ${err.message}`);
      // Fail-soft: never break Copilot's exporter with 5xx if we can avoid it.
      sendJson(res, 200, { error: String(err.message || err) });
    }
  });
}

function main() {
  let runtime;
  try {
    runtime = resolveRuntime({ provider: 'copilot' });
  } catch (err) {
    console.error(`config error: ${err.message}`);
    process.exit(1);
  }

  const host =
    process.env.COPILOT_OTLP_HOST ||
    runtime.config.otelReceiver?.host ||
    DEFAULT_HOST;
  const port = Number(
    process.env.COPILOT_OTLP_PORT ||
      runtime.config.otelReceiver?.port ||
      DEFAULT_PORT,
  );

  const server = createServer(runtime);
  server.listen(port, host, () => {
    logLine(
      runtime.stateDir,
      `listening on http://${host}:${port}  (POST /v1/traces)  config=${runtime.configPath}`,
    );
    console.log(`Copilot OTLP receiver → http://${host}:${port}`);
    console.log(`Set VS Code: "github.copilot.chat.otel.otlpEndpoint": "http://${host}:${port}"`);
  });
}

main();
