/**
 * Cell storage: the raw read/write layer beneath the territory rules.
 *
 * Pulled out of MockRepository once it neared the 400-line limit — the same seam as
 * pouch.ts, hearth.ts and wager.ts already used. This module knows how cells are keyed
 * and read; it holds no rules of its own (those stay in rules/decay.ts).
 *
 * `cellsInBBox` is a bounded read (BRDC-SCALE-001): the res-6 region is in the cell key,
 * so a viewport query range-scans only the regions it overlaps. `allCells` is still a
 * full scan, and stays one — `runDecay` and `getOwnedCells` genuinely want every cell,
 * and neither is spatially bounded.
 */
import { cellToLatLng } from 'h3-js';
import { regionsCoveringBBox } from '../geo/cells.js';
import { sweepDecay } from '../rules/decay.js';
import type { DecaySweep } from '../rules/decay.js';
import type { KeyValueStore } from './kv.js';
import { K } from './keys.js';
import type { BBox, Cell, PlayerId } from '../types/domain.js';

export const CELL_PREFIX = 'cell:';

/**
 * Every stored cell. Callers that only need a subset should prefer a narrower read.
 *
 * Reads through `getMany` rather than a `get()` loop: on IndexedDB that is one
 * transaction for every key it holds instead of one for the whole batch. Which keys
 * to read is still a full scan (see the module doc) — this only fixes how they are
 * fetched once known, not how many there are.
 */
export async function allCells(store: KeyValueStore): Promise<Cell[]> {
  const keys = await store.keys(CELL_PREFIX);
  const values = await store.getMany<Cell>(keys);
  return values.filter((cell): cell is Cell => cell !== undefined);
}

/** Does this player hold anything at all? The seed exception in growth.ts turns on this. */
export async function hasGround(store: KeyValueStore, playerId: PlayerId): Promise<boolean> {
  return (await allCells(store)).some((cell) => cell.ownerId === playerId);
}

/**
 * Cells inside `bbox`, read region by region rather than by scanning the whole store.
 *
 * `regionsCoveringBBox` gives the handful of res-6 regions the viewport touches; each one
 * is a single bounded `keys()` range scan (`IDBKeyRange` on IdbStore). The `inBBox` filter
 * still runs — a region is ~36 km², larger than any phone viewport — but nothing outside
 * those regions is ever read.
 */
export async function cellsInBBox(store: KeyValueStore, bbox: BBox): Promise<Cell[]> {
  const keys: string[] = [];
  for (const region of regionsCoveringBBox(bbox)) {
    keys.push(...(await store.keys(`${CELL_PREFIX}${region}:`)));
  }
  const values = await store.getMany<Cell>(keys);
  return values.filter((cell): cell is Cell => cell !== undefined && inBBox(cell, bbox));
}

/**
 * Age a set of cells to `now` and persist every release.
 *
 * The one thing a decay sweep ever writes back: a cell that hit zero strength is
 * genuinely unowned again, and leaving it on disk would keep a ghost nobody can take.
 * `getCells`, `getOwnedCells` and `runDecay` all did this identically inline before —
 * three copies of the same rule is how one of them quietly drifts from the other two.
 */
export async function sweepAndPersist(
  store: KeyValueStore,
  cells: readonly Cell[],
  now: number,
): Promise<DecaySweep> {
  const sweep = sweepDecay(cells, now);
  for (const h3 of sweep.released) await store.delete(K.cell(h3));
  return sweep;
}

/**
 * Cheap bbox test on the cell's own index.
 *
 * Decoding every stored cell to a boundary would be exact but pointless here: a res-11
 * cell is ~40 m across, and the viewport query only needs to be right to within a cell.
 */
function inBBox(cell: Cell, bbox: BBox): boolean {
  const { lat, lng } = cellCentre(cell.h3);
  return lat >= bbox.south && lat <= bbox.north && lng >= bbox.west && lng <= bbox.east;
}

const centreCache = new Map<string, { lat: number; lng: number }>();

function cellCentre(h3: string): { lat: number; lng: number } {
  const hit = centreCache.get(h3);
  if (hit) return hit;
  const [lat, lng] = cellToLatLng(h3);
  const value = { lat, lng };
  centreCache.set(h3, value);
  return value;
}
