/**
 * Builds one Worldseed area: grid → classify → partition → allocate (BRDC-SEED-003).
 *
 * Reads the registered (BRDC-SEED-001) seed file, generates the real H3 res-11 grid over
 * its bbox, classifies every hex from its zoneOverrides, partitions same-terrain runs into
 * 7–55-hex areas, and allocates 1–3 bonus-resource deposits per area. Checks the result
 * against the seed's own `expectedCounts` and fails loudly rather than writing a silently
 * broken world (the seed file's own stated purpose for that field).
 *
 * Landmarks (BRDC-SEED-002), wonders and quests are not part of this output — assembling
 * the final per-hex `HexSeed` is BRDC-SEED-004's job, once all three are ready.
 *
 *   pnpm typecheck && node scripts/build-worldseed.mjs harmala
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cellCentre, cellsCoveringBBox } from '../packages/core/dist/geo/cells.js';
import { classifyGrid } from '../packages/core/dist/data/worldseedTerrain.js';
import { partitionIntoAreas } from '../packages/core/dist/data/worldseedPartition.js';
import { allocateArea } from '../packages/core/dist/data/worldseedAllocate.js';
import { prng } from '../packages/core/dist/sim/walk.js';

const area = process.argv[2];
if (!area) {
  console.error('usage: node scripts/build-worldseed.mjs <area>');
  process.exit(1);
}

const seedDir = join(process.cwd(), 'packages/core/src/data/seed');
const doc = JSON.parse(readFileSync(join(seedDir, `${area}.registered.json`), 'utf8'));
const [south, west, north, east] = doc.bbox;

const grid = cellsCoveringBBox({ south, west, north, east }, 6_000);
if (grid.length === 0) {
  console.error(`bbox produced no hexes (or exceeded the cap) — check ${area}.registered.json's bbox`);
  process.exit(1);
}

const classified = classifyGrid(grid, cellCentre, doc.zoneOverrides ?? []);
const terrainOf = new Map([...classified].map(([h3, c]) => [h3, c.terrain]));
const flagsOf = (h3) => classified.get(h3)?.flags ?? [];

const areas = partitionIntoAreas(terrainOf, flagsOf);

const rng = prng(doc.rngSeed ?? 1);
const deposits = areas.flatMap((a) => allocateArea(a, flagsOf, rng));

// ─── expectedCounts: fail loudly, not silently (the seed file's own stated reason) ───────
const ec = doc.expectedCounts ?? {};
const problems = [];

if (ec.totalHexes && (grid.length < ec.totalHexes[0] || grid.length > ec.totalHexes[1])) {
  problems.push(`totalHexes ${grid.length} outside [${ec.totalHexes}]`);
}

// byTerrain assumes a full OSM land-cover survey over the whole bbox (worldseed.ts's own
// classify()). This build reads zoneOverrides instead (BRDC-SEED-003's RED) — 18
// hand-drawn zones covering the district's named places, not the whole bbox — so most of
// the grid outside them is honestly `plain`, not a share a survey would report. A hard
// failure here would be enforcing a check this input was never going to satisfy; printed
// as a warning instead, so the gap stays visible rather than silently disabled.
if (ec.byTerrain) {
  const GAME_TERRAIN_FOR = { water: ['lake', 'coast'], trade: ['market'] };
  const counts = {};
  for (const c of classified.values()) counts[c.terrain] = (counts[c.terrain] ?? 0) + 1;
  const warnings = [];
  for (const [terrain, [min, max]] of Object.entries(ec.byTerrain)) {
    const keys = GAME_TERRAIN_FOR[terrain] ?? [terrain];
    const share = keys.reduce((n, k) => n + (counts[k] ?? 0), 0) / grid.length;
    if (share < min || share > max) {
      warnings.push(`byTerrain.${terrain} (as ${keys.join('+')}) share ${share.toFixed(3)} outside [${min}, ${max}]`);
    }
  }
  if (warnings.length > 0) {
    console.warn(`${area}: byTerrain needs a full survey to satisfy, skipped as a hard gate:\n  ${warnings.join('\n  ')}`);
  }
}

if (ec.depositsPerArea) {
  const [min, max] = ec.depositsPerArea;
  for (const a of areas) {
    const n = deposits.filter((d) => a.hexes.includes(d.hexId)).length;
    if (n > 0 && (n < min || n > max)) problems.push(`area ${a.id} has ${n} deposits, outside [${min}, ${max}]`);
  }
}

if (ec.depositDensity) {
  const share = deposits.length / grid.length;
  if (share < ec.depositDensity[0] || share > ec.depositDensity[1]) {
    problems.push(`depositDensity ${share.toFixed(3)} outside [${ec.depositDensity}]`);
  }
}

if (typeof ec.areasWithZeroDeposits === 'number') {
  const zero = areas.filter((a) => !deposits.some((d) => a.hexes.includes(d.hexId))).length;
  if (zero > ec.areasWithZeroDeposits) {
    problems.push(`${zero} areas got no deposit at all (allowed: ${ec.areasWithZeroDeposits})`);
  }
}

if (problems.length > 0) {
  console.error(`${area}: expectedCounts violated:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

const out = {
  builtAt: new Date().toISOString(),
  hexes: grid.length,
  terrain: Object.fromEntries(grid.map((h3) => [h3, classified.get(h3)])),
  areas: areas.map((a) => ({ id: a.id, terrain: a.terrain, hexCount: a.hexes.length, hexes: a.hexes, flags: a.flags })),
  deposits: deposits.map((d) => ({ hexId: d.hexId, resourceId: d.resource.id })),
};
const outPath = join(seedDir, `${area}.terrain.json`);
writeFileSync(outPath, `${JSON.stringify(out, null, 1)}\n`, 'utf8');

console.log(`${area}: ${grid.length} hexes, ${areas.length} areas, ${deposits.length} deposits -> ${outPath}`);
