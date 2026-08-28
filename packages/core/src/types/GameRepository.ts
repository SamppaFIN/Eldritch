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
  TrailPoint,
  TrailResult,
} from './domain.js';
import type { ResourcePool } from '../rules/terrain.js';

export interface GameRepository {
  /* --- Profile ---------------------------------------------------------- */
  getProfile(): Promise<PlayerProfile>;

  /* --- Runs and trail --------------------------------------------------- */
  startRun(now: number): Promise<RunId>;
  getActiveRun(): Promise<Run | null>;
  submitTrail(runId: RunId, points: TrailPoint[]): Promise<TrailResult>;
  getTrailPoints(runId: RunId): Promise<TrailPoint[]>;
  endRun(runId: RunId): Promise<void>;

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

  /* --- Resources -------------------------------------------------------- */
  /**
   * The pouch, brought up to date.
   *
   * `now` is a parameter for the same reason it is everywhere else: the trickle from
   * held ground is settled at read time, and a test that fast-forwards a week has to be
   * able to say so.
   */
  getResources(now: number): Promise<ResourcePool>;

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

  /* --- Places ----------------------------------------------------------- */
  /** Cells that have earned a name, Anchor first. */
  getPlaces(): Promise<RevealedPlace[]>;
  /** Time accumulated in the cell the player is standing in, for a progress readout. */
  getDwellFor(h3: H3Index): Promise<number>;

  /* --- Maintenance ------------------------------------------------------ */
  runDecay(now: number): Promise<DecayResult>;
  /** Deliberate, user-initiated wipe. Clears timers as well as state. */
  resetAll(): Promise<void>;
}
