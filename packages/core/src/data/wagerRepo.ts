/**
 * The repository half of the Wager (BRDC-WAGER-JSON-001).
 *
 * `wager.js` holds the wire format and the muster maths; this is the thin seam that
 * assembles a duel from what the repository already knows. Lifted out of MockRepository
 * to keep it under its line limit — the same split as `pouch.js` and `walkFlow.js`.
 *
 * A `Muster` is the four things both `exportChallenge` and `getCombatant` need: who you
 * are, the ground still standing, the Keep, and what you built on your border. The
 * repository gathers it once; these functions turn it into a challenge or a combatant.
 */
import { openChallenge, ownCombatant, sealChallenge } from './wager.js';
import type { ImportResult, WagerIdentity } from './wager.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, PlayerProfile } from '../types/domain.js';
import type { Combatant, Defence } from '../rules/wagerBattle.js';

export interface Muster {
  me: PlayerProfile;
  owned: readonly Cell[];
  castle: H3Index | null;
  defence: Defence;
}

/** The four repository reads a muster is built from — passed as `this` by MockRepository. */
export interface MusterDeps {
  getProfile(): Promise<PlayerProfile>;
  getOwnedCells(now: number): Promise<readonly Cell[]>;
  getCastle(): Promise<H3Index | null>;
  getDefence(): Promise<Defence>;
}

export async function muster(d: MusterDeps, now: number): Promise<Muster> {
  return {
    me: await d.getProfile(),
    owned: await d.getOwnedCells(now),
    castle: await d.getCastle(),
    defence: await d.getDefence(),
  };
}

/** Everything a friend's game needs to hold you as a rival, as text. */
export function exportChallengeFrom(m: Muster, now: number, identity?: WagerIdentity): string {
  return sealChallenge(m.me, m.owned, m.castle, m.defence, now, identity);
}

/** Accept a Wager: take their ground on, fight it, settle the spoils. */
export function importChallengeInto(
  store: KeyValueStore,
  m: Muster,
  text: string,
  now: number,
): Promise<ImportResult> {
  return openChallenge(store, text, m.me, m.owned, m.castle, now);
}

/** The local player as the battle rules see them. */
export function combatantFrom(m: Muster): Combatant {
  return ownCombatant(m.me, m.owned, m.castle, m.defence);
}
