/**
 * The walking sheet's own row of controls: Your lands and the Keeper's Counsel beside
 * the Vigil toggle (Infinite 2026-09-30, drawn on a screenshot: into the empty space
 * left of ○, not onto the nav bar).
 */
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

export function SheetActions({ keepAlive, onOpenLands, onOpenCounsel, standard, upNext, week, sky, onHelp }: VigilProps & SheetLinks & { onHelp?: ((t: HelpTopic) => void) | undefined }) {
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
      {(upNext && upNext.length > 0) || week || sky ? (
        <p className="hud__upnext es-numeric" aria-label="Up next">
          {sky ? (
            <button type="button" className="hud__upnext-item hud__sky" onClick={() => onHelp?.('sky')}>
              {sky}
            </button>
          ) : null}
          {week ? (
            <button type="button" className={`hud__upnext-item hud__week hud__week--${week.kind}`} onClick={week.open}>
              {week.name}
            </button>
          ) : null}
          {(upNext ?? []).map(({ item, open }) =>
            open ? (
              <button key={item.id} type="button" className="hud__upnext-item" onClick={open}>
                {upNextText(item)}
              </button>
            ) : (
              <span key={item.id} className="hud__upnext-item">
                {upNextText(item)}
              </span>
            ),
          )}
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
