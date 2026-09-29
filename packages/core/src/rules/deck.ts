/**
 * Encounter decks by terrain (BRDC-DOOM-003, Eldritch-Progression.pdf "Encounters").
 *
 * Walking a cell with a rumour draws from the deck for that ground — forest, lake,
 * settlement, hill. Each card is one test with a pass and a fail outcome. The rumours are
 * a hash of the season's seed and the hex, so a hex either has one or not, the same on
 * every phone; each can be faced once. Some settlement cards are the Drowned Man's quest
 * board: passing them raises a skill.
 *
 * Pure. The dice are `investigator.ts`'s; the store seam is `deckStore.ts`.
 */
import type { ResourcePool, TerrainKind } from './terrain.js';
import type { Skill } from './investigator.js';
import type { H3Index } from '../types/domain.js';

export type Deck = 'forest' | 'lake' | 'settlement' | 'hill';

export interface DeckCard {
  id: string;
  deck: Deck;
  title: string;
  text: string;
  skill: Skill;
  need: number;
  pass: { text: string; clues?: number; gain?: Partial<ResourcePool>; skillUp?: Skill };
  fail: { text: string; stamina?: number; sanity?: number };
}

const card = (deck: Deck, id: string, title: string, text: string, skill: Skill, need: number, pass: DeckCard['pass'], fail: DeckCard['fail']): DeckCard =>
  ({ id: `${deck}:${id}`, deck, title, text, skill, need, pass, fail });

