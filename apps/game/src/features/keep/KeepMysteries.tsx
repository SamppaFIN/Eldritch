/**
 * The season's three mysteries in the Keep (BRDC-MYSTERY-001): how far the town has got —
 * its clues and its sealed gates, the two roads — and every chapter solved, read by all.
 * This realm's own clues are sent first; off-line, the last state heard is shown.
 */
import { useEffect, useState } from 'react';
import { MYSTERIES, MYSTERY_HP_CUT, mysteryProgress } from '@es3/core';
import type { GameRepository } from '@es3/core';
import { fetchSeason, postClues } from '../../data/season.js';
import './keep.css';

export function KeepMysteries({ repository, now }: { repository: GameRepository | null; now: number }) {
  const [counts, setCounts] = useState<{ clues: number; seals: number; live: boolean } | null>(null);
  useEffect(() => {
    if (!repository) return;
    let live = true;
    void (async () => {
      const realm = (await repository.getProfile()).id;
      const gathered = (await repository.investigator.view(now))?.cluesGathered ?? 0;
      if (gathered > 0) await postClues(realm, gathered);
      const season = await fetchSeason();
      if (season && (season.phase === 'open' || season.phase === 'reckoning')) {
        await repository.mythos.remember(season);
        if (live) setCounts({ clues: season.cluesGathered ?? 0, seals: season.sealedGates ?? 0, live: true });
        return;
      }
      const known = await repository.mythos.known();
      if (live && known) setCounts({ clues: known.cluesGathered, seals: known.sealedGates, live: false });
    })();
    return () => {
      live = false;
    };
    // Once per opening of the Keep, as the gates do: the Worker is shared.
  }, [repository]);

  if (!counts) return null;
  const p = mysteryProgress(counts.clues, counts.seals);
  const next = MYSTERIES[p.solved];
  return (
    <>
      <h3 className="hearth-panel__section">The town’s mysteries</h3>
      <section className="keep-citizens" aria-label="The town’s mysteries">
        {MYSTERIES.slice(0, p.solved).map((m) => (
          <p key={m.title} className="hearth-panel__line">
            <strong>✦ {m.title}.</strong> <em>{m.chapter}</em>
          </p>
        ))}
        {next ? (
          <p className="hearth-panel__line">
            <strong>{next.title}</strong> — the town has{' '}
            <span className="es-numeric">{p.clues} / {p.needClues}</span> clues and{' '}
            <span className="es-numeric">{p.seals} / {p.needSeals}</span> gates sealed. Either road solves it.
          </p>
        ) : (
          <p className="hearth-panel__line">All three are solved.</p>
        )}
        {p.solved > 0 ? (
          <p className="hearth-panel__line">The Ancient One will wake {Math.round(MYSTERY_HP_CUT * 100 * p.solved)}% weaker.</p>
        ) : null}
        {!counts.live ? <p className="hearth-panel__line">As last heard — the town cannot be reached just now.</p> : null}
      </section>
    </>
  );
}
