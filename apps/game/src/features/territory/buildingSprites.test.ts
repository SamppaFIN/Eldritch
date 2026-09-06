/**
 * BRDC-ART-003 — every Work has a sprite, and the icon features fan a cluster.
 *
 * The rasterisation itself needs a real canvas (Playwright), so this covers the pure
 * parts: an SVG string per building, and one point per Work with a distinct slot.
 */
import { describe, expect, it } from 'vitest';
import { BUILDINGS } from '@es3/core';
import type { BuildingId, Cell } from '@es3/core';
import { SPRITE_PX, spriteId, spriteSvg } from './buildingSprites.js';
import { buildingIconFeatures } from './buildingIconFeatures.js';

const ALL = Object.keys(BUILDINGS) as BuildingId[];
const T0 = Date.parse('2026-09-06T12:00:00Z');
const cell = (h3: string, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: 'me',
  strength: 300,
  lastVisitedAt: T0,
  visitDays: [],
  ...over,
});

describe('buildingSprites', () => {
  it('renders a sized SVG for every building', () => {
    for (const id of ALL) {
      const svg = spriteSvg(id);
      expect(svg.startsWith('<svg'), id).toBe(true);
      expect(svg).toContain(`width="${SPRITE_PX}"`);
      // The shared iso block is always present; the cap adds the distinguishing shape.
      expect(svg).toContain('M32 20 L52 31 L32 42 L12 31 Z');
    }
  });

  it('gives each building its own stable image id', () => {
    const ids = ALL.map(spriteId);
    expect(new Set(ids).size).toBe(ALL.length);
    expect(spriteId('sawmill')).toBe('work-sawmill');
  });
});

describe('buildingIconFeatures', () => {
  it('emits one point per Work, each with its slot and the cluster size', () => {
    const cells = [
      cell('a', { buildings: [{ id: 'granary', builtAt: T0 }] }),
      cell('b', {
        buildings: (['sawmill', 'storehouse', 'monument'] as BuildingId[]).map((id) => ({
          id,
          builtAt: T0,
        })),
      }),
      cell('c'), // bare — contributes nothing
    ];
    const fc = buildingIconFeatures(cells, 'me');
    expect(fc.features).toHaveLength(4);

    const b = fc.features.filter((f) => f.properties.count === 3);
    expect(b.map((f) => f.properties.slot).sort()).toEqual([0, 1, 2]);
    expect(b.map((f) => f.properties.sprite)).toContain('work-sawmill');
  });

  it('marks a rival cell not-mine, so the layer can dim it', () => {
    const fc = buildingIconFeatures(
      [cell('r', { ownerId: 'rival', buildings: [{ id: 'fortress', builtAt: T0 }] })],
      'me',
    );
    expect(fc.features[0]?.properties.mine).toBe(false);
  });
});
