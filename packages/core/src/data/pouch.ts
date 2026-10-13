/**
 * The pouch: reading and paying resources.
 *
 * Split out of MockRepository when that file reached its four hundred lines. The rule
 * says split, not raise — and this is a coherent seam: everything here is about the
 * resource ledger and nothing else in the repository needs to know how it is stored.
 */
import { STORE_MS, feedGranary } from '../rules/citizens.js';
import { EMPTY_POOL, RESOURCE_KINDS, capOf, settleResources } from '../rules/terrain.js';
import type { ResourceKind, ResourcePool, ResourceState, StorageCap } from '../rules/terrain.js';
import { worksCapBonus } from '../rules/works/bonus.js';
import { realmBonus } from '../rules/hexYield.js';
import type { YieldContext } from '../rules/hexYield.js';
import type { WonderId } from '../rules/wonder.js';
import { worksContext, worksContextFrom, type WorksContext } from './worksTrees.js';
import { buildingDayBonus, buildingsOf, storageCap } from '../rules/build.js';
import { placesWithHome } from '../rules/dwell.js';
import type { DwellMap } from '../rules/dwell.js';
import type { ActiveSpell } from '../rules/spell.js';
import { darkTimeAt } from '../rules/darkTime.js';
import type { Investigator } from '../rules/investigator.js';
import { mythosFor } from '../rules/doom.js';
import type { EraId } from '../rules/era.js';
import { weekEffect } from '../rules/age.js';
import type { WeekState } from '../rules/age.js';
import type { TradeRoute } from '../rules/tradeRoute.js';
import type { CityStateId } from '../rules/cityState.js';
import { CHOIR_FINALE, isFlooded } from '../rules/choir.js';
import type { SeasonPhase } from '../rules/season.js';
import type { CaptureOutcome, Cell, H3Index } from '../types/domain.js';
import type { TechId } from '../rules/tech.js';
import { K } from './keys.js';
import type { KeyValueStore } from './kv.js';

const KEY = 'resources';

/**
 * A full, finite pool from whatever was stored (BRDC-ECON-002). A pouch written before the
 * resource set reached nine is missing fields; the first `undefined + n` mints `NaN`, and
 * a `NaN` pool reads on screen as empty — the "my resources vanished" bug. So every read
 * is normalised: missing or non-finite becomes 0, every known key present.
 */