export const DECKS: readonly DeckCard[] = [
  card('forest', 'birch-choir', 'The Birch Choir', 'The birches lean in the still air as if to hear something you have not said yet.', 'will', 1,
    { text: 'You say nothing. They straighten, satisfied, and a clue is carved in the bark.', clues: 1 }, { text: 'You answer. They remember it.', sanity: 1 }),
  card('forest', 'the-path-back', 'The Path Back', 'The trail you came in on is not behind you any more.', 'observe', 2,
    { text: 'You read the moss and walk out with an armful of good timber.', gain: { wood: 30 } }, { text: 'Hours later you find the road.', stamina: 2 }),
  card('forest', 'the-hunter', 'A Hunter With No Tracks', 'A man in old furs asks which way the lake lies.', 'lore', 1,
    { text: 'You know the old word for "lake". He smiles too widely and leaves a pouch of coin.', gain: { gold: 25 } }, { text: 'You point. He thanks you in your own voice.', sanity: 1 }),
  card('forest', 'wolf-circle', 'The Wolf Circle', 'Grey shapes keep pace with you between the trunks.', 'fight', 2,
    { text: 'You hold your ground. They fall back, and you find their kill: meat for the Keep.', gain: { food: 40 } }, { text: 'You run. They let you.', stamina: 2 }),
  card('forest', 'mushroom-ring', 'The Mushroom Ring', 'A perfect ring of pale caps. The grass inside is dry in the rain.', 'lore', 2,
    { text: 'You step around it, not across. Two clues lie at its edge.', clues: 2 }, { text: 'You step in. You step out an hour later.', sanity: 2 }),
  card('forest', 'charcoal-burner', 'The Charcoal Burner', 'A kiln smokes in a clearing. Nobody tends it.', 'observe', 1,
    { text: 'The charcoal is good, and nobody comes for it.', gain: { iron: 15 } }, { text: 'Somebody does come for it.', stamina: 1 }),

  card('lake', 'the-water-stands', 'The Water Stands Upright', 'At the shore the lake has lifted into a wall of still water.', 'lore', 2,
    { text: 'You read the name it is reading, and it lies back down. A clue floats ashore.', clues: 1 }, { text: 'It reads you instead.', sanity: 2 }),
  card('lake', 'drowned-bell', 'The Drowned Bell', 'Under the ice, slow and far down, a bell is ringing.', 'will', 2,
    { text: 'You stop your ears and count. The count is a clue.', clues: 1 }, { text: 'You listen to the end.', sanity: 2 }),
  card('lake', 'the-catch', 'The Catch', 'Your line comes up heavy, and the fish on it has an old, patient face.', 'fight', 1,
    { text: 'It does not struggle. It is very good to eat.', gain: { food: 50 } }, { text: 'It struggles.', stamina: 1 }),
  card('lake', 'ferryman', 'The Ferryman', 'A flat boat waits at a jetty that was not there yesterday.', 'observe', 2,
    { text: 'You see the coins on his eyes and leave your own. He leaves you mana.', gain: { mana: 20 } }, { text: 'You ride. You come back.', sanity: 1, stamina: 1 }),
  card('lake', 'reed-voices', 'Reed Voices', 'The reeds whisper the names of the people who drowned here.', 'lore', 1,
    { text: 'One of the names is useful.', clues: 1 }, { text: 'One of the names is yours.', sanity: 1 }),
  card('lake', 'ice-crossing', 'The Ice Crossing', 'The short way home is across the ice.', 'observe', 1,
    { text: 'You pick the dark ice. It holds.', gain: { culture: 10 } }, { text: 'You pick the white ice.', stamina: 2 }),

  card('settlement', 'drowned-man-board', 'The Drowned Man’s Board', 'A notice on the tavern board asks for someone who reads the old script.', 'lore', 2,
    { text: 'You read it aloud. The regulars teach you more.', skillUp: 'lore' }, { text: 'You read it aloud. The regulars go quiet.', sanity: 1 }),
  card('settlement', 'arm-wrestle', 'An Arm-Wrestle', 'A fisherman bets you cannot put his arm down.', 'fight', 2,
    { text: 'You put it down. He teaches you a better grip.', skillUp: 'fight' }, { text: 'He puts yours down.', stamina: 1 }),
  card('settlement', 'night-watch', 'The Night Watch', 'The watchman needs a second pair of eyes tonight.', 'observe', 2,
    { text: 'You see the thing first. He shows you how to look.', skillUp: 'observe' }, { text: 'It sees you first.', sanity: 2 }),
  card('settlement', 'the-sermon', 'A Sermon in the Square', 'A preacher speaks of the water rising.', 'will', 2,
    { text: 'You do not flinch. The crowd remembers you for it.', skillUp: 'will' }, { text: 'You flinch.', sanity: 1 }),
  card('settlement', 'market-rumour', 'A Market Rumour', 'Two traders stop talking when you come near.', 'observe', 1,
    { text: 'You catch the end of it. It is a clue, and a price.', clues: 1, gain: { gold: 15 } }, { text: 'They start talking about you.', sanity: 1 }),
  card('settlement', 'the-lost-child', 'The Lost Child', 'A child asks you to walk them home. They do not say where home is.', 'will', 1,
    { text: 'You walk them to the church. The family gives what they have.', gain: { food: 20, culture: 10 } }, { text: 'You walk them to the lake.', sanity: 2 }),

  card('hill', 'standing-stone', 'The Standing Stone', 'A stone on the ridge, warm in the wind.', 'lore', 1,
    { text: 'The carving on its lee side is a clue.', clues: 1 }, { text: 'The carving on its lee side is a face.', sanity: 1 }),
  card('hill', 'rockfall', 'Rockfall', 'Stones come down the slope, faster than stones should.', 'observe', 2,
    { text: 'You step aside, and the fall leaves good stone behind.', gain: { stone: 40 } }, { text: 'You do not step aside.', stamina: 2 }),
  card('hill', 'the-signal-fire', 'The Signal Fire', 'Someone lit the old beacon. Across the lake, something answers.', 'will', 2,
    { text: 'You put it out before the answer arrives.', clues: 2 }, { text: 'The answer arrives.', sanity: 2 }),
  card('hill', 'the-hermit', 'The Hermit', 'An old woman in a turf hut offers you tea.', 'lore', 1,
    { text: 'You drink it and listen. Wisdom, and a warning.', gain: { wisdom: 20 } }, { text: 'You drink it.', stamina: 1 }),
  card('hill', 'the-quarry-dark', 'The Dark in the Quarry', 'The old quarry face has a door in it now.', 'fight', 2,
    { text: 'You hold the door shut until the knocking stops. Iron in the rubble.', gain: { iron: 25 } }, { text: 'It opens.', sanity: 2, stamina: 1 }),
  card('hill', 'lookout', 'The Lookout', 'From the top you can see the whole lake, and a boat that has no oars.', 'observe', 1,
    { text: 'You watch where it lands. That is a clue.', clues: 1 }, { text: 'It watches where you stand.', sanity: 1 }),
];

/** The deck a ground draws from; ground none is fitted to shows no rumours. */
export function deckFor(kind: TerrainKind): Deck | null {
  if (kind === 'forest' || kind === 'marsh') return 'forest';
  if (kind === 'lake' || kind === 'coast') return 'lake';
  if (kind === 'settlement' || kind === 'market' || kind === 'plain') return 'settlement';
  if (kind === 'hill' || kind === 'mountain') return 'hill';
  return null;
}

/** One hex in eight holds a rumour. */
export const RUMOUR_SHARE = 0.125;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** The card waiting on a hex this season, or null. */
export function rumourAt(seed: string, h3: H3Index, kind: TerrainKind): DeckCard | null {
  const deck = deckFor(kind);
  if (!deck || hash(`${seed}:rumour:${h3}`) >= RUMOUR_SHARE) return null;
  const cards = DECKS.filter((c) => c.deck === deck);
  return cards[Math.floor(hash(`${seed}:card:${h3}`) * cards.length)] ?? null;
}

export const cardById = (id: string): DeckCard | null => DECKS.find((c) => c.id === id) ?? null;
