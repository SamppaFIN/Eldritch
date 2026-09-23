/**
 * The Season, read against each player's own starting line (BRDC-SEASON-001).
 *
 * "Join the Weekly Tournament" publishes a player's current distance and hexes as their
 * personal baseline (Infinite, 2026-09-23: *"valitset liity viikkoturnaukseen ja sen
 * jälkeen saat sen hetken tilanteen listoille.. päivittyy kerran päivässä"*). This reads
 * that baseline back against the most recent daily snapshot and ranks everyone who has
 * joined by what they gained since *they* opted in — not since one fixed calendar date,
 * so six friends joining on six different days all see an honest "since I joined" figure.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, SeasonJoin } from '@es3/core';
import {
  fetchSeasonDay,
  fetchSeasonDays,
  fetchSeasonJoins,
  publishSeasonJoin,
} from '../../data/worldSource.js';

export interface SeasonRow {
  id: string;
  name: string;
  distanceM: number;
  hexes: number;
  distanceGained: number;
  hexesGained: number;
  joinedAt: number;
}

export type SeasonState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; rows: readonly SeasonRow[] }
  | { status: 'empty' }
  | { status: 'unreachable' };

interface DaySnapshot {
  standings: SeasonJoin[];
}

function parseDay(text: string): DaySnapshot | null {
  try {
    const data = JSON.parse(text) as Partial<DaySnapshot>;
    return Array.isArray(data.standings) ? (data as DaySnapshot) : null;
  } catch {
    return null;
  }
}

export function useSeason(
  open: boolean,
  repository: GameRepository | null,
): { state: SeasonState; reload: () => void; joining: boolean; join: () => void } {
  const [state, setState] = useState<SeasonState>({ status: 'idle' });
  const [joining, setJoining] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ status: 'loading' });

    void (async () => {
      const [joins, days] = await Promise.all([fetchSeasonJoins(), fetchSeasonDays()]);
      if (cancelled) return;
      if (joins === null) {
        setState({ status: 'unreachable' });
        return;
      }
      if (joins.length === 0) {
        setState({ status: 'empty' });
        return;
      }

      let latest: SeasonJoin[] = [];
      if (days.length > 0) {
        const latestKey = days[days.length - 1] as string;
        const res = await fetchSeasonDay(latestKey);
        if (cancelled) return;
        if (res.ok) latest = parseDay(res.text)?.standings ?? [];
      }
      const latestById = new Map(latest.map((s) => [s.id, s]));

      const rows: SeasonRow[] = joins
        .map((j) => {
          const now = latestById.get(j.id) ?? j;
          return {
            id: j.id,
            name: j.name,
            distanceM: now.distanceM,
            hexes: now.hexes,
            distanceGained: Math.max(0, now.distanceM - j.distanceM),
            hexesGained: Math.max(0, now.hexes - j.hexes),
            joinedAt: j.joinedAt,
          };
        })
        .sort((a, b) => b.distanceGained - a.distanceGained);

      setState({ status: 'ready', rows });
    })();

    return () => {
      cancelled = true;
    };
  }, [open, nonce]);

  const reload = () => setNonce((n) => n + 1);

  const join = () => {
    if (!repository || joining) return;
    setJoining(true);
    void (async () => {
      const profile = await repository.getProfile();
      const source = await repository.exportWorldSource(Date.now(), {});
      const distanceM = Math.round(source.routeDistanceM ?? source.leyM ?? 0);
      const hexes = source.cells.length;
      const ok = await publishSeasonJoin(profile.id, profile.name, distanceM, hexes);
      setJoining(false);
      if (ok) reload();
    })();
  };

  return { state, reload, joining, join };
}
