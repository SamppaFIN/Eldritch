/**
 * The season's ambition (BRDC-AMBITION-001) — Old World's ambitions, Civ's victory types:
 * the realm chooses *how* it means to be remembered, once per season, and the Legacy says
 * whether it got there.
 *
 * Three ambitions, each read from the realm as it stands (the way a task's objective is,
 * QUEST-009), never a counter. Met at the tally, it multiplies the Legacy.
 *
 * Pure.
 */
import { worksOn } from './build.js';
import type { Progress } from './tasks.js';
import type { Cell, H3Index } from '../types/domain.js';

export type AmbitionId = 'temples' | 'gates' | 'realm';

export interface Ambition {
  id: AmbitionId;
  title: string;
  text: string;
  need: number;
}

export const AMBITIONS: Readonly<Record<AmbitionId, Ambition>> = {
  temples: { id: 'temples', title: 'Keeper of Temples', text: 'Hold three temples when the season closes.', need: 3 },
  gates: { id: 'gates', title: 'Warden of the Gates', text: 'Seal ten gates this season.', need: 10 },
  realm: { id: 'realm', title: 'Lord of the Ground', text: 'Hold two hundred hexes when the season closes.', need: 200 },
};

export const AMBITION_IDS: readonly AmbitionId[] = ['temples', 'gates', 'realm'];

/** A met ambition multiplies the Legacy. */
export const AMBITION_MULT = 1.15;

export interface AmbitionState {
  owned: readonly Cell[];
  /** Every temple place the realm has revealed. */
  templePlaces: readonly H3Index[];
  gatesSealed: number;
}

/** Temples held: a revealed temple on your ground, or a Temple Grove you raised. */
export function templesHeld(owned: readonly Cell[], templePlaces: readonly H3Index[]): number {
  const at = new Set(templePlaces);
  return owned.filter((c) => at.has(c.h3) || worksOn(c).some((w) => w.id === 'temple-grove')).length;
}

export function ambitionProgress(id: AmbitionId, s: AmbitionState): Progress {
  const need = AMBITIONS[id].need;
  const have = id === 'temples' ? templesHeld(s.owned, s.templePlaces) : id === 'gates' ? s.gatesSealed : s.owned.length;
  return { have: Math.min(need, have), need };
}

export const ambitionMet = (id: AmbitionId, s: AmbitionState): boolean => {
  const p = ambitionProgress(id, s);
  return p.have >= p.need;
};
