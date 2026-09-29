/**
 * A rumour on this hex — one card from its ground's deck (BRDC-DOOM-003).
 *
 * The card's words, the test it asks (a skill and how many successes), the dice once
 * rolled with a clue per reroll, and what came of it. Faced once, on foot. Nothing on a
 * Season 1 save, or before a season is open, or where the ground holds no rumour.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, H3Index, RumourView } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { seasonOnce } from '../../data/season.js';
import { DiceRow } from './DiceRow.js';
import './keep.css';

export interface CellRumourProps {
  repository: GameRepository | null;
  h3: H3Index;
  here: boolean;
  now: number;
}

const SKILL: Record<string, string> = { lore: 'Lore', will: 'Will', fight: 'Fight', observe: 'Observe' };
const REFUSAL: Record<string, string> = {
  'not-there': 'Walk onto the hex to face it.',
  home: 'You were sent home. Rest twelve hours, then come back.',
  'no-clues': 'Not enough clues.',
  'none-here': 'The rumour has gone quiet.',
  'nothing-pending': 'Roll first.',
  'no-keep': 'This realm has no Keep yet.',
};

export function CellRumour({ repository, h3, here, now }: CellRumourProps) {
  const [seed, setSeed] = useState<string | null>(null);
  const [view, setView] = useState<RumourView | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (s: string | null) => setView(repository && s ? await repository.rumours.at(h3, s, now) : null);
  useEffect(() => {
    setSaid(null);
    void seasonOnce().then((season) => {
      const s = season?.phase === 'open' ? season.seed : null;
      setSeed(s);
      void load(s);
    });
    // load reads fresh; the hex and the clock are the triggers.
  }, [repository, h3, now]);

  if (!repository || !seed || (!view && !said)) return null;
  const act = (run: () => Promise<{ ok: boolean; refused?: string; said?: string }>) => {
    if (busy) return;
    setBusy(true);
    void (async () => {
      const r = await run();
      setSaid(r.ok ? (r.said ?? null) : (REFUSAL[r.refused ?? ''] ?? 'That did not work.'));
      await load(seed);
      setBusy(false);
    })();
  };

  if (!view) {
    return (
      <section className="keep-citizens keep-gate" aria-label="Rumour">
        <p className="hearth-panel__line" role="status">
          {said}
        </p>
      </section>
    );
  }
  const { card, investigator: inv, roll } = view;

  return (
    <section className="keep-citizens keep-gate" aria-label="Rumour">
      <p className="hearth-panel__line">
        <strong>{card.title}.</strong> {card.text}
      </p>
      <p className="hearth-panel__line es-numeric">
        {SKILL[card.skill]} test · {2 + inv.skills[card.skill]} dice, need {card.need} · Stamina {inv.stamina} · Sanity {inv.sanity} · Clues {inv.clues}
      </p>
      {roll ? (
        <>
          <DiceRow roll={roll} clues={inv.clues} busy={busy} onReroll={(i) => act(() => repository.rumours.reroll(i, now))} />
          <RitualButton variant="ghost" disabled={busy} onClick={() => act(() => repository.rumours.accept(now))}>
            {roll.pass ? 'Take what it gives' : 'Accept fate'}
          </RitualButton>
        </>
      ) : (
        <RitualButton variant="ghost" disabled={busy || !here || inv.home} onClick={() => act(() => repository.rumours.face(h3, here ? h3 : null, seed, now))}>
          {here ? 'Face it · costs 1 stamina' : 'Walk onto the hex to face it'}
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
