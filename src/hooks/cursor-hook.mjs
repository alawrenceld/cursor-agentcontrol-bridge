#!/usr/bin/env node
// Cursor hook entrypoint. Register in ~/.cursor/hooks.json for both
// beforeSubmitPrompt and stop (see README). Reads the hook payload JSON from
// stdin and switches on hook_event_name.
//
// Invariants:
//  - beforeSubmitPrompt does no network I/O and must return immediately —
//    it only stamps a start time so `stop` can compute wall-clock duration.
//  - The process ALWAYS exits 0. A bridge failure must never break Cursor.

import {
  readFileSync,
  writeFileSync,
  unlinkSync,
  mkdirSync,
  readdirSync,
  statSync,
  appendFileSync,
  existsSync,
} from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

import {
  PROJECT_ROOT,
  resolveRuntime,
  resolveVariation,
  buildTrackData,
  userContext,
  createLdTracker,
  trackTokens,
  EVENT_KEYS,
} from '../lib/ldTrack.mjs';

const STALE_PENDING_MS = 24 * 60 * 60 * 1000;

// Config/state location is resolved once per invocation; if the user config
// is broken we still stamp/log under the repo state dir rather than dying.
let cachedRuntime;
function runtime() {
  if (!cachedRuntime) {
    try {
      cachedRuntime = resolveRuntime();
    } catch (err) {
      cachedRuntime = {
        mode: 'broken',
        error: err,
        config: null,
        stateDir: path.join(PROJECT_ROOT, '.state'),
        sdkKey: undefined,
      };
    }
  }
  return cachedRuntime;
}

const PENDING_DIR = () => path.join(runtime().stateDir, 'pending');
const LOG_FILE = () => path.join(runtime().stateDir, 'hook.log');

function logLine(message) {
  try {
    mkdirSync(path.dirname(LOG_FILE()), { recursive: true });
    appendFileSync(LOG_FILE(), `${new Date().toISOString()} ${message}\n`);
  } catch {
    // Logging must never take the hook down.
  }
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
  });
}

function conversationId(payload) {
  return (
    payload.conversation_id ??
    payload.conversationId ??
    payload.chat_id ??
    payload.session_id ??
    null
  );
}

function pendingPath(convId) {
  // conversation ids are UUIDs in practice; sanitize anyway.
  return path.join(PENDING_DIR(), `${String(convId).replace(/[^A-Za-z0-9_-]/g, '_')}.json`);
}

function handleBeforeSubmitPrompt(payload) {
  const convId = conversationId(payload);
  if (convId) {
    mkdirSync(PENDING_DIR(), { recursive: true });
    writeFileSync(pendingPath(convId), JSON.stringify({ ts: Date.now() }));
  } else {
    logLine(`beforeSubmitPrompt: no conversation id in payload keys=[${Object.keys(payload)}]`);
  }
  // Never block prompt submission.
  process.stdout.write(JSON.stringify({ continue: true }));
}

function takePendingTs(convId) {
  if (!convId) return null;
  const file = pendingPath(convId);
  if (!existsSync(file)) return null;
  try {
    const { ts } = JSON.parse(readFileSync(file, 'utf8'));
    unlinkSync(file);
    return typeof ts === 'number' ? ts : null;
  } catch {
    return null;
  }
}

function cleanupStalePending() {
  try {
    const cutoff = Date.now() - STALE_PENDING_MS;
    for (const name of readdirSync(PENDING_DIR())) {
      const file = path.join(PENDING_DIR(), name);
      if (statSync(file).mtimeMs < cutoff) unlinkSync(file);
    }
  } catch {
    // Best-effort.
  }
}

// Cursor payloads carry model info in several fields across versions:
// `model` (legacy slug, sometimes a literal "default"), `model_id` (structured),
// `model_name`. Prefer whichever candidate actually maps to a variation.
function modelCandidates(payload) {
  const flatten = (v) =>
    typeof v === 'string' ? v : v?.id ?? v?.name ?? v?.model ?? undefined;
  return [payload.model_id, payload.modelId, payload.model_name, payload.model]
    .map(flatten)
    .filter((v) => typeof v === 'string' && v.length > 0);
}

