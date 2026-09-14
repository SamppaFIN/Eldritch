/**
 * Importing a recorded walk (BRDC-GPX-001).
 *
 * The same sheet as the Codex and the ledger. It says what the file was, what the game
 * accepted, and — when something was thrown out — why, because a track that half-lands
 * with no explanation is the kind of thing a player decides is broken.
 */
import { useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import { NewLands } from './NewLands.js';
import type { Collected, GameRepository, RejectReason } from '@es3/core';
import { useEscape } from '../hud/useEscape.js';
import { useGpxImport } from './useGpxImport.js';
import './gpx-panel.css';

const FAULT: Readonly<Record<string, string>> = {
  'not-gpx': 'That is not a GPX file.',
  'no-points': 'That track has no points in it.',
  'no-times': 'That track has no timestamps. Without them there is no way to tell walking from driving.',
  'no-repository': 'The game is still opening. Try again in a moment.',
};

/** Errors say what to do, not what failed (AI-Koulu ch.3). */
const REJECTED: Readonly<Record<RejectReason, string>> = {
  accuracy: 'too rough to trust',
  speed: 'faster than walking',
  interval: 'too close together in time',
  consolidated: 'standing still',
};

export interface GpxPanelProps {
  open: boolean;
  repository: GameRepository | null;
  now: () => number;
  afterImport: () => void;
  /** A payout from a reveal here, for the one toast the map owns. */
  onGain: (collected: Collected) => void;
  onClose: () => void;
}

export function GpxPanel({ open, repository, now, afterImport, onGain, onClose }: GpxPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const { state, importFile, reset } = useGpxImport(repository, now, afterImport);
  useEscape(open, onClose);

  if (!open) return null;

  return (
    <GlassPanel as="section" ref={panelRef} className="gpx" aria-label="Import a walk" tabIndex={-1}>
      <div className="gpx__bar">
        <h2 className="gpx__title">Import a walk</h2>
        <RitualButton variant="ghost" className="gpx__close" onClick={onClose} aria-label="Close">
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      <p className="gpx__note">
        A track from a watch or a tracker is walked into the game exactly as if you had
        walked it now: the same ground is taken, and the same points are thrown out.
      </p>

      <label className="gpx__file">
        {state.status === 'reading' ? 'Reading…' : 'Choose a .gpx file'}
        <input
          type="file"
          accept=".gpx,application/gpx+xml,text/xml"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importFile(file);
          }}
        />
      </label>

      {state.status === 'failed' ? (
        <p className="gpx__fault" role="status">
          {FAULT[state.fault] ?? 'That file could not be read.'}
        </p>
      ) : null}

      {state.status === 'done' ? (
        <div className="gpx__result" role="status">
          <p className="gpx__line es-numeric">
            {state.points} points read · <strong>{state.result.accepted} walked</strong> ·{' '}
            {Math.round(state.result.distanceM)} m
          </p>
          {state.result.rejected.length > 0 ? (
            <ul className="gpx__rejected">
              {state.result.rejected.map((r) => (
                <li key={r.reason} className="es-numeric">
                  {r.count} {REJECTED[r.reason]}
                </li>
              ))}
            </ul>
          ) : null}
          {/*
            * Why a track can land in full and win nothing (BRDC-GPX-003).
            *
            * Reported: "importista tulleet heksat eivät tulleet mulle". The rule is
            * working — an imported walk claims by the same adjacency rule feet do, so a
            * track recorded away from the player's realm touches nothing it may take —
            * but the panel said "38 walked" and then went quiet, which reads as a broken
            * import rather than as a rule. Same reason the rejected list above exists.
            */}
          {state.result.outOfReach > 0 ? (
            <p className="gpx__reach">
              <strong className="es-numeric">
                {state.result.outOfReach}{' '}
                {state.result.outOfReach === 1 ? 'hex was' : 'hexes were'} out of reach.
              </strong>{' '}
              Ground has to touch ground you already hold — the same rule your own feet
              follow, and what stops a stray fix founding a realm across town. A track that
              passes your own ground takes everything along it.
            </p>
          ) : null}

          {/* The ground the track won, gone through at the player's own pace
              (BRDC-GPX-002). Before this an import said "38 walked" and stopped, leaving
              thirty-eight unrevealed hexes and nothing to do about them. */}
          <NewLands
            hexes={state.result.grown.filter((g) => g.kind === 'claimed').map((g) => g.h3)}
            repository={repository}
            now={now}
            onGain={onGain}
            afterReveal={afterImport}
          />
          <RitualButton variant="ghost" className="gpx__again" onClick={reset}>
            Import another
          </RitualButton>
        </div>
      ) : null}
    </GlassPanel>
  );
}
