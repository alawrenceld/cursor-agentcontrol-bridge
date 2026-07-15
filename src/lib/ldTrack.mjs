// Shared LaunchDarkly tracking layer.
//
// The event payloads here must stay byte-for-byte compatible with what
// @launchdarkly/server-sdk-ai's LDAIConfigTrackerImpl.getTrackData() produces —
// that shape is what makes events land on the right AI Config variation in the
// Monitoring tab. test/trackdata.test.mjs asserts this against the real SDK.

import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendUsageEvent } from './usageLedger.mjs';

// import.meta.url is empty when esbuild bundles this to CJS for the
// extension; there __dirname exists instead (and PROJECT_ROOT only matters
// for repo mode anyway — the bundled hook runs in user-config mode).
const moduleDir = (() => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    // eslint-disable-next-line no-undef
    return typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  }
})();

export const PROJECT_ROOT = path.resolve(moduleDir, '..', '..');

export const USER_CONFIG_PATH = path.join(os.homedir(), '.cursor', 'ld-agentcontrol.json');
export const USER_STATE_DIR = path.join(os.homedir(), '.cursor', 'ld-agentcontrol-state');

export const EVENT_KEYS = {
  durationTotal: '$ld:ai:duration:total',
  tokensTtf: '$ld:ai:tokens:ttf',
  tokensTotal: '$ld:ai:tokens:total',
  tokensInput: '$ld:ai:tokens:input',
  tokensOutput: '$ld:ai:tokens:output',
  generationSuccess: '$ld:ai:generation:success',
  generationError: '$ld:ai:generation:error',
  feedbackPositive: '$ld:ai:feedback:user:positive',
  feedbackNegative: '$ld:ai:feedback:user:negative',
  toolCall: '$ld:ai:tool_call',
};

/**
 * Minimal .env loader (avoids a dotenv dependency). Existing process.env
 * values win over file values.
 */
export function loadEnv(envPath = path.join(PROJECT_ROOT, '.env')) {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
  }
}

export function loadBridgeConfig(configPath = path.join(PROJECT_ROOT, 'bridge.config.json')) {
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  for (const field of ['aiConfigKey', 'aiConfigVersion', 'providerName', 'models']) {
    if (config[field] === undefined) {
      throw new Error(`${path.basename(configPath)} is missing required field "${field}"`);
    }
  }
  return config;
}

/**
 * Resolve where config, state, and the SDK key come from. Two modes:
 *
 * - **User mode** (extension-managed all-in-one): `~/.cursor/ld-agentcontrol.json`
 *   holds the bridge config plus `sdkKey` (and optional `stateDir`), so the
 *   hook works standalone with no checkout of this repo. An explicit path in
 *   `LD_AGENTCONTROL_CONFIG` overrides the default location.
 * - **Repo mode**: bridge.config.json + .env in this checkout, state under
 *   `.state/`. Forced with `LD_AGENTCONTROL_CONFIG=repo` (used by tests so a
 *   developer's user config never leaks into fixtures).
 */
export function resolveRuntime() {
  const explicit = process.env.LD_AGENTCONTROL_CONFIG;
  if (explicit !== 'repo') {
    const userPath = explicit || (existsSync(USER_CONFIG_PATH) ? USER_CONFIG_PATH : null);
    if (userPath) {
      const config = loadBridgeConfig(userPath);
      return {
        mode: 'user',
        configPath: userPath,
        config,
        stateDir: config.stateDir ?? USER_STATE_DIR,
        sdkKey: config.sdkKey ?? process.env.LD_SDK_KEY,
      };
    }
  }
  loadEnv();
  return {
    mode: 'repo',
    configPath: path.join(PROJECT_ROOT, 'bridge.config.json'),
    config: loadBridgeConfig(),
    stateDir: path.join(PROJECT_ROOT, '.state'),
    sdkKey: process.env.LD_SDK_KEY,
  };
}

/**
 * Map a Cursor-reported model string to an AI Config variation key.
 *
 * Cursor slugs are compositional and inconsistently delimited across model
 * families ("composer-2.5-fast", "claude-sonnet-5-thinking-high"), so after
 * an exact match we normalize dots to dashes and peel reasoning/speed
 * suffixes one at a time until a mapped base model appears. Distinct models
 * that happen to end in a suffix word (gpt-5-1-codex-max, claude-4-sonnet-1m)
 * are safe as long as they're in the map — exact match wins before stripping.
 *
 * Returns null when nothing matches and no fallback is configured — callers
 * should skip (and log) rather than mis-attribute.
 */
const VARIANT_SUFFIXES = /-(thinking|xhigh|high|medium|low|max|fast)$/;

export function resolveVariation(config, modelName) {
  if (!modelName) return config.fallbackVariation ?? null;
  if (config.models[modelName] !== undefined) return config.models[modelName];
  let name = String(modelName).toLowerCase().replaceAll('.', '-');
  for (;;) {
    if (config.models[name] !== undefined) return config.models[name];
    const match = name.match(VARIANT_SUFFIXES);
    if (!match) return config.fallbackVariation ?? null;
    name = name.slice(0, -match[0].length);
  }
}

