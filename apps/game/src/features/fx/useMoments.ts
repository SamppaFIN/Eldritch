/**
 * The one effect layer (BRDC-FX-001).
 *
 * The game is visually silent at the moments it should own — a level, a rite learned, an
 * adventure's end. This is the queue that draws them: one component, one named effect at
 * a time. Since 2026-09-30 nothing is dropped and nothing times out — a moment waits to be
 * tapped, and the ones behind it wait their turn (read when the walker sits down).
 *
 * Deliberately not a store: nothing else in the game needs to read a moment.
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

export interface MomentsApi {
  /** The moment on screen, or null. Always the head of the queue. */
  current: Moment | null;
  /** How many wait behind it. */
  waiting: number;
  /** Enqueue a moment. None is dropped. */
  show: (kind: MomentKind, eyebrow: string, title: string) => void;
  /** End the current moment and let the next (if any) take the screen. */
  dismiss: () => void;
}

export function useMoments(): MomentsApi {
  const [queue, setQueue] = useState<Moment[]>([]);
  const nextKey = useRef(1);

  const show = useCallback((kind: MomentKind, eyebrow: string, title: string) => {
    setQueue((q) => [...q, { kind, eyebrow, title, key: nextKey.current++ }]);
  }, []);

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);

  return { current: queue[0] ?? null, waiting: Math.max(0, queue.length - 1), show, dismiss };
}
