/**
 * One short bright blip (BRDC-QUEST-002).
 *
 * Smaller sibling of the claim chime in `useClaimFeedback.ts`: a single triangle note off
 * one `AudioContext`, no asset, no CDN. For the moments a reward or a new waypoint appears
 * and the eye might be on the road, not the screen. Best-effort — a browser that blocks
 * audio just stays quiet.
 */
export function playPling(): void {
  try {
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t0);
    osc.frequency.exponentialRampToValueAtTime(1174, t0 + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
    osc.start(t0);
    osc.stop(t0 + 0.34);
    setTimeout(() => void ctx.close(), 800);
  } catch {
    /* audio unavailable — silence is fine */
  }
}
