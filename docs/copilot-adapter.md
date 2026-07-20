# GitHub Copilot Chat → LaunchDarkly AgentControl

Third provider adapter: VS Code **Copilot Chat** exports OTLP `gen_ai.*` spans;
a local receiver maps each LLM **`chat`** span into the same sinks as Cursor /
Claude Code (AI Config Monitoring, local ledger, OTLP Observability).

**No** companion VS Code extension. **No** judge. **Inline completions** are out
of scope (Chat OTel only).

## Architecture

```
VS Code Copilot Chat
  github.copilot.chat.otel.*  →  http://127.0.0.1:4319/v1/traces
                                         │
                                         ▼
                          otlp-receiver.mjs (this repo)
                                         │
                                         ▼
                              applyAgentUsageEvent
                           ┌─────────────┼─────────────┐
                           ▼             ▼             ▼
                     LD Monitoring   local ledger   LD Observability
                     copilot-usage   usage-events   (dual-emit)
```

One AgentUsageEvent per **`chat`** span (per LLM call). `invoke_agent` spans are
ignored so session-cumulative tokens are not double-counted.

## Install

```sh
cd /path/to/cursor-agentcontrol-bridge
npm run install:copilot-otel
```

Edit `~/.copilot/ld-agentcontrol.json` — set `hookUserEmail`.  
Leave `sdkKey` empty to use **`LD_SDK_KEY` from the repo `.env`** (already gitignored). You only need a local `sdkKey` if you want to override `.env`.

Provision the AI Config (Writer token in `.env`):

```sh
npm run setup:copilot-ai-config
npm run sync:copilot-models
```

### VS Code settings

Merge into User `settings.json` (snippet also at `~/.copilot/vscode-otel-settings.json`):

```json
{
  "github.copilot.chat.otel.enabled": true,
  "github.copilot.chat.otel.exporterType": "otlp-http",
  "github.copilot.chat.otel.otlpEndpoint": "http://127.0.0.1:4319"
}
```

Leave `github.copilot.chat.otel.captureContent` **false** unless you intentionally
want prompts in the OTLP stream (we only need attributes).

### Start the receiver

```sh
npm run copilot:receiver
```

Keep this process running while you use Copilot Chat. Default bind:
`127.0.0.1:4319` (override with `COPILOT_OTLP_HOST` / `COPILOT_OTLP_PORT` or
`otelReceiver` in config).

Reload VS Code after changing OTel settings.

## Config / state

| Path | Purpose |
|------|---------|
| `~/.copilot/ld-agentcontrol.json` | Bridge config + `hookUserEmail` (**local only**). `sdkKey` optional — defaults to repo `.env` `LD_SDK_KEY` |
| `~/.copilot/ld-agentcontrol-state/` | ledger, receiver.log, span-id dedupe |
| `adapters/copilot/config.defaults.json` | Repo defaults (`aiConfigKey: copilot-usage`); empty `sdkKey` / email placeholders only |
| `.env` (repo, gitignored) | `LD_SDK_KEY` — preferred place for the server SDK key |

Do not paste real SDK keys into files under the git checkout except `.env` (already ignored). Prefer `.env` over duplicating keys into `~/.copilot/`.

Override config with `LD_AGENTCONTROL_CONFIG=/path/to.json`. Repo mode:
`LD_AGENTCONTROL_CONFIG=repo` + `LD_AGENTCONTROL_PROVIDER=copilot`.

## Verify

1. `npm run copilot:receiver` — listening log line.
2. Copilot Chat turn in VS Code.
3. `tail -20 ~/.copilot/ld-agentcontrol-state/receiver.log` — `chat span … served`.
4. Ledger: `tail -5 ~/.copilot/ld-agentcontrol-state/usage-events.jsonl` —
   `providerName` should be `copilot`.
5. LD AI Config **Monitoring** on `copilot-usage`.
6. Optional menubar: **Copilot** filter after `npm run install:menubar` / Refresh.

Without `sdkKey`, the receiver still writes the **local ledger** (menubar / Me)
and skips network LD track calls.

## Known limits

- Requires a recent VS Code Copilot Chat build with
  `github.copilot.chat.otel.enabled`.
- Unmapped model strings fall through to `fallbackVariation` (`gpt-4o` in
  defaults) or are skipped if fallback is null — extend `models` +
  `src/lib/copilotPricing.mjs` as needed.
- Cost is **catalog estimate**, not Copilot subscription quota usage.
- If you also want Jaeger/Grafana on 4318, run an OTel Collector fan-out; this
  receiver defaults to **4319** to avoid colliding with Jaeger.

## Related

- Shared event model: [AGENT_USAGE_EVENT.md](AGENT_USAGE_EVENT.md)
- Claude Code adapter: [claude-code-adapter.md](claude-code-adapter.md)
- Menu bar: [MENUBAR.md](MENUBAR.md)
- VS Code docs: [Monitor agent usage with OpenTelemetry](https://code.visualstudio.com/docs/copilot/guides/monitoring-agents)
