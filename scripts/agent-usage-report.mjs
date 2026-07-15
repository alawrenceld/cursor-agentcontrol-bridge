#!/usr/bin/env node
// Print Claude Code → LaunchDarkly usage (Me/local ledger or All/LD Monitoring).
//
// Usage:
//   node scripts/agent-usage-report.mjs [local|all] [1h|24h|7d|30d]
//   npm run agent:usage -- local 24h
//   npm run agent:usage -- all 7d

import path from 'node:path';
import os from 'node:os';
import { existsSync, readFileSync } from 'node:fs';
import {
  readUsageEvents,
  aggregateUsageEvents,
  ledgerPath,
} from '../src/lib/usageLedger.mjs';
import { estimateUsd } from '../src/lib/pricingRegistry.mjs';
import { loadEnv, PROJECT_ROOT } from '../src/lib/ldTrack.mjs';

const RANGES = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const API_BASE = 'https://app.launchdarkly.com/api/v2';

function parseArgs(argv) {
  let range = '24h';
  let scope = 'local';
  for (const a of argv) {
    const key = String(a).toLowerCase();
    if (RANGES[key]) range = key;
    if (key === 'local' || key === 'me') scope = 'local';
    if (key === 'all' || key === 'team') scope = 'all';
  }
  return { range, scope };
}

