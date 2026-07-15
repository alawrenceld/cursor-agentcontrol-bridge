# Claude Code → LaunchDarkly AgentControl

Second provider adapter: Claude Code CLI hooks map into the same sinks as Cursor
(AI Config Monitoring, local ledger, OTLP Observability). **No judge, no IDE sidebar.**

## Observed hook / transcript fields (spike)

Captured from Claude Code transcripts under `~/.claude/projects/` and the
[hooks reference](https://code.claude.com/docs/en/hooks).

### Common hook stdin fields

| Field | Notes |
|-------|--------|
| `session_id` | Session UUID (also `sessionId` in transcript rows) |
| `transcript_path` | JSONL path; may lag the in-memory turn slightly |
| `hook_event_name` | `UserPromptSubmit`, `Stop`, `StopFailure`, … |
| `cwd` | Working directory |

`Stop` fires after **every** assistant turn (not only session end). Native
`usage` / token fields are **not** reliably present on Stop stdin today
(open Anthropic issues request them). When present, the adapter prefers them.

### `StopFailure`

Matcher values include `rate_limit`, `overloaded`, `authentication_failed`,
`billing_error`, `invalid_request`, `model_not_found`, `server_error`,
`max_output_tokens`, `unknown`. Mapped to `$ld:ai:generation:error`.

### Transcript assistant rows

```json
{
  "type": "assistant",
  "uuid": "…",
  "isSidechain": false,
  "message": {
    "model": "claude-opus-4-8",
    "usage": {
      "input_tokens": 4666,
      "output_tokens": 171,
      "cache_read_input_tokens": 16310,
      "cache_creation_input_tokens": 2221
    }
  }
}
```

Skip `isSidechain: true` and synthetic models (`<synthetic>`). Token deltas are
summed for **new message UUIDs** since a per-session watermark (Stop every turn
must not re-emit cumulative session totals).

## Install

```sh
cd /path/to/cursor-agentcontrol-bridge
cp -n adapters/claude-code/config.defaults.json ~/.claude/ld-agentcontrol.json
# Edit ~/.claude/ld-agentcontrol.json — set sdkKey + hookUserEmail

# .env needs LD_API_TOKEN + LD_PROJECT_KEY (Writer) for setup/sync
npm run setup:claude-ai-config
npm run sync:claude-models
npm run install:claude-hooks
```

Hooks are merged into `~/.claude/settings.json` (UserPromptSubmit, Stop, StopFailure).
Restart Claude Code (or start a new session) after installing.

### Config / state

| Path | Purpose |
|------|---------|
| `~/.claude/ld-agentcontrol.json` | Bridge config + `sdkKey` |
| `~/.claude/ld-agentcontrol-state/` | pending, watermark, ledger, hook.log |

Override config path with `LD_AGENTCONTROL_CONFIG=/path/to.json`.

## Verify

1. Run a short Claude Code prompt.
2. `tail -20 ~/.claude/ld-agentcontrol-state/hook.log` — look for `stop: … served=… tokens=…`
3. Ledger: `tail -5 ~/.claude/ld-agentcontrol-state/usage-events.jsonl` — `providerName` should be `claude-code`.
4. LD AI Config **Monitoring** on `claude-code-usage`.
5. Observability: filter `config_key = claude-code-usage` or `provider = claude-code`; cost metric `agent.cost_usd`.

## Slash command: `/agent-usage`

On-demand summary (not a live sidebar).

```sh
npm run install:claude-hooks   # installs ~/.claude/skills/agent-usage
```

In Claude Code (new session):

| Command | Scope |
|---------|--------|
| `/agent-usage` or `/agent-usage local` | Me — local Claude ledger |
| `/agent-usage all` | Team — LD Monitoring for `claude-code-usage` (needs `LD_API_TOKEN`) |
| `/agent-usage all 7d` | Team, last 7 days (`1h` / `24h` / `7d` / `30d`) |

Same report from any shell:

```sh
npm run agent:usage -- local 24h
npm run agent:usage -- all 7d
```

## Dashboard tips

- Exclude Cursor: `config_key = claude-code-usage` (or `!= cursor-agent-usage`).
- Tokens: `token_type = total` when charting `agent.tokens`.
- Cost uses Anthropic catalog rates from `src/lib/claudePricing.mjs` after `sync:claude-models` (not Cursor charged cents).

## Non-goals (v1)

SubagentStop, judge/quality, Cursor extension Me panel for Claude, marketplace plugin.
