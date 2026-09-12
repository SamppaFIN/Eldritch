/**
 * Something that happened on the way (BRDC-EVENT-002).
 *
 * A sibling of `AdventureDialog` and deliberately its twin: both are a story told with a
 * speaker and some buttons, so they share `adventure-dialog.css` rather than growing a
 * second look for the same act (§14 — same thing, same appearance). What separates them is
 * length, not styling. An adventure has stages and is returned to; an encounter is one
 * moment and every button on it ends the thing.
 *
 * It lives beside its sibling rather than in a folder of its own for the same reason.
 */
import { GlassPanel, RitualButton } from '@es3/ui';
import type { Encounter, H3Index } from '@es3/core';
import { useEscape } from '../hud/useEscape.js';
import { useEncounterHint } from './useEncounterHint.js';
import './adventure-dialog.css';

export interface EncounterDialogProps {
  encounter: Encounter | null;
  /** Where the player is, so the three hint encounters can point somewhere real. */
  standingOn: H3Index | null;
  /** Chosen `index`, or null when it was waved away. Either way the moment is over. */
  onChoose: (index: number | null) => void;
}

export function EncounterDialog({ encounter, standingOn, onChoose }: EncounterDialogProps) {
  // Both hooks above the early return: a hook cannot be called conditionally, and putting
  // one after an early return is how `CellPanel` earned a React #310 in this codebase.
  useEscape(encounter !== null, () => onChoose(null));
  const hint = useEncounterHint(encounter, standingOn);
  if (!encounter) return null;

  return (
    <GlassPanel as="section" className="adventure" aria-label="Something happened">
      <div className="adventure__head">
        <h2 className="adventure__title">On the way</h2>
        <RitualButton
          variant="ghost"
          className="adventure__close"
          onClick={() => onChoose(null)}
          aria-label="Close"
        >
          ✕
        </RitualButton>
      </div>

      {encounter.speaker ? (
        <div className="adventure__speaker">
          <span className="adventure__name">{encounter.speaker}</span>
        </div>
      ) : null}

      <p className="adventure__line">{encounter.text}</p>
      {/* A bearing and a distance, never a hex index: a coordinate handed over in dialogue
          ends the search instead of starting it (BRDC-EVENT-002, BRDC-WONDER-001). */}
      {hint ? <p className="adventure__line adventure__line--hint">{hint}</p> : null}

      <div className="adventure__choices">
        {encounter.choices.map((choice, i) => (
          <RitualButton key={choice.text} onClick={() => onChoose(i)}>
            {choice.text}
          </RitualButton>
        ))}
      </div>
    </GlassPanel>
  );
}
