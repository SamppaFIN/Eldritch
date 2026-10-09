/**
 * Last night's dream (BRDC-DREAM-001), as an edge card: tap to face it — a Will test on
 * the investigator's dice — then read how it ended and tap again to put it away. Like
 * every card it waits; nothing times it out.
 *
 * Re-read whenever your ground changes: the dream is drawn by the morning's first walk.
 */
import { useEffect, useState } from 'react';
import type { Cell, DreamView, GameRepository } from '@es3/core';
import { DreamEmblem } from '../hud/CardArt.js';
import '../hud/edge-card.css';

export function DreamCard({ repository, owned }: { repository: GameRepository | null; owned: readonly Cell[] }) {
  const [dream, setDream] = useState<DreamView | null>(null);
  const [ended, setEnded] = useState<{ pass: boolean; text: string } | null>(null);
  const [put, setPut] = useState(false);
  useEffect(() => {
    // Faced: the ending stays until it is read — a refresh of your ground would otherwise
    // re-read the dream, find it settled, and take the card away mid-sentence.
    if (!repository || put || ended) return;
    let live = true;
    void repository.dreams.waiting(Date.now()).then((d) => live && setDream(d && !d.outcome ? d : null));
    return () => {
      live = false;
    };
  }, [repository, owned, put, ended]);

  if (!repository || put || !dream) return null;
  const tap = () => {
    if (ended) return setPut(true);
    void repository.dreams.face(Date.now()).then((r) => r.ok && setEnded({ pass: r.pass, text: r.text }));
  };
  return (
    <button
      type="button"
      className="edge-card es-glass"
      onClick={tap}
      aria-label={ended ? `Dream · ${dream.card.title} — dismiss` : `Dream · ${dream.card.title} — face it`}
    >
      <span className="edge-card__sigil" aria-hidden>
        <DreamEmblem />
      </span>
      <span className="edge-card__text">
        <span className="edge-card__name">Dream · {dream.card.title}</span>
        <span className="edge-card__line" role={ended ? 'status' : undefined}>
          {ended ? `${ended.pass ? '✦' : '✕'} ${ended.text}` : dream.card.text}
        </span>
        <span className="edge-card__hint">{ended ? 'Tap to dismiss' : 'Tap to face it · Will test'}</span>
      </span>
    </button>
  );
}
