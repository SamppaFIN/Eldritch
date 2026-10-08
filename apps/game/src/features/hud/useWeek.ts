/**
 * This week's golden or dark age (BRDC-AGE-001), read for the walking sheet. Reading it
 * is what turns a new week over, so the first look on Monday decides it.
 */
import { useEffect, useState } from 'react';
import type { Cell, GameRepository, WeekView } from '@es3/core';

export function useWeek(repository: GameRepository | null, now: () => number, owned: readonly Cell[]): WeekView | null {
  const [week, setWeek] = useState<WeekView | null>(null);
  useEffect(() => {
    if (!repository) return;
    let live = true;
    void repository.week.view(now()).then((w) => live && setWeek(w));
    return () => {
      live = false;
    };
  }, [repository, now, owned]);
  return week;
}
