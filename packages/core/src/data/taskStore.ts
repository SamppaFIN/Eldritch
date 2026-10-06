/**
 * The Tavern board's tasks, in the store (BRDC-QUEST-009).
 *
 * Take a task, walk, come back and finish it. An objective task finishes once the realm
 * shows it done (`rules/tasks.ts`); a skill test is faced at the board on the one dice
 * pool, costing a point of Health like any test, and its failure costs sanity. Either way
 * the ending is kept as a `QuestOutcome` — the same record a finished tale keeps
 * (BRDC-QUEST-008) — so the board shows it dimmed and sealed after a reload.
 *
 * Skill tests need an investigator, so a Season 1 save sees the objective tasks only.
 */
import { resolveCheck } from '../rules/archetype.js';
import { ALLIES } from '../rules/ally.js';
import { gainCondition } from '../rules/condition.js';
import { FIRST_INVESTIGATOR, afterTest, isHome, recover } from '../rules/investigator.js';
import type { Investigator } from '../rules/investigator.js';
import { isReady, progressOf, templeDaysSeen } from '../rules/tasks.js';
import type { Progress, Task } from '../rules/tasks.js';
import { TASKS, taskById } from '../rules/taskContent.js';
import { worksOn } from '../rules/build.js';
import type { ResourceKind, ResourceState } from '../rules/terrain.js';
import { commit } from './pouch.js';
import { writeLogEntry } from './logStore.js';
import type { QuestOutcome } from './adventureStore.js';
import { K } from './keys.js';
import { mythosToday } from './mythosStore.js';
import { mythosDice } from '../rules/doom.js';
import type { KeyValueStore } from './kv.js';
import type { Cell, H3Index, RevealedPlace } from '../types/domain.js';

interface TaskBook {
  taken: Record<string, { at: number; templeDays?: string[] }>;
  outcomes: Record<string, QuestOutcome>;
}

export interface TaskView {
  task: Task;
  state: 'open' | 'taken' | 'ready' | 'completed' | 'failed';
  progress: Progress;
  outcome?: QuestOutcome;
}

export type TaskOutcome =
  | { ok: true; outcome?: QuestOutcome }
  | { ok: false; refused: 'unknown' | 'taken' | 'not-taken' | 'not-ready' | 'no-keep' | 'home' | 'finished' };

export interface TaskApi {
  board(now: number): Promise<TaskView[]>;
  take(id: string, now: number): Promise<TaskOutcome>;
  /** Claim a finished objective, or face a skill test. */
  finish(id: string, now: number, rng?: () => number): Promise<TaskOutcome>;
  /** Collect the temple days the cells still remember — the map calls this as you walk. */
  sync(now: number): Promise<void>;
}

const EMPTY: TaskBook = { taken: {}, outcomes: {} };

