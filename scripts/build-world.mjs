/**
 * Rebuilds the shared world from player submissions (BRDC-SHARE-001, BRDC-SHARE-002).
 *
 * Two directories under apps/game/public/world/:
 *   players/<id>.json   — one file per player, their latest submission. The database.
 *   <res6>.json         — the shards every client reads. Derived, rebuilt every run.
 *
 * The cron Action (.github/workflows/world.yml) collects `world:`-titled issues as
 * `[{ number, body, createdAt }]` on stdin, oldest first. All parsing and bucketing is
 * @es3/core's — this file is filesystem and nothing else.
 *
 *   node scripts/build-world.mjs < issues.json
 *   node scripts/build-world.mjs --help
 *
 * Requires `pnpm typecheck` (tsc -b) first — it imports the built output.
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildPlayerFile,
  buildShards,
  encodePlayerFile,
  encodeWorld,
  mergePlayerFiles,
  parsePlayerFile,
  parseSubmission,
} from '../packages/core/dist/data/world.js';
import { WORLD_PLAYER_TTL_MS } from '../packages/core/dist/rules/constants.js';

const OUT = join(process.cwd(), 'apps/game/public/world');
const PLAYERS = join(OUT, 'players');

if (process.argv.includes('--help')) {
  console.log('node scripts/build-world.mjs < issues.json');
  console.log('  stdin: a JSON array of { number, body, createdAt }, oldest first');
  console.log('  out:   apps/game/public/world/players/<id>.json and world/<res6>.json');
  process.exit(0);
}

/** Every player's latest file, keyed by id. Existing files first, then this run's issues. */
const files = new Map();
mkdirSync(PLAYERS, { recursive: true });
for (const name of readdirSync(PLAYERS)) {
  if (!name.endsWith('.json')) continue;
  const parsed = parsePlayerFile(readFileSync(join(PLAYERS, name), 'utf8'));
  if (parsed.ok) files.set(parsed.file.source.id, parsed.file);
}

const input = readFileSync(0, 'utf8').trim();
const issues = input ? JSON.parse(input) : [];
if (!Array.isArray(issues)) {
  console.error('expected a JSON array of { number, body, createdAt } on stdin');
  process.exit(1);
}

const rejected = [];
let fresh = 0;
for (const issue of issues) {
  const parsed = parseSubmission(typeof issue?.body === 'string' ? issue.body : '');
  if (!parsed.ok) {
    rejected.push(parsed.fault);
    continue;
  }
  const at = Number.isFinite(Date.parse(issue?.createdAt)) ? Date.parse(issue.createdAt) : Date.now();
  files.set(parsed.source.id, buildPlayerFile(parsed.source, at));
  fresh += 1;
}

for (const file of files.values()) {
  writeFileSync(join(PLAYERS, `${file.source.id}.json`), encodePlayerFile(file));
}

const now = Date.now();
const shards = buildShards(mergePlayerFiles([...files.values()], now, WORLD_PLAYER_TTL_MS), now);
const live = new Set([...shards.keys()].map((region) => `${region}.json`));
for (const name of readdirSync(OUT)) {
  if (name.endsWith('.json') && !live.has(name)) rmSync(join(OUT, name));
}
for (const [region, shard] of shards) {
  writeFileSync(join(OUT, `${region}.json`), encodeWorld(shard));
}

console.log(`${files.size} players (${fresh} new this run) -> ${shards.size} shards`);
if (rejected.length > 0) console.log(`rejected ${rejected.length}: ${rejected.join(', ')}`);
