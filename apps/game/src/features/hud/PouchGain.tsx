/**
 * The Collect moment, felt (BRDC-ECON-007).
 *
 * The hourly trickle fills the pouch on its own; pressing Collect is when the player gets
 * to *see* it — a small stack of "+N" rises off the bottom of the screen where the HUD
 * pouch sits, with how long the wait was, then fades. One faint pling.
 */
import { useEffect, useState } from 'react';
import { RESOURCE_KINDS } from '@es3/core';
import type { Collected, ResourceKind, ResourcePool } from '@es3/core';
import { RESOURCE_COLOUR, RESOURCE_WORD } from '../territory/territoryFeatures.js';
import { playPling } from './pling.js';
import type { Settings } from './settings.js';
import './pouch-gain.css';

export interface PouchGainProps {
  collected: Collected | null;
  settings: Settings;
}

export function PouchGain({ collected, settings }: PouchGainProps) {
  const [shown, setShown] = useState<Collected | null>(null);

  useEffect(() => {
    if (!collected || collected.total <= 0) return;
    setShown(collected);
    if (settings.sound) playPling();
    const timer = setTimeout(() => setShown(null), 2_400);
    return () => clearTimeout(timer);
  }, [collected, settings.sound]);

  if (!shown) return null;
  const got = (RESOURCE_KINDS as readonly ResourceKind[]).filter((k) => (shown.delta[k] ?? 0) > 0);

  return (
    <div className="pouch-gain" key={shown.at} aria-hidden>
      {shown.hours >= 1 ? (
        <span className="pouch-gain__since">{Math.round(shown.hours)} h</span>
      ) : null}
      {got.map((k) => (
        <span key={k} style={{ color: RESOURCE_COLOUR[k] }}>
          +{shown.delta[k as keyof ResourcePool]} {RESOURCE_WORD[k]}
        </span>
      ))}
    </div>
  );
}
