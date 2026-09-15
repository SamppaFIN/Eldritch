/**
 * The grade of a graded thing (BRDC-ART-005).
 *
 * Infinite: *"ota diablo sarjan värit, common, maaginen, rare, uniikke, legendaarinen"* —
 * that ladder is the one grading vocabulary a player already reads without being taught,
 * and the game had four tiers of `Rarity` in its data that said their grade in prose and
 * nowhere in colour.
 *
 * The constraint this had to clear is in `claude.md` §13: colour means *resource*,
 * everywhere. Two meanings on one channel is how both stop being laws. So rarity is a
 * separate channel with its own shape — a rail and an eyebrow — and it never touches a
 * figure, a resource word, or a mark on the map. The tokens carry the measurements.
 *
 * `note` is not optional garnish: it is what keeps the grade off colour-alone (§14). The
 * tier is always spelled out beside its hue.
 */
import type { CSSProperties, ReactNode } from 'react';

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface RarityProps {
  tier: RarityTier;
  /** The sentence the grade sits on — the reason colour is never carrying this alone. */
  note: ReactNode;
  className?: string;
}

/**
 * The ladder's hues, in TypeScript beside the `--rarity-*` tokens.
 *
 * The same dual table the map already keeps for resources (`RESOURCE_COLOUR` for the DOM,
 * `MAP_RESOURCE_COLOUR` as literals): CSS consumers that only need a swatch — the wonder's
 * stars — read the token, and anything that has to *reason* about the colour reads this.
 * `rarityPalette.test.ts` measures this table against the resource palette, so the
 * separation the ladder was chosen for is checked rather than remembered.
 */
export const RARITY_COLOUR: Readonly<Record<RarityTier, string>> = {
  common: '#8e8a99',
  uncommon: '#5b8cff',
  rare: '#d9a02b',
  legendary: '#ff5c1f',
};

const GRADE: Readonly<Record<RarityTier, string>> = {
  common: 'Common',
  uncommon: 'Magic',
  rare: 'Rare',
  legendary: 'Legendary',
};

export function Rarity({ tier, note, className }: RarityProps) {
  return (
    <p
      className={`es-rarity es-rarity--${tier}${className ? ` ${className}` : ''}`}
      style={{ '--es-rarity': RARITY_COLOUR[tier] } as CSSProperties}
    >
      <span className="es-rarity__grade">{GRADE[tier]}</span>
      <span className="es-rarity__note">{note}</span>
    </p>
  );
}
