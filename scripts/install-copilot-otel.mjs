#!/usr/bin/env node
// Seed ~/.copilot/ld-agentcontrol.json and print VS Code OTel settings.
// Does not force-write VS Code settings.json (merge carefully by hand or copy).

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULTS = path.join(ROOT, 'adapters', 'copilot', 'config.defaults.json');
const USER_DIR = path.join(os.homedir(), '.copilot');
const USER_CONFIG = path.join(USER_DIR, 'ld-agentcontrol.json');
const USER_STATE = path.join(USER_DIR, 'ld-agentcontrol-state');
const RECEIVER = path.join(ROOT, 'src', 'adapters', 'copilot', 'otlp-receiver.mjs');

mkdirSync(USER_STATE, { recursive: true });

if (!existsSync(USER_CONFIG)) {
  const defaults = JSON.parse(readFileSync(DEFAULTS, 'utf8'));
  // Local-only placeholders — real secrets live in ~/.copilot/ (outside the git repo).
  defaults.sdkKey = defaults.sdkKey || 'sdk-REPLACE_ME';
  defaults.hookUserEmail = defaults.hookUserEmail || 'you@example.com';
  writeFileSync(USER_CONFIG, `${JSON.stringify(defaults, null, 2)}\n`);
  console.log(`✓ created ${USER_CONFIG}`);
  console.log('  Replace sdkKey + hookUserEmail (this file is NOT in the git repo).');
} else {
  console.log(`· config already exists: ${USER_CONFIG}`);
  try {
    const cfg = JSON.parse(readFileSync(USER_CONFIG, 'utf8'));
    let changed = false;
    if (!cfg.sdkKey) {
      cfg.sdkKey = 'sdk-REPLACE_ME';
      changed = true;
    }
    if (!cfg.hookUserEmail) {
      cfg.hookUserEmail = 'you@example.com';
      changed = true;
    }
    if (changed) {
      writeFileSync(USER_CONFIG, `${JSON.stringify(cfg, null, 2)}\n`);
      console.log('  Added missing sdkKey / hookUserEmail placeholders.');
    }
  } catch {
    // leave broken file alone
  }
}

let cfg = {};
try {
  cfg = JSON.parse(readFileSync(USER_CONFIG, 'utf8'));
} catch {
  cfg = {};
}
const host = cfg.otelReceiver?.host || '127.0.0.1';
const port = cfg.otelReceiver?.port || 4319;
const endpoint = `http://${host}:${port}`;

const settingsSnippet = {
  'github.copilot.chat.otel.enabled': true,
  'github.copilot.chat.otel.exporterType': 'otlp-http',
  'github.copilot.chat.otel.otlpEndpoint': endpoint,
};

const snippetPath = path.join(USER_DIR, 'vscode-otel-settings.json');
writeFileSync(snippetPath, `${JSON.stringify(settingsSnippet, null, 2)}\n`);

console.log(`
Next steps:

1. Edit `~/.copilot/ld-agentcontrol.json`
   - hookUserEmail: your email (LD user key / Me filter)
   - sdkKey: leave empty — uses `LD_SDK_KEY` from the repo `.env` (gitignored)

2. Provision LD (Writer token in .env):
   npm run setup:copilot-ai-config
   npm run sync:copilot-models

3. Merge these into VS Code User settings (also written to ${snippetPath}):
${JSON.stringify(settingsSnippet, null, 2)}

4. Start the receiver (keep running while using Copilot Chat):
   npm run copilot:receiver

5. Restart VS Code / reload window, then send a Copilot Chat message.

Verify:
  tail -f ~/.copilot/ld-agentcontrol-state/receiver.log
  tail -5 ~/.copilot/ld-agentcontrol-state/usage-events.jsonl

Receiver entrypoint: ${RECEIVER}
`);
