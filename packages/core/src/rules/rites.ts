/**
 * What the temples teach: three schools (BRDC-PROG-007, Eldritch-Progression.pdf P4 and
 * "TEMPLES · THREE SCHOOLS").
 *
 * A realm dedicates a school (Kindling opens one, Ley Reading a second). Each school has
 * five tiers — III and V a choice of two — and each learned rite deepens through ranks
 * I → III; the numbers are the rank values. The Age is the ceiling for the tier and caps
 * the rank at min(Age, 3). Replaces `spell.ts` for a Season 2 save.
 *
 * Every rite acts on the caster's own realm — factions are parked (Infinite 2026-09-29).
 * The ones the document aims at rivals or at things a phone cannot see (rival claims and
 * stores, the Mythos card, shared-world strength) keep their names and take a local effect
 * instead (Infinite 2026-09-30: none may say "not yet in the game").
 */
import { ageOf } from './lore.js';
import type { Age, LoreId } from './lore.js';

export type School = 'ward' | 'tide' | 'whisper';
export type Tier = 1 | 2 | 3 | 4 | 5;
export type Rank = 1 | 2 | 3;

export type RiteEffect =
  | { kind: 'cellStrength'; scope: 'target' | 'ring' | 'all' }
  | { kind: 'cellFloor' }
  | { kind: 'farmFood'; scope: 'target' | 'workers'; hours: number }
  | { kind: 'granaryFill' }
  | { kind: 'calm'; hours: number }
  /** Nothing at the cast: the Reckoning reads the cast time while it burns (`reckoningStore`). */
  | { kind: 'lamp' }
  | { kind: 'walkedMana' }
  | { kind: 'pouchShare' }
  | { kind: 'restore' }
  | { kind: 'yieldBoon'; hours: number }
  | { kind: 'reveal' }
  | { kind: 'dice'; hours: number }
  | { kind: 'blessed' }
  | { kind: 'clues' }
  | { kind: 'claimNear' }
  /** Seal gates from afar: one and `v` clues, or `v` gates. */
  | { kind: 'seal'; per: 'clues' | 'gates' }
  /** Read by the gate sync while it lasts (`gateStore`). */
  | { kind: 'gateShield' };

export interface Rite {
  name: string;
  school: School;
  tier: Tier;
  values: readonly [number, number, number];
  text: string;
  effect: RiteEffect;
}

