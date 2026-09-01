/**
 * The in-game codex (BRDC-WIKI-001).
 *
 * The rules are already more than fits in a head — siege, decay, the day bonus, dwell
 * thresholds — and none of them is readable from inside the game. This is the seam that
 * fixes it: a plain record of short explanations, opened from wherever the concept
 * appears (the Vigil readout, a line in the action log).
 *
 * The full plan derives its content from the rule tables and searches it; this is the
 * hand-written first pass, one entry per concept the log links to.
 */
export type HelpTopic =
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
}

export const HELP: Readonly<Record<HelpTopic, HelpEntry>> = {
  vigil: {
    title: 'The Vigil',
    body: [
      'A phone browser freezes a page the moment it goes in your pocket, and a frozen page gets no GPS. Without the Vigil, the game keeps only the moments you were looking at the screen, and the border it draws afterwards runs through streets you never walked.',
      'The Vigil holds the page awake so the Ley-line stays true while you walk. It costs battery, so it is your choice to turn on.',
      'The readout tells you which half is holding. "breath" means a near-silent audio loop is keeping the page alive — the phone can go in a pocket. "screen only" means it cannot: keep the screen on, or the line will have gaps.',
    ],
  },
  awakening: {
    title: 'Awakening the Ground',
    body: [
      'Walk a closed loop and the land inside it becomes yours. Each new cell is claimed at base strength and pays a one-off yield of whatever its terrain gives — timber from woodland, food from water, gold from a row of shops.',
      'A loop has to enclose real area and be walked, not drawn: a ring that crosses itself on a bad GPS sky is refused, and so is one that is too large for your Consciousness Level.',
    ],
  },
  corruption: {
    title: 'Corruption',
    body: [
      'Walking through a rival\'s cell does not take it. It takes damage, and keeps its owner until its strength reaches zero — then it flips to you and resets to base strength.',
      'A rival\'s established home block should cost two or three separate walks on separate days. That is deliberate: a single forged route achieves nothing, and the map does not collapse into one colour in an afternoon.',
    ],
  },
  reinforcement: {
    title: 'Reinforcement',
    body: [
      'Walking a cell you already hold makes it stronger — but only the first pass each calendar day. Five laps this afternoon do nothing after the first.',
      'Do it again the next day and it pays double. The game rewards a routine you keep, not a grind you can rush.',
    ],
  },
  decay: {
    title: 'The Void reclaims',
    body: [
      'Ground nobody walks fades. Two days\' grace after your last visit, then a slow bleed of strength, then a faster one after a fortnight. At zero the cell is released — it is unowned ground again, not a very weak cell you still hold.',
      'A maxed cell survives about 33 days untouched; a freshly claimed one about 12. This is what keeps the map alive with only a couple of players. Your Hearth is the exception: it never fades.',
    ],
  },
  work: {
    title: 'Work',
    body: [
      'A building sits on one cell you hold and changes what it is worth. A sawmill pours out more timber, a market more gold, a fortress blunts an attacker\'s blow.',
      'Each needs the right terrain and, further up, a Rite researched first. Demolishing one hands back half its cost — a misplaced building is not permanent.',
    ],
  },
  rite: {
    title: 'Rites',
    body: [
      'Rites are this game\'s technology tree, bought with wisdom. Each unlocks buildings, other Rites, or a new age; completing an age is a moment the game marks.',
      'Spells are cast Rites. The two home schools work on your own ground — Insight feeds wisdom to the whole domain, Bulwark holds a cell against the Void. The rest travel in a Wager.',
    ],
  },
  warding: {
    title: 'Warding',
    body: [
      'Warding spends timber from the pouch to raise one cell\'s strength on the spot, without walking it. It is how you shore up a border cell that is fading faster than your route reaches it.',
      'It cannot take a cell past its maximum, and it only works on ground you already hold.',
    ],
  },
  mana: {
    title: 'Mana',
    body: [
      'Mana comes from the places the game has named — your Anchor Stone, and Temples revealed by dwelling long enough in one cell. It is the fuel spells will spend.',
      'A Temple\'s output can be raised a step at a time with stone and gold. A place stops producing if the cell it sits in goes unvisited too long, the same clock as decay.',
    ],
  },
  anomaly: {
    title: 'Anomalies',
    body: [
      'Now and then a cell holds something wrong — strange ground you can study. Investigating costs food — you camp on it and wait — and takes a few hours, and what it gives you is hidden until it is done.',
      'Some anomalies simply pay out. Others open an event: a short story with choices, and the choices have consequences. Where an anomaly is, and what it turns out to be, is fixed to the ground — the same on every phone, and a reload will not re-roll it.',
    ],
  },
  adventures: {
    title: 'Adventures',
    body: [
      'An adventure is a story with choices, opened from the Hearth. It ties walking, ground and resources into one tale — a choice may be locked until you hold a certain kind of land, or a named place, or enough of a resource to spend.',
      'It never blocks the game. Leave one half-finished and come back to it; a reset clears it. The first is The Fuming Lake.',
    ],
  },
  'cthulhu-awakening': {
    title: 'The Deep',
    body: [
      'Something sleeps under the Fuming Lake, and the hermit\'s incantation was never going to clear the fumes — only wake it. It speaks in concept, not sound. It calls you Servant, and the choosing was an illusion.',
      'You carry this now. The perks are real. None of them are good.',
    ],
  },
  'the-wager': {
    title: 'The Wager',
    body: [
      'Multiplayer with no server: you seal your sanctuary as a block of text, send it to a friend, and their game reads it back as a rival holding real ground.',
      'Accepting a challenge fights it — deterministically, so both phones compute the same result from the same message. A victory softens their border on your map; it never takes ground. Feet take ground.',
    ],
  },
  hearth: {
    title: 'The Hearth',
    body: [
      'The Hearth is the cell you were standing in when you agreed to begin. It is claimed on the spot, it holds your Anchor Stone, and it cannot be lost — it never decays and never changes hands.',
      'It never leaves your device. The Keep, drawn on the same spot, is the only location ever published for other players to see.',
    ],
  },
};
