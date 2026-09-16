/**
 * The shared world, without a form to fill in (BRDC-SHARE-003).
 *
 * `BRDC-SHARE-002` published a realm by opening a prefilled GitHub issue — it worked and
 * it felt like paperwork. This is the same contract over one Cloudflare Worker:
 *
 *   POST /submit        a sealed `WorldSubmission`; kept as this player's latest
 *   GET  /world/<res6>  the shard for one region, rebuilt on every submit
 *   GET  /demographics  the Codex of Dominion, every realm measured (BRDC-CODEX-001)
 *
 * No key on the client and no account for the player. The Worker trusts `id` + checksum
 * exactly as far as the issue path did: it can tell a torn message from a whole one, and
 * it cannot tell a liar from an honest player. Real authority arrives with Phase 5.
 *
 * Reads are the hot path, so shards are built when someone *writes* and served from a
 * single KV read. Writes are rare — one player, now and then.
 *
 * BRDC-HALL-002 adds one more, unrelated to the shared world: `POST /kingdom-story`
 * writes the one chronicle a retired kingdom gets, using an AI key that must live here
 * and never on the client. It is the sole exception to claude.md §6.9's "no keys yet" —
 * noted there directly, not just here.
 */
import { buildShards, demographicsOf, mergePlayerFiles, parseSubmission } from '@es3/core/data';
import type { PlayerFile } from '@es3/core/data';
import { WORLD_PLAYER_TTL_MS } from '@es3/core/rules';

/** The slice of Workers KV this uses — declared here so the Worker needs no extra types. */
interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
}

export interface Env {
  WORLD: KV;
  /** Set with `wrangler secret put AI_API_KEY` (BRDC-HALL-002). Absent means the feature
   *  is simply off — the client already has its own local chronicle for that case. */
  AI_API_KEY?: string;
}

const PLAYER = 'player:';
const SHARD = 'shard:';
/**
 * One key for the whole Codex. `rebuild` already walks every player file, so measuring
 * them costs one more pass over data that is already in memory — and it means the client
 * asks one question instead of one per region it happens to be looking at.
 */
const CODEX = 'codex';
/** One submission a minute per player. KV's own floor for an expiry is 60 s. */
const COOLDOWN_S = 60;

const CORS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const send = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS, ...extra },
  });

const bare = (status: number) => new Response(null, { status, headers: CORS });

/** Every player's latest file, torn rows skipped rather than failing the whole rebuild. */
async function allFiles(kv: KV): Promise<PlayerFile[]> {
  const { keys } = await kv.list({ prefix: PLAYER });
  const files: PlayerFile[] = [];
  for (const key of keys) {
    const raw = await kv.get(key.name);
    if (!raw) continue;
    try {
      const file = JSON.parse(raw) as PlayerFile;
      if (file?.source?.id && typeof file.submittedAt === 'number') files.push(file);
    } catch {
      /* a row that will not parse is one player missing, not a broken world */
    }
  }
  return files;
}

/** Rebuild every region's shard from the players still inside the TTL. */
async function rebuild(kv: KV, now: number): Promise<number> {
  const live = mergePlayerFiles(await allFiles(kv), now, WORLD_PLAYER_TTL_MS);
  await kv.put(CODEX, JSON.stringify(demographicsOf(live, now)));
  const shards = buildShards(live, now);
  const kept = new Set<string>();
  for (const [region, shard] of shards) {
    kept.add(SHARD + region);
    await kv.put(SHARD + region, JSON.stringify(shard));
  }
  const { keys } = await kv.list({ prefix: SHARD });
  for (const key of keys) if (!kept.has(key.name)) await kv.delete(key.name);
  return shards.size;
}

/** The numbers a chronicle is written from — the parts of `HallOfFameEntry` worth prose. */
interface KingdomFacts {
  name: unknown;
  level: unknown;
  areaM2: unknown;
  population: unknown;
  provinces: unknown;
  achievements: unknown;
  wonders: unknown;
  secretSites: unknown;
  cipherShards: unknown;
}

function isKingdomFacts(v: unknown): v is KingdomFacts {
  const f = v as Partial<KingdomFacts> | null;
  return (
    !!f &&
    typeof f.name === 'string' &&
    typeof f.level === 'number' &&
    typeof f.areaM2 === 'number' &&
    typeof f.population === 'number'
  );
}

