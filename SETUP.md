# Installing AgentControl Metrics

Records Cursor agent runs to **your** LaunchDarkly AI Config and shows Monitoring
metrics inside Cursor (team-wide **All**, or your local **Me** ledger).

## What you need

1. This extension packaged as a VSIX (`extension/README.md`), or an install from source.
2. A **server-side SDK key** for the LaunchDarkly project/environment where events
   should land. Create an AI Config (default key `cursor-agent-usage`) with one
   variation per model you care about — see the root README `setup:ai-config` script.
3. Optional: a **reader-role API access token** for the in-IDE **All** metrics panel
   (same numbers as the Monitoring tab). Recording and the **Me** view work without it.
4. Your email in the hook config (`hookUserEmail`) so **Me** filtering and LD context
   attribution match. Use **AgentControl: Set Your Email** after install.

## Steps

1. Install the extension (Command Palette → **Extensions: Install from VSIX…**, or
   `cursor --install-extension cursor-agentcontrol-metrics-*.vsix`).
2. **Fully quit and reopen Cursor.** On activation the extension registers the
   agent hook in `~/.cursor/hooks.json` and seeds `~/.cursor/ld-agentcontrol.json`.
3. Settings → **AgentControl Metrics**: set your LaunchDarkly `projectKey` (and
   config/environment keys if they differ from the defaults).
4. Command Palette → **AgentControl: Set LaunchDarkly SDK Key** → paste the SDK key.
5. Command Palette → **AgentControl: Set Your Email** → the address used as your
   LD user context (and for the Me filter).
6. Optional: **AgentControl: Set LaunchDarkly API Token** for the team **All** view.

## Verify

```sh
tail ~/.cursor/ld-agentcontrol-state/hook.log
```

After an agent run you should see a `stop: … served=true` (or similar) line. Within
a few minutes the run appears on the AI Config Monitoring tab. The extension sidebar
shows **All** (from LD) and **Me** (from `usage-events.jsonl` on this machine).

**Me tokens:** only counts token events written on this machine (hook payloads that
include tokens, or a local poller). A shared org poller that only writes to LaunchDarkly
does not fill other people's Me views — see `docs/SPIKE-me-remote.md`.

If the log shows `unmapped model … skipped`, add that Cursor model string to the
`models` map in `~/.cursor/ld-agentcontrol.json` (and create a matching AI Config
variation). Root `scripts/` can help sync the model library for cost estimates.
