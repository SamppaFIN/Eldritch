/**
 * The moment you find one of the troll's answers (BRDC-QUEST-001).
 *
 * Same weight as a place reveal: a drawn sigil, the item's name, a line of what it is.
 * It shows once, when you walk onto the cell, then the site is just a marker.
 */
import { useEffect } from 'react';
import { QUEST_ITEMS } from '@es3/core';
import type { SecretSiteId } from '@es3/core';
import { Portrait } from './portraits.js';
import './quest-reveal.css';

export interface QuestRevealProps {
  found: SecretSiteId | null;
  onDismiss: () => void;
}

const REVEAL_MS = 4_200;

export function QuestReveal({ found, onDismiss }: QuestRevealProps) {
  useEffect(() => {
    if (!found) return;
    const timer = setTimeout(onDismiss, REVEAL_MS);
    return () => clearTimeout(timer);
  }, [found, onDismiss]);

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
    </button>
  );
}
