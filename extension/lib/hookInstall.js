// Manage the user's ~/.cursor/hooks.json and ~/.cursor/ld-agentcontrol.json
// so installing the extension is the only setup step. Pure fs/path logic —
// no vscode imports — so it's unit-testable and runnable standalone.

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOOKS_PATH = path.join(os.homedir(), '.cursor', 'hooks.json');
const USER_CONFIG_PATH = path.join(os.homedir(), '.cursor', 'ld-agentcontrol.json');
const HOOK_EVENTS = ['beforeSubmitPrompt', 'stop'];
// Matches any entry this project ever registered (repo-based or bundled),
// so upgrades and repo→extension migration replace rather than duplicate.
const OURS = /cursor-agentcontrol|ld-agentcontrol|cursor-hook/;

/**
 * Compute the next hooks.json content given the desired hook command.
 * Returns { next, changed }. Foreign hooks are preserved untouched.
 */
function mergeHooksJson(existing, hookCommand) {
  const next = existing && typeof existing === 'object' ? structuredClone(existing) : {};
  next.version ??= 1;
  next.hooks = next.hooks && typeof next.hooks === 'object' ? next.hooks : {};
  let changed = false;
  for (const event of HOOK_EVENTS) {
    const entries = Array.isArray(next.hooks[event]) ? next.hooks[event] : [];
    const kept = entries.filter((e) => !OURS.test(e?.command ?? ''));
    const had = entries.find((e) => e?.command === hookCommand);
    next.hooks[event] = [...kept, { command: hookCommand }];
    if (!had || kept.length !== entries.length - 1) changed = true;
  }
  return { next, changed };
}

/**
 * Ensure hooks.json registers the bundled hook. Returns true when the file
 * was modified (caller should suggest a Cursor restart).
 */
function ensureHookRegistered(bundledHookPath, hooksPath = HOOKS_PATH) {
  const hookCommand = `node "${bundledHookPath}"`;
  let existing = null;
  try {
    existing = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
  } catch {
    // Missing or unparseable — start fresh (unparseable is backed up below).
    if (fs.existsSync(hooksPath)) {
      fs.copyFileSync(hooksPath, `${hooksPath}.bak`);
    }
  }
  const { next, changed } = mergeHooksJson(existing, hookCommand);
  if (changed) {
    fs.mkdirSync(path.dirname(hooksPath), { recursive: true });
    fs.writeFileSync(hooksPath, `${JSON.stringify(next, null, 2)}\n`);
  }
  return changed;
}

/**
 * Read the hook's user config; null when missing/unreadable.
 */
function readUserConfig(configPath = USER_CONFIG_PATH) {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Create ~/.cursor/ld-agentcontrol.json from bundled defaults when missing,
 * or shallow-merge updates (e.g. {sdkKey}) into the existing file.
 * Returns the resulting config.
 */
function upsertUserConfig(defaults, updates = {}, configPath = USER_CONFIG_PATH) {
  const current = readUserConfig(configPath) ?? defaults;
  const merged = { ...defaults, ...current, ...updates };
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(merged, null, 2)}\n`);
  return merged;
}

/** One-line setup health summary for the status bar / panel. */
function setupHealth(bundledHookPath, { hooksPath = HOOKS_PATH, configPath = USER_CONFIG_PATH } = {}) {
  const config = readUserConfig(configPath);
  let hookRegistered = false;
  try {
    const hooks = JSON.parse(fs.readFileSync(hooksPath, 'utf8')).hooks ?? {};
    hookRegistered = HOOK_EVENTS.every((event) =>
      (hooks[event] ?? []).some((e) => (e?.command ?? '').includes(bundledHookPath)),
    );
  } catch {
    // treated as not registered
  }
  return {
    hookRegistered,
    configPresent: config !== null,
    sdkKeyPresent: Boolean(config?.sdkKey),
  };
}

module.exports = {
  HOOKS_PATH,
  USER_CONFIG_PATH,
  mergeHooksJson,
  ensureHookRegistered,
  readUserConfig,
  upsertUserConfig,
  setupHealth,
};