function chroniclePrompt(f: KingdomFacts): string {
  return (
    `Write a short (120-180 word) in-universe chronicle of a fallen kingdom in a ` +
    `Lovecraftian cosmic-horror territory game, as if it were a passage from a historical ` +
    `record. Tone: cosmic void, sacred geometry, awe rather than gore. Do not invent ` +
    `named characters, battles or enemies not implied below — work only from these facts. ` +
    `No title, no preamble, just the passage.\n\n` +
    `Kingdom: ${f.name}\nConsciousness level reached: ${f.level}\n` +
    `Ground held: ${f.areaM2} square metres across ${f.provinces} provinces\n` +
    `Population: ${f.population}\nAchievements earned: ${f.achievements}\n` +
    `Wonders found: ${f.wonders}\nSecret sites found: ${f.secretSites}\n` +
    `Cipher shards gathered: ${f.cipherShards}`
  );
}

/** One call to Claude Haiku — cheap and fast, right-sized for a paragraph of flavour text. */
async function craftChronicle(env: Env, facts: KingdomFacts): Promise<string | null> {
  if (!env.AI_API_KEY) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.AI_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: chroniclePrompt(facts) }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((b) => b.type === 'text')?.text;
    return text && text.trim().length > 0 ? text.trim() : null;
  } catch {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return bare(204);
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/submit') {
      const parsed = parseSubmission(await request.text());
      if (!parsed.ok) return send({ fault: parsed.fault }, 400);

      const id = parsed.source.id;
      if (await env.WORLD.get(`rl:${id}`)) return send({ fault: 'too-soon' }, 429);

      const file: PlayerFile = { source: parsed.source, submittedAt: Date.now() };
      await env.WORLD.put(PLAYER + id, JSON.stringify(file));
      await env.WORLD.put(`rl:${id}`, '1', { expirationTtl: COOLDOWN_S });
      const regions = await rebuild(env.WORLD, Date.now());
      return send({ ok: true, cells: parsed.source.cells.length, regions });
    }

    if (request.method === 'GET' && url.pathname.startsWith('/world/')) {
      const region = url.pathname.slice('/world/'.length);
      const shard = region ? await env.WORLD.get(SHARD + region) : null;
      if (!shard) return bare(204);
      return new Response(shard, {
        headers: { 'content-type': 'application/json', ...CORS, 'cache-control': 'public, max-age=30' },
      });
    }

    /*
     * Served from a single KV read like the shards — with one exception. A Worker that has
     * just been deployed has players in KV but no table yet, and making the player publish
     * again to see a screen they already earned is a bad first impression of a feature
     * whose whole job is telling them where they stand. So a missing key is built here,
     * once, from files that are already stored. After that it is written on submit.
     */
    if (request.method === 'GET' && url.pathname === '/demographics') {
      let codex = await env.WORLD.get(CODEX);
      if (!codex) {
        const now = Date.now();
        const live = mergePlayerFiles(await allFiles(env.WORLD), now, WORLD_PLAYER_TTL_MS);
        if (live.length === 0) return bare(204);
        codex = JSON.stringify(demographicsOf(live, now));
        await env.WORLD.put(CODEX, codex);
      }
      return new Response(codex, {
        headers: { 'content-type': 'application/json', ...CORS, 'cache-control': 'public, max-age=30' },
      });
    }

    if (request.method === 'POST' && url.pathname === '/kingdom-story') {
      const facts = await request.json().catch(() => null);
      if (!isKingdomFacts(facts)) return send({ fault: 'invalid' }, 400);

      // One story a minute per caller — the reward is rare by nature (a kingdom retires
      // once), so this only guards the key's budget against a script, not a real player.
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
      if (await env.WORLD.get(`story-rl:${ip}`)) return send({ fault: 'too-soon' }, 429);
      await env.WORLD.put(`story-rl:${ip}`, '1', { expirationTtl: COOLDOWN_S });

      const story = await craftChronicle(env, facts);
      if (!story) return send({ fault: 'unavailable' }, 503);
      return send({ story });
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return send({
        world: 'eldritch',
        endpoints: [
          'POST /submit',
          'GET /world/<res6>',
          'GET /demographics',
          'POST /kingdom-story',
        ],
      });
    }

    return bare(404);
  },
};
