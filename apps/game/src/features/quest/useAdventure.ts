/**
 * The adventures a player can open from the Hearth, and the verbs for them (BRDC-QUEST-001).
 *
 * Mirrors `useAnomaly`: its own fetch, its own refusal state, one `binding` back. Every
 * verb changes the book, XP or the pouch, so each one refetches the list. The pouch and
 * XP readouts around it catch up on their own minute poll — an adventure step is rare and
 * never time-critical.
 *
 * `now` is the clock **function**, not a reading of it (BRDC-ECON-009). It used to be a
 * number, and the caller produced it by calling the clock during render — so every render
 * handed this hook a fresh millisecond, `refetch` was a new function, the effect ran
 * again, the fetch set new state, and that rendered. A self-feeding loop, and not a cheap
 * one: `getAdventures` settles the whole pouch and sweeps every owned cell, so it ran
 * about six full IndexedDB round-trips a second forever. Everything else that needed the
 * store — the HUD pouch, the build menu's "can I afford this" — queued behind it and
 * arrived seconds late, which is what "no button does anything" actually was.
 */
import { useCallback, useEffect, useState } from 'react';
import type { AdventureView, GameRepository } from '@es3/core';

export interface AdventureBinding {
  list: readonly AdventureView[];
  active: AdventureView | null;
  refusal: string | null;
  /** The title of an adventure that just reached its end, for one render (BRDC-FX-001). */
  justEnded: string | null;
  onStart: (id: string) => void;
  onChoose: (choiceIndex: number) => void;
  onAbandon: (id: string) => void;
}

export function useAdventure(
  repository: GameRepository | null,
  now: () => number,
  /** Bumped as ground is claimed, so a locked choice unlocks the moment its gate is met. */
  version: number,
): AdventureBinding {
  const [list, setList] = useState<readonly AdventureView[]>([]);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [justEnded, setJustEnded] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (repository) setList(await repository.getAdventures(now()));
  }, [repository, now]);

  useEffect(() => {
    void refetch();
  }, [refetch, version]);

  const active = list.find((a) => a.state === 'active') ?? null;

  const run = useCallback(
    (act: () => Promise<{ ok: boolean; refused?: string; ended?: boolean } | void>, endedTitle?: string) => {
      void (async () => {
        const r = await act();
        setRefusal(r && !r.ok ? (r.refused ?? 'refused') : null);
        setJustEnded(r && r.ok && r.ended && endedTitle ? endedTitle : null);
        await refetch();
      })();
    },
    [refetch],
  );

  return {
    list,
    active,
    refusal,
    justEnded,
    onStart: (id) => repository && run(() => repository.startAdventure(id, now())),
    onChoose: (i) =>
      repository &&
      active &&
      run(() => repository.chooseInAdventure(active.id, i, now()), active.title),
    onAbandon: (id) => repository && run(() => repository.abandonAdventure(id)),
  };
}
