/**
 * The map's layers that read the repository rather than the territory prop: open gates
 * and found wonders (2026-09-30), each hex's yield (BRDC-MAP-008) and the citizens at
 * work (BRDC-MAP-009). Lifted out of
 * `MapCanvas.tsx` at its line ceiling — one hook, one job: keep these sources fed.
 */
import { useEffect, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Cell, GameRepository, H3Index, HexYield } from '@es3/core';
import { setSeasonMarkData, useSeasonMarks } from '../season/SeasonMarkers.js';
import { setYieldData } from '../territory/yieldLayer.js';
import { animateCitizens, setCitizenData } from '../territory/citizenLayer.js';

export function useMapExtras(
  map: MapLibreMap | null,
  ready: boolean,
  repository: GameRepository | null,
  now: number,
  /** The territory in view — a new array whenever ground, a Work or a hand changes. */
  cells: readonly Cell[] | undefined,
  yieldOverlay: boolean,
): void {
  const seasonMarks = useSeasonMarks(repository, now);
  useEffect(() => {
    if (map && ready) setSeasonMarkData(map, seasonMarks);
  }, [map, ready, seasonMarks]);

  const [yields, setYields] = useState<Readonly<Record<H3Index, HexYield>>>({});
  useEffect(() => {
    if (!repository || !yieldOverlay) return;
    let live = true;
    void repository.yields.all(now).then((y) => live && setYields(y));
    return () => {
      live = false;
    };
  }, [repository, now, cells, yieldOverlay]);
  useEffect(() => {
    if (map && ready) setYieldData(map, yields, yieldOverlay);
  }, [map, ready, yields, yieldOverlay]);

  // Citizens at work (BRDC-MAP-009): fed on the same trigger, swung by one timer.
  const [hands, setHands] = useState<Readonly<Record<H3Index, number>>>({});
  useEffect(() => {
    if (!repository) return;
    let live = true;
    void repository.keep.handsByHex(now).then((h) => live && setHands(h));
    return () => {
      live = false;
    };
  }, [repository, now, cells]);
  useEffect(() => {
    if (map && ready) setCitizenData(map, hands);
  }, [map, ready, hands]);
  useEffect(() => (map && ready ? animateCitizens(map) : undefined), [map, ready]);
}
