import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { mergeHooksJson, ensureHookRegistered } = require('../extension/lib/hookInstall.js');

const CMD = 'node "/ext/path/hook/cursor-hook.js"';

test('mergeHooksJson creates a fresh hooks file from nothing', () => {
  const { next, changed } = mergeHooksJson(null, CMD);
  assert.equal(changed, true);
  assert.equal(next.version, 1);
  assert.deepEqual(next.hooks.beforeSubmitPrompt, [{ command: CMD }]);
  assert.deepEqual(next.hooks.stop, [{ command: CMD }]);
});

test('mergeHooksJson preserves foreign hooks and replaces our stale entries', () => {
  const existing = {
    version: 1,
    hooks: {
      beforeSubmitPrompt: [
        { command: 'node /somebody/elses/hook.js' },
        { command: 'node /old/checkout/cursor-agentcontrol-bridge/src/hooks/cursor-hook.mjs' },
      ],
      stop: [{ command: 'node "/ext/OLD-VERSION/hook/cursor-hook.js"' }],
      afterFileEdit: [{ command: 'prettier --write' }],
    },
  };
  const { next, changed } = mergeHooksJson(existing, CMD);
  assert.equal(changed, true);
  assert.deepEqual(next.hooks.beforeSubmitPrompt, [
    { command: 'node /somebody/elses/hook.js' },
    { command: CMD },
  ]);
  assert.deepEqual(next.hooks.stop, [{ command: CMD }]);
  assert.deepEqual(next.hooks.afterFileEdit, [{ command: 'prettier --write' }]);
});

test('mergeHooksJson is idempotent', () => {
  const first = mergeHooksJson(null, CMD);
  const second = mergeHooksJson(first.next, CMD);
  assert.equal(second.changed, false);
  assert.deepEqual(second.next, first.next);
});

test('ensureHookRegistered writes and repairs a real file', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hooks-'));
  const hooksPath = path.join(dir, 'hooks.json');
  assert.equal(ensureHookRegistered('/ext/path/hook/cursor-hook.js', hooksPath), true);
  assert.equal(ensureHookRegistered('/ext/path/hook/cursor-hook.js', hooksPath), false);
  // Version upgrade moves the extension path — entry is replaced, not added.
  assert.equal(ensureHookRegistered('/ext/path-0.3.0/hook/cursor-hook.js', hooksPath), true);
  const written = JSON.parse(readFileSync(hooksPath, 'utf8'));
  assert.equal(written.hooks.stop.length, 1);
  assert.match(written.hooks.stop[0].command, /path-0\.3\.0/);
});

test('ensureHookRegistered backs up an unparseable hooks.json', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hooks-'));
  const hooksPath = path.join(dir, 'hooks.json');
  writeFileSync(hooksPath, '{not json');
  assert.equal(ensureHookRegistered('/ext/path/hook/cursor-hook.js', hooksPath), true);
  assert.equal(readFileSync(`${hooksPath}.bak`, 'utf8'), '{not json');
  assert.ok(JSON.parse(readFileSync(hooksPath, 'utf8')).hooks.stop);
});
