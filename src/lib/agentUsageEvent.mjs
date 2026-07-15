// Provider-agnostic usage event → LD $ld:ai:* track calls.
// See docs/AGENT_USAGE_EVENT.md.

import { EVENT_KEYS, trackTokens } from './ldTrack.mjs';

/**
 * Fill defaults and validate required fields. Returns a normalized event or throws.
 */
export function normalizeAgentUsageEvent(partial = {}) {
  const provider = partial.provider;
  const model = partial.model ?? '';
  const userKey = partial.userKey;
  const source = partial.source;
  if (!provider || typeof provider !== 'string') {
    throw new Error('AgentUsageEvent.provider is required');
  }
  if (!userKey || typeof userKey !== 'string') {
    throw new Error('AgentUsageEvent.userKey is required');
  }
  if (!source || typeof source !== 'string') {
    throw new Error('AgentUsageEvent.source is required');
  }

  const tokens = partial.tokens
    ? {
        input: Number(partial.tokens.input) || 0,
        output: Number(partial.tokens.output) || 0,
        total: Number(partial.tokens.total) || 0,
        cacheRead: Number(partial.tokens.cacheRead) || 0,
        cacheWrite: Number(partial.tokens.cacheWrite) || 0,
      }
    : undefined;

  return {
    provider,
    model: typeof model === 'string' ? model : String(model ?? ''),
    userKey,
    startedAt: typeof partial.startedAt === 'number' ? partial.startedAt : undefined,
    endedAt: typeof partial.endedAt === 'number' ? partial.endedAt : undefined,
    outcome: partial.outcome ?? 'success',
    tokens,
    costCents: typeof partial.costCents === 'number' ? partial.costCents : undefined,
    conversationId: partial.conversationId,
    source,
    configKey: partial.configKey,
    variationKey: partial.variationKey,
    runId: partial.runId,
    version: partial.version,
    providerName: partial.providerName ?? provider,
    extra: partial.extra && typeof partial.extra === 'object' ? { ...partial.extra } : {},
  };
}

/**
 * Expand one logical usage event into ordered LD track call descriptors.
 * Aborted outcomes yield an empty list (skip).
 *
 * Token call is a single descriptor with `{ total, input, output }` for
 * trackTokens(); duration/generation are one track each.
 */
export function toLdTrackCalls(partial) {
  const event = normalizeAgentUsageEvent(partial);
  if (event.outcome === 'aborted') return [];

  const calls = [];
  let durationMs = null;
  if (event.startedAt != null && event.endedAt != null) {
    durationMs = Math.max(0, event.endedAt - event.startedAt);
  } else if (typeof event.extra?.durationMs === 'number') {
    durationMs = event.extra.durationMs;
  }

  if (typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0) {
    calls.push({
      eventKey: EVENT_KEYS.durationTotal,
      metricValue: durationMs,
      kind: 'duration',
    });
  }

  calls.push({
    eventKey:
      event.outcome === 'error' ? EVENT_KEYS.generationError : EVENT_KEYS.generationSuccess,
    metricValue: 1,
    kind: 'generation',
  });

  const t = event.tokens;
  if (t) {
    const cacheWrite = t.cacheWrite || 0;
    const cacheRead = t.cacheRead || 0;
    const total =
      t.total > 0 ? t.total : t.input + t.output + cacheWrite + cacheRead;
    if (total > 0 || t.input > 0 || t.output > 0) {
      calls.push({
        eventKey: EVENT_KEYS.tokensTotal,
        metricValue: total,
        kind: 'tokens',
        tokens: { total, input: t.input, output: t.output },
      });
    }
  }

  return calls;
}

/**
 * Emit duration, generation, and token tracks for an AgentUsageEvent.
 */
export function applyAgentUsageEvent(tracker, context, trackData, partial) {
  const event = normalizeAgentUsageEvent(partial);
  const calls = toLdTrackCalls(event);
  for (const call of calls) {
    if (call.kind === 'tokens') {
      trackTokens(tracker, context, trackData, call.tokens);
      continue;
    }
    tracker.track(call.eventKey, context, trackData, call.metricValue);
  }
  return { event, calls };
}