/**
 * Mirror of LDAIConfigTrackerImpl.getTrackData() (server-sdk-ai 1.1.1):
 *   { runId, configKey, variationKey, version, modelName, providerName }
 * `extra` fields (e.g. chargedCents, cache token counts, toolKey) are merged
 * on top, matching how the SDK extends the base payload for tool calls.
 */
export function buildTrackData({
  runId = randomUUID(),
  configKey,
  variationKey,
  version,
  modelName,
  providerName,
  extra = {},
}) {
  return {
    runId,
    configKey,
    variationKey,
    version,
    modelName,
    providerName,
    ...extra,
  };
}

export function userContext(email) {
  return { kind: 'user', key: email };
}

function log(...parts) {
  process.stderr.write(`[ldTrack] ${parts.join(' ')}\n`);
}

/**
 * Create a tracking handle. In dry-run mode (DRY_RUN=1 or {dryRun: true})
 * events are logged to stderr and nothing touches the network.
 *
 * Usage: const t = await createLdTracker(); t.track(...); await t.close();
 */
function recordLedger(eventKey, context, data, metricValue, stateDir) {
  const {
    configKey,
    variationKey,
    modelName,
    providerName,
    runId,
    version,
    ...extras
  } = data && typeof data === 'object' ? data : {};
  appendUsageEvent(
    {
      userKey: context?.key,
      configKey,
      variationKey,
      modelName,
      providerName,
      eventKey,
      metricValue,
      extras: { runId, version, ...extras },
    },
    stateDir,
  );
}

export async function createLdTracker({
  dryRun = process.env.DRY_RUN === '1',
  sdkKey = process.env.LD_SDK_KEY,
  stateDir = null,
} = {}) {
  // Resolve state dir lazily so callers in repo mode write under `.state/`.
  const resolvedStateDir =
    stateDir ??
    (() => {
      try {
        return resolveRuntime().stateDir;
      } catch {
        return USER_STATE_DIR;
      }
    })();

  if (dryRun) {
    return {
      dryRun: true,
      track(eventKey, context, data, metricValue) {
        log(`DRY_RUN track ${eventKey}`, JSON.stringify({ context, data, metricValue }));
        recordLedger(eventKey, context, data, metricValue, resolvedStateDir);
      },
      async evaluate(flagKey, context) {
        log(`DRY_RUN evaluate ${flagKey}`, JSON.stringify(context));
        return null;
      },
      async close() {},
    };
  }

  if (!sdkKey) throw new Error('no LD SDK key configured (and DRY_RUN is not enabled)');

  const { init } = await import('@launchdarkly/node-server-sdk');
  const client = init(sdkKey, {
    stream: false,
    diagnosticOptOut: true,
    logger: { error: log, warn: log, info: () => {}, debug: () => {} },
  });

  // track() does not require flag data; if initialization (a polling fetch)
  // fails or is slow, events still deliver on flush. Don't block on it —
  // but remember whether it succeeded, since evaluate() does need flag data.
  let initialized = true;
  try {
    await client.waitForInitialization({ timeout: 5 });
  } catch {
    initialized = false;
    log('client initialization timed out/failed; proceeding (events still flush)');
  }

  return {
    dryRun: false,
    track(eventKey, context, data, metricValue) {
      client.track(eventKey, context, data, metricValue);
      recordLedger(eventKey, context, data, metricValue, resolvedStateDir);
    },
    /**
     * Evaluate an AI Config flag so LD serves the variation (targeting rules
     * match the context's `cursorModel` attribute). Returns the flag value
     * (with _ldMeta) or null when evaluation isn't possible — callers fall
     * back to post-hoc attribution.
     */
    async evaluate(flagKey, context) {
      if (!initialized) return null;
      try {
        const value = await client.variation(flagKey, context, null);
        return value?._ldMeta?.variationKey ? value : null;
      } catch (err) {
        log(`evaluate failed: ${err.message}`);
        return null;
      }
    },
    async close({ flushTimeoutMs = 3000 } = {}) {
      try {
        await Promise.race([
          client.flush(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('flush timeout')), flushTimeoutMs).unref?.(),
          ),
        ]);
      } catch (err) {
        log(`flush failed: ${err.message}`);
      }
      client.close();
    },
  };
}

/**
 * Emit token events for one generation, mirroring trackTokens(): each of
 * total/input/output is only sent when > 0, all sharing one trackData object.
 */
export function trackTokens(tracker, context, trackData, { total, input, output }) {
  if (total > 0) tracker.track(EVENT_KEYS.tokensTotal, context, trackData, total);
  if (input > 0) tracker.track(EVENT_KEYS.tokensInput, context, trackData, input);
  if (output > 0) tracker.track(EVENT_KEYS.tokensOutput, context, trackData, output);
}
