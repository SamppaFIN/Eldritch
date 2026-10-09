/**
 * A village's own tasks and who leads it (BRDC-SUZERAIN-001), at its quay under the trade
 * post. Each finished task sends envoys; the most envoys, at least three, makes you its
 * suzerain — the village's speciality is yours every hour.
 */
import { useEffect, useState } from 'react';
import { SUZERAIN_BONUS } from '@es3/core';
import type { CityState, GameRepository, VillageStanding } from '@es3/core';
import { TaskBoard } from '../quest/TaskBoard.js';
import { fetchEnvoys, postEnvoys } from '../../data/envoySource.js';

const bonusLine = (city: CityState) =>
  Object.entries(SUZERAIN_BONUS[city.id] ?? {})
    .map(([k, v]) => `+${v} ${k}`)
    .join(', ');

export function VillageFavour({ repository, city }: { repository: GameRepository; city: CityState }) {
  const [standing, setStanding] = useState<VillageStanding | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    void (async () => {
      const profile = await repository.getProfile();
      await postEnvoys(profile.id, profile.name, await repository.suzerain.envoys());
      const s = await repository.suzerain.standing(city.id, profile.id, await fetchEnvoys());
      if (live) setStanding(s);
    })();
    return () => {
      live = false;
    };
  }, [repository, city.id, tick]);

  return (
    <section className="cell-panel__place" aria-label={`${city.name}'s favour`}>
      <p className="cell-panel__place-name">Their tasks</p>
      {standing ? (
        <p className="cell-panel__note" role="status">
          {standing.leader === 'you'
            ? `You are their suzerain: ${bonusLine(city)} an hour.`
            : standing.leader
              ? `${standing.leader} is their suzerain.`
              : `Nobody leads them yet. ${standing.need} envoys and the most of anyone does.`}{' '}
          Your envoys: <span className="es-numeric">{standing.mine}</span>.
        </p>
      ) : null}
      {/* The village's tasks, one tap away: trade and envoys first on the quay (BRDC-UX-008). */}
      <details className="task-board__fold">
        <summary>Village tasks</summary>
        <TaskBoard repository={repository} which="village" village={city.id} onChanged={() => setTick((t) => t + 1)} />
      </details>
    </section>
  );
}
