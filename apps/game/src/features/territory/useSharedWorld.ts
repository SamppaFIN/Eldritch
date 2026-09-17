/**
 * Taking part in the shared world (BRDC-SHARE-002, -003).
 *
 * One switch, both directions. When `enabled` is off nothing is fetched and `publish` is
 * a no-op; when it is on, `useWorld` pulls the shards for the viewport and `publish` POSTs
 * the player's own ground to the Worker — one request, no tab, no account.
 */
import { useCallback } from 'react';
import type { BBox, GameRepository, WorldIdentity } from '@es3/core';
import { useWorld } from './useWorld.js';
import { publishSubmission } from '../../data/worldSource.js';
import type { PublishResult } from '../../data/worldSource.js';
import { readNation } from '../nation/nation.js';
import { readClan } from '../clan/clan.js';
import { useClan } from '../clan/useClan.js';

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
}: UseSharedWorldOptions): { stirredMs: number | null; publish: () => Promise<PublishResult> } {
  // Reactive, unlike the one-shot `readClan()` in `publish()` below: joining a clan while
  // the map is open should start pulling that clan's ground in without a reload.
  const { clan } = useClan();
  const stirred = useWorld({
    repository,
    bbox: enabled ? bbox : null,
    now,
    onMerged,
    clanId: enabled ? clan.clanId || null : null,
  });

  const publish = useCallback(async (): Promise<PublishResult> => {
    if (!repository) return 'failed';
    const n = readNation();
    const identity: WorldIdentity = {};
    if (n.name.trim()) identity.nation = n.name.trim();
    if (n.bannerId) identity.banner = n.bannerId;
    const clan = readClan();
    if (clan.clanId) identity.clanId = clan.clanId;
    const source = await repository.exportWorldSource(now(), identity);
    return publishSubmission(source);
  }, [repository, now]);

  return { stirredMs: enabled ? stirred : null, publish };
}
