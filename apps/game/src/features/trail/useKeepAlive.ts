/**
 * Keeping the page alive while the phone is in a pocket.
 *
 * The problem this exists for, stated plainly: a backgrounded tab is frozen, a frozen
 * tab gets no GPS fixes, and a walk recorded with holes in it draws a border through
 * ground nobody walked. Opening the browser now and then produces exactly what it
 * looks like — a handful of correct points with straight lines between them.
 *
 * Two levers, and the browser gives us no third:
 *
 *   1. **Wake Lock** — the screen stays on, so the page stays foreground. Reliable, and
 *      useless the moment the phone goes face-down in a pocket.
 *   2. **Audio** — a page that is playing audio is exempt from Chrome's freezing and
 *      from intensive timer throttling. This is the one that survives a pocket. It is a
 *      lever the platform hands us sideways, not an API for this, and Android honours it
 *      far better than iOS does.
 *
 * Neither is a foreground service. Screen-off tracking that the OS actually guarantees
 * is Phase 5 (Capacitor) and this hook is why that phase exists.
 *
 * Audio playback must begin inside a user gesture, so this is started by a tap and
 * never automatically.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

type Sentinel = { release: () => Promise<void> };

export interface KeepAliveState {
  /** What the player asked for. */
  wanted: boolean;
  /** The screen is being held on. */
  screen: boolean;
  /** The audio loop is running — this is the one that survives a pocket. */
  audio: boolean;
  toggle: () => void;
}

/**
 * The Solfeggio chord the Vigil breathes.
 *
 * 396 · 528 · 639 Hz — the "liberation", "miracle" and "connection" tones. They are not
 * doing anything to the player; nobody can hear them at this amplitude. They are here
 * because the thing humming in your pocket for an hour should be part of the game's own
 * language rather than an arbitrary test tone, and because these three sit together as
 * something close to a major chord.
 *
 * Whole numbers of cycles fit exactly into one second, so the loop seam does not click.
 */
const SOLFEGGIO = [396, 528, 639];

/**
 * One second of that chord at roughly -60 dB, 8 kHz mono.
 *
 * Not pure silence: a silent track is a candidate for being treated as inaudible, and
 * the whole point is to look like playback. At this amplitude, times the element volume
 * below, it is far under anything a person can hear.
 */
function quietLoop(): string {
  const rate = 8_000;
  const samples = rate;
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i += 1) view.setUint8(offset + i, s.charCodeAt(i));
  };

  ascii(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, samples * 2, true);

  for (let i = 0; i < samples; i += 1) {
    const t = i / rate;
    let sample = 0;
    for (const hz of SOLFEGGIO) sample += Math.sin(t * hz * 2 * Math.PI);
    // Divided by the voice count, so three tones are no louder than one was.
    view.setInt16(44 + i * 2, Math.round((sample / SOLFEGGIO.length) * 24), true);
  }

  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export function useKeepAlive(): KeepAliveState {
  const [wanted, setWanted] = useState(false);
  const [screen, setScreen] = useState(false);
  const [audio, setAudio] = useState(false);

  const sentinel = useRef<Sentinel | null>(null);
  const element = useRef<HTMLAudioElement | null>(null);

  const holdScreen = useCallback(async () => {
    const api = (
      navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }
    ).wakeLock;
    if (!api) return;
    try {
      sentinel.current = await api.request('screen');
      setScreen(true);
    } catch {
      // Refused, or the document is hidden. The audio loop is the important half.
      setScreen(false);
    }
  }, []);

  const toggle = useCallback(() => {
    setWanted((on) => {
      if (on) return false;

      /*
       * Created and played here, inside the click, rather than in the effect below.
       * An effect runs after the gesture has ended and autoplay policy rejects it.
       */
      const el = element.current ?? new Audio(quietLoop());
      el.loop = true;
      el.volume = 0.02;
      element.current = el;
      void el
        .play()
        .then(() => setAudio(true))
        .catch(() => setAudio(false));

      return true;
    });
  }, []);

  useEffect(() => {
    if (!wanted) {
      void sentinel.current?.release();
      sentinel.current = null;
      element.current?.pause();
      setScreen(false);
      setAudio(false);
      return;
    }

    void holdScreen();

    /*
     * A wake lock is dropped whenever the page is hidden and is not restored on its own.
     * Without this, one glance at a message ends the lock for the rest of the walk and
     * nothing on screen says so. The audio element survives hiding; re-play it anyway,
     * because a system interruption — a call, another app taking audio focus — pauses it.
     */
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void holdScreen();
      if (element.current?.paused) void element.current.play().catch(() => setAudio(false));
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel.current?.release();
      sentinel.current = null;
    };
  }, [wanted, holdScreen]);

  // Never leave the loop running after the map screen is gone.
  useEffect(
    () => () => {
      element.current?.pause();
      void sentinel.current?.release();
    },
    [],
  );

  return { wanted, screen, audio, toggle };
}
