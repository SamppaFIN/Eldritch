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
import { BULWARK_SHELTER_MS, SPELLS, activeSpells, castSpell } from '../rules/spell.js';
import type { ActiveSpell, CastRefusal, SpellId } from '../rules/spell.js';
import { emptyCell, resolveCapture } from '../rules/capture.js';
import { XP_PER_CELL_CLAIMED } from '../rules/constants.js';
import { cellsWithin, neighboursOf } from '../geo/cells.js';
import { readResearched } from './techStore.js';
import { awardClaims, settlePouch, writePouch } from './pouch.js';
import { addXpTo } from './profileStore.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { CaptureOutcome, Cell, H3Index, PlayerId, PlayerProfile } from '../types/domain.js';

export type CastOutcome =
  | { ok: true; spell: ActiveSpell; reached?: H3Index[] }
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
  profile: PlayerProfile,
  newId: () => string,
  owned: readonly Cell[],
  now: number,
): Promise<CastOutcome> {
  const me: PlayerId = profile.id;
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
  // An instant Rite is never stored: `activeSpells` would drop it on the next read
  // anyway, and a list that only grows is a list that eventually has to be swept.
  if (SPELLS[id].durationMs > 0) await store.set(K.spells, [...running, result.spell]);
  await writeLogEntry(store, { at: now, kind: 'spell', ref: id });

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

  if (target && id === 'farsight') {
    return { ok: true, spell: result.spell, reached: await survey(store, target, reach(id)) };
  }
  if (target && id === 'quickening') {
    const woken = await quicken(store, target, reach(id), profile, newId, owned, now);
    return { ok: true, spell: result.spell, reached: woken };
  }
  return { ok: true, spell: result.spell };
}

/**
 * Farsight: put the ground around `centre` on the map without walking it.
 *
 * A stored cell with no owner is exactly what a hex next to yours already is — the map
 * draws it in the neutral seen-not-held tone and `terrainForCell` answers for its ground.
 * So revealing is nothing more than writing the empty cells that were never written, and
 * a cell that already exists is left completely alone: it may be held, decaying, or
 * carrying a Work, and none of that is Farsight's business.
 */
async function survey(store: KeyValueStore, centre: H3Index, rings: number): Promise<H3Index[]> {
  const reached: H3Index[] = [];
  for (const h3 of cellsWithin(centre, rings)) {
    if (await store.get<Cell>(K.cell(h3))) continue;
    await store.set(K.cell(h3), emptyCell(h3));
    reached.push(h3);
  }
  return reached;
}

/**
 * Quickening: claim the unheld ground within one ring of `centre`.
 *
 * Held ground is skipped in silence, whoever holds it. Taking a rival's cell is the
 * siege's job and stays that way — a Rite that flipped ownership outright would undo the
 * two-or-three-walks-on-separate-days rule the whole capture model exists to enforce.
 *
 * What lands is written exactly the way a step-claim writes it (`stepStore.ts`):
 * `resolveCapture` for each cell, one `awardClaims` for the yield, XP per cell, one log
 * line for the lot. A hex taken this way is indistinguishable from one walked onto.
 */
/** How far a Rite reaches. Zero rings is the target hex alone, which is a sane default. */
const reach = (id: SpellId): number => SPELLS[id].reach ?? 0;

async function quicken(
  store: KeyValueStore,
  centre: H3Index,
  rings: number,
  profile: PlayerProfile,
  newId: () => string,
  owned: readonly Cell[],
  now: number,
): Promise<H3Index[]> {
  const held = new Set(owned.map((c) => c.h3));
  const taken: H3Index[] = [];
  const outcomes: CaptureOutcome[] = [];
  const cells: Cell[] = [];

  for (const h3 of cellsWithin(centre, rings)) {
    const stored = await store.get<Cell>(K.cell(h3));
    if (stored?.ownerId) continue;

    // Counted against the ground held before this cast, plus what it has already taken:
    // the ring fills outward from your border, so a cell's neighbour bonus can include
    // one the same Rite just woke.
    const ownedNeighbours = neighboursOf(h3).filter(
      (n) => held.has(n) || taken.includes(n),
    ).length;
    const { cell, outcome } = resolveCapture(
      stored ?? emptyCell(h3),
      { id: profile.id, level: profile.level, ownedNeighbours },
      now,
    );
    if (outcome.kind !== 'claimed') continue;

    await store.set(K.cell(h3), cell);
    taken.push(h3);
    outcomes.push(outcome);
    cells.push(cell);
  }

  if (taken.length === 0) return [];
  await addXpTo(store, newId, XP_PER_CELL_CLAIMED * taken.length);
  await awardClaims(store, [...owned, ...cells], outcomes, now);
  await writeLogEntry(store, { at: now, kind: 'awaken', count: taken.length });
  return taken;
}
