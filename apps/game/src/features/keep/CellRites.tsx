/**
 * Rites cast on this hex (BRDC-PROG-007): the ones `castsOnHex` names, on any of your
 * hexes. Only learned ones show; nothing at all on a Season 1 save.
 */
import { useEffect, useState } from 'react';
import { castsOnHex } from '@es3/core';
import type { GameRepository, H3Index, RiteRow } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { riteRefusal } from './riteCopy.js';

export interface CellRitesProps {
  repository: GameRepository | null;
  h3: H3Index;
  now: number;
}

export function CellRites({ repository, h3, now }: CellRitesProps) {
  const [rows, setRows] = useState<RiteRow[]>([]);
  const [mana, setMana] = useState(0);
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const v = repository ? await repository.rites.view(now) : null;
    setRows(v ? v.rites.filter((r) => r.state === 'learned' && castsOnHex(r.id)) : []);
    setMana(v?.mana ?? 0);
  };
  useEffect(() => {
    setSaid(null);
    void load();
    // load reads fresh; the cell and the clock are the triggers.
  }, [repository, h3, now]);

  if (rows.length === 0 || !repository) return null;

  const cast = (row: RiteRow) => {
    if (busy) return;
    setBusy(true);
    void (async () => {
      const r = await repository.rites.cast(row.id, now, h3);
      setSaid(r.ok ? r.said : riteRefusal(r.refused));
      await load();
      setBusy(false);
    })();
  };

  return (
    <section className="keep-citizens" aria-label="Rites">
      {rows.map((row) => (
        <RitualButton
          key={row.id}
          variant="ghost"
          disabled={busy || row.readyAt !== null || mana < row.mana}
          onClick={() => cast(row)}
        >
          {row.readyAt !== null ? `${row.name} · resting` : `${row.name} · ${row.mana} mana`}
        </RitualButton>
      ))}
      {said ? (
        <p className="hearth-panel__line" role="status">
          {said}
        </p>
      ) : null}
    </section>
  );
}
