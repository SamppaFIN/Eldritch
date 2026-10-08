/**
 * Great people in the Keep (BRDC-GREAT-001): how near the next of each kind is, the ones
 * waiting with their deed — used once, so using asks twice — and whose deed is done.
 * Nothing shows until a Library, Market or Temple Grove is gathering.
 */
import { useCallback, useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import type { GameRepository, GreatView } from '@es3/core';
import './keep.css';

const REFUSED: Readonly<Record<string, string>> = {
  'no-home': 'There is no Hearth to see from yet.',
  'nothing-to-do': 'No gate stands open. The deed keeps.',
};

export function KeepGreat({ repository, now }: { repository: GameRepository | null; now: number }) {
  const [view, setView] = useState<GreatView | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (repository) setView(await repository.great.view(now));
  }, [repository, now]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!repository || !view) return null;
  const gathering = view.kinds.filter((k) => k.perHour > 0 || k.points > 0);
  if (gathering.length === 0 && view.waiting.length === 0 && view.done.length === 0 && !said) return null;
  const use = (id: string) => {
    if (armed !== id) return setArmed(id);
    setArmed(null);
    void repository.great.use(id, now).then(async (r) => {
      setSaid(r.ok ? r.said : (REFUSED[r.refused] ?? 'That did not work.'));
      await load();
    });
  };

  return (
    <>
      <h3 className="hearth-panel__section">Great people</h3>
      <section className="keep-citizens" aria-label="Great people">
        {gathering.map((k) => (
          <p key={k.kind} className="hearth-panel__line">
            {k.title} <span className="es-numeric">{k.points} / {k.need}</span> · {k.perHour}/h
          </p>
        ))}
        {view.waiting.map((p) => (
          <div key={p.id} className="keep-citizens">
            <p className="hearth-panel__line">
              <strong>{p.name}.</strong> {p.deedText}
            </p>
            <RitualButton variant={armed === p.id ? 'primary' : 'ghost'} onClick={() => use(p.id)}>
              {armed === p.id ? `${p.deedName} — now` : p.deedName}
            </RitualButton>
          </div>
        ))}
        {view.done.map((p) => (
          <p key={p.id} className="hearth-panel__line">
            ✦ {p.name} — {p.deedName}, done.
          </p>
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
