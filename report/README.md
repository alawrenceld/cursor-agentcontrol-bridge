# Exec / finance usage report (Surface B)

Standalone page that slices exported ledger data by **user** and **model**, with CSV download.

Chosen after the [Me remote spike](../docs/SPIKE-me-remote.md): AI Config Monitoring
has no user filter, so reporting is ledger/export-backed rather than LD O11y-first.

## Usage

```sh
# From repo root — export ~/.cursor/ld-agentcontrol-state/usage-events.jsonl
npm run report:export

# Serve the UI
npm run report:serve
# → http://localhost:4173
```

Or open `report/index.html` via any static server and use **Load JSON**.

Options:

```sh
node scripts/export-usage-summary.mjs --days 90 --ledger /path/to/usage-events.jsonl
```
