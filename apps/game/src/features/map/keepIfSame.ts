/**
 * The previous value when the next one says the same thing (BRDC-PERF-002).
 *
 * A re-read from the store is always a fresh array, and a fresh array is a new identity
 * to every effect and memo downstream — including the map, which rebuilt every hex for it.
 * Use for small, plain data only: it compares by JSON.
 */
export function keepIfSame<T>(prev: T, next: T): T {
  return prev === next || JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
}
