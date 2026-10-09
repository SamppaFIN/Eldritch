/**
 * Season 3's doors on the repository (the 4X + Arkham round, branch `season-3`) — their
 * own file, the way `SeasonTwoApis` and `OctoberApis` are. `GameRepository` extends this.
 */
import type { MythosApi } from '../data/mythosStore.js';
import type { AmbitionApi } from '../data/ambitionStore.js';
import type { EraApi } from '../data/eraStore.js';
import type { WeekApi } from '../data/ageStore.js';
import type { DreamApi } from '../data/dreamStore.js';
import type { ChimneyApi } from '../data/chimneyStore.js';
import type { GreatApi } from '../data/greatStore.js';
import type { TradeRouteApi } from '../data/tradeRouteStore.js';
import type { SuzerainApi } from '../data/suzerainStore.js';
import type { PageApi } from '../data/pageStore.js';
import type { MaskApi } from '../data/maskStore.js';
import type { PropellerApi } from '../data/propellerStore.js';
import type { OtherWorldApi } from '../data/otherWorldStore.js';

export interface SeasonThreeApis {
  /** Today's Mythos card: the season's clock, and whether the headline was read (BRDC-MYTHOS-001). */
  readonly mythos: MythosApi;
  /** The season's ambition: chosen once in the Keep, met it multiplies the Legacy (BRDC-AMBITION-001). */
  readonly ambition: AmbitionApi;
  /** The realm's character at each Age entered, chosen once each (BRDC-ERA-001). */
  readonly eras: EraApi;
  /** This week's golden or dark age, judged on the Legacy's pace (BRDC-AGE-001). */
  readonly week: WeekApi;
  /** Last night's dream, drawn on a morning's waking where you slept (BRDC-DREAM-001). */
  readonly dreams: DreamApi;
  /** The three chimneys: landmarks, and beacons once all three are held (BRDC-CHIMNEY-001). */
  readonly chimneys: ChimneyApi;
  /** Great people: born of Works' points, one deed each, kept by the Hall (BRDC-GREAT-001). */
  readonly great: GreatApi;
  /** Trade routes walked from a Market to a Market or a village (BRDC-TRADEROUTE-001). */
  readonly routes: TradeRouteApi;
  /** Envoys to the villages, and which this realm leads (BRDC-SUZERAIN-001). */
  readonly suzerain: SuzerainApi;
  /** The Book That Came Back: pages found on the ground, read at a price (BRDC-PAGES-001). */
  readonly pages: PageApi;
  /** The stranger in many masks: met in rumours, named in the Keep (BRDC-MASKS-001). */
  readonly masks: MaskApi;
  /** The Skyward Runway's propeller: gates to seal from afar (BRDC-AERODROME-001). */
  readonly propeller: PropellerApi;
  /** Journeys through open gates into the Other World (BRDC-OTHERWORLD-001). */
  readonly otherWorld: OtherWorldApi;
}
