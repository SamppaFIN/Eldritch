/**
 * A building page's data: which page the selected hex is, what it has learned, and the
 * research verb (BRDC-WORKS-001). Re-read whenever the hex, its holder or what stands on
 * it changes.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Cell, GameRepository, ResourcePool, WorksRefusal, WorksView } from '@es3/core';

export interface WorksPageBinding {
  view: WorksView | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  research: (nodeId: string) => void;
  refusal: WorksRefusal | 'no-work' | null;
}

export function useWorksPage(
  repository: GameRepository | null,
  cell: Cell | null,
  now: number,
  onPouch: ((pool: ResourcePool) => void) | undefined,
): WorksPageBinding {
  const [view, setView] = useState<WorksView | null>(null);
  const [open, setOpen] = useState(false);
  const [refusal, setRefusal] = useState<WorksRefusal | 'no-work' | null>(null);
  const h3 = cell?.h3 ?? null;
  const key = cell ? `${cell.h3}|${cell.ownerId}|${(cell.buildings ?? []).map((b) => b.id).join(',')}` : '';

  useEffect(() => setOpen(false), [h3]);
  useEffect(() => {
    setRefusal(null);
    if (!repository || !h3) {
      setView(null);
      return;
    }
    let alive = true;
    void repository.works.viewAt(h3, now).then((v) => alive && setView(v));
    return () => {
      alive = false;
    };
    // `now` is read on fire; the hex, its holder and its Works are the real triggers.
  }, [repository, key]);

  const research = useCallback(
    (nodeId: string) => {
      if (!repository || !h3) return;
      void repository.works.research(h3, nodeId, now).then(async (r) => {
        if (!r.ok) {
          setRefusal(r.refused);
          return;
        }
        setRefusal(null);
        setView(r.view);
        onPouch?.(await repository.getResources(now));
      });
    },
    [repository, h3, now, onPouch],
  );

  return { view, open, setOpen, research, refusal };
}
