/**
 * The stranger in many masks (BRDC-MASKS-001) — Nyarlathotep, who wears a face for every
 * town: six rumour cards are one stranger in six guises, and every one of them has the
 * same tell — his shadow leans toward the lake, whatever the sun says. Meet three and the
 * Keep lets you name him; a wrong name costs sanity, the right one a choice.
 *
 * The cards ride the rumour decks (`deck.ts` deals them on about one rumour in five,
 * hashed apart, so the rest of a season's rumours stay where they were).
 *
 * Pure.
 */
import type { DeckCard } from './deck.js';

/** The tell every mask shares. */
export const MASK_TELL = 'shadow leans toward the lake';

export const MASK_CARDS: readonly DeckCard[] = [
  {
    id: 'forest:mask-woodcutter', deck: 'forest', mask: 'the woodcutter', title: 'A Woodcutter With a New Axe',
    text: 'He asks the way out of the wood he says he was born in. His shadow leans toward the lake, against the sun.', skill: 'observe', need: 1,
    pass: { text: 'You point him the long way round. He laughs as if you had told a good joke, and leaves a clue in the sawdust.', clues: 1 },
    fail: { text: 'You point him the short way. He thanks you by name. You never gave it.', sanity: 1 },
  },
  {
    id: 'lake:mask-fisherman', deck: 'lake', mask: 'the fisherman', title: 'The Net With No Holes',
    text: 'A fisherman mends a net that has no holes in it. His shadow leans toward the lake, though the sun is over the water.', skill: 'lore', need: 1,
    pass: { text: 'You name the knot he is tying. It is very old. He gives you the catch.', gain: { food: 30 } },
    fail: { text: 'He asks you to hold the net. You hold it for an hour you do not remember.', sanity: 1 },
  },
  {
    id: 'settlement:mask-preacher', deck: 'settlement', mask: 'the preacher', title: 'The Preacher on the Crate',
    text: 'He promises a light older than the sun. The crowd leans in; his shadow leans toward the lake.', skill: 'will', need: 2,
    pass: { text: 'You walk away mid-sentence. He stops, and watches you go, and smiles.', clues: 1 },
    fail: { text: 'You stay for the end. You will hear it again tonight.', sanity: 2 },
  },
  {
    id: 'settlement:mask-pilot', deck: 'settlement', mask: 'the pilot', title: 'The Pilot in the Old Coat',
    text: 'A pilot in a flying coat from before the war asks if the airfield is still there. His shadow leans toward the lake.', skill: 'observe', need: 1,
    pass: { text: 'You notice the coat is dry in the rain. He notices you noticing, and pays you for silence.', gain: { gold: 25 } },
    fail: { text: 'You tell him how to get to the airfield. Somewhere a propeller starts.', sanity: 1 },
  },
  {
    id: 'hill:mask-surveyor', deck: 'hill', mask: 'the surveyor', title: 'The Surveyor Measuring Nothing',
    text: 'A brass theodolite on the ridge, pointed at empty sky. Its keeper’s shadow leans toward the lake, uphill.', skill: 'lore', need: 2,
    pass: { text: 'You read the number on his scale. It is how far away something is. He writes you into his ledger as “promising”.', clues: 2 },
    fail: { text: 'You look through the lens.', sanity: 2 },
  },
  {
    id: 'lake:mask-swimmer', deck: 'lake', mask: 'the swimmer', title: 'The Dry Swimmer',
    text: 'A swimmer walks out of the cold lake perfectly dry. Her shadow leans toward the lake, as if it would rather go back.', skill: 'will', need: 1,
    pass: { text: 'You do not offer her your towel. She seems almost pleased, and leaves mana on the stones.', gain: { mana: 20 } },
    fail: { text: 'You offer her your towel. She keeps it.', sanity: 1 },
  },
];

/** Meet this many masks and the Keep lets you name him. */
export const MASKS_TO_NAME = 3;
export const WRONG_NAME_SANITY = 2;

export type StrangerName = 'nyarlathotep' | 'the-ferryman' | 'the-drowned-man';
export const STRANGER_NAMES: readonly { id: StrangerName; name: string }[] = [
  { id: 'the-ferryman', name: 'The Ferryman of the Fuming Lake' },
  { id: 'nyarlathotep', name: 'Nyarlathotep, the Crawling Chaos' },
  { id: 'the-drowned-man', name: 'The Drowned Man of the tavern sign' },
];
export const TRUE_NAME: StrangerName = 'nyarlathotep';

export type StrangerChoice = 'bargain' | 'banish';
export const STRANGER_CHOICES: Readonly<Record<StrangerChoice, { name: string; text: string }>> = {
  bargain: { name: 'Bargain with him', text: 'Three clues now — and a Dark Pact that will ask for something back.' },
  banish: { name: 'Banish him', text: 'A hundred mana, and your mind is your own again: sanity in full.' },
};

export const isMask = (cardId: string): boolean => MASK_CARDS.some((c) => c.id === cardId);
