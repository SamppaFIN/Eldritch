/**
 * The walk player on the map (BRDC-APK-001): a recorded walk playing, and the controls to
 * watch it — pause, the pace, stop. The map follows the walker and the ground is taken as
 * it goes; this only says where in the walk you are. Shown while a walk is loaded and
 * under way, and once at its end.
 */
import { RitualButton } from '@es3/ui';
import type { Playback } from './usePlayback.js';
import './walk-player.css';

const PACES = [5, 20, 60] as const;

export function WalkPlayer({ playback: pb }: { playback: Playback }) {
  const route = pb.route;
  if (!route || (!pb.playing && pb.played === 0 && !pb.done)) return null;
  const share = pb.total > 0 ? Math.min(1, pb.played / pb.total) : 0;

  return (
    <section className="walk-player" aria-label="Walk playing">
      <p className="walk-player__line">
        <strong>{route.name}</strong>
        <span className="es-numeric"> · {pb.done ? 'played through' : `${Math.round(share * 100)} %`}</span>
      </p>
      <div className="walk-player__bar" aria-hidden>
        <div className="walk-player__fill" style={{ inlineSize: `${share * 100}%` }} />
      </div>
      <div className="walk-player__controls">
        {pb.done ? null : pb.playing ? (
          <RitualButton variant="ghost" onClick={pb.pause}>
            Pause
          </RitualButton>
        ) : (
          <RitualButton variant="ghost" onClick={() => pb.play()}>
            Play
          </RitualButton>
        )}
        {pb.done
          ? null
          : PACES.map((s) => (
              <RitualButton key={s} variant={pb.speed === s ? 'primary' : 'ghost'} aria-pressed={pb.speed === s} onClick={() => pb.setSpeed(s)}>
                ×{s}
              </RitualButton>
            ))}
        <RitualButton variant="ghost" onClick={pb.stop}>
          {pb.done ? 'Close' : 'Stop'}
        </RitualButton>
      </div>
    </section>
  );
}
