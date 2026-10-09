/**
 * A creature on this hex (BRDC-MONSTER-001): what it is, and — standing here — a Vigor
 * test to stop it. Nothing on a hex it is not on, or where it is still under the fog.
 */
import { useCallback, useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import { MONSTER_NEED } from '@es3/core';
import type { CreatureView, GameRepository, H3Index } from '@es3/core';
import './keep.css';

const REFUSAL: Readonly<Record<string, string>> = {
  'not-there': 'Walk onto its hex to face it.',
  home: 'You were sent home. Rest twelve hours first.',
  'none-here': 'It has moved on.',
  'no-keep': 'This realm has no Keep yet.',
};

export function CellCreature({ repository, h3, here, now }: { repository: GameRepository | null; h3: H3Index; here: boolean; now: number }) {
  const [creature, setCreature] = useState<CreatureView | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (repository) setCreature((await repository.monsters.view(now)).find((c) => c.h3 === h3 && c.visible) ?? null);
  }, [repository, h3, now]);
  useEffect(() => {
    setSaid(null);
    void load();
  }, [load]);

  if (!repository || (!creature && !said)) return null;
  const face = () => {
    if (!creature || busy) return;
    setBusy(true);
    void repository.monsters.face(creature.gateId, here ? h3 : null, now).then(async (r) => {
      setSaid(r.ok ? r.said : (REFUSAL[r.refused] ?? 'That did not work.'));
      await load();
      setBusy(false);
    });
  };

  return (
    <section className="keep-citizens keep-gate" aria-label="Creature">
      {creature ? (
        <>
          <p className="hearth-panel__line">
            <strong>{creature.name}.</strong> It came out of a gate and walks on your Keep, a ring a day. Where it reaches your ground, the ground weakens.
          </p>
          <RitualButton variant="ghost" disabled={busy || !here} onClick={face}>
            {`Face it · Vigor test, need ${MONSTER_NEED} · costs 1 health`}
          </RitualButton>
          {!here ? <p className="hearth-panel__line">Walk onto its hex to face it.</p> : null}
        </>
      ) : null}
      {said ? (
        <p className="hearth-panel__line" role="status">
          {said}
        </p>
      ) : null}
    </section>
  );
}
