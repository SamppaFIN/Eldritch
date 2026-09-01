/**
 * The pouch: reading and paying resources.
 *
 * Split out of MockRepository when that file reached its four hundred lines. The rule
 * says split, not raise — and this is a coherent seam: everything here is about the
 * resource ledger and nothing else in the repository needs to know how it is stored.
 */
import { EMPTY_POOL, RESOURCE_KINDS, addClaimYield, settleResources } from '../rules/terrain.js';
import type { ResourceKind, ResourcePool, ResourceState } from '../rules/terrain.js';
import { ward } from '../rules/ward.js';
import type { WardResult } from '../rules/ward.js';
import { research } from '../rules/tech.js';
import type { ResearchResult, TechId } from '../rules/tech.js';
import { buildingBonus, buildingDayBonus, buildingsOf, storageCap } from '../rules/build.js';
import { placesWithHome } from '../rules/dwell.js';
import type { DwellMap } from '../rules/dwell.js';
import { manaBonus } from '../rules/mana.js';
import { activeSpells, domainSpellBonus } from '../rules/spell.js';
import type { ActiveSpell } from '../rules/spell.js';
import { resourceAura } from '../rules/aura.js';
import { routeGoldBonus } from '../rules/trade.js';
import type { TradeRoute } from '../rules/trade.js';
import { darkTimeAt } from '../rules/darkTime.js';
import type { CaptureOutcome, Cell, H3Index, PlayerId } from '../types/domain.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

const KEY = 'resources';

/** Add one partial pool into another, in place. */
function addInto(into: Partial<ResourcePool>, from: Partial<ResourcePool>): void {
  for (const [k, v] of Object.entries(from) as [ResourceKind, number][]) {
    into[k] = (into[k] ?? 0) + v;
  }
}

/**
 * The per-hour bonus `settleResources` adds on top of the raw trickle: building
 * production (BRDC-BUILD-001), mana from held places (BRDC-MANA-001), a running research
 * spell (BRDC-SPELL-001), and area auras from Libraries and the like (BRDC-BUILD-003),
 * merged additively. Each is filtered by its own rule — kept here so `rules/terrain.ts`
 * stays blind to all of it.
 */
async function perHourBonus(
  store: KeyValueStore,
  owned: readonly Cell[],
  now: number,
): Promise<Partial<ResourcePool>> {
  const merged: Partial<ResourcePool> = { ...buildingBonus(owned, now) };
  const dwell = (await store.get<DwellMap>(K.dwell)) ?? {};
  const home = (await store.get<H3Index>(K.home)) ?? null;
  const expansions = (await store.get<Record<H3Index, number>>(K.expansions)) ?? {};
  addInto(merged, manaBonus(placesWithHome(dwell, home), expansions, owned, now));

  const spells = (await store.get<ActiveSpell[]>(K.spells)) ?? [];
  addInto(merged, domainSpellBonus(activeSpells(spells, now), now));
  addInto(merged, resourceAura(owned, now));

  const routes = (await store.get<TradeRoute[]>(K.tradeRoutes)) ?? [];
  addInto(merged, routeGoldBonus(routes, owned, now));
  return merged;
}

/**
 * Read the stored pouch, or an empty one if there is nothing yet.
 *
 * No shape check here any more. A pool from before a shape change cannot reach this
 * point: `MockRepository` wraps its store in `versioned()` (BRDC-PERSIST-002), and an
 * unrecognised schema version clears the store on open. The structural sniff this
 * replaced — `{ water, wood, gold }` read back as the nine-field shape, `undefined + number`
 * minting `NaN` — is gone with it.
 */
async function read(store: KeyValueStore, now: number): Promise<ResourceState> {
  return (await store.get<ResourceState>(KEY)) ?? { pool: EMPTY_POOL, since: now, sinceDay: now };
}

/**
 * Bring the pouch up to date and persist it.
 *
 * Written back rather than re-derived: resources are earned and kept, so a projection
 * would have to be recomputed from the beginning of time on every read.
 *
 * Takes whole cells, not just their indices, because settling now checks each one's
 * `lastVisitedAt` for dormancy (BRDC-ECON-001) — an index alone cannot answer that.
 */
export async function settlePouch(
  store: KeyValueStore,
  owned: readonly Cell[],
  now: number,
): Promise<ResourceState> {
  const stored = await read(store, now);
  // Buildings and places feed in here, not inside settleResources: a Storehouse raises
  // the ceiling, and building production plus temple mana add a per-hour bonus, each
  // dormancy-filtered (BRDC-BUILD-001, BRDC-MANA-001). Keeping it here is what lets
  // `rules/terrain.ts` stay blind to both.
  const held = buildingsOf(owned);
  const settled = settleResources(
    stored,
    owned,
    now,
    storageCap(held),
    await perHourBonus(store, owned, now),
    buildingDayBonus(owned, now),
    // The world's winter scales everything produced, decay's cousin from the same clock.
    darkTimeAt(now).factor,
  );
  if (settled !== stored) await store.set(KEY, settled);
  return settled;
}

