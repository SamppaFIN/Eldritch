import { describe, expect, it } from 'vitest';
import { cellAt, loadDrawings, newDrawing, paint } from '@es3/core';
import type { Cell } from '@es3/core';
import { cellProperties } from './territoryFeatures.js';

const ME = 'me';
const RIVAL = 'the-pale-warden';
const H3 = cellAt({ lat: 61.47290805294704, lng: 23.725882485862012 });

function cell(owner: string | null, strength: number, h3 = H3): Cell {
  return { h3, ownerId: owner, strength, lastVisitedAt: 0, visitDays: [] };
}

/*
 * BRDC-SIGIL-003. "myös kartalle, paljastuksen jälkeen" — a bounty draws on the map only
 * once the reveal mechanic has actually paid it out. `bountyOn` is a pure, deterministic
 * function of the hex; it would happily answer for a hex nobody has looked at, so the
 * gate has to live here, in the one function every map-facing property passes through.
 */
describe('the bounty mark', () => {
  const REVEALED = { [H3]: 1_000 };

  it('is empty on ground with no bounty painted onto it', () => {
    loadDrawings(paint(newDrawing('none'), H3, { t: 'plain' }));
    expect(cellProperties(cell(ME, 200, H3), ME, 0, null, false, REVEALED).bounty).toBe('');
    loadDrawings();
  });

  it('names the bounty once the cell is both mine and revealed', () => {
    loadDrawings(paint(newDrawing('wheat-here'), H3, { t: 'plain', b: 'wheat' }));
    const p = cellProperties(cell(ME, 200, H3), ME, 0, null, false, REVEALED);
    expect(p.bounty).toBe('wheat');
    loadDrawings();
  });

  // The whole point of the gate: found, not given. A bounty must never appear on the map
  // before the player has paid for it by revealing the hex.
  it('says nothing about a bounty on ground that has not been revealed', () => {
    loadDrawings(paint(newDrawing('wheat-hidden'), H3, { t: 'plain', b: 'wheat' }));
    const p = cellProperties(cell(ME, 200, H3), ME, 0, null, false, {});
    expect(p.bounty).toBe('');
    loadDrawings();
  });

  // A rival's reveal is never this player's to know, and `getRevealed()` only ever
  // contains a player's own reveals in the first place — this is the belt on that braces.
  it('says nothing about a bounty on a rival cell, revealed or not', () => {
    loadDrawings(paint(newDrawing('wheat-rival'), H3, { t: 'plain', b: 'wheat' }));
    const p = cellProperties(cell(RIVAL, 200, H3), ME, 0, null, false, REVEALED);
    expect(p.bounty).toBe('');
    loadDrawings();
  });

  it('defaults to no reveal state at all, so every existing caller keeps working', () => {
    loadDrawings(paint(newDrawing('wheat-default'), H3, { t: 'plain', b: 'wheat' }));
    expect(cellProperties(cell(ME, 200, H3), ME).bounty).toBe('');
    loadDrawings();
  });
});

