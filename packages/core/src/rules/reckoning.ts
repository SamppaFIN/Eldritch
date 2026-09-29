/**
 * The Reckoning — everyone against one Ancient One (BRDC-DOOM-004, Eldritch-season.pdf S2
 * and "How a season ends").
 *
 * For 72 hours every realm fights one shared enemy of 900 × active realms strength. Three
 * ways to hurt it: Strike (a Fight test, damage per success), Seal (a gate closed now
 * cannot heal it — DOOM-002's seal, counted here), and a Rite (mana, doubled by a Sunken
 * Cathedral). Fortresses add their weight to every strike; the Lamp Under the Lake adds
 * its rank's share to everything the realm deals. Factions are parked (Infinite
 * 2026-09-29), so "faction-wide" is realm-wide.
 *
 * The document gives the shape, not these numbers; they are the ticket's defaults, sized
 * so six friends striking a few times a day can fell it inside 72 hours — the Quiet end.
 */
import type { Roll } from './investigator.js';

export const STRIKE_PER_SUCCESS = 100;
export const FORTRESS_STRIKE_BONUS = 50;
export const RITE_MANA_COST = 30;
export const RITE_DAMAGE = 150;
export const SEAL_DAMAGE = 200;
/** A realm's strikes are rationed: one each 20 minutes, so the fight lasts the 72 hours. */
export const STRIKE_COOLDOWN_MS = 20 * 60_000;
/** The most one call may deal — the Worker refuses more. */
export const MAX_DAMAGE_PER_CALL = 2_000;

export interface RealmMight {
  fortresses: number;
  cathedral: boolean;
  /** The Lamp Under the Lake's rank value in percent (25 / 40 / 60), 0 when not cast. */
  lampPct: number;
}

const lamp = (m: RealmMight, dmg: number) => Math.round(dmg * (1 + m.lampPct / 100));

/** A strike: every success lands, and every Fortress adds its weight. */
export function strikeDamage(roll: Roll, m: RealmMight): number {
  if (roll.successes === 0) return 0;
  return lamp(m, roll.successes * STRIKE_PER_SUCCESS + m.fortresses * FORTRESS_STRIKE_BONUS);
}

/** A rite: mana into harm, twice over with a Sunken Cathedral. */
export const riteDamage = (m: RealmMight): number => lamp(m, RITE_DAMAGE * (m.cathedral ? 2 : 1));

/** A gate sealed during the Reckoning is one fewer healer. */
export const sealDamage = (m: RealmMight): number => lamp(m, SEAL_DAMAGE);

export interface ReckoningStanding {
  realm: string;
  damage: number;
}

/** Where a realm stands in the fight, 1-based; unranked realms are last. */
export function rankOf(standings: readonly ReckoningStanding[], realm: string): number {
  const sorted = [...standings].sort((a, b) => b.damage - a.damage);
  const i = sorted.findIndex((s) => s.realm === realm);
  return i < 0 ? sorted.length + 1 : i + 1;
}
