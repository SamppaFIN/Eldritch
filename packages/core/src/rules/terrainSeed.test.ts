import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cellAt } from '../geo/cells.js';
import { resourceOf, terrainForCell, terrainOf } from './terrain.js';
import { enableTerrainSurvey, seededTerrainOf } from './terrainSeed.js';
import type { Cell } from '../types/domain.js';

const at = (lat: number, lng: number) => cellAt({ lat, lng });

// The survey is off by default so the rest of the suite stays location-agnostic; this
// file is the one that opts in.
beforeAll(() => enableTerrainSurvey(true));
afterAll(() => enableTerrainSurvey(false));

describe('seededTerrainOf', () => {
  it('is null when the survey is off', () => {
    enableTerrainSurvey(false);
    expect(seededTerrainOf(at(61.4749, 23.7351))).toBeNull();
    enableTerrainSurvey(true);
  });

  it('is null everywhere outside the surveyed box', () => {
    expect(seededTerrainOf(at(60.1699, 24.9384))).toBeNull(); // Helsinki
    expect(seededTerrainOf(at(61.4979, 23.7609))).toBeNull(); // central Tampere
  });

  it('reads the Pyhäjärvi water as a lake', () => {
    expect(seededTerrainOf(at(61.4749, 23.7351))).toEqual({ kind: 'lake', source: 'seed' });
  });

  it('reads the statue block as a market — a shop and a bar are there', () => {
    expect(seededTerrainOf(at(61.4729, 23.7263))).toEqual({ kind: 'market', source: 'seed' });
  });

  it('a shore cell reads coast, not the lake it sits beside — order matters', () => {
    expect(seededTerrainOf(at(61.4753, 23.7272))).toEqual({ kind: 'coast', source: 'seed' });
  });

  it('a cell inside the box matching no region is surveyed plain', () => {
    expect(seededTerrainOf(at(61.469, 23.72))).toEqual({ kind: 'plain', source: 'seed' });
  });
});

describe('the survey feeds the rest of the terrain rules', () => {
  it('terrainOf returns the surveyed value in the box', () => {
    expect(terrainOf(at(61.4749, 23.7351)).source).toBe('seed');
  });

  it('a lake cell yields food through resourceOf', () => {
    expect(resourceOf(at(61.4749, 23.7351))).toBe('food');
  });

  it('the survey beats a stored tile terrain on the same cell', () => {
    const h3 = at(61.4729, 23.7263); // market by survey
    const cell: Cell = {
      h3,
      ownerId: 'me',
      strength: 100,
      lastVisitedAt: 0,
      visitDays: [],
      terrain: { kind: 'mountain', source: 'tiles' },
    };
    expect(terrainForCell(cell)).toEqual({ kind: 'market', source: 'seed' });
  });

  it('leaves a cell outside the box to its stored terrain', () => {
    const h3 = at(60.1699, 24.9384);
    const cell: Cell = {
      h3,
      ownerId: 'me',
      strength: 100,
      lastVisitedAt: 0,
      visitDays: [],
      terrain: { kind: 'forest', source: 'tiles' },
    };
    expect(terrainForCell(cell)).toEqual({ kind: 'forest', source: 'tiles' });
  });
});
