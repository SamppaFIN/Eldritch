/**
 * Which pages and buttons are open (BRDC-ONBOARD-005): read from the Keeper's Charter,
 * every surface at once with "Show everything" on. A surface that opens is said once —
 * `news` — and the ones already said are kept in `surfaces-seen`; the first read of a
 * realm records what is open without saying it, so a veteran is not told what they know.
 */
import { useCallback, useEffect, useState } from 'react';
import { load, saveNow } from '@es3/core';
import type { Cell, GameRepository, ResourcePool, Surface } from '@es3/core';

const KEY = 'surfaces-seen';

export interface SurfacesBinding {
  shown: (s: Surface) => boolean;
  /** The surface that just opened, until it is dismissed. */
  news: Surface | null;
  dismiss: () => void;
}

export function useSurfaces(
  repository: GameRepository | null,
  now: () => number,
  /** Re-read when the ground or the pouch moves — a claimed step pays into the pouch. */
  owned: readonly Cell[],
  pouch: ResourcePool | null,
  everything: boolean,
): SurfacesBinding {
  const [open, setOpen] = useState<readonly Surface[]>([]);
  const [queue, setQueue] = useState<Surface[]>([]);

  useEffect(() => {
    if (!repository || everything) return;
    // No cancelling: the newest read to finish is as good as any, and a read cancelled by
    // every change of `owned` while a realm boots never lands at all (see useUpNext).
    void repository.charter.surfaces(now()).then((next) => {
      setOpen(next);
      const seen = load<Surface[] | null>(KEY, null);
      if (seen === null) {
        saveNow(KEY, next);
        return;
      }
      const fresh = next.filter((s) => !seen.includes(s));
      if (fresh.length === 0) return;
      saveNow(KEY, [...seen, ...fresh]);
      setQueue((q) => [...q, ...fresh]);
    });
  }, [repository, now, owned, pouch, everything]);

  const shown = useCallback((s: Surface) => everything || open.includes(s), [everything, open]);
  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);
  return { shown, news: everything ? null : (queue[0] ?? null), dismiss };
}