export function normalizePool(pool: Partial<ResourcePool> | null | undefined): ResourcePool {
  const out = { ...EMPTY_POOL };
  for (const k of RESOURCE_KINDS) {
    const v = pool?.[k];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

/**
 * Everything the yield rules read, in one transaction (BRDC-WORKS-002) — the context the
 * settle, the hex card and the map's overlay all share (BRDC-YIELD-001).
 */
export async function yieldContext(
  store: KeyValueStore,
  owned: readonly Cell[],
  now: number,
): Promise<{ ctx: YieldContext; works: WorksContext }> {
  const [dwellS, homeS, expansionsS, spellsS, researchedS, revealedS, treesS, pouchS, invS, mythosS, erasS, weekS, routesS, suzS, tasksS, wondersS] = await store.getMany<unknown>([
    K.dwell, K.home, K.expansions, K.spells, K.researched, K.revealed, K.worksTree, KEY, K.investigator, K.mythos, K.eras, K.week, K.tradeRoutes, K.suzerain, K.tasks, K.wonderFinds,
  ]);
  const home = (homeS as H3Index | undefined) ?? null;
  const dwell = (dwellS as DwellMap | undefined) ?? {};
  const works = worksContextFrom(treesS as WorksContext['trees'] | undefined, home, dwell);
  const ctx: YieldContext = {
    now,
    owned,
    keep: (pouchS as ResourceState | undefined)?.keep,
    places: placesWithHome(dwell, home),
    expansions: (expansionsS as Record<H3Index, number> | undefined) ?? {},
    revealed: (revealedS as Record<H3Index, number> | undefined) ?? {},
    researched: (researchedS as TechId[] | undefined) ?? [],
    spells: (spellsS as ActiveSpell[] | undefined) ?? [],
    trees: works.trees,
    kindAt: works.kindAt,
    factor: darkTimeAt(now).factor,
    archetype: (invS as Investigator | undefined)?.archetype,
    mythos: mythosS ? mythosFor(mythosS as { seed: string; opensAt: number }, now) : null,
    eras: erasS as EraId[] | undefined,
    week: weekEffect(weekS as WeekState | undefined, now),
    routes: routesS as TradeRoute[] | undefined,
    suzerain: suzS as CityStateId[] | undefined,
    wonders: Object.entries((wondersS as Record<WonderId, { h3: H3Index }> | undefined) ?? {}).map(([id, f]) => ({ id: id as WonderId, h3: f.h3 })),
    flooded: isFlooded((mythosS as { phase?: SeasonPhase } | undefined)?.phase, (tasksS as { outcomes?: Record<string, { status: string }> } | undefined)?.outcomes?.[CHOIR_FINALE]?.status === 'completed'),
    terror: (mythosS as { terror?: number } | undefined)?.terror,
  };
  return { ctx, works };
}

/** The per-hour bonus `settleResources` adds on top of the raw trickle — `realmBonus`
 *  (`rules/hexYield.ts`), so `rules/terrain.ts` stays blind to every source of it. */
async function perHourBonus(
  store: KeyValueStore,
  owned: readonly Cell[],
  now: number,
): Promise<{ bonus: Partial<ResourcePool>; works: WorksContext; factor: number }> {
  const { ctx, works } = await yieldContext(store, owned, now);
  // The dark time and the week's age both scale what is made (BRDC-AGE-001).
  return { bonus: realmBonus(ctx), works, factor: ctx.factor * (ctx.week?.factor ?? 1) };
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
/** The pouch's ceilings: the Storehouse's shared one, raised per resource by research. */
function capFor(owned: readonly Cell[], works: WorksContext): StorageCap {
  const base = storageCap(buildingsOf(owned));
  const bonus = worksCapBonus(owned, works.trees, works.kindAt);
  if (Object.keys(bonus).length === 0) return base;
  const out = {} as Record<ResourceKind, number>;
  for (const k of RESOURCE_KINDS) out[k] = base + (bonus[k] ?? 0);
  return out;
}

async function read(store: KeyValueStore, now: number): Promise<ResourceState> {
  const stored = await store.get<ResourceState>(KEY);
  if (!stored) {
    // Persist the stand-in once, here, so the clock actually starts (BRDC-ECON-005). It
    // used to be `settlePouch`'s job via an unconditional write, but that let a
    // concurrent spend be clobbered by a racing no-op settle (BRDC-ECON-006). Starting
    // the clock is a one-time write; a no-op settle must stay a no-op.
    const fresh: ResourceState = { pool: EMPTY_POOL, since: now, sinceDay: now };
    await store.set<ResourceState>(KEY, fresh);
    return fresh;
  }
  // A pouch written before the resource set reached nine is missing fields; left alone,
  // the first sum on it is NaN and the pouch reads as empty (BRDC-ECON-002).
  return { ...stored, pool: normalizePool(stored.pool) };
}

/**
 * Every write to the pouch key goes through here, one at a time, re-reading inside the
 * lock (BRDC-ECON-006). Two overlapping read-modify-writes — a spend and a settle most
 * often — would otherwise clobber each other: one reads the pre-spend pool, the other
 * debits it, the first writes its stale copy back. `next` gets the *fresh* state and
 * returns what to write, or returns its argument unchanged to write nothing.
 */
let writeChain: Promise<unknown> = Promise.resolve();
export function commit(
  store: KeyValueStore,
  now: number,
  next: (current: ResourceState) => ResourceState,
): Promise<ResourceState> {
  const run = writeChain.then(async () => {
    const current = await read(store, now);
    const updated = next(current);
    if (updated !== current) await store.set<ResourceState>(KEY, updated);
    return updated;
  });
  writeChain = run.catch(() => {});
  return run;
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
  // Buildings and places feed in here, not inside settleResources: a Storehouse raises
  // the ceiling, and building production plus temple mana add a per-hour bonus, each
  // dormancy-filtered (BRDC-BUILD-001, BRDC-MANA-001). Computed before the write lock —
  // it reads other store keys and does not touch the pouch.
  const { bonus: bph, works, factor } = await perHourBonus(store, owned, now);
  const cap = capFor(owned, works);
  const bpd = buildingDayBonus(owned, now);
  // Settle against the *fresh* pool: a spend that landed since is kept, not clobbered
  // (BRDC-ECON-006). `settleResources` returns its argument unchanged for a no-op, which
  // `commit` then does not write.
  return commit(store, now, (cur) => {
    // Season 2: stores fill for 12 h after the last collection at the Keep, then the realm
    // sleeps until walked to (PROG-002); what is produced feeds the granary first (PROG-001).
    const until = cur.keep?.titheAt !== undefined ? Math.min(now, cur.keep.titheAt + STORE_MS) : now;
    const fed = feedGranary(cur, settleResources(cur, owned, until, cap, bph, bpd, factor));
    return until < now && fed.since < now ? { ...fed, since: now, sinceDay: now } : fed;
  });
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
  const { bonus: bph, works, factor } = await perHourBonus(store, owned, now);
  const cap = capFor(owned, works);
  const bpd = buildingDayBonus(owned, now);

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
 * Settle the pouch at the moment ground changes hands, so the trickle owed up to now is
 * banked against the old holdings and a new cell never earns for the hours before it was
 * taken.
 *
 * It used to pay a one-off `CLAIM_YIELD` per cell too. Removed 2026-09-29 before Season 2
 * (Infinite: *"poistetaan adjancy bonus +10 resurssia.. tekee pelistä aivan liian
 * nopean"*): every step onto a neighbouring hex paid ten, so walking alone filled the pouch.
 */
export async function awardClaims(
  store: KeyValueStore,
  owned: readonly Cell[],
  outcomes: readonly CaptureOutcome[],
  now: number,
): Promise<void> {
  const taken = outcomes.filter((o) => o.kind === 'claimed' || o.kind === 'taken');
  if (taken.length === 0) return;

  await settlePouch(store, owned, now);
}

/**
 * What has come into the pouch since the player last pressed Collect (BRDC-ECON-007).
 *
 * Not a payout — the hourly trickle already banks itself in `settlePouch`. This settles
 * first so the reading is current, then reports `pool - poolAtCollect` (never negative:
 * spending between collects is not a loss to show) and how long the wait was, and moves
 * the collect mark to now. The pool itself is left exactly as the settle left it.
 */
export interface Collected {
  delta: Partial<ResourcePool>;
  total: number;
  hours: number;
  /** `now`, so the client can key the animation to the press. */
  at: number;
}

export async function collectPouch(
  store: KeyValueStore,
  owned: readonly Cell[],
  now: number,
): Promise<Collected> {
  const state = await settlePouch(store, owned, now);
  const mark = state.poolAtCollect ?? state.pool;
  const since = state.collectedAt ?? now;

  const delta: Partial<ResourcePool> = {};
  let total = 0;
  for (const k of RESOURCE_KINDS) {
    const d = state.pool[k] - (mark[k] ?? 0);
    if (d > 0) {
      delta[k] = d;
      total += d;
    }
  }

  // Move the mark, keeping whatever pool is current — a spend between the settle above and
  // here is not undone (BRDC-ECON-006).
  await commit(store, now, (cur) => ({ ...cur, collectedAt: now, poolAtCollect: { ...cur.pool } }));
  return { delta, total, hours: Math.max(0, (now - since) / 3_600_000), at: now };
}

/**
 * Dev only: top every resource up by `amount`, capped. Wired to a menu button behind
 * `import.meta.env.DEV` so a field test that has lost its pouch can carry on.
 */
export async function grantAll(
  store: KeyValueStore,
  owned: readonly Cell[],
  now: number,
  amount: number,
): Promise<void> {
  const state = await settlePouch(store, owned, now);
  const cap = capFor(owned, await worksContext(store));
  const pool = { ...state.pool };
  for (const k of RESOURCE_KINDS) pool[k] = Math.min(capOf(cap, k), pool[k] + amount);
  await writePouch(store, state.pool, pool, now);
}

/**
 * Add a fixed bonus pool, capped at storage. Settles first so nothing owed is lost, then
 * writes. Used by the reveal bonus (BRDC-CLAIM-009) — a one-off grant, not a trickle.
 */
export async function grantBonus(
  store: KeyValueStore,
  owned: readonly Cell[],
  bonus: Partial<ResourcePool>,
  now: number,
): Promise<void> {
  const state = await settlePouch(store, owned, now);
  const cap = capFor(owned, await worksContext(store));
  const pool = { ...state.pool };
  for (const [k, v] of Object.entries(bonus) as [ResourceKind, number][]) {
    pool[k] = Math.min(capOf(cap, k), pool[k] + v);
  }
  await writePouch(store, state.pool, pool, now);
}

/**
 * Empty the pouch deliberately (BRDC-ECON-005).
 *
 * Not a settle: the hours owed up to now go with everything else, and both clocks move to
 * `now` so the next read does not immediately pay back what the reset just threw away.
 */
export async function resetPouch(store: KeyValueStore, now: number): Promise<ResourcePool> {
  await store.set<ResourceState>(KEY, { pool: EMPTY_POOL, since: now, sinceDay: now });
  return EMPTY_POOL;
}

/**
 * Write a spend or a gain back without touching the trickle clock.
 *
 * `since` belongs to the trickle and must survive a purchase — moving it would hand the
 * player a free hour, or steal one, depending on which way it went.
 *
 * Written as the change it is — `after − before`, onto the pool as it stands inside the
 * lock (BRDC-ECON-010). Writing `after` whole put back whatever landed between the read
 * and the write: a reward and a purchase in the same moment lost one of the two. Never
 * below zero, should two spends of the same thing cross.
 */
export async function writePouch(
  store: KeyValueStore,
  before: ResourcePool,
  after: ResourcePool,
  now: number,
): Promise<void> {
  await commit(store, now, (cur) => {
    const pool = { ...cur.pool };
    let moved = false;
    for (const k of RESOURCE_KINDS) {
      const d = after[k] - before[k];
      if (d === 0) continue;
      pool[k] = Math.max(0, pool[k] + d);
      moved = true;
    }
    return moved ? { ...cur, pool } : cur;
  });
}
