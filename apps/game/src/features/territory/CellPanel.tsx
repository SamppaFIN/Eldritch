/**
 * One cell, up close: what the ground is, who holds it, how long it has left, and the
 * first thing resources are for. Not a modal — the player is walking, and a focus trap
 * is the wrong shape for something you glance at and put away.
 */
import { CellStaff } from '../keep/CellStaff.js';
import { CellRites } from '../keep/CellRites.js';
import {
  ANCHOR_THRESHOLD_MS,
  MAX_STRENGTH,
  TEMPLE_THRESHOLD_MS,
  WARD_COST,
  shortOf,
  revealProgress,
} from '@es3/core';
import { WORKS_DEFS, terrainForCell } from '@es3/core';
import type { Cell, GameRepository, PlayerId, ResourcePool, WardRefusal } from '@es3/core';
import { WorksPage } from '../works/WorksPage.js';
import { useWorksPage } from '../works/useWorksPage.js';
import { GROUND_NAME } from './names.js';
import { useEffect, useRef, useState } from 'react';
import { GlassPanel } from '@es3/ui';
import { useEscape } from '../hud/useEscape.js';
import { BuildPanel } from './BuildPanel.js';
import { CellHeader } from './CellHeader.js';
import { CellIncome } from './CellIncome.js';
import { CellOn } from './CellOn.js';
import { CellWorth } from './CellWorth.js';
import { CellActions } from './CellActions.js';
import { cellActions } from './hexActions.js';
import type { ActionId } from './hexActions.js';
import { cellOffer } from './cellOffer.js';
import { ImportedNote } from './ImportedNote.js';
import { OwnershipNote, isSharedGround } from './OwnershipNote.js';
import { RevealControl } from './RevealControl.js';
import { SpellPanel } from './SpellPanel.js';
import { TempleSchoolPanel } from './TempleSchoolPanel.js';
import { AnomalyFound, AnomalyPanel } from './AnomalyPanel.js';
import { TradePost, VillageNote } from './TradePost.js';
import { QuestCellPanel } from '../quest/QuestCellPanel.js';
import type { QuestCellInfo } from '../quest/questCell.js';
import type { QuestBoardEntry } from '../quest/questBoard.js';
import type { AnomalyBinding } from './useAnomaly.js';
import type { BuildBinding, PlaceBinding, ResearchBinding } from './useSelection.js';
import type { SpellBinding } from './useSpells.js';
import type { CityBinding } from './useDiplomacy.js';
import { historyLine } from './cellHistory.js';
import { EXPAND_REFUSAL, shortNote } from './gateNote.js';
import type { WikiRef } from '../help/wikiPages.js';
import './cell-panel.css';

export interface CellPanelProps {
  cell: Cell | null;
  me: PlayerId | null;
  resources: ResourcePool | null;
  now: number;
  /** Null while a ward is in flight, then the refusal if there was one. */
  refusal: WardRefusal | null;
  /** True when this is the cell the player is standing in. */
  here?: boolean;
  /** Dwell, reveal progress, and the cell's life as a place (BRDC-MANA-001). */
  place: PlaceBinding;
  onWard: (h3: string) => void;
  /** The rites sub-panel's bundle (BRDC-SPELL-001), from `useSelection`. */
  spell?: SpellBinding;
  /** The build sub-panel's bundle (BRDC-BUILD-001), and the anomaly on this cell (BRDC-EVENT-001). */
  build?: BuildBinding;
  anomaly?: AnomalyBinding;
  /** The quay of a city state, when this hex is one (BRDC-DIPLO-001). */
  city?: CityBinding;
  /** The Fuming Lake on this hex, if it has a step or a landmark here (BRDC-QUEST-002). */
  quest?: QuestCellInfo | null;
  onQuestOpen?: () => void;
  /** The Tavern's own board, on the Tavern's own cell — `null` everywhere else, `[]` on a
   *  Tavern with nothing under way (BRDC-TAVERN-001). */
  questBoard?: readonly QuestBoardEntry[] | null;
  /** Cells the player has revealed, and the reveal action (BRDC-CLAIM-009). */
  revealed?: Readonly<Record<string, number>>;
  onReveal?: (h3: string) => void;
  /** For a temple's own school-and-research section (BRDC-TEMPLE-002). */
  research?: ResearchBinding;
  wisdomPerHour?: number;
  /** Open a Guide page — a build row's name links to the building's (BRDC-WIKI-004). */
  onWiki?: ((ref: WikiRef) => void) | undefined;
  /** Show a rival cell's full detail — strength, decay, where it was seen from
   *  (BRDC-WAGER-JSON-007). Off leaves it as "held by another" and the red ring. */
  revealRivals?: boolean;
  /** For the building page and its research (BRDC-WORKS-001). */
  repository?: GameRepository | null;
  onPouch?: (pool: ResourcePool) => void;
  onClose: () => void;
}

