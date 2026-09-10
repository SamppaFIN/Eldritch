/**
 * One cell, up close: what the ground is, who holds it, how long it has left, and the
 * first thing resources are for. Not a modal — the player is walking, and a focus trap
 * is the wrong shape for something you glance at and put away.
 */
import {
  ANCHOR_THRESHOLD_MS,
  MAX_STRENGTH,
  MAX_TEMPLE_EXPANSION,
  TEMPLE_THRESHOLD_MS,
  WARD_COST,
  canAfford,
  cityStateOf,
  shortOf,
  expansionCost,
  revealProgress,
  terrainForCell,
} from '@es3/core';
import type { Cell, PlayerId, ResourcePool, TerrainKind, WardRefusal } from '@es3/core';
import { useEffect, useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import { useEscape } from '../hud/useEscape.js';
import { BuildPanel } from './BuildPanel.js';
import { CellWorth } from './CellWorth.js';
import { ConsecratePanel } from './ConsecratePanel.js';
import { ImportedNote } from './ImportedNote.js';
import { OwnershipNote } from './OwnershipNote.js';
import { RevealControl } from './RevealControl.js';
import { SpellPanel } from './SpellPanel.js';
import { TempleSchoolPanel } from './TempleSchoolPanel.js';
import { TradeControls } from './TradeControls.js';
import { AnomalyPanel } from './AnomalyPanel.js';
import { TradePost, VillageNote } from './TradePost.js';
import { QuestCellPanel } from '../quest/QuestCellPanel.js';
import type { QuestCellInfo } from '../quest/questCell.js';
import type { AnomalyBinding } from './useAnomaly.js';
import type { BuildBinding, PlaceBinding, ResearchBinding, TradeBinding } from './useSelection.js';
import type { SpellBinding } from './useSpells.js';
import type { CityBinding } from './useDiplomacy.js';
import { historyLine } from './cellHistory.js';
import { terrainGlyph } from './territoryFeatures.js';
import { shortNote } from './gateNote.js';
import type { WikiRef } from '../help/wikiPages.js';
import './cell-panel.css';

type ExpandFail = NonNullable<PlaceBinding['refusal']>;

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
  /** The trade-route controls' bundle (BRDC-BUILD-004), from `useSelection`. */
  trade?: TradeBinding;
  /** The build sub-panel's bundle (BRDC-BUILD-001), and the anomaly on this cell (BRDC-EVENT-001). */
  build?: BuildBinding;
  anomaly?: AnomalyBinding;
  /** The quay of a city state, when this hex is one (BRDC-DIPLO-001). */
  city?: CityBinding;
  /** The Fuming Lake on this hex, if it has a step or a landmark here (BRDC-QUEST-002). */
  quest?: QuestCellInfo | null;
  onQuestOpen?: () => void;
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
  onClose: () => void;
}

const GROUND: Readonly<Record<TerrainKind, string>> = {
  plain: 'Plain ground',
  forest: 'Old woodland',
  hill: 'Bare hillside',
  mountain: 'Broken rock',
  lake: 'Still water',
  coast: 'The shoreline',
  market: 'A place of trade',
};

/** Where the terrain reading came from (BRDC-TERRAIN-002, -003). */
const SOURCE_LABEL = { tiles: '(from the map)', seed: '(surveyed)', hash: '(estimated)' } as const;

const YIELD: Readonly<Record<TerrainKind, string>> = {
  plain: 'yields nothing',
  forest: 'yields timber',
  hill: 'yields stone',
  mountain: 'yields iron',
  lake: 'yields food',
  coast: 'yields food',
  market: 'yields gold',
};

/** The resource a terrain gives, said the way the pouch says it. */
const RESOURCE_NAME: Readonly<Record<string, string>> = {
  food: 'food',
  wood: 'timber',
  stone: 'stone',
  iron: 'iron',
  gold: 'gold',
};

/** Errors say what to do, not what failed (AI-Koulu ch.3). */
const REFUSAL: Readonly<Record<WardRefusal, string>> = {
  'not-yours': 'You do not hold this ground. Walk it to take it.',
  'already-full': 'This cell is already as strong as it can be.',
  'cannot-afford': `A ward costs ${WARD_COST.wood} timber. Claim woodland to gather it.`,
};

const EXPAND_REFUSAL: Readonly<Record<ExpandFail, string>> = {
  'not-a-temple': 'Only a temple can be expanded.',
  'at-max': 'This temple is already at its full strength.',
  'cannot-afford': 'Not enough stone and gold. Hold hills and markets to gather them.',
};

