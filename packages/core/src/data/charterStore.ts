/**
 * The Keeper's Charter, in the store (BRDC-ONBOARD-001).
 *
 * The rules are pure (`rules/charter.ts`); this reads the realm into what they need — hexes,
 * reveals, Lore, Works, hands at work — and keeps which steps were claimed in `K.charter`.
 * That key outlives the season (`FOREVER_KEYS`): the Charter is taught once per realm, not
 * again each spring (Infinite 2026-10-13). The first read of a realm ticks off what it has
 * already done, unpaid, so a veteran starts where they actually are.
 */
import { alreadyDone, charterView, scarcest } from '../rules/charter.js';
import type { CharterShow, CharterState, CharterView } from '../rules/charter.js';
import { BUILDINGS, worksOn } from '../rules/build.js';
import { TERRAIN_TABLE, terrainForCell } from '../rules/terrain.js';
import type { ResourcePool } from '../rules/terrain.js';
import { forecastRates, grantBonus, settlePouch } from './pouch.js';
import { readLore } from './loreStore.js';
import { readRevealed } from './revealStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { BuildingId, Cell, H3Index } from '../types/domain.js';

export interface CharterRecord {
  claimed: string[];
}

export type CharterPage = CharterView & {
  /** The hex "Show me" opens, when the step's `show` is one; null if none fits yet. */
  hex: H3Index | null;
};

export type CharterOutcome = { ok: true; reward: Partial<ResourcePool> } | { ok: false; refused: 'not-current' | 'not-done' };

export interface CharterApi {
  /** The current step, or null once every step is claimed. */
  view(now: number): Promise<CharterPage | null>;
  /** Claim the current step's reward — once, and only when the realm says it is done. */
  claim(id: string, now: number): Promise<CharterOutcome>;
}

export async function charterState(store: KeyValueStore, cells: readonly Cell[], now: number): Promise<CharterState> {
  const [revealed, lore, pouch] = await Promise.all([readRevealed(store), readLore(store), settlePouch(store, cells, now)]);
  const { perHour } = await forecastRates(store, cells, now);
  const works: Partial<Record<BuildingId, number>> = {};
  for (const c of cells) for (const w of worksOn(c)) works[w.id] = (works[w.id] ?? 0) + 1;
  const hands = Object.values(pouch.keep?.staff ?? {}).reduce((s, n) => s + n, 0);
  return { owned: cells.length, revealed: Object.keys(revealed).length, lore, works, hands, perHour };
}

async function hexFor(store: KeyValueStore, show: CharterShow | undefined, cells: readonly Cell[], state: CharterState): Promise<H3Index | null> {
  if (show === 'unrevealed') {
    const revealed = await readRevealed(store);
    return cells.find((c) => revealed[c.h3] === undefined)?.h3 ?? null;
  }
  if (show === 'build-site') {
    return cells.find((c) => worksOn(c).length === 0 && BUILDINGS.watchtower.terrain.includes(terrainForCell(c).kind))?.h3 ?? null;
  }
  if (show === 'supply-site') {
    // A bare hex of the ground that yields it — a Work there doubles what it already pays.
    const k = scarcest(state);
    return cells.find((c) => worksOn(c).length === 0 && TERRAIN_TABLE[terrainForCell(c).kind].resource === k)?.h3 ?? null;
  }
  if (show === 'work') return cells.find((c) => worksOn(c).some((w) => w.id === 'watchtower'))?.h3 ?? cells.find((c) => worksOn(c).length > 0)?.h3 ?? null;
  return null;
}

async function claimed(store: KeyValueStore, state: CharterState): Promise<string[]> {
  const rec = await store.get<CharterRecord>(K.charter);
  if (rec) return rec.claimed;
  // A realm with no Hearth yet has done nothing; seeding it would only write an empty list.
  if (state.owned === 0) return [];
  const done = alreadyDone(state);
  await store.set<CharterRecord>(K.charter, { claimed: done });
  return done;
}

export function charterApi(store: () => KeyValueStore, owned: (now: number) => Promise<readonly Cell[]>): CharterApi {
  return {
    async view(now) {
      const cells = await owned(now);
      const state = await charterState(store(), cells, now);
      const v = charterView(state, await claimed(store(), state));
      return v ? { ...v, hex: await hexFor(store(), v.step.show, cells, state) } : null;
    },

    async claim(id, now) {
      const cells = await owned(now);
      const state = await charterState(store(), cells, now);
      const done = await claimed(store(), state);
      const v = charterView(state, done);
      if (!v || v.step.id !== id) return { ok: false, refused: 'not-current' };
      if (!v.ready) return { ok: false, refused: 'not-done' };
      await grantBonus(store(), cells, v.step.reward, now);
      await store().set<CharterRecord>(K.charter, { claimed: [...done, id] });
      return { ok: true, reward: v.step.reward };
    },
  };
}
