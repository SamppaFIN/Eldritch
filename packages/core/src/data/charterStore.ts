/**
 * The Keeper's Charter, in the store (BRDC-ONBOARD-001).
 *
 * The rules are pure (`rules/charter.ts`); this reads the realm into what they need — hexes,
 * reveals, Lore, Works, hands at work — and keeps which steps were claimed in `K.charter`.
 * That key outlives the season (`FOREVER_KEYS`): the Charter is taught once per realm, not
 * again each spring (Infinite 2026-10-13). The first read of a realm ticks off what it has
 * already done, unpaid, so a veteran starts where they actually are.
 *
 * Chapter V is the season's (BRDC-ONBOARD-006), so its claims live apart, in
 * `K.charterSeason` — an ordinary key the season reset clears, so the chapter comes again.
 */
import { CHARTER_STEPS, SEASON_CHAPTER, alreadyDone, charterView, scarcest } from '../rules/charter.js';
import type { CharterShow, CharterState, CharterView } from '../rules/charter.js';
import { openSurfaces } from '../rules/surfaces.js';
import type { Surface } from '../rules/surfaces.js';
import { BUILDINGS, worksOn } from '../rules/build.js';
import { TERRAIN_TABLE, terrainForCell } from '../rules/terrain.js';
import type { ResourcePool, ResourceState } from '../rules/terrain.js';
import { forecastRates, grantBonus } from './pouch.js';
import { readLore } from './loreStore.js';
import { readRevealed } from './revealStore.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';
import type { BuildingId, Cell, H3Index, RevealedPlace } from '../types/domain.js';

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
  /** The screen's surfaces open now — reached by the Charter, or already in use (BRDC-ONBOARD-005). */
  surfaces(now: number): Promise<Surface[]>;
}

/** Chapters III–V: what the realm has done, each read from the record its own store keeps. */
async function laterState(store: KeyValueStore, places: readonly RevealedPlace[]) {
  type Book = Record<string, unknown>;
  const [standard, schools, rites, inv, tasks, rumours, gates, ambition, adventures, routes] = await Promise.all([
    store.get<unknown>(K.standard),
    store.get<Book>(K.templeSchool),
    store.get<{ schools?: unknown[]; learned?: Book }>(K.rites),
    store.get<{ archetype?: string; cluesGathered?: number }>(K.investigator),
    store.get<{ taken?: Book; outcomes?: Book }>(K.tasks),
    store.get<{ done?: string[] }>(K.rumours),
    store.get<{ gates?: { sealedAt?: number }[] }>(K.gates),
    store.get<unknown>(K.ambition),
    store.get<Book>(K.adventures),
    store.get<unknown[]>(K.tradeRoutes),
  ]);
  const size = (o: object | undefined) => Object.keys(o ?? {}).length;
  return {
    standard: Boolean(standard),
    temples: places.filter((p) => p.kind === 'temple').length,
    rites: size(schools) > 0 || (rites?.schools?.length ?? 0) > 0 || size(rites?.learned) > 0,
    investigator: Boolean(inv?.archetype),
    tasks: size(tasks?.taken) + size(tasks?.outcomes),
    rumours: rumours?.done?.length ?? 0,
    gatesSealed: (gates?.gates ?? []).filter((g) => g.sealedAt !== undefined).length,
    ambition: Boolean(ambition),
    adventure: size(adventures) > 0,
    routes: routes?.length ?? 0,
    clues: inv?.cluesGathered ?? 0,
  };
}

/**
 * The realm as the Charter reads it. A plain read of the pouch record, never a settle: the
 * Keep's level and its hands do not move with a settle, and a settle waits on the pouch's
 * write lock. The forecast is the dear part, so it is worked out only `withRates`.
 */
export async function charterState(
  store: KeyValueStore,
  cells: readonly Cell[],
  places: readonly RevealedPlace[],
  now: number,
  withRates: boolean,
): Promise<CharterState> {
  const [revealed, lore, pouch] = await Promise.all([readRevealed(store), readLore(store), store.get<ResourceState>('resources')]);
  const perHour = withRates ? (await forecastRates(store, cells, now)).perHour : {};
  const works: Partial<Record<BuildingId, number>> = {};
  for (const c of cells) for (const w of worksOn(c)) works[w.id] = (works[w.id] ?? 0) + 1;
  const hands = Object.values(pouch?.keep?.staff ?? {}).reduce((s, n) => s + n, 0);
  const later = await laterState(store, places);
  const loops = (await store.get<number>(K.loopsClosed)) ?? 0;
  return { owned: cells.length, revealed: Object.keys(revealed).length, lore, works, hands, perHour, loops, keepLevel: pouch?.keep?.level ?? 0, ...later };
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

const isSeason = (id: string) => CHARTER_STEPS.find((s) => s.id === id)?.chapter === SEASON_CHAPTER;
const keyOf = (id: string) => (isSeason(id) ? K.charterSeason : K.charter);

/** One record's claims; seeded on first read with what is already done, unpaid. */
async function claimedIn(store: KeyValueStore, key: string, state: CharterState, full: () => Promise<CharterState>): Promise<string[]> {
  const rec = await store.get<CharterRecord>(key);
  if (rec) return rec.claimed;
  // A realm with no Hearth yet has done nothing; seeding it would only write an empty list.
  if (state.owned === 0) return [];
  // Once per key: worth the forecast, so a rate step already met is not paid for.
  const done = alreadyDone(await full()).filter((id) => keyOf(id) === key);
  await store.set<CharterRecord>(key, { claimed: done });
  return done;
}

async function claimed(store: KeyValueStore, state: CharterState, full: () => Promise<CharterState>): Promise<string[]> {
  return [...(await claimedIn(store, K.charter, state, full)), ...(await claimedIn(store, K.charterSeason, state, full))];
}

/** The current step, the forecast worked out only when that step reads it. */
async function current(store: KeyValueStore, cells: readonly Cell[], places: readonly RevealedPlace[], now: number) {
  const full = () => charterState(store, cells, places, now, true);
  let state = await charterState(store, cells, places, now, false);
  const done = await claimed(store, state, full);
  let v = charterView(state, done);
  if (v?.step.rates) {
    state = await full();
    v = charterView(state, done);
  }
  return { state, done, v };
}

export function charterApi(
  store: () => KeyValueStore,
  owned: (now: number) => Promise<readonly Cell[]>,
  places: () => Promise<readonly RevealedPlace[]>,
): CharterApi {
  return {
    async view(now) {
      const cells = await owned(now);
      const { state, v } = await current(store(), cells, await places(), now);
      return v ? { ...v, hex: await hexFor(store(), v.step.show, cells, state) } : null;
    },

    async claim(id, now) {
      const cells = await owned(now);
      const { v } = await current(store(), cells, await places(), now);
      if (!v || v.step.id !== id) return { ok: false, refused: 'not-current' };
      if (!v.ready) return { ok: false, refused: 'not-done' };
      await grantBonus(store(), cells, v.step.reward, now);
      const key = keyOf(id);
      await store().set<CharterRecord>(key, { claimed: [...((await store().get<CharterRecord>(key))?.claimed ?? []), id] });
      return { ok: true, reward: v.step.reward };
    },

    async surfaces(now) {
      const { state, done } = await current(store(), await owned(now), await places(), now);
      return openSurfaces(state, done);
    },
  };
}
