/**
 * Taking part in the shared world (BRDC-SHARE-002).
 *
 * One switch, both directions. When `enabled` is off nothing is fetched and `publish` is
 * a no-op; when it is on, `useWorld` pulls the shards for the viewport and `publish` opens
 * a prefilled GitHub issue carrying the player's own ground to the cron job. There is no
 * key on the client — the issue is the whole write path.
 */
import { useCallback } from 'react';
import type { BBox, GameRepository, WorldIdentity } from '@es3/core';
import { useWorld } from './useWorld.js';
import { worldSubmissionUrl } from '../../data/worldSource.js';
import { readNation } from '../nation/nation.js';

export interface UseSharedWorldOptions {
  repository: GameRepository | null;
  bbox: BBox | null;
  now: () => number;
  onMerged: () => void | Promise<void>;
  enabled: boolean;
}

export function useSharedWorld({
  repository,
  bbox,
  now,
  onMerged,
  enabled,
}: UseSharedWorldOptions): { stirredMs: number | null; publish: () => void } {
  const stirred = useWorld({ repository, bbox: enabled ? bbox : null, now, onMerged });

  const publish = useCallback(() => {
    if (!repository) return;
    const n = readNation();
    const identity: WorldIdentity = {};
    if (n.name.trim()) identity.nation = n.name.trim();
    if (n.bannerId) identity.banner = n.bannerId;
    void repository.exportWorldSource(now(), identity).then((source) => {
      window.open(worldSubmissionUrl(source), '_blank', 'noopener');
    });
  }, [repository, now]);

  return { stirredMs: enabled ? stirred : null, publish };
}
