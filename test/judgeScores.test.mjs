import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { readScores, aggregateScores } = require('../extension/lib/judgeScores.js');

const NOW = 1_800_000_000_000;
const entry = (over = {}) =>
  JSON.stringify({ ts: NOW, configKey: 'cursor-agent-usage', variationKey: 'auto', score: 0.9, ...over });

test('readScores parses JSONL, skipping garbage and score-less lines', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'scores-'));
  const file = path.join(dir, 'judge-scores.jsonl');
  writeFileSync(file, [entry(), 'garbage', entry({ score: 'NaN' }), entry({ variationKey: 'gpt-5' })].join('\n'));
  assert.equal(readScores(file).length, 2);
  assert.deepEqual(readScores(path.join(dir, 'missing.jsonl')), []);
});

test('aggregateScores filters by config and window, averages per variation', () => {
  const scores = [
    JSON.parse(entry({ score: 0.9 })),
    JSON.parse(entry({ score: 0.5 })),
    JSON.parse(entry({ variationKey: 'gpt-5', score: 1.0 })),
    JSON.parse(entry({ configKey: 'other-config', score: 0.0 })), // filtered
    JSON.parse(entry({ ts: NOW - 999_999_999, score: 0.0 })), // out of window
  ];
  const agg = aggregateScores(scores, { configKey: 'cursor-agent-usage', from: NOW - 1000, to: NOW + 1000 });
  assert.equal(agg.totals.count, 3);
  assert.ok(Math.abs(agg.totals.avg - 0.8) < 1e-9);
  assert.equal(agg.byVariation.auto.count, 2);
  assert.ok(Math.abs(agg.byVariation.auto.avg - 0.7) < 1e-9);
  assert.equal(agg.byVariation['gpt-5'].avg, 1.0);
});

test('aggregateScores with no matches yields null averages', () => {
  const agg = aggregateScores([], { configKey: 'x', from: 0, to: 1 });
  assert.deepEqual(agg.totals, { avg: null, count: 0 });
  assert.deepEqual(agg.byVariation, {});
});
