import { describe, expect, it } from 'vitest';
import { anomalyAt, cellAt, neighboursOf } from '@es3/core';
import type { Cell, TerrainKind } from '@es3/core';
import {
  CONTESTED_BELOW,
  ENEMY_FILL,
  OWN_FILL,
  REVEAL_FILL,
  anomalyGlyphFor,
  awakeningReveal,
  cellProperties,
  cellToFeature,
  cellsToGeoJson,
  terrainGlyph,
  withFogOfWar,
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

  it('paints every rival the same fixed enemy red', () => {
    const a = cellProperties(cell(RIVAL, 200), ME).color;
    const b = cellProperties(cell(OTHER, 200), ME).color;
    expect(a).toBe(ENEMY_FILL);
    expect(b).toBe(ENEMY_FILL);
    expect(a).not.toBe(OWN_FILL);
  });

  it('draws seen-but-unclaimed ground in the neutral reveal tint', () => {
    // A cell revealed only by sitting next to yours is not a rival's — it must not
    // read as enemy red, and not as your own purple either.
    const free = cellProperties(cell(null, 0), ME);
    expect(free.color).toBe(REVEAL_FILL);
    expect(free.color).not.toBe(ENEMY_FILL);
    expect(free.color).not.toBe(OWN_FILL);
    expect(free.mine).toBe(false);
  });

  it('is not mine when nobody is signed in', () => {
    expect(cellProperties(cell(ME, 200), null).mine).toBe(false);
  });
});

describe('anomaly glyph', () => {
  // A cell the reveal hash marks rare — an anomaly site.
  const disk = [H3, ...neighboursOf(H3)];
  for (let i = 0; i < 40 && !disk.some((h) => anomalyAt(h)); i++) {
    for (const h of [...disk]) for (const n of neighboursOf(h)) if (!disk.includes(n)) disk.push(n);
  }
  const RARE = disk.find((h) => anomalyAt(h)) as string;
  const ORDINARY = disk.find((h) => !anomalyAt(h)) as string;
  const at = (over: Partial<Cell>): Cell => ({
    h3: RARE,
    ownerId: ME,
    strength: 100,
    lastVisitedAt: 0,
    visitDays: [],
    ...over,
  });

  it('marks an untouched site, and shows nothing on ordinary ground', () => {
    expect(anomalyGlyphFor(at({}))).toBe('◌');
    expect(anomalyGlyphFor({ ...at({}), h3: ORDINARY })).toBe('');
  });

  it('changes with the anomaly state, and clears when finished', () => {
    expect(anomalyGlyphFor(at({ anomaly: { startedAt: 1 } }))).toBe('◐');
    expect(anomalyGlyphFor(at({ anomaly: { startedAt: 1, stage: 0 } }))).toBe('✦');
    expect(anomalyGlyphFor(at({ anomaly: { startedAt: 1, done: true } }))).toBe('');
  });

  it('only appears on your own ground', () => {
    expect(cellProperties(at({}), ME).anomaly).toBe('◌');
    expect(cellProperties({ ...at({}), ownerId: RIVAL }, ME).anomaly).toBe('');
  });
});

describe('terrain glyph', () => {
  it('plain ground shows nothing', () => {
    expect(terrainGlyph('plain')).toBeNull();
  });

  it('forest is a club in the wood colour', () => {
    const g = terrainGlyph('forest');
    expect(g?.char).toBe('♣');
    expect(g?.color).toBe('#7cbf63');
  });

  it('every terrain kind resolves to a glyph or an explicit null', () => {
    const kinds: TerrainKind[] = ['plain', 'forest', 'hill', 'mountain', 'lake', 'coast', 'market'];
    for (const kind of kinds) {
      const g = terrainGlyph(kind);
      if (kind === 'plain') expect(g).toBeNull();
      else {
        expect(g?.char).toBeTruthy();
        expect(g?.color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('the cell feature carries the glyph, or an empty string for plain', () => {
    const props = cellProperties(cell(ME, 100), ME);
    // H3 above hashes to some terrain; icon is a string either way, never null.
    expect(typeof props.icon).toBe('string');
    expect(typeof props.iconColor).toBe('string');
  });
});

describe('withFogOfWar', () => {
  it('keeps my cells and their neighbours, and nothing else', () => {
    const owned = [cell(ME, 200, H3)];
    const ring = neighboursOf(H3);
    // A rival cell far enough away that it is neither mine nor a neighbour of mine.
    const far = cellAt({ lat: 60.17, lng: 24.94 });
    const all = [cell(ME, 200, H3), cell(RIVAL, 200, far)];

    const shown = withFogOfWar(all, owned);
    const shownH3 = new Set(shown.map((c) => c.h3));

    expect(shownH3.has(H3)).toBe(true);
    for (const n of ring) expect(shownH3.has(n)).toBe(true);
    expect(shownH3.has(far)).toBe(false);
  });

  it('synthesises an empty cell for a revealed neighbour with no stored cell', () => {
    const owned = [cell(ME, 200, H3)];
    const shown = withFogOfWar([cell(ME, 200, H3)], owned);
    const neighbour = shown.find((c) => c.h3 !== H3);
    expect(neighbour?.ownerId).toBeNull();
    expect(neighbour?.strength).toBe(0);
  });

  it('an empty owned set reveals nothing', () => {
    expect(withFogOfWar([cell(RIVAL, 200)], [])).toEqual([]);
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
});

describe('geometry', () => {
  it('emits a closed ring in GeoJSON order', () => {
    const feature = cellToFeature(cell(ME, 100), ME);
    const ring = feature.geometry.coordinates[0] as Array<[number, number]>;

    expect(ring.length).toBeGreaterThanOrEqual(6);
    for (const [lng, lat] of ring) {
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

describe('awakeningReveal', () => {
  const outcome = (h3: string, kind: 'claimed' | 'taken' | 'reinforced') =>
    ({ h3, kind, strengthBefore: 0, strengthAfter: 100, previousOwner: null }) as never;

  it('is null with no claim and null when a lap only reinforced', () => {
    expect(awakeningReveal(null)).toBeNull();
    expect(awakeningReveal({ outcomes: [outcome('a', 'reinforced')], at: 5 })).toBeNull();
  });

  it('lights the claimed and taken cells, carrying the timestamp', () => {
    const r = awakeningReveal({
      outcomes: [outcome('a', 'claimed'), outcome('b', 'reinforced'), outcome('c', 'taken')],
      at: 42,
    });
    expect(r).toEqual({ cells: ['a', 'c'], at: 42 });
  });
});