async function handleStop(payload) {
  const convId = conversationId(payload);

  // Keep the raw payload around — hook schemas are young and this is the
  // fastest way to diagnose field drift (e.g. unexpected model values).
  try {
    mkdirSync(runtime().stateDir, { recursive: true });
    writeFileSync(
      path.join(runtime().stateDir, 'last-stop-payload.json'),
      JSON.stringify(payload, null, 2),
    );
  } catch {
    // Best-effort.
  }
  const startTs = takePendingTs(convId);
  const durationMs = startTs !== null ? Date.now() - startTs : null;
  cleanupStalePending();

  const status = payload.status ?? payload.result ?? 'completed';
  if (status === 'aborted' || status === 'cancelled') {
    logLine(`stop: conv=${convId} status=${status} — skipped (user cancel is not a model error)`);
    return;
  }

  const { config, sdkKey, mode, error } = runtime();
  if (!config) {
    logLine(`stop: conv=${convId} config unavailable (${error?.message}) — skipped`);
    return;
  }
  if (mode === 'user' && !sdkKey && process.env.DRY_RUN !== '1') {
    logLine(`stop: conv=${convId} no sdkKey in user config — skipped (run the Set SDK Key command)`);
    return;
  }

  const candidates = modelCandidates(payload);
  const modelName = candidates.find((c) => config.models[c] !== undefined) ?? candidates[0] ?? '';
  const variationKey = resolveVariation(config, modelName);
  if (variationKey === null) {
    logLine(
      `stop: conv=${convId} unmapped model (candidates=${JSON.stringify(candidates)})` +
        ' and no fallbackVariation — skipped; payload saved to .state/last-stop-payload.json',
    );
    return;
  }

  // Newer Cursor versions (3.7+) include per-run token counts in the stop
  // payload — when present, hooks alone cover tokens and no Admin API poll
  // is needed for this user's runs.
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const tokens = {
    input: num(payload.input_tokens),
    output: num(payload.output_tokens),
    cacheWrite: num(payload.cache_write_tokens),
    cacheRead: num(payload.cache_read_tokens),
  };
  const hasTokens = tokens.input + tokens.output + tokens.cacheWrite + tokens.cacheRead > 0;

  const context = userContext(
    payload.user_email ?? config.hookUserEmail ?? config.userEmails?.[0] ?? 'unknown',
  );

  const tracker = await createLdTracker({ sdkKey });

  // Evaluation-based attribution: hotswap the resolved model into the
  // context; targeting rules (managed by sync-model-library.mjs) make LD
  // serve the matching variation, so events inherit the variation's CURRENT
  // version — which is what the Monitoring tab's cost join is keyed on.
  // Post-hoc attribution remains as the offline/no-rule fallback, but those
  // events only price if the claimed version has a model attached.
  const served = await tracker.evaluate(config.aiConfigKey, {
    ...context,
    cursorModel: variationKey,
  });
  const meta = served?._ldMeta;
  if (!meta) {
    logLine(`stop: conv=${convId} evaluation unavailable — post-hoc attribution fallback`);
  }

  const trackData = buildTrackData({
    configKey: config.aiConfigKey,
    variationKey: meta?.variationKey ?? variationKey,
    version: meta?.version ?? config.aiConfigVersion,
    modelName: served?.model?.name || modelName,
    providerName: served?.provider?.name || config.providerName,
    extra: {
      source: 'cursor-hook',
      conversationId: convId ?? undefined,
      cursorReportedModel: modelName,
      ...(hasTokens
        ? { cacheWriteTokens: tokens.cacheWrite, cacheReadTokens: tokens.cacheRead }
        : {}),
    },
  });
  if (durationMs !== null) {
    tracker.track(EVENT_KEYS.durationTotal, context, trackData, durationMs);
  }
  const eventKey = status === 'error' ? EVENT_KEYS.generationError : EVENT_KEYS.generationSuccess;
  tracker.track(eventKey, context, trackData, 1);
  if (hasTokens) {
    // Same convention as the poller: total includes cache tokens, input/output
    // stay raw so LD's derived cost isn't inflated by cache reads.
    trackTokens(tracker, context, trackData, {
      total: tokens.input + tokens.output + tokens.cacheWrite + tokens.cacheRead,
      input: tokens.input,
      output: tokens.output,
    });
  }
  await tracker.close();

  if (status === 'completed') {
    maybeSpawnJudge(config, payload, trackData, context.key, tracker.dryRun);
  }

  logLine(
    `stop: conv=${convId} model=${modelName} variation=${trackData.variationKey}` +
      ` v${trackData.version} served=${Boolean(meta)} status=${status}` +
      ` duration=${durationMs ?? 'n/a'}ms tokens=${hasTokens ? `${tokens.input}in/${tokens.output}out` : 'n/a'}` +
      ` dryRun=${tracker.dryRun}`,
  );
}

// Spawn the detached judge worker for sampled, completed, real runs.
// Fire-and-forget: the hook must exit immediately either way.
function maybeSpawnJudge(config, payload, trackData, contextKey, dryRun) {
  const judge = config.judge;
  if (!judge?.configKey || judge.enabled === false || dryRun) return;
  if (!payload.transcript_path) return;
  if (Math.random() >= (judge.samplingRate ?? 1)) return;
  try {
    const jobDir = path.join(runtime().stateDir, 'judge-jobs');
    mkdirSync(jobDir, { recursive: true });
    const jobPath = path.join(jobDir, `${trackData.runId}.json`);
    writeFileSync(
      jobPath,
      JSON.stringify({
        conversationId: conversationId(payload),
        transcriptPath: payload.transcript_path,
        workspaceRoot: payload.workspace_roots?.[0],
        contextKey,
        parentTrackData: trackData,
      }),
    );
    // Bundled: judge-worker.js sits next to this script; repo: src/judge/.
    const sibling = path.join(path.dirname(process.argv[1] ?? ''), 'judge-worker.js');
    const workerPath = existsSync(sibling)
      ? sibling
      : path.join(PROJECT_ROOT, 'src', 'judge', 'judge-worker.mjs');
    const child = spawn(process.execPath, [workerPath, jobPath], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    logLine(`judge spawned for run=${trackData.runId} worker=${workerPath}`);
  } catch (err) {
    logLine(`judge spawn failed: ${err.message}`);
  }
}

async function main() {
  // Judge runs execute through the Cursor CLI, which fires these same hooks.
  // Without this guard the judge would be tracked as usage and re-judged.
  if (process.env.LD_AGENTCONTROL_JUDGE === '1') {
    logLine('skipping hook for judge-initiated run');
    return;
  }
  const raw = await readStdin();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    logLine(`unparseable payload: ${raw.slice(0, 200)}`);
    return;
  }

  const eventName = payload.hook_event_name ?? payload.hookEventName ?? payload.event;
  switch (eventName) {
    case 'beforeSubmitPrompt':
      handleBeforeSubmitPrompt(payload);
      break;
    case 'stop':
      await handleStop(payload);
      break;
    default:
      logLine(`unknown hook event "${eventName}" keys=[${Object.keys(payload)}]`);
  }
}

main()
  .catch((err) => logLine(`fatal: ${err.stack ?? err}`))
  .finally(() => process.exit(0));
