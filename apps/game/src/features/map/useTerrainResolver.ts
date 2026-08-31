/**
 * Resolve a cell's terrain from the vector tiles already on the map (BRDC-TERRAIN-002).
 *
 * For each visible cell that has no stored terrain yet, sample `queryRenderedFeatures` at
 * its centre and map it with `terrainFromTiles`. Done once per cell (a `tried` set), on a
 * short delay so a pan does not fire it per frame, and silent when the tiles say nothing —
 * that cell simply keeps its hash.
 *
 * The `queryRenderedFeatures` call needs a live GL map, so this hook is exercised in the
 * browser, not in tests; `terrainFromTiles`, which does the actual judging, is pure and
 * fully covered.
 */
import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { cellCentre, terrainFromTiles } from '@es3/core';
import type { Cell, Terrain } from '@es3/core';

export interface TerrainUpdate {
  h3: string;
  terrain: Terrain;
}

export interface UseTerrainResolverOptions {
  map: MapLibreMap | null;
  ready: boolean;
  cells: readonly Cell[];
  onResolved: (updates: TerrainUpdate[]) => void;
}

export function useTerrainResolver({
  map,
  ready,
  cells,
  onResolved,
}: UseTerrainResolverOptions): void {
  const tried = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!map || !ready) return;
    const pending = cells.filter((c) => !c.terrain && !tried.current.has(c.h3));
    if (pending.length === 0) return;

    const id = setTimeout(() => {
      const updates: TerrainUpdate[] = [];
      for (const cell of pending) {
        tried.current.add(cell.h3);
        const { lat, lng } = cellCentre(cell.h3);
        const kind = terrainFromTiles(map.queryRenderedFeatures(map.project([lng, lat])));
        if (kind) updates.push({ h3: cell.h3, terrain: { kind, source: 'tiles' } });
      }
      if (updates.length > 0) onResolved(updates);
    }, 400);

    return () => clearTimeout(id);
  }, [map, ready, cells, onResolved]);
}
