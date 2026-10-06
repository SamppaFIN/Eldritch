/**
 * The doors the October 2026 feature round added to the repository (handoff F-01…F-51) —
 * split from `GameRepository.ts` at its line limit, the way `SeasonTwoApis` was.
 * `GameRepository` extends this.
 */
import type { YieldApi } from '../data/yieldStore.js';
import type { StandardApi } from '../data/standardStore.js';
import type { ChronicleImageApi } from '../data/chronicleImageStore.js';
import type { TaskApi } from '../data/taskStore.js';

export interface OctoberApis {
  /** Each held hex's yield per hour, itemised by where it comes from (BRDC-YIELD-001). */
  readonly yields: YieldApi;
  /** Your standard, planted on the hex you stand on, your own ground only (BRDC-STANDARD-001). */
  readonly standard: StandardApi;
  /** A retired kingdom's picture (BRDC-HALL-004). */
  readonly chronicleImages: ChronicleImageApi;
  /** The Tavern board's tasks (BRDC-QUEST-009). */
  readonly tasks: TaskApi;
}
