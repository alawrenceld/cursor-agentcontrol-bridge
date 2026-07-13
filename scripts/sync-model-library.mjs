#!/usr/bin/env node
// Sync LaunchDarkly's AI model library with the models Cursor offers, at
// Cursor's billed prices, then point every AI Config variation at its entry.
//
// Cost derivation on the Monitoring tab requires each variation to have a
// model selected (modelConfigKey + model.modelName) whose catalog entry
// carries per-token pricing; events are priced at ingestion, so run this
// BEFORE expecting non-zero costs, and expect pre-existing events to stay $0.
//
// Pricing source: cursor.com/docs/account/pricing (fetched 2026-07-06).
// Cursor is the billing entity, so entries are created under provider
// "Cursor" with Cursor's prices — which sometimes differ from the model
// vendor's list prices (e.g. claude-4-sonnet-1m, claude-opus-4-7 fast mode).

import { loadEnv, loadBridgeConfig } from '../src/lib/ldTrack.mjs';

// variation key → $/M tokens as Cursor bills them. null = no pricing exists
// (dynamic/legacy variations); those are left unlinked deliberately.
const PRICING_PER_M = {
  // Auto bills through its own flat pool regardless of the routed model
  // (docs 2026-07: $1.25/M input+cache-write, $6/M output, $0.25/M cache
  // read). LD model configs only carry input/output rates, so cache reads —
  // often the bulk of agent traffic — are NOT in LD-derived auto cost.
  auto: { in: 1.25, out: 6 },
  composer: null,
  'composer-1': { in: 1.25, out: 10 },
  'composer-1-5': { in: 3.5, out: 17.5 },
  'composer-2': { in: 0.5, out: 2.5 },
  'composer-2-5': { in: 0.5, out: 2.5 },
  // No published price for the 2.5 fast tier; bill as base composer-2.5
  // until Cursor documents it.
  'composer-2-5-fast': { in: 0.5, out: 2.5, catalogId: 'composer-2.5' },
  'claude-4-sonnet': { in: 3, out: 15 },
  'claude-4-sonnet-1m': { in: 6, out: 22.5 },
  'claude-4-5-haiku': { in: 1, out: 5 },
  'claude-4-5-sonnet': { in: 3, out: 15 },
  'claude-4-5-opus': { in: 5, out: 25 },
  'claude-4-6-sonnet': { in: 3, out: 15 },
  'claude-4-6-opus': { in: 5, out: 25 },
  'claude-4-7-opus': { in: 5, out: 25 },
  // Cursor only offers opus-4.7 in fast mode, at fast-mode pricing.
  'claude-opus-4-7': { in: 30, out: 150 },
  'claude-opus-4-8': { in: 5, out: 25 },
  'claude-fable-5': { in: 10, out: 50 },
  // Launch promo pricing through 2026-08-31 (list is 3/15) — update then.
  'claude-sonnet-5': { in: 2, out: 10 },
  'gpt-5': { in: 1.25, out: 10 },
  'gpt-5-mini': { in: 0.25, out: 2 },
  'gpt-5-codex': { in: 1.25, out: 10 },
  'gpt-5-1-codex': { in: 1.25, out: 10 },
  'gpt-5-1-codex-max': { in: 1.25, out: 10 },
  'gpt-5-1-codex-mini': { in: 0.25, out: 2 },
  'gpt-5-2': { in: 1.75, out: 14 },
  'gpt-5-2-codex': { in: 1.75, out: 14 },
  'gpt-5-3-codex': { in: 1.75, out: 14 },
  'gpt-5-4': { in: 2.5, out: 15 },
  'gpt-5-4-mini': { in: 0.75, out: 4.5 },
  'gpt-5-4-nano': { in: 0.2, out: 1.25 },
  'gpt-5-5': { in: 5, out: 30 },
  'gemini-2-5-flash': { in: 0.3, out: 2.5 },
  // Not in Cursor's current price list; Gemini list price.
  'gemini-2-5-pro': { in: 1.25, out: 10 },
  'gemini-3-flash': { in: 0.5, out: 3 },
  'gemini-3-pro': { in: 2, out: 12 },
  'gemini-3-pro-image-preview': { in: 2, out: 12 },
  'gemini-3-1-pro': { in: 2, out: 12 },
  'gemini-3-5-flash': { in: 1.5, out: 9 },
  'grok-4-20': { in: 2, out: 6 },
  'grok-4-3': { in: 1.25, out: 2.5 },
  'grok-4-5': { in: 2, out: 6 },
  // Fast tier priced separately (cursor.com/docs 2026-07-08), like opus-4-7.
  'grok-4-5-fast': { in: 4, out: 18 },
  'grok-build-0-1': { in: 1, out: 2 },
  'glm-5-2': { in: 1.4, out: 4.4 },
  'kimi-k2-7-code': { in: 0.95, out: 4 },
};

loadEnv();
const config = loadBridgeConfig();
const token = process.env.LD_API_TOKEN;
const projectKey = process.env.LD_PROJECT_KEY;
if (!token || !projectKey) {
  console.error('LD_API_TOKEN and LD_PROJECT_KEY are required');
  process.exit(1);
}

const BASE = `https://app.launchdarkly.com/api/v2/projects/${projectKey}/ai-configs`;
const HEADERS = {
  Authorization: token,
  'Content-Type': 'application/json',
  'LD-API-Version': 'beta',
};

async function api(method, path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: response.status, ok: response.ok, json, text };
}

