#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const candidates = [
  process.env.LD_AGENTCONTROL_BRIDGE_ROOT,
  path.resolve(here, '..', '..', '..', '..'),
].filter(Boolean);

let report = null;
for (const root of candidates) {
  const p = path.join(root, 'scripts', 'agent-usage-report.mjs');
  if (existsSync(p)) {
    report = p;
    break;
  }
}

const pointer = path.join(here, 'bridge-root.txt');
if (!report && existsSync(pointer)) {
  const root = readFileSync(pointer, 'utf8').trim();
  const p = path.join(root, 'scripts', 'agent-usage-report.mjs');
  if (existsSync(p)) report = p;
}

if (!report) {
  console.error(
    'Could not find scripts/agent-usage-report.mjs. Re-run: npm run install:claude-hooks',
  );
  process.exit(1);
}

const result = spawnSync(process.execPath, [report, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
