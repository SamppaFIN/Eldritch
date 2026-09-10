/**
 * The quay, if the selected hex is one (BRDC-DIPLO-001).
 *
 * Its own hook rather than more lines in `useSelection`, which is at its ceiling. The
 * shape is `useAnomaly`'s: one fetch on selection, its own refusal state, one binding out.
 *
 * `now` is the clock **function**, never a reading of it — a fresh millisecond per render
 * is what turned `useAdventure` into a loop that saturated the store (BRDC-ECON-009).
 */
import { useCallback, useEffect, useState } from 'react';
import { cellAt, cityStateOf, stepsToDoor } from '@es3/core';
import type { Cell, CityState, GameRepository, H3Index, ResourceKind, TradeRefusal } from '@es3/core';

export interface CityBinding {
  /** The city state whose quay this hex is — the panel that trades. */
  city: CityState | null;
  /** The village this hex belongs to when it is *not* the quay, and how far the quay is. */
  village: { city: CityState; steps: number } | null;
  refusal: TradeRefusal | null;
  onTrade: (give: ResourceKind, want: ResourceKind) => void;
}

export function useDiplomacy(
  repository: GameRepository | null,
  selected: H3Index | null,
  /** The cell in hand, so a village hex can point at its own quay without a second read. */
  cell: Cell | null,
  now: () => number,
  /** Re-read the pouch and the map after a trade — trading is a spend. */
  afterSpend: () => Promise<void>,
): CityBinding {
  const [city, setCity] = useState<CityState | null>(null);
  const [refusal, setRefusal] = useState<TradeRefusal | null>(null);

  useEffect(() => {
    setRefusal(null);
    if (!repository || !selected) {
      setCity(null);
      return;
    }
    let alive = true;
    void repository.cityAt(selected).then((c) => {
      if (alive) setCity(c);
    });
    return () => {
      alive = false;
    };
  }, [repository, selected]);

  const onTrade = useCallback(
    (give: ResourceKind, want: ResourceKind) => {
      if (!repository || !selected) return;
      void (async () => {
        const r = await repository.trade(selected, give, want, now());
        setRefusal(r.ok ? null : r.refused);
        if (r.ok) await afterSpend();
      })();
    },
    [repository, selected, now, afterSpend],
  );

  /*
   * A village is nineteen hexes and its quay is one of them. Without this the door is a
   * hunt — the same shape as every other "the content is there and the screen does not
   * show the way to it" bug this week.
   */
  const owner = cell?.ownerId ?? null;
  const belongs = !city && owner ? cityStateOf(owner) : undefined;
  const village =
    belongs && selected
      ? { city: belongs, steps: stepsToDoor(selected, cellAt(belongs.door)) }
      : null;

  return { city, village, refusal, onTrade };
}
