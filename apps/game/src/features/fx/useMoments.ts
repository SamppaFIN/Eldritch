/**
 * The one effect layer (BRDC-FX-001).
 *
 * The game is visually silent at the moments it should own — a level, a rite learned, an
 * adventure's end. This is the queue that draws them: one component, one named effect at
 * a time, and a cap so a long walk does not become fireworks.
 *
 * Deliberately not a store: a moment is a here-and-now thing, gone in under two seconds,
 * and nothing else in the game needs to read it.
 */
import { useCallback, useRef, useState } from 'react';

export type MomentKind = 'levelUp' | 'achievement' | 'riteComplete' | 'wonderFound' | 'questEnd';

export interface Moment {
  kind: MomentKind;
  /** Small line above the title — what kind of thing just happened. */
  eyebrow: string;
  /** The thing itself, in a few words. */
  title: string;
  /** Distinguishes two moments of the same kind so React re-runs the draw effect. */
  key: number;
}

/** At most this many moments start in any rolling 60 s. The rest are dropped, silently. */
export const MOMENTS_PER_MIN = 4;
const WINDOW_MS = 60_000;

/** True when another moment may start now — fewer than the cap began in the last minute. */
export function withinCap(startedAt: readonly number[], now: number): boolean {
  return startedAt.filter((t) => now - t < WINDOW_MS).length < MOMENTS_PER_MIN;
}

export interface MomentsApi {
  /** The moment on screen, or null. Always the head of the queue. */
  current: Moment | null;
  /** Enqueue a moment. Dropped without error if the per-minute cap is already reached. */
  show: (kind: MomentKind, eyebrow: string, title: string) => void;
  /** End the current moment and let the next (if any) take the screen. */
  dismiss: () => void;
}

export function useMoments(now: () => number = Date.now): MomentsApi {
  const [queue, setQueue] = useState<Moment[]>([]);
  const startedAt = useRef<number[]>([]);
  const nextKey = useRef(1);

  const show = useCallback(
    (kind: MomentKind, eyebrow: string, title: string) => {
      const t = now();
      if (!withinCap(startedAt.current, t)) return;
      startedAt.current = [...startedAt.current.filter((x) => t - x < WINDOW_MS), t];
      setQueue((q) => [...q, { kind, eyebrow, title, key: nextKey.current++ }]);
    },
    [now],
  );

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);

  return { current: queue[0] ?? null, show, dismiss };
}
