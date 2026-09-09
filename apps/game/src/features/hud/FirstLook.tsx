/**
 * What the game asks of you next, said one rung at a time (PIVOT-2026-09-09 §1).
 *
 * This used to say one thing, once: *"Walk a closed loop. The ground inside it becomes
 * yours."* Two problems with that by now. It went quiet the moment anything was claimed,
 * which is exactly when a new player has their first question — and since
 * `BRDC-CLAIM-009` put loop closure behind a setting that is off by default, **the first
 * sentence the game said to anybody instructed a mechanic that was not running.**
 *
 * It is the opening ladder now: take ground, make it produce, make all of it produce
 * more, then go and get more of it. The rungs are `steps.ts`, read from state and tested
 * without a browser; this is the line they are said on. It goes quiet for good at the
 * goal — ten hexes, a Work and a technology.
 */
import { VesicaDivider } from '@es3/ui';
import { nextStep } from './steps.js';
import type { Progress } from './steps.js';
import './first-look.css';

export interface FirstLookProps extends Progress {
  /** Rival cells on screen, so the last line can be honest about them. */
  rivalCells: number;
  /** Bearing to the nearest rival ground, degrees from north, or null. */
  rivalBearing: number | null;
}

/**
 * The compass point, said the way a person would.
 *
 * This was hard-coded to "east" and the territory was north-east, which is a small
 * lie in the first sentence the game says to anybody. Pointing somewhere is only
 * useful if the direction is the real one.
 */
export function compassPoint(bearingDeg: number): string {
  const points = [
    'north',
    'north-east',
    'east',
    'south-east',
    'south',
    'south-west',
    'west',
    'north-west',
  ];
  const index = Math.round((((bearingDeg % 360) + 360) % 360) / 45) % 8;
  return points[index] as string;
}

export function FirstLook({ owned, works, researched, rivalCells, rivalBearing }: FirstLookProps) {
  const step = nextStep({ owned, works, researched });
  if (!step) return null;

  return (
    <aside className="first-look" role="note">
      <VesicaDivider size={140} className="first-look__rule" />
      <p className="first-look__line">{step.hint}</p>
      <p className="first-look__sub">{step.because}</p>
      {step.id === 'walk' && rivalCells > 0 && rivalBearing !== null ? (
        <p className="first-look__sub">
          Someone already holds ground to the {compassPoint(rivalBearing)}.
        </p>
      ) : null}
    </aside>
  );
}