/**
 * What the pouch will fill at, per resource, over the next hour and the next day
 * (BRDC-STATS-001).
 *
 * Not re-derived from the buildings and auras — that is the number this codebase is most
 * likely to get subtly wrong. Instead it settles the *real* `settleResources` forward a
 * whole hour and a whole day from the current state, with the exact inputs `settlePouch`
 * uses, and reports the delta. The forecast is a settle, so it cannot disagree with one:
 * dormancy, the storage cap and the dark-time factor are all already inside it.
 */
export interface Forecast {
  perHour: Partial<ResourcePool>;
  perDay: Partial<ResourcePool>;
}

export async function forecastRates(
  store: KeyValueStore,
  owned: readonly Cell[],
  now: number,
): Promise<Forecast> {
  const cap = storageCap(buildingsOf(owned));
  const bph = await perHourBonus(store, owned, now);
  const bpd = buildingDayBonus(owned, now);
  const factor = darkTimeAt(now).factor;

  const base = settleResources(await read(store, now), owned, now, cap, bph, bpd, factor);
  const hour = settleResources(base, owned, base.since + 3_600_000, cap, bph, bpd, factor);
  const dayFrom = Math.max(base.since, base.sinceDay ?? base.since) + 86_400_000;
  const day = settleResources(base, owned, dayFrom, cap, bph, bpd, factor);

  const delta = (after: ResourcePool): Partial<ResourcePool> => {
    const out: Partial<ResourcePool> = {};
    for (const k of RESOURCE_KINDS) if (after[k] > base.pool[k]) out[k] = after[k] - base.pool[k];
    return out;
  };
  return { perHour: delta(hour.pool), perDay: delta(day.pool) };
}

/**
 * Pay the one-off yield for ground that just changed hands.
 *
 * Settles first, so the trickle owed up to this moment is banked before the claim is
 * added — otherwise the claim would be folded into a pool that is about to be recomputed
 * from an older timestamp, and paid for twice.
 */
export async function awardClaims(
  store: KeyValueStore,
  owned: readonly Cell[],
  outcomes: readonly CaptureOutcome[],
  now: number,
): Promise<void> {
  const taken = outcomes.filter((o) => o.kind === 'claimed' || o.kind === 'taken');
  if (taken.length === 0) return;

  const state = await settlePouch(store, owned, now);

  let pool = state.pool;
  for (const outcome of taken) pool = addClaimYield(pool, outcome.h3);
  await store.set<ResourceState>(KEY, { ...state, pool });
}

/**
 * Write a pool back without touching the trickle clock.
 *
 * For spending. `since` belongs to the trickle and must survive a purchase — moving it
 * would hand the player a free hour, or steal one, depending on which way it went.
 */
export async function writePouch(
  store: KeyValueStore,
  pool: ResourcePool,
  now: number,
): Promise<void> {
  const state = await read(store, now);
  await store.set<ResourceState>(KEY, { ...state, pool });
}

/**
 * Spend the pouch to ward one cell.
 *
 * Settles first: the trickle owed up to this moment has to be in the pool before it is
 * spent, or a player is refused a ward they had already earned the timber for.
 *
 * Returns the new cell rather than writing it — the cell store belongs to the repository
 * and this module only owns the ledger.
 */
export async function wardWith(
  store: KeyValueStore,
  cell: Cell,
  me: PlayerId,
  owned: readonly Cell[],
  now: number,
): Promise<WardResult> {
  const state = await settlePouch(store, owned, now);
  const result = ward(cell, state.pool, me);
  if (result.warded) await writePouch(store, result.pool, now);
  return result;
}

/**
 * Spend wisdom to research one technology (BRDC-TECH-001).
 *
 * The pouch's second verb, after warding. Settles first — the trickle owed up to now has
 * to be banked before it can be spent — and writes the pool back only on success. The
 * researched list itself belongs to the repository; this module only moves the wisdom.
 */
export async function researchWith(
  store: KeyValueStore,
  researched: readonly TechId[],
  id: TechId,
  owned: readonly Cell[],
  now: number,
): Promise<ResearchResult> {
  const state = await settlePouch(store, owned, now);
  const result = research(researched, id, state.pool);
  if (result.ok) await writePouch(store, result.pool, now);
  return result;
}
