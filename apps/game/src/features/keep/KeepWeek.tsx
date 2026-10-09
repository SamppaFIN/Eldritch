/**
 * This week's age in the Keep (BRDC-AGE-001): golden or dark, what it does, and a golden
 * week's boon — chosen once, so choosing asks twice. An ordinary week says nothing.
 */
import { useCallback, useEffect, useState } from 'react';
import { ChoiceList } from './ChoiceList.js';
import type { BoonId, GameRepository, WeekView } from '@es3/core';
import './keep.css';

const said = (p: Partial<Record<string, number>>) =>
  Object.entries(p)
    .map(([k, v]) => `+${v} ${k}`)
    .join(', ');

export function KeepWeek({ repository, now }: { repository: GameRepository | null; now: number }) {
  const [week, setWeek] = useState<WeekView | null>(null);
  const load = useCallback(async () => {
    if (repository) setWeek(await repository.week.view(now));
  }, [repository, now]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!repository || !week || week.kind === 'plain') return null;
  const choose = (id: BoonId) => void repository.week.chooseBoon(id, now).then(load);

  return (
    <>
      <h3 className="hearth-panel__section">{week.name}</h3>
      <section className="keep-citizens" aria-label="This week">
        {week.kind === 'golden' ? (
          <p className="hearth-panel__line">Last week outpaced the one before. Everything you make comes a tenth faster until Monday.</p>
        ) : (
          <p className="hearth-panel__line">Last week fell far behind. Everything comes a tenth slower until Monday — but the next golden week needs only to match the last.</p>
        )}
        {week.boon ? <p className="hearth-panel__line">The week’s boon · {week.boon.name}</p> : null}
        {week.choices.length > 0 ? (
          <ChoiceList
            legend="The week’s boon — one, until Monday"
            choices={week.choices.map((b) => ({ id: b.id, name: b.name, detail: `${said(b.perHour)}/h` }))}
            confirm={(b) => `Take ${b.name} for the week`}
            onConfirm={choose}
          />
        ) : null}
      </section>
    </>
  );
}
