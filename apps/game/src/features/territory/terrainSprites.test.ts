/**
 * BRDC-SIGIL-002 — the isometric ground tiles, as data.
 *
 * `rasteriseTerrain` needs a canvas and is exercised in the browser; everything that
 * decides what a tile *is* is a string, and that is what these hold to.
 */
import { describe, expect, it } from 'vitest';
import { TERRAIN_KINDS, TERRAIN_PX, terrainSpriteId, terrainSvg } from './terrainSprites.js';

describe('the ground library', () => {
  it('covers every terrain the game has, and nothing else', () => {
    expect([...TERRAIN_KINDS].sort()).toEqual(
      ['coast', 'forest', 'hill', 'lake', 'market', 'marsh', 'mountain', 'plain', 'settlement'].sort(),
    );
  });

  it('names each tile after its terrain, so the layer can build the id from data', () => {
    expect(terrainSpriteId('forest')).toBe('ground-forest');
  });

  it('draws every one of them at the declared size', () => {
    for (const kind of TERRAIN_KINDS) {
      const svg = terrainSvg(kind);
      expect(svg).toContain(`width="${TERRAIN_PX}"`);
      expect(svg).toContain('viewBox="0 0 64 64"');
    }
  });

  /*
   * The construction rule from the design document, held to as a rule rather than trusted
   * to fourteen separate drawings: a top face at full colour, a left face at 42% black, a
   * right at 22%, and a hairline white top edge. If a tile stops obeying it, it stops
   * looking like it belongs to the others.
   */
  it('builds every tile on the same plinth', () => {
    for (const kind of TERRAIN_KINDS) {
      const svg = terrainSvg(kind);
      expect(svg).toContain('M32,29 L54,40 L32,51 L10,40 Z');
      expect(svg).toContain('fill-opacity=".42"');
      expect(svg).toContain('fill-opacity=".24"');
      expect(svg).toContain('stroke-opacity=".2"');
    }
  });

  // The plinth is shared; what stands on it must not be. Two terrains that draw the same
  // picture are two terrains the player cannot tell apart, which is the whole job.
  it('gives no two terrains the same tile', () => {
    expect(new Set(TERRAIN_KINDS.map(terrainSvg)).size).toBe(TERRAIN_KINDS.length);
  });

  // Decoded by an `Image`, outside the document, where neither resolves.
  it('uses no custom property and no oklch, which an Image cannot resolve', () => {
    for (const kind of TERRAIN_KINDS) {
      expect(terrainSvg(kind)).not.toContain('var(--');
      expect(terrainSvg(kind)).not.toContain('oklch');
    }
  });
});
