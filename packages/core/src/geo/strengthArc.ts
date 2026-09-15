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

/** Flat-earth length of a segment in metres — the cell is 45 m across, so this is exact enough. */
function span(a: readonly [number, number], b: readonly [number, number]): number {
  const dLat = (b[1] - a[1]) * M_PER_DEG;
  const dLng = (b[0] - a[0]) * M_PER_DEG * Math.cos((a[1] * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

/**
 * The hexagon's lower three edges, as four points, ordered west to east.
 *
 * Built around the cell's lowest vertex, so the run is the "V" at the bottom of the hex.
 * Sigil §03 draws it that way: from the lower-left vertex down to the bottom one, up to the
 * lower-right, and on up the right side — so a weak cell's arc still sits on the bottom.
 * The first version took the three edges with the lowest *midpoints*; on a pointy-top hex
 * the vertical side ties with the bottom edges, the side won, and a cell at 100 drew as a
 * sliver climbing its left flank (BRDC-SIGIL-006).
 *
 * "Lowest" is decided by latitude rather than by vertex order, because h3 does not promise
 * where a boundary starts.
 */
export function lowerEdges(h3: H3Index): Array<[number, number]> {
  const ring = cellBoundary(h3);
  const n = ring.length;
  const at = (i: number): [number, number] => ring[((i % n) + n) % n] as [number, number];

  let low = 0;
  for (let i = 1; i < n; i += 1) if (at(i)[1] < at(low)[1]) low = i;

  // Walk from whichever neighbour of the lowest vertex lies west, through it, and east.
  const step = at(low - 1)[0] <= at(low + 1)[0] ? 1 : -1;
  return [at(low - step), at(low), at(low + step), at(low + 2 * step)];
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
