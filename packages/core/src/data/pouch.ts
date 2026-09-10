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
import { research, researchBonus } from '../rules/tech.js';
import type { ResearchResult, TechId } from '../rules/tech.js';
import { buildingBonus, buildingDayBonus, buildingsOf, storageCap } from '../rules/build.js';
import { placesWithHome } from '../rules/dwell.js';
import type { DwellMap } from '../rules/dwell.js';
import { placeBonus } from '../rules/mana.js';
import { bountyBonus } from '../rules/bounty.js';
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

/** Add one partial pool into another, in place. */
function addInto(into: Partial<ResourcePool>, from: Partial<ResourcePool>): void {
  for (const [k, v] of Object.entries(from) as [ResourceKind, number][]) {
    into[k] = (into[k] ?? 0) + v;
  }
}

/**
 * The per-hour bonus `settleResources` adds on top of the raw trickle: building
 * production (BRDC-BUILD-001), mana and wisdom from held places (BRDC-MANA-002), what
 * research pays on its own ground (PIVOT-2026-09-09 §3), a running research spell
 * (BRDC-SPELL-001), and area auras from Libraries and the like (BRDC-BUILD-003),
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
  addInto(merged, placeBonus(placesWithHome(dwell, home), expansions, owned, now));

  const spells = (await store.get<ActiveSpell[]>(K.spells)) ?? [];
  addInto(merged, domainSpellBonus(activeSpells(spells, now), now));
  addInto(merged, resourceAura(owned, now));

  const researched = (await store.get<TechId[]>(K.researched)) ?? [];
  addInto(merged, researchBonus(researched, owned, now));

  // Bounties pay only on ground that has been revealed (BRDC-BOUNTY-001) — the reveal is
  // how you find out what your own land is worth.
  const revealed = (await store.get<Record<H3Index, number>>(K.revealed)) ?? {};
  addInto(merged, bountyBonus(owned, revealed, now));

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
function commit(
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
  const cap = storageCap(buildingsOf(owned));
  const bph = await perHourBonus(store, owned, now);
  const bpd = buildingDayBonus(owned, now);
  const factor = darkTimeAt(now).factor;
  // Settle against the *fresh* pool: a spend that landed since is kept, not clobbered
  // (BRDC-ECON-006). `settleResources` returns its argument unchanged for a no-op, which
  // `commit` then does not write.
  return commit(store, now, (cur) => settleResources(cur, owned, now, cap, bph, bpd, factor));
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

  await settlePouch(store, owned, now);
  await commit(store, now, (cur) => {
    let pool = cur.pool;
    for (const outcome of taken) pool = addClaimYield(pool, outcome.h3);
    return { ...cur, pool };
  });
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
  const cap = storageCap(buildingsOf(owned));
  const pool = { ...state.pool };
  for (const k of RESOURCE_KINDS) pool[k] = Math.min(cap, pool[k] + amount);
  await writePouch(store, pool, now);
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
  const cap = storageCap(buildingsOf(owned));
  const pool = { ...state.pool };
  for (const [k, v] of Object.entries(bonus) as [ResourceKind, number][]) {
    pool[k] = Math.min(cap, pool[k] + v);
  }
  await writePouch(store, pool, now);
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
  await commit(store, now, (cur) => ({ ...cur, pool }));
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
