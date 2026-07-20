#!/usr/bin/env node
// Create measurement-only AI Config `copilot-usage` + variations from
// adapters/copilot/config.defaults.json (or LD_AGENTCONTROL_CONFIG).
// Retries 429s with backoff; safe to re-run (skips existing variations).

import path from 'node:path';
import { loadEnv, loadBridgeConfig, PROJECT_ROOT } from '../src/lib/ldTrack.mjs';

process.env.LD_AGENTCONTROL_PROVIDER = 'copilot';
loadEnv();

const defaultsPath = path.join(PROJECT_ROOT, 'adapters', 'copilot', 'config.defaults.json');
const configPath = process.env.LD_AGENTCONTROL_CONFIG || defaultsPath;
const config = loadBridgeConfig(configPath === 'repo' ? defaultsPath : configPath);

const token = process.env.LD_API_TOKEN;
const projectKey = process.env.LD_PROJECT_KEY;
if (!token || !projectKey) {
  console.error('LD_API_TOKEN and LD_PROJECT_KEY are required (see .env.example)');
  process.exit(1);
}

const BASE = `https://app.launchdarkly.com/api/v2/projects/${projectKey}/ai-configs`;
const HEADERS = {
  Authorization: token,
  'Content-Type': 'application/json',
  'LD-API-Version': 'beta',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(url, body, label, { retries = 6 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(body),
    });
    const text = await response.text();
    if (response.ok) {
      console.log(`created ${label}`);
      return true;
    }
    if (response.status === 409) {
      console.log(`${label} already exists — skipped`);
      return true;
    }
    if (response.status === 429 && attempt < retries) {
      const waitMs = Math.min(60_000, 2000 * 2 ** attempt);
      console.log(
        `  rate limited on ${label} — waiting ${Math.round(waitMs / 1000)}s then retry…`,
      );
      await sleep(waitMs);
      continue;
    }
    console.error(`FAILED ${label}: HTTP ${response.status}\n${text.slice(0, 1000)}`);
    return false;
  }
  return false;
}

const existing = await fetch(`${BASE}/${config.aiConfigKey}`, { headers: HEADERS });
if (existing.ok) {
  console.log(`AI Config "${config.aiConfigKey}" already exists — skipped`);
} else {
  const configOk = await post(
    BASE,
    {
      key: config.aiConfigKey,
      name: config.aiConfigKey,
      description:
        'Measurement-only AI Config for GitHub Copilot Chat (cursor-agentcontrol-bridge). ' +
        'Ingested via local OTLP receiver from Copilot Chat OTel export.',
    },
    `AI Config "${config.aiConfigKey}"`,
  );
  if (!configOk) process.exit(1);
}

// Always re-fetch so re-runs after a 429 mid-batch skip what's already there.
const configRes = await fetch(`${BASE}/${config.aiConfigKey}`, { headers: HEADERS });
if (!configRes.ok) {
  console.error(`could not read AI Config "${config.aiConfigKey}" after create`);
  process.exit(1);
}
const existingVariations = new Set(
  (await configRes.json()).variations?.map((v) => v.key) ?? [],
);

let failures = 0;
const uniqueVariations = new Map();
for (const [modelName, variationKey] of Object.entries(config.models)) {
  if (!uniqueVariations.has(variationKey)) uniqueVariations.set(variationKey, modelName);
}

for (const [variationKey, modelName] of uniqueVariations) {
  if (existingVariations.has(variationKey)) {
    console.log(`variation "${variationKey}" already exists — skipped`);
    continue;
  }
  const ok = await post(
    `${BASE}/${config.aiConfigKey}/variations`,
    {
      key: variationKey,
      name: variationKey,
      model: { name: modelName },
      provider: { name: config.providerName },
      messages: [],
    },
    `variation "${variationKey}" (model ${modelName})`,
  );
  if (!ok) failures += 1;
  else existingVariations.add(variationKey);
  // Pace creates to stay under LD write limits.
  await sleep(500);
}

if (failures > 0) process.exit(1);
console.log('\nCopilot AI Config setup complete. Next: npm run sync:copilot-models');
