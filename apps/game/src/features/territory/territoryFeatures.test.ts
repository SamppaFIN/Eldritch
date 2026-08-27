import { describe, expect, it } from 'vitest';
import { cellAt } from '@es3/core';
import type { Cell } from '@es3/core';
import {
  CONTESTED_BELOW,
  OWN_FILL,
  cellProperties,
  cellToFeature,
  cellsToGeoJson,
  hueFor,
} from './territoryFeatures.js';

const ME = 'me';
const RIVAL = 'the-pale-warden';
const OTHER = 'choir-of-small-hours';
const H3 = cellAt({ lat: 61.47290805294704, lng: 23.725882485862012 });

function cell(owner: string | null, strength: number, h3 = H3): Cell {
  return { h3, ownerId: owner, strength, lastVisitedAt: 0, visitDays: [] };
}

describe('ownership colour', () => {
  it('paints my ground in the palette', () => {
    expect(cellProperties(cell(ME, 200), ME).color).toBe(OWN_FILL);
    expect(cellProperties(cell(ME, 200), ME).mine).toBe(true);
  });

  it('gives each rival their own hue', () => {
    const a = cellProperties(cell(RIVAL, 200), ME).color;
    const b = cellProperties(cell(OTHER, 200), ME).color;
    expect(a).not.toBe(b);
    expect(a).not.toBe(OWN_FILL);
  });

  it('keeps a rival the same colour between sessions', () => {
    // Derived from the id, not stored, so nothing has to be persisted or synced.
    expect(hueFor(RIVAL)).toBe(hueFor(RIVAL));
  });

  it('keeps rival colours inside the palette', () => {
    // A neighbourhood of fully saturated hues stops reading as the same world.
    // Only the hue moves; lightness and saturation are fixed.
    for (const id of [RIVAL, OTHER, 'x', 'a-very-long-player-identifier-indeed']) {
      expect(hueFor(id)).toMatch(/^hsl\(\d{1,3}, 38%, 42%\)$/);
    }
  });

  it('draws released ground as available, not as somebody else\'s', () => {
    // A cell the Void has taken back is unowned. Giving it a generated hue would
    // make free ground look like a rival's territory.
    const free = cellProperties(cell(null, 0), ME);
    expect(free.color).toBe(OWN_FILL);
    expect(free.mine).toBe(false);
  });

  it('is not mine when nobody is signed in', () => {
    expect(cellProperties(cell(ME, 200), null).mine).toBe(false);
  });
});

describe('contested', () => {
  it('marks a cell that has been walked on', () => {
    expect(cellProperties(cell(RIVAL, CONTESTED_BELOW - 1), ME).contested).toBe(true);
  });

  it('leaves a cell at base strength alone', () => {
    expect(cellProperties(cell(RIVAL, CONTESTED_BELOW), ME).contested).toBe(false);
  });

  it('marks my own ground too when it is under attack', () => {
    // Being told that someone is chipping at your home block is the point.
    expect(cellProperties(cell(ME, 40), ME).contested).toBe(true);
  });

  it('never marks unowned ground', () => {
    expect(cellProperties(cell(null, 0), ME).contested).toBe(false);
  });
});

describe('strength is carried through for the paint expression', () => {
  it('passes the value the fill opacity interpolates on', () => {
    for (const strength of [0, 50, 100, 300, 500]) {
      expect(cellProperties(cell(ME, strength), ME).strength).toBe(strength);
    }
  });

  it('distinguishes a fading cell from a strong one', () => {
    const weak = cellProperties(cell(ME, 50), ME).strength;
    const strong = cellProperties(cell(ME, 500), ME).strength;
    expect(weak).toBeLessThan(strong);
  });
});

describe('geometry', () => {
  it('emits a closed ring in GeoJSON order', () => {
    const feature = cellToFeature(cell(ME, 100), ME);
    const ring = feature.geometry.coordinates[0] as Array<[number, number]>;

    expect(ring.length).toBeGreaterThanOrEqual(6);
    for (const [lng, lat] of ring) {
      // [lng, lat], not [lat, lng]. The wrong order draws the whole territory off
      // the coast of Africa without raising anything.
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
      expect(lng).toBeCloseTo(23.72, 0);
      expect(lat).toBeCloseTo(61.47, 0);
    }
  });

  it('uses the cell index as the feature id', () => {
    expect(cellToFeature(cell(ME, 100), ME).id).toBe(H3);
  });
});

describe('cellsToGeoJson', () => {
  it('maps a set', () => {
    const collection = cellsToGeoJson([cell(ME, 100), cell(RIVAL, 200)], ME);
    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(2);
    expect(collection.features[0]?.properties.mine).toBe(true);
    expect(collection.features[1]?.properties.mine).toBe(false);
  });

  it('handles an empty set', () => {
    expect(cellsToGeoJson([], ME)).toEqual({ type: 'FeatureCollection', features: [] });
  });
});
