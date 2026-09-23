/**
 * Feeds the Atlas layer (BRDC-ATLAS-001) — one small fetch, one `setNationData` call,
 * kept out of `MapCanvas.tsx` entirely so wiring it in costs that file one line, not a
 * new prop and a new effect block. `ensureTerritoryLayers` already adds the layers
 * themselves (`nationLayer.ts`'s own job); this only ever supplies their data.
 *
 * Fetched once the map is ready, not gated on the shared-world switch — the Atlas is
 * about *other* nations' aggregate ground, not the local player's, and showing where
 * other realms are does not depend on this device publishing its own.
 *
 * Also carries "then vs now" (the ticket's `atlasWeekKey`/`atlasDiff` other half): once a
 * weekly snapshot exists, `toggleCompare` swaps the layer's data to the oldest one kept
 * instead of the live table, so the same municipality can be seen a few weeks back.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { AtlasRegion, PlayerId } from '@es3/core';
import { fetchAtlasHistoryWeeks, fetchAtlasSnapshot, fetchTable } from '../../data/worldSource.js';
import { setNationData } from './nationLayer.js';
import { NATION_FADE_END } from './layerIds.js';

export interface NationLayerControls {
  /** True once the camera has zoomed into the band the Atlas actually draws in — a
   *  "then/now" toggle is clutter at walking zoom, where there is nothing to toggle. */
  visible: boolean;
  /** True once at least one weekly snapshot exists to compare the live table against. */
  compareAvailable: boolean;
  comparing: boolean;
  toggleCompare: () => void;
}

export function useNationLayer(map: MapLibreMap | null, ready: boolean, me: PlayerId | null): NationLayerControls {
  const [live, setLive] = useState<AtlasRegion[]>([]);
  const [weeks, setWeeks] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState<AtlasRegion[] | null>(null);
  const [comparing, setComparing] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void fetchTable('/atlas').then((result) => {
      if (cancelled || !result.ok) return;
      try {
        const data = JSON.parse(result.text) as { regions?: AtlasRegion[] };
        if (Array.isArray(data.regions)) setLive(data.regions);
      } catch {
        /* an atlas that will not parse draws nothing, not a crash */
      }
    });
    void fetchAtlasHistoryWeeks().then((w) => !cancelled && setWeeks(w));
    return () => {
      cancelled = true;
    };
  }, [ready]);

  // The oldest kept snapshot, fetched only once comparison is actually asked for.
  useEffect(() => {
    if (!comparing || snapshot || weeks.length === 0) return;
    let cancelled = false;
    void fetchAtlasSnapshot(weeks[0]!).then((result) => {
      if (cancelled || !result.ok) return;
      try {
        const data = JSON.parse(result.text) as { regions?: AtlasRegion[] };
        if (Array.isArray(data.regions)) setSnapshot(data.regions);
      } catch {
        /* a snapshot that will not parse leaves comparing with nothing to show */
      }
    });
    return () => {
      cancelled = true;
    };
  }, [comparing, snapshot, weeks]);

  useEffect(() => {
    if (map) setNationData(map, comparing && snapshot ? snapshot : live, me);
  }, [map, live, snapshot, comparing, me]);

  // Below NATION_FADE_END the cross-fade has finished and the layer paints nothing —
  // the same boundary `nationLayer.ts` itself fades out across.
  useEffect(() => {
    if (!map) return;
    const update = () => setVisible(map.getZoom() < NATION_FADE_END);
    update();
    map.on('zoom', update);
    return () => {
      map.off('zoom', update);
    };
  }, [map]);

  const toggleCompare = useCallback(() => setComparing((c) => !c), []);

  return { visible, compareAvailable: weeks.length > 0, comparing, toggleCompare };
}
