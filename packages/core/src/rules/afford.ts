/**
 * "When can I afford it" (BRDC-STATS-001).
 *
 * A forecast is only a decision aid if it answers the question a player actually asks:
 * how long until the next building, the next rite. Pure — takes the pouch, the per-hour
 * rate (`forecastRates`), and a cost, and returns milliseconds, or `null` when a resource
 * the cost needs is not being produced at all and there is not enough of it.
 */
import type { ResourceKind, ResourcePool } from './terrain.js';

const HOUR = 3_600_000;

export function timeToAfford(
  pool: ResourcePool,
  perHour: Partial<ResourcePool>,
  cost: Partial<ResourcePool>,
): number | null {
  let ms = 0;
  for (const [k, need] of Object.entries(cost) as [ResourceKind, number][]) {
    const short = need - (pool[k] ?? 0);
    if (short <= 0) continue;
    const rate = perHour[k] ?? 0;
    if (rate <= 0) return null;
    ms = Math.max(ms, Math.ceil(short / rate) * HOUR);
  }
  return ms;
}
