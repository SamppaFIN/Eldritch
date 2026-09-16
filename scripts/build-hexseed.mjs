/**
 * Assembles the final per-hex HexSeed for one area (BRDC-SEED-004).
 *
 * Combines what the three earlier steps produced — BRDC-SEED-003's terrain and deposits
 * (`<area>.terrain.json`), BRDC-SEED-002's landmark reconciliation (run fresh here against
 * the registered document and the frozen OSM fixture) — into one lean, per-hex record the
 * game can actually read. Quests and wonders are not part of this output: quests already
 * have their own confirmed sites (`questSites.ts`) and wonder placement is
 * `BRDC-WONDER-002`'s own ticket.
 *
 *   pnpm typecheck && node scripts/build-hexseed.mjs harmala
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cellAt } from '../packages/core/dist/geo/cells.js';
import { seedLandmarks } from '../packages/core/dist/data/landmarkSeed.js';

const area = process.argv[2];
if (!area) {
  console.error('usage: node scripts/build-hexseed.mjs <area>');
  process.exit(1);
}

const seedDir = join(process.cwd(), 'packages/core/src/data/seed');
const read = (name) => JSON.parse(readFileSync(join(seedDir, name), 'utf8'));

const terrainDoc = read(`${area}.terrain.json`);
const registered = read(`${area}.registered.json`);
const osm = read(`${area}.landmarks.osm.json`);

const { landmarks, unmatchedWritten } = seedLandmarks(registered.landmarks ?? [], osm.elements);
if (unmatchedWritten.length > 0) {
  console.warn(`${area}: ${unmatchedWritten.length} written landmark(s) kept their own coordinate (no OSM match): ${unmatchedWritten.join(', ')}`);
}

const landmarkByHex = new Map();
for (const l of landmarks) {
  const h3 = cellAt({ lat: l.at[0], lng: l.at[1] });
  if (landmarkByHex.has(h3)) {
    console.warn(`${area}: two landmarks resolved to the same hex ${h3} — keeping "${landmarkByHex.get(h3).name}", dropping "${l.name}"`);
    continue;
  }
  landmarkByHex.set(h3, { name: l.name, osmId: l.osmId, lore: l.lore, kind: l.kind, authored: l.authored });
}

const depositByHex = new Map(terrainDoc.deposits.map((d) => [d.hexId, d.resourceId]));

const hexes = {};
for (const [h3, c] of Object.entries(terrainDoc.terrain)) {
  const entry = { terrain: c.terrain, confidence: c.confidence };
  const resourceId = depositByHex.get(h3);
  if (resourceId) entry.resource = { id: resourceId };
  const landmark = landmarkByHex.get(h3);
  if (landmark) entry.landmark = landmark;
  hexes[h3] = entry;
}

const placedLandmarks = [...landmarkByHex.keys()].length;
const out = { builtAt: new Date().toISOString(), area, hexes };
const outPath = join(seedDir, `${area}.json`);
writeFileSync(outPath, `${JSON.stringify(out)}\n`, 'utf8');

console.log(
  `${area}: ${Object.keys(hexes).length} hexes, ${terrainDoc.deposits.length} with a resource, ` +
    `${placedLandmarks} with a landmark -> ${outPath}`,
);
