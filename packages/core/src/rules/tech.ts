/**
 * The technology tree, and the eras that fall out of it.
 *
 * Every building the Phase 3 plan describes has an unlocking technology, and without a
 * tree all of them are open from the first minute. This is that tree — as data — plus the
 * one question `canBuild` asks it (`hasTech`) and the payment that gates it (wisdom, the
 * resource nothing spent until now).
 *
 * Pure, and `ward.ts`'s shape: `research` returns `{ ok, … } | { refused }`, pays through
 * `terrain.ts#spend`, and takes no `now` — nothing here depends on the clock.
 *
 * Eras are **derived**, never a counter: you are in an era once the one before it is
 * complete, capped at the last, the same discipline as `MAX_LEVEL`.
 */
import { canAfford, spend } from './terrain.js';
import type { ResourcePool } from './terrain.js';

export type Era = 'prehistory' | 'antiquity' | 'medieval';

/** In order. `medieval` is the last — the tree is capped like the level curve. */
export const ERAS: readonly Era[] = ['prehistory', 'antiquity', 'medieval'];

export type TechId =
  | 'early-farming'
  | 'forestry'
  | 'toolmaking'
  | 'irrigation'
  | 'masonry'
  | 'mining'
  | 'seafaring'
  | 'fortification'
  | 'guild-craft'
  | 'astronomy';

export interface Tech {
  /** Wisdom to research it. */
  cost: number;
  /** Every one of these must be researched first. */
  requires: readonly TechId[];
  era: Era;
}

/**
 * The tree. One root per branch, not one linear list, so a later specialisation split
 * (merchant / warrior / scholar) fits without reshaping it.
 *
 * A cycle here would lock the game silently — `tech.test.ts` proves there is none, and
 * that every `requires` id exists and sits in the same era or an earlier one.
 */
export const TECHS: Readonly<Record<TechId, Tech>> = {
  'early-farming': { cost: 20, requires: [], era: 'prehistory' },
  forestry: { cost: 20, requires: [], era: 'prehistory' },
  toolmaking: { cost: 30, requires: [], era: 'prehistory' },

  irrigation: { cost: 60, requires: ['early-farming'], era: 'antiquity' },
  masonry: { cost: 60, requires: ['toolmaking'], era: 'antiquity' },
  mining: { cost: 80, requires: ['toolmaking', 'masonry'], era: 'antiquity' },
  seafaring: { cost: 70, requires: ['forestry'], era: 'antiquity' },

  fortification: { cost: 140, requires: ['masonry', 'mining'], era: 'medieval' },
  'guild-craft': { cost: 160, requires: ['irrigation', 'seafaring'], era: 'medieval' },
  astronomy: { cost: 150, requires: ['seafaring'], era: 'medieval' },
};

const ALL_TECHS = Object.keys(TECHS) as TechId[];

export function hasTech(researched: readonly TechId[], id: TechId): boolean {
  return researched.includes(id);
}

export function researchCost(id: TechId): number {
  return TECHS[id].cost;
}

/** Every prerequisite is in hand, and it is not already researched. */
export function canResearch(researched: readonly TechId[], id: TechId): boolean {
  if (researched.includes(id)) return false;
  return TECHS[id].requires.every((r) => researched.includes(r));
}

/** The frontier: everything researchable right now. For a research screen to list. */
export function researchable(researched: readonly TechId[]): TechId[] {
  return ALL_TECHS.filter((id) => canResearch(researched, id));
}

export type TechRefusal = 'already-known' | 'locked' | 'cannot-afford';

export type ResearchResult =
  | { ok: true; researched: TechId[]; pool: ResourcePool }
  | { ok: false; refused: TechRefusal };

/** What the repository returns: the new list, and the era if a boundary was crossed. */
export type TechResult =
  | { ok: true; researched: TechId[]; era: Era | null }
  | { ok: false; refused: TechRefusal };

/** Research one technology, paying wisdom. Never mutates its inputs. */
export function research(
  researched: readonly TechId[],
  id: TechId,
  pool: ResourcePool,
): ResearchResult {
  if (researched.includes(id)) return { ok: false, refused: 'already-known' };
  if (!canResearch(researched, id)) return { ok: false, refused: 'locked' };

  const cost = { wisdom: TECHS[id].cost };
  if (!canAfford(pool, cost)) return { ok: false, refused: 'cannot-afford' };
  const paid = spend(pool, cost);
  if (!paid) return { ok: false, refused: 'cannot-afford' };

  return { ok: true, researched: [...researched, id], pool: paid };
}

/** True once every tech of `era` is researched. */
function eraComplete(done: ReadonlySet<TechId>, era: Era): boolean {
  return ALL_TECHS.filter((id) => TECHS[id].era === era).every((id) => done.has(id));
}

/** The era in force: advance one step for each completed era, and stop at the last. */
export function eraOf(researched: readonly TechId[]): Era {
  const done = new Set(researched);
  let era: Era = ERAS[0] as Era;
  for (let i = 1; i < ERAS.length; i += 1) {
    if (!eraComplete(done, ERAS[i - 1] as Era)) break;
    era = ERAS[i] as Era;
  }
  return era;
}

/** The new era if researching pushed past a boundary, else `null` — for the ceremony. */
export function eraChanged(before: readonly TechId[], after: readonly TechId[]): Era | null {
  const now = eraOf(after);
  return now === eraOf(before) ? null : now;
}
