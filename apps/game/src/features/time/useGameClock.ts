/**
 * The clock the game reads.
 *
 * Every repository call takes `now` as a parameter, which is what makes decay testable
 * without waiting three weeks. This hook is the one place that decides what `now` means,
 * and in dev builds it can be wound forward.
 *
 * The offset is not a toy. Phase 2's acceptance gate ends with "wind the clock twenty
 * days and watch the ground be released", and without this that check costs twenty days.
 */
import { useCallback, useEffect, useState } from 'react';
import { load, saveNow } from '@es3/core';

const KEY = 'clock-offset';

export interface GameClock {
  /** Current game time in epoch milliseconds. */
  now: () => number;
  /** How far ahead of the wall clock we are, in whole days. */
  offsetDays: number;
  /** Dev only. No-op in a production build. */
  travel: (days: number) => void;
  reset: () => void;
  /** True when the clock is not the real one, so the HUD can say so. */
  shifted: boolean;
}

export function useGameClock(): GameClock {
  // Persisted so a reload mid-experiment does not silently snap the world back and
  // resurrect territory that was just watched to rot.
  const [offsetMs, setOffsetMs] = useState(() =>
    import.meta.env.DEV ? load<number>(KEY, 0) : 0,
  );

  const travel = useCallback((days: number) => {
    if (!import.meta.env.DEV) return;
    setOffsetMs((previous) => {
      const next = Math.max(0, previous + days * 86_400_000);
      saveNow(KEY, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    if (!import.meta.env.DEV) return;
    setOffsetMs(0);
    saveNow(KEY, 0);
  }, []);

  // T advances the clock a day, Shift+T rewinds it to the present.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'T') reset();
      else if (e.key === 't') travel(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [travel, reset]);

  const now = useCallback(() => Date.now() + offsetMs, [offsetMs]);

  return {
    now,
    offsetDays: Math.round(offsetMs / 86_400_000),
    travel,
    reset,
    shifted: offsetMs > 0,
  };
}
