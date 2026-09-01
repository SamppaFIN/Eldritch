import { useEffect, useState } from 'react';

/**
 * Dev-only: press G to toggle simulated walking, so the mechanic can be exercised
 * without going outside. Always false in a production build — the listener is never
 * attached.
 */
export function useSimulateKey(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'g') setOn((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return on;
}
