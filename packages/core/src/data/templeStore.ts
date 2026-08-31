/**
 * Temple expansion levels, in the store (BRDC-MANA-001).
 *
 * The rate maths and the spend rule are pure (`rules/mana.js`). This is the half that
 * touches the store — the seam `techStore.js` and `buildStore.js` already are, so
 * MockRepository does not grow another verb inline. `wardWith` in pouch.js is the shape:
 * settle the pouch, ask the rule, write only on success.
 */
import { expandTemple } from '../rules/mana.js';
import type { ExpandRefusal } from '../rules/mana.js';
import { settlePouch, writePouch } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, RevealedPlace } from '../types/domain.js';

export type ExpandOutcome =
  | { ok: true; level: number }
  | { ok: false; refused: ExpandRefusal | 'not-a-temple' };

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
  return { ok: true, level: result.level };
}
