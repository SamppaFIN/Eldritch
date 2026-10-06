/**
 * Tasks on the Tavern's board (BRDC-QUEST-009, handoff F-42): an objective read from the
 * realm as it stands, never a counter a step has to remember to bump.
 *
 * Five kinds — walk N of your hexes, raise a Work, begin studying anomalies, keep a temple
 * on N different days, face a skill test at the board. Everything counts from the moment
 * the task was taken. Temple days are the one thing a cell does not keep (it remembers
 * yesterday and today only), so the task book collects them as it syncs (`taskStore.ts`).
 *
 * Pure. The content is `taskContent.ts`; the dice are `resolveCheck`'s.
 */
import { worksOn } from './build.js';
import type { BuildingId } from './build.js';
import type { Skill } from './investigator.js';
import type { AllyId } from './ally.js';
import type { ConditionId } from './condition.js';
import type { ArchetypeId } from './archetype.js';
import type { ResourcePool } from './terrain.js';
import type { Cell, H3Index } from '../types/domain.js';

export type Objective =
  | { kind: 'visit'; count: number }
  | { kind: 'build'; id: BuildingId }
  | { kind: 'investigate'; count: number }
  | { kind: 'temple'; days: number }
  | { kind: 'check'; skill: Skill; need: number };

export interface Task {
  id: string;
  title: string;
  /** Who pinned it to the board. */
  giver: string;
  text: string;
  objective: Objective;
  reward: { xp: number; pool: Partial<ResourcePool> };
  /** The page read on completing it. */
  done: string;
  /** A test's other ending, and what it costs. */
  fail?: { text: string; sanity: number; condition?: ConditionId };
  /** Who walks with you after it (BRDC-ALLY-001) — a Season 2 realm's investigator only. */
  ally?: AllyId;
  /** An investigator's own tale (BRDC-INVEST-002): whose, the step before, and the last step. */
  personal?: ArchetypeId;
  after?: string;
  finale?: true;
}

export interface TaskState {
  owned: readonly Cell[];
  /** When the task was taken. */
  since: number;
  /** Temple days collected since then (`YYYY-MM-DD`). */
  templeDays: readonly string[];
}

export interface Progress {
  have: number;
  need: number;
}

/** How far along a task is. A skill test is never "ready" — it is faced at the board. */
export function progressOf(o: Objective, s: TaskState): Progress {
  switch (o.kind) {
    case 'visit':
      return { have: Math.min(o.count, s.owned.filter((c) => c.lastVisitedAt >= s.since).length), need: o.count };
    case 'build':
      return { have: s.owned.some((c) => worksOn(c).some((w) => w.id === o.id && w.builtAt >= s.since)) ? 1 : 0, need: 1 };
    case 'investigate':
      return { have: Math.min(o.count, s.owned.filter((c) => c.anomaly && c.anomaly.startedAt >= s.since).length), need: o.count };
    case 'temple':
      return { have: Math.min(o.days, new Set(s.templeDays).size), need: o.days };
    case 'check':
      return { have: 0, need: 1 };
  }
}

export const isReady = (o: Objective, s: TaskState): boolean => {
  const p = progressOf(o, s);
  return o.kind !== 'check' && p.have >= p.need;
};

/** The days a temple hex was walked, as far as its cell remembers, from `since` on. */
export function templeDaysSeen(owned: readonly Cell[], temples: readonly H3Index[], since: number): string[] {
  const from = new Date(since).toISOString().slice(0, 10);
  const at = new Set(temples);
  return [...new Set(owned.filter((c) => at.has(c.h3)).flatMap((c) => c.visitDays).filter((d) => d >= from))];
}
