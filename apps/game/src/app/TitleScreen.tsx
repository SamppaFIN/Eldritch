/**
 * Title screen — Phase 0.
 *
 * This is the token system's smoke test, not a feature. Its job is to prove that
 * the palette, the fonts, the focus ring and the sacred-geometry primitives all
 * survive contact with a real phone before anything is built on top of them.
 *
 * The button does nothing yet. That is deliberate (BRDC-SETUP-004).
 */
import { GlassPanel, MetatronsCube, RitualButton, Starfield, VesicaDivider } from '@es3/ui';
import './title.css';

export interface TitleScreenProps {
  onBegin?: () => void;
  /** Shown when a save was rejected, so an empty sanctuary is never unexplained. */
  notice?: string | null;
}

export function TitleScreen({ onBegin, notice }: TitleScreenProps) {
  return (
    <>
      <Starfield count={110} />

      <main className="title">
        <GlassPanel as="section" className="title__panel" aria-labelledby="title-heading">
          <MetatronsCube
            size={132}
            animate={1600}
            className="es-sigil es-sigil--breathing title__sigil"
          />

          <h1 id="title-heading" className="title__name">
            Eldritch<span className="title__break"> </span>Sanctuary
          </h1>

          <VesicaDivider size={220} className="title__divider" />

          <p className="title__tagline">
            Walk a closed loop in the waking world. The ground inside it remembers you.
          </p>

          {notice ? (
            <p className="title__notice" role="status">
              {notice}
            </p>
          ) : null}

          <RitualButton onClick={onBegin} className="title__cta">
            Begin the Awakening
          </RitualButton>

          <p className="title__phase">
            <span aria-hidden>◇</span> Phase 0 — foundation
          </p>
        </GlassPanel>
      </main>
    </>
  );
}
