/**
 * The player's personal sigil, drawn (Sigil §04, BRDC-SIGIL-005).
 *
 * Twenty faces in five families — Silhouette, Ocular, Aquatic, Stroke sigil, Duotone —
 * each built to survive a 44 px circular crop: one silhouette, at most three values, no
 * detail smaller than a couple of pixels at that size. `currentColor` throughout, so the
 * wrapping `<svg>` tints the whole thing with one CSS property; the shapes never repeat
 * a colour decision the ink table already made.
 */
import type { ReactNode } from 'react';
import { AVATAR_SHAPE_A } from './avatarShapesA.js';
import { AVATAR_SHAPE_B } from './avatarShapesB.js';
import type { AvatarFamily, AvatarId } from './avatarIds.js';

const AVATAR_SHAPE: Partial<Record<AvatarId, ReactNode>> = {
  ...AVATAR_SHAPE_A,
  ...AVATAR_SHAPE_B,
};

export interface AvatarMeta {
  name: string;
  family: AvatarFamily;
  ink: string;
}

/** `var(--x, #hex)` throughout — the DOM-only representation, the same style
 *  `Banner.tsx` uses for its own three colours. There is no map-atlas twin to keep in
 *  step: an avatar is never rasterised, it only ever renders inside a React tree. */
export const AVATAR_META: Readonly<Record<AvatarId, AvatarMeta>> = {
  'the-seeker': { name: 'The Seeker', family: 'silhouette', ink: 'var(--sacred-gold, #ffd700)' },
  'the-hollow': { name: 'The Hollow', family: 'silhouette', ink: 'var(--text-muted, #b8b0c4)' },
  'night-gaunt': { name: 'Night Gaunt', family: 'silhouette', ink: 'var(--cosmic-purple, #4a1a5c)' },
  'moon-beast': { name: 'Moon Beast', family: 'silhouette', ink: 'var(--r-stone, #a8b2c4)' },
  'the-watcher': { name: 'The Watcher', family: 'ocular', ink: 'var(--mystic-cyan, #00d4ff)' },
  'many-eyed': { name: 'Many-Eyed', family: 'ocular', ink: 'var(--r-wisdom, #b07fe0)' },
  'the-dreamer': { name: 'The Dreamer', family: 'ocular', ink: 'var(--r-culture, #f07bb5)' },
  shoggoth: { name: 'Shoggoth', family: 'ocular', ink: 'var(--awareness-green, #00ff88)' },
  'deep-one': { name: 'Deep One', family: 'aquatic', ink: 'var(--r-mana, #00d4ff)' },
  'tentacle-crown': { name: 'Tentacle Crown', family: 'aquatic', ink: 'var(--cosmic-purple, #4a1a5c)' },
  'the-drowned': { name: 'The Drowned', family: 'aquatic', ink: 'var(--eldritch-blue, #1e2a4a)' },
  'star-spawn': { name: 'Star Spawn', family: 'aquatic', ink: 'var(--r-culture, #f07bb5)' },
  'elder-sign': { name: 'Elder Sign', family: 'stroke-sigil', ink: 'var(--sacred-gold, #ffd700)' },
  'the-key': { name: 'The Key', family: 'stroke-sigil', ink: 'var(--r-gold, #ffd700)' },
  'the-herald': { name: 'The Herald', family: 'stroke-sigil', ink: 'var(--r-iron, #a9cbdb)' },
  'the-colour': { name: 'The Colour', family: 'stroke-sigil', ink: 'var(--r-culture, #f07bb5)' },
  'the-lighthouse': { name: 'The Lighthouse', family: 'duotone', ink: 'var(--sacred-gold, #ffd700)' },
  mycelium: { name: 'Mycelium', family: 'duotone', ink: 'var(--r-timber, #5fae6a)' },
  'crawling-mist': { name: 'Crawling Mist', family: 'duotone', ink: 'var(--r-stone, #a8b2c4)' },
  'the-scribe': { name: 'The Scribe', family: 'duotone', ink: 'var(--r-wisdom, #b07fe0)' },
};

export interface AvatarProps {
  id: AvatarId;
  size?: number;
}

export function Avatar({ id, size = 64 }: AvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden
      style={{ color: AVATAR_META[id].ink, display: 'block' }}
    >
      {AVATAR_SHAPE[id]}
    </svg>
  );
}
