/**
 * Playing a walked route back through the live pipeline (BRDC-SIM-002).
 *
 * The points come out one at a time, each after its real gap divided by the speed, and
 * go where a GPS fix goes — `useTrail`, `submitTrail`, the same filter, the same claims.
 * The route is retimed when it starts (`retime`): its last point is "now", so every point
 * is already in the past when it is played, and the gaps the filter measures are the
 * walk's own.
 *
 * `session` changes when a playback starts and when it stops: `useTrail` begins a fresh
 * run on each, so neither the jump to the route's start nor the jump back to where the
 * phone really is reads as a teleport.
 *
 * Dev and e2e builds only (`PLAYBACK_AVAILABLE`). In those, `window.__es3Playback` lets a
 * Playwright test drive it.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseRoute, playbackGap, retime, startAt } from '@es3/core/sim';
import type { Fixture, FixtureName, Route, RouteFault } from '@es3/core/sim';
import type { LatLng, TrailPoint } from '@es3/core';

export const PLAYBACK_AVAILABLE = import.meta.env.DEV || import.meta.env.MODE === 'e2e';

export const SPEEDS = [1, 5, 20, 60] as const;

/** The built-in routes, each its own chunk, fetched when picked — so the fixtures never
 *  ride along in a player's bundle. */
const FIXTURE_FILES: Record<FixtureName, () => Promise<{ default: Fixture }>> = !(import.meta.env.DEV || import.meta.env.MODE === 'e2e')
  ? ({} as Record<FixtureName, () => Promise<{ default: Fixture }>>)
  : {
      square: () => import('@es3/core/sim/fixtures/square.json'),
      'figure-eight': () => import('@es3/core/sim/fixtures/figure-eight.json'),
      'open-line': () => import('@es3/core/sim/fixtures/open-line.json'),
      'back-and-forth': () => import('@es3/core/sim/fixtures/back-and-forth.json'),
      'gps-noise': () => import('@es3/core/sim/fixtures/gps-noise.json'),
    };
export const ROUTE_NAMES = Object.keys(FIXTURE_FILES) as FixtureName[];

export interface PlaybackView {
  route: Route | null;
  /** Points played so far. */
  played: number;
  playing: boolean;
  speed: number;
  done: boolean;
}

export interface Playback extends PlaybackView {
  /** The last point played, while a playback is the source; `null` otherwise. */
  point: TrailPoint | null;
  /** Bumped on every start and stop — a new run each time. */
  session: number;
  load: (route: Route) => void;
  /** A built-in route, moved to start where you stand when that is known. */
  loadFixture: (name: FixtureName) => Promise<void>;
  /** GPX or JSON text; the fault if it cannot be played. */
  loadText: (text: string, name?: string) => RouteFault | null;
  play: (speed?: number) => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
}

declare global {
  interface Window {
    __es3Playback?: Pick<Playback, 'loadFixture' | 'loadText' | 'play' | 'pause' | 'stop'> & { state: () => PlaybackView };
  }
}

export function usePlayback(here: LatLng | null): Playback {
  const [view, setView] = useState<PlaybackView>({
    route: null,
    played: 0,
    playing: false,
    speed: 20,
    done: false,
  });
  const [point, setPoint] = useState<TrailPoint | null>(null);
  const [session, setSession] = useState(0);
  const timeline = useRef<TrailPoint[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;
  const hereRef = useRef(here);
  hereRef.current = here;

  const halt = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // One point, then the next after its gap — never two in one render, so none is lost.
  const step = useCallback((i: number) => {
    const p = timeline.current[i];
    if (!p) return;
    setPoint(p);
    const last = i === timeline.current.length - 1;
    setView((v) => ({ ...v, played: i + 1, playing: !last, done: last }));
    if (!last) timer.current = setTimeout(() => step(i + 1), playbackGap(timeline.current, i, viewRef.current.speed));
  }, []);

  const stop = useCallback(() => {
    halt();
    timeline.current = [];
    setPoint(null);
    setView((v) => ({ ...v, played: 0, playing: false, done: false }));
    setSession((s) => s + 1);
  }, []);

  const load = useCallback(
    (route: Route) => {
      if (timeline.current.length > 0) stop();
      setView((v) => ({ ...v, route, played: 0, playing: false, done: false }));
    },
    [stop],
  );

  const play = useCallback(
    (speed?: number) => {
      const v = viewRef.current;
      if (!v.route || v.playing) return;
      const s = speed ?? v.speed;
      viewRef.current = { ...v, speed: s };
      setView((w) => ({ ...w, speed: s, playing: true, done: false }));
      if (timeline.current.length === 0 || v.done) {
        timeline.current = retime(v.route.points, Date.now());
        setSession((n) => n + 1);
        // A tick later, so the fresh run is open before the first point arrives.
        timer.current = setTimeout(() => step(0), 50);
      } else {
        timer.current = setTimeout(() => step(v.played), playbackGap(timeline.current, v.played - 1, s));
      }
    },
    [step],
  );

  const pause = useCallback(() => {
    halt();
    setView((v) => ({ ...v, playing: false }));
  }, []);

  const setSpeed = useCallback((speed: number) => {
    viewRef.current = { ...viewRef.current, speed };
    setView((v) => ({ ...v, speed }));
  }, []);

  const loadFixture = useCallback(
    async (name: FixtureName) => {
      const f = (await FIXTURE_FILES[name]()).default;
      const at = hereRef.current;
      load({
        name: f.name,
        points: at ? startAt(f.points, at) : [...f.points],
      });
    },
    [load],
  );

  const loadText = useCallback(
    (text: string, name?: string) => {
      const r = parseRoute(text, name);
      if (!r.ok) return r.fault;
      load(r.route);
      return null;
    },
    [load],
  );

  useEffect(() => halt, []);

  useEffect(() => {
    if (!PLAYBACK_AVAILABLE) return;
    window.__es3Playback = {
      loadFixture,
      loadText,
      play,
      pause,
      stop,
      state: () => viewRef.current,
    };
    return () => {
      delete window.__es3Playback;
    };
  }, [loadFixture, loadText, play, pause, stop]);

  return {
    ...view,
    point: timeline.current.length > 0 ? point : null,
    session,
    load,
    loadFixture,
    loadText,
    play,
    pause,
    stop,
    setSpeed,
  };
}
