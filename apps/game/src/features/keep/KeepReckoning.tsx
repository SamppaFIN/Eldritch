/**
 * The Reckoning — Doom 13, it is awake (BRDC-DOOM-004, Eldritch-season.pdf S2).
 *
 * The Ancient One's strength shared by every realm, this realm's damage and place, and
 * the ways to hurt it: Strike (a Fight test) and Rite (mana). Gate healing and seal damage
 * (`sealDamage`) are not wired to the Worker yet — the copy does not promise them. A blow is kept locally until the Worker takes it. Only while the
 * shared season is in its Reckoning.
 */
import { useEffect, useState } from 'react';
import { RITE_MANA_COST, rankOf } from '@es3/core';
import type { GameRepository, Roll, Season } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { fetchReckoning, fetchSeason, postStrike } from '../../data/season.js';
import type { Reckoning } from '../../data/season.js';
import { DiceRow } from './DiceRow.js';
import './keep.css';

export interface KeepReckoningProps {
  repository: GameRepository | null;
  now: number;
}

const REFUSAL: Record<string, string> = {
  resting: 'Catch your breath — one strike every twenty minutes.',
  home: 'You were sent home. Rest twelve hours, then fight again.',
  'cannot-afford': `A rite needs ${RITE_MANA_COST} mana.`,
  'no-keep': 'This realm has no Keep yet.',
};

export function KeepReckoning({ repository, now }: KeepReckoningProps) {
  const [season, setSeason] = useState<Season | null>(null);
  const [fight, setFight] = useState<Reckoning | null>(null);
  const [realm, setRealm] = useState<string | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [faces, setFaces] = useState<Roll | null>(null);
  const [busy, setBusy] = useState(false);

  /** Send whatever damage the Worker has not taken yet, then read the fight. */
  const flush = async (id: string) => {
    if (!repository) return;
    const { unsent } = await repository.reckoning.ledger();
    if (unsent > 0 && (await postStrike(id, Math.min(unsent, 2_000)))) await repository.reckoning.sent(Math.min(unsent, 2_000));
    setFight(await fetchReckoning());
  };

  useEffect(() => {
    if (!repository) return;
    void (async () => {
      const s = await fetchSeason();
      setSeason(s);
      if (s?.phase !== 'reckoning') return;
      const id = (await repository.getProfile()).id;
      setRealm(id);
      await flush(id);
    })();
    // Once per opening of the Keep (the Worker is shared); `now` is read on fire.
  }, [repository]);

  if (!repository || season?.phase !== 'reckoning' || !realm) return null;
  const hp = fight?.bossHp ?? season.bossHp;
  const max = fight?.bossMaxHp ?? season.bossMaxHp;
  const mine = fight?.standings.find((s) => s.realm === realm)?.damage ?? 0;
  const rank = fight ? rankOf(fight.standings, realm) : null;
  const hoursLeft = Math.max(0, Math.ceil(((season.reckoningAt ?? now) + 72 * 3_600_000 - now) / 3_600_000));

  const blow = (run: () => ReturnType<GameRepository['reckoning']['strike']>) => {
    if (busy) return;
    setBusy(true);
    void (async () => {
      const r = await run();
      if (r.ok) {
        setFaces(r.roll ?? null);
        setSaid(r.damage > 0 ? `${r.damage} damage lands.` : 'It shrugs the blow off.');
        await flush(realm);
      } else setSaid(REFUSAL[r.refused] ?? 'That did not work.');
      setBusy(false);
    })();
  };

  return (
    <>
      <h3 className="hearth-panel__section">The Reckoning</h3>
      <section className="keep-citizens keep-gate" aria-label="The Reckoning">
        <p className="hearth-panel__line">
          <strong>Doom 13 · it is awake.</strong> Every realm fights it at once. Ends in {hoursLeft} h.
        </p>
        <p className="hearth-panel__line es-numeric">
          Its strength · {hp} / {max}
        </p>
        <progress className="keep-doom__track" max={max || 1} value={hp} aria-label="The Ancient One's strength" />
        <p className="hearth-panel__line es-numeric">
          Your realm dealt {mine}
          {rank ? ` · #${rank}` : ''}
        </p>
        <div className="cell-staff__buttons">
          <RitualButton variant="ghost" disabled={busy} onClick={() => blow(() => repository.reckoning.strike(Date.now()))}>
            Strike · Fight test
          </RitualButton>
          <RitualButton variant="ghost" disabled={busy} onClick={() => blow(() => repository.reckoning.rite(Date.now()))}>
            {`Rite · ${RITE_MANA_COST} mana`}
          </RitualButton>
        </div>
        {faces ? <DiceRow roll={faces} clues={0} busy onReroll={() => {}} /> : null}
        <p className="hearth-panel__line">Close the gates near you too — an open gate weighs on your realm while you fight.</p>
        {said ? (
          <p className="hearth-panel__line" role="status">
            {said}
          </p>
        ) : null}
      </section>
    </>
  );
}
