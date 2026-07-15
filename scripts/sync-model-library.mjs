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
import { PRICING_PER_M } from '../src/lib/cursorPricing.mjs';

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
    console.error(`! ${variationKey}: not in the pricing table — add it to src/lib/cursorPricing.mjs`);
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