export const RITES = {
  // The Ward — birch and salt.
  'salt-circle': { name: 'Salt Circle', school: 'ward', tier: 1, values: [60, 100, 160], text: 'A cell gains +{v} strength.', effect: { kind: 'cellStrength', scope: 'target' } },
  'birch-ward': { name: 'Birch Ward', school: 'ward', tier: 2, values: [30, 50, 80], text: 'A cell and the six around it gain +{v} strength.', effect: { kind: 'cellStrength', scope: 'ring' } },
  'elder-sign': { name: 'Elder Sign', school: 'ward', tier: 3, values: [1, 2, 3], text: 'The nearest open gate is sealed from afar, and you gain {v} clues.', effect: { kind: 'seal', per: 'clues' } },
  'stone-sleep': { name: 'Stone Sleep', school: 'ward', tier: 3, values: [200, 350, 500], text: 'A cell’s strength rises to {v}, if it is lower.', effect: { kind: 'cellFloor' } },
  'watchers-calm': { name: 'Watcher’s Calm', school: 'ward', tier: 4, values: [3, 5, 8], text: 'Realm sanity +{v} for a day.', effect: { kind: 'calm', hours: 24 } },
  'lamp-under-the-lake': { name: 'The Lamp Under the Lake', school: 'ward', tier: 5, values: [25, 40, 60], text: 'You deal +{v}% to the Ancient One for a day.', effect: { kind: 'lamp' } },
  'unbroken-ring': { name: 'Unbroken Ring', school: 'ward', tier: 5, values: [30, 50, 80], text: 'Every cell you hold +{v} strength.', effect: { kind: 'cellStrength', scope: 'all' } },

  // The Tide — water and growth.
  'call-the-shoal': { name: 'Call the Shoal', school: 'tide', tier: 1, values: [4, 6, 9], text: 'A Farmstead gains +{v} food/h for 12 h.', effect: { kind: 'farmFood', scope: 'target', hours: 12 } },
  'brackish-blessing': { name: 'Brackish Blessing', school: 'tide', tier: 2, values: [1, 2, 3], text: '+{v} mana for every cell of yours walked in the last day.', effect: { kind: 'walkedMana' } },
  'drowned-harvest': { name: 'Drowned Harvest', school: 'tide', tier: 3, values: [20, 30, 40], text: 'The granary fills +{v}% at once.', effect: { kind: 'granaryFill' } },
  undertow: { name: 'Undertow', school: 'tide', tier: 3, values: [10, 15, 20], text: 'The tide brings {v}% more of every stock in the pouch, mana aside.', effect: { kind: 'pouchShare' } },
  'high-water': { name: 'High Water', school: 'tide', tier: 4, values: [1, 2, 3], text: 'Every Farmstead worker yields +{v} food for 24 h.', effect: { kind: 'farmFood', scope: 'workers', hours: 24 } },
  'the-tide-remembers': { name: 'The Tide Remembers', school: 'tide', tier: 5, values: [1, 2, 3], text: 'Your investigator rises rested and sane, with {v} clues more.', effect: { kind: 'restore' } },
  'second-lake': { name: 'Second Lake', school: 'tide', tier: 5, values: [25, 40, 60], text: 'Every staffed building yields +{v}% for 12 h.', effect: { kind: 'yieldBoon', hours: 12 } },

  // The Whisper — dream and rumour.
  'dream-sight': { name: 'Dream-Sight', school: 'whisper', tier: 1, values: [3, 5, 8], text: 'Reveal every cell within {v} rings of a hex.', effect: { kind: 'reveal' } },
  'borrowed-voice': { name: 'Borrowed Voice', school: 'whisper', tier: 2, values: [1, 2, 3], text: 'Every test rolls +{v} dice for 12 h.', effect: { kind: 'dice', hours: 12 } },
  'madness-seed': { name: 'Madness Seed', school: 'whisper', tier: 3, values: [6, 12, 24], text: 'For {v} h every test is blessed — a 4 succeeds too.', effect: { kind: 'blessed' } },
  'hollow-clue': { name: 'Hollow Clue', school: 'whisper', tier: 3, values: [1, 2, 3], text: 'Gain {v} clues at once.', effect: { kind: 'clues' } },
  'unseen-hand': { name: 'Unseen Hand', school: 'whisper', tier: 4, values: [3, 5, 8], text: 'Claim up to {v} free hexes beside your ground without walking.', effect: { kind: 'claimNear' } },
  'name-between-names': { name: 'The Name Between Names', school: 'whisper', tier: 5, values: [1, 2, 3], text: 'Up to {v} of the nearest open gates are sealed from afar.', effect: { kind: 'seal', per: 'gates' } },
  'mirror-keep': { name: 'Mirror Keep', school: 'whisper', tier: 5, values: [24, 48, 72], text: 'No new gate opens on your realm for {v} h.', effect: { kind: 'gateShield' } },
} as const satisfies Record<string, Rite>;

export type RiteId = keyof typeof RITES;
export const RITE_IDS = Object.keys(RITES) as RiteId[];

/** A rite that lands on one of your hexes — cast from the hex card, not the Keep. */
export function castsOnHex(id: RiteId): boolean {
  const e: RiteEffect = RITES[id].effect;
  return e.kind === 'cellFloor' || e.kind === 'reveal' || ('scope' in e && (e.scope === 'target' || e.scope === 'ring'));
}

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
