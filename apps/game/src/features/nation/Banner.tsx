/**
 * The six preset banners, as inline stroke-SVG (BRDC-BANNER-001).
 *
 * Sacred geometry drawn as structure, not decoration (`claude.md` §12): stroke, no fill,
 * one or two palette colours, crisp at any size. Static — a banner is not a "moment", so
 * it does not animate. One `viewBox` of 48, scaled by `size`.
 */
import type { BannerId } from './nation.js';

const GOLD = 'var(--sacred-gold, #ffd700)';
const CYAN = 'var(--mystic-cyan, #00d4ff)';
const PURPLE = 'var(--cosmic-purple, #4a1a5c)';

/** The paths for one banner. `sw` scales the stroke with the drawing. */
function shape(id: BannerId) {
  switch (id) {
    case 'vesica':
      return (
        <>
          <circle cx="19" cy="24" r="13" stroke={GOLD} />
          <circle cx="29" cy="24" r="13" stroke={CYAN} />
        </>
      );
    case 'heptagram':
      return (
        <path
          stroke={GOLD}
          d="M24 5 L38 40 L9 18 L39 18 L10 40 Z M24 5 L34 43 L4 22 L44 22 L14 43 Z"
        />
      );
    case 'chevron':
      return (
        <>
          <path stroke={GOLD} d="M6 20 L24 8 L42 20" />
          <path stroke={CYAN} d="M6 32 L24 20 L42 32" />
          <path stroke={GOLD} d="M6 42 L24 30 L42 42" />
        </>
      );
    case 'pale':
      return (
        <>
          <path stroke={GOLD} d="M24 4 V44" />
          <path stroke={CYAN} d="M12 4 V44" />
          <path stroke={CYAN} d="M36 4 V44" />
        </>
      );
    case 'eye':
      return (
        <>
          <path stroke={GOLD} d="M4 24 C14 10 34 10 44 24 C34 38 14 38 4 24 Z" />
          <circle cx="24" cy="24" r="6" stroke={CYAN} />
        </>
      );
    case 'triquetra':
      return (
        <>
          <circle cx="24" cy="16" r="11" stroke={GOLD} />
          <circle cx="15" cy="31" r="11" stroke={GOLD} />
          <circle cx="33" cy="31" r="11" stroke={GOLD} />
        </>
      );
  }
}

export interface BannerProps {
  id: BannerId;
  size?: number;
}

export function Banner({ id, size = 44 }: BannerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-hidden
      style={{ background: PURPLE, borderRadius: 'var(--radius-sm, 4px)' }}
    >
      {shape(id)}
    </svg>
  );
}
