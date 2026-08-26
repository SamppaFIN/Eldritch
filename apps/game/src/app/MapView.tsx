/**
 * The map screen.
 *
 * BRDC-MAP-001 scope: the surface, the camera and the player marker. Continuous
 * tracking, the ley-line and the full HUD arrive with TRAIL-001, TRAIL-002 and
 * HUD-001 — this screen deliberately shows only what it can honestly show.
 */
import { useState } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import { MapCanvas } from '../features/map/MapCanvas.js';
import type { BasemapState } from '../features/map/useMap.js';
import { useInitialPosition } from '../features/map/useInitialPosition.js';
import './mapview.css';

export interface MapViewProps {
  onLeave: () => void;
}

export function MapView({ onLeave }: MapViewProps) {
  const { centre, settled, permission } = useInitialPosition();
  const [basemap, setBasemap] = useState<BasemapState>('loading');

  // Mounting the map before the one-shot fix settles would open the camera on the
  // fallback and then jump — a bad first impression, and a wasted tile fetch.
  if (!settled) {
    return (
      <main className="mapview mapview--waiting">
        <GlassPanel className="mapview__status">
          <p className="mapview__seeking" role="status">
            Listening for the ground beneath you…
          </p>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="mapview">
      <MapCanvas
        initialCentre={centre}
        position={permission === 'granted' ? centre : null}
        accuracyM={permission === 'granted' ? 20 : undefined}
        onBasemapChange={setBasemap}
      />

      <div className="mapview__hud">
        <GlassPanel className="mapview__panel">
          <p className="mapview__line es-numeric">
            {statusLine(permission, basemap)}
          </p>
          <RitualButton variant="ghost" onClick={onLeave}>
            Withdraw
          </RitualButton>
        </GlassPanel>
      </div>
    </main>
  );
}

/**
 * One line of honest state.
 *
 * Never colour alone: each condition is spelled out in words, because the player is
 * outdoors in daylight and may not be able to tell a cyan dot from an amber one.
 */
function statusLine(permission: string, basemap: BasemapState): string {
  if (permission === 'denied') return 'LOCATION REFUSED · THE GROUND IS SILENT';
  if (permission === 'unavailable') return 'NO LOCATION SENSOR · MAP ONLY';
  if (basemap === 'void') return 'POSITION HELD · THE STREETS ARE UNREACHABLE';
  if (basemap === 'loading') return 'THE VOID IS RESOLVING…';
  return 'POSITION HELD';
}
