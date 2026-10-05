/**
 * The walking sheet's own row of controls: Your lands and the Keeper's Counsel beside
 * the Vigil toggle (Infinite 2026-09-30, drawn on a screenshot: into the empty space
 * left of ○, not onto the nav bar).
 */
import { RitualButton } from '@es3/ui';
import { Vigil } from './Vigil.js';
import type { VigilProps } from './Vigil.js';
import type { StandardBinding } from '../territory/useStandard.js';

export interface SheetLinks {
  onOpenLands?: (() => void) | undefined;
  onOpenCounsel?: (() => void) | undefined;
  /** Plant your standard where you stand (BRDC-STANDARD-001). */
  standard?: StandardBinding | undefined;
}

export function SheetActions({ keepAlive, onOpenLands, onOpenCounsel, standard }: VigilProps & SheetLinks) {
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
      {standard?.said ? (
        <p className="hud__sheet-note" role="status">
          {standard.said}
        </p>
      ) : null}
    </>
  );
}
