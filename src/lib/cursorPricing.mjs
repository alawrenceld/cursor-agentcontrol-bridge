// Cursor catalog prices used by:
//   - scripts/sync-model-library.mjs → LD model library (Monitoring cost join)
//   - OTLP agent.cost_usd (Observability) — must match that catalog
//   - plugin ≈$ when Monitoring returns $0 (same $/token math)
//
// Values are $/M tokens as Cursor bills them. Sync writes costPer*Token = $/M / 1e6.
// Pricing source: cursor.com/docs/account/pricing (kept in sync with sync-model-library).

/** variation key → { in, out } $/M tokens, or null when unpriced/dynamic. */
export const PRICING_PER_M = {
  // Auto bills through its own flat pool; LD catalog has no cache-read rate.
  auto: { in: 1.25, out: 6 },
  composer: null,
  'composer-1': { in: 1.25, out: 10 },
  'composer-1-5': { in: 3.5, out: 17.5 },
  'composer-2': { in: 0.5, out: 2.5 },
  'composer-2-5': { in: 0.5, out: 2.5 },
  'composer-2-5-fast': { in: 0.5, out: 2.5, catalogId: 'composer-2.5' },
  'claude-4-sonnet': { in: 3, out: 15 },
  'claude-4-sonnet-1m': { in: 6, out: 22.5 },
  'claude-4-5-haiku': { in: 1, out: 5 },
  'claude-4-5-sonnet': { in: 3, out: 15 },
  'claude-4-5-opus': { in: 5, out: 25 },
  'claude-4-6-sonnet': { in: 3, out: 15 },
  'claude-4-6-opus': { in: 5, out: 25 },
  'claude-4-7-opus': { in: 5, out: 25 },
  'claude-opus-4-7': { in: 30, out: 150 },
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-fable-5': { in: 10, out: 50 },
  'claude-sonnet-5': { in: 2, out: 10 },
  'gpt-5': { in: 1.25, out: 10 },
  'gpt-5-mini': { in: 0.25, out: 2 },
  'gpt-5-codex': { in: 1.25, out: 10 },
  'gpt-5-1-codex': { in: 1.25, out: 10 },
  'gpt-5-1-codex-max': { in: 1.25, out: 10 },
  'gpt-5-1-codex-mini': { in: 0.25, out: 2 },
  'gpt-5-2': { in: 1.75, out: 14 },
  'gpt-5-2-codex': { in: 1.75, out: 14 },
  'gpt-5-3-codex': { in: 1.75, out: 14 },
  'gpt-5-4': { in: 2.5, out: 15 },
  'gpt-5-4-mini': { in: 0.75, out: 4.5 },
  'gpt-5-4-nano': { in: 0.2, out: 1.25 },
  'gpt-5-5': { in: 5, out: 30 },
  'gemini-2-5-flash': { in: 0.3, out: 2.5 },
  'gemini-2-5-pro': { in: 1.25, out: 10 },
  'gemini-3-flash': { in: 0.5, out: 3 },
  'gemini-3-pro': { in: 2, out: 12 },
  'gemini-3-pro-image-preview': { in: 2, out: 12 },
  'gemini-3-1-pro': { in: 2, out: 12 },
  'gemini-3-5-flash': { in: 1.5, out: 9 },
  'grok-4-20': { in: 2, out: 6 },
  'grok-4-3': { in: 1.25, out: 2.5 },
  'grok-4-5': { in: 2, out: 6 },
  'grok-4-5-fast': { in: 4, out: 18 },
  'grok-build-0-1': { in: 1, out: 2 },
  'glm-5-2': { in: 1.4, out: 4.4 },
  'kimi-k2-7-code': { in: 0.95, out: 4 },
};

/** Per-token USD rates matching LD model-config costPerInput/OutputToken. */
export function perTokenPricing(variationKey) {
  const pricing = PRICING_PER_M[variationKey];
  if (!pricing) return null;
  return { in: pricing.in / 1e6, out: pricing.out / 1e6 };
}

/**
 * Same math as extension estimateCost + Monitoring catalog join:
 *   inputTokens * costPerInputToken + outputTokens * costPerOutputToken
 * Returns null when the variation has no fixed catalog price.
 */
export function estimateUsd({ variationKey, inputTokens = 0, outputTokens = 0 } = {}) {
  const pricing = perTokenPricing(variationKey);
  if (!pricing) return null;
  const input = Number(inputTokens) || 0;
  const output = Number(outputTokens) || 0;
  if (input <= 0 && output <= 0) return null;
  return input * pricing.in + output * pricing.out;
}
