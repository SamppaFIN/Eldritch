/**
 * The hour rolling over, felt (BRDC-CHAR-001).
 *
 * When a settle adds to the pouch mid-session — an hour's trickle landing — a small stack
 * of "+N" rises off the bottom of the screen where the HUD pouch sits, then fades. One
 * faint pling. The big "while you were away" moment is `WelcomeBack`; this is the small,
 * frequent one.
 */
import { useEffect, useState } from 'react';
import { RESOURCE_KINDS } from '@es3/core';
import type { ResourceKind, ResourcePool } from '@es3/core';
import { RESOURCE_COLOUR, RESOURCE_WORD } from '../territory/territoryFeatures.js';
import type { PouchGain as Gain } from '../territory/usePouchPolling.js';
import { playPling } from './pling.js';
import type { Settings } from './settings.js';
import './pouch-gain.css';

export interface PouchGainProps {
  gain: Gain | null;
  settings: Settings;
}

export function PouchGain({ gain, settings }: PouchGainProps) {
  const [shownAt, setShownAt] = useState<number | null>(null);

  useEffect(() => {
    if (!gain || gain.firstRead) return;
    setShownAt(gain.at);
    if (settings.sound) playPling();
    const timer = setTimeout(() => setShownAt(null), 1_900);
    return () => clearTimeout(timer);
  }, [gain, settings.sound]);

  if (!gain || gain.firstRead || shownAt !== gain.at) return null;

  const got = (RESOURCE_KINDS as readonly ResourceKind[]).filter((k) => (gain.delta[k] ?? 0) > 0);
  return (
    <div className="pouch-gain" key={gain.at} aria-hidden>
      {got.map((k) => (
        <span key={k} style={{ color: RESOURCE_COLOUR[k] }}>
          +{gain.delta[k as keyof ResourcePool]} {RESOURCE_WORD[k]}
        </span>
      ))}
    </div>
  );
}
