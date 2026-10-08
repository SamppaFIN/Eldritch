/**
 * The Routes tab of Your lands (BRDC-TRADEROUTE-001): every trade route walked this
 * season, what it pays, and whether its ends still hold. A row shows its Market on the
 * map.
 */
import { useEffect, useState } from 'react';
import { EmptyState, FlowerOfLife } from '@es3/ui';
import type { GameRepository, RouteRow } from '@es3/core';

export interface RoutesTabProps {
  repository: GameRepository | null;
  open: boolean;
  now: () => number;
  onShowCell: (h3: string) => void;
}

export function RoutesTab({ repository, open, now, onShowCell }: RoutesTabProps) {
  const [rows, setRows] = useState<RouteRow[] | null>(null);
  useEffect(() => {
    if (!open || !repository) return;
    let live = true;
    void repository.routes.view(now()).then((r) => live && setRows(r));
    return () => {
      live = false;
    };
  }, [open, repository, now]);

  if (!rows) return null;
  if (rows.length === 0) {
    return (
      <EmptyState
        mark={<FlowerOfLife size={56} />}
        ink="var(--sacred-gold)"
        title="No trade routes yet"
        body="Walk from one of your Markets to another, or to a village's door, in one walk under two kilometres."
      />
    );
  }
  return (
    <ul className="lands__list" aria-label="Trade routes">
      {rows.map((r) => (
        <li key={r.id} className="lands__row">
          <button type="button" className="lands__cell" onClick={() => onShowCell(r.a)}>
            <span className="lands__ground">
              {r.toVillage ? 'Market → village' : 'Market → Market'} · {(r.lengthM / 1000).toFixed(1)} km
            </span>
            <span className="lands__facts">{r.active ? `+${r.goldPerHour.toFixed(1)} gold/h` : 'broken — an end is lost'}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
