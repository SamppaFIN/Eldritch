/**
 * Season 3's doors on the repository (the 4X + Arkham round, branch `season-3`) — their
 * own file, the way `SeasonTwoApis` and `OctoberApis` are. `GameRepository` extends this.
 */
import type { MythosApi } from '../data/mythosStore.js';
import type { AmbitionApi } from '../data/ambitionStore.js';
import type { EraApi } from '../data/eraStore.js';

export interface SeasonThreeApis {
  /** Today's Mythos card: the season's clock, and whether the headline was read (BRDC-MYTHOS-001). */
  readonly mythos: MythosApi;
  /** The season's ambition: chosen once in the Keep, met it multiplies the Legacy (BRDC-AMBITION-001). */
  readonly ambition: AmbitionApi;
  /** The realm's character at each Age entered, chosen once each (BRDC-ERA-001). */
  readonly eras: EraApi;
}
