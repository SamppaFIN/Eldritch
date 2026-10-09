/**
 * Route playback, the dev panel (BRDC-SIM-002): pick a route — a built-in one, a GPX or
 * JSON file, or the walk in progress saved as a file — then play it through the game at
 * ×1 to ×60 and watch it claim, and whatever the route does on the way (BRDC-SIM-003).
 * Stop hands the position back to the phone.
 */
import { useState } from 'react';
import { RitualButton } from '@es3/ui';
import { routeDuration, routeJson } from '@es3/core/sim';
import type { RouteFault } from '@es3/core/sim';
import type { TrailPoint } from '@es3/core';
import { ROUTE_NAMES, SPEEDS } from './usePlayback.js';
import type { Playback } from './usePlayback.js';
import './playback.css';

const FAULT: Readonly<Record<RouteFault, string>> = {
  'not-gpx': 'Not a GPX file.',
  'not-json': 'Not a route: a GPX file, or JSON with a list of points.',
  'no-points': 'The file has no points in it.',
  'no-times': 'The track has no times — playback needs them to pace the walk.',
  'too-short': 'One point is not a walk. It needs two at least.',
};

const clock = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export interface PlaybackPanelProps {
  playback: Playback;
  /** The run in progress — what "Save this walk" writes out. */
  walked: readonly TrailPoint[];
  onClose: () => void;
}

export default function PlaybackPanel({ playback: pb, walked, onClose }: PlaybackPanelProps) {
  const [said, setSaid] = useState<string | null>(null);
  const route = pb.route;

  const readFile = (file: File | undefined) => {
    if (!file) return;
    void file.text().then((text) => {
      const fault = pb.loadText(text, file.name);
      setSaid(fault ? FAULT[fault] : null);
    });
  };

  const save = () => {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
    const blob = new Blob([routeJson({ name: `Walk ${stamp}`, points: [...walked] })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `walk-${stamp}.json`;
    // In the document, and the URL kept a moment: a detached anchor, or one revoked at
    // once, can leave the browser with nothing to save.
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };

  return (
    <section className="playback es-glass" aria-label="Route playback">
      <header className="playback__head">
        <h2 className="playback__title">Route playback</h2>
        <RitualButton variant="ghost" aria-label="Close" onClick={onClose}>
          ✕
        </RitualButton>
      </header>

      <div className="playback__row">
        <label className="playback__field">
          <span>Built-in</span>
          <select value="" onChange={(e) => e.target.value && void pb.loadFixture(e.target.value)}>
            <option value="">Choose…</option>
            {ROUTE_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="playback__field">
          <span>File (GPX or JSON)</span>
          <input type="file" accept=".gpx,.json,application/gpx+xml,application/json" onChange={(e) => readFile(e.target.files?.[0])} />
        </label>
        <RitualButton variant="ghost" disabled={walked.length < 2} onClick={save}>
          {`Save this walk · ${walked.length} points`}
        </RitualButton>
      </div>

      {said ? (
        <p className="playback__said" role="status">
          {said}
        </p>
      ) : null}

      {route ? (
        <>
          <p className="playback__route es-numeric">
            {route.name} · {route.points.length} points · {clock(routeDuration(route.points))}
          </p>
          <div className="playback__row" role="group" aria-label="Speed">
            {SPEEDS.map((s) => (
              <RitualButton key={s} variant={pb.speed === s ? 'primary' : 'ghost'} aria-pressed={pb.speed === s} onClick={() => pb.setSpeed(s)}>
                {`×${s}`}
              </RitualButton>
            ))}
          </div>
          <div className="playback__row">
            {pb.playing ? (
              <RitualButton onClick={pb.pause}>Pause</RitualButton>
            ) : (
              <RitualButton onClick={() => pb.play()}>{pb.done ? 'Play again' : pb.played > 0 ? 'Resume' : 'Play'}</RitualButton>
            )}
            <RitualButton variant="ghost" disabled={pb.played === 0} onClick={pb.stop}>
              Stop · back to GPS
            </RitualButton>
          </div>
          <progress className="playback__bar" max={pb.total || route.points.length} value={pb.played} aria-label="Played" />
          <p className="playback__route es-numeric" role="status">
            {pb.done ? `Done · ${pb.played} of ${pb.total}` : `${pb.played} of ${pb.total || route.points.length}`}
          </p>
          {/* What the route's actions did, refusals included (BRDC-SIM-003). */}
          {pb.log.length > 0 ? (
            <ol className="playback__log" aria-label="What the route did">
              {pb.log.slice(-8).map((line, i) => (
                <li key={`${pb.log.length}-${i}`} data-ok={line.startsWith('✓')}>
                  {line}
                </li>
              ))}
            </ol>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
