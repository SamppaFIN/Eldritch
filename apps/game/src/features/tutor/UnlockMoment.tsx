/**
 * A mechanic opening, given as a moment rather than a notice (BRDC-TUTOR-001).
 *
 * `claude.md` §12 asks for sacred geometry at *moments* — a claim, a level-up, an empty
 * state — drawn as inline SVG with stroke and no fill, animated by `stroke-dasharray`.
 * The plan wanted "a short, elegant tutorial video or image" for this; a video is a
 * download, a raster and a thing nobody rewatches. This is none of those.
 *
 * The figure is the seed of the Flower of Life: a centre and its ring of six. That is the
 * same shape as `HEARTH_RING`, which is what the game actually handed the player, so the
 * geometry is saying something true rather than decorating.
 */
import { UNLOCK_REWARD } from '@es3/core';
import type { UnlockId } from '@es3/core';
import { UNLOCK_COPY } from './unlocks.js';
import type { WikiRef } from '../help/wikiPages.js';
import { useEscape } from '../hud/useEscape.js';
import './unlock-moment.css';

/** Centre plus six, each at 60°, all the same radius — the circles meet at the centres. */
const SEED = [
  [0, 0],
  ...[0, 60, 120, 180, 240, 300].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return [Math.cos(rad) * 22, Math.sin(rad) * 22];
  }),
];

function SeedOfLife() {
  return (
    <svg
      className="unlock__geometry"
      viewBox="-56 -56 112 112"
      width="112"
      height="112"
      aria-hidden="true"
      focusable="false"
    >
      {SEED.map(([cx, cy], i) => (
        <circle
          key={`${cx},${cy}`}
          cx={cx}
          cy={cy}
          r="22"
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
    </svg>
  );
}

export interface UnlockMomentProps {
  id: UnlockId;
  /** Acknowledge and take the wisdom. Marks the lesson taught for good. */
  onRead: () => void;
  /** Wave it away without reading it. Unpaid, and it returns on the next walk. */
  onLater: () => void;
  /** Open the wiki page this lesson points at. */
  onSee: (ref: WikiRef) => void;
}

export function UnlockMoment({ id, onRead, onLater, onSee }: UnlockMomentProps) {
  const copy = UNLOCK_COPY[id];
  // ESC is "not now", not "no": it neither marks nor pays, so the lesson comes back on
  // the next walk. Only the button teaches it, because only the button was read.
  useEscape(true, onLater);

  return (
    <div className="unlock" role="dialog" aria-modal="false" aria-labelledby="unlock-title">
      <div className="unlock__card">
        <SeedOfLife />
        <p className="unlock__eyebrow">Something has opened</p>
        <h2 className="unlock__title" id="unlock-title">
          {copy.title}
        </h2>
        <p className="unlock__what">{copy.what}</p>
        <p className="unlock__now">{copy.now}</p>
        <div className="unlock__actions">
          <button type="button" className="unlock__read" onClick={onRead}>
            Understood · +{UNLOCK_REWARD} wisdom
          </button>
          {copy.see ? (
            <button type="button" className="unlock__see" onClick={() => onSee(copy.see as WikiRef)}>
              Read more
            </button>
          ) : null}
          <button type="button" className="unlock__later" onClick={onLater}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
