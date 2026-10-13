/**
 * The in-game codex (BRDC-WIKI-001).
 *
 * The rules are already more than fits in a head — siege, decay, the day bonus, dwell
 * thresholds — and none of them is readable from inside the game. This is the seam that
 * fixes it: a plain record of short explanations, opened from the menu as a browsable
 * guide, or straight to one entry from wherever the concept appears (the Vigil readout,
 * a line in the action log, the Character screen).
 *
 * The full plan derives the per-building and per-Rite pages from the rule tables and
 * searches the lot; this is the hand-written core — the game's loop, its first walk, its
 * vocabulary, and one entry per concept the log links to.
 */
import { PERKS } from '@es3/core';
import { SEASON_THREE_HELP, SEASON_THREE_TOPICS } from './helpSeasonThree.js';
import type { SeasonThreeTopic } from './helpSeasonThree.js';

export type HelpTopic =
  | 'how-to-play'
  | 'first-walk'
  | 'vocabulary'
  | 'vigil'
  | 'awakening'
  | 'corruption'
  | 'reinforcement'
  | 'decay'
  | 'work'
  | 'rite'
  | 'warding'
  | 'mana'
  | 'anomaly'
  | 'adventures'
  | 'cthulhu-awakening'
  | 'the-wager'
  | 'hearth'
  | 'sky'
  | 'consciousness'
  | SeasonThreeTopic;

export interface HelpEntry {
  title: string;
  /** One paragraph per string. Kept short — this is read outdoors, one-handed. */
  body: string[];
  /** Related entries, shown as "See also" links. Every id must be a real HelpTopic. */
  see?: HelpTopic[];
}

