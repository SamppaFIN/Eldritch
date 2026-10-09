/**
 * The town's terror, as the shared season last said it (BRDC-TERROR-001). 0 off-line or
 * before any season: a town with no Worker is a town with no terror.
 */
import { useEffect, useState } from 'react';
import { seasonOnce } from '../../data/season.js';

export function useTerror(): number {
  const [terror, setTerror] = useState(0);
  useEffect(() => {
    let live = true;
    void seasonOnce().then((s) => live && setTerror(s?.phase === 'open' || s?.phase === 'reckoning' ? (s.terror ?? 0) : 0));
    return () => {
      live = false;
    };
  }, []);
  return terror;
}
