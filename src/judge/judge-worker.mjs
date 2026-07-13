#!/usr/bin/env node
// Detached judge worker, spawned fire-and-forget by the stop hook for
// sampled runs. Reads a job file describing the finished agent run, evaluates
// the LD judge config for its rubric/model, scores the transcript with a
// powerful model, and tracks:
//   - the score on the PARENT run's trackData (evaluationMetricKey +
//     judgeConfigKey) → appears as a judge metric per variation, and
//   - the judge's own duration/success on the judge config's tracker.
//
// Judge inference runs through the Cursor Agent CLI by default (billed to
// the Cursor seat, no extra API keys) or the Anthropic API when
// judge.provider = "anthropic". Judge runs set LD_AGENTCONTROL_JUDGE=1 so
// the stop hook ignores them — without that guard, judging would recurse.

import { readFileSync, mkdirSync, appendFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

import {
  resolveRuntime,
  buildTrackData,
  userContext,
  createLdTracker,
  EVENT_KEYS,
} from '../lib/ldTrack.mjs';
import {
  parseTranscript,
  lastAssistantMessage,
  buildJudgeInput,
  extractScore,
} from './judgeCore.mjs';

const runtime = resolveRuntime();

function logLine(message) {
  try {
    mkdirSync(runtime.stateDir, { recursive: true });
    appendFileSync(
      path.join(runtime.stateDir, 'judge.log'),
      `${new Date().toISOString()} ${message}\n`,
    );
  } catch {
    // best-effort
  }
}

function gitDiff(workspaceRoot) {
  if (!workspaceRoot) return '';
  try {
    const result = spawnSync('git', ['-C', workspaceRoot, 'diff', 'HEAD'], {
      timeout: 10_000,
      maxBuffer: 4 * 1024 * 1024,
      encoding: 'utf8',
    });
    return result.status === 0 ? result.stdout : '';
  } catch {
    return '';
  }
}

function runCursorAgent({ rubric, input, model, timeoutMs, apiKey }) {
  const prompt =
    `${rubric}\n\nDo not use any tools, do not read or modify any files — ` +
    `evaluate only the material below and reply with the JSON verdict.\n\n${input}`;
  // Empty scratch cwd so an over-eager agent has nothing to touch.
  const cwd = mkdtempSync(path.join(os.tmpdir(), 'ld-judge-'));
  // --trust: the cwd is our own empty scratch dir, so trusting it is safe
  // (required by newer CLI builds for headless runs).
  const result = spawnSync(
    'cursor-agent',
    ['-p', prompt, '--output-format', 'json', '--trust', ...(model ? ['--model', model] : [])],
    {
      cwd,
      timeout: timeoutMs,
      maxBuffer: 16 * 1024 * 1024,
      encoding: 'utf8',
      env: {
        ...process.env,
        LD_AGENTCONTROL_JUDGE: '1',
        // Hook-spawned processes don't inherit shell env; a User API key in
        // the judge config covers machines where `cursor-agent login` wasn't run.
        ...(apiKey ? { CURSOR_API_KEY: apiKey } : {}),
      },
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`cursor-agent exited ${result.status}: ${(result.stderr ?? '').slice(0, 300)}`);
  }
  const raw = (result.stdout ?? '').trim();
  try {
    const parsed = JSON.parse(raw);
    const usage = parsed.usage;
    return {
      text: parsed.result ?? parsed.text ?? parsed.response ?? raw,
      tokens: usage
        ? {
            input: usage.inputTokens ?? 0,
            output: usage.outputTokens ?? 0,
            total: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0) +
              (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0),
          }
        : null,
    };
  } catch {
    return { text: raw, tokens: null };
  }
}

async function runAnthropic({ rubric, input, model, timeoutMs }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('judge.provider=anthropic but ANTHROPIC_API_KEY is not set');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'claude-fable-5',
      max_tokens: 1024,
      system: rubric,
      messages: [{ role: 'user', content: input }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`anthropic ${response.status}: ${(await response.text()).slice(0, 300)}`);
  const data = await response.json();
  return {
    text: data.content?.map((c) => c.text ?? '').join('') ?? '',
    tokens: data.usage
      ? {
          input: data.usage.input_tokens ?? 0,
          output: data.usage.output_tokens ?? 0,
          total: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
        }
      : null,
  };
}

