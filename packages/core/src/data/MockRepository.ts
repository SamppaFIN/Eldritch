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
import { latLngToCell } from 'h3-js';
import { placesWithHome } from '../rules/dwell.js';
import type { DwellMap } from '../rules/dwell.js';
import { placesWithMana } from '../rules/mana.js';
import { H3_RES_OWNERSHIP } from '../rules/constants.js';
import { projectCell } from '../rules/decay.js';
import { allCells, cellsInBBox, setStoredTerrain, sweepAndPersist } from './cellStore.js';
import type { ResourcePool } from '../rules/terrain.js';
import { settlePouch, wardWith } from './pouch.js';
import { closeWalk, submitWalk } from './walkFlow.js';
import type { WalkDeps } from './walkFlow.js';
import type { WardResult } from '../rules/ward.js';
import { readResearched, researchTech as doResearch } from './techStore.js';
import { buildOn, demolishOn } from './buildStore.js';
import type { BuildOutcome, DemolishOutcome } from './buildStore.js';
import { expandTempleAt, readExpansions } from './templeStore.js';
import type { ExpandOutcome } from './templeStore.js';
import type { TechId, TechResult } from '../rules/tech.js';
import type { BuildingId } from '../rules/build.js';
import { levelForXp } from '../rules/level.js';
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
  Terrain,
  TrailPoint,
} from '../types/index.js';
import type { KeyValueStore } from './kv.js';
import { MemoryStore } from './kv.js';
import { versioned } from './schema.js';
import type { SchemaOutcome, VersionedStore } from './schema.js';
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
import { mergeWorld } from './worldStore.js';
import type { WorldImportResult } from './world.js';
import type { Combatant, Defence } from '../rules/wagerBattle.js';
import { claimHearth } from './hearth.js';
import { assignCastle } from './castle.js';


export interface MockRepositoryOptions {
  store?: KeyValueStore;
  /** Deterministic id generator, for tests. */
  newId?: () => string;
  /** Seed for the neighbour layout. */
  seed?: number;
}

export class MockRepository implements GameRepository {
  private readonly store: VersionedStore;
  private readonly newId: () => string;
  private readonly seed: number;

  constructor(opts: MockRepositoryOptions = {}) {
    // The one wrap site (BRDC-PERSIST-002): a raw store handed straight in — every test,
    // the offline fallback — gets the schema gate too. Nothing double-wraps.
    this.store = versioned(opts.store ?? new MemoryStore());
    this.newId = opts.newId ?? (() => globalThis.crypto.randomUUID());
    this.seed = opts.seed ?? 20260826;
  }

  /** Was the store wiped on open for a schema mismatch? Read by `createRepository`. */
  async schemaOutcome(): Promise<SchemaOutcome> {
    return this.store.schema();
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
    return submitWalk(this.walkDeps(), runId, points);
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
    return (await settlePouch(this.store, await this.getOwnedCells(now), now)).pool;
  }

  async wardCell(h3: H3Index, now: number): Promise<WardResult> {
    // Projected first, so a cell decay has already released cannot be propped up from
    // the grave — and so the strength being paid to raise is the one on screen.
    const stored = await this.store.get<Cell>(K.cell(h3));
    const live = stored ? projectCell(stored, now) : null;
    if (!live) return { warded: false, refused: 'not-yours' };

    const me = await this.getProfile();
    const owned = await this.getOwnedCells(now);
    const result = await wardWith(this.store, live, me.id, owned, now);
    if (result.warded) await this.store.set(K.cell(h3), result.cell);
    return result;
  }

  /* --- Buildings and technology ----------------------------------------- */

  async build(h3: H3Index, id: BuildingId, now: number): Promise<BuildOutcome> {
    const me = await this.getProfile();
    return buildOn(this.store, h3, id, me.id, await this.getOwnedCells(now), await this.getResearched(), now);
  }

  async demolish(h3: H3Index, now: number): Promise<DemolishOutcome> {
    return demolishOn(this.store, h3, await this.getOwnedCells(now), now);
  }

  async getResearched(): Promise<TechId[]> {
    return readResearched(this.store);
  }

  async researchTech(id: TechId, now: number): Promise<TechResult> {
    return doResearch(this.store, id, await this.getOwnedCells(now), now);
  }

  /* --- The Wager, carried by hand --------------------------------------- */

