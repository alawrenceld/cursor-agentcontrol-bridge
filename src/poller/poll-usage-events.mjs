#!/usr/bin/env node
// Poll the Cursor Admin API for usage events and emit LaunchDarkly token
// metrics per event. Requires a Teams/Business/Enterprise admin key.
//
//   node src/poller/poll-usage-events.mjs [--dry-run] [--since <date>] [--loop]
//
// State (.state/poller-state.json) tracks the last-seen timestamp and hashes
// of already-emitted events; each poll re-fetches a 2h overlap window behind
// the last-seen point so hourly-batched events that land late aren't missed,
// with the hash set preventing double-counting inside the overlap.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

import {
  PROJECT_ROOT,
  EVENT_KEYS,
  loadEnv,
  loadBridgeConfig,
  resolveVariation,
  buildTrackData,
  userContext,
  createLdTracker,
  trackTokens,
} from '../lib/ldTrack.mjs';

const API_URL = 'https://api.cursor.com/teams/filtered-usage-events';
const STATE_FILE = path.join(PROJECT_ROOT, '.state', 'poller-state.json');
const OVERLAP_MS = 2 * 60 * 60 * 1000;
const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const LOOP_INTERVAL_MS = 60 * 60 * 1000;
const PAGE_SIZE = 100;
const MAX_PAGES = 200;

export function parseArgs(argv) {
  const args = { dryRun: false, loop: false, since: null };
  for (let i = 0; i < argv.length; i += 1) {
    switch (argv[i]) {
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--loop':
        args.loop = true;
        break;
      case '--since': {
        i += 1;
        const parsed = Date.parse(argv[i]);
        if (Number.isNaN(parsed)) {
          console.error(`--since: cannot parse date "${argv[i]}"`);
          process.exit(1);
        }
        args.since = parsed;
        break;
      }
      default:
        console.error(`unknown argument "${argv[i]}"`);
        process.exit(1);
    }
  }
  return args;
}

function loadState() {
  if (!existsSync(STATE_FILE)) return { lastSeenTs: null, seenHashes: {} };
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    console.error('poller-state.json unreadable; starting fresh');
    return { lastSeenTs: null, seenHashes: {} };
  }
}

