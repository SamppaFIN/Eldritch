/**
 * What a Consciousness milestone gives (BRDC-MIND-001): one perk each, felt in play rather
 * than read about. Before this a level made the loop larger and the attack stronger — both
 * invisible — and the You screen explained what a level *meant* and nothing it *did*.
 *
 * Pure: a level in, the perks out. Where each takes effect is the seam that owns that
 * rule — anomalies (`storyRepo`), the Ward (`wardStore`), the map's sight (`useShownCells`).
 */

export type PerkId = 'foresight' | 'far-sight' | 'free-ward' | 'wide-sight';

export interface Perk {
  id: PerkId;
  /** The Consciousness level it comes with. */
  level: number;
  /** One short line, said where the milestone is listed. */
  text: string;
}

export const PERKS: readonly Perk[] = [
  { id: 'foresight', level: 5, text: 'You see whether an anomaly holds a reward or a story before you study it' },
  // The plan said "the rival's distance", but that only ever showed on the first walk's hint,
  // long gone by level 10. Seeing what the Medium sees is a perk a level-10 walker meets.
  { id: 'far-sight', level: 10, text: 'You see anomalies beyond your border, as the Medium does' },
  { id: 'free-ward', level: 15, text: 'One Ward a day costs nothing' },
  { id: 'wide-sight', level: 20, text: 'You see two rings past your ground' },
];

export const hasPerk = (level: number, id: PerkId): boolean => PERKS.some((p) => p.id === id && level >= p.level);

/** Every perk held at `level`, lowest first. */
export const perksAt = (level: number): Perk[] => PERKS.filter((p) => level >= p.level);

/** The perk that comes with exactly this level, if one does — for the level-up moment. */
export const perkAt = (level: number): Perk | undefined => PERKS.find((p) => p.level === level);
