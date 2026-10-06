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
import { setStandardData } from '../territory/standardLayer.js';
import { setAfarAnomalyData } from '../territory/afarAnomalyLayer.js';

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

  // Your planted standard (BRDC-STANDARD-001): planting refreshes the territory, which re-reads here.
  const [standard, setStandard] = useState<H3Index | null>(null);
  useEffect(() => {
    if (repository) void repository.standard.at().then((s) => setStandard(s?.h3 ?? null));
  }, [repository, cells]);
  useEffect(() => {
    if (map && ready) setStandardData(map, standard);
  }, [map, ready, standard]);

  // A temple day counts for a Tavern task as you walk, not only when the board is open (BRDC-QUEST-009).
  useEffect(() => {
    if (repository) void repository.tasks.sync(now);
  }, [repository, now, cells]);

  // The Medium's anomalies one ring past your border (BRDC-INVEST-001); empty for anyone else.
  const [afar, setAfar] = useState<H3Index[]>([]);
  useEffect(() => {
    if (repository) void repository.getAnomalies(now).then((all) => setAfar(all.filter((a) => a.afar).map((a) => a.h3)));
  }, [repository, now, cells]);
  useEffect(() => {
    if (map && ready) setAfarAnomalyData(map, afar);
  }, [map, ready, afar]);
}
