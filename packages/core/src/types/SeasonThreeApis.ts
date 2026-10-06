/**
 * Season 3's doors on the repository (the 4X + Arkham round, branch `season-3`) — their
 * own file, the way `SeasonTwoApis` and `OctoberApis` are. `GameRepository` extends this.
 */
import type { MythosApi } from '../data/mythosStore.js';

export interface SeasonThreeApis {
  /** Today's Mythos card: the season's clock, and whether the headline was read (BRDC-MYTHOS-001). */
  readonly mythos: MythosApi;
}
