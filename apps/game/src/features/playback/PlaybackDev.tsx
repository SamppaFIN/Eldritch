/**
 * The playback panel's door (BRDC-SIM-002): P opens and closes it, in dev and e2e builds
 * only. The panel itself is a lazy chunk, so a player's build never carries it.
 */
import { Suspense, lazy, useEffect, useState } from 'react';
import type { TrailPoint } from '@es3/core';
import type { Playback } from './usePlayback.js';

const PlaybackPanel = /* @__PURE__ */ lazy(() => import('./PlaybackPanel.js'));

export function PlaybackDev({ playback, walked }: { playback: Playback; walked: readonly TrailPoint[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey) setOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <PlaybackPanel playback={playback} walked={walked} onClose={() => setOpen(false)} />
    </Suspense>
  );
}
