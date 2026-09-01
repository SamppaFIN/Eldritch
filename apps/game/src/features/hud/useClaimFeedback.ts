/**
 * The claim, felt: a bright chime and a buzz the moment a loop takes new ground.
 *
 * `claude.md` §6 rule 6 parked procedural audio until a mechanic had somewhere to land
 * it — a claim is that mechanic (amended 2026-09-01). The chime is synthesised, not an
 * asset: a few notes off one `AudioContext`, no file to bundle or license, no CDN. New
 * ground gets a rising major arpeggio; ground taken from a rival gets a fuller, lower
 * one.
 *
 * iOS Safari has no Vibration API; `navigator.vibrate?.(…)` no-ops there, which is
 * correct — the target device is Android (`claude.md` §2).
 */
import { useEffect, useRef } from 'react';
import type { ClaimEvent } from '../territory/useTerritory.js';
import type { Settings } from './settings.js';

export function useClaimFeedback(lastClaim: ClaimEvent | null, settings: Settings): void {
  const announced = useRef(0);

  useEffect(() => {
    if (!lastClaim || lastClaim.at === announced.current) return;
    announced.current = lastClaim.at;

    const kinds = lastClaim.outcomes.map((o) => o.kind);
    const took = kinds.includes('taken');
    const claimed = kinds.includes('claimed');
    if (!took && !claimed) return;

    if (settings.vibration) navigator.vibrate?.(took ? [50, 40, 60] : [40, 30, 40]);
    if (settings.sound) playChime(took ? 'taken' : 'claimed');
  }, [lastClaim, settings.sound, settings.vibration]);
}

/** Best-effort: a browser that blocks audio just stays quiet. */
export function playChime(kind: 'claimed' | 'taken'): void {
  try {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const start = ctx.currentTime;
    // C–E–G major triad rising; the steal version drops an octave and adds the low G.
    const notes =
      kind === 'taken'
        ? [261.6, 329.6, 392.0, 523.3]
        : [523.3, 659.3, 784.0];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      const t0 = start + i * 0.08;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.24, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      osc.start(t0);
      osc.stop(t0 + 0.45);
    });
    setTimeout(() => void ctx.close(), 1000);
  } catch {
    /* audio unavailable — silence is an acceptable outcome */
  }
}
