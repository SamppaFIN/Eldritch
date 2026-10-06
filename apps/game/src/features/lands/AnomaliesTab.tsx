/**
 * The Anomalies tab of Your lands (BRDC-LEDGER-004, handoff F-23): every strange thing on
 * ground you hold — untouched, under study, finished — and the ruins of last season's
 * Fortresses, searched or not. "Lost" (an anomaly on ground since taken from you) is not
 * kept anywhere, so it cannot be listed; that would need its own record.
 */
import { useEffect, useState } from 'react';
import { anomalyAt } from '@es3/core';
import type { GameRepository, H3Index } from '@es3/core';
import { ruinsOnce } from '../../data/season.js';
import { CollectionList } from './CollectionList.js';

export interface MysteryRow {
  h3: H3Index;
  name: string;
  state: 'untouched' | 'study' | 'done' | 'ruin' | 'searched' | 'afar';
  /** What a row says beside its name. */
  note: string;
}

const STATE_NOTE: Readonly<Record<MysteryRow['state'], string>> = {
  untouched: 'untouched — study it from its card',
  afar: 'beyond your border — take the hex to study it',
  study: 'under study',
  done: 'finished',
  ruin: 'not searched yet',
  searched: 'searched',
};

export interface AnomaliesTabProps {
  repository: GameRepository | null;
  open: boolean;
  now: () => number;
  onShowCell: (h3: string) => void;
}

export function AnomaliesTab({ repository, open, now, onShowCell }: AnomaliesTabProps) {
  const [rows, setRows] = useState<MysteryRow[]>([]);
  useEffect(() => {
    if (!open || !repository) return;
    void (async () => {
      const t = now();
      const [live, cells, ruins, searched] = await Promise.all([repository.getAnomalies(t), repository.getOwnedCells(t), ruinsOnce().catch(() => []), repository.ruins.searched()]);
      const anomalies: MysteryRow[] = live.map((a) => ({ h3: a.h3, name: a.sign.name, state: a.afar ? 'afar' : a.state === 'dormant' ? 'untouched' : 'study', note: '' }));
      // Finished ones drop out of the live list; the hex still remembers them.
      const done: MysteryRow[] = cells
        .filter((c) => c.anomaly?.done && anomalyAt(c.h3) !== null)
        .map((c) => ({ h3: c.h3, name: 'Anomaly', state: 'done', note: '' }));
      const ruinRows: MysteryRow[] = ruins.map((h3) => ({ h3, name: 'Ruins of a Fortress', state: searched.includes(h3) ? 'searched' : 'ruin', note: '' }));
      setRows([...anomalies, ...done, ...ruinRows].map((r) => ({ ...r, note: STATE_NOTE[r.state] })));
    })();
  }, [repository, open, now]);

  const row = (r: MysteryRow) => (
    <li className="lands__row">
      <button type="button" className="lands__cell" onClick={() => onShowCell(r.h3)}>
        <span className="lands__ground">{r.name}</span>
        <span className="lands__facts">{r.note}</span>
      </button>
    </li>
  );

  return (
    <CollectionList
      label="Anomalies"
      items={rows}
      keyOf={(r) => `${r.state}|${r.h3}`}
      row={row}
      empty={rows.length === 0 ? 'Nothing strange on your ground yet. Walk, and something will turn up.' : 'Nothing here passes the filter.'}
      filters={[
        { id: 'untouched', label: 'Untouched', keep: (r) => r.state === 'untouched' },
        { id: 'study', label: 'Under study', keep: (r) => r.state === 'study' },
        { id: 'done', label: 'Finished', keep: (r) => r.state === 'done' },
        { id: 'ruins', label: 'Ruins', keep: (r) => r.state === 'ruin' || r.state === 'searched' },
      ]}
    />
  );
}
