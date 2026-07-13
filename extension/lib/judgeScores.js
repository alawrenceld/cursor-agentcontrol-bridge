// Read and aggregate local judge scores written by the judge worker
// (~/.cursor/ld-agentcontrol-state/judge-scores.jsonl). Local because the
// beta AI Config metrics API doesn't expose judge metrics; swap this for an
// API fetch if/when it does.

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SCORES_PATH = path.join(
  os.homedir(),
  '.cursor',
  'ld-agentcontrol-state',
  'judge-scores.jsonl',
);

function readScores(scoresPath = SCORES_PATH) {
  let raw;
  try {
    raw = fs.readFileSync(scoresPath, 'utf8');
  } catch {
    return [];
  }
  const scores = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (typeof entry.score === 'number' && entry.variationKey) scores.push(entry);
    } catch {
      // skip malformed lines
    }
  }
  return scores;
}

/**
 * Aggregate scores for a config within [from, to]:
 * { totals: {avg, count}, byVariation: { [variationKey]: {avg, count} } }
 */
function aggregateScores(scores, { configKey, from, to }) {
  const byVariation = {};
  let sum = 0;
  let count = 0;
  for (const entry of scores) {
    if (configKey && entry.configKey !== configKey) continue;
    if (entry.ts < from || entry.ts > to) continue;
    sum += entry.score;
    count += 1;
    const bucket = (byVariation[entry.variationKey] ??= { sum: 0, count: 0 });
    bucket.sum += entry.score;
    bucket.count += 1;
  }
  const finish = (b) => ({ avg: b.count > 0 ? b.sum / b.count : null, count: b.count });
  return {
    totals: finish({ sum, count }),
    byVariation: Object.fromEntries(
      Object.entries(byVariation).map(([key, bucket]) => [key, finish(bucket)]),
    ),
  };
}

module.exports = { SCORES_PATH, readScores, aggregateScores };
