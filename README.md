# cursor-agentcontrol-bridge

Measure AI agent activity inside the Cursor IDE (including auto mode) and feed it into a
LaunchDarkly AI Config **Monitoring** dashboard, broken out by model: generation counts,
success/error rate, duration, tokens, and LD-derived cost.

Two independent event streams feed the same AI Config:

```
Cursor IDE
 ├─ hooks (real-time) ──► src/hooks/cursor-hook.mjs ──► duration + generation success/error
 └─ Admin API (hourly) ──► src/poller/poll-usage-events.mjs ──► input/output/total tokens
                                        │
                                        ▼
                     LD server SDK track() → AI Config "cursor-agent-usage"
                     Monitoring tab: per-variation (= per-model) metrics
```

No per-run join is needed — the dashboard aggregates each metric independently.
See `PLAN.md` for the research behind this shape.

## Prerequisites

- Node 18+.
- A LaunchDarkly server-side SDK key for the environment where metrics should land.
- **Poller only:** a Cursor **Teams/Business/Enterprise** plan and an Admin API key
  (Cursor dashboard → Settings → Advanced → Admin API Keys). Individual/Pro plans have no
  token/cost source; hooks-only mode still gives counts, duration, and success rate by model.

## Setup

### 1. Install & configure

```sh
npm install
cp .env.example .env   # then fill in LD_SDK_KEY (and CURSOR_ADMIN_KEY for the poller)
```

Edit `bridge.config.json`:

- `models` — map of Cursor model strings → AI Config variation keys. Unmapped models are
  skipped and logged (set `fallbackVariation` to catch them instead).
- `hookUserEmail` — your email; the hook payload doesn't carry one, and the LD context key
  should match what the Admin API reports so both streams attribute to the same user.
- `userEmails` — poller allowlist, so you don't ingest the whole team. Empty array = everyone.
- `emitGenerationsFromPoller` — set `true` **only** when running the poller without hooks,
  so generation counts still exist. Never run both ways or counts double.

### 2. Create the AI Config

The config is measurement-only — nothing evaluates it; variations exist so the Monitoring
tab breaks out per model. Either:

- run `LD_API_TOKEN=... LD_PROJECT_KEY=... npm run setup:ai-config` (uses the beta AI
  Configs REST API; on schema drift it prints the response body — fall back to the UI), or
- create it by hand in the LD UI (AI Configs → New) or via the LaunchDarkly MCP server:
  one AI Config with key `cursor-agent-usage`, one variation per entry in `models`, each
  variation's model name set to the Cursor model string and provider set to `cursor`.

### 3. Register the Cursor hooks

Add to `~/.cursor/hooks.json` (create it if missing), using the **absolute** path to this
repo, then fully restart Cursor (hooks load at startup):

```json
{
  "version": 1,
  "hooks": {
    "beforeSubmitPrompt": [
      { "command": "node /ABS/PATH/TO/cursor-agentcontrol-bridge/src/hooks/cursor-hook.mjs" }
    ],
    "stop": [
      { "command": "node /ABS/PATH/TO/cursor-agentcontrol-bridge/src/hooks/cursor-hook.mjs" }
    ]
  }
}
```

The hook is fail-safe: it always exits 0 and `beforeSubmitPrompt` does no network I/O, so a
bridge failure can't break Cursor. Activity is logged to `.state/hook.log`.

### 4. Schedule the poller

One-shot: `npm run poller:once`. Long-running: `npm run poller:loop` (hourly).

Cron:

```cron
5 * * * * cd /ABS/PATH/TO/cursor-agentcontrol-bridge && /usr/local/bin/node src/poller/poll-usage-events.mjs >> .state/poller.log 2>&1
```

launchd (macOS) — save as `~/Library/LaunchAgents/com.cursor-agentcontrol-bridge.poller.plist`
and run `launchctl load` on it:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.cursor-agentcontrol-bridge.poller</string>
  <key>ProgramArguments</key><array>
    <string>/usr/local/bin/node</string>
    <string>/ABS/PATH/TO/cursor-agentcontrol-bridge/src/poller/poll-usage-events.mjs</string>
  </array>
  <key>WorkingDirectory</key><string>/ABS/PATH/TO/cursor-agentcontrol-bridge</string>
  <key>StartInterval</key><integer>3600</integer>
  <key>StandardErrorPath</key><string>/ABS/PATH/TO/cursor-agentcontrol-bridge/.state/poller.log</string>
