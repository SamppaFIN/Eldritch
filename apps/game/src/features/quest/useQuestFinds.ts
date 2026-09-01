/**
 * Finding a secret by walking onto it (BRDC-QUEST-001).
 *
 * The three ways past the troll are not on the map. This watches the cell under the
 * player's feet while the Fuming Lake is running, and the first time it is one of those
 * cells, records the find and hands back the item so the reveal can show it. After that
 * the site is a normal gold marker like the rest of the path.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { secretSiteAt } from '@es3/core';
import type { GameRepository, H3Index, SecretSiteId } from '@es3/core';

export function useQuestFinds(
  repository: GameRepository | null,
  standingOn: H3Index | null,
  active: boolean,
  now: () => number,
): {
  finds: readonly SecretSiteId[];
  justFound: SecretSiteId | null;
  dismiss: () => void;
} {
  const [finds, setFinds] = useState<readonly SecretSiteId[]>([]);
  const [justFound, setJustFound] = useState<SecretSiteId | null>(null);
  const seen = useRef<SecretSiteId | null>(null);

  useEffect(() => {
    void repository?.getQuestFinds().then(setFinds);
  }, [repository]);

  useEffect(() => {
    if (!repository || !active || !standingOn) return;
    const site = secretSiteAt(standingOn);
    if (!site || site === seen.current || finds.includes(site)) return;
    seen.current = site;
    void repository.recordQuestFind(site, now()).then((found) => {
      if (!found) return;
      setJustFound(found);
      void repository.getQuestFinds().then(setFinds);
    });
  }, [repository, active, standingOn, finds, now]);

  const dismiss = useCallback(() => setJustFound(null), []);
  return { finds, justFound, dismiss };
}
