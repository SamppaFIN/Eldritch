/**
 * Fetches OpenStreetMap landmark candidates for a Worldseed area (BRDC-SEED-002).
 *
 * Worldseed §05: a Landmark is "REVEALED from OpenStreetMap" (`tourism=*`, `historic=*`,
 * `artwork_type=*`, `memorial=*`, `amenity=place_of_worship`), not built. The written
 * landmarks in `seed.<area>.json` carry the real name and lore, but their coordinates were
 * hand-transcribed off a reference image and are not reliable on their own
 * (`BRDC-SEED-001`) — this is the source of truth they get matched against.
 *
 * Reads the *registered* (translated) seed file's own `bbox`, so the query area already
 * accounts for the registration fix. Node 22's built-in `fetch` is enough for the Overpass
 * API — no new dependency.
 *
 *   pnpm typecheck && node scripts/fetch-landmarks.mjs harmala
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const area = process.argv[2];
if (!area) {
  console.error('usage: node scripts/fetch-landmarks.mjs <area>');
  process.exit(1);
}

const seedDir = join(process.cwd(), 'packages/core/src/data/seed');
const doc = JSON.parse(readFileSync(join(seedDir, `${area}.registered.json`), 'utf8'));
const [south, west, north, east] = doc.bbox;

// Worldseed's own declared landmark tag set (§05) — nothing broader. A wider net would
// pull in every sports pitch in the district, and that is not what "landmark" means here.
const query = `[out:json][timeout:25];
(
  node["tourism"](${south},${west},${north},${east});
  way["tourism"](${south},${west},${north},${east});
  node["historic"](${south},${west},${north},${east});
  way["historic"](${south},${west},${north},${east});
  node["artwork_type"](${south},${west},${north},${east});
  node["amenity"="place_of_worship"](${south},${west},${north},${east});
  way["amenity"="place_of_worship"](${south},${west},${north},${east});
  node["memorial"](${south},${west},${north},${east});
);
out center tags;`;

const res = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
    // Overpass's server rejects requests with no identifying User-Agent as 406 — this is
    // not optional (measured, not a style choice).
    'User-Agent': 'es3-worldseed/1.0 (github.com/SamppaFIN/Eldritch)',
  },
  body: `data=${encodeURIComponent(query)}`,
});
if (!res.ok) {
  console.error(`Overpass returned ${res.status} ${res.statusText}`);
  process.exit(1);
}
const raw = await res.json();

// Flatten to what landmarkSeed.ts actually needs — a name-agnostic OSM record, one
// coordinate per element (`center` for ways, `lat`/`lon` for nodes).
const elements = raw.elements.map((e) => ({
  osmId: `${e.type}/${e.id}`,
  at: [Number((e.lat ?? e.center.lat).toFixed(6)), Number((e.lon ?? e.center.lon).toFixed(6))],
  tags: e.tags ?? {},
}));

const outPath = join(seedDir, `${area}.landmarks.osm.json`);
writeFileSync(outPath, `${JSON.stringify({ fetchedAt: new Date().toISOString(), elements }, null, 2)}\n`, 'utf8');
console.log(`${elements.length} OSM elements -> ${outPath}`);