/** Errors say what to do, not what failed (AI-Koulu ch.3). */
const REFUSAL: Readonly<Record<WardRefusal, string>> = {
  'not-yours': 'You do not hold this ground. Walk it to take it.',
  'already-full': 'This cell is already as strong as it can be.',
  'cannot-afford': `A ward costs ${WARD_COST.wood} timber. Claim woodland to gather it.`,
};



/** Minutes, said the way someone standing in the rain would say them. */
function spent(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min here`;
  const hours = ms / 3_600_000;
  return `${hours.toFixed(1)} h here`;
}

export function CellPanel({
  cell,
  me,
  resources,
  now,
  refusal,
  here = false,
  place,
  onWard,
  spell,
  build,
  anomaly,
  city,
  quest,
  onQuestOpen,
  questBoard,
  revealed,
  onReveal,
  research,
  wisdomPerHour = 0,
  revealRivals = true,
  onWiki,
  repository = null,
  onPouch,
  onClose,
}: CellPanelProps) {
  // Focus follows the panel when it opens — not a trap (the player is walking), but a
  // disclosure that appears from a button has to be findable from the keyboard after.
  const panelRef = useRef<HTMLElement>(null);
  const h3 = cell?.h3 ?? null;
  useEffect(() => {
    if (h3) panelRef.current?.focus();
  }, [h3]);
  // Above the early return: hooks cannot be conditional, and `h3` already carries whether
  // there is a card open at all.
  const works = useWorksPage(repository, cell, now, onPouch);
  // The page is a dialog of its own: ESC there closes the page, not the card beneath it.
  useEscape(h3 !== null && !works.open, onClose);
  const [open, setOpen] = useState<ActionId | null>(null);
  useEffect(() => setOpen(null), [h3]);

  if (!cell) return null;

  const mine = cell.ownerId !== null && cell.ownerId === me;
  // A rival's cell shows its full detail only with the setting on (BRDC-WAGER-JSON-007).
  const showDetail = mine || revealRivals;
  const history = historyLine(cell, me, now);
  const wood = resources?.wood ?? 0;
  const canWard = mine && cell.strength < MAX_STRENGTH && wood >= (WARD_COST.wood ?? 0);
  /*
   * Why not, said under the row (BRDC-UI-002). A hex walked for weeks sits at full
   * strength, and Ward was simply grey there — which reads as a broken button, not as
   * "this ground could not be any safer".
   */
  const wardGate = !mine
    ? null
    : cell.strength >= MAX_STRENGTH
      ? 'Already at full strength — a ward would add nothing.'
      : shortNote(shortOf(resources, WARD_COST));
  const isRevealed = revealed?.[cell.h3] !== undefined;
  const offer = cellOffer({
    mine,
    resources,
    place,
    canWard,
    wardGate,
    quest: quest ?? null,
    reveal: mine && Boolean(onReveal) && !isRevealed,
    page: works.view ? WORKS_DEFS[works.view.kind].name : null,
    school: mine && place.kind === 'temple' && Boolean(research),
    works: mine && Boolean(me && build),
    rites: Boolean(spell),
      city: Boolean(city?.city),
    anomaly: mine && Boolean(anomaly?.current),
  });
  const status = [refusal ? REFUSAL[refusal] : null, place.refusal ? EXPAND_REFUSAL[place.refusal] : null].filter(
    (x): x is string => x !== null,
  );
  const press = (id: ActionId) => {
    if (id === 'quest') onQuestOpen?.();
    else if (id === 'reveal') onReveal?.(cell.h3);
    else if (id === 'ward') onWard(cell.h3);
    else if (id === 'consecrate') place.onConsecrate(cell.h3);
    else if (id === 'expand') place.onExpand(cell.h3);
    else if (id === 'page') works.setOpen(true);
    else setOpen((o) => (o === id ? null : id));
  };

  return (
    <GlassPanel
      as="section"
      ref={panelRef}
      className="cell-panel"
      aria-label="Selected cell"
      tabIndex={-1}
    >
      <CellHeader cell={cell} mine={mine} here={here} onClose={onClose} />

      {/* Every action this hex offers, in one row at the top — nothing to scroll for with
          one thumb while walking (BRDC-DETAIL-003). */}
      <CellActions actions={cellActions(offer)} open={open} onPress={press} status={status} />
      {mine ? <CellStaff repository={repository} h3={cell.h3} now={now} /> : null}
      {mine ? <CellRites repository={repository} h3={cell.h3} now={now} /> : null}
      {works.view ? (
        <WorksPage
          def={WORKS_DEFS[works.view.kind]}
          page={works}
          cell={cell}
          mine={mine}
          owner={mine ? 'Yours' : cell.ownerId ? 'Held by another' : 'Unclaimed'}
          ground={GROUND_NAME[terrainForCell(cell).kind]}
          pool={resources}
          placeMana={place.kind ? place.manaPerHour : 0}
          actions={<CellActions actions={cellActions(offer).filter((a) => !a.opens && a.id !== 'page')} open={null} onPress={press} />}
        />
      ) : null}

      {open === 'works' && me && build ? (
        <BuildPanel
          cell={cell}
          me={me}
          resources={resources}
          researched={build.researched}
          myBuildings={build.myBuildings}
          onBuild={build.onBuild}
          onDemolish={build.onDemolish}
          onWiki={onWiki ? (id) => onWiki(`work:${id}`) : undefined}
          refusal={build.refusal}
        />
      ) : null}
      {open === 'school' && research ? (
        <TempleSchoolPanel
          h3={cell.h3}
          school={research.schools[cell.h3] ?? null}
          research={research}
          pool={resources}
          wisdomPerHour={wisdomPerHour}
        />
      ) : null}
      {open === 'rites' && spell ? (
        <SpellPanel spell={spell} cellH3={cell.h3} mine={mine} mana={resources?.mana ?? 0} now={now} />
      ) : null}
      {open === 'city' && city?.city ? (
        <TradePost city={city.city} resources={resources} refusal={city.refusal} onTrade={city.onTrade} />
      ) : null}
      {open === 'anomaly' && anomaly?.current ? <AnomalyPanel anomaly={anomaly} resources={resources} /> : null}
      {anomaly?.found && anomaly.found.h3 === cell.h3 ? <AnomalyFound found={anomaly.found} /> : null}

      {quest ? <QuestCellPanel info={quest} /> : null}

      {/* What stands here, then what it pays, then who held it and when — the order a
          player standing on the hex actually asks in (BRDC-DETAIL-002). */}
      <CellOn cell={cell} revealed={isRevealed} place={{ kind: place.kind, rank: place.rank }} />

      {mine ? (
        <CellIncome
          cell={cell}
          revealed={revealed ?? {}}
          researched={build?.researched ?? []}
          now={now}
        />
      ) : null}

      {cell.importedFrom && showDetail ? <ImportedNote from={cell.importedFrom} now={now} /> : null}
      {isSharedGround(cell) ? <OwnershipNote cell={cell} me={me} /> : null}

      {history ? <p className="cell-panel__history">{history}</p> : null}

      <CellWorth cell={cell} now={now} showDetail={showDetail} fortified={build?.fortified ?? false} />
      {mine ? (
        <p className="cell-panel__note">
          A ward adds strength. It does not reset the clock — only your feet do that.
        </p>
      ) : null}

      {/* A named place says what it produces — "where mana comes from" is readable here,
          per source (BRDC-MANA-001); the HUD carries the total. */}
      {place.kind ? (
        <div className="cell-panel__place">
          <p className="cell-panel__place-name">
            {place.kind === 'anchor' ? 'Anchor Stone' : `Temple · rank ${place.rank}`}
            <span className="es-numeric"> · Mana +{place.manaPerHour}/h</span>
          </p>
        </div>
      ) : null}

      {/* "Becoming something" beats silence then a sudden crowning — dwell is otherwise
          invisible until it fires. */}
      {place.dwellMs > 0 ? (
        <>
          <div className="cell-panel__bar cell-panel__bar--dwell" aria-hidden>
            <div
              className="cell-panel__bar-fill"
              style={{ inlineSize: `${revealProgress(place.dwellMs, place.hasAnchor) * 100}%` }}
            />
          </div>
          <p className="cell-panel__dwell">
            {spent(place.dwellMs)}
            {place.dwellMs >= (place.hasAnchor ? TEMPLE_THRESHOLD_MS : ANCHOR_THRESHOLD_MS)
              ? ' — this place has a name'
              : place.hasAnchor
                ? ' — stay longer and it becomes a temple'
                : ' — stay longer and the ground learns you'}
          </p>
        </>
      ) : null}

      {mine && isRevealed ? <RevealControl h3={cell.h3} cell={cell} /> : null}
      {city?.village ? <VillageNote city={city.village.city} steps={city.village.steps} /> : null}

      {questBoard ? (
        <div className="cell-panel__board">
          <p className="cell-panel__board-title">The quest board</p>
          {questBoard.length > 0 ? (
            <ul className="cell-panel__board-list">
              {questBoard.map((q) => (
                <li key={q.title}>
                  {q.title} — {q.step}
                </li>
              ))}
            </ul>
          ) : (
            <p className="cell-panel__note">Nothing under way.</p>
          )}
        </div>
      ) : null}
    </GlassPanel>
  );
}
