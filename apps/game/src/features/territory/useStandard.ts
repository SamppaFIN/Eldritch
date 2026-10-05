/**
 * Plant your standard where you stand (BRDC-STANDARD-001, handoff F-13).
 *
 * The button is always there; off your own ground it is marked unavailable and a tap says
 * why, in words — a phone has no hover for a tooltip. The store refuses too
 * (`repository.standard`), so the rule does not live only here.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Cell, GameRepository, H3Index } from '@es3/core';

export interface StandardBinding {
  /** Planting is possible right now: you stand on your own ground and it is not already here. */
  can: boolean;
  /** The last thing said — why it cannot be planted, or that it was. */
  said: string | null;
  plant: () => void;
}

export const STANDARD_WHY = {
  'no-position': 'Waiting for your position.',
  'not-yours': 'You can plant your standard only on your own ground.',
  here: 'Your standard already stands here.',
} as const;

/** Why it cannot be planted here, or null when it can. */
export function standardWhy(standingOn: H3Index | null, owned: readonly Cell[], planted: H3Index | null): keyof typeof STANDARD_WHY | null {
  if (!standingOn) return 'no-position';
  if (!owned.some((c) => c.h3 === standingOn)) return 'not-yours';
  return planted === standingOn ? 'here' : null;
}

export function useStandard(
  repository: GameRepository | null,
  standingOn: H3Index | null,
  owned: readonly Cell[],
  now: () => number,
  /** The map re-reads after a plant, so the flag moves at once. */
  onPlanted: () => void,
): StandardBinding {
  const [planted, setPlanted] = useState<H3Index | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  useEffect(() => {
    if (repository) void repository.standard.at().then((s) => setPlanted(s?.h3 ?? null));
  }, [repository]);
  useEffect(() => setSaid(null), [standingOn]);

  const why = standardWhy(standingOn, owned, planted);
  const plant = useCallback(() => {
    if (why) {
      setSaid(STANDARD_WHY[why]);
      return;
    }
    if (!repository) return;
    void repository.standard.plant(standingOn, now()).then((r) => {
      if (r.ok) {
        setPlanted(r.standard.h3);
        setSaid('Your standard is planted here.');
        onPlanted();
      } else setSaid(STANDARD_WHY[r.refused]);
    });
  }, [why, repository, standingOn, now, onPlanted]);

  return { can: why === null, said, plant };
}
