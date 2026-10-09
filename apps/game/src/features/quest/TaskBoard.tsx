/**
 * The tasks pinned to the Tavern's board (BRDC-QUEST-009), under the tales in progress.
 *
 * Take one, walk, come back: an objective shows how far along it is and pays when done; a
 * skill test is faced right here, on the one dice pool. A finished task stays on the
 * board dimmed and sealed with its ending, as a finished tale does (BRDC-QUEST-008),
 * folded under "Done (n)" (BRDC-UX-008).
 */
import { useCallback, useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import { SKILL_NAME } from '@es3/core';
import type { CityStateId, GameRepository, TaskView } from '@es3/core';
import { rewardLine } from './AdventureDialog.js';
import './task-board.css';

const REFUSED: Readonly<Record<string, string>> = {
  'not-ready': 'Not done yet. Walk on.',
  home: 'Your investigator is home resting. Come back later.',
  'no-keep': 'This needs an investigator, and your realm has none yet.',
  'not-yours': 'That step is not open to you yet.',
};

function action(v: TaskView): string | null {
  if (v.state === 'open') return 'Take it';
  if (v.state === 'ready') return 'Claim the reward';
  if (v.state === 'taken' && v.task.objective.kind === 'check') return `Face it · ${SKILL_NAME[v.task.objective.skill]} test`;
  return null;
}

export interface TaskBoardProps {
  repository: GameRepository;
  /** The Tavern's, the investigator's own tale (BRDC-INVEST-002), or a village's (BRDC-SUZERAIN-001). */
  which?: 'board' | 'personal' | 'village';
  village?: CityStateId;
  /** A task was taken or finished — the village's standing re-reads. */
  onChanged?: () => void;
}

export function TaskBoard({ repository, which = 'board', village, onChanged }: TaskBoardProps) {
  const [views, setViews] = useState<TaskView[]>([]);
  const [said, setSaid] = useState<string | null>(null);
  const load = useCallback(async () => {
    const now = Date.now();
    setViews(await (which === 'personal' ? repository.tasks.personal(now) : which === 'village' && village ? repository.tasks.village(village, now) : repository.tasks.board(now)));
  }, [repository, which, village]);
  useEffect(() => {
    void load();
  }, [load]);

  const act = (v: TaskView) => {
    const run = v.state === 'open' ? repository.tasks.take(v.task.id, Date.now()) : repository.tasks.finish(v.task.id, Date.now());
    void run.then(async (r) => {
      setSaid(r.ok ? null : (REFUSED[r.refused] ?? 'That did not work.'));
      await load();
      onChanged?.();
    });
  };

  const row = (v: TaskView) => {
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
  };
  // What is finished stays on the board, folded under "Done (n)" — it used to sit there in
  // full for ever, above the work still to do (BRDC-UX-008).
  const done = views.filter((v) => v.state === 'completed' || v.state === 'failed');

  return (
    <ul className="task-board" aria-label={which === 'personal' ? 'Your tale' : which === 'village' ? 'Village tasks' : 'Tasks'}>
      {views.filter((v) => !done.includes(v)).map(row)}
      {done.length > 0 ? (
        <li>
          <details className="task-board__fold">
            <summary>Done ({done.length})</summary>
            <ul className="task-board">{done.map(row)}</ul>
          </details>
        </li>
      ) : null}
      {said ? (
        <li className="task-board__said" role="status">
          {said}
        </li>
      ) : null}
    </ul>
  );
}
