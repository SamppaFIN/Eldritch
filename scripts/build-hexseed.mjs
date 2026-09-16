/**
 * Assembles the final per-hex HexSeed for one area (BRDC-SEED-004, BRDC-WONDER-002).
 *
 * Combines what the earlier steps produced — BRDC-SEED-003's terrain and deposits
 * (`<area>.terrain.json`), BRDC-SEED-002's landmark reconciliation (run fresh here against
 * the registered document and the frozen OSM fixture), and BRDC-WONDER-002's nine local
 * wonders (placed near the registered document's own `wonders[].at`, gated hard on
 * terrain and flags — no scoring, and a miss stays unplaced rather than landing on the
 * wrong ground) — into one lean, per-hex record the game can actually read. Quests are
 * not part of this output: they already have their own confirmed sites (`questSites.ts`),
 * never a per-hex seed.
 *
 * Wonder placement checks the hint's own hex first, then its six neighbours (~50 m out) —
 * measured necessary: the raw hint coordinate is a few metres from the zone-classified
 * ground it names often enough (the same discretisation `BRDC-LANDMARK-001` found for the
 * statue) that checking only the exact hex left 7 of 9 unplaced. Still a hard gate, never a
 * score: the first neighbour that fits wins, not the "best" one.
 *
 *   pnpm typecheck && node scripts/build-hexseed.mjs harmala
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cellAt, neighboursOf } from '../packages/core/dist/geo/cells.js';
import { seedLandmarks } from '../packages/core/dist/data/landmarkSeed.js';
import { HARMALA_WONDER_IDS, HARMALA_WONDERS, harmalaWonderFits } from '../packages/core/dist/rules/harmalaWonder.js';

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

// Wonder placement: the registered document's own `at` for each worldseed id, checked
// hard against that exact hex's classified terrain and flags. A miss is reported, not
// silently dropped — it is real information about how much of the nine this data can
// actually place without a full OSM survey behind it.
const atByWorldseedId = new Map((registered.wonders ?? []).map((w) => [w.id, w.at]));
const wonderByHex = new Map();
const unplacedWonders = [];
for (const id of HARMALA_WONDER_IDS) {
  const w = HARMALA_WONDERS[id];
  const at = atByWorldseedId.get(w.worldseedId);
  if (!at) {
    unplacedWonders.push(`${w.name} (no ${w.worldseedId} in ${area}.registered.json)`);
    continue;
  }
  const hint = cellAt({ lat: at[0], lng: at[1] });
  const candidates = [hint, ...neighboursOf(hint)];
  const fit = candidates.find((h3) => {
    const c = terrainDoc.terrain[h3];
    return c && harmalaWonderFits(id, c.terrain, c.flags ?? []);
  });
  if (!fit) {
    const hintGround = terrainDoc.terrain[hint];
    const got = hintGround ? `${hintGround.terrain} [${(hintGround.flags ?? []).join(',')}]` : 'outside the grid';
    unplacedWonders.push(`${w.name} (hint and its neighbours are ${got} etc., needs ${w.requireTerrain.join('/')} ${w.requireFlags.join('+')})`.trim());
    continue;
  }
  wonderByHex.set(fit, { kind: 'wonder', id });
}

const hexes = {};
for (const [h3, c] of Object.entries(terrainDoc.terrain)) {
  const entry = { terrain: c.terrain, confidence: c.confidence };
  const resourceId = depositByHex.get(h3);
  if (resourceId) entry.resource = { id: resourceId };
  const landmark = landmarkByHex.get(h3);
  if (landmark) entry.landmark = landmark;
  const structure = wonderByHex.get(h3);
  if (structure) entry.structure = structure;
  hexes[h3] = entry;
}

const placedLandmarks = [...landmarkByHex.keys()].length;
const out = { builtAt: new Date().toISOString(), area, hexes };
const outPath = join(seedDir, `${area}.json`);
writeFileSync(outPath, `${JSON.stringify(out)}\n`, 'utf8');

if (unplacedWonders.length > 0) {
  console.warn(`${area}: ${unplacedWonders.length}/${HARMALA_WONDER_IDS.length} wonders left unplaced:\n  ${unplacedWonders.join('\n  ')}`);
}
console.log(
  `${area}: ${Object.keys(hexes).length} hexes, ${terrainDoc.deposits.length} with a resource, ` +
    `${placedLandmarks} with a landmark, ${wonderByHex.size}/${HARMALA_WONDER_IDS.length} wonders placed -> ${outPath}`,
);
