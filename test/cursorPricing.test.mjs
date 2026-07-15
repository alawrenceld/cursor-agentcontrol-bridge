import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateUsd, perTokenPricing, PRICING_PER_M } from '../src/lib/cursorPricing.mjs';

test('perTokenPricing matches sync:models costPer*Token = $/M / 1e6', () => {
  const rates = perTokenPricing('claude-4-5-sonnet');
  assert.equal(rates.in, 3 / 1e6);
  assert.equal(rates.out, 15 / 1e6);
  assert.equal(PRICING_PER_M['claude-4-5-sonnet'].in, 3);
  assert.equal(PRICING_PER_M['claude-4-5-sonnet'].out, 15);
});

test('estimateUsd matches plugin estimateCost math', () => {
  // 1M input + 100k output at $3/$15 per M → $3 + $1.5 = $4.5
  const usd = estimateUsd({
    variationKey: 'claude-4-5-sonnet',
    inputTokens: 1_000_000,
    outputTokens: 100_000,
  });
  assert.equal(usd, 4.5);
});

test('estimateUsd returns null for unpriced / zero tokens', () => {
  assert.equal(estimateUsd({ variationKey: 'composer', inputTokens: 100, outputTokens: 10 }), null);
  assert.equal(estimateUsd({ variationKey: 'auto', inputTokens: 0, outputTokens: 0 }), null);
  assert.equal(estimateUsd({ variationKey: 'unknown-model', inputTokens: 10, outputTokens: 10 }), null);
});
