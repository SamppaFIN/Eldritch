/**
 * What the player is looking at, and the one thing they can do about it.
 *
 * Selection, the two panels it opens and warding are one concern: they all answer "which
 * cell is this about". Lifted out of MapView when that file crossed four hundred lines,
 * and it reads better here — nothing else in the map screen needs to know how it works.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BUILDINGS, cellsWithin, emptyCell, eraOf, researchable } from '@es3/core';
import type {
  ActiveSpell,
  BuildRefusal,
  BuildingId,
  CastRefusal,
  Cell,
  Era,
  ExpandRefusal,
  GameRepository,
  H3Index,
  ResourcePool,
  RevealedPlace,
  RouteRefusal,
  SpellId,
  TechId,
  TechRefusal,
  TradeRoute,
  WardRefusal,
} from '@es3/core';
import { useTradeRoutes } from './useTradeRoutes.js';

type BuildFail = BuildRefusal | 'nothing-here';
type ExpandFail = ExpandRefusal | 'not-a-temple';

export interface UseSelectionOptions {
  repository: GameRepository | null;
  /** Cells in view, already projected. */
  cells: readonly Cell[];
  places: readonly RevealedPlace[];
  now: () => number;
  /** Bumped as the trail grows, so dwell in the open cell keeps up. */
  trailVersion: number;
  /** The pouch changed — warding, building or demolishing all pay. */
  onWarded: (pool: ResourcePool) => void;
  refreshTerritory: () => Promise<void>;
}

/** Everything CellPanel's build sub-panel needs, in one bundle. */
export interface BuildBinding {
  researched: readonly TechId[];
  myBuildings: readonly BuildingId[];
  refusal: BuildFail | null;
  onBuild: (h3: H3Index, id: BuildingId) => void;
  onDemolish: (h3: H3Index) => void;
}

/**
 * The place facts about the selected cell, in one bundle (BRDC-MANA-001).
 *
 * `dwellMs` and `hasAnchor` drive the reveal-progress readout; the rest describe the cell
 * *as a place* when it is one — `kind` is null when it is just ground.
 */
export interface PlaceBinding {
  dwellMs: number;
  hasAnchor: boolean;
  kind: 'anchor' | 'temple' | null;
  rank: number;
  manaPerHour: number;
  expansion: number;
  refusal: ExpandFail | null;
  onExpand: (h3: H3Index) => void;
}

/** Spell casting for the selected cell and the domain, in one bundle (BRDC-SPELL-001). */
export interface SpellBinding {
  active: readonly ActiveSpell[];
  refusal: CastRefusal | null;
  onCast: (id: SpellId, target: H3Index | null) => void;
}

/** The research screen's bundle: the frontier, the era, and the ceremony (BRDC-TECH-001). */
export interface ResearchBinding {
  researched: readonly TechId[];
  era: Era;
  /** Techs researchable right now — every prerequisite met, not yet known. */
  options: readonly TechId[];
  refusal: TechRefusal | null;
  /** Set for one render after a research crossed an era boundary. */
  lastEra: Era | null;
  onResearch: (id: TechId) => void;
}

/** Trade Routes: the ones held, and the two-tap flow to lay one (BRDC-BUILD-004). */
export interface TradeBinding {
  routes: readonly TradeRoute[];
  /** The cell a link started from, while waiting for the second tap. */
  linkFrom: H3Index | null;
  refusal: RouteRefusal | 'no-such-route' | null;
  onStartLink: (h3: H3Index) => void;
  onCancelLink: () => void;
  onRemove: (a: H3Index, b: H3Index) => void;
}

export interface Selection {
  selected: H3Index | null;
  cell: Cell | null;
  /** The hexes the selected cell's aura or loyalty touches, for the map overlay. */
  auraCells: readonly H3Index[];
  place: PlaceBinding;
  spell: SpellBinding;
  trade: TradeBinding;
  research: ResearchBinding;
  refusal: WardRefusal | null;
  sanctum: boolean;
  wager: boolean;
  build: BuildBinding;
  onCellTap: (h3: H3Index) => void;
  onPlaceTap: (h3: H3Index) => void;
  /** Tapping the Keep marker opens the nation panel, the same door as the Anchor. */
  onCastleTap: () => void;
  onWard: (h3: H3Index) => void;
  openWager: () => void;
  closeWager: () => void;
  close: () => void;
}

