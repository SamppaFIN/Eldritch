import { describe, expect, it } from 'vitest';
import { BUILDINGS } from '@es3/core';
import type { BuildingId } from '@es3/core';
import { BUILDING_ROLE, buildingGlyph } from './buildingGlyphs.js';

const ALL = Object.keys(BUILDINGS) as BuildingId[];

describe('buildingGlyph', () => {
  it('every building has a role, a glyph and a hex colour', () => {
    for (const id of ALL) {
      expect(BUILDING_ROLE[id]).toBeDefined();
      const g = buildingGlyph(id);
      expect(g.char).toBeTruthy();
      expect(g.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('the five roles each map to their own glyph', () => {
    expect(buildingGlyph('sawmill').char).toBe('⚒'); // produce
    expect(buildingGlyph('storehouse').char).toBe('▤'); // store
    expect(buildingGlyph('library').char).toBe('❋'); // knowledge
    expect(buildingGlyph('fortress').char).toBe('▣'); // defence
    expect(buildingGlyph('monument').char).toBe('❦'); // culture
  });

  it('a chain and its upgrade read the same', () => {
    expect(buildingGlyph('sawmill')).toEqual(buildingGlyph('lumbermill'));
    expect(buildingGlyph('mine')).toEqual(buildingGlyph('quarry'));
  });
});
