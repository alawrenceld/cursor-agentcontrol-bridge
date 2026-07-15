'use strict';

const path = require('node:path');
const fs = require('node:fs');
const vscode = require('vscode');
const {
  RANGE_PRESETS,
  fetchAiConfigMetrics,
  fetchCostBasis,
  estimateCost,
  formatCompact,
  formatCost,
  formatDuration,
  totalCost,
} = require('./lib/ldMetrics');
const {
  USER_CONFIG_PATH,
  ensureHookRegistered,
  readUserConfig,
  upsertUserConfig,
  setupHealth,
} = require('./lib/hookInstall');
const { readScores, aggregateScores } = require('./lib/judgeScores');
const {
  DEFAULT_STATE_DIR,
  readUsageEvents,
  aggregateUsageEvents,
  ledgerPath,
} = require('./lib/usageLedger');

const TOKEN_SECRET_KEY = 'ldAgentControl.apiToken';
const RANGE_STATE_KEY = 'ldAgentControl.rangeKey';
const SCOPE_STATE_KEY = 'ldAgentControl.scopeKey';
const SCOPE_PRESETS = [
  { key: 'all', label: 'All' },
  { key: 'me', label: 'Me' },
];

/** Email used for Me filter + hook attribution. */
function resolveMeIdentity() {
  const cfg = readUserConfig();
  const email = (cfg?.hookUserEmail || cfg?.userEmails?.[0] || '').trim();
  return email;
}

function userStateDir() {
  const cfg = readUserConfig();
  return cfg?.stateDir || DEFAULT_STATE_DIR;
}

let pollTimer;

// LD-derived cost when the API reports it; ≈token-based estimate otherwise.
function costDisplay(metrics, estCost) {
  const derived = totalCost(metrics);
  if (derived > 0) return formatCost(derived);
  if (estCost > 0) return `≈${formatCost(estCost)}`;
  return formatCost(0);
}

function getConfig() {
  const cfg = vscode.workspace.getConfiguration('ldAgentControl');
  return {
    projectKey: cfg.get('projectKey'),
    configKey: cfg.get('configKey'),
    env: cfg.get('environmentKey'),
    pollSeconds: Math.max(15, cfg.get('pollSeconds') ?? 60),
  };
}

function configDefaults(context) {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(context.extensionPath, 'hook', 'config-defaults.json'), 'utf8'),
    );
  } catch {
    return {};
  }
}

/**
 * All-in-one setup: register the bundled hook in ~/.cursor/hooks.json and
 * make sure ~/.cursor/ld-agentcontrol.json exists. Safe to run every
 * activation — it repairs paths after extension upgrades and preserves any
 * foreign hooks.
 */
