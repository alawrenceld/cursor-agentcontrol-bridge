// Pure metrics client + formatters (no vscode imports so it's unit-testable).
// Talks to LaunchDarkly's beta AI Configs metrics endpoints — the same data
// that backs the AI Config Monitoring tab.

'use strict';

const API_BASE = 'https://app.launchdarkly.com/api/v2';

const RANGE_PRESETS = [
  { key: '1h', label: 'Last hour', hours: 1 },
  { key: '24h', label: 'Last 24 hours', hours: 24 },
  { key: '7d', label: 'Last 7 days', hours: 24 * 7 },
  { key: '30d', label: 'Last 30 days', hours: 24 * 30 },
];

function metricsUrl({ projectKey, configKey, path, env, from, to }) {
  return (
    `${API_BASE}/projects/${encodeURIComponent(projectKey)}` +
    `/ai-configs/${encodeURIComponent(configKey)}/${path}` +
    `?from=${from}&to=${to}&env=${encodeURIComponent(env)}`
  );
}

/**
 * Fetch totals plus per-variation breakdown for the given window.
 * Returns { totals, byVariation, from, to }; throws with a readable message
 * on auth/HTTP failures so the UI can surface it verbatim.
 */
async function fetchAiConfigMetrics({
  token,
  projectKey,
  configKey,
  env,
  from,
  to,
  fetchImpl = fetch,
}) {
  const headers = { Authorization: token, 'LD-API-Version': 'beta' };
  const get = async (path) => {
    const response = await fetchImpl(
      metricsUrl({ projectKey, configKey, path, env, from, to }),
      { headers },
    );
    if (!response.ok) {
      const body = await response.text();
      const hint =
        response.status === 401 || response.status === 403
          ? ' (check the API token — needs reader access and the beta API)'
          : '';
      throw new Error(`LaunchDarkly ${response.status} on ${path}${hint}: ${body.slice(0, 200)}`);
    }
    return response.json();
  };

  const [totals, byVariation] = await Promise.all([
    get('metrics'),
    get('metrics-by-variation'),
  ]);
  return { totals, byVariation, from, to };
}

/** Auto-compact figures per the stat-tile contract: 1,284 / 12.9K / 4.2M. */
function formatCompact(n) {
  if (!Number.isFinite(n)) return '–';
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString('en-US');
}

/** Costs from the API are dollars; keep sub-cent precision visible. */
function formatCost(dollars) {
  if (!Number.isFinite(dollars)) return '–';
  if (dollars === 0) return '$0.00';
  if (dollars < 0.01) return `$${dollars.toFixed(4)}`;
  return `$${dollars.toFixed(2)}`;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms === 0) return '–';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

/** Success rate over completed generations; null when there are none. */
function successRate({ generationSuccessCount = 0, generationErrorCount = 0 } = {}) {
  const total = generationSuccessCount + generationErrorCount;
  return total === 0 ? null : generationSuccessCount / total;
}

function formatRate(rate) {
  return rate === null ? '–' : `${Math.round(rate * 100)}%`;
}

function totalCost(metrics = {}) {
  return (metrics.inputCost ?? 0) + (metrics.outputCost ?? 0);
}

/**
 * Fetch the cost basis for estimates: each variation's linked model pricing.
 * The beta metrics API returns inputCost/outputCost = 0 even for events the
 * LD UI prices (the UI joins (variation, version) → model config at query
 * time; the API doesn't). Until that's fixed we estimate client-side from
 * tokens × the catalog's per-token prices.
 */
async function fetchCostBasis({ token, projectKey, configKey, fetchImpl = fetch }) {
  const headers = { Authorization: token, 'LD-API-Version': 'beta' };
  const base = `${API_BASE}/projects/${encodeURIComponent(projectKey)}/ai-configs`;
  const [configRes, modelsRes] = await Promise.all([
    fetchImpl(`${base}/${encodeURIComponent(configKey)}`, { headers }),
    fetchImpl(`${base}/model-configs`, { headers }),
  ]);
  if (!configRes.ok || !modelsRes.ok) return {}; // estimates are best-effort
  const config = await configRes.json();
  const models = await modelsRes.json();
  const items = Array.isArray(models) ? models : models.items ?? [];
  const pricingByModelKey = new Map(
    items.map((m) => [m.key, { in: m.costPerInputToken ?? 0, out: m.costPerOutputToken ?? 0 }]),
  );
  const basis = {};
  for (const variation of config.variations ?? []) {
    const pricing = pricingByModelKey.get(variation.modelConfigKey);
    if (pricing && (pricing.in > 0 || pricing.out > 0)) basis[variation.key] = pricing;
  }
  return basis;
}

/**
 * Estimated dollars for one variation's metrics given its per-token pricing.
 * Returns null when no basis exists (unlinked variation, e.g. `auto`).
 */
function estimateCost(metrics = {}, pricing) {
  if (!pricing) return null;
  return (metrics.inputTokens ?? 0) * pricing.in + (metrics.outputTokens ?? 0) * pricing.out;
}

module.exports = {
  API_BASE,
  RANGE_PRESETS,
  metricsUrl,
  fetchAiConfigMetrics,
  fetchCostBasis,
  estimateCost,
  formatCompact,
  formatCost,
  formatDuration,
  successRate,
  formatRate,
  totalCost,
};
