/**
 * The shared world, merged in as the map moves (BRDC-SHARE-001).
 *
 * For the regions on screen, fetch `world/<res6>.json`, import each shard as read-only
 * rival territory, and report how stale the freshest one is. Every part is optional — a
 * missing shard, no network, a torn file — and the game is unchanged without it, so this
 * hook never surfaces an error, only an age or `null`.
 */
import { useEffect, useRef, useState } from 'react';
import { regionsCoveringBBox } from '@es3/core';
import type { BBox, GameRepository } from '@es3/core';
import { fetchWorldShards } from '../../data/worldSource.js';

export interface UseWorldOptions {
  repository: GameRepository | null;
  bbox: BBox | null;
  now: () => number;
  /** Called after shards are merged, so the territory layer can re-read. */
  onMerged: () => void | Promise<void>;
}

/** Milliseconds since the freshest merged shard was generated, or `null` if none. */
export function useWorld({ repository, bbox, now, onMerged }: UseWorldOptions): number | null {
  const [stirredMs, setStirredMs] = useState<number | null>(null);
  const fetchedFor = useRef('');

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
        const result = await repository.importWorld(text, now());
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
