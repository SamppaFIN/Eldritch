/**
 * BRDC-SEED-003 — classifying H3 hexes from the Worldseed document's zone overrides.
 *
 * `worldseed.ts`'s own `classify()` reads land-cover *fractions* from a full Overpass
 * survey (`SurveyRecord.cover`) — a per-hex polygon intersection this repo has no pipeline
 * for, and building one is a project of its own. What the registered seed document
 * actually carries is `zoneOverrides`: the same geography, already classified by a person
 * looking at the real map, as bounding boxes (and one shoreline rule) with an explicit
 * terrain and priority. That is real, verified data — more reliable than an automated
 * cover-fraction guess would be — so it is the input this module reads instead.
 *
 * Worldseed's own seven terrain names (`water`, `marsh`, `forest`, `hill`, `trade`,
 * `settlement`, `plain`) are not the game's nine (`BRDC-TERRAIN-005`, union not swap):
 * `marsh`/`forest`/`hill`/`plain`/`settlement` pass straight through, but `water` and
 * `trade` are Worldseed's names for concepts the game already has under different names
 * (`lake`/`coast` and `market`) — `toGameTerrain` does that conversion once, here, so nothing
 * downstream has to know Worldseed's vocabulary exists.
 */
import { neighboursOf } from '../geo/cells.js';
import type { H3Index, LatLng, TerrainKind } from '../types/domain.js';
import type { BoxTuple, LatLngTuple } from './worldseedRegister.js';

/** Worldseed's own seven-terrain vocabulary (worldseed.ts's `Terrain`), pre-conversion. */
export type WorldseedTerrain = 'water' | 'marsh' | 'forest' | 'hill' | 'trade' | 'settlement' | 'plain';

export interface ZoneOverrideRecord {
  readonly terrain: WorldseedTerrain;
  readonly name: string;
  readonly kind?: string;
  readonly bounds?: BoxTuple;
  readonly shoreline?: readonly LatLngTuple[];
  readonly priority?: number;
  readonly flags?: readonly string[];
}

export interface HexClassification {
  readonly terrain: TerrainKind;
  /** Hand-classified zone data is trusted; the terminal "not in any zone" fallback is not. */
  readonly confidence: number;
  readonly flags: readonly string[];
  readonly zoneName?: string;
}

function boundsContains(centre: LatLng, bounds: BoxTuple): boolean {
  const [south, west, north, east] = bounds;
  return centre.lat >= south && centre.lat <= north && centre.lng >= west && centre.lng <= east;
}

/**
 * "Everything north of this line is water" (the one `bboxNorthOf` zone in the Härmälä
 * seed). The shoreline runs west→east by longitude; the boundary's latitude at the hex's
 * own longitude is linearly interpolated between the two bracketing points.
 */
function isNorthOfShoreline(centre: LatLng, shoreline: readonly LatLngTuple[]): boolean {
  if (shoreline.length < 2) return false;
  const first = shoreline[0]!;
  const last = shoreline[shoreline.length - 1]!;
  if (centre.lng <= first[1]) return centre.lat > first[0];
  if (centre.lng >= last[1]) return centre.lat > last[0];

  for (let i = 0; i < shoreline.length - 1; i += 1) {
    const [lat1, lng1] = shoreline[i]!;
    const [lat2, lng2] = shoreline[i + 1]!;
    if (centre.lng >= lng1 && centre.lng <= lng2) {
      const t = lng2 === lng1 ? 0 : (centre.lng - lng1) / (lng2 - lng1);
      return centre.lat > lat1 + t * (lat2 - lat1);
    }
  }
  return false;
}

/** A hex not covered by any zone: `plain`, the same terminal fallback `classify()` uses. */
const FALLBACK: HexClassification = { terrain: 'plain', confidence: 0.4, flags: [] };

/**
 * One hex's terrain, from the zone that contains it. Ties (a hex inside two zones' bounds
 * at once) go to the higher `priority` — the seed's own example is Vähäjärven suo (marsh,
 * priority 2) winning over Vähäjärvenpuisto (forest, priority 1) at their shared edge.
 * Zones default to priority 0, so ordinary non-overlapping zones never need one.
 */
export function classifyHex(centre: LatLng, zones: readonly ZoneOverrideRecord[]): HexClassification {
  let best: { terrain: WorldseedTerrain; priority: number; flags: readonly string[]; name: string } | null =
    null;
  for (const z of zones) {
    const hit = z.kind === 'bboxNorthOf' ? isNorthOfShoreline(centre, z.shoreline ?? []) : Boolean(z.bounds) && boundsContains(centre, z.bounds!);
    if (!hit) continue;
    const priority = z.priority ?? 0;
    if (!best || priority > best.priority) {
      best = { terrain: z.terrain, priority, flags: z.flags ?? [], name: z.name };
    }
  }
  if (!best) return FALLBACK;
  return { terrain: toGameTerrain(best.terrain), confidence: 0.9, flags: best.flags, zoneName: best.name };
}

/**
 * Worldseed's `trade` is the game's `market` — a rename, nothing more. Its `water` is
 * split: a water hex bordering non-water becomes `coast` (the water's edge), an interior
 * one stays `lake`. That split needs the whole classified grid, so `water` passes through
 * unresolved here and `resolveShorelines` finishes the job afterwards.
 */
function toGameTerrain(t: WorldseedTerrain): TerrainKind {
  if (t === 'trade') return 'market';
  if (t === 'water') return 'lake';
  return t;
}

/**
 * Split `lake` into `lake`/`coast` by adjacency, in place over a copy: a water hex
 * touching at least one classified non-water neighbour is the shore, an interior one
 * stays `lake`. Its own function so a test can hand it a small, exact classification
 * without going through zone matching to get one.
 */
export function applyCoastalSplit(
  grid: readonly H3Index[],
  classified: ReadonlyMap<H3Index, HexClassification>,
): Map<H3Index, HexClassification> {
  // Reads only ever hit the original, untouched `classified` — writing into a separate
  // map keeps the split order-independent. Mutating one map in place while reading it
  // would let an already-flipped neighbour make the *next* hex think it touches land too.
  const result = new Map(classified);
  for (const h3 of grid) {
    const here = classified.get(h3);
    if (!here || here.terrain !== 'lake') continue;
    const touchesLand = neighboursOf(h3).some(
      (n) => classified.has(n) && classified.get(n)!.terrain !== 'lake',
    );
    if (touchesLand) result.set(h3, { ...here, terrain: 'coast' });
  }
  return result;
}

/**
 * Classify every hex in `grid`, then run the coastal split. `hill` never comes from a
 * zone in this data set (no hill zone is drawn) — that is `BRDC-SEED-000` D9's "no DEM
 * yet" decision showing up honestly rather than being papered over.
 */
export function classifyGrid(
  grid: readonly H3Index[],
  centreOf: (h3: H3Index) => LatLng,
  zones: readonly ZoneOverrideRecord[],
): Map<H3Index, HexClassification> {
  const result = new Map<H3Index, HexClassification>();
  for (const h3 of grid) result.set(h3, classifyHex(centreOf(h3), zones));
  return applyCoastalSplit(grid, result);
}
