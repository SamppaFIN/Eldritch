/**
 * The Keeper's Charter (BRDC-ONBOARD-001/002): one path that teaches the game by doing it.
 *
 * One step at a time, in chapters. Each step is done when the realm's **state** says so,
 * never when an event was seen — the rule `steps.ts` and `unlock.ts` already follow — so a
 * veteran's realm ticks off what it has already done, and a step done in one lap counts.
 *
 * Each step's reward is what the *next* goal needs (Infinite 2026-10-13: "something to get
 * closer to your next goal"): studying Lookouts pays the Watchtower's price, and so on.
 *
 * Pure. `data/charterStore.ts` reads the realm into a `CharterState` and keeps what was
 * claimed; this only says which step is current and how far along it is.
 */
import { HEARTH_RING } from './constants.js';
import { keepRaiseCost } from './citizens.js';
import { TERRAIN_TABLE } from './terrain.js';
import type { ResourceKind, ResourcePool } from './terrain.js';
import type { BuildingId } from '../types/domain.js';

export interface CharterState {
  /** Hexes held. A founded Hearth starts at `HEARTH_RING`. */
  owned: number;
  /** Hexes revealed for their tier bonus. */
  revealed: number;
  /** Lore learned. */
  lore: readonly string[];
  /** How many of each Work stand on your ground. */
  works: Readonly<Partial<Record<BuildingId, number>>>;
  /** Citizens at work in any building. */
  hands: number;
  /** What the realm earns an hour, as the pouch will pay it (`forecastRates`). */
  perHour: Readonly<Partial<ResourcePool>>;
}

/**
 * Where "Show me" goes. `unrevealed`, `build-site` and `work` are a hex the store picks
 * from your ground; `research` opens the Lore. Absent = nothing to show, just walk.
 */
export type CharterShow = 'research' | 'unrevealed' | 'build-site' | 'work' | 'supply-site';

export interface CharterStep {
  id: string;
  chapter: number;
  /** The one thing to do, in the imperative. */
  title: string;
  /** Why it is worth doing — one clause. */
  why: string;
  /** The few words the Up next strip has room for. */
  short: string;
  show?: CharterShow;
  /** Words that depend on the realm — the missing-resource step names its resource. */
  say?(s: CharterState): Pick<CharterStep, 'title' | 'why' | 'short'>;
  /** Paid once, when the step is claimed: what the next goal needs. */
  reward: Readonly<Partial<ResourcePool>>;
  progress(s: CharterState): { have: number; need: number };
}

export const CHAPTER_NAMES: Readonly<Record<number, string>> = {
  1: 'The Ground',
  2: 'The Works',
};

/** Held hexes that make a realm worth building on — `steps.ts`'s goal, a little further. */
export const CHARTER_REALM = 12;

const count = (have: number, need: number) => ({ have: Math.min(have, need), need });

/** The hourly rate the missing-resource step asks for (BRDC-ONBOARD-003). */
export const CHARTER_RATE = 6;

/** What the next goal — raising the Keep — is paid in. */
const SUPPLY = Object.keys(keepRaiseCost(1)) as ResourceKind[];

/** The resource the next goal needs that the realm earns least of. */
export function scarcest(s: CharterState): ResourceKind {
  return SUPPLY.reduce((a, b) => ((s.perHour[b] ?? 0) < (s.perHour[a] ?? 0) ? b : a));
}

/** The ground that yields a resource: "hill", "lake or coast or marsh". */
export const groundFor = (k: ResourceKind): string =>
  Object.entries(TERRAIN_TABLE).filter(([, t]) => t.resource === k).map(([kind]) => kind).join(' or ');

