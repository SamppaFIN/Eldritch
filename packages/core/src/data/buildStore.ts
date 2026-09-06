/**
 * Putting a building on a cell, and taking it off again (BRDC-BUILD-001).
 *
 * The table and the predicate are pure (`rules/build.js`). This is the half that touches
 * the store — the seam `techStore.js` and `worldStore.js` already use, so MockRepository
 * does not grow two more verbs inline. `wardWith` in pouch.js is the shape: settle the
 * pouch, ask the rule, and write only on success.
 */
import { BUILDINGS, buildCost, buildingsOf, canBuild, refund, worksOn } from '../rules/build.js';
import type { BuildRefusal, BuildingId } from '../rules/build.js';
import { spend } from '../rules/terrain.js';
import type { ResourceKind } from '../rules/terrain.js';
import { projectCell } from '../rules/decay.js';
import type { TechId } from '../rules/tech.js';
import { settlePouch, writePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, PlayerId } from '../types/domain.js';

export type BuildOutcome = { ok: true; cell: Cell } | { ok: false; refused: BuildRefusal };
export type DemolishOutcome = { ok: true; cell: Cell } | { ok: false; refused: 'nothing-here' };

/**
 * Build `id` on the cell at `h3`, paying from the pouch.
 *
 * Projected first, like `wardCell`: a cell decay has already released is not somewhere to
 * build. On any refusal nothing is written — the spend and the cell write happen together
 * or not at all.
 */
export async function buildOn(
  store: KeyValueStore,
  h3: string,
  id: BuildingId,
  me: PlayerId,
  owned: readonly Cell[],
  researched: readonly TechId[],
  now: number,
  templeAdjacent = false,
): Promise<BuildOutcome> {
  const stored = await store.get<Cell>(K.cell(h3));
  const live = stored ? projectCell(stored, now) : null;
  if (!live) return { ok: false, refused: 'not-yours' };

  const state = await settlePouch(store, owned, now);
  const check = canBuild(
    { playerId: me, researched, pool: state.pool, buildings: buildingsOf(owned), templeAdjacent },
    id,
    live,
  );
  if (!check.ok) return check;

  const paid = spend(state.pool, buildCost(id));
  if (!paid) return { ok: false, refused: 'cannot-afford' };
  await writePouch(store, paid, now);

  // An upgrade takes its predecessor's slot rather than sitting beside it (BUILD-007);
  // everything else joins what is already there, up to the per-cell cap `canBuild` checked.
  const replaced = new Set<BuildingId>(BUILDINGS[id].requires);
  const kept = worksOn(live).filter((w) => !replaced.has(w.id));
  const built: Cell = { ...live, buildings: [...kept, { id, builtAt: now }] };
  await store.set(K.cell(h3), built);
  await writeLogEntry(store, { at: now, kind: 'build', ref: id });
  return { ok: true, cell: built };
}

/**
 * Demolish the building at `h3` and hand back half its cost.
 *
 * The refund is not clamped to the storage cap — it is a return of what was spent, the
 * same stance `addClaimYield` takes. A misplaced building being permanent would make the
 * map a board you cannot re-lay.
 */
export async function demolishOn(
  store: KeyValueStore,
  h3: string,
  owned: readonly Cell[],
  now: number,
  /** Which Work to take down. Omitted, the most recently built one goes (BUILD-007). */
  id?: BuildingId,
): Promise<DemolishOutcome> {
  const stored = await store.get<Cell>(K.cell(h3));
  const here = stored ? worksOn(stored) : [];
  const removed = id ?? here[here.length - 1]?.id;
  if (!stored || !removed || !here.some((w) => w.id === removed)) {
    return { ok: false, refused: 'nothing-here' };
  }

  const state = await settlePouch(store, owned, now);
  const back = refund(removed);
  const pool = { ...state.pool };
  for (const [k, v] of Object.entries(back) as [ResourceKind, number][]) pool[k] += v;
  await writePouch(store, pool, now);

  const left = here.filter((w) => w.id !== removed);
  const bare: Cell = { ...stored };
  if (left.length > 0) bare.buildings = left;
  else delete bare.buildings;
  await store.set(K.cell(h3), bare);
  await writeLogEntry(store, { at: now, kind: 'demolish', ref: removed });
  return { ok: true, cell: bare };
}
