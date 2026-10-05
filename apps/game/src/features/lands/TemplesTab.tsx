/**
 * The Temples tab of Your lands (BRDC-LEDGER-003, handoff F-22): the temples your dwelling
 * revealed and the Temple Groves you raised — awake or asleep, who found them, what they
 * pay, when you were last there — and a tour that flies from one to the next.
 */
import { useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import { DORMANT_AFTER_MS, worksOn } from '@es3/core';
import type { GameRepository, H3Index, ResourceKind } from '@es3/core';
import { relativeTime } from '../log/describe.js';
import { RESOURCE_COLOUR, RESOURCE_WORD } from '../territory/territoryFeatures.js';
import { signed } from '../territory/CellYield.js';
import { CollectionList } from './CollectionList.js';

export interface TempleRow {
  h3: H3Index;
  name: string;
  awake: boolean;
  /** Found by you, or held now on ground somebody else first found. */
  yours: boolean;
  lastVisit: number;
  pays: { resource: ResourceKind; amount: number }[];
}

export interface TemplesTabProps {
  repository: GameRepository | null;
  open: boolean;
  now: () => number;
  onShowCell: (h3: string) => void;
  /** Fly from temple to temple, the card open on each (handoff F-22). */
  onTour: (h3s: readonly H3Index[]) => void;
}

export function TemplesTab({ repository, open, now, onShowCell, onTour }: TemplesTabProps) {
  const [rows, setRows] = useState<TempleRow[]>([]);
  useEffect(() => {
    if (!open || !repository) return;
    void (async () => {
      const t = now();
      const [cells, places, yields, me] = await Promise.all([repository.getOwnedCells(t), repository.getPlaces(), repository.yields.all(t), repository.getProfile()]);
      const byH3 = new Map(cells.map((c) => [c.h3, c]));
      const temples = places.filter((p) => p.kind === 'temple').map((p) => ({ h3: p.h3, name: `Temple ${p.rank}` }));
      const groves = cells.filter((c) => worksOn(c).some((w) => w.id === 'temple-grove')).map((c) => ({ h3: c.h3, name: 'Temple Grove' }));
      setRows(
        [...temples, ...groves].flatMap(({ h3, name }) => {
          const c = byH3.get(h3);
          if (!c) return [];
          const pays = (Object.entries(yields[h3]?.totals ?? {}) as [ResourceKind, number][])
            .filter(([k, v]) => v > 0 && (k === 'mana' || k === 'wisdom'))
            .map(([resource, amount]) => ({ resource, amount }));
          return [{ h3, name, awake: t - c.lastVisitedAt <= DORMANT_AFTER_MS, yours: (c.finder ?? me.id) === me.id, lastVisit: c.lastVisitedAt, pays }];
        }),
      );
    })();
  }, [repository, open, now]);

  const row = (r: TempleRow) => (
    <li className="lands__row">
      <button type="button" className="lands__cell" onClick={() => onShowCell(r.h3)}>
        <span className="lands__ground">
          {r.name}
          <span className={`lands__tag${r.awake ? '' : ' lands__tag--new'}`}>{r.awake ? 'awake' : 'asleep — walk to it'}</span>
        </span>
        <span className="lands__facts es-numeric">
          {r.pays.length === 0 ? <span className="lands__res lands__res--none">pays nothing now</span> : null}
          {r.pays.map((p) => (
            <span key={p.resource} className="lands__res" style={{ color: RESOURCE_COLOUR[p.resource] }}>
              {RESOURCE_WORD[p.resource]} {signed(p.amount)}/h
            </span>
          ))}
          <span>{r.yours ? 'found by you' : 'found by another'}</span>
          <span>last there {relativeTime(r.lastVisit, now())}</span>
        </span>
      </button>
    </li>
  );

  return (
    <>
      {rows.length > 1 ? (
        <RitualButton variant="ghost" onClick={() => onTour(rows.map((r) => r.h3))}>
          {`Tour the temples · ${rows.length}`}
        </RitualButton>
      ) : null}
      <CollectionList
        label="Temples"
        items={rows}
        keyOf={(r) => r.h3}
        row={row}
        empty={rows.length === 0 ? 'No temple yet. Stay in one place long enough and one reveals itself.' : 'Nothing here passes the filter.'}
        filters={[{ id: 'asleep', label: 'Asleep', keep: (r) => !r.awake }]}
        sorts={[
          { id: 'name', label: 'In order' },
          { id: 'visit', label: 'Longest since a visit', compare: (a, b) => a.lastVisit - b.lastVisit },
        ]}
      />
    </>
  );
}
