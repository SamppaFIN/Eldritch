import { useEffect, useState } from 'react';
import { loadWith } from '@es3/core';
import { TitleScreen } from './TitleScreen.js';

interface Session {
  startedAt: number;
}

/**
 * Deterministic boot. No event bus, no ordering by luck.
 * v2 spawned entities before the map was listening and the shrines silently
 * never appeared; the fix is that initialization is a plain sequence.
 */
export function App() {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const { outcome } = loadWith<Session | null>('session', null);
    if (outcome === 'stale') {
      setNotice('A sanctuary from an older age was found, and could not be read. It has returned to the Void.');
    } else if (outcome === 'corrupt') {
      setNotice('Your device would not surrender its memory. Progress will not be kept this session.');
    }
  }, []);

  return <TitleScreen notice={notice} />;
}
