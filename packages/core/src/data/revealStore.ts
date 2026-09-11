/**
 * Revealing a cell for its tier bonus, in the store (BRDC-CLAIM-009).
 *
 * `reveal.js` decides the tier and what it pays (pure); this is the thin verb — confirm
 * the cell is yours and not already revealed, grant the bonus, remember it. Free, once
 * per cell: the reward for looking, not a trade.
 */
import { revealBonus, revealOf } from '../rules/reveal.js';
import { findWonderAt } from './wonderStore.js';
import type { WonderId } from '../rules/wonder.js';
import type { Rarity } from '../rules/reveal.js';
import type { ResourcePool } from '../rules/terrain.js';
import { grantBonus } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

export type RevealRefusal = 'not-yours' | 'already-revealed';
export type RevealOutcome =
  | { ok: true; tier: Rarity; bonus: Partial<ResourcePool>; wonder?: WonderId }
  | { ok: false; refused: RevealRefusal };

export async function readRevealed(store: KeyValueStore): Promise<Record<H3Index, number>> {
  return (await store.get<Record<H3Index, number>>(K.revealed)) ?? {};
}

export async function revealAt(
  store: KeyValueStore,
  h3: H3Index,
  owned: readonly Cell[],
  now: number,
): Promise<RevealOutcome> {
  if (!owned.some((c) => c.h3 === h3)) return { ok: false, refused: 'not-yours' };

  const revealed = await readRevealed(store);
  if (revealed[h3] !== undefined) return { ok: false, refused: 'already-revealed' };

  const bonus = revealBonus(h3);
  if (Object.keys(bonus).length > 0) await grantBonus(store, owned, bonus, now);
  await store.set(K.revealed, { ...revealed, [h3]: now });
  await writeLogEntry(store, { at: now, kind: 'reveal', ref: h3 });

  // Looking closely is how a wonder is found (BRDC-WONDER-001). Almost every reveal
  // returns null here — the province check rejects on a string compare — so this costs
  // the ordinary case nothing.
  const cell = owned.find((c) => c.h3 === h3) as Cell;
  const wonder = await findWonderAt(store, cell, now);
  const found = { ok: true as const, tier: revealOf(h3), bonus };
  // Spread rather than `wonder: x ?? undefined` — `exactOptionalPropertyTypes` means an
  // explicit undefined is not the same as an absent key, and absent is what this means.
  return wonder ? { ...found, wonder } : found;
}
