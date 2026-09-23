/**
 * Opening the save: the repository, who you are, and where your Hearth is.
 *
 * Split out of `MapView`, which was at its four hundred lines (BRDC-ECON-008). The seam is
 * a real one rather than a convenient cut: everything here happens once, in order, before
 * the game can be played — and that order is the point. The repository has to exist before
 * the profile can be read, and the Hearth is written through only after both.
 *
 * The ordering is also what caused the bug this was split for. Founding happens *after*
 * the repository appears, so anything that read the pouch when the repository arrived read
 * it before the founding stash was granted. `castle` is published here so the rest of the
 * screen has something to notice: it changes exactly once, at the moment there is a Hearth
 * and a stash to go with it.
 */
import { useEffect, useState } from 'react';
import {
  anchorQuestSites,
  cellCentre,
  load,
  pinQuestCells,
  resolveQuestCells,
  saveNow,
} from '@es3/core';
import type { GameMode, GameRepository, H3Index, PlayerProfile, QuestSiteId } from '@es3/core';
import { createRepository } from '../../data/createRepository.js';
import type { NoticeConditions } from '../hud/notices.js';

/** What `createRepository` can report about the save it opened. */
export type BootAlerts = Pick<NoticeConditions, 'durable' | 'schemaReset' | 'razed' | 'staleReveals'>;
const QUIET: BootAlerts = { durable: true, schemaReset: false, razed: 0, staleReveals: 0 };

export interface Boot {
  repository: GameRepository | null;
  /** What the boot found and had to say about it — one value, so `MapNotices` takes it whole. */
  alerts: BootAlerts;
  profile: PlayerProfile | null;
  /** A claim pays XP, so the claim path pushes a fresh profile back in (BRDC-CLAIM-009). */
  setProfile: (p: PlayerProfile | null) => void;
  /** The Keep, which is the Hearth cell. Null until there is one. */
  castle: H3Index | null;
}

export function useBoot(now: () => number, clock: unknown): Boot {
  const [repository, setRepository] = useState<GameRepository | null>(null);
  const [alerts, setAlerts] = useState<BootAlerts>(QUIET);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [castle, setCastle] = useState<H3Index | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      /*
       * Read before the repository exists, and passed into its own creation — not set
       * afterwards. `createRepository`'s internal setup (`takeRazed` → `getOwnedCells`
       * → `getProfile`) touches the profile before this effect gets control back, so a
       * `setMode` call made here, after `await createRepository()`, is already too
       * late: the profile exists by then, at whatever mode `readProfile`'s own default
       * gave it. A save from before BRDC-MODE-001 existed, or one already resumed,
       * carries no mark and needs none — the default is `'adventure'` either way.
       */
      const modeMark = load<{ mode: GameMode } | null>('mode', null);
      const handle = await createRepository(modeMark?.mode);
      if (cancelled) return;
      setRepository(handle.repository);
      setAlerts({
        durable: handle.durable,
        schemaReset: handle.reset,
        razed: handle.razed.length,
        staleReveals: handle.staleReveals.length,
      });
      setProfile(await handle.repository.getProfile());
      // A returning player already has a Keep; setHome below only fires for a fresh one.
      setCastle(await handle.repository.getCastle());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Write the accepted Hearth through once — a claimed cell and an Anchor Stone. Guarded
  // on `getHome` so a save that already has one is never overwritten; `setHome` itself is
  // idempotent under a double call (the effect re-fires on every fresh `clock`).
  useEffect(() => {
    if (!repository) return;
    const mark = load<{ position: { lat: number; lng: number } } | null>('hearth', null);
    if (!mark) return;
    void (async () => {
      if (await repository.getHome()) return;
      await repository.setHome(mark.position, now());
      setProfile(await repository.getProfile());
      setCastle(await repository.getCastle());
    })();
  }, [repository, clock, now]);

  /*
   * Move the Fuming Lake to the player's own ground (BRDC-QUEST-004).
   *
   * Its places were fixed coordinates in one Tampere park, so the tale could not be begun
   * by anybody who lives anywhere else — begun means standing on the statue. The authored
   * walk keeps its shape; only where it is walked changes.
   */
  useEffect(() => {
    anchorQuestSites(castle ? cellCentre(castle) : null);
    if (!castle) return;

    /*
     * Pin the tale to actual hexes, once (BRDC-QUEST-005).
     *
     * Field report: "quest pisteet onkin kartalla eri paikoissa… kartta on pysynyt
     * paikallaan. Mutta eri quest paikat on nyt siirtyneet." They were never written
     * down — every read recomputed them from the castle's centre, and the castle is
     * re-assigned whenever the Hearth is, so the whole tale slid with it. A site near a
     * hex boundary needs only a few metres to land in a different hex entirely.
     *
     * Written to the same small-facts store `last-collect` uses; seven h3 strings is not
     * IndexedDB's business. Once written they are never recomputed, so the statue stays
     * where the player walked to it.
     *
     * Key renamed `-v2` (BRDC-QUEST-006): every pin written before `anchorQuestSites`
     * stopped anchoring inside Härmälä is the *wrong* hex — the statue sitting on the
     * Keep, everything else slid the same vector. Reading the old key back as valid would
     * keep that mistake forever. The old key is simply never read again; nothing deletes
     * it, there is nothing there worth deleting.
     */
    const stored = load<Partial<Record<QuestSiteId, H3Index>>>('quest-cells-v2', {});
    if (Object.keys(stored).length > 0) {
      pinQuestCells(stored);
      return;
    }
    const cells = resolveQuestCells();
    pinQuestCells(cells);
    saveNow('quest-cells-v2', cells);
  }, [castle]);

  return { repository, alerts, profile, setProfile, castle };
}
