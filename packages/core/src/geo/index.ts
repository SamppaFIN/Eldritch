export { EARTH_RADIUS_M, haversine, pathLength, toDeg, toRad } from './haversine.js';
export { msToKmh, speedMs } from './speed.js';
export { acceptPoint, filterTrail } from './filter.js';
export type { Accept, FilterOutcome } from './filter.js';
export { bearing, destination } from './project.js';
export { polygonAreaM2, signedAreaM2 } from './area.js';
export { detectLoop, detectLoops, maxLoopAreaM2 } from './loopDetection.js';
export type { Loop, LoopOptions, LoopRejection, LoopResult } from './loopDetection.js';
export {
  cellAreaM2,
  cellAt,
  neighboursOf,
  regionOf,
  ringToCells,
  totalAreaM2,
} from './cells.js';
