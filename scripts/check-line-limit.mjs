/**
 * Hard rule from CLAUDE.md: no source file exceeds 400 lines.
 * v2's MapSystem.js reached 4081 and became unmaintainable. The limit is not raised;
 * the file is split. This runs in CI so the rule is enforced, not remembered.
 *
 * tokens.css is the one documented exception at 800 — it is the whole design system
 * and splitting it would recreate v2's 34-file CSS sprawl.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const LIMIT = 400;
const EXCEPTIONS = new Map([['packages/ui/src/styles/tokens.css', 800]]);
const ROOTS = ['apps', 'packages', 'scripts'];
const EXTS = /\.(ts|tsx|css|mjs|js)$/;
const SKIP = new Set(['node_modules', 'dist', 'dist-types', 'coverage', '.vite']);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTS.test(entry)) yield full;
  }
}

const offenders = [];

for (const top of ROOTS) {
  let stat;
  try {
    stat = statSync(join(ROOT, top));
  } catch {
    continue;
  }
  if (!stat.isDirectory()) continue;

  for (const file of walk(join(ROOT, top))) {
    const rel = relative(ROOT, file).split(sep).join('/');
    const limit = EXCEPTIONS.get(rel) ?? LIMIT;
    const lines = readFileSync(file, 'utf8').split('\n').length;
    if (lines > limit) offenders.push({ rel, lines, limit });
  }
}

if (offenders.length > 0) {
  console.error('\nFiles over the line limit — split them, do not raise the limit:\n');
  for (const o of offenders) {
    console.error(`  ${o.rel}  ${o.lines} lines (limit ${o.limit})`);
  }
  console.error('');
  process.exit(1);
}

console.log(`Line limit OK — nothing over ${LIMIT} lines.`);
