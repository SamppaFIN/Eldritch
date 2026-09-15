/**
 * BRDC-SEED-001 — registering the Worldseed documents' geometry onto the confirmed world.
 *
 * The documents (`worldseed.ts`, `seed.<area>.json`) were authored against a reference
 * screenshot, not against the game's own confirmed coordinates. A registration screenshot —
 * both layers drawn on the real basemap — measured the gap: the whole document sits about
 * 402 m north and 150 m west of `HARMALA_STATUE`, the statue Infinite long-pressed. One
 * translation vector moves the entire document; nothing in it is independently wrong.
 * `BRDC-QUEST-006` found the same shape of bug in code (a pinned anchor with a zero-vector
 * shape offset); this is the same bug, in the source document instead.
 *
 * `registerWorldseed` walks every coordinate the seed file carries and adds that one vector.
 * Pure, no I/O — `scripts/register-worldseed.mjs` is the one place it actually runs, once,
 * against the checked-in source copy, and the translated result is committed.
 */
import type { LatLng } from '../types/domain.js';

/** `[lat, lng]`, the shape every Worldseed document uses — `{lat, lng}` everywhere else here. */
export type LatLngTuple = readonly [number, number];

/** `[south, west, north, east]` — a bounding box in the same tuple convention. */
export type BoxTuple = readonly [number, number, number, number];

/** 6 dp, matching `HexSeed.center`'s own precision (worldseed.ts) — about 11 cm. */
function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** The vector from the document's own anchor to the confirmed one, in degrees. */
export function registrationDelta(docAnchor: LatLngTuple, gameAnchor: LatLng): LatLng {
  return { lat: gameAnchor.lat - docAnchor[0], lng: gameAnchor.lng - docAnchor[1] };
}

function shiftPoint(p: LatLngTuple, d: LatLng): [number, number] {
  return [round6(p[0] + d.lat), round6(p[1] + d.lng)];
}

function shiftBox(b: BoxTuple, d: LatLng): [number, number, number, number] {
  return [round6(b[0] + d.lat), round6(b[1] + d.lng), round6(b[2] + d.lat), round6(b[3] + d.lng)];
}

function shiftPath(path: readonly LatLngTuple[], d: LatLng): Array<[number, number]> {
  return path.map((p) => shiftPoint(p, d));
}

/** One record carrying a single `at` point, plus whatever else it happens to hold. */
type WithAt = { readonly at: LatLngTuple } & Record<string, unknown>;

function shiftAt<T extends WithAt>(item: T, d: LatLng): T {
  return { ...item, at: shiftPoint(item.at, d) };
}

interface ZoneOverride extends Record<string, unknown> {
  readonly bounds?: BoxTuple | undefined;
  readonly shoreline?: readonly LatLngTuple[] | undefined;
}

interface LeyLine extends Record<string, unknown> {
  readonly path: readonly LatLngTuple[];
}

interface QuestChain extends Record<string, unknown> {
  readonly nodes?: readonly WithAt[] | undefined;
  readonly items?: readonly WithAt[] | undefined;
}

/**
 * The coordinate-bearing shape of `seed.<area>.json`. Every other field (`$schema`,
 * `displayName`, `rngSeed`, `_note`, `_deposits`, `expectedCounts`, …) passes through the
 * spread untouched in `registerWorldseed` — this type only names fields that hold a
 * coordinate, because those are the only ones it needs to look inside.
 */
export interface WorldseedDoc extends Record<string, unknown> {
  readonly grid: { readonly origin: LatLngTuple } & Record<string, unknown>;
  readonly bbox: BoxTuple;
  readonly anchorStone?: WithAt | undefined;
  readonly landmarks?: readonly WithAt[] | undefined;
  readonly zoneOverrides?: readonly ZoneOverride[] | undefined;
  readonly leyLines?: readonly LeyLine[] | undefined;
  readonly wonders?: readonly WithAt[] | undefined;
  readonly questChains?: readonly QuestChain[] | undefined;
}

/** The one landmark every Worldseed document anchors on — the confirmed statue. */
const STATUE_NAME = 'Statue of the Boy';

/**
 * Translate every coordinate in `doc` by the vector from its own `"Statue of the Boy"`
 * landmark to `anchor` — the confirmed, real one (`HARMALA_STATUE`, `terrainSeed.ts`).
 */
export function registerWorldseed(doc: WorldseedDoc, anchor: LatLng): WorldseedDoc {
  const statue = doc.landmarks?.find((l) => l.name === STATUE_NAME);
  if (!statue) {
    throw new Error(`registerWorldseed: no "${STATUE_NAME}" landmark to anchor on`);
  }
  const delta = registrationDelta(statue.at, anchor);

  return {
    ...doc,
    grid: { ...doc.grid, origin: shiftPoint(doc.grid.origin, delta) },
    bbox: shiftBox(doc.bbox, delta),
    anchorStone: doc.anchorStone && shiftAt(doc.anchorStone, delta),
    landmarks: doc.landmarks?.map((l) => shiftAt(l, delta)),
    zoneOverrides: doc.zoneOverrides?.map((z) => ({
      ...z,
      bounds: z.bounds && shiftBox(z.bounds, delta),
      shoreline: z.shoreline && shiftPath(z.shoreline, delta),
    })),
    leyLines: doc.leyLines?.map((l) => ({ ...l, path: shiftPath(l.path, delta) })),
    wonders: doc.wonders?.map((w) => shiftAt(w, delta)),
    questChains: doc.questChains?.map((c) => ({
      ...c,
      nodes: c.nodes?.map((n) => shiftAt(n, delta)),
      items: c.items?.map((i) => shiftAt(i, delta)),
    })),
  };
}
