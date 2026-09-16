import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enableWorldseed, hexSeedOf } from './hexSeedStore.js';
import { cellAt } from '../geo/cells.js';
import { HARMALA_STATUE } from '../rules/terrainSeed.js';
import harmala from './seed/harmala.json' with { type: 'json' };

const STATUE_HEX = cellAt(HARMALA_STATUE);
const OUTSIDE_HEX = cellAt({ lat: 60.1699, lng: 24.9384 }); // Helsinki

beforeAll(() => enableWorldseed(true));
afterAll(() => enableWorldseed(false));

describe('hexSeedOf', () => {
  it('is null when the data is off', () => {
    enableWorldseed(false);
    expect(hexSeedOf(STATUE_HEX)).toBeNull();
    enableWorldseed(true);
  });

  it('is null for a hex no area covers', () => {
    expect(hexSeedOf(OUTSIDE_HEX)).toBeNull();
  });

  it("reads the statue's own hex from the built file, landmark and all", () => {
    const built = (harmala as { hexes: Record<string, { terrain: string; landmark?: { name: string } }> })
      .hexes[STATUE_HEX];
    expect(built).toBeDefined(); // the built area really does cover the confirmed statue

    const seed = hexSeedOf(STATUE_HEX);
    expect(seed).not.toBeNull();
    expect(seed!.h3).toBe(STATUE_HEX);
    expect(seed!.terrain).toBe(built!.terrain);
    expect(seed!.landmark?.name).toBe(built!.landmark?.name);
  });

  it('carries a resource id where the build placed a deposit', () => {
    const withResource = Object.entries(
      (harmala as { hexes: Record<string, { resource?: { id: string } }> }).hexes,
    ).find(([, h]) => h.resource);
    expect(withResource).toBeDefined();
    const [h3, hex] = withResource!;
    expect(hexSeedOf(h3)?.resource?.id).toBe(hex.resource!.id);
  });
});
