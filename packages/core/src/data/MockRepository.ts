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
import { H3_RES_OWNERSHIP } from '../rules/constants.js';
import { levelForXp } from '../rules/level.js';
import type {
  BBox,
  Cell,
  ClaimResult,
  DecayResult,
  GameRepository,
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

    if (accepted.length > 0) {
      await this.store.set(K.trail(runId), [...existing, ...accepted]);
      await this.store.set(K.run(runId), {
        ...run,
        pointCount: run.pointCount + accepted.length,
        distanceM: run.distanceM + result.distanceM,
      });
      await this.ensureSeeded(accepted[0] as TrailPoint);
    }

    return result;
  }

  async endRun(runId: RunId): Promise<void> {
    const run = await this.store.get<Run>(K.run(runId));
    if (run) await this.store.set(K.run(runId), { ...run, status: 'closed' });
    if ((await this.store.get<RunId>(K.activeRun)) === runId) {
      await this.store.delete(K.activeRun);
    }
  }

  /* --- Territory -------------------------------------------------------- */

  async getCells(bbox: BBox, _now: number): Promise<Cell[]> {
    // Decay is applied at read time from BRDC-CLAIM-004 onward; until those rules
    // exist this returns stored state unchanged rather than pretending to age it.
    const all = await this.allCells();
    return all.filter((cell) => inBBox(cell, bbox));
  }

  async getOwnedCells(_now: number): Promise<Cell[]> {
    const me = await this.getProfile();
    return (await this.allCells()).filter((c) => c.ownerId === me.id);
  }

  async closeLoop(_runId: RunId, _now: number): Promise<ClaimResult> {
    // BRDC-CLAIM-005 wires loop detection, rasterisation and capture together here.
    // Reporting "not closed" is the honest answer while that is true.
    return { closed: false };
  }

  async runDecay(_now: number): Promise<DecayResult> {
    // BRDC-CLAIM-004.
    return { weakened: [], released: [] };
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
