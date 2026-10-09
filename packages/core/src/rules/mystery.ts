/**
 * The season's three mysteries (BRDC-MYSTERY-001) — Eldritch Horror's mysteries, solved by
 * everyone together: the community's clues and its sealed gates move one shared story on,
 * a chapter at a time, and every chapter solved weakens the Ancient One before the
 * Reckoning comes.
 *
 * A mystery is solved by 30 clues gathered or 5 gates sealed, counted across every realm
 * (whichever comes first — gate-sealers and clue-hunters both carry it). The Worker keeps
 * the counts on the shared season; a realm off-line reads the last it heard.
 *
 * Pure.
 */
export const MYSTERY_CLUES = 30;
export const MYSTERY_SEALS = 5;
export const MYSTERY_HP_CUT = 0.2;

export interface Mystery {
  title: string;
  /** Read by everyone the moment it is solved. */
  chapter: string;
}

export const MYSTERIES: readonly [Mystery, Mystery, Mystery] = [
  {
    title: 'The Ferryman’s Ledger',
    chapter: 'The ledger lists every crossing since 1923. One passenger has crossed every night, and never once come back. The entries are in Management’s handwriting.',
  },
  {
    title: 'The Second Statue',
    chapter: 'There were two statues of the boy. The second was melted down in 1944 and its bronze went into the lake, where it is still standing, propeller turning, facing the first.',
  },
  {
    title: 'What the Lake Is For',
    chapter: 'The lake is not a lake. It is a lid. Every gate sealed this season was a hand pressing it down, and the thing beneath has felt every one of them.',
  },
];

/** How many of the three the community has solved. */
export const mysteriesSolved = (clues: number, seals: number): number =>
  Math.min(MYSTERIES.length, Math.max(Math.floor(clues / MYSTERY_CLUES), Math.floor(seals / MYSTERY_SEALS)));

/** The Ancient One's strength, after what the mysteries took from it. */
export const mysteryHp = (hp: number, solved: number): number => Math.round(hp * (1 - MYSTERY_HP_CUT * Math.min(solved, MYSTERIES.length)));

/** How far along the mystery being worked on is, as the stronger of its two roads. */
export function mysteryProgress(clues: number, seals: number): { solved: number; clues: number; seals: number; needClues: number; needSeals: number } {
  const solved = mysteriesSolved(clues, seals);
  return { solved, clues, seals, needClues: MYSTERY_CLUES * (solved + 1), needSeals: MYSTERY_SEALS * (solved + 1) };
}
