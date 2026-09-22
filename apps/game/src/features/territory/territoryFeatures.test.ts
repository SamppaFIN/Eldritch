import { describe, expect, it } from 'vitest';
import { CITY_STATES, anomalyAt, cellAt, neighboursOf } from '@es3/core';
import type { Cell, TerrainKind } from '@es3/core';
import {
  ALLY_FILL,
  CONTESTED_BELOW,
  ENEMY_FILL,
  OWN_FILL,
  REVEAL_FILL,
  anomalyGlyphFor,
  awakeningReveal,
  cellProperties,
  terrainGlyph,
  CITY_COLOUR,
  MAP_RESOURCE_COLOUR,
  RESOURCE_COLOUR,
} from './territoryFeatures.js';
import { cellToFeature } from './cellMarks.js';

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

  it("paints a clanmate's ground its own colour, not the rival red (BRDC-CLAN-004)", () => {
    const allyCell = { ...cell(RIVAL, 200), ally: true };
    const props = cellProperties(allyCell, ME);
    expect(props.ally).toBe(true);
    expect(props.color).toBe(ALLY_FILL);
    expect(props.color).not.toBe(ENEMY_FILL);
    expect(props.color).not.toBe(OWN_FILL);
    expect(props.mine).toBe(false);
  });

  it('never marks your own ground ally, even if the ally flag were somehow set', () => {
    const oddCell = { ...cell(ME, 200), ally: true };
    expect(cellProperties(oddCell, ME).ally).toBe(false);
  });

  it('leaves a plain rival unmarked as ally', () => {
    expect(cellProperties(cell(RIVAL, 200), ME).ally).toBe(false);
  });
});

