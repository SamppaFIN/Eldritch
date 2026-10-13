/**
 * Whether the walking sheet is narrow or wide, remembered across reloads (BRDC-HUD-006).
 *
 * The document folds this sheet away ("drag the handle or tap the map to bring it back"),
 * and the field report is why it matters: at full height it was taking half the screen
 * against a thirty per cent budget, and the map is the game. Folded to nothing, though,
 * it hid Collect and the next step too — so it folds to narrow now, and narrow is where a
 * new player starts (Infinite 2026-10-13). A new key: the old `es3:hud-sheet` said
 * open-or-hidden, and everyone starts narrow once.
 *
 * Remembered, because someone who widened it was not asking to do it again at the next
 * traffic light. Its own key rather than a `Settings` field: this is a view state the
 * player flicks several times a walk, not a preference they set once.
 */
import { useState } from 'react';

const KEY = 'es3:hud-size';

export function useHudFold(): { wide: boolean; toggle: () => void } {
  const [wide, setWide] = useState(() => {
    try {
      return window.localStorage.getItem(KEY) === 'wide';
    } catch {
      // A private window is allowed to forget.
      return false;
    }
  });

  const toggle = () => {
    setWide((was) => {
      try {
        window.localStorage.setItem(KEY, was ? 'narrow' : 'wide');
      } catch {
        /* Still works for this session. */
      }
      return !was;
    });
  };

  return { wide, toggle };
}
