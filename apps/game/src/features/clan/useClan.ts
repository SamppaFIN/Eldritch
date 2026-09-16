/**
 * The clan, shared and reactive — same reason as `useNation.ts`: more than one screen
 * will read this (the menu's own row, and `BRDC-CLAN-002`'s league panel showing "your
 * own clan"), and a plain `useState(readClan)` in each would never see the other change.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { leaveClan, readClan, writeClan } from './clan.js';
import type { Clan } from './clan.js';

const EVENT = 'es3:clan-changed';

let snapshot: Clan = readClan();

function subscribe(onChange: () => void): () => void {
  const handler = (): void => {
    snapshot = readClan();
    onChange();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler); // another tab
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export interface UseClan {
  clan: Clan;
  set: (next: Clan) => void;
  leave: () => void;
}

export function useClan(): UseClan {
  const clan = useSyncExternalStore(subscribe, () => snapshot);
  const set = useCallback((next: Clan) => {
    snapshot = writeClan(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  const leave = useCallback(() => {
    snapshot = leaveClan();
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { clan, set, leave };
}
