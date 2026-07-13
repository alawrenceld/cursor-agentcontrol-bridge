import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveVariation, loadBridgeConfig } from '../src/lib/ldTrack.mjs';

const config = loadBridgeConfig();

test('exact slugs resolve', () => {
  assert.equal(resolveVariation(config, 'claude-sonnet-5'), 'claude-sonnet-5');
  assert.equal(resolveVariation(config, 'gpt-5'), 'gpt-5');
});

test('dot-delimited versions normalize to dashes', () => {
  assert.equal(resolveVariation(config, 'claude-4.5-sonnet'), 'claude-4-5-sonnet');
  assert.equal(resolveVariation(config, 'composer-2.5'), 'composer-2-5');
});

test('reasoning/speed suffixes roll up to the base model', () => {
  // The exact slugs observed live in stop payloads:
  assert.equal(resolveVariation(config, 'claude-sonnet-5-thinking-high'), 'claude-sonnet-5');
  assert.equal(resolveVariation(config, 'gpt-5-4-fast'), 'gpt-5-4');
  assert.equal(resolveVariation(config, 'gpt-5-2-high'), 'gpt-5-2');
  assert.equal(resolveVariation(config, 'claude-opus-4-7-fast'), 'claude-opus-4-7');
  assert.equal(resolveVariation(config, 'gemini-3-pro-low-fast'), 'gemini-3-pro');
  assert.equal(resolveVariation(config, 'grok-4.5-fast-xhigh'), 'grok-4-5-fast');
  assert.equal(resolveVariation(config, 'grok-4.5-xhigh'), 'grok-4-5');
});

test('grandfathered exact entries win before stripping', () => {
  // composer-2.5-fast already has recorded data on its own variation.
  assert.equal(resolveVariation(config, 'composer-2.5-fast'), 'composer-2-5-fast');
});

test('distinct models ending in suffix words stay distinct', () => {
  assert.equal(resolveVariation(config, 'gpt-5-1-codex-max'), 'gpt-5-1-codex-max');
  assert.equal(resolveVariation(config, 'claude-4-sonnet-1m'), 'claude-4-sonnet-1m');
  assert.equal(resolveVariation(config, 'claude-4-sonnet-1m-thinking'), 'claude-4-sonnet-1m');
});

test('default/auto map to the auto variation', () => {
  assert.equal(resolveVariation(config, 'default'), 'auto');
  assert.equal(resolveVariation(config, 'auto'), 'auto');
});

test('unknown models fall through to fallback (null here)', () => {
  assert.equal(resolveVariation(config, 'mystery-model-9000'), null);
  assert.equal(resolveVariation(config, ''), null);
  assert.equal(resolveVariation(config, undefined), null);
});
