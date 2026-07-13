# cursor-agentcontrol-bridge — Build Plan

**Status: built (2026-07-02). Code + tests in place; live verification steps (README
"Verification") not yet run — needs real LD_SDK_KEY / CURSOR_ADMIN_KEY.**

Measure AI agent activity happening inside the Cursor IDE (including auto mode) and feed it
into a LaunchDarkly AgentControl / AI Config **Monitoring** dashboard, broken out by model:
generation counts, success/error rate, duration, tokens, and (LD-derived) cost.

Standalone project — deliberately not part of any other repo.

---

## Why this shape (research summary, 2026-07-02)

- **OpenLLMetry cannot observe Cursor.** It instruments LLM SDK calls inside a process you
  control; Cursor is closed-source and its inference runs on Anysphere's servers.
- **BYOK/proxy (LiteLLM/Helicone) is a dead end for agent work**: custom API keys only work
  in Ask/Plan modes — Agent mode and Tab never route through them.
- **Cursor has no native OTel.** Its two real telemetry surfaces are:
  | Surface | Latency | Model | Duration | Tokens | Cost | Plan |
  |---|---|---|---|---|---|---|
  | Hooks (`~/.cursor/hooks.json`, 1.7+) | real-time | yes | yes | **no** | **no** | all plans |
  | Admin API `POST api.cursor.com/teams/filtered-usage-events` | hourly batch | yes | no | yes (input/output/cache) | yes (`chargedCents`, `tokenUsage.totalCents`) | **Teams/Business/Enterprise only** |
  No confirmed shared request ID between the two surfaces.
- **LD side:** the AI Config Monitoring tab is fed entirely by `$ld:ai:*` custom events.
  Variation/model attribution is carried as plain data fields in the event payload
  (`{variationKey, configKey, version, modelName, providerName}` — confirmed in
  `@launchdarkly/server-sdk-ai` source), so externally observed runs can be recorded
  post-hoc with an ordinary server SDK `track()` call. No inference through the SDK, no
  live evaluation needed. OTel/gen_ai ingestion lands in LD Observability (separate
  pipeline) and does NOT populate the Monitoring tab.

Confirmed event keys (from AI SDK dist source):
`$ld:ai:duration:total`, `$ld:ai:tokens:ttf`, `$ld:ai:tokens:total`, `$ld:ai:tokens:input`,
`$ld:ai:tokens:output`, `$ld:ai:generation:success`, `$ld:ai:generation:error`,
`$ld:ai:feedback:user:positive`, `$ld:ai:feedback:user:negative`, `$ld:ai:tool_call`.
Rule for the implementation: mirror the SDK's `getTrackData()` payload byte-for-byte; when
in doubt, read `@launchdarkly/server-sdk-ai` source rather than guessing.

## Architecture

```
Cursor IDE
 ├─ hooks (real-time) ──► src/hooks/cursor-hook.mjs ──► $ld:ai:duration + generation:success/error
 │    beforeSubmitPrompt: stamp start time per conversation_id (local state file)
 │    stop:               compute duration, map model → variation, track + flush
 │
 └─ Cursor Admin API (hourly poll) ──► src/poller/poll-usage-events.mjs
      filtered-usage-events → dedupe → map model → variation → $ld:ai:tokens:input/output/total
                                        │
                                        ▼
                        LD server SDK track() → AI Config "cursor-ide-usage"
                        Monitoring tab: per-variation (= per-model) metrics; cost derived
                        by LD from tokens × model pricing
```

Two independent event streams against the same config+variation; the dashboard aggregates
each metric independently, so no per-run join between hooks and Admin API is required.

## Components to build

1. **`src/hooks/cursor-hook.mjs`** — single script registered for `beforeSubmitPrompt` and
   `stop` in `~/.cursor/hooks.json` (`{"version": 1, "hooks": {"<event>": [{"command": "node <abs path>"}]}}`).
   Reads the hook JSON payload from stdin, switches on `hook_event_name`.
   - `beforeSubmitPrompt`: write `{ts}` to `.state/pending/<conversation_id>.json`, exit 0.
     No network — must be instant and never block prompt submission.
   - `stop`: duration = now − pending ts (skip duration if no pending file); status
     `completed` → success, `error` → error, `aborted` → skip (user cancel ≠ model error).
     Model from payload `model`/`model_id`. Track events, `flush()` with a hard timeout,
     always exit 0 — a bridge failure must never break Cursor.
