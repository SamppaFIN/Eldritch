/**
 * Wires the moment layer to the events that earn one (BRDC-FX-001).
 *
 * One roof over the four triggers so MapView, at its line ceiling, gains three lines
 * rather than fifteen. `achievement` is threaded separately, straight into
 * `useClaimSync` where the post-claim re-reads already live.
 *
 * `wonderFound` has no trigger yet — BRDC-WONDER-001 will call `show('wonderFound', …)`.
 */
import { useEffect, useRef } from 'react';
import type { TechId } from '@es3/core';
import { useLevelUp } from './useLevelUp.js';
import type { MomentsApi } from './useMoments.js';

/** `early-farming` → `Early Farming`. Small enough not to import from a panel. */
const titleCase = (slug: string): string =>
  slug.replace(/(^|-)([a-z])/g, (_, sep: string, ch: string) => (sep ? ' ' : '') + ch.toUpperCase());

export interface MomentTriggers {
  show: MomentsApi['show'];
  /** Player XP — a rise across a level threshold is a `levelUp` moment. */
  xp: number | undefined;
  /** One-render signal from `useResearch`: a schooled tech just landed (a Rite learned). */
  riteLearned: TechId | null;
  /** One-render signal from `useAdventure`: an adventure just reached its end. */
  questEnded: string | null;
}

export function useMomentTriggers({ show, xp, riteLearned, questEnded }: MomentTriggers): void {
  useLevelUp(xp, show);

  const lastRite = useRef<TechId | null>(null);
  useEffect(() => {
    if (riteLearned && riteLearned !== lastRite.current) {
      show('riteComplete', 'A Rite is yours', titleCase(riteLearned));
    }
    lastRite.current = riteLearned;
  }, [riteLearned, show]);

  const lastQuest = useRef<string | null>(null);
  useEffect(() => {
    if (questEnded && questEnded !== lastQuest.current) {
      show('questEnd', 'The tale ends', questEnded);
    }
    lastQuest.current = questEnded;
  }, [questEnded, show]);
}
