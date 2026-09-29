/**
 * Masterworks — the unlock ladder (BRDC-PROG-006, Eldritch-Progression.pdf P3).
 *
 * Each masterwork with how many of its needs are met, each need marked met or not (a mark
 * and a word, never colour alone — §14), what it gives, and Raise once every need is met.
 * One that stands says so; one whose count has fallen says it sleeps. Nothing on a
 * Season 1 save.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, MasterworkRow, ResourceKind, ResourcePool } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { BUILDING_NAME } from '../territory/names.js';
import { RESOURCE_WORD } from '../territory/territoryFeatures.js';
import './keep.css';

const NAME: Record<MasterworkRow['id'], string> = {
  fortress: 'The Fortress',
  manor: 'The Manor',
  foundry: 'The Foundry',
  exchange: 'The Exchange',
  'sunken-cathedral': 'The Sunken Cathedral',
};

const REFUSAL: Record<string, string> = {
  'not-ready': 'Not every need is met yet.',
  'cannot-afford': 'Not enough in the pouch yet.',
  'no-keep': 'This realm has no Keep yet.',
};

const price = (cost: Partial<ResourcePool>) =>
  (Object.entries(cost) as [ResourceKind, number][]).map(([k, v]) => `${v} ${RESOURCE_WORD[k]}`).join(' · ');

export interface KeepMasterworksProps {
  repository: GameRepository | null;
  now: number;
  onPouch: (pool: ResourcePool) => void;
  /** The map redraws — a host has become something else. */
  onRaised: () => void;
}

export function KeepMasterworks({ repository, now, onPouch, onRaised }: KeepMasterworksProps) {
  const [rows, setRows] = useState<MasterworkRow[] | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (repository) void repository.masterworks.view(now).then(setRows);
  }, [repository, now]);

  if (!rows || !repository) return null;

  const raise = (row: MasterworkRow) => {
    if (busy) return;
    setBusy(true);
    void (async () => {
      const r = await repository.masterworks.raise(row.id, now);
      setSaid(r.ok ? `${NAME[row.id]} rises.` : (REFUSAL[r.refused] ?? 'That did not work.'));
      setRows(await repository.masterworks.view(now));
      onPouch(await repository.getResources(now));
      if (r.ok) onRaised();
      setBusy(false);
    })();
  };

  return (
    <>
      <h3 className="hearth-panel__section">Masterworks</h3>
      <section className="keep-citizens" aria-label="Masterworks">
        {rows.map((row) => (
          <div key={row.id} className="cell-staff__row">
            <p className="hearth-panel__line">
              <strong>{NAME[row.id]}</strong>
              {row.standing ? (row.dormant ? ' · Dormant — rebuild its works to wake it' : ' · Standing') : ` · ${row.met} of ${row.needs.length} met`}
            </p>
            {row.standing ? null : (
              <ul className="keep-masterwork__needs">
                {row.needs.map((n) => (
                  <li key={n.text}>
                    {n.met ? '✓ ' : '○ '}
                    {n.text.replace(/\b(watchtower|farm|forge|quarry|market|temple-grove)\b/g, (k) => BUILDING_NAME[k as keyof typeof BUILDING_NAME] ?? k)}
                  </li>
                ))}
              </ul>
            )}
            <p className="hearth-panel__line">{row.gives}</p>
            {row.ready ? (
              <RitualButton variant="ghost" disabled={busy} onClick={() => raise(row)}>
                {`Raise · ${price(row.cost)}`}
              </RitualButton>
            ) : null}
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
