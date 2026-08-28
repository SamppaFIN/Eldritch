import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { load, loadWith, remove, saveNow } from '@es3/core';
import type { GameRepository, LatLng } from '@es3/core';
import { GlassPanel } from '@es3/ui';
import { TitleScreen } from './TitleScreen.js';
import { WagerDialog } from '../features/wager/WagerDialog.js';
import { createRepository } from '../data/createRepository.js';
import { Hearth } from '../features/hearth/Hearth.js';
import './mapview.css';

/**
 * MapLibre is ~1.2 MB. The title screen must not pay for it: LCP budget is 2.5 s and
 * this game is opened on mobile data, outdoors, by someone about to start walking.
 */
const MapView = lazy(async () => ({ default: (await import('./MapView.js')).MapView }));

type View = 'title' | 'hearth' | 'map';

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
  const [wager, setWager] = useState(false);
  /*
   * Opened lazily, and only for the Wager.
   *
   * MapView owns its own handle; this one exists because sealing a challenge is done
   * from the title screen, where there is otherwise no repository at all. Two handles
   * over the same IndexedDB is not a problem — the store is the shared thing, and both
   * read and write through it.
   */
  const [repository, setRepository] = useState<GameRepository | null>(null);

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
      setView(load<HearthMark | null>('hearth', null) ? 'map' : 'hearth');
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

  const openWager = useCallback(() => {
    setWager(true);
    if (repository) return;
    void createRepository().then((handle) => setRepository(handle.repository));
  }, [repository]);

  const begin = useCallback(() => {
    saveNow<Session>('session', { startedAt: Date.now() });
    // Someone who has already accepted a Hearth is not asked again — they are walking
    // back into a sanctuary that exists, not founding a new one.
    setView(load<HearthMark | null>('hearth', null) ? 'map' : 'hearth');
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
    return (
      <>
        <TitleScreen onBegin={begin} onWager={openWager} notice={notice} />
        <WagerDialog open={wager} repository={repository} onClose={() => setWager(false)} />
      </>
    );
  }

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
