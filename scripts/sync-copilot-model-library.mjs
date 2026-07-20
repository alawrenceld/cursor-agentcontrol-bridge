#!/usr/bin/env node
// Sync Copilot catalog prices into LD model library and attach to
// copilot-usage variations. Adds agentModel targeting rules.
// Skips variations already linked; retries 429s with backoff.

import path from 'node:path';
import { loadEnv, loadBridgeConfig, PROJECT_ROOT, AGENT_MODEL_ATTR } from '../src/lib/ldTrack.mjs';
import { PRICING_PER_M } from '../src/lib/copilotPricing.mjs';

process.env.LD_AGENTCONTROL_PROVIDER = 'copilot';
loadEnv();

const defaultsPath = path.join(PROJECT_ROOT, 'adapters', 'copilot', 'config.defaults.json');
const configPath = process.env.LD_AGENTCONTROL_CONFIG || defaultsPath;
const config = loadBridgeConfig(configPath === 'repo' ? defaultsPath : configPath);

const token = process.env.LD_API_TOKEN;
const projectKey = process.env.LD_PROJECT_KEY;
if (!token || !projectKey) {
  console.error('LD_API_TOKEN and LD_PROJECT_KEY are required');
  process.exit(1);
}

const LIBRARY_PROVIDER = 'GitHub';
const BASE = `https://app.launchdarkly.com/api/v2/projects/${projectKey}/ai-configs`;
const HEADERS = {
  Authorization: token,
  'Content-Type': 'application/json',
  'LD-API-Version': 'beta',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, apiPath, body, { retries = 5 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(`${BASE}${apiPath}`, {
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
    if (response.status !== 429 || attempt === retries) {
      return { status: response.status, ok: response.ok, json, text };
    }
    const waitMs = Math.min(60_000, 2000 * 2 ** attempt);
    console.log(`  rate limited — waiting ${Math.round(waitMs / 1000)}s then retry…`);
    await sleep(waitMs);
  }
  return { status: 429, ok: false, json: null, text: 'rate_limited' };
}

const library = await api('GET', '/model-configs');
if (!library.ok) {
  console.error(`could not list model-configs: ${library.status} ${library.text.slice(0, 300)}`);
  process.exit(1);
}
const entries = Array.isArray(library.json) ? library.json : library.json.items ?? [];
const byId = new Map(
  entries.filter((m) => m.provider === LIBRARY_PROVIDER).map((m) => [m.id, m]),
);

const configRes = await api('GET', `/${config.aiConfigKey}`);
if (!configRes.ok) {
  console.error(
    `AI Config "${config.aiConfigKey}" not found — run npm run setup:copilot-ai-config first`,
  );
  process.exit(1);
}
const linkedByKey = new Map(
  (configRes.json.variations ?? []).map((v) => [v.key, v.modelConfigKey ?? null]),
);

const variationKeys = [...new Set(Object.values(config.models))];
let failures = 0;
let skipped = 0;
let linked = 0;

for (const variationKey of variationKeys) {
  const pricing = PRICING_PER_M[variationKey];
  if (pricing === undefined) {
    console.error(`! ${variationKey}: not in src/lib/copilotPricing.mjs — skipped`);
    failures += 1;
    continue;
  }
  if (pricing === null) {
    console.log(`~ ${variationKey}: unpriced — left unlinked`);
    continue;
  }

  const catalogId = pricing.catalogId ?? variationKey;
  const desiredKey = `${LIBRARY_PROVIDER}.${catalogId}`;
  if (linkedByKey.get(variationKey) === desiredKey) {
    console.log(`· ${variationKey} already → ${desiredKey}`);
    skipped += 1;
    continue;
  }

  let entry = byId.get(catalogId);
  if (!entry) {
    await sleep(400);
    const created = await api('POST', '/model-configs', {
      key: desiredKey,
      id: catalogId,
      name: catalogId,
      provider: LIBRARY_PROVIDER,
      costPerInputToken: pricing.in / 1e6,
      costPerOutputToken: pricing.out / 1e6,
    });
    if (!created.ok) {
      console.error(
        `! ${variationKey}: create failed ${created.status}: ${created.text.slice(0, 300)}`,
      );
      failures += 1;
      continue;
    }
    entry = created.json;
    byId.set(catalogId, entry);
    console.log(`+ created model-config ${entry.key} ($${pricing.in}/$${pricing.out} per M)`);
  }

  await sleep(400);
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
  linked += 1;
  linkedByKey.set(variationKey, entry.key);
  console.log(`✓ ${variationKey} → ${entry.key}`);
}

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
      .filter((c) => c.attribute === AGENT_MODEL_ATTR || c.attribute === 'agentModel')
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
    description: `${AGENT_MODEL_ATTR} == ${variationKey}`,
    clauses: [
      {
        contextKind: 'user',
        attribute: AGENT_MODEL_ATTR,
        op: 'in',
        values: [variationKey],
      },
    ],
    variationId,
  });
}
if (instructions.length > 0) {
  const patched = await api('PATCH', `/${config.aiConfigKey}/targeting`, {
    environmentKey: ENV_KEY,
    comment: 'sync-copilot-models: agentModel → variation',
    instructions,
  });
  if (!patched.ok) {
    console.error(`! targeting patch failed ${patched.status}: ${patched.text.slice(0, 400)}`);
    failures += 1;
  } else {
    console.log(`✓ added ${instructions.length} targeting rules (${AGENT_MODEL_ATTR})`);
  }
} else {
  console.log('targeting rules already in sync');
}

console.log(`\ndone: ${linked} linked, ${skipped} already ok, ${failures} failed`);
process.exit(failures > 0 ? 1 : 0);
