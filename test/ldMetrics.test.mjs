// Extension metrics client tests. Response shapes mirror what the live beta
// API returned on 2026-07-06 (verified by hand against cursor-monitoring).

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  metricsUrl,
  fetchAiConfigMetrics,
  formatCompact,
  formatCost,
  formatDuration,
  successRate,
  formatRate,
  totalCost,
} = require('../extension/lib/ldMetrics.js');

const LIVE_TOTALS = {
  durationMs: 0,
  generationCount: 1,
  generationErrorCount: 0,
  generationSuccessCount: 1,
  inputCost: 0,
  inputTokens: 83905,
  outputCost: 0,
  outputTokens: 5791,
  thumbsDown: 0,
  thumbsUp: 0,
  timeToFirstTokenMs: 0,
  totalTokens: 146976,
};

test('metricsUrl builds the beta endpoint with escaping', () => {
  const url = metricsUrl({
    projectKey: 'cursor-monitoring',
    configKey: 'cursor-ide-usage',
    path: 'metrics-by-variation',
    env: 'production',
    from: 1000,
    to: 2000,
  });
  assert.equal(
    url,
    'https://app.launchdarkly.com/api/v2/projects/cursor-monitoring' +
      '/ai-configs/cursor-ide-usage/metrics-by-variation?from=1000&to=2000&env=production',
  );
});

test('fetchAiConfigMetrics hits both endpoints with beta header', async () => {
  const seen = [];
  const fetchImpl = async (url, { headers }) => {
    seen.push({ url, headers });
    return {
      ok: true,
      json: async () =>
        url.includes('metrics-by-variation')
          ? [{ variationKey: 'composer-2-5-fast', metrics: LIVE_TOTALS }]
          : LIVE_TOTALS,
    };
  };
  const result = await fetchAiConfigMetrics({
    token: 'api-x',
    projectKey: 'p',
    configKey: 'c',
    env: 'production',
    from: 1,
    to: 2,
    fetchImpl,
  });
  assert.equal(seen.length, 2);
  for (const call of seen) {
    assert.equal(call.headers['LD-API-Version'], 'beta');
    assert.equal(call.headers.Authorization, 'api-x');
  }
  assert.equal(result.totals.totalTokens, 146976);
  assert.equal(result.byVariation[0].variationKey, 'composer-2-5-fast');
});

test('fetchAiConfigMetrics surfaces auth failures with a hint', async () => {
  const fetchImpl = async () => ({ ok: false, status: 401, text: async () => 'Unauthorized' });
  await assert.rejects(
    fetchAiConfigMetrics({ token: 'bad', projectKey: 'p', configKey: 'c', env: 'e', from: 1, to: 2, fetchImpl }),
    /401.*check the API token/,
  );
});

test('fetchCostBasis maps variations to their linked model pricing', async () => {
  const { fetchCostBasis, estimateCost } = require('../extension/lib/ldMetrics.js');
  const fetchImpl = async (url) => ({
    ok: true,
    json: async () =>
      url.endsWith('/model-configs')
        ? [
            { key: 'Cursor.gpt-5', costPerInputToken: 1.25e-6, costPerOutputToken: 1e-5 },
            { key: 'Cursor.unpriced' },
          ]
        : {
            variations: [
              { key: 'gpt-5', modelConfigKey: 'Cursor.gpt-5' },
              { key: 'auto' },
              { key: 'other', modelConfigKey: 'Cursor.unpriced' },
            ],
          },
  });
  const basis = await fetchCostBasis({ token: 't', projectKey: 'p', configKey: 'c', fetchImpl });
  assert.deepEqual(Object.keys(basis), ['gpt-5']);
  // 100K in + 10K out at $1.25/$10 per M = $0.125 + $0.10
  assert.equal(
    estimateCost({ inputTokens: 100000, outputTokens: 10000 }, basis['gpt-5']).toFixed(4),
    '0.2250',
  );
  assert.equal(estimateCost({ inputTokens: 5 }, undefined), null);
});

test('formatters', () => {
  assert.equal(formatCompact(1284), '1,284');
  assert.equal(formatCompact(146976), '147.0K');
  assert.equal(formatCompact(4_200_000), '4.2M');
  assert.equal(formatCost(0), '$0.00');
  assert.equal(formatCost(0.0042), '$0.0042');
  assert.equal(formatCost(1.5), '$1.50');
  assert.equal(formatDuration(0), '–');
  assert.equal(formatDuration(850), '850ms');
  assert.equal(formatDuration(12_500), '12.5s');
  assert.equal(totalCost(LIVE_TOTALS), 0);
  assert.equal(formatRate(successRate(LIVE_TOTALS)), '100%');
  assert.equal(successRate({ generationSuccessCount: 0, generationErrorCount: 0 }), null);
  assert.equal(formatRate(null), '–');
});
