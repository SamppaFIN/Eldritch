/**
 * Open gates, nearest first (BRDC-DOOM-002, Eldritch-season.pdf S1).
 *
 * Opening the Keep is also when the gates catch up: the dawns since the last look draw
 * their gates, the Horrors bite, and whatever moved the shared Doom is sent to the Worker
 * (and kept for later if the Worker cannot be reached). Nothing on a Season 1 save.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, GateView } from '@es3/core';
import { fetchSeason, postDoom } from '../../data/season.js';
import './keep.css';

export interface KeepGatesProps {
  repository: GameRepository | null;
  now: number;
}

const hoursLeft = (openedAt: number, now: number) => Math.max(0, Math.ceil((openedAt + 48 * 3_600_000 - now) / 3_600_000));

export function KeepGates({ repository, now }: KeepGatesProps) {
  const [view, setView] = useState<GateView | null>(null);

  useEffect(() => {
    if (!repository) return;
    void (async () => {
      const season = await fetchSeason();
      const realm = (await repository.getProfile()).id;
      if (season?.phase === 'open') await repository.gates.sync(season, realm, now);
      const sent = await postDoom(await repository.gates.outbox());
      if (sent.length > 0) await repository.gates.delivered(sent);
      setView(await repository.gates.view(now));
    })();
    // Once per opening of the Keep, not every minute: the Worker is shared and was once
    // overloaded by a busy refresh (2026-09). `now` is read on fire.
  }, [repository]);

  if (!view) return null;
  const inv = view.investigator;

  return (
    <>
      <h3 className="hearth-panel__section">Open gates</h3>
      <section className="keep-citizens" aria-label="Open gates">
        <p className="hearth-panel__line es-numeric">
          Stamina {inv.stamina} · Sanity {inv.sanity} · Clues {inv.clues} / 8{inv.home ? ' · sent home to rest' : ''}
        </p>
        {view.gates.length === 0 ? (
          <p className="hearth-panel__line">No gate is open near your realm.</p>
        ) : (
          <ul className="keep-masterwork__needs">
            {view.gates.map((g) => (
              <li key={g.id} className="es-numeric">
                {g.rings === 0 ? 'Inside your border' : `${g.rings} ${g.rings === 1 ? 'ring' : 'rings'} out`} ·{' '}
                {hoursLeft(g.openedAt, now) > 0 ? `${hoursLeft(g.openedAt, now)} h before the Doom rises` : 'the Doom has risen for it'}
              </li>
            ))}
          </ul>
        )}
        {view.gates.length > 0 ? (
          <p className="hearth-panel__line">Walk to a gate and open its hex to face it. Every gate left open drains your sanity.</p>
        ) : null}
      </section>
    </>
  );
}
