/**
 * The tasks pinned to the Tavern's board (BRDC-QUEST-009), under the tales in progress.
 *
 * Take one, walk, come back: an objective shows how far along it is and pays when done; a
 * skill test is faced right here, on the one dice pool. A finished task stays on the
 * board dimmed and sealed with its ending, as a finished tale does (BRDC-QUEST-008).
 */
import { useCallback, useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import { SKILL_NAME } from '@es3/core';
import type { GameRepository, TaskView } from '@es3/core';
import { rewardLine } from './AdventureDialog.js';
import './task-board.css';

const REFUSED: Readonly<Record<string, string>> = {
  'not-ready': 'Not done yet. Walk on.',
  home: 'Your investigator is home resting. Come back later.',
  'no-keep': 'This needs an investigator, and your realm has none yet.',
};

function action(v: TaskView): string | null {
  if (v.state === 'open') return 'Take it';
  if (v.state === 'ready') return 'Claim the reward';
  if (v.state === 'taken' && v.task.objective.kind === 'check') return `Face it · ${SKILL_NAME[v.task.objective.skill]} test`;
  return null;
}

export function TaskBoard({ repository }: { repository: GameRepository }) {
  const [views, setViews] = useState<TaskView[]>([]);
  const [said, setSaid] = useState<string | null>(null);
  const load = useCallback(async () => setViews(await repository.tasks.board(Date.now())), [repository]);
  useEffect(() => {
    void load();
  }, [load]);

  const act = (v: TaskView) => {
    const run = v.state === 'open' ? repository.tasks.take(v.task.id, Date.now()) : repository.tasks.finish(v.task.id, Date.now());
    void run.then(async (r) => {
      setSaid(r.ok ? null : (REFUSED[r.refused] ?? 'That did not work.'));
      await load();
    });
  };

  return (
    <ul className="task-board" aria-label="Tasks">
      {views.map((v) => {
        const closed = v.state === 'completed' || v.state === 'failed';
        const label = action(v);
        return (
          <li key={v.task.id} className={`task-board__task${closed ? ' task-board__task--closed' : ''}`}>
            <p className="task-board__title">{v.task.title}</p>
            <p className="task-board__giver">{v.task.giver}</p>
            {closed && v.outcome ? (
              <p className="task-board__done">
                <span className="adventure__seal" aria-hidden>{v.state === 'completed' ? '✦' : '✕'}</span>
                <span className="adventure__outcome">{v.outcome.text}</span>
                <span className="adventure__rewards">{v.state === 'completed' ? rewardLine(v.outcome.rewards) : 'Failed'}</span>
              </p>
            ) : (
              <>
                <p className="task-board__text">{v.task.text}</p>
                <p className="task-board__facts es-numeric">
                  {v.state !== 'open' && v.task.objective.kind !== 'check' ? `${v.progress.have} / ${v.progress.need} · ` : ''}
                  {rewardLine(v.task.reward)}
                </p>
                {label ? (
                  <RitualButton variant={v.state === 'ready' ? 'primary' : 'ghost'} onClick={() => act(v)}>
                    {label}
                  </RitualButton>
                ) : null}
              </>
            )}
          </li>
        );
      })}
      {said ? (
        <li className="task-board__said" role="status">
          {said}
        </li>
      ) : null}
    </ul>
  );
}