// Index the existing library by id (the model identifier, not the key).
const library = await api('GET', '/model-configs');
if (!library.ok) {
  console.error(`could not list model-configs: ${library.status} ${library.text.slice(0, 300)}`);
  process.exit(1);
}
const entries = Array.isArray(library.json) ? library.json : library.json.items ?? [];
const cursorEntriesById = new Map(
  entries.filter((m) => m.provider === 'Cursor').map((m) => [m.id, m]),
);

const variationKeys = new Set(Object.values(config.models));
let failures = 0;

for (const variationKey of variationKeys) {
  const pricing = PRICING_PER_M[variationKey];
  if (pricing === null) {
    console.log(`~ ${variationKey}: no fixed pricing (dynamic/legacy) — left unlinked`);
    continue;
  }
  if (pricing === undefined) {
    console.error(`! ${variationKey}: not in the pricing table — add it to sync-model-library.mjs`);
    failures += 1;
    continue;
  }

  const catalogId = pricing.catalogId ?? variationKey;
  let entry = cursorEntriesById.get(catalogId);
  if (!entry) {
    const created = await api('POST', '/model-configs', {
      key: `Cursor.${catalogId}`,
      id: catalogId,
      name: catalogId,
      provider: 'Cursor',
      costPerInputToken: pricing.in / 1e6,
      costPerOutputToken: pricing.out / 1e6,
    });
    if (!created.ok) {
      console.error(
        `! ${variationKey}: creating model-config failed ${created.status}: ${created.text.slice(0, 300)}`,
      );
      failures += 1;
      continue;
    }
    entry = created.json;
    cursorEntriesById.set(catalogId, entry);
    console.log(`+ created model-config ${entry.key} ($${pricing.in}/$${pricing.out} per M)`);
  }

  const patched = await api('PATCH', `/${config.aiConfigKey}/variations/${variationKey}`, {
    modelConfigKey: entry.key,
    model: { modelName: entry.id },
  });
  if (!patched.ok) {
    console.error(
      `! ${variationKey}: patch failed ${patched.status}: ${patched.text.slice(0, 300)}`,
    );
    failures += 1;
    continue;
  }
  console.log(`✓ ${variationKey} → ${entry.key}`);
}

// Verify one variation actually holds both fields after patching.
const check = await api('GET', `/${config.aiConfigKey}/variations/claude-sonnet-5`);
const v = check.json?.items?.[0] ?? check.json;
console.log(
  `\nverify claude-sonnet-5: modelConfigKey=${v?.modelConfigKey} model.modelName=${JSON.stringify(v?.model?.modelName)}`,
);

// --- Judge attachment: mirror the LD-native setup so the UI shows the ---
// --- judge on every variation with its sampling rate.                 ---
if (config.judge?.configKey) {
  const judgeConfiguration = {
    judges: [
      { judgeConfigKey: config.judge.configKey, samplingRate: config.judge.samplingRate ?? 1 },
    ],
  };
  let attached = 0;
  for (const variationKey of variationKeys) {
    const patched = await api('PATCH', `/${config.aiConfigKey}/variations/${variationKey}`, {
      judgeConfiguration,
    });
    if (patched.ok) attached += 1;
    else console.error(`! judge attach failed for ${variationKey}: ${patched.status}`);
  }
  console.log(`✓ judge "${config.judge.configKey}" attached to ${attached} variations`);
}

// --- Targeting rules: one per variation, matching the hook's hotswapped ---
// --- `cursorModel` context attribute, so LD *serves* the right variation ---
// --- and events inherit the current variation version (required for the ---
// --- version-sensitive cost join). Fallthrough stays `auto`.            ---
const ENV_KEY = process.env.LD_ENV_KEY ?? 'production';
const targeting = await api('GET', `/${config.aiConfigKey}/targeting?env=${ENV_KEY}`);
if (!targeting.ok) {
  console.error(`could not read targeting: ${targeting.status}`);
  process.exit(1);
}
const flagVariationIdsByKey = new Map(
  (targeting.json.variations ?? []).map((fv) => [fv.value?._ldMeta?.variationKey, fv._id]),
);
const existingRuleValues = new Set(
  (targeting.json.environments?.[ENV_KEY]?.rules ?? []).flatMap((rule) =>
    (rule.clauses ?? [])
      .filter((c) => c.attribute === 'cursorModel')
      .flatMap((c) => c.values),
  ),
);

const instructions = [];
for (const variationKey of variationKeys) {
  if (existingRuleValues.has(variationKey)) continue;
  const variationId = flagVariationIdsByKey.get(variationKey);
  if (!variationId) {
    console.error(`! no flag variation id for "${variationKey}" — rule skipped`);
    failures += 1;
    continue;
  }
  instructions.push({
    kind: 'addRule',
    description: `cursorModel == ${variationKey}`,
    clauses: [
      { contextKind: 'user', attribute: 'cursorModel', op: 'in', values: [variationKey] },
    ],
    variationId,
  });
}
if (instructions.length > 0) {
  const patched = await api('PATCH', `/${config.aiConfigKey}/targeting`, {
    environmentKey: ENV_KEY,
    comment: 'sync-model-library: rule per model variation for evaluation-based attribution',
    instructions,
  });
  if (!patched.ok) {
    console.error(`! targeting patch failed ${patched.status}: ${patched.text.slice(0, 400)}`);
    failures += 1;
  } else {
    console.log(`✓ added ${instructions.length} targeting rules (cursorModel → variation)`);
  }
} else {
  console.log('targeting rules already in sync');
}

process.exit(failures > 0 ? 1 : 0);
