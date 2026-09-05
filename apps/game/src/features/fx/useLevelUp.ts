/**
 * Fires a `levelUp` moment when Consciousness rises (BRDC-FX-001).
 *
 * The app only ever displayed the current level — nothing watched for the crossing. This
 * does: it holds the last level it saw and compares. The first value is remembered
 * silently, so a returning player is not congratulated for a level they earned days ago.
 */
import { useEffect, useRef } from 'react';
import { levelState } from '@es3/core';
import type { MomentsApi } from './useMoments.js';

export function useLevelUp(xp: number | undefined, show: MomentsApi['show']): void {
  const prev = useRef<number | null>(null);

  useEffect(() => {
    if (xp === undefined) return;
    const { level, name } = levelState(xp);
    if (prev.current !== null && level > prev.current) {
      show('levelUp', 'Consciousness rises', `Level ${level} · ${name}`);
    }
    prev.current = level;
  }, [xp, show]);
}
