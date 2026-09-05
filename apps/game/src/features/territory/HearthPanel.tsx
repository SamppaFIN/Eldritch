/**
 * The Hearth, opened.
 *
 * Every other cell on the map is about itself. This one is about the whole of it — it is
 * where the player agreed to start, and it is the natural place to ask "what have I
 * built" rather than "what is under my feet".
 *
 * It also gives the Wager a door from the map. Until now a challenge could only be sent
 * from the title screen, which meant ending a walk to reach it (BRDC-WAGER-JSON-001,
 * known limitation). Standing on your own Hearth is a better place to be asked.
 */
import { useCallback, useState } from 'react';
import { GlassPanel, MetatronsCube, RitualButton } from '@es3/ui';
import { BASE_STORAGE_CAP, RESOURCE_KINDS, darkTimeAt } from '@es3/core';
import type { Cell, Forecast, GameRepository, ResourcePool, RevealedPlace } from '@es3/core';
import { dominionOf } from './dominion.js';
import { ResearchPanel } from './ResearchPanel.js';
import { ManaPanel } from './ManaPanel.js';
import { KeepBuildingsPanel } from './KeepBuildingsPanel.js';
import { NationIdentity } from '../nation/NationIdentity.js';
import { KeepResources } from '../keep/KeepResources.js';
import { KeepTemples } from '../keep/KeepTemples.js';
import { KeepRealm } from '../keep/KeepRealm.js';
import { useKeepEconomy } from './useKeepEconomy.js';
import type { ResearchBinding } from './useSelection.js';
import type { AdventureBinding } from '../quest/useAdventure.js';
import './hearth-panel.css';

export type KeepTab = 'mana' | 'wisdom' | 'buildings';

/**
 * The Keep's tabbed sections — mana, Research and buildings, all run from here
 * (BRDC-KEEP-002, -003). Opened from the map marker or the ⌂ Keep button.
 *
 * The tech tree lived here labelled "Rites" until a field report (2026-09-05): a
 * player looking for "a way to research new technologies" never thought to open a
 * tab named after a ritual. The tree's own content was always secular history
 * (Toolmaking, Masonry, Astronomy) — Research says what it is; Rite stays the word
 * for a spell you cast, which is what it already meant in SpellPanel.
 */
export const TABS: readonly { id: KeepTab; label: string }[] = [
  { id: 'mana', label: 'Mana' },
  { id: 'wisdom', label: 'Research' },
  { id: 'buildings', label: 'Buildings' },
];

export interface HearthPanelProps {
  /** Every cell the player holds, already projected to `now`. */
  owned: readonly Cell[];
  resources: ResourcePool | null;
  /** Revealed places — Anchor and temples — so the Keep can list and expand them. */
  places: readonly RevealedPlace[];
  level: number;
  levelName: string;
  now: number;
  /** The research screen's bundle (BRDC-TECH-001), from `useSelection`. */
  research: ResearchBinding;
  /** The adventure book, opened from here (BRDC-QUEST-001). Lifted to MapView so the map
   *  can reveal landmarks by stage. */
  adventures: AdventureBinding;
  /** For the Keep's Mana tab — the Altar and channelling (BRDC-KEEP-002). */
  repository: GameRepository | null;
  /** Push a fresh pouch up after a Keep spend, so the numbers do not lag the minute poll. */
  onPouch: (pool: ResourcePool) => void;
  /** Per-hour / per-day production, as the pouch will actually earn it (BRDC-STATS-001). */
  forecast: Forecast | null;
  onWager: () => void;
  /** Opens the weakest cell, so the fix for a warning is one tap from the warning. */
  onWeakest: (h3: string) => void;
  onClose: () => void;
}

function area(m2: number): string {
  return m2 < 10_000 ? `${Math.round(m2)} m²` : `${(m2 / 10_000).toFixed(1)} ha`;
}

