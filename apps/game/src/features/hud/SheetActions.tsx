/**
 * The walking sheet's own row of controls: Your lands and the Keeper's Counsel beside
 * the Vigil toggle (Infinite 2026-09-30, drawn on a screenshot: into the empty space
 * left of ○, not onto the nav bar).
 */
import { useState } from 'react';
import { RitualButton } from '@es3/ui';
import { Vigil } from './Vigil.js';
import type { VigilProps } from './Vigil.js';
import type { StandardBinding } from '../territory/useStandard.js';
import { upNextText } from '@es3/core';
import type { UpNextRow } from './useUpNext.js';
import './week.css';
import type { HelpTopic } from '../help/help.js';

export interface SheetLinks {
  onOpenLands?: (() => void) | undefined;
  onOpenCounsel?: (() => void) | undefined;
  /** Plant your standard where you stand (BRDC-STANDARD-001). */
  standard?: StandardBinding | undefined;
  /** What finishes next, three at most (BRDC-NEXT-001). */
  upNext?: readonly UpNextRow[] | undefined;
  /** A golden or dark week, named first on the strip (BRDC-AGE-001); a tap goes to the Keep. */
  week?: { name: string; kind: 'golden' | 'dark' | 'plain'; open?: (() => void) | undefined } | undefined;
  /** The day's moon and weather, "Full moon · Fog" (BRDC-MOON-001); absent on a calm, ordinary day. */
  sky?: string | undefined;
}

/** Shown on the strip before "+N". */
const STRIP_SHOWN = 2;

export function SheetActions({ keepAlive, onOpenLands, onOpenCounsel, standard, upNext, week, sky, onHelp }: VigilProps & SheetLinks & { onHelp?: ((t: HelpTopic) => void) | undefined }) {
  const [all, setAll] = useState(false);
  const strip = [
    sky ? (
      <button type="button" className="hud__upnext-item hud__sky" onClick={() => onHelp?.('sky')}>
        {sky}
      </button>
    ) : null,
    week ? (
      <button type="button" className={`hud__upnext-item hud__week hud__week--${week.kind}`} onClick={week.open}>
        {week.name}
      </button>
    ) : null,
    ...(upNext ?? []).map(({ item, open }) =>
      open ? (
        <button type="button" className="hud__upnext-item" onClick={open}>
          {upNextText(item)}
        </button>
      ) : (
        <span className="hud__upnext-item">{upNextText(item)}</span>
      ),
    ),
  ].filter((n) => n !== null);
  return (
    <>
      {standard ? (
        // Marked unavailable rather than disabled: a tap still says why (no hover on a phone).
        <RitualButton
          variant="ghost"
          className="hud__sheet-link hud__standard"
          aria-label="Plant your standard"
          aria-disabled={!standard.can}
          data-can={standard.can}
          onClick={standard.plant}
        >
          <span aria-hidden>⚑</span>
        </RitualButton>
      ) : null}
      {onOpenLands ? (
        <RitualButton variant="ghost" className="hud__sheet-link" onClick={onOpenLands}>
          <span aria-hidden>⬡</span> Lands
        </RitualButton>
      ) : null}
      {onOpenCounsel ? (
        <RitualButton variant="ghost" className="hud__sheet-link" onClick={onOpenCounsel}>
          <span aria-hidden>☉</span> Counsel
        </RitualButton>
      ) : null}
      <Vigil keepAlive={keepAlive} />
      {strip.length > 0 ? (
        <p className="hud__upnext es-numeric" aria-label="Up next">
          {/* Two in view and "+N" for the rest: the strip used to run off the edge mid-word
              with nothing to say it scrolled (BRDC-UX-008). */}
          {strip.map((node, i) => (
            <span key={i} className="hud__upnext-slot" hidden={!all && i >= STRIP_SHOWN}>
              {node}
            </span>
          ))}
          {strip.length > STRIP_SHOWN ? (
            <button type="button" className="hud__upnext-item" aria-expanded={all} onClick={() => setAll((a) => !a)}>
              {all ? '‹ less' : `+${strip.length - STRIP_SHOWN}`}
            </button>
          ) : null}
        </p>
      ) : null}
      {standard?.said ? (
        <p className="hud__sheet-note" role="status">
          {standard.said}
        </p>
      ) : null}
    </>
  );
}
