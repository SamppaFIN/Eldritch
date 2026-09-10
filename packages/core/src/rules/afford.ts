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

/**
 * What the pouch is short of, per resource — the shape a "you cannot do this yet" line is
 * written from (BRDC-UI-002). Empty when it can be paid for.
 *
 * Pure and separate from `canAfford`, which answers yes or no. A disabled button that does
 * not say *what* it is waiting for is indistinguishable from a broken one, and on a
 * touchscreen there is no hover to explain it either.
 */
export function shortOf(
  pool: ResourcePool | null,
  cost: Partial<ResourcePool>,
): Partial<ResourcePool> {
  const out: Partial<ResourcePool> = {};
  for (const [k, need] of Object.entries(cost) as [ResourceKind, number][]) {
    // A pouch that has not been read yet is short of everything the cost names: saying
    // "you need 120 stone" while the number is still loading is better than a grey button.
    const short = need - (pool?.[k] ?? 0);
    if (short > 0) out[k] = short;
  }
  return out;
}