  async exportChallenge(now: number): Promise<string> {
    // Projected, so what travels is the ground that is actually still standing. The
    // `home` here is the Keep (the Hearth cell since BRDC-CASTLE-001's reversal); it only
    // gates the Anchor bonus, a null check in wagerBattle.ts.
    return sealChallenge(await this.getProfile(), await this.getOwnedCells(now), await this.getCastle(), await this.getDefence(), now);
  }

  async importChallenge(text: string, now: number): Promise<ImportResult> {
    // Their ground is projected out of the local player's own before the fight, so the
    // muster reflects what is actually still standing rather than what once was.
    return openChallenge(
      this.store,
      text,
      await this.getProfile(),
      await this.getOwnedCells(now),
      await this.getCastle(),
      now,
    );
  }

  async importWorld(text: string, now: number): Promise<WorldImportResult> {
    return mergeWorld(this.store, text, (await this.getProfile()).id, now);
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
      await this.getCastle(),
      await this.getDefence(),
    );
  }

  /* --- The Hearth ------------------------------------------------------- */

  async setHome(position: LatLng, now: number): Promise<H3Index> {
    const profile = await this.getProfile();
    const h3 = await claimHearth(this.store, profile, position, now);
    await assignCastle(this.store, position);
    await this.ensureSeeded({ ...position, t: now, accuracy: 0 });
    return h3;
  }

  async getHome(): Promise<H3Index | null> {
    return (await this.store.get<H3Index>(K.home)) ?? null;
  }

  /* --- The Keep ----------------------------------------------------------- */

  async getCastle(): Promise<H3Index | null> {
    return (await this.store.get<H3Index>(K.castle)) ?? null;
  }

  /* --- Places ----------------------------------------------------------- */

  async getPlaces(): Promise<RevealedPlace[]> {
    const dwell = (await this.store.get<DwellMap>(K.dwell)) ?? {};
    const places = placesWithHome(dwell, await this.getHome());
    return placesWithMana(places, await readExpansions(this.store));
  }

  async getDwellFor(h3: string): Promise<number> {
    return ((await this.store.get<DwellMap>(K.dwell)) ?? {})[h3] ?? 0;
  }

  async expandTemple(h3: H3Index, now: number): Promise<ExpandOutcome> {
    return expandTempleAt(this.store, h3, await this.getPlaces(), await this.getOwnedCells(now), now);
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
    return (await sweepAndPersist(this.store, await cellsInBBox(this.store, bbox), now)).cells;
  }

  async getOwnedCells(now: number): Promise<Cell[]> {
    const me = await this.getProfile();
    const mine = (await allCells(this.store)).filter((c) => c.ownerId === me.id);
    return (await sweepAndPersist(this.store, mine, now)).cells;
  }

  async setCellTerrain(h3: H3Index, terrain: Terrain): Promise<void> {
    await setStoredTerrain(this.store, h3, terrain);
  }

  /** Close the run's loop, if it has one, and take what it encloses. See `walkFlow.js`. */
  async closeLoop(runId: RunId, now: number): Promise<ClaimResult> {
    return closeWalk(this.walkDeps(), runId, now);
  }

  async runDecay(now: number): Promise<DecayResult> {
    const sweep = await sweepAndPersist(this.store, await allCells(this.store), now);
    return { weakened: sweep.weakened, released: sweep.released };
  }

  /* --- Maintenance ------------------------------------------------------ */

  async resetAll(): Promise<void> {
    await this.store.clear();
  }

  /* --- Internals -------------------------------------------------------- */

  /** The handful of repository verbs `walkFlow.js` needs, with `ensureSeeded` kept private. */
  private walkDeps(): WalkDeps {
    return {
      store: this.store,
      getTrailPoints: (id) => this.getTrailPoints(id),
      getProfile: () => this.getProfile(),
      getOwnedCells: (t) => this.getOwnedCells(t),
      addXp: (n) => this.addXp(n),
      seed: (o) => this.ensureSeeded(o),
    };
  }

  /** Cells only exist once we know where the player is; seeding is therefore lazy. */
  private async ensureSeeded(origin: TrailPoint): Promise<void> {
    if (await this.store.get<boolean>(K.seeded)) return;
    await this.store.set(K.seeded, true);

    for (const cell of seedCells(origin, origin.t, this.seed)) {
      await this.store.set(K.cell(cell.h3), cell);
    }
  }
}

/** The ownership-resolution cell for a position, without importing h3-js downstream. */
export const toOwnershipCell = (lat: number, lng: number): string =>
  latLngToCell(lat, lng, H3_RES_OWNERSHIP);
