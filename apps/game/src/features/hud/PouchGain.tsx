/**
 * What you just got, said loudly (BRDC-FX-002).
 *
 * From the field: *"toi kartta on ihan tissiposki... kun saat jotain niin kaiken pitää
 * rähähtää."* This was the quietest thing in the game and it fires more often than
 * anything else — a `--text-sm` line, the smallest type in the system, rising thirty-two
 * pixels and fading. Collect a week's production and the screen whispered.
 *
 * So it bursts now: a hexagonal shockwave out of the middle of the map, and one chunky
 * chip per resource thrown clear of it, staggered so they cascade rather than appear.
 * Every colour is one the palette already has (§13 — no new colours); what changed is
 * that they are used at size instead of at 10 px.
 *
 * One toast for every payout in the game — a claim, a reveal from the map, a reveal from
 * the ledger, a Collect — because `latestGain` folds them into this one component. Same
 * act, same appearance (§14).
 */
import { useEffect, useState } from 'react';
import { RESOURCE_KINDS } from '@es3/core';
import type { Collected, ResourceKind, ResourcePool } from '@es3/core';
import type { Settings } from './settings.js';
import { RESOURCE_COLOUR, RESOURCE_WORD } from '../territory/territoryFeatures.js';
import { playPling } from './pling.js';
import './pouch-gain.css';

export interface PouchGainProps {
  collected: Collected | null;
  settings: Settings;
}

/**
 * Whichever payout happened most recently.
 *
 * Several sources feed one toast, and a reveal must not shadow the next Collect — nor the
 * other way round. `at` is the moment each was earned, so it is the only honest tiebreak.
 */
export function latestGain(a: Collected | null, b: Collected | null): Collected | null {
  if (!a) return b;
  if (!b) return a;
  return b.at > a.at ? b : a;
}

/** Long enough to read four chips at arm's length in daylight, gone before it is furniture. */
const BURST_MS = 3_000;

/** Stroke, no fill, drawn from the centre outward — §12's geometry, at a moment. */
function Shockwave({ colour }: { colour: string }) {
  return (
    <svg className="gain__wave" viewBox="-50 -50 100 100" aria-hidden focusable="false">
      {[0, 1, 2].map((ring) => (
        <polygon
          key={ring}
          points="0,-40 34.6,-20 34.6,20 0,40 -34.6,20 -34.6,-20"
          style={{ stroke: colour, animationDelay: `${ring * 140}ms` }}
        />
      ))}
    </svg>
  );
}

export function PouchGain({ collected, settings }: PouchGainProps) {
  const [shown, setShown] = useState<Collected | null>(null);

  useEffect(() => {
    if (!collected || collected.total <= 0) return;
    setShown(collected);
    if (settings.sound) playPling();
    const timer = setTimeout(() => setShown(null), BURST_MS);
    return () => clearTimeout(timer);
  }, [collected, settings.sound]);

  if (!shown) return null;
  const got = (RESOURCE_KINDS as readonly ResourceKind[]).filter((k) => (shown.delta[k] ?? 0) > 0);
  // The wave takes the colour of the largest single gain, so the burst reads as being
  // *about* something rather than being generically colourful.
  const lead = got.reduce((best, k) => ((shown.delta[k] ?? 0) > (shown.delta[best] ?? 0) ? k : best), got[0] as ResourceKind);

  return (
    <div className="gain" key={shown.at} aria-hidden>
      <Shockwave colour={RESOURCE_COLOUR[lead] ?? 'currentColor'} />

      <div className="gain__chips">
        {got.map((k, i) => (
          <span
            key={k}
            className="gain__chip"
            style={{ '--chip': RESOURCE_COLOUR[k], animationDelay: `${i * 90}ms` } as React.CSSProperties}
          >
            <b className="gain__n es-numeric">+{shown.delta[k as keyof ResourcePool]}</b>
            <span className="gain__what">{RESOURCE_WORD[k]}</span>
          </span>
        ))}
      </div>

      {shown.hours >= 1 ? (
        <span className="gain__since es-numeric">{Math.round(shown.hours)} h of it</span>
      ) : null}
    </div>
  );
}
