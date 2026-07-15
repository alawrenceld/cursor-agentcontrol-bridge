import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAgentUsageEvent,
  toLdTrackCalls,
  applyAgentUsageEvent,
} from '../src/lib/agentUsageEvent.mjs';
import { EVENT_KEYS } from '../src/lib/ldTrack.mjs';

test('normalizeAgentUsageEvent requires provider, userKey, source', () => {
  assert.throws(() => normalizeAgentUsageEvent({ userKey: 'a', source: 'hook' }), /provider/);
  assert.throws(
    () => normalizeAgentUsageEvent({ provider: 'cursor', source: 'hook' }),
    /userKey/,
  );
});

test('toLdTrackCalls skips aborted', () => {
  assert.deepEqual(
    toLdTrackCalls({
      provider: 'cursor',
      model: 'auto',
      userKey: 'a@b.com',
      source: 'hook',
      outcome: 'aborted',
    }),
    [],
  );
});

test('toLdTrackCalls emits duration, success, and tokens', () => {
  const calls = toLdTrackCalls({
    provider: 'claude-code',
    model: 'claude-opus-4-8',
    userKey: 'a@b.com',
    source: 'hook',
    startedAt: 1000,
    endedAt: 2500,
    tokens: { input: 100, output: 20, cacheRead: 50, cacheWrite: 10 },
  });
  assert.deepEqual(
    calls.map((c) => [c.kind, c.eventKey, c.metricValue]),
    [
      ['duration', EVENT_KEYS.durationTotal, 1500],
      ['generation', EVENT_KEYS.generationSuccess, 1],
      ['tokens', EVENT_KEYS.tokensTotal, 180],
    ],
  );
  assert.deepEqual(calls[2].tokens, { total: 180, input: 100, output: 20 });
});

test('toLdTrackCalls maps error outcome', () => {
  const calls = toLdTrackCalls({
    provider: 'claude-code',
    model: 'x',
    userKey: 'a',
    source: 'hook',
    outcome: 'error',
  });
  assert.equal(calls[0].eventKey, EVENT_KEYS.generationError);
});

test('applyAgentUsageEvent tracks via tracker helpers', () => {
  const tracks = [];
  const costs = [];
  const tracker = {
    track: (eventKey, _c, _d, metricValue) => tracks.push([eventKey, metricValue]),
    recordEstimatedCost: (_c, _d, t) => costs.push(t),
  };
  applyAgentUsageEvent(
    tracker,
    { kind: 'user', key: 'a@b.com' },
    { variationKey: 'claude-opus-4-8', configKey: 'claude-code-usage' },
    {
      provider: 'claude-code',
      model: 'claude-opus-4-8',
      userKey: 'a@b.com',
      source: 'hook',
      startedAt: 0,
      endedAt: 100,
      tokens: { input: 10, output: 5 },
    },
  );
  assert.deepEqual(
    tracks.map((t) => t[0]),
    [
      EVENT_KEYS.durationTotal,
      EVENT_KEYS.generationSuccess,
      EVENT_KEYS.tokensTotal,
      EVENT_KEYS.tokensInput,
      EVENT_KEYS.tokensOutput,
    ],
  );
  assert.deepEqual(costs, [{ input: 10, output: 5 }]);
});
