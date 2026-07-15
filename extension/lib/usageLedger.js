// Read/aggregate the local usage ledger written by the hook tracker
// (~/.cursor/ld-agentcontrol-state/usage-events.jsonl). Powers the "Me"
// scope in the panel — AI Config /metrics has no user filter.

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_STATE_DIR = path.join(os.homedir(), '.cursor', 'ld-agentcontrol-state');
const LEDGER_FILENAME = 'usage-events.jsonl';

const KEYS = {
  durationTotal: '$ld:ai:duration:total',
  tokensTtf: '$ld:ai:tokens:ttf',
  tokensTotal: '$ld:ai:tokens:total',
  tokensInput: '$ld:ai:tokens:input',
  tokensOutput: '$ld:ai:tokens:output',
  generationSuccess: '$ld:ai:generation:success',
  generationError: '$ld:ai:generation:error',
  feedbackPositive: '$ld:ai:feedback:user:positive',
  feedbackNegative: '$ld:ai:feedback:user:negative',
};

function ledgerPath(stateDir = DEFAULT_STATE_DIR) {
  return path.join(stateDir, LEDGER_FILENAME);
}

function readUsageEvents(filePath = ledgerPath()) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }
  const events = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.eventKey) events.push(entry);
    } catch {
      // skip malformed
    }
  }
  return events;
}

function emptyMetrics() {
  return {
    durationMs: 0,
    generationCount: 0,
    generationErrorCount: 0,
    generationSuccessCount: 0,
    inputCost: 0,
    inputTokens: 0,
    outputCost: 0,
    outputTokens: 0,
    thumbsDown: 0,
    thumbsUp: 0,
    timeToFirstTokenMs: 0,
    totalTokens: 0,
  };
}

function applyEvent(metrics, entry) {
  const v = Number(entry.metricValue) || 0;
  switch (entry.eventKey) {
    case KEYS.generationSuccess:
      metrics.generationSuccessCount += v;
      metrics.generationCount += v;
      break;
    case KEYS.generationError:
      metrics.generationErrorCount += v;
      metrics.generationCount += v;
      break;
    case KEYS.durationTotal:
      metrics.durationMs += v;
      break;
    case KEYS.tokensTotal:
      metrics.totalTokens += v;
      break;
    case KEYS.tokensInput:
      metrics.inputTokens += v;
      break;
    case KEYS.tokensOutput:
      metrics.outputTokens += v;
      break;
    case KEYS.tokensTtf:
      metrics.timeToFirstTokenMs += v;
      break;
    case KEYS.feedbackPositive:
      metrics.thumbsUp += v;
      break;
    case KEYS.feedbackNegative:
      metrics.thumbsDown += v;
      break;
    default:
      break;
  }
}

function aggregateUsageEvents(events, { userKey, configKey, from, to, providerName } = {}) {
  const totals = emptyMetrics();
  const byKey = new Map();

  for (const entry of events) {
    if (userKey && entry.userKey !== userKey) continue;
    if (configKey && entry.configKey && entry.configKey !== configKey) continue;
    if (providerName && entry.providerName && entry.providerName !== providerName) continue;
    if (typeof entry.ts === 'number' && (entry.ts < from || entry.ts > to)) continue;

    applyEvent(totals, entry);
    const vk = entry.variationKey || 'unknown';
    if (!byKey.has(vk)) byKey.set(vk, emptyMetrics());
    applyEvent(byKey.get(vk), entry);
  }

  const byVariation = [...byKey.entries()].map(([variationKey, metrics]) => ({
    variationKey,
    metrics,
  }));

  return { totals, byVariation, from, to, source: 'ledger' };
}

module.exports = {
  DEFAULT_STATE_DIR,
  LEDGER_FILENAME,
  KEYS,
  ledgerPath,
  readUsageEvents,
  aggregateUsageEvents,
};
