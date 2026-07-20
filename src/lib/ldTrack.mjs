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
import { createOtlpEmitter, resolveOtlpConfig } from './otlpEmit.mjs';

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
export const CLAUDE_CONFIG_PATH = path.join(os.homedir(), '.claude', 'ld-agentcontrol.json');
export const CLAUDE_STATE_DIR = path.join(os.homedir(), '.claude', 'ld-agentcontrol-state');
export const COPILOT_CONFIG_PATH = path.join(os.homedir(), '.copilot', 'ld-agentcontrol.json');
export const COPILOT_STATE_DIR = path.join(os.homedir(), '.copilot', 'ld-agentcontrol-state');

/** Context attribute used for evaluation-based variation targeting (both providers). */
export const AGENT_MODEL_ATTR = 'agentModel';

const PROVIDER_DEFAULTS = {
  cursor: {
    id: 'cursor',
    userConfig: USER_CONFIG_PATH,
    userState: USER_STATE_DIR,
    repoConfig: () => path.join(PROJECT_ROOT, 'bridge.config.json'),
    repoState: () => path.join(PROJECT_ROOT, '.state'),
  },
  'claude-code': {
    id: 'claude-code',
    userConfig: CLAUDE_CONFIG_PATH,
    userState: CLAUDE_STATE_DIR,
    repoConfig: () => path.join(PROJECT_ROOT, 'adapters', 'claude-code', 'config.defaults.json'),
    repoState: () => path.join(PROJECT_ROOT, '.state', 'claude-code'),
  },
  copilot: {
    id: 'copilot',
    userConfig: COPILOT_CONFIG_PATH,
    userState: COPILOT_STATE_DIR,
    repoConfig: () => path.join(PROJECT_ROOT, 'adapters', 'copilot', 'config.defaults.json'),
    repoState: () => path.join(PROJECT_ROOT, '.state', 'copilot'),
  },
};

function normalizeProviderId(hint) {
  const raw = hint || 'cursor';
  if (raw === 'claude') return 'claude-code';
  if (PROVIDER_DEFAULTS[raw]) return PROVIDER_DEFAULTS[raw].id;
  return 'cursor';
}

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
 * Resolve where config, state, and the SDK key come from.
 *
 * @param {{ provider?: 'cursor'|'claude-code'|'copilot' }} [opts]
 *   `provider` selects default user-config paths. Also honored via
 *   `LD_AGENTCONTROL_PROVIDER`.
 *
 * - **User mode**: provider-specific `ld-agentcontrol.json` (+ optional `sdkKey` /
 *   `stateDir`). Explicit `LD_AGENTCONTROL_CONFIG=/path` overrides.
 * - **Repo mode**: `LD_AGENTCONTROL_CONFIG=repo` — Cursor uses `bridge.config.json`,
 *   Claude/Copilot use `adapters/<provider>/config.defaults.json`.
 */
export function resolveRuntime({ provider } = {}) {
  const providerId = normalizeProviderId(
    provider || process.env.LD_AGENTCONTROL_PROVIDER || 'cursor',
  );
  const defaults = PROVIDER_DEFAULTS[providerId];
  const defaultUserConfig = defaults.userConfig;
  const defaultUserState = defaults.userState;
  const repoConfigPath = defaults.repoConfig();

  // Always load repo .env so LD_SDK_KEY / tokens are available in user mode too.
  loadEnv();

  const explicit = process.env.LD_AGENTCONTROL_CONFIG;
  if (explicit !== 'repo') {
    const userPath =
      explicit || (existsSync(defaultUserConfig) ? defaultUserConfig : null);
    if (userPath) {
      const config = loadBridgeConfig(userPath);
      const configKey = normalizeSdkKey(config.sdkKey);
      return {
        mode: 'user',
        provider: providerId,
        configPath: userPath,
        config,
        stateDir: config.stateDir ?? defaultUserState,
        sdkKey: configKey || process.env.LD_SDK_KEY,
      };
    }
  }
  return {
    mode: 'repo',
    provider: providerId,
    configPath: repoConfigPath,
    config: loadBridgeConfig(repoConfigPath),
    stateDir: defaults.repoState(),
    sdkKey: process.env.LD_SDK_KEY,
  };
}

/** Empty / placeholder sdkKey values must not shadow LD_SDK_KEY from .env. */
function normalizeSdkKey(value) {
  if (value == null) return '';
  const s = String(value).trim();
  if (!s) return '';
  if (s === 'sdk-REPLACE_ME' || s.startsWith('sdk-REPLACE')) return '';
  if (s === 'sdk-...' || s === 'sdk-YOUR-KEY-HERE') return '';
  return s;
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
  // Resolve state dir / otlp config lazily so callers in repo mode write under `.state/`.
  let resolvedStateDir = stateDir;
  let bridgeConfig = {};
  try {
    const runtime = resolveRuntime();
    resolvedStateDir ??= runtime.stateDir;
    bridgeConfig = runtime.config ?? {};
    sdkKey ??= runtime.sdkKey;
  } catch {
    resolvedStateDir ??= USER_STATE_DIR;
  }

  const otlpOpts = resolveOtlpConfig(bridgeConfig, { sdkKey });
  const otlp = createOtlpEmitter({
    enabled: otlpOpts.enabled,
    endpoint: otlpOpts.endpoint,
    sdkKey,
    dryRun,
  });

  if (dryRun) {
    return {
      dryRun: true,
      track(eventKey, context, data, metricValue) {
        log(`DRY_RUN track ${eventKey}`, JSON.stringify({ context, data, metricValue }));
        recordLedger(eventKey, context, data, metricValue, resolvedStateDir);
        otlp.record(eventKey, context, data, metricValue);
      },
      recordEstimatedCost(context, data, tokens) {
        otlp.recordEstimatedCost(context, data, tokens);
      },
      async evaluate(flagKey, context) {
        log(`DRY_RUN evaluate ${flagKey}`, JSON.stringify(context));
        return null;
      },
      async close({ flushTimeoutMs = 3000 } = {}) {
        await otlp.flush({ timeoutMs: Math.min(2500, flushTimeoutMs) });
      },
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
      otlp.record(eventKey, context, data, metricValue);
    },
    recordEstimatedCost(context, data, tokens) {
      otlp.recordEstimatedCost(context, data, tokens);
    },
    /**
     * Evaluate an AI Config flag so LD serves the variation (targeting rules
     * match `agentModel`, with legacy `cursorModel` still supported). Returns
     * the flag value (with _ldMeta) or null when evaluation isn't possible.
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
      await otlp.flush({ timeoutMs: Math.min(2500, flushTimeoutMs) });
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
  // Catalog estimate for Observability — same $/token as Monitoring after sync:models.
  tracker.recordEstimatedCost?.(context, trackData, { input, output });
}
