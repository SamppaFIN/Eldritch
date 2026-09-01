/**
 * Player-facing switches, kept in one small localStorage record.
 *
 * Sound and vibration only, for now. This is exactly the "small, bounded state" that
 * `persist/save.ts` documents itself for — one key, one shape, no growth — so it rides
 * the same `saveNow`/`load` helpers as the session and the Hearth mark, not IndexedDB.
 */
import { load, saveNow } from '@es3/core';

export interface Settings {
  sound: boolean;
  vibration: boolean;
}

const KEY = 'settings';

/** Both on until the player turns them off — the claim chime is a reward, not a nag. */
export const DEFAULT_SETTINGS: Settings = { sound: true, vibration: true };

export function loadSettings(): Settings {
  const stored = load<Partial<Settings>>(KEY, DEFAULT_SETTINGS);
  return {
    sound: stored.sound ?? DEFAULT_SETTINGS.sound,
    vibration: stored.vibration ?? DEFAULT_SETTINGS.vibration,
  };
}

export function saveSettings(next: Settings): void {
  saveNow(KEY, next);
}
