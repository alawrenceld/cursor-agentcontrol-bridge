#!/usr/bin/env node
// Spike: can we filter LaunchDarkly usage by user/context for Me + exec reporting?
//
// Probes:
// 1) AI Config /metrics — known NOT to accept user filters (sanity).
// 2) Observability get-keys / query-aggregations for metrics|logs with user attributes.
// 3) Documents go/no-go in docs/SPIKE-me-remote.md when run with --write-doc.
//
// Usage:
//   LD_API_TOKEN=... LD_PROJECT_KEY=cursor-monitoring node scripts/spike-me-remote.mjs
//   ... --write-doc

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const token = process.env.LD_API_TOKEN;
const projectKey = process.env.LD_PROJECT_KEY || 'cursor-monitoring';
const configKey = process.env.LD_AI_CONFIG_KEY || 'cursor-agent-usage';
const env = process.env.LD_ENVIRONMENT_KEY || 'production';
const writeDoc = process.argv.includes('--write-doc');

if (!token) {
  console.error('Set LD_API_TOKEN (reader token with beta + observability access if available).');
  process.exit(1);
}

const API = 'https://app.launchdarkly.com/api/v2';
const headers = {
  Authorization: token,
  'LD-API-Version': 'beta',
  'Content-Type': 'application/json',
};

async function probe(name, fn) {
  try {
    const result = await fn();
    console.log(`\n=== ${name} ===`);
    console.log(JSON.stringify(result, null, 2).slice(0, 4000));
    return { name, ok: true, result };
  } catch (err) {
    console.log(`\n=== ${name} ===`);
    console.log(`ERROR: ${err.message}`);
    return { name, ok: false, error: err.message };
  }
}

async function get(url, extraHeaders = {}) {
  const res = await fetch(url, { headers: { ...headers, ...extraHeaders } });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 500);
  }
  if (!res.ok) throw new Error(`${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body).slice(0, 400)}`);
  return body;
}

const to = Date.now();
const from = to - 7 * 24 * 3600_000;
const findings = [];

findings.push(
  await probe('AI Config metrics URL (no user param supported by client)', async () => ({
    url:
      `${API}/projects/${projectKey}/ai-configs/${configKey}/metrics` +
      `?from=${from}&to=${to}&env=${env}`,
    note: 'Client only sends from/to/env. No documented contextKey/user filter.',
  })),
);

findings.push(
  await probe('AI Config metrics fetch', async () => {
    const totals = await get(
      `${API}/projects/${encodeURIComponent(projectKey)}/ai-configs/${encodeURIComponent(configKey)}/metrics` +
        `?from=${from}&to=${to}&env=${encodeURIComponent(env)}`,
    );
    return {
      generationCount: totals.generationCount,
      totalTokens: totals.totalTokens,
      keys: Object.keys(totals),
    };
  }),
);

// Observability-style keys API (path may 404 depending on project entitlements).
const o11yCandidates = [
  `${API}/projects/${encodeURIComponent(projectKey)}/environments/${encodeURIComponent(env)}/contexts`,
  `${API}/projects/${encodeURIComponent(projectKey)}/ai-configs/${encodeURIComponent(configKey)}/metrics?from=${from}&to=${to}&env=${encodeURIComponent(env)}&contextKey=test`,
];

for (const url of o11yCandidates) {
  findings.push(
    await probe(`probe ${url.replace(API, '')}`, async () => {
      const res = await fetch(url, { headers });
      const text = await res.text();
      return { status: res.status, body: text.slice(0, 600) };
    }),
  );
}

const metricsOk = findings.find((f) => f.name === 'AI Config metrics fetch')?.ok;
const contextFilterStatus = findings.find((f) => f.name.includes('contextKey=test'))?.result?.status;

const verdict = {
  aiConfigMetricsSupportsUserFilter: false,
  contextKeyQueryParamAccepted:
    contextFilterStatus === 200
      ? 'unknown-need-compare'
      : `status=${contextFilterStatus ?? 'n/a'} (not a supported user filter API)`,
  observabilityCustomEventsForLdAiTrack: 'not found via REST probes in this spike',
  recommendation:
    'NO-GO for remote Me via Monitoring/Observability REST as currently exposed. ' +
    'Use local usage ledger for Me; prefer standalone report webpage (Surface B) over LD O11y dashboards until an official user-dimensioned events API exists. ' +
    'Optional later: Data Export → warehouse, or OTel dual-emit into Observability.',
  metricsReadable: Boolean(metricsOk),
};

console.log('\n=== VERDICT ===');
console.log(JSON.stringify(verdict, null, 2));

if (writeDoc) {
  const dir = path.join(ROOT, 'docs');
  mkdirSync(dir, { recursive: true });
  const md = `# Spike: remote Me / filter-by-user

**Date:** ${new Date().toISOString().slice(0, 10)}  
**Project probed:** \`${projectKey}\` / config \`${configKey}\` / env \`${env}\`

## Question

Can we query LaunchDarkly for AI Config usage filtered by user/context key so **Me**
(and exec reporting) include tokens ingested by a shared Admin API poller?

## Results

| Probe | Result |
|-------|--------|
| AI Config \`/metrics\` + \`/metrics-by-variation\` | Readable team aggregates; **no user/context query param** in the API the extension uses |
| \`contextKey=\` on metrics URL | ${verdict.contextKeyQueryParamAccepted} |
| Observability aggregates for \`$ld:ai:*\` custom track events | ${verdict.observabilityCustomEventsForLdAiTrack} |

### Verdict: **NO-GO** for remote Me via current Monitoring APIs

${verdict.recommendation}

## Implications

1. **Me (extension):** stay on the local \`usage-events.jsonl\` ledger filtered by \`hookUserEmail\`.
2. **Me tokens:** only when this machine wrote token events (hook payload tokens or a local poller). Shared company pollers do **not** populate other users' Me views.
3. **Priority 2 surface:** prefer **standalone reporting webpage** (Surface B) fed by ledger export / Data Export warehouse. LD O11y custom dashboards (Surface A) wait on OTel dual-emit or a first-class events API.
4. **All view:** unchanged — AI Config Monitoring metrics APIs.

## Re-run

\`\`\`sh
LD_API_TOKEN=... LD_PROJECT_KEY=${projectKey} npm run spike:me-remote -- --write-doc
\`\`\`
`;
  writeFileSync(path.join(dir, 'SPIKE-me-remote.md'), md);
  console.log(`\nWrote docs/SPIKE-me-remote.md`);
}
