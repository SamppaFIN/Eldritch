/**
 * The Keep citizens and granary, in the store (BRDC-PROG-001). Beside `keepStore.ts`,
 * which is the Altar and places (KEEP-002).
 *
 * The rules are pure (`rules/citizens.ts`); the Keep lives inside the pouch record
 * (`ResourceState.keep`) so a settle feeds the granary in the same write that banks the
 * trickle. This is the seam the Keep screen reads and the Raise button writes through —
 * a separate API object, like `worksApi`, because `MockRepository` is at its line limit.
 */
import { claimCost, growBox } from '../rules/balance.js';
import { FIRST_KEEP, STORE_MS, calmAt, foodBalance, keepHousing, hoursToNextCitizen, keepRaiseCost, raiseKeep } from '../rules/citizens.js';
import type { KeepRaiseResult } from '../rules/citizens.js';
import { assignWorker, slotsFor, staffKey, staffed } from '../rules/staffing.js';
import type { StaffRefusal } from '../rules/staffing.js';
import { worksOn } from '../rules/build.js';
import { worksViewAt } from './worksStore.js';
import { readLore } from './loreStore.js';
import { keepCeiling } from '../rules/lore.js';
import { realmSanity, sanityWord } from '../rules/sanity.js';
import { commit, forecastRates, settlePouch } from './pouch.js';
import type { KeepState } from '../rules/citizens.js';
import type { ResourcePool } from '../rules/terrain.js';
import type { KeyValueStore } from './kv.js';
import type { BuildingId, Cell, H3Index } from '../types/domain.js';

export interface KeepView {
  level: number;
  citizens: number;
  housing: number;
  /** Food in the granary toward the next citizen, and what it needs. */
  box: number;
  boxNeed: number;
  /** Food made per hour before anyone eats, and what the citizens eat. */
  producedPerH: number;
  eatenPerH: number;
  hoursToNext: number | null;
  raiseCost: { food: number; stone: number };
  /** Citizens with no building to work in (BRDC-PROG-002). */
  idle: number;
  /** Hours the stores still fill before the realm sleeps; 0 = full, walk to the Keep. */
  storesLeftH: number | null;
  /** The realm's mood (PROG-008), and the word for it. */
  sanity: number;
  sanityWord: string;
  /** Culture the next new hex costs, and what the pouch holds (PROG-003). */
  nextCellCulture: number;
  culture: number;
}

/** One building on a cell and the hands in it. */
export interface StaffSlot {
  id: BuildingId;
  hands: number;
  slots: number;
}

export type StaffOutcome = { ok: true } | { ok: false; refused: StaffRefusal | 'no-keep' };

export interface KeepApi {
  /** `null` on a Season 1 save — it has no Keep record, and the game there is unchanged. */
  view(now: number): Promise<KeepView | null>;
  raise(now: number): Promise<KeepRaiseResult>;
  /** Give a save its Keep — the first day of a Season 2 realm (SEASON-006 calls this). */
  found(now: number): Promise<void>;
  /** The buildings on an owned cell and their hands; empty on a Season 1 save. */
  staffOn(h3: H3Index, now: number): Promise<StaffSlot[]>;
  /** Send an idle citizen to (+1) or call one back from (−1) a building. */
  staff(h3: H3Index, id: BuildingId, delta: 1 | -1, now: number): Promise<StaffOutcome>;
}

/** Write the Keep beside the pouch it lives in, with the pool it paid from. */
async function writeKeep(store: KeyValueStore, keep: KeepState, pool: ResourcePool, now: number): Promise<void> {
  await commit(store, now, (cur) => ({ ...cur, pool, keep }));
}

/**
 * Walking to the Keep collects everything (PROG-002, "the daily tithe"): settle what the
 * stores hold, then start their 12 hours again. A Season 1 save has no Keep and no tithe.
 */
export async function titheAtKeep(store: KeyValueStore, owned: readonly Cell[], now: number): Promise<boolean> {
  const state = await settlePouch(store, owned, now);
  if (!state.keep) return false;
  await writeKeep(store, { ...state.keep, titheAt: now }, state.pool, now);
  return true;
}

export function keepApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): KeepApi {
  return {
    view: async (now) => {
      const cells = await owned(now);
      const state = await settlePouch(store(), cells, now);
      const keep = state.keep;
      if (!keep) return null;
      const producedPerH = (await forecastRates(store(), cells, now)).perHour.food ?? 0;
      const g = keep.granary;
      const cap = keepHousing(keep);
      const balance = foodBalance(producedPerH, g.citizens);
      return {
        level: keep.level,
        citizens: g.citizens,
        housing: cap,
        box: g.box,
        boxNeed: growBox(g.citizens),
        producedPerH,
        eatenPerH: producedPerH - balance,
        hoursToNext: hoursToNextCitizen(g, balance, cap),
        raiseCost: keepRaiseCost(keep.level),
        idle: g.citizens - staffed(keep.staff ?? {}),
        sanity: realmSanity(cells, keep.staff ?? {}, g.citizens, keep.gatesNear, calmAt(keep, now)),
        sanityWord: sanityWord(realmSanity(cells, keep.staff ?? {}, g.citizens, keep.gatesNear, calmAt(keep, now))),
        nextCellCulture: claimCost(cells.length + 1),
        culture: state.pool.culture,
        storesLeftH: keep.titheAt === undefined ? null : Math.max(0, (keep.titheAt + STORE_MS - now) / 3_600_000),
      };
    },
    raise: async (now) => {
      const state = await settlePouch(store(), await owned(now), now);
      const result = raiseKeep(state.keep, state.pool, keepCeiling(await readLore(store())));
      if (result.ok) {
        const { food, stone } = result.paid;
        const pool = { ...state.pool, food: state.pool.food - food, stone: state.pool.stone - stone };
        await writeKeep(store(), result.keep, pool, now);
      }
      return result;
    },
    found: async (now) => {
      const state = await settlePouch(store(), await owned(now), now);
      if (!state.keep) await writeKeep(store(), { ...FIRST_KEEP, titheAt: now }, state.pool, now);
    },
    staffOn: async (h3, now) => {
      const cells = await owned(now);
      const cell = cells.find((c) => c.h3 === h3);
      const keep = (await settlePouch(store(), cells, now)).keep;
      if (!cell || !keep) return [];
      const level = (await worksViewAt(store(), cell))?.level ?? 0;
      return worksOn(cell).map((w) => ({
        id: w.id,
        hands: keep.staff?.[staffKey(h3, w.id)] ?? 0,
        slots: slotsFor(w.id, level),
      }));
    },
    staff: async (h3, id, delta, now) => {
      const cells = await owned(now);
      const cell = cells.find((c) => c.h3 === h3 && worksOn(c).some((w) => w.id === id));
      const state = await settlePouch(store(), cells, now);
      const keep = state.keep;
      if (!keep) return { ok: false, refused: 'no-keep' };
      if (!cell) return { ok: false, refused: 'none-there' };
      const level = (await worksViewAt(store(), cell))?.level ?? 0;
      const r = assignWorker(keep.staff ?? {}, keep.granary.citizens, h3, id, delta, level);
      if (!r.ok) return r;
      await writeKeep(store(), { ...keep, staff: r.staff }, state.pool, now);
      return { ok: true };
    },
  };
}
