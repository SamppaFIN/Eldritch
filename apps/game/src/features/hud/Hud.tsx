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
import { useEffect, useRef } from 'react';
import { levelState, msToKmh, spellRemaining } from '@es3/core';
import type { ActiveSpell, PlayerProfile, RejectReason, ResourcePool } from '@es3/core';
import { GlassPanel, RitualButton } from '@es3/ui';
import type { GeoStatus, PositionSource } from '../trail/usePositionSource.js';
import type { ClaimEvent } from '../territory/useTerritory.js';
import type { KeepAliveState } from '../trail/useKeepAlive.js';
import { Vigil, vigilLine } from './Vigil.js';
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
  lastClaim?: ClaimEvent | null;
  fading?: number;
  fadingInHours?: number | null;
  released?: string[];
  keepAlive: KeepAliveState;
  resources?: ResourcePool | null;
  /** Running spells, for the rite readout (BRDC-SPELL-001). */
  spells?: readonly ActiveSpell[];
  /** Game clock, so a spell's remaining time can be shown. */
  now?: number;
  /** True once the game knows which cell the player is standing in. */
  standing?: boolean;
  onInspectHere?: () => void;
  unobservedMs?: number;
  onWithdraw: () => void;
  onReset: () => void;
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

/** Hours, said the way a person would say them. */
function formatHours(hours: number): string {
  if (hours <= 1) return 'under an hour';
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'a day' : `${days} days`;
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
  if (q === 'weak') return `Signal uncertain · ±${Math.round(accuracyM ?? 0)} m`;
  return `Signal clear · ±${Math.round(accuracyM ?? 0)} m`;
}

function formatDistance(m: number): string {
  if (m < 1) return EMPTY;
  return m < 1_000 ? `${Math.round(m)} m` : `${(m / 1_000).toFixed(2)} km`;
}

/**
 * Nothing yet, said as nothing.
 *
 * A row of zeroes is the first thing a new player reads, and it says "this is broken"
 * rather than "you have not started". An em dash says the second one — and it sidesteps
 * Orbitron's slashed zero, which at HUD size is the least legible glyph in the face.
 */
const EMPTY = '—';

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
  lastClaim = null,
  fading = 0,
  fadingInHours = null,
  released = [],
  keepAlive,
  resources = null,
  spells = [],
  now = 0,
  standing = false,
  onInspectHere,
  unobservedMs = 0,
  onWithdraw,
  onReset,
}: HudProps) {
  const level = levelState(profile?.xp ?? 0);
  const q = quality(status, accuracyM);

  /*
   * Publish the footer's real height so the top-docked panels (cell, Hearth) can cap
   * themselves just above it and stay fully scrollable. The HUD grows and shrinks —
   * claim lines, fade warnings, the rite readout — so a fixed guess would leave the
   * bottom of a tall detail card stranded behind the glass.
   */
  const hudRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = hudRef.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty('--hud-height', `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--hud-height');
    };
  }, []);
  const spellLine = spells
    .map((s) => {
      const h = Math.round(spellRemaining(s, now) / 3_600_000);
      const name = s.id[0]?.toUpperCase() + s.id.slice(1);
      return h >= 1 ? `${name} · ${h} h` : name;
    })
    .join(' · ');

  return (
    <div className="hud" ref={hudRef}>
      <GlassPanel as="section" className="hud__panel" aria-label="Status">
        {lastClaim ? (
          <p className="hud__claim" role="status">
            <span aria-hidden>◈</span> {claimLine(lastClaim)}
          </p>
        ) : null}

        {fading > 0 ? (
          <p className="hud__note hud__note--warn" role="status">
            {fading} {fading === 1 ? 'cell fades' : 'cells fade'}
            {fadingInHours !== null ? ` in ${formatHours(fadingInHours)}` : ''} — walk them
          </p>
        ) : null}

        {released.length > 0 ? (
          <p className="hud__note hud__note--loss" role="status">
            The Void reclaims {released.length}{' '}
            {released.length === 1 ? 'warded cell' : 'warded cells'}
          </p>
        ) : null}

        {spellLine ? (
          <p className="hud__note" role="status">
            <span aria-hidden>◇</span> {spellLine}
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
              {ownedCells > 0 ? ownedCells : EMPTY}
              {ownedCells > 0 ? (
                <span className="hud__sub"> · {formatArea(ownedAreaM2)}</span>
              ) : null}
            </span>
          </div>
          {/*
            The pouch sits in the grid rather than in a row of its own.
            
            Its own row cost the map four per cent of a phone screen, and this panel has
            a hard budget: thirty per cent, tested. What it replaces is "Strongest",
            which was the least actionable number here — you cannot do anything with it,
            and you can spend timber.
          */}
          <div className="hud__stat">
            <span className="hud__label">Pouch</span>
            <span className="hud__value es-numeric">
              {resources &&
              resources.food + resources.wood + resources.gold + resources.mana > 0 ? (
                <span className="hud__pouch">
                  <span className="hud__pip hud__pip--food" aria-hidden />
                  {resources.food}
                  <span className="hud__pip hud__pip--wood" aria-hidden />
                  {resources.wood}
                  <span className="hud__pip hud__pip--gold" aria-hidden />
                  {resources.gold}
                  {resources.mana > 0 ? (
                    <>
                      <span className="hud__pip hud__pip--mana" aria-hidden />
                      {resources.mana}
                    </>
                  ) : null}
                </span>
              ) : (
                EMPTY
              )}
            </span>
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
            {/* One text item, not three. Bare text inside a flex container becomes an
                anonymous flex item and wraps on its own, which turned
                "Signal clear · ±8 m · 23.8 km/h" into scrambled fragments. */}
            <span className="hud__signal-text">
              {signalLine(status, q, accuracyM, lastRejection)}
              {speedMs != null && q !== 'none' ? (
                <span className="hud__speed es-numeric"> · {msToKmh(speedMs).toFixed(1)} km/h</span>
              ) : null}
              {/* Vigil answers the same question as the signal — how well is the game
                  seeing you — so it says so in the same breath rather than in a row of
                  its own, which cost the map six per cent of a phone screen. */}
              <span className="hud__vigil-state" data-holding={keepAlive.audio || keepAlive.screen}>
                {' · '}
                {vigilLine(keepAlive, unobservedMs)}
              </span>
            </span>
          </p>

          <div className="hud__actions">
            <Vigil keepAlive={keepAlive} />
            {/*
              The one verb a walking player needs, sharing the row rather than taking one.

              It is also the keyboard path onto the map: selecting a hexagon by tapping it
              is a pointer gesture with no equivalent, and the cell under your feet is the
              one you most want anyway. A button makes both true at once.
            */}
            {standing && onInspectHere ? (
              <RitualButton variant="ghost" className="hud__here" onClick={onInspectHere}>
                <span aria-hidden>⬢</span> Here
              </RitualButton>
            ) : null}
            <RitualButton
              variant="ghost"
              className="hud__icon-btn"
              onClick={onReset}
              aria-label="Return everything to the Void"
              title="Return everything to the Void"
            >
              <span aria-hidden>⬡</span>
            </RitualButton>
            <RitualButton variant="ghost" className="hud__withdraw" onClick={onWithdraw}>
              Withdraw
            </RitualButton>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
