/**
 * Everything the walking sheet's own row links to (`SheetActions`): Your lands, your
 * standard (BRDC-STANDARD-001), what finishes next (BRDC-NEXT-001), a
 * golden or dark week (BRDC-AGE-001) and the day's sky (BRDC-MOON-001) — gathered here
 * so the map view passes one object, and stays under its line ceiling.
 */
import { moonDay, skyLine, weatherAt } from '@es3/core';
import type { Cell, GameRepository, H3Index } from '@es3/core';
import { useStandard } from '../territory/useStandard.js';
import { useUpNext } from './useUpNext.js';
import { useWeek } from './useWeek.js';
import { useTerror } from './useTerror.js';
import type { UpNextTargets } from './useUpNext.js';
import type { SheetLinks } from './SheetActions.js';

export interface SheetLinkInputs {
  repository: GameRepository | null;
  standingOn: H3Index | null;
  owned: readonly Cell[];
  now: () => number;
  /** The map re-reads after a plant, so the flag moves at once. */
  onPlanted: () => void;
  onOpenLands: () => void;
  to: UpNextTargets;
}

export function useSheetLinks(i: SheetLinkInputs): SheetLinks {
  const standard = useStandard(i.repository, i.standingOn, i.owned, i.now, i.onPlanted);
  const upNext = useUpNext(i.repository, i.now, i.owned, i.to);
  const w = useWeek(i.repository, i.now, i.owned);
  const week = w && w.kind !== 'plain' ? { name: w.name, kind: w.kind, open: i.to.keep } : undefined;
  const t = i.now();
  // The town's terror rides the same line as the sky (BRDC-TERROR-001).
  const terror = useTerror();
  const sky = [skyLine(weatherAt(t), moonDay(t)), terror > 0 ? `Terror ${terror}/10` : ''].filter(Boolean).join(' · ') || undefined;
  return { onOpenLands: i.onOpenLands, standard, upNext, week, sky };
}
