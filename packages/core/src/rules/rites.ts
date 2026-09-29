/**
 * What the temples teach: three schools (BRDC-PROG-007, Eldritch-Progression.pdf P4 and
 * "TEMPLES · THREE SCHOOLS").
 *
 * A realm dedicates a school (Kindling opens one, Ley Reading a second). Each school has
 * five tiers — III and V a choice of two — and each learned rite deepens through ranks
 * I → III; the numbers are the rank values. The Age is the ceiling for the tier and caps
 * the rank at min(Age, 3). Replaces `spell.ts` for a Season 2 save.
 *
 * Only the effects the game can already carry are `wired`; the rest name the ticket that
 * gives them something to act on (gates and clues: DOOM-002, sanity: PROG-008, the
 * Ancient One: DOOM-004). Faction-wide effects act on the caster's own realm — factions
 * are parked (Infinite 2026-09-29).
 */
import { ageOf } from './lore.js';
import type { Age, LoreId } from './lore.js';

export type School = 'ward' | 'tide' | 'whisper';
export type Tier = 1 | 2 | 3 | 4 | 5;
export type Rank = 1 | 2 | 3;

export type RiteEffect =
  | { kind: 'cellStrength'; scope: 'target' | 'all' }
  | { kind: 'farmFood'; scope: 'target' | 'workers'; hours: number }
  | { kind: 'granaryFill' }
  | { kind: 'waits'; on: string };

export interface Rite {
  name: string;
  school: School;
  tier: Tier;
  values: readonly [number, number, number];
  text: string;
  effect: RiteEffect;
}

const W = (on: string): RiteEffect => ({ kind: 'waits', on });

