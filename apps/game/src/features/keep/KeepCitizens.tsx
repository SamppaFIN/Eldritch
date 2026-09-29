/**
 * The Keep · Citizens (BRDC-PROG-001, Eldritch-Progression.pdf P1).
 *
 * How many live here and how many can, the granary toward the next one, and the food
 * ledger that decides it. Renders nothing on a Season 1 save — that save has no Keep
 * record, and the game it plays is unchanged until Season 2 opens.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, KeepView, ResourcePool } from '@es3/core';
import { RitualButton } from '@es3/ui';

export interface KeepCitizensProps {
  repository: GameRepository | null;
  now: number;
  onPouch: (pool: ResourcePool) => void;
}

const REFUSAL: Record<string, string> = {
  'cannot-afford': 'Not enough food and stone yet.',
  'at-limit': 'Research Granaries to raise it further.',
  'no-keep': 'This realm has no Keep yet.',
};

const signed = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(Math.round(n))}`;

export function KeepCitizens({ repository, now, onPouch }: KeepCitizensProps) {
  const [view, setView] = useState<KeepView | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (repository) void repository.keep.view(now).then(setView);
  }, [repository, now]);

  if (!view) return null;
  const intoGranary = view.producedPerH - view.eatenPerH;
  const full = view.citizens >= view.housing;

  const raise = () => {
    if (!repository || busy) return;
    setBusy(true);
    void (async () => {
      const r = await repository.keep.raise(now);
      setSaid(r.ok ? `The Keep rises to level ${r.keep.level}.` : (REFUSAL[r.refused] ?? 'That did not work.'));
      setView(await repository.keep.view(now));
      onPouch(await repository.getResources(now));
      setBusy(false);
    })();
  };

  return (
    <>
      <h3 className="hearth-panel__section">Citizens</h3>
      <section className="keep-citizens" aria-label="Citizens">
        <p className="hearth-panel__line es-numeric">
          {view.citizens} / {view.housing} housed · {view.idle} idle · Keep level {view.level}
        </p>
        <label className="keep-citizens__granary">
          <span>
            {full
              ? 'The Keep is full — surplus food goes to the pouch.'
              : `Granary ${Math.floor(view.box)} / ${view.boxNeed}`}
          </span>
          <progress max={view.boxNeed} value={Math.min(view.box, view.boxNeed)} />
        </label>
        {view.storesLeftH === null ? null : view.storesLeftH <= 0 ? (
          <p className="hearth-panel__line" role="alert">
            The stores are full and the realm sleeps. Walk to the Keep to collect.
          </p>
        ) : (
          <p className="hearth-panel__line">Stores fill for {Math.ceil(view.storesLeftH)} more h.</p>
        )}
        {view.hoursToNext !== null ? (
          <p className="hearth-panel__line">Next citizen in {Math.ceil(view.hoursToNext)} h.</p>
        ) : null}
        <dl className="keep-citizens__ledger es-numeric">
          <div>
            <dt>Food made</dt>
            <dd>{signed(view.producedPerH)}/h</dd>
          </div>
          <div>
            <dt>{view.citizens} eat</dt>
            <dd>{signed(-view.eatenPerH)}/h</dd>
          </div>
          <div>
            <dt>Into the granary</dt>
            <dd>{signed(intoGranary)}/h</dd>
          </div>
        </dl>
        {intoGranary < 0 ? (
          <p className="hearth-panel__line" role="alert">
            The realm is hungry. Build a Farmstead or it will lose people.
          </p>
        ) : null}
        <RitualButton variant="ghost" disabled={busy} onClick={raise}>
          {`Raise the Keep · ${view.raiseCost.food} food · ${view.raiseCost.stone} stone`}
        </RitualButton>
        {said ? (
          <p className="hearth-panel__line" role="status">
            {said}
          </p>
        ) : null}
      </section>
    </>
  );
}
