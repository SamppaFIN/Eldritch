/**
 * The player's switches, held in React and written straight back to storage.
 *
 * `settings.ts` owns the record and its defaults; this is the one line MapView needs —
 * a value and a setter that persists on every change, so a toggle is never lost to a
 * reload. Pulled out to keep MapView under its line limit.
 */
import { useCallback, useEffect, useState } from 'react';
import { loadSettings, saveSettings } from './settings.js';
import type { Settings } from './settings.js';

export function useSettings(): [Settings, (next: Settings) => void] {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const update = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  /*
   * Daylight is a root attribute, not a prop (Sigil §02).
   *
   * The flip has to reach every pane in the app at once — panels, sheets, the HUD, a
   * modal that has not mounted yet — and threading a boolean to each of them would mean
   * every future panel has to remember to accept it. `[data-daylight]` on <html> is one
   * line of CSS in `tokens.css` and nothing else in the app knows it exists.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (settings.daylight) root.setAttribute('data-daylight', '');
    else root.removeAttribute('data-daylight');
  }, [settings.daylight]);

  return [settings, update];
}