export function taskApi(
  store: () => KeyValueStore,
  owned: (now: number) => Promise<readonly Cell[]>,
  places: () => Promise<readonly RevealedPlace[]>,
  addXp: (xp: number) => Promise<unknown>,
): TaskApi {
  const book = async () => (await store().get<TaskBook>(K.tasks)) ?? EMPTY;
  const hasKeep = async () => Boolean((await store().get<ResourceState>('resources'))?.keep);
  const temples = async (cells: readonly Cell[]): Promise<H3Index[]> => [
    ...(await places()).filter((p) => p.kind === 'temple').map((p) => p.h3),
    ...cells.filter((c) => worksOn(c).some((w) => w.id === 'temple-grove')).map((c) => c.h3),
  ];

  const sync = async (now: number): Promise<TaskBook> => {
    const b = await book();
    const open = Object.entries(b.taken).filter(([id]) => !b.outcomes[id] && taskById(id)?.objective.kind === 'temple');
    if (open.length === 0) return b;
    const cells = await owned(now);
    const at = await temples(cells);
    let changed = false;
    const taken = { ...b.taken };
    for (const [id, t] of open) {
      const days = [...new Set([...(t.templeDays ?? []), ...templeDaysSeen(cells, at, t.at)])];
      if (days.length !== (t.templeDays ?? []).length) {
        taken[id] = { ...t, templeDays: days };
        changed = true;
      }
    }
    if (!changed) return b;
    const next = { ...b, taken };
    await store().set(K.tasks, next);
    return next;
  };

  const close = async (b: TaskBook, task: Task, outcome: QuestOutcome, now: number) => {
    await store().set(K.tasks, { ...b, outcomes: { ...b.outcomes, [task.id]: outcome } });
    await writeLogEntry(store(), { at: now, kind: 'quest', ref: `task:${task.id}:${outcome.status}` });
  };
  /** Their ally walks with you, or offers to if one already does (BRDC-ALLY-001). */
  const befriend = async (task: Task, now: number): Promise<string> => {
    if (!task.ally || !(await hasKeep())) return '';
    const inv = recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
    if (inv.ally === task.ally) return '';
    const name = ALLIES[task.ally].name;
    if (!inv.ally) {
      await store().set(K.investigator, { ...inv, ally: task.ally });
      return ` ${name} will walk with you.`;
    }
    await store().set(K.investigator, { ...inv, allyOffer: task.ally });
    return ` ${name} offers to walk with you — answer in the Keep.`;
  };
  const pay = async (task: Task, now: number) => {
    await commit(store(), now, (cur) => {
      const pool = { ...cur.pool };
      for (const [k, v] of Object.entries(task.reward.pool) as [ResourceKind, number][]) pool[k] += v;
      return { ...cur, pool };
    });
    await addXp(task.reward.xp);
  };

  return {
    async board(now) {
      const b = await sync(now);
      const keep = await hasKeep();
      const cells = await owned(now);
      return TASKS.filter((t) => keep || t.objective.kind !== 'check').map((task): TaskView => {
        const outcome = b.outcomes[task.id];
        const taken = b.taken[task.id];
        const s = { owned: cells, since: taken?.at ?? now, templeDays: taken?.templeDays ?? [] };
        const progress = taken ? progressOf(task.objective, s) : { have: 0, need: progressOf(task.objective, s).need };
        if (outcome) return { task, state: outcome.status, progress, outcome };
        if (!taken) return { task, state: 'open', progress };
        return { task, state: isReady(task.objective, s) ? 'ready' : 'taken', progress };
      });
    },

    async take(id, now) {
      const task = taskById(id);
      if (!task) return { ok: false, refused: 'unknown' };
      if (task.objective.kind === 'check' && !(await hasKeep())) return { ok: false, refused: 'no-keep' };
      const b = await book();
      if (b.taken[id]) return { ok: false, refused: 'taken' };
      await store().set(K.tasks, { ...b, taken: { ...b.taken, [id]: { at: now } } });
      return { ok: true };
    },

    async finish(id, now, rng = Math.random) {
      const task = taskById(id);
      if (!task) return { ok: false, refused: 'unknown' };
      const b = await sync(now);
      const taken = b.taken[id];
      if (!taken) return { ok: false, refused: 'not-taken' };
      if (b.outcomes[id]) return { ok: false, refused: 'finished' };
      const o = task.objective;
      if (o.kind !== 'check') {
        if (!isReady(o, { owned: await owned(now), since: taken.at, templeDays: taken.templeDays ?? [] })) return { ok: false, refused: 'not-ready' };
        await pay(task, now);
        const outcome: QuestOutcome = { status: 'completed', rewards: task.reward, text: task.done + (await befriend(task, now)), completedAt: now };
        await close(b, task, outcome, now);
        return { ok: true, outcome };
      }
      if (!(await hasKeep())) return { ok: false, refused: 'no-keep' };
      const inv = recover((await store().get<Investigator>(K.investigator)) ?? FIRST_INVESTIGATOR(now), now);
      if (isHome(inv, now)) return { ok: false, refused: 'home' };
      const roll = resolveCheck(inv, { skill: o.skill, need: o.need }, rng, now, mythosDice(await mythosToday(store(), now), o.skill));
      const sanity = roll.pass ? 0 : (task.fail?.sanity ?? 0);
      const after = afterTest(inv, 1, sanity, now);
      await store().set(K.investigator, !roll.pass && task.fail?.condition ? gainCondition(after, task.fail.condition, now) : after);
      if (roll.pass) await pay(task, now);
      const outcome: QuestOutcome = roll.pass
        ? { status: 'completed', rewards: task.reward, text: task.done + (await befriend(task, now)), completedAt: now }
        : { status: 'failed', rewards: { xp: 0, pool: {} }, text: task.fail?.text ?? 'It did not go your way.', completedAt: now };
      await close(b, task, outcome, now);
      return { ok: true, outcome };
    },

    async sync(now) {
      await sync(now);
    },
  };
}