async function main() {
  const jobPath = process.argv[2];
  if (!jobPath) throw new Error('usage: judge-worker <job.json>');
  const job = JSON.parse(readFileSync(jobPath, 'utf8'));
  const judgeCfg = runtime.config?.judge;
  if (!judgeCfg?.configKey) {
    logLine('no judge.configKey configured — exiting');
    return;
  }

  const context = userContext(job.contextKey);
  const tracker = await createLdTracker({ sdkKey: runtime.sdkKey });
  const judgeValue = await tracker.evaluate(judgeCfg.configKey, context);
  if (!judgeValue?._ldMeta) {
    logLine(`judge config "${judgeCfg.configKey}" not evaluable — exiting`);
    await tracker.close();
    return;
  }
  const metricKey = judgeValue.evaluationMetricKey;
  const rubric = (judgeValue.messages ?? [])
    .map((m) => m.content)
    .join('\n')
    .trim();
  const model = judgeValue.model?.name || judgeCfg.fallbackModel || '';
  if (!metricKey || !rubric) {
    logLine('judge config missing evaluationMetricKey or rubric messages — exiting');
    await tracker.close();
    return;
  }

  const transcript = parseTranscript(readFileSync(job.transcriptPath, 'utf8'));
  const diff = judgeCfg.includeDiff === false ? '' : gitDiff(job.workspaceRoot);
  const input = buildJudgeInput({
    messages: transcript,
    diff,
    maxChars: judgeCfg.maxInputChars ?? 60_000,
  });
  const output = lastAssistantMessage(transcript);
  const fullInput = `${input}\n\n## Response to evaluate\n${output.slice(0, 10_000)}`;

  // Judge's own run tracks on the judge config, mirroring the SDK's Judge.
  const judgeTrackData = buildTrackData({
    configKey: judgeCfg.configKey,
    variationKey: judgeValue._ldMeta.variationKey,
    version: judgeValue._ldMeta.version ?? 1,
    modelName: model,
    providerName: judgeValue.provider?.name ?? 'cursor',
    extra: { source: 'cursor-judge-worker' },
  });

  const timeoutMs = judgeCfg.timeoutMs ?? 240_000;
  const started = Date.now();
  let verdict = null;
  let judgeTokens = null;
  try {
    if ((judgeCfg.provider ?? 'cursor-agent') === 'anthropic') {
      const result = await runAnthropic({ rubric, input: fullInput, model, timeoutMs });
      verdict = extractScore(result.text);
      judgeTokens = result.tokens;
    } else {
      const result = runCursorAgent({
        rubric,
        input: fullInput,
        model,
        timeoutMs,
        apiKey: judgeCfg.cursorApiKey ?? process.env.CURSOR_API_KEY,
      });
      verdict = extractScore(result.text);
      judgeTokens = result.tokens;
    }
  } catch (err) {
    tracker.track(EVENT_KEYS.durationTotal, context, judgeTrackData, Date.now() - started);
    tracker.track(EVENT_KEYS.generationError, context, judgeTrackData, 1);
    await tracker.close();
    logLine(`judge run failed for conv=${job.conversationId}: ${err.message}`);
    return;
  }

  tracker.track(EVENT_KEYS.durationTotal, context, judgeTrackData, Date.now() - started);
  tracker.track(
    verdict ? EVENT_KEYS.generationSuccess : EVENT_KEYS.generationError,
    context,
    judgeTrackData,
    1,
  );
  if (judgeTokens?.total > 0) {
    tracker.track(EVENT_KEYS.tokensTotal, context, judgeTrackData, judgeTokens.total);
    tracker.track(EVENT_KEYS.tokensInput, context, judgeTrackData, judgeTokens.input);
    tracker.track(EVENT_KEYS.tokensOutput, context, judgeTrackData, judgeTokens.output);
  }

  if (verdict) {
    // The score itself, attached to the PARENT run — same shape as the SDK's
    // trackJudgeResult: parent trackData + judgeConfigKey, value = score.
    tracker.track(
      metricKey,
      context,
      { ...job.parentTrackData, judgeConfigKey: judgeCfg.configKey },
      verdict.score,
    );
    // Local score record for the extension: the beta metrics API doesn't
    // expose judge metrics, so the panel reads this file instead.
    try {
      appendFileSync(
        path.join(runtime.stateDir, 'judge-scores.jsonl'),
        `${JSON.stringify({
          ts: Date.now(),
          configKey: job.parentTrackData.configKey,
          variationKey: job.parentTrackData.variationKey,
          runId: job.parentTrackData.runId,
          conversationId: job.conversationId,
          score: verdict.score,
          reasoning: verdict.reasoning.slice(0, 500),
        })}\n`,
      );
    } catch {
      // best-effort
    }
    logLine(
      `scored conv=${job.conversationId} variation=${job.parentTrackData.variationKey}` +
        ` score=${verdict.score} (${Math.round((Date.now() - started) / 1000)}s):` +
        ` ${verdict.reasoning.slice(0, 200)}`,
    );
  } else {
    logLine(`no parseable score for conv=${job.conversationId}`);
  }
  await tracker.close();
  try {
    unlinkSync(jobPath);
  } catch {
    // best-effort
  }
}

main().catch((err) => {
  logLine(`fatal: ${err.stack ?? err}`);
  process.exit(0);
});
