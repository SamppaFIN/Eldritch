/**
 * ESC closes the sheet (claude.md §14, WCAG 2.2).
 *
 * `HelpPanel`, `LogPanel`, `CharacterPanel` and `CodexPanel` each grew their own copy of
 * this listener; the two sheets a player opens most — the cell card and the Keep — never
 * got one (BRDC-UI-003). An audit of every surface found it: with the Keep unable to
 * close, its buttons were still on screen behind Research and You, which is both a
 * keyboard trap and a pile of controls belonging to a panel the player thought they had
 * left.
 *
 * Kept as a hook rather than copied a fifth time. `onClose` is read through a ref so a
 * caller passing a fresh arrow each render does not re-bind the listener every frame —
 * the same class of mistake that made the store loop in BRDC-ECON-009.
 */
import { useEffect, useRef } from 'react';

export function useEscape(active: boolean, onClose: () => void): void {
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}
