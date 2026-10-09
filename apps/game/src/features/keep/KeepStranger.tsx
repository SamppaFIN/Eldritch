/**
 * The stranger in many masks, in the Keep (BRDC-MASKS-001): the guises met in rumours, and
 * once there are three, the names to try — a wrong one costs sanity, so a name asks twice.
 * The true name opens a choice, made once. Nothing shows until the first mask is met.
 */
import { useCallback, useEffect, useState } from 'react';
import { ChoiceList } from './ChoiceList.js';
import { MASKS_TO_NAME } from '@es3/core';
import type { GameRepository, MaskView } from '@es3/core';
import './keep.css';

export function KeepStranger({ repository, now }: { repository: GameRepository | null; now: number }) {
  const [view, setView] = useState<MaskView | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (repository) setView(await repository.masks.view(now));
  }, [repository, now]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!repository || !view || view.met.length === 0) return null;
  const run = (act: () => Promise<{ ok: boolean; said?: string }>) => {
    void act().then(async (r) => {
      setSaid(r.said ?? 'Nothing answers.');
      await load();
    });
  };

  return (
    <>
      <h3 className="hearth-panel__section">The stranger</h3>
      <section className="keep-citizens" aria-label="The stranger">
        <p className="hearth-panel__line">
          Masks met: {view.met.join(', ')}.{' '}
          {view.met.length < MASKS_TO_NAME && !view.named ? `Meet ${MASKS_TO_NAME - view.met.length} more and you may name him.` : ''}
        </p>
        {view.names.length > 0 ? (
          <ChoiceList
            legend="Every one of them cast a shadow toward the lake. Who is he?"
            choices={view.names.map((n) => ({ id: n.id, name: n.name }))}
            confirm={(n) => `Say it: ${n.name}`}
            onConfirm={(id) => run(() => repository.masks.name(id, now))}
          />
        ) : null}
        {view.choices.length > 0 ? (
          <ChoiceList
            legend="Named, he waits for what you will do."
            choices={view.choices.map((c) => ({ id: c.id, name: c.name, detail: c.text }))}
            confirm={(c) => `${c.name} — for good`}
            onConfirm={(id) => run(() => repository.masks.choose(id, now))}
          />
        ) : null}
        {view.chosen ? <p className="hearth-panel__line">✦ Named, and {view.chosen === 'bargain' ? 'bargained with' : 'banished'}.</p> : null}
        {said ? (
          <p className="hearth-panel__line" role="status">
            {said}
          </p>
        ) : null}
      </section>
    </>
  );
}
