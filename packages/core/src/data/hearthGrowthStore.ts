/**
 * Growing the Hearth, in the store (BRDC-HEARTH-003).
 *
 * The rule is pure (`rules/hearthGrowth.js`); this settles the pouch, works out which hexes
 * of the next ring are free to buy, pays for exactly those, and claims them — the same
 * settle → ask → write order `wardAt` takes. Ground somebody already holds, the player's own
 * included, is left alone and not charged for: this buys land, it never takes it.
 */
import { cellsWithin } from '../geo/cells.js';
import { emptyCell, resolveCapture } from '../rules/capture.js';
import {
  HEARTH_START_RING,
  growHearth,
  hearthRingHexes,
} from '../rules/hearthGrowth.js';
import type { HearthGrowthRefusal } from '../rules/hearthGrowth.js';
import { settlePouch, writePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, PlayerProfile } from '../types/domain.js';

export type HearthGrowth =
  | { ok: true; ring: number; claimed: number; already: number }
  | { ok: false; refused: HearthGrowthRefusal | 'no-hearth' };

export async function readHearthRing(store: KeyValueStore): Promise<number> {
  return (await store.get<number>(K.hearthRing)) ?? HEARTH_START_RING;
}

/** Every hex exactly `ring` steps from the Hearth. */
function ringOf(home: H3Index, ring: number): H3Index[] {
  const inner = new Set(cellsWithin(home, ring - 1));
  return cellsWithin(home, ring).filter((h) => !inner.has(h));
}

export async function growHearthAt(
  store: KeyValueStore,
  profile: PlayerProfile,
  owned: readonly Cell[],
  now: number,
): Promise<HearthGrowth> {
  const home = await store.get<H3Index>(K.home);
  if (!home) return { ok: false, refused: 'no-hearth' };

  const ring = await readHearthRing(store);
  const next = ring + 1;
  const targets = ringOf(home, next);
  const found = await store.getMany<Cell>(targets.map((h) => K.cell(h)));
  const free = targets.filter((_, i) => (found[i]?.ownerId ?? null) === null);
  const already = targets.length - free.length;

  const state = await settlePouch(store, owned, now);
  const result = growHearth(state.pool, ring, Math.min(free.length, hearthRingHexes(next)));
  if (!result.ok) return result;

  await writePouch(store, result.pool, now);
  const attacker = { id: profile.id, level: profile.level };
  for (const h3 of free) {
    const at = targets.indexOf(h3);
    const { cell } = resolveCapture(found[at] ?? emptyCell(h3), attacker, now);
    await store.set(K.cell(h3), cell);
  }
  await store.set(K.hearthRing, result.ring);
  if (free.length > 0) await writeLogEntry(store, { at: now, kind: 'awaken', count: free.length });
  return { ok: true, ring: result.ring, claimed: free.length, already };
}
