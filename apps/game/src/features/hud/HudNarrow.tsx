/**
 * The narrow walking sheet (BRDC-HUD-006): who you are, how much you hold, Collect — and
 * the one thing the game asks next, the Up next strip's first row (the Keeper's Charter's
 * step). Everything else waits in the wide sheet, a tap on the handle away. The map is
 * the game, and HUD-001 gives the HUD under a third of a phone screen.
 */
import { upNextText } from '@es3/core';
import type { UpNextRow } from './useUpNext.js';

export interface HudNarrowProps {
  /** "1 · Dormant", or "Walking" on a route-mode save. */
  who: string;
  ownedCells: number;
  onCollect?: (() => void) | undefined;
  next?: UpNextRow | undefined;
}

export function HudNarrow({ who, ownedCells, onCollect, next }: HudNarrowProps) {
  return (
    <>
      <div className="hud__narrow">
        <span className="hud__value hud__value--level hud__narrow-who">{who}</span>
        <span className="hud__value hud__value--warded es-numeric">
          {ownedCells > 0 ? ownedCells : '—'}
          <span className="hud__sub"> hexes</span>
        </span>
        {onCollect ? (
          <button type="button" className="hud__collect hud__collect--narrow" onClick={onCollect}>
            Collect
          </button>
        ) : null}
      </div>
      {next ? (
        <p className="hud__upnext es-numeric" aria-label="Up next">
          {next.open ? (
            <button type="button" className="hud__upnext-item" onClick={next.open}>
              {upNextText(next.item)}
            </button>
          ) : (
            <span className="hud__upnext-item">{upNextText(next.item)}</span>
          )}
        </p>
      ) : null}
    </>
  );
}
