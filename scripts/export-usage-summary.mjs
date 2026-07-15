#!/usr/bin/env node
// Export ledger → JSON summary for the exec report page (Surface B).
//
//   node scripts/export-usage-summary.mjs [--ledger path] [--out path] [--days 30]
//
// Output shape matches docs/AGENT_USAGE_EVENT.md reporting contract.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  readUsageEvents,
  aggregateUsageEvents,
  DEFAULT_STATE_DIR,
  ledgerPath,
} from '../src/lib/usageLedger.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const days = Number(arg('--days', '30'));
const ledger = arg('--ledger', ledgerPath(DEFAULT_STATE_DIR));
const out = arg('--out', path.join(ROOT, 'report', 'data', 'usage-summary.json'));

const to = Date.now();
const from = to - days * 24 * 3600_000;
const events = readUsageEvents(ledger);

const byUser = new Map();
for (const e of events) {
  if (typeof e.ts === 'number' && (e.ts < from || e.ts > to)) continue;
  const u = e.userKey || 'unknown';
  if (!byUser.has(u)) byUser.set(u, []);
  byUser.get(u).push(e);
}

const users = [...byUser.entries()].map(([userKey, userEvents]) => {
  const agg = aggregateUsageEvents(userEvents, { from, to });
  return {
    userKey,
    provider: userEvents[0]?.providerName ?? 'cursor',
    totals: agg.totals,
    byVariation: agg.byVariation,
  };
});

const all = aggregateUsageEvents(events, { from, to });

const payload = {
  exportedAt: new Date().toISOString(),
  from: new Date(from).toISOString(),
  to: new Date(to).toISOString(),
  days,
  ledger,
  eventCount: events.length,
  totals: all.totals,
  byVariation: all.byVariation,
  users,
  dimensions: ['userKey', 'variationKey', 'provider', 'day'],
  measures: [
    'generationCount',
    'generationSuccessCount',
    'generationErrorCount',
    'durationMs',
    'totalTokens',
    'inputTokens',
    'outputTokens',
  ],
};

mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${out} (${users.length} users, ${events.length} events, ${days}d)`);

// Also emit a tiny sample if the real ledger is empty — keeps the report page demoable.
if (events.length === 0) {
  const sampleOut = path.join(ROOT, 'report', 'data', 'usage-summary.sample.json');
  const sampleEvents = [
    {
      ts: to - 3600_000,
      userKey: 'alex@example.com',
      configKey: 'cursor-agent-usage',
      variationKey: 'composer-2-5-fast',
      providerName: 'cursor',
      eventKey: '$ld:ai:generation:success',
      metricValue: 1,
    },
    {
      ts: to - 3600_000,
      userKey: 'alex@example.com',
      variationKey: 'composer-2-5-fast',
      providerName: 'cursor',
      eventKey: '$ld:ai:duration:total',
      metricValue: 120000,
    },
    {
      ts: to - 3600_000,
      userKey: 'alex@example.com',
      variationKey: 'composer-2-5-fast',
      providerName: 'cursor',
      eventKey: '$ld:ai:tokens:total',
      metricValue: 850000,
    },
    {
      ts: to - 7200_000,
      userKey: 'tom@example.com',
      variationKey: 'claude-opus-4-8',
      providerName: 'cursor',
      eventKey: '$ld:ai:generation:success',
      metricValue: 1,
    },
    {
      ts: to - 7200_000,
      userKey: 'tom@example.com',
      variationKey: 'claude-opus-4-8',
      providerName: 'cursor',
      eventKey: '$ld:ai:tokens:total',
      metricValue: 2_000_000,
    },
  ];
  const sampleUsers = ['alex@example.com', 'tom@example.com'].map((userKey) => {
    const userEvents = sampleEvents.filter((e) => e.userKey === userKey);
    return {
      userKey,
      provider: 'cursor',
      totals: aggregateUsageEvents(userEvents, { from, to }).totals,
      byVariation: aggregateUsageEvents(userEvents, { from, to }).byVariation,
    };
  });
  const sampleAll = aggregateUsageEvents(sampleEvents, { from, to });
  writeFileSync(
    sampleOut,
    `${JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
        days,
        ledger: '(sample)',
        eventCount: sampleEvents.length,
        totals: sampleAll.totals,
        byVariation: sampleAll.byVariation,
        users: sampleUsers,
        sample: true,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Empty ledger — also wrote ${sampleOut}`);
}
