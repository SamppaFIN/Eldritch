/**
 * The temple tour (BRDC-LEDGER-003, handoff F-22): the Ledger steps aside, and a slim bar
 * flies the map from one temple to the next with its card open. Done closes the bar.
 */
import type { H3Index } from '@es3/core';
import { RitualButton } from '@es3/ui';

export interface TempleTourProps {
  tour: { list: readonly H3Index[]; i: number } | null;
  onStep: (i: number) => void;
  onDone: () => void;
}

export function TempleTour({ tour, onStep, onDone }: TempleTourProps) {
  if (!tour) return null;
  const { list, i } = tour;
  return (
    <nav className="temple-tour" aria-label="Temple tour">
      <RitualButton variant="ghost" aria-label="Previous temple" disabled={i === 0} onClick={() => onStep(i - 1)}>
        ‹
      </RitualButton>
      <span className="temple-tour__where es-numeric">
        Temple {i + 1} of {list.length}
      </span>
      <RitualButton variant="ghost" aria-label="Next temple" disabled={i >= list.length - 1} onClick={() => onStep(i + 1)}>
        ›
      </RitualButton>
      <RitualButton variant="ghost" onClick={onDone}>
        Done
      </RitualButton>
    </nav>
  );
}
