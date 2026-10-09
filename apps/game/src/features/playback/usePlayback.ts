/**
 * Playing a walked route back through the live pipeline (BRDC-SIM-002, -003).
 *
 * Every point goes where a GPS fix goes — `useTrail`, `submitTrail`, the same filter, the
 * same claims. The route is retimed when it starts (`retime`) so its last point is an hour
 * ago: every point is in the past when it is played, the gaps the filter measures are the
 * walk's own, and a detour walked on the way has room before it would reach "now".
 *
 * Pacing is a route clock, not a chain of timeouts: each tick feeds every point whose time
 * has come at this speed, so a busy main thread delays the playback a little and never
 * slows it for good. Points go straight to the trail's buffer (`link.feed`); the position
 * on screen follows every hex the route enters, one render each, because the game claims
 * and re-reads the map from the hex you stand on — skip one and its claim is never shown.
 * A point with actions stops the clock, waits for the trail to land (`link.settle`, so the
 * ground is claimed), acts, and goes on.
 *
 * A playback starts and ends with a fresh run (`link.newRun`, awaited before the first
 * point), so neither the jump to the route's start nor the jump back to where the phone
 * really is reads as a teleport.
 *
 * Dev and e2e builds only. In those, `window.__es3Playback` lets a Playwright test drive it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { detour, parseRoute, retime, startAt } from '@es3/core/sim';
import type { FixtureName, Route, RouteFault } from '@es3/core/sim';
import { cellAt } from '@es3/core';
import type { LatLng, TrailPoint } from '@es3/core';
import type { TrailLink } from '../trail/useTrail.js';
import { FIXTURE_FILES, TALE_FILES } from './routeFiles.js';

export { ROUTE_NAMES } from './routeFiles.js';
export const SPEEDS = [1, 5, 20, 60] as const;

export interface PlaybackView {
  route: Route | null;
  /** Points played so far. */
  played: number;
  playing: boolean;
  speed: number;
  done: boolean;
  /** What the route's actions did, oldest first (BRDC-SIM-003). */
  log: string[];
  /** Points to play in all — the route's, and any detour walked on the way. */
  total: number;
}

/** Runs one of a route's actions where it stands; a line for the log, and maybe a detour. */
export type RouteActor = (action: string, at: TrailPoint) => Promise<{ line: string; goTo?: LatLng }>;

/** A beat for a point to reach the trail's buffer before `settle` writes it. */
const ACTION_SETTLE_MS = 300;
/** How often the position on screen follows the playback within one hex. */
const SHOW_EVERY_MS = 250;
/** A beat between hexes: one render, so the hex is stood on before the next. */
const NEXT_HEX_MS = 16;
/** How far before "now" the route's last point is set — room for detours. */
const DETOUR_ROOM_MS = 60 * 60_000;

export interface Playback extends PlaybackView {
  /** The last point shown, while a playback is the source; `null` otherwise. */
  point: TrailPoint | null;
  /** Filled by `useTrail`: hand it points, and wait for what is buffered to land. */
  link: MutableRefObject<TrailLink | null>;
  load: (route: Route) => void;
  /** A built-in route: a shape moved to start where you stand, or a tale at its places. */
  loadFixture: (name: string) => Promise<void>;
  /** GPX or JSON text; the fault if it cannot be played. */
  loadText: (text: string, name?: string) => RouteFault | null;
  play: (speed?: number) => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
}

declare global {
  interface Window {
    __es3Playback?: Pick<Playback, 'loadFixture' | 'loadText' | 'play' | 'pause' | 'stop'> & {
      state: () => PlaybackView;
      /** Resolves once every point played so far is written and claimed. */
      settled: () => Promise<void>;
    };
  }
}

