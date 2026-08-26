/**
 * Walk simulator.
 *
 * A territory game cannot be developed if every test requires going outside. This
 * produces GPS traces that behave like a phone in a pocket: a nominal pace, drifting
 * heading, and per-fix noise — realistic enough that the trail filter has something to
 * do, clean enough that a good route is not rejected.
 *
 * Deterministic by construction. Every trace is a pure function of its seed, because a
 * loop-detection test that passes four times in five is not a test.
 */
import { MIN_POINT_INTERVAL_MS } from '../rules/constants.js';
import type { LatLng, TrailPoint } from '../types/domain.js';
import { destination } from '../geo/project.js';

/** mulberry32 — small, fast, and identical on every platform. */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type WalkPattern =
  /** Straight line on the starting heading. */
  | 'straight'
  /** Constant turn rate — an arc. */
  | 'curve'
  /** Heading wanders. A dog walk, not a commute. */
  | 'random'
  /** Standing still. Produces fixes that the filter should consolidate away. */
  | 'stop';

export interface WalkOptions {
  start: LatLng;
  pattern: WalkPattern;
  /** Metres per second. 1.4 is an unhurried adult walking pace. */
  speedMs?: number;
  durationMs: number;
  /** Fix interval. Defaults to the minimum the filter will accept. */
  intervalMs?: number;
  /** Initial heading, degrees clockwise from north. */
  headingDeg?: number;
  /** Degrees per second of turn. Only used by 'curve'. */
  turnRateDegS?: number;
  /** Standard deviation of positional noise, metres. */
  noiseM?: number;
  /** Reported accuracy, metres. Must stay under MAX_ACCURACY_M to be accepted. */
  accuracyM?: number;
  seed?: number;
  /** Epoch ms of the first fix. */
  startTime?: number;
}

/**
 * Generate a trace.
 *
 * Noise is applied to the *reported* position only, never to the dead-reckoned truth.
 * If noise fed back into the path the walk would random-walk away from its intended
 * shape, and a "square" fixture would stop being square.
 */
export function simulateWalk(opts: WalkOptions): TrailPoint[] {
  const {
    start,
    pattern,
    speedMs = 1.4,
    durationMs,
    intervalMs = MIN_POINT_INTERVAL_MS,
    headingDeg = 0,
    turnRateDegS = 3,
    noiseM = 3,
    accuracyM = 8,
    seed = 1,
    startTime = 0,
  } = opts;

  const rnd = prng(seed);
  const points: TrailPoint[] = [];
  const steps = Math.floor(durationMs / intervalMs);
  const stepSeconds = intervalMs / 1000;
  const stepMetres = pattern === 'stop' ? 0 : speedMs * stepSeconds;

  let truth = start;
  let heading = headingDeg;

  for (let i = 0; i <= steps; i++) {
    if (i > 0) {
      if (pattern === 'curve') heading += turnRateDegS * stepSeconds;
      // Bounded wander: ±20 degrees per fix keeps it a walk rather than a stumble.
      else if (pattern === 'random') heading += (rnd() - 0.5) * 40;
      heading = ((heading % 360) + 360) % 360;
      truth = destination(truth, heading, stepMetres);
    }

    points.push({ ...jitter(truth, noiseM, rnd), t: startTime + i * intervalMs, accuracy: accuracyM });
  }

  return points;
}

/** Box-Muller gives a Gaussian scatter; a uniform one looks like a square of error. */
function jitter(p: LatLng, sigmaM: number, rnd: () => number): LatLng {
  if (sigmaM <= 0) return p;
  const u = Math.max(rnd(), Number.EPSILON);
  const magnitude = Math.sqrt(-2 * Math.log(u)) * sigmaM;
  return destination(p, rnd() * 360, magnitude);
}

/**
 * Walk a closed polygon, corner to corner.
 *
 * This is how the loop fixtures are built: a square is four legs, a figure-eight is two
 * squares sharing a corner. The final leg returns to the first vertex, so the trace
 * genuinely closes rather than merely coming near.
 */
export function simulatePolygon(
  vertices: readonly LatLng[],
  opts: Omit<WalkOptions, 'start' | 'pattern' | 'durationMs'> = {},
): TrailPoint[] {
  const {
    speedMs = 1.4,
    intervalMs = MIN_POINT_INTERVAL_MS,
    noiseM = 3,
    accuracyM = 8,
    seed = 1,
    startTime = 0,
  } = opts;

  if (vertices.length < 2) return [];

  const rnd = prng(seed);
  const points: TrailPoint[] = [];
  const stepMetres = speedMs * (intervalMs / 1000);
  let t = startTime;

  const closed = [...vertices, vertices[0] as LatLng];

  for (let v = 0; v < closed.length - 1; v++) {
    const from = closed[v] as LatLng;
    const to = closed[v + 1] as LatLng;
    const legMetres = legLength(from, to);
    const legSteps = Math.max(1, Math.round(legMetres / stepMetres));

    // The last vertex is emitted by the next leg, so legs do not double up corners.
    for (let s = 0; s < legSteps; s++) {
      const truth = lerp(from, to, s / legSteps);
      points.push({ ...jitter(truth, noiseM, rnd), t, accuracy: accuracyM });
      t += intervalMs;
    }
  }

  // Close the ring explicitly.
  points.push({ ...jitter(vertices[0] as LatLng, noiseM, rnd), t, accuracy: accuracyM });
  return points;
}

/** Straight-line interpolation. Fine at these distances; a great circle is overkill. */
function lerp(a: LatLng, b: LatLng, f: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f };
}

function legLength(a: LatLng, b: LatLng): number {
  const mLat = 111_320;
  const mLng = 111_320 * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  return Math.hypot((b.lat - a.lat) * mLat, (b.lng - a.lng) * mLng);
}
