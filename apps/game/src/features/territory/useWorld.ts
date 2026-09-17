/**
 * The shared world, merged in as the map moves (BRDC-SHARE-001).
 *
 * For the regions on screen, fetch `world/<res6>.json`, import each shard as read-only
 * rival territory, and report how stale the freshest one is. Every part is optional — a
 * missing shard, no network, a torn file — and the game is unchanged without it, so this
 * hook never surfaces an error, only an age or `null`.
 *
 * BRDC-CLAN-004 adds a second, independent fetch: a clanmate's ground pulled in by their
 * Keep's own region, not the camera's — a friend across town should not need you to pan
 * the map to them. The roster also supplies the id set both fetches use to mark a
 * clanmate's cells `ally` rather than a rival's, so standing right next to a clanmate
 * (reached via the ordinary viewport fetch) reads correctly too.
 */
import { useEffect, useRef, useState } from 'react';
import { regionOf, regionsCoveringBBox } from '@es3/core';
import type { BBox, GameRepository, PlayerId } from '@es3/core';
import { fetchWorldShards } from '../../data/worldSource.js';
import { fetchClanRoster } from '../../data/clanSource.js';

export interface UseWorldOptions {
  repository: GameRepository | null;
  bbox: BBox | null;
  now: () => number;
  onMerged: () => void | Promise<void>;
  /** This device's clan, if any — pulls that clan's ground in regardless of the camera
   *  (BRDC-CLAN-004). `null` fetches nothing extra. */
  clanId?: string | null;
}

/** Milliseconds since the freshest merged shard was generated, or `null` if none. */
export function useWorld({ repository, bbox, now, onMerged, clanId }: UseWorldOptions): number | null {
  const [stirredMs, setStirredMs] = useState<number | null>(null);
  const fetchedFor = useRef('');
  const alliesRef = useRef<ReadonlySet<PlayerId>>(new Set());
  const rosterFor = useRef<string | null>(null);

  // The clan's roster: who counts as an ally, and where to find their ground. Runs once
  // per clan id, independent of the viewport — this is the whole point.
  useEffect(() => {
    if (!repository || !clanId) {
      alliesRef.current = new Set();
      return;
    }
    if (rosterFor.current === clanId) return;
    rosterFor.current = clanId;

    let alive = true;
    void (async () => {
      const roster = await fetchClanRoster(clanId);
      if (!alive || !roster) return;
      alliesRef.current = new Set(roster.map((m) => m.id));
      const regions = [...new Set(roster.filter((m) => m.castle).map((m) => regionOf(m.castle!)))];
      if (regions.length === 0) return;
      for (const text of await fetchWorldShards(regions)) {
        await repository.importWorld(text, now(), alliesRef.current);
      }
      if (alive) await onMerged();
    })();

    return () => {
      alive = false;
    };
  }, [repository, clanId, now, onMerged]);

  useEffect(() => {
    if (!repository || !bbox) return;
    const regions = regionsCoveringBBox(bbox);
    const key = [...regions].sort().join(',');
    if (key === fetchedFor.current) return;
    fetchedFor.current = key;

    let alive = true;
    void (async () => {
      const shards = await fetchWorldShards(regions);
      if (!alive || shards.length === 0) return;

      let newest = 0;
      for (const text of shards) {
        const result = await repository.importWorld(text, now(), alliesRef.current);
        if (result.ok) newest = Math.max(newest, result.generatedAt);
      }
      if (!alive) return;
      if (newest > 0) setStirredMs(Math.max(0, now() - newest));
      await onMerged();
    })();

    return () => {
      alive = false;
    };
  }, [repository, bbox, now, onMerged]);

  return stirredMs;
}
