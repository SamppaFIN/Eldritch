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
import { readPlaces, readDwellFor, raiseAltarFor, channelManaFor } from './keepStore.js';
import type { AltarOutcome, ChannelOutcome } from './keepStore.js';
import { H3_RES_OWNERSHIP } from '../rules/constants.js';
import { allCells, cellsInBBox, setStoredTerrain, sweepAndPersist } from './cellStore.js';
import type { ResourcePool } from '../rules/terrain.js';
import { forecastRates, grantAll, settlePouch, type Forecast } from './pouch.js';
import { wardAt } from './wardStore.js';
import { closeWalk, submitWalk } from './walkFlow.js';
import type { WalkDeps } from './walkFlow.js';
import type { WardResult } from '../rules/ward.js';
import { readResearched, researchTech as doResearch } from './techStore.js';
import { buildOn, demolishOn } from './buildStore.js';
import type { BuildOutcome, DemolishOutcome } from './buildStore.js';
import { consecrateAt, expandTempleAt } from './templeStore.js';
import type { ConsecrateOutcome, ExpandOutcome } from './templeStore.js';
import { readPaths } from './pathStore.js';
import { readLog, writeLogEntry } from './logStore.js';
import { walkedEdges } from '../geo/paths.js';
import type { WalkedEdge } from '../geo/paths.js';
import { neighboursOf } from '../geo/cells.js';
import { loyaltyFactor, loyaltySourceCells } from '../rules/aura.js';
import { layRouteAt, readRoutes, removeRouteAt } from './tradeStore.js';
import type { RouteOutcome } from './tradeStore.js';
import type { TradeRoute } from '../rules/trade.js';
import { castSpellAt, readSpells } from './spellStore.js';
import type { CastOutcome } from './spellStore.js';
import { activeSpells } from '../rules/spell.js';
import type { ActiveSpell, SpellId } from '../rules/spell.js';
import type { TechId, TechResult } from '../rules/tech.js';
import type { BuildingId } from '../rules/build.js';
import type { LogEntry } from '../rules/log.js';
import { addXpTo, readProfile, setName } from './profileStore.js';
import { achievementsFor } from './achievementRepo.js';
import type { AchievementView } from './achievementStore.js';
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
import { readDefence, writeDefence, type ImportResult } from './wager.js';
import { combatantFrom, exportChallengeFrom, importChallengeInto, muster } from './wagerRepo.js';
import { mergeWorld } from './worldStore.js';
import type { WorldImportResult } from './world.js';
import type { Combatant, Defence } from '../rules/wagerBattle.js';
import { claimHearth } from './hearth.js';
import { assignCastle } from './castle.js';
import type { Anomaly, ChoiceOutcome, InvestigateOutcome, ResolveOutcome } from './anomalyStore.js';
import type { AdventureChoiceOutcome, AdventureView, StartOutcome } from './adventureStore.js';
import { abandonAdventureFor, chooseInAdventureFor, chooseInChainFor, getAdventuresFor, getAnomaliesFor, getQuestFindsFor, investigateAnomalyFor, recordQuestFindFor, resolveAnomalyFor, startAdventureFor, type SecretSiteId } from './storyRepo.js';
import { cipherView, recordShard, type CipherView } from './cipherStore.js';
import { activeRunOf, beginRun, closeRun, trailPointsOf } from './runStore.js';

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

  /* --- Profile and achievements — seams in profileStore.js / achievementRepo.js --- */
  getProfile(): Promise<PlayerProfile> {
    return readProfile(this.store, this.newId);
  }
  addXp(amount: number): Promise<PlayerProfile> {
    return addXpTo(this.store, this.newId, amount);
  }
  setPlayerName(name: string): Promise<PlayerProfile> {
    return setName(this.store, this.newId, name);
  }
  async getAchievements(now: number): Promise<AchievementView[]> {
    return (await achievementsFor(this.store, this, now)).view;
  }
  async syncAchievements(now: number): Promise<string[]> {
    return (await achievementsFor(this.store, this, now)).unlocked;
  }

  /* --- Runs — CRUD in `runStore.js`, one run at a time ---------------- */

  async startRun(now: number): Promise<RunId> {
    return beginRun(this.store, this.newId(), now);
  }
  async getActiveRun(): Promise<Run | null> {
    return activeRunOf(this.store);
  }
  async getTrailPoints(runId: RunId): Promise<TrailPoint[]> {
    return trailPointsOf(this.store, runId);
  }

  async getWalkedPaths(): Promise<WalkedEdge[]> {
    return walkedEdges(await readPaths(this.store));
  }

  /** The action log, newest first (BRDC-LOG-001). */
  async getLog(limit = 100): Promise<LogEntry[]> {
    return (await readLog(this.store)).slice(-limit).reverse();
  }

  async submitTrail(runId: RunId, points: TrailPoint[]) {
    return submitWalk(this.walkDeps(), runId, points);
  }

  async endRun(runId: RunId): Promise<void> {
    return closeRun(this.store, runId);
  }

  async seedAround(position: LatLng, now: number): Promise<void> {
    await this.ensureSeeded({ ...position, t: now, accuracy: 0 });
  }

  /* --- Resources -------------------------------------------------------- */
  async getResources(now: number): Promise<ResourcePool> {
    return (await settlePouch(this.store, await this.getOwnedCells(now), now)).pool;
  }
  async getForecast(now: number): Promise<Forecast> {
    return forecastRates(this.store, await this.getOwnedCells(now), now);
  }
  /** Dev only (BRDC-ECON-002): top every resource up so a lost pouch is not a dead run. */
  async debugGrant(now: number): Promise<void> {
    await grantAll(this.store, await this.getOwnedCells(now), now, 200);
  }
  async wardCell(h3: H3Index, now: number): Promise<WardResult> {
    const me = await this.getProfile();
    return wardAt(this.store, h3, me.id, await this.getOwnedCells(now), now);
  }

  /* --- Buildings and technology ----------------------------------------- */
  async build(h3: H3Index, id: BuildingId, now: number): Promise<BuildOutcome> {
    const near = [h3, ...neighboursOf(h3)];
    const nearTemple = (await this.getPlaces()).some((p) => near.includes(p.h3));
    const me = (await this.getProfile()).id;
    const owned = await this.getOwnedCells(now);
    return buildOn(this.store, h3, id, me, owned, await this.getResearched(), now, nearTemple);
  }

  async demolish(h3: H3Index, now: number): Promise<DemolishOutcome> {
    return demolishOn(this.store, h3, await this.getOwnedCells(now), now);
  }

  async getTradeRoutes(): Promise<TradeRoute[]> {
    return readRoutes(this.store);
  }

  async layTradeRoute(a: H3Index, b: H3Index, now: number): Promise<RouteOutcome> {
    const me = (await this.getProfile()).id;
    return layRouteAt(this.store, me, a, b, await this.getOwnedCells(now), now);
  }

  async removeTradeRoute(a: H3Index, b: H3Index, now: number): Promise<RouteOutcome> {
    return removeRouteAt(this.store, a, b, await this.getOwnedCells(now), now);
  }

  async getResearched(): Promise<TechId[]> {
    return readResearched(this.store);
  }

  async researchTech(id: TechId, now: number): Promise<TechResult> {
    return doResearch(this.store, id, await this.getOwnedCells(now), now);
  }

  /* --- The Wager, carried by hand — store half in `wagerRepo.js` -------- */

  async exportChallenge(now: number): Promise<string> {
    return exportChallengeFrom(await muster(this, now), now);
  }

  async importChallenge(text: string, now: number): Promise<ImportResult> {
    return importChallengeInto(this.store, await muster(this, now), text, now);
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
    return combatantFrom(await muster(this, now));
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

  /* --- Places and the Keep's economy — seam in keepStore.js ------------- */
  getPlaces = (): Promise<RevealedPlace[]> => readPlaces(this.store, () => this.getHome());
  getDwellFor(h3: string): Promise<number> {
    return readDwellFor(this.store, h3);
  }
  raiseAltar(now: number): Promise<AltarOutcome> {
    return raiseAltarFor(this.store, this, now);
  }
  channelMana(now: number): Promise<ChannelOutcome> {
    return channelManaFor(this.store, this, now);
  }
  async expandTemple(h3: H3Index, now: number): Promise<ExpandOutcome> {
    return expandTempleAt(this.store, h3, await this.getPlaces(), await this.getOwnedCells(now), now);
  }
  consecrateTemple = async (h3: H3Index, now: number): Promise<ConsecrateOutcome> =>
    consecrateAt(this.store, h3, await this.getOwnedCells(now), await this.getHome(), now);

  /* --- Story: anomalies, event chains, adventures — glue in storyRepo.js --- */
  getAnomalies(now: number): Promise<Anomaly[]> {
    return getAnomaliesFor(this, now);
  }
  investigateAnomaly(h3: H3Index, now: number): Promise<InvestigateOutcome> {
    return investigateAnomalyFor(this.store, this, h3, now);
  }
  resolveAnomaly(h3: H3Index, now: number): Promise<ResolveOutcome> {
    return resolveAnomalyFor(this.store, this, h3, now);
  }
  chooseInChain(h3: H3Index, choiceIndex: number, now: number): Promise<ChoiceOutcome> {
    return chooseInChainFor(this.store, this, h3, choiceIndex, now);
  }
  getAdventures(now: number): Promise<AdventureView[]> {
    return getAdventuresFor(this.store, this, now);
  }
  startAdventure(id: string, now: number): Promise<StartOutcome> {
    return startAdventureFor(this.store, id, now);
  }
  chooseInAdventure(id: string, choiceIndex: number, now: number): Promise<AdventureChoiceOutcome> {
    return chooseInAdventureFor(this.store, this, id, choiceIndex, now);
  }
  abandonAdventure(id: string): Promise<void> {
    return abandonAdventureFor(this.store, id);
  }
  getQuestFinds(): Promise<SecretSiteId[]> {
    return getQuestFindsFor(this.store);
  }
  recordQuestFind(id: SecretSiteId, now: number): Promise<SecretSiteId | null> {
    return recordQuestFindFor(this.store, id, now);
  }
  getCipher(): Promise<CipherView> {
    return cipherView(this.store);
  }
  recordCipherShard(index: number, now: number): Promise<number | null> {
    return recordShard(this.store, index, now);
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
    const inView = await cellsInBBox(this.store, bbox);
    const loyalty = await this.loyaltyOver(inView);
    return (await sweepAndPersist(this.store, inView, now, loyalty, await this.getHome())).cells;
  }

  async getOwnedCells(now: number): Promise<Cell[]> {
    const me = await this.getProfile();
    const mine = (await allCells(this.store)).filter((c) => c.ownerId === me.id);
    const loyalty = await this.loyaltyOver(mine);
    return (await sweepAndPersist(this.store, mine, now, loyalty, await this.getHome())).cells;
  }

  /** A decay-multiplier resolver: <1 for my cells next to my Monuments or a place, else 1.
   *  Sources are read from `cells` themselves, so this stays a bounded read (BRDC-BUILD-003). */
  private async loyaltyOver(cells: readonly Cell[]): Promise<(cell: Cell) => number> {
    const me = (await this.getProfile()).id;
    const places = (await this.getPlaces()).map((p) => p.h3);
    const sources = loyaltySourceCells(cells.filter((c) => c.ownerId === me), places);
    return (cell) => (cell.ownerId === me ? loyaltyFactor(cell.h3, sources) : 1);
  }

  async setCellTerrain(h3: H3Index, terrain: Terrain): Promise<void> {
    await setStoredTerrain(this.store, h3, terrain);
  }

  /** Close the run's loop, if it has one, and take what it encloses. See `walkFlow.js`. */
  async closeLoop(runId: RunId, now: number): Promise<ClaimResult> {
    return closeWalk(this.walkDeps(), runId, now);
  }

  async runDecay(now: number): Promise<DecayResult> {
    const all = await allCells(this.store);
    const loyalty = await this.loyaltyOver(all);
    const sweep = await sweepAndPersist(this.store, all, now, loyalty, await this.getHome());
    const lost = sweep.released.length;
    if (lost > 0) await writeLogEntry(this.store, { at: now, kind: 'reclaim', count: lost });
    return { weakened: sweep.weakened, released: sweep.released };
  }

  async getActiveSpells(now: number): Promise<ActiveSpell[]> {
    return activeSpells(await readSpells(this.store), now);
  }

  async castSpell(id: SpellId, target: H3Index | null, now: number): Promise<CastOutcome> {
    const me = await this.getProfile();
    return castSpellAt(this.store, id, target, me.id, await this.getOwnedCells(now), now);
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
