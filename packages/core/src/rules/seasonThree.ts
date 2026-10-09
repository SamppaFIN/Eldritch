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
export { BOONS, BOON_IDS, WEEK_FACTOR, WEEK_NAME, ageFor, rollWeek, weekEffect, weekKey } from './age.js';
export type { BoonId, WeekKind, WeekState } from './age.js';
export { DREAMS, dreamFor, dreamt } from './dream.js';
export type { DreamCard } from './dream.js';
export { FULL_MOON_DOOM, FULL_MOON_MANA, HARVEST_MOON_FOOD, isFullMoon, isNewMoon, moonDay } from './moon.js';
export type { MoonDay } from './moon.js';
export { STORM_ACCURACY, WEATHER_LINE, WEATHER_NAME, sightRings, skyLine, weatherAt } from './weather.js';
export type { Weather } from './weather.js';
export { CHIMNEYS, CHIMNEY_SIGHT_RINGS, chimneyAt, chimneysLit } from './chimney.js';
export type { Chimney, ChimneyId } from './chimney.js';
export { GREAT, GREAT_FIRST, GREAT_KINDS, greatCost, greatName, greatRate } from './greatPeople.js';
export type { GreatDeed, GreatKind } from './greatPeople.js';
export { ROUTE_GAP_MS, ROUTE_MAX_M, advanceJourney, routeActive, routeGold, routeId, routesGold } from './tradeRoute.js';
export type { Journey, RouteEnd, TradeRoute } from './tradeRoute.js';
export { SUZERAIN_BONUS, SUZERAIN_MIN, VILLAGE_TASKS, envoysFrom, suzerainOf } from './suzerain.js';
export { PAGES, PAGE_FIND_SHARE, afterReading, canReadPage, pageFoundAt, readPageInto } from './pages.js';
export type { Page } from './pages.js';
export { MASKS_TO_NAME, MASK_CARDS, MASK_TELL, STRANGER_CHOICES, STRANGER_NAMES, TRUE_NAME, isMask } from './masks.js';
export type { StrangerChoice, StrangerName } from './masks.js';
export { CHOIR_CARDS, CHOIR_FINALE, CHOIR_TASKS, FLOOD_FACTOR, floodsAt, isFlooded } from './choir.js';
export { JOURNEY_STAGES, WORLDS, WORLD_IDS, journeyCards, worldOf } from './otherWorld.js';
export type { World, WorldCard, WorldId } from './otherWorld.js';
