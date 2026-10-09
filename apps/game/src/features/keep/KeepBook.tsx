/**
 * The Book That Came Back, in the Keep (BRDC-PAGES-001): the pages found so far, each a
 * rite learned without a temple. Reading takes a point of sanity for good, so it asks
 * twice; a mind holds five pages, and the Book says so when it is full.
 *
 * Kept beside the investigator rather than in a Codex: it is their sanity it costs.
 */
import { useCallback, useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import { RITES } from '@es3/core';
import type { GameRepository, PageView } from '@es3/core';
import './keep.css';

const REFUSED: Readonly<Record<string, string>> = {
  'mind-full': 'Your mind holds no more pages.',
  mastered: 'You already know that rite as deeply as it goes.',
};

export function KeepBook({ repository, now }: { repository: GameRepository | null; now: number }) {
  const [view, setView] = useState<PageView | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (repository) setView(await repository.pages.view(now));
  }, [repository, now]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!repository || !view || view.pages.length === 0) return null;
  const read = (id: string) => {
    if (armed !== id) return setArmed(id);
    setArmed(null);
    void repository.pages.read(id, now).then(async (r) => {
      setSaid(r.ok ? r.said : (REFUSED[r.refused] ?? 'The page will not be read.'));
      await load();
    });
  };

  return (
    <>
      <h3 className="hearth-panel__section">The Book That Came Back</h3>
      <section className="keep-citizens" aria-label="The Book">
        <p className="hearth-panel__line es-numeric">
          {view.pages.length} of 10 pages found · sanity holds at most {view.sanityCap}
        </p>
        {view.pages.map((p) => (
          <div key={p.id} className="keep-citizens">
            <details className="keep-more">
              <summary>
                {p.title} · {RITES[p.rite].name}
              </summary>
              <p className="hearth-panel__line">
                <em>{p.text}</em>
              </p>
            </details>
            {p.read ? (
              <p className="hearth-panel__line">✦ Read.</p>
            ) : view.canRead ? (
              <RitualButton variant={armed === p.id ? 'primary' : 'ghost'} onClick={() => read(p.id)}>
                {armed === p.id ? 'Read it — sanity holds one less, for good' : `Read · ${RITES[p.rite].name}`}
              </RitualButton>
            ) : null}
          </div>
        ))}
        {!view.canRead ? <p className="hearth-panel__line">Your mind holds no more pages.</p> : null}
        {said ? (
          <p className="hearth-panel__line" role="status">
            {said}
          </p>
        ) : null}
      </section>
    </>
  );
}
