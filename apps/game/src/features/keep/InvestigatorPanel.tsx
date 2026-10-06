/**
 * Your investigator, in the Keep (BRDC-INVEST-001, handoff F-40/F-41).
 *
 * Unchosen, the four archetypes are offered; tapping one shows who they are, and a second,
 * named button commits — the choice holds for this kingdom, so it is not one tap away from
 * a mistake. Chosen, the portrait, the ability and the stats as the screen names them:
 * Will, Lore, Vigor and Wit — Health and Sanity sit on the gates' line below. Nothing on
 * a Season 1 save.
 */
import { useEffect, useState } from 'react';
import { ARCHETYPES, SKILL_NAME } from '@es3/core';
import type { ArchetypeId, GameRepository, InvestigatorView, Skill } from '@es3/core';
import { RitualButton } from '@es3/ui';
import { InvestigatorPortrait } from './InvestigatorPortrait.js';

const ORDER: readonly Skill[] = ['will', 'lore', 'fight', 'observe'];

export function InvestigatorPanel({ repository, now }: { repository: GameRepository | null; now: number }) {
  const [view, setView] = useState<InvestigatorView | null>(null);
  const [picked, setPicked] = useState<ArchetypeId | null>(null);
  useEffect(() => {
    if (repository) void repository.investigator.view(now).then(setView);
    // Once per opening of the Keep, as the gates beside it.
  }, [repository]);

  if (!view || !repository) return null;
  const chosen = view.archetype;
  const choice = ARCHETYPES.find((a) => a.id === picked) ?? null;
  const begin = () => {
    if (picked) void repository.investigator.choose(picked, now).then((r) => r.ok && setView(r.view));
  };

  return (
    <>
      <h3 className="hearth-panel__section">Your investigator</h3>
      <section className="keep-citizens investigator" aria-label="Your investigator">
        {chosen ? (
          <div className="investigator__chosen">
            <InvestigatorPortrait id={chosen.id} />
            <div>
              <p className="investigator__name">{chosen.name} · {chosen.title}</p>
              <p className="hearth-panel__line">{chosen.perk}</p>
            </div>
          </div>
        ) : (
          <>
            <p className="hearth-panel__line">Choose who walks for this kingdom. The choice holds until it retires.</p>
            <div className="investigator__choices" role="group" aria-label="Choose your investigator">
              {ARCHETYPES.map((a) => (
                <button key={a.id} type="button" className="investigator__pick" aria-pressed={picked === a.id} onClick={() => setPicked(a.id)}>
                  <InvestigatorPortrait id={a.id} size={48} />
                  <span>{a.title}</span>
                </button>
              ))}
            </div>
            {choice ? (
              <>
                <p className="investigator__name">{choice.name} · {SKILL_NAME[choice.skill]} 4</p>
                <p className="hearth-panel__line">{choice.story}</p>
                <p className="hearth-panel__line">{choice.perk}</p>
                <RitualButton onClick={begin}>{`Begin as ${choice.name}`}</RitualButton>
              </>
            ) : null}
          </>
        )}
        <p className="hearth-panel__line es-numeric">
          {ORDER.map((s) => `${SKILL_NAME[s]} ${view.skills[s]}`).join(' · ')}
        </p>
        {/* Who walks with them (BRDC-ALLY-001): one at a time, swapped only when asked. */}
        {view.ally ? <p className="hearth-panel__line">Walks with you: {view.ally.name} · {view.ally.gift}</p> : null}
        {view.allyOffer ? (
          <div className="investigator__offer" role="group" aria-label="An ally offers">
            <p className="hearth-panel__line">
              {view.allyOffer.name} offers to walk with you instead · {view.allyOffer.gift}
            </p>
            <RitualButton onClick={() => void repository.investigator.answerAlly(true, now).then((v) => v && setView(v))}>
              {`Take ${view.allyOffer.name.split(',')[0]}`}
            </RitualButton>
            <RitualButton variant="ghost" onClick={() => void repository.investigator.answerAlly(false, now).then((v) => v && setView(v))}>
              {`Keep ${view.ally?.name.split(',')[0] ?? 'as you are'}`}
            </RitualButton>
          </div>
        ) : null}
      </section>
    </>
  );
}
