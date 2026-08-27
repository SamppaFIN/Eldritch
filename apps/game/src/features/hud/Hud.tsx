/**
 * The HUD.
 *
 * Docked to the bottom: the top of a phone is the hardest place to reach with one
 * thumb, and this game is played one-handed while walking.
 *
 * The signal readout is the most important element in Phase 1. The acceptance gate is
 * a walk outdoors, and without it you cannot tell broken code from a bad sky. v2 showed
 * nothing here and players concluded the game had frozen.
 */
import { levelState, msToKmh } from '@es3/core';
import type { PlayerProfile, RejectReason } from '@es3/core';
import { GlassPanel, RitualButton } from '@es3/ui';
import type { GeoStatus, PositionSource } from '../trail/usePositionSource.js';
import './hud.css';

export interface HudProps {
  profile: PlayerProfile | null;
  distanceM: number;
  accuracyM: number | null;
  speedMs?: number | null;
  status: GeoStatus;
  source: PositionSource;
  lastRejection: RejectReason | null;
  basemapVoid: boolean;
  onWithdraw: () => void;
}

type Quality = 'good' | 'weak' | 'rejected' | 'none';

function quality(status: GeoStatus, accuracyM: number | null): Quality {
  if (status !== 'tracking' || accuracyM === null) return 'none';
  if (accuracyM <= 15) return 'good';
  if (accuracyM <= 50) return 'weak';
  return 'rejected';
}

/**
 * Every state is spelled out. Colour is never the only signal — the player is outdoors
 * in daylight and may not be able to tell cyan from amber at arm's length.
 */
function signalLine(
  status: GeoStatus,
  q: Quality,
  accuracyM: number | null,
  rejection: RejectReason | null,
): string {
  switch (status) {
    case 'denied':
      return 'Location refused — the ground stays silent';
    case 'unavailable':
      return 'No location sensor on this device';
    case 'searching':
      return 'Searching for the sky…';
    case 'pending':
    case 'idle':
      return 'Waking the senses…';
    default:
      break;
  }

  if (q === 'rejected') return 'Signal too weak — the Ley-line cannot form';
  if (rejection === 'speed') return 'Moving too fast to be walking';
  if (rejection === 'consolidated') return 'Holding still — the line waits';
  if (q === 'weak') return `Signal uncertain · ±${Math.round(accuracyM ?? 0)} m`;
  return `Signal clear · ±${Math.round(accuracyM ?? 0)} m`;
}

function formatDistance(m: number): string {
  return m < 1_000 ? `${Math.round(m)} m` : `${(m / 1_000).toFixed(2)} km`;
}

export function Hud({
  profile,
  distanceM,
  accuracyM,
  speedMs,
  status,
  source,
  lastRejection,
  basemapVoid,
  onWithdraw,
}: HudProps) {
  const level = levelState(profile?.xp ?? 0);
  const q = quality(status, accuracyM);

  return (
    <div className="hud">
      <GlassPanel as="section" className="hud__panel" aria-label="Status">
        <div className="hud__row">
          <div className="hud__stat">
            <span className="hud__label">Consciousness</span>
            <span className="hud__value es-numeric">
              {level.level} · {level.name}
            </span>
          </div>
          <div className="hud__stat hud__stat--right">
            <span className="hud__label">Ley-line</span>
            <span className="hud__value es-numeric">{formatDistance(distanceM)}</span>
          </div>
        </div>

        <div
          className="hud__xp"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(level.progress * 100)}
          aria-label={`Experience toward level ${level.level + 1}`}
        >
          <div className="hud__xp-fill" style={{ inlineSize: `${level.progress * 100}%` }} />
        </div>

        <p className="hud__signal" data-quality={q} role="status">
          <span className="hud__dot" aria-hidden />
          {signalLine(status, q, accuracyM, lastRejection)}
          {speedMs != null && q !== 'none' ? (
            <span className="hud__speed es-numeric"> · {msToKmh(speedMs).toFixed(1)} km/h</span>
          ) : null}
        </p>

        {basemapVoid ? (
          <p className="hud__note" role="status">
            The streets are unreachable. Your line is still being drawn.
          </p>
        ) : null}

        {source === 'simulated' ? (
          <p className="hud__note hud__note--dev">Simulated walk · WASD</p>
        ) : null}

        <RitualButton variant="ghost" className="hud__withdraw" onClick={onWithdraw}>
          Withdraw
        </RitualButton>
      </GlassPanel>
    </div>
  );
}
