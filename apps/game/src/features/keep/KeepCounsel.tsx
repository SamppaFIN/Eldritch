/**
 * The Keeper's Counsel (BRDC-COUNSEL-001, Eldritch-Progression.pdf P6).
 *
 * The first true piece of advice, then the rest one tap at a time ("1 of 3"), each saying
 * where its answer is. Above it, the first codex card not yet read — a short page on a
 * system the first time the realm meets it, gone for good once read. Season 2 saves only.
 */
import { useEffect, useState } from 'react';
import type { Counsel, GameRepository } from '@es3/core';
import { RitualButton } from '@es3/ui';
import './keep.css';

const WHERE: Record<Counsel['where'], string> = {
  keep: 'Here in the Keep, below.',
  hex: 'On the hex card of your own ground.',
  lore: 'In Research — the Lore.',
  map: 'Out on the map, on foot.',
};

export function KeepCounsel({ repository, now }: { repository: GameRepository | null; now: number }) {
  const [counsel, setCounsel] = useState<Counsel[] | null>(null);
  const [card, setCard] = useState<{ id: string; title: string; text: string } | null>(null);
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (!repository) return;
    void (async () => {
      const c = await repository.keep.counsel(now);
      setCounsel(c);
      if (c) setCard(await repository.keep.codex());
    })();
  }, [repository, now]);

  if (!repository || !counsel || counsel.length === 0) return null;
  const shown = counsel[at % counsel.length] as Counsel;

  return (
    <>
      <h3 className="hearth-panel__section">The Keeper’s Counsel</h3>
      {card ? (
        <section className="keep-citizens keep-codex" aria-label="Codex">
          <p className="hearth-panel__line">
            <strong>{card.title}.</strong> {card.text}
          </p>
          <RitualButton
            variant="ghost"
            onClick={() => void repository.keep.readCodex(card.id).then(async () => setCard(await repository.keep.codex()))}
          >
            Got it
          </RitualButton>
        </section>
      ) : null}
      <section className="keep-citizens" aria-label="Counsel">
        <p className="hearth-panel__line es-numeric">
          {(at % counsel.length) + 1} of {counsel.length}
        </p>
        <p className="hearth-panel__line">
          <strong>{shown.title}.</strong> {shown.why}
        </p>
        <p className="hearth-panel__line">{WHERE[shown.where]}</p>
        {counsel.length > 1 ? (
          <RitualButton variant="ghost" onClick={() => setAt((i) => i + 1)}>
            After that
          </RitualButton>
        ) : null}
      </section>
    </>
  );
}
