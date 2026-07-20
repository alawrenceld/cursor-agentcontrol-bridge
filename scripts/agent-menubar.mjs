#!/usr/bin/env node
// Aggregate Cursor + Claude Code local ledgers for a macOS menu bar (SwiftBar).
//
// Usage:
//   node scripts/agent-menubar.mjs --swiftbar
//   node scripts/agent-menubar.mjs --json [--out ~/.agentcontrol/menubar.json]
//
// SwiftBar opens a Cursor-panel-style webview popover (not a nested text menu).

import path from 'node:path';
import os from 'node:os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import {
  readUsageEvents,
  aggregateUsageEvents,
  ledgerPath,
} from '../src/lib/usageLedger.mjs';
import { estimateUsd } from '../src/lib/pricingRegistry.mjs';
import { renderMenubarPanelHtml } from '../src/lib/menubarPanelHtml.mjs';
import {
  readScores,
  aggregateScores,
  mergeJudgeTotals,
  DEFAULT_SCORES_PATH,
} from '../src/lib/judgeScores.mjs';

const RANGES = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const AGENTS = [
  {
    id: 'cursor',
    label: 'Cursor',
    stateDir: path.join(os.homedir(), '.cursor', 'ld-agentcontrol-state'),
    configPath: path.join(os.homedir(), '.cursor', 'ld-agentcontrol.json'),
    configKey: 'cursor-agent-usage',
    // Same local judge ledger the Cursor sidebar reads (Claude Code has none yet).
    scoresPath: DEFAULT_SCORES_PATH,
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    stateDir: path.join(os.homedir(), '.claude', 'ld-agentcontrol-state'),
    configPath: path.join(os.homedir(), '.claude', 'ld-agentcontrol.json'),
    configKey: 'claude-code-usage',
    scoresPath: null,
  },
];

const STATE_DIR = path.join(os.homedir(), '.agentcontrol');
const PREFS_PATH = path.join(STATE_DIR, 'menubar-prefs.json');
const HTML_PATH = path.join(STATE_DIR, 'menubar.html');
const JSON_PATH = path.join(STATE_DIR, 'menubar.json');

