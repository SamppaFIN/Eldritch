/**
 * What a Work would earn from its neighbours on this hex, said before it is built
 * (BRDC-ADJ-001) — the same `adjacencyFor` the yield model pays by, over your own ground
 * and the temples you know, read once per hex.
 */
import { useCallback, useEffect, useState } from 'react';
import { adjacencyFor } from '@es3/core';
import type { AdjacencyLine, AdjacencyWorld, BuildingId, GameRepository, H3Index } from '@es3/core';

export function useAdjacencyHint(repository: GameRepository | null, h3: H3Index | null): (id: BuildingId) => readonly AdjacencyLine[] {
  const [world, setWorld] = useState<AdjacencyWorld | null>(null);
  useEffect(() => {
    setWorld(null);
    if (!repository || !h3) return;
    let live = true;
    void Promise.all([repository.getOwnedCells(Date.now()), repository.getPlaces()]).then(([cells, places]) => {
      if (live) setWorld({ owned: new Map(cells.map((c) => [c.h3, c])), temples: new Set(places.filter((p) => p.kind === 'temple').map((p) => p.h3)) });
    });
    return () => {
      live = false;
    };
  }, [repository, h3]);
  return useCallback((id: BuildingId) => (world && h3 ? adjacencyFor(h3, id, world) : []), [world, h3]);
}
