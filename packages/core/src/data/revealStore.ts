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
import { cellCentre } from '../geo/cells.js';
import { inBox } from '../rules/terrainSeed.js';
import { harmalaBuiltAt } from './hexSeedStore.js';
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

/**
 * Which of this device's revealed hexes might now be wrong (BRDC-SEED-005).
 *
 * The one thing a Worldseed rebuild can do that no other change to the game ever does:
 * move what a hex the player already revealed actually holds. `bountyOn`/`terrainForCell`
 * already read the *current* build live, so the card never lies about what is there today
 * — the bug is narrower than that. `revealed[h3]` is a timestamp, not a snapshot, so a
 * player who revealed a hex before a rebuild moved its deposit was paid for whatever stood
 * there *then*, and `revealAt`'s own `already-revealed` refusal means they can never be
 * paid again for what stands there *now*. Field report: *"pelaaja menetti resurssia."*
 *
 * Only seeded ground is ever suspect — pure, so a caller can act on a whole realm without
 * touching the store to find out which hexes qualify.
 */
export function staleReveals(
  revealed: Readonly<Record<H3Index, number>>,
  currentBuiltAt: string,
  lastSeenBuiltAt: string | undefined,
): H3Index[] {
  if (!currentBuiltAt || currentBuiltAt === lastSeenBuiltAt) return [];
  return Object.keys(revealed).filter((h3) => {
    const centre = cellCentre(h3);
    return inBox(centre.lat, centre.lng);
  });
}

/**
 * Clear whatever the current build made stale, once, and remember this build so the same
 * hexes are not cleared again on the next boot. A no-op whenever nothing changed —
 * `enableWorldseed(false)` (tests, and any device where Worldseed reading is off) reports
 * an empty `currentBuiltAt` and `staleReveals` refuses on that alone.
 *
 * The player loses nothing that reveal already paid — `revealed[h3]` is only ever a
 * timestamp — and gains the one thing this bug actually owes them: a fresh, correct reveal
 * on ground the game itself moved out from under them.
 */
export async function reconcileSeedReveals(store: KeyValueStore): Promise<H3Index[]> {
  const current = harmalaBuiltAt();
  const lastSeen = await store.get<string>(K.seedBuiltAt);
  const revealed = await readRevealed(store);
  const stale = staleReveals(revealed, current, lastSeen);

  if (stale.length > 0) {
    const kept = { ...revealed };
    for (const h3 of stale) delete kept[h3];
    await store.set(K.revealed, kept);
  }
  if (current && current !== lastSeen) await store.set(K.seedBuiltAt, current);
  return stale;
}
