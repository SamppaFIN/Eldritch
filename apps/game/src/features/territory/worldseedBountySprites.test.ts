/**
 * BRDC-RES-002 — the Worldseed pool's own icon library, as data.
 *
 * Same shape as `bountySprites.test.ts`; the one real difference is the shared-name test,
 * since this table intentionally omits the six ids that already have a legacy namesake.
 */
import { describe, expect, it } from 'vitest';
import { BONUS_RESOURCES } from '@es3/core';
import {
  WORLDSEED_BOUNTY_IDS,
  WORLDSEED_BOUNTY_PX,
  rasteriseWorldseedBounty,
  worldseedBountySpriteId,
  worldseedBountySvg,
} from './worldseedBountySprites.js';

/** `bounty.ts`'s own docstring names these six as naming the same thing in both pools. */
const SHARED_WITH_LEGACY = ['fish', 'deer', 'wheat', 'granite', 'marble', 'gems'];

describe('the worldseed bounty icon library', () => {
  it('covers every worldseed find with no legacy namesake, and nothing else', () => {
    const expected = BONUS_RESOURCES.map((r) => r.id).filter((id) => !SHARED_WITH_LEGACY.includes(id));
    expect([...WORLDSEED_BOUNTY_IDS].sort()).toEqual(expected.sort());
  });

  it('names each icon the same way the legacy pool does, so one map layer draws both', () => {
    expect(worldseedBountySpriteId('oak')).toBe('bounty-oak');
  });

  it('draws every one of them at the declared size', () => {
    for (const id of WORLDSEED_BOUNTY_IDS) {
      const svg = worldseedBountySvg(id);
      expect(svg).toContain(`width="${WORLDSEED_BOUNTY_PX}"`);
      expect(svg).toContain('viewBox="0 0 40 40"');
    }
  });

  // Each icon carries its own ground-contact shadow rather than one shared ellipse — the
  // source document draws a tinted pool under water finds and plain shade under everything
  // else, and that distinction is real signal, not noise to flatten away.
  it('grounds every icon near the bottom of the tile', () => {
    for (const id of WORLDSEED_BOUNTY_IDS) {
      expect(worldseedBountySvg(id)).toMatch(/<ellipse cx="20" cy="3[234]"/);
    }
  });

  it('gives no two finds the same picture', () => {
    expect(new Set(WORLDSEED_BOUNTY_IDS.map(worldseedBountySvg)).size).toBe(WORLDSEED_BOUNTY_IDS.length);
  });

  // Decoded by an `Image`, outside the document, where neither resolves.
  it('uses no custom property and no oklch, which an Image cannot resolve', () => {
    for (const id of WORLDSEED_BOUNTY_IDS) {
      expect(worldseedBountySvg(id)).not.toContain('var(--');
      expect(worldseedBountySvg(id)).not.toContain('oklch');
    }
  });

  it('rasterises to nothing where there is no canvas — the test runner', async () => {
    expect(await rasteriseWorldseedBounty()).toBeNull();
  });
});
