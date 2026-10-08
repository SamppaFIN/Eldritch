/**
 * The realm's character at each Age (BRDC-ERA-001) — Humankind's culture pick: entering a
 * new Lore Age, the realm chooses who it has become, and the chain of choices is its story
 * ("Merchants → Seers").
 *
 * One choice per Age entered (II–V), locked. Each pays a small realm bonus every hour,
 * through the yield model as its own line (YIELD-001). Wardens pay in stone and timber,
 * not strength: strength is not a yield, and the bonus is one.
 *
 * Pure.
 */
import { ageOf } from './lore.js';
import type { Age, LoreId } from './lore.js';
import type { ResourceKind, ResourcePool } from './terrain.js';

export type EraId = 'merchants' | 'wardens' | 'seers';

export interface EraDef {
  id: EraId;
  name: string;
  text: string;
  perHour: Partial<ResourcePool>;
}

export const ERAS: Readonly<Record<EraId, EraDef>> = {
  merchants: { id: 'merchants', name: 'Merchants', text: 'Coin finds its way to you.', perHour: { gold: 2 } },
  wardens: { id: 'wardens', name: 'Wardens', text: 'Walls and stores, raised early.', perHour: { stone: 1, wood: 1 } },
  seers: { id: 'seers', name: 'Seers', text: 'The lake tells you things.', perHour: { wisdom: 1, mana: 1 } },
};

export const ERA_IDS: readonly EraId[] = ['merchants', 'wardens', 'seers'];

/** The Age whose character is waiting to be chosen, or null — choices are made in order. */
export function pendingEra(learned: readonly LoreId[], chosen: readonly EraId[]): Age | null {
  const next = chosen.length + 2;
  return next <= ageOf(learned) ? (next as Age) : null;
}

/** Every character chosen, added up: the bonus the realm earns each hour. */
export function eraBonus(chosen: readonly EraId[]): Partial<ResourcePool> {
  const out: Partial<ResourcePool> = {};
  for (const id of chosen) for (const [k, v] of Object.entries(ERAS[id].perHour) as [ResourceKind, number][]) out[k] = (out[k] ?? 0) + v;
  return out;
}

/** The chain as the Hall keeps it: "Merchants → Seers". */
export const eraChain = (chosen: readonly EraId[]): string => chosen.map((id) => ERAS[id].name).join(' → ');
