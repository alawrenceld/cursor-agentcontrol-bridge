# macOS menu bar (optional)

A [SwiftBar](https://github.com/swiftbar/SwiftBar) plugin that opens a **Cursor-panel-style**
popover (dark tiles + model table) for **Cursor + Claude Code + Copilot** usage from the local
AgentControl ledgers. Same catalog ≈$ math as the Cursor IDE sidebar and `/agent-usage`.

This is optional. The extension sidebar and slash command keep working without it.

## What you get

- Menu-bar title like `12 · ≈$3` (combined generations · catalog $ for the default window)
- Click the title → webview popover (not a nested text menu)
- Filters: **All / Cursor / Claude Code / Copilot** · **Last hour / 24h / 7d / 30d**
- Tiles: Generations · Tokens · Cost · Duration · Quality
- Model table: Gen, Tok/gen, $/gen, Score, Dur/gen (Agent column when All is selected)
- Click a model row to scope the tiles; click column headers to sort

## Prerequisites

| Need | Notes |
|------|--------|
| macOS | SwiftBar is macOS-only |
| Node 18+ | Same as this repo (`node` on PATH, or Homebrew at `/opt/homebrew/bin/node`) |
| This checkout | Plugin wrapper points at `scripts/agent-menubar.mjs` in the clone |
| Local ledgers | Cursor, Claude Code, and/or Copilot adapters writing usage events |
| SwiftBar | Installed via Homebrew below |

**No** Cursor Admin API key. **No** Claude API key. **No** LaunchDarkly token for Me/local data.

Quality / Score uses the same local judge file as the Cursor sidebar:

`~/.cursor/ld-agentcontrol-state/judge-scores.jsonl`

Claude Code has no judge worker yet, so Score/Quality stay `–` for that agent.

## Setup (step by step)

### 1. Install SwiftBar (once)

```sh
brew install --cask swiftbar
```

Open **SwiftBar** from Applications (or Spotlight) so it appears in the menu bar.

### 2. Install the AgentControl plugin

From this repo root:

```sh
cd /path/to/cursor-agentcontrol-bridge
npm run install:menubar
```

That writes an executable plugin (refresh every 1 minute), typically:

`~/Library/Application Support/SwiftBar/AgentControl.1m.sh`

and seeds:

- `~/.agentcontrol/menubar.html` — popover UI
- `~/.agentcontrol/menubar.json` — multi-range snapshot
- `~/.agentcontrol/menubar-plugin-path.txt` — path to the plugin file

### 3. Point SwiftBar at the plugin folder

1. SwiftBar → **Preferences** (or right-click the SwiftBar icon)
2. Set **Plugin Folder** to the directory printed by the installer  
   (often `~/Library/Application Support/SwiftBar`)
3. **Refresh all** (or quit and reopen SwiftBar)

You should see a compact title such as `4 · ≈$2.18` (or `AgentControl` if there are no events yet).

### 4. Open the panel

**Click the title** in the menu bar. The Cursor-style popover opens. Use the chips to switch agent and time range; they switch instantly (all four windows are baked into the HTML on each refresh).

## Data sources

| Source | Path |
|--------|------|
| Cursor usage | `~/.cursor/ld-agentcontrol-state/usage-events.jsonl` |
| Claude Code usage | `~/.claude/ld-agentcontrol-state/usage-events.jsonl` |
| Copilot usage | `~/.copilot/ld-agentcontrol-state/usage-events.jsonl` |
| Judge scores (Cursor) | `~/.cursor/ld-agentcontrol-state/judge-scores.jsonl` |
| Generated popover | `~/.agentcontrol/menubar.html` |
| Snapshot JSON | `~/.agentcontrol/menubar.json` |

Cost is **catalog estimate** (tokens × model price tables), not Cursor/Claude billed invoices. Same as the IDE panel.

If a ledger is missing, that agent shows “no ledger yet” until hooks write events.

## Commands

```sh
# From repo root
npm run install:menubar              # (re)install SwiftBar plugin wrapper
npm run menubar -- --swiftbar        # what SwiftBar runs (also regenerates HTML)
npm run menubar -- --html            # regenerate ~/.agentcontrol/menubar.html only
npm run menubar -- --json            # write snapshot JSON (+ HTML) to stdout/stderr
open ~/.agentcontrol/menubar.html    # preview the panel in a browser
```

Refresh cadence is the `.1m` in the plugin filename (every 1 minute). The ↻ control in the popover triggers `swiftbar://refreshall`.

Filter choices (agent + range) persist in the webview’s `localStorage`.

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| No menu item | Confirm Plugin Folder includes the directory with `AgentControl.1m.sh`; Refresh all; ensure SwiftBar is running |
| `node not found` in menu | Install Node or ensure Homebrew node is at `/opt/homebrew/bin/node`; re-run `npm run install:menubar` |
| Empty / zero stats | Run an agent in Cursor or Claude Code so hooks append to the ledgers; check `usage-events.jsonl` exists |
| Quality always `–` | Judge worker only writes Cursor scores; Claude filter will stay empty for Score |
| Stale `[?]` / missing `.5m.sh` | SwiftBar cached an old plugin name after a rename — **Refresh all** or quit & reopen SwiftBar |
| Stale numbers | Click ↻ or wait for the 1-minute refresh; or `npm run menubar -- --html` then Refresh all |
| Moved the git clone | Re-run `npm run install:menubar` so the plugin points at the new path |
| Want a different refresh | Rename `AgentControl.1m.sh` (e.g. `.30s` / `.5m`); SwiftBar interval is in the filename |

## Uninstall

```sh
# Path is also stored here:
cat ~/.agentcontrol/menubar-plugin-path.txt
rm "$(cat ~/.agentcontrol/menubar-plugin-path.txt)"
# Optional cleanup:
rm -rf ~/.agentcontrol
```

Quit SwiftBar or remove the app if you no longer want any menu-bar plugins.

## Related

- Cursor extension setup: [SETUP.md](../SETUP.md)
- Claude Code adapter: [claude-code-adapter.md](claude-code-adapter.md)
- Multi-provider event shape: [AGENT_USAGE_EVENT.md](AGENT_USAGE_EVENT.md)
