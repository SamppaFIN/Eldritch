/**
 * The in-game codex, one entry at a time (BRDC-WIKI-001, first slice).
 *
 * The rules are already more than fits in a head — siege, decay, the day bonus, dwell
 * thresholds — and none of them is readable from inside the game. This is the seam that
 * fixes it: a plain record of short explanations, opened from wherever the concept
 * appears. It starts with the one a field-tester asks about first.
 */
export type HelpTopic = 'vigil';

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
};
