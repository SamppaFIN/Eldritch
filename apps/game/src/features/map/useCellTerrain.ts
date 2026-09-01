/**
 * Persist terrain the map read from its own vector tiles (BRDC-TERRAIN-002).
 *
 * `MapCanvas` resolves a cell's terrain from the basemap and hands the batch up; this
 * writes each one through the repository and refreshes the view. Pulled out of MapView to
 * keep it under its line limit.
 */
import { useCallback } from 'react';
import type { GameRepository, Terrain } from '@es3/core';

export function useCellTerrain(
  repository: GameRepository | null,
  refresh: () => Promise<void>,
): (updates: { h3: string; terrain: Terrain }[]) => Promise<void> {
  return useCallback(
    async (updates) => {
      if (!repository) return;
      for (const u of updates) await repository.setCellTerrain(u.h3, u.terrain);
      await refresh();
    },
    [repository, refresh],
  );
}
