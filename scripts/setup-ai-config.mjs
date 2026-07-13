#!/usr/bin/env node
// Convenience: create the measurement-only AI Config plus one variation per
// entry in bridge.config.json's `models` map, via LaunchDarkly's REST API
// (beta AI Configs endpoints). Idempotent-ish: 409s on existing resources are
// reported and skipped. The same setup can be done in the LD UI or via the
// LaunchDarkly MCP server instead — see README.
//
// Requires LD_API_TOKEN and LD_PROJECT_KEY in the environment or .env.

import { loadEnv, loadBridgeConfig } from '../src/lib/ldTrack.mjs';

loadEnv();
const config = loadBridgeConfig();

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

// Creating an existing config doesn't reliably 409 — check for it first.
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
        'Measurement-only AI Config for Cursor IDE agent activity (cursor-agentcontrol-bridge). ' +
        'Variations exist so the Monitoring tab breaks out per model; nothing evaluates this config.',
    },
    `AI Config "${config.aiConfigKey}"`,
  );
  if (!configOk) process.exit(1);
}

const existingVariations = existing.ok
  ? new Set((await existing.json()).variations?.map((v) => v.key) ?? [])
  : new Set();

let failures = 0;
for (const [modelName, variationKey] of Object.entries(config.models)) {
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

if (failures > 0) {
  console.error(
    `\n${failures} variation(s) failed. The beta AI Configs API schema may have drifted — ` +
      'inspect the response bodies above, or create the variations in the LD UI instead.',
  );
  process.exit(1);
}
console.log('\nAI Config setup complete.');
