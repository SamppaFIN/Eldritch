/**
 * The walking sheet's own row of controls: Your lands and the Keeper's Counsel beside
 * the Vigil toggle (Infinite 2026-09-30, drawn on a screenshot: into the empty space
 * left of ○, not onto the nav bar).
 */
import { RitualButton } from '@es3/ui';
import { Vigil } from './Vigil.js';
import type { VigilProps } from './Vigil.js';

export interface SheetLinks {
  onOpenLands?: (() => void) | undefined;
  onOpenCounsel?: (() => void) | undefined;
}

export function SheetActions({ keepAlive, onOpenLands, onOpenCounsel }: VigilProps & SheetLinks) {
  return (
    <>
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
    </>
  );
}