export function useSelection({
  repository,
  cells,
  places,
  now,
  trailVersion,
  onWarded,
  refreshTerritory,
}: UseSelectionOptions): Selection {
  const [selected, setSelected] = useState<H3Index | null>(null);
  const [refusal, setRefusal] = useState<WardRefusal | null>(null);
  const [buildRefusal, setBuildRefusal] = useState<BuildFail | null>(null);
  const [expandRefusal, setExpandRefusal] = useState<ExpandFail | null>(null);
  const [castRefusal, setCastRefusal] = useState<CastRefusal | null>(null);
  const [techRefusal, setTechRefusal] = useState<TechRefusal | null>(null);
  const [lastEra, setLastEra] = useState<Era | null>(null);
  const [spells, setSpells] = useState<readonly ActiveSpell[]>([]);
  const [researched, setResearched] = useState<readonly TechId[]>([]);
  const [dwellMs, setDwellMs] = useState(0);

  // The places prop is MapView's; this local copy is what the panel reads, so a temple
  // expansion's higher rate shows the moment it is paid for, not on the next re-read.
  const [livePlaces, setLivePlaces] = useState<readonly RevealedPlace[]>(places);
  useEffect(() => setLivePlaces(places), [places]);

  // Buildings the player holds, from the cells in view — enough for the capacity check in
  // practice, since a player's buildings sit on their territory and that is what is on
  // screen. An off-screen building could under-count the cap; acceptable for now.
  const myBuildings = useMemo(
    () => cells.flatMap((c): BuildingId[] => (c.building ? [c.building.id] : [])),
    [cells],
  );

  useEffect(() => {
    if (!repository) return;
    let alive = true;
    void repository.getResearched().then((r) => {
      if (alive) setResearched(r);
    });
    // Running spells, re-read as the trail grows so a countdown stays honest and an
    // expired spell drops from the panel on its own (BRDC-SPELL-001).
    void repository.getActiveSpells(now()).then((s) => {
      if (alive) setSpells(s);
    });
    return () => {
      alive = false;
    };
  }, [repository, now, trailVersion]);
  const [sanctum, setSanctum] = useState(false);
  const [wager, setWager] = useState(false);

  /** Build, demolish, expand, cast and research all pay: re-read the pouch and the map. */
  const afterSpend = useCallback(async () => {
    if (!repository) return;
    onWarded(await repository.getResources(now()));
    setLivePlaces(await repository.getPlaces());
    await refreshTerritory();
  }, [repository, now, onWarded, refreshTerritory]);

  const tradeHook = useTradeRoutes(repository, now, trailVersion, afterSpend);

  // A new selection starts with a clean slate: a refusal about the last cell has nothing
  // to say about this one, and the two panels never share the screen. While a Trade Route
  // link is open, a tap on another cell is its far end, not a new selection.
  const onCellTap = useCallback(
    (h3: H3Index) => {
      if (tradeHook.interceptTap(h3)) return;
      setSelected(h3);
      setRefusal(null);
      setBuildRefusal(null);
      setExpandRefusal(null);
      setCastRefusal(null);
      setSanctum(false);
    },
    [tradeHook],
  );

  /*
   * A place answers a tap with what it is.
   *
   * The Anchor Stone opens the sanctuary — it is the one cell on the map that is about
   * the whole of it. A temple is still just ground, so it opens the ordinary panel.
   */
  const onPlaceTap = useCallback(
    (h3: H3Index) => {
      if (livePlaces.find((p) => p.h3 === h3)?.kind === 'anchor') {
        setSelected(null);
        setSanctum(true);
        return;
      }
      onCellTap(h3);
    },
    [livePlaces, onCellTap],
  );

  // The Keep sits on the Hearth cell; tapping its marker is a request for the nation,
  // not the one hexagon underneath it.
  const onCastleTap = useCallback(() => {
    setSelected(null);
    setSanctum(true);
  }, []);

  /*
   * A cell nobody has ever claimed is not in storage, so the viewport query does not
   * return it — and "This ground" on open land would open nothing at all. An empty cell
   * stands in: the terrain and the dwell are real either way, and the panel already
   * knows how to say "Unclaimed".
   */
  const cell = useMemo(() => {
    if (!selected) return null;
    return cells.find((c) => c.h3 === selected) ?? emptyCell(selected);
  }, [cells, selected]);

  // Read on selection and again as the trail grows: time in the cell you are standing
  // in accrues while the panel is open.
  useEffect(() => {
    if (!repository || !selected) {
      setDwellMs(0);
      return;
    }
    let alive = true;
    void repository.getDwellFor(selected).then((ms) => {
      if (alive) setDwellMs(ms);
    });
    return () => {
      alive = false;
    };
  }, [repository, selected, trailVersion]);

  const onWard = useCallback(
    (h3: H3Index) => {
      if (!repository) return;
      void (async () => {
        const result = await repository.wardCell(h3, now());
        setRefusal(result.warded ? null : result.refused);
        if (!result.warded) return;
        onWarded(result.pool);
        // The strength on screen has to be the strength that was just paid for.
        await refreshTerritory();
      })();
    },
    [repository, now, onWarded, refreshTerritory],
  );

  const onBuild = useCallback(
    (h3: H3Index, id: BuildingId) => {
      if (!repository) return;
      void (async () => {
        const r = await repository.build(h3, id, now());
        setBuildRefusal(r.ok ? null : r.refused);
        if (r.ok) await afterSpend();
      })();
    },
    [repository, now, afterSpend],
  );

  const onDemolish = useCallback(
    (h3: H3Index) => {
      if (!repository) return;
      void (async () => {
        const r = await repository.demolish(h3, now());
        setBuildRefusal(r.ok ? null : r.refused);
        if (r.ok) await afterSpend();
      })();
    },
    [repository, now, afterSpend],
  );

  const onExpand = useCallback(
    (h3: H3Index) => {
      if (!repository) return;
      void (async () => {
        const r = await repository.expandTemple(h3, now());
        setExpandRefusal(r.ok ? null : r.refused);
        if (r.ok) await afterSpend();
      })();
    },
    [repository, now, afterSpend],
  );

  const onCast = useCallback(
    (id: SpellId, target: H3Index | null) => {
      if (!repository) return;
      void (async () => {
        const r = await repository.castSpell(id, target, now());
        setCastRefusal(r.ok ? null : r.refused);
        if (r.ok) {
          setSpells(await repository.getActiveSpells(now()));
          await afterSpend();
        }
      })();
    },
    [repository, now, afterSpend],
  );

  const onResearch = useCallback(
    (id: TechId) => {
      if (!repository) return;
      setLastEra(null);
      void (async () => {
        const r = await repository.researchTech(id, now());
        setTechRefusal(r.ok ? null : r.refused);
        if (r.ok) {
          setResearched(r.researched);
          if (r.era) setLastEra(r.era);
          await afterSpend();
        }
      })();
    },
    [repository, now, afterSpend],
  );

  const here = selected ? (livePlaces.find((p) => p.h3 === selected) ?? null) : null;

  // What the selected cell reaches: a building's aura radius, or the loyalty ring around
  // a Monument or a revealed place (BRDC-BUILD-004). Empty for plain ground.
  const auraCells = useMemo<readonly H3Index[]>(() => {
    if (!cell) return [];
    const aura = cell.building ? BUILDINGS[cell.building.id].aura : undefined;
    if (aura) return cellsWithin(cell.h3, aura.radius);
    if (cell.building?.id === 'monument' || here) return cellsWithin(cell.h3, 1);
    return [];
  }, [cell, here]);

  return {
    selected,
    cell,
    auraCells,
    place: {
      dwellMs,
      hasAnchor: livePlaces.some((p) => p.kind === 'anchor'),
      kind: here?.kind ?? null,
      rank: here?.rank ?? 0,
      manaPerHour: here?.manaPerHour ?? 0,
      expansion: here?.expansion ?? 0,
      refusal: expandRefusal,
      onExpand,
    },
    spell: { active: spells, refusal: castRefusal, onCast },
    research: {
      researched,
      era: eraOf(researched),
      options: researchable([...researched]),
      refusal: techRefusal,
      lastEra,
      onResearch,
    },
    trade: tradeHook.binding,
    refusal,
    sanctum,
    wager,
    build: { researched, myBuildings, refusal: buildRefusal, onBuild, onDemolish },
    onCellTap,
    onPlaceTap,
    onCastleTap,
    onWard,
    openWager: useCallback(() => {
      setSanctum(false);
      setWager(true);
    }, []),
    closeWager: useCallback(() => setWager(false), []),
    close: useCallback(() => {
      setSelected(null);
      setSanctum(false);
    }, []),
  };
}
