// Catalog list prices for models commonly used via GitHub Copilot Chat ($/M tokens).
// Used by sync:copilot-models → LD model library and OTLP agent.cost_usd.
// These are public API catalog rates (not Copilot subscription quotas).

export const PRICING_PER_M = {
  'gpt-4o': { in: 2.5, out: 10 },
  'gpt-4-1': { in: 2, out: 8, catalogId: 'gpt-4.1' },
  'gpt-4-1-mini': { in: 0.4, out: 1.6, catalogId: 'gpt-4.1-mini' },
  'gpt-4-1-nano': { in: 0.1, out: 0.4, catalogId: 'gpt-4.1-nano' },
  'gpt-5': { in: 1.25, out: 10 },
  'gpt-5-mini': { in: 0.25, out: 2 },
  'gpt-5-1': { in: 1.25, out: 10, catalogId: 'gpt-5.1' },
  'gpt-5-2': { in: 1.75, out: 14, catalogId: 'gpt-5.2' },
  o3: { in: 2, out: 8 },
  'o3-mini': { in: 1.1, out: 4.4 },
  'o4-mini': { in: 1.1, out: 4.4 },
  'claude-sonnet-4': { in: 3, out: 15 },
  'claude-sonnet-4-5': { in: 3, out: 15 },
  'claude-opus-4': { in: 15, out: 75 },
  'claude-opus-4-1': { in: 15, out: 75 },
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-haiku-4-5': { in: 1, out: 5 },
  'gemini-2-5-pro': { in: 1.25, out: 10, catalogId: 'gemini-2.5-pro' },
  'gemini-2-5-flash': { in: 0.15, out: 0.6, catalogId: 'gemini-2.5-flash' },
  // Fine-tuned GPT-5 mini (Copilot Chat "Raptor mini"); catalog ≈ gpt-5-mini.
  'raptor-mini': { in: 0.25, out: 2, catalogId: 'raptor-mini' },
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
