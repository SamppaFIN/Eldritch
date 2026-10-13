/**
 * The Keep citizens and granary, in the store (BRDC-PROG-001). Beside `keepStore.ts`,
 * which is the Altar and places (KEEP-002).
 *
 * The rules are pure (`rules/citizens.ts`); the Keep lives inside the pouch record
 * (`ResourceState.keep`) so a settle feeds the granary in the same write that banks the
 * trickle. This is the seam the Keep screen reads and the Raise button writes through —
 * a separate API object, like `worksApi`, because `MockRepository` is at its line limit.
 */
import type { ResourceState } from '../rules/terrain.js';
import { growBox } from '../rules/balance.js';
import { FIRST_KEEP, STORE_MS, calmAt, foodBalance, keepHousing, hoursToNextCitizen, keepRaiseCost, raiseKeep } from '../rules/citizens.js';
import type { KeepRaiseResult } from '../rules/citizens.js';
import { assignWorker, slotsFor, staffKey, staffed } from '../rules/staffing.js';
import type { StaffRefusal } from '../rules/staffing.js';
import { worksOn } from '../rules/build.js';
import { worksViewAt } from './worksStore.js';
import { widenHearth } from './hearthGrowthStore.js';
import { K } from './keys.js';
import { towerSight } from './towerSight.js';
import { readLore } from './loreStore.js';
import { counselFor } from './counselStore.js';
import type { Counsel } from '../rules/counsel.js';
import { keepCeiling } from '../rules/lore.js';
import { realmSanity, sanityWord } from '../rules/sanity.js';
import { commit, forecastRates, settlePouch } from './pouch.js';
import type { KeepState } from '../rules/citizens.js';
import type { ResourcePool } from '../rules/terrain.js';
import type { KeyValueStore } from './kv.js';
import type { BuildingId, Cell, H3Index, PlayerProfile } from '../types/domain.js';

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
  /** Raise the Keep a level; the Hearth's border moves out a ring with it (2026-09-30). */
  raise(now: number): Promise<KeepRaiseResult & { hearth?: { ring: number; claimed: number } }>;
  /** Give a save its Keep — the first day of a Season 2 realm (SEASON-006 calls this). */
  found(now: number): Promise<void>;
  /** The buildings on an owned cell and their hands; empty on a Season 1 save. */
  staffOn(h3: H3Index, now: number): Promise<StaffSlot[]>;
  /** Hands at work on each held hex, every Work summed — for the map (BRDC-MAP-009). A
   *  plain read, no settle: the map asks often. */
  handsByHex(now: number): Promise<Record<H3Index, number>>;
  /** Send an idle citizen to (+1) or call one back from (−1) a building. */
  staff(h3: H3Index, id: BuildingId, delta: 1 | -1, now: number): Promise<StaffOutcome>;
  /** The Keeper's Counsel, first true rule first; null on a Season 1 save (COUNSEL-001). */
  counsel(now: number): Promise<Counsel[] | null>;
}

/**
 * Change the Keep inside the pouch's lock, against the record as it is *now*.
 *
 * Every Keep write used to settle, then write back the whole Keep and pool it had read —
 * so two at once (a hand sent to work while the Keep collected its tithe) put each other's
 * change back, and one citizen could be sent to two places. `change` gets the fresh Keep
 * and returns the new one, or null to write nothing.
 */
function changeKeep(
  store: KeyValueStore,
  now: number,
  change: (keep: KeepState, pool: ResourcePool) => { keep: KeepState; pool?: ResourcePool } | null,
): Promise<ResourceState> {
  return commit(store, now, (cur) => {
    const next = cur.keep ? change(cur.keep, cur.pool) : null;
    return next ? { ...cur, keep: next.keep, pool: next.pool ?? cur.pool } : cur;
  });
}

/**
 * Walking to the Keep collects everything (PROG-002, "the daily tithe"): settle what the
 * stores hold, then start their 12 hours again. A Season 1 save has no Keep and no tithe.
 */
export async function titheAtKeep(store: KeyValueStore, owned: readonly Cell[], now: number): Promise<boolean> {
  const state = await settlePouch(store, owned, now);
  if (!state.keep) return false;
  await changeKeep(store, now, (keep) => ({ keep: { ...keep, titheAt: now } }));
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
        storesLeftH: keep.titheAt === undefined ? null : Math.max(0, (keep.titheAt + STORE_MS - now) / 3_600_000),
      };
    },
    raise: async (now) => {
      const state = await settlePouch(store(), await owned(now), now);
      const ceiling = keepCeiling(await readLore(store()));
      // Judged again inside the lock, against the pool as it is when the price is paid.
      let result: KeepRaiseResult = raiseKeep(state.keep, state.pool, ceiling);
      if (result.ok) {
        await changeKeep(store(), now, (keep, pool) => {
          result = raiseKeep(keep, pool, ceiling);
          if (!result.ok) return null;
          const { food, stone } = result.paid;
          return { keep: result.keep, pool: { ...pool, food: pool.food - food, stone: pool.stone - stone } };
        });
      }
      if (result.ok) {
        const profile = await store().get<PlayerProfile>(K.profile);
        const hearth = profile ? await widenHearth(store(), profile, now) : null;
        return hearth ? { ...result, hearth } : result;
      }
      return result;
    },
    found: async (now) => {
      await settlePouch(store(), await owned(now), now);
      await commit(store(), now, (cur) => (cur.keep ? cur : { ...cur, keep: { ...FIRST_KEEP, titheAt: now } }));
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
    handsByHex: async (now) => {
      const held = new Set((await owned(now)).map((c) => c.h3));
      const staff = (await store().get<ResourceState>('resources'))?.keep?.staff ?? {};
      const out: Record<H3Index, number> = {};
      for (const [key, n] of Object.entries(staff) as [string, number][]) {
        const h3 = key.slice(0, key.indexOf('|'));
        if (n > 0 && held.has(h3)) out[h3] = (out[h3] ?? 0) + n;
      }
      return out;
    },
    counsel: async (now) => counselFor(store(), await owned(now), now),

    staff: async (h3, id, delta, now) => {
      const cells = await owned(now);
      const cell = cells.find((c) => c.h3 === h3 && worksOn(c).some((w) => w.id === id));
      const state = await settlePouch(store(), cells, now);
      const keep = state.keep;
      if (!keep) return { ok: false, refused: 'no-keep' };
      if (!cell) return { ok: false, refused: 'none-there' };
      const level = (await worksViewAt(store(), cell))?.level ?? 0;
      // Assigned inside the lock: two taps at once must not send one citizen to two places.
      let r: ReturnType<typeof assignWorker> = assignWorker(keep.staff ?? {}, keep.granary.citizens, h3, id, delta, level);
      await changeKeep(store(), now, (fresh) => {
        r = assignWorker(fresh.staff ?? {}, fresh.granary.citizens, h3, id, delta, level);
        return r.ok ? { keep: { ...fresh, staff: r.staff } } : null;
      });
      if (!r.ok) return r;
      // A hand in a Watchtower lets it see a ring further (field report 2026-09-30).
      if (id === 'watchtower' && delta > 0) await towerSight(store(), h3, now);
      return { ok: true };
    },
  };
}
