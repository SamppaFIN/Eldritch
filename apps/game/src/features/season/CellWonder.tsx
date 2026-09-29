/**
 * A wonder's action on its hex (BRDC-SEASON-008).
 *
 * The wonder stands where this realm found it; whoever holds that hex may use its action
 * once a day. Nothing on a hex without one.
 */
import { useEffect, useState } from 'react';
import { WONDERS } from '@es3/core';
import type { GameRepository, H3Index, WonderHere } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { seasonOnce } from '../../data/season.js';
import '../keep/keep.css';

const REFUSAL: Record<string, string> = {
  'not-yours': 'Hold this hex to use its wonder.',
  resting: 'It rests until tomorrow.',
  'not-now': 'The stones are silent until the Reckoning.',
  'nothing-to-do': 'No gate is open to seal.',
  'none-here': 'No wonder stands here.',
};

export function CellWonder({ repository, h3, mine, now }: { repository: GameRepository | null; h3: H3Index; mine: boolean; now: number }) {
  const [here, setHere] = useState<WonderHere | null>(null);
  const [said, setSaid] = useState<string | null>(null);

  useEffect(() => {
    setSaid(null);
    if (repository) void repository.wonderActs.at(h3, now).then(setHere);
  }, [repository, h3, now]);

  if (!repository || !here) return null;

  const use = () => {
    void (async () => {
      const reckoning = (await seasonOnce())?.phase === 'reckoning';
      const r = await repository.wonderActs.use(h3, Date.now(), reckoning);
      setSaid(r.ok ? r.said : (REFUSAL[r.refused] ?? 'That did not work.'));
      setHere(await repository.wonderActs.at(h3, Date.now()));
    })();
  };

  return (
    <section className="keep-citizens" aria-label="Wonder">
      <p className="hearth-panel__line">
        <strong>{WONDERS[here.id].name} · {here.act.name}.</strong> {here.act.text}
      </p>
      <RitualButton variant="ghost" disabled={!mine || here.readyAt !== null} onClick={use}>
        {here.readyAt !== null ? 'Resting until tomorrow' : mine ? `Use · ${here.act.name}` : 'Hold this hex to use it'}
      </RitualButton>
      {said ? (
        <p className="hearth-panel__line" role="status">
          {said}
        </p>
      ) : null}
    </section>
  );
}
