/**
 * One cell, up close.
 *
 * Tapping a hexagon has done nothing until now, which is a strange thing on a map made
 * entirely of hexagons. This is what it does: says what the ground is, who holds it, how
 * long it has left — and offers the first thing resources are for.
 *
 * Deliberately not a modal. The player is walking; a dialog that traps focus and demands
 * dismissal is the wrong shape for something you glance at and put away.
 */
import {
  ANCHOR_THRESHOLD_MS,
  CLAIM_YIELD,
  MAX_STRENGTH,
  MAX_TEMPLE_EXPANSION,
  NEIGHBOUR_BONUS,
  TEMPLE_THRESHOLD_MS,
  TRICKLE_PER_HOUR,
  WARD_COST,
  canAfford,
  cellAreaM2,
  daysBetween,
  expansionCost,
  hoursUntilReleased,
  resourceForCell,
  revealProgress,
  terrainForCell,
} from '@es3/core';
import type { Cell, PlayerId, ResourcePool, TerrainKind, WardRefusal } from '@es3/core';
import { useEffect, useRef } from 'react';
import { GlassPanel, RitualButton } from '@es3/ui';
import { BuildPanel } from './BuildPanel.js';
import { SpellPanel } from './SpellPanel.js';
import { TradeControls } from './TradeControls.js';
import type { BuildBinding, PlaceBinding, SpellBinding, TradeBinding } from './useSelection.js';
import { terrainGlyph } from './territoryFeatures.js';
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
  /** The build sub-panel's bundle (BRDC-BUILD-001), from `useSelection`. */
  build?: BuildBinding;
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

