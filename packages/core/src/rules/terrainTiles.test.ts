import { describe, expect, it } from 'vitest';
import { terrainFromTiles } from './terrainTiles.js';

describe('terrainFromTiles', () => {
  it('reads a lake from a water layer', () => {
    expect(terrainFromTiles([{ sourceLayer: 'water', properties: { class: 'lake' } }])).toBe('lake');
    expect(terrainFromTiles([{ sourceLayer: 'waterway', properties: {} }])).toBe('lake');
  });

  it('reads the coast from ocean water or a coastline', () => {
    expect(terrainFromTiles([{ sourceLayer: 'water', properties: { class: 'ocean' } }])).toBe('coast');
    expect(terrainFromTiles([{ properties: { natural: 'coastline' } }])).toBe('coast');
  });

  it('reads woodland from land cover or a natural tag', () => {
    expect(terrainFromTiles([{ sourceLayer: 'landcover', properties: { class: 'wood' } }])).toBe('forest');
    expect(terrainFromTiles([{ properties: { natural: 'wood' } }])).toBe('forest');
  });

  it('reads a peak as mountain and scrub as hill — tags, not elevation', () => {
    expect(terrainFromTiles([{ properties: { natural: 'peak' } }])).toBe('mountain');
    expect(terrainFromTiles([{ properties: { natural: 'ridge' } }])).toBe('mountain');
    expect(terrainFromTiles([{ properties: { natural: 'scrub' } }])).toBe('hill');
  });

  // The field bug of 2026-09-11: bare rock is the commonest natural feature in this
  // country, it was being read as a mountain, and walking over a yard outcrop paid iron.
  it('reads bare rock as hill, not mountain — an outcrop is a quarry', () => {
    expect(terrainFromTiles([{ properties: { natural: 'rock' } }])).toBe('hill');
    expect(terrainFromTiles([{ properties: { natural: 'bare_rock' } }])).toBe('hill');
    expect(terrainFromTiles([{ properties: { natural: 'scree' } }])).toBe('hill');
    expect(terrainFromTiles([{ properties: { natural: 'cliff' } }])).toBe('hill');
  });

  it('reads farmland and meadow as plain — a field is a reading, not a gap', () => {
    expect(terrainFromTiles([{ sourceLayer: 'landuse', properties: { class: 'farmland' } }])).toBe('plain');
    expect(terrainFromTiles([{ properties: { landuse: 'orchard' } }])).toBe('plain');
    expect(terrainFromTiles([{ properties: { natural: 'grassland' } }])).toBe('plain');
    expect(terrainFromTiles([{ properties: { natural: 'meadow' } }])).toBe('plain');
  });

  it('reads a marketplace or shops as market', () => {
    expect(terrainFromTiles([{ sourceLayer: 'landuse', properties: { class: 'commercial' } }])).toBe('market');
    expect(terrainFromTiles([{ properties: { shop: 'bakery' } }])).toBe('market');
  });

  it('returns null when the tiles say nothing', () => {
    expect(terrainFromTiles([])).toBeNull();
    expect(terrainFromTiles([{ sourceLayer: 'building', properties: {} }])).toBeNull();
  });

  it('checks water before land cover when a feature carries both', () => {
    const shoreline = [
      { sourceLayer: 'landcover', properties: { class: 'wood' } },
      { sourceLayer: 'water', properties: { class: 'ocean' } },
    ];
    expect(terrainFromTiles(shoreline)).toBe('coast');
  });
});
