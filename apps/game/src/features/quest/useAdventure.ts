/**
 * The adventures a player can open from the Hearth, and the verbs for them (BRDC-QUEST-001).
 *
 * Mirrors `useAnomaly`: its own fetch, its own refusal state, one `binding` back. Every
 * verb changes the book, XP or the pouch, so each one refetches the list. The pouch and
 * XP readouts around it catch up on their own minute poll — an adventure step is rare and
 * never time-critical.
 */
import { useCallback, useEffect, useState } from 'react';
import type { AdventureView, GameRepository } from '@es3/core';

export interface AdventureBinding {
  list: readonly AdventureView[];
  active: AdventureView | null;
  refusal: string | null;
  onStart: (id: string) => void;
  onChoose: (choiceIndex: number) => void;
  onAbandon: (id: string) => void;
}

export function useAdventure(
  repository: GameRepository | null,
  now: number,
  /** Bumped as ground is claimed, so a locked choice unlocks the moment its gate is met. */
  version: number,
): AdventureBinding {
  const [list, setList] = useState<readonly AdventureView[]>([]);
  const [refusal, setRefusal] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (repository) setList(await repository.getAdventures(now));
  }, [repository, now]);

  useEffect(() => {
    void refetch();
  }, [refetch, version]);

  const run = useCallback(
    (act: () => Promise<{ ok: boolean; refused?: string } | void>) => {
      void (async () => {
        const r = await act();
        setRefusal(r && !r.ok ? (r.refused ?? 'refused') : null);
        await refetch();
      })();
    },
    [refetch],
  );

  const active = list.find((a) => a.state === 'active') ?? null;

  return {
    list,
    active,
    refusal,
    onStart: (id) => repository && run(() => repository.startAdventure(id, now)),
    onChoose: (i) =>
      repository && active && run(() => repository.chooseInAdventure(active.id, i, now)),
    onAbandon: (id) => repository && run(() => repository.abandonAdventure(id)),
  };
}
