# OTLP dual-emit → LaunchDarkly Observability

Agent runs are still written to AI Config **Monitoring** via `$ld:ai:*` `track()`.
In parallel, the same events are dual-emitted as **OTLP/HTTP JSON** so you can build
**per-user** (and per-model) views in LaunchDarkly Observability.

**Me** in the Cursor panel still uses the local usage ledger — this path is for
Reporting / LD UI dashboards.

## What gets sent

| LD track key | OTLP metric | Span |
|--------------|-------------|------|
| `$ld:ai:generation:success` | `agent.generation` (`outcome=success`) | `agent.generation` (OK) |
| `$ld:ai:generation:error` | `agent.generation` (`outcome=error`) | `agent.generation` (ERROR) |
| `$ld:ai:duration:total` | `agent.duration_ms` | — |
| `$ld:ai:tokens:*` | `agent.tokens` (`token_type=…`) | — |
| (on token track) | `agent.cost_usd` (`cost_source=ld_catalog`) | — |

**Cost alignment:** `agent.cost_usd` uses the same Cursor catalog rates as
`npm run sync:models` → LD model library → AI Config Monitoring $ and the
plugin’s ≈$. It is **not** Cursor `chargedCents`. Run `sync:models` so the LD
catalog stays in sync with `src/lib/cursorPricing.mjs`.

Attributes on every datapoint/span:

- `user.email` / `user.id`
- `gen_ai.request.model`, `gen_ai.system` / `provider`
- `variation_key`, `config_key`, `run_id`

Resource attributes:

- `service.name` = `cursor-agentcontrol-bridge`
- `launchdarkly.project_id` = your **server-side SDK key** (binds telemetry to the LD project/environment)

Default endpoint: `https://otel.observability.app.launchdarkly.com:4318`  
(`POST /v1/metrics` and `/v1/traces`)

## Enable / disable

In `~/.cursor/ld-agentcontrol.json` (or `bridge.config.json`):

```json
"otlp": {
  "enabled": true,
  "endpoint": "https://otel.observability.app.launchdarkly.com:4318"
}
```

| Knob | Effect |
|------|--------|
| `otlp.enabled: false` | No OTLP |
| `OTLP_DISABLED=1` | No OTLP (env wins) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Override endpoint (Collector, etc.) |

Requires the same SDK key used for Monitoring `track()`. Fail-soft: OTLP errors never break Cursor hooks.

## Firewall

Allow outbound HTTPS to `otel.observability.app.launchdarkly.com` (ports 4318 or 443).

## Build a user × model view in LD Observability

After a few agent runs with dual-emit enabled:

1. Open LaunchDarkly → **Observability** for the project tied to your SDK key.
2. Create a metrics (or spans) chart:
   - Metric / span name: `agent.generation`
   - Group by: `user.email` and `gen_ai.request.model` (or `variation_key`)
   - Time range: 24h / 7d / 30d as needed
3. Optionally chart `agent.tokens` (sum) and `agent.duration_ms` the same way.
4. For cost that matches Monitoring / the plugin: metric `agent.cost_usd`,
   aggregation **Sum** of `value`, filter `metric_name = agent.cost_usd`
   (and optionally `cost_source = ld_catalog`), group by `user.email` /
   `variation_key`.
5. Save to a dashboard for exec/finance review.

If data doesn’t appear: confirm Observability is enabled for the project, the SDK key matches that environment, and `usage-events.jsonl` / hook.log show runs (write path is healthy).

## Grafana Cloud and other OTLP backends

The bridge posts **OTLP/HTTP JSON** to a single base URL (`/v1/metrics`, `/v1/traces`).
You can retarget that URL for Grafana, a self-hosted Collector, etc.

```json
"otlp": {
  "enabled": true,
  "endpoint": "http://127.0.0.1:4318"
}
```

Or:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318
```

**One destination.** Changing `endpoint` away from LaunchDarkly means LD Observability
stops receiving dual-emit unless something in the path fans out (below).

### Auth and Grafana Cloud

This emitter does **not** add custom OTLP headers (no `Authorization` / Basic auth).
Grafana Cloud’s OTLP gateway expects credentials, so point the bridge at a local
**Grafana Alloy** or **OpenTelemetry Collector** that injects auth and exports
upstream — do not put the Grafana Cloud URL + token in the bridge config.

Recommended shape:

```text
Cursor hook → OTLP/HTTP JSON → Alloy/Collector (localhost)
                              ├─→ LaunchDarkly Observability (keep launchdarkly.project_id)
                              └─→ Grafana Cloud / Prometheus / Tempo / …
```

Requirements for the Collector path:

- Receive **OTLP/HTTP** (JSON); this is not gRPC.
- When exporting to LD, preserve resource attribute `launchdarkly.project_id`
  (the server-side SDK key).
- Failures on a backend should not block the hook (Collector retries separately;
  the bridge already fail-softs on flush errors).

Disable dual-emit entirely with `"otlp": { "enabled": false }` or `OTLP_DISABLED=1`
if you only want Monitoring / the plugin ledger.
