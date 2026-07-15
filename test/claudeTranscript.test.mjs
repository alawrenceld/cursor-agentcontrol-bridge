import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  parseAssistantUsage,
  deltaTokensFromTranscript,
  extractClaudeTokens,
} from '../src/lib/claudeTranscript.mjs';

const sampleRows = [
  { type: 'mode', mode: 'normal', sessionId: 's1' },
  {
    type: 'assistant',
    uuid: 'u1',
    isSidechain: false,
    message: {
      model: '<synthetic>',
      usage: {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  },
  {
    type: 'assistant',
    uuid: 'u2',
    isSidechain: false,
    message: {
      model: 'claude-opus-4-8',
      usage: {
        input_tokens: 100,
        output_tokens: 20,
        cache_read_input_tokens: 50,
        cache_creation_input_tokens: 10,
      },
    },
  },
  {
    type: 'assistant',
    uuid: 'u3',
    isSidechain: true,
    message: {
      model: 'claude-opus-4-8',
      usage: {
        input_tokens: 999,
        output_tokens: 999,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  },
  {
    type: 'assistant',
    uuid: 'u4',
    isSidechain: false,
    message: {
      model: 'claude-opus-4-8',
      usage: {
        input_tokens: 5,
        output_tokens: 2,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  },
];

test('parseAssistantUsage skips synthetic and sidechain', () => {
  assert.equal(parseAssistantUsage(sampleRows[1]), null);
  assert.equal(parseAssistantUsage(sampleRows[3]), null);
  const ok = parseAssistantUsage(sampleRows[2]);
  assert.equal(ok.model, 'claude-opus-4-8');
  assert.equal(ok.tokens.input, 100);
});

test('deltaTokensFromTranscript aggregates only new UUIDs', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cc-tx-'));
  const file = path.join(dir, 't.jsonl');
  writeFileSync(file, sampleRows.map((r) => JSON.stringify(r)).join('\n'));

  const first = deltaTokensFromTranscript(file, new Set());
  assert.equal(first.model, 'claude-opus-4-8');
  assert.deepEqual(first.tokens, {
    input: 105,
    output: 22,
    cacheRead: 50,
    cacheWrite: 10,
  });
  assert.deepEqual(first.newUuids.sort(), ['u2', 'u4']);

  const second = deltaTokensFromTranscript(file, first.seenUuids);
  assert.equal(second.tokens, null);
  assert.deepEqual(second.newUuids, []);
});

test('extractClaudeTokens prefers payload usage', () => {
  const result = extractClaudeTokens(
    {
      session_id: 's1',
      usage: { input_tokens: 3, output_tokens: 4 },
    },
    mkdtempSync(path.join(tmpdir(), 'cc-st-')),
  );
  assert.equal(result.source, 'payload');
  assert.deepEqual(result.tokens, {
    input: 3,
    output: 4,
    cacheRead: 0,
    cacheWrite: 0,
  });
});

test('extractClaudeTokens uses transcript watermark across calls', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cc-wm-'));
  const file = path.join(dir, 't.jsonl');
  writeFileSync(file, sampleRows.map((r) => JSON.stringify(r)).join('\n'));
  const payload = { session_id: 'sess-1', transcript_path: file };

  const a = extractClaudeTokens(payload, dir);
  assert.equal(a.source, 'transcript');
  assert.equal(a.tokens.input, 105);

  const b = extractClaudeTokens(payload, dir);
  assert.equal(b.source, 'none');
  assert.equal(b.tokens, null);
});
