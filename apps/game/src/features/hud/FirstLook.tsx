/**
 * What the game asks of you, said once.
 *
 * A first launch is a dot on a dark map. Everything the game is about — walk a closed
 * loop, take the ground inside it, take it from someone else — is invisible until it
 * has already happened, and a player who does not know to close a loop never will.
 *
 * One line, above the HUD, gone the moment they claim anything. Not an onboarding flow:
 * that is Phase 6, and three screens before a walk is three screens too many for
 * something whose whole instruction fits in a sentence.
 */
import { VesicaDivider } from '@es3/ui';
import './first-look.css';

export interface FirstLookProps {
  /** Hidden once there is any ground to look at. */
  show: boolean;
  /** Rival cells on screen, so the second line can be honest about them. */
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

export function FirstLook({ show, rivalCells, rivalBearing }: FirstLookProps) {
  if (!show) return null;

  return (
    <aside className="first-look" role="note">
      <VesicaDivider size={140} className="first-look__rule" />
      <p className="first-look__line">Walk a closed loop. The ground inside it becomes yours.</p>
      {rivalCells > 0 && rivalBearing !== null ? (
        <p className="first-look__sub">
          Someone already holds ground to the {compassPoint(rivalBearing)}.
        </p>
      ) : null}
    </aside>
  );
}
