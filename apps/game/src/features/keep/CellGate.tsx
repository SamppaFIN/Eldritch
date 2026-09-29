/**
 * A gate on this hex — the encounter (BRDC-DOOM-002, Eldritch-Progression.pdf P5).
 *
 * The investigator's stamina, sanity and clues; the Lore test (dice = 2 + Lore, two
 * successes needed); a clue per reroll of a die that missed; then take the result. Five
 * clues (three with Elder Signs) seal it outright. Only while standing on the hex — the
 * test is taken on foot. Nothing when no gate is here.
 */
import { useEffect, useState } from 'react';
import type { GameRepository, GateView, H3Index, Roll } from '@es3/core';
import { RitualButton } from '@es3/ui';
import './keep.css';

export interface CellGateProps {
  repository: GameRepository | null;
  h3: H3Index;
  here: boolean;
  now: number;
}

const REFUSAL: Record<string, string> = {
  'not-there': 'Walk onto the gate to face it.',
  home: 'You were sent home. Rest twelve hours, then come back.',
  'no-clues': 'Not enough clues.',
  'no-gate': 'The gate is already shut.',
  'nothing-pending': 'Roll first.',
  'no-keep': 'This realm has no Keep yet.',
};

export function CellGate({ repository, h3, here, now }: CellGateProps) {
  const [view, setView] = useState<GateView | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => setView(repository ? await repository.gates.view(now) : null);
  useEffect(() => {
    setSaid(null);
    void load();
    // load reads fresh; the hex and the clock are the triggers.
  }, [repository, h3, now]);

  const gate = view?.gates.find((g) => g.h3 === h3);
  if (!view || !gate || !repository) return null;
  const inv = view.investigator;
  const pending: Roll | null = view.pending?.gateId === gate.id ? view.pending.roll : null;

  const act = (run: () => Promise<{ ok: boolean; refused?: string; sealed?: boolean }>, done?: (r: { sealed?: boolean }) => string) => {
    if (busy) return;
    setBusy(true);
    void (async () => {
      const r = await run();
      setSaid(r.ok ? (done ? done(r) : null) : (REFUSAL[r.refused ?? ''] ?? 'That did not work.'));
      await load();
      setBusy(false);
    })();
  };

  return (
    <section className="keep-citizens keep-gate" aria-label="Gate">
      <p className="hearth-panel__line">
        <strong>A gate stands open here.</strong> The water stands upright at its edge, and something on the far
        side is reading your name.
      </p>
      <p className="hearth-panel__line es-numeric">
        Stamina {inv.stamina} · Sanity {inv.sanity} · Clues {inv.clues}
        {inv.home ? ' · sent home' : ''}
      </p>
      {pending ? (
        <>
          <p className="hearth-panel__line es-numeric">
            Lore test · {pending.successes} of {pending.need} needed — {pending.pass ? 'passed' : 'not yet'}
          </p>
          <div className="keep-gate__dice" role="group" aria-label="Dice">
            {pending.faces.map((f, i) => (
              <button
                key={i}
                type="button"
                className={`keep-gate__die${f >= 5 ? ' keep-gate__die--hit' : ''}`}
                aria-label={`Die ${i + 1}: ${f}${f >= 5 ? ', a success' : ', spend a clue to reroll'}`}
                disabled={busy || f >= 5 || inv.clues < 1 || pending.pass}
                onClick={() => act(() => repository.gates.reroll(i, now))}
              >
                {f}
              </button>
            ))}
          </div>
          <RitualButton
            variant="ghost"
            disabled={busy}
            onClick={() => act(() => repository.gates.accept(now), (r) => (r.sealed ? 'The gate is shut. The Doom falls by one, and you keep two clues.' : 'It holds. You lose two sanity; the gate stays open.'))}
          >
            {pending.pass ? 'Seal the gate' : 'Accept fate'}
          </RitualButton>
        </>
      ) : (
        <div className="cell-staff__buttons">
          <RitualButton variant="ghost" disabled={busy || !here || inv.home} onClick={() => act(() => repository.gates.attempt(gate.id, here ? h3 : null, now))}>
            {`Lore test · ${2 + inv.skills.lore} dice · costs 1 stamina`}
          </RitualButton>
          {inv.clues >= view.sealClues ? (
            <RitualButton variant="ghost" disabled={busy || !here} onClick={() => act(() => repository.gates.seal(gate.id, here ? h3 : null, now), () => 'Sealed with clues. The Doom falls by one.')}>
              {`Seal with ${view.sealClues} clues`}
            </RitualButton>
          ) : null}
          {!here ? <p className="hearth-panel__line">Walk onto the gate to face it.</p> : null}
        </div>
      )}
      {said ? (
        <p className="hearth-panel__line" role="status">
          {said}
        </p>
      ) : null}
    </section>
  );
}
