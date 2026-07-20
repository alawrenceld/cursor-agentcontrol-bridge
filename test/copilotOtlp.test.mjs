import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  extractChatUsageFromOtlpTraces,
  chatSpanToUsagePartial,
  isChatSpan,
} from '../src/lib/copilotOtlpMap.mjs';
import { resolveRuntime, PROJECT_ROOT } from '../src/lib/ldTrack.mjs';
import { estimateUsd } from '../src/lib/copilotPricing.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function attr(key, value) {
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { key, value: { intValue: value } }
      : { key, value: { doubleValue: value } };
  }
  return { key, value: { stringValue: String(value) } };
}

function chatSpan(over = {}) {
  const start = BigInt(1_800_000_000_000) * 1_000_000n;
  const end = start + 2_500_000_000n; // 2.5s
  return {
    traceId: 'aabbccddeeff00112233445566778899',
    spanId: over.spanId || '1122334455667788',
    name: over.name || 'chat gpt-4o',
    startTimeUnixNano: String(start),
    endTimeUnixNano: String(end),
    attributes: [
      attr('gen_ai.operation.name', over.op || 'chat'),
      attr('gen_ai.request.model', over.requestModel || 'gpt-4o'),
      attr('gen_ai.response.model', over.model || 'gpt-4o'),
      attr('gen_ai.usage.input_tokens', over.input ?? 100),
      attr('gen_ai.usage.output_tokens', over.output ?? 20),
      attr('gen_ai.conversation.id', over.conversationId || 'conv-1'),
      ...(over.error ? [attr('error.type', 'Error')] : []),
    ],
    status: over.error ? { code: 2 } : { code: 1 },
  };
}

function otlpBody(spans) {
  return {
    resourceSpans: [
      {
        scopeSpans: [{ spans }],
      },
    ],
  };
}

test('isChatSpan recognizes chat op and name prefix', () => {
  assert.equal(isChatSpan({ name: 'chat gpt-4o' }, { 'gen_ai.operation.name': 'chat' }), true);
  assert.equal(isChatSpan({ name: 'invoke_agent copilot' }, { 'gen_ai.operation.name': 'invoke_agent' }), false);
  assert.equal(isChatSpan({ name: 'chat' }, {}), true);
});

test('chatSpanToUsagePartial maps tokens duration and errors', () => {
  const partial = chatSpanToUsagePartial(chatSpan({ error: true, input: 50, output: 10 }));
  assert.equal(partial.provider, 'copilot');
  assert.equal(partial.source, 'otel');
  assert.equal(partial.outcome, 'error');
  assert.equal(partial.tokens.input, 50);
  assert.equal(partial.tokens.output, 10);
  assert.equal(partial.tokens.total, 60);
  assert.equal(partial.endedAt - partial.startedAt, 2500);
  assert.equal(partial.model, 'gpt-4o');
});

test('extractChatUsageFromOtlpTraces keeps chat spans only', () => {
  const body = otlpBody([
    chatSpan({ spanId: 'aaaaaaaaaaaaaaaa' }),
    {
      ...chatSpan({ spanId: 'bbbbbbbbbbbbbbbb', op: 'invoke_agent', name: 'invoke_agent copilot' }),
      attributes: [
        attr('gen_ai.operation.name', 'invoke_agent'),
        attr('gen_ai.usage.input_tokens', 9999),
      ],
    },
    chatSpan({ spanId: 'cccccccccccccccc', model: 'o4-mini' }),
  ]);
  const events = extractChatUsageFromOtlpTraces(body);
  assert.equal(events.length, 2);
  assert.equal(events[0].runId, 'aaaaaaaaaaaaaaaa');
  assert.equal(events[1].model, 'o4-mini');
});

test('copilot pricing estimates usd for known models', () => {
  const usd = estimateUsd({ variationKey: 'gpt-4o', inputTokens: 1_000_000, outputTokens: 0 });
  assert.equal(usd, 2.5);
});

test('copilot provider repo mode uses adapter defaults', () => {
  process.env.LD_AGENTCONTROL_CONFIG = 'repo';
  const runtime = resolveRuntime({ provider: 'copilot' });
  assert.equal(runtime.mode, 'repo');
  assert.equal(runtime.provider, 'copilot');
  assert.equal(runtime.config.aiConfigKey, 'copilot-usage');
  assert.equal(runtime.stateDir, path.join(PROJECT_ROOT, '.state', 'copilot'));
  delete process.env.LD_AGENTCONTROL_CONFIG;
});

test('receiver accepts chat span and appends ledger (dry-run)', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'copilot-recv-'));
  const configPath = path.join(dir, 'ld-agentcontrol.json');
  const stateDir = path.join(dir, 'state');
  writeFileSync(
    configPath,
    JSON.stringify({
      aiConfigKey: 'copilot-usage',
      aiConfigVersion: 1,
      providerName: 'copilot',
      models: { 'gpt-4o': 'gpt-4o' },
      fallbackVariation: 'gpt-4o',
      hookUserEmail: 'test@example.com',
      stateDir,
      otlp: { enabled: false },
    }),
  );

  const probe = http.createServer();
  await new Promise((r) => probe.listen(0, '127.0.0.1', r));
  const { port } = probe.address();
  await new Promise((r) => probe.close(r));

  const recv = spawn(
    process.execPath,
    [path.join(ROOT, 'src', 'adapters', 'copilot', 'otlp-receiver.mjs')],
    {
      env: {
        ...process.env,
        LD_AGENTCONTROL_CONFIG: configPath,
        LD_AGENTCONTROL_PROVIDER: 'copilot',
        DRY_RUN: '1',
        COPILOT_OTLP_HOST: '127.0.0.1',
        COPILOT_OTLP_PORT: String(port),
        OTLP_DISABLED: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let ready = '';
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`receiver start timeout\n${ready}`)), 5000);
    recv.stderr.on('data', (c) => {
      ready += c.toString();
      if (ready.includes('listening')) {
        clearTimeout(t);
        resolve();
      }
    });
    recv.on('error', reject);
  });

  const payload = JSON.stringify(otlpBody([chatSpan({ spanId: 'deadbeefdeadbeef' })]));
  const postOnce = () =>
    new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/v1/traces',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          const chunks = [];
          res.on('data', (d) => chunks.push(d));
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              body: JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'),
            });
          });
        },
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

  const first = await postOnce();
  assert.equal(first.status, 200);
  assert.equal(first.body.accepted, 1);

  const second = await postOnce();
  assert.equal(second.body.accepted, 0);
  assert.equal(second.body.skipped, 1);

  const ledger = path.join(stateDir, 'usage-events.jsonl');
  assert.ok(existsSync(ledger), 'ledger should exist');
  const lines = readFileSync(ledger, 'utf8').trim().split('\n');
  assert.ok(lines.length >= 1);
  const row = JSON.parse(lines[0]);
  assert.equal(row.providerName, 'copilot');
  assert.equal(row.userKey, 'test@example.com');

  recv.kill('SIGTERM');
  await new Promise((r) => recv.on('close', r));
});
