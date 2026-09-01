import { describe, expect, it } from 'vitest';
import { cellAt, neighboursOf } from '../geo/cells.js';
import { EMPTY_POOL } from './terrain.js';
import type { ResourcePool } from './terrain.js';
import { revealOf } from './reveal.js';
import {
  ANOMALY_INVESTIGATE_COST,
  ANOMALY_INVESTIGATE_MS,
  anomalyAt,
  beginInvestigation,
  investigationProgress,
  isResolved,
  resolveReward,
} from './anomaly.js';
import type { Cell } from '../types/domain.js';

/** A wide patch of real cells, grown outward. */
function sample(n = 3000): string[] {
  const start = cellAt({ lat: 62.6, lng: 25.7 });
  const seen = new Set<string>([start]);
  const queue = [start];
  while (seen.size < n && queue.length) {
    for (const nb of neighboursOf(queue.shift() as string)) {
      if (!seen.has(nb)) {
        seen.add(nb);
        queue.push(nb);
      }
    }
  }
  return [...seen];
}

const CELLS = sample();
const RARE = CELLS.filter((h) => revealOf(h) === 'rare');
const PLAIN = CELLS.find((h) => revealOf(h) !== 'rare') as string;

const cell = (h3: string, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: 'me',
  strength: 100,
  lastVisitedAt: 0,
  visitDays: [],
  ...over,
});
const rich = (): ResourcePool => ({ ...EMPTY_POOL, food: 100 });

describe('anomalyAt', () => {
  it('only fires on a rare cell', () => {
    expect(RARE.length).toBeGreaterThan(0);
    expect(anomalyAt(PLAIN)).toBeNull();
    for (const h of RARE.slice(0, 20)) expect(anomalyAt(h)).not.toBeNull();
  });

  it('splits rare sites into reward and chain, stably', () => {
    const kinds = RARE.slice(0, 60).map((h) => anomalyAt(h));
    expect(kinds).toContain('reward');
    expect(kinds).toContain('chain');
    for (const h of RARE.slice(0, 10)) expect(anomalyAt(h)).toBe(anomalyAt(h));
  });
});

describe('investigationProgress', () => {
  const h = RARE[0] as string;

  it('is 0 before an investigation starts', () => {
    expect(investigationProgress(cell(h), 10_000)).toBe(0);
  });

  it('runs from 0 to 1 over ANOMALY_INVESTIGATE_MS, then clamps', () => {
    const started = cell(h, { anomaly: { startedAt: 1_000 } });
    expect(investigationProgress(started, 1_000)).toBe(0);
    expect(investigationProgress(started, 1_000 + ANOMALY_INVESTIGATE_MS / 2)).toBeCloseTo(0.5);
    expect(investigationProgress(started, 1_000 + ANOMALY_INVESTIGATE_MS)).toBe(1);
    expect(investigationProgress(started, 1_000 + ANOMALY_INVESTIGATE_MS * 5)).toBe(1);
    expect(isResolved(started, 1_000 + ANOMALY_INVESTIGATE_MS)).toBe(true);
  });
});

describe('beginInvestigation', () => {
  const h = RARE[0] as string;

  it('spends the cost and stamps the cell, without mutating the pool', () => {
    const pool = rich();
    const r = beginInvestigation(cell(h), pool, 5_000);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cell.anomaly).toEqual({ startedAt: 5_000 });
    expect(r.pool.food).toBe(100 - (ANOMALY_INVESTIGATE_COST.food ?? 0));
    expect(pool.food).toBe(100); // untouched
  });

  it('refuses each way by name', () => {
    expect(beginInvestigation(cell(PLAIN), rich(), 0)).toEqual({ ok: false, refused: 'not-anomaly' });
    expect(beginInvestigation(cell(h, { anomaly: { startedAt: 1 } }), rich(), 0)).toEqual({
      ok: false,
      refused: 'in-progress',
    });
    expect(beginInvestigation(cell(h, { anomaly: { startedAt: 1, done: true } }), rich(), 0)).toEqual({
      ok: false,
      refused: 'already-resolved',
    });
    expect(beginInvestigation(cell(h), EMPTY_POOL, 0)).toEqual({ ok: false, refused: 'cannot-afford' });
  });
});

describe('resolveReward', () => {
  it('is deterministic per index and modest', () => {
    for (const h of RARE.slice(0, 20)) {
      const a = resolveReward(h);
      const b = resolveReward(h);
      expect(a).toEqual(b);
      const [amount] = Object.values(a.pool);
      expect(amount).toBeGreaterThanOrEqual(20);
      expect(amount).toBeLessThanOrEqual(50);
      expect(a.xp).toBeGreaterThanOrEqual(15);
      expect(a.xp).toBeLessThanOrEqual(40);
    }
  });
});
