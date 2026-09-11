/**
 * BRDC-MAP-EDIT-001 — what a loaded brush says about a hex.
 *
 * The one piece of the editor worth testing without a browser: a slip here writes a
 * *file*, and a file that is quietly wrong pays a neighbourhood the wrong resources for
 * as long as nobody notices.
 */
import { describe, expect, it } from 'vitest';
import { strokeOf } from './useEditor.js';

describe('strokeOf', () => {
  it('paints terrain alone', () => {
    expect(strokeOf({ terrain: 'mountain', bounty: null })).toEqual({ t: 'mountain' });
  });

  it('paints a find alone, leaving the ground to the hash', () => {
    expect(strokeOf({ terrain: null, bounty: 'gems' })).toEqual({ b: 'gems' });
  });

  it('paints both at once', () => {
    expect(strokeOf({ terrain: 'mountain', bounty: 'gems' })).toEqual({
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
    expect(strokeOf({ terrain: null, bounty: null })).toBeNull();
  });

  // No `undefined` fields: they survive JSON.stringify as absent, but an explicit key
  // would make two drawings of the same ground compare unequal.
  it('writes no empty keys, so two drawings of the same ground match', () => {
    expect(Object.keys(strokeOf({ terrain: 'lake', bounty: null }) ?? {})).toEqual(['t']);
    expect(Object.keys(strokeOf({ terrain: null, bounty: 'fish' }) ?? {})).toEqual(['b']);
  });
});
