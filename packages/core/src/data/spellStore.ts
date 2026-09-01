/**
 * Running spells, in the store (BRDC-SPELL-001).
 *
 * The table and the cast rule are pure (`rules/spell.js`); this is the seam that touches
 * the store, beside `techStore.js` and `templeStore.js`. `wardWith` in `pouch.js` is the
 * shape: settle the pouch, ask the rule, write only on success.
 *
 * The stored list is pruned on every cast — `activeSpells` drops the expired ones before
 * the new one is appended, so nothing has to sweep it on a timer.
 */
import { BULWARK_SHELTER_MS, activeSpells, castSpell } from '../rules/spell.js';
import type { ActiveSpell, CastRefusal, SpellId } from '../rules/spell.js';
import { readResearched } from './techStore.js';
import { settlePouch, writePouch } from './pouch.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, PlayerId } from '../types/domain.js';

export type CastOutcome =
  | { ok: true; spell: ActiveSpell }
  | { ok: false; refused: CastRefusal };

export async function readSpells(store: KeyValueStore): Promise<ActiveSpell[]> {
  return (await store.get<ActiveSpell[]>(K.spells)) ?? [];
}

/**
 * Cast `id` at `target`, paying mana from the pouch, and store it among the running spells.
 *
 * Settles first, so mana owed up to now is banked before it is spent. On any refusal
 * nothing is written.
 */
export async function castSpellAt(
  store: KeyValueStore,
  id: SpellId,
  target: H3Index | null,
  me: PlayerId,
  owned: readonly Cell[],
  now: number,
): Promise<CastOutcome> {
  const state = await settlePouch(store, owned, now);
  const running = activeSpells(await readSpells(store), now);
  const result = castSpell(
    {
      playerId: me,
      researched: await readResearched(store),
      pool: state.pool,
      owned,
      active: running,
    },
    id,
    target,
    now,
  );
  if (!result.ok) return result;

  await writePouch(store, result.pool, now);
  await store.set(K.spells, [...running, result.spell]);

  // Bulwark buys decay-clock time on the spot: the hours are baked into the cell so they
  // survive the spell's own countdown ending (BRDC-SPELL-001).
  if (id === 'bulwark' && target) {
    const stored = await store.get<Cell>(K.cell(target));
    if (stored) {
      await store.set(K.cell(target), {
        ...stored,
        shelteredMs: (stored.shelteredMs ?? 0) + BULWARK_SHELTER_MS,
      });
    }
  }
  return { ok: true, spell: result.spell };
}
