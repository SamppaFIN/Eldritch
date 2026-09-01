/**
 * The single door to all game data.
 *
 * Two implementations: MockRepository (IndexedDB, Phases 0-2 and every test) and
 * SupabaseRepository (RPC, Phase 3). No component, hook or store may import a
 * storage client directly. If something needs data that is not here, add a method
 * here — do not reach past the interface.
 *
 * Every method that depends on the passage of time takes `now` as a parameter.
 * Without that, decay cannot be tested without waiting 20 real days.
 */
import type {
  BBox,
  Cell,
  LatLng,
  ClaimResult,
  DecayResult,
  H3Index,
  PlayerProfile,
  RevealedPlace,
  Run,
  RunId,
  Terrain,
  TrailPoint,
  TrailResult,
} from './domain.js';
import type { ResourcePool } from '../rules/terrain.js';
import type { WalkedEdge } from '../geo/paths.js';
import type { WardResult } from '../rules/ward.js';
import type { TechId, TechResult } from '../rules/tech.js';
import type { BuildingId } from '../rules/build.js';
import type { BuildOutcome, DemolishOutcome } from '../data/buildStore.js';
import type { ExpandOutcome } from '../data/templeStore.js';
import type { AltarOutcome, ChannelOutcome } from '../data/keepStore.js';
import type { CastOutcome } from '../data/spellStore.js';
import type { ActiveSpell, SpellId } from '../rules/spell.js';
import type { RouteOutcome } from '../data/tradeStore.js';
import type { TradeRoute } from '../rules/trade.js';
import type { Forecast } from '../data/pouch.js';
import type { ImportResult } from '../data/wager.js';
import type { WorldImportResult } from '../data/world.js';
import type { Combatant, Defence } from '../rules/wagerBattle.js';
import type { LogEntry } from '../rules/log.js';
import type {
  Anomaly,
  ChoiceOutcome,
  InvestigateOutcome,
  ResolveOutcome,
} from '../data/anomalyStore.js';
import type {
  AdventureChoiceOutcome,
  AdventureView,
  StartOutcome,
} from '../data/adventureStore.js';
import type { SecretSiteId } from '../data/questSites.js';
import type { AchievementView } from '../data/achievementStore.js';
import type { CipherView } from '../data/cipherStore.js';

export interface GameRepository {
  /* --- Profile ---------------------------------------------------------- */
  getProfile(): Promise<PlayerProfile>;
  /** Rename the player. Trimmed, capped at 24; an empty string is ignored (BRDC-CHAR-001). */
  setPlayerName(name: string): Promise<PlayerProfile>;
  /** Every achievement with its unlock time, or `null` if still locked (BRDC-CHAR-001). */
  getAchievements(now: number): Promise<AchievementView[]>;
  /** Stamp anything newly earned; returns the ids added this call, for a toast. */
  syncAchievements(now: number): Promise<string[]>;

  /* --- Runs and trail --------------------------------------------------- */
  startRun(now: number): Promise<RunId>;
  getActiveRun(): Promise<Run | null>;
  submitTrail(runId: RunId, points: TrailPoint[]): Promise<TrailResult>;
  getTrailPoints(runId: RunId): Promise<TrailPoint[]>;
  endRun(runId: RunId): Promise<void>;

  /**
   * Every stretch ever walked, as drawable edges thickening with use (BRDC-TRAIL-003).
   *
   * Survives a loop closing and a new run starting — it is stored apart from any run.
   * Read wholesale; the store is capped so "wholesale" stays bounded.
   */
  getWalkedPaths(): Promise<WalkedEdge[]>;

  /** The action log, newest first — claims, builds, losses, Wagers (BRDC-LOG-001). */
  getLog(limit?: number): Promise<LogEntry[]>;

  /**
   * Build the starting neighbourhood around a position, once.
   *
   * Seeding used to happen on the first accepted trail point, which meant the world
   * did not exist until a batch had been submitted — ten seconds of empty map on every
   * first launch, which is the whole first impression. The game knows where the player
   * is the moment it has a fix; that is when the world should be there.
   *
   * Idempotent: calling it again does nothing.
   */
  seedAround(position: LatLng, now: number): Promise<void>;

  /* --- Territory -------------------------------------------------------- */
  /** Runs loop detection on the run's points; a no-op result if it has not closed. */
  closeLoop(runId: RunId, now: number): Promise<ClaimResult>;
  /** Applies decay at read time, then returns what survives in the viewport. */
  getCells(bbox: BBox, now: number): Promise<Cell[]>;
  getOwnedCells(now: number): Promise<Cell[]>;
  /**
   * Record the terrain the map's vector tiles resolved for a cell (BRDC-TERRAIN-002).
   *
   * Only affects cells that already have a stored row; empty ground keeps the hash. A
   * no-op if the same terrain is already recorded, so the client's resolver can call it
   * as freely as it likes.
   */
  setCellTerrain(h3: H3Index, terrain: Terrain): Promise<void>;

