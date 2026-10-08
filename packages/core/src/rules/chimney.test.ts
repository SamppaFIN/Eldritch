/** BRDC-CHIMNEY-001 — three chimneys around Härmälä: landmarks each, beacons together. */
import { describe, expect, it } from 'vitest';
import { CHIMNEYS, chimneyAt, chimneysLit } from './chimney.js';
import { landmarkBonus, landmarkOn } from './landmark.js';
import { hexDistance } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const NOW = Date.parse('2026-10-08T12:00:00Z');
const cell = (h3: string): Cell => ({ h3, ownerId: 'me', strength: 100, lastVisitedAt: NOW, visitDays: [] });

describe('the chimneys', () => {
  it('stand on three different hexes within a walk of the statue', () => {
    expect(new Set(CHIMNEYS.map((c) => c.h3)).size).toBe(3);
    for (const c of CHIMNEYS) expect(hexDistance(c.h3, CHIMNEYS[0]?.h3 as string)).toBeLessThan(40);
  });
  it('are landmarks: holding one pays culture', () => {
    const one = CHIMNEYS[0]?.h3 as string;
    expect(landmarkOn(one)?.name).toBe('Finlayson Chimney');
    expect(chimneyAt(one)?.id).toBe('finlayson');
    expect(landmarkBonus([cell(one)], NOW).culture).toBeGreaterThan(0);
  });
  it('light only when all three are held', () => {
    const two = CHIMNEYS.slice(0, 2).map((c) => cell(c.h3));
    expect(chimneysLit(two)).toBe(false);
    expect(chimneysLit([...two, cell(CHIMNEYS[2]?.h3 as string)])).toBe(true);
  });
});