export const CHARTER_STEPS: readonly CharterStep[] = [
  {
    id: 'first-step',
    short: 'Step past the Hearth',
    chapter: 1,
    title: 'Walk into the hex beside yours.',
    why: 'Ground that touches yours becomes yours the moment you step on it.',
    reward: { wisdom: 10 },
    progress: (s) => count(s.owned > HEARTH_RING ? 1 : 0, 1),
  },
  {
    id: 'realm',
    short: `Hold ${CHARTER_REALM} hexes`,
    chapter: 1,
    title: `Hold ${CHARTER_REALM} hexes.`,
    why: 'Every hex pays by the hour, so ground is what every plan is built on.',
    reward: { wisdom: 20 },
    progress: (s) => count(s.owned, CHARTER_REALM),
  },
  {
    id: 'reveal',
    short: 'Reveal a hex',
    chapter: 1,
    title: 'Reveal one of your hexes.',
    why: 'Looking closely pays once per hex — and it is how wonders are found.',
    show: 'unrevealed',
    reward: { wood: 20 },
    progress: (s) => count(s.revealed, 1),
  },
  {
    id: 'lookouts',
    short: 'Learn Lookouts',
    chapter: 2,
    title: 'Learn Lookouts in Research.',
    why: 'Lore opens the Works; Lookouts opens the Watchtower.',
    show: 'research',
    reward: { wood: 40, stone: 30 },
    progress: (s) => count(s.lore.includes('lookouts') ? 1 : 0, 1),
  },
  {
    id: 'watchtower',
    short: 'Raise a Watchtower',
    chapter: 2,
    title: 'Raise a Watchtower on a hill or a plain.',
    why: 'A Work makes its hex produce every hour, and a tower sees past your border.',
    show: 'build-site',
    reward: { food: 30 },
    progress: (s) => count(s.works.watchtower ?? 0, 1),
  },
  {
    id: 'hands',
    short: 'Staff the Watchtower',
    chapter: 2,
    title: 'Send a citizen to work in it.',
    why: 'A Work with no hands in it makes nothing. Open its hex and add a citizen.',
    show: 'work',
    reward: { stone: 40, food: 30 },
    progress: (s) => count(s.hands, 1),
  },
  {
    id: 'supply',
    chapter: 2,
    title: `Raise what the Keep needs to ${CHARTER_RATE}/h.`,
    why: 'Raising the Keep costs food and stone.',
    short: 'Raise the scarce supply',
    say: (s) => {
      const k = scarcest(s);
      return {
        title: `Raise ${k} to ${CHARTER_RATE}/h.`,
        why: `Raising the Keep costs food and stone. Hold ${groundFor(k)} hexes, or raise a Work on one.`,
        short: `Raise ${k} to ${CHARTER_RATE}/h`,
      };
    },
    show: 'supply-site',
    reward: { food: 50, stone: 25 },
    progress: (s) => count(Math.floor(s.perHour[scarcest(s)] ?? 0), CHARTER_RATE),
  },
];

export interface CharterView {
  step: CharterStep;
  /** The step's words for this realm (`say`), or its fixed ones. */
  title: string;
  why: string;
  short: string;
  chapterName: string;
  /** The step's place in its chapter: "2 of 3". */
  at: number;
  of: number;
  have: number;
  need: number;
  /** Done and not yet claimed — the reward is waiting. */
  ready: boolean;
}

export const stepDone = (step: CharterStep, s: CharterState): boolean => {
  const p = step.progress(s);
  return p.have >= p.need;
};

/** The first step not yet claimed, and how far along it is; null once every step is claimed. */
export function charterView(s: CharterState, claimed: readonly string[]): CharterView | null {
  const step = CHARTER_STEPS.find((x) => !claimed.includes(x.id));
  if (!step) return null;
  const chapter = CHARTER_STEPS.filter((x) => x.chapter === step.chapter);
  const p = step.progress(s);
  const { title, why, short } = step.say?.(s) ?? step;
  return {
    step,
    title,
    why,
    short,
    chapterName: CHAPTER_NAMES[step.chapter] ?? '',
    at: chapter.indexOf(step) + 1,
    of: chapter.length,
    have: p.have,
    need: p.need,
    ready: p.have >= p.need,
  };
}

/**
 * The steps a realm has already done when it first opens the Charter — a veteran is not
 * made to claim what they did before the Charter existed, and is not paid for it either.
 */
export function alreadyDone(s: CharterState): string[] {
  return CHARTER_STEPS.filter((step) => stepDone(step, s)).map((step) => step.id);
}
