import { describe, expect, it } from 'vitest';
import { PLACE_KINDS, placeSpriteId, placeSvg, rasterisePlaces } from './placeSprites.js';

/*
 * BRDC-SIGIL-006. A Temple and an Anchor Stone were a dot and a name; §03 draws them as
 * the hex's structure, and names the glow each one carries.
 */
describe('place sprites', () => {
  it('have stable, distinct atlas names', () => {
    expect(PLACE_KINDS.map(placeSpriteId)).toEqual(['place-temple', 'place-anchor']);
  });

  it('draw each kind as its own picture', () => {
    expect(placeSvg('temple')).not.toEqual(placeSvg('anchor'));
    for (const kind of PLACE_KINDS) expect(placeSvg(kind)).toMatch(/^<svg [^>]*viewBox="0 0 64 64"/);
  });

  it('carry the glow §03 gives them — gold for the Temple, green for the Anchor', () => {
    expect(placeSvg('temple')).toContain('#ffd700');
    expect(placeSvg('temple')).not.toContain('#00ff88');
    expect(placeSvg('anchor')).toContain('#00ff88');
    expect(placeSvg('anchor')).not.toContain('#ffd700');
  });

  it('give nothing back without a canvas, so the map keeps its dot', async () => {
    expect(await rasterisePlaces()).toBeNull();
  });
});
