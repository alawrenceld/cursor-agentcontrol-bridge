// Route catalog cost estimates by variation key across provider tables.
import { estimateUsd as cursorEstimateUsd } from './cursorPricing.mjs';
import { estimateUsd as claudeEstimateUsd } from './claudePricing.mjs';
import { estimateUsd as copilotEstimateUsd } from './copilotPricing.mjs';

/** Prefer Cursor, then Claude, then Copilot; null if unpriced in all. */
export function estimateUsd(opts) {
  return cursorEstimateUsd(opts) ?? claudeEstimateUsd(opts) ?? copilotEstimateUsd(opts);
}
