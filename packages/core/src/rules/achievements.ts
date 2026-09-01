/**
 * Achievements — recognition, not reward (BRDC-CHAR-001).
 *
 * A fixed list, and a pure function that says which are earned *right now* from a
 * snapshot of the player's state. The store (`data/achievementStore.ts`) is what stamps
 * the moment one first becomes true and never un-stamps it — so losing your tenth cell
 * does not take "Cartographer" back.
 *
 * No XP, no unlock rides on these yet. The plan is explicit: recognition only for now.
 */
export interface Achievement {
  id: string;
  name: string;
  /** What it takes, in one short line. */
  hint: string;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'first-ground', name: 'First Ground', hint: 'Awaken your first cell' },
  { id: 'homesteader', name: 'Homesteader', hint: 'Found your Hearth' },
  { id: 'cartographer', name: 'Cartographer', hint: 'Hold ten cells at once' },
  { id: 'dominion', name: 'Dominion', hint: 'Hold thirty cells at once' },
  { id: 'routine', name: 'A Routine', hint: 'Walk one cell on three separate days' },
  { id: 'rites-begun', name: 'Rites Begun', hint: 'Learn a Rite' },
  { id: 'sanctified', name: 'Sanctified', hint: 'Dwell long enough to reveal a Temple' },
  { id: 'awakening', name: 'Awakening', hint: 'Reach Consciousness 5' },
  { id: 'enlightened', name: 'Enlightened', hint: 'Reach Consciousness 15' },
  { id: 'collector', name: 'Collector', hint: "Find all three of the troll's answers" },
  { id: 'servant', name: 'Servant of the Deep', hint: 'See The Fuming Lake to its end' },
];

export interface AchievementSnapshot {
  level: number;
  ownedCount: number;
  /** The most calendar-days any single held cell has been walked on. */
  maxOwnedDays: number;
  finds: readonly string[];
  adventuresDone: readonly string[];
  templeCount: number;
  techCount: number;
  hearthFounded: boolean;
}

const SECRETS = ['trinket', 'staff', 'wisdom'];

/** The ids earned by this snapshot. Pure — order-independent, safe on a zero snapshot. */
export function earnedNow(s: AchievementSnapshot): Set<string> {
  const got = new Set<string>();
  if (s.ownedCount >= 1) got.add('first-ground');
  if (s.hearthFounded) got.add('homesteader');
  if (s.ownedCount >= 10) got.add('cartographer');
  if (s.ownedCount >= 30) got.add('dominion');
  if (s.maxOwnedDays >= 3) got.add('routine');
  if (s.techCount >= 1) got.add('rites-begun');
  if (s.templeCount >= 1) got.add('sanctified');
  if (s.level >= 5) got.add('awakening');
  if (s.level >= 15) got.add('enlightened');
  if (SECRETS.every((x) => s.finds.includes(x))) got.add('collector');
  if (s.adventuresDone.includes('fuming-lake')) got.add('servant');
  return got;
}
