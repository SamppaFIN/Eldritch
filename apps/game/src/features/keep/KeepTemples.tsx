/**
 * The Keep's temple list (BRDC-KEEP-004).
 *
 * A temple far across the map used to be reachable only by walking to it — and the map
 * follows the player, so panning onto a distant temple is fiddly. This lists every temple
 * you hold under the Mana tab and lets you expand it from here. Reveal still happens by
 * dwelling; this is only the upkeep.
 */
import { useEffect, useState } from 'react';
import { MAX_TEMPLE_EXPANSION, expansionCost } from '@es3/core';
import type { ExpandRefusal, GameRepository, ResourcePool, RevealedPlace } from '@es3/core';
import { RitualButton } from '@es3/ui';

const REFUSAL: Readonly<Record<string, string>> = {
  'not-a-temple': 'That place is not a temple.',
  'at-max': 'This temple is already at its full strength.',
  'cannot-afford': 'Not enough stone and gold. Hold hills and markets to gather them.',
};

/** Just the temples, Anchor and plain ground filtered out. */
export function templeRows(places: readonly RevealedPlace[]): RevealedPlace[] {
  return places.filter((p) => p.kind === 'temple');
}

/** Whether the next expansion is out of reach — at max, or the pouch is too light. */
export function cannotExpand(expansion: number, pool: ResourcePool | null): boolean {
  if (expansion >= MAX_TEMPLE_EXPANSION) return true;
  const cost = expansionCost(expansion + 1);
  return !pool || pool.stone < (cost.stone ?? 0) || pool.gold < (cost.gold ?? 0);
}

export interface KeepTemplesProps {
  places: readonly RevealedPlace[];
  pool: ResourcePool | null;
  repository: GameRepository | null;
  now: number;
  onPouch: (pool: ResourcePool) => void;
}

export function KeepTemples({ places, pool, repository, now, onPouch }: KeepTemplesProps) {
  const [live, setLive] = useState(places);
  const [refusal, setRefusal] = useState<ExpandRefusal | 'not-a-temple' | null>(null);
  useEffect(() => setLive(places), [places]);

  const temples = templeRows(live);

  const expand = (h3: string) => {
    if (!repository) return;
    void repository.expandTemple(h3, now).then((r) => {
      if (!r.ok) {
        setRefusal(r.refused);
        return;
      }
      setRefusal(null);
      void repository.getResources(now).then(onPouch);
      void repository.getPlaces().then(setLive);
    });
  };

  if (temples.length === 0) {
    return (
      <p className="hearth-panel__line hearth-panel__tabbody">
        No temples yet — dwell an hour and a half in one cell to raise one.
      </p>
    );
  }

  return (
    <div className="hearth-panel__tabbody">
      {temples.map((t) => {
        const level = t.expansion ?? 0;
        const cost = expansionCost(level + 1);
        return (
          <div key={t.h3} className="hearth-panel__research-row">
            <span>
              Temple · rank {t.rank}
              <span className="hearth-panel__research-wait es-numeric">
                {' '}
                · {t.manaPerHour ?? 0} mana/h
              </span>
            </span>
            <RitualButton
              variant="ghost"
              disabled={cannotExpand(level, pool)}
              onClick={() => expand(t.h3)}
            >
              {level >= MAX_TEMPLE_EXPANSION ? 'At its height' : `${cost.stone} stone · ${cost.gold} gold`}
            </RitualButton>
          </div>
        );
      })}
      {refusal ? (
        <p className="hearth-panel__line hearth-panel__line--warn" role="status">
          {REFUSAL[refusal] ?? 'That did not work.'}
        </p>
      ) : null}
    </div>
  );
}
