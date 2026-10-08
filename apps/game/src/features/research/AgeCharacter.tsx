/**
 * Who the realm became at each Age (BRDC-ERA-001): entering a new Age, choose one of three
 * characters — once, so choosing asks twice. The chain stands above the Lore after that.
 */
import { useCallback, useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import type { EraDef, EraId, EraView, GameRepository, ResourcePool } from '@es3/core';
import './lore.css';

const said = (p: Partial<ResourcePool>) =>
  Object.entries(p)
    .map(([k, v]) => `+${v} ${k === 'wood' ? 'timber' : k}`)
    .join(', ');

export function AgeCharacter({ repository, read }: { repository: GameRepository; /** Re-read when the Lore changes. */ read: unknown }) {
  const [view, setView] = useState<EraView | null>(null);
  const [armed, setArmed] = useState<EraId | null>(null);
  const load = useCallback(async () => setView(await repository.eras.view(Date.now())), [repository]);
  useEffect(() => {
    void load();
  }, [load, read]);

  if (!view || (!view.pending && view.chosen.length === 0)) return null;
  const choose = (e: EraDef) => {
    if (armed !== e.id) return setArmed(e.id);
    setArmed(null);
    void repository.eras.choose(e.id, Date.now()).then(load);
  };

  return (
    <section className="lore__block" aria-label="Who the realm became">
      {view.chosen.length > 0 ? <p className="lore__hint">Ages · {view.chosen.map((e) => e.name).join(' → ')}</p> : null}
      {view.pending ? (
        <>
          <h3 className="lore__block-title">A new Age. Who has the realm become?</h3>
          <p className="lore__hint">Chosen once, kept every hour of the season.</p>
          {view.choices.map((e) => (
            <RitualButton key={e.id} variant={armed === e.id ? 'primary' : 'ghost'} onClick={() => choose(e)}>
              {armed === e.id ? `Become ${e.name} — for good` : `${e.name} · ${said(e.perHour)}/h`}
            </RitualButton>
          ))}
        </>
      ) : null}
    </section>
  );
}
