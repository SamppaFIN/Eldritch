export * from './constants.js';
export { levelForXp, levelName, levelState, xpForLevel } from './level.js';
export type { LevelState } from './level.js';
export { daysBetween, previousDay, utcDay } from './day.js';
export { attackPower, emptyCell, resolveCapture, resolveInstantCapture } from './capture.js';
export type { Attacker, CaptureResult } from './capture.js';
export { appendChange } from './history.js';
export type { OwnershipChange } from './history.js';
export { appendLog } from './log.js';
export type { LogEntry, LogKind } from './log.js';
export { population, provinceCount } from './nation.js';
export {
  ERAS,
  TECHS,
  TEMPLE_SCHOOLS,
  canResearch,
  eraChanged,
  eraOf,
  eraProgress,
  hasTech,
  research,
  researchCost,
  researchBonus,
  researchable,
  researchableFor,
  researchableSchoolless,
  riteChain,
} from './tech.js';
export type {
  Era,
  EraProgress,
  ResearchResult,
  Tech,
  TechId,
  TechRefusal,
  TechResult,
  TempleSchool,
} from './tech.js';
export {
  BUILDINGS,
  buildCost,
  buildingBonus,
  buildingDayBonus,
  buildingsOf,
  canBuild,
  hasWork,
  keepOne,
  refund,
  storageCap,
  worksOn,
} from './build.js';
export type { Building, BuildingId, BuildCheck, BuildContext, BuildRefusal } from './build.js';
export {
  FORTRESS_REACH,
  defenceAura,
  fortified,
  loyaltyFactor,
  loyaltySourceCells,
  resourceAura,
} from './aura.js';
export type { AuraKind } from './aura.js';
export { RARITY_SHARE, REVEAL_MULT, revealBonus, revealOf } from './reveal.js';
export type { Rarity } from './reveal.js';
export { claimableStep } from './step.js';
export { DARK_RADIUS_DAYS, DARK_TIME_FACTOR, darkTimeAt } from './darkTime.js';
export type { DarkTime } from './darkTime.js';
export {
  ANOMALY_INVESTIGATE_COST,
  ANOMALY_INVESTIGATE_MS,
  anomalyAt,
  beginInvestigation,
  investigationProgress,
  isResolved,
  resolveReward,
  ANOMALY_SIGNS,
  anomalySignOf,
} from './anomaly.js';
export type { AnomalyKind, AnomalySign, InvestigateRefusal } from './anomaly.js';
export { applyChoice, parseChains } from './chain.js';
export type { Chain, ChainChoice, ChainEffect, ChainStage, ChoiceRefusal } from './chain.js';
export { advanceAdventure, gateMet, parseAdventures } from './adventure.js';
export type {
  Adventure,
  AdventureChoice,
  AdventureContext,
  AdventureGate,
  AdventureStage,
} from './adventure.js';
export { shortOf, timeToAfford } from './afford.js';
export { blightLevel, projectCell, decayAmount, hoursUntilReleased, sweepDecay } from './decay.js';
export type { DecaySweep } from './decay.js';
export { growInto, growthNeighbourhood, recordVisit } from './growth.js';
export type { GrowthResult } from './growth.js';
export {
  ANCHOR_THRESHOLD_MS,
  MAX_DWELL_GAP_MS,
  TEMPLE_THRESHOLD_MS,
  accrueAll,
  accrueDwell,
  anchorOf,
  dwellAnchorAt,
  placesWithHome,
  revealPlaces,
  revealProgress,
  stickyDwell,
} from './dwell.js';
export type { DwellAnchor, DwellMap, DwellReading, Place, PlaceKind } from './dwell.js';
export {
  BASE_STORAGE_CAP,
  CLAIM_YIELD,
  EMPTY_POOL,
  RESOURCE_KINDS,
  TERRAIN_TABLE,
  TRICKLE_PER_HOUR,
  canAfford,
  resourceForCell,
  resourceOf,
  settleResources,
  spend,
  terrainAt,
  terrainForCell,
  terrainOf,
  trickle,
} from './terrain.js';
export { terrainFromTiles } from './terrainTiles.js';
export type { TileFeature } from './terrainTiles.js';
export { HARMALA_STATUE, SEED_BOX, enableTerrainSurvey, inBox, seededTerrainOf } from './terrainSeed.js';
export type {
  BuildSite,
  ResourceKind,
  ResourcePool,
  ResourceState,
  Terrain,
  TerrainKind,
  TerrainSource,
} from './terrain.js';
export {
  HEARTH_FOOD_PER_HEX,
  HEARTH_MAX_RING,
  HEARTH_START_RING,
  growHearth,
  hearthRingHexes,
} from './hearthGrowth.js';
export type { HearthGrowthRefusal, HearthGrowthResult } from './hearthGrowth.js';
export { WARD_COST, WARD_STRENGTH, ward, wardsAffordable } from './ward.js';
export type { WardRefusal, WardResult } from './ward.js';
export { ACHIEVEMENTS, earnedNow } from './achievements.js';
export type { Achievement, AchievementSnapshot } from './achievements.js';
export { SHARD_COUNT, cipherComplete, cipherShardAt } from './cipher.js';
export {
  consecrateCost,
  expandTemple,
  expansionCost,
  placeBonus,
  manaRate,
  placesWithMana,
} from './mana.js';
export type { ExpandRefusal, ExpandResult } from './mana.js';
export { SPELLS, activeSpells, castSpell, spellRemaining } from './spell.js';
export {
  AEGIS_SHELTER_MS,
  BULWARK_SHELTER_MS,
  SCRY_BASE_REACH,
  SCRY_LEVELS_PER_RING,
  SCRY_MAX_REACH,
  domainSpellBonus,
  scriedCells,
  scryReach,
} from './spellEffects.js';
export type {
  ActiveSpell,
  CastContext,
  CastRefusal,
  CastResult,
  Spell,
  SpellId,
  SpellSchool,
  SpellScope,
  SpellVia,
} from './spell.js';
export { muster, resolveWager, wagerSeed } from './wagerBattle.js';
export type { Combatant, Defence, WagerOutcome, WagerRound } from './wagerBattle.js';
export {
  BOUNTIES,
  BOUNTY_IDS,
  BOUNTY_SHARE,
  bountiesFor,
  bountyBonus,
  bountyOn,
  bountyYield,
} from './bounty.js';
export type { Bounty, BountyId, BountyPick, BountyPool } from './bounty.js';
export { LANDMARK_CULTURE_PER_HOUR, landmarkBonus, landmarkOn } from './landmark.js';
export { holdingOf, sortHoldings, summarise } from './holdings.js';
export type { Holding, HoldingsSummary } from './holdings.js';
export {
  CITY_STATES,
  TRADE_LOSS,
  TRADE_PARCEL,
  anchorCityStates,
  cityStateById,
  cityStateOf,
  cityStates,
  isCityState,
  stepsToDoor,
  trade,
  tradeReturn,
} from './cityState.js';
export type { CityState, CityStateId, TradeRefusal, TradeResult } from './cityState.js';
export {
  encounterAt,
  encountersFor,
  pickEncounter,
  parseEncounters,
  rollsDailyOmen,
  rollsEncounter,
} from './encounter.js';
export type { Encounter, EncounterChoice, EncounterKind } from './encounter.js';
export { WONDERS, WONDER_IDS, WONDER_STARS, wonderFits } from './wonder.js';
export type { Wonder, WonderId } from './wonder.js';
export { HARMALA_WONDERS, HARMALA_WONDER_IDS, harmalaWonderFits } from './harmalaWonder.js';
export type { HarmalaWonder, HarmalaWonderId } from './harmalaWonder.js';
export {
  WONDER_PROVINCE_RES,
  WONDER_SCOPE_RES,
  WONDER_SET_VERSION,
  assignProvinces,
  legendaryWonders,
  localWonders,
  wonderInProvince,
  wonderRoll,
  wondersNear,
  wondersOfRarity,
} from './wonderPlace.js';
export { UNLOCK_IDS, UNLOCK_REWARD, nextUnlock, unlockedBy, walked } from './unlock.js';
export type { Reach, UnlockId } from './unlock.js';
export { localShare } from './share.js';
export { WORKS_DEFS, WORKS_KINDS } from './works/defs/index.js';
export {
  WIRED,
  activeEffects,
  canResearch as canResearchWork,
  cellsInRings,
  isDormant,
  isWired,
  nodeById,
  nodeCount,
  nodeState,
  reachRings,
  researchNode,
  worksLevel,
  tierNumberOf,
} from './works/tree.js';
export type { NodeState, WorksRefusal } from './works/tree.js';
export { worksBonus, worksCapBonus } from './works/bonus.js';
export type { BuildingDef, Effect, EffectKind, SpecialId, WorksKind, WorksNode, WorksTier } from './works/types.js';
export {
  BOSS_HP_PER_REALM,
  DOOM_MAX,
  FOSSIL_MS,
  INTERREGNUM_MS,
  QUIET_LEGACY_MULT,
  RECKONING_MS,
  advanceSeason,
  bossMaxHp,
  damageBoss,
  forcePhase,
  legacyMultiplier,
  openSeason,
  seasonDay,
  seasonIsPlayable,
} from './season.js';
export type { Season, SeasonOutcome, SeasonPhase } from './season.js';
export { BALANCE, copyCost, growBox, housing, slots } from './balance.js';
export {
  FIRST_GRANARY,
  FIRST_KEEP,
  KEEP_LEVEL_WITHOUT_LORE,
  STORE_MS,
  feedGranary,
  foodBalance,
  hoursToNextCitizen,
  calmAt,
  keepHousing,
  keepRaiseCost,
  raiseKeep,
  settleGranary,
} from './citizens.js';
export type { Boon, Granary, GranaryResult, KeepRaiseResult, KeepState } from './citizens.js';
export {
  WORK_TABLE,
  assignWorker,
  isFoodDeposit,
  slotsFor,
  staffKey,
  staffed,
  staffedBonus,
  staffedCells,
  trimStaff,
} from './staffing.js';
export type { StaffMap, StaffRefusal } from './staffing.js';
export { AGE_NAMES, LORE, LORE_IDS, ageOf, canStudy, keepCeiling, loreAllows, loreCost, loreFor } from './lore.js';
export type { Age, LoreId, LorePath, LoreTech, MasterworkId, StudyRefusal, Unlock } from './lore.js';
export {
  EMPTY_BOOK,
  RITES,
  RITE_COOLDOWN_MS,
  RITE_IDS,
  castsOnHex,
  RITE_MANA,
  castRite,
  dedicate,
  deepenCost,
  deepenRite,
  learnCost,
  learnRite,
  rankCeiling,
  riteText,
  rivalRite,
  schoolSlots,
  tierCeiling,
} from './rites.js';
export type { Rank, Rite, RiteBook, RiteEffect, RiteId, RiteRefusal, School, Tier } from './rites.js';
export {
  MASTERWORKS,
  MASTERWORK_IDS,
  activeMasterworks,
  isDormant as isMasterworkDormant,
  ladder as masterworkLadder,
} from './masterwork.js';
export type { Masterwork, Need } from './masterwork.js';
export { SANITY_LEAVE_BELOW, SANITY_YIELD_PENALTY, realmSanity, sanityWord, sanityYield } from './sanity.js';
export { DOOM_WARN_FROM, MYTHOS, dawnsSince, doomAt, mythosFor } from './doom.js';
export type { MythosCard } from './doom.js';
export {
  FIRST_INVESTIGATOR,
  HOME_MS,
  REST_MS,
  SANITY_MAX,
  STAMINA_MAX,
  addClues,
  afterTest,
  diceFor,
  isHome,
  recover,
  reroll,
  rollTest,
  sealClues,
  successFloor,
} from './investigator.js';
export type { Investigator, Luck, Roll, Skill } from './investigator.js';
export { GATE_DOOM_MS, GATE_TEST_NEED, gateAtDawn, gatesNear, horrorBite, isOpen as isGateOpen, overdue } from './gate.js';
export type { Gate } from './gate.js';
export { DECKS, RUMOUR_SHARE, cardById, deckFor, rumourAt } from './deck.js';
export type { Deck, DeckCard } from './deck.js';
export {
  FORTRESS_STRIKE_BONUS,
  MAX_DAMAGE_PER_CALL,
  RITE_DAMAGE,
  RITE_MANA_COST,
  SEAL_DAMAGE,
  STRIKE_COOLDOWN_MS,
  STRIKE_PER_SUCCESS,
  rankOf,
  riteDamage,
  sealDamage,
  strikeDamage,
} from './reckoning.js';
export type { RealmMight, ReckoningStanding } from './reckoning.js';
export { EMPTY_COUNTS, legacyOf } from './legacy.js';
export type { Legacy, LegacyCounts, LegacyLine } from './legacy.js';
export { hallOfAges, hallOfRecords, legacyBoard } from './boards.js';
export type { BoardRow, Title } from './boards.js';
export { HEIRLOOMS, HEIRLOOM_IDS } from './heirloom.js';
export type { Crossing, Heirloom, HeirloomId } from './heirloom.js';
export { seasonSalt, setSeasonSalt } from './seasonSalt.js';
export { RUIN_FINDS, ruinFindAt } from './ruins.js';
export type { RuinFind } from './ruins.js';
export { WONDER_ACTS, WONDER_ACT_COOLDOWN_MS } from './wonderActs.js';
export type { WonderAct, WonderActKind } from './wonderActs.js';
export { CODEX_CARDS, counselOf } from './counsel.js';
export type { Counsel, CounselState } from './counsel.js';
