/**
 * One of a few, chosen for good (BRDC-UX-007): the week's boon, the season's ambition, an
 * Age's character, a temple's school, the stranger's name. Each used to be a stack of
 * full-width two-line buttons; three of them filled the screen.
 *
 * Now a compact list — a radio row per choice, each a full touch target — and one button
 * under it that says what will happen. Two taps still: pick, then confirm.
 */
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { RitualButton } from '@es3/ui';
import './keep.css';

export interface Choice<T extends string> {
  id: T;
  name: string;
  /** One short line after the name — a yield, a cost, a sentence at most. */
  detail?: ReactNode;
}

export interface ChoiceListProps<T extends string> {
  /** The question, said once above the list. */
  legend: ReactNode;
  choices: readonly Choice<T>[];
  /** What the button says once a choice is picked: "Take Harvest for the week". */
  confirm: (c: Choice<T>) => string;
  onConfirm: (id: T) => void;
  busy?: boolean;
}

export function ChoiceList<T extends string>({ legend, choices, confirm, onConfirm, busy = false }: ChoiceListProps<T>) {
  const name = useId();
  const [pick, setPick] = useState<T | null>(null);
  const chosen = choices.find((c) => c.id === pick) ?? null;
  return (
    <fieldset className="choice-list" disabled={busy}>
      <legend className="hearth-panel__line">{legend}</legend>
      {choices.map((c) => (
        <label key={c.id} className="choice-list__row">
          <input type="radio" name={name} value={c.id} checked={pick === c.id} onChange={() => setPick(c.id)} />
          <span>
            <strong>{c.name}</strong>
            {c.detail ? <span className="choice-list__detail"> · {c.detail}</span> : null}
          </span>
        </label>
      ))}
      <RitualButton
        variant={chosen ? 'primary' : 'ghost'}
        disabled={!chosen}
        onClick={() => {
          if (!chosen) return;
          setPick(null);
          onConfirm(chosen.id);
        }}
      >
        {chosen ? confirm(chosen) : 'Pick one above'}
      </RitualButton>
    </fieldset>
  );
}
