export * from './constants.js';
export { levelForXp, levelName, levelState, xpForLevel } from './level.js';
export type { LevelState } from './level.js';
export { daysBetween, previousDay, utcDay } from './day.js';
export { attackPower, emptyCell, resolveCapture } from './capture.js';
export type { Attacker, CaptureResult } from './capture.js';
export { appendChange } from './history.js';
export type { OwnershipChange } from './history.js';
export { appendLog } from './log.js';
export type { LogEntry, LogKind } from './log.js';
export {
  ERAS,
  TECHS,
  canResearch,
  eraChanged,
  eraOf,
  hasTech,
  research,
  researchCost,
  researchable,
} from './tech.js';
export type { Era, ResearchResult, Tech, TechId, TechRefusal, TechResult } from './tech.js';
export {
  BUILDINGS,
  buildCost,
  buildingBonus,
  buildingCapacity,
  buildingDayBonus,
  buildingsOf,
  canBuild,
  refund,
  storageCap,
} from './build.js';
export type { Building, BuildingId, BuildCheck, BuildContext, BuildRefusal } from './build.js';
export { defenceAura, loyaltyFactor, loyaltySourceCells, resourceAura } from './aura.js';
export type { AuraKind } from './aura.js';
export { canLayRoute, routeCost, routeGoldBonus, routeRefund, sameLink } from './trade.js';
export type { RouteCheck, RouteRefusal, TradeRoute } from './trade.js';
export { RARITY_SHARE, revealOf } from './reveal.js';
export type { Rarity } from './reveal.js';
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
} from './anomaly.js';
export type { AnomalyKind, InvestigateRefusal } from './anomaly.js';
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
export { timeToAfford } from './afford.js';
export { projectCell, decayAmount, hoursUntilReleased, sweepDecay } from './decay.js';
export type { DecaySweep } from './decay.js';
export { growInto, growthNeighbourhood } from './growth.js';
export type { GrowthResult } from './growth.js';
export {
  ANCHOR_THRESHOLD_MS,
  MAX_DWELL_GAP_MS,
  TEMPLE_THRESHOLD_MS,
  accrueAll,
  accrueDwell,
  anchorOf,
  placesWithHome,
  revealPlaces,
  revealProgress,
} from './dwell.js';
export type { DwellMap, DwellReading, Place, PlaceKind } from './dwell.js';
export {
  BASE_STORAGE_CAP,
  CLAIM_YIELD,
  EMPTY_POOL,
  RESOURCE_KINDS,
  TERRAIN_TABLE,
  TRICKLE_PER_HOUR,
  addClaimYield,
  canAfford,
  resourceForCell,
  resourceOf,
  settleResources,
  spend,
  terrainForCell,
  terrainFromTiles,
  terrainOf,
  trickle,
} from './terrain.js';
export { HARMALA_STATUE, SEED_BOX, enableTerrainSurvey, seededTerrainOf } from './terrainSeed.js';
export type {
  BuildSite,
  ResourceKind,
  ResourcePool,
  ResourceState,
  Terrain,
  TerrainKind,
  TerrainSource,
  TileFeature,
} from './terrain.js';
export { WARD_COST, WARD_STRENGTH, ward, wardsAffordable } from './ward.js';
export type { WardRefusal, WardResult } from './ward.js';
export { ACHIEVEMENTS, earnedNow } from './achievements.js';
export type { Achievement, AchievementSnapshot } from './achievements.js';
export { SHARD_COUNT, cipherComplete, cipherShardAt } from './cipher.js';
export { channelMana, expandTemple, expansionCost, manaBonus, manaRate, placesWithMana } from './mana.js';
export type { ChannelRefusal, ChannelResult, ExpandRefusal, ExpandResult } from './mana.js';
export {
  BULWARK_SHELTER_MS,
  SPELLS,
  activeSpells,
  castSpell,
  domainSpellBonus,
  spellRemaining,
} from './spell.js';
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
