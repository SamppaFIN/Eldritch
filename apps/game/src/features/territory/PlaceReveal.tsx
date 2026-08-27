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
import { useEffect, useState } from 'react';
import { FlowerOfLife, MetatronsCube } from '@es3/ui';
import type { RevealedPlace } from '@es3/core';
import './place-reveal.css';

export interface PlaceRevealProps {
  /** Places that crossed a threshold in the last batch. */
  revealed: readonly RevealedPlace[];
}

const REVEAL_MS = 3_600;

export function PlaceReveal({ revealed }: PlaceRevealProps) {
  const [showing, setShowing] = useState<RevealedPlace | null>(null);

  useEffect(() => {
    const next = revealed[0];
    if (!next) return;
    setShowing(next);
    const timer = setTimeout(() => setShowing(null), REVEAL_MS);
    return () => clearTimeout(timer);
  }, [revealed]);

  if (!showing) return null;

  const anchor = showing.kind === 'anchor';
  const hours = Math.round(showing.dwellMs / 3_600_000);

  return (
    <div className="reveal" role="status">
      <div className="reveal__sigil" aria-hidden>
        {anchor ? (
          <MetatronsCube size={220} animate={REVEAL_MS * 0.55} />
        ) : (
          <FlowerOfLife size={190} animate={REVEAL_MS * 0.55} />
        )}
      </div>

      <p className="reveal__name">{anchor ? 'Anchor Stone' : 'A Temple'}</p>
      <p className="reveal__line">
        {anchor
          ? 'The ground here knows you best. This is where you return to.'
          : 'You have given this place enough of yourself for it to answer.'}
      </p>
      {hours >= 1 ? (
        <p className="reveal__meta es-numeric">
          {hours} {hours === 1 ? 'hour' : 'hours'} spent here
        </p>
      ) : null}
    </div>
  );
}
