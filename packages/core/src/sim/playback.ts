/**
 * Playing a walked route back (BRDC-SIM-002).
 *
 * A route is a `TrailPoint[]` from anywhere — a GPX file, a walk saved from the game, a
 * frozen fixture. Played back, it goes through the same filter as a live walk, so it has
 * to arrive looking like one: the gaps between its points are kept exactly (the speed and
 * interval checks read nothing else), and the whole route is moved in time so its last
 * point is "now". Every point is then in the past when it is played, however fast.
 *
 * Pure: the player that paces the points out lives in the app.
 */
import type { LatLng, TrailPoint } from '../types/domain.js';
import { bearing, destination } from '../geo/project.js';
import { haversine } from '../geo/haversine.js';
import { parseGpx } from '../data/gpx.js';
import type { GpxFault } from '../data/gpx.js';
import { gpxActions } from './routeActions.js';
import type { RouteStep } from './routeActions.js';

export interface Route {
  name: string;
  points: TrailPoint[];
  /** What happens on the way — begin a tale, build (BRDC-SIM-003). Absent on a plain walk. */
  actions?: RouteStep[];
}

export type RouteFault = GpxFault | 'not-json' | 'too-short';
export type RouteParse = { ok: true; route: Route } | { ok: false; fault: RouteFault };

const isPoint = (p: unknown): p is TrailPoint => {
  const q = p as Partial<TrailPoint> | null;
  return (
    !!q &&
    Number.isFinite(q.lat) &&
    Number.isFinite(q.lng) &&
    Number.isFinite(q.t) &&
    Number.isFinite(q.accuracy)
  );
};

/**
 * Read a route: GPX, or JSON — `{ name, points }` (what `routeJson` writes, and the
 * fixtures' own shape) or a bare array of points. Sorted by time; two points at least.
 */
export function parseRoute(text: string, name = 'Route'): RouteParse {
  const trimmed = text.trimStart();
  let points: TrailPoint[];
  // By time for GPX (sorting moves points, so an index is only known after it), by index for JSON.
  let timed: { t: number; do: string }[] = [];
  let indexed: RouteStep[] = [];
  if (trimmed.startsWith('<')) {
    const gpx = parseGpx(text);
    if (!gpx.ok) return gpx;
    points = gpx.points;
    timed = gpxActions(text);
  } else {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, fault: 'not-json' };
    }
    const obj = data as { name?: unknown; points?: unknown };
    const list = Array.isArray(data) ? data : Array.isArray(obj?.points) ? obj.points : null;
    if (!list) return { ok: false, fault: 'not-json' };
    if (!Array.isArray(data) && typeof obj.name === 'string' && obj.name.trim()) name = obj.name.trim();
    points = (list as unknown[]).filter(isPoint).map(({ lat, lng, t, accuracy }) => ({ lat, lng, t, accuracy }));
    const steps = (obj as { actions?: unknown }).actions;
    if (Array.isArray(steps)) {
      indexed = steps.filter((s): s is RouteStep => Number.isInteger((s as RouteStep)?.at) && typeof (s as RouteStep)?.do === 'string');
    }
  }
  points.sort((a, b) => a.t - b.t);
  if (points.length < 2) return { ok: false, fault: points.length === 0 ? 'no-points' : 'too-short' };
  const actions = [
    ...indexed.filter((s) => s.at >= 0 && s.at < points.length),
    ...timed.map((s) => ({ at: points.findIndex((p) => p.t === s.t), do: s.do })).filter((s) => s.at >= 0),
  ].sort((a, b) => a.at - b.at);
  return { ok: true, route: actions.length > 0 ? { name, points, actions } : { name, points } };
}

/** A route as the JSON `parseRoute` reads back unchanged. */
export function routeJson(route: Route): string {
  return JSON.stringify(route.actions?.length ? { name: route.name, points: route.points, actions: route.actions } : { name: route.name, points: route.points });
}

/** Milliseconds from the first point to the last. */
export const routeDuration = (points: readonly TrailPoint[]): number =>
  points.length < 2 ? 0 : (points.at(-1) as TrailPoint).t - (points[0] as TrailPoint).t;

/** The same walk, moved in time so its last point falls at `endAt`. Gaps untouched. */
export function retime(points: readonly TrailPoint[], endAt: number): TrailPoint[] {
  const shift = endAt - (points.at(-1)?.t ?? endAt);
  return points.map((p) => ({ ...p, t: p.t + shift }));
}

/**
 * The same shape, moved so it starts at `to` — a fixture walked from wherever you stand.
 * North–south offsets carry over as they are; east–west ones are rescaled for the new
 * latitude, so a 120 m block is still 120 m wide in Helsinki.
 */
export function startAt(points: readonly TrailPoint[], to: LatLng): TrailPoint[] {
  const first = points[0];
  if (!first) return [];
  const rad = Math.PI / 180;
  return points.map((p) => {
    const lat = to.lat + (p.lat - first.lat);
    const lng = to.lng + ((p.lng - first.lng) * Math.cos(p.lat * rad)) / Math.cos(lat * rad);
    return { ...p, lat, lng };
  });
}

/** Walking pace and fix interval for a detour — the same as the generated routes. */
const DETOUR_PACE_MS = 1.4;
const DETOUR_FIX_MS = 5_000;

/**
 * A walk from `from` to `to` and back, at walking pace, a fix every five seconds and a
 * moment standing at the far end (BRDC-SIM-003). For a place a fixed route cannot know —
 * a secret that moves every week — found when the route reaches it. The first point is a
 * fix after `from`; the last is back where it began.
 */
export function detour(from: TrailPoint, to: LatLng, stand = 3): TrailPoint[] {
  const metres = haversine(from, to);
  const steps = Math.max(1, Math.round(metres / (DETOUR_PACE_MS * (DETOUR_FIX_MS / 1000))));
  const out: LatLng[] = [];
  const there = bearing(from, to);
  for (let i = 1; i <= steps; i += 1) out.push(destination(from, there, (metres * i) / steps));
  for (let i = 0; i < stand; i += 1) out.push(to);
  const back = bearing(to, from);
  for (let i = 1; i <= steps; i += 1) out.push(destination(to, back, (metres * i) / steps));
  return out.map((p, i) => ({ lat: p.lat, lng: p.lng, accuracy: from.accuracy, t: from.t + (i + 1) * DETOUR_FIX_MS }));
}
