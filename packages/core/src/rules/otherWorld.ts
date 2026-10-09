/**
 * Through the gates: the Other World (BRDC-OTHERWORLD-001) — Arkham Horror's other worlds,
 * which are the part everyone remembers. Standing on an open gate, the investigator may
 * step through instead of facing it from outside. Each gate opens on one of three worlds;
 * a journey is two of that world's encounters, faced one at a time on the same dice.
 *
 * Both passed: the gate is closed from the inside and the journey pays. One failed: the
 * investigator is thrown back with a condition, and the gate stays open.
 *
 * Pure. The journey in progress is kept by `otherWorldStore.ts`.
 */
import type { Skill } from './investigator.js';
import type { ConditionId } from './condition.js';
import type { ResourcePool } from './terrain.js';

export type WorldId = 'dreamlands' | 'far-lake' | 'outer-air';

export interface WorldCard {
  id: string;
  title: string;
  text: string;
  skill: Skill;
  need: number;
  pass: { text: string; clues?: number; gain?: Partial<ResourcePool> };
  fail: { text: string; sanity: number; condition: ConditionId };
}

export interface World {
  id: WorldId;
  name: string;
  /** What the gate shows of it, before you step through. */
  glimpse: string;
  cards: readonly [WorldCard, WorldCard, WorldCard];
}

export const WORLDS: Readonly<Record<WorldId, World>> = {
  dreamlands: {
    id: 'dreamlands', name: 'The Dreamlands', glimpse: 'Through the gate, seventy steps of light slumber lead down into a city of onyx.',
    cards: [
      { id: 'dl-cats', title: 'The Cats of Ulthar', text: 'A council of cats sits in judgement on the steps. They have heard about you.', skill: 'will', need: 2,
        pass: { text: 'You meet every eye and do not blink first. They let you pass, and one follows you a while.', clues: 1 }, fail: { text: 'You blink. The council votes. You wake on the steps of your own Keep, scratched.', sanity: 1, condition: 'paranoia' } },
      { id: 'dl-market', title: 'The Onyx Market', text: 'Merchants sell sleep by the ounce and dreams by the yard. One offers you a bargain.', skill: 'observe', need: 2,
        pass: { text: 'You read the small print in his eyes and buy only what you came for.', gain: { gold: 30 } }, fail: { text: 'You buy the bargain. It is a debt, and it follows you home.', sanity: 1, condition: 'debt' } },
      { id: 'dl-moon', title: 'The Moon-Ladder', text: 'A ladder of moonlight climbs from the harbour. Something on the moon is waving.', skill: 'lore', need: 2,
        pass: { text: 'You know the old name for the moon and say it. The waving stops, politely.', clues: 1, gain: { wisdom: 20 } }, fail: { text: 'You wave back.', sanity: 2, condition: 'cursed' } },
    ],
  },
  'far-lake': {
    id: 'far-lake', name: 'Far Pyhäjärvi', glimpse: 'Through the gate is the lake you know, under a sky with no sun, and the water is above you.',
    cards: [
      { id: 'fl-drowned-town', title: 'The Drowned Town', text: 'Tampere, upside down, every window lit, every street a river. The people walk on the ceiling.', skill: 'observe', need: 2,
        pass: { text: 'You find your own street, and your own door, and do not open it. Fish in the gutter.', gain: { food: 40 } }, fail: { text: 'You open the door. Someone is already home.', sanity: 2, condition: 'paranoia' } },
      { id: 'fl-chain', title: 'The Anchor Chain', text: 'A chain rises from the deep to the surface far above. Something heavy is climbing it.', skill: 'fight', need: 2,
        pass: { text: 'You knock the climber loose with a stone. It falls a very long way.', clues: 1, gain: { mana: 20 } }, fail: { text: 'It reaches you first.', sanity: 1, condition: 'cursed' } },
      { id: 'fl-choir', title: 'The Choir at Home', text: 'Here the Drowned Choir is not drowned. They are rehearsing, and one chair is empty.', skill: 'will', need: 2,
        pass: { text: 'You do not sit. They sing you out, and the gate behind you groans.', clues: 2 }, fail: { text: 'You sit, for one verse.', sanity: 2, condition: 'dark-pact' } },
    ],
  },
  'outer-air': {
    id: 'outer-air', name: 'The Outer Air', glimpse: 'Through the gate is only sky, all the way down, and wind that tastes of propeller oil.',
    cards: [
      { id: 'oa-wind', title: 'The Wind Between', text: 'There is no ground. The wind holds you up as long as it is interested.', skill: 'will', need: 2,
        pass: { text: 'You keep it interested: a story, then another. It sets you down gently, and gives you its mana.', gain: { mana: 30 } }, fail: { text: 'It loses interest.', sanity: 2, condition: 'amnesia' } },
      { id: 'oa-pilot', title: 'The Pilot Who Never Landed', text: 'A biplane circles you. The pilot wears a coat from before the war, and his shadow leans toward a lake far below.', skill: 'lore', need: 2,
        pass: { text: 'You call him by the name you learned in the Keep. He banks away, and drops a map.', clues: 2 }, fail: { text: 'He offers you a ride.', sanity: 1, condition: 'paranoia' } },
      { id: 'oa-star', title: 'The Star That Answered', text: 'A star close enough to touch hums the note the signal fire made on the hill.', skill: 'observe', need: 2,
        pass: { text: 'You see it is a lamp, and who holds it, and look away in time.', gain: { culture: 30 } }, fail: { text: 'You do not look away in time.', sanity: 2, condition: 'cursed' } },
    ],
  },
};

export const WORLD_IDS: readonly WorldId[] = ['dreamlands', 'far-lake', 'outer-air'];
export const JOURNEY_STAGES = 2;
/** Clues for closing a gate from the inside, beside what the encounters gave. */
export const CLOSED_FROM_INSIDE_CLUES = 2;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return h >>> 0;
}

/** The world a gate opens on — the same for everyone who steps through it. */
export const worldOf = (gateId: string): WorldId => WORLD_IDS[hash(`world:${gateId}`) % WORLD_IDS.length] as WorldId;

/** The two encounters a journey through this gate meets, in order. */
export function journeyCards(gateId: string): readonly [WorldCard, WorldCard] {
  const cards = WORLDS[worldOf(gateId)].cards;
  const first = hash(`journey:${gateId}`) % 3;
  const second = (first + 1 + (hash(`journey2:${gateId}`) % 2)) % 3;
  return [cards[first] as WorldCard, cards[second] as WorldCard];
}
