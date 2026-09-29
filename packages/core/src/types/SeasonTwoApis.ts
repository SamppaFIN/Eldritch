/**
 * The Season 2 doors on the repository (Eldritch-Progression.pdf, Eldritch-season.pdf).
 *
 * Each is a separate API object, like `works`, and each `view` is null on a Season 1
 * save — so the game a Season 1 player walks today is unchanged. Split from
 * `GameRepository.ts` for its line limit; `GameRepository` extends this.
 */
import type { KeepApi } from '../data/citizenStore.js';
import type { LoreApi } from '../data/loreStore.js';
import type { RiteApi } from '../data/riteStore.js';
import type { MasterworkApi } from '../data/masterworkStore.js';
import type { GateApi } from '../data/gateStore.js';
import type { RumourApi } from '../data/deckStore.js';
import type { ReckoningApi } from '../data/reckoningStore.js';
import type { LegacyApi } from '../data/legacyTally.js';
import type { HeirloomApi } from '../data/heirloomStore.js';
import type { RuinApi } from '../data/ruinStore.js';

export interface SeasonTwoApis {
  /** The Keep's level, citizens and granary (BRDC-PROG-001). */
  readonly keep: KeepApi;
  /** The Lore — five Ages, four paths (BRDC-PROG-004). */
  readonly lore: LoreApi;
  /** The temples' three schools (BRDC-PROG-007). */
  readonly rites: RiteApi;
  /** Masterworks (BRDC-PROG-006). */
  readonly masterworks: MasterworkApi;
  /** Gates, clues and the investigator (BRDC-DOOM-002). */
  readonly gates: GateApi;
  /** Rumours: terrain encounter decks (BRDC-DOOM-003). */
  readonly rumours: RumourApi;
  /** The realm's blows in the Reckoning (BRDC-DOOM-004). */
  readonly reckoning: ReckoningApi;
  /** The Legacy tally — works on a Season 1 save too (BRDC-SEASON-003). */
  readonly legacy: LegacyApi;
  /** One thing carried across seasons (BRDC-SEASON-006). */
  readonly heirloom: HeirloomApi;
  /** The last season's Fortresses, searched once each (BRDC-SEASON-007). */
  readonly ruins: RuinApi;
}