  /* --- Resources -------------------------------------------------------- */
  /**
   * The pouch, brought up to date.
   *
   * `now` is a parameter for the same reason it is everywhere else: the trickle from
   * held ground is settled at read time, and a test that fast-forwards a week has to be
   * able to say so.
   */
  getResources(now: number): Promise<ResourcePool>;
  /**
   * What the pouch will fill at over the next hour and day, per resource (BRDC-STATS-001).
   *
   * A settle run forward, not a re-derived rate, so it cannot disagree with what the
   * player actually earns: the storage cap, dormancy and the dark-time factor are in it.
   */
  getForecast(now: number): Promise<Forecast>;
  /**
   * Spend the pouch to raise one cell's strength.
   *
   * Refusals are values, not exceptions: "not yours", "already full" and "cannot afford"
   * are all things the interface has to be able to say out loud to the player.
   */
  wardCell(h3: H3Index, now: number): Promise<WardResult>;

  /* --- Buildings (BRDC-BUILD-001) ---------------------------------------- */
  /**
   * Put a building on a cell, paying from the pouch. Refusals are named values — wrong
   * terrain, missing tech, at capacity, cannot afford — and on any of them nothing is
   * written: the spend and the cell change happen together or not at all.
   */
  build(h3: H3Index, id: BuildingId, now: number): Promise<BuildOutcome>;
  /** Demolish a cell's building and return half its cost. */
  demolish(h3: H3Index, now: number): Promise<DemolishOutcome>;

  /* --- Trade Routes (BRDC-BUILD-004) ---------------------------------- */
  /** The two-cell links the player holds; each pays gold while both ends are awake. */
  getTradeRoutes(): Promise<TradeRoute[]>;
  /**
   * Bind two owned cells within `TRADE_ROUTE_MAX_HEXES`, paying stone and gold. Refusals
   * are named — same cell, not yours, too far, already linked, cannot afford.
   */
  layTradeRoute(a: H3Index, b: H3Index, now: number): Promise<RouteOutcome>;
  /** Tear a route down and hand back half its cost. */
  removeTradeRoute(a: H3Index, b: H3Index, now: number): Promise<RouteOutcome>;

  /* --- Technology (BRDC-TECH-001) ------------------------------------------ */
  /** Everything researched so far, in the order it was learned. */
  getResearched(): Promise<TechId[]>;
  /**
   * Research one technology, paying wisdom from the pouch. Refusals are values —
   * "locked", "cannot afford", "already known" — and `era` names the new age when
   * researching this completed the previous one, for the caller's ceremony.
   */
  researchTech(id: TechId, now: number): Promise<TechResult>;

  /* --- Spells (BRDC-SPELL-001) ----------------------------------------- */
  /** Spells still within their duration at `now`; the expired ones are simply gone. */
  getActiveSpells(now: number): Promise<ActiveSpell[]>;
  /**
   * Cast a spell, paying mana. `target` is the cell for an own-cell spell, null for a
   * domain one. Refusals are named — locked, cannot afford, not your cell, and
   * `carry-in-a-wager` for the enemy-facing schools that wait on BRDC-SPELL-002.
   */
  castSpell(id: SpellId, target: H3Index | null, now: number): Promise<CastOutcome>;

  /* --- The Wager, carried by hand --------------------------------------- */
  /**
   * Everything a friend's game needs to hold you as a rival, as text.
   *
   * Phases 0-2 have no server, so this is what multiplayer is: a block of JSON sent
   * through whatever app people already use, and read back by the other phone.
   */
  exportChallenge(now: number): Promise<string>;
  /** What the player built on their border, and the choice of it. */
  getDefence(): Promise<Defence>;
  setDefence(defence: Defence): Promise<void>;
  /**
   * The local player as the battle rules see them.
   *
   * Both sides of a duel are assembled the same way — theirs from the message, this one
   * from the store — because the two phones must agree on every input.
   */
  getCombatant(now: number): Promise<Combatant>;
  /**
   * Accept a Wager: take their ground onto the map, fight it, and settle the spoils.
   *
   * One call, because they are one act — a rival's territory that exists without the
   * duel having happened is a state nothing should be able to observe.
   *
   * Refusals come back as named faults rather than exceptions: every one of them has to
   * become a sentence the player can act on.
   */
  importChallenge(text: string, now: number): Promise<ImportResult>;

