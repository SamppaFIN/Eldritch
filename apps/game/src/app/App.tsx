import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { loadWith, saveNow } from '@es3/core';
import { GlassPanel } from '@es3/ui';
import { TitleScreen } from './TitleScreen.js';
import './mapview.css';

/**
 * MapLibre is ~1.2 MB. The title screen must not pay for it: LCP budget is 2.5 s and
 * this game is opened on mobile data, outdoors, by someone about to start walking.
 */
const MapView = lazy(async () => ({ default: (await import('./MapView.js')).MapView }));

type View = 'title' | 'map';

interface Session {
  startedAt: number;
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
    const { outcome } = loadWith<Session | null>('session', null);
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
    setView('map');
  }, []);

  if (view === 'title') return <TitleScreen onBegin={begin} notice={notice} />;

  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapView onLeave={() => setView('title')} />
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
