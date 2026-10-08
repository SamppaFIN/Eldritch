/**
 * The stranger in many masks, in the Keep (BRDC-MASKS-001): the guises met in rumours, and
 * once there are three, the names to try — a wrong one costs sanity, so a name asks twice.
 * The true name opens a choice, made once. Nothing shows until the first mask is met.
 */
import { useCallback, useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import { MASKS_TO_NAME } from '@es3/core';
import type { GameRepository, MaskView } from '@es3/core';
import './keep.css';

export function KeepStranger({ repository, now }: { repository: GameRepository | null; now: number }) {
  const [view, setView] = useState<MaskView | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (repository) setView(await repository.masks.view(now));
  }, [repository, now]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!repository || !view || view.met.length === 0) return null;
  const twice = (key: string, run: () => Promise<{ ok: boolean; said?: string }>) => {
    if (armed !== key) return setArmed(key);
    setArmed(null);
    void run().then(async (r) => {
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
        {view.names.length > 0 ? <p className="hearth-panel__line">Every one of them cast a shadow toward the lake. Who is he?</p> : null}
        {view.names.map((n) => (
          <RitualButton key={n.id} variant={armed === n.id ? 'primary' : 'ghost'} onClick={() => twice(n.id, () => repository.masks.name(n.id, now))}>
            {armed === n.id ? `Say it: ${n.name}` : n.name}
          </RitualButton>
        ))}
        {view.choices.map((c) => (
          <div key={c.id} className="keep-citizens">
            <p className="hearth-panel__line">{c.text}</p>
            <RitualButton variant={armed === c.id ? 'primary' : 'ghost'} onClick={() => twice(c.id, () => repository.masks.choose(c.id, now))}>
              {armed === c.id ? `${c.name} — for good` : c.name}
            </RitualButton>
          </div>
        ))}
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
