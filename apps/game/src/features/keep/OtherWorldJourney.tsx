/**
 * Through the gate (BRDC-OTHERWORLD-001), on the gate's own card: a glimpse of the world it
 * opens on and a way in; once inside, the encounter reached, faced one at a time. A journey
 * left half-way is here again when the card is opened.
 */
import { useCallback, useEffect, useState } from 'react';
import { RitualButton } from '@es3/ui';
import { SKILL_NAME } from '@es3/core';
import type { GameRepository, H3Index, JourneyView } from '@es3/core';
import './keep.css';

const REFUSAL: Readonly<Record<string, string>> = {
  'not-there': 'Walk onto the gate to step through.',
  home: 'You were sent home. Rest twelve hours first.',
  travelling: 'You are already on a journey — finish it first.',
  'no-gate': 'The gate is already shut.',
};

export interface OtherWorldJourneyProps {
  repository: GameRepository;
  gateId: string;
  h3: H3Index;
  here: boolean;
  now: number;
  /** A journey ended: the gate may have closed, the investigator changed. */
  onEnded: () => void;
}

export function OtherWorldJourney({ repository, gateId, h3, here, now, onEnded }: OtherWorldJourneyProps) {
  const [journey, setJourney] = useState<JourneyView | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => setJourney(await repository.otherWorld.journey()), [repository]);
  useEffect(() => {
    void load();
  }, [load, gateId]);

  const run = (act: () => Promise<{ ok: true; said: string; ended: boolean } | { ok: false; refused: string }>) => {
    if (busy) return;
    setBusy(true);
    void act().then(async (r) => {
      setSaid(r.ok ? r.said : (REFUSAL[r.refused] ?? 'That did not work.'));
      await load();
      setBusy(false);
      if (r.ok && r.ended) onEnded();
    });
  };

  const glimpse = repository.otherWorld.glimpse(gateId);
  const mine = journey?.gateId === gateId ? journey : null;

  return (
    <div className="keep-citizens" aria-label="Through the gate">
      {mine ? (
        <>
          <p className="hearth-panel__line">
            <strong>{mine.world.name} · {mine.stage} of {mine.of}.</strong> {mine.card.title}. {mine.card.text}
          </p>
          <RitualButton variant="primary" disabled={busy} onClick={() => run(() => repository.otherWorld.face(now))}>
            {`Face it · ${SKILL_NAME[mine.card.skill]} test, need ${mine.card.need}`}
          </RitualButton>
        </>
      ) : (
        <>
          <p className="hearth-panel__line">
            <em>{glimpse.text}</em>
          </p>
          <RitualButton variant="ghost" disabled={busy || !here || journey !== null} onClick={() => run(() => repository.otherWorld.enter(gateId, here ? h3 : null, now))}>
            {`Step through — into ${glimpse.name} · costs 1 health`}
          </RitualButton>
        </>
      )}
      {said ? (
        <p className="hearth-panel__line" role="status">
          {said}
        </p>
      ) : null}
    </div>
  );
}