function ensureWritePath(context) {
  const bundledHook = path.join(context.extensionPath, 'hook', 'cursor-hook.js');
  if (!fs.existsSync(bundledHook)) return; // dev build without npm run build:hook
  let changed = false;
  try {
    changed = ensureHookRegistered(bundledHook);
    if (!readUserConfig()) upsertUserConfig(configDefaults(context));
  } catch (err) {
    vscode.window.showWarningMessage(`AgentControl: hook setup failed — ${err.message}`);
    return;
  }
  const health = setupHealth(bundledHook);
  if (changed) {
    vscode.window.showInformationMessage(
      'AgentControl: Cursor hook registered. Fully restart Cursor to start capturing agent runs.',
    );
  }
  // Older publisher builds (e.g. ttotenberg 0.3.x) also rewrite hooks.json on
  // activate — if both are installed, whoever activates last wins and Me ledger
  // never fills. Surface that clearly.
  try {
    const extDir = path.dirname(path.dirname(bundledHook));
    const siblingRoot = path.dirname(extDir);
    const conflicts = fs
      .readdirSync(siblingRoot)
      .filter(
        (name) =>
          /cursor-agentcontrol-metrics/i.test(name) &&
          !extDir.endsWith(name) &&
          fs.existsSync(path.join(siblingRoot, name, 'hook', 'cursor-hook.js')),
      );
    if (conflicts.length) {
      vscode.window.showWarningMessage(
        `AgentControl: also found older install(s) (${conflicts.join(', ')}). ` +
          'Uninstall them — they overwrite hooks.json and Me stays at 0.',
        'Open Extensions',
      ).then((pick) => {
        if (pick) vscode.commands.executeCommand('workbench.extensions.action.showInstalledExtensions');
      });
    }
  } catch {
    // ignore fs probe failures
  }
  if (!health.sdkKeyPresent) {
    vscode.window
      .showWarningMessage(
        'AgentControl: no LaunchDarkly SDK key configured — agent runs will not be recorded.',
        'Set SDK Key',
      )
      .then((pick) => {
        if (pick) vscode.commands.executeCommand('ldAgentControl.setSdkKey');
      });
  }
  if (!resolveMeIdentity()) {
    vscode.window
      .showInformationMessage(
        'AgentControl: set your email so Me filtering and LD attribution match your account.',
        'Set Email',
      )
      .then((pick) => {
        if (pick) vscode.commands.executeCommand('ldAgentControl.setIdentity');
      });
  }
}

