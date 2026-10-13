/**
 * The pouch's two oldest spends — a Ward and a technology — split from `pouch.ts` at its
 * line limit (BRDC-ECON-010). Both settle first and write the spend back as a change.
 */
import { ward } from '../rules/ward.js';
import type { WardResult } from '../rules/ward.js';
import { research } from '../rules/tech.js';
import type { ResearchResult, TechId } from '../rules/tech.js';
import type { ResourcePool } from '../rules/terrain.js';
import { settlePouch, writePouch } from './pouch.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, PlayerId } from '../types/domain.js';

/**
 * Spend the pouch to ward one cell.
 *
 * Settles first: the trickle owed up to this moment has to be in the pool before it is
 * spent, or a player is refused a ward they had already earned the timber for.
 *
 * Returns the new cell rather than writing it — the cell store belongs to the repository
 * and this module only owns the ledger.
 */
export async function wardWith(
  store: KeyValueStore,
  cell: Cell,
  me: PlayerId,
  owned: readonly Cell[],
  now: number, cost?: Readonly<Partial<ResourcePool>>, // nothing for a free Ward (BRDC-MIND-001)
): Promise<WardResult> {
  const state = await settlePouch(store, owned, now);
  const result = ward(cell, state.pool, me, cost);
  if (result.warded) await writePouch(store, state.pool, result.pool, now);
  return result;
}

/**
 * Spend wisdom to research one technology (BRDC-TECH-001).
 *
 * The pouch's second verb, after warding. Settles first — the trickle owed up to now has
 * to be banked before it can be spent — and writes the pool back only on success. The
 * researched list itself belongs to the repository; this module only moves the wisdom.
 */
export async function researchWith(
  store: KeyValueStore,
  researched: readonly TechId[],
  id: TechId,
  owned: readonly Cell[],
  now: number,
): Promise<ResearchResult> {
  const state = await settlePouch(store, owned, now);
  const result = research(researched, id, state.pool);
  if (result.ok) await writePouch(store, state.pool, result.pool, now);
  return result;
}
