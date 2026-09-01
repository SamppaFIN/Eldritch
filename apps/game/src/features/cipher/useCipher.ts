/**
 * Finding a cipher fragment by walking onto it (BRDC-CIPHER-001).
 *
 * Mirrors `useQuestFinds`: watches the cell under the player's feet, and the first time it
 * is a fragment cell, records it and hands back the index so the reveal can show it. The
 * view (held set, the writing once whole) comes from the repository.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { cipherShardAt } from '@es3/core';
import type { CipherView, GameRepository, H3Index } from '@es3/core';

const EMPTY: CipherView = { held: [], complete: false, fragments: [], inscription: null };

export function useCipher(
  repository: GameRepository | null,
  standingOn: H3Index | null,
  now: () => number,
  version: number,
): { view: CipherView; justFound: number | null; dismiss: () => void } {
  const [view, setView] = useState<CipherView>(EMPTY);
  const [justFound, setJustFound] = useState<number | null>(null);
  const seen = useRef<number | null>(null);

  const refetch = useCallback(async () => {
    if (repository) setView(await repository.getCipher());
  }, [repository]);

  useEffect(() => {
    void refetch();
  }, [refetch, version]);

  useEffect(() => {
    if (!repository || !standingOn) return;
    const index = cipherShardAt(standingOn);
    if (index === null || index === seen.current || view.held.includes(index)) return;
    seen.current = index;
    void repository.recordCipherShard(index, now()).then((found) => {
      if (found === null) return;
      setJustFound(found);
      void refetch();
    });
  }, [repository, standingOn, view.held, now, refetch]);

  const dismiss = useCallback(() => setJustFound(null), []);
  return { view, justFound, dismiss };
}
