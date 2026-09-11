/**
 * Where each wonder is, worked out identically on every device (BRDC-WONDER-001).
 *
 * `BRDC-REVEAL-001` requires everything be a deterministic hash — otherwise two players
 * see different worlds, and Phase 5's golden fixtures have nothing to agree on. But a
 * plain per-cell hash cannot promise there is only one R'lyeh: every cell rolls its own
 * die and knows nothing of the others.
 *
 * **Bounded argmax** is the answer. Over a finite set, "the highest roll" is computable
 * statelessly and comes out the same everywhere. The wonders are walked in the fixed order
 * `WONDERS` declares, and each takes the best province not already taken — so a collision
 * is resolved rather than merely unlikely.
 *
 * ## Scale is set by rarity, and that is an amendment
 *
 * The ticket's rule is "one wonder at most once in the world". Held to the letter for all
 * twelve, that is twelve provinces out of the 3626 res-5 cells over this country — a
 * player in Tampere would never see one, and Phase 3's own gate says *find a wonder*.
 *
 * So rarity sets the *scope* uniqueness holds over, the way Civilization separates world
 * wonders from national ones:
 *
 * | Rarity | One per | Roughly |
 * |---|---|---|
 * | legendary | the whole country | fate, and a rumour worth telling a friend |
 * | rare | a res-3 cell | a fifth of the country |
 * | uncommon | a res-4 cell | a province group |
 * | common | a res-5 cell | 253 km², the district you actually walk |
 *
 * At the common tier scope and province are the same cell, so the two common wonders
 * compete for a set of one and a province holds exactly one of them — which of the two is
 * decided by the higher roll on that province. That is the rule, not a side effect: the
 * next district over may well have the other, and "what is the small wonder in your part
 * of town" is a question with an answer worth asking a friend.
 *
 * The line the ticket was protecting — *"a second R'lyeh in the next block is not a
 * wonder"* — still holds exactly where it matters: the five legendary wonders are one per
 * country. Recorded in the ticket as `[~]`, not ticked silently.
 *
 * ## What this file does not decide
 *
 * The **province** (res 5) is fate and is computed here. The **exact hex** inside it is
 * not, and cannot be: it depends on terrain, and terrain is `'tiles' | 'hash'` depending
 * on what the device has seen (`BRDC-TERRAIN-002`). It is registered by whoever walks it
 * first. That is also the better game: the province is known and the door is not.
 */
import { cellToChildren, cellToParent } from 'h3-js';
import { WONDERS, WONDER_IDS } from './wonder.js';
import type { WonderId } from './wonder.js';
import type { Rarity } from './reveal.js';
import type { H3Index } from '../types/domain.js';

/** Provinces are res 5 — 253 km², the size of a region rather than a square. */
export const WONDER_PROVINCE_RES = 5;

/**
 * Which resolution uniqueness holds over, per rarity.
 *
 * `legendary` is the exception and is handled by its caller: its scope is the national
 * set, which has no single parent cell.
 */
export const WONDER_SCOPE_RES: Readonly<Record<Rarity, number>> = {
  legendary: 0,
  rare: 3,
  uncommon: 4,
  common: WONDER_PROVINCE_RES,
};

/**
 * Bumped whenever the candidate set or the order changes, because either moves wonders.
 *
 * It is part of every hash below, so a change here relocates all of them at once and
 * openly, rather than leaving two versions of the game quietly disagreeing about where
 * R'lyeh is. The same discipline as `SAVE_VERSION`.
 */
export const WONDER_SET_VERSION = 1;

/** FNV-1a, the same spread `terrain.ts`, `reveal.ts` and `bounty.ts` threshold on. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** One wonder's roll for one province. Salted by both, so no two share an ordering. */
export function wonderRoll(id: WonderId, province: H3Index): number {
  return hash(`wonder:${WONDER_SET_VERSION}:${id}:${province}`);
}

