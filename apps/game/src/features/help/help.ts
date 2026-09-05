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
  | 'hearth';

export interface HelpEntry {
  title: string;
  /** One paragraph per string. Kept short — this is read outdoors, one-handed. */
  body: string[];
  /** Related entries, shown as "See also" links. Every id must be a real HelpTopic. */
  see?: HelpTopic[];
}

export const HELP: Readonly<Record<HelpTopic, HelpEntry>> = {
  'how-to-play': {
    title: 'How to Play',
    body: [
      'Walk a closed loop on foot — out from a point and back to it. The land inside the loop Awakens: it becomes your territory, cell by cell, and pays a one-off yield of whatever the ground holds.',
      'Walk your ground again on later days to keep it. The first walk each calendar day strengthens a cell; a second day running pays double. Cells you never revisit rot — two days\' grace, then a slow bleed, then release. A dark stain creeps over neglected land, and one walk clears it.',
      'To take a rival\'s cell, walk through it. One pass only wounds it; it changes hands when its strength reaches zero, which is two or three walks on separate days. Feet take ground — nothing else does.',
      'Your first cell is the Hearth, claimed where you stood when you began. It never decays and cannot be taken. Turn the Vigil on before a walk so the Ley-line keeps recording with the phone in your pocket.',
    ],
    see: ['first-walk', 'awakening', 'reinforcement', 'decay', 'corruption'],
  },
  'first-walk': {
    title: 'Your First Walk',
    body: [
      '1. Accept the Hearth when the game offers it. That cell is yours for good.',
      '2. Open the menu and turn the Vigil on. A pocketed phone stops feeding the game GPS without it, and the border comes out wrong.',
      '3. Walk a small block — around the building, around the car park — and return to where you started. Keep it well under your Consciousness Level\'s size limit for a first try.',
      '4. When the loop closes, the cells inside fill with your colour and the pouch gains the ground\'s yield. If nothing happens, read the signal line: a weak sky refuses a loop.',
      '5. Open History from the menu to read back what each step did. Every line links here, to the page that explains it.',
    ],
    see: ['how-to-play', 'vigil', 'awakening', 'vocabulary'],
  },
  vocabulary: {
    title: 'What the Words Mean',
    body: [
      'The game speaks in its own tongue. The plain meaning of each term:',
      'Ley-line — the trail you leave as you walk. Awakening the Ground — claiming the land inside a closed loop. Corruption — taking a cell from a rival. Warded Cell — one hexagon of territory. Reinforcement — strengthening ground by walking it again.',
      'The Hearth — your first, unloseable cell. Anchor Stone — the mark at its centre; it feeds mana. The Keep — a decoy near the Hearth, and the only place other players ever see. The Wager — a challenge fought against a friend with no server. The Atlas — the whole-country view.',
      'Consciousness Level — your level; it raises the size of loop you may claim. Work — a building on a cell. Rite — a researched technology. The Void — what reclaims ground nobody walks.',
    ],
    see: ['how-to-play', 'awakening', 'the-wager', 'hearth'],
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
      'Walk a closed loop and the land inside it becomes yours. Each new cell is claimed at base strength and pays a one-off yield of whatever its terrain gives — timber from woodland, food from water, gold from a row of shops.',
      'A loop has to enclose real area and be walked, not drawn: a ring that crosses itself on a bad GPS sky is refused, and so is one that is too large for your Consciousness Level.',
    ],
    see: ['how-to-play', 'reinforcement', 'decay', 'corruption'],
  },
  corruption: {
    title: 'Corruption',
    body: [
      'Walking through a rival\'s cell does not take it. It takes damage, and keeps its owner until its strength reaches zero — then it flips to you and resets to base strength.',
      'A rival\'s established home block should cost two or three separate walks on separate days. That is deliberate: a single forged route achieves nothing, and the map does not collapse into one colour in an afternoon.',
    ],
    see: ['awakening', 'the-wager', 'reinforcement'],
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
      'Each needs the right terrain and, further up, a technology researched first. Demolishing one hands back half its cost — a misplaced building is not permanent.',
    ],
    see: ['rite', 'mana'],
  },
  rite: {
    title: 'Research',
    body: [
      'Research is this game\'s technology tree, bought with wisdom, in the Keep. Each technology unlocks buildings, further technologies, or a new age; completing an age is a moment the game marks.',
      'Some of what you learn can be cast as a Rite. The two home schools work on your own ground — Insight feeds wisdom to the whole domain, Bulwark holds a cell against the Void. The rest travel in a Wager.',
    ],
    see: ['work', 'mana'],
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
      'Mana comes from the places the game has named — your Anchor Stone, and Temples revealed by dwelling long enough in one cell. It is the fuel spells will spend.',
      'A Temple\'s output can be raised a step at a time with stone and gold. A place stops producing if the cell it sits in goes unvisited too long, the same clock as decay.',
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
      'An adventure is a story with choices, opened from the Hearth. It ties walking, ground and resources into one tale — a choice may be locked until you hold a certain kind of land, or a named place, or enough of a resource to spend.',
      'It never blocks the game. Leave one half-finished and come back to it; a reset clears it. The first is The Fuming Lake.',
    ],
    see: ['anomaly', 'cthulhu-awakening'],
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
      'Multiplayer with no server: you seal your sanctuary as a block of text, send it to a friend, and their game reads it back as a rival holding real ground.',
      'Accepting a challenge fights it — deterministically, so both phones compute the same result from the same message. A victory softens their border on your map; it never takes ground. Feet take ground.',
    ],
    see: ['corruption', 'rite'],
  },
  hearth: {
    title: 'The Hearth',
    body: [
      'The Hearth is the cell you were standing in when you agreed to begin. It is claimed on the spot, it holds your Anchor Stone, and it cannot be lost — it never decays and never changes hands.',
      'It never leaves your device. The Keep, drawn on the same spot, is the only location ever published for other players to see.',
    ],
    see: ['vigil', 'decay', 'vocabulary'],
  },
};

/**
 * The order and grouping of the guide's front page. Every HelpTopic appears in exactly
 * one group — help.test.ts fails the run on an orphan or a duplicate.
 */
export const GROUPS: readonly { heading: string; topics: readonly HelpTopic[] }[] = [
  { heading: 'Getting started', topics: ['how-to-play', 'first-walk', 'vocabulary'] },
  {
    heading: 'The ground',
    topics: ['awakening', 'corruption', 'reinforcement', 'decay', 'warding'],
  },
  { heading: 'Building and rites', topics: ['work', 'rite', 'mana'] },
  { heading: 'The world', topics: ['anomaly', 'adventures', 'cthulhu-awakening'] },
  { heading: 'Playing others', topics: ['the-wager'] },
  { heading: 'Your sanctuary', topics: ['hearth', 'vigil'] },
];
