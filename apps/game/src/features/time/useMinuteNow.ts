/**
 * Game time that moves once a minute (BRDC-PERF-002).
 *
 * The map drew with `now={clock.now()}` — a fresh number on every render, and the map
 * re-renders on every GPS fix, camera move and trail flush. Each fresh number rebuilt and
 * re-sent the whole territory. What the map shows from `now` (decay, fading, blight) moves
 * in hours, so a minute is plenty. It also re-reads at once when the dev clock jumps (the
 * `clock.now` identity changes) and when the page comes back into view.
 */
import { useEffect, useState } from 'react';

export const MINUTE_MS = 60_000;

export function useMinuteNow(now: () => number): number {
  const [at, setAt] = useState(now);
  useEffect(() => {
    setAt(now());
    const tick = setInterval(() => setAt(now()), MINUTE_MS);
    const onShow = () => {
      if (!document.hidden) setAt(now());
    };
    document.addEventListener('visibilitychange', onShow);
    return () => {
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [now]);
  return at;
}
