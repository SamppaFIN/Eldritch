/**
 * Generates the loop-detection fixtures into packages/core/src/sim/fixtures/.
 *
 * Run once and commit the output. The JSON is the fixture, not this script: frozen
 * traces mean a change to the simulator can never quietly move the goalposts under
 * loop detection (BRDC-CLAIM-001).
 *
 *   pnpm typecheck && node scripts/gen-fixtures.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { simulatePolygon, simulateWalk } from '../packages/core/dist/sim/walk.js';
import { destination } from '../packages/core/dist/geo/project.js';

const OUT = join(process.cwd(), 'packages/core/src/sim/fixtures');
mkdirSync(OUT, { recursive: true });

/** Statue of the Boy, Tampere — the start of v2's Fuming Lake quest. */
const ORIGIN = { lat: 61.47290805294704, lng: 23.725882485862012 };

/** Axis-aligned square of `side` metres with its south-west corner at `sw`. */
function square(sw, side) {
  const ne = destination(destination(sw, 0, side), 90, side);
  return [sw, { lat: sw.lat, lng: ne.lng }, ne, { lat: ne.lat, lng: sw.lng }];
}

const fixtures = {
  /** An ordinary city block. Must close. */
  square: {
    note: 'A 120 m city block walked once. The baseline positive case.',
    points: simulatePolygon(square(ORIGIN, 120), { seed: 101, noiseM: 3 }),
  },

  /** Two blocks sharing a corner. Must close twice, as two separate areas. */
  'figure-eight': {
    note: 'Two 100 m blocks sharing one corner. Should close twice.',
    points: (() => {
      const first = square(ORIGIN, 100);
      const shared = first[2];
      const second = square(shared, 100);
      const a = simulatePolygon(first, { seed: 202, noiseM: 3 });
      const lastT = a[a.length - 1].t;
      const b = simulatePolygon(second, { seed: 203, noiseM: 3, startTime: lastT + 5_000 });
      return [...a, ...b];
    })(),
  },

  /** A walk to somewhere, not around something. Must never close. */
  'open-line': {
    note: 'A 500 m straight walk. Must never close.',
    points: simulateWalk({
      start: ORIGIN,
      pattern: 'straight',
      headingDeg: 45,
      durationMs: 360_000,
      seed: 303,
      noiseM: 3,
    }),
  },

  /**
   * The fixture that matters most.
   *
   * A naive "is this point near an earlier one" check fires the moment the walker
   * turns round, and would hand out territory for walking to the end of the street
   * and back. The enclosed area is what actually distinguishes this from a loop.
   */
  'back-and-forth': {
    note: 'Out 200 m and back along the same street. Encloses no area — must not close.',
    points: (() => {
      const far = destination(ORIGIN, 30, 200);
      const out = simulatePolygon([ORIGIN, far], { seed: 404, noiseM: 2 });
      // simulatePolygon returns to its first vertex, which is exactly the there-and-back
      // shape we want: a degenerate polygon of zero area.
      return out;
    })(),
  },

  /** The same block, but the sky is bad. Must still close. */
  'gps-noise': {
    note: 'The 120 m block under heavy multipath — 12 m noise, 35 m reported accuracy.',
    points: simulatePolygon(square(ORIGIN, 120), { seed: 505, noiseM: 12, accuracyM: 35 }),
  },
};

const round = (p) => ({
  lat: Number(p.lat.toFixed(7)),
  lng: Number(p.lng.toFixed(7)),
  t: p.t,
  accuracy: p.accuracy,
});

for (const [name, { note, points }] of Object.entries(fixtures)) {
  const body = { name, note, generatedBy: 'scripts/gen-fixtures.mjs', points: points.map(round) };
  writeFileSync(join(OUT, `${name}.json`), `${JSON.stringify(body, null, 1)}\n`);
  console.log(`${name.padEnd(16)} ${String(points.length).padStart(4)} points`);
}
