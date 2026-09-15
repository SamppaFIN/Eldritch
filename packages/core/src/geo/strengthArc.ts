/**
 * The strength arc: how well a cell is held, drawn on the hex itself (Sigil §03).
 *
 * The document's rule, verbatim: *"Fills the lower three edges clockwise, 0→500. Green
 * healthy, gold under 200, red pulsing inside the decay window. Legible peripherally,
 * ignorable otherwise."*
 *
 * Peripheral legibility is the whole point, and it is why this is geometry rather than a
 * number: walking, at arm's length, in daylight, a filled edge is readable when a figure
 * is not. The number stays too — colour and length never carry a fact alone (§14) — but
 * the arc is what the eye gets for free.
 *
 * Pure, and in `geo` rather than the app, because it is arithmetic on a boundary: the
 * lower three edges of a hexagon and a fraction of their length. The map layer that draws
 * it owns none of this.
 */
import { cellBoundary } from './cells.js';
import type { H3Index } from '../types/domain.js';

/** Metres per degree of latitude, near enough for ordering and interpolation. */
const M_PER_DEG = 111_320;

function midLat(a: readonly [number, number], b: readonly [number, number]): number {
  return (a[1] + b[1]) / 2;
}

/** Flat-earth length of a segment in metres — the cell is 45 m across, so this is exact enough. */
function span(a: readonly [number, number], b: readonly [number, number]): number {
  const dLat = (b[1] - a[1]) * M_PER_DEG;
  const dLng = (b[0] - a[0]) * M_PER_DEG * Math.cos((a[1] * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/**
 * The hexagon's lower three edges, as four points, ordered clockwise on screen.
 *
 * "Lower" is decided by each edge's midpoint latitude rather than by vertex order, because
 * h3 does not promise where a boundary starts. The three lowest are always contiguous on a
 * convex hexagon, so the run they form is the bottom of the shape.
 */
export function lowerEdges(h3: H3Index): Array<[number, number]> {
  const ring = cellBoundary(h3);
  const n = ring.length;

  // Score each edge by how low it sits, then take the best contiguous run of three.
  let bestStart = 0;
  let bestScore = Infinity;
  for (let i = 0; i < n; i += 1) {
    let score = 0;
    for (let k = 0; k < 3; k += 1) {
      const a = ring[(i + k) % n] as [number, number];
      const b = ring[(i + k + 1) % n] as [number, number];
      score += midLat(a, b);
    }
    if (score < bestScore) {
      bestScore = score;
      bestStart = i;
    }
  }

  const run: Array<[number, number]> = [];
  for (let k = 0; k <= 3; k += 1) run.push(ring[(bestStart + k) % n] as [number, number]);

  // Clockwise on screen means left to right along the bottom: west end first.
  const first = run[0] as [number, number];
  const last = run[run.length - 1] as [number, number];
  return first[0] <= last[0] ? run : run.reverse();
}

/**
 * The first `fraction` of those three edges, as a line.
 *
 * Returns `null` below a hair of length — an empty or one-point LineString is not
 * something to hand a renderer, and a cell at zero strength has no arc to draw.
 */
export function strengthArc(h3: H3Index, fraction: number): Array<[number, number]> | null {
  const clamped = Math.max(0, Math.min(1, fraction));
  if (clamped <= 0) return null;

  const path = lowerEdges(h3);
  const lengths = path.slice(0, -1).map((p, i) => span(p, path[i + 1] as [number, number]));
  const total = lengths.reduce((sum, l) => sum + l, 0);
  if (total === 0) return null;

  let want = total * clamped;
  const out: Array<[number, number]> = [path[0] as [number, number]];

  for (let i = 0; i < lengths.length; i += 1) {
    const segment = lengths[i] as number;
    const from = path[i] as [number, number];
    const to = path[i + 1] as [number, number];

    if (want >= segment) {
      out.push(to);
      want -= segment;
      continue;
    }
    // Stop part-way along this edge.
    const t = segment === 0 ? 0 : want / segment;
    out.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
    break;
  }

  return out.length >= 2 ? out : null;
}
