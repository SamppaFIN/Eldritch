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
  ClaimResult,
  DecayResult,
  PlayerProfile,
  Run,
  RunId,
  TrailPoint,
  TrailResult,
} from './domain.js';

export interface GameRepository {
  /* --- Profile ---------------------------------------------------------- */
  getProfile(): Promise<PlayerProfile>;

  /* --- Runs and trail --------------------------------------------------- */
  startRun(now: number): Promise<RunId>;
  getActiveRun(): Promise<Run | null>;
  submitTrail(runId: RunId, points: TrailPoint[]): Promise<TrailResult>;
  getTrailPoints(runId: RunId): Promise<TrailPoint[]>;
  endRun(runId: RunId): Promise<void>;

  /* --- Territory -------------------------------------------------------- */
  /** Runs loop detection on the run's points; a no-op result if it has not closed. */
  closeLoop(runId: RunId, now: number): Promise<ClaimResult>;
  /** Applies decay at read time, then returns what survives in the viewport. */
  getCells(bbox: BBox, now: number): Promise<Cell[]>;
  getOwnedCells(now: number): Promise<Cell[]>;

  /* --- Maintenance ------------------------------------------------------ */
  runDecay(now: number): Promise<DecayResult>;
  /** Deliberate, user-initiated wipe. Clears timers as well as state. */
  resetAll(): Promise<void>;
}
