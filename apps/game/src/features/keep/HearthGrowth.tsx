/**
 * Growing the Hearth with food (BRDC-HEARTH-003).
 *
 * Civilization's border, moved by paying for it: one ring of free ground per press, dearer
 * every time. The price is shown before the press and never a surprise after it — the
 * hexes a rival or the player already holds are left alone and not charged for, and the
 * line under the button says how many of each there were.
 */
import { useEffect, useState } from 'react';
import {
  HEARTH_MAX_RING,
  HEARTH_FOOD_PER_HEX,
} from '@es3/core';
import type { GameRepository, ResourcePool } from '@es3/core';
import { RitualButton } from '@es3/ui';

export interface HearthGrowthProps {
  repository: GameRepository | null;
  resources: ResourcePool | null;
  now: number;
  onPouch: (pool: ResourcePool) => void;
  /** The map redraws — new ground has appeared. */
  onGrown: () => void;
}

const REFUSAL: Record<string, string> = {
  'cannot-afford': 'Not enough food yet.',
  'at-limit': 'The Hearth reaches as far as it can.',
  'no-hearth': 'Raise a Hearth first.',
};

export function HearthGrowth({ repository, resources, now, onPouch, onGrown }: HearthGrowthProps) {
  const [ring, setRing] = useState<number | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (repository) void repository.hearthRing().then(setRing);
  }, [repository]);

  if (ring === null) return null;
  const atLimit = ring >= HEARTH_MAX_RING;
  const cost = HEARTH_FOOD_PER_HEX;
  const affordable = (resources?.food ?? 0) >= cost;

  const grow = () => {
    if (!repository || busy) return;
    setBusy(true);
    void (async () => {
      const r = await repository.growHearth(now);
      if (r.ok) {
        setRing(r.ring);
        setSaid(
          r.left > 0
            ? `${r.claimed} ${r.claimed === 1 ? 'hex' : 'hexes'} taken. ${r.left} more to reach ring ${r.ring + 1}.`
            : `The border moves out to ring ${r.ring}.`,
        );
        onPouch(await repository.getResources(now));
        onGrown();
      } else {
        setSaid(REFUSAL[r.refused] ?? 'That did not work.');
      }
      setBusy(false);
    })();
  };

  return (
    <section className="hearth-panel__growth" aria-label="Grow the Hearth">
      <p className="hearth-panel__line es-numeric">
        Hearth reach {ring} of {HEARTH_MAX_RING}
      </p>
      {atLimit ? (
        <p className="hearth-panel__line">Its border cannot be pushed any further.</p>
      ) : (
        <RitualButton variant="ghost" disabled={busy || !affordable} onClick={grow}>
          {`Grow the Hearth · ${cost} food a hex`}
        </RitualButton>
      )}
      {said ? (
        <p className="hearth-panel__line" role="status">
          {said}
        </p>
      ) : null}
    </section>
  );
}
