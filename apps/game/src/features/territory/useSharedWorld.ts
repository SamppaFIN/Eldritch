/**
 * Taking part in the shared world (BRDC-SHARE-002, -003).
 *
 * Reading is always on (Infinite 2026-09-30: everyone who has raised a banner this season
 * shows on the map); `enabled` governs only sending your own ground. `publish` POSTs it to
 * the Worker — one request, no tab, no account — stamped with the season it was raised in.
 */
import { useCallback, useEffect, useRef } from 'react';
import type { BBox, GameRepository, WorldIdentity } from '@es3/core';
import { useWorld } from './useWorld.js';
import { publishSubmission } from '../../data/worldSource.js';
import { seasonOnce } from '../../data/season.js';
import type { PublishResult } from '../../data/worldSource.js';
import { readNation } from '../nation/nation.js';
import { leaveClan, readClan } from '../clan/clan.js';
import { useClan } from '../clan/useClan.js';

/** How often a sharing player re-publishes on their own, and how often it checks whether
 *  their name (or nation, banner, clan) changed and so should go out sooner. */
const AUTO_PUBLISH_MS = 60 * 60_000;
const AUTO_CHECK_MS = 60_000;
/** After a publish that did not go through (429, no network, quota), leave the Worker alone. */
const RETRY_AFTER_FAIL_MS = 15 * 60_000;

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
  const { clan: myClan } = useClan();
  const stirred = useWorld({
    repository,
    bbox,
    now,
    onMerged,
    clanId: enabled ? myClan.clanId || null : null,
  });

  const publish = useCallback(async (): Promise<PublishResult> => {
    if (!repository) return 'failed';
    const n = readNation();
    const identity: WorldIdentity = {};
    if (n.name.trim()) identity.nation = n.name.trim();
    if (n.bannerId) identity.banner = n.bannerId;
    const clan = readClan();
    if (clan.clanId) identity.clanId = clan.clanId;
    const exported = await repository.exportWorldSource(now(), identity);
    // A Season 2 realm (it has a Keep) says which season its banner went up in.
    const season = await seasonOnce();
    const s2 = season && season.n >= 2 && (await repository.keep.view(now())) !== null;
    const source = s2 ? { ...exported, season: season.n } : exported;
    const outcome = await publishSubmission(source);
    // The founder removed this player (BRDC-CLAN-003) — their own file cannot be
    // edited, so this is the moment the Worker can actually say so.
    if (outcome.kicked) leaveClan();
    return outcome.status;
  }, [repository, now]);

  /*
   * Publishing on its own (BRDC-SEASON-001). The only caller used to be the Keep's "Raise
   * your banner" button — so nobody's figures reached the Worker unless they pressed it,
   * and Route mode, which has no Keep, could never publish at all. While sharing is on
   * this sends the realm shortly after opening the map, hourly after that, and at once
   * when the player's name, nation, banner or clan changes (Infinite: a rename should
   * reach the lists). A publish that fails is not retried for fifteen minutes — retrying
   * every check hammered the Worker into its quota.
   */
  const publishRef = useRef(publish);
  publishRef.current = publish;
  const last = useRef<{ at: number; key: string } | null>(null);
  const retryAt = useRef(0);
  useEffect(() => {
    if (!enabled || !repository) return;
    let stopped = false;
    const check = async () => {
      if (Date.now() < retryAt.current) return;
      const profile = await repository.getProfile();
      const n = readNation();
      const key = [profile.name, n.name, n.bannerId, readClan().clanId].join('|');
      const due =
        !last.current || last.current.key !== key || Date.now() - last.current.at >= AUTO_PUBLISH_MS;
      if (!due || stopped) return;
      if ((await publishRef.current()) === 'ok') last.current = { at: Date.now(), key };
      else retryAt.current = Date.now() + RETRY_AFTER_FAIL_MS;
    };
    const first = setTimeout(() => void check(), 3_000);
    const every = setInterval(() => void check(), AUTO_CHECK_MS);
    return () => {
      stopped = true;
      clearTimeout(first);
      clearInterval(every);
    };
  }, [enabled, repository]);

  return { stirredMs: enabled ? stirred : null, publish };
}
