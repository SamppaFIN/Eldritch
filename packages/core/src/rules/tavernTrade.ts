/**
 * Gold for culture at the Tavern (BRDC-TRADE-001).
 *
 * One way only — culture is never sold back — at a poor rate shown before the trade, and
 * only so much a day: the Tavern is a door into the culture branch for a realm rich in
 * gold, not a mint that turns a hoard of gold into Monuments overnight.
 *
 * Pure. The store keeps the day's count and checks the player stands on their own Tavern.
 */
import type { ResourcePool } from './terrain.js';

/** Gold for one culture. */
export const TAVERN_GOLD_PER_CULTURE = 5;
/** Culture a realm may buy in one UTC day. */
export const TAVERN_CULTURE_PER_DAY = 20;

export type TavernTradeRefusal = 'none' | 'cap' | 'cannot-afford';
export type TavernTradeResult = { ok: true; pool: ResourcePool; gold: number } | { ok: false; refused: TavernTradeRefusal };

/** Buy `culture` with gold, given what was already bought today. */
export function tavernTrade(pool: ResourcePool, culture: number, boughtToday: number): TavernTradeResult {
  if (!Number.isInteger(culture) || culture <= 0) return { ok: false, refused: 'none' };
  if (boughtToday + culture > TAVERN_CULTURE_PER_DAY) return { ok: false, refused: 'cap' };
  const gold = culture * TAVERN_GOLD_PER_CULTURE;
  if (pool.gold < gold) return { ok: false, refused: 'cannot-afford' };
  return { ok: true, pool: { ...pool, gold: pool.gold - gold, culture: pool.culture + culture }, gold };
}
