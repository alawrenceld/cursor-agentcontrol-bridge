// Anthropic list prices for Claude Code models ($/M tokens).
// Used by sync:claude-models → LD model library and OTLP agent.cost_usd.
// Source: Anthropic API pricing (kept in sync with common Claude Code models).

export const PRICING_PER_M = {
  'claude-4-sonnet': { in: 3, out: 15 },
  'claude-4-sonnet-1m': { in: 6, out: 22.5 },
  'claude-4-5-haiku': { in: 1, out: 5 },
  'claude-4-5-sonnet': { in: 3, out: 15 },
  'claude-4-5-opus': { in: 5, out: 25 },
  'claude-4-6-sonnet': { in: 3, out: 15 },
  'claude-4-6-opus': { in: 5, out: 25 },
  'claude-4-7-opus': { in: 5, out: 25 },
  'claude-opus-4-7': { in: 15, out: 75 },
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-sonnet-4': { in: 3, out: 15 },
  'claude-sonnet-4-5': { in: 3, out: 15 },
  'claude-sonnet-4-6': { in: 3, out: 15 },
  'claude-sonnet-5': { in: 3, out: 15 },
  'claude-haiku-4-5': { in: 1, out: 5 },
  'claude-3-5-haiku': { in: 0.8, out: 4 },
  'claude-3-5-sonnet': { in: 3, out: 15 },
  'claude-3-7-sonnet': { in: 3, out: 15 },
  'claude-opus-4': { in: 15, out: 75 },
  'claude-opus-4-1': { in: 15, out: 75 },
};

export function perTokenPricing(variationKey) {
  const pricing = PRICING_PER_M[variationKey];
  if (!pricing) return null;
  return { in: pricing.in / 1e6, out: pricing.out / 1e6 };
}

export function estimateUsd({ variationKey, inputTokens = 0, outputTokens = 0 } = {}) {
  const pricing = perTokenPricing(variationKey);
  if (!pricing) return null;
  const input = Number(inputTokens) || 0;
  const output = Number(outputTokens) || 0;
  if (input <= 0 && output <= 0) return null;
  return input * pricing.in + output * pricing.out;
}