/** "40 stone · 30 gold" from a cost map. */
function costLine(cost: Partial<ResourcePool>): string {
  return (Object.entries(cost) as [string, number][])
    .map(([k, v]) => `${v} ${RESOURCE_NAME[k] ?? k}`)
    .join(' · ');
}

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
  trade,
  build,
  anomaly,
  city,
  quest,
  onQuestOpen,
  revealed,
  onReveal,
  research,
  wisdomPerHour = 0,
  revealRivals = true,
  onWiki,
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
  useEscape(h3 !== null, onClose);

  if (!cell) return null;

  const terrain = terrainForCell(cell);
  const glyph = terrainGlyph(terrain.kind);
  const mine = cell.ownerId !== null && cell.ownerId === me;
  // A rival's cell shows its full detail only with the setting on (BRDC-WAGER-JSON-007).
  const showDetail = mine || revealRivals;
  const history = historyLine(cell, me, now);
  const wood = resources?.wood ?? 0;
  const canWard = mine && cell.strength < MAX_STRENGTH && wood >= (WARD_COST.wood ?? 0);
  /*
   * Why not, said beside the button (BRDC-UI-002). A hex walked for weeks sits at full
   * strength, and Ward was simply grey there — which reads as a broken button, not as
   * "this ground could not be any safer".
   */
  const wardGate = !mine
    ? null
    : cell.strength >= MAX_STRENGTH
      ? 'Already at full strength — a ward would add nothing.'
      : shortNote(shortOf(resources, WARD_COST));
  const nextCost = place.kind === 'temple' ? expansionCost(place.expansion + 1) : {};
  const canExpand = resources !== null && canAfford(resources, nextCost);
  const expandGate = canExpand ? null : shortNote(shortOf(resources, nextCost));

  return (
    <GlassPanel
      as="section"
      ref={panelRef}
      className="cell-panel"
      aria-label="Selected cell"
      tabIndex={-1}
    >
      <div className="cell-panel__head">
        <div>
          <p className="cell-panel__ground">
            {glyph ? (
              <span
                className="cell-panel__terrain-icon"
                style={{ color: glyph.color }}
                aria-hidden
              >
                {glyph.char}{' '}
              </span>
            ) : null}
            {GROUND[terrain.kind]}
            <span className="cell-panel__source"> {SOURCE_LABEL[terrain.source]}</span>
          </p>
          <p className="cell-panel__yield">
            {here ? 'You are here · ' : ''}
            {YIELD[terrain.kind]}
          </p>
        </div>
        <RitualButton
          variant="ghost"
          className="cell-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      <p className="cell-panel__owner">
        {mine
          ? 'Yours'
          : cell.ownerId === null
            ? 'Unclaimed'
            : (cityStateOf(cell.ownerId)?.name ?? 'Held by another')}
        {/* Separate arrivals, not fixes — standing still is one (BRDC-HEX-002). */}
        {cell.visits ? ` · ${cell.visits} ${cell.visits === 1 ? 'visit' : 'visits'}` : ''}
      </p>

      {cell.importedFrom && showDetail ? <ImportedNote from={cell.importedFrom} now={now} /> : null}
      {cell.ownerId !== null ? <OwnershipNote cell={cell} me={me} /> : null}

      {history ? (
        <p className="cell-panel__history">
          {history}

        </p>
      ) : null}

      <CellWorth cell={cell} now={now} showDetail={showDetail} />

      {/* A named place says what it produces — "where mana comes from" is readable here,
          per source (BRDC-MANA-001); the HUD carries the total. */}
      {place.kind ? (
        <div className="cell-panel__place">
          <p className="cell-panel__place-name">
            {place.kind === 'anchor' ? 'Anchor Stone' : `Temple · rank ${place.rank}`}
            <span className="es-numeric"> · Mana +{place.manaPerHour}/h</span>
          </p>
          {place.kind === 'temple' && place.expansion < MAX_TEMPLE_EXPANSION ? (
            <>
              <RitualButton
                className="cell-panel__expand"
                disabled={!canExpand}
                onClick={() => place.onExpand(cell.h3)}
              >
                Expand · {costLine(nextCost)}
              </RitualButton>
              {expandGate ? (
                <p className="cell-panel__why" role="status">
                  {expandGate}
                </p>
              ) : null}
            </>
          ) : null}
          {place.refusal ? (
            <p className="cell-panel__refusal" role="status">
              {EXPAND_REFUSAL[place.refusal]}
            </p>
          ) : null}
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

      {mine ? (
        <>
          <RitualButton className="cell-panel__ward" disabled={!canWard} onClick={() => onWard(cell.h3)}>
            Ward · {WARD_COST.wood} timber
          </RitualButton>
          {wardGate ? (
            <p className="cell-panel__why" role="status">
              {wardGate}
            </p>
          ) : null}
          {/* Warding holds ground without walking to it — its limit sits by the button. */}
          <p className="cell-panel__note">
            A ward adds strength. It does not reset the clock — only your feet do that.
          </p>
          {onReveal ? (
            <RevealControl
              h3={cell.h3}
              revealed={revealed?.[cell.h3] !== undefined}
              cell={cell}
              onReveal={onReveal}
            />
          ) : null}
          {place.kind === null ? (
            <ConsecratePanel
              cell={cell}
              resources={resources}
              dwellMs={place.dwellMs}
              onConsecrate={place.onConsecrate}
            />
          ) : null}
          {place.kind === 'temple' && research ? (
            <TempleSchoolPanel
              h3={cell.h3}
              school={research.schools[cell.h3] ?? null}
              research={research}
              pool={resources}
              wisdomPerHour={wisdomPerHour}
            />
          ) : null}
          {me && build ? (
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
        </>
      ) : null}

      {spell ? <SpellPanel spell={spell} cellH3={cell.h3} mine={mine} mana={resources?.mana ?? 0} now={now} /> : null}

      {trade && mine ? <TradeControls trade={trade} cellH3={cell.h3} /> : null}
      {anomaly?.current && mine ? <AnomalyPanel anomaly={anomaly} resources={resources} /> : null}
      {city?.city ? (
        <TradePost
          city={city.city}
          resources={resources}
          refusal={city.refusal}
          onTrade={city.onTrade}
        />
      ) : null}
      {city?.village ? <VillageNote city={city.village.city} steps={city.village.steps} /> : null}

      {quest ? <QuestCellPanel info={quest} onOpen={onQuestOpen ?? (() => {})} /> : null}

      {refusal ? (
        <p className="cell-panel__refusal" role="status">
          {REFUSAL[refusal]}
        </p>
      ) : null}
    </GlassPanel>
  );
}
