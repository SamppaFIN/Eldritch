/**
 * The Vigil — the control that decides whether your border is true.
 *
 * A browser freezes a page the moment it is backgrounded, and a frozen page gets no GPS
 * fixes. Pocket the phone and the game keeps only the handful of moments you happened to
 * be looking at it; the border it draws afterwards runs through streets you never walked.
 *
 * The Vigil holds the page awake. It costs battery, so it is the player's decision — but
 * it is presented as the thing that makes the map honest, not as a settings toggle, and
 * the readout says which half of it is actually holding.
 */
import { RitualButton } from '@es3/ui';
import type { KeepAliveState } from '../trail/useKeepAlive.js';

export interface VigilProps {
  keepAlive: KeepAliveState;
  /** Time already lost to a frozen page this run. */
  unobservedMs: number;
}

function minutes(ms: number): string {
  const m = Math.round(ms / 60_000);
  return m < 1 ? 'under a minute' : `${m} min`;
}

/**
 * What is actually true right now, in one line.
 *
 * "audio" is deliberately named rather than hidden behind a green dot: when it is the
 * half that is holding, the phone can go in a pocket, and when it is not, it cannot.
 */
function vigilLine(state: KeepAliveState): string {
  if (!state.wanted) return 'Vigil sleeping — pocket the phone and the line breaks';
  if (state.audio && state.screen) return 'Vigil holds · screen and breath';
  if (state.audio) return 'Vigil holds · the breath alone';
  if (state.screen) return 'Vigil holds · screen only — keep it lit';
  return 'Vigil could not take hold — keep the screen on';
}

export function Vigil({ keepAlive, unobservedMs }: VigilProps) {
  return (
    <div className="vigil">
      <RitualButton
        variant={keepAlive.wanted ? 'primary' : 'ghost'}
        className="vigil__toggle"
        onClick={keepAlive.toggle}
        aria-pressed={keepAlive.wanted}
        aria-label="Vigil — keep recording while the phone is pocketed"
      >
        <span aria-hidden>{keepAlive.wanted ? '◉' : '○'}</span> Vigil
      </RitualButton>

      <p className="vigil__state" data-holding={keepAlive.audio || keepAlive.screen} role="status">
        {vigilLine(keepAlive)}
        {unobservedMs > 0 ? (
          <span className="vigil__lost"> · {minutes(unobservedMs)} unseen</span>
        ) : null}
      </p>
    </div>
  );
}
