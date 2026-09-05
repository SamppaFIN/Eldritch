/**
 * Rites — casting a spell from the cell panel (BRDC-SPELL-001).
 *
 * A sub-panel of `CellPanel`, the shape `BuildPanel` already is. It offers the two
 * home-school spells: Insight on the whole domain, Bulwark on the cell in front of you.
 * The enemy-facing schools are not here — they travel in a Wager (BRDC-SPELL-002).
 */
import { SPELLS, spellRemaining } from '@es3/core';
import type { CastRefusal, SpellId } from '@es3/core';
import { RitualButton } from '@es3/ui';
import type { SpellBinding } from './useSelection.js';
import { SPELL_NAME as NAME } from './names.js';
import { SPELL_BLURB, spellEffect } from './catalogue.js';

export const HOME_SPELLS = (Object.keys(SPELLS) as SpellId[]).filter(
  (id) => SPELLS[id].via === 'home',
);

/** Errors say what to do, not what failed (AI-Koulu ch.3). */
const REFUSAL: Readonly<Record<CastRefusal, string>> = {
  'unknown-spell': 'No such rite.',
  locked: 'Its rite has not been studied yet.',
  'cannot-afford': 'Not enough mana. Dwell in your places to gather it.',
  'carry-in-a-wager': 'This rite is cast in a duel, not at home.',
  'needs-a-target': 'Choose a cell for it first.',
  'not-your-cell': 'You do not hold this ground.',
  'already-running': 'That rite is already at work here.',
};

/** "8 h left" / "20 min left" — a spell's remaining time, said the way a walker reads it. */
export function spellTimeLeft(ms: number): string {
  const h = ms / 3_600_000;
  return h >= 1 ? `${Math.round(h)} h left` : `${Math.max(1, Math.round(ms / 60_000))} min left`;
}

export interface SpellPanelProps {
  spell: SpellBinding;
  cellH3: string;
  mine: boolean;
  mana: number;
  now: number;
}

export function SpellPanel({ spell, cellH3, mine, mana, now }: SpellPanelProps) {
  return (
    <div className="cell-panel__rites">
      <p className="cell-panel__rites-head">Rites</p>

      {HOME_SPELLS.map((id) => {
        const s = SPELLS[id];
        const target = s.scope === 'own-cell' ? cellH3 : null;
        const running = spell.active.some((a) => a.id === id && (a.target ?? null) === target);
        const blocked = running || mana < s.cost || (s.scope === 'own-cell' && !mine);
        return (
          <div key={id} className="cell-panel__rite">
            <RitualButton
              className="cell-panel__rite-btn"
              disabled={blocked}
              onClick={() => spell.onCast(id, target)}
            >
              {NAME[id]} · {s.cost} mana
            </RitualButton>
            <span className="cell-panel__rite-what">
              {running ? 'running' : `${SPELL_BLURB[id]} — ${spellEffect(id)}`}
            </span>
          </div>
        );
      })}

      {spell.active.length > 0 ? (
        <ul className="cell-panel__rites-active es-numeric">
          {spell.active.map((a, i) => (
            <li key={`${a.id}-${i}`}>
              {NAME[a.id]} · {spellTimeLeft(spellRemaining(a, now))}
            </li>
          ))}
        </ul>
      ) : null}

      {spell.refusal ? (
        <p className="cell-panel__refusal" role="status">
          {REFUSAL[spell.refusal]}
        </p>
      ) : null}
    </div>
  );
}
