/**
 * BRDC-WORLD-001 — the designed Härmälä, shifted onto the real statue, read back per hex.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { designedTerrainOf, enableDesignedTerrain } from './harmalaDesign.js';
import design from './seed/harmala.design.json' with { type: 'json' };
import table from './seed/harmala.design-terrain.json' with { type: 'json' };
import { cellAt } from '../geo/cells.js';
import { terrainOf } from '../rules/terrain.js';

const REAL_STATUE = { lat: 61.472883311234405, lng: 23.726056773550532 };
const shifted = (p: { lat: number; lng: number }) => ({ lat: p.lat + table.shift.lat, lng: p.lng + table.shift.lng });

describe('the Härmälä map from Claude Design', () => {
  beforeAll(() => enableDesignedTerrain(true));
  afterAll(() => enableDesignedTerrain(false));

  it('is shifted so its own statue lands on the real one', () => {
    const statue = design.pois.find((p) => p.name === 'Statue of the Boy') as { lat: number; lng: number };
    const at = shifted(statue);
    expect(at.lat).toBeCloseTo(REAL_STATUE.lat, 9);
    expect(at.lng).toBeCloseTo(REAL_STATUE.lng, 9);
  });

  it('gives a design hex its own terrain at its shifted centre, for every kind it uses', () => {
    const kinds = new Set(design.hexes.map((h) => h.terrain));
    for (const kind of kinds) {
      // A fine hex of this kind, if there is one, else a coarse one: its centre is its own.
      const hex = design.hexes.find((h) => h.terrain === kind && h.res === 11) ?? design.hexes.find((h) => h.terrain === kind);
      expect(designedTerrainOf(cellAt(shifted(hex as { lat: number; lng: number }))), kind).toEqual({ kind, source: 'seed' });
    }
  });

  it('wins the terrain chain inside the drawn area, and says nothing outside it', () => {
    const statue = cellAt(REAL_STATUE);
    expect(terrainOf(statue)).toEqual(designedTerrainOf(statue));
    expect(designedTerrainOf(cellAt({ lat: 60.1699, lng: 24.9384 }))).toBeNull(); // Helsinki
  });

  it('is silent while switched off, as the core tests have it', () => {
    enableDesignedTerrain(false);
    expect(designedTerrainOf(cellAt(REAL_STATUE))).toBeNull();
    enableDesignedTerrain(true);
  });
});
