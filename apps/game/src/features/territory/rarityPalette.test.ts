import { describe, expect, it } from 'vitest';
import { RARITY_COLOUR } from '@es3/ui';
import { MAP_RESOURCE_COLOUR } from './territoryFeatures.js';

/**
 * The rarity ladder must never be mistakable for a resource (BRDC-ART-005).
 *
 * `claude.md` §13 gives colour one meaning — the resource — and BRDC-ART-005 adds a
 * second language beside it. The two only stay readable because their hues do not
 * overlap, and that separation was *measured* when the ladder was chosen rather than
 * eyeballed: Diablo's natural rare yellow landed 20/441 from the `tokens` resource, and
 * a rare reveal pays tokens, so the two would have sat in one card meaning different
 * things. Rare became amber for that reason alone.
 *
 * A comment recording that decision rots the moment someone retunes a swatch, so the
 * separation is asserted instead. It measures `RARITY_COLOUR` — the table the `Rarity`
 * component actually renders with — rather than the stylesheet beside it, so what is
 * checked is what a player sees.
 */
const rgb = (h: string): number[] =>
  [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));

const distance = (a: string, b: string): number =>
  Math.hypot(...rgb(a).map((v, i) => v - (rgb(b)[i] as number)));

/** Below this two swatches read as the same colour on a phone in daylight. */
const CLEAR = 60;

describe('the rarity ladder', () => {
  const tiers: Record<string, string> = RARITY_COLOUR;

  it('defines all four tiers, each recording its hex', () => {
    expect(Object.keys(tiers).sort()).toEqual(['common', 'legendary', 'rare', 'uncommon']);
  });

  it('keeps every tier clear of every resource colour', () => {
    for (const [tier, hex] of Object.entries(tiers)) {
      for (const [resource, swatch] of Object.entries(MAP_RESOURCE_COLOUR)) {
        expect(
          distance(hex, swatch),
          `${tier} (${hex}) is too close to ${resource} (${swatch})`,
        ).toBeGreaterThan(CLEAR);
      }
    }
  });

  it('keeps the tiers apart from each other', () => {
    const ladder = ['common', 'uncommon', 'rare', 'legendary'].map((t) => tiers[t] as string);
    for (let i = 0; i < ladder.length - 1; i += 1) {
      expect(
        distance(ladder[i] as string, ladder[i + 1] as string),
        `${ladder[i]} and ${ladder[i + 1]} are a step apart and must look it`,
      ).toBeGreaterThan(CLEAR);
    }
  });
});
