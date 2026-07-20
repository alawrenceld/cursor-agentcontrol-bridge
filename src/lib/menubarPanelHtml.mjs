// Cursor-panel-style HTML for the SwiftBar webview popover.

/**
 * @param {object} payload
 * @param {string} payload.defaultRange
 * @param {number} payload.updatedAt
 * @param {Record<string, object>} payload.byRange  // rangeKey → snapshot slice { combined, agents }
 */
export function renderMenubarPanelHtml(payload) {
  const dataJson = JSON.stringify(payload).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Agent Usage · LaunchDarkly</title>
<style>
  :root {
    color-scheme: dark;
    --bg: #1a1b1e;
    --fg: #e8e8ea;
    --muted: #9a9aa3;
    --border: #2e2f36;
    --tile: #222328;
    --btn: #2a2b32;
    --btn-sel: #2f6fed;
    --btn-sel-fg: #fff;
    --hover: #2c2d35;
    --best: color-mix(in srgb, #89d185 16%, transparent);
    --link: #6cb6ff;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    background: var(--bg); color: var(--fg);
    font: 12px/1.35 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  body { padding: 12px 14px 14px; min-height: 100vh; }
  h1 {
    margin: 0 0 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--fg);
  }
  .filters { display: flex; gap: 4px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
  .filters button {
    font: inherit; cursor: pointer; padding: 3px 9px; border-radius: 4px;
    border: 1px solid var(--border); background: var(--btn); color: var(--fg);
  }
  .filters button.selected {
    background: var(--btn-sel); color: var(--btn-sel-fg); border-color: transparent;
  }
  .filters .sep { color: var(--muted); margin: 0 2px; }
  .filters .spacer { flex: 1; min-width: 8px; }
  .scope { color: var(--muted); margin: 0 0 8px; }
  .scope .chip {
    display: inline-block; background: #3a3b45; color: var(--fg);
    border-radius: 8px; padding: 1px 8px; font-weight: 600; margin: 0 4px;
  }
  .tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
  .tile {
    border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px;
    background: var(--tile);
  }
  .tile .label { color: var(--muted); margin-bottom: 2px; font-size: 11px; }
  .tile .value { font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .tile .sub { color: var(--muted); margin-top: 2px; font-size: 11px; }
  table { border-collapse: collapse; width: 100%; }
  th {
    text-align: left; font-weight: 600; color: var(--muted);
    border-bottom: 1px solid var(--border); padding: 4px 6px 4px 0;
    cursor: pointer; user-select: none; white-space: nowrap;
  }
  th:hover, th.sorted { color: var(--fg); }
  td { padding: 5px 6px 5px 0; vertical-align: top; font-variant-numeric: tabular-nums; }
  tr + tr td { border-top: 1px solid #2a2b31; }
  td .sub { display: block; color: var(--muted); font-size: 11px; }
  tbody tr { cursor: pointer; }
  tbody tr:hover td { background: var(--hover); }
  tbody tr.sel td { background: #2a3f6e; }
  td.best { background: var(--best); font-weight: 600; }
  .empty { margin: 16px 0; color: var(--muted); }
  .footer {
    margin-top: 12px; color: var(--muted);
    display: flex; align-items: center; gap: 6px; font-size: 11px;
  }
  .footer .updated { margin-left: auto; }
  .brand { display: inline-flex; align-items: center; gap: 5px; color: var(--muted); text-decoration: none; }
  .brand svg { color: var(--btn-sel); }
  a.clear { color: var(--link); cursor: pointer; margin-left: 6px; }
</style>
</head>
<body>
  <h1>Agent Usage · LaunchDarkly</h1>
  <div class="filters" id="filters"></div>
  <div id="content"><div class="empty">Loading…</div></div>
  <div class="footer">
    <span class="brand">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13 2 L4 14 h6 l-1 8 9-12 h-6 z"/>
      </svg>
      Powered by LaunchDarkly
    </span>
    <span class="updated" id="updated"></span>
  </div>
<script>
const DATA = ${dataJson};
const RANGE_LABELS = { '1h': 'Last hour', '24h': 'Last 24 hours', '7d': 'Last 7 days', '30d': 'Last 30 days' };
const AGENT_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'cursor', label: 'Cursor' },
  { key: 'claude-code', label: 'Claude Code' },
  { key: 'copilot', label: 'Copilot' },
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const compact = (n) => !isFinite(n) ? '–'
  : Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + 'M'
  : Math.abs(n) >= 1e4 ? (n / 1e3).toFixed(1) + 'K'
  : Math.round(n).toLocaleString('en-US');
const cost = (d) => !isFinite(d) || d <= 0 ? '$0'
  : d < 0.01 ? '≈$' + d.toFixed(3)
  : d < 10 ? '≈$' + d.toFixed(2)
  : '≈$' + d.toFixed(0);
const dur = (ms) => !isFinite(ms) || ms <= 0 ? '–'
  : ms < 1000 ? Math.round(ms) + 'ms'
  : ms < 60000 ? (ms / 1000).toFixed(1) + 's'
  : ms < 3600000 ? (ms / 60000).toFixed(1) + 'm'
  : (ms / 3600000).toFixed(1) + 'h';
const per = (total, gens) => gens > 0 && isFinite(total) ? total / gens : null;

let rangeKey = DATA.defaultRange || '24h';
let agentKey = 'all';
let selectedKey = null;
let sortKey = null;
let sortDir = -1;

try {
  const saved = JSON.parse(localStorage.getItem('agentcontrol-menubar') || '{}');
  if (DATA.byRange[saved.range]) rangeKey = saved.range;
  if (AGENT_FILTERS.some((a) => a.key === saved.agent)) agentKey = saved.agent;
} catch {}

function persist() {
  try { localStorage.setItem('agentcontrol-menubar', JSON.stringify({ range: rangeKey, agent: agentKey })); } catch {}
}

function emptyTotals() {
  return { generationCount: 0, totalTokens: 0, inputTokens: 0, outputTokens: 0, durationMs: 0, estCost: 0, judgeScore: { avg: null, count: 0 } };
}

function viewModel() {
  const slice = DATA.byRange[rangeKey];
  if (!slice) return { totals: emptyTotals(), rows: [], hint: 'No data' };
  const agents = slice.agents || [];
  if (agentKey === 'all') {
    const rows = [];
    for (const a of agents) {
      for (const m of a.models || []) {
        rows.push({
          rowKey: a.id + '/' + m.variationKey,
          variationKey: m.variationKey,
          agentId: a.id,
          agentLabel: a.label,
          metrics: m.metrics,
          estCost: m.estCost || 0,
          judgeScore: m.judgeScore || { avg: null, count: 0 },
        });
      }
    }
    return {
      totals: slice.combined || emptyTotals(),
      rows,
      hint: 'Totals · All agents · local ledgers',
    };
  }
  const agent = agents.find((a) => a.id === agentKey);
  if (!agent || !agent.present) {
    return { totals: emptyTotals(), rows: [], hint: (agent?.label || agentKey) + ' · no ledger yet' };
  }
  const rows = (agent.models || []).map((m) => ({
    rowKey: agent.id + '/' + m.variationKey,
    variationKey: m.variationKey,
    agentId: agent.id,
    agentLabel: agent.label,
    metrics: m.metrics,
    estCost: m.estCost || 0,
    judgeScore: m.judgeScore || { avg: null, count: 0 },
  }));
  return {
    totals: agent.totals || emptyTotals(),
    rows,
    hint: 'Totals · ' + agent.label + ' · local ledger',
  };
}

const COLUMNS = [
  { key: 'model', label: 'Model', value: (v) => v.variationKey },
  { key: 'agent', label: 'Agent', value: (v) => v.agentLabel, allOnly: true },
  { key: 'gen', label: 'Gen', value: (v) => v.metrics.generationCount || 0 },
  { key: 'tokpg', label: 'Tok/gen', best: 'min', value: (v) => per(v.metrics.totalTokens, v.metrics.generationCount) },
  { key: 'costpg', label: '$/gen', best: 'min', value: (v) => per(v.estCost ?? NaN, v.metrics.generationCount) },
  { key: 'score', label: 'Score', best: 'max', value: (v) => v.judgeScore?.avg ?? null },
  { key: 'durpg', label: 'Dur/gen', best: 'min', value: (v) => v.metrics.durationMs === 0 ? null : per(v.metrics.durationMs, v.metrics.generationCount) },
];

function activeColumns() {
  return COLUMNS.filter((c) => !c.allOnly || agentKey === 'all');
}

function bestValues(rows, cols) {
  const bests = {};
  for (const col of cols) {
    if (!col.best) continue;
    const values = rows.map((r) => col.value(r)).filter((x) => typeof x === 'number' && isFinite(x));
    bests[col.key] = values.length >= 2
      ? (col.best === 'max' ? Math.max(...values) : Math.min(...values))
      : null;
  }
  return bests;
}
const isBest = (bests, key, value) =>
  bests[key] !== null && typeof value === 'number' && isFinite(value) &&
  Math.abs(value - bests[key]) < 1e-9;

function sortRows(rows, cols) {
  const col = cols.find((c) => c.key === sortKey);
  if (!col) return rows.slice().sort((a, b) => (b.metrics.totalTokens || 0) - (a.metrics.totalTokens || 0));
  return rows.slice().sort((a, b) => {
    const av = col.value(a);
    const bv = col.value(b);
    if (typeof av === 'string' || typeof bv === 'string') {
      return String(av).localeCompare(String(bv)) * sortDir;
    }
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

function render() {
  persist();
  const filters = document.getElementById('filters');
  filters.innerHTML =
    AGENT_FILTERS.map((p) =>
      '<button data-agent="' + p.key + '"' + (p.key === agentKey ? ' class="selected"' : '') + '>' +
      esc(p.label) + '</button>'
    ).join('') +
    '<span class="sep">|</span>' +
    Object.keys(RANGE_LABELS).map((k) =>
      '<button data-range="' + k + '"' + (k === rangeKey ? ' class="selected"' : '') + '>' +
      esc(RANGE_LABELS[k]) + '</button>'
    ).join('') +
    '<span class="spacer"></span>' +
    '<button data-act="refresh" title="Refresh">↻</button>';

  filters.querySelectorAll('button[data-agent]').forEach((b) =>
    b.addEventListener('click', () => { agentKey = b.dataset.agent; selectedKey = null; render(); }));
  filters.querySelectorAll('button[data-range]').forEach((b) =>
    b.addEventListener('click', () => { rangeKey = b.dataset.range; selectedKey = null; render(); }));
  filters.querySelector('[data-act=refresh]')?.addEventListener('click', () => {
    location.href = 'swiftbar://refreshall';
  });

  const { totals: baseTotals, rows: rawRows, hint } = viewModel();
  const cols = activeColumns();
  const rows = sortRows(rawRows, cols);
  const selected = rows.find((r) => r.rowKey === selectedKey) || null;
  if (selectedKey && !selected) selectedKey = null;
  const t = selected
    ? { ...selected.metrics, estCost: selected.estCost, judgeScore: selected.judgeScore }
    : baseTotals;

  let html = '<div class="scope">' + (selected
    ? 'Totals for <span class="chip">' + esc(selected.variationKey) + '</span>' +
      '<a class="clear" id="clear-scope">show all</a>'
    : esc(hint)) + '</div>';

  const js = t.judgeScore || { avg: null, count: 0 };
  html += '<div class="tiles">' +
    tile('Generations', compact(t.generationCount)) +
    tile('Tokens', compact(t.totalTokens),
      compact(t.inputTokens) + ' in · ' + compact(t.outputTokens) + ' out') +
    tile('Cost', cost(t.estCost),
      t.estCost > 0 ? 'estimated from tokens × catalog price' : 'no priced usage') +
    tile('Duration', dur(t.durationMs), 'total wall clock') +
    tile('Quality',
      js.avg == null ? '–' : js.avg.toFixed(2),
      js.count > 0
        ? js.count + ' judged · avg 0–1 · local'
        : 'no judged runs in range') +
    '</div>';

  if (rows.length === 0) {
    html += '<div class="empty">No agent runs in this range.</div>';
  } else {
    const bests = bestValues(rows, cols);
    html += '<table><thead><tr>' + cols.map((c) =>
      '<th data-sort="' + c.key + '"' + (c.key === sortKey ? ' class="sorted"' : '') + '>' +
      esc(c.label) + (c.key === sortKey ? (sortDir === 1 ? ' ▲' : ' ▼') : '') + '</th>'
    ).join('') + '</tr></thead><tbody>';
    html += rows.map((v) => {
      const m = v.metrics;
      const gens = m.generationCount || 0;
      const tokVal = per(m.totalTokens, gens);
      const costVal = per(v.estCost ?? NaN, gens);
      const scoreVal = v.judgeScore?.avg ?? null;
      const durVal = m.durationMs === 0 ? null : per(m.durationMs, gens);
      const cells = {
        model: esc(v.variationKey),
        agent: esc(v.agentLabel),
        gen: compact(gens),
        tokpg: tokVal === null ? '–' : compact(Math.round(tokVal)),
        costpg: costVal === null || !isFinite(costVal) ? '–' : cost(costVal),
        score: scoreVal == null ? '–'
          : scoreVal.toFixed(2) + '<span class="sub">n=' + (v.judgeScore.count || 0) + '</span>',
        durpg: durVal === null ? '–' : dur(durVal),
      };
      const vals = { tokpg: tokVal, costpg: costVal, score: scoreVal, durpg: durVal };
      return '<tr data-key="' + esc(v.rowKey) + '"' + (v.rowKey === selectedKey ? ' class="sel"' : '') + '>' +
        cols.map((c) => {
          const bestable = c.best && vals[c.key] !== undefined;
          return '<td' + (bestable && isBest(bests, c.key, vals[c.key]) ? ' class="best"' : '') + '>' +
            cells[c.key] + '</td>';
        }).join('') + '</tr>';
    }).join('');
    html += '</tbody></table>';
  }

  document.getElementById('content').innerHTML = html;
  document.getElementById('updated').textContent = DATA.updatedAt
    ? 'Updated ' + new Date(DATA.updatedAt).toLocaleTimeString()
    : '';

  document.getElementById('clear-scope')?.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedKey = null;
    render();
  });
  document.querySelectorAll('tbody tr[data-key]').forEach((row) =>
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedKey = row.dataset.key === selectedKey ? null : row.dataset.key;
      render();
    }));
  document.querySelectorAll('th[data-sort]').forEach((th) =>
    th.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = th.dataset.sort;
      if (sortKey === key) sortDir = -sortDir;
      else { sortKey = key; sortDir = key === 'model' || key === 'agent' ? 1 : -1; }
      render();
    }));
}

render();
</script>
</body>
</html>`;
}
