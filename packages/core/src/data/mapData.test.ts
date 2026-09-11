/**
 * BRDC-MAP-EDIT-001 — a drawing is content: read it strictly, and let it win.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  MAP_DATA_VERSION,
  encodeDrawing,
  loadDrawings,
  loadedCells,
  newDrawing,
  paint,
  paintedBountyOf,
  paintedTerrainOf,
  parseDrawing,
} from './mapData.js';
import { terrainForCell, terrainOf } from '../rules/terrain.js';
import { bountyOn } from '../rules/bounty.js';
import { cellAt } from '../geo/cells.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-09-11T12:00:00Z');
const A = cellAt({ lat: 60.1699, lng: 24.9384 });
const B = cellAt({ lat: 60.1705, lng: 24.9392 });
const cell = (h3: string, over: Partial<Cell> = {}): Cell => ({
  h3,
  ownerId: 'me',
  strength: 300,
  lastVisitedAt: T0,
  visitDays: [],
  ...over,
});

afterEach(() => loadDrawings());

describe('paint', () => {
  it('records what was said about a hex, without mutating what it was given', () => {
    const before = newDrawing('test');
    const after = paint(before, A, { t: 'mountain' });
    expect(after.cells[A]).toEqual({ t: 'mountain' });
    expect(before.cells[A]).toBeUndefined();
  });

  /*
   * Scrubbing has to actually empty the file. Leaving `{}` behind would make a cleaned
   * drawing look painted to anything counting entries — including the editor's own
   * "how much have I done" readout.
   */
  it('removes the entry rather than leaving an empty one behind', () => {
    const drawn = paint(newDrawing('test'), A, { t: 'lake' });
    expect(Object.keys(paint(drawn, A, null).cells)).toHaveLength(0);
    expect(Object.keys(paint(drawn, A, {}).cells)).toHaveLength(0);
  });
});

describe('parseDrawing', () => {
  it('round-trips what the editor writes', () => {
    const drawn = paint(newDrawing('Härmälä'), A, { t: 'coast', note: 'the harbour' });
    const back = parseDrawing(encodeDrawing(drawn));
    expect(back).toEqual({ ok: true, drawing: drawn });
  });

  /*
   * Refusing loudly matters more here than almost anywhere else: a half-understood file
   * would silently give a neighbourhood the wrong ground, and wrong ground pays the wrong
   * resources for as long as nobody notices.
   */
  it('refuses anything it does not fully understand', () => {
    const why = (text: string) => {
      const parsed = parseDrawing(text);
      return parsed.ok ? 'accepted' : parsed.fault;
    };
    expect(why('{')).toBe('not-json');
    expect(why('[]')).toBe('not-a-drawing');
    expect(why('{"v":1}')).toBe('not-a-drawing');
    expect(why(`{"v":${MAP_DATA_VERSION + 1},"cells":{}}`)).toBe('wrong-version');
  });

  it('accepts a drawing with no name, rather than losing the work over it', () => {
    const parsed = parseDrawing('{"v":1,"cells":{}}');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.drawing.name).toBe('untitled');
  });
});

describe('what the game reads', () => {
  it('says nothing about a hex nobody drew', () => {
    expect(paintedTerrainOf(A)).toBeNull();
    expect(paintedBountyOf(A)).toBeNull();
  });

  it('beats the hash, which is the whole point of drawing it', () => {
    const byHash = terrainOf(A).kind;
    const other = byHash === 'mountain' ? 'lake' : 'mountain';
    loadDrawings(paint(newDrawing('test'), A, { t: other }));

    expect(terrainOf(A).kind).toBe(other);
    expect(terrainForCell(cell(A)).kind).toBe(other);
  });

  // A tile reading is a machine's guess; a drawing is a person's answer.
  it('beats a terrain a tile read stored on the cell', () => {
    loadDrawings(paint(newDrawing('test'), A, { t: 'lake' }));
    expect(terrainForCell(cell(A, { terrain: { kind: 'mountain', source: 'tiles' } })).kind).toBe(
      'lake',
    );
  });

  it('places a bounty by hand, on ground the table would never have chosen', () => {
    loadDrawings(paint(newDrawing('test'), A, { t: 'mountain', b: 'fish' }));
    expect(bountyOn(cell(A))).toBe('fish');
  });

  it('leaves every hex it does not name alone', () => {
    const untouched = terrainOf(B).kind;
    loadDrawings(paint(newDrawing('test'), A, { t: 'lake' }));
    expect(terrainOf(B).kind).toBe(untouched);
  });

  /*
   * Later wins, so a small correction can refine a large area file without anybody having
   * to edit the large one.
   */
  it('lets a later drawing refine an earlier one', () => {
    loadDrawings(
      paint(newDrawing('area'), A, { t: 'plain' }),
      paint(newDrawing('fix'), A, { t: 'coast' }),
    );
    expect(paintedTerrainOf(A)?.kind).toBe('coast');
  });

  it('loads nothing when asked for nothing, so tests start clean', () => {
    loadDrawings(paint(newDrawing('x'), A, { t: 'lake' }));
    loadDrawings();
    expect(Object.keys(loadedCells())).toHaveLength(0);
  });
});
