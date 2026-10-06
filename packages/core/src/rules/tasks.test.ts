/** BRDC-QUEST-009 — the task engine reads every objective from the realm as it stands. */
import { describe, expect, it } from 'vitest';
import { isReady, progressOf, templeDaysSeen } from './tasks.js';
import { TASKS } from './taskContent.js';
import { DECKS } from './deck.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-06T12:00:00Z');
const H = 3_600_000;
const cell = (h3: string, over: Partial<Cell> = {}): Cell => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0 - H, visitDays: [], ...over });
const state = (owned: Cell[], templeDays: string[] = []) => ({ owned, since: T0, templeDays });

describe('progressOf', () => {
  it('visit: counts hexes walked since the task was taken, capped at the goal', () => {
    const owned = [cell('a', { lastVisitedAt: T0 + H }), cell('b', { lastVisitedAt: T0 + 2 * H }), cell('c')];
    expect(progressOf({ kind: 'visit', count: 5 }, state(owned))).toEqual({ have: 2, need: 5 });
    expect(progressOf({ kind: 'visit', count: 1 }, state(owned))).toEqual({ have: 1, need: 1 });
  });

  it('build: a Work of that kind raised since taking it — an older one does not count', () => {
    const old = cell('a', { buildings: [{ id: 'farm', builtAt: T0 - H }] });
    expect(progressOf({ kind: 'build', id: 'farm' }, state([old])).have).toBe(0);
    const fresh = cell('b', { buildings: [{ id: 'farm', builtAt: T0 + H }] });
    expect(isReady({ kind: 'build', id: 'farm' }, state([old, fresh]))).toBe(true);
  });

  it('investigate: anomalies begun since taking it', () => {
    const owned = [cell('a', { anomaly: { startedAt: T0 + H } }), cell('b', { anomaly: { startedAt: T0 - H } })];
    expect(progressOf({ kind: 'investigate', count: 2 }, state(owned))).toEqual({ have: 1, need: 2 });
  });

  it('temple: distinct days collected', () => {
    expect(progressOf({ kind: 'temple', days: 2 }, state([], ['2026-10-06', '2026-10-06']))).toEqual({ have: 1, need: 2 });
    expect(isReady({ kind: 'temple', days: 2 }, state([], ['2026-10-06', '2026-10-07']))).toBe(true);
  });

  it('check: never ready by itself — it is faced at the board', () => {
    expect(isReady({ kind: 'check', skill: 'lore', need: 1 }, state([]))).toBe(false);
  });
});

describe('templeDaysSeen', () => {
  it('reads the days a temple hex remembers, from the day the task was taken', () => {
    const owned = [cell('t', { visitDays: ['2026-10-05', '2026-10-06'] }), cell('x', { visitDays: ['2026-10-06'] })];
    expect(templeDaysSeen(owned, ['t'], T0)).toEqual(['2026-10-06']);
    expect(templeDaysSeen(owned, ['t'], T0 - 24 * H)).toEqual(['2026-10-05', '2026-10-06']);
  });
});

describe('content', () => {
  it('ten tasks, every kind of objective, every test with a way to fail', () => {
    expect(TASKS).toHaveLength(10);
    expect(new Set(TASKS.map((t) => t.id)).size).toBe(10);
    expect(new Set(TASKS.map((t) => t.objective.kind))).toEqual(new Set(['visit', 'build', 'investigate', 'temple', 'check']));
    for (const t of TASKS.filter((x) => x.objective.kind === 'check')) expect(t.fail?.sanity).toBeGreaterThan(0);
  });

  it('ten more mysteries in the decks, each with a pass and a cost', () => {
    expect(DECKS).toHaveLength(34);
    for (const c of DECKS.slice(24)) expect((c.fail.sanity ?? 0) + (c.fail.stamina ?? 0)).toBeGreaterThan(0);
  });
});
