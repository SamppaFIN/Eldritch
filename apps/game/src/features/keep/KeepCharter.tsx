/**
 * The Keeper's Charter on the Keep's Today tab (BRDC-ONBOARD-001): the one thing to do
 * next, why, how far along, and either "Show me" or the reward waiting to be claimed.
 * The steps and their order are `rules/charter.ts`; this only says the current one.
 *
 * BRDC-ONBOARD-004: the Keeper's Counsel speaks here now, and only when it is urgent —
 * starving, a gate near, the stores full — above the step, which waits its turn.
 */
import { useEffect, useState } from 'react';
import type { CharterPage, Counsel, GameRepository, ResourceKind, ResourcePool } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { RESOURCE_WORD } from '../territory/territoryFeatures.js';
import './keep.css';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

const WHERE: Record<Counsel['where'], string> = {
  keep: 'In the Keep.',
  hex: 'On the hex card of your own ground.',
  lore: 'In Research — the Lore.',
  map: 'Out on the map, on foot.',
};

/** "+40 timber, +30 stone". */
export function rewardText(reward: Partial<ResourcePool>): string {
  return (Object.entries(reward) as [ResourceKind, number][]).map(([k, v]) => `+${v} ${RESOURCE_WORD[k]}`).join(', ');
}

export interface CharterShowTargets {
  research?: (() => void) | undefined;
  hex?: ((h3: string) => void) | undefined;
}

export function KeepCharter({
  repository,
  now,
  onPouch,
  show,
}: {
  repository: GameRepository | null;
  now: number;
  onPouch: (pool: ResourcePool) => void;
  show: CharterShowTargets;
}) {
  // undefined while it is read; null once every step is claimed.
  const [page, setPage] = useState<CharterPage | null | undefined>(undefined);
  const [urgent, setUrgent] = useState<Counsel | null>(null);
  const [read, setRead] = useState(0);

  useEffect(() => {
    if (!repository) return;
    let live = true;
    void repository.charter.view(now).then((p) => live && setPage(p));
    void repository.keep.counsel(now).then((c) => live && setUrgent(c?.find((x) => x.id !== 'quiet') ?? null));
    return () => {
      live = false;
    };
  }, [repository, now, read]);

  if (!repository || (!page && !urgent)) return null;
  const urgentNote = urgent ? (
    <section className="keep-citizens keep-codex keep-charter keep-charter--urgent" aria-label="Urgent">
      <p className="hearth-panel__line">
        <strong>{urgent.title}.</strong> {urgent.why}
      </p>
      <p className="hearth-panel__line keep-charter__reward">{WHERE[urgent.where]}</p>
    </section>
  ) : null;
  if (!page) return urgentNote;
  const { step } = page;
  const go = step.show === 'research' ? show.research : page.hex && show.hex ? () => show.hex?.(page.hex as string) : undefined;
  const claim = async () => {
    const r = await repository.charter.claim(step.id, now);
    if (r.ok) onPouch(await repository.getResources(now));
    setRead((n) => n + 1);
  };

  return (
    <>
      {urgentNote}
      <section className="keep-citizens keep-codex keep-charter" aria-label="The Keeper's Charter">
        <p className="hearth-panel__line keep-charter__chapter es-numeric">
          Chapter {ROMAN[step.chapter]} · {page.chapterName} · {page.at} of {page.of}
        </p>
        <p className="hearth-panel__line">
          <strong>{page.title}</strong> {page.why}
        </p>
        {page.need > 1 ? (
          <p className="hearth-panel__line es-numeric">
            {page.have} / {page.need}
          </p>
        ) : null}
        {page.ready ? (
          <RitualButton onClick={() => void claim()}>Claim {rewardText(step.reward)}</RitualButton>
        ) : (
          <>
            <p className="hearth-panel__line keep-charter__reward">Reward: {rewardText(step.reward)}</p>
            {go ? (
              <RitualButton variant="ghost" onClick={go}>
                Show me
              </RitualButton>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
