import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { load, loadWith, remove, saveNow } from '@es3/core';
import type { GameMode, LatLng } from '@es3/core';
import { GlassPanel } from '@es3/ui';
import { TitleScreen } from './TitleScreen.js';
import { Hearth } from '../features/hearth/Hearth.js';
import { ModeSelect } from '../features/mode/ModeSelect.js';
import './mapview.css';

/**
 * MapLibre is ~1.2 MB. The title screen must not pay for it: LCP budget is 2.5 s and
 * this game is opened on mobile data, outdoors, by someone about to start walking.
 */
const MapView = lazy(async () => ({ default: (await import('./MapView.js')).MapView }));

type View = 'title' | 'mode' | 'hearth' | 'map';

interface Session {
  startedAt: number;
}

/**
 * The accepted Hearth, kept here rather than only in IndexedDB.
 *
 * App has no repository of its own — MapView opens it — and this is the one question it
 * has to answer before deciding which screen to show. MapView writes the real thing
 * through `setHome` on boot; this is the note that says the player has already agreed.
 */
interface HearthMark {
  position: LatLng;
  at: number;
}

/** The chosen mode, same shape of note as `HearthMark` — MapView's `useBoot` reads this
 *  once to seed the profile through `setMode` (BRDC-MODE-001). Chosen before the
 *  Hearth, since it changes nothing about the Hearth screen itself. */
interface ModeMark {
  mode: GameMode;
}

/**
 * Where to go next, given only what has been agreed to so far.
 *
 * Mode comes before the Hearth: it changes nothing about founding one, so asking
 * afterwards would just be a second interruption. Shared between resuming a session
 * and starting fresh — both are "a session can outlive the question it never asked"
 * (the Hearth's own reasoning below), now with two questions instead of one. A plain
 * function, not a hook: it closes over nothing but localStorage, read fresh every call.
 */
function nextView(): View {
  if (!load<ModeMark | null>('mode', null)) return 'mode';
  return load<HearthMark | null>('hearth', null) ? 'map' : 'hearth';
}

/**
 * Deterministic boot. No event bus, no ordering by luck.
 *
 * v2 initialised through EventBus and spawned entities before the map was listening,
 * so shrines silently never appeared. Here the sequence is a plain `await` chain and
 * every child waits on an explicit ready flag.
 */
export function App() {
  const [view, setView] = useState<View>('title');
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    const { value, outcome } = loadWith<Session | null>('session', null);

    /*
     * Resume straight into the walk.
     *
     * A phone reloads a PWA whenever it feels like reclaiming memory, and it does that
     * most readily when the screen has been off in a pocket for ten minutes — which is
     * precisely what a walk is. Landing back on the title screen would strand the
     * player mid-loop behind a button they have already pressed.
     */
    if (outcome === 'ok' && value) {
      /*
       * A session can outlive the question it never asked.
       *
       * Resuming used to go straight to the map, which meant anyone already carrying a
       * session from before the Hearth existed was never asked to accept one — they
       * landed on an empty map owning nothing, exactly as before.
       */
      setView(nextView());
      return;
    }

    if (outcome === 'stale') {
      setNotice(
        'A sanctuary from an older age was found, and could not be read. It has returned to the Void.',
      );
    } else if (outcome === 'corrupt') {
      setNotice('Your device would not surrender its memory. Progress will not be kept this session.');
    }
  }, []);

  const begin = useCallback(() => {
    saveNow<Session>('session', { startedAt: Date.now() });
    // Someone who has already chosen a mode and accepted a Hearth is not asked again —
    // they are walking back into a sanctuary that exists, not founding a new one.
    setView(nextView());
  }, []);

  const chooseMode = useCallback((mode: GameMode) => {
    saveNow<ModeMark>('mode', { mode });
    setView(nextView());
  }, []);

  const acceptHearth = useCallback((position: LatLng) => {
    saveNow<HearthMark>('hearth', { position, at: Date.now() });
    setView('map');
  }, []);

  /** Withdrawing is deliberate, so it ends the session rather than pausing it. */
  const withdraw = useCallback(() => {
    remove('session');
    setView('title');
  }, []);

  if (view === 'title') {
    // The Wager's title-screen door is parked since BRDC-CLAIM-017 — `onWager` simply
    // is not passed, and `TitleScreen`'s own guard hides the button.
    return <TitleScreen onBegin={begin} notice={notice} />;
  }

  if (view === 'mode') return <ModeSelect onChoose={chooseMode} />;

  if (view === 'hearth') return <Hearth onAccept={acceptHearth} />;

  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapView onLeave={withdraw} />
    </Suspense>
  );
}

/** A skeleton, not a spinner — the shape of what is coming reads as faster. */
function MapSkeleton() {
  return (
    <main className="mapview mapview--waiting">
      <GlassPanel className="mapview__status">
        <p className="mapview__seeking" role="status">
          The void is resolving…
        </p>
      </GlassPanel>
    </main>
  );
}