export const HELP: Readonly<Record<HelpTopic, HelpEntry>> = {
  ...SEASON_THREE_HELP,
  'how-to-play': {
    title: 'How to Play',
    body: [
      'Walk. Step into an unclaimed hex beside your ground and it is yours on the spot. Every hex you hold gives what its ground is made of — timber, food, stone, gold — every hour you hold it.',
      'Walk your ground again on later days to keep it. The first walk each calendar day strengthens a hex; a second day running pays double. Ground you never revisit fades — two days\' grace, then a slow bleed, then the Void takes it back.',
      'Step onto a rival\'s hex and it is yours too. Only their Hearth and a standing Fortress hold out: those wear down over several walks instead. In Route mode nobody takes anybody\'s ground.',
      'Your first hex is the Hearth, where you stood when you began; your Keep stands on it. Turn the Vigil on before a walk so the Ley-line keeps recording with the phone in your pocket.',
    ],
    see: ['first-walk', 'awakening', 'reinforcement', 'decay', 'corruption'],
  },
  'first-walk': {
    title: 'Your First Walk',
    body: [
      '1. Accept the Hearth when the game offers it. That hex is yours for good, and your Keep stands on it.',
      '2. Open the menu and turn the Vigil on. A pocketed phone stops feeding the game GPS without it, and your steps go missing.',
      '3. Walk out from the Hearth in any direction. Each hex you step into beside your ground turns your colour as you enter it.',
      '4. Tap Collect when the pouch has filled, and open the Keep to see what is coming in. If nothing happens as you walk, read the signal line: a weak sky is not counted.',
      '5. Open History from the menu to read back what each step did. Every line links here, to the page that explains it.',
    ],
    see: ['how-to-play', 'vigil', 'awakening', 'vocabulary'],
  },
  vocabulary: {
    title: 'What the Words Mean',
    body: [
      'The game speaks in its own tongue. The plain meaning of each term:',
      'Ley-line — the trail you leave as you walk. Awakening the Ground — claiming a hex by stepping into it. Corruption — taking a hex from a rival. Warded Cell — one hexagon of territory. Reinforcement — strengthening ground by walking it again.',
      'The Hearth — your first hex. The Keep — your home, standing on the Hearth; the one place of yours other players see. Anchor Stone — the mark at its centre; it feeds mana. The Atlas — the whole-country view.',
      'Consciousness Level — your level. Work — a building on a hex. The Lore — what you research with wisdom. Rite — a temple\'s spell, cast with mana. The Void — what reclaims ground nobody walks.',
    ],
    see: ['how-to-play', 'awakening', 'hearth', 'rite'],
  },
  vigil: {
    title: 'The Vigil',
    body: [
      'A phone browser freezes a page the moment it goes in your pocket, and a frozen page gets no GPS. Without the Vigil, the game keeps only the moments you were looking at the screen, and the border it draws afterwards runs through streets you never walked.',
      'The Vigil holds the page awake so the Ley-line stays true while you walk. It costs battery, so it is your choice to turn on.',
      'The readout tells you which half is holding. "breath" means a near-silent audio loop is keeping the page alive — the phone can go in a pocket. "screen only" means it cannot: keep the screen on, or the line will have gaps.',
    ],
    see: ['how-to-play', 'first-walk'],
  },
  awakening: {
    title: 'Awakening the Ground',
    body: [
      'Step into an unclaimed hex that borders your ground and it is yours, at base strength. From then on it pays what its ground is made of, every hour — timber from woodland, food from water, gold from a row of shops.',
      'An old way is still there for those who want it: turn on Claim by closing a loop in Settings, and a closed walk takes the land inside it too.',
    ],
    see: ['how-to-play', 'reinforcement', 'decay', 'corruption'],
  },
  corruption: {
    title: 'Corruption',
    body: [
      'Step onto a rival\'s hex and it is yours, at full strength — the last walker owns it. Red ground falls to a walk just as unclaimed ground does.',
      'Two places hold out: a rival\'s Hearth and a standing Fortress. A walk only wears those down; they change hands when their strength reaches zero, over several walks on separate days. In Route mode nobody takes anyone\'s ground at all.',
    ],
    see: ['awakening', 'reinforcement'],
  },
  reinforcement: {
    title: 'Reinforcement',
    body: [
      'Walking a cell you already hold makes it stronger — but only the first pass each calendar day. Five laps this afternoon do nothing after the first.',
      'Do it again the next day and it pays double. The game rewards a routine you keep, not a grind you can rush.',
    ],
    see: ['awakening', 'decay', 'warding'],
  },
  decay: {
    title: 'The Void reclaims',
    body: [
      'Ground nobody walks fades. Two days\' grace after your last visit, then a slow bleed of strength, then a faster one after a fortnight. At zero the cell is released — it is unowned ground again, not a very weak cell you still hold.',
      'A maxed cell survives about 33 days untouched; a freshly claimed one about 12. This is what keeps the map alive with only a couple of players. Your Hearth is the exception: it never fades.',
      'The dark stain that creeps over neglected ground is the Void\'s hold made visible — deeper the longer you stay away, and worst at the edge of what you hold. A single walk across the cell clears it.',
    ],
    see: ['reinforcement', 'warding', 'hearth'],
  },
  work: {
    title: 'Work',
    body: [
      'A building sits on one cell you hold and changes what it is worth. A sawmill pours out more timber, a market more gold, a fortress blunts an attacker\'s blow.',
      'Each needs the right terrain and, further up, a piece of the Lore learned first. It makes its yield only with hands in it — citizens from the Keep — and where it stands matters: some Works pay more beside water, a temple or their own kind. Demolishing one hands back half its cost.',
    ],
    see: ['rite', 'mana', 'neighbours'],
  },
  rite: {
    title: 'Research and Rites',
    body: [
      'Research is the Lore, bought with wisdom from the Research button. Learn three of an Age\'s four and you enter the next Age; what you learn opens Works, masterworks and rules. Every piece of the Lore has a eureka that halves its price.',
      'Rites are the temples\' spells. Kindling lets you dedicate a temple to a school — the Ward, the Tide or the Whisper — where rites are learned and deepened, and cast with mana. The Reference lists every one.',
    ],
    see: ['work', 'mana', 'eureka', 'ages'],
  },
  warding: {
    title: 'Warding',
    body: [
      'Warding spends timber from the pouch to raise one cell\'s strength on the spot, without walking it. It is how you shore up a border cell that is fading faster than your route reaches it.',
      'It cannot take a cell past its maximum, and it only works on ground you already hold.',
    ],
    see: ['decay', 'reinforcement'],
  },
  mana: {
    title: 'Mana',
    body: [
      'Mana comes from the places the game has named — your Anchor Stone, and Temples revealed by dwelling long enough in one hex. Rites spend it: to learn, to deepen, and every cast.',
      'A Temple\'s output can be raised a step at a time with stone and gold. A place stops producing if the hex it sits in goes unvisited too long, the same clock as decay.',
    ],
    see: ['rite', 'work'],
  },
  anomaly: {
    title: 'Anomalies',
    body: [
      'Now and then a cell holds something wrong — strange ground you can study. Investigating costs food — you camp on it and wait — and takes a few hours, and what it gives you is hidden until it is done.',
      'Some anomalies simply pay out. Others open an event: a short story with choices, and the choices have consequences. Where an anomaly is, and what it turns out to be, is fixed to the ground — the same on every phone, and a reload will not re-roll it.',
    ],
    see: ['adventures'],
  },
  adventures: {
    title: 'Adventures',
    body: [
      'An adventure is a story with choices, walked between real places. Each one begins at its first stop — the Statue of the Boy for the Fuming Lake — and each next page waits at the next place.',
      'A choice may be locked until you hold a certain kind of land, a named place, or enough of a resource to spend. It never blocks the game: leave one half-finished and come back. Finish the Fuming Lake and its sequel, the Skyward Runway, opens.',
    ],
    see: ['anomaly', 'cthulhu-awakening', 'skyward-runway'],
  },
  'cthulhu-awakening': {
    title: 'The Deep',
    body: [
      'Something sleeps under the Fuming Lake, and the hermit\'s incantation was never going to clear the fumes — only wake it. It speaks in concept, not sound. It calls you Servant, and the choosing was an illusion.',
      'You carry this now. The perks are real. None of them are good.',
    ],
    see: ['adventures'],
  },
  'the-wager': {
    title: 'The Wager',
    body: [
      'The Wager was a duel sent between two phones as a block of text. It is resting: since a step decides who owns a hex, there is no siege left for it to settle.',
      'Its code is kept, not thrown away. If it comes back, this page will say how it plays.',
    ],
    see: ['corruption'],
  },
  hearth: {
    title: 'The Hearth',
    body: [
      'The Hearth is the hex you were standing in when you agreed to begin. It never decays, it holds your Anchor Stone, and your Keep stands on it.',
      'A step cannot take it: a rival can only wear it down, over several walks. It is the one place of yours that friends see on the shared map — as your Keep.',
    ],
    see: ['vigil', 'decay', 'vocabulary'],
  },
  consciousness: {
    title: 'Consciousness',
    body: [
      'Your level. Every hex you claim adds to it, up to Transcendent at 20. The You screen shows how far the next one is.',
      // From the game's own list, so the Guide and the perks cannot drift (BRDC-MIND-001).
      ...PERKS.map((p) => `Level ${p.level}: ${p.text}.`),
    ],
    see: ['awakening', 'anomaly', 'warding'],
  },
  sky: {
    title: 'Moon and Weather',
    body: [
      'The sky is the real moon and a weather read from the calendar, the same on every phone. Nothing is fetched.',
      'Full moon: mana comes half again, the Doom stands one higher for the day, and a Farm that learned the Harvest Moon makes triple food. New moon: anomalies show on the ground bordering yours, not only on your own.',
      'Fog: the map shows only your own ground. Clear skies: two rings past it. Storm: a fix with half again the usual GPS error still counts — but walking speed is checked as always.',
    ],
    see: ['mana', 'anomaly', 'cthulhu-awakening'],
  },
};

/**
 * The order and grouping of the guide's front page. Every HelpTopic appears in exactly
 * one group — help.test.ts fails the run on an orphan or a duplicate.
 */
export const GROUPS: readonly { heading: string; topics: readonly HelpTopic[] }[] = [
  { heading: 'Getting started', topics: ['how-to-play', 'first-walk', 'vocabulary', 'consciousness'] },
  { heading: 'This season', topics: SEASON_THREE_TOPICS },
  {
    heading: 'The ground',
    topics: ['awakening', 'corruption', 'reinforcement', 'decay', 'warding'],
  },
  { heading: 'Building and rites', topics: ['work', 'rite', 'mana'] },
  { heading: 'The world', topics: ['anomaly', 'adventures', 'cthulhu-awakening', 'sky'] },
  { heading: 'Playing others', topics: ['the-wager'] },
  { heading: 'Your sanctuary', topics: ['hearth', 'vigil'] },
];