function formatCompact(n) {
  if (!Number.isFinite(n)) return '–';
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1e3).toFixed(1)}K`;
  return Math.round(n).toLocaleString('en-US');
}

function formatCost(dollars) {
  if (!Number.isFinite(dollars) || dollars <= 0) return '$0.00';
  if (dollars < 0.01) return `≈$${dollars.toFixed(4)}`;
  return `≈$${dollars.toFixed(2)}`;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '–';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function pad(s, w, right = false) {
  const str = String(s);
  if (str.length >= w) return str.slice(0, w);
  return right ? str.padStart(w) : str.padEnd(w);
}

function loadJson(p) {
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function loadClaudeConfig() {
  return loadJson(path.join(os.homedir(), '.claude', 'ld-agentcontrol.json')) || {};
}

function estimateRowCost(variationKey, metrics) {
  const fromCatalog =
    estimateUsd({
      variationKey,
      inputTokens: metrics.inputTokens,
      outputTokens: metrics.outputTokens,
    }) ?? 0;
  const fromApi = (metrics.inputCost ?? 0) + (metrics.outputCost ?? 0);
  return fromApi > 0 ? fromApi : fromCatalog;
}

function rule(n, ch = '─') {
  return ch.repeat(n);
}

function boxLine(inner, width) {
  return `│ ${pad(inner, width - 4)} │`;
}

function shorten(s, max) {
  const str = String(s);
  if (str.length <= max) return str;
  const keep = Math.max(8, Math.floor((max - 1) / 2));
  return `${str.slice(0, keep)}…${str.slice(-keep)}`;
}

function printReport({ title, subtitle, totals, rows, footer }) {
  const ranked = [...rows].sort(
    (a, b) => (b.metrics.generationCount || 0) - (a.metrics.generationCount || 0),
  );
  const totalsCost = ranked.reduce((s, r) => s + (r.estCost || 0), 0);
  const t = totals;
  const width = 68;
  const labelW = 12;

  const metric = (label, value, note = '') => {
    const left = `${pad(label, labelW)} ${pad(String(value), 8)}`;
    return note ? `${left}  ${note}` : left;
  };

  console.log('');
  console.log(`╭${rule(width - 2)}╮`);
  console.log(boxLine(title, width));
  console.log(boxLine(subtitle, width));
  console.log(`├${rule(width - 2)}┤`);
  console.log(boxLine(metric('Generations', formatCompact(t.generationCount)), width));
  console.log(
    boxLine(
      metric(
        'Tokens',
        formatCompact(t.totalTokens),
        `${formatCompact(t.inputTokens)} in · ${formatCompact(t.outputTokens)} out`,
      ),
      width,
    ),
  );
  console.log(boxLine(metric('Cost', formatCost(totalsCost), 'catalog estimate'), width));
  console.log(boxLine(metric('Duration', formatDuration(t.durationMs), 'wall clock'), width));
  console.log(`├${rule(width - 2)}┤`);

  if (ranked.length === 0) {
    console.log(boxLine('(no events in this window)', width));
    console.log(`╰${rule(width - 2)}╯`);
    console.log('');
    return;
  }

  const col = { model: 20, gen: 5, tok: 9, cost: 9, dur: 8 };
  const tableRow = (model, gen, tok, cost, dur) =>
    pad(model, col.model) +
    pad(gen, col.gen, true) +
    pad(tok, col.tok, true) +
    pad(cost, col.cost, true) +
    pad(dur, col.dur, true);

  console.log(boxLine(tableRow('Model', 'Gen', 'Tok/gen', '$/gen', 'Dur/gen'), width));
  console.log(
    boxLine(rule(col.model + col.gen + col.tok + col.cost + col.dur, '·'), width),
  );

  for (const row of ranked) {
    const m = row.metrics;
    const gens = m.generationCount || 0;
    const per = (n) => (gens > 0 && Number.isFinite(n) ? n / gens : NaN);
    const toks = per(m.totalTokens);
    const cost = per(row.estCost);
    const dur = per(m.durationMs);
    console.log(
      boxLine(
        tableRow(
          row.variationKey,
          formatCompact(gens),
          Number.isFinite(toks) ? formatCompact(toks) : '–',
          Number.isFinite(cost) ? formatCost(cost) : '–',
          Number.isFinite(dur) ? formatDuration(dur) : '–',
        ),
        width,
      ),
    );
  }

  if (footer) {
    console.log(`├${rule(width - 2)}┤`);
    console.log(boxLine(shorten(footer, width - 4), width));
  }
  console.log(`╰${rule(width - 2)}╯`);
  console.log('');
}

async function fetchAllFromLd({ token, projectKey, configKey, env, from, to }) {
  const headers = { Authorization: token, 'LD-API-Version': 'beta' };
  const base =
    `${API_BASE}/projects/${encodeURIComponent(projectKey)}` +
    `/ai-configs/${encodeURIComponent(configKey)}`;
  const get = async (suffix) => {
    const url = `${base}/${suffix}?from=${from}&to=${to}&env=${encodeURIComponent(env)}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LaunchDarkly ${response.status} on ${suffix}: ${body.slice(0, 200)}`);
    }
    return response.json();
  };
  const [totals, byVariation] = await Promise.all([
    get('metrics'),
    get('metrics-by-variation'),
  ]);
  return { totals, byVariation, from, to, source: 'monitoring' };
}

loadEnv(path.join(PROJECT_ROOT, '.env'));
const { range, scope } = parseArgs(process.argv.slice(2));
const claudeCfg = loadClaudeConfig();
const email = claudeCfg.hookUserEmail ?? null;
const configKey = claudeCfg.aiConfigKey || 'claude-code-usage';
const to = Date.now();
const from = to - RANGES[range];

if (scope === 'local') {
  const stateDir =
    process.env.LD_AGENTCONTROL_STATE ||
    path.join(os.homedir(), '.claude', 'ld-agentcontrol-state');
  const file = ledgerPath(stateDir);
  if (!existsSync(file)) {
    console.log(`No Claude Code ledger yet at ${file}`);
    console.log('Run a Claude Code session with AgentControl hooks installed.');
    process.exit(0);
  }
  const events = readUsageEvents(file);
  const data = aggregateUsageEvents(events, {
    userKey: email || undefined,
    configKey,
    from,
    to,
  });
  const rows = (data.byVariation ?? []).map((row) => ({
    ...row,
    estCost: estimateRowCost(row.variationKey, row.metrics),
  }));
  printReport({
    title: 'AGENT USAGE · LAUNCHDARKLY',
    subtitle: `Local · ${email || 'unknown'} · ${range}`,
    totals: data.totals,
    rows,
    footer: `Source  local ledger`,
  });
  process.exit(0);
}

// scope === 'all' — team totals from LD Monitoring (same as Cursor All panel)
const token = process.env.LD_API_TOKEN || claudeCfg.apiToken;
const projectKey =
  process.env.LD_PROJECT_KEY || claudeCfg.projectKey || 'cursor-monitoring';
const env = process.env.LD_ENV_KEY || claudeCfg.environmentKey || 'production';

if (!token) {
  console.error(
    'All scope needs a Reader (or Writer) API token.\n' +
      'Set LD_API_TOKEN in .env, or apiToken in ~/.claude/ld-agentcontrol.json',
  );
  process.exit(1);
}

try {
  const data = await fetchAllFromLd({
    token,
    projectKey,
    configKey,
    env,
    from,
    to,
  });
  const rows = (data.byVariation ?? []).map((row) => {
    const variationKey = row.variationKey ?? row.key ?? 'unknown';
    const metrics = row.metrics ?? row;
    return {
      variationKey,
      metrics,
      estCost: estimateRowCost(variationKey, metrics),
    };
  });
  printReport({
    title: 'AGENT USAGE · LAUNCHDARKLY',
    subtitle: `All · ${configKey} · Monitoring · ${range}`,
    totals: data.totals,
    rows,
    footer: `Source  LD ${projectKey} · ${configKey} · ${env}`,
  });
} catch (err) {
  console.error(`All fetch failed: ${err.message}`);
  process.exit(1);
}
