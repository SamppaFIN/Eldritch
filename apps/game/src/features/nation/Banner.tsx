/**
 * The six preset banners, as inline stroke-SVG (BRDC-BANNER-001).
 *
 * Sacred geometry drawn as structure, not decoration (`claude.md` §12): stroke, no fill,
 * one or two palette colours, crisp at any size. Static — a banner is not a "moment", so
 * it does not animate. One `viewBox` of 48, scaled by `size`.
 */
import type { BannerId } from './nation.js';
import { REALM_MARKS, isRealmMark } from './realmMarks.js';
import type { MarkInk, RealmMarkId } from './realmMarks.js';

const GOLD = 'var(--sacred-gold, #ffd700)';
const CYAN = 'var(--mystic-cyan, #00d4ff)';
const PURPLE = 'var(--cosmic-purple, #4a1a5c)';

/** A realm mark's ink, resolved to this project's CSS custom properties (with the same
 *  literal fallback style the three hand-drawn colours above already use). */
const MARK_INK: Readonly<Record<MarkInk, string>> = {
  gold: GOLD,
  cyan: CYAN,
  green: 'var(--awareness-green, #00ff88)',
  purple: PURPLE,
  culture: 'var(--r-culture, #f07bb5)',
  wisdom: 'var(--r-wisdom, #b07fe0)',
  iron: 'var(--r-iron, #a9cbdb)',
  timber: 'var(--r-timber, #5fae6a)',
  stone: 'var(--r-stone, #a8b2c4)',
  danger: 'var(--danger, #a63a3a)',
  muted: 'var(--text-muted, #b8b0c4)',
};

/** A generated realm mark: circles and a path, one stroke colour, no fill (Sigil §04). */
function realmMarkShape(id: RealmMarkId) {
  const mark = REALM_MARKS[id];
  const stroke = MARK_INK[mark.ink];
  return (
    <>
      {mark.circles.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={c.r} stroke={stroke} />
      ))}
      {mark.d ? <path d={mark.d} stroke={stroke} /> : null}
    </>
  );
}

/** The paths for one banner. `sw` scales the stroke with the drawing. */
function shape(id: BannerId) {
  if (isRealmMark(id)) return realmMarkShape(id);
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
  // The document's realm marks are built in a 100×100 space (Sigil §04); the six
  // hand-drawn originals are 48×48. Scaling one set's coordinates into the other's frame
  // would have meant translating every hand-authored path — the viewBox moves instead.
  const box = isRealmMark(id) ? 100 : 48;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${box} ${box}`}
      fill="none"
      strokeWidth={box / 24}
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
