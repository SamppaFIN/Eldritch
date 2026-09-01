/**
 * The player's switches, held in React and written straight back to storage.
 *
 * `settings.ts` owns the record and its defaults; this is the one line MapView needs —
 * a value and a setter that persists on every change, so a toggle is never lost to a
 * reload. Pulled out to keep MapView under its line limit.
 */
import { useCallback, useState } from 'react';
import { loadSettings, saveSettings } from './settings.js';
import type { Settings } from './settings.js';

export function useSettings(): [Settings, (next: Settings) => void] {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const update = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
  }, []);
  return [settings, update];
}