/**
 * Seat each wonder in `ids` among `candidates`, identically on every device.
 *
 * Every (wonder, province) pair is rolled and the pairs are taken highest-first, skipping
 * any whose wonder or province is already spoken for. Symmetric, which is the point: the
 * first version walked the wonders in order and let each take its best free province, and
 * that works only while provinces outnumber wonders. Where they do not — the common tier,
 * whose scope *is* one province — the first wonder in the list took the only seat every
 * time, and `dunwich-stones` was seated in none of sixty districts. Measured, not
 * supposed. Taking the best pair first lets the seat choose when it is the seat that is
 * scarce.
 *
 * Ties break on the pair's own text so two devices cannot disagree, and a wonder with
 * nowhere left is simply absent — a scope with two cells cannot hold three wonders, and
 * saying so is better than inventing a province.
 */
export function assignProvinces(
  ids: readonly WonderId[],
  candidates: readonly H3Index[],
): Map<WonderId, H3Index> {
  const pairs: { id: WonderId; province: H3Index; roll: number }[] = [];
  for (const id of ids) {
    for (const province of candidates) {
      pairs.push({ id, province, roll: wonderRoll(id, province) });
    }
  }
  pairs.sort((a, b) => b.roll - a.roll || `${a.id}:${a.province}`.localeCompare(`${b.id}:${b.province}`));

  const seatedWonders = new Set<WonderId>();
  const takenProvinces = new Set<H3Index>();
  const out = new Map<WonderId, H3Index>();

  for (const { id, province } of pairs) {
    if (seatedWonders.has(id) || takenProvinces.has(province)) continue;
    seatedWonders.add(id);
    takenProvinces.add(province);
    out.set(id, province);
  }
  // Declaration order out, so callers and tests see a stable shape regardless of rolls.
  return new Map(ids.filter((id) => out.has(id)).map((id) => [id, out.get(id) as H3Index]));
}

/** The wonders of one rarity, in declaration order. */
export function wondersOfRarity(rarity: Rarity): WonderId[] {
  return WONDER_IDS.filter((id) => WONDERS[id].rarity === rarity);
}

/**
 * The provinces of every non-legendary wonder whose scope contains `here`.
 *
 * `here` is any cell the player is near; each scope walks up to its own resolution and
 * back down to res 5, so the candidate set is the 49, 7 or 1 provinces inside it. Small
 * enough to compute on every call without caching anything.
 */
export function localWonders(here: H3Index): Map<WonderId, H3Index> {
  const out = new Map<WonderId, H3Index>();
  for (const rarity of ['rare', 'uncommon', 'common'] as const) {
    const scope = cellToParent(here, WONDER_SCOPE_RES[rarity]);
    const candidates = cellToChildren(scope, WONDER_PROVINCE_RES);
    for (const [id, province] of assignProvinces(wondersOfRarity(rarity), candidates)) {
      out.set(id, province);
    }
  }
  return out;
}

/**
 * The provinces of the five legendary wonders, over a national candidate set.
 *
 * The set is passed in rather than built here: it is geography, it is large, and it is the
 * thing `WONDER_SET_VERSION` exists to version. Keeping it out of this function also keeps
 * this file pure and its tests fast.
 */
export function legendaryWonders(nation: readonly H3Index[]): Map<WonderId, H3Index> {
  return assignProvinces(wondersOfRarity('legendary'), nation);
}

/** Every wonder whose province is known from `here` plus a national set. */
export function wondersNear(here: H3Index, nation: readonly H3Index[]): Map<WonderId, H3Index> {
  return new Map([...legendaryWonders(nation), ...localWonders(here)]);
}

/** Whether `province` is the seat of a wonder, given the same two inputs. */
export function wonderInProvince(
  province: H3Index,
  here: H3Index,
  nation: readonly H3Index[],
): WonderId | null {
  for (const [id, seat] of wondersNear(here, nation)) {
    if (seat === province) return id;
  }
  return null;
}
