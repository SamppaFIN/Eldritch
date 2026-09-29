/**
 * Hands at work on this hex (BRDC-PROG-002, LAW I "No hands, no harvest").
 *
 * One row per building on an owned cell: how many work there, how many can, and a
 * button to send an idle citizen or call one back. Renders nothing on a Season 1 save —
 * `staffOn` is empty there, and buildings keep producing the old way.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, H3Index, StaffSlot } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { BUILDING_NAME } from '../territory/names.js';
import './keep.css';

export interface CellStaffProps {
  repository: GameRepository | null;
  h3: H3Index;
  now: number;
}

const REFUSAL: Record<string, string> = {
  'no-idle': 'No idle citizens. Grow the Keep or call someone back.',
  full: 'Every slot here is taken. Research raises the level.',
  'none-there': 'Nobody works here.',
  'no-keep': 'This realm has no Keep yet.',
};

export function CellStaff({ repository, h3, now }: CellStaffProps) {
  const [rows, setRows] = useState<StaffSlot[]>([]);
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSaid(null);
    if (repository) void repository.keep.staffOn(h3, now).then(setRows);
  }, [repository, h3, now]);

  if (rows.length === 0) return null;

  const move = (id: StaffSlot['id'], delta: 1 | -1) => {
    if (!repository || busy) return;
    setBusy(true);
    void (async () => {
      const r = await repository.keep.staff(h3, id, delta, now);
      setSaid(r.ok ? null : (REFUSAL[r.refused] ?? 'That did not work.'));
      setRows(await repository.keep.staffOn(h3, now));
      setBusy(false);
    })();
  };

  return (
    <section className="keep-citizens" aria-label="Workers">
      {rows.map((row) => (
        <div key={row.id} className="cell-staff__row">
          <p className="hearth-panel__line es-numeric">
            {BUILDING_NAME[row.id]} · {row.hands} / {row.slots} at work
            {row.hands === 0 ? ' — no hands, no yield' : ''}
          </p>
          <div className="cell-staff__buttons">
            <RitualButton variant="ghost" disabled={busy || row.hands >= row.slots} onClick={() => move(row.id, 1)}>
              Send a citizen
            </RitualButton>
            {row.hands > 0 ? (
              <RitualButton variant="ghost" disabled={busy} onClick={() => move(row.id, -1)}>
                Call one back
              </RitualButton>
            ) : null}
          </div>
        </div>
      ))}
      {said ? (
        <p className="hearth-panel__line" role="status">
          {said}
        </p>
      ) : null}
    </section>
  );
}
