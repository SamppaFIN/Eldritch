/**
 * The Lore (BRDC-PROG-004, Eldritch-Progression.pdf P2 and the full map).
 *
 * The Age you stand in first — it is the ceiling for everything — then each Age as a
 * block of four, one per path, with what each tech opens. Ages past yours are sealed and
 * shown as such, folded to a line (BRDC-UX-006): the order is still the lesson. A learned
 * piece is one line; a piece's line of lore is behind its own toggle.
 */
import { useState } from 'react';
import { loreCost } from '@es3/core';
import type { Age, LoreRow, LoreView, Unlock } from '@es3/core';
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
        const title = (
          <>
            Age {AGE_ROMAN[age - 1]} · <span className="es-numeric">{loreCost(age as Age)} wisdom each · {learned} of 4</span>
          </>
        );
        const list = (
          <ul className="lore__list">
            {rows.map((t) =>
              // Learned: one line — what it opened is all a player needs from it now (BRDC-UX-006).
              t.state === 'learned' ? (
                <li key={t.id} className="lore__tech lore__tech--learned lore__tech--short">
                  <strong>✓ {t.name}</strong> · {t.unlocks.map(opens).join(' · ')}
                </li>
              ) : (
                <li key={t.id} className={`lore__tech lore__tech--${t.state}`}>
                  <div className="lore__tech-head">
                    <strong>{t.name}</strong>
                    <span>{STATE_WORD[t.state]}</span>
                  </div>
                  <p className="lore__opens">Opens · {t.unlocks.map(opens).join(' · ')}</p>
                  {/* Its line of lore, one tap away (BRDC-UX-006). */}
                  <details className="lore__more">
                    <summary>Its lore</summary>
                    <p className="lore__line">{t.lore}</p>
                  </details>
                  {/* Do the thing and you half-know it (BRDC-EUREKA-001). */}
                  <p className={`lore__eureka es-numeric${t.eureka.met ? ' lore__eureka--met' : ''}`}>
                    {t.eureka.met ? `✦ Eureka · ${t.eureka.text} — half price` : `Eureka · ${t.eureka.text} · ${t.eureka.have}/${t.eureka.need}`}
                  </p>
                  {t.state === 'available' ? (
                    <RitualButton variant="ghost" disabled={busy || view.wisdom < t.cost} onClick={() => study(t)}>
                      {`Study · ${t.cost} wisdom`}
                    </RitualButton>
                  ) : null}
                </li>
              ),
            )}
          </ul>
        );
        // A sealed Age is one line until opened: the order is still the lesson (BRDC-UX-006).
        return age > view.age ? (
          <details key={age} className="lore__block lore__sealed" aria-label={`Age ${AGE_ROMAN[age - 1]}`}>
            <summary className="lore__block-title">
              {title} · sealed — learn three of Age {AGE_ROMAN[age - 2]} first
            </summary>
            {list}
          </details>
        ) : (
          <section key={age} className="lore__block" aria-label={`Age ${AGE_ROMAN[age - 1]}`}>
            <h3 className="lore__block-title">{title}</h3>
            {list}
          </section>
        );
      })}
    </section>
  );
}
