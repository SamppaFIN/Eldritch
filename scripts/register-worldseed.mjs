/**
 * Registers a Worldseed source document onto the confirmed world (BRDC-SEED-001).
 *
 * `packages/core/src/data/seed/<area>.source.json` is the document exactly as authored —
 * it disagrees with the game's own confirmed coordinates by one measured translation
 * vector. This runs `registerWorldseed` once against the checked-in source and writes the
 * corrected copy; nothing reads the source file at runtime.
 *
 *   pnpm typecheck && node scripts/register-worldseed.mjs harmala
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerWorldseed } from '../packages/core/dist/data/worldseedRegister.js';
import { HARMALA_STATUE } from '../packages/core/dist/rules/terrainSeed.js';

const AREA_ANCHORS = {
  // The only area seeded so far. Its anchor is the statue Infinite long-pressed
  // (terrainSeed.ts) — every other area gets its own confirmed anchor when it exists.
  harmala: HARMALA_STATUE,
};

const area = process.argv[2];
if (!area) {
  console.error('usage: node scripts/register-worldseed.mjs <area>');
  process.exit(1);
}
const anchor = AREA_ANCHORS[area];
if (!anchor) {
  console.error(`no confirmed anchor registered for area "${area}" in AREA_ANCHORS`);
  process.exit(1);
}

const seedDir = join(process.cwd(), 'packages/core/src/data/seed');
const sourcePath = join(seedDir, `${area}.source.json`);
const outPath = join(seedDir, `${area}.registered.json`);

const doc = JSON.parse(readFileSync(sourcePath, 'utf8'));
const registered = registerWorldseed(doc, anchor);
writeFileSync(outPath, `${JSON.stringify(registered, null, 2)}\n`, 'utf8');

console.log(`${sourcePath} -> ${outPath}`);
console.log(`anchor: ${anchor.lat}, ${anchor.lng}`);
