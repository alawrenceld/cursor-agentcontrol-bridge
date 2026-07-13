// Pure helpers for the judge worker (no I/O — unit-testable).
//
// Mirrors @launchdarkly/server-sdk-ai's Judge semantics: input is the
// conversation rendered as "role: content" lines, output is the response
// being evaluated, and the model must return {score: 0..1, reasoning}.

/**
 * Cursor agent transcripts are JSONL with {role, message, type, status}.
 * Returns [{role, content}], tolerating unparseable lines and non-string
 * message bodies.
 */
export function parseTranscript(jsonl) {
  const messages = [];
  for (const line of String(jsonl).split('\n')) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      const content =
        typeof entry.message === 'string' ? entry.message : JSON.stringify(entry.message);
      if (entry.role && content) messages.push({ role: entry.role, content });
    } catch {
      // skip malformed lines
    }
  }
  return messages;
}

export function lastAssistantMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'assistant') return messages[i].content;
  }
  return messages[messages.length - 1]?.content ?? '';
}

/**
 * Build the judge prompt. Keeps the END of long transcripts (the most recent
 * exchange is what matters); the diff section gets its own smaller cap.
 */
export function buildJudgeInput({ messages, diff, maxChars = 60_000, maxDiffChars = 20_000 }) {
  let history = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  if (history.length > maxChars) {
    history = `[transcript truncated]\n…${history.slice(-maxChars)}`;
  }
  let input = `## Conversation transcript\n${history}`;
  if (diff && diff.trim()) {
    let d = diff;
    if (d.length > maxDiffChars) d = `${d.slice(0, maxDiffChars)}\n…[diff truncated]`;
    input += `\n\n## Resulting code diff\n${d}`;
  }
  return input;
}

/**
 * Extract {score, reasoning} from model output. Tolerates markdown fences,
 * surrounding prose, and out-of-range scores (clamped). Returns null when no
 * parseable score exists.
 */
export function extractScore(text) {
  if (!text) return null;
  const candidates = String(text).match(/\{[\s\S]*?\}/g) ?? [];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed.score === 'number' && Number.isFinite(parsed.score)) {
        return {
          score: Math.min(1, Math.max(0, parsed.score)),
          reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
        };
      }
    } catch {
      // try the next candidate block
    }
  }
  return null;
}
