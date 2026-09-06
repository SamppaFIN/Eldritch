/**
 * The nation, shared and reactive (BRDC-NATION-001, field report 2026-09-06).
 *
 * It lives in one localStorage key, but two components need it at once now: the Keep's
 * `NationIdentity` picks the banner, and the map draws it on every held hex. A plain
 * `useState(readNation)` in each would never see the other's change. This is the one
 * store both read — an update writes through `writeNation` and notifies every subscriber.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { readNation, writeNation } from './nation.js';
import type { Nation } from './nation.js';

const EVENT = 'es3:nation-changed';

let snapshot: Nation = readNation();

function subscribe(onChange: () => void): () => void {
  const handler = (): void => {
    snapshot = readNation();
    onChange();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler); // another tab
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function useNation(): [Nation, (next: Nation) => void] {
  const nation = useSyncExternalStore(subscribe, () => snapshot);
  const update = useCallback((next: Nation) => {
    snapshot = writeNation(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [nation, update];
}
