/**
 * The pictures on the cards (BRDC-ART-008).
 *
 * `GroundArt` is the ground a find stands on, drawn with the map's own art — the terrain
 * texture cut to a hex, its isometric tile on top, its rim drawing itself round it. No new
 * drawing: the card shows the same forest the map does, only large (ART-001's open promise,
 * "a picture of the hex's kind on the reveal card").
 *
 * The emblems are for the edge cards that were text alone — a dream, the day's Mythos, a
 * great person born. Each is built from its rule rather than drawn (Sigil §04): a polygram
 * is a point count and a step, a crescent two circles. Stroke, no fill, and each draws
 * itself in with the same `es-draw` the sacred geometry uses — which reduced motion stops.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { TerrainKind } from '@es3/core';
import { textureSvg } from '../territory/terrainTextures.js';
import { terrainSvg } from '../territory/terrainSprites.js';
import './card-art.css';

/** An SVG string as an image source; its own ids stay inside it (two textures both say `#g`). */
const uri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const GROUND = new Map<TerrainKind, { texture: string; tile: string }>();
function groundImages(kind: TerrainKind) {
  let g = GROUND.get(kind);
  if (!g) {
    g = { texture: uri(textureSvg(kind)), tile: uri(terrainSvg(kind)) };
    GROUND.set(kind, g);
  }
  return g;
}

const draw = (ms: number, delay = 0): CSSProperties => ({
  strokeDasharray: 1000,
  strokeDashoffset: 1000,
  animation: `es-draw ${ms}ms var(--ease-out) ${delay}ms forwards`,
});

const at = (r: number, deg: number, c = 50) => {
  const a = (deg * Math.PI) / 180;
  return `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
};

/** The hex's rim, pointy-top like the map's: the six corners at radius `r` of 100. */
const hexRim = (r: number) =>
  Array.from({ length: 6 }, (_, i) => at(r, -90 + i * 60)).join(' ');

export function GroundArt({ kind, size = 120 }: { kind: TerrainKind; size?: number }) {
  const { texture, tile } = groundImages(kind);
  const t = Math.round(size * 0.9);
  return (
    <span className="ground-art" style={{ inlineSize: size, blockSize: size }} aria-hidden>
      <img className="ground-art__ground" src={texture} width={size} height={size} alt="" />
      <img className="ground-art__tile" src={tile} width={t} height={t} alt="" />
      <svg className="es-icon ground-art__frame" width={size} height={size} viewBox="0 0 100 100" aria-hidden focusable={false}>
        <g fill="none" stroke="currentColor" vectorEffect="non-scaling-stroke">
          <polygon points={hexRim(48)} strokeWidth={1.5} style={draw(1400)} />
          <polygon points={hexRim(44)} strokeWidth={1} opacity={0.4} style={draw(1400, 200)} />
        </g>
      </svg>
    </span>
  );
}

/** The star polygon {n/k}: n points on a circle, each joined to the one k steps on. */
export function polygram(n: number, k: number, r: number, start = -90): string {
  const steps = n / gcd(n, k);
  const loops = gcd(n, k);
  let d = '';
  for (let l = 0; l < loops; l += 1) {
    for (let i = 0; i <= steps; i += 1) d += `${i === 0 ? 'M' : 'L'}${at(r, start + ((l + i * k) * 360) / n)} `;
  }
  return d.trim();
}
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

function Emblem({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg className="es-icon card-emblem" width={size} height={size} viewBox="0 0 100 100" aria-hidden focusable={false}>
      <g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {children}
      </g>
    </svg>
  );
}

/** Last night's dream: a crescent — two circles, the second taken from the first — and the
 *  three stars it was dreamt under. */
export function DreamEmblem({ size = 40 }: { size?: number }) {
  // Outer circle (50,50,34); inner (62,42,30). Their two crossings bound the crescent.
  const [x1, y1, r1, x2, y2, r2] = [50, 50, 34, 62, 42, 30];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);
  const mx = x1 + (a * dx) / d;
  const my = y1 + (a * dy) / d;
  const f = (n: number) => n.toFixed(2);
  const p = `${f(mx + (h * dy) / d)} ${f(my - (h * dx) / d)}`;
  const q = `${f(mx - (h * dy) / d)} ${f(my + (h * dx) / d)}`;
  const crescent = `M${p} A${r1} ${r1} 0 1 0 ${q} A${r2} ${r2} 0 1 1 ${p}`;
  return (
    <Emblem size={size}>
      <path d={crescent} style={draw(1200)} />
      {(
        [
          [74, 22],
          [86, 40],
          [80, 60],
        ] as const
      ).map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 4} L${x} ${y + 4} M${x - 4} ${y} L${x + 4} ${y}`} style={draw(600, 500 + i * 150)} />
      ))}
    </Emblem>
  );
}

/** The day's Mythos: a five-pointed branch in a ring, and an eye at its heart — the sign
 *  the paper's back page is printed under. */
export function MythosEmblem({ size = 40 }: { size?: number }) {
  return (
    <Emblem size={size}>
      <circle cx={50} cy={50} r={44} style={draw(1000)} />
      <path d={polygram(5, 2, 40)} style={draw(1200, 200)} />
      <path d="M38 50 Q50 40 62 50 Q50 60 38 50 Z" style={draw(600, 700)} />
      <circle cx={50} cy={50} r={3} style={draw(400, 900)} />
    </Emblem>
  );
}

/** A great person born: the eight-pointed star {8/3} of a name the town will keep, in a
 *  double ring. */
export function GreatEmblem({ size = 40 }: { size?: number }) {
  return (
    <Emblem size={size}>
      <circle cx={50} cy={50} r={46} style={draw(1000)} />
      <circle cx={50} cy={50} r={40} opacity={0.5} style={draw(1000, 100)} />
      <path d={polygram(8, 3, 40, -90 + 360 / 16)} style={draw(1400, 250)} />
      <circle cx={50} cy={50} r={10} style={draw(500, 900)} />
    </Emblem>
  );
}