/** "3 days ago", "yesterday", "today" — from a day count. */
function ago(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

/**
 * The most recent thing that happened to this cell, in a sentence (BRDC-HEX-001).
 *
 * The client has ids, not names, so anyone who is not the local player reads as "another
 * wanderer"; unowned ground it was claimed from is "the Void".
 */
function historyLine(cell: Cell, me: PlayerId | null, now: number): string | null {
  const last = cell.history?.[cell.history.length - 1];
  if (last) {
    const when = ago(daysBetween(last.at, now));
    if (last.from === null) {
      return last.to === me ? `You claimed this from the Void ${when}` : `Claimed from the Void ${when}`;
    }
    return last.to === me ? `You took this ${when}` : `Taken from another wanderer ${when}`;
  }
  if (cell.finder === me) return 'You revealed this';
  if (cell.finder) return 'Revealed by another wanderer';
  return null;
}

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

/**
 * Hours left, counted from the last visit rather than from full strength.
 *
 * `hoursUntilReleased` answers "how long does this strength last", which is a span, not
 * a deadline. The time already spent decaying has to come off it or every cell would
 * claim a fresh two-day grace on every glance.
 */
function hoursLeft(cell: Cell, now: number): number {
  return hoursUntilReleased(cell.strength) - (now - cell.lastVisitedAt) / 3_600_000;
}

function remaining(hours: number): string {
  if (hours <= 1) return 'The Void takes it within the hour';
  if (hours < 48) return `The Void takes it in ${Math.round(hours)} h`;
  return `The Void takes it in ${Math.round(hours / 24)} days`;
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
  onClose,
}: CellPanelProps) {
  /*
   * Focus follows the panel when it opens.
   *
   * Not a focus trap — this is a disclosure, not a modal, and the player is walking. But
   * something that appears in response to a button has to be findable from the keyboard
   * afterwards, and announced when it arrives.
   */
  const panelRef = useRef<HTMLElement>(null);
  const h3 = cell?.h3 ?? null;
  useEffect(() => {
    if (h3) panelRef.current?.focus();
  }, [h3]);

  if (!cell) return null;

  const terrain = terrainForCell(cell);
  const glyph = terrainGlyph(terrain.kind);
  const resource = resourceForCell(cell);
  const mine = cell.ownerId !== null && cell.ownerId === me;
  const history = historyLine(cell, me, now);
  const wood = resources?.wood ?? 0;
  const canWard = mine && cell.strength < MAX_STRENGTH && wood >= (WARD_COST.wood ?? 0);
  const nextCost = place.kind === 'temple' ? expansionCost(place.expansion + 1) : {};
  const canExpand = resources !== null && canAfford(resources, nextCost);

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
        {mine ? 'Yours' : cell.ownerId === null ? 'Unclaimed' : 'Held by another'}
      </p>

      {history ? (
        <p className="cell-panel__history">
          {history}
          {cell.ownedDays && cell.ownedDays > 1 ? ` · walked on ${cell.ownedDays} days` : ''}
        </p>
      ) : null}

      {/*
        What holding it is worth.
        
        The panel used to describe a cell without ever saying why anyone should want it.
        Terrain, area and the two bonuses are the whole answer, and the second one — that
        a held cell strengthens claims on its neighbours — is invisible everywhere else
        in the game despite being the reason territory is worth more than the sum of its
        parts.
      */}
      <dl className="cell-panel__worth">
        <div>
          <dt>Ground</dt>
          <dd className="es-numeric">{Math.round(cellAreaM2(cell.h3))} m²</dd>
        </div>
        <div>
          <dt>Yields</dt>
          <dd className="es-numeric">
            {resource
              ? `${CLAIM_YIELD} ${RESOURCE_NAME[resource]} · ${TRICKLE_PER_HOUR}/h`
              : 'nothing'}
          </dd>
        </div>
        <div>
          <dt>Neighbours</dt>
          <dd className="es-numeric">+{NEIGHBOUR_BONUS} each</dd>
        </div>
      </dl>

      <p className="cell-panel__worth-note">
        {resource
          ? `Taking it pays ${CLAIM_YIELD} ${RESOURCE_NAME[resource]} once, then ${TRICKLE_PER_HOUR} an hour for as long as you hold it.`
          : 'Plain ground pays nothing on its own.'}{' '}
        Holding it adds {NEIGHBOUR_BONUS} to every claim you make on the six cells around it.
      </p>

      {cell.ownerId !== null ? (
        <>
          {/* The bar is decoration; the number beside it is the information. Colour and
              length never carry this alone. */}
          <div className="cell-panel__bar" aria-hidden>
            <div
              className="cell-panel__bar-fill"
              style={{ inlineSize: `${(cell.strength / MAX_STRENGTH) * 100}%` }}
            />
          </div>
          <p className="cell-panel__strength es-numeric">
            {Math.round(cell.strength)} / {MAX_STRENGTH}
          </p>
          <p className="cell-panel__decay">{remaining(hoursLeft(cell, now))}</p>
        </>
      ) : null}

      {/*
        A named place says what it produces, and — for a temple — offers the one thing
        the resources are for. "Where mana comes from" is readable here, per source
        (BRDC-MANA-001); the HUD carries the total.
      */}
      {place.kind ? (
        <div className="cell-panel__place">
          <p className="cell-panel__place-name">
            {place.kind === 'anchor' ? 'Anchor Stone' : `Temple · rank ${place.rank}`}
            <span className="es-numeric"> · Mana +{place.manaPerHour}/h</span>
          </p>
          {place.kind === 'temple' && place.expansion < MAX_TEMPLE_EXPANSION ? (
            <RitualButton
              className="cell-panel__expand"
              disabled={!canExpand}
              onClick={() => place.onExpand(cell.h3)}
            >
              Expand · {costLine(nextCost)}
            </RitualButton>
          ) : null}
          {place.refusal ? (
            <p className="cell-panel__refusal" role="status">
              {EXPAND_REFUSAL[place.refusal]}
            </p>
          ) : null}
        </div>
      ) : null}

      {/*
        "This place is becoming something" beats silence followed by a sudden crowning.
        The dwell mechanic is otherwise entirely invisible until it fires, and a player
        who never saw it coming does not understand what they did to cause it.
      */}
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
          {/* Warding is the one place a player can hold ground without walking to it, so
              the limit of that is stated where the button is, not buried in a codex. */}
          <p className="cell-panel__note">
            A ward adds strength. It does not reset the clock — only your feet do that.
          </p>
          {me && build ? (
            <BuildPanel
              cell={cell}
              me={me}
              resources={resources}
              researched={build.researched}
              myBuildings={build.myBuildings}
              onBuild={build.onBuild}
              onDemolish={build.onDemolish}
              refusal={build.refusal}
            />
          ) : null}
        </>
      ) : null}

      {spell ? (
        <SpellPanel spell={spell} cellH3={cell.h3} mine={mine} mana={resources?.mana ?? 0} now={now} />
      ) : null}

      {trade && mine ? <TradeControls trade={trade} cellH3={cell.h3} /> : null}

      {refusal ? (
        <p className="cell-panel__refusal" role="status">
          {REFUSAL[refusal]}
        </p>
      ) : null}
    </GlassPanel>
  );
}
