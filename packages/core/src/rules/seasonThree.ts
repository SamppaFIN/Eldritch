/**
 * Season 3's rules (the 4X + Arkham round, 2026-10-06): exported here and re-exported by
 * `index.ts`, which reached its 400-line limit.
 */
export { ADJ_KIN_CAP, ADJ_KIN_STEP, ADJ_TEMPLE_WISDOM, ADJ_WATER_FOOD, adjacencyFor, adjacencyOnCell } from './adjacency.js';
export type { AdjacencyLine, AdjacencyWorld } from './adjacency.js';
export { hoursToAfford, rankUpNext, upNextText, whenText } from './upNext.js';
export type { UpNextItem } from './upNext.js';
export { EUREKA_DISCOUNT, eurekaCost, eurekaFor } from './eureka.js';
export type { Eureka, EurekaState } from './eureka.js';
export { ALLIES, allyDice, allyDiscount, allyOf } from './ally.js';
export type { Ally, AllyId } from './ally.js';
export { CONDITIONS, DEBT_GOLD, PACT_SANITY, activeConditions, conditionDice, conditionLuck, gainCondition, hasCondition } from './condition.js';
export type { ConditionDef, ConditionId, HeldCondition } from './condition.js';
export { AMBITIONS, AMBITION_IDS, AMBITION_MULT, ambitionMet, ambitionProgress, templesHeld } from './ambition.js';
export type { Ambition, AmbitionId, AmbitionState } from './ambition.js';
export { ERAS, ERA_IDS, eraBonus, eraChain, pendingEra } from './era.js';
export type { EraDef, EraId } from './era.js';
