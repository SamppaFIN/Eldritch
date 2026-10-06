/**
 * Allies (BRDC-ALLY-001) — Arkham Horror's allies in this game's people: the hermit, the
 * troll and the merchant from the Tavern's board stop being text and walk with you.
 *
 * One at a time. An ally comes from finishing their task; a second one is offered, and the
 * player chooses whether to swap. Kept on the investigator, so it is a Season 2 thing
 * like the investigator, and it goes with the season.
 *
 * Pure. The dice are `diceFor`'s, the price is `priceFor`'s.
 */
import type { Skill } from './investigator.js';

export type AllyId = 'cornelius' | 'grug' | 'merchant';

export interface Ally {
  id: AllyId;
  name: string;
  /** What they bring, as the Keep says it. */
  gift: string;
  /** One more die on tests of this skill. */
  skill?: Skill;
  /** Off every Work's price. */
  discount?: number;
}

export const ALLIES: Readonly<Record<AllyId, Ally>> = {
  cornelius: { id: 'cornelius', name: 'Cornelius, the hermit', gift: '+1 die on Lore tests', skill: 'lore' },
  grug: { id: 'grug', name: 'Grug, of the bridge', gift: '+1 die on Vigor tests', skill: 'fight' },
  merchant: { id: 'merchant', name: 'The Wandering Merchant', gift: 'Works cost 10 % less', discount: 0.1 },
};

export const allyOf = (id: AllyId | undefined): Ally | null => (id ? ALLIES[id] ?? null : null);

/** The die an ally adds to a test of this skill. */
export const allyDice = (id: AllyId | undefined, skill: Skill): number => (allyOf(id)?.skill === skill ? 1 : 0);

/** The share an ally takes off a Work's price. */
export const allyDiscount = (id: AllyId | undefined): number => allyOf(id)?.discount ?? 0;
