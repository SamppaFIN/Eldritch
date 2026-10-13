/**
 * The offline implementation of GameRepository: the base's own verbs, and the doors that
 * hang off it as API objects — Works pages, Season 2, and per-hex yields (BRDC-YIELD-001).
 * Split from `MockRepositoryBase.ts` when this file reached the 400-line limit.
 */
import type { GameRepository } from '../types/GameRepository.js';
import { MockRepositoryBase } from './MockRepositoryBase.js';
import { worksApi, type WorksApi } from './worksStore.js';
import * as S2 from './seasonTwo.js'; // Season 2's doors (SeasonTwoApis), gathered for the line limit
import { yieldApi, type YieldApi } from './yieldStore.js';
import { standardApi, type StandardApi } from './standardStore.js';
import { chronicleImageApi, type ChronicleImageApi } from './chronicleImageStore.js';
import { investigatorApi, type InvestigatorApi } from './investigatorStore.js';
import { taskApi, type TaskApi } from './taskStore.js';
import { mythosApi, type MythosApi } from './mythosStore.js';
import { ambitionApi, type AmbitionApi } from './ambitionStore.js';
import { eraApi, type EraApi } from './eraStore.js';
import { weekApi, type WeekApi } from './ageStore.js';
import { dreamApi, type DreamApi } from './dreamStore.js';
import { chimneyApi, type ChimneyApi } from './chimneyStore.js';
import { greatApi, type GreatApi } from './greatStore.js';
import { tradeRouteApi, type TradeRouteApi } from './tradeRouteStore.js';
import { suzerainApi, type SuzerainApi } from './suzerainStore.js';
import { pageApi, type PageApi } from './pageStore.js';
import { maskApi, type MaskApi } from './maskStore.js';
import { propellerApi, type PropellerApi } from './propellerStore.js';
import { otherWorldApi, type OtherWorldApi } from './otherWorldStore.js';
import { monsterApi, type MonsterApi } from './monsterStore.js';
import { charterApi, type CharterApi } from './charterStore.js';

export { toOwnershipCell } from './MockRepositoryBase.js';
export type { MockRepositoryOptions } from './MockRepositoryBase.js';

export class MockRepository extends MockRepositoryBase implements GameRepository {
  /* --- Building pages (WORKS-002) and Season 2's doors --------------------- */
  readonly works: WorksApi = worksApi(() => this.store, async () => (await this.getProfile()).id, (t) => this.getOwnedCells(t));
  readonly keep: S2.KeepApi = S2.keepApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly lore: S2.LoreApi = S2.loreApi(() => this.store, (t) => this.getOwnedCells(t), () => this.getPlaces());
  readonly rites: S2.RiteApi = S2.riteApi(() => this.store, (t) => this.getOwnedCells(t), () => this.gates);
  readonly masterworks: S2.MasterworkApi = S2.masterworkApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly gates: S2.GateApi = S2.gateApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly rumours: S2.RumourApi = S2.rumourApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly reckoning: S2.ReckoningApi = S2.reckoningApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly legacy: S2.LegacyApi = S2.legacyApi(() => this.store, (t) => this.getOwnedCells(t), () => this.getPlaces());
  readonly heirloom: S2.HeirloomApi = S2.heirloomApi(() => this.store);
  readonly ruins: S2.RuinApi = S2.ruinApi(() => this.store, () => this.newId());
  readonly wonderActs: S2.WonderActApi = S2.wonderActApi(() => this.store, (t) => this.getOwnedCells(t), () => this.gates, () => this.reckoning);

  /* --- Ominaisuuskierros lokakuu 2026 -------------------------------------- */
  readonly yields: YieldApi = yieldApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly standard: StandardApi = standardApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly chronicleImages: ChronicleImageApi = chronicleImageApi(() => this.store);
  readonly investigator: InvestigatorApi = investigatorApi(() => this.store, (t) => this.getOwnedCells(t), () => this.getHome(), () => this.getPlaces());
  readonly tasks: TaskApi = taskApi(() => this.store, (t) => this.getOwnedCells(t), () => this.getPlaces(), (xp) => this.addXp(xp));

  /* --- Season 3 (branch `season-3`) ------------------------------------------ */
  readonly mythos: MythosApi = mythosApi(() => this.store);
  readonly ambition: AmbitionApi = ambitionApi(() => this.store, (t) => this.getOwnedCells(t), () => this.getPlaces());
  readonly eras: EraApi = eraApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly dreams: DreamApi = dreamApi(() => this.store);
  readonly chimneys: ChimneyApi = chimneyApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly routes: TradeRouteApi = tradeRouteApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly suzerain: SuzerainApi = suzerainApi(() => this.store);
  readonly pages: PageApi = pageApi(() => this.store);
  readonly masks: MaskApi = maskApi(() => this.store);
  readonly propeller: PropellerApi = propellerApi(() => this.store, () => this.gates);
  readonly otherWorld: OtherWorldApi = otherWorldApi(() => this.store, () => this.gates);
  readonly monsters: MonsterApi = monsterApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly great: GreatApi = greatApi(() => this.store, (t) => this.getOwnedCells(t), () => this.gates);
  readonly charter: CharterApi = charterApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly week: WeekApi = weekApi(() => this.store, (t) => this.getOwnedCells(t), (t) => this.legacy.tally(t));
}
