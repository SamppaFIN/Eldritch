/**
 * Putting the city states on the map, and trading at their quays (BRDC-DIPLO-001).
 *
 * The table and the arithmetic are pure (`rules/cityState.js`); this is the half that
 * touches the store — `buildStore.js` is the shape.
 *
 * Placement is idempotent and non-destructive. It writes a cell only where there is none:
 * ground a player already holds is never overwritten by a village appearing, which is the
 * same stance `mergeWorld` takes for `world.json`. A city state is a neighbour, not a
 * land grab.
 */
import { CITY_STATES, cityStateOf, trade } from '../rules/cityState.js';
import type { CityState, TradeResult } from '../rules/cityState.js';
import type { ResourceKind } from '../rules/terrain.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { settlePouch, writePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

/** The quay — the one hex diplomacy happens at. */
export function doorCell(city: CityState): H3Index {
  return cellAt(city.door);
}

/** Every hex a city state holds, its quay included. */
export function cityCells(city: CityState): H3Index[] {
  return cellsWithin(cellAt(city.centre), city.radius);
}

/**
 * Place every city state, without taking anything.
 *
 * Deliberately not `imported`. That flag would give the decay-immunity for free, and it
 * also makes `getCells` return the cell whatever the viewport — right for a rival whose
 * realm you were sent, and wrong for a village, which would then be drawn on the far side
 * of the world. `projectCell` knows a city state by its owner instead.
 */
export async function placeCityStates(store: KeyValueStore, now: number): Promise<number> {
  let written = 0;
  for (const city of CITY_STATES) {
    for (const h3 of cityCells(city)) {
      if (await store.get<Cell>(K.cell(h3))) continue;
      const cell: Cell = {
        h3,
        ownerId: city.owner,
        strength: city.strength,
        lastVisitedAt: now,
        visitDays: [],
      };
      await store.set(K.cell(h3), cell);
      written += 1;
    }
  }
  return written;
}

/** The city state whose quay this hex is, if any. */
export async function cityAtDoor(store: KeyValueStore, h3: H3Index): Promise<CityState | null> {
  const stored = await store.get<Cell>(K.cell(h3));
  const city = cityStateOf(stored?.ownerId ?? null);
  return city && doorCell(city) === h3 ? city : null;
}

export type TradeOutcome = TradeResult;

/**
 * Swap a parcel at a quay, paying from the pouch.
 *
 * Settles first, so what the trickle owes up to this moment is in the pouch before any of
 * it is spent — the same order `wardWith` and `buildOn` take. Nothing is written on a
 * refusal.
 */
export async function tradeAt(
  store: KeyValueStore,
  h3: H3Index,
  give: ResourceKind,
  want: ResourceKind,
  owned: readonly Cell[],
  now: number,
  parcel?: number,
): Promise<TradeOutcome> {
  const city = await cityAtDoor(store, h3);
  if (!city) return { ok: false, refused: 'nothing-to-give' };

  const state = await settlePouch(store, owned, now);
  const result = trade(state.pool, give, want, parcel);
  if (!result.ok) return result;

  await writePouch(store, result.pool, now);
  await writeLogEntry(store, { at: now, kind: 'route', ref: city.id });
  return result;
}
