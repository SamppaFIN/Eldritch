/**
 * The Lore (BRDC-PROG-004, Eldritch-Progression.pdf P2 and the full map).
 *
 * The Age you stand in first — it is the ceiling for everything — then each Age as a
 * block of four, one per path, with what each tech opens and its line of lore. Ages past
 * the next one are sealed and shown as such, not hidden: the order is the lesson.
 */
import { useState } from 'react';
import type { LoreRow, LoreView, Unlock } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { BUILDING_NAME } from '../territory/names.js';
import './lore.css';

const MASTERWORK_NAME: Record<string, string> = {
  fortress: 'Fortress',
  manor: 'Manor',
  foundry: 'Foundry',
  exchange: 'Exchange',
  'sunken-cathedral': 'Sunken Cathedral',
};

const AGE_ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function opens(u: Unlock): string {
  if (u.kind === 'building') return BUILDING_NAME[u.id];
  if (u.kind === 'masterwork') return `◆ ${MASTERWORK_NAME[u.id]}`;
  return u.text;
}

const STATE_WORD: Record<LoreRow['state'], string> = { learned: '✓ Learned', available: 'Available', sealed: 'Sealed' };

export interface LorePanelProps {
  view: LoreView;
  onStudy: (row: LoreRow) => Promise<string | null>;
}

export function LorePanel({ view, onStudy }: LorePanelProps) {
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const study = (row: LoreRow) => {
    if (busy) return;
    setBusy(true);
    void onStudy(row).then((msg) => {
      setSaid(msg);
      setBusy(false);
    });
  };

  return (
    <section className="lore" aria-label="The Lore">
      <p className="lore__age">
        Age {AGE_ROMAN[view.age - 1]} · {view.ageName} — <span className="es-numeric">{Math.floor(view.wisdom)} wisdom</span>
      </p>
      <p className="lore__hint">The Age is your ceiling. Learn three of an Age to enter the next.</p>
      {said ? (
        <p className="lore__hint" role="status">
          {said}
        </p>
      ) : null}
      {[1, 2, 3, 4].map((age) => {
        const rows = view.techs.filter((t) => t.age === age);
        const learned = rows.filter((t) => t.state === 'learned').length;
        return (
          <section key={age} className="lore__block" aria-label={`Age ${AGE_ROMAN[age - 1]}`}>
            <h3 className="lore__block-title">
              Age {AGE_ROMAN[age - 1]} · <span className="es-numeric">{rows[0]?.cost} wisdom each · {learned} of 4</span>
            </h3>
            <ul className="lore__list">
              {rows.map((t) => (
                <li key={t.id} className={`lore__tech lore__tech--${t.state}`}>
                  <div className="lore__tech-head">
                    <strong>{t.name}</strong>
                    <span>{STATE_WORD[t.state]}</span>
                  </div>
                  <p className="lore__opens">Opens · {t.unlocks.map(opens).join(' · ')}</p>
                  <p className="lore__line">{t.lore}</p>
                  {t.state === 'available' ? (
                    <RitualButton variant="ghost" disabled={busy || view.wisdom < t.cost} onClick={() => study(t)}>
                      {`Study · ${t.cost} wisdom`}
                    </RitualButton>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </section>
  );
}
