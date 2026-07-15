import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { resolveRuntime, PROJECT_ROOT } from '../src/lib/ldTrack.mjs';

test('LD_AGENTCONTROL_CONFIG=repo forces repo mode', () => {
  process.env.LD_AGENTCONTROL_CONFIG = 'repo';
  delete process.env.LD_AGENTCONTROL_PROVIDER;
  const runtime = resolveRuntime();
  assert.equal(runtime.mode, 'repo');
  assert.equal(runtime.stateDir, path.join(PROJECT_ROOT, '.state'));
  assert.equal(runtime.config.aiConfigKey, 'cursor-agent-usage');
  delete process.env.LD_AGENTCONTROL_CONFIG;
});

test('claude-code provider repo mode uses adapter defaults', () => {
  process.env.LD_AGENTCONTROL_CONFIG = 'repo';
  const runtime = resolveRuntime({ provider: 'claude-code' });
  assert.equal(runtime.mode, 'repo');
  assert.equal(runtime.provider, 'claude-code');
  assert.equal(runtime.config.aiConfigKey, 'claude-code-usage');
  assert.equal(runtime.stateDir, path.join(PROJECT_ROOT, '.state', 'claude-code'));
  delete process.env.LD_AGENTCONTROL_CONFIG;
});

test('explicit user config path wins and carries sdkKey/stateDir', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ldac-'));
  const configPath = path.join(dir, 'ld-agentcontrol.json');
  writeFileSync(
    configPath,
    JSON.stringify({
      aiConfigKey: 'cursor-ide-usage',
      aiConfigVersion: 1,
      providerName: 'cursor',
      models: { 'gpt-5': 'gpt-5' },
      sdkKey: 'sdk-test-123',
      stateDir: path.join(dir, 'state'),
    }),
  );
  process.env.LD_AGENTCONTROL_CONFIG = configPath;
  const runtime = resolveRuntime();
  assert.equal(runtime.mode, 'user');
  assert.equal(runtime.sdkKey, 'sdk-test-123');
  assert.equal(runtime.stateDir, path.join(dir, 'state'));
  delete process.env.LD_AGENTCONTROL_CONFIG;
});

test('user config missing required fields throws (hook falls back safely)', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ldac-'));
  const configPath = path.join(dir, 'broken.json');
  writeFileSync(configPath, JSON.stringify({ sdkKey: 'sdk-x' }));
  process.env.LD_AGENTCONTROL_CONFIG = configPath;
  assert.throws(() => resolveRuntime(), /missing required field/);
  delete process.env.LD_AGENTCONTROL_CONFIG;
});
