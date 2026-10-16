/**
 * Importing a recorded walk (BRDC-GPX-001).
 *
 * The same sheet as the Codex and the ledger. It says what the file was, what the game
 * accepted, and — when something was thrown out — why, because a track that half-lands
 * with no explanation is the kind of thing a player decides is broken.
 */
import { useRef, useState } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import { NewLands } from './NewLands.js';
import { parseGpx } from '@es3/core';
import type { Collected, GameRepository, RejectReason } from '@es3/core';
import { useEscape } from '../hud/useEscape.js';
import { useGpxImport } from './useGpxImport.js';
import './gpx-panel.css';

const FAULT: Readonly<Record<string, string>> = {
  'not-gpx': 'That is not a GPX file.',
  'no-points': 'That track has no points in it.',
  'no-times': 'That track has no timestamps. Without them there is no way to tell walking from driving.',
  'no-repository': 'The game is still opening. Try again in a moment.',
  'too-short': 'One point is not a walk. It needs two at least.',
  'not-json': 'That is not a GPX file.',
};

/** How fast a walk plays on the map (BRDC-APK-001): an hour's walk is twelve, three or one minute. */
const PLAY_SPEEDS = [5, 20, 60] as const;

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
  /** Play the walk on the map at `speed` (BRDC-APK-001); the fault's name if it cannot. */
  onPlay?: ((text: string, name: string, speed: number) => string | null) | undefined;
  onClose: () => void;
}

export function GpxPanel({ open, repository, now, afterImport, onGain, onPlay, onClose }: GpxPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const { state, importText, reset } = useGpxImport(repository, now, afterImport);
  // The file read once, then played on the map or walked in at once (BRDC-APK-001).
  const [picked, setPicked] = useState<{ text: string; name: string } | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const play = (speed: number) => {
    if (!picked || !onPlay) return;
    const fault = onPlay(picked.text, picked.name, speed);
    if (fault) setSaid(FAULT[fault] ?? 'That walk cannot be played.');
    else {
      setPicked(null);
      onClose();
    }
  };
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
        A walk from a watch, a tracker or the pocket app. Play it on the map and watch the
        ground being taken, or walk it in all at once — the same ground either way.
      </p>

      <label className="gpx__file">
        {state.status === 'reading' ? 'Reading…' : 'Choose a .gpx file'}
        <input
          type="file"
          accept=".gpx,application/gpx+xml,text/xml"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            reset();
            setSaid(null);
            void file.text().then((text) => {
              // A file that is no walk says so now, before it is offered to be played.
              const parsed = parseGpx(text);
              if (parsed.ok) setPicked({ text, name: file.name.replace(/\.gpx$/i, '') });
              else {
                setPicked(null);
                setSaid(FAULT[parsed.fault] ?? 'That file could not be read.');
              }
            });
          }}
        />
      </label>

      {picked && state.status === 'idle' ? (
        <div className="gpx__choice" role="group" aria-label="What to do with the walk">
          <p className="gpx__line">
            <strong>{picked.name}</strong>
          </p>
          {onPlay ? (
            <div className="gpx__speeds">
              {PLAY_SPEEDS.map((s) => (
                <RitualButton key={s} onClick={() => play(s)}>
                  Play ×{s}
                </RitualButton>
              ))}
            </div>
          ) : null}
          <RitualButton variant="ghost" onClick={() => importText(picked.text)}>
            Walk it in at once
          </RitualButton>
        </div>
      ) : null}

      {said ? (
        <p className="gpx__fault" role="status">
          {said}
        </p>
      ) : null}

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
            * Reported: "importista tulleet heksat eivät tulleet mulle". Since BRDC-GPX-005 an
            * import is standalone — a walk recorded away from the realm takes its own path —
            * so what is left out of reach is only what a long gap in the track cut off.
            */}
          {state.result.outOfReach > 0 ? (
            <p className="gpx__reach">
              <strong className="es-numeric">
                {state.result.outOfReach}{' '}
                {state.result.outOfReach === 1 ? 'hex was' : 'hexes were'} out of reach.
              </strong>{' '}
              A long gap in the track breaks its path: what lies past the gap had nothing of
              the walk to touch. The rest of the walk is yours, wherever it was walked.
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
