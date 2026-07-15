# AgentUsageEvent — provider-agnostic usage model

Cross-tool comparison (Cursor, Claude Code, Copilot, …) should not invent a second
metrics shape. Every adapter maps into this event, which then feeds:

1. Local usage ledger (`usage-events.jsonl`)
2. LaunchDarkly `$ld:ai:*` track payloads (AI Config Monitoring)
3. Exec report export (`npm run report:export`)

## Schema

```ts
type AgentUsageEvent = {
  provider: 'cursor' | 'claude-code' | 'copilot' | 'continue' | 'aider' | 'cline' | 'otel' | string;
  model: string;
  userKey: string;              // email or stable account id
  startedAt?: number;           // ms epoch
  endedAt?: number;
  outcome?: 'success' | 'error' | 'aborted';
  tokens?: {
    input?: number;
    output?: number;
    total?: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
  costCents?: number;           // billed amount when known (e.g. Cursor chargedCents)
  conversationId?: string;
  source: 'hook' | 'admin_api' | 'cli' | 'otel' | 'proxy';
  // Optional LD attribution
  configKey?: string;
  variationKey?: string;
  runId?: string;
};
```

## Mapping to the ledger / LD track keys

| AgentUsageEvent | Ledger / `$ld:ai:*` |
|-----------------|---------------------|
| `outcome: success` | `$ld:ai:generation:success` |
| `outcome: error` | `$ld:ai:generation:error` |
| `outcome: aborted` | skip generation metrics |
| `endedAt - startedAt` | `$ld:ai:duration:total` |
| `tokens.total/input/output` | `$ld:ai:tokens:*` |
| `provider` / `model` | trackData `providerName` / `modelName` + variation map |
| `userKey` | LD context `{ kind: 'user', key }` |

## Adapter roadmap

| Priority | Tool | Signal | Notes |
|----------|------|--------|-------|
| 1 (done) | Cursor | Hooks + Admin API | Reference adapter in this repo |
| 2 (done) | Claude Code | CLI hooks + transcript deltas | See [claude-code-adapter.md](claude-code-adapter.md) |
| 3 | VS Code Copilot | Extension / LM APIs | Tokens often incomplete |
| 4 | Continue / Aider / Cline | Logs or OpenAI-compatible proxy | Prefer proxy + OTel |
| forever | Generic | OTLP `gen_ai.*` | Best public standard |

## In-repo helpers (v1)

Implemented in [`src/lib/agentUsageEvent.mjs`](../src/lib/agentUsageEvent.mjs):

- `normalizeAgentUsageEvent` / `toLdTrackCalls` / `applyAgentUsageEvent`

Claude Code install: `npm run install:claude-hooks` after `setup:claude-ai-config` + `sync:claude-models`.

## Package extraction (later)

Extract a tiny published package (suggested name `@agentcontrol/usage-core`) containing:

- `AgentUsageEvent` types + validators
- `appendUsageEvent` / `aggregateUsageEvents`
- `toLdTrackCalls(event)` → list of `{ eventKey, metricValue, trackData }`

Keep the Cursor VS Code extension as a thin adapter + Me/All UI. Multi-provider
comparison belongs on the [report UI](../report/index.html), not the Cursor sidebar.

## Reporting contract

Export JSON (`scripts/export-usage-summary.mjs`) dimensions:

- `userKey`, `variationKey` (model), `provider`, time window

Measures: `generationCount`, success/error, `durationMs`, token fields, optional
`costCents` when adapters provide billed cost.
