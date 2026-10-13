/**
 * BRDC-MIND-001 — Awakening (5) foretells an anomaly's kind; Aware (10) sees past the border.
 */
import { describe, expect, it } from 'vitest';
import { getAnomaliesFor } from './storyRepo.js';
import type { StoryDeps } from './storyRepo.js';
import { cellAt, cellsWithin } from '../geo/cells.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import type { Cell, PlayerProfile } from '../types/domain.js';

const T0 = Date.parse('2026-10-13T09:00:00Z');
const owned: Cell[] = cellsWithin(cellAt({ lat: 61.4729, lng: 23.7258 }), 6).map((h3) => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [] }));
const deps = (level: number): StoryDeps => ({
  getProfile: async () => ({ id: 'me', level, xp: 0 }) as unknown as PlayerProfile,
  getOwnedCells: async () => owned,
  getResources: async () => ({ ...EMPTY_POOL }),
  addXp: async () => undefined,
});

describe('anomalies by Consciousness', () => {
  it('a realm this size holds anomalies to read', async () => {
    expect((await getAnomaliesFor(deps(1), T0)).length).toBeGreaterThan(0);
  });

  it('Awakening is told the kind before the study; below it, nothing is', async () => {
    expect((await getAnomaliesFor(deps(4), T0)).some((a) => a.foretold)).toBe(false);
    const at5 = await getAnomaliesFor(deps(5), T0);
    expect(at5.filter((a) => a.state === 'dormant').every((a) => a.foretold)).toBe(true);
  });

  it('Aware sees past the border, as the Medium does', async () => {
    const at9 = await getAnomaliesFor(deps(9), T0);
    const at10 = await getAnomaliesFor(deps(10), T0);
    expect(at9.some((a) => a.afar)).toBe(false);
    expect(at10.length).toBeGreaterThanOrEqual(at9.length);
    expect(at10.filter((a) => !a.afar)).toHaveLength(at9.length);
  });
});
