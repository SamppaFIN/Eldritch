/**
 * Found a cipher fragment (BRDC-CIPHER-001).
 *
 * The shape of `QuestReveal`: the sigil so far, the line this fragment carries, a count,
 * and it waits for a tap. A pling on arrival.
 */
import { useEffect } from 'react';
import { SHARD_COUNT } from '@es3/core';
import type { CipherView } from '@es3/core';
import { playPling } from '../hud/pling.js';
import type { Settings } from '../hud/settings.js';
import { Heptagram } from './heptagram.js';
import './cipher-reveal.css';

const SAFETY_MS = 15_000;

export interface CipherRevealProps {
  found: number | null;
  view: CipherView;
  settings: Settings;
  onDismiss: () => void;
}

export function CipherReveal({ found, view, settings, onDismiss }: CipherRevealProps) {
  useEffect(() => {
    if (found === null) return;
    if (settings.sound) playPling();
    const timer = setTimeout(onDismiss, SAFETY_MS);
    return () => clearTimeout(timer);
  }, [found, onDismiss, settings.sound]);

  if (found === null) return null;
  const line = view.fragments[found]?.line ?? '';

  return (
    <button type="button" className="cipher-reveal" onClick={onDismiss} aria-label="A cipher fragment. Dismiss.">
      <span className="cipher-reveal__sigil" aria-hidden>
        <Heptagram held={view.held} size={132} />
      </span>
      <span className="cipher-reveal__name">A fragment of the cipher</span>
      <span className="cipher-reveal__line">&ldquo;{line}&rdquo;</span>
      <span className="cipher-reveal__count">
        {view.held.length} of {SHARD_COUNT} · {view.complete ? 'the star is closed' : 'kept in your Character screen'}
      </span>
      <span className="cipher-reveal__hint">Tap to dismiss</span>
    </button>
  );
}
