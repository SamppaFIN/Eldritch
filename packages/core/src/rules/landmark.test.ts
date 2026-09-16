/**
 * BRDC-LANDMARK-001 — a landmark hex pays culture the moment it is held, no reveal needed.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LANDMARK_CULTURE_PER_HOUR, landmarkBonus, landmarkOn } from './landmark.js';
import { enableWorldseed } from '../data/hexSeedStore.js';
import { cellAt } from '../geo/cells.js';
import harmala from '../data/seed/harmala.json' with { type: 'json' };
import type { Cell, H3Index } from '../types/domain.js';

const T0 = Date.parse('2026-09-16T12:00:00Z');
const OUTSIDE_HEX = cellAt({ lat: 60.1699, lng: 24.9384 }); // Helsinki

// The real hex the build placed the statue's landmark on (BRDC-SEED-002 matched it to the
// OSM sculpture node, a few metres from HARMALA_STATUE itself — close enough to be the
// same statue, not always close enough to share an H3 res-11 hex, which is ~25 m across).
const hexes = harmala.hexes as Record<string, { landmark?: { name: string } }>;
const STATUE_HEX = Object.entries(hexes).find(([, h]) => h.landmark?.name === 'Statue of the Boy')![0] as H3Index;
const BARE_HEX = Object.entries(hexes).find(([, h]) => !h.landmark)![0] as H3Index;

const cell = (h3: H3Index, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: 'me',
  strength: 300,
  lastVisitedAt: T0,
  visitDays: [],
  ...over,
});

beforeAll(() => enableWorldseed(true));
afterAll(() => enableWorldseed(false));

describe('landmarkOn', () => {
  it('is null when the data is off', () => {
    enableWorldseed(false);
    expect(landmarkOn(STATUE_HEX)).toBeNull();
    enableWorldseed(true);
  });

  it('is null for a hex no area covers', () => {
    expect(landmarkOn(OUTSIDE_HEX)).toBeNull();
  });

  it('names the real place at its built hex', () => {
    const l = landmarkOn(STATUE_HEX);
    expect(l).not.toBeNull();
    expect(l!.name).toBe('Statue of the Boy');
    expect(l!.lore.length).toBeGreaterThan(0);
  });

  it('is null for a seeded hex the build gave no landmark', () => {
    expect(landmarkOn(BARE_HEX)).toBeNull();
  });
});

describe('landmarkBonus', () => {
  it('pays LANDMARK_CULTURE_PER_HOUR for a held, awake landmark hex', () => {
    expect(landmarkBonus([cell(STATUE_HEX)], T0)).toEqual({ culture: LANDMARK_CULTURE_PER_HOUR });
  });

  it('pays nothing for a hex with no landmark', () => {
    expect(landmarkBonus([cell(BARE_HEX)], T0)).toEqual({});
    expect(landmarkBonus([cell(OUTSIDE_HEX)], T0)).toEqual({});
  });

  it('pays nothing on a hex nobody has walked in two days', () => {
    const stale = cell(STATUE_HEX, { lastVisitedAt: T0 - 90 * 3_600_000 });
    expect(landmarkBonus([stale], T0)).toEqual({});
  });

  it('needs no reveal — a landmark is not a secret', () => {
    // landmarkBonus takes no `revealed` map at all, unlike bountyBonus; this is the
    // behavioural proof rather than a type-level one.
    expect(landmarkBonus([cell(STATUE_HEX)], T0)).not.toEqual({});
  });

  it('sums across multiple landmark hexes', () => {
    const other = Object.entries(hexes).find(([h3, h]) => h.landmark && h3 !== STATUE_HEX)![0] as H3Index;
    const bonus = landmarkBonus([cell(STATUE_HEX), cell(other)], T0);
    expect(bonus).toEqual({ culture: LANDMARK_CULTURE_PER_HOUR * 2 });
  });
});
