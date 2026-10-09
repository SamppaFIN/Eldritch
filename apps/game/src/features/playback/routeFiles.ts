/**
 * The built-in routes (BRDC-SIM-002, -003): the frozen shapes, and the tales played
 * through. Each is its own chunk, fetched when picked, and none of them exists in a
 * player's build — the condition is a literal, so the bundler drops the imports.
 */
import type { Fixture, FixtureName } from '@es3/core/sim';

const DEV = import.meta.env.DEV || import.meta.env.MODE === 'e2e';

/** Shapes, moved to start where you stand. */
export const FIXTURE_FILES: Record<FixtureName, () => Promise<{ default: Fixture }>> = !DEV
  ? ({} as Record<FixtureName, () => Promise<{ default: Fixture }>>)
  : {
      square: () => import('@es3/core/sim/fixtures/square.json'),
      'figure-eight': () => import('@es3/core/sim/fixtures/figure-eight.json'),
      'open-line': () => import('@es3/core/sim/fixtures/open-line.json'),
      'back-and-forth': () => import('@es3/core/sim/fixtures/back-and-forth.json'),
      'gps-noise': () => import('@es3/core/sim/fixtures/gps-noise.json'),
    };

/** Tales played through, actions and all — at their own places, since a tale's sites do
 *  not move with you. Raw GPX, so the file is the route (`scripts/gen-routes.mjs`). */
export const TALE_FILES: Record<string, () => Promise<{ default: string }>> = !DEV
  ? {}
  : { 'fuming-lake': () => import('@es3/core/sim/routes/fuming-lake.gpx?raw') };

export const ROUTE_NAMES: string[] = [...Object.keys(FIXTURE_FILES), ...Object.keys(TALE_FILES)];
