/**
 * Choosing between the two ways to play (BRDC-MODE-001).
 *
 * Shown once, between the title screen and founding a Hearth, and never again for this
 * save — there is no menu to change it from later. Adventure is everything the game has
 * always been; the Route strips it to walking and claiming, scored only on distance and
 * hexes, on its own leaderboard (BRDC-MODE-002).
 */
import { GlassPanel, RitualButton, VesicaDivider } from '@es3/ui';
import type { GameMode } from '@es3/core';
import './mode-select.css';

export interface ModeSelectProps {
  onChoose: (mode: GameMode) => void;
}

export function ModeSelect({ onChoose }: ModeSelectProps) {
  return (
    <main className="mode-select">
      <GlassPanel as="section" className="mode-select__panel" aria-labelledby="mode-select-heading">
        <h1 id="mode-select-heading" className="mode-select__title">
          Choose Your Path
        </h1>
        <p className="mode-select__intro">This choice is permanent for this sanctuary.</p>

        <div className="mode-select__option">
          <h2 className="mode-select__name">Adventure</h2>
          <p className="mode-select__body">
            Buildings, research, spells, quests, clans — everything the sanctuary holds.
          </p>
          <RitualButton className="mode-select__cta" onClick={() => onChoose('adventure')}>
            Begin the Adventure
          </RitualButton>
        </div>

        <VesicaDivider size={80} className="mode-select__divider" />

        <div className="mode-select__option">
          <h2 className="mode-select__name">The Route</h2>
          <p className="mode-select__body">
            Just walk and claim ground. Only distance walked and hexes held count, on
            their own leaderboard.
          </p>
          <RitualButton
            variant="ghost"
            className="mode-select__cta"
            onClick={() => onChoose('route')}
          >
            Begin the Route
          </RitualButton>
        </div>
      </GlassPanel>
    </main>
  );
}
