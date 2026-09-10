/**
 * Running Rites, and casting one (BRDC-SPELL-001).
 *
 * Split out of `useSelection`, which reached its four hundred lines when the quay arrived
 * (BRDC-DIPLO-001). The seam matches the panel: `SpellPanel.tsx` has been its own file
 * since SPELL-001, and this is the state behind it.
 *
 * `now` is the clock function, never a reading of it — see BRDC-ECON-009.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ActiveSpell, CastRefusal, GameRepository, H3Index, SpellId, TechId } from '@es3/core';

export interface SpellBinding {
  active: readonly ActiveSpell[];
  refusal: CastRefusal | null;
  onCast: (id: SpellId, target: H3Index | null) => void;
  /** What is researched — a rite whose tech is missing is shown locked, not castable. */
  researched: readonly TechId[];
}

export function useSpells(
  repository: GameRepository | null,
  now: () => number,
  /** Bumped as the trail grows, so a countdown stays honest. */
  trailVersion: number,
  /** The open cell — a refusal about the last one has nothing to say about this one. */
  selected: H3Index | null,
  researched: readonly TechId[],
  afterSpend: () => Promise<void>,
): SpellBinding {
  const [active, setActive] = useState<readonly ActiveSpell[]>([]);
  const [refusal, setRefusal] = useState<CastRefusal | null>(null);

  useEffect(() => setRefusal(null), [selected]);

  useEffect(() => {
    if (!repository) return;
    let alive = true;
    // Re-read as the trail grows so an expired spell drops from the panel on its own.
    void repository.getActiveSpells(now()).then((s) => {
      if (alive) setActive(s);
    });
    return () => {
      alive = false;
    };
  }, [repository, now, trailVersion]);

  const onCast = useCallback(
    (id: SpellId, target: H3Index | null) => {
      if (!repository) return;
      void (async () => {
        const r = await repository.castSpell(id, target, now());
        setRefusal(r.ok ? null : r.refused);
        if (r.ok) {
          setActive(await repository.getActiveSpells(now()));
          await afterSpend();
        }
      })();
    },
    [repository, now, afterSpend],
  );

  return { active, refusal, onCast, researched };
}
