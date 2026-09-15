import { describe, expect, it } from 'vitest';
import { registerWorldseed, registrationDelta } from './worldseedRegister.js';
import type { WorldseedDoc } from './worldseedRegister.js';
import { HARMALA_STATUE } from '../rules/terrainSeed.js';
import { haversine } from '../geo/haversine.js';

// The document's own statue coordinate (worldseed.ts's `harmalaHint`, seed.harmala.json's
// "Statue of the Boy" landmark) — measured against the confirmed one in the registration
// screenshot: about 402 m north, 150 m west.
const DOC_STATUE: readonly [number, number] = [61.4693, 23.7287];

function doc(overrides: Partial<WorldseedDoc> = {}): WorldseedDoc {
  return {
    $schema: 'https://example/worldseed-schema.json',
    displayName: 'Härmälänranta',
    landmarks: [
      { name: 'Statue of the Boy', at: DOC_STATUE, kind: 'memorial' },
      { name: 'Villa Härmälänranta', at: [61.4685, 23.732] as const, kind: 'historic' },
    ],
    grid: { circumradiusM: 25, origin: [61.468, 23.733] as const },
    bbox: [61.4575, 23.7185, 61.4735, 23.7605],
    anchorStone: { at: [61.4681, 23.7315] as const, note: 'The Keep.' },
    zoneOverrides: [
      { terrain: 'water', name: 'Pyhäjärvi', bounds: undefined, shoreline: [
        [61.4697, 23.7242], [61.4694, 23.7287],
      ] as const },
      { terrain: 'marsh', name: 'Vähäjärven suo', bounds: [61.4603, 23.7338, 61.4617, 23.7394] as const },
    ],
    leyLines: [{ id: 'ley-shore', path: [[61.4697, 23.7244], [61.4688, 23.73]] as const }],
    wonders: [{ id: 'the_boy_who_waits', at: DOC_STATUE }],
    questChains: [
      {
        id: 'what_sleeps_at_the_shore',
        nodes: [{ node: 1, at: [61.4681, 23.7315] as const, name: 'The Wet Footprints' }],
        items: [{ id: 'bell_key', at: [61.4694, 23.7287] as const }],
      },
    ],
    expectedCounts: { wonders: 9 },
    ...overrides,
  } as WorldseedDoc;
}

describe('registrationDelta', () => {
  it('is the measured vector: about 402 m north, 150 m west', () => {
    const d = registrationDelta(DOC_STATUE, HARMALA_STATUE);
    expect(d.lat).toBeCloseTo(0.0036, 3);
    expect(d.lng).toBeCloseTo(-0.00282, 3);
  });
});

