# AgentControl Metrics (Cursor extension)

All-in-one Cursor↔LaunchDarkly bridge: records every agent run to a LaunchDarkly AI
Config (bundled hook, self-installing) and surfaces usage metrics inside the IDE.

**Write path:** the extension ships a self-contained Cursor hook and, on activation,
registers it in `~/.cursor/hooks.json` and seeds `~/.cursor/ld-agentcontrol.json`.
That file holds `sdkKey`, `hookUserEmail` (Me identity), the model→variation map, and
config keys. State/logs go to `~/.cursor/ld-agentcontrol-state/` (including
`usage-events.jsonl` for the Me view). Restart Cursor fully after first install.

**Scopes:**

- **All** — LaunchDarkly AI Config Monitoring APIs (`/metrics`, `/metrics-by-variation`):
  team-wide totals for the project (requires a reader API token).
- **Me** — aggregates the local usage ledger for your `hookUserEmail`. Generations,
  duration, success/error, and any tokens the hook/poller wrote on this machine.
  Team tokens ingested only by a shared poller elsewhere will not appear under Me
  unless those events also land in your local ledger (see `docs/SPIKE-me-remote.md`).

- **Status bar**: generations · tokens · cost for the selected range and scope.
- **Sidebar panel**: All|Me toggle, time-range presets, per-model table.

## Install

See [SETUP.md](https://github.com/alawrenceld/cursor-agentcontrol-bridge/blob/main/SETUP.md) for end-user steps. From source:

```sh
npm run build:hook                   # from the repo root
cd extension
npm install
./node_modules/.bin/vsce package --allow-missing-repository
cursor --install-extension cursor-agentcontrol-metrics-*.vsix
```

Then configure (Command Palette):

1. **Set LaunchDarkly SDK Key** — record runs
2. **Set Your Email** — Me filter + LD context key
3. Settings → AgentControl Metrics → your `projectKey`
4. Optional: **Set LaunchDarkly API Token** — team All view
