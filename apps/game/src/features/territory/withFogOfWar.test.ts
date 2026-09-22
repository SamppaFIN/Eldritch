/**
 * `withFogOfWar` — which cells the map draws at all, split out of
 * `territoryFeatures.test.ts` when BRDC-HEX-003's new flag coverage took it past 400
 * lines. This is a different question from `cellProperties`'s own tests: not what a
 * cell looks like, but whether it is drawn in the first place.
 */
import { describe, expect, it } from 'vitest';
import { cellAt, emptyCell, neighboursOf } from '@es3/core';
import type { Cell } from '@es3/core';
import { withFogOfWar } from './territoryFeatures.js';

const ME = 'me';
const RIVAL = 'the-pale-warden';
const H3 = cellAt({ lat: 61.47290805294704, lng: 23.725882485862012 });

function cell(owner: string | null, strength: number, h3 = H3): Cell {
  return { h3, ownerId: owner, strength, lastVisitedAt: 0, visitDays: [] };
}

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

  /*
   * BRDC-SPELL-002. Scrying writes nothing to the store, so this seam is the only place it
   * can be seen at all — without it the Rite costs 55 mana and changes nothing on screen.
   */
  it('shows ground a Scrying is looking at, however far from home it is', () => {
    const owned = [cell(ME, 200, H3)];
    const far = cellAt({ lat: 60.17, lng: 24.94 });

    expect(withFogOfWar([], owned).some((c) => c.h3 === far)).toBe(false);
    expect(withFogOfWar([], owned, [emptyCell(far)]).some((c) => c.h3 === far)).toBe(true);
  });

  it('lets a real cell win over the scried stand-in for the same hex', () => {
    const owned = [cell(ME, 200, H3)];
    const rivalGround = cellAt({ lat: 60.17, lng: 24.94 });
    const all = [cell(RIVAL, 200, rivalGround)];

    const shown = withFogOfWar(all, owned, [emptyCell(rivalGround)]);
    expect(shown.find((c) => c.h3 === rivalGround)?.ownerId).toBe(RIVAL);
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

  it('draws every imported cell, however far, with no owned ground at all (BRDC-WAGER-JSON-006)', () => {
    const far = cellAt({ lat: 60.17, lng: 24.94 });
    const imported: Cell = { ...cell(RIVAL, 200, far), imported: true };
    const shown = withFogOfWar([imported], []);
    expect(shown.map((c) => c.h3)).toEqual([far]);
  });
});
