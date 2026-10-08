/**
 * Great people (BRDC-GREAT-001) — Civilization's, in the Fuming Lake's own names: some
 * Works gather points every hour, and at enough points a named person is born with one
 * great deed. The deed is used once, and the person goes to the Hall.
 *
 * A Library gathers for a Scholar, a Market for a Merchant, a Temple Grove for a Mystic —
 * one point an hour each, awake ground only, and on a Season 2 realm only with hands in it,
 * as every yield. Each birth of a kind costs half again more than the one before.
 *
 * The deeds ride mechanics that exist, the way a wonder's actions do (`wonderActs.ts`).
 *
 * Pure.
 */
import { DECAY_GRACE_HOURS } from './constants.js';
import { worksOn } from './build.js';
import { staffKey } from './staffing.js';
import type { BuildingId, Cell } from '../types/domain.js';

export type GreatKind = 'scholar' | 'merchant' | 'mystic';
export const GREAT_KINDS: readonly GreatKind[] = ['scholar', 'merchant', 'mystic'];

export type GreatDeed = { kind: 'reveal'; rings: number } | { kind: 'harvest'; hours: number } | { kind: 'sealFromAfar' };

export interface GreatKindDef {
  title: string;
  work: BuildingId;
  deedName: string;
  deedText: string;
  deed: GreatDeed;
  names: readonly string[];
}

export const GREAT: Readonly<Record<GreatKind, GreatKindDef>> = {
  scholar: {
    title: 'Great Scholar', work: 'library', deedName: 'Chart the Unknown', deedText: 'Three rings around your Hearth are seen.', deed: { kind: 'reveal', rings: 3 },
    names: ['Agnes of the Drowned Stacks', 'Cornelius the Younger', 'Väinö Who Counted the Stars', 'The Archivist of Pispala'],
  },
  merchant: {
    title: 'Great Merchant', work: 'market', deedName: 'The Double Harvest', deedText: 'A whole day’s making comes in at once.', deed: { kind: 'harvest', hours: 24 },
    names: ['The Wandering Merchant’s Daughter', 'Hilda of the Night Market', 'Old Finlayson’s Clerk', 'The Ferryman’s Purser'],
  },
  mystic: {
    title: 'Great Mystic', work: 'temple-grove', deedName: 'Close the Door', deedText: 'The nearest open gate is sealed from afar.', deed: { kind: 'sealFromAfar' },
    names: ['The Keeper of the Healing Shrine', 'Aurora’s Acolyte', 'Mara Who Hears the Lake', 'The Sexton of Härmälä'],
  },
};

/** The first of a kind is born at 100 points; each next costs half again more. */
export const GREAT_FIRST = 100;
export const greatCost = (bornOfKind: number): number => GREAT_FIRST + (GREAT_FIRST / 2) * bornOfKind;

export const greatName = (kind: GreatKind, bornOfKind: number): string => {
  const names = GREAT[kind].names;
  const name = names[bornOfKind % names.length] as string;
  return bornOfKind < names.length ? name : `${name} ${['II', 'III', 'IV'][Math.floor(bornOfKind / names.length) - 1] ?? 'the Last'}`;
};

const DORMANT_AFTER_MS = DECAY_GRACE_HOURS * 3_600_000;

/** Points an hour per kind: one per gathering Work on awake ground (staffed, on a Season 2 realm). */
export function greatRate(owned: readonly Cell[], now: number, staff: Readonly<Record<string, number>> | null): Record<GreatKind, number> {
  const out: Record<GreatKind, number> = { scholar: 0, merchant: 0, mystic: 0 };
  for (const c of owned) {
    if (now - c.lastVisitedAt > DORMANT_AFTER_MS) continue;
    for (const kind of GREAT_KINDS) {
      const work = GREAT[kind].work;
      if (!worksOn(c).some((w) => w.id === work)) continue;
      if (staff && (staff[staffKey(c.h3, work)] ?? 0) <= 0) continue;
      out[kind] += 1;
    }
  }
  return out;
}
