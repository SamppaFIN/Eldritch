/**
 * Gold for culture at the Tavern, in the store (BRDC-TRADE-001).
 *
 * The rule is pure (`rules/tavernTrade.ts`); this checks the player stands on a Tavern of
 * their own, keeps the day's count (`K.tavernTrade`, reset with the season like the pouch),
 * writes the change to the pouch, and says so in the History.
 */
import { TAVERN_CULTURE_PER_DAY, TAVERN_GOLD_PER_CULTURE, tavernTrade } from '../rules/tavernTrade.js';
import { hasWork } from '../rules/build.js';
import { utcDay } from '../rules/day.js';
import { settlePouch, writePouch } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index } from '../types/domain.js';

interface TradeDay {
  day: string;
  culture: number;
}

export interface TavernTradeView {
  /** Gold for one culture. */
  rate: number;
  /** Culture still to be had today. */
  left: number;
}

export type TavernTradeOutcome =
  | { ok: true; culture: number; gold: number }
  | { ok: false; refused: 'not-here' | 'none' | 'cap' | 'cannot-afford' };

export interface TavernTradeApi {
  view(now: number): Promise<TavernTradeView>;
  /** Buy `culture` with gold on `h3` — a Tavern of yours, and the hex you stand on. */
  trade(h3: H3Index, standing: H3Index | null, culture: number, now: number): Promise<TavernTradeOutcome>;
}

async function boughtToday(store: KeyValueStore, now: number): Promise<number> {
  const rec = await store.get<TradeDay>(K.tavernTrade);
  return rec?.day === utcDay(now) ? rec.culture : 0;
}

export function tavernTradeApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): TavernTradeApi {
  return {
    async view(now) {
      return { rate: TAVERN_GOLD_PER_CULTURE, left: TAVERN_CULTURE_PER_DAY - (await boughtToday(store(), now)) };
    },

    async trade(h3, standing, culture, now) {
      const cells = await owned(now);
      const cell = cells.find((c) => c.h3 === h3);
      if (!cell || !hasWork(cell, 'tavern') || standing !== h3) return { ok: false, refused: 'not-here' };
      const bought = await boughtToday(store(), now);
      const state = await settlePouch(store(), cells, now);
      const r = tavernTrade(state.pool, culture, bought);
      if (!r.ok) return r;
      await writePouch(store(), state.pool, r.pool, now);
      await store().set<TradeDay>(K.tavernTrade, { day: utcDay(now), culture: bought + culture });
      await writeLogEntry(store(), { at: now, kind: 'trade', ref: String(r.gold), count: culture });
      return { ok: true, culture, gold: r.gold };
    },
  };
}