export const RITES = {
  // The Ward — birch and salt.
  'salt-circle': { name: 'Salt Circle', school: 'ward', tier: 1, values: [60, 100, 160], text: 'A cell gains +{v} strength.', effect: { kind: 'cellStrength', scope: 'target' } },
  'birch-ward': { name: 'Birch Ward', school: 'ward', tier: 2, values: [1.5, 2, 2.5], text: 'Rival claims inside ring 1 cost ×{v}.', effect: W('rival claims (PROG-006)') },
  'elder-sign': { name: 'Elder Sign', school: 'ward', tier: 3, values: [1, 2, 3], text: 'Sealing a gate also lowers Doom by 1 and grants +{v} clues.', effect: W('gates (DOOM-002)') },
  'stone-sleep': { name: 'Stone Sleep', school: 'ward', tier: 3, values: [48, 72, 96], text: 'One building cannot be taken for {v} h.', effect: W('building capture (PROG-006)') },
  'watchers-calm': { name: 'Watcher’s Calm', school: 'ward', tier: 4, values: [3, 5, 8], text: 'Realm sanity +{v} for a day.', effect: W('sanity (PROG-008)') },
  'lamp-under-the-lake': { name: 'The Lamp Under the Lake', school: 'ward', tier: 5, values: [25, 40, 60], text: 'You deal +{v}% to the Ancient One.', effect: W('the Reckoning (DOOM-004)') },
  'unbroken-ring': { name: 'Unbroken Ring', school: 'ward', tier: 5, values: [30, 50, 80], text: 'Every cell you hold +{v} strength.', effect: { kind: 'cellStrength', scope: 'all' } },

  // The Tide — water and growth.
  'call-the-shoal': { name: 'Call the Shoal', school: 'tide', tier: 1, values: [4, 6, 9], text: 'A Farmstead gains +{v} food/h for 12 h.', effect: { kind: 'farmFood', scope: 'target', hours: 12 } },
  'brackish-blessing': { name: 'Brackish Blessing', school: 'tide', tier: 2, values: [1, 2, 3], text: 'Blessed cells give +{v} mana when walked.', effect: W('walk rewards') },
  'drowned-harvest': { name: 'Drowned Harvest', school: 'tide', tier: 3, values: [20, 30, 40], text: 'The granary fills +{v}% at once.', effect: { kind: 'granaryFill' } },
  undertow: { name: 'Undertow', school: 'tide', tier: 3, values: [10, 15, 20], text: 'Pull {v}% of a rival’s stored stock at a walked cell.', effect: W('rival stores') },
  'high-water': { name: 'High Water', school: 'tide', tier: 4, values: [1, 2, 3], text: 'Every Farmstead worker yields +{v} food for 24 h.', effect: { kind: 'farmFood', scope: 'workers', hours: 24 } },
  'the-tide-remembers': { name: 'The Tide Remembers', school: 'tide', tier: 5, values: [1, 2, 3], text: 'Restore a lost building at {v} levels below its old level.', effect: W('building loss records') },
  'second-lake': { name: 'Second Lake', school: 'tide', tier: 5, values: [12, 24, 36], text: 'Copy one masterwork’s effect for {v} h.', effect: W('masterworks (PROG-006)') },

  // The Whisper — dream and rumour.
  'dream-sight': { name: 'Dream-Sight', school: 'whisper', tier: 1, values: [2, 3, 4], text: 'Reveal every cell within {v} rings for 6 h.', effect: W('timed reveal') },
  'borrowed-voice': { name: 'Borrowed Voice', school: 'whisper', tier: 2, values: [1, 2, 3], text: 'Your next skill test rolls +{v} dice.', effect: W('skill tests (DOOM-002)') },
  'madness-seed': { name: 'Madness Seed', school: 'whisper', tier: 3, values: [30, 40, 50], text: 'A rival cell yields −{v}% for 12 h.', effect: W('rival yields') },
  'hollow-clue': { name: 'Hollow Clue', school: 'whisper', tier: 3, values: [1, 2, 3], text: 'Gain {v} clues at once.', effect: W('clues (DOOM-002)') },
  'unseen-hand': { name: 'Unseen Hand', school: 'whisper', tier: 4, values: [1, 2, 3], text: 'Complete a claim without walking, up to {v} cells away.', effect: W('remote claims') },
  'name-between-names': { name: 'The Name Between Names', school: 'whisper', tier: 5, values: [1, 2, 3], text: 'Cancel tomorrow’s Mythos card for your realm.', effect: W('the Mythos card (DOOM-001)') },
  'mirror-keep': { name: 'Mirror Keep', school: 'whisper', tier: 5, values: [0.5, 0.3, 0], text: 'Rivals see your strength ×{v} for 24 h.', effect: W('shared-world strength') },
} as const satisfies Record<string, Rite>;

export type RiteId = keyof typeof RITES;
export const RITE_IDS = Object.keys(RITES) as RiteId[];

/** Mana per cast, by tier (the document's price list). */
export const RITE_MANA: Readonly<Record<Tier, number>> = { 1: 20, 2: 30, 3: 45, 4: 60, 5: 90 };
/** Every rite rests a day between casts (the document gives 24 h for Call the Shoal). */
export const RITE_COOLDOWN_MS = 24 * 3_600_000;
/**
 * Learning and deepening are paid in mana too. The document names no price for either;
 * this is the ticket's default (twice the cast price to learn, the cast price × the new
 * rank to deepen), recorded in BRDC-PROG-007.
 */
export const learnCost = (id: RiteId): number => 2 * RITE_MANA[RITES[id].tier];
export const deepenCost = (id: RiteId, toRank: Rank): number => RITE_MANA[RITES[id].tier] * toRank;

export const riteText = (id: RiteId, rank: Rank): string =>
  RITES[id].text.replace('{v}', String(RITES[id].values[rank - 1]));

/** Schools a realm may dedicate: Kindling opens the first, Ley Reading the second. */
export function schoolSlots(lore: readonly LoreId[]): number {
  return (lore.includes('kindling') ? 1 : 0) + (lore.includes('ley-reading') ? 1 : 0);
}

