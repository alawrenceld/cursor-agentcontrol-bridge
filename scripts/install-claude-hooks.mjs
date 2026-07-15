#!/usr/bin/env node
// Idempotently merge AgentControl Claude Code hooks into ~/.claude/settings.json.

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
  rmSync,
} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOOK_SCRIPT = path.join(ROOT, 'src', 'hooks', 'claude-code-hook.mjs');
const SETTINGS_PATH =
  process.env.CLAUDE_SETTINGS_PATH ||
  path.join(os.homedir(), '.claude', 'settings.json');
const CONFIG_DEFAULTS = path.join(ROOT, 'adapters', 'claude-code', 'config.defaults.json');
const USER_CONFIG = path.join(os.homedir(), '.claude', 'ld-agentcontrol.json');

const MARKER = 'claude-code-hook.mjs';

function hookEntry() {
  return {
    type: 'command',
    command: `node ${JSON.stringify(HOOK_SCRIPT)}`,
  };
}

/** Remove our prior entries; keep foreign hooks. */
function filterOurs(entries = []) {
  return entries.filter((group) => {
    const hooks = group.hooks ?? (group.command ? [group] : []);
    // group shape: { hooks: [{ type, command }] } or legacy
    if (Array.isArray(group.hooks)) {
      group.hooks = group.hooks.filter((h) => !String(h.command || '').includes(MARKER));
      return group.hooks.length > 0;
    }
    if (group.command && String(group.command).includes(MARKER)) return false;
    return true;
  });
}

function ensureHookGroup(hooksObj, eventName, entry) {
  const existing = filterOurs(hooksObj[eventName] || []);
  // Claude settings shape: EventName → [ { hooks: [ handler ] } ]
  existing.push({ hooks: [entry] });
  hooksObj[eventName] = existing;
}

mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });

let settings = {};
if (existsSync(SETTINGS_PATH)) {
  try {
    settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
  } catch (err) {
    const bak = `${SETTINGS_PATH}.bak-${Date.now()}`;
    copyFileSync(SETTINGS_PATH, bak);
    console.error(`settings.json unparseable — backed up to ${bak}`);
    settings = {};
  }
}

settings.hooks = settings.hooks && typeof settings.hooks === 'object' ? settings.hooks : {};
const entry = hookEntry();
for (const event of ['UserPromptSubmit', 'Stop', 'StopFailure']) {
  ensureHookGroup(settings.hooks, event, entry);
}

writeFileSync(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`);
console.log(`✓ hooks registered in ${SETTINGS_PATH}`);
console.log(`  command → ${HOOK_SCRIPT}`);

if (!existsSync(USER_CONFIG)) {
  copyFileSync(CONFIG_DEFAULTS, USER_CONFIG);
  console.log(`✓ seeded ${USER_CONFIG} — set sdkKey + hookUserEmail`);
} else {
  console.log(`· config already exists: ${USER_CONFIG}`);
}

// Install /agent-usage skill → ~/.claude/skills/agent-usage
const skillSrc = path.join(ROOT, 'adapters', 'claude-code', 'skills', 'agent-usage');
const skillDest = path.join(os.homedir(), '.claude', 'skills', 'agent-usage');
mkdirSync(skillDest, { recursive: true });
for (const name of ['SKILL.md', 'run.mjs']) {
  copyFileSync(path.join(skillSrc, name), path.join(skillDest, name));
}
writeFileSync(path.join(skillDest, 'bridge-root.txt'), `${ROOT}\n`);
console.log(`✓ skill /agent-usage → ${skillDest}`);

// Remove renamed skill if present
const legacy = path.join(os.homedir(), '.claude', 'skills', 'ld-usage');
if (existsSync(legacy)) {
  try {
    rmSync(legacy, { recursive: true, force: true });
    console.log(`· removed legacy skill ${legacy}`);
  } catch {
    console.log(`· could not remove legacy ${legacy} — delete manually`);
  }
}

console.log('\nNext: edit sdkKey, then npm run setup:claude-ai-config && npm run sync:claude-models');
console.log('Restart Claude Code (new session) so hooks + /agent-usage load.');
console.log('Usage: /agent-usage local | /agent-usage all | npm run agent:usage -- all 7d');
