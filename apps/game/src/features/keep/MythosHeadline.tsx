/**
 * Today's Mythos headline (BRDC-MYTHOS-001): read once a day as an edge card, the way the
 * paper lands on the step — then it lives on in the Keep's Doom section.
 *
 * Reading the season here is also how the store learns the season's clock, which the
 * Mythos effects (yields, dice) need; with no season there is no card and no effect.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, MythosToday } from '@es3/core';
import { seasonOnce } from '../../data/season.js';
import '../hud/edge-card.css';

export function MythosHeadline({ repository }: { repository: GameRepository | null }) {
  const [today, setToday] = useState<MythosToday | null>(null);
  useEffect(() => {
    if (!repository) return;
    void (async () => {
      const season = await seasonOnce();
      if (season) await repository.mythos.remember(season);
      const t = await repository.mythos.today(Date.now());
      if (t && !t.seen) setToday(t);
    })();
  }, [repository]);

  if (!today || !repository) return null;
  const read = () => {
    void repository.mythos.markSeen(Date.now());
    setToday(null);
  };
  return (
    <button type="button" className="edge-card es-glass" onClick={read} aria-label={`Mythos · ${today.card.headline} — dismiss`}>
      <span className="edge-card__text">
        <span className="edge-card__name">Mythos · {today.card.headline}</span>
        <span className="edge-card__line">{today.card.rule}</span>
        <span className="edge-card__hint">Tap to dismiss</span>
      </span>
    </button>
  );
}
