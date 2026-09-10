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
import { load } from '@es3/core';
import type { GameRepository, H3Index, PlayerProfile } from '@es3/core';
import { createRepository } from '../../data/createRepository.js';
import type { NoticeConditions } from '../hud/notices.js';

/** The three things `createRepository` can report about the save it opened. */
export type BootAlerts = Pick<NoticeConditions, 'durable' | 'schemaReset' | 'razed'>;
const QUIET: BootAlerts = { durable: true, schemaReset: false, razed: 0 };

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
      const handle = await createRepository();
      if (cancelled) return;
      setRepository(handle.repository);
      setAlerts({ durable: handle.durable, schemaReset: handle.reset, razed: handle.razed.length });
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

  return { repository, alerts, profile, setProfile, castle };
}
