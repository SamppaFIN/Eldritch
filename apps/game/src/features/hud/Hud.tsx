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
import type { ClaimEvent } from '../territory/useTerritory.js';
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
  ownedCells?: number;
  ownedAreaM2?: number;
  strongest?: number;
  lastClaim?: ClaimEvent | null;
  released?: string[];
  onWithdraw: () => void;
}

/**
 * What a closed loop just did, in lore rather than in code words.
 *
 * `claim` is "Awakening the Ground", `steal` is "Corruption" — the domain model in
 * claude.md, used consistently so the interface and the fiction are the same language.
 */
function claimLine(claim: ClaimEvent): string {
  const count = (kind: string) => claim.outcomes.filter((o) => o.kind === kind).length;
  const parts: string[] = [];

  const awakened = count('claimed');
  const corrupted = count('taken');
  const reinforced = count('reinforced');
  const damaged = count('damaged');

  if (awakened) parts.push(`${awakened} awakened`);
  if (corrupted) parts.push(`${corrupted} corrupted`);
  if (reinforced) parts.push(`${reinforced} reinforced`);
  if (damaged) parts.push(`${damaged} weakened`);

  return parts.length > 0 ? parts.join(' · ') : 'The ground did not stir';
}

function formatArea(m2: number): string {
  if (m2 <= 0) return '0 m²';
  return m2 < 1_000_000 ? `${Math.round(m2)} m²` : `${(m2 / 1_000_000).toFixed(2)} km²`;
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
  ownedCells = 0,
  ownedAreaM2 = 0,
  strongest = 0,
  lastClaim = null,
  released = [],
  onWithdraw,
}: HudProps) {
  const level = levelState(profile?.xp ?? 0);
  const q = quality(status, accuracyM);

  return (
    <div className="hud">
      <GlassPanel as="section" className="hud__panel" aria-label="Status">
        {lastClaim ? (
          <p className="hud__claim" role="status">
            <span aria-hidden>◈</span> {claimLine(lastClaim)}
          </p>
        ) : null}

        {released.length > 0 ? (
          <p className="hud__note hud__note--loss" role="status">
            The Void reclaims {released.length}{' '}
            {released.length === 1 ? 'warded cell' : 'warded cells'}
          </p>
        ) : null}

        {/* One grid: two columns on a phone, four where there is width for them.
            Stacking these as separate rows cost the map a tenth of the screen on a
            wide, short window for no reason other than markup. */}
        <div className="hud__stats">
          <div className="hud__stat">
            <span className="hud__label">Consciousness</span>
            <span className="hud__value es-numeric">
              {level.level} · {level.name}
            </span>
          </div>
          <div className="hud__stat">
            <span className="hud__label">Ley-line</span>
            <span className="hud__value es-numeric">{formatDistance(distanceM)}</span>
          </div>
          <div className="hud__stat">
            <span className="hud__label">Warded cells</span>
            <span className="hud__value es-numeric">
              {ownedCells}
              {ownedCells > 0 ? (
                <span className="hud__sub"> · {formatArea(ownedAreaM2)}</span>
              ) : null}
            </span>
          </div>
          <div className="hud__stat">
            <span className="hud__label">Strongest</span>
            <span className="hud__value es-numeric">{Math.round(strongest)}</span>
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

        {basemapVoid ? (
          <p className="hud__note" role="status">
            The streets are unreachable. Your line is still being drawn.
          </p>
        ) : null}

        {source === 'simulated' ? (
          <p className="hud__note hud__note--dev">Simulated walk · WASD</p>
        ) : null}

        {/* Signal and Withdraw share a row. The HUD has to leave the map most of the
            screen, and this game is read at a glance while walking. */}
        <div className="hud__foot">
          <p className="hud__signal" data-quality={q} role="status">
            <span className="hud__dot" aria-hidden />
            {signalLine(status, q, accuracyM, lastRejection)}
            {speedMs != null && q !== 'none' ? (
              <span className="hud__speed es-numeric"> · {msToKmh(speedMs).toFixed(1)} km/h</span>
            ) : null}
          </p>

          <RitualButton variant="ghost" className="hud__withdraw" onClick={onWithdraw}>
            Withdraw
          </RitualButton>
        </div>
      </GlassPanel>
    </div>
  );
}
