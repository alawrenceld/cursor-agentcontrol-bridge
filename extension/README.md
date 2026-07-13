# AgentControl Metrics (Cursor extension)

All-in-one Cursor↔LaunchDarkly bridge: records every agent run to a LaunchDarkly AI
Config (bundled hook, self-installing) and surfaces the Monitoring metrics inside the IDE.

**Write path (bundled since 0.2.0):** the extension ships a self-contained copy of the
Cursor hook and, on activation, registers it in `~/.cursor/hooks.json` (repairing the path
after upgrades, preserving unrelated hooks) and creates `~/.cursor/ld-agentcontrol.json`
from bundled defaults. That file holds the hook's config: `sdkKey` (set via the
**Set LaunchDarkly SDK Key** command — hooks run outside the extension host, so this
lives on disk, not in SecretStorage), the model→variation map, and config keys. Hook
state/logs go to `~/.cursor/ld-agentcontrol-state/`. Edit the config with the
**Open Hook Config** command. Restart Cursor fully after first install.

- **Status bar** (right side): generations · tokens · cost for the selected range; hover
  for a per-model table; click to open the panel.
- **Sidebar panel** (pulse icon in the activity bar): stat tiles (generations + success
  rate, tokens, cost, duration) and a per-model table, with time-range presets
  (1h / 24h / 7d / 30d). Refreshes every `ldAgentControl.pollSeconds` (default 60s).

Data comes from LaunchDarkly's beta AI Configs metrics API (`/metrics` and
`/metrics-by-variation`) — the same numbers as the Monitoring tab. Cost columns show
whatever LD derives (tokens × model catalog pricing); `$0.00` until the catalog has a
matching model entry.

## Install

```sh
npm run build:hook                   # from the repo root: bundle the hook into extension/hook/
cd extension
npm install
./node_modules/.bin/vsce package --allow-missing-repository
cursor --install-extension cursor-agentcontrol-metrics-*.vsix
```

(Or in Cursor: Command Palette → "Extensions: Install from VSIX…". `code` works too for
plain VS Code.)

Then run **"AgentControl: Set LaunchDarkly API Token"** from the Command Palette (a
reader-role token is enough; it's stored in the IDE's SecretStorage, never in settings
files). Project/config/environment keys are in Settings under "AgentControl Metrics" and
default to this project's values.
