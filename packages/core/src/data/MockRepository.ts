/**
 * The offline implementation of GameRepository.
 *
 * Phases 0-2 run entirely on this: no backend, no account, no network. It is not a
 * stopgap. It is what makes the game playable in airplane mode, and in Phase 3 it stays
 * on as the offline fallback that v1 had and v2 lost.
 *
 * It holds no game rules of its own. Loop detection, capture and decay are pure
 * functions in packages/core/rules, and this class calls them. When SupabaseRepository
 * arrives, the same rules exist a second time in SQL, and the golden-fixture tests
 * (Phase 3) assert the two agree cell by cell.
 */
import { cellToLatLng, latLngToCell } from 'h3-js';
import { filterTrail } from '../geo/filter.js';
import { placesWithHome } from '../rules/dwell.js';
import type { DwellMap, DwellReading } from '../rules/dwell.js';
import { planWalk, walkNeighbourhood } from './walking.js';
import { detectLoop } from '../geo/loopDetection.js';
import { H3_RES_OWNERSHIP, XP_PER_CELL_CLAIMED } from '../rules/constants.js';
import { sweepDecay } from '../rules/decay.js';
import { emptyCell, resolveCapture } from '../rules/capture.js';
import { cellAt } from '../geo/cells.js';
import { levelForXp } from '../rules/level.js';
import { cellsToLoad, planClaim } from './claiming.js';
import type {
  BBox,
  CaptureOutcome,
  Cell,
  LatLng,
  RevealedPlace,
  ClaimResult,
  DecayResult,
  GameRepository,
  H3Index,
  PlayerProfile,
  Run,
  RunId,
  TrailPoint,
} from '../types/index.js';
import type { KeyValueStore } from './kv.js';
import { MemoryStore } from './kv.js';
import { seedCells } from './seed.js';

const K = {
  profile: 'profile',
  activeRun: 'run:active',
  seeded: 'seeded',
  run: (id: RunId) => `run:${id}`,
  trail: (id: RunId) => `trail:${id}`,
  cell: (h3: string) => `cell:${h3}`,
  dwell: 'dwell',
  home: 'home',
  lastReading: 'reading:last',
} as const;

const CELL_PREFIX = 'cell:';

export interface MockRepositoryOptions {
  store?: KeyValueStore;
  /** Deterministic id generator, for tests. */
  newId?: () => string;
  /** Seed for the neighbour layout. */
  seed?: number;
}

export class MockRepository implements GameRepository {
  private readonly store: KeyValueStore;
  private readonly newId: () => string;
  private readonly seed: number;

  constructor(opts: MockRepositoryOptions = {}) {
    this.store = opts.store ?? new MemoryStore();
    this.newId = opts.newId ?? (() => globalThis.crypto.randomUUID());
    this.seed = opts.seed ?? 20260826;
  }

  /* --- Profile ---------------------------------------------------------- */

  async getProfile(): Promise<PlayerProfile> {
    const existing = await this.store.get<PlayerProfile>(K.profile);
    if (existing) return existing;

    const profile: PlayerProfile = {
      id: this.newId(),
      name: 'Seeker',
      colorHue: 285,
      level: 1,
      xp: 0,
    };
    await this.store.set(K.profile, profile);
    return profile;
  }

  /** XP is added here so `level` can never drift from `xp` (v2's level-118 route). */
  async addXp(amount: number): Promise<PlayerProfile> {
    const profile = await this.getProfile();
    const xp = Math.max(0, profile.xp + amount);
    const updated: PlayerProfile = { ...profile, xp, level: levelForXp(xp) };
    await this.store.set(K.profile, updated);
    return updated;
  }

  /* --- Runs ------------------------------------------------------------- */

  async startRun(now: number): Promise<RunId> {
    // One run at a time. An abandoned run left open would keep collecting points
    // and eventually close a loop the player never walked in one outing.
    const open = await this.getActiveRun();
    if (open) await this.endRun(open.id);

    const run: Run = {
      id: this.newId(),
      startedAt: now,
      status: 'active',
      pointCount: 0,
      distanceM: 0,
    };
    await this.store.set(K.run(run.id), run);
    await this.store.set(K.activeRun, run.id);
    await this.store.set(K.trail(run.id), [] as TrailPoint[]);
    return run.id;
  }

  async getActiveRun(): Promise<Run | null> {
    const id = await this.store.get<RunId>(K.activeRun);
    if (!id) return null;
    const run = await this.store.get<Run>(K.run(id));
    return run && run.status === 'active' ? run : null;
  }

  async getTrailPoints(runId: RunId): Promise<TrailPoint[]> {
    return (await this.store.get<TrailPoint[]>(K.trail(runId))) ?? [];
  }

