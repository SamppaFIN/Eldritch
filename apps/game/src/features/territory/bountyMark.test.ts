import { describe, expect, it } from 'vitest';
import { cellAt, loadDrawings, newDrawing, paint } from '@es3/core';
import type { Cell } from '@es3/core';
import { MAP_RESOURCE_COLOUR, cellProperties } from './territoryFeatures.js';
import { addMarkLayers } from './territoryMarks.js';
import { CELL_BOUNTY_BADGE_LAYER, CELL_BOUNTY_LAYER } from './layerIds.js';

interface FakeLayer {
  id: string;
  minzoom?: number;
  maxzoom?: number;
  layout?: Record<string, unknown>;
}

/** Just enough MapLibre to record what `addMarkLayers` asks for. */
function fakeMap(): { layers: FakeLayer[]; addLayer: (l: FakeLayer) => void } {
  const layers: FakeLayer[] = [];
  return { layers, addLayer: (l) => layers.push(l) };
}

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


/*
 * The badge that stands in when the sprite is too small to read (Sigil §03).
 *
 * The interesting property is not the colour — it is that the two marks never draw at
 * once. Written wrong first: the badge was given `maxzoom: 16` against a sprite that
 * starts at 13, so for three zoom levels every find wore both a disc and an icon. The
 * bands have to *touch*, and nothing but a test keeps them touching once someone tunes
 * the size ramp.
 */
describe('the collapsed bounty badge', () => {
  const REVEALED = { [H3]: 1_000 };

  it('carries the hue of the resource the find pays', () => {
    loadDrawings(paint(newDrawing('gems-here'), H3, { t: 'mountain', b: 'gems' }));
    const props = cellProperties(cell(ME, 200, H3), ME, 0, null, false, REVEALED);
    expect(props.bounty).toBe('gems');
    // Gems pay gold, and gold is --sacred-gold on the map's own literal table.
    expect(props.bountyColor).toBe(MAP_RESOURCE_COLOUR.gold);
    loadDrawings();
  });

  it('has no hue where there is no find to badge', () => {
    loadDrawings(paint(newDrawing('none'), H3, { t: 'plain' }));
    expect(cellProperties(cell(ME, 200, H3), ME, 0, null, false, REVEALED).bountyColor).toBe('');
    loadDrawings();
  });

  it('hands over to the sprite exactly where the sprite becomes legible', () => {
    const map = fakeMap();
    addMarkLayers(map as never);

    const badge = map.layers.find((l) => l.id === CELL_BOUNTY_BADGE_LAYER);
    const sprite = map.layers.find((l) => l.id === CELL_BOUNTY_LAYER);

    // The badge stops where the sprite starts: one mark per find, at every zoom.
    expect(badge?.maxzoom).toBe(14);
    expect(sprite?.minzoom).toBe(14);

    // And the sprite's first size is the document's 14 px floor: 40 px of art × 0.4.
    const ramp = sprite?.layout?.['icon-size'] as unknown[];
    expect(ramp.slice(3, 5)).toEqual([14, 0.4]);
  });
});
