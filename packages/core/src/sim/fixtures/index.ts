/**
 * Frozen GPS traces. These are data, not code — regenerating them is a deliberate act
 * (`node scripts/gen-fixtures.mjs`), so a change to the simulator can never silently
 * move what loop detection is tested against.
 *
 * The five cases are the truth table for BRDC-CLAIM-001:
 *
 *   square          closes once
 *   figure-eight    closes twice, two separate areas
 *   open-line       never closes
 *   back-and-forth  never closes — encloses no area
 *   gps-noise       closes, despite 12 m scatter
 */
import type { TrailPoint } from '../../types/domain.js';
import square from './square.json';
import figureEight from './figure-eight.json';
import openLine from './open-line.json';
import backAndForth from './back-and-forth.json';
import gpsNoise from './gps-noise.json';

export interface Fixture {
  name: string;
  note: string;
  points: TrailPoint[];
}

export const FIXTURES = {
  square,
  'figure-eight': figureEight,
  'open-line': openLine,
  'back-and-forth': backAndForth,
  'gps-noise': gpsNoise,
} as const satisfies Record<string, Fixture>;

export type FixtureName = keyof typeof FIXTURES;

export function fixture(name: FixtureName): Fixture {
  return FIXTURES[name];
}

export const FIXTURE_NAMES = Object.keys(FIXTURES) as FixtureName[];
