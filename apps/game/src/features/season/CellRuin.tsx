/**
 * The ruins of a Fortress on this hex (BRDC-SEASON-007).
 *
 * The last season's Fortresses are this season's ruins. Standing on one, search it once:
 * what it gives is a surprise, fixed per ruin and season. Nothing where no Fortress stood.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, H3Index } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { ruinsOnce, seasonOnce } from '../../data/season.js';
import '../keep/keep.css';

export interface CellRuinProps {
  repository: GameRepository | null;
  h3: H3Index;
  here: boolean;
  now: number;
}

export function CellRuin({ repository, h3, here, now }: CellRuinProps) {
  const [ruins, setRuins] = useState<H3Index[]>([]);
  const [seed, setSeed] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [said, setSaid] = useState<string | null>(null);

  useEffect(() => {
    setSaid(null);
    if (!repository) return;
    void (async () => {
      const season = await seasonOnce();
      setSeed(season && season.phase !== 'sealed' ? season.seed : null);
      setRuins(await ruinsOnce());
      setSearched((await repository.ruins.searched()).includes(h3));
    })();
  }, [repository, h3]);

  if (!repository || !seed || !ruins.includes(h3)) return null;

  const search = () => {
    void repository.ruins.search(h3, here ? h3 : null, ruins, seed, now).then((r) => {
      if (r.ok) {
        setSearched(true);
        setSaid(r.find.text);
      } else setSaid(r.refused === 'not-there' ? 'Walk onto the ruins to search them.' : 'Nothing more is hidden here.');
    });
  };

  return (
    <section className="keep-citizens keep-gate" aria-label="Ruins">
      <p className="hearth-panel__line">
        <strong>Ruins of a Fortress.</strong> Last season a Fortress stood here. Something may be left in the rubble.
      </p>
      {searched ? null : (
        <RitualButton variant="ghost" disabled={!here} onClick={search}>
          {here ? 'Search the ruins' : 'Walk onto the ruins to search them'}
        </RitualButton>
      )}
      {said ? (
        <p className="hearth-panel__line" role="status">
          {said}
        </p>
      ) : searched ? (
        <p className="hearth-panel__line">You have searched these ruins.</p>
      ) : null}
    </section>
  );
}
