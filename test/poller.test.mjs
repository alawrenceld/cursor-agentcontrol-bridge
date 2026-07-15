// Poller logic tests with the Cursor Admin API stubbed via globalThis.fetch.
// pollOnce runs in dry-run mode; emitted events are captured by intercepting
// the DRY_RUN log lines on stderr.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  parseArgs,
  extractTokens,
  eventHash,
  fetchUsageEvents,
  pollOnce,
} from '../src/poller/poll-usage-events.mjs';

const NOW = Date.now();

function usageEvent(overrides = {}) {
  return {
    timestamp: String(NOW - 60_000),
    userEmail: 'dev@example.com',
    model: 'claude-4.5-sonnet',
    kind: 'USAGE_EVENT_KIND_USER_PROMPT',
    tokenUsage: {
      inputTokens: 1000,
      outputTokens: 500,
      cacheWriteTokens: 200,
      cacheReadTokens: 4000,
      totalCents: 12.3,
    },
    ...overrides,
  };
}

function stubFetch(pages) {
  let call = 0;
  globalThis.fetch = async (_url, { body }) => {
    const { page } = JSON.parse(body);
    call += 1;
    return {
      ok: true,
      json: async () => ({
        usageEvents: pages[page - 1] ?? [],
        pagination: { numPages: pages.length, currentPage: page },
      }),
    };
  };
  return () => call;
}

async function captureStderr(fn) {
  const original = process.stderr.write.bind(process.stderr);
  let output = '';
  process.stderr.write = (chunk) => {
    output += chunk;
    return true;
  };
  try {
    await fn();
  } finally {
    process.stderr.write = original;
  }
  return output;
}

function dryRunEvents(stderrOutput) {
  return stderrOutput
    .split('\n')
    .filter((line) => line.includes('DRY_RUN track'))
    .map((line) => {
      const eventKey = line.match(/DRY_RUN track (\S+)/)[1];
      return { eventKey, ...JSON.parse(line.slice(line.indexOf('{'))) };
    });
}

test('parseArgs handles flags', () => {
  assert.deepEqual(parseArgs([]), { dryRun: false, loop: false, since: null });
  const args = parseArgs(['--dry-run', '--since', '2026-07-01']);
  assert.equal(args.dryRun, true);
  assert.equal(args.since, Date.parse('2026-07-01'));
});

test('extractTokens tolerates missing/garbage fields', () => {
  assert.equal(extractTokens({}), null);
  assert.equal(extractTokens({ tokenUsage: 'nope' }), null);
  assert.deepEqual(extractTokens({ tokenUsage: { inputTokens: 5, outputTokens: 'x' } }), {
    input: 5,
    output: 0,
    cacheWrite: 0,
    cacheRead: 0,
    totalCents: undefined,
  });
});

test('eventHash is stable for identical events, distinct otherwise', () => {
  const event = usageEvent();
  const tokens = extractTokens(event);
  assert.equal(eventHash(event, tokens), eventHash({ ...event }, { ...tokens }));
  assert.notEqual(
    eventHash(event, tokens),
    eventHash({ ...event, model: 'gpt-5' }, tokens),
  );
});

test('fetchUsageEvents paginates using pagination.numPages', async () => {
  stubFetch([[usageEvent(), usageEvent()], [usageEvent()]]);
  const events = await fetchUsageEvents({ adminKey: 'k', startDate: 0, endDate: NOW });
  assert.equal(events.length, 3);
});

test('pollOnce: emits tokens, filters emails, dedupes, skips unmapped models', async () => {
  process.env.CURSOR_ADMIN_KEY = 'test-key';
  // Public defaults leave userEmails empty (= ingest everyone). Point the
  // poller at a temp config that still exercises the allowlist.
  const dir = mkdtempSync(path.join(tmpdir(), 'poller-cfg-'));
  const base = JSON.parse(readFileSync(new URL('../bridge.config.json', import.meta.url)));
  const cfgPath = path.join(dir, 'bridge.config.json');
  writeFileSync(
    cfgPath,
    JSON.stringify({
      ...base,
      hookUserEmail: 'dev@example.com',
      userEmails: ['dev@example.com'],
      stateDir: dir,
    }),
  );
  const prevConfig = process.env.LD_AGENTCONTROL_CONFIG;
  process.env.LD_AGENTCONTROL_CONFIG = cfgPath;

  const duplicate = usageEvent();
  stubFetch([
    [
      duplicate,
      duplicate, // exact duplicate -> deduped within the run
      usageEvent({ userEmail: 'someone-else@launchdarkly.com' }), // filtered
      usageEvent({ model: 'mystery-model-9000', timestamp: String(NOW - 30_000) }), // unmapped
      usageEvent({ model: 'gpt-5', timestamp: String(NOW - 10_000) }),
    ],
  ]);

  let stderrOutput;
  try {
    stderrOutput = await captureStderr(() => pollOnce({ dryRun: true, since: null }));
  } finally {
    if (prevConfig === undefined) delete process.env.LD_AGENTCONTROL_CONFIG;
    else process.env.LD_AGENTCONTROL_CONFIG = prevConfig;
  }
  const emitted = dryRunEvents(stderrOutput);

  // 2 usable events x 3 token metrics (input/output/total all > 0).
  assert.equal(emitted.length, 6);
  assert.deepEqual(
    [...new Set(emitted.map((e) => e.eventKey))].sort(),
    ['$ld:ai:tokens:input', '$ld:ai:tokens:output', '$ld:ai:tokens:total'],
  );

  const total = emitted.find(
    (e) => e.eventKey === '$ld:ai:tokens:total' && e.data.modelName === 'claude-4.5-sonnet',
  );
  // total includes cache tokens; input/output stay raw for LD cost derivation.
  assert.equal(total.metricValue, 1000 + 500 + 200 + 4000);
  assert.equal(total.data.configKey, 'cursor-agent-usage');
  assert.equal(total.data.variationKey, 'claude-4-5-sonnet');
  assert.equal(total.data.providerName, 'cursor');
  assert.equal(total.data.cacheReadTokens, 4000);
  assert.equal(total.data.totalCents, 12.3);
  assert.equal(total.context.key, 'dev@example.com');

  assert.match(stderrOutput, /emitted=2 deduped=1 filtered=1 unmappedModel=1/);
});
