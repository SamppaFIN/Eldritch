/**
 * The Keep citizens and granary, in the store (BRDC-PROG-001). Beside `keepStore.ts`,
 * which is the Altar and places (KEEP-002).
 *
 * The rules are pure (`rules/citizens.ts`); the Keep lives inside the pouch record
 * (`ResourceState.keep`) so a settle feeds the granary in the same write that banks the
 * trickle. This is the seam the Keep screen reads and the Raise button writes through —
 * a separate API object, like `worksApi`, because `MockRepository` is at its line limit.
 */
import { growBox, housing } from '../rules/balance.js';
import { FIRST_KEEP, foodBalance, hoursToNextCitizen, keepRaiseCost, raiseKeep } from '../rules/citizens.js';
import type { KeepRaiseResult } from '../rules/citizens.js';
import { forecastRates, settlePouch, writeKeep } from './pouch.js';
import type { KeyValueStore } from './kv.js';
import type { Cell } from '../types/domain.js';

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
}

export interface KeepApi {
  /** `null` on a Season 1 save — it has no Keep record, and the game there is unchanged. */
  view(now: number): Promise<KeepView | null>;
  raise(now: number): Promise<KeepRaiseResult>;
  /** Give a save its Keep — the first day of a Season 2 realm (SEASON-006 calls this). */
  found(now: number): Promise<void>;
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
      const cap = housing(keep.level);
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
      };
    },
    raise: async (now) => {
      const state = await settlePouch(store(), await owned(now), now);
      const result = raiseKeep(state.keep, state.pool);
      if (result.ok) {
        const { food, stone } = result.paid;
        const pool = { ...state.pool, food: state.pool.food - food, stone: state.pool.stone - stone };
        await writeKeep(store(), result.keep, pool, now);
      }
      return result;
    },
    found: async (now) => {
      const state = await settlePouch(store(), await owned(now), now);
      if (!state.keep) await writeKeep(store(), FIRST_KEEP, state.pool, now);
    },
  };
}
