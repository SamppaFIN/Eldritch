/**
 * The Doom track and today's Mythos card (BRDC-DOOM-001, Eldritch-season.pdf S1).
 *
 * Read from the shared season (`GET /season`); nothing renders before a season is opened
 * on the Worker, which is every Season 1 day. The Doom is shared by everyone, so this is
 * the one Keep section that is not about your own realm.
 */
import { useEffect, useState } from 'react';
import { DOOM_MAX, DOOM_WARN_FROM, mythosFor } from '@es3/core';
import type { Season } from '@es3/core';
import { fetchSeason } from '../../data/season.js';
import './keep.css';

export function KeepDoom({ now }: { now: number }) {
  const [season, setSeason] = useState<Season | null>(null);

  useEffect(() => {
    void fetchSeason().then(setSeason);
  }, []);

  if (!season || season.phase !== 'open') return null;
  const card = mythosFor(season, now);
  const warn = season.doom >= DOOM_WARN_FROM;

  return (
    <>
      <h3 className="hearth-panel__section">The Doom track</h3>
      <section className="keep-citizens" aria-label="The Doom track">
        <p className="hearth-panel__line es-numeric" role={warn ? 'alert' : undefined}>
          {season.name} · Doom {season.doom} / {DOOM_MAX}
          {warn ? ` — ${DOOM_MAX - season.doom} steps from waking. Seal the gates.` : ''}
        </p>
        <progress className="keep-doom__track" max={DOOM_MAX} value={season.doom} aria-label="Doom" />
        <p className="hearth-panel__line">
          <strong>Mythos · {card.headline}.</strong> {card.rule}
          {card.waits ? ' (Not yet in the game.)' : ''}
        </p>
      </section>
    </>
  );
}
