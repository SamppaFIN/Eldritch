/**
 * Cosmic starfield — the ground everything else sits on.
 *
 * Deliberately CSS + inline SVG, no canvas and no WebGL: the map already owns the
 * GPU, and a title screen that costs a render loop is a title screen that costs
 * battery on a phone that is about to be walked around outdoors for an hour.
 *
 * Stars are generated from a seeded PRNG so the sky is stable across renders —
 * a field that reshuffles on every state change reads as a glitch.
 */
import { useMemo } from 'react';
import type { CSSProperties } from 'react';

export interface StarfieldProps {
  /** Star count. 90 is plenty at phone size; 200 starts to look like noise. */
  count?: number;
  seed?: number;
  /** Adds a slow drift. Disabled automatically by prefers-reduced-motion. */
  drift?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** mulberry32 — small, fast, deterministic. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
  delay: number;
  dur: number;
}

export function Starfield({
  count = 90,
  seed = 1618,
  drift = true,
  className,
  style,
}: StarfieldProps) {
  const stars = useMemo<Star[]>(() => {
    const rnd = prng(seed);
    return Array.from({ length: count }, () => {
      const size = rnd();
      return {
        x: rnd() * 100,
        y: rnd() * 100,
        // Most stars are dust; a few are bright. Cubed keeps big ones rare.
        r: 0.08 + size * size * size * 0.7,
        o: 0.25 + rnd() * 0.65,
        delay: rnd() * 6,
        dur: 3 + rnd() * 5,
      };
    });
  }, [count, seed]);

  return (
    <div className={className} style={{ ...starfieldBase, ...style }} aria-hidden>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={drift ? { animation: 'es-drift 240s linear infinite' } : undefined}
      >
        <defs>
          {/* Nebula: two soft radial washes in palette hues, never a third. */}
          <radialGradient id="es-neb-a" cx="28%" cy="22%" r="55%">
            <stop offset="0%" stopColor="var(--cosmic-purple)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--cosmic-purple)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="es-neb-b" cx="74%" cy="78%" r="50%">
            <stop offset="0%" stopColor="var(--eldritch-blue)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--eldritch-blue)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="100" height="100" fill="var(--bg-deep)" />
        <rect width="100" height="100" fill="url(#es-neb-a)" />
        <rect width="100" height="100" fill="url(#es-neb-b)" />

        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="var(--text)"
            opacity={s.o}
            style={{
              animation: `es-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

const starfieldBase: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 'var(--z-map)' as unknown as number,
  pointerEvents: 'none',
  background: 'var(--bg-deep)',
  // The drift transform scales the sky past its box. Without this the page
  // gains horizontal scroll — which shows up as a WCAG reflow failure at 200% zoom.
  overflow: 'hidden',
};
