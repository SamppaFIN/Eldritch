/**
 * Kingdoms retired on this device, read when the page opens (BRDC-HALL-001).
 *
 * A ledger you visit, not a live feed — it only changes when a kingdom is retired, and
 * that reloads the app anyway. One read of `getHallOfFame`, newest first.
 *
 * BRDC-HALL-002 adds the reward: a chronicle, fetched only once a kingdom's row is opened
 * (most are never revisited, and the Worker call is not free) and written back so a later
 * visit shows it instantly rather than asking again.
 */
import { useEffect, useState } from 'react';
import { fallbackChronicle } from '@es3/core';
import type { GameRepository, HallOfFameEntry } from '@es3/core';
import { fetchKingdomStory } from '../../data/kingdomStory.js';
import { publishLegacy } from '../../data/legacy.js';

export interface HallOfFame {
  entries: readonly HallOfFameEntry[];
  loading: boolean;
  /** Ids currently fetching their chronicle. */
  revealing: ReadonlySet<string>;
  reveal: (id: string) => void;
  /** Ids currently publishing to the Chronicles (BRDC-HALL-003). */
  sharing: ReadonlySet<string>;
  share: (id: string) => void;
}

export function useHallOfFame(repository: GameRepository | null, open: boolean): HallOfFame {
  const [entries, setEntries] = useState<readonly HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealing, setRevealing] = useState<ReadonlySet<string>>(new Set());
  const [sharing, setSharing] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    if (!repository || !open) return;
    let alive = true;
    setLoading(true);
    void repository.getHallOfFame().then((list) => {
      if (!alive) return;
      setEntries([...list].reverse());
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [repository, open]);

  const reveal = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!repository || !entry || entry.story || revealing.has(id)) return;
    setRevealing((s) => new Set(s).add(id));

    void fetchKingdomStory(entry).then(async (story) => {
      const text = story ?? fallbackChronicle(entry);
      await repository.setKingdomStory(id, text);
      setEntries((list) => list.map((e) => (e.id === id ? { ...e, story: text } : e)));
      setRevealing((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    });
  };

  /** A kingdom retired before this feature existed, published on request rather than
   *  automatically — the concrete case this shipped for (BRDC-HALL-003). */
  const share = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!repository || !entry || sharing.has(id)) return;
    setSharing((s) => new Set(s).add(id));

    void (async () => {
      const profile = await repository.getProfile();
      const ok = await publishLegacy(profile.id, entry);
      if (ok) {
        const sharedAt = Date.now();
        await repository.setKingdomShared(id, sharedAt);
        setEntries((list) => list.map((e) => (e.id === id ? { ...e, sharedAt } : e)));
      }
      setSharing((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    })();
  };

  return { entries, loading, revealing, reveal, sharing, share };
}
