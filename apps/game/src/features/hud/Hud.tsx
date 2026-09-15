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
import { RESOURCE_KINDS, levelState, msToKmh, spellRemaining } from '@es3/core';
import type { ActiveSpell, PlayerProfile, RejectReason, ResourcePool } from '@es3/core';
import { GlassPanel } from '@es3/ui';
import type { GeoStatus, PositionSource } from '../trail/usePositionSource.js';
// The same law the Codex reads its figures from (BRDC-KEEP-008) — this used to keep its
// own copy, at a different precision than the Keep's own area line said for the same land.
import { formatArea, formatDistance } from '../codex/figures.js';
import { RESOURCE_COLOUR } from '../territory/territoryFeatures.js';
import type { ClaimEvent } from '../territory/useTerritory.js';
import type { KeepAliveState } from '../trail/useKeepAlive.js';
import { Vigil, vigilLine } from './Vigil.js';
import { HudNav } from './HudNav.js';
import { HudClaim } from './HudClaim.js';
import { useClaimFeedback } from './useClaimFeedback.js';
import type { Settings } from './settings.js';
import type { HelpTopic } from '../help/help.js';
import './hud.css';
import './hud-sheet.css';

export interface HudProps {
  /**
   * A sheet is covering the map, so the HUD drops to the walking bar (BRDC-HUD-005).
   *
   * The stats answer "how am I doing while walking". With a panel open the player is
   * reading that panel, and the readout is just height taken off what they came to read —
   * on a phone the two together left almost no room. The nav buttons stay, because
   * switching screens is the one thing still wanted.
   */
  compact?: boolean;
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
  now?: number; // game clock, for a spell's remaining time
  /** True once the game knows which cell the player is standing in. */
  standing?: boolean;
  onInspectHere?: () => void;
  onCollect?: () => void; // take the hour's trickle — a readout, not a payout (BRDC-ECON-007)
  unobservedMs?: number;
  settings: Settings;
  /** A quest landmark that just appeared on the map (BRDC-QUEST-002), or null. */
  waypoint?: string | null;
  onWaypointSeen?: () => void;
  onOpenCharacter?: () => void;
  /** Back to the map from the nav bar, when a sheet is covering it (Sigil screen 02). */
  onShowMap?: (() => void) | undefined;
  /** Opens the Keep — buildings and mana — from anywhere, not just its marker (BRDC-KEEP-003). */
  onOpenKeep?: (() => void) | undefined;
  onOpenResearch?: () => void;
  /** Opens a codex entry (BRDC-WIKI-001). */
  onHelp?: (topic: HelpTopic) => void;
  /** Opens the action log — the claim line is the way in (BRDC-LOG-001). */
  onOpenLog?: () => void;
}

