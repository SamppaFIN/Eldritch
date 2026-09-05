/**
 * Research: the frontier, the era boundary, and the one action the screen offers
 * (BRDC-TECH-001).
 *
 * Lifted out of useSelection when adding a pending state pushed that file over its line
 * limit — research is as self-contained as trade routes already were (useTradeRoutes.ts):
 * its own binding, its own panel, one seam into the rest of selection (`afterSpend`).
 */
import { useCallback, useEffect, useState } from 'react';
import { eraOf, researchableSchoolless } from '@es3/core';
import type { Era, GameRepository, H3Index, TechId, TechRefusal, TempleSchool } from '@es3/core';
import type { ResearchBinding } from './useSelection.js';

export function useResearch(
  repository: GameRepository | null,
  now: () => number,
  trailVersion: number,
  /** Research pays wisdom: re-read the pouch and the map, same as build, ward and cast. */
  afterSpend: () => Promise<void>,
): ResearchBinding {
  const [researched, setResearched] = useState<readonly TechId[]>([]);
  const [techRefusal, setTechRefusal] = useState<TechRefusal | null>(null);
  const [lastEra, setLastEra] = useState<Era | null>(null);
  const [researching, setResearching] = useState<TechId | null>(null);
  const [schools, setSchools] = useState<Readonly<Record<H3Index, TempleSchool>>>({});

  const refreshSchools = useCallback(() => {
    void repository?.getTempleSchools().then(setSchools);
  }, [repository]);

  useEffect(() => {
    if (!repository) return;
    let alive = true;
    void repository.getResearched().then((r) => {
      if (alive) setResearched(r);
    });
    return () => {
      alive = false;
    };
  }, [repository, trailVersion]);
  useEffect(refreshSchools, [refreshSchools]);

  const onChooseSchool = useCallback(
    (h3: H3Index, school: TempleSchool) => {
      if (!repository) return;
      void repository.assignTempleSchool(h3, school, now()).then((r) => {
        if (r.ok) refreshSchools();
      });
    },
    [repository, now, refreshSchools],
  );

  const onResearch = useCallback(
    (id: TechId) => {
      if (!repository || researching) return;
      setLastEra(null);
      setResearching(id);
      void (async () => {
        const r = await repository.researchTech(id, now());
        setTechRefusal(r.ok ? null : r.refused);
        if (r.ok) {
          setResearched(r.researched);
          if (r.era) setLastEra(r.era);
          await afterSpend();
        }
        setResearching(null);
      })();
    },
    [repository, now, afterSpend, researching],
  );

  return {
    researched,
    era: eraOf(researched),
    // The Keep's own list: technologies with no school stay here (BRDC-TEMPLE-002) —
    // the schooled ones move to whichever temple teaches them.
    options: researchableSchoolless([...researched]),
    refusal: techRefusal,
    lastEra,
    researching,
    schools,
    onChooseSchool,
    onResearch,
  };
}