export function HearthPanel({
  owned,
  resources,
  places,
  level,
  levelName,
  now,
  research,
  adventures,
  repository,
  onPouch,
  forecast,
  onWager,
  onWeakest,
  onClose,
}: HearthPanelProps) {
  const [tab, setTab] = useState<KeepTab>('mana');
  const afterKeepSpend = useCallback(() => {
    void repository?.getResources(now).then(onPouch);
  }, [repository, now, onPouch]);
  const keep = useKeepEconomy(repository, () => now, owned.length, afterKeepSpend);
  // The Fuming Lake is begun and advanced from its own hexes now (BRDC-QUEST-002); the
  // Hearth only says where it stands.
  const questLine = adventures.active
    ? `The Fuming Lake — ${adventures.active.speaker ?? 'under way'}`
    : null;
  const d = dominionOf(owned, now);
  const dark = darkTimeAt(now);
  const rate = RESOURCE_KINDS.reduce((sum, k) => sum + d.perHour[k], 0);
  const producingCount = RESOURCE_KINDS.reduce((sum, k) => sum + d.producing[k], 0);
  // BRDC-ECON-001: a full resource stops earning rather than overflowing silently, and
  // the player is told in words, not left to notice the pouch has quietly stopped moving.
  const full = resources ? RESOURCE_KINDS.some((k) => d.perHour[k] > 0 && resources[k] >= BASE_STORAGE_CAP) : false;

  return (
    <GlassPanel as="section" className="hearth-panel" aria-label="Your sanctuary">
      <div className="hearth-panel__head">
        <MetatronsCube size={44} animate={1200} className="hearth-panel__sigil" />
        <div>
          <p className="hearth-panel__title">Your Anchor Stone</p>
          <p className="hearth-panel__sub">
            Consciousness {level} · {levelName}
          </p>
        </div>
        <RitualButton
          variant="ghost"
          className="hearth-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden>✕</span>
        </RitualButton>
      </div>

      {/* Tabs sit right under the header — near the top and pinned there — so the way to
          Research is the first thing seen, not something scrolled to (BRDC-KEEP-006). */}
      <div className="hearth-panel__tabs" aria-label="Keep">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            className={`hearth-panel__tab${tab === t.id ? ' hearth-panel__tab--on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <NationIdentity owned={owned} />

      <dl className="hearth-panel__stats">
        <div>
          <dt>Warded</dt>
          <dd className="es-numeric">{d.cells}</dd>
        </div>
        <div>
          <dt>Land</dt>
          <dd className="es-numeric">{area(d.areaM2)}</dd>
        </div>
        <div>
          <dt>Strongest</dt>
          <dd className="es-numeric">{Math.round(d.strongest)}</dd>
        </div>
        <div>
          <dt>Temples</dt>
          <dd className="es-numeric">{places.filter((p) => p.kind === 'temple').length}</dd>
        </div>
      </dl>

      <KeepResources
        resources={resources}
        forecast={forecast}
        producing={producingCount}
        rate={rate}
        resting={d.resting}
        full={full}
        repository={repository}
        now={now}
        onPouch={onPouch}
      />

      {tab === 'mana' ? (
        <>
          <ManaPanel keep={keep} pool={resources} />
          <KeepTemples
            places={places}
            pool={resources}
            repository={repository}
            now={now}
            onPouch={onPouch}
          />
        </>
      ) : null}
      {tab === 'wisdom' ? (
        <ResearchPanel
          research={research}
          pool={resources}
          wisdomPerHour={forecast?.perHour.wisdom ?? 0}
        />
      ) : null}
      {tab === 'buildings' ? <KeepBuildingsPanel /> : null}

      {questLine ? <p className="hearth-panel__line es-numeric">{questLine}</p> : null}

      <KeepRealm
        weakestH3={d.weakest?.h3 ?? null}
        atRisk={d.atRisk}
        firstLossInHours={d.firstLossInHours}
        dark={dark}
        onWager={onWager}
        onWeakest={onWeakest}
      />
    </GlassPanel>
  );
}
