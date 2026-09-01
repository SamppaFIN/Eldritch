/**
 * The claim, felt: a short chime and a buzz the moment a loop takes new ground.
 *
 * `claude.md` §6 rule 6 parked procedural audio until a mechanic had somewhere to land
 * it — a claim is that mechanic (amended 2026-09-01). The chime is synthesised, not an
 * asset: two notes off one `AudioContext`, no file to bundle or license, no CDN.
 *
 * iOS Safari has no Vibration API; `navigator.vibrate?.(…)` no-ops there, which is
 * correct — the target device is Android (`claude.md` §2).
 */
import { useEffect, useRef } from 'react';
import type { ClaimEvent } from '../territory/useTerritory.js';
import type { Settings } from './settings.js';
import { isRewardClaim } from './claimFeedback.js';

export function useClaimFeedback(lastClaim: ClaimEvent | null, settings: Settings): void {
  const announced = useRef(0);

  useEffect(() => {
    if (!lastClaim || lastClaim.at === announced.current) return;
    announced.current = lastClaim.at;
    if (!isRewardClaim(lastClaim.outcomes)) return;

    if (settings.vibration) navigator.vibrate?.([40, 30, 40]);
    if (settings.sound) playChime();
  }, [lastClaim, settings.sound, settings.vibration]);
}

/** An ascending two-note chime. Best-effort: a browser that blocks audio just stays quiet. */
function playChime(): void {
  try {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const start = ctx.currentTime;
    for (const [freq, delay] of [
      [880, 0],
      [1318.5, 0.09],
    ] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      const t0 = start + delay;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.start(t0);
      osc.stop(t0 + 0.5);
    }
    setTimeout(() => void ctx.close(), 900);
  } catch {
    /* audio unavailable — silence is an acceptable outcome */
  }
}
