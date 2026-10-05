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

export { toOwnershipCell } from './MockRepositoryBase.js';
export type { MockRepositoryOptions } from './MockRepositoryBase.js';

export class MockRepository extends MockRepositoryBase implements GameRepository {
  /* --- Building pages (WORKS-002) and Season 2's doors --------------------- */
  readonly works: WorksApi = worksApi(() => this.store, async () => (await this.getProfile()).id, (t) => this.getOwnedCells(t));
  readonly keep: S2.KeepApi = S2.keepApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly lore: S2.LoreApi = S2.loreApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly rites: S2.RiteApi = S2.riteApi(() => this.store, (t) => this.getOwnedCells(t), () => this.gates);
  readonly masterworks: S2.MasterworkApi = S2.masterworkApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly gates: S2.GateApi = S2.gateApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly rumours: S2.RumourApi = S2.rumourApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly reckoning: S2.ReckoningApi = S2.reckoningApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly legacy: S2.LegacyApi = S2.legacyApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly heirloom: S2.HeirloomApi = S2.heirloomApi(() => this.store);
  readonly ruins: S2.RuinApi = S2.ruinApi(() => this.store, () => this.newId());
  readonly wonderActs: S2.WonderActApi = S2.wonderActApi(() => this.store, (t) => this.getOwnedCells(t), () => this.gates, () => this.reckoning);

  /* --- Ominaisuuskierros lokakuu 2026 -------------------------------------- */
  readonly yields: YieldApi = yieldApi(() => this.store, (t) => this.getOwnedCells(t));
  readonly standard: StandardApi = standardApi(() => this.store, (t) => this.getOwnedCells(t));
}