/** Hours, said the way a person would say them. */
function formatHours(hours: number): string {
  if (hours <= 1) return 'under an hour';
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'a day' : `${days} days`;
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
      return 'Location refused — check your browser settings';
    case 'unavailable':
      return 'No location available from this browser';
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

/**
 * Nothing yet, said as nothing.
 *
 * A row of zeroes is the first thing a new player reads, and it says "this is broken"
 * rather than "you have not started". An em dash says the second one — and it sidesteps
 * Orbitron's slashed zero, which at HUD size is the least legible glyph in the face.
 */
const EMPTY = '—';

export function Hud({
  compact = false,
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
  onCollect,
  unobservedMs = 0,
  settings,
  waypoint = null,
  onWaypointSeen,
  onOpenCharacter,
  onShowMap,
  onOpenKeep,
  onOpenResearch,
  onHelp,
  onOpenLog,
}: HudProps) {
  const level = levelState(profile?.xp ?? 0);
  const q = quality(status, accuracyM);

  useClaimFeedback(lastClaim, settings);

  // The footer publishes its live height so top-docked panels cap just above it — a
  // fixed guess strands tall cards behind the shrinking/growing HUD (BRDC-MOBILE-001).
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
    <div className="hud" data-compact={compact || undefined} ref={hudRef}>
      {/* Outside the panel on purpose — it is a notice, and it must not grow the HUD. */}
      <HudClaim lastClaim={lastClaim} onOpenLog={onOpenLog} />
      <GlassPanel as="section" className="hud__panel" aria-label="Status">

        {fading > 0 ? (
          <p className="hud__note hud__note--warn" role="status">
            {fading} {fading === 1 ? 'cell fades' : 'cells fade'}
            {fadingInHours !== null ? ` in ${formatHours(fadingInHours)}` : ''} — the blight is on them, walk them
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

        {waypoint ? (
          <button type="button" className="hud__note hud__waypoint" aria-live="polite" onClick={onWaypointSeen}>
            <span aria-hidden>✦</span> New waypoint · {waypoint} — walk there
          </button>
        ) : null}

        {/*
          * Two figures, not four (Sigil screen 02).
          *
          * The document gives the sheet one line: who you are on the left, how much ground
          * you hold on the right. Ley-line moved into the signal line, which is already the
          * sentence about how the walk is going — four stats in a grid was a dashboard, and
          * a dashboard is read rather than glanced at.
          */}
        <div className="hud__figures">
          <div className="hud__figure">
            <span className="hud__label">Consciousness</span>
            <span className="hud__value hud__value--level">
              {level.level} · {level.name}
            </span>
          </div>
          <div className="hud__figure hud__figure--end">
            <span className="hud__label">Warded</span>
            <span className="hud__value hud__value--warded es-numeric">
              {ownedCells > 0 ? ownedCells : EMPTY}
              {ownedCells > 0 ? (
                <span className="hud__sub"> · {formatArea(ownedAreaM2)}</span>
              ) : null}
            </span>
          </div>
        </div>

        {/* The pouch as chips: a dot in the resource's own colour and the number beside it.
            The colour law makes this scannable at walking pace (Sigil §01). */}
        {resources && RESOURCE_KINDS.some((k) => resources[k] > 0) ? (
          <div className="hud__pouch hud__value--pouch">
            {RESOURCE_KINDS.filter((k) => resources[k] > 0).map((k) => (
              <span key={k} className="hud__chip" style={{ color: RESOURCE_COLOUR[k] }}>
                <span className="hud__pip" style={{ background: RESOURCE_COLOUR[k] }} aria-hidden />
                {resources[k]}
              </span>
            ))}
          </div>
        ) : null}

        {/*
          * Collect, and only Collect.
          *
          * The document's sheet pairs it with a HERE button while also drawing HERE in the
          * nav bar below. Built as drawn, that is two controls with one name on one screen
          * — ambiguous to a screen reader and a strict-mode violation in the tests, which
          * is the same complaint said twice. Here is a destination, so it lives in the nav
          * with the other destinations, and Collect takes the width it was already the
          * primary of.
          */}
        {onCollect ? (
          <div className="hud__do">
            <button type="button" className="hud__collect" onClick={onCollect}>
              Collect
            </button>
          </div>
        ) : null}

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
              {/* The ley-line's length. It left the figures when the document cut the sheet
                  to two, and it belongs here: this line is already the sentence about how
                  the walk is going, and distance walked is part of that answer. */}
              {distanceM >= 1 ? (
                <span className="hud__speed es-numeric"> · {formatDistance(distanceM)}</span>
              ) : null}
              {/* Vigil answers the same question as the signal — how well is the game
                  seeing you — so it says so in the same breath rather than in a row of
                  its own, which cost the map six per cent of a phone screen. */}
              <span className="hud__vigil-state" data-holding={keepAlive.audio || keepAlive.screen}>
                {' · '}
                {vigilLine(keepAlive, unobservedMs)}
              </span>
              {keepAlive.wanted && onHelp ? (
                <>
                  {' · '}
                  <button
                    type="button"
                    className="hud__help-link"
                    onClick={() => onHelp('vigil')}
                  >
                    what is this?
                  </button>
                </>
              ) : null}
            </span>
          </p>

          {/* Vigil is a setting about recording, not a destination — it stays with the
              readout it belongs to, and navigation moved to its own bar below. */}
          <div className="hud__actions">
            <Vigil keepAlive={keepAlive} />
          </div>
        </div>
      </GlassPanel>

      {/* Its own glass bar, the way the document draws it (Sigil screen 02). */}
      <HudNav
        covered={compact}
        onShowMap={onShowMap}
        onInspectHere={standing ? onInspectHere : undefined}
        onOpenKeep={onOpenKeep}
        onOpenResearch={onOpenResearch}
        onOpenCharacter={onOpenCharacter}
      />
    </div>
  );
}
