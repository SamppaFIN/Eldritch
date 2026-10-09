/**
 * Generates the playable routes into packages/core/src/sim/routes/ (BRDC-SIM-003).
 *
 * A route is a walk with things to do on the way: a GPX track at walking pace, a fix every
 * five seconds, and `<es3:do>` actions on the points where the walker stops — begin the
 * tale, choose, build, go to a place only the game can find today. The places come from
 * `QUEST_SITES`, so a site moved in the code moves the route the next time this runs.
 *
 * Run once and commit the output; the GPX is the route, not this script.
 *
 *   pnpm typecheck && node scripts/gen-routes.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { QUEST_SITES } from '../packages/core/dist/data/questSites.js';
import { bearing, destination } from '../packages/core/dist/geo/project.js';
import { haversine } from '../packages/core/dist/geo/haversine.js';
import { prng } from '../packages/core/dist/sim/walk.js';

const OUT = join(process.cwd(), 'packages/core/src/sim/routes');
mkdirSync(OUT, { recursive: true });

const PACE_MS = 1.4; // an unhurried walk
const FIX_MS = 5_000; // the filter's minimum interval
const STOP_FIXES = 4; // twenty seconds standing at a stop
const T0 = Date.UTC(2026, 9, 9, 9, 0, 0);

/**
 * Walk the legs at walking pace. `stops` are `[place, ...actions]`: the walker arrives,
 * acts on the first fix there, and stands a little before walking on.
 */
function route(stops, seed) {
  const noise = prng(seed);
  const jitter = (p) => destination(p, noise() * 360, noise() * 1.5);
  const points = [];
  let t = T0;
  const fix = (p, actions = []) => {
    points.push({ ...p, t, actions });
    t += FIX_MS;
  };
  let at = stops[0][0];
  for (const [place, ...actions] of stops) {
    const metres = haversine(at, place);
    const steps = Math.max(1, Math.round(metres / (PACE_MS * (FIX_MS / 1000))));
    const heading = bearing(at, place);
    for (let i = 1; i < steps && metres > 0; i += 1) fix(jitter(destination(at, heading, (metres * i) / steps)));
    fix(place, actions);
    for (let i = 0; i < STOP_FIXES; i += 1) fix(jitter(place));
    at = place;
  }
  return points;
}

function gpx(name, points) {
  const pt = (p) =>
    `<trkpt lat="${p.lat.toFixed(7)}" lon="${p.lng.toFixed(7)}"><time>${new Date(p.t).toISOString()}</time>` +
    (p.actions.length ? `<extensions>${p.actions.map((a) => `<es3:do>${a}</es3:do>`).join('')}</extensions>` : '') +
    `</trkpt>`;
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<gpx version="1.1" creator="scripts/gen-routes.mjs" xmlns="http://www.topografix.com/GPX/1/1" xmlns:es3="https://es3.game/route">\n` +
    `<trk><name>${name}</name><trkseg>\n${points.map(pt).join('\n')}\n</trkseg></trk>\n</gpx>\n`
  );
}

const S = QUEST_SITES;

/**
 * The Fuming Lake, start to end, with two Monuments and a Market raised on the way.
 *
 * The bridge takes the wisdom-stone way: hold the stone's hex and twenty wisdom (the grant
 * at the statue covers that). The stone is a secret that moves every week, so the route
 * cannot walk to it — `go wisdom` at the hermit asks the game where it lies today and
 * walks there and back.
 */
const fumingLake = route(
  [
    [S.statue, 'grant', 'build monument', 'adventure start fuming-lake', 'adventure choose 0'],
    [S.lake, 'adventure choose 0'],
    [S.hermit, 'adventure choose 0', 'go wisdom', 'build monument'],
    [S.troll, 'adventure choose 2'],
    // The Market last: it needs plain ground, and by the Deep the walk has claimed plenty.
    [S.deep, 'adventure choose 0', 'adventure choose 0', 'build market'],
  ],
  1009,
);

writeFileSync(join(OUT, 'fuming-lake.gpx'), gpx('The Fuming Lake, with building', fumingLake));
console.log(`fuming-lake.gpx: ${fumingLake.length} fixes, ${Math.round((fumingLake.at(-1).t - T0) / 60_000)} min`);