</dict></plist>
```

The poller keeps `.state/poller-state.json` (last-seen timestamp + event hashes) and
re-fetches a 2h overlap window each run, so late-landing hourly batches are caught without
double-counting. Backfill with `--since 2026-06-01`; preview anything with `--dry-run`.

## Verification

1. **Dry runs first.** `npm test`, then `npm run hook:test` (fixture payloads through the
   hook), then `npm run poller:dry` (real Admin API, nothing sent to LD — also confirms the
   live response field names match what the code expects; unknown shapes are logged).
2. **Spot-check the attribution assumption.** The Monitoring tab reading
   `variationKey`/`version` from event data is confirmed from SDK source but undocumented.
   Fire one real event per type (run the hook with `DRY_RUN` unset on a fixture, or one
   poller cycle) and confirm each lands on the intended variation before trusting anything.
3. **Live hook check.** Run one real Cursor agent session; generation + duration should
   appear in Monitoring within minutes. Check `.state/hook.log` if not.
4. **Token reconciliation.** After a day, compare dashboard token totals against Cursor's
   own usage page (Admin API data is hourly-fresh, so expect lag on the last hour).

## Me vs All & reporting

- Extension sidebar: **All** (LD Monitoring, team) vs **Me** (local `usage-events.jsonl`
  filtered by `hookUserEmail`). See [SETUP.md](SETUP.md).
- Me tokens only include events written on this machine; see [docs/SPIKE-me-remote.md](docs/SPIKE-me-remote.md).
- Exec report (user/model filters + CSV): `npm run report:export && npm run report:serve`
  ([report/](report/)).
- Multi-provider roadmap: [docs/AGENT_USAGE_EVENT.md](docs/AGENT_USAGE_EVENT.md).

## Limitations

- **Tokens/cost need Teams+.** Hooks-only mode has no token source (Cursor doesn't put
  tokens in hook payloads — open feature requests: forum threads 146980, 164583).
- **Duration is wall-clock** from prompt-submit to stop, including tool time — "execution
  time", not model latency. The Admin API has no per-request latency at all.
- **Dashboard cost is LD-derived** (tokens × LD's model pricing) and won't include Cursor's
  markup. True spend rides along in event data (`totalCents`, `chargedCents`) and stays
  visible in Cursor's own dashboard. `$ld:ai:tokens:total` includes cache read/write
  tokens; `input`/`output` stay raw so LD's derived cost isn't inflated by cache reads.
- **`auto` mode:** payloads are expected to report the actually-selected model; if a live
  run shows literal `auto`, it has its own variation in the default `models` map.
- Cursor's hook payload and Admin API schemas are young and may drift — the code logs
  unknown shapes rather than guessing (`.state/hook.log`, poller stderr).
- Measurement only: this gives LD no control over Cursor's model choice.

## Repo layout

| Path | Purpose |
|---|---|
| `src/hooks/cursor-hook.mjs` | Cursor hook entrypoint (`beforeSubmitPrompt` + `stop`) |
| `src/poller/poll-usage-events.mjs` | Hourly Admin API poller → token events |
| `src/lib/ldTrack.mjs` | Shared LD client wrapper; payloads mirror `@launchdarkly/server-sdk-ai` |
| `scripts/setup-ai-config.mjs` | Optional: create the AI Config + variations via REST |
| `bridge.config.json` | Config key, model→variation map, allowlist (repo mode; the extension seeds `~/.cursor/ld-agentcontrol.json` from it for user mode) |
| `extension/` | All-in-one Cursor extension: bundled self-installing hook + Monitoring metrics UI (**All** from LD, **Me** from local ledger) — see its README and [SETUP.md](SETUP.md) |
| `report/` | Standalone exec reporting page (filters + CSV) over exported ledger / summary JSON |
| `docs/` | Spike notes, `AgentUsageEvent` multi-provider roadmap |
| `scripts/sync-model-library.mjs` | Create `Cursor.*` entries in LD's model library at Cursor's billed prices and link every variation (required for cost derivation) |
| `test/` | Payload-shape tests against the real AI SDK + poller and extension logic tests |

Note on cost: LD prices events **at ingestion** by joining the event's variation to its
selected model (`modelConfigKey` + `model.modelName`) in the model library. Run
`npm run sync:models` after adding variations, or costs stay $0 — and events recorded
before the link stay $0 forever.
