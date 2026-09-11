/**
 * Finding a wonder (BRDC-WONDER-001).
 *
 * The ticket calls this the largest event in the game, and `claude.md` §12 reserves
 * Metatron's Cube for exactly this kind of moment. Thirteen circles at the Fruit of Life
 * positions with every pair joined — stroke, no fill, drawn on by `stroke-dasharray`,
 * generated rather than hand-authored as path data.
 *
 * Unlike `UnlockMoment` this one is a real dialog: it takes the screen and waits. A wonder
 * is found once, ever, by one person, and sliding it past someone who was looking at their
 * phone in a coat pocket would be the one thing this feature must not do.
 */
import { WONDERS, WONDER_STARS } from '@es3/core';
import type { WonderId } from '@es3/core';
import { useEscape } from '../hud/useEscape.js';
import './wonder-moment.css';

/** Centre, an inner ring of six, an outer ring of six rotated by thirty degrees. */
const NODES: [number, number][] = [
  [0, 0],
  ...[0, 60, 120, 180, 240, 300].map((d): [number, number] => {
    const r = (d * Math.PI) / 180;
    return [Math.cos(r) * 20, Math.sin(r) * 20];
  }),
  ...[0, 60, 120, 180, 240, 300].map((d): [number, number] => {
    const r = (d * Math.PI) / 180;
    return [Math.cos(r) * 40, Math.sin(r) * 40];
  }),
];

/** Every pair once — seventy-eight of them, which is what makes the figure read as a cube. */
const EDGES: [number, number][] = NODES.flatMap((_, i) =>
  NODES.slice(i + 1).map((_, j): [number, number] => [i, i + 1 + j]),
);

function MetatronsCube() {
  return (
    <svg
      className="wonder__geometry"
      viewBox="-52 -52 104 104"
      width="160"
      height="160"
      aria-hidden="true"
      focusable="false"
    >
      <g className="wonder__edges">
        {EDGES.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={NODES[a]?.[0]}
            y1={NODES[a]?.[1]}
            x2={NODES[b]?.[0]}
            y2={NODES[b]?.[1]}
          />
        ))}
      </g>
      <g className="wonder__nodes">
        {NODES.map(([cx, cy], i) => (
          <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="9" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </g>
    </svg>
  );
}

export interface WonderMomentProps {
  id: WonderId;
  onClose: () => void;
}

export function WonderMoment({ id, onClose }: WonderMomentProps) {
  const wonder = WONDERS[id];
  useEscape(true, onClose);

  return (
    <div
      className="wonder"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wonder-title"
      onClick={onClose}
    >
      <div className="wonder__card" onClick={(e) => e.stopPropagation()}>
        <MetatronsCube />
        <p className="wonder__eyebrow">A wonder of the world</p>
        <h2 className="wonder__title" id="wonder-title">
          {wonder.name}
        </h2>
        <p className="wonder__stars" aria-label={`${wonder.rarity} wonder`}>
          {WONDER_STARS[wonder.rarity]}
        </p>
        <p className="wonder__lore">{wonder.lore}</p>
        <p className="wonder__effect">
          Your name is on it. It pays this hex every hour, and lifts the ground {wonder.aura.radius}{' '}
          rings around it.
        </p>
        <button type="button" className="wonder__close" onClick={onClose}>
          Stand a while
        </button>
      </div>
    </div>
  );
}
