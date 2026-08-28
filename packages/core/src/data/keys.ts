/**
 * Every key the store holds, in one place.
 *
 * Lifted out of MockRepository once the pouch and the Hearth became their own modules:
 * two files inventing key strings for the same records is how a save quietly grows a
 * second, divergent copy of itself.
 */
import type { RunId } from '../types/index.js';

export const K = {
  profile: 'profile',
  activeRun: 'run:active',
  seeded: 'seeded',
  run: (id: RunId) => `run:${id}`,
  trail: (id: RunId) => `trail:${id}`,
  cell: (h3: string) => `cell:${h3}`,
  dwell: 'dwell',
  home: 'home',
  lastReading: 'reading:last',
} as const;
