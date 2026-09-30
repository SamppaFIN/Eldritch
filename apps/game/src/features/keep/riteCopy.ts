/** What a refused rite says — errors say what to do (§14). BRDC-PROG-007. */
const REFUSAL: Readonly<Record<string, string>> = {
  'no-slot': 'Study Kindling, then Ley Reading, to dedicate more schools.',
  dedicated: 'That school is already yours.',
  'not-dedicated': 'Dedicate a temple to that school first.',
  sealed: 'The Lore does not reach that tier yet.',
  closed: 'The other rite on this tier was chosen. It stays closed.',
  learned: 'Already learned.',
  'not-learned': 'Learn it first.',
  'max-rank': 'Your Age caps its rank. Study the Lore to go deeper.',
  cooling: 'It rests for a day between casts.',
  'cannot-afford': 'Not enough mana yet.',
  'no-keep': 'This realm has no Keep yet.',
  'no-target': 'Cast it from the hex card of your own ground.',
  'no-gate': 'No gate is open. Keep it for when one is.',
  'nothing-near': 'No free ground borders yours. Walk out to find some.',
};

export const riteRefusal = (refused: string): string => REFUSAL[refused] ?? 'That did not work.';
