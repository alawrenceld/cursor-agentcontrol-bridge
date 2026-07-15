# Installing AgentControl Metrics

Records Cursor agent runs into LaunchDarkly and shows usage in the IDE:

| View | Data source | Needs |
|------|-------------|--------|
| **All** | LD AI Config Monitoring (team) | Reader **API token** + **project key** in Settings |
| **Me** | Local `usage-events.jsonl` ledger | **SDK key** + **your email** |
| **Observability** (per-user charts in LD UI) | OTLP dual-emit | Same **SDK key** + Observability enabled on the project |

Most people should install the **extension** (below). The root [README.md](README.md) covers optional repo-mode hooks + Admin API poller.

---

## LaunchDarkly credentials (what each one is)

Create these in your own LD account / project (do not share SDK keys across orgs).

| Credential | Where in LD | What it’s for |
|------------|-------------|----------------|
| **Project key** | Project settings (e.g. `cursor-monitoring`) | Settings → `ldAgentControl.projectKey` — **All** panel API calls |
| **Environment key** | Environments (usually `production`) | Settings → `ldAgentControl.environmentKey` |
| **AI Config key** | AI Configs (default `cursor-agent-usage`) | Settings → `ldAgentControl.configKey` + hook `aiConfigKey` |
| **Server-side SDK key** | Project → Environments → … → SDK key | **Records** runs (Monitoring `track` + OTLP). Command: **Set LaunchDarkly SDK Key**. Stored in `~/.cursor/ld-agentcontrol.json` |
| **API access token (Reader)** | Account settings → Authorization | **Reads** Monitoring metrics for **All**. Command: **Set LaunchDarkly API Token**. Stored in IDE SecretStorage |
| **Your email** | — | LD user context + **Me** filter. Command: **Set Your Email** → `hookUserEmail` |

### Provision the AI Config (once per project)

Measurement-only: nothing evaluates this config; variations exist so Monitoring breaks out **by model**. Scripts use `bridge.config.json`’s `models` map.

```sh
cd /path/to/cursor-agentcontrol-bridge
cp -n .env.example .env   # if needed
# .env needs:
#   LD_API_TOKEN=...   # Writer (or Admin) API access token — NOT the Reader token for the panel
#   LD_PROJECT_KEY=... # same project key as Settings → projectKey

npm run setup:ai-config   # creates AI Config + missing variations (idempotent; 409 = skip)
npm run sync:models       # recommended: link Cursor prices in LD model library (costs stay $0 until this runs)
```

| Script | Up to date? | What it does |
|--------|-------------|----------------|
| `npm run setup:ai-config` → [`scripts/setup-ai-config.mjs`](scripts/setup-ai-config.mjs) | **Yes** for Monitoring / All / Me | Creates `cursor-agent-usage` + one variation per unique key in `models` |
| `npm run sync:models` → [`scripts/sync-model-library.mjs`](scripts/sync-model-library.mjs) | **Yes** for estimated $ in Monitoring | Creates/links `Cursor.*` model-library entries and attaches them to variations |

These scripts do **not** need changes for OTLP or the Me ledger (those reuse the same SDK key + email and don’t add AI Config resources). They also don’t create the optional `cursor-output-judge` config used for Quality scores — that stays a separate / existing setup if you use judging.

Or create the AI Config by hand: LD UI → AI Configs → New → key `cursor-agent-usage` → one variation per model (provider `cursor`).

Also optional: enable **Observability** on the project for per-user OTLP charts ([docs/OTLP-DUAL-EMIT.md](docs/OTLP-DUAL-EMIT.md)).

**Not** the same as:

- Cursor **Admin API** key — only for the optional Teams+ token poller (repo mode).
- Client-side / mobile SDK keys — use a **server-side** SDK key.

---

## Install steps

1. **Package / install the VSIX** (from this repo):

   ```sh
   npm run build:hook
   cd extension && npm install
   ./node_modules/.bin/vsce package --allow-missing-repository
   cursor --install-extension cursor-agentcontrol-metrics-*.vsix
   ```

   Or Command Palette → **Extensions: Install from VSIX…**.

2. **Uninstall older AgentControl builds** (other publishers/versions). They overwrite `~/.cursor/hooks.json` and break **Me** / OTLP.

3. **Fully quit and reopen Cursor.** Hooks only load at startup. On activate, the extension registers  
   `~/.cursor/hooks.json` → this build’s `hook/cursor-hook.js` and seeds `~/.cursor/ld-agentcontrol.json` if missing.

4. **Settings → AgentControl Metrics**

   | Setting | Example |
   |---------|---------|
   | `ldAgentControl.projectKey` | your LD project key |
   | `ldAgentControl.configKey` | `cursor-agent-usage` |
   | `ldAgentControl.environmentKey` | `production` |

5. Command Palette → **AgentControl: Set LaunchDarkly SDK Key** → server-side SDK key for that project/environment.

6. Command Palette → **AgentControl: Set Your Email** → the email you want on events / Me (e.g. work email).

7. Optional — **AgentControl: Set LaunchDarkly API Token** → Reader token for the **All** view.

8. Optional — OTLP is **on by default** once an SDK key is set. To disable:

   ```json
   "otlp": { "enabled": false }
   ```

   in `~/.cursor/ld-agentcontrol.json`, or set `OTLP_DISABLED=1`.
   To send elsewhere (Grafana, Collector) or fan out, set `otlp.endpoint` /
   `OTEL_EXPORTER_OTLP_ENDPOINT` — see [docs/OTLP-DUAL-EMIT.md](docs/OTLP-DUAL-EMIT.md)
   (no custom auth headers in the bridge; use Alloy/Collector for Grafana Cloud).

---

## Verify (one agent prompt)

1. Run any short agent generation in Cursor.

2. Hook log (write path):

   ```sh
   tail -20 ~/.cursor/ld-agentcontrol-state/hook.log
   ```

   Look for `stop: … served=true` and a `judge-worker` path under **this** extension version (e.g. `alawrenceld.cursor-agentcontrol-metrics-0.4.2`).

3. **Me** ledger:

   ```sh
   wc -l ~/.cursor/ld-agentcontrol-state/usage-events.jsonl
   tail -5 ~/.cursor/ld-agentcontrol-state/usage-events.jsonl
   ```

   Lines should include your `hookUserEmail`. Sidebar → **Me** should show gens > 0 for a recent range.

4. **All** — with Reader API token + project key set, sidebar → **All** should match the AI Config **Monitoring** tab in LD (team totals).

5. **Observability** — if the product is enabled on the project, charts on `agent.generation` / `agent.cost_usd` grouped by `user.email` (see [docs/OTLP-DUAL-EMIT.md](docs/OTLP-DUAL-EMIT.md)). Costs use the same catalog as Monitoring after `sync:models`. Allow outbound HTTPS to `otel.observability.app.launchdarkly.com`.

### Common failures

| Symptom | Likely cause |
|---------|----------------|
| All works, Me = 0 | Hooks still on an old extension; uninstall old builds and restart |
| Me works, All empty / “set projectKey” | Missing Settings `projectKey` or Reader API token |
| Nothing in Monitoring | Wrong/missing SDK key, or AI Config / variations not set up |
| `unmapped model … skipped` | Add the Cursor model string to `models` in `ld-agentcontrol.json` (+ create variation) |
| OTLP / Observability empty | Observability not enabled on the project, or firewall blocking OTLP endpoint |
