#!/usr/bin/env node
// Claude Code hook entrypoint. Register in ~/.claude/settings.json for
// UserPromptSubmit, Stop, and StopFailure. Reads JSON from stdin.
//
// Invariants:
//  - UserPromptSubmit only stamps a start time (no network).
//  - Always exit 0 — a bridge failure must never break Claude Code.
//  - Tokens prefer native Stop.usage; else transcript JSONL delta + watermark.

process.env.LD_AGENTCONTROL_PROVIDER = 'claude-code';

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
import path from 'node:path';

import {
  resolveRuntime,
  resolveVariation,
  buildTrackData,
  userContext,
  createLdTracker,
  AGENT_MODEL_ATTR,
} from '../lib/ldTrack.mjs';
import { applyAgentUsageEvent } from '../lib/agentUsageEvent.mjs';
import { extractClaudeTokens } from '../lib/claudeTranscript.mjs';

const STALE_PENDING_MS = 24 * 60 * 60 * 1000;

let cachedRuntime;
function runtime() {
  if (!cachedRuntime) {
    try {
      cachedRuntime = resolveRuntime({ provider: 'claude-code' });
    } catch (err) {
      cachedRuntime = {
        mode: 'broken',
        error: err,
        config: null,
        stateDir: path.join(
          process.env.HOME || '',
          '.claude',
          'ld-agentcontrol-state',
        ),
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

function sessionId(payload) {
  return payload.session_id ?? payload.sessionId ?? null;
}

function pendingPath(id) {
  return path.join(PENDING_DIR(), `${String(id).replace(/[^A-Za-z0-9_-]/g, '_')}.json`);
}

function handleUserPromptSubmit(payload) {
  const id = sessionId(payload);
  if (id) {
    mkdirSync(PENDING_DIR(), { recursive: true });
    writeFileSync(pendingPath(id), JSON.stringify({ ts: Date.now() }));
  } else {
    logLine(`UserPromptSubmit: no session_id keys=[${Object.keys(payload)}]`);
  }
  // Do not emit JSON that Claude would treat as additionalContext noise.
}

function takePendingTs(id) {
  if (!id) return null;
  const file = pendingPath(id);
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

function modelCandidates(payload, transcriptModel) {
  const flatten = (v) =>
    typeof v === 'string' ? v : v?.id ?? v?.name ?? v?.model ?? undefined;
  return [
    payload.model,
    payload.model_id,
    payload.modelId,
    payload.model_name,
    transcriptModel,
  ]
    .map(flatten)
    .filter((v) => typeof v === 'string' && v.length > 0 && !v.startsWith('<'));
}

async function handleStop(payload, { outcome = 'success' } = {}) {
  const id = sessionId(payload);
  try {
    mkdirSync(runtime().stateDir, { recursive: true });
    writeFileSync(
      path.join(runtime().stateDir, 'last-stop-payload.json'),
      JSON.stringify(payload, null, 2),
    );
  } catch {
    // Best-effort.
  }

  const startTs = takePendingTs(id);
  cleanupStalePending();

  const { config, sdkKey, mode, error, stateDir } = runtime();
  if (!config) {
    logLine(`stop: session=${id} config unavailable (${error?.message}) — skipped`);
    return;
  }
  if (mode === 'user' && !sdkKey && process.env.DRY_RUN !== '1') {
    logLine(`stop: session=${id} no sdkKey in user config — skipped`);
    return;
  }

  const { tokens, model: transcriptModel, source: tokenSource } = extractClaudeTokens(
    payload,
    stateDir,
  );
  const hasTokens = Boolean(tokens);

  const candidates = modelCandidates(payload, transcriptModel);
  const modelName =
    candidates.find((c) => config.models[c] !== undefined) ?? candidates[0] ?? '';
  const variationKey = resolveVariation(config, modelName);
  if (variationKey === null) {
    logLine(
      `stop: session=${id} unmapped model (candidates=${JSON.stringify(candidates)})` +
        ' — skipped; payload saved to last-stop-payload.json',
    );
    return;
  }

  const context = userContext(
    payload.user_email ??
      payload.email ??
      config.hookUserEmail ??
      config.userEmails?.[0] ??
      'unknown',
  );

  const tracker = await createLdTracker({ sdkKey, stateDir });
  const served = await tracker.evaluate(config.aiConfigKey, {
    ...context,
    [AGENT_MODEL_ATTR]: variationKey,
  });
  const meta = served?._ldMeta;
  if (!meta) {
    logLine(`stop: session=${id} evaluation unavailable — post-hoc attribution fallback`);
  }

  const trackData = buildTrackData({
    configKey: config.aiConfigKey,
    variationKey: meta?.variationKey ?? variationKey,
    version: meta?.version ?? config.aiConfigVersion,
    modelName: served?.model?.name || modelName,
    providerName: served?.provider?.name || config.providerName,
    extra: {
      source: 'claude-code-hook',
      conversationId: id ?? undefined,
      claudeReportedModel: modelName,
      tokenSource,
      ...(hasTokens
        ? {
            cacheWriteTokens: tokens.cacheWrite,
            cacheReadTokens: tokens.cacheRead,
          }
        : {}),
    },
  });

  applyAgentUsageEvent(tracker, context, trackData, {
    provider: 'claude-code',
    providerName: trackData.providerName,
    model: modelName,
    userKey: context.key,
    source: 'hook',
    outcome,
    startedAt: startTs ?? undefined,
    endedAt: startTs != null ? Date.now() : undefined,
    tokens: hasTokens ? tokens : undefined,
    conversationId: id ?? undefined,
  });

  await tracker.close();

  const durationMs = startTs != null ? Date.now() - startTs : null;
  logLine(
    `stop: session=${id} model=${modelName} variation=${trackData.variationKey}` +
      ` v${trackData.version} served=${Boolean(meta)} outcome=${outcome}` +
      ` duration=${durationMs ?? 'n/a'}ms` +
      ` tokens=${hasTokens ? `${tokens.input}in/${tokens.output}out(${tokenSource})` : 'n/a'}` +
      ` dryRun=${tracker.dryRun}`,
  );
}

async function main() {
  const raw = await readStdin();
  let payload;
  try {
    payload = JSON.parse(raw || '{}');
  } catch {
    logLine(`unparseable payload: ${String(raw).slice(0, 200)}`);
    return;
  }

  // Ignore Cursor IDE payloads if this script is somehow invoked from
  // ~/.cursor/hooks.json (different event names + cursor_version).
  if (payload.cursor_version != null || payload.composer_mode != null) {
    logLine(`skipping Cursor-shaped payload event=${payload.hook_event_name}`);
    return;
  }

  const eventName = payload.hook_event_name ?? payload.hookEventName ?? payload.event;
  switch (eventName) {
    case 'UserPromptSubmit':
      handleUserPromptSubmit(payload);
      break;
    case 'Stop':
      await handleStop(payload, { outcome: 'success' });
      break;
    case 'StopFailure':
      await handleStop(payload, { outcome: 'error' });
      break;
    default:
      logLine(`unknown hook event "${eventName}" keys=[${Object.keys(payload)}]`);
  }
}

main()
  .catch((err) => logLine(`fatal: ${err.stack ?? err}`))
  .finally(() => process.exit(0));
