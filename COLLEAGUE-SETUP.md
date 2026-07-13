# Installing the AgentControl Metrics extension

Records every Cursor agent run to the shared LaunchDarkly AI Config
(`cursor-monitoring` project → `cursor-agent-usage`) and shows the Monitoring
metrics inside Cursor. Setup takes ~3 minutes.

## What you need

1. `cursor-agentcontrol-metrics-0.3.3.vsix` — ask Tom, or package it yourself
   from this repo (`extension/README.md`).
2. A **server-side SDK key** for the `cursor-monitoring` project, `production`
   environment (LaunchDarkly → Account settings → Projects → cursor-monitoring →
   Environments). Needed to record runs.
3. Optional: a **reader-role API access token** (Account settings → Authorizations)
   if you want the in-IDE metrics panel. Recording works without it.

## Steps

1. Install the extension: Command Palette → **"Extensions: Install from
   VSIX…"** and pick the file (or `cursor --install-extension
   cursor-agentcontrol-metrics-0.3.3.vsix` from a terminal).
2. **Fully quit and reopen Cursor.** On activation the extension registers the
   agent hook in `~/.cursor/hooks.json` and seeds its config at
   `~/.cursor/ld-agentcontrol.json`; Cursor only loads hooks at startup.
3. Command Palette → **"AgentControl: Set LaunchDarkly SDK Key (record agent
   runs)"** → paste the SDK key.
4. Optional: **"AgentControl: Set LaunchDarkly API Token (read metrics)"** →
   paste the reader token. The status bar item (bottom right) and the pulse
   icon in the activity bar light up with generations / tokens / cost.

No settings changes needed — the defaults already point at
`cursor-monitoring` / `cursor-agent-usage` / `production`. Runs are attributed
to the email your Cursor account uses; you don't need to configure identity.

## Verify

Run any agent prompt, then check the hook log:

```sh
tail ~/.cursor/ld-agentcontrol-state/hook.log
```

You should see a `stop: … served=true` line with your model and token counts.
Within a couple of minutes the run appears on the AI Config's Monitoring tab in
LaunchDarkly (and in the extension's sidebar panel if you set the API token).

If the log shows `unmapped model … skipped`, Cursor shipped a model we haven't
mapped yet — ping Tom (the model→variation map lives in
`~/.cursor/ld-agentcontrol.json` and new variations are created with the
scripts in this repo).
