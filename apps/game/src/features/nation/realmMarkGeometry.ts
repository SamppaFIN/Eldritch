/**
 * The four constructions every realm mark is built from (Sigil §04).
 *
 * The design document's own point: a mark is not drawn, it is *generated* — a circle
 * count and a chord step are the whole definition, so every one is exact at any size and
 * costs one short description instead of a hand-authored path. `realmMarks.ts` is data;
 * this is the arithmetic that data is read by.
 *
 * A 100×100 space, centred on (50, 50) — the document's own convention, kept rather than
 * rescaled, so a mark ported from it needs no coordinate translation.
 */

/** Rounded to two decimals — plenty for a mark drawn at a few dozen pixels, and it keeps
 *  the generated path strings short. */
const round = (n: number): number => Math.round(n * 100) / 100;

function point(cx: number, cy: number, dist: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [round(cx + dist * Math.cos(rad)), round(cy + dist * Math.sin(rad))];
}

export interface MarkCircle {
  x: number;
  y: number;
  r: number;
}

/** `n` circles of radius `r`, `dist` from the centre, the first at angle `off`. */
export function ring(
  n: number,
  dist: number,
  off: number,
  r: number,
  cx = 50,
  cy = 50,
): MarkCircle[] {
  return Array.from({ length: n }, (_, i) => {
    const [x, y] = point(cx, cy, dist, off + (i * 360) / n);
    return { x, y, r };
  });
}

/** A closed polygon: `n` vertices at radius `R`, rotated by `rot`. */
export function poly(n: number, R: number, rot: number, cx = 50, cy = 50): string {
  const pts = Array.from({ length: n }, (_, i) => point(cx, cy, R, rot + (i * 360) / n));
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join('') + 'Z';
}

/** A star polygon: `n` points on a circle, every `step`-th one joined to the next. */
export function chords(n: number, step: number, R: number, rot: number, cx = 50, cy = 50): string {
  const pts = Array.from({ length: n }, (_, i) => point(cx, cy, R, rot + (i * 360) / n));
  return pts
    .map(([ax, ay], i) => {
      const [bx, by] = pts[(i + step) % n] as [number, number];
      return `M${ax},${ay}L${bx},${by}`;
    })
    .join('');
}

/** Every pair of circles joined once — what turns the Fruit of Life into Metatron's Cube. */
export function pairs(nodes: readonly MarkCircle[]): string {
  let d = '';
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      d += `M${nodes[i]?.x},${nodes[i]?.y}L${nodes[j]?.x},${nodes[j]?.y}`;
    }
  }
  return d;
}

/** A logarithmic spiral: `turns` full rotations from radius `r0`, growing by `g` per turn. */
export function spiral(turns: number, r0: number, g: number, cx = 50, cy = 50): string {
  const steps = turns * 48;
  let d = '';
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / 48) * 2 * Math.PI;
    const r = r0 * Math.pow(g, t / (2 * Math.PI));
    const x = round(cx + r * Math.cos(t));
    const y = round(cy + r * Math.sin(t));
    d += `${i ? 'L' : 'M'}${x},${y}`;
  }
  return d;
}

/** The thirteen circles of the Fruit of Life: a centre, a ring of six, a ring of six more. */
export const FRUIT_OF_LIFE: readonly MarkCircle[] = [
  { x: 50, y: 50, r: 8 },
  ...ring(6, 16, 0, 8),
  ...ring(6, 27.71, 30, 8),
];
