import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseTranscript,
  lastAssistantMessage,
  buildJudgeInput,
  extractScore,
} from '../src/judge/judgeCore.mjs';

test('parseTranscript reads Cursor JSONL, skipping garbage', () => {
  const jsonl = [
    JSON.stringify({ role: 'user', message: 'fix the bug', type: 'message', status: 'done' }),
    'not json at all',
    JSON.stringify({ role: 'assistant', message: 'Fixed it in foo.js', type: 'message' }),
    JSON.stringify({ type: 'meta' }), // no role/message
  ].join('\n');
  const messages = parseTranscript(jsonl);
  assert.deepEqual(messages, [
    { role: 'user', content: 'fix the bug' },
    { role: 'assistant', content: 'Fixed it in foo.js' },
  ]);
  assert.equal(lastAssistantMessage(messages), 'Fixed it in foo.js');
});

test('buildJudgeInput keeps the end of long transcripts and caps the diff', () => {
  const messages = [{ role: 'user', content: 'a'.repeat(100) }];
  const input = buildJudgeInput({ messages, diff: 'd'.repeat(100), maxChars: 40, maxDiffChars: 20 });
  assert.match(input, /\[transcript truncated\]/);
  assert.match(input, /\[diff truncated\]/);
  assert.ok(input.includes('a'.repeat(30))); // tail survived
  assert.match(input, /## Resulting code diff/);
});

test('buildJudgeInput omits the diff section when empty', () => {
  const input = buildJudgeInput({ messages: [{ role: 'user', content: 'hi' }], diff: '' });
  assert.equal(input.includes('code diff'), false);
});

test('extractScore handles fences, prose, clamping, and garbage', () => {
  assert.deepEqual(extractScore('{"score": 0.8, "reasoning": "solid"}'), {
    score: 0.8,
    reasoning: 'solid',
  });
  assert.equal(
    extractScore('Here is my verdict:\n```json\n{"score": 0.35, "reasoning": "meh"}\n```').score,
    0.35,
  );
  assert.equal(extractScore('{"score": 7, "reasoning": "overflow"}').score, 1);
  assert.equal(extractScore('no json here'), null);
  assert.equal(extractScore(''), null);
  // first block invalid, second valid
  assert.equal(extractScore('{"foo": 1} then {"score": 0.5, "reasoning": "r"}').score, 0.5);
});