export function usePlayback(here: LatLng | null, act?: RouteActor): Playback {
  const [view, setView] = useState<PlaybackView>({ route: null, played: 0, playing: false, speed: 20, done: false, log: [], total: 0 });
  const [point, setPoint] = useState<TrailPoint | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const hereRef = useRef(here);
  hereRef.current = here;
  const actRef = useRef(act);
  actRef.current = act;
  const link = useRef<TrailLink | null>(null);

  const timeline = useRef<TrailPoint[]>([]);
  /** Actions by point index, for the run in progress. */
  const steps = useRef(new Map<number, string[]>());
  /** The next point to play. */
  const cursor = useRef(0);
  /** Route time `t` was reached at wall time `wall`. */
  const clock = useRef({ wall: 0, t: 0 });
  /** A point whose actions have not run yet — a pause before they start keeps them. */
  const pending = useRef<number | null>(null);
  /** Bumped by every pause, stop and start: a continuation from before is dropped. */
  const gen = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(0);
  const shownCell = useRef<string | null>(null);

  const halt = () => {
    gen.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const show = (i: number) => {
    const p = timeline.current[i];
    if (!p) return;
    shownAt.current = Date.now();
    shownCell.current = cellAt(p);
    setPoint(p);
    setView((v) => ({ ...v, played: i + 1 }));
  };

  /** Restart the clock at the last point played. */
  const rebase = () => {
    const tl = timeline.current;
    clock.current = { wall: Date.now(), t: (tl[cursor.current - 1] ?? tl[0])?.t ?? 0 };
  };

  /** Splice a detour in after point `i`: later points move back by its length, later
   *  actions move up by its count, and `rest` happens on its last point. */
  const insertDetour = (i: number, walk: TrailPoint[], rest: string[]) => {
    const tl = timeline.current;
    const last = walk.at(-1);
    if (!last) return;
    // Point i+1 now comes as long after the walk's end as it used to come after point i.
    const shift = last.t - (tl[i]?.t ?? last.t);
    timeline.current = [...tl.slice(0, i + 1), ...walk, ...tl.slice(i + 1).map((q) => ({ ...q, t: q.t + shift }))];
    const moved = new Map<number, string[]>();
    for (const [at, list] of steps.current) if (at !== i) moved.set(at > i ? at + walk.length : at, list);
    if (rest.length > 0) moved.set(i + walk.length, [...rest, ...(moved.get(i + walk.length) ?? [])]);
    steps.current = moved;
    setView((v) => ({ ...v, total: timeline.current.length }));
  };

  // `tick` and `runActions` call each other; both read only refs, so one closure each is enough.
  const tickRef = useRef<() => void>(() => undefined);

  const runActions = (i: number) => {
    pending.current = i;
    const g = gen.current;
    timer.current = setTimeout(() => {
      void (async () => {
        pending.current = null;
        await link.current?.settle();
        const p = timeline.current[i];
        const todo = steps.current.get(i) ?? [];
        steps.current.delete(i);
        for (const [k, action] of todo.entries()) {
          const doer = actRef.current;
          const r: { line: string; goTo?: LatLng } =
            doer && p
              ? await doer(action, p).catch((e: unknown) => ({ line: `✗ ${action}: ${String(e)}` }))
              : { line: `✗ ${action}: no game to act in` };
          setView((v) => ({ ...v, log: [...v.log, r.line] }));
          if (r.goTo && p) {
            // Walk there and back first; what is left to do here waits for the return.
            insertDetour(i, detour(p, r.goTo), todo.slice(k + 1));
            break;
          }
        }
        if (gen.current !== g) return;
        rebase();
        tickRef.current();
      })();
    }, ACTION_SETTLE_MS);
  };

  tickRef.current = () => {
    const tl = timeline.current;
    const speed = viewRef.current.speed;
    const due = clock.current.t + (Date.now() - clock.current.wall) * speed;
    let i = cursor.current;
    while (i < tl.length && (tl[i] as TrailPoint).t <= due) {
      const p = tl[i] as TrailPoint;
      link.current?.feed(p);
      i += 1;
      if (steps.current.has(i - 1)) {
        cursor.current = i;
        show(i - 1);
        runActions(i - 1);
        return;
      }
      if (cellAt(p) !== shownCell.current) {
        cursor.current = i;
        show(i - 1);
        timer.current = setTimeout(() => tickRef.current(), NEXT_HEX_MS);
        return;
      }
    }
    cursor.current = i;
    if (i >= tl.length) {
      show(tl.length - 1);
      setView((v) => ({ ...v, playing: false, done: true }));
      return;
    }
    if (i > 0 && Date.now() - shownAt.current >= SHOW_EVERY_MS) show(i - 1);
    const wait = ((tl[i] as TrailPoint).t - due) / speed;
    timer.current = setTimeout(() => tickRef.current(), Math.max(16, Math.min(SHOW_EVERY_MS, wait)));
  };

  const stop = useCallback(() => {
    halt();
    pending.current = null;
    timeline.current = [];
    cursor.current = 0;
    shownCell.current = null;
    setPoint(null);
    setView((v) => ({ ...v, played: 0, playing: false, done: false }));
    void link.current?.newRun();
  }, []);

  const load = useCallback(
    (route: Route) => {
      if (timeline.current.length > 0) stop();
      setView((v) => ({ ...v, route, played: 0, playing: false, done: false, log: [], total: route.points.length }));
    },
    [stop],
  );

  const play = useCallback((speed?: number) => {
    const v = viewRef.current;
    if (!v.route || v.playing) return;
    const s = speed ?? v.speed;
    viewRef.current = { ...v, speed: s, playing: true };
    gen.current += 1;
    if (timeline.current.length === 0 || v.done) {
      timeline.current = retime(v.route.points, Date.now() - DETOUR_ROOM_MS);
      steps.current = new Map();
      for (const a of v.route.actions ?? []) steps.current.set(a.at, [...(steps.current.get(a.at) ?? []), a.do]);
      cursor.current = 0;
      pending.current = null;
      setView((w) => ({ ...w, speed: s, playing: true, done: false, played: 0, log: [], total: timeline.current.length }));
      const g = gen.current;
      // The fresh run open first: a point fed before it would land in the old one.
      void (async () => {
        await link.current?.newRun();
        if (gen.current !== g) return;
        rebase();
        tickRef.current();
      })();
      return;
    }
    setView((w) => ({ ...w, speed: s, playing: true }));
    if (pending.current !== null) runActions(pending.current);
    else {
      rebase();
      tickRef.current();
    }
  }, []);

  const pause = useCallback(() => {
    halt();
    setView((v) => ({ ...v, playing: false }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    // Keep the route time where it is, so the new pace starts from here.
    const old = viewRef.current.speed;
    clock.current = { wall: Date.now(), t: clock.current.t + (Date.now() - clock.current.wall) * old };
    viewRef.current = { ...viewRef.current, speed };
    setView((v) => ({ ...v, speed }));
  }, []);

  const loadText = useCallback(
    (text: string, name?: string) => {
      const r = parseRoute(text, name);
      if (!r.ok) return r.fault;
      load(r.route);
      return null;
    },
    [load],
  );

  const loadFixture = useCallback(
    async (name: string) => {
      const tale = TALE_FILES[name];
      if (tale) {
        loadText((await tale()).default, name);
        return;
      }
      const f = (await FIXTURE_FILES[name as FixtureName]()).default;
      const at = hereRef.current;
      load({ name: f.name, points: at ? startAt(f.points, at) : [...f.points] });
    },
    [load, loadText],
  );

  useEffect(() => halt, []);

  useEffect(() => {
    if (!(import.meta.env.DEV || import.meta.env.MODE === 'e2e')) return;
    window.__es3Playback = {
      loadFixture,
      loadText,
      play,
      pause,
      stop,
      state: () => viewRef.current,
      settled: () => new Promise<void>((r) => setTimeout(r, ACTION_SETTLE_MS)).then(() => link.current?.settle()),
    };
    return () => {
      delete window.__es3Playback;
    };
  }, [loadFixture, loadText, play, pause, stop]);

  return { ...view, point: timeline.current.length > 0 ? point : null, link, load, loadFixture, loadText, play, pause, stop, setSpeed };
}
