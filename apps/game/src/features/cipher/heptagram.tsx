/**
 * The cipher's sigil — a seven-pointed star, drawn a chord at a time (BRDC-CIPHER-001).
 *
 * Seven points on a circle. Fragment `i` is the chord from point `i` to point `(i + 3)
 * mod 7`; all seven held closes the `{7/3}` heptagram. Stroke, no fill, computed — no
 * path data authored (§12). The whole star, when it is whole, is the key.
 */
import { SHARD_COUNT } from '@es3/core';

const R = 46;
const C = 50;

/** Point `i` of the regular heptagon, top-first. */
function point(i: number): [number, number] {
  const a = (-90 + (360 * i) / SHARD_COUNT) * (Math.PI / 180);
  return [C + R * Math.cos(a), C + R * Math.sin(a)];
}

export function Heptagram({ held, size = 96 }: { held: readonly number[]; size?: number }) {
  const set = new Set(held);
  const chords = Array.from({ length: SHARD_COUNT }, (_, i) => {
    const [x1, y1] = point(i);
    const [x2, y2] = point((i + 3) % SHARD_COUNT);
    return { i, x1, y1, x2, y2, on: set.has(i) };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="cipher-sigil"
      role="img"
      aria-label={`Cipher sigil, ${set.size} of ${SHARD_COUNT} fragments`}
    >
      <g fill="none" stroke="currentColor" strokeWidth={1.1} vectorEffect="non-scaling-stroke">
        {chords.map(({ i, x1, y1, x2, y2, on }) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            opacity={on ? 0.95 : 0.12}
            className={on ? 'cipher-sigil__chord cipher-sigil__chord--on' : 'cipher-sigil__chord'}
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
        {Array.from({ length: SHARD_COUNT }, (_, i) => {
          const [x, y] = point(i);
          return <circle key={i} cx={x} cy={y} r={1.6} opacity={set.has(i) ? 0.9 : 0.25} />;
        })}
      </g>
    </svg>
  );
}
