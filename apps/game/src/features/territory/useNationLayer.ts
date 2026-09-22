/**
 * Feeds the Atlas layer (BRDC-ATLAS-001) — one small fetch, one `setNationData` call,
 * kept out of `MapCanvas.tsx` entirely so wiring it in costs that file one line, not a
 * new prop and a new effect block. `ensureTerritoryLayers` already adds the layers
 * themselves (`nationLayer.ts`'s own job); this only ever supplies their data.
 *
 * Fetched once the map is ready, not gated on the shared-world switch — the Atlas is
 * about *other* nations' aggregate ground, not the local player's, and showing where
 * other realms are does not depend on this device publishing its own.
 */
import { useEffect, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { AtlasRegion, PlayerId } from '@es3/core';
import { fetchTable } from '../../data/worldSource.js';
import { setNationData } from './nationLayer.js';

export function useNationLayer(map: MapLibreMap | null, ready: boolean, me: PlayerId | null): void {
  const [regions, setRegions] = useState<AtlasRegion[]>([]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void fetchTable('/atlas').then((result) => {
      if (cancelled || !result.ok) return;
      try {
        const data = JSON.parse(result.text) as { regions?: AtlasRegion[] };
        if (Array.isArray(data.regions)) setRegions(data.regions);
      } catch {
        /* an atlas that will not parse draws nothing, not a crash */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  useEffect(() => {
    if (map) setNationData(map, regions, me);
  }, [map, regions, me]);
}