function activate(context) {
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.name = 'AgentControl Metrics';
  context.subscriptions.push(statusBar);

  ensureWritePath(context);

  const state = {
    rangeKey: context.globalState.get(RANGE_STATE_KEY, '24h'),
    scopeKey: context.globalState.get(SCOPE_STATE_KEY, 'all'),
    meIdentity: resolveMeIdentity(),
    data: null,
    error: null,
    fetchedAt: null,
    loading: false,
    tokenMissing: false,
    identityMissing: false,
  };

  let webviewView = null;

  function pushToWebview() {
    webviewView?.webview.postMessage({
      type: 'state',
      presets: RANGE_PRESETS,
      scopes: SCOPE_PRESETS,
      rangeKey: state.rangeKey,
      scopeKey: state.scopeKey,
      meIdentity: state.meIdentity,
      data: state.data,
      error: state.error,
      fetchedAt: state.fetchedAt,
      loading: state.loading,
      tokenMissing: state.tokenMissing,
      identityMissing: state.identityMissing,
    });
  }

  function renderStatusBar() {
    if (state.scopeKey === 'all' && state.tokenMissing) {
      statusBar.text = '$(key) Set LD token';
      statusBar.tooltip = 'AgentControl: set a LaunchDarkly API token for the All (team) view';
      statusBar.command = 'ldAgentControl.setToken';
      statusBar.show();
      return;
    }
    if (state.scopeKey === 'me' && state.identityMissing) {
      statusBar.text = '$(mail) Set your email';
      statusBar.tooltip = 'AgentControl: set your email for the Me filter';
      statusBar.command = 'ldAgentControl.setIdentity';
      statusBar.show();
      return;
    }
    statusBar.command = 'ldAgentControl.metrics.focus';
    if (state.error && !state.data) {
      statusBar.text = '$(warning) AgentControl';
      statusBar.tooltip = state.error;
      statusBar.show();
      return;
    }
    if (!state.data) {
      statusBar.text = '$(sync~spin) AgentControl';
      statusBar.show();
      return;
    }
    const totals = state.data.totals;
    const scopeLabel = state.scopeKey === 'me' ? 'Me' : 'All';
    statusBar.text =
      `$(pulse) ${scopeLabel} · ${formatCompact(totals.generationCount)} gen · ` +
      `${formatCompact(totals.totalTokens)} tok · ${costDisplay(totals, totals.estCost)}`;
    const preset = RANGE_PRESETS.find((p) => p.key === state.rangeKey);
    const tooltip = new vscode.MarkdownString(undefined, true);
    tooltip.appendMarkdown(
      `**Cursor agent usage — ${scopeLabel} · ${preset.label.toLowerCase()}**\n\n`,
    );
    if (state.scopeKey === 'me') {
      tooltip.appendMarkdown(`Identity: \`${state.meIdentity}\` (local ledger)\n\n`);
    }
    tooltip.appendMarkdown('| Model | Gen | Tokens | Cost |\n|---|---|---|---|\n');
    for (const row of state.data.byVariation) {
      const m = row.metrics;
      tooltip.appendMarkdown(
        `| ${row.variationKey} | ${m.generationCount} ` +
          `| ${formatCompact(m.totalTokens)} | ${costDisplay(m, row.estCost)} |\n`,
      );
    }
    tooltip.appendMarkdown('\nClick for the full panel');
    tooltip.appendMarkdown('\n\n$(rocket) Powered by LaunchDarkly AI Config Monitoring');
    statusBar.tooltip = tooltip;
    statusBar.show();
  }

  function attachCostsAndJudge(data, costBasis, configKey) {
    for (const row of data.byVariation ?? []) {
      row.estCost = estimateCost(row.metrics, costBasis[row.variationKey]);
    }
    data.totals.estCost = (data.byVariation ?? []).reduce(
      (sum, row) => sum + (row.estCost ?? 0),
      0,
    );
    const judged = aggregateScores(readScores(), { configKey, from: data.from, to: data.to });
    for (const row of data.byVariation ?? []) {
      row.judgeScore = judged.byVariation[row.variationKey] ?? { avg: null, count: 0 };
    }
    data.totals.judgeScore = judged.totals;
  }

  async function refresh() {
    const token = await context.secrets.get(TOKEN_SECRET_KEY);
    state.tokenMissing = !token;
    state.meIdentity = resolveMeIdentity();
    state.identityMissing = state.scopeKey === 'me' && !state.meIdentity;

    if (state.scopeKey === 'all' && !token) {
      state.data = null;
      state.error = null;
      renderStatusBar();
      pushToWebview();
      return;
    }
    if (state.identityMissing) {
      state.data = null;
      state.error = null;
      renderStatusBar();
      pushToWebview();
      return;
    }

    const { projectKey, configKey, env } = getConfig();
    const preset = RANGE_PRESETS.find((p) => p.key === state.rangeKey) ?? RANGE_PRESETS[1];
    state.loading = true;
    pushToWebview();
    try {
      const to = Date.now();
      const from = to - preset.hours * 3600_000;
      let costBasis = {};
      if (token && projectKey) {
        costBasis = await fetchCostBasis({ token, projectKey, configKey }).catch(() => ({}));
      }

      let data;
      if (state.scopeKey === 'me') {
        const events = readUsageEvents(ledgerPath(userStateDir()));
        data = aggregateUsageEvents(events, {
          userKey: state.meIdentity,
          configKey,
          from,
          to,
        });
      } else {
        if (!projectKey) {
          throw new Error(
            'Set ldAgentControl.projectKey in Settings to your LaunchDarkly project.',
          );
        }
        data = await fetchAiConfigMetrics({
          token,
          projectKey,
          configKey,
          env,
          from,
          to,
        });
      }

      attachCostsAndJudge(data, costBasis, configKey);
      state.data = data;
      state.error = null;
      state.fetchedAt = Date.now();
    } catch (err) {
      state.error = err.message;
    } finally {
      state.loading = false;
    }
    renderStatusBar();
    pushToWebview();
  }

  function restartPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(refresh, getConfig().pollSeconds * 1000);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('ldAgentControl.refresh', refresh),
    vscode.commands.registerCommand('ldAgentControl.setToken', async () => {
      const token = await vscode.window.showInputBox({
        title: 'LaunchDarkly API token (reader role is enough)',
        password: true,
        ignoreFocusOut: true,
        placeHolder: 'api-...',
      });
      if (token) {
        await context.secrets.store(TOKEN_SECRET_KEY, token.trim());
        await refresh();
      }
    }),
    vscode.commands.registerCommand('ldAgentControl.setSdkKey', async () => {
      const sdkKey = await vscode.window.showInputBox({
        title: 'LaunchDarkly server-side SDK key (where agent-run events land)',
        password: true,
        ignoreFocusOut: true,
        placeHolder: 'sdk-...',
      });
      if (sdkKey) {
        upsertUserConfig(configDefaults(context), { sdkKey: sdkKey.trim() });
        vscode.window.showInformationMessage('AgentControl: SDK key saved to ld-agentcontrol.json');
      }
    }),
    vscode.commands.registerCommand('ldAgentControl.setIdentity', async () => {
      const current = resolveMeIdentity();
      const email = await vscode.window.showInputBox({
        title: 'Your email (Me filter + LaunchDarkly user context key)',
        ignoreFocusOut: true,
        value: current,
        placeHolder: 'you@example.com',
        validateInput: (v) =>
          v && v.includes('@') ? undefined : 'Enter an email address used for attribution',
      });
      if (email) {
        const trimmed = email.trim();
        upsertUserConfig(configDefaults(context), {
          hookUserEmail: trimmed,
          userEmails: [trimmed],
        });
        state.meIdentity = trimmed;
        vscode.window.showInformationMessage(`AgentControl: identity set to ${trimmed}`);
        await refresh();
      }
    }),
    vscode.commands.registerCommand('ldAgentControl.openHookConfig', async () => {
      upsertUserConfig(configDefaults(context));
      const doc = await vscode.workspace.openTextDocument(USER_CONFIG_PATH);
      vscode.window.showTextDocument(doc);
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('ldAgentControl')) {
        restartPolling();
        refresh();
      }
    }),
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('ldAgentControl.metrics', {
      resolveWebviewView(view) {
        webviewView = view;
        view.webview.options = { enableScripts: true };
        view.webview.html = getHtml(view.webview);
        view.webview.onDidReceiveMessage(async (msg) => {
          switch (msg.type) {
            case 'ready':
              pushToWebview();
              break;
            case 'setRange':
              state.rangeKey = msg.key;
              await context.globalState.update(RANGE_STATE_KEY, msg.key);
              refresh();
              break;
            case 'setScope':
              state.scopeKey = msg.key === 'me' ? 'me' : 'all';
              await context.globalState.update(SCOPE_STATE_KEY, state.scopeKey);
              refresh();
              break;
            case 'refresh':
              refresh();
              break;
            case 'setToken':
              vscode.commands.executeCommand('ldAgentControl.setToken');
              break;
            case 'setIdentity':
              vscode.commands.executeCommand('ldAgentControl.setIdentity');
              break;
            case 'openMonitoring': {
              const { projectKey, configKey, env } = getConfig();
              vscode.env.openExternal(
                vscode.Uri.parse(
                  `https://app.launchdarkly.com/projects/${projectKey}` +
                    `/ai-configs/${configKey}/monitoring?env=${env}`,
                ),
              );
              break;
            }
          }
        });
        view.onDidDispose(() => {
          if (webviewView === view) webviewView = null;
        });
      },
    }),
  );

  restartPolling();
  refresh();
}

