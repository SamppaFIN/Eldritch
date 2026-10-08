/**
 * The Dreamlands overnight (BRDC-DREAM-001) — the one mechanic that rewards sleeping.
 *
 * Open the app in the morning (05–11, local) where you were last seen, six hours or more
 * after that last reading, and a dream is drawn from its own eight-card deck. It is faced
 * like any test, on Will, with the same dice: a pass leaves a clue or something useful,
 * a fail costs sanity. One dream a day, and no tracking in the background — the two
 * readings either side of the night are all it needs.
 *
 * Pure.
 */
import { hexDistance } from '../geo/cells.js';
import type { DwellReading } from './dwell.js';
import type { ResourcePool } from './terrain.js';

export const DREAM_REST_MS = 6 * 3_600_000;
export const DREAM_FROM_HOUR = 5;
export const DREAM_UNTIL_HOUR = 11;
/** Within two rings is "where you were": GPS wanders a little overnight. */
export const DREAM_STILL_RINGS = 2;
export const DREAM_NEED = 1;

export interface DreamCard {
  id: string;
  title: string;
  text: string;
  pass: { text: string; clues?: number; gain?: Partial<ResourcePool> };
  fail: { text: string; sanity: number };
}

export const DREAMS: readonly DreamCard[] = [
  { id: 'seventy-steps', title: 'The Seventy Steps', text: 'You go down the seventy steps of light slumber. At the bottom two priests wait, and one of them has your face.',
    pass: { text: 'You do not answer to your own name. They let you pass, and you wake with a clue.', clues: 1 }, fail: { text: 'You answer. You wake tired in a way sleep does not fix.', sanity: 1 } },
  { id: 'sunken-market', title: 'The Sunken Market', text: 'A market under the lake, lit by fish. A trader offers coin for a memory you will not miss.',
    pass: { text: 'You sell the right one. Your pockets are heavy when you wake.', gain: { gold: 30 } }, fail: { text: 'You sell the wrong one. Something is missing all morning.', sanity: 1 } },
  { id: 'birch-library', title: 'The Birch Library', text: 'Every tree in the wood is a book, and the wind is turning the pages.',
    pass: { text: 'You read one page to the end before you wake. Wisdom stays with you.', gain: { wisdom: 25 } }, fail: { text: 'The pages turn faster than you can read, and do not stop when you wake.', sanity: 2 } },
  { id: 'chimney-smoke', title: 'Smoke From the Chimneys', text: 'The mill chimneys breathe out a slow shape that is looking for someone.',
    pass: { text: 'It does not find you. You remember its way of moving: a clue.', clues: 1 }, fail: { text: 'It finds you, and is pleased.', sanity: 2 } },
  { id: 'the-harvest-table', title: 'The Harvest Table', text: 'A long table under the stars, laid for everyone you have lost.',
    pass: { text: 'You eat what is offered and leave nothing on the plate. The Keep wakes fed.', gain: { food: 40 } }, fail: { text: 'You count the chairs. There is one more than there should be.', sanity: 1 } },
  { id: 'propeller-boy', title: 'The Propeller Boy', text: 'The boy from the statue runs ahead of you across the airfield, the propeller spinning without wind.',
    pass: { text: 'You keep up. He shows you where the sky is thin: two clues.', clues: 2 }, fail: { text: 'You fall behind and the field goes on forever.', sanity: 1 } },
  { id: 'ley-loom', title: 'The Ley Loom', text: 'Somebody is weaving the ley-lines on a loom the size of the town. They let you hold the shuttle.',
    pass: { text: 'You weave one thread straight. Mana runs in your hands all morning.', gain: { mana: 25 } }, fail: { text: 'You drop the shuttle. Something unravels that you cannot name.', sanity: 2 } },
  { id: 'the-other-keep', title: 'The Other Keep', text: 'Your Keep, but older, and lit from inside by a fire nobody built.',
    pass: { text: 'You walk its halls without waking it. Stone is waiting in yours when you wake.', gain: { stone: 30 } }, fail: { text: 'It wakes. It knows the way to the real one.', sanity: 1 } },
];

/** Did the walker sleep where they were last seen — six hours still, opened in the morning? */
export function dreamt(previous: DwellReading | null, next: DwellReading, localHour: number): boolean {
  if (!previous || next.t - previous.t < DREAM_REST_MS) return false;
  if (localHour < DREAM_FROM_HOUR || localHour >= DREAM_UNTIL_HOUR) return false;
  try {
    return hexDistance(previous.h3, next.h3) <= DREAM_STILL_RINGS;
  } catch {
    return false; // h3 cannot measure that far: certainly not where you slept
  }
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The dream a morning draws: the same card all that day. */
export const dreamFor = (day: string): DreamCard => DREAMS[hash(`dream:${day}`) % DREAMS.length] as DreamCard;

export const dreamById = (id: string): DreamCard | null => DREAMS.find((d) => d.id === id) ?? null;
