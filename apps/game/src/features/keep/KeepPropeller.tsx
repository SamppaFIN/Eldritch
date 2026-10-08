/**
 * The propeller in hand (BRDC-AERODROME-001): the Skyward Runway's end leaves a gate to
 * seal from afar. Spent once, so it asks twice; it keeps when no gate stands open.
 */
import { useCallback, useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import type { GameRepository } from '@es3/core';
import './keep.css';

export function KeepPropeller({ repository, now, onSealed }: { repository: GameRepository; now: number; onSealed: () => void }) {
  const [charges, setCharges] = useState(0);
  const [armed, setArmed] = useState(false);
  const [said, setSaid] = useState<string | null>(null);
  const load = useCallback(async () => setCharges(await repository.propeller.charges()), [repository]);
  useEffect(() => {
    void load();
  }, [load]);

  if (charges <= 0 && !said) return null;
  const use = () => {
    if (!armed) return setArmed(true);
    setArmed(false);
    void repository.propeller.use(now).then(async (r) => {
      setSaid(r.ok ? 'The propeller turns once in your hand. Far off, a gate shuts.' : r.refused === 'nothing-to-do' ? 'No gate stands open. The propeller keeps.' : 'The propeller is still.');
      await load();
      if (r.ok) onSealed();
    });
  };

  return (
    <div className="keep-citizens" aria-label="The propeller">
      {charges > 0 ? (
        <RitualButton variant={armed ? 'primary' : 'ghost'} onClick={use}>
          {armed ? 'Turn it — the nearest gate is sealed' : `The propeller · seal a gate from afar (${charges})`}
        </RitualButton>
      ) : null}
      {said ? (
        <p className="hearth-panel__line" role="status">
          {said}
        </p>
      ) : null}
    </div>
  );
}
