// Map Copilot Chat OTLP/HTTP JSON traces → AgentUsageEvent-shaped records.
// One event per `chat` span (per LLM call). `invoke_agent` is ignored (session totals).

/**
 * Read an OTLP attribute value (string / int / double / bool).
 */
export function otlpAttrValue(attr) {
  if (!attr?.value) return undefined;
  const v = attr.value;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.intValue !== undefined) return Number(v.intValue);
  if (v.doubleValue !== undefined) return Number(v.doubleValue);
  if (v.boolValue !== undefined) return Boolean(v.boolValue);
  return undefined;
}

/** Flatten span attributes into a plain object. */
export function attrsToObject(attributes = []) {
  const out = {};
  for (const a of attributes) {
    if (!a?.key) continue;
    out[a.key] = otlpAttrValue(a);
  }
  return out;
}

/**
 * True when this span is a per-LLM-call `chat` span (not invoke_agent / execute_tool).
 */
export function isChatSpan(span, attrs = {}) {
  const op = attrs['gen_ai.operation.name'];
  if (op === 'chat') return true;
  if (op && op !== 'chat') return false;
  const name = String(span?.name || '');
  return /^chat(\s|$)/i.test(name);
}

/**
 * Convert one OTLP span into a usage event partial, or null if not a chat span.
 *
 * @returns {null | {
 *   runId: string,
 *   model: string,
 *   conversationId?: string,
 *   startedAt: number,
 *   endedAt: number,
 *   outcome: 'success'|'error',
 *   tokens: { input: number, output: number, total: number, cacheRead?: number, cacheWrite?: number },
 *   source: 'otel',
 *   provider: 'copilot',
 * }}
 */
export function chatSpanToUsagePartial(span) {
  if (!span) return null;
  const attrs = attrsToObject(span.attributes);
  if (!isChatSpan(span, attrs)) return null;

  const spanId = String(span.spanId || '').toLowerCase();
  if (!spanId) return null;

  const startNs = BigInt(span.startTimeUnixNano || 0);
  const endNs = BigInt(span.endTimeUnixNano || span.startTimeUnixNano || 0);
  const startedAt = Number(startNs / 1_000_000n);
  const endedAt = Number(endNs / 1_000_000n);

  const model =
    attrs['gen_ai.response.model'] ||
    attrs['gen_ai.request.model'] ||
    String(span.name || '').replace(/^chat\s+/i, '').trim() ||
    'unknown';

  const input = Number(attrs['gen_ai.usage.input_tokens']) || 0;
  const output = Number(attrs['gen_ai.usage.output_tokens']) || 0;
  const cacheRead =
    Number(attrs['gen_ai.usage.cache_read.input_tokens']) ||
    Number(attrs['gen_ai.usage.cache_read_input_tokens']) ||
    0;
  const cacheWrite =
    Number(attrs['gen_ai.usage.cache_creation.input_tokens']) ||
    Number(attrs['gen_ai.usage.cache_creation_input_tokens']) ||
    0;
  const total = input + output || Number(attrs['gen_ai.usage.total_tokens']) || 0;

  const statusCode = span.status?.code; // 0 UNSET, 1 OK, 2 ERROR in OTLP proto
  const hasError =
    statusCode === 2 ||
    statusCode === 'STATUS_CODE_ERROR' ||
    Boolean(attrs['error.type']);

  return {
    runId: spanId,
    model: String(model),
    conversationId: attrs['gen_ai.conversation.id']
      ? String(attrs['gen_ai.conversation.id'])
      : undefined,
    startedAt,
    endedAt: endedAt >= startedAt ? endedAt : startedAt,
    outcome: hasError ? 'error' : 'success',
    tokens: {
      input,
      output,
      total: total || input + output,
      cacheRead,
      cacheWrite,
    },
    source: 'otel',
    provider: 'copilot',
  };
}

/**
 * Walk an OTLP ExportTraceServiceRequest JSON body and yield chat usage partials.
 */
export function extractChatUsageFromOtlpTraces(body) {
  const events = [];
  const resourceSpans = body?.resourceSpans ?? body?.resource_spans ?? [];
  for (const rs of resourceSpans) {
    const scopeSpans = rs.scopeSpans ?? rs.scope_spans ?? [];
    for (const ss of scopeSpans) {
      for (const span of ss.spans ?? []) {
        const partial = chatSpanToUsagePartial(span);
        if (partial) events.push(partial);
      }
    }
  }
  return events;
}
