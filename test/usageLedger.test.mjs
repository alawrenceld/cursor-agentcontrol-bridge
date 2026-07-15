import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  appendUsageEvent,
  readUsageEvents,
  aggregateUsageEvents,
  ledgerPath,
} from '../src/lib/usageLedger.mjs';

const require = createRequire(import.meta.url);
const ext = require('../extension/lib/usageLedger.js');

const NOW = 1_800_000_000_000;

test('appendUsageEvent writes JSONL lines', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ledger-'));
  appendUsageEvent(
    {
      ts: NOW,
      userKey: 'alex@example.com',
      configKey: 'cursor-agent-usage',
      variationKey: 'auto',
      modelName: 'auto',
      providerName: 'cursor',
      eventKey: '$ld:ai:generation:success',
      metricValue: 1,
    },
    dir,
  );
  appendUsageEvent(
    {
      ts: NOW,
      userKey: 'alex@example.com',
      configKey: 'cursor-agent-usage',
      variationKey: 'auto',
      eventKey: '$ld:ai:duration:total',
      metricValue: 5000,
    },
    dir,
  );
  const lines = readFileSync(ledgerPath(dir), 'utf8').trim().split('\n');
  assert.equal(lines.length, 2);
  assert.equal(JSON.parse(lines[0]).userKey, 'alex@example.com');
});

test('aggregateUsageEvents filters by user and window', () => {
  const events = [
    {
      ts: NOW,
      userKey: 'alex@example.com',
      configKey: 'cursor-agent-usage',
      variationKey: 'auto',
      eventKey: '$ld:ai:generation:success',
      metricValue: 1,
    },
    {
      ts: NOW,
      userKey: 'alex@example.com',
      configKey: 'cursor-agent-usage',
      variationKey: 'auto',
      eventKey: '$ld:ai:tokens:total',
      metricValue: 1000,
    },
    {
      ts: NOW,
      userKey: 'tom@example.com',
      configKey: 'cursor-agent-usage',
      variationKey: 'auto',
      eventKey: '$ld:ai:generation:success',
      metricValue: 1,
    },
    {
      ts: NOW - 999_999_999,
      userKey: 'alex@example.com',
      variationKey: 'auto',
      eventKey: '$ld:ai:generation:success',
      metricValue: 1,
    },
  ];
  const agg = aggregateUsageEvents(events, {
    userKey: 'alex@example.com',
    configKey: 'cursor-agent-usage',
    from: NOW - 1000,
    to: NOW + 1000,
  });
  assert.equal(agg.totals.generationCount, 1);
  assert.equal(agg.totals.totalTokens, 1000);
  assert.equal(agg.byVariation.length, 1);
  assert.equal(agg.source, 'ledger');
});

test('extension CJS aggregator matches ESM', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ledger-ext-'));
  const file = path.join(dir, 'usage-events.jsonl');
  writeFileSync(
    file,
    `${JSON.stringify({
      ts: NOW,
      userKey: 'a@b.com',
      configKey: 'c',
      variationKey: 'gpt-5',
      eventKey: '$ld:ai:generation:error',
      metricValue: 1,
    })}\n`,
  );
  const events = ext.readUsageEvents(file);
  const agg = ext.aggregateUsageEvents(events, {
    userKey: 'a@b.com',
    from: NOW - 1,
    to: NOW + 1,
  });
  assert.equal(agg.totals.generationErrorCount, 1);
  assert.equal(agg.totals.generationCount, 1);
  assert.equal(readUsageEvents(file).length, 1);
});