function getHtml(webview) {
  const nonce = Buffer.from(String(Math.random())).toString('base64').slice(0, 16);
  const csp =
    `default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; ` +
    `script-src 'nonce-${nonce}';`;
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    background: transparent;
    font-size: 12px;
    padding: 8px 12px 16px;
  }
  .muted { color: var(--vscode-descriptionForeground); }
  /* Filter row: one row, above everything it scopes; date range first. */
  .filters { display: flex; gap: 4px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
  .filters button {
    font: inherit; cursor: pointer; padding: 2px 8px; border-radius: 3px;
    border: 1px solid var(--vscode-widget-border, transparent);
    background: var(--vscode-toolbar-hoverBackground, transparent);
    color: var(--vscode-foreground);
  }
  .filters button.selected {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-color: transparent;
  }
  .filters .spacer { flex: 1; }
  /* Stat tiles: label (sentence case) over semibold auto-compacted value. */
  .tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .tile {
    border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, transparent));
    border-radius: 4px; padding: 8px 10px;
    background: var(--vscode-editorWidget-background, transparent);
  }
  .tile .label { color: var(--vscode-descriptionForeground); margin-bottom: 2px; }
  .tile .value { font-size: 18px; font-weight: 600; font-variant-numeric: proportional-nums; }
  .tile .sub { color: var(--vscode-descriptionForeground); margin-top: 2px; }
  table { border-collapse: collapse; width: 100%; }
  th {
    text-align: left; font-weight: 600; color: var(--vscode-descriptionForeground);
    border-bottom: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, #8884));
    padding: 4px 6px 4px 0;
    cursor: pointer; user-select: none; white-space: nowrap;
  }
  th:hover { color: var(--vscode-foreground); }
  th.sorted { color: var(--vscode-foreground); }
  td { padding: 5px 6px 5px 0; vertical-align: top; font-variant-numeric: tabular-nums; }
  tr + tr td { border-top: 1px solid var(--vscode-widget-border, var(--vscode-panel-border, #8882)); }
  td .sub { display: block; color: var(--vscode-descriptionForeground); font-size: 11px; }
  tbody tr { cursor: pointer; }
  tbody tr:hover td { background: var(--vscode-list-hoverBackground); }
  tbody tr.sel td {
    background: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-list-activeSelectionForeground, var(--vscode-foreground));
  }
  tbody tr.sel td .sub { color: inherit; opacity: 0.75; }
  /* Best-in-column marker: a quiet wash + weight, not a status color. */
  td.best {
    background: color-mix(in srgb, var(--vscode-charts-green, #89d185) 14%, transparent);
    font-weight: 600;
  }
  tbody tr.sel td.best { background: color-mix(in srgb, var(--vscode-charts-green, #89d185) 28%, var(--vscode-list-activeSelectionBackground)); }
  .scope {
    display: flex; align-items: center; gap: 6px; margin: 0 0 8px;
    color: var(--vscode-descriptionForeground);
  }
  .scope .chip {
    background: var(--vscode-badge-background); color: var(--vscode-badge-foreground);
    border-radius: 8px; padding: 1px 8px; font-weight: 600;
  }
  .banner {
    color: var(--vscode-errorForeground); margin: 8px 0; white-space: pre-wrap;
    word-break: break-word;
  }
  .empty { margin: 16px 0; color: var(--vscode-descriptionForeground); }
  /* Refetch keeps the frame: previous render held at reduced opacity. */
  .stale { opacity: 0.55; transition: opacity 120ms; }
  .footer {
    margin-top: 10px; color: var(--vscode-descriptionForeground);
    display: flex; align-items: center; gap: 6px;
  }
  .footer .updated { margin-left: auto; }
  .brand { display: inline-flex; align-items: center; gap: 5px; text-decoration: none; }
  .brand svg { flex: none; }
  a { color: var(--vscode-textLink-foreground); cursor: pointer; }
</style>
</head>
<body>
  <div class="filters" id="filters"></div>
  <div id="content"><div class="empty">Loading…</div></div>
  <div class="footer">
    <a class="brand" id="brand" title="Open the Monitoring tab in LaunchDarkly">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13 2 L4 14 h6 l-1 8 9-12 h-6 z"/>
      </svg>
      Powered by LaunchDarkly
    </a>
    <span class="updated" id="updated"></span>
  </div>
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const compact = (n) => !isFinite(n) ? '–'
    : Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M'
    : Math.abs(n) >= 1e4 ? (n / 1e3).toFixed(1) + 'K'
    : n.toLocaleString('en-US');
  const cost = (d) => !isFinite(d) ? '–' : d === 0 ? '$0.00'
    : d < 0.01 ? '$' + d.toFixed(4) : '$' + d.toFixed(2);
  // Derived cost when LD reports it; ≈ estimate (tokens × catalog price) otherwise.
  const costDisp = (m, est) => tc(m) > 0 ? cost(tc(m)) : est > 0 ? '≈' + cost(est) : cost(0);
  const dur = (ms) => !isFinite(ms) || ms === 0 ? '–'
    : ms < 1000 ? Math.round(ms) + 'ms'
    : ms < 60000 ? (ms / 1000).toFixed(1) + 's' : (ms / 60000).toFixed(1) + 'm';
  const tc = (m) => (m.inputCost || 0) + (m.outputCost || 0);
  // Per-generation averages for the model list; totals stay in the tiles.
  const per = (total, gens) => gens > 0 && isFinite(total) ? total / gens : null;

  let lastState = null;
  let selectedKey = null;
  // Table sort: null sortKey = default (total tokens, descending).
  let sortKey = null;
  let sortDir = -1;

  // best: 'min'/'max' marks the winning cell per column (undefined = no winner).
  const COLUMNS = [
    { key: 'model', label: 'Model', value: (v) => v.variationKey },
    { key: 'gen', label: 'Gen', value: (v) => v.metrics.generationCount || 0 },
    { key: 'tokpg', label: 'Tok/gen', best: 'min', value: (v) => per(v.metrics.totalTokens, v.metrics.generationCount) },
    { key: 'costpg', label: '$/gen', best: 'min', value: (v) => per(tc(v.metrics) > 0 ? tc(v.metrics) : v.estCost ?? NaN, v.metrics.generationCount) },
    { key: 'score', label: 'Score', best: 'max', value: (v) => v.judgeScore?.avg ?? null },
    { key: 'durpg', label: 'Dur/gen', best: 'min', value: (v) => v.metrics.durationMs === 0 ? null : per(v.metrics.durationMs, v.metrics.generationCount) },
  ];

  // Winning value per column; null unless ≥2 models actually have data
  // (highlighting the only populated row would be noise).
  function bestValues(rows) {
    const bests = {};
    for (const col of COLUMNS) {
      if (!col.best) continue;
      const values = rows
        .map((r) => col.value(r))
        .filter((x) => typeof x === 'number' && isFinite(x));
      bests[col.key] =
        values.length >= 2 ? (col.best === 'max' ? Math.max(...values) : Math.min(...values)) : null;
    }
    return bests;
  }
  const isBest = (bests, key, value) =>
    bests[key] !== null && typeof value === 'number' && isFinite(value) &&
    Math.abs(value - bests[key]) < 1e-9;

  function sortRows(rows) {
    const col = COLUMNS.find((c) => c.key === sortKey);
    if (!col) return rows.sort((a, b) => b.metrics.totalTokens - a.metrics.totalTokens);
    return rows.sort((a, b) => {
      const av = col.value(a);
      const bv = col.value(b);
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * sortDir;
      }
      // Missing values (no gens / no duration) always sink to the bottom.
      const an = av === null || !isFinite(av) ? null : av;
      const bn = bv === null || !isFinite(bv) ? null : bv;
      if (an === null && bn === null) return 0;
      if (an === null) return 1;
      if (bn === null) return -1;
      return (an - bn) * sortDir;
    });
  }

  function tile(label, value, sub) {
    return '<div class="tile"><div class="label">' + esc(label) + '</div>' +
      '<div class="value">' + value + '</div>' +
      (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>';
  }

  function render(s) {
    lastState = s;
    const filters = document.getElementById('filters');
    const scopes = s.scopes || [{ key: 'all', label: 'All' }, { key: 'me', label: 'Me' }];
    filters.innerHTML =
      scopes.map((p) =>
        '<button data-scope="' + esc(p.key) + '"' +
        (p.key === s.scopeKey ? ' class="selected"' : '') + '>' + esc(p.label) + '</button>'
      ).join('') +
      '<span class="muted" style="margin:0 4px">|</span>' +
      s.presets.map((p) =>
        '<button data-key="' + esc(p.key) + '"' +
        (p.key === s.rangeKey ? ' class="selected"' : '') + '>' + esc(p.label) + '</button>'
      ).join('') +
      '<span class="spacer"></span><button data-act="refresh" title="Refresh">↻</button>';
    filters.querySelectorAll('button[data-scope]').forEach((b) =>
      b.addEventListener('click', () => vscode.postMessage({ type: 'setScope', key: b.dataset.scope })));
    filters.querySelectorAll('button[data-key]').forEach((b) =>
      b.addEventListener('click', () => vscode.postMessage({ type: 'setRange', key: b.dataset.key })));
    filters.querySelector('[data-act=refresh]')
      .addEventListener('click', () => vscode.postMessage({ type: 'refresh' }));

    const content = document.getElementById('content');
    content.classList.toggle('stale', s.loading);

    if (s.scopeKey === 'all' && s.tokenMissing) {
      content.innerHTML = '<div class="empty">No LaunchDarkly API token configured for the All view. ' +
        '<a id="set-token">Set token</a> — or switch to <strong>Me</strong> (local ledger).</div>';
      document.getElementById('set-token')
        .addEventListener('click', () => vscode.postMessage({ type: 'setToken' }));
      document.getElementById('updated').textContent = '';
      return;
    }

    if (s.identityMissing) {
      content.innerHTML = '<div class="empty">Set your email to use the Me filter. ' +
        '<a id="set-identity">Set email</a></div>';
      document.getElementById('set-identity')
        .addEventListener('click', () => vscode.postMessage({ type: 'setIdentity' }));
      document.getElementById('updated').textContent = '';
      return;
    }

    let html = '';
    if (s.error) html += '<div class="banner">' + esc(s.error) + '</div>';

    if (s.data) {
      const rows = sortRows((s.data.byVariation || []).slice());

      // Selection scopes the tiles to one model; the list keeps averages.
      const selected = rows.find((v) => v.variationKey === selectedKey) ?? null;
      if (selectedKey && !selected) selectedKey = null;
      const t = selected
        ? { ...selected.metrics, estCost: selected.estCost, judgeScore: selected.judgeScore }
        : s.data.totals;

      const scopeHint = s.scopeKey === 'me'
        ? 'Me · ' + esc(s.meIdentity || '') + ' · local ledger'
        : 'All · team (LaunchDarkly Monitoring)';
      html += '<div class="scope">' + (selected
        ? 'Totals for <span class="chip">' + esc(selected.variationKey) + '</span>' +
          '<a id="clear-scope">show all</a>'
        : 'Totals · ' + scopeHint) + '</div>';
      if (s.scopeKey === 'me' && (t.totalTokens || 0) === 0 && (t.generationCount || 0) > 0) {
        html += '<div class="muted" style="margin:0 0 8px">Tokens for Me only appear when this machine wrote token events to the local ledger (shared pollers do not).</div>';
      }

      html += '<div class="tiles">' +
        tile('Generations', compact(t.generationCount)) +
        tile('Tokens', compact(t.totalTokens),
          compact(t.inputTokens) + ' in · ' + compact(t.outputTokens) + ' out') +
        tile('Cost', costDisp(t, t.estCost),
          tc(t) > 0
            ? cost(t.inputCost || 0) + ' in · ' + cost(t.outputCost || 0) + ' out'
            : t.estCost > 0 ? 'estimated from tokens × catalog price' : 'no priced usage') +
        tile('Duration', dur(t.durationMs), 'total wall clock') +
        tile('Quality',
          t.judgeScore?.avg === null || t.judgeScore === undefined
            ? '–' : t.judgeScore.avg.toFixed(2),
          t.judgeScore?.count > 0
            ? t.judgeScore.count + ' judged · avg 0–1 · local'
            : 'no judged runs in range') +
        '</div>';

      if (rows.length === 0) {
        html += '<div class="empty">No agent runs in this range.</div>';
      } else {
        html += '<table><thead><tr>' + COLUMNS.map((c) =>
          '<th data-sort="' + c.key + '"' + (c.key === sortKey ? ' class="sorted"' : '') + '>' +
          esc(c.label) + (c.key === sortKey ? (sortDir === 1 ? ' ▲' : ' ▼') : '') + '</th>'
        ).join('') + '</tr></thead><tbody>' +
          (() => {
            const bests = bestValues(rows);
            const bestTd = (key, value) => '<td' + (isBest(bests, key, value) ? ' class="best"' : '') + '>';
            return rows.map((v) => {
              const m = v.metrics;
              const gens = m.generationCount || 0;
              const tokVal = per(m.totalTokens, gens);
              const costVal = per(tc(m) > 0 ? tc(m) : v.estCost ?? NaN, gens);
              const scoreVal = v.judgeScore?.avg ?? null;
              const durVal = m.durationMs === 0 ? null : per(m.durationMs, gens);
              return '<tr data-key="' + esc(v.variationKey) + '"' +
                (v.variationKey === selectedKey ? ' class="sel"' : '') + '>' +
                '<td>' + esc(v.variationKey) + '</td>' +
                '<td>' + compact(gens) + '</td>' +
                bestTd('tokpg', tokVal) + (tokVal === null ? '–' : compact(Math.round(tokVal))) + '</td>' +
                bestTd('costpg', costVal) + (costVal === null || !isFinite(costVal) ? '–' : (tc(m) > 0 ? '' : '≈') + cost(costVal)) + '</td>' +
                bestTd('score', scoreVal) + (scoreVal == null ? '–'
                  : scoreVal.toFixed(2) + '<span class="sub">n=' + v.judgeScore.count + '</span>') + '</td>' +
                bestTd('durpg', durVal) + (durVal === null ? '–' : dur(durVal)) + '</td></tr>';
            }).join('');
          })() + '</tbody></table>';
      }
    } else if (!s.error) {
      html += '<div class="empty">Loading…</div>';
    }
    content.innerHTML = html;

    document.getElementById('clear-scope')?.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedKey = null;
      render(lastState);
    });
    content.querySelectorAll('tbody tr[data-key]').forEach((row) =>
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = row.dataset.key;
        selectedKey = key === selectedKey ? null : key;
        render(lastState);
      }));
    content.querySelectorAll('th[data-sort]').forEach((th) =>
      th.addEventListener('click', (e) => {
        e.stopPropagation(); // sorting shouldn't clear the model selection
        const key = th.dataset.sort;
        if (sortKey === key) {
          sortDir = -sortDir;
        } else {
          sortKey = key;
          sortDir = key === 'model' ? 1 : -1; // names A→Z, numbers big-first
        }
        render(lastState);
      }));

    document.getElementById('updated').textContent = s.fetchedAt
      ? 'Updated ' + new Date(s.fetchedAt).toLocaleTimeString()
      : '';
  }

  document.getElementById('brand')
    .addEventListener('click', () => vscode.postMessage({ type: 'openMonitoring' }));

  window.addEventListener('message', (e) => {
    if (e.data.type === 'state') render(e.data);
  });
  // Clicking anywhere outside the model list clears the selection.
  document.addEventListener('click', (e) => {
    if (selectedKey && !e.target.closest('tbody tr') && lastState) {
      selectedKey = null;
      render(lastState);
    }
  });
  vscode.postMessage({ type: 'ready' });
</script>
</body>
</html>`;
}

function deactivate() {
  clearInterval(pollTimer);
}

module.exports = { activate, deactivate };
