/**
 * Sanity is the realm's mood (BRDC-PROG-008, Eldritch-Progression.pdf "Sanity is the
 * realm's mood").
 *
 *   10 + 2·temples + 3·taverns − (citizens − 6) − cells ÷ 8 − 2·gatesNear
 *
 * Temples and taverns count while staffed (the WORK table's NOTE: "sanity +2 while
 * staffed", "+3"); a temple here is a Temple Grove, the building a Season 2 realm can
 * staff. Gates arrive with DOOM-002 — until then `gatesNear` is 0. Below 0 every yield
 * falls a fifth and madness encounters appear; below −10 citizens start to leave.
 */
import { staffKey } from './staffing.js';
import { worksOn } from './build.js';
import type { StaffMap } from './staffing.js';
import type { Cell } from '../types/domain.js';

export const SANITY_YIELD_PENALTY = 0.8;
export const SANITY_LEAVE_BELOW = -10;

export function realmSanity(cells: readonly Cell[], staff: StaffMap, citizens: number, gatesNear = 0): number {
  let temples = 0;
  let taverns = 0;
  for (const c of cells) {
    for (const w of worksOn(c)) {
      if ((staff[staffKey(c.h3, w.id)] ?? 0) <= 0) continue;
      if (w.id === 'temple-grove') temples += 1;
      if (w.id === 'tavern') taverns += 1;
    }
  }
  return Math.floor(10 + 2 * temples + 3 * taverns - (citizens - 6) - cells.length / 8 - 2 * gatesNear);
}

/** What the number means, in a word — colour never carries it alone (§14). */
export function sanityWord(sanity: number): 'calm' | 'uneasy' | 'mad' | 'breaking' {
  if (sanity < SANITY_LEAVE_BELOW) return 'breaking';
  if (sanity < 0) return 'mad';
  if (sanity < 5) return 'uneasy';
  return 'calm';
}

/** The yield multiplier a mood gives: a mad realm works at four fifths. */
export const sanityYield = (sanity: number): number => (sanity < 0 ? SANITY_YIELD_PENALTY : 1);
