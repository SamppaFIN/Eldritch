/**
 * The Character screen's data (BRDC-CHAR-001).
 *
 * Its own fetch of the three things the screen shows that live in the repository — the
 * profile, the items found by walking, the achievement list — and one verb, rename.
 * Mirrors `useKeepEconomy`. `version` (trail length / lastClaim) forces a re-read.
 */
import { useCallback, useEffect, useState } from 'react';
import type {
  AchievementView,
  CipherView,
  GameRepository,
  PlayerProfile,
  SecretSiteId,
} from '@es3/core';

const NO_CIPHER: CipherView = { held: [], complete: false, fragments: [], inscription: null };

export interface CharacterData {
  profile: PlayerProfile | null;
  finds: readonly SecretSiteId[];
  achievements: readonly AchievementView[];
  cipher: CipherView;
  onRename: (name: string) => void;
}

export function useCharacter(
  repository: GameRepository | null,
  now: () => number,
  open: boolean,
  version: number,
): CharacterData {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [finds, setFinds] = useState<readonly SecretSiteId[]>([]);
  const [achievements, setAchievements] = useState<readonly AchievementView[]>([]);
  const [cipher, setCipher] = useState<CipherView>(NO_CIPHER);

  const refetch = useCallback(async () => {
    if (!repository) return;
    setProfile(await repository.getProfile());
    setFinds(await repository.getQuestFinds());
    setAchievements(await repository.getAchievements(now()));
    setCipher(await repository.getCipher());
  }, [repository, now]);

  useEffect(() => {
    if (open) void refetch();
  }, [open, version, refetch]);

  const onRename = useCallback(
    (name: string) => {
      if (!repository) return;
      void repository.setPlayerName(name).then(setProfile);
    },
    [repository],
  );

  return { profile, finds, achievements, cipher, onRename };
}