  async submitTrail(runId: RunId, points: TrailPoint[]) {
    const run = await this.store.get<Run>(K.run(runId));
    if (!run) throw new Error(`Unknown run: ${runId}`);

    const existing = await this.getTrailPoints(runId);
    const previous = existing.length > 0 ? (existing[existing.length - 1] as TrailPoint) : null;

    // Validation happens here, not in the caller. A repository that trusts its input
    // is exactly what v2's position:update handler was.
    const { accepted, result } = filterTrail(previous, points);
    if (accepted.length === 0) return result;

    await this.store.set(K.trail(runId), [...existing, ...accepted]);
    await this.store.set(K.run(runId), {
      ...run,
      pointCount: run.pointCount + accepted.length,
      distanceM: run.distanceM + result.distanceM,
    });
    await this.ensureSeeded(accepted[0] as TrailPoint);

    /*
     * Walking is not only a line any more.
     *
     * Each accepted fix grows the territory into the cell underfoot — if it touches
     * ground already held — and credits time to the cell just left. A cell that
     * accumulates enough time stops being ground and becomes a place.
     */
    const profile = await this.getProfile();
    const known = new Map<string, Cell>();
    for (const h3 of walkNeighbourhood(accepted)) {
      const stored = await this.store.get<Cell>(K.cell(h3));
      if (stored) known.set(h3, stored);
    }

    const plan = planWalk(accepted, {
      attacker: { id: profile.id, level: profile.level },
      known,
      dwell: (await this.store.get<DwellMap>(K.dwell)) ?? {},
      previous: (await this.store.get<DwellReading | null>(K.lastReading)) ?? null,
      hasTerritory: await this.hasGround(profile.id),
    });

    for (const step of plan.steps) {
      if (step.cell) await this.store.set(K.cell(step.cell.h3), step.cell);
    }
    await this.store.set(K.dwell, plan.dwell);
    const last = plan.steps[plan.steps.length - 1];
    if (last) {
      await this.store.set<DwellReading>(K.lastReading, {
        h3: last.h3,
        t: (accepted[accepted.length - 1] as TrailPoint).t,
      });
    }

    const grown = plan.steps.map((s) => s.outcome).filter((o): o is CaptureOutcome => o !== null);
    const xp = grown.filter((o) => o.kind === 'claimed' || o.kind === 'taken').length;
    if (xp > 0) await this.addXp(xp * XP_PER_CELL_CLAIMED);

    return { ...result, grown, revealed: plan.revealed, unobservedMs: plan.unobservedMs };
  }

  async endRun(runId: RunId): Promise<void> {
    const run = await this.store.get<Run>(K.run(runId));
    if (run) await this.store.set(K.run(runId), { ...run, status: 'closed' });
    if ((await this.store.get<RunId>(K.activeRun)) === runId) {
      await this.store.delete(K.activeRun);
    }
  }

  async seedAround(position: LatLng, now: number): Promise<void> {
    await this.ensureSeeded({ ...position, t: now, accuracy: 0 });
  }

  /* --- The Hearth ------------------------------------------------------- */

  async setHome(position: LatLng, now: number): Promise<H3Index> {
    const h3 = cellAt(position);
    const profile = await this.getProfile();

    /*
     * Claimed outright, adjacency waived.
     *
     * This is the seed the growth rule already allows for, made explicit: the player
     * agreed to start here, so the ground is theirs before they take a step. Without it
     * the Hearth would be a marker floating over land belonging to nobody.
     */
    const current = (await this.store.get<Cell>(K.cell(h3))) ?? emptyCell(h3);
    const { cell } = resolveCapture(current, { id: profile.id, level: profile.level }, now);
    await this.store.set(K.cell(h3), cell);

    await this.store.set(K.home, h3);
    await this.ensureSeeded({ ...position, t: now, accuracy: 0 });
    return h3;
  }

  async getHome(): Promise<H3Index | null> {
    return (await this.store.get<H3Index>(K.home)) ?? null;
  }

  /* --- Places ----------------------------------------------------------- */

  async getPlaces(): Promise<RevealedPlace[]> {
    return placesWithHome((await this.store.get<DwellMap>(K.dwell)) ?? {}, await this.getHome());
  }

  async getDwellFor(h3: string): Promise<number> {
    return ((await this.store.get<DwellMap>(K.dwell)) ?? {})[h3] ?? 0;
  }

  /** Does the player hold anything at all? The seed exception turns on this. */
  private async hasGround(playerId: string): Promise<boolean> {
    for (const key of await this.store.keys(CELL_PREFIX)) {
      const cell = await this.store.get<Cell>(key);
      if (cell?.ownerId === playerId) return true;
    }
    return false;
  }

