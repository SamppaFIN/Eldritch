/**
 * You, the investigator — dice, clues, stamina and sanity (BRDC-DOOM-002,
 * Eldritch-Progression.pdf P5, "Clues", "You, the Investigator").
 *
 * A test rolls dice and counts successes: a 5 or 6 succeeds, blessed a 4 too, cursed only
 * a 6. The dice are 2 + the skill tested. A clue rerolls one die; five seal a gate outright
 * (three with Elder Signs). A test costs a point of stamina, and failing one at a gate
 * costs two of sanity. At zero stamina or sanity the investigator is sent home: half the
 * clues are lost and there is nothing more to test for 12 hours.
 *
 * Pure. Randomness comes in as `rng`, a function returning [0, 1) — seeded in tests.
 */
import { BALANCE } from './balance.js';
import type { LoreId } from './lore.js';

export type Skill = 'lore' | 'will' | 'fight' | 'observe';
export type Luck = 'normal' | 'blessed' | 'cursed';

export interface Investigator {
  stamina: number;
  sanity: number;
  clues: number;
  skills: Record<Skill, number>;
  /** Sent home at this moment — no tests until `HOME_MS` after it. */
  homeAt?: number;
  /** Last time stamina and sanity were topped up by rest. */
  restedAt: number;
  /** Borrowed Voice: extra dice on every test until `until` (PROG-007). */
  voice?: { dice: number; until: number };
  /** Madness Seed: every test is blessed until this moment (PROG-007). */
  blessedUntil?: number;
}

export const STAMINA_MAX = 7;
export const SANITY_MAX = 6;
export const HOME_MS = 12 * 3_600_000;
/** Rest gives back a point of stamina and of sanity every two hours (the ticket's default). */
export const REST_MS = 2 * 3_600_000;

export const FIRST_INVESTIGATOR = (now: number): Investigator => ({
  stamina: STAMINA_MAX,
  sanity: SANITY_MAX,
  clues: 0,
  skills: { lore: 3, will: 2, fight: 2, observe: 2 },
  restedAt: now,
});

export const diceFor = (inv: Investigator, skill: Skill, now = 0): number =>
  2 + inv.skills[skill] + (inv.voice && inv.voice.until > now ? inv.voice.dice : 0);
/** The luck a test rolls with: blessed while a Madness Seed lasts. */
export const luckFor = (inv: Investigator, now: number): Luck =>
  inv.blessedUntil !== undefined && inv.blessedUntil > now ? 'blessed' : 'normal';
export const successFloor = (luck: Luck): number => (luck === 'blessed' ? 4 : luck === 'cursed' ? 6 : BALANCE.successOn);
export const sealClues = (lore: readonly LoreId[]): number => (lore.includes('elder-signs') ? 3 : BALANCE.sealClues);

export interface Roll {
  faces: number[];
  successes: number;
  need: number;
  pass: boolean;
  luck: Luck;
}

const d6 = (rng: () => number) => 1 + Math.floor(rng() * 6);

export function rollTest(dice: number, need: number, luck: Luck, rng: () => number): Roll {
  const faces = Array.from({ length: Math.max(0, dice) }, () => d6(rng));
  return score(faces, need, luck);
}

function score(faces: number[], need: number, luck: Luck): Roll {
  const successes = faces.filter((f) => f >= successFloor(luck)).length;
  return { faces, successes, need, pass: successes >= need, luck };
}

/** Spend a clue: reroll the die at `index`. */
export function reroll(roll: Roll, index: number, rng: () => number): Roll {
  const faces = roll.faces.map((f, i) => (i === index ? d6(rng) : f));
  return score(faces, roll.need, roll.luck);
}

/** Rest and recovery up to `now`: home ends after 12 h, and rest tops both bars up. */
export function recover(inv: Investigator, now: number): Investigator {
  if (inv.homeAt !== undefined) {
    if (now - inv.homeAt < HOME_MS) return inv;
    const { homeAt: _home, ...rest } = inv;
    return { ...rest, stamina: STAMINA_MAX, sanity: SANITY_MAX, restedAt: now };
  }
  const steps = Math.floor((now - inv.restedAt) / REST_MS);
  if (steps <= 0) return inv;
  return {
    ...inv,
    stamina: Math.min(STAMINA_MAX, inv.stamina + steps),
    sanity: Math.min(SANITY_MAX, inv.sanity + steps),
    restedAt: inv.restedAt + steps * REST_MS,
  };
}

export const isHome = (inv: Investigator, now: number): boolean =>
  inv.homeAt !== undefined && now - inv.homeAt < HOME_MS;

/** Pay for a test and take what it cost; zero of either sends the investigator home. */
export function afterTest(inv: Investigator, stamina: number, sanity: number, now: number): Investigator {
  const next = { ...inv, stamina: Math.max(0, inv.stamina - stamina), sanity: Math.max(0, inv.sanity - sanity) };
  if (next.stamina > 0 && next.sanity > 0) return next;
  return { ...next, clues: Math.floor(next.clues / 2), homeAt: now };
}

export const addClues = (inv: Investigator, n: number): Investigator => ({
  ...inv,
  clues: Math.max(0, Math.min(BALANCE.clueCap, inv.clues + n)),
});
