// Read and aggregate local judge scores (Cursor judge worker JSONL).
// Same semantics as extension/lib/judgeScores.js — beta Monitoring API
// does not expose judge metrics, so the panel/menubar read this ledger.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const DEFAULT_SCORES_PATH = path.join(
  os.homedir(),
  '.cursor',
  'ld-agentcontrol-state',
  'judge-scores.jsonl',
);

export function readScores(scoresPath = DEFAULT_SCORES_PATH) {
  let raw;
  try {
    raw = readFileSync(scoresPath, 'utf8');
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
export function aggregateScores(scores, { configKey, from, to } = {}) {
  const byVariation = {};
  let sum = 0;
  let count = 0;
  for (const entry of scores) {
    if (configKey && entry.configKey !== configKey) continue;
    if (typeof entry.ts === 'number' && (entry.ts < from || entry.ts > to)) continue;
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

/** Weighted merge of {avg, count} buckets. */
export function mergeJudgeTotals(parts) {
  let sum = 0;
  let count = 0;
  for (const p of parts) {
    if (p && typeof p.count === 'number' && p.count > 0 && typeof p.avg === 'number') {
      sum += p.avg * p.count;
      count += p.count;
    }
  }
  return { avg: count > 0 ? sum / count : null, count };
}
