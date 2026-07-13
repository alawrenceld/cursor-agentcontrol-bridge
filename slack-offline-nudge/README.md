# slack-offline-nudge

Watches your team's Slack presence and DMs them **any updates?** as soon as they go from **active → away**.

Slack no longer offers real-time `presence_change` events for modern apps (RTM is legacy-only), so this app **polls** [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence).

## 1. Create the Slack app

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**.
2. Under **OAuth & Permissions**, add these **Bot Token Scopes**:
   - `users:read` — list members / resolve who to watch
   - `users:read.email` — optional
   - `im:write` — open a DM
   - `chat:write` — send the nudge
3. Click **Install to Workspace** and copy the **Bot User OAuth Token** (`xoxb-…`).
4. (Optional) Under **App Home** → **Messages Tab**, enable messages so DMs show cleanly.

## 2. Find user IDs (optional)

In Slack: click a profile → ⋮ → **Copy member ID**.  
Or leave `WATCH_USER_IDS` empty to watch every human in the workspace.

## 3. Configure & run

```bash
cd slack-offline-nudge
cp .env.example .env
# edit .env — set SLACK_BOT_TOKEN (and optionally WATCH_USER_IDS)

npm install
npm start
```

Useful knobs in `.env`:

| Variable | Default | Meaning |
|----------|---------|---------|
| `POLL_INTERVAL_MS` | `20000` | How often to check presence |
| `NUDGE_COOLDOWN_MS` | `1800000` | Min gap between nudges to the same person (30m) |
| `NUDGE_MESSAGE` | `any updates?` | DM text |
| `DRY_RUN` | `0` | `1` = log only, don't send |

## Behavior

1. On startup, seeds each user's current presence (no nudge yet).
2. Every poll, if someone was `active` and is now `away`, opens a DM and sends the message.
3. Cooldown prevents spam if they flap active/away.

## Notes

- Rate limits: keep `POLL_INTERVAL_MS` ≥ ~15–20s for small teams; raise it for larger watch lists.
- "Away" includes auto-away (~10 min idle) and manual away — Slack does not expose a finer "inactive" signal to bots.
- Teammates must be able to receive DMs from the app (workspace settings / app install).
