/**
 * The town's terror (BRDC-TERROR-001) — Arkham Horror's terror track: not one realm's
 * sanity but the whole town's nerve, shared by everyone. It moves with the gates the
 * shared Doom already hears of: a gate left open two days raises it, a gate sealed lowers
 * it. At 5 the villages drive harder bargains; at 8 the Markets shut early.
 *
 * Kept on the Worker's season; a realm with no Worker has a town with no terror.
 *
 * Pure.
 */
import { TRADE_LOSS } from './cityState.js';

export const TERROR_MAX = 10;
export const TERROR_TRADE_AT = 5;
export const TERROR_MARKET_AT = 8;
/** What the villages keep of a parcel when the town is afraid. */
export const TERROR_TRADE_LOSS = 0.4;
/** What a Market makes while the town is terrified. */
export const TERROR_MARKET_FACTOR = 0.75;

/** The track after a gate's move, held to 0–10. */
export const nextTerror = (terror: number, delta: number): number => Math.max(0, Math.min(TERROR_MAX, terror + delta));

export interface TerrorEffects {
  /** What a village keeps of a traded parcel. */
  tradeLoss: number;
  /** What a Market makes, as a share of its usual. */
  marketFactor: number;
  /** One line for the HUD, or '' when the town is calm enough not to say. */
  said: string;
}

export function terrorEffects(level: number): TerrorEffects {
  return {
    tradeLoss: level >= TERROR_TRADE_AT ? TERROR_TRADE_LOSS : TRADE_LOSS,
    marketFactor: level >= TERROR_MARKET_AT ? TERROR_MARKET_FACTOR : 1,
    said: level >= TERROR_MARKET_AT ? 'the Markets shut early' : level >= TERROR_TRADE_AT ? 'the villages bargain hard' : '',
  };
}