  /**
   * Merge one `world/<res6>.json` shard: other players' territory as read-only, imported
   * cells (BRDC-SHARE-001). Never overwrites the local player's own ground, never fights
   * — a shard is state, not a challenge. A bad shard comes back as a named fault, and the
   * game carries on without it. Safe to call repeatedly with the same or a fresher shard.
   */
  importWorld(text: string, now: number): Promise<WorldImportResult>;

  /* --- The Hearth ------------------------------------------------------- */
  /**
   * Accept the ground under the player as their starting place.
   *
   * The adventure opens with this: not a menu, not a name, just the cell they happen to
   * be standing in when they agree to it. It is claimed on the spot — a player who has
   * accepted a Hearth is never looking at an empty map — and it holds the Anchor Stone
   * from then on.
   *
   * Idempotent in the sense that matters: calling it again moves the Hearth, which is
   * what a deliberate reset needs, and nothing else calls it twice.
   */
  setHome(position: LatLng, now: number): Promise<H3Index>;
  /** The Hearth cell, or null if the player has not accepted one yet. */
  getHome(): Promise<H3Index | null>;

  /* --- The Keep ----------------------------------------------------------- */
  /**
   * The location published for this player (`BRDC-SHARE-001`). Since the BRDC-CASTLE-001
   * reversal it is the Hearth cell itself; assigned automatically whenever `setHome` is.
   */
  getCastle(): Promise<H3Index | null>;

  /* --- Places ----------------------------------------------------------- */
  /** Cells that have earned a name, Anchor first; each carries its mana rate and expansion. */
  getPlaces(): Promise<RevealedPlace[]>;
  /** Time accumulated in the cell the player is standing in, for a progress readout. */
  getDwellFor(h3: H3Index): Promise<number>;
  /**
   * Spend stone and gold to raise a temple's mana output one step (BRDC-MANA-001).
   *
   * Refusals are named values — not a temple, at max, cannot afford — and on any of them
   * nothing is written: the spend and the level change happen together or not at all.
   */
  expandTemple(h3: H3Index, now: number): Promise<ExpandOutcome>;
  /** Raise the Altar — the Anchor cell — one expansion step (BRDC-KEEP-002). */
  raiseAltar(now: number): Promise<AltarOutcome>;
  /** Channel a fixed step of mana into wisdom at the Altar. Refuses if short or wisdom-full. */
  channelMana(now: number): Promise<ChannelOutcome>;

  /* --- Anomalies (BRDC-EVENT-001) ------------------------------------- */
  /** Anomalies on ground the player holds, with their state, for the map and the panel. */
  getAnomalies(now: number): Promise<Anomaly[]>;
  /** Begin studying an anomaly, paying wisdom. Refusals are named values. */
  investigateAnomaly(h3: H3Index, now: number): Promise<InvestigateOutcome>;
  /** Collect a finished investigation — a hidden reward, or the first stage of a chain. */
  resolveAnomaly(h3: H3Index, now: number): Promise<ResolveOutcome>;
  /** Take a choice in an anomaly's event chain; it applies the effect and moves on. */
  chooseInChain(h3: H3Index, choiceIndex: number, now: number): Promise<ChoiceOutcome>;

  /* --- Adventures (BRDC-QUEST-001) ----------------------------------- */
  /** Every adventure, with its state and — when running — the current stage and choices. */
  getAdventures(now: number): Promise<AdventureView[]>;
  /** Begin an adventure. Refuses one that is unknown or already begun. */
  startAdventure(id: string, now: number): Promise<StartOutcome>;
  /** Take a choice in a running adventure; applies its pouch/XP effect and moves on. */
  chooseInAdventure(id: string, choiceIndex: number, now: number): Promise<AdventureChoiceOutcome>;
  /** Drop a running adventure so it can be started again. */
  abandonAdventure(id: string): Promise<void>;
  /** Secret quest sites the player has walked onto (the map draws these). */
  getQuestFinds(): Promise<SecretSiteId[]>;
  /** Record a walk onto a secret site; returns the id if new, `null` if already found. */
  recordQuestFind(id: SecretSiteId, now: number): Promise<SecretSiteId | null>;
  /** The scattered cipher — fragments held, and the writing once whole (BRDC-CIPHER-001). */
  getCipher(): Promise<CipherView>;
  /** Record a walk onto a cipher fragment cell; the index if new, `null` if already held. */
  recordCipherShard(index: number, now: number): Promise<number | null>;

  /* --- Maintenance ------------------------------------------------------ */
  runDecay(now: number): Promise<DecayResult>;
  /** Deliberate, user-initiated wipe. Clears timers as well as state. */
  resetAll(): Promise<void>;
  /** Dev only: refill the pouch (BRDC-ECON-002). Shown behind `import.meta.env.DEV`. */
  debugGrant(now: number): Promise<void>;
}
