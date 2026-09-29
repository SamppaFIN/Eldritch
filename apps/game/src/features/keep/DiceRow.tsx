/**
 * A rolled test's dice (BRDC-DOOM-002/003): each a 44 px button; a miss can be rerolled
 * for a clue. A success is marked by weight and a ring as well as by name (§14).
 */
import type { Roll } from '@es3/core';
import './keep.css';

export interface DiceRowProps {
  roll: Roll;
  clues: number;
  busy: boolean;
  onReroll: (index: number) => void;
}

export function DiceRow({ roll, clues, busy, onReroll }: DiceRowProps) {
  const floor = roll.luck === 'blessed' ? 4 : roll.luck === 'cursed' ? 6 : 5;
  return (
    <div className="keep-gate__dice" role="group" aria-label="Dice">
      {roll.faces.map((f, i) => (
        <button
          key={i}
          type="button"
          className={`keep-gate__die${f >= floor ? ' keep-gate__die--hit' : ''}`}
          aria-label={`Die ${i + 1}: ${f}${f >= floor ? ', a success' : ', spend a clue to reroll'}`}
          disabled={busy || f >= floor || clues < 1 || roll.pass}
          onClick={() => onReroll(i)}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
