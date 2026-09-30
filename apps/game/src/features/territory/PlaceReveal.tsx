/**
 * The moment a place tells you what it is.
 *
 * Nothing was chosen from a menu. The game watched where the hours went, and now it
 * says so: *that* corner is your Anchor Stone. *That* one is a temple. The whole idea
 * rests on the player noticing, so the reveal gets the same weight as a claim — a
 * Flower of Life drawing itself, and the name underneath.
 *
 * It appears once per place, when the threshold is crossed, and never again.
 */
import { useEffect } from 'react';
import { FlowerOfLife, MetatronsCube } from '@es3/ui';
import type { RevealedPlace } from '@es3/core';
import './place-reveal.css';
import { useCardStack } from '../hud/useCardStack.js';

export interface PlaceRevealProps {
  /** Places that crossed a threshold in the last batch. */
  revealed: readonly RevealedPlace[];
}

/** The draw-in animation is still brief — only the dismissal wait grew. */
const DRAW_MS = 3_600;

export function PlaceReveal({ revealed }: PlaceRevealProps) {
  // Stays until tapped, and a new one piles on top (2026-09-30) — found while the phone
  // was in a pocket, read when the walker sits down.
  const stack = useCardStack<RevealedPlace>();
  const showing = stack.top;
  useEffect(() => {
    for (const place of revealed) stack.push(place);
  }, [revealed, stack.push]);

  if (!showing) return null;

  const anchor = showing.kind === 'anchor';
  const hours = Math.round(showing.dwellMs / 3_600_000);

  return (
    <button type="button" className="reveal" onClick={stack.pop} aria-label="Dismiss">
      <span className="reveal__sigil" aria-hidden>
        {anchor ? (
          <MetatronsCube size={220} animate={DRAW_MS * 0.55} />
        ) : (
          <FlowerOfLife size={190} animate={DRAW_MS * 0.55} />
        )}
      </span>

      <span className="reveal__name">{anchor ? 'Anchor Stone' : 'A Temple'}</span>
      <span className="reveal__line">
        {anchor
          ? 'The ground here knows you best. This is where you return to.'
          : 'You have given this place enough of yourself for it to answer.'}
      </span>
      {hours >= 1 ? (
        <span className="reveal__meta es-numeric">
          {hours} {hours === 1 ? 'hour' : 'hours'} spent here
        </span>
      ) : null}
      <span className="reveal__hint">{stack.count > 1 ? `Tap for the next · ${stack.count - 1} more` : 'Tap to dismiss'}</span>
    </button>
  );
}
