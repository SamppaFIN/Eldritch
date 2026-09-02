/**
 * Temple expansion levels, in the store (BRDC-MANA-001).
 *
 * The rate maths and the spend rule are pure (`rules/mana.js`). This is the half that
 * touches the store — the seam `techStore.js` and `buildStore.js` already are, so
 * MockRepository does not grow another verb inline. `wardWith` in pouch.js is the shape:
 * settle the pouch, ask the rule, write only on success.
 */
import { consecrateCost, expandTemple } from '../rules/mana.js';
import type { ExpandRefusal } from '../rules/mana.js';
import { TEMPLE_THRESHOLD_MS } from '../rules/dwell.js';
import type { DwellMap } from '../rules/dwell.js';
import { spend } from '../rules/terrain.js';
import { settlePouch, writePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, RevealedPlace } from '../types/domain.js';

export type ExpandOutcome =
  | { ok: true; level: number }
  | { ok: false; refused: ExpandRefusal | 'not-a-temple' };

export type ConsecrateRefusal = 'not-yours' | 'already-a-place' | 'is-hearth' | 'cannot-afford';
export type ConsecrateOutcome = { ok: true } | { ok: false; refused: ConsecrateRefusal };

/**
 * Consecrate the cell at `h3` as a temple with stone and gold (BRDC-TEMPLE-001).
 *
 * A temple has only ever come from time in a place; this lets resources stand in for that
 * time, discounted by whatever dwell the cell has already banked. There is no new key:
 * `placesWithHome` / `revealPlaces` / `manaBonus` all read temples out of `K.dwell`, so
 * writing that cell's dwell up to `TEMPLE_THRESHOLD_MS` *is* the consecration, and it is
 * a temple everywhere at once. Settles the pouch first; on any refusal nothing is written.
 */
export async function consecrateAt(
  store: KeyValueStore,
  h3: H3Index,
  owned: readonly Cell[],
  home: H3Index | null,
  now: number,
): Promise<ConsecrateOutcome> {
  if (!owned.some((c) => c.h3 === h3)) return { ok: false, refused: 'not-yours' };
  if (h3 === home) return { ok: false, refused: 'is-hearth' };

  const dwell = (await store.get<DwellMap>(K.dwell)) ?? {};
  const dwellMs = dwell[h3] ?? 0;
  if (dwellMs >= TEMPLE_THRESHOLD_MS) return { ok: false, refused: 'already-a-place' };

  const cost = consecrateCost(dwellMs);
  if (Object.keys(cost).length > 0) {
    const state = await settlePouch(store, owned, now);
    const paid = spend(state.pool, cost);
    if (!paid) return { ok: false, refused: 'cannot-afford' };
    await writePouch(store, paid, now);
  }

  await store.set(K.dwell, { ...dwell, [h3]: Math.max(dwellMs, TEMPLE_THRESHOLD_MS) });
  await writeLogEntry(store, { at: now, kind: 'mana', ref: 'consecrate' });
  return { ok: true };
}

export async function readExpansions(store: KeyValueStore): Promise<Record<H3Index, number>> {
  return (await store.get<Record<H3Index, number>>(K.expansions)) ?? {};
}

/**
 * Raise the temple at `h3` one expansion step, paying stone and gold from the pouch.
 *
 * `places` is the caller's already-revealed list. Only a temple in it can be expanded —
 * the Anchor is innately the strongest source and not a build target (GREEN 3), and bare
 * ground is `not-a-temple`. Settles first, so the mana owed up to now is banked at the
 * old rate before the level moves. On any refusal nothing is written.
 */
export async function expandTempleAt(
  store: KeyValueStore,
  h3: H3Index,
  places: readonly RevealedPlace[],
  owned: readonly Cell[],
  now: number,
): Promise<ExpandOutcome> {
  const place = places.find((p) => p.h3 === h3);
  if (!place || place.kind !== 'temple') return { ok: false, refused: 'not-a-temple' };

  const state = await settlePouch(store, owned, now);
  const expansions = await readExpansions(store);
  const result = expandTemple(expansions[h3] ?? 0, state.pool);
  if (!result.ok) return result;

  await writePouch(store, result.pool, now);
  await store.set(K.expansions, { ...expansions, [h3]: result.level });
  await writeLogEntry(store, { at: now, kind: 'expand', count: result.level });
  return { ok: true, level: result.level };
}