2. **`src/poller/poll-usage-events.mjs`** — run hourly (cron/launchd or `--loop`).
   Basic auth (`CURSOR_ADMIN_KEY:`), poll from last-seen timestamp minus a 2h overlap
   window, dedupe on hash(timestamp+userEmail+model+kind+token counts) in
   `.state/poller-state.json`. Optional `userEmails` allowlist (avoid ingesting the whole
   team). Emit tokens events per usage event; include cache token counts and
   `chargedCents` as extra data fields for reference. Flags: `--dry-run` (print, don't
   send), `--since <date>` (backfill).
3. **`src/lib/ldTrack.mjs`** — shared LD client wrapper: init `@launchdarkly/node-server-sdk`
   with `{stream: false, diagnosticOptOut: true}`, build the AI-SDK-identical trackData,
   context = `{kind: "user", key: <cursor user email>}` (consistent across both streams),
   track → flush(timeout) → close. `DRY_RUN=1` logs instead of sending.
4. **`bridge.config.json`** — `aiConfigKey`, `aiConfigVersion`, `providerName: "cursor"`,
   `models` map (Cursor model string → variationKey), `fallbackVariation` (or skip+log for
   unmapped models), `userEmails`, `emitGenerationsFromPoller` (default false; set true if
   running poller without hooks, so generation counts still exist — never run both ways or
   counts double).
5. **`scripts/setup-ai-config.mjs`** (optional convenience) — create the AI Config +
   one variation per entry in `models` via LD REST (beta AI Configs API) or document doing
   it in the LD UI / MCP instead. The config is measurement-only; variations exist so the
   Monitoring tab breaks out per model.
6. **`.env.example`** — `LD_SDK_KEY` (env where metrics land), `CURSOR_ADMIN_KEY`,
   optional `LD_API_TOKEN` + `LD_PROJECT_KEY` for the setup script.
7. **README** — setup walkthrough, hooks.json snippet, cron example, verification steps,
   limitations.

Stack: Node 18+ (built-in fetch), ESM, single runtime dep `@launchdarkly/node-server-sdk`.
`.state/`, `.env`, `node_modules` gitignored.

## Build order

1. Scaffold package + config/env loading.
2. `ldTrack.mjs` with DRY_RUN; unit-test trackData shape against AI SDK source.
3. Hook script; test by piping recorded sample payloads (`hook:test` npm script), then live
   with DRY_RUN=1 in Cursor before pointing at real LD.
4. Poller `--dry-run` against the real Admin API (verify actual response field names —
   docs vs. reality), then live.
5. Create the AI Config + per-model variations; **empirical spot-check** (see risks) before
   trusting the dashboard.
6. Cron/launchd install docs.

## Verification plan

- Fire one hand-built event per type; confirm each lands on the intended variation in the
  Monitoring tab (this validates the researched-but-undocumented assumption that the
  dashboard reads `variationKey`/`version` from event data).
- Run one real Cursor agent session; confirm generation + duration appear within minutes
  (hooks) and tokens appear after the next poll (Admin API is hourly-fresh).
- Compare a day of dashboard token totals against the Cursor dashboard's own usage page.

## Known limitations & risks

- **Admin API requires a Teams+ plan** and an admin key. Individual/Pro: no tokens/cost
  source at all (hooks-only mode still gives counts/duration/success by model).
- **No per-request latency** from the Admin API; duration comes only from the hook path
  (prompt-submit → stop wall clock, which includes tool time — that's "execution time",
  arguably what we want).
- Dashboard **cost is LD-derived** from tokens × model pricing — it will not include
  Cursor's markup (`chargedCents`). True spend stays in the event data fields / Cursor's
  own dashboard.
- Cursor's **`auto` model**: hook payloads and usage events report the actually-selected
  model (verify on first live run); if some events report literal `auto`, give it its own
  variation.
- Event-data → variation attribution on the Monitoring tab is confirmed from SDK source
  but not documented — hence the spot-check step before building further.
- Cursor hooks payloads/Admin API schemas are young and may drift between versions; code
  defensively, log unknown shapes.
- Measurement only — this gives LD no control over Cursor's model choice.

## Future extensions (explicitly out of scope for v1)

- **OTel side-channel**: emit gen_ai.* spans from the hook script to LD's OTLP endpoint →
  LLM observability dashboards + Conversations view (keyed off `gen_ai.conversation.id` =
  Cursor `conversation_id`); also unlocks token/cost *alerting*, which currently requires
  observability data sources rather than Monitoring metrics.
- `subagentStop` / `postToolUse` ingestion (`$ld:ai:tool_call`).
- Per-run correlation across hooks + Admin API (heuristic join on user+model+time window).
- Ask Cursor for tokens/cost in hook payloads & CLI JSON (open feature requests: forum
  threads 146980, 164583) — would collapse this whole project into one hook script.
