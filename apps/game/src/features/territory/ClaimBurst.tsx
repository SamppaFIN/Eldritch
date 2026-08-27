/**
 * The claim burst.
 *
 * Closing a loop is the one moment the game exists to deliver, and until now it produced
 * a line of text. claude.md's visual direction names the shape for it: an expanding
 * hexagonal mandala — the same geometry the territory itself is made of.
 *
 * Drawn as an HTML overlay rather than animated map layers. Per-cell animation would
 * mean a render loop over a GeoJSON source for a second and a half, on a phone, at the
 * exact moment the map is already rasterising new hexagons. This costs nothing and says
 * more.
 */
import { useEffect, useState } from 'react';
import { HexMandala } from '@es3/ui';
import type { ClaimEvent } from './useTerritory.js';
import './claim-burst.css';

export interface ClaimBurstProps {
  claim: ClaimEvent | null;
}

/** Long enough to register, short enough not to sit in the way of walking. */
const BURST_MS = 1_800;

export function ClaimBurst({ claim }: ClaimBurstProps) {
  const [showing, setShowing] = useState<ClaimEvent | null>(null);

  useEffect(() => {
    if (!claim) return;
    setShowing(claim);
    const timer = setTimeout(() => setShowing(null), BURST_MS);
    return () => clearTimeout(timer);
  }, [claim]);

  if (!showing) return null;

  const gained = showing.outcomes.filter(
    (o) => o.kind === 'claimed' || o.kind === 'taken',
  ).length;

  return (
    <div className="claim-burst" aria-hidden>
      <HexMandala size={280} animate={BURST_MS * 0.6} className="claim-burst__sigil" />
      {gained > 0 ? <span className="claim-burst__count es-numeric">+{gained}</span> : null}
    </div>
  );
}
