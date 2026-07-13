// Assert that our buildTrackData()/trackTokens() output matches what the real
// @launchdarkly/server-sdk-ai tracker sends, by driving the actual SDK with a
// stub LD client and capturing its track() calls.

import test from 'node:test';
import assert from 'node:assert/strict';

import { initAi } from '@launchdarkly/server-sdk-ai';
import { buildTrackData, trackTokens, EVENT_KEYS } from '../src/lib/ldTrack.mjs';

const CONFIG_KEY = 'cursor-ide-usage';
const VARIATION_KEY = 'claude-4-5-sonnet';
const VERSION = 7;
const MODEL_NAME = 'claude-4.5-sonnet';
const PROVIDER_NAME = 'cursor';
const CONTEXT = { kind: 'user', key: 'user@example.com' };

function stubLdClient(calls) {
  return {
    variation: async () => ({
      _ldMeta: { variationKey: VARIATION_KEY, version: VERSION, enabled: true },
      model: { name: MODEL_NAME },
      provider: { name: PROVIDER_NAME },
      messages: [],
    }),
    track: (eventKey, context, data, metricValue) => {
      // The SDK also emits internal telemetry ($ld:ai:sdk:info,
      // $ld:ai:usage:*) — not Monitoring metrics, so not compared here.
      if (eventKey.startsWith('$ld:ai:sdk:') || eventKey.startsWith('$ld:ai:usage:')) return;
      calls.push({ eventKey, context, data, metricValue });
    },
    logger: undefined,
  };
}

async function sdkTracker(calls) {
  const aiClient = initAi(stubLdClient(calls));
  const config = await aiClient.completionConfig(CONFIG_KEY, CONTEXT, { enabled: true });
  return config.createTracker();
}

test('buildTrackData matches the SDK tracker payload field-for-field', async () => {
  const calls = [];
  const tracker = await sdkTracker(calls);
  tracker.trackSuccess();

  assert.equal(calls.length, 1);
  const sdkData = calls[0].data;

  const ourData = buildTrackData({
    configKey: CONFIG_KEY,
    variationKey: VARIATION_KEY,
    version: VERSION,
    modelName: MODEL_NAME,
    providerName: PROVIDER_NAME,
  });

  // runId is a per-run UUID on both sides; compare everything else exactly,
  // and the key sets (including order-independent presence) in full.
  assert.deepEqual(Object.keys(sdkData).sort(), Object.keys(ourData).sort());
  assert.match(ourData.runId, /^[0-9a-f-]{36}$/);
  const { runId: _a, ...sdkRest } = sdkData;
  const { runId: _b, ...ourRest } = ourData;
  assert.deepEqual(ourRest, sdkRest);
});

test('event keys and metric values match the SDK', async () => {
  const calls = [];
  const tracker = await sdkTracker(calls);
  tracker.trackDuration(1234);
  tracker.trackSuccess();
  tracker.trackTokens({ total: 300, input: 200, output: 100 });

  assert.deepEqual(
    calls.map((c) => [c.eventKey, c.metricValue]),
    [
      [EVENT_KEYS.durationTotal, 1234],
      [EVENT_KEYS.generationSuccess, 1],
      [EVENT_KEYS.tokensTotal, 300],
      [EVENT_KEYS.tokensInput, 200],
      [EVENT_KEYS.tokensOutput, 100],
    ],
  );
  for (const call of calls) assert.deepEqual(call.context, CONTEXT);
});

test('trackError uses the error event key', async () => {
  const calls = [];
  const tracker = await sdkTracker(calls);
  tracker.trackError();
  assert.deepEqual(
    calls.map((c) => [c.eventKey, c.metricValue]),
    [[EVENT_KEYS.generationError, 1]],
  );
});

test('our trackTokens mirrors SDK behavior of skipping zero counts', async () => {
  const sdkCalls = [];
  const tracker = await sdkTracker(sdkCalls);
  tracker.trackTokens({ total: 50, input: 50, output: 0 });

  const ourCalls = [];
  const fakeTracker = {
    track: (eventKey, context, data, metricValue) =>
      ourCalls.push({ eventKey, metricValue }),
  };
  trackTokens(fakeTracker, CONTEXT, {}, { total: 50, input: 50, output: 0 });

  assert.deepEqual(
    ourCalls.map((c) => [c.eventKey, c.metricValue]),
    sdkCalls.map((c) => [c.eventKey, c.metricValue]),
  );
});
