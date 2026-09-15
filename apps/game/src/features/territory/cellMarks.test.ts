import { describe, expect, it } from 'vitest';
import { cellAt } from '@es3/core';
import type { Cell } from '@es3/core';
import { cellsToGeoJson } from './cellMarks.js';

/**
 * The map's GeoJSON builders (BRDC-SIGIL-006).
 *
 * Moved out of `territoryFeatures.test.ts` with the function itself, when the builders
 * went to `cellMarks.ts` — tests live beside what they test.
 */
const ME = 'me';
const RIVAL = 'the-pale-warden';
const H3 = cellAt({ lat: 61.47290805294704, lng: 23.725882485862012 });

function cell(owner: string | null, strength: number, h3 = H3): Cell {
  return { h3, ownerId: owner, strength, lastVisitedAt: 0, visitDays: [] };
}

describe('cellsToGeoJson', () => {
  it('maps a set', () => {
    // Two hexes. This used to build both on the default `H3` — a mine cell and a rival
    // cell on one hex, which the game cannot produce — and only passed because nothing
    // guaranteed one feature per hex. Now something does.
    const rivalHex = cellAt({ lat: 60.17, lng: 24.94 });
    const collection = cellsToGeoJson([cell(ME, 100), cell(RIVAL, 200, rivalHex)], ME);
    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(2);
    expect(collection.features[0]?.properties.mine).toBe(true);
    expect(collection.features[1]?.properties.mine).toBe(false);
  });

  it('handles an empty set', () => {
    expect(cellsToGeoJson([], ME)).toEqual({ type: 'FeatureCollection', features: [] });
  });

  it('draws a hex once however many times it is handed over', () => {
    /*
     * BRDC-SIGIL-006. Infinite, looking at doubled figures on the map: "onko mahdollista,
     * että heksa on jostain syystä 2x käyttäjän omistuksessa". Nothing used to rule it
     * out — the map was the one place where a hex arriving twice became two of everything.
     * The later copy wins, as every other merge in the game does.
     */
    const stale = cell(ME, 100);
    const fresh = cell(ME, 360);
    const { features } = cellsToGeoJson([stale, fresh], ME);
    expect(features).toHaveLength(1);
    expect(features[0]?.properties.strength).toBe(360);
  });
});

describe('the banner and the places (BRDC-SIGIL-006)', () => {
  /*
   * A Temple or the Anchor Stone is the hex's structure. A banner in the same centre slot
   * would be the collision the slot table exists to prevent — and on the Keep's own hex,
   * where the Anchor stands, it was drawn every time.
   */
  it('leaves the banner off a hex a place stands on', () => {
    const { features } = cellsToGeoJson([cell(ME, 200)], ME, 0, null, {}, new Set([H3]));
    expect(features[0]?.properties.flag).toBe('');
  });

  it('still flies it on your other empty ground', () => {
    const { features } = cellsToGeoJson([cell(ME, 200)], ME, 0, null, {}, new Set());
    expect(features[0]?.properties.flag).not.toBe('');
  });
});
