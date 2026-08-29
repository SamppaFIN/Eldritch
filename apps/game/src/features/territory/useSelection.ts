/**
 * What the player is looking at, and the one thing they can do about it.
 *
 * Selection, the two panels it opens and warding are one concern: they all answer "which
 * cell is this about". Lifted out of MapView when that file crossed four hundred lines,
 * and it reads better here — nothing else in the map screen needs to know how it works.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { emptyCell } from '@es3/core';
import type {
  Cell,
  GameRepository,
  H3Index,
  ResourcePool,
  RevealedPlace,
  WardRefusal,
} from '@es3/core';

export interface UseSelectionOptions {
  repository: GameRepository | null;
  /** Cells in view, already projected. */
  cells: readonly Cell[];
  places: readonly RevealedPlace[];
  now: () => number;
  /** Bumped as the trail grows, so dwell in the open cell keeps up. */
  trailVersion: number;
  onWarded: (pool: ResourcePool) => void;
  refreshTerritory: () => Promise<void>;
}

export interface Selection {
  selected: H3Index | null;
  cell: Cell | null;
  dwellMs: number;
  refusal: WardRefusal | null;
  sanctum: boolean;
  wager: boolean;
  onCellTap: (h3: H3Index) => void;
  onPlaceTap: (h3: H3Index) => void;
  onWard: (h3: H3Index) => void;
  openWager: () => void;
  closeWager: () => void;
  close: () => void;
}

export function useSelection({
  repository,
  cells,
  places,
  now,
  trailVersion,
  onWarded,
  refreshTerritory,
}: UseSelectionOptions): Selection {
  const [selected, setSelected] = useState<H3Index | null>(null);
  const [refusal, setRefusal] = useState<WardRefusal | null>(null);
  const [dwellMs, setDwellMs] = useState(0);
  const [sanctum, setSanctum] = useState(false);
  const [wager, setWager] = useState(false);

  // A new selection starts with a clean slate: a refusal about the last cell has nothing
  // to say about this one, and the two panels never share the screen.
  const onCellTap = useCallback((h3: H3Index) => {
    setSelected(h3);
    setRefusal(null);
    setSanctum(false);
  }, []);

  /*
   * A place answers a tap with what it is.
   *
   * The Anchor Stone opens the sanctuary — it is the one cell on the map that is about
   * the whole of it. A temple is still just ground, so it opens the ordinary panel.
   */
  const onPlaceTap = useCallback(
    (h3: H3Index) => {
      if (places.find((p) => p.h3 === h3)?.kind === 'anchor') {
        setSelected(null);
        setSanctum(true);
        return;
      }
      onCellTap(h3);
    },
    [places, onCellTap],
  );

  /*
   * A cell nobody has ever claimed is not in storage, so the viewport query does not
   * return it — and "This ground" on open land would open nothing at all. An empty cell
   * stands in: the terrain and the dwell are real either way, and the panel already
   * knows how to say "Unclaimed".
   */
  const cell = useMemo(() => {
    if (!selected) return null;
    return cells.find((c) => c.h3 === selected) ?? emptyCell(selected);
  }, [cells, selected]);

  // Read on selection and again as the trail grows: time in the cell you are standing
  // in accrues while the panel is open.
  useEffect(() => {
    if (!repository || !selected) {
      setDwellMs(0);
      return;
    }
    let alive = true;
    void repository.getDwellFor(selected).then((ms) => {
      if (alive) setDwellMs(ms);
    });
    return () => {
      alive = false;
    };
  }, [repository, selected, trailVersion]);

  const onWard = useCallback(
    (h3: H3Index) => {
      if (!repository) return;
      void (async () => {
        const result = await repository.wardCell(h3, now());
        setRefusal(result.warded ? null : result.refused);
        if (!result.warded) return;
        onWarded(result.pool);
        // The strength on screen has to be the strength that was just paid for.
        await refreshTerritory();
      })();
    },
    [repository, now, onWarded, refreshTerritory],
  );

  return {
    selected,
    cell,
    dwellMs,
    refusal,
    sanctum,
    wager,
    onCellTap,
    onPlaceTap,
    onWard,
    openWager: useCallback(() => {
      setSanctum(false);
      setWager(true);
    }, []),
    closeWager: useCallback(() => setWager(false), []),
    close: useCallback(() => {
      setSelected(null);
      setSanctum(false);
    }, []),
  };
}
