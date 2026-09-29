/**
 * Ruins — the last season's Fortresses (BRDC-SEASON-007).
 *
 * Infinite 2026-09-29: *"olemassa olevista fortresseista tulee ruinsejja, mistä voi löytää
 * kivoja yllätyksiä civilisationin tapaan"*. Every Fortress standing when a season closed
 * is a ruin in the next (the Worker keeps the list, `GET /season/ruins`). Walk onto one
 * and search it, once: like Civilization's goody huts, what it gives is a surprise — but a
 * fixed one per ruin and season, the same on every phone.
 */
import type { ResourcePool } from './terrain.js';
import type { H3Index } from '../types/domain.js';

export interface RuinFind {
  id: string;
  text: string;
  gain?: Partial<ResourcePool>;
  clues?: number;
  xp?: number;
}

export const RUIN_FINDS: readonly RuinFind[] = [
  { id: 'cache', text: 'A cache under the fallen gate: dressed stone and good timber.', gain: { stone: 60, wood: 40 } },
  { id: 'treasury', text: 'The treasury was never found. Until now.', gain: { gold: 80 } },
  { id: 'armoury', text: 'An armoury, rusted but not ruined.', gain: { iron: 50 } },
  { id: 'granary', text: 'Sealed jars of grain, still dry.', gain: { food: 80 } },
  { id: 'map', text: 'A map scratched into the wall shows where the gates will open.', clues: 3 },
  { id: 'chronicle', text: 'The last garrison kept a chronicle. You read it all.', gain: { wisdom: 40 }, xp: 50 },
  { id: 'shrine', text: 'A small shrine the builders hid from the lake. It still hums.', gain: { mana: 40 } },
  { id: 'banner', text: 'Their banner, folded under a stone. The Keep will fly it.', gain: { culture: 40 }, xp: 25 },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** What searching this ruin gives, this season. */
export function ruinFindAt(seed: string, h3: H3Index): RuinFind {
  return RUIN_FINDS[Math.floor(hash(`${seed}:ruin:${h3}`) * RUIN_FINDS.length)] as RuinFind;
}
