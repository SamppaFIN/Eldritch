/**
 * Revealing a cell for its tier bonus, in the store (BRDC-CLAIM-009).
 *
 * `reveal.js` decides the tier and what it pays (pure); this is the thin verb — confirm
 * the cell is yours and not already revealed, grant the bonus, remember it. Free, once
 * per cell: the reward for looking, not a trade.
 */
import { revealBonus, revealOf } from '../rules/reveal.js';
import type { Rarity } from '../rules/reveal.js';
import type { ResourcePool } from '../rules/terrain.js';
import { grantBonus } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

export type RevealRefusal = 'not-yours' | 'already-revealed';
export type RevealOutcome =
  | { ok: true; tier: Rarity; bonus: Partial<ResourcePool> }
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
  return { ok: true, tier: revealOf(h3), bonus };
}