function saveState(state) {
  mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function eventHash(event, tokens) {
  return createHash('sha256')
    .update(
      JSON.stringify([
        event.timestamp,
        event.userEmail ?? event.email,
        event.model,
        event.kind,
        tokens.input,
        tokens.output,
        tokens.cacheWrite,
        tokens.cacheRead,
      ]),
    )
    .digest('hex');
}

// Field names verified against the live API on first --dry-run (docs vs.
// reality drift is a known risk); unknown shapes are logged, not guessed at.
export function extractTokens(event) {
  const usage = event.tokenUsage;
  if (!usage || typeof usage !== 'object') return null;
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  return {
    input: num(usage.inputTokens),
    output: num(usage.outputTokens),
    cacheWrite: num(usage.cacheWriteTokens),
    cacheRead: num(usage.cacheReadTokens),
    totalCents: typeof usage.totalCents === 'number' ? usage.totalCents : undefined,
  };
}

function eventTimestampMs(event) {
  // Observed as an epoch-ms value, sometimes stringified.
  const ts = Number(event.timestamp);
  return Number.isFinite(ts) && ts > 0 ? ts : null;
}

export async function fetchUsageEvents({ adminKey, startDate, endDate }) {
  const auth = Buffer.from(`${adminKey}:`).toString('base64');
  const events = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startDate, endDate, page, pageSize: PAGE_SIZE }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Cursor Admin API ${response.status}: ${body.slice(0, 500)}`);
    }
    const data = await response.json();
    const pageEvents = data.usageEvents ?? data.events ?? [];
    if (!Array.isArray(pageEvents)) {
      throw new Error(`unexpected response shape, keys=[${Object.keys(data)}]`);
    }
    events.push(...pageEvents);
    const numPages = data.pagination?.numPages;
    const done = numPages !== undefined ? page >= numPages : pageEvents.length < PAGE_SIZE;
    if (done) return events;
  }
  console.error(`hit MAX_PAGES=${MAX_PAGES}; window too large, narrowing recommended`);
  return events;
}

export async function pollOnce({ dryRun, since }) {
  loadEnv();
  const config = loadBridgeConfig();
  const adminKey = process.env.CURSOR_ADMIN_KEY;
  if (!adminKey) throw new Error('CURSOR_ADMIN_KEY is not set');

  const state = loadState();
  const now = Date.now();
  const baseline = since ?? state.lastSeenTs ?? now - DEFAULT_LOOKBACK_MS;
  const startDate = Math.max(0, baseline - OVERLAP_MS);

  console.error(
    `polling ${new Date(startDate).toISOString()} → ${new Date(now).toISOString()}` +
      `${dryRun ? ' (dry run)' : ''}`,
  );
  const events = await fetchUsageEvents({ adminKey, startDate, endDate: now });
  console.error(`fetched ${events.length} usage events`);

  const emailAllowlist =
    Array.isArray(config.userEmails) && config.userEmails.length > 0
      ? new Set(config.userEmails.map((e) => e.toLowerCase()))
      : null;

  const tracker = await createLdTracker({ dryRun: dryRun || process.env.DRY_RUN === '1' });
  const stats = { emitted: 0, deduped: 0, filtered: 0, unmappedModel: 0, noTokens: 0 };
  let maxTs = state.lastSeenTs ?? 0;
  const freshHashes = {};

  for (const event of events) {
    const ts = eventTimestampMs(event);
    if (ts !== null) maxTs = Math.max(maxTs, ts);

    const email = (event.userEmail ?? event.email ?? '').toLowerCase();
    if (emailAllowlist && !emailAllowlist.has(email)) {
      stats.filtered += 1;
      continue;
    }

    const tokens = extractTokens(event);
    if (!tokens) {
      stats.noTokens += 1;
      console.error(`no tokenUsage on event kind=${event.kind} model=${event.model} — skipped`);
      continue;
    }

    const hash = eventHash(event, tokens);
    if (state.seenHashes[hash] !== undefined || freshHashes[hash] !== undefined) {
      stats.deduped += 1;
      freshHashes[hash] = state.seenHashes[hash] ?? freshHashes[hash];
      continue;
    }

    const modelName = event.model ?? '';
    const variationKey = resolveVariation(config, modelName);
    if (variationKey === null) {
      stats.unmappedModel += 1;
      console.error(`unmapped model "${modelName}" and no fallbackVariation — skipped`);
      freshHashes[hash] = ts ?? now;
      continue;
    }

    const context = userContext(email || 'unknown');
    const trackData = buildTrackData({
      configKey: config.aiConfigKey,
      variationKey,
      version: config.aiConfigVersion,
      modelName,
      providerName: config.providerName,
      extra: {
        source: 'cursor-admin-api',
        kind: event.kind,
        cacheWriteTokens: tokens.cacheWrite,
        cacheReadTokens: tokens.cacheRead,
        ...(tokens.totalCents !== undefined ? { totalCents: tokens.totalCents } : {}),
        ...(typeof event.chargedCents === 'number' ? { chargedCents: event.chargedCents } : {}),
      },
    });

    // input/output feed LD's derived cost; cache counts ride along as data
    // fields only. total reflects all tokens processed, cache included.
    trackTokens(tracker, context, trackData, {
      total: tokens.input + tokens.output + tokens.cacheWrite + tokens.cacheRead,
      input: tokens.input,
      output: tokens.output,
    });
    if (config.emitGenerationsFromPoller) {
      tracker.track(EVENT_KEYS.generationSuccess, context, trackData, 1);
    }
    stats.emitted += 1;
    freshHashes[hash] = ts ?? now;
  }

  await tracker.close();

  if (!dryRun) {
    // Keep only hashes recent enough to reappear inside a future overlap window.
    const pruneCutoff = now - 2 * OVERLAP_MS;
    for (const [hash, ts] of Object.entries(freshHashes)) {
      if (ts < pruneCutoff) delete freshHashes[hash];
    }
    saveState({ lastSeenTs: Math.max(maxTs, state.lastSeenTs ?? 0), seenHashes: freshHashes });
  }

  console.error(
    `done: emitted=${stats.emitted} deduped=${stats.deduped} filtered=${stats.filtered}` +
      ` unmappedModel=${stats.unmappedModel} noTokens=${stats.noTokens}`,
  );
}

const isDirectRun =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) {
  const args = parseArgs(process.argv.slice(2));
  if (args.loop) {
    const run = () =>
      pollOnce(args).catch((err) => console.error(`poll failed: ${err.message}`));
    await run();
    setInterval(run, LOOP_INTERVAL_MS);
    console.error(`looping every ${LOOP_INTERVAL_MS / 60000} minutes; Ctrl-C to stop`);
  } else {
    try {
      await pollOnce(args);
    } catch (err) {
      console.error(`poll failed: ${err.message}`);
      process.exit(1);
    }
  }
}
