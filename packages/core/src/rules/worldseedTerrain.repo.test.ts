/**
 * BRDC-SEED-004 — the built Worldseed data feeds terrainOf/terrainForCell, and at the
 * right tier: above the older hand survey (BRDC-TERRAIN-003) wherever they overlap, but
 * never over a cell's own already-stored terrain. Same shape as `terrainSeed.test.ts`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cellAt } from '../geo/cells.js';
import { TERRAIN_TABLE, resourceOf, terrainForCell, terrainOf } from './terrain.js';
import { enableTerrainSurvey, HARMALA_STATUE } from './terrainSeed.js';
import { enableWorldseed, hexSeedOf } from '../data/hexSeedStore.js';
import type { Cell } from '../types/domain.js';

const STATUE_HEX = cellAt(HARMALA_STATUE);
const OUTSIDE_HEX = cellAt({ lat: 60.1699, lng: 24.9384 }); // Helsinki

beforeAll(() => enableWorldseed(true));
afterAll(() => enableWorldseed(false));

describe('terrainOf reads the built Worldseed data', () => {
  it('returns the seeded terrain, source "seed", for the confirmed statue hex', () => {
    const built = hexSeedOf(STATUE_HEX)!;
    expect(terrainOf(STATUE_HEX)).toEqual({ kind: built.terrain, source: 'seed' });
  });

  it('wins over the older hand survey in the area both cover', () => {
    // enableTerrainSurvey stacks with enableWorldseed for this one check — both are real
    // app-boot flags at once, and Worldseed must still come first.
    enableTerrainSurvey(true);
    expect(terrainOf(STATUE_HEX).source).toBe('seed');
    enableTerrainSurvey(false);
  });

  it('is untouched outside any seeded area', () => {
    expect(terrainOf(OUTSIDE_HEX).source).not.toBe('seed');
  });

  it('feeds resourceOf through the same path as any other terrain', () => {
    const built = hexSeedOf(STATUE_HEX)!;
    expect(resourceOf(STATUE_HEX)).toBe(TERRAIN_TABLE[built.terrain].resource);
  });
});

describe('terrainForCell', () => {
  it('reads the seed for a cell with no stored terrain of its own', () => {
    const built = hexSeedOf(STATUE_HEX)!;
    const cell: Cell = { h3: STATUE_HEX, ownerId: 'me', strength: 100, lastVisitedAt: 0, visitDays: [] };
    expect(terrainForCell(cell)).toEqual({ kind: built.terrain, source: 'seed' });
  });

  // `Cell.terrain` is a cached `source: 'tiles'` read (BRDC-TERRAIN-002), not the "player
  // has modified this ground" signal the ticket's "never overwrite" rule means (that is
  // ownership/history, BRDC-HEX-001, which terrainForCell never touches at all — it only
  // computes an answer, it does not write one). A hand-verified answer beating a raw tile
  // cache is the same rule `seededTerrainOf` already lives by (its own test: "the survey
  // beats a stored tile terrain on the same cell") — Worldseed follows it too, on purpose.
  it('beats a stored tile-read terrain, the same way the older survey already does', () => {
    const cell: Cell = {
      h3: STATUE_HEX,
      ownerId: 'me',
      strength: 100,
      lastVisitedAt: 0,
      visitDays: [],
      terrain: { kind: 'mountain', source: 'tiles' },
    };
    const built = hexSeedOf(STATUE_HEX)!;
    expect(terrainForCell(cell)).toEqual({ kind: built.terrain, source: 'seed' });
  });

  it('leaves a cell outside every seeded area exactly as before', () => {
    const cell: Cell = {
      h3: OUTSIDE_HEX,
      ownerId: 'me',
      strength: 100,
      lastVisitedAt: 0,
      visitDays: [],
      terrain: { kind: 'forest', source: 'tiles' },
    };
    expect(terrainForCell(cell)).toEqual({ kind: 'forest', source: 'tiles' });
  });
});
