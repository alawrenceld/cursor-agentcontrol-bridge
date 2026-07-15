# AgentControl Metrics (Cursor extension)

Records Cursor agent runs to LaunchDarkly and shows **All** (team Monitoring) vs **Me** (local ledger) in the IDE. Also dual-emits OTLP for Observability per-user charts.

**Full setup (SDK key, API token, project key, email):**  
[SETUP.md](https://github.com/alawrenceld/cursor-agentcontrol-bridge/blob/main/SETUP.md)

## Quick install from source

```sh
npm run build:hook                   # from the repo root
cd extension
npm install
./node_modules/.bin/vsce package --allow-missing-repository
cursor --install-extension cursor-agentcontrol-metrics-*.vsix
```

Then **fully quit Cursor**, reopen, and configure:

| Step | Command / setting |
|------|-------------------|
| 1 | Uninstall any older AgentControl / other-publisher builds |
| 2 | Settings → `ldAgentControl.projectKey` (+ config/env keys) |
| 3 | **AgentControl: Set LaunchDarkly SDK Key** (server-side) |
| 4 | **AgentControl: Set Your Email** |
| 5 | **AgentControl: Set LaunchDarkly API Token** (Reader — for **All** only) |

## Scopes

- **All** — LD `/metrics` (Reader API token + project key)
- **Me** — `~/.cursor/ld-agentcontrol-state/usage-events.jsonl` filtered by email

Hooks + config: `~/.cursor/hooks.json`, `~/.cursor/ld-agentcontrol.json`.
