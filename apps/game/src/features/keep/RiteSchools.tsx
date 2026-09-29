/**
 * Temple schools (BRDC-PROG-007, Eldritch-Progression.pdf P4).
 *
 * Dedicate a school, learn its rites a tier at a time, deepen them rank by rank, and cast
 * the ones that act on the whole realm. A rite cast on one hex (Salt Circle, Call the
 * Shoal) is cast from that hex's card instead — `CellRites`. Renders nothing on a
 * Season 1 save.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, RiteRow, RiteView, School } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { riteRefusal } from './riteCopy.js';
import './keep.css';

const SCHOOLS: readonly { id: School; name: string; blurb: string }[] = [
  { id: 'ward', name: 'The Ward', blurb: 'Defence and sanity. Holds what you have.' },
  { id: 'tide', name: 'The Tide', blurb: 'Food, mana and recovery. Feeds the Keep.' },
  { id: 'whisper', name: 'The Whisper', blurb: 'Sight, rivals and encounters.' },
];
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

export interface RiteSchoolsProps {
  repository: GameRepository | null;
  now: number;
}

/** A rite that lands on one hex is cast from the hex card, not from here. */
export const castsOnHex = (id: string): boolean => id === 'salt-circle' || id === 'call-the-shoal';

export function RiteSchools({ repository, now }: RiteSchoolsProps) {
  const [view, setView] = useState<RiteView | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (repository) void repository.rites.view(now).then(setView);
  }, [repository, now]);

  if (!view || !repository) return null;

  const act = (run: () => Promise<{ ok: true; said: string } | { ok: false; refused: string }>) => {
    if (busy) return;
    setBusy(true);
    void (async () => {
      const r = await run();
      setSaid(r.ok ? r.said : riteRefusal(r.refused));
      setView(await repository.rites.view(now));
      setBusy(false);
    })();
  };

  const free = view.slots - view.schools.length;
  const button = (row: RiteRow) => {
    if (row.state === 'available' && row.nextCost !== null) {
      return (
        <RitualButton variant="ghost" disabled={busy || view.mana < row.nextCost} onClick={() => act(() => repository.rites.learn(row.id, now))}>
          {`Learn · ${row.nextCost} mana`}
        </RitualButton>
      );
    }
    if (row.state !== 'learned') return null;
    return (
      <div className="cell-staff__buttons">
        {row.wired && !castsOnHex(row.id) ? (
          <RitualButton variant="ghost" disabled={busy || row.readyAt !== null || view.mana < row.mana} onClick={() => act(() => repository.rites.cast(row.id, now))}>
            {row.readyAt !== null ? 'Resting' : `Cast · ${row.mana} mana`}
          </RitualButton>
        ) : null}
        {row.nextCost !== null ? (
          <RitualButton variant="ghost" disabled={busy || view.mana < row.nextCost} onClick={() => act(() => repository.rites.deepen(row.id, now))}>
            {`Deepen · ${row.nextCost} mana`}
          </RitualButton>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <h3 className="hearth-panel__section">Temple schools</h3>
      <section className="keep-citizens" aria-label="Temple schools">
        <p className="hearth-panel__line es-numeric">
          {Math.floor(view.mana)} mana · rank cap {ROMAN[view.rankCap - 1]}
        </p>
        {view.slots === 0 ? <p className="hearth-panel__line">Study Kindling in the Lore to dedicate a temple.</p> : null}
        {free > 0
          ? SCHOOLS.filter((s) => !view.schools.includes(s.id)).map((s) => (
              <div key={s.id} className="cell-staff__row">
                <p className="hearth-panel__line">
                  <strong>{s.name}</strong> — {s.blurb}
                </p>
                <RitualButton variant="ghost" disabled={busy} onClick={() => act(() => repository.rites.dedicate(s.id, now))}>
                  {`Dedicate to ${s.name}`}
                </RitualButton>
              </div>
            ))
          : null}
        {view.rites.map((row) => (
          <div key={row.id} className="cell-staff__row">
            <p className="hearth-panel__line">
              <strong>
                {ROMAN[row.tier - 1]} · {row.name}
              </strong>
              {row.rank ? ` · rank ${ROMAN[row.rank - 1]}` : ` · ${row.state}`} — {row.text}
              {row.wired ? '' : ' (not yet in the game)'}
            </p>
            {button(row)}
          </div>
        ))}
        {said ? (
          <p className="hearth-panel__line" role="status">
            {said}
          </p>
        ) : null}
      </section>
    </>
  );
}
