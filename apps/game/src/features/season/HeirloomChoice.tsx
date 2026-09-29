/**
 * Choose one heirloom (BRDC-SEASON-006, Eldritch-season.pdf S7).
 *
 * Four small head starts; one crosses into the next season and is spent when the new
 * realm is founded. Changeable until then — the latest choice is the one kept.
 */
import { useEffect, useState } from 'react';
import { HEIRLOOMS, HEIRLOOM_IDS } from '@es3/core';
import type { GameRepository, HeirloomId } from '@es3/core';
import { RitualButton } from '@es3/ui';

export function HeirloomChoice({ repository, season }: { repository: GameRepository; season: number }) {
  const [chosen, setChosen] = useState<HeirloomId | null>(null);
  useEffect(() => {
    void repository.heirloom.chosen().then((c) => setChosen(c?.id ?? null));
  }, [repository]);

  const choose = (id: HeirloomId) => {
    void repository.heirloom.choose(id, season).then(() => setChosen(id));
  };

  return (
    <section aria-label="Heirloom" className="season-gate__heirlooms">
      <h3>Carry one thing across</h3>
      <p>You can change your mind until the next season opens.</p>
      {HEIRLOOM_IDS.map((id) => (
        <div key={id} className="season-gate__heirloom">
          <p>
            <strong>{HEIRLOOMS[id].name}</strong> — {HEIRLOOMS[id].text}
          </p>
          <RitualButton variant={chosen === id ? 'primary' : 'ghost'} onClick={() => choose(id)}>
            {chosen === id ? `✓ Keeping the ${HEIRLOOMS[id].name}` : `Keep the ${HEIRLOOMS[id].name}`}
          </RitualButton>
        </div>
      ))}
    </section>
  );
}
