# Spike: remote Me / filter-by-user

**Date:** 2026-07-15  
**Status:** **NO-GO** for remote Me via current AI Config Monitoring APIs

## Question

Can we query LaunchDarkly for AI Config usage filtered by user/context key so **Me**
(and exec reporting) include tokens ingested by a shared Admin API poller?

## Evidence

1. **Extension client** ([`extension/lib/ldMetrics.js`](../extension/lib/ldMetrics.js)) only sends
   `from`, `to`, and `env` to `/metrics` and `/metrics-by-variation`. Locked by
   [`test/ldMetrics.test.mjs`](../test/ldMetrics.test.mjs).
2. **Write path** already attributes `{ kind: "user", key: email }` via
   [`src/lib/ldTrack.mjs`](../src/lib/ldTrack.mjs), but Monitoring aggregation APIs do not
   expose that dimension on read.
3. **Observability MCP** (`query-aggregations` / `get-keys` on OTel `metrics`) targets a
   different pipeline than `$ld:ai:*` custom events from the server SDK `track()` call.
   Custom track events that feed AI Config Monitoring do not appear as filterable OTel
   metrics without a dual-emit path.
4. Probe script: `npm run spike:me-remote` (requires `LD_API_TOKEN`) — re-run with
   `--write-doc` when refreshing evidence against a live project.

## Verdict: NO-GO

| Path | Usable for Me? |
|------|----------------|
| AI Config `/metrics` | No — team aggregates only |
| AI Config `/metrics?contextKey=` | Not a supported filter API |
| LD Observability aggregates on `$ld:ai:*` track events | Not available without OTel dual-emit |
| Local `usage-events.jsonl` ledger | **Yes** — generations, duration, success, local tokens |

## Decision for Priority 2

Per the roadmap decision rule (**if Observability cannot groupBy user → prefer Surface B**):

- **Choose standalone reporting webpage** ([`report/`](../report/)) fed by ledger export
  (`npm run report:export`).
- Defer LD O11y custom dashboards until an OTel dual-emit (or Data Export warehouse) lands.

## Implications for Me tokens

Me tokens/cost show when **this machine** wrote token events to the ledger (hook payloads
that include tokens, or a poller running locally). A shared org poller writing only to LD
does **not** populate other users' Me views. Documented in the panel when gens > 0 but
tokens = 0 under Me.
