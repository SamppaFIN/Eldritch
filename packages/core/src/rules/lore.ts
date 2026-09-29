/**
 * The Lore: five Ages, four paths (BRDC-PROG-004, Eldritch-Progression.pdf P2 and
 * "THE LORE · FULL MAP").
 *
 * Wisdom buys techs. Learning 3 of the 4 in an Age enters the next, and the Age you stand
 * in is the ceiling for every building tier and every spell rank (LAW II). Replaces
 * `tech.ts` for a Season 2 save; `tech.ts` stays for Season 1 until v0.7.0 retires it.
 *
 * The document maps Ages I–IV in full. Age V is named ("for the committed") but has no
 * techs yet — it is reached, and it is the ceiling, but there is nothing in it to study.
 */
import { BALANCE } from './balance.js';
import type { BuildingId } from '../types/domain.js';

export type LorePath = 'land' | 'craft' | 'faith' | 'sight';
export type Age = 1 | 2 | 3 | 4 | 5;
export type MasterworkId = 'fortress' | 'manor' | 'foundry' | 'exchange' | 'sunken-cathedral';

export type Unlock =
  | { kind: 'building'; id: BuildingId }
  | { kind: 'masterwork'; id: MasterworkId }
  | { kind: 'rule'; text: string };

export interface LoreTech {
  name: string;
  age: Age;
  path: LorePath;
  unlocks: readonly Unlock[];
  /** The line under the name on the full map. */
  lore: string;
}

export const LORE = {
  husbandry: { name: 'Husbandry', age: 1, path: 'land', unlocks: [{ kind: 'building', id: 'farm' }], lore: 'The first furrow was cut along a line someone else had already drawn.' },
  granaries: { name: 'Granaries', age: 2, path: 'land', unlocks: [{ kind: 'rule', text: 'Keep level 3 · housing +3' }], lore: 'Grain keeps longer in the dark. Some of the dark keeps longer too.' },
  'crop-rotation': { name: 'Crop Rotation', age: 3, path: 'land', unlocks: [{ kind: 'masterwork', id: 'manor' }], lore: 'Leave one field fallow each year. Do not ask what it is resting from.' },
  'salt-marsh-drains': { name: 'Salt-Marsh Drains', age: 4, path: 'land', unlocks: [{ kind: 'rule', text: 'Harvest reach +1 ring on every Farmstead' }], lore: 'The drained marsh gave up six coffins and a bell.' },

  woodcraft: { name: 'Woodcraft', age: 1, path: 'craft', unlocks: [{ kind: 'building', id: 'sawmill' }], lore: 'Birch splits clean. Rowan does not split at all.' },
  'stone-and-bellows': { name: 'Stone and Bellows', age: 2, path: 'craft', unlocks: [{ kind: 'building', id: 'quarry' }, { kind: 'building', id: 'forge' }], lore: 'Fire needs air, stone needs patience. The hill has both.' },
  'deep-survey': { name: 'Deep Survey', age: 3, path: 'craft', unlocks: [{ kind: 'masterwork', id: 'foundry' }], lore: 'The survey map has a ninth layer the surveyors did not draw.' },
  'black-mortar': { name: 'Black Mortar', age: 4, path: 'craft', unlocks: [{ kind: 'rule', text: 'All build costs −20%' }], lore: 'It sets in an hour and never stops setting.' },

  kindling: { name: 'Kindling', age: 1, path: 'faith', unlocks: [{ kind: 'rule', text: 'Dedicate a temple to a school · tier I spells' }], lore: 'Light the altar and the temple decides what it will teach.' },
  'ley-reading': { name: 'Ley Reading', age: 2, path: 'faith', unlocks: [{ kind: 'rule', text: 'Second temple school · tier II spells' }], lore: 'The lines run under the roads. The roads were laid on them.' },
  'elder-signs': { name: 'Elder Signs', age: 3, path: 'faith', unlocks: [{ kind: 'rule', text: 'Seal gates with 3 clues instead of 5' }], lore: 'A star with a burning eye. Scratch it anywhere and the door stays shut.' },
  'drowned-liturgy': { name: 'Drowned Liturgy', age: 4, path: 'faith', unlocks: [{ kind: 'masterwork', id: 'sunken-cathedral' }], lore: 'Sung underwater it has one more verse.' },

  lookouts: { name: 'Lookouts', age: 1, path: 'sight', unlocks: [{ kind: 'building', id: 'watchtower' }], lore: 'Count the boats. Count them again.' },
  'night-trade': { name: 'Night Trade', age: 2, path: 'sight', unlocks: [{ kind: 'building', id: 'market' }], lore: 'Coin in daylight, years after dark.' },
  'signal-fires': { name: 'Signal Fires', age: 3, path: 'sight', unlocks: [{ kind: 'masterwork', id: 'fortress' }], lore: 'Fire answers fire across the water. Once, something else answered.' },
  'the-pale-accord': { name: 'The Pale Accord', age: 4, path: 'sight', unlocks: [{ kind: 'masterwork', id: 'exchange' }], lore: 'Signed by the Order and by you. A third signature appears overnight.' },
} as const satisfies Record<string, LoreTech>;

export type LoreId = keyof typeof LORE;
export const LORE_IDS = Object.keys(LORE) as LoreId[];
export const AGE_NAMES: Readonly<Record<Age, string>> = { 1: 'Hearth', 2: 'Iron', 3: 'Coin', 4: 'Tides', 5: 'the Unwritten' };

/** Wisdom a tech of this Age costs. */
export const loreCost = (age: Age): number => BALANCE.ageCost[age - 1] ?? Infinity;

/** The Age a realm stands in: I, then one more for every Age with 3 of its 4 learned. */
export function ageOf(learned: readonly LoreId[]): Age {
  const set = new Set(learned);
  let age: Age = 1;
  while (age < 5) {
    const done = LORE_IDS.filter((id) => LORE[id].age === age && set.has(id)).length;
    if (done < BALANCE.ageAdvance) break;
    age = (age + 1) as Age;
  }
  return age;
}

export type StudyRefusal = 'learned' | 'sealed' | 'cannot-afford';

/** Can this be studied now — not learned, not beyond the Age, and paid for in wisdom? */
export function canStudy(id: LoreId, learned: readonly LoreId[], wisdom: number): { ok: true; cost: number } | { ok: false; refused: StudyRefusal } {
  if (learned.includes(id)) return { ok: false, refused: 'learned' };
  if (LORE[id].age > ageOf(learned)) return { ok: false, refused: 'sealed' };
  const cost = loreCost(LORE[id].age);
  if (wisdom < cost) return { ok: false, refused: 'cannot-afford' };
  return { ok: true, cost };
}

/** The Lore tech a building waits for, or null when no tech gates it. */
export function loreFor(building: BuildingId): LoreId | null {
  return LORE_IDS.find((id) => LORE[id].unlocks.some((u) => u.kind === 'building' && u.id === building)) ?? null;
}

/** Does the Lore let this building stand? Buildings no tech names are always allowed. */
export function loreAllows(building: BuildingId, learned: readonly LoreId[]): boolean {
  const gate = loreFor(building);
  return gate === null || learned.includes(gate);
}

/** Granaries lifts the Keep to level 3; each Age after that lifts it one more. */
export function keepCeiling(learned: readonly LoreId[]): number {
  if (!learned.includes('granaries')) return 2;
  return Math.max(3, ageOf(learned));
}
