/**
 * What a wonder can do (BRDC-SEASON-008).
 *
 * Infinite 2026-09-29: *"world wonderit jäävät kartalle ja niilläkin on erikoistoimintoja"*
 * — and, of the proposals, one action per wonder, themed, each once a day for whoever holds
 * its hex. Wonders stand where they stand every season (`wonderPlace.ts` hashes without the
 * season's salt); only who holds them changes. Every action rides a mechanic that exists.
 */
import type { WonderId } from './wonder.js';

export type WonderActKind =
  | { kind: 'sealFromAfar' }
  | { kind: 'calm'; sanity: number; hours: number }
  | { kind: 'clues'; n: number }
  | { kind: 'granary'; pct: number }
  | { kind: 'reveal'; rings: number }
  | { kind: 'loreRefund' }
  | { kind: 'gain'; resource: 'mana' | 'food'; n: number }
  | { kind: 'skill'; skill: 'fight' | 'lore' }
  | { kind: 'restore' }
  | { kind: 'freeRite' };

export interface WonderAct {
  name: string;
  text: string;
  act: WonderActKind;
}

export const WONDER_ACTS: Readonly<Partial<Record<WonderId, WonderAct>>> = {
  rlyeh: { name: 'Sink the Door', text: 'The nearest open gate is sealed from afar.', act: { kind: 'sealFromAfar' } },
  'the-temple': { name: 'Stillness', text: 'Realm sanity +3 for a day.', act: { kind: 'calm', sanity: 3, hours: 24 } },
  'nameless-city': { name: 'Read the Walls', text: 'Gain 2 clues.', act: { kind: 'clues', n: 2 } },
  hyperborea: { name: 'The Long Summer', text: 'The Keep’s granary fills by a quarter.', act: { kind: 'granary', pct: 25 } },
  kadath: { name: 'The Onyx View', text: 'Every hex within 3 rings is revealed.', act: { kind: 'reveal', rings: 3 } },
  leng: { name: 'The Plateau’s Price', text: 'Wisdom enough for one tech of your Age.', act: { kind: 'loreRefund' } },
  'yha-nthlei': { name: 'Tithe of the Deep', text: 'Gain 40 mana.', act: { kind: 'gain', resource: 'mana', n: 40 } },
  'mountains-of-madness': { name: 'Climb', text: 'Your Fight skill rises by one (to 5).', act: { kind: 'skill', skill: 'fight' } },
  arkham: { name: 'The Library', text: 'Your Lore skill rises by one (to 5).', act: { kind: 'skill', skill: 'lore' } },
  'dreamlands-gate': { name: 'Deeper Slumber', text: 'Stamina and sanity return in full.', act: { kind: 'restore' } },
  innsmouth: { name: 'The Catch', text: 'Gain 60 food.', act: { kind: 'gain', resource: 'food', n: 60 } },
  'dunwich-stones': { name: 'The Stones Answer', text: 'A rite against the Ancient One, at no cost — in the Reckoning.', act: { kind: 'freeRite' } },
};

export const WONDER_ACT_COOLDOWN_MS = 24 * 3_600_000;
