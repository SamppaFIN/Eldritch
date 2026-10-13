/**
 * The walking sheet's "up next" strip (BRDC-NEXT-001): reads the views that already exist —
 * the Lore and the wisdom rate, the Keep's granary, the Tavern's tasks, the season's
 * ambition — and lets `rankUpNext` pick the three that finish first. No state of its own.
 * The Keeper's Charter's current step always leads (BRDC-ONBOARD-001): it is the one thing
 * the game asks of you, so it is not ranked against the clocks.
 */
import { useEffect, useState } from 'react';
import { hoursToAfford, rankUpNext } from '@es3/core';
import type { Cell, GameRepository, UpNextItem } from '@es3/core';

export interface UpNextRow {
  item: UpNextItem;
  /** Where a tap goes; absent when there is nowhere better than here. */
  open?: (() => void) | undefined;
}

export interface UpNextTargets {
  research?: (() => void) | undefined;
  keep?: (() => void) | undefined;
}

export function useUpNext(
  repository: GameRepository | null,
  now: () => number,
  /** Re-read whenever your ground changes — that is when any of these move. */
  owned: readonly Cell[],
  to: UpNextTargets,
): UpNextRow[] {
  // Which target a row goes to, not the function: the targets change as the realm boots.
  const [rows, setRows] = useState<{ item: UpNextItem; to: keyof UpNextTargets | undefined }[]>([]);
  useEffect(() => {
    if (!repository) return;
    let live = true;
    void (async () => {
      const t = now();
      const [lore, forecast, keep, tasks, ambition, charter] = await Promise.all([
        repository.lore.view(t),
        repository.getForecast(t),
        repository.keep.view(t),
        repository.tasks.board(t),
        repository.ambition.view(t),
        repository.charter.view(t),
      ]);
      const items: UpNextItem[] = [];
      const target: Record<string, keyof UpNextTargets> = {};
      const next = lore?.techs.filter((r) => r.state === 'available').sort((a, b) => a.cost - b.cost)[0];
      const h = next ? hoursToAfford(next.cost, lore?.wisdom ?? 0, forecast.perHour.wisdom ?? 0) : null;
      if (next && h !== null) {
        items.push({ id: 'lore', label: `Learn ${next.name}`, hours: h });
        target.lore = 'research';
      }
      if (keep?.hoursToNext != null) {
        items.push({ id: 'citizen', label: 'Next citizen', hours: keep.hoursToNext });
        target.citizen = 'keep';
      }
      if (keep?.storesLeftH != null && keep.storesLeftH <= 12) {
        items.push({ id: 'stores', label: 'Stores run out', hours: keep.storesLeftH });
        target.stores = 'keep';
      }
      for (const v of tasks) {
        if (v.state === 'ready') items.push({ id: `task:${v.task.id}`, label: `Claim ${v.task.title}`, hours: 0 });
        else if (v.state === 'taken' && v.task.objective.kind !== 'check') items.push({ id: `task:${v.task.id}`, label: v.task.title, have: v.progress.have, need: v.progress.need });
      }
      if (ambition.chosen && ambition.progress && !ambition.met) {
        items.push({ id: 'ambition', label: ambition.chosen.title, have: ambition.progress.have, need: ambition.progress.need });
        target.ambition = 'keep';
      }
      // The Charter's step (BRDC-ONBOARD-001): its count only when there is one to count.
      const first: UpNextItem[] = !charter ? []
        : charter.ready ? [{ id: 'charter', label: `${charter.short} — claim` }]
        : [{ id: 'charter', label: charter.short, ...(charter.need > 1 ? { have: charter.have, need: charter.need } : {}) }];
      target.charter = 'keep';
      if (live) setRows([...first, ...rankUpNext(items, 3 - first.length)].map((item) => ({ item, to: target[item.id] })));
    })();
    return () => {
      live = false;
    };
  }, [repository, now, owned]);
  return rows.map((r) => ({ item: r.item, open: r.to ? to[r.to] : undefined }));
}
