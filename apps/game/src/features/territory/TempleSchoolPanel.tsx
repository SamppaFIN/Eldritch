/**
 * A temple's element, and what it teaches (BRDC-TEMPLE-002).
 *
 * Consecrating a temple (`ConsecratePanel`) makes a place; choosing an element makes it
 * *this* temple, once and for good. Before that it is just a temple with nothing to
 * teach — this is where a player who wants to learn a Rite is sent, instead of decoding
 * which of ten mystery technologies in the Keep happens to unlock one.
 */
import { RitualButton } from '@es3/ui';
import { TEMPLE_SCHOOLS, canResearch, riteChain } from '@es3/core';
import type { ResourcePool, TempleSchool } from '@es3/core';
import { titleCase } from './BuildPanel.js';
import { SCHOOL_RITE, spellEffect } from './catalogue.js';
import { SPELL_NAME } from './names.js';
import { TechRow } from './ResearchPanel.js';
import type { ResearchBinding } from './useSelection.js';

/** One glyph per element, from the same monochrome register as the terrain and rite
 *  marks — no colour photograph of a flame, just a shape (`claude.md` §12/§14). */
const GLYPH: Readonly<Record<TempleSchool, string>> = {
  fire: '△',
  water: '≈',
  earth: '▦',
  air: '◇',
  nature: '❋',
  spirit: '✦',
};

export interface TempleSchoolPanelProps {
  h3: string;
  school: TempleSchool | null;
  research: ResearchBinding;
  pool: ResourcePool | null;
  wisdomPerHour: number;
}

export function TempleSchoolPanel({ h3, school, research, pool, wisdomPerHour }: TempleSchoolPanelProps) {
  const wisdom = pool?.wisdom ?? 0;

  if (!school) {
    return (
      <div className="hearth-panel__research">
        <p className="hearth-panel__research-head">Choose this temple&rsquo;s element</p>
        <p className="hearth-panel__line">
          A temple teaches one element for good. Every fire temple you ever raise teaches
          the same rites — what matters is that you hold one, awake, of each element you want.
        </p>
        <div className="hearth-panel__schools">
          {TEMPLE_SCHOOLS.map((s) => (
            <RitualButton
              key={s}
              variant="ghost"
              className="hearth-panel__school"
              onClick={() => research.onChooseSchool(h3, s)}
            >
              <span aria-hidden>{GLYPH[s]}</span> {titleCase(s)}
            </RitualButton>
          ))}
        </div>
      </div>
    );
  }

  const rite = SCHOOL_RITE[school];
  const chain = riteChain(research.researched, school);
  return (
    <div className="hearth-panel__research">
      <p className="hearth-panel__research-head">
        <span aria-hidden>{GLYPH[school]}</span> {titleCase(school)} temple
      </p>
      {chain.length === 0 ? (
        <p className="hearth-panel__line">
          Its Rite, {SPELL_NAME[rite]}, is yours. {spellEffect(rite)}
        </p>
      ) : (
        <>
          <p className="hearth-panel__line">
            The path to {SPELL_NAME[rite]} — research it here, in order.
          </p>
          {chain.map((id) => (
            <TechRow
              key={id}
              id={id}
              wisdom={wisdom}
              pending={research.researching === id}
              pool={pool}
              wisdomPerHour={wisdomPerHour}
              onResearch={research.onResearch}
              locked={!canResearch(research.researched, id)}
            />
          ))}
        </>
      )}
    </div>
  );
}
