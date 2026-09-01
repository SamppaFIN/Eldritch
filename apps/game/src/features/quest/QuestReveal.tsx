/**
 * The moment you find one of the troll's answers (BRDC-QUEST-001, -002).
 *
 * Same weight as a place reveal: a drawn sigil, the item's name, a line of what it is.
 * It waits to be tapped — an earlier version faded on its own and was gone before it was
 * read outdoors — with a long safety timeout so it cannot get stuck on screen forever.
 */
import { useEffect } from 'react';
import { QUEST_ITEMS } from '@es3/core';
import type { SecretSiteId } from '@es3/core';
import { Portrait } from './portraits.js';
import { playPling } from '../hud/pling.js';
import type { Settings } from '../hud/settings.js';
import './quest-reveal.css';

export interface QuestRevealProps {
  found: SecretSiteId | null;
  onDismiss: () => void;
  settings: Settings;
}

/** It stays until tapped, but never longer than this. */
const SAFETY_MS = 15_000;

export function QuestReveal({ found, onDismiss, settings }: QuestRevealProps) {
  useEffect(() => {
    if (!found) return;
    if (settings.sound) playPling();
    const timer = setTimeout(onDismiss, SAFETY_MS);
    return () => clearTimeout(timer);
  }, [found, onDismiss, settings.sound]);

  if (!found) return null;
  const item = QUEST_ITEMS[found];

  return (
    <button type="button" className="quest-reveal" onClick={onDismiss} aria-label={`${item.name}. Dismiss.`}>
      <span className="quest-reveal__sigil" aria-hidden>
        <Portrait speaker="Narrator" size={140} />
      </span>
      <span className="quest-reveal__name">{item.name}</span>
      <span className="quest-reveal__line">{item.blurb}</span>
      <span className="quest-reveal__hint">It shows on your map now. Take the ground to use it on Grug.</span>
      <span className="quest-reveal__hint">Tap to dismiss</span>
    </button>
  );
}
