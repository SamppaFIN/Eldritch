/**
 * Sacred geometry, generated from its actual construction rules — not hand-drawn paths.
 *
 * v2's lore calls Sacred Geometry "the mathematical foundation of reality", so the
 * shapes are computed: the Flower of Life really is circles at 60° intervals, and
 * Metatron's Cube really is every centre of the Fruit of Life connected to every other.
 *
 * All stroke, no fill. Animated via stroke-dasharray so it draws itself.
 * Explicit width/height on every <svg> — CLS on a map app is unforgivable.
 */
import type { CSSProperties } from 'react';

const TAU = Math.PI * 2;

export interface GeometryProps {
  /** Rendered size in px. Also the intrinsic width/height, so no layout shift. */
  size?: number;
  /** Any CSS colour. Defaults to currentColor so it inherits. */
  color?: string;
  strokeWidth?: number;
  /** Draw-in animation duration in ms. 0 disables it. */
  animate?: number;
  className?: string;
  style?: CSSProperties;
  /**
   * Decorative by default: hidden from assistive tech. Pass a label to expose it
   * (AI-Koulu ch.4 — icons without a name are an anti-pattern, but decoration
   * announced as "image" is noise).
   */
  label?: string;
}

interface Pt {
  x: number;
  y: number;
}

/** Ring of `count` points at `radius`, starting at `startDeg`. */
function ring(cx: number, cy: number, radius: number, count: number, startDeg = -90): Pt[] {
  const start = (startDeg * Math.PI) / 180;
  return Array.from({ length: count }, (_, i) => {
    const a = start + (TAU * i) / count;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  });
}

function a11y(label: string | undefined) {
  return label
    ? ({ role: 'img', 'aria-label': label } as const)
    : ({ 'aria-hidden': true, focusable: false } as const);
}

function drawStyle(animate: number, delay = 0): CSSProperties | undefined {
  if (!animate) return undefined;
  return {
    strokeDasharray: 1000,
    strokeDashoffset: 1000,
    animation: `es-draw ${animate}ms var(--ease-out) ${delay}ms forwards`,
  };
}

/* ---------------------------------------------------------------------------
   Flower of Life — 19 overlapping circles on a hexagonal lattice.
   Used for: loading, level-up, empty states.
   ------------------------------------------------------------------------ */

export function FlowerOfLife({
  size = 120,
  color = 'currentColor',
  strokeWidth = 1,
  animate = 0,
  className,
  style,
  label,
}: GeometryProps) {
  const c = 50;
  const r = 100 / 7; // 19 circles fit a 100-unit box at this radius
  const centres: Pt[] = [
    { x: c, y: c },
    ...ring(c, c, r, 6, -90),
    ...ring(c, c, r * 2, 6, -90),
    ...ring(c, c, r * Math.sqrt(3), 6, -60),
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      {...a11y(label)}
    >
      <g fill="none" stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke">
        {centres.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={r}
            style={drawStyle(animate, animate ? i * 40 : 0)}
          />
        ))}
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Metatron's Cube — the 13 circles of the Fruit of Life, every centre joined
   to every other. 78 lines, all of them earned.
   Used for: the title screen sigil, major claim events.
   ------------------------------------------------------------------------ */

export function MetatronsCube({
  size = 160,
  color = 'currentColor',
  strokeWidth = 0.7,
  animate = 0,
  className,
  style,
  label,
}: GeometryProps) {
  const c = 50;
  const r = 100 / 8;
  const centres: Pt[] = [
    { x: c, y: c },
    ...ring(c, c, r * 2, 6, -90),
    ...ring(c, c, r * 2 * Math.sqrt(3), 6, -60),
  ];

  const lines: Array<[Pt, Pt]> = [];
  for (let i = 0; i < centres.length; i++) {
    for (let j = i + 1; j < centres.length; j++) {
      lines.push([centres[i] as Pt, centres[j] as Pt]);
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      {...a11y(label)}
    >
      <g fill="none" stroke={color} vectorEffect="non-scaling-stroke">
        <g strokeWidth={strokeWidth} opacity={0.45}>
          {lines.map(([a, b], i) => (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              style={drawStyle(animate, animate ? i * 8 : 0)}
            />
          ))}
        </g>
        <g strokeWidth={strokeWidth * 1.6}>
          {centres.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={r} style={drawStyle(animate, animate ? 400 + i * 50 : 0)} />
          ))}
        </g>
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Hex mandala — concentric hexagon rings. The territory is H3 hexagons, so the
   claim burst is the same shape the game is made of.
   Used for: loop closure, claim confirmation.
   ------------------------------------------------------------------------ */

export function HexMandala({
  size = 140,
  color = 'currentColor',
  strokeWidth = 1,
  animate = 0,
  className,
  style,
  label,
}: GeometryProps) {
  const c = 50;
  const rings = [12, 24, 36, 48];
  const hex = (radius: number, rotate: number) =>
    ring(c, c, radius, 6, rotate)
      .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      {...a11y(label)}
    >
      <g fill="none" stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke">
        {rings.map((radius, i) => (
          <polygon
            key={radius}
            points={hex(radius, i % 2 ? -60 : -90)}
            opacity={1 - i * 0.18}
            style={drawStyle(animate, animate ? i * 120 : 0)}
          />
        ))}
        {ring(c, c, rings.at(-1) as number, 6, -90).map((p, i) => (
          <line key={i} x1={c} y1={c} x2={p.x} y2={p.y} opacity={0.3} style={drawStyle(animate, animate ? 300 : 0)} />
        ))}
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Vesica piscis — two circles whose centres sit on each other's circumference.
   Used for: dividers, panel ornaments. Wide, not square.
   ------------------------------------------------------------------------ */

export function VesicaDivider({
  size = 200,
  color = 'currentColor',
  strokeWidth = 1,
  className,
  style,
  label,
}: GeometryProps) {
  const height = Math.round(size * 0.12);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 200 24"
      className={className}
      style={style}
      {...a11y(label)}
    >
      <g fill="none" stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke">
        <line x1="0" y1="12" x2="76" y2="12" opacity={0.35} />
        <circle cx="94" cy="12" r="11" opacity={0.8} />
        <circle cx="106" cy="12" r="11" opacity={0.8} />
        <line x1="124" y1="12" x2="200" y2="12" opacity={0.35} />
      </g>
    </svg>
  );
}
