/**
 * The season's ambition in the Keep (BRDC-AMBITION-001): choose one of three, once — it
 * cannot be changed until the season ends, so choosing asks twice — then watch it fill.
 * Met when the season closes, it multiplies the Legacy by 1.15.
 */
import { useCallback, useEffect, useState } from 'react';
import { ChoiceList } from './ChoiceList.js';
import type { AmbitionId, AmbitionView, GameRepository } from '@es3/core';
import './keep.css';

export function KeepAmbition({ repository, now }: { repository: GameRepository | null; now: number }) {
  const [view, setView] = useState<AmbitionView | null>(null);
  const load = useCallback(async () => {
    if (repository) setView(await repository.ambition.view(now));
  }, [repository, now]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!repository || !view) return null;
  const choose = (id: AmbitionId) => void repository.ambition.choose(id, now).then(load);

  return (
    <>
      <h3 className="hearth-panel__section">The season’s ambition</h3>
      <section className="keep-citizens" aria-label="The season’s ambition">
        {view.chosen && view.progress ? (
          <>
            <p className="hearth-panel__line">
              <strong>{view.chosen.title}.</strong> {view.chosen.text}{' '}
              <span className="es-numeric">
                {view.progress.have} / {view.progress.need}
              </span>
              {view.met ? ' — met. The Legacy ×1.15.' : ''}
            </p>
            <progress className="keep-doom__track" max={view.progress.need} value={view.progress.have} aria-label="Ambition" />
          </>
        ) : (
          <ChoiceList
            legend="Choose how this season remembers you. Met, it multiplies the Legacy by 1.15. You choose once."
            choices={view.choices.map((a) => ({ id: a.id, name: a.title, detail: a.text }))}
            confirm={(a) => `Lock in ${a.name} for the season`}
            onConfirm={choose}
          />
        )}
      </section>
    </>
  );
}
