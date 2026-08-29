export * from './constants.js';
export { levelForXp, levelName, levelState, xpForLevel } from './level.js';
export type { LevelState } from './level.js';
export { daysBetween, previousDay, utcDay } from './day.js';
export { attackPower, emptyCell, resolveCapture } from './capture.js';
export type { Attacker, CaptureResult } from './capture.js';
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
  CLAIM_YIELD,
  EMPTY_POOL,
  RESOURCE_OF,
  TRICKLE_PER_HOUR,
  addClaimYield,
  canAfford,
  resourceOf,
  settleResources,
  spend,
  terrainOf,
  trickle,
} from './terrain.js';
export type { ResourceKind, ResourcePool, ResourceState, TerrainKind } from './terrain.js';
export { WARD_COST, WARD_STRENGTH, ward, wardsAffordable } from './ward.js';
export type { WardRefusal, WardResult } from './ward.js';
export { muster, resolveWager, wagerSeed } from './wagerBattle.js';
export type { Combatant, Defence, WagerOutcome, WagerRound } from './wagerBattle.js';
