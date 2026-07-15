// Route catalog cost estimates by variation key across provider tables.
import { estimateUsd as cursorEstimateUsd } from './cursorPricing.mjs';
import { estimateUsd as claudeEstimateUsd } from './claudePricing.mjs';

/** Prefer Cursor table, then Claude; null if unpriced in both. */
export function estimateUsd(opts) {
  return cursorEstimateUsd(opts) ?? claudeEstimateUsd(opts);
}
