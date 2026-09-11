/**
 * BRDC-MAP-EDIT-001 — what a loaded brush says about a hex.
 *
 * The one piece of the editor worth testing without a browser: a slip here writes a
 * *file*, and a file that is quietly wrong pays a neighbourhood the wrong resources for
 * as long as nobody notices.
 */
import { describe, expect, it } from 'vitest';
import { BRUSH_SIZES, strokeOf } from './useEditor.js';
import { cellsWithin } from '@es3/core';
import { cellAt } from '@es3/core';

/** Size is about how many hexes a stroke covers, never about what it says. */
const brush = (over: Partial<Parameters<typeof strokeOf>[0]> = {}) => ({
  terrain: null,
  bounty: null,
  size: 0,
  ...over,
});

describe('strokeOf', () => {
  it('paints terrain alone', () => {
    expect(strokeOf(brush({ terrain: 'mountain' }))).toEqual({ t: 'mountain' });
  });

  it('paints a find alone, leaving the ground to the hash', () => {
    expect(strokeOf(brush({ bounty: 'gems' }))).toEqual({ b: 'gems' });
  });

  it('paints both at once', () => {
    expect(strokeOf(brush({ terrain: 'mountain', bounty: 'gems' }))).toEqual({
      t: 'mountain',
      b: 'gems',
    });
  });

  /*
   * An empty brush is the scrub tool, and it has to produce `null` rather than `{}` —
   * `paint` removes an entry for null and would otherwise leave a hex marked as painted
   * with nothing on it, which reads as work done in the count and does nothing in the game.
   */
  it('scrubs when it is carrying nothing', () => {
    expect(strokeOf(brush())).toBeNull();
  });

  // No `undefined` fields: they survive JSON.stringify as absent, but an explicit key
  // would make two drawings of the same ground compare unequal.
  it('writes no empty keys, so two drawings of the same ground match', () => {
    expect(Object.keys(strokeOf(brush({ terrain: 'lake' })) ?? {})).toEqual(['t']);
    expect(Object.keys(strokeOf(brush({ bounty: 'fish' })) ?? {})).toEqual(['b']);
  });
});

describe('brush size (BRDC-MAP-EDIT-002)', () => {
  const HOME = cellAt({ lat: 61.4729, lng: 23.7259 });

  /*
   * One hex at a time is the right tool for a shoreline and a terrible one for a forest.
   * The sizes are the hex rings, so the counts are 1, 7, 19, 37 — stated here because a
   * size that quietly covered the wrong area would produce a wrong file.
   */
  it('covers a hex ring per step, and the sizes offered are those rings', () => {
    expect(BRUSH_SIZES.map((r) => cellsWithin(HOME, r).length)).toEqual([1, 7, 19, 37]);
  });

  it('says nothing different at any size — size is reach, not meaning', () => {
    const said = strokeOf(brush({ terrain: 'forest', size: 0 }));
    for (const size of BRUSH_SIZES) {
      expect(strokeOf(brush({ terrain: 'forest', size }))).toEqual(said);
    }
  });
});
