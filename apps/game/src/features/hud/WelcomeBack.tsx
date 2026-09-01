/**
 * The reward for coming back (BRDC-CHAR-001).
 *
 * A page browser earns nothing while it is closed, but the game's clock keeps running —
 * so the first pouch read of a session settles everything owed since you left. That is
 * usually a big number, and it deserved more than silently appearing. This is the card:
 * what the wait was worth, a chime, and a tap to pocket it.
 */
import { useEffect } from 'react';
import { RESOURCE_KINDS } from '@es3/core';
import type { ResourceKind, ResourcePool } from '@es3/core';
import { RESOURCE_COLOUR, RESOURCE_WORD } from '../territory/territoryFeatures.js';
import type { PouchGain } from '../territory/usePouchPolling.js';
import type { Settings } from './settings.js';
import { playChime } from './useClaimFeedback.js';
import './welcome-back.css';

/** Below this the wait was not long enough to interrupt for. */
export const WELCOME_MIN = 20;

export interface WelcomeBackProps {
  gain: PouchGain | null;
  settings: Settings;
  onDismiss: () => void;
}

export function WelcomeBack({ gain, settings, onDismiss }: WelcomeBackProps) {
  const show = gain?.firstRead === true && gain.total >= WELCOME_MIN;

  useEffect(() => {
    if (!show) return;
    if (settings.sound) playChime('claimed');
    const timer = setTimeout(onDismiss, 15_000);
    return () => clearTimeout(timer);
  }, [show, settings.sound, onDismiss]);

  if (!show || !gain) return null;
  const got = (RESOURCE_KINDS as readonly ResourceKind[]).filter((k) => (gain.delta[k] ?? 0) > 0);

  return (
    <button type="button" className="welcome-back" onClick={onDismiss} aria-label="While you were away. Tap to pocket.">
      <span className="welcome-back__title">While you were away</span>
      <span className="welcome-back__gains">
        {got.map((k) => (
          <span key={k} className="welcome-back__gain" style={{ color: RESOURCE_COLOUR[k] }}>
            +{gain.delta[k as keyof ResourcePool]} {RESOURCE_WORD[k]}
          </span>
        ))}
      </span>
      <span className="welcome-back__hint">Tap to pocket it</span>
    </button>
  );
}
