/**
 * Reading a GPX track (PIVOT-2026-09-09 §9, BRDC-GPX-001).
 *
 * A watch or a phone tracker writes `.gpx`; this turns it into the same `TrailPoint[]`
 * the live GPS produces, and nothing else. **That is the whole design.** The points then
 * go through `submitTrail` exactly as a walk does, so the same filters run, the same
 * adjacency rule claims the same ground, and dwell accrues the same way. An import that
 * had its own claiming path would drift from the live one the first time either changed.
 *
 * Parsed with a scanner rather than a DOM: `packages/core` is pure TypeScript with no
 * browser, and a GPX track point is a flat element with two attributes and a time — not a
 * document that needs a tree.
 *
 * Two things the format simply does not carry, and what is done about each:
 *
 * - **Accuracy.** There is no such field. `hdop` is the closest thing and is a dilution
 *   figure, not metres; the usual rough conversion is five metres per unit. Without one,
 *   `GPX_ASSUMED_ACCURACY_M` stands in — refusing every point for the lack of a field the
 *   format does not have would make the feature useless, and the number is stated here
 *   rather than hidden as a literal.
 * - **Trust.** A file can say anything. The speed and interval filters still run, so a
 *   fabricated track with teleports in it is thrown out the same way a bad fix is — but a
 *   patiently forged file is indistinguishable from a walk, and pretending otherwise would
 *   be worse than saying so. Real authority is Phase 5's server.
 */
import { MAX_ACCURACY_M } from '../rules/constants.js';
import type { TrailPoint } from '../types/domain.js';

/**
 * Stood in for a track that does not say. A consumer GPS is typically 5–15 m, and this
 * sits inside `MAX_ACCURACY_M` so an ordinary track is not rejected wholesale.
 */
export const GPX_ASSUMED_ACCURACY_M = 10;

/** Metres of error per unit of HDOP — the conventional rough reading. */
const METRES_PER_HDOP = 5;

export type GpxFault =
  | 'not-gpx'
  | 'no-points'
  /** Points without times: the interval and speed filters have nothing to measure. */
  | 'no-times';

export type GpxParse = { ok: true; points: TrailPoint[] } | { ok: false; fault: GpxFault };

const TRKPT = /<(?:trkpt|wpt|rtept)\b([^>]*)>([\s\S]*?)<\/(?:trkpt|wpt|rtept)>|<(?:trkpt|wpt|rtept)\b([^>]*)\/>/gi;
/**
 * `lat="61.47"`, whatever the quoting and spacing.
 *
 * The escapes are doubled because this is a template literal, not a regex literal: in a
 * template a lone backslash-b is a *backspace character*, not a word boundary — so the
 * first version built a pattern that could never match, and every point silently lost its
 * coordinates. The tests caught it; reading it would not have.
 */
const ATTR = (name: string) =>
  new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i');
const TIME = /<time>([^<]+)<\/time>/i;
const HDOP = /<hdop>([^<]+)<\/hdop>/i;

const LAT = ATTR('lat');
const LON = ATTR('lon');

/**
 * Read a GPX file into trail points, oldest first.
 *
 * Sorted by time rather than trusting file order: a track merged from two devices, or one
 * a tool has rewritten, can arrive out of order, and a backwards interval would read as a
 * negative speed — which the filters were never written to judge.
 */
export function parseGpx(text: string): GpxParse {
  if (!/<gpx[\s>]/i.test(text)) return { ok: false, fault: 'not-gpx' };

  const points: TrailPoint[] = [];
  let untimed = 0;
  let match: RegExpExecArray | null;
  TRKPT.lastIndex = 0;

  while ((match = TRKPT.exec(text)) !== null) {
    const attrs = match[1] ?? match[3] ?? '';
    const body = match[2] ?? '';
    const lat = Number(LAT.exec(attrs)?.[1]);
    const lng = Number(LON.exec(attrs)?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const stamp = TIME.exec(body)?.[1];
    const t = stamp ? Date.parse(stamp) : Number.NaN;
    if (!Number.isFinite(t)) {
      untimed += 1;
      continue;
    }

    const hdop = Number(HDOP.exec(body)?.[1]);
    const accuracy =
      Number.isFinite(hdop) && hdop > 0
        ? Math.min(MAX_ACCURACY_M, hdop * METRES_PER_HDOP)
        : GPX_ASSUMED_ACCURACY_M;

    points.push({ lat, lng, t, accuracy });
  }

  if (points.length === 0) return { ok: false, fault: untimed > 0 ? 'no-times' : 'no-points' };
  points.sort((a, b) => a.t - b.t);
  return { ok: true, points };
}
