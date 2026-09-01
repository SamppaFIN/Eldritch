/**
 * Putting a building on a cell, and taking it off again (BRDC-BUILD-001).
 *
 * The table and the predicate are pure (`rules/build.js`). This is the half that touches
 * the store — the seam `techStore.js` and `worldStore.js` already use, so MockRepository
 * does not grow two more verbs inline. `wardWith` in pouch.js is the shape: settle the
 * pouch, ask the rule, and write only on success.
 */
import { buildCost, buildingsOf, canBuild, refund } from '../rules/build.js';
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

  const built: Cell = { ...live, building: { id, builtAt: now } };
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
): Promise<DemolishOutcome> {
  const stored = await store.get<Cell>(K.cell(h3));
  if (!stored?.building) return { ok: false, refused: 'nothing-here' };

  const state = await settlePouch(store, owned, now);
  const back = refund(stored.building.id);
  const pool = { ...state.pool };
  for (const [k, v] of Object.entries(back) as [ResourceKind, number][]) pool[k] += v;
  await writePouch(store, pool, now);

  const removed = stored.building.id;
  const bare: Cell = { ...stored };
  delete bare.building;
  await store.set(K.cell(h3), bare);
  await writeLogEntry(store, { at: now, kind: 'demolish', ref: removed });
  return { ok: true, cell: bare };
}