  /* --- Territory -------------------------------------------------------- */

  /**
   * Cells in view, aged to `now`.
   *
   * The projection is for rendering and is never written back — see projectCell. The
   * one thing that IS persisted here is release: a cell that has reached zero is
   * genuinely unowned again, and leaving it on disk would keep a ghost nobody can take.
   */
  async getCells(bbox: BBox, now: number): Promise<Cell[]> {
    const visible = (await this.allCells()).filter((cell) => inBBox(cell, bbox));
    const sweep = sweepDecay(visible, now);
    for (const h3 of sweep.released) await this.store.delete(K.cell(h3));
    return sweep.cells;
  }

  async getOwnedCells(now: number): Promise<Cell[]> {
    const me = await this.getProfile();
    const mine = (await this.allCells()).filter((c) => c.ownerId === me.id);
    const sweep = sweepDecay(mine, now);
    for (const h3 of sweep.released) await this.store.delete(K.cell(h3));
    return sweep.cells;
  }

  /**
   * Close the run's loop, if it has one, and take what it encloses.
   *
   * Loads the cells the ring covers *and their neighbours*, so siege bonuses are
   * counted against the ground held before this walk rather than against cells claimed
   * moments earlier in the same lap.
   */
  async closeLoop(runId: RunId, now: number): Promise<ClaimResult> {
    const points = await this.getTrailPoints(runId);
    const profile = await this.getProfile();

    const detected = detectLoop(points, { level: profile.level });
    if (!detected.closed) return { closed: false };

    const known = new Map<string, Cell>();
    for (const h3 of cellsToLoad(detected.loop)) {
      const stored = await this.store.get<Cell>(K.cell(h3));
      // Aged first: besieging a cell that has already rotted away should find
      // empty ground, not a defender who stopped existing last week.
      if (stored) {
        const [alive] = sweepDecay([stored], now).cells;
        if (alive) known.set(h3, alive);
        else await this.store.delete(K.cell(h3));
      }
    }

    const plan = planClaim(detected.loop, { id: profile.id, level: profile.level }, known, now);
    for (const cell of plan.cells) await this.store.set(K.cell(cell.h3), cell);
    if (plan.xp > 0) await this.addXp(plan.xp);

    // The ring is spent. Keeping it would let the next fix close the same loop again.
    await this.store.set(K.trail(runId), points.slice(detected.loop.endIndex));

    return { closed: true, outcomes: plan.outcomes, areaM2: plan.areaM2 };
  }

  async runDecay(now: number): Promise<DecayResult> {
    const sweep = sweepDecay(await this.allCells(), now);
    for (const h3 of sweep.released) await this.store.delete(K.cell(h3));
    return { weakened: sweep.weakened, released: sweep.released };
  }

  /* --- Maintenance ------------------------------------------------------ */

  async resetAll(): Promise<void> {
    await this.store.clear();
  }

  /* --- Internals -------------------------------------------------------- */

  /** Cells only exist once we know where the player is; seeding is therefore lazy. */
  private async ensureSeeded(origin: TrailPoint): Promise<void> {
    if (await this.store.get<boolean>(K.seeded)) return;
    await this.store.set(K.seeded, true);

    for (const cell of seedCells(origin, origin.t, this.seed)) {
      await this.store.set(K.cell(cell.h3), cell);
    }
  }

  private async allCells(): Promise<Cell[]> {
    const keys = await this.store.keys(CELL_PREFIX);
    const cells: Cell[] = [];
    for (const key of keys) {
      const cell = await this.store.get<Cell>(key);
      if (cell) cells.push(cell);
    }
    return cells;
  }
}

/**
 * Cheap bbox test on the cell's own index.
 *
 * Decoding every stored cell to a boundary would be exact but pointless here: a res-11
 * cell is ~40 m across, and the viewport query only needs to be right to within a cell.
 */
function inBBox(cell: Cell, bbox: BBox): boolean {
  const { lat, lng } = cellCentre(cell.h3);
  return lat >= bbox.south && lat <= bbox.north && lng >= bbox.west && lng <= bbox.east;
}

const centreCache = new Map<string, { lat: number; lng: number }>();

function cellCentre(h3: string): { lat: number; lng: number } {
  const hit = centreCache.get(h3);
  if (hit) return hit;
  const [lat, lng] = cellToLatLng(h3);
  const value = { lat, lng };
  centreCache.set(h3, value);
  return value;
}

/** The ownership-resolution cell for a position, without importing h3-js downstream. */
export const toOwnershipCell = (lat: number, lng: number): string =>
  latLngToCell(lat, lng, H3_RES_OWNERSHIP);
