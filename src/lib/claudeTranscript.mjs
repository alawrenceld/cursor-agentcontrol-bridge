// Parse Claude Code transcript JSONL and return token deltas since a watermark.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/**
 * Extract usage from one transcript row if it is a billable assistant message.
 * @returns {{ uuid: string, model: string, tokens: object } | null}
 */
export function parseAssistantUsage(row) {
  if (!row || row.type !== 'assistant') return null;
  if (row.isSidechain) return null;
  const uuid = row.uuid;
  if (!uuid || typeof uuid !== 'string') return null;
  const message = row.message && typeof row.message === 'object' ? row.message : {};
  const model = message.model ?? row.model;
  if (!model || typeof model !== 'string' || model.startsWith('<')) return null;
  const usage = message.usage ?? row.usage;
  if (!usage || typeof usage !== 'object') return null;
  const tokens = {
    input: num(usage.input_tokens),
    output: num(usage.output_tokens),
    cacheRead: num(usage.cache_read_input_tokens),
    cacheWrite: num(usage.cache_creation_input_tokens),
  };
  if (tokens.input + tokens.output + tokens.cacheRead + tokens.cacheWrite <= 0) {
    return null;
  }
  return { uuid, model, tokens };
}

/**
 * Sum tokens for assistant messages after `seenUuids` (exclusive).
 * Returns aggregated tokens, last model seen, and the new set of UUIDs.
 */
export function deltaTokensFromTranscript(transcriptPath, seenUuids = new Set()) {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return { tokens: null, model: null, newUuids: [], seenUuids };
  }
  let text;
  try {
    text = readFileSync(transcriptPath, 'utf8');
  } catch {
    return { tokens: null, model: null, newUuids: [], seenUuids };
  }

  const nextSeen = new Set(seenUuids);
  const newUuids = [];
  let model = null;
  const agg = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    const parsed = parseAssistantUsage(row);
    if (!parsed) continue;
    if (nextSeen.has(parsed.uuid)) continue;
    nextSeen.add(parsed.uuid);
    newUuids.push(parsed.uuid);
    model = parsed.model;
    agg.input += parsed.tokens.input;
    agg.output += parsed.tokens.output;
    agg.cacheRead += parsed.tokens.cacheRead;
    agg.cacheWrite += parsed.tokens.cacheWrite;
  }

  const has = agg.input + agg.output + agg.cacheRead + agg.cacheWrite > 0;
  return {
    tokens: has ? agg : null,
    model,
    newUuids,
    seenUuids: nextSeen,
  };
}

function watermarkPath(stateDir, sessionId) {
  const safe = String(sessionId).replace(/[^A-Za-z0-9_-]/g, '_');
  return path.join(stateDir, 'transcript-watermarks', `${safe}.json`);
}

export function loadWatermark(stateDir, sessionId) {
  const file = watermarkPath(stateDir, sessionId);
  if (!existsSync(file)) return new Set();
  try {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    return new Set(Array.isArray(data.uuids) ? data.uuids : []);
  } catch {
    return new Set();
  }
}

export function saveWatermark(stateDir, sessionId, seenUuids) {
  const file = watermarkPath(stateDir, sessionId);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ uuids: [...seenUuids], updatedAt: Date.now() }));
}

/**
 * Prefer native Stop payload usage when present; else transcript delta.
 */
export function extractClaudeTokens(payload, stateDir) {
  const sessionId = payload.session_id ?? payload.sessionId;
  const native = payload.usage ?? payload.token_usage ?? payload.tokens;
  if (native && typeof native === 'object') {
    const tokens = {
      input: num(native.input_tokens ?? native.input),
      output: num(native.output_tokens ?? native.output),
      cacheRead: num(
        native.cache_read_input_tokens ?? native.cache_read_tokens ?? native.cacheRead,
      ),
      cacheWrite: num(
        native.cache_creation_input_tokens ??
          native.cache_write_tokens ??
          native.cacheWrite,
      ),
    };
    if (tokens.input + tokens.output + tokens.cacheRead + tokens.cacheWrite > 0) {
      return { tokens, model: null, source: 'payload' };
    }
  }

  if (!sessionId) {
    return { tokens: null, model: null, source: 'none' };
  }

  const seen = loadWatermark(stateDir, sessionId);
  const { tokens, model, seenUuids } = deltaTokensFromTranscript(
    payload.transcript_path,
    seen,
  );
  if (tokens) saveWatermark(stateDir, sessionId, seenUuids);
  return { tokens, model, source: tokens ? 'transcript' : 'none' };
}
