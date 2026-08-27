/**
 * The claim burst — the one moment the game exists to deliver.
 *
 * Closing a loop used to produce a mandala, a number, and a line of text in the HUD.
 * Walking a whole block and being told "+7" is not an event; the first outdoor test
 * confirmed it. So the burst now says what happened, in words, at a size that is
 * readable at arm's length in daylight, while the map underneath lights the hexagons
 * one ring at a time.
 *
 * The mandala is HTML rather than map layers. The hexagons are map layers rather than
 * HTML. Each is where it costs least.
 */
import { useEffect, useState } from 'react';
import { HexMandala } from '@es3/ui';
import type { ClaimEvent } from './useTerritory.js';
import './claim-burst.css';

export interface ClaimBurstProps {
  claim: ClaimEvent | null;
}

/**
 * Long enough to read three lines while walking, short enough to be gone before it
 * matters. Tapping it ends it sooner.
 */
const BURST_MS = 5_200;

/**
 * The title is the achievement.
 *
 * Sized by what was actually taken, so a lap of the car park and a lap of the
 * neighbourhood are not congratulated in the same words. Nothing to unlock and nothing
 * to store — the ground itself is the record.
 */
function titleFor(cells: number): string {
  if (cells >= 25) return 'Dominion';
  if (cells >= 10) return 'A Sanctuary Takes Shape';
  if (cells >= 3) return 'The Ground Awakens';
  return 'The Ground Stirs';
}

function formatArea(m2: number): string {
  if (m2 < 10_000) return `${Math.round(m2 / 100) * 100} m²`;
  return `${(m2 / 10_000).toFixed(1)} ha`;
}

export function ClaimBurst({ claim }: ClaimBurstProps) {
  const [showing, setShowing] = useState<ClaimEvent | null>(null);

  useEffect(() => {
    if (!claim) return;
    setShowing(claim);
    const timer = setTimeout(() => setShowing(null), BURST_MS);
    return () => clearTimeout(timer);
  }, [claim]);

  if (!showing) return null;

  const awakened = showing.outcomes.filter((o) => o.kind === 'claimed').length;
  const corrupted = showing.outcomes.filter((o) => o.kind === 'taken').length;
  const gained = awakened + corrupted;

  return (
    <div className="claim-burst">
      <div className="claim-burst__sigil-wrap" aria-hidden>
        <HexMandala size={300} animate={2_000} className="claim-burst__sigil" />
      </div>

      {/*
        A button, not a div with a click handler: it is dismissible, so it is focusable,
        it answers Enter and Space, and it gets the focus ring every other control has.
      */}
      <button
        type="button"
        className="claim-burst__panel"
        onClick={() => setShowing(null)}
        aria-label="Dismiss"
      >
        <p className="claim-burst__eyebrow">You closed the loop</p>
        <p className="claim-burst__title">{titleFor(gained)}</p>

        <p className="claim-burst__body">
          {gained > 0
            ? 'The land inside your line is yours. It will remember you for a while — walk it again and it remembers longer.'
            : 'Your line closed over ground you already hold. It stands a little longer for it.'}
        </p>

        <dl className="claim-burst__stats">
          <div className="claim-burst__stat">
            <dt>Warded</dt>
            <dd className="es-numeric">+{gained}</dd>
          </div>
          <div className="claim-burst__stat">
            <dt>Enclosed</dt>
            <dd className="es-numeric">{formatArea(showing.areaM2)}</dd>
          </div>
          {corrupted > 0 ? (
            <div className="claim-burst__stat">
              <dt>Corrupted</dt>
              <dd className="es-numeric">{corrupted}</dd>
            </div>
          ) : null}
        </dl>
      </button>
    </div>
  );
}
