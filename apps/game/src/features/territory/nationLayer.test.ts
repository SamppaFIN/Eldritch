/**
 * BRDC-ATLAS-001 — the Atlas's own colour law: mine or not, nothing per-nation.
 */
import { describe, expect, it } from 'vitest';
import { cellAt } from '@es3/core';
import type { AtlasRegion } from '@es3/core';
import { ENEMY_FILL, OWN_FILL } from './territoryFeatures.js';
import { nationRegionsToGeoJson } from './nationLayer.js';

const REGION = cellAt({ lat: 61.4729, lng: 23.7259 });

const region = (over: Partial<AtlasRegion> = {}): AtlasRegion => ({
  region: REGION,
  dominant: { id: 'a', name: 'a' },
  areaM2: 1000,
  players: 1,
  ...over,
});

describe('nationRegionsToGeoJson', () => {
  it('paints a municipality the local player dominates in the own colour', () => {
    const [feature] = nationRegionsToGeoJson([region({ dominant: { id: 'me', name: 'me' } })], 'me')
      .features;
    expect(feature?.properties.mine).toBe(true);
    expect(feature?.properties.color).toBe(OWN_FILL);
  });

  it('paints every other dominant holder the same fixed rival red, no hue per nation', () => {
    const a = nationRegionsToGeoJson([region({ dominant: { id: 'a', name: 'a' } })], 'me').features[0];
    const b = nationRegionsToGeoJson([region({ dominant: { id: 'b', name: 'b' } })], 'me').features[0];
    expect(a?.properties.color).toBe(ENEMY_FILL);
    expect(b?.properties.color).toBe(ENEMY_FILL);
    expect(a?.properties.mine).toBe(false);
  });

  it('is not mine when nobody is signed in', () => {
    const [feature] = nationRegionsToGeoJson([region({ dominant: { id: 'me', name: 'me' } })], null)
      .features;
    expect(feature?.properties.mine).toBe(false);
  });

  it('names the region by nation, falling back to the plain name', () => {
    const named = nationRegionsToGeoJson([region({ dominant: { id: 'a', name: 'a', nation: 'The Pale March' } })], null);
    expect(named.features[0]?.properties.name).toBe('The Pale March');

    const unnamed = nationRegionsToGeoJson([region({ dominant: { id: 'a', name: 'Alice' } })], null);
    expect(unnamed.features[0]?.properties.name).toBe('Alice');
  });

  it('carries the region as a real polygon at the res-5 cell', () => {
    const [feature] = nationRegionsToGeoJson([region()], null).features;
    expect(feature?.id).toBe(REGION);
    expect(feature?.geometry.type).toBe('Polygon');
    expect(feature?.geometry.coordinates[0]?.length).toBeGreaterThan(3);
  });

  it('is empty for no regions', () => {
    expect(nationRegionsToGeoJson([], null).features).toEqual([]);
  });
});
