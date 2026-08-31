/**
 * Merges player submissions into apps/game/public/world/<res6>.json (BRDC-SHARE-001).
 *
 * The cron Action (.github/workflows/world.yml) collects `world-submission` issue bodies
 * into a JSON array of strings and pipes it in on stdin. All validation and bucketing is
 * @es3/core's `parseSubmission` + `buildShards` — this file is filesystem and nothing
 * else, so the rules it enforces are the same ones the game and its tests use.
 *
 *   node scripts/build-world.mjs < submissions.json
 *   node scripts/build-world.mjs --help
 *
 * Requires `pnpm --filter @es3/core build` first — it imports the built output, the way
 * scripts/gen-fixtures.mjs does.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildShards, encodeWorld, parseSubmission } from '../packages/core/dist/data/world.js';

const OUT = join(process.cwd(), 'apps/game/public/world');

if (process.argv.includes('--help')) {
  console.log('node scripts/build-world.mjs < submissions.json');
  console.log('  stdin: a JSON array of GitHub issue-body strings, oldest first');
  console.log('  out:   apps/game/public/world/<res6>.json, one per populated region');
  process.exit(0);
}

const input = readFileSync(0, 'utf8').trim();
const bodies = input ? JSON.parse(input) : [];
if (!Array.isArray(bodies)) {
  console.error('expected a JSON array of submission strings on stdin');
  process.exit(1);
}

const rejected = [];
/** Last submission per player wins — the Action passes them oldest-first. */
const latest = new Map();
for (const body of bodies) {
  const parsed = parseSubmission(typeof body === 'string' ? body : JSON.stringify(body));
  if (parsed.ok) latest.set(parsed.source.id, parsed.source);
  else rejected.push(parsed.fault);
}

const shards = buildShards([...latest.values()], Date.now());
mkdirSync(OUT, { recursive: true });
for (const [region, shard] of shards) {
  writeFileSync(join(OUT, `${region}.json`), encodeWorld(shard));
}

console.log(`${latest.size} players → ${shards.size} shards in apps/game/public/world/`);
if (rejected.length > 0) console.log(`rejected ${rejected.length}: ${rejected.join(', ')}`);
