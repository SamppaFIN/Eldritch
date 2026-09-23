/**
 * The season's trail, read as "since tracking began vs today" (BRDC-SEASON-001).
 *
 * The Worker keeps one daily snapshot per player; this reads the oldest and the newest
 * of them and turns the pair into a gained-since-then figure, the same "then vs now"
 * shape `AtlasCompareControl` already uses for the country map. A full day-by-day chart
 * is future work (the ticket's own "Ei tässä") — this is the trend a phone screen and a
 * six-player group actually needs first: who is moving, and by how much.
 */
import { useEffect, useState } from 'react';
import type { SeasonStanding } from '@es3/core';
import { fetchSeasonDay, fetchSeasonDays } from '../../data/worldSource.js';

export interface SeasonRow {
  id: string;
  name: string;
  distanceM: number;
  hexes: number;
  distanceGained: number;
  hexesGained: number;
}

export type SeasonState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; sinceDayKey: string; rows: readonly SeasonRow[] }
  | { status: 'empty' }
  | { status: 'unreachable' };

interface DaySnapshot {
  dayKey: string;
  standings: SeasonStanding[];
}

function parseDay(text: string): DaySnapshot | null {
  try {
    const data = JSON.parse(text) as Partial<DaySnapshot>;
    return Array.isArray(data.standings) && typeof data.dayKey === 'string'
      ? (data as DaySnapshot)
      : null;
  } catch {
    return null;
  }
}

export function useSeason(open: boolean): { state: SeasonState; reload: () => void } {
  const [state, setState] = useState<SeasonState>({ status: 'idle' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ status: 'loading' });

    void (async () => {
      const days = await fetchSeasonDays();
      if (cancelled) return;
      if (days.length === 0) {
        setState({ status: 'empty' });
        return;
      }

      const latestKey = days[days.length - 1] as string;
      const oldestKey = days[0] as string;
      const latestRes = await fetchSeasonDay(latestKey);
      if (cancelled) return;
      if (!latestRes.ok) {
        setState({ status: latestRes.reason });
        return;
      }
      const latest = parseDay(latestRes.text);
      if (!latest) {
        setState({ status: 'unreachable' });
        return;
      }

      let oldest = latest;
      if (oldestKey !== latestKey) {
        const oldestRes = await fetchSeasonDay(oldestKey);
        if (cancelled) return;
        if (oldestRes.ok) oldest = parseDay(oldestRes.text) ?? latest;
      }

      const before = new Map(oldest.standings.map((s) => [s.id, s]));
      const rows: SeasonRow[] = [...latest.standings]
        .map((s) => {
          const b = before.get(s.id);
          return {
            id: s.id,
            name: s.name,
            distanceM: s.distanceM,
            hexes: s.hexes,
            distanceGained: s.distanceM - (b?.distanceM ?? s.distanceM),
            hexesGained: s.hexes - (b?.hexes ?? s.hexes),
          };
        })
        .sort((a, b) => b.distanceGained - a.distanceGained);

      setState({ status: 'ready', sinceDayKey: oldestKey, rows });
    })();

    return () => {
      cancelled = true;
    };
  }, [open, nonce]);

  const reload = () => setNonce((n) => n + 1);
  return { state, reload };
}
