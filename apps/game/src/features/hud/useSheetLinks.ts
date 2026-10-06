/**
 * Everything the walking sheet's own row links to (`SheetActions`): Your lands, the
 * Counsel, your standard (BRDC-STANDARD-001) and what finishes next (BRDC-NEXT-001) —
 * gathered here so the map view passes one object, and stays under its line ceiling.
 */
import type { Cell, GameRepository, H3Index } from '@es3/core';
import { useStandard } from '../territory/useStandard.js';
import { useUpNext } from './useUpNext.js';
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
  onOpenCounsel: () => void;
  to: UpNextTargets;
}

export function useSheetLinks(i: SheetLinkInputs): SheetLinks {
  const standard = useStandard(i.repository, i.standingOn, i.owned, i.now, i.onPlanted);
  const upNext = useUpNext(i.repository, i.now, i.owned, i.to);
  return { onOpenLands: i.onOpenLands, onOpenCounsel: i.onOpenCounsel, standard, upNext };
}
