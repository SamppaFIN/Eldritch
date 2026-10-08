/**
 * The Drowned Choir of Pyhäjärvi (BRDC-CHOIR-001) — the lake's own threat, Innsmouth in
 * the Fuming Lake's voice: a choir that sings from under the water, and the people who
 * answer it. Its cards are dealt on lake and coast rumours; its three-step tale hangs on
 * the Tavern's board. In the Reckoning the lake rises: every lake and coast hex makes half
 * until the tale is finished.
 *
 * The tale's steps cannot fail — walk, study, keep vigil — so a realm can always end the
 * flood; how soon is the only question.
 *
 * Pure.
 */
import type { DeckCard } from './deck.js';
import type { Task } from './tasks.js';
import type { TerrainKind } from './terrain.js';
import type { SeasonPhase } from './season.js';

/** About one lake or coast rumour in four is the Choir. */
export const CHOIR_SHARE = 0.25;
export const FLOOD_FACTOR = 0.5;

export const CHOIR_CARDS: readonly DeckCard[] = [
  {
    id: 'lake:choir-viinikanlahti', deck: 'lake', title: 'Hymn at Viinikanlahti', text: 'Under the bay’s still water, a choir is practising. They are flat on purpose.', skill: 'will', need: 1,
    pass: { text: 'You hum against them until they lose the key. A clue floats up.', clues: 1 }, fail: { text: 'You hum along. It is a lovely tune.', sanity: 1 },
  },
  {
    id: 'lake:choir-hymnal', deck: 'lake', title: 'The Wet Hymnal', text: 'A hymn book on the shore, soaked through, every page the same song in a different hand.', skill: 'lore', need: 2,
    pass: { text: 'You read the one hand that is not a choir member’s. It is a warning, and a map.', clues: 1, gain: { wisdom: 15 } }, fail: { text: 'You read it aloud.', sanity: 2 },
  },
  {
    id: 'lake:choir-pispala-steps', deck: 'lake', title: 'The Pispala Steps', text: 'Wet footprints climb the steps from the lake. None come down.', skill: 'observe', need: 1,
    pass: { text: 'You follow them to a door, and do not knock. Coin in the gutter where they paused.', gain: { gold: 25 } }, fail: { text: 'You knock.', sanity: 1, stamina: 1 },
  },
  {
    id: 'lake:choir-bell', deck: 'lake', title: 'The Choirmaster’s Bell', text: 'A handbell rings out on the water at dusk. Every gull on the lake turns to face it.', skill: 'fight', need: 2,
    pass: { text: 'You throw the stone first. The bell stops. The fish come back.', gain: { food: 35 } }, fail: { text: 'The bell rings for you.', sanity: 2 },
  },
  {
    id: 'lake:choir-congregant', deck: 'lake', title: 'A Congregant', text: 'A woman with wide, wet eyes asks if you sing. She smells of the deep end of the lake.', skill: 'will', need: 2,
    pass: { text: 'You tell her you do not. She looks sorry for you, and leaves mana as alms.', gain: { mana: 20 } }, fail: { text: 'You tell her you used to.', sanity: 1, condition: 'cursed' },
  },
  {
    id: 'lake:choir-pyynikki', deck: 'lake', title: 'Pyynikki Ridge at Night', text: 'From the ridge the whole of Pyhäjärvi is lit from below, in the shape of an open mouth.', skill: 'observe', need: 2,
    pass: { text: 'You count the lights. There is one for every member. Two clues.', clues: 2 }, fail: { text: 'One of the lights is counting you.', sanity: 2 },
  },
];

export const CHOIR_TASKS: readonly Task[] = [
  {
    id: 'choir-1-listen', title: 'The Drowned Choir I · Listen', giver: 'The ferryman of Pyhäjärvi',
    text: '"They sing louder every night. Walk ten of your hexes and tell me where you can still not hear them."',
    objective: { kind: 'visit', count: 10 }, reward: { xp: 60, pool: { wisdom: 20 } },
    done: 'Nowhere. You can hear them everywhere. The ferryman nods as if that was the answer he feared.',
  },
  {
    id: 'choir-2-study', title: 'The Drowned Choir II · Study', giver: 'The ferryman of Pyhäjärvi',
    text: '"Something on your ground keeps time for them. Study it, before the lake rises to meet it."', after: 'choir-1-listen',
    objective: { kind: 'investigate', count: 1 }, reward: { xp: 90, pool: { mana: 25 } },
    done: 'It was a metronome made of bone, ticking under a stone. It stops when you lift it.',
  },
  {
    id: 'choir-3-vigil', title: 'The Drowned Choir III · Vigil', giver: 'The ferryman of Pyhäjärvi',
    text: '"Keep a temple on two days and sing back at them. Badly. They cannot stand a bad singer."', after: 'choir-2-study',
    objective: { kind: 'temple', days: 2 }, reward: { xp: 150, pool: { culture: 30, mana: 30 } },
    done: 'On the second night the lake goes quiet, then very quiet, then ordinary. The Choir has lost its key.',
  },
];

export const CHOIR_FINALE = 'choir-3-vigil';

/** Ground the Choir floods: the lake and its shore. */
export const floodsAt = (kind: TerrainKind): boolean => kind === 'lake' || kind === 'coast';

/** The lake rises in the Reckoning, and only then — until the Choir's tale is done. */
export const isFlooded = (phase: SeasonPhase | undefined, solved: boolean): boolean => phase === 'reckoning' && !solved;
