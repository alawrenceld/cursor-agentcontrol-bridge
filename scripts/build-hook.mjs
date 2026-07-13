#!/usr/bin/env node
// Bundle the Cursor hook (including the LaunchDarkly SDK) into a single CJS
// file shipped inside the extension, so the installed extension needs no
// node_modules and no checkout of this repo.

import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outdir = path.join(ROOT, 'extension', 'hook');

// One build per entry with an explicit outfile — a single multi-entry build
// would nest outputs under src/'s directory structure.
const ENTRIES = [
  ['src/hooks/cursor-hook.mjs', 'cursor-hook.js'],
  ['src/judge/judge-worker.mjs', 'judge-worker.js'],
];
for (const [entry, outName] of ENTRIES) {
  await build({
    entryPoints: [path.join(ROOT, entry)],
    outfile: path.join(outdir, outName),
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    minify: false,
    sourcemap: false,
    banner: {
      js: `// Bundled by scripts/build-hook.mjs — edit ${entry} instead.`,
    },
  });
}
console.log(`bundled hook + judge worker → ${path.relative(ROOT, outdir)}/`);

// Ship the current bridge config (sans anything secret — it has no secrets)
// as the template for ~/.cursor/ld-agentcontrol.json on first activation.
const { copyFileSync } = await import('node:fs');
const defaultsOut = path.join(ROOT, 'extension', 'hook', 'config-defaults.json');
copyFileSync(path.join(ROOT, 'bridge.config.json'), defaultsOut);
console.log(`config defaults → ${path.relative(ROOT, defaultsOut)}`);
