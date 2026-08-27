/**
 * Accepting the ground — the first thing that happens.
 *
 * The adventure does not open on a menu or a name field. It opens by asking the player
 * to agree that the place they are standing in is theirs, and it will not ask until the
 * phone actually knows where that is. Everything after this — growth, decay, temples —
 * is measured from the cell they accept here.
 *
 * Which is why the button waits. A fix taken from a cell tower is steady, confident and
 * wrong by a kilometre, and a Hearth in the wrong place is a game the player cannot
 * start over without wiping everything.
 */
import { FlowerOfLife, GlassPanel, RitualButton } from '@es3/ui';
import type { LatLng } from '@es3/core';
import { SHARP_M, acquisitionLine } from './acquisition.js';
import { useAcquireFix } from './useAcquireFix.js';
import './hearth.css';

export interface HearthProps {
  onAccept: (position: LatLng) => void;
}

/** After this long, waiting longer is not going to help — indoors, it never will. */
const PATIENCE_S = 40;

export function Hearth({ onAccept }: HearthProps) {
  const fix = useAcquireFix();

  const refused = fix.status === 'denied' || fix.status === 'unavailable';
  // The way out for someone under a roof, offered only once waiting has been given a
  // fair chance. Refusing outright would strand them on this screen forever.
  const settleFor = !fix.ready && fix.fix !== null && fix.elapsedS >= PATIENCE_S;

  return (
    <main className="hearth">
      <GlassPanel as="section" className="hearth__panel" aria-labelledby="hearth-heading">
        <FlowerOfLife
          size={148}
          animate={2_400}
          className="es-sigil es-sigil--breathing hearth__sigil"
        />

        <h1 id="hearth-heading" className="hearth__title">
          Your Hearth
        </h1>

        {/* Both names are introduced here on purpose. The map labels this cell the
            Anchor Stone from now on, and a player who was only ever told "Hearth" would
            not recognise it. */}
        <p className="hearth__body">
          Every sanctuary begins somewhere. The ground you are standing on becomes yours —
          your Anchor Stone — and everything you claim afterwards grows outward from it.
        </p>

        {refused ? (
          <>
            <p className="hearth__state hearth__state--refused" role="status">
              {fix.status === 'denied'
                ? 'Location is refused, so the ground cannot be found.'
                : 'This device has no location sensor.'}
            </p>
            <p className="hearth__hint">
              Allow location for this page in your browser settings, then return here.
            </p>
          </>
        ) : (
          <>
            <p className="hearth__state" data-tier={fix.tier} role="status">
              {acquisitionLine(fix)}
            </p>

            {/* The numbers are secondary, but a player standing in the rain deserves to
                see that something is happening rather than a still screen. */}
            <dl className="hearth__readout">
              <div>
                <dt>Certainty</dt>
                <dd className="es-numeric">
                  {fix.accuracyM === null ? '—' : `±${Math.round(fix.accuracyM)} m`}
                </dd>
              </div>
              <div>
                <dt>Agreement</dt>
                <dd className="es-numeric">
                  {fix.spreadM === null ? '—' : `${Math.round(fix.spreadM)} m`}
                </dd>
              </div>
              <div>
                <dt>Fixes</dt>
                <dd className="es-numeric">{fix.samples}</dd>
              </div>
            </dl>

            <RitualButton
              className="hearth__cta"
              disabled={!fix.ready && !settleFor}
              onClick={() => fix.fix && onAccept(fix.fix)}
            >
              {fix.ready ? 'This ground is mine' : 'Waiting for the ground…'}
            </RitualButton>

            {settleFor ? (
              <p className="hearth__hint">
                Under a roof the sky never sharpens past ±{Math.round(fix.accuracyM ?? 0)} m.
                You can accept it — or step outside and watch it tighten below ±{SHARP_M} m.
              </p>
            ) : null}
          </>
        )}
      </GlassPanel>
    </main>
  );
}
