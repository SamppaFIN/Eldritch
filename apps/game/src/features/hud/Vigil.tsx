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
}

function minutes(ms: number): string {
  const m = Math.round(ms / 60_000);
  return m < 1 ? 'under a minute' : `${m} min`;
}

/**
 * What is actually true right now, in a few words.
 *
 * "breath" is deliberately named rather than hidden behind a green dot: when the audio
 * loop is the half that is holding, the phone can go in a pocket, and when it is not, it
 * cannot. The player has no other way to know which.
 *
 * Said as a clause rather than a sentence, because it is appended to the signal readout.
 * Vigil and signal answer the same question — how well is the game seeing you — and the
 * panel had no room to ask it twice: its own row cost the map six per cent of a phone.
 */
export function vigilLine(state: KeepAliveState, unobservedMs: number): string {
  const held = !state.wanted
    ? 'Vigil asleep'
    : state.audio && state.screen
      ? 'Vigil holds'
      : state.audio
        ? 'Vigil holds · breath'
        : state.screen
          ? 'Vigil holds · screen only'
          : 'Vigil would not hold';

  return unobservedMs > 0 ? `${held} · ${minutes(unobservedMs)} unseen` : held;
}

/** The toggle alone. It lives in the HUD's actions row with the other controls. */
export function Vigil({ keepAlive }: VigilProps) {
  return (
    <RitualButton
      variant={keepAlive.wanted ? 'primary' : 'ghost'}
      className="vigil__toggle"
      onClick={keepAlive.toggle}
      aria-pressed={keepAlive.wanted}
      aria-label="Vigil — keep recording while the phone is pocketed"
      title="Vigil — keep recording while the phone is pocketed"
    >
      <span aria-hidden>{keepAlive.wanted ? '◉' : '○'}</span>
    </RitualButton>
  );
}
