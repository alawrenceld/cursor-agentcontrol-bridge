#!/usr/bin/env node
// Create measurement-only AI Config `claude-code-usage` + variations from
// adapters/claude-code/config.defaults.json (or LD_AGENTCONTROL_CONFIG).

import path from 'node:path';
import { loadEnv, loadBridgeConfig, PROJECT_ROOT } from '../src/lib/ldTrack.mjs';

process.env.LD_AGENTCONTROL_PROVIDER = 'claude-code';
loadEnv();

const defaultsPath = path.join(
  PROJECT_ROOT,
  'adapters',
  'claude-code',
  'config.defaults.json',
);
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

async function post(url, body, label) {
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
  console.error(`FAILED ${label}: HTTP ${response.status}\n${text.slice(0, 1000)}`);
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
        'Measurement-only AI Config for Claude Code (cursor-agentcontrol-bridge). ' +
        'Variations break out Monitoring per model; nothing evaluates prompts.',
    },
    `AI Config "${config.aiConfigKey}"`,
  );
  if (!configOk) process.exit(1);
}

const existingVariations = existing.ok
  ? new Set((await existing.json()).variations?.map((v) => v.key) ?? [])
  : new Set();

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
}

if (failures > 0) process.exit(1);
console.log('\nClaude Code AI Config setup complete. Next: npm run sync:claude-models');
