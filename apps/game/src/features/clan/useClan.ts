/**
 * The clan, shared and reactive — same reason as `useNation.ts`: more than one screen
 * will read this (the menu's own row, and `BRDC-CLAN-002`'s league panel showing "your
 * own clan"), and a plain `useState(readClan)` in each would never see the other change.
 *
 * `writeClan`/`leaveClan` dispatch `CLAN_CHANGED_EVENT` themselves (BRDC-CLAN-003) — not
 * only this hook's own `set`/`leave` calls it, but `useSharedWorld.ts`'s `publish()` too,
 * when the Worker says the founder removed this player mid-session.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { CLAN_CHANGED_EVENT, leaveClan, readClan, writeClan } from './clan.js';
import type { Clan } from './clan.js';

let snapshot: Clan = readClan();

function subscribe(onChange: () => void): () => void {
  const handler = (): void => {
    snapshot = readClan();
    onChange();
  };
  window.addEventListener(CLAN_CHANGED_EVENT, handler);
  window.addEventListener('storage', handler); // another tab
  return () => {
    window.removeEventListener(CLAN_CHANGED_EVENT, handler);
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
  }, []);
  const leave = useCallback(() => {
    snapshot = leaveClan();
  }, []);
  return { clan, set, leave };
}