describe('shared ground (BRDC-WAGER-JSON-005)', () => {
  it('flags a cell both you and an imported Wager claim', () => {
    const dual: Cell = { ...cell(ME, 200), shared: { with: RIVAL, mineAtImport: 200, theirsAtImport: 150 } };
    expect(cellProperties(dual, ME).shared).toBe(true);
  });

  it('is false for ground held only one way, yours or not', () => {
    expect(cellProperties(cell(ME, 200), ME).shared).toBe(false);
    expect(cellProperties(cell(RIVAL, 200), ME).shared).toBe(false);
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

  // The map cannot read a custom property, so this one asserts the *literal* twin of the
  // colour law rather than a token (Sigil §01). Asserting the table, not the value: the
  // point is that a forest glyph is painted in timber, whatever timber turns out to be.
  it('forest is a club in the timber colour', () => {
    const g = terrainGlyph('forest');
    expect(g?.char).toBe('♣');
    expect(g?.color).toBe(MAP_RESOURCE_COLOUR.wood);
  });

  it('paints from the same law the rest of the game uses', () => {
    // One key per resource in both tables, or the law has quietly become two laws.
    expect(Object.keys(MAP_RESOURCE_COLOUR).sort()).toEqual(Object.keys(RESOURCE_COLOUR).sort());
    for (const v of Object.values(RESOURCE_COLOUR)) expect(v).toMatch(/^var\(--r-/);
  });

  it('every terrain kind resolves to a glyph or an explicit null', () => {
    const kinds: TerrainKind[] = [
      'plain',
      'forest',
      'hill',
      'mountain',
      'lake',
      'coast',
      'market',
      'marsh',
      'settlement',
    ];
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

describe('building glyph (BRDC-ART-002)', () => {
  const built = (owner: string | null) => ({
    ...cell(owner, 200),
    buildings: [{ id: 'sawmill' as const, builtAt: 0 }],
  });

  it('a built cell carries its role glyph and colour', () => {
    const p = cellProperties(built(ME), ME);
    expect(p.building).toBe('▦'); // produce
    expect(p.buildingColor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('a rival’s building shows too — it is intel', () => {
    expect(cellProperties(built(RIVAL), ME).building).toBe('▦');
  });

  it('an empty cell has no building glyph', () => {
    const p = cellProperties(cell(ME, 100), ME);
    expect(p.building).toBe('');
    expect(p.buildingColor).toBe('');
  });
});

describe('blight (BRDC-BLIGHT-001)', () => {
  const T0 = Date.parse('2026-09-02T12:00:00Z');
  const long = (over: Partial<Cell> = {}): Cell => ({ ...cell(ME, 200), lastVisitedAt: 0, ...over });

  it('a long-unvisited owned cell carries blight; a fresh one does not', () => {
    expect(cellProperties(long(), ME, T0).blight).toBeGreaterThan(0);
    expect(cellProperties(long({ lastVisitedAt: T0 }), ME, T0).blight).toBe(0); // just visited
  });

  it('the Hearth never blights', () => {
    expect(cellProperties(long(), ME, T0, long().h3).blight).toBe(0);
  });

  it('a border cell blights deeper, still clamped to one', () => {
    const plain = cellProperties(long(), ME, T0, null, false).blight;
    const edge = cellProperties(long(), ME, T0, null, true).blight;
    expect(edge).toBeGreaterThanOrEqual(plain);
    expect(edge).toBeLessThanOrEqual(1);
  });
});

describe('terrain reads on every drawn cell (BRDC-MAP-003, reverted)', () => {
  it('a bordering cell shows its terrain — it is known, not fog', () => {
    // The map only draws owned ground and its one ring; a ring cell is not hidden.
    const p = cellProperties(cell(null, 0), ME);
    expect(typeof p.icon).toBe('string');
    expect(p.icon).not.toBe('?');
  });
});

describe('the map flag (BRDC-BANNER-001, BRDC-HEX-003)', () => {
  it('marks ground you hold that carries no building, with your own banner', () => {
    const props = cellProperties(cell(ME, 200), ME, 0, null, false, {}, false, 'vesica');
    expect(props.flag).toBe('◈');
    expect(props.bannerId).toBe('vesica');
  });

  it('shows no flag at all if somehow asked with no banner chosen', () => {
    expect(cellProperties(cell(ME, 200), ME).flag).toBe('');
  });

  it('yields to a building on the same cell', () => {
    const built = { ...cell(ME, 200), buildings: [{ id: 'sawmill' as const, builtAt: 0 }] };
    expect(cellProperties(built, ME, 0, null, false, {}, false, 'vesica').flag).toBe('');
  });

  it("never flies over a rival's or an unclaimed cell that is not imported", () => {
    expect(cellProperties(cell(RIVAL, 200), ME).flag).toBe('');
    expect(cellProperties(cell(null, 0), ME).flag).toBe('');
  });

  it("flies a rival's banner on the one imported cell that is their Keep", () => {
    const keep = {
      ...cell(RIVAL, 200),
      imported: true,
      importedFrom: { name: 'The Rook Guard', banner: 'eye', seenAt: 0, castle: H3 },
    };
    const props = cellProperties(keep, ME);
    expect(props.flag).toBe('◈');
    expect(props.bannerId).toBe('eye');
  });

  it("stays silent on the rival's other imported ground, even with a Keep elsewhere", () => {
    const other = cellAt({ lat: 60.17, lng: 24.94 });
    const notKeep = {
      ...cell(RIVAL, 200, other),
      imported: true,
      importedFrom: { name: 'The Rook Guard', banner: 'eye', seenAt: 0, castle: H3 },
    };
    expect(cellProperties(notKeep, ME).flag).toBe('');
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

/*
 * BRDC-FX-002. "jos sulla on temppeli, niin se näkyy.. saa olla isompi kun se alkuperäinen
 * heksa.. tai jos siinä on joku kalastuskylä.. korvaa siis koko heksa näillä."
 */
describe('landmarks', () => {
  const withWork = (id: string): Cell => ({
    ...cell(ME, 200, H3),
    buildings: [{ id, at: 0 } as unknown as never],
  });

  it('gives a village its own mark, whoever else is on the map', () => {
    // The *owner* id, not the city-state id — `isCityState` matches on `owner`.
    const village: Cell = { ...cell(CITY_STATES[0]?.owner ?? '', 200, H3) };
    const p = cellProperties(village, ME);
    expect(p.landmark).not.toBe('');
    expect(p.landmarkColor).toBe(CITY_COLOUR);
  });

  it('promotes a monument out of the small glyph and into its own layer', () => {
    const p = cellProperties(withWork('monument'), ME);
    expect(p.landmark).not.toBe('');
    // Never both: one cell, one mark, or the map draws it twice at two sizes.
    expect(p.building).toBe('');
  });

  it('leaves an ordinary Work where it was', () => {
    const p = cellProperties(withWork('farm'), ME);
    expect(p.landmark).toBe('');
    expect(p.building).not.toBe('');
  });

  // If everything is a landmark the map is a wall of glyphs again, just a bigger one.
  it('keeps bare ground clear of both', () => {
    const p = cellProperties(cell(ME, 200, H3), ME);
    expect(p.landmark).toBe('');
    expect(p.building).toBe('');
  });
});