function loadPrefs() {
  if (!existsSync(PREFS_PATH)) return {};
  try {
    return JSON.parse(readFileSync(PREFS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function savePrefs(prefs) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(PREFS_PATH, `${JSON.stringify(prefs, null, 2)}\n`);
}

function parseArgs(argv) {
  const prefs = loadPrefs();
  let range = prefs.range && RANGES[prefs.range] ? prefs.range : '24h';
  let mode = 'swiftbar';
  let out = JSON_PATH;
  let setRange = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') mode = 'json';
    if (a === '--swiftbar') mode = 'swiftbar';
    if (a === '--html') mode = 'html';
    if (a === '--range' && argv[i + 1]) {
      range = argv[++i];
      if (!RANGES[range]) range = '24h';
    }
    if (a === '--set-range' && argv[i + 1]) {
      setRange = argv[++i];
      if (!RANGES[setRange]) setRange = null;
    }
    if (a === '--out' && argv[i + 1]) out = argv[++i];
  }
  if (process.env.AGENTCONTROL_RANGE && RANGES[process.env.AGENTCONTROL_RANGE]) {
    range = process.env.AGENTCONTROL_RANGE;
  }
  if (setRange) {
    savePrefs({ ...prefs, range: setRange });
    range = setRange;
  }
  return { range, mode, out };
}

function loadJson(p) {
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return {};
  }
}

function formatCompact(n) {
  if (!Number.isFinite(n)) return '–';
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1e3).toFixed(1)}K`;
  return Math.round(n).toLocaleString('en-US');
}

function formatCost(dollars) {
  if (!Number.isFinite(dollars) || dollars <= 0) return '$0';
  if (dollars < 0.01) return `≈$${dollars.toFixed(3)}`;
  if (dollars < 10) return `≈$${dollars.toFixed(2)}`;
  return `≈$${dollars.toFixed(0)}`;
}

function estimateRowCost(variationKey, metrics) {
  return (
    estimateUsd({
      variationKey,
      inputTokens: metrics.inputTokens,
      outputTokens: metrics.outputTokens,
    }) ?? 0
  );
}

function emptyTotals() {
  return {
    generationCount: 0,
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    durationMs: 0,
    estCost: 0,
  };
}

function emptyJudge() {
  return { avg: null, count: 0 };
}

function aggregateAgent(agent, { from, to }) {
  const cfg = loadJson(agent.configPath);
  const configKey = cfg.aiConfigKey || agent.configKey;
  const userKey = cfg.hookUserEmail || undefined;
  const judged = agent.scoresPath
    ? aggregateScores(readScores(agent.scoresPath), { configKey, from, to })
    : { totals: emptyJudge(), byVariation: {} };

  const file = ledgerPath(agent.stateDir);
  if (!existsSync(file)) {
    return {
      id: agent.id,
      label: agent.label,
      configKey,
      totals: { ...emptyTotals(), judgeScore: judged.totals },
      models: [],
      present: false,
    };
  }
  const events = readUsageEvents(file);
  const data = aggregateUsageEvents(events, { userKey, configKey, from, to });
  const models = (data.byVariation ?? [])
    .map((row) => {
      const estCost = estimateRowCost(row.variationKey, row.metrics);
      return {
        variationKey: row.variationKey,
        metrics: row.metrics,
        estCost,
        judgeScore: judged.byVariation[row.variationKey] ?? emptyJudge(),
      };
    })
    .sort((a, b) => (b.metrics.generationCount || 0) - (a.metrics.generationCount || 0));

  const totalsCost = models.reduce((s, m) => s + (m.estCost || 0), 0);
  return {
    id: agent.id,
    label: agent.label,
    configKey,
    userKey: userKey || null,
    totals: { ...data.totals, estCost: totalsCost, judgeScore: judged.totals },
    models,
    present: true,
  };
}

function buildSlice(range, now = Date.now()) {
  const to = now;
  const from = to - RANGES[range];
  const agents = AGENTS.map((a) => aggregateAgent(a, { from, to }));
  const combined = emptyTotals();
  for (const a of agents) {
    combined.generationCount += a.totals.generationCount || 0;
    combined.totalTokens += a.totals.totalTokens || 0;
    combined.inputTokens += a.totals.inputTokens || 0;
    combined.outputTokens += a.totals.outputTokens || 0;
    combined.durationMs += a.totals.durationMs || 0;
    combined.estCost += a.totals.estCost || 0;
  }
  combined.judgeScore = mergeJudgeTotals(agents.map((a) => a.totals.judgeScore));
  return { range, from, to, combined, agents };
}

function buildPayload(defaultRange) {
  const now = Date.now();
  const byRange = {};
  for (const key of Object.keys(RANGES)) {
    byRange[key] = buildSlice(key, now);
  }
  return {
    defaultRange,
    updatedAt: now,
    byRange,
  };
}

function escapeSwiftBar(s) {
  return String(s).replace(/\|/g, '/');
}

function writeArtifacts(payload, jsonOut = JSON_PATH) {
  mkdirSync(STATE_DIR, { recursive: true });
  const html = renderMenubarPanelHtml(payload);
  writeFileSync(HTML_PATH, html);
  writeFileSync(jsonOut, `${JSON.stringify(payload, null, 2)}\n`);
  return { htmlPath: HTML_PATH, jsonPath: jsonOut };
}

function fileUrl(p) {
  return `file://${p.split(path.sep).map(encodeURIComponent).join('/')}`;
}

function emitSwiftBar(payload) {
  writeArtifacts(payload);
  const slice = payload.byRange[payload.defaultRange] || payload.byRange['24h'];
  const c = slice.combined;
  const title =
    c.generationCount > 0
      ? `${formatCompact(c.generationCount)} · ${formatCost(c.estCost)}`
      : 'AgentControl';
  const href = fileUrl(HTML_PATH);
  // Title click opens the Cursor-panel-style webview (not a nested text menu).
  console.log(
    `${escapeSwiftBar(title)} | sfimage=chart.bar href="${href}" webview=true webvieww=440 webviewh=560`,
  );
}

function emitJson(payload, outPath) {
  const { jsonPath } = writeArtifacts(payload, outPath);
  process.stderr.write(`wrote ${jsonPath}\n`);
  process.stderr.write(`wrote ${HTML_PATH}\n`);
  console.log(JSON.stringify(payload));
}

function emitHtml(payload) {
  writeArtifacts(payload);
  process.stderr.write(`wrote ${HTML_PATH}\n`);
  console.log(HTML_PATH);
}

const { range, mode, out } = parseArgs(process.argv.slice(2));
const payload = buildPayload(range);

if (mode === 'json') {
  emitJson(payload, out);
} else if (mode === 'html') {
  emitHtml(payload);
} else {
  emitSwiftBar(payload);
}
