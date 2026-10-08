/**
 * A great person is born (BRDC-GREAT-001): an edge card, read once, that says who and
 * where their deed waits. Cards pile up; nothing times them out.
 *
 * Re-read whenever your ground changes — a read is also what births them.
 */
import { useEffect, useState } from 'react';
import { GREAT } from '@es3/core';
import type { Cell, GameRepository, GreatPerson } from '@es3/core';
import '../hud/edge-card.css';

export function GreatBirth({ repository, owned }: { repository: GameRepository | null; owned: readonly Cell[] }) {
  const [born, setBorn] = useState<GreatPerson | null>(null);
  useEffect(() => {
    if (!repository) return;
    let live = true;
    void repository.great.view(Date.now()).then((v) => live && setBorn(v.unseen[0] ?? null));
    return () => {
      live = false;
    };
  }, [repository, owned]);

  if (!repository || !born) return null;
  const read = () => {
    void repository.great.markSeen(born.id).then(() => repository.great.view(Date.now()).then((v) => setBorn(v.unseen[0] ?? null)));
  };
  return (
    <button type="button" className="edge-card es-glass" onClick={read} aria-label={`Born · ${born.name} — dismiss`}>
      <span className="edge-card__text">
        <span className="edge-card__name">Born · {born.name}</span>
        <span className="edge-card__line">
          {GREAT[born.kind].title}. Their deed — {GREAT[born.kind].deedName} — waits in the Keep.
        </span>
        <span className="edge-card__hint">Tap to dismiss</span>
      </span>
    </button>
  );
}
