/**
 * The Works tab of Your lands (BRDC-LEDGER-002, handoff F-21): every building you hold,
 * what its hex makes (BRDC-YIELD-001), the hands in it, and `+ / −` to move a citizen —
 * the same `repository.keep.staff` call the hex card makes, so the map's citizens and
 * yields follow at once.
 */
import { useCallback, useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import { hexDistance, terrainForCell, worksOn } from '@es3/core';
import type { BuildingId, GameRepository, H3Index, HexYield, ResourceKind, StaffSlot } from '@es3/core';
import { BUILDING_NAME, TERRAIN_NAME } from '../territory/names.js';
import { RESOURCE_COLOUR, RESOURCE_WORD } from '../territory/territoryFeatures.js';
import { signed } from '../territory/CellYield.js';
import { CollectionList } from './CollectionList.js';

export interface WorkRow {
  h3: H3Index;
  id: BuildingId;
  ground: string;
  hands: number;
  /** 0 on a Season 1 save — nothing is staffed there. */
  slots: number;
  /** The hex's yield per hour, largest first. */
  makes: { resource: ResourceKind; amount: number }[];
  /** Rings from the Hearth; the panel does not know where you stand. */
  rings: number;
}

const total = (r: WorkRow) => r.makes.reduce((s, m) => s + Math.max(0, m.amount), 0);

export function useWorksLedger(repository: GameRepository | null, open: boolean, now: () => number) {
  const [rows, setRows] = useState<WorkRow[]>([]);
  const [idle, setIdle] = useState<number | null>(null);
  const load = useCallback(async () => {
    if (!repository) return;
    const t = now();
    const [cells, yields, keep, home] = await Promise.all([
      repository.getOwnedCells(t),
      repository.yields.all(t),
      repository.keep.view(t),
      repository.getHome(),
    ]);
    const out: WorkRow[] = [];
    for (const c of cells.filter((x) => worksOn(x).length > 0)) {
      const staff: StaffSlot[] = keep ? await repository.keep.staffOn(c.h3, t) : [];
      const y: HexYield | undefined = yields[c.h3];
      const makes = (Object.entries(y?.totals ?? {}) as [ResourceKind, number][])
        .filter(([, v]) => Math.abs(v) >= 0.05)
        .sort((a, z) => z[1] - a[1])
        .map(([resource, amount]) => ({ resource, amount }));
      for (const w of worksOn(c)) {
        const s = staff.find((x) => x.id === w.id);
        out.push({
          h3: c.h3, id: w.id, ground: TERRAIN_NAME[terrainForCell(c).kind] ?? terrainForCell(c).kind,
          hands: s?.hands ?? 0, slots: s?.slots ?? 0, makes, rings: home ? hexDistance(home, c.h3) : 0,
        });
      }
    }
    setRows(out);
    setIdle(keep ? keep.idle : null);
  }, [repository, now]);
  useEffect(() => {
    if (open) void load();
  }, [open, load]);
  return { rows, idle, reload: load };
}

export interface WorksTabProps {
  repository: GameRepository | null;
  open: boolean;
  now: () => number;
  onShowCell: (h3: string) => void;
  /** A hand moved: the map re-reads its citizens and yields. */
  onChanged: () => void;
}

export function WorksTab({ repository, open, now, onShowCell, onChanged }: WorksTabProps) {
  const { rows, idle, reload } = useWorksLedger(repository, open, now);
  const [said, setSaid] = useState<string | null>(null);
  const move = (r: WorkRow, delta: 1 | -1) => {
    if (!repository) return;
    void repository.keep.staff(r.h3, r.id, delta, now()).then(async (res) => {
      setSaid(res.ok ? null : res.refused === 'no-idle' ? 'No idle citizens. Grow the Keep or call someone back.' : res.refused === 'full' ? 'Every slot there is taken.' : 'That did not work.');
      await reload();
      if (res.ok) onChanged();
    });
  };

  const row = (r: WorkRow) => (
    <li className="lands__row">
      <button type="button" className="lands__cell" onClick={() => onShowCell(r.h3)}>
        <span className="lands__ground">
          {BUILDING_NAME[r.id]} <span className="lands__tag">{r.ground}</span>
        </span>
        <span className="lands__facts es-numeric">
          {r.makes.length === 0 ? <span className="lands__res lands__res--none">makes nothing</span> : null}
          {r.makes.slice(0, 3).map((m) => (
            <span key={m.resource} className="lands__res" style={{ color: RESOURCE_COLOUR[m.resource] }}>
              {RESOURCE_WORD[m.resource]} {signed(m.amount)}/h
            </span>
          ))}
          {r.slots > 0 ? <span>{r.hands} / {r.slots} at work</span> : null}
          <span>{r.rings === 0 ? 'the Hearth' : `${r.rings} from the Hearth`}</span>
        </span>
      </button>
      {r.slots > 0 ? (
        <div className="ledger__staff">
          <RitualButton variant="ghost" aria-label={`Call one back from the ${BUILDING_NAME[r.id]}`} disabled={r.hands === 0} onClick={() => move(r, -1)}>
            −
          </RitualButton>
          <RitualButton variant="ghost" aria-label={`Send a citizen to the ${BUILDING_NAME[r.id]}`} disabled={r.hands >= r.slots} onClick={() => move(r, 1)}>
            +
          </RitualButton>
        </div>
      ) : null}
    </li>
  );

  return (
    <>
      {idle !== null ? (
        <p className="lands__note es-numeric" role="status">
          {idle} {idle === 1 ? 'citizen' : 'citizens'} free{said ? ` · ${said}` : ''}
        </p>
      ) : null}
      <CollectionList
        label="Works"
        items={rows}
        keyOf={(r) => `${r.h3}|${r.id}`}
        row={row}
        empty={rows.length === 0 ? 'No Works yet. Open a hex of yours and raise one.' : 'Nothing here passes the filter.'}
        filters={idle !== null ? [
          { id: 'empty', label: 'No hands', keep: (r) => r.slots > 0 && r.hands === 0 },
          { id: 'room', label: 'Room for more', keep: (r) => r.hands < r.slots },
        ] : []}
        sorts={[
          { id: 'type', label: 'By type', compare: (a, b) => BUILDING_NAME[a.id].localeCompare(BUILDING_NAME[b.id]) || a.rings - b.rings },
          { id: 'yield', label: 'Most made', compare: (a, b) => total(b) - total(a) },
          { id: 'near', label: 'Nearest the Hearth', compare: (a, b) => a.rings - b.rings },
        ]}
      />
    </>
  );
}
