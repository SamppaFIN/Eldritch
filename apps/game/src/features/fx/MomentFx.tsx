/**
 * Draws the current moment (BRDC-FX-001).
 *
 * Sacred geometry as a *moment*, not wallpaper (claude.md §12): stroke, no fill, drawn in
 * with `stroke-dasharray`. Under two seconds, a tap ends it sooner, and it sits just
 * above the claim burst so a level crossed by that same claim is still seen.
 *
 * `prefers-reduced-motion`: the geometry appears at once instead of drawing itself, and
 * the panel does not slide — but the moment still shows and still clears. The information
 * must not go with the motion (claude.md §14).
 */
import { useEffect } from 'react';
import { FlowerOfLife, HexMandala, MetatronsCube } from '@es3/ui';
import type { GeometryProps } from '@es3/ui';
import type { ComponentType } from 'react';
import type { MomentKind, MomentsApi } from './useMoments.js';
import './moment-fx.css';

/** Long enough to read two lines while walking, short enough to be gone before it matters. */
const MOMENT_MS = 1_800;

const GEOMETRY: Readonly<Record<MomentKind, ComponentType<GeometryProps>>> = {
  levelUp: FlowerOfLife,
  achievement: MetatronsCube,
  riteComplete: HexMandala,
  wonderFound: MetatronsCube,
  questEnd: MetatronsCube,
};

/** The geometry a kind draws with. Exported for the test — the mapping is a decision. */
export function geometryFor(kind: MomentKind): ComponentType<GeometryProps> {
  return GEOMETRY[kind];
}

/** Whether the geometry draws itself in. False under reduced motion — it appears at once. */
export function shouldAnimate(reducedMotion: boolean): boolean {
  return !reducedMotion;
}

export interface MomentFxProps {
  moments: MomentsApi;
}

export function MomentFx({ moments }: MomentFxProps) {
  const { current, dismiss } = moments;

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(dismiss, MOMENT_MS);
    return () => clearTimeout(timer);
  }, [current, dismiss]);

  if (!current) return null;

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const Geometry = geometryFor(current.kind);

  return (
    <div className="moment-fx" role="status">
      <span className="moment-fx__glyph" aria-hidden>
        <Geometry size={240} animate={shouldAnimate(reduced) ? 1_400 : 0} />
      </span>
      {/* A button, not a div with onClick: dismissible, so focusable, answers Enter and
          Space, and gets the focus ring every control has. Its text is its name — the
          moment reads out, then "button". */}
      <button type="button" className="moment-fx__panel" onClick={dismiss}>
        <span className="moment-fx__eyebrow">{current.eyebrow}</span>
        <span className="moment-fx__title">{current.title}</span>
      </button>
    </div>
  );
}