describe('registerWorldseed', () => {
  it('lands the statue on HARMALA_STATUE, to well under a metre', () => {
    const out = registerWorldseed(doc(), HARMALA_STATUE);
    const statue = out.landmarks!.find((l) => l.name === 'Statue of the Boy')!;
    const distance = haversine({ lat: statue.at[0], lng: statue.at[1] }, HARMALA_STATUE);
    expect(distance).toBeLessThan(0.2);
  });

  it('moves a second landmark by exactly the same vector — one rigid shift, not a fluke', () => {
    const out = registerWorldseed(doc(), HARMALA_STATUE);
    const villaBefore = { lat: 61.4685, lng: 23.732 };
    const villaAfter = out.landmarks!.find((l) => l.name === 'Villa Härmälänranta')!;

    const shiftOfVilla = haversine(villaBefore, { lat: villaAfter.at[0], lng: villaAfter.at[1] });
    const shiftOfStatue = haversine({ lat: DOC_STATUE[0], lng: DOC_STATUE[1] }, HARMALA_STATUE);
    // Both moved by the same vector; haversine differs only by the tiny longitude-scaling
    // change between their two latitudes, well under a metre over this distance.
    expect(Math.abs(shiftOfVilla - shiftOfStatue)).toBeLessThan(1);
  });

  it('shifts the grid origin and the bbox corners', () => {
    const out = registerWorldseed(doc(), HARMALA_STATUE);
    const d = registrationDelta(DOC_STATUE, HARMALA_STATUE);

    expect(out.grid.origin).toEqual([
      Math.round((61.468 + d.lat) * 1e6) / 1e6,
      Math.round((23.733 + d.lng) * 1e6) / 1e6,
    ]);
    expect(out.bbox).toEqual([
      Math.round((61.4575 + d.lat) * 1e6) / 1e6,
      Math.round((23.7185 + d.lng) * 1e6) / 1e6,
      Math.round((61.4735 + d.lat) * 1e6) / 1e6,
      Math.round((23.7605 + d.lng) * 1e6) / 1e6,
    ]);
  });

  it('shifts zone bounds and shoreline paths, and ley-line paths', () => {
    const out = registerWorldseed(doc(), HARMALA_STATUE);
    const d = registrationDelta(DOC_STATUE, HARMALA_STATUE);

    const marsh = out.zoneOverrides!.find((z) => z.name === 'Vähäjärven suo')!;
    expect(marsh.bounds).toEqual([
      Math.round((61.4603 + d.lat) * 1e6) / 1e6,
      Math.round((23.7338 + d.lng) * 1e6) / 1e6,
      Math.round((61.4617 + d.lat) * 1e6) / 1e6,
      Math.round((23.7394 + d.lng) * 1e6) / 1e6,
    ]);

    const water = out.zoneOverrides!.find((z) => z.name === 'Pyhäjärvi')!;
    expect(water.shoreline![0]).toEqual([
      Math.round((61.4697 + d.lat) * 1e6) / 1e6,
      Math.round((23.7242 + d.lng) * 1e6) / 1e6,
    ]);

    expect(out.leyLines![0]!.path[0]).toEqual([
      Math.round((61.4697 + d.lat) * 1e6) / 1e6,
      Math.round((23.7244 + d.lng) * 1e6) / 1e6,
    ]);
  });

  it('shifts the anchor stone, wonder hints, and quest node/item coordinates', () => {
    const out = registerWorldseed(doc(), HARMALA_STATUE);
    const d = registrationDelta(DOC_STATUE, HARMALA_STATUE);
    const shift = (lat: number, lng: number): [number, number] => [
      Math.round((lat + d.lat) * 1e6) / 1e6,
      Math.round((lng + d.lng) * 1e6) / 1e6,
    ];

    expect(out.anchorStone!.at).toEqual(shift(61.4681, 23.7315));
    expect(out.wonders![0]!.at).toEqual(shift(...DOC_STATUE));
    expect(out.questChains![0]!.nodes![0]!.at).toEqual(shift(61.4681, 23.7315));
    // The item's own raw coordinate — a stone's throw from the statue, not on top of it
    // (seed.harmala.json's `bell_key` sits beside it, not exactly on it).
    expect(out.questChains![0]!.items![0]!.at).toEqual(shift(61.4694, 23.7287));
  });

  it('passes every other field through untouched', () => {
    const out = registerWorldseed(doc(), HARMALA_STATUE);
    expect(out.$schema).toBe('https://example/worldseed-schema.json');
    expect(out.displayName).toBe('Härmälänranta');
    expect(out.expectedCounts).toEqual({ wonders: 9 });
    expect(out.zoneOverrides![1]!.terrain).toBe('marsh');
    expect(out.questChains![0]!.id).toBe('what_sleeps_at_the_shore');
  });

  it('refuses a document with no "Statue of the Boy" landmark to anchor on', () => {
    const broken = doc({ landmarks: [{ name: 'Villa Härmälänranta', at: [61.4685, 23.732] }] });
    expect(() => registerWorldseed(broken, HARMALA_STATUE)).toThrow(/Statue of the Boy/);
  });
});
