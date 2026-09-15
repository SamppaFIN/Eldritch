/**
 * Whether the walking sheet is showing, remembered across reloads.
 *
 * The document folds this sheet away ("drag the handle or tap the map to bring it back"),
 * and the field report is why it matters: at full height it was taking half the screen
 * against a thirty per cent budget, and the map is the game.
 *
 * Remembered, because someone who folded it away was not asking to do it again at the
 * next traffic light. Its own key rather than a `Settings` field: this is a view state
 * the player flicks several times a walk, not a preference they set once, and `Settings`
 * is shared with the menu screen.
 */
import { useState } from 'react';

const KEY = 'es3:hud-sheet';

export function useHudFold(): { shown: boolean; fold: () => void } {
  const [shown, setShown] = useState(() => {
    try {
      return window.localStorage.getItem(KEY) !== 'folded';
    } catch {
      // A private window is allowed to forget.
      return true;
    }
  });

  const fold = () => {
    setShown((was) => {
      try {
        window.localStorage.setItem(KEY, was ? 'folded' : 'open');
      } catch {
        /* Still works for this session. */
      }
      return !was;
    });
  };

  return { shown, fold };
}
