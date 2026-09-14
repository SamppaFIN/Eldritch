/**
 * BRDC-SIGIL-003 — the bounty icon library, as data.
 *
 * `rasteriseBounty` needs a canvas and is exercised in the browser; everything that
 * decides what an icon *is* is a string, and that is what these hold to.
 */
import { describe, expect, it } from 'vitest';
import { BOUNTY_IDS } from '@es3/core';
import { BOUNTY_PX, BOUNTY_SPRITE_IDS, bountySpriteId, bountySvg } from './bountySprites.js';

describe('the bounty icon library', () => {
  it('covers every bounty the game has, and nothing else', () => {
    expect([...BOUNTY_SPRITE_IDS].sort()).toEqual([...BOUNTY_IDS].sort());
  });

  it('names each icon after its bounty, so the layer can build the id from data', () => {
    expect(bountySpriteId('wheat')).toBe('bounty-wheat');
  });

  it('draws every one of them at the declared size', () => {
    for (const id of BOUNTY_SPRITE_IDS) {
      const svg = bountySvg(id);
      expect(svg).toContain(`width="${BOUNTY_PX}"`);
      expect(svg).toContain('viewBox="0 0 40 40"');
    }
  });

  // Every icon sits on the same ground shadow, or a flat sheaf and a gem both read as
  // floating a hair above the tile.
  it('grounds every icon on the same shadow', () => {
    for (const id of BOUNTY_SPRITE_IDS) {
      expect(bountySvg(id)).toContain('<ellipse cx="20" cy="33" rx="11" ry="3.4"');
    }
  });

  it('gives no two bounties the same picture', () => {
    expect(new Set(BOUNTY_SPRITE_IDS.map(bountySvg)).size).toBe(BOUNTY_SPRITE_IDS.length);
  });

  // Decoded by an `Image`, outside the document, where neither resolves.
  it('uses no custom property and no oklch, which an Image cannot resolve', () => {
    for (const id of BOUNTY_SPRITE_IDS) {
      expect(bountySvg(id)).not.toContain('var(--');
      expect(bountySvg(id)).not.toContain('oklch');
    }
  });
});
