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
import type { DwellMap } from '../rules/dwell.js';
import { recordWalk } from './walkWriter.js';
import { detectLoop } from '../geo/loopDetection.js';
import { H3_RES_OWNERSHIP } from '../rules/constants.js';
import { projectCell, sweepDecay } from '../rules/decay.js';
import type { ResourcePool } from '../rules/terrain.js';
import { awardClaims, settlePouch, wardWith } from './pouch.js';
import type { WardResult } from '../rules/ward.js';
import { levelForXp } from '../rules/level.js';
import { cellsToLoad, planClaim } from './claiming.js';
import type {
  BBox,
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
import { K } from './keys.js';
import {
  openChallenge,
  ownCombatant,
  readDefence,
  sealChallenge,
  writeDefence,
} from './wager.js';
import type { ImportResult } from './wager.js';
import type { Combatant, Defence } from '../rules/wagerBattle.js';
import { claimHearth } from './hearth.js';



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

    const profile = await this.getProfile();
    const walked = await recordWalk(this.store, accepted, {
      id: profile.id,
      level: profile.level,
      hasTerritory: await this.hasGround(profile.id),
    });

    if (walked.xp > 0) await this.addXp(walked.xp);
    const lastT = (accepted[accepted.length - 1] as TrailPoint).t;
    await awardClaims(this.store, await this.ownedIndexes(lastT), walked.grown, lastT);

    return { ...result, ...walked.trail };
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

  /* --- Resources -------------------------------------------------------- */

  async getResources(now: number): Promise<ResourcePool> {
    return (await settlePouch(this.store, await this.ownedIndexes(now), now)).pool;
  }

  async wardCell(h3: H3Index, now: number): Promise<WardResult> {
    // Projected first, so a cell decay has already released cannot be propped up from
    // the grave — and so the strength being paid to raise is the one on screen.
    const stored = await this.store.get<Cell>(K.cell(h3));
    const live = stored ? projectCell(stored, now) : null;
    if (!live) return { warded: false, refused: 'not-yours' };

    const me = await this.getProfile();
    const owned = await this.ownedIndexes(now);
    const result = await wardWith(this.store, live, me.id, owned, now);
    if (result.warded) await this.store.set(K.cell(h3), result.cell);
    return result;
  }

  private async ownedIndexes(now: number): Promise<H3Index[]> {
    return (await this.getOwnedCells(now)).map((c) => c.h3);
  }

  /* --- The Wager, carried by hand --------------------------------------- */

  async exportChallenge(now: number): Promise<string> {
    // Projected, so what travels is the ground that is actually still standing.
    return sealChallenge(await this.getProfile(), await this.getOwnedCells(now), await this.getHome(), await this.getDefence(), now);
  }

  async importChallenge(text: string, now: number): Promise<ImportResult> {
    // Their ground is projected out of the local player's own before the fight, so the
    // muster reflects what is actually still standing rather than what once was.
    return openChallenge(
      this.store,
      text,
      await this.getProfile(),
      await this.getOwnedCells(now),
      await this.getHome(),
      now,
    );
  }

  async getDefence(): Promise<Defence> {
    return readDefence(this.store);
  }

  async setDefence(defence: Defence): Promise<void> {
    await writeDefence(this.store, defence);
  }

  async getCombatant(now: number): Promise<Combatant> {
    return ownCombatant(
      await this.getProfile(),
      await this.getOwnedCells(now),
      await this.getHome(),
      await this.getDefence(),
    );
  }

  /* --- The Hearth ------------------------------------------------------- */

  async setHome(position: LatLng, now: number): Promise<H3Index> {
    const profile = await this.getProfile();
    const h3 = await claimHearth(this.store, profile, position, now);
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
    await awardClaims(this.store, await this.ownedIndexes(now), plan.outcomes, now);

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