/** The highest tier the Lore lets a school teach: I with Kindling, II with Ley Reading, then the Age. */
export function tierCeiling(lore: readonly LoreId[]): number {
  if (!lore.includes('kindling')) return 0;
  if (!lore.includes('ley-reading')) return 1;
  return Math.max(2, ageOf(lore));
}

export const rankCeiling = (age: Age): Rank => Math.min(age, 3) as Rank;

/** The rite sharing a choice tier with this one, if its tier is a choice (III and V). */
export function rivalRite(id: RiteId): RiteId | null {
  const { school, tier } = RITES[id];
  return RITE_IDS.find((o) => o !== id && RITES[o].school === school && RITES[o].tier === tier) ?? null;
}

export interface RiteBook {
  schools: School[];
  /** Learned rites and their rank. */
  learned: Partial<Record<RiteId, Rank>>;
  /** Last cast of each rite, for the cooldown. */
  castAt: Partial<Record<RiteId, number>>;
}

export const EMPTY_BOOK: RiteBook = { schools: [], learned: {}, castAt: {} };

export type RiteRefusal =
  | 'no-slot'
  | 'dedicated'
  | 'not-dedicated'
  | 'sealed'
  | 'closed'
  | 'learned'
  | 'not-learned'
  | 'max-rank'
  | 'cooling'
  | 'cannot-afford';

type Result = { ok: true; book: RiteBook; mana: number } | { ok: false; refused: RiteRefusal };

export function dedicate(book: RiteBook, school: School, lore: readonly LoreId[]): { ok: true; book: RiteBook } | { ok: false; refused: RiteRefusal } {
  if (book.schools.includes(school)) return { ok: false, refused: 'dedicated' };
  if (book.schools.length >= schoolSlots(lore)) return { ok: false, refused: 'no-slot' };
  return { ok: true, book: { ...book, schools: [...book.schools, school] } };
}

export function learnRite(book: RiteBook, id: RiteId, lore: readonly LoreId[], mana: number): Result {
  const r = RITES[id];
  if (!book.schools.includes(r.school)) return { ok: false, refused: 'not-dedicated' };
  if (book.learned[id]) return { ok: false, refused: 'learned' };
  if (r.tier > tierCeiling(lore)) return { ok: false, refused: 'sealed' };
  const other = rivalRite(id);
  if (other && book.learned[other]) return { ok: false, refused: 'closed' };
  const cost = learnCost(id);
  if (mana < cost) return { ok: false, refused: 'cannot-afford' };
  return { ok: true, book: { ...book, learned: { ...book.learned, [id]: 1 } }, mana: mana - cost };
}

export function deepenRite(book: RiteBook, id: RiteId, lore: readonly LoreId[], mana: number): Result {
  const rank = book.learned[id];
  if (!rank) return { ok: false, refused: 'not-learned' };
  if (rank >= rankCeiling(ageOf(lore))) return { ok: false, refused: 'max-rank' };
  const next = (rank + 1) as Rank;
  const cost = deepenCost(id, next);
  if (mana < cost) return { ok: false, refused: 'cannot-afford' };
  return { ok: true, book: { ...book, learned: { ...book.learned, [id]: next } }, mana: mana - cost };
}

export function castRite(book: RiteBook, id: RiteId, mana: number, now: number): Result & ({ ok: false } | { rank: Rank }) {
  const rank = book.learned[id];
  if (!rank) return { ok: false, refused: 'not-learned' };
  const last = book.castAt[id];
  if (last !== undefined && now - last < RITE_COOLDOWN_MS) return { ok: false, refused: 'cooling' };
  const cost = RITE_MANA[RITES[id].tier];
  if (mana < cost) return { ok: false, refused: 'cannot-afford' };
  return { ok: true, rank, book: { ...book, castAt: { ...book.castAt, [id]: now } }, mana: mana - cost };
}
