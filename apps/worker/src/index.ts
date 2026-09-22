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
 *
 * BRDC-CLAN-001 adds `POST /clan` (create) and `GET /clan/<id>` (look up before joining).
 * Same honesty as everything else here: a clan's `founderToken` is a bearer secret, not
 * a password behind an account — whoever holds it can act as the founder, exactly as
 * whoever holds a player `id` can already publish as that player.
 *
 * BRDC-CLAN-004 adds `GET /clan/<id>/roster` — every live member's id, name and Keep, so
 * a client can pull in a clanmate's ground regardless of where the camera is pointed
 * (`useWorld.ts`'s own fetch is otherwise strictly viewport-driven).
 *
 * BRDC-CLAN-003 adds `POST /clan/<id>/rename` and `POST /clan/<id>/kick`, both gated on
 * the founder's own `founderToken` — a bearer secret, not a password behind an account,
 * exactly as trusted as everything else here. A kicked player is never edited out of
 * their own file; `clan:<id>.kicked` overrides their own claim wherever the clan is
 * read (the roster, `/submit`'s response), which is what "kicked" has to mean when
 * nobody's own data can be altered by anyone else.
 *
 * BRDC-CLAN-002 adds `GET /clan-codex` — every clan measured against every other, the
 * same `demographicsOf` the player Codex already uses, fed one synthetic realm per
 * clan instead of one per player (`clanMeasurables`, `@es3/core/data`).
 *
 * BRDC-ATLAS-001 adds `GET /atlas` — one row per res-5 municipality with any player's
 * ground in it, naming whoever holds the most of it (`atlasOf`, `@es3/core/data`). The
 * country-wide view a phone can actually load: a few hundred rows, not 157M res-11 cells.
 */
import { atlasOf, buildShards, demographicsOf, mergePlayerFiles, parseSubmission } from '@es3/core/data';
import type { PlayerFile, WorldSource } from '@es3/core/data';
import { isOwnershipCell } from '@es3/core/geo';
import { WORLD_PLAYER_TTL_MS } from '@es3/core/rules';
import { craftChronicle, isKingdomFacts } from './chronicle.js';
import { CLAN, type ClanRecord, clanCodexOf, newClanId, verifiedClan } from './clan.js';

/** The slice of Workers KV this uses — declared here so the Worker needs no extra types. */
export interface KV {
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
/** Same shape, one row per clan instead of per player (BRDC-CLAN-002). */
const CLAN_CODEX = 'clan-codex';
/** The country-wide view, one row per res-5 municipality (BRDC-ATLAS-001). */
const ATLAS = 'atlas';
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

/** A source's cells and Keep are all real resolution-11 h3 cells. */
function sourceIsValid(s: WorldSource): boolean {
  return s.cells.every((c) => isOwnershipCell(c.h3)) && (s.castle == null || isOwnershipCell(s.castle));
}

/**
 * Every player still inside the TTL, malformed rows dropped (BRDC-SHARE-004).
 *
 * `parseSubmission` refuses a bad cell at the door now, but a row written before that
 * fix (or restored from an older backup) could still be sitting in KV — every h3-js
 * call downstream throws on one, so this is the one place that has to check again
 * before any of `demographicsOf`/`clanCodexOf`/`atlasOf`/`buildShards` sees the data.
 */
async function liveSources(kv: KV, now: number): Promise<WorldSource[]> {
  const live = mergePlayerFiles(await allFiles(kv), now, WORLD_PLAYER_TTL_MS);
  return live.filter(sourceIsValid);
}

/** Rebuild every region's shard from the players still inside the TTL. */
async function rebuild(kv: KV, now: number): Promise<number> {
  const live = await liveSources(kv, now);
  await kv.put(CODEX, JSON.stringify(demographicsOf(live, now)));
  await kv.put(CLAN_CODEX, JSON.stringify(await clanCodexOf(kv, live, now)));
  await kv.put(ATLAS, JSON.stringify({ v: 1, generatedAt: now, regions: atlasOf(live) }));
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

      // A clan's founder can remove a member (BRDC-CLAN-003) but never edit their file —
      // this is where a kicked player's own next publish is told so, honestly, every time.
      let kicked = false;
      if (parsed.source.clanId) {
        const raw = await env.WORLD.get(CLAN + parsed.source.clanId);
        if (raw) kicked = ((JSON.parse(raw) as ClanRecord).kicked ?? []).includes(id);
      }
      return send({
        ok: true,
        cells: parsed.source.cells.length,
        regions,
        ...(kicked ? { kicked: true } : {}),
      });
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
        const live = await liveSources(env.WORLD, now);
        if (live.length === 0) return bare(204);
        codex = JSON.stringify(demographicsOf(live, now));
        await env.WORLD.put(CODEX, codex);
      }
      return new Response(codex, {
        headers: { 'content-type': 'application/json', ...CORS, 'cache-control': 'public, max-age=30' },
      });
    }

    // Same cold-start rescue as `/demographics` above, same reason.
    if (request.method === 'GET' && url.pathname === '/clan-codex') {
      let codex = await env.WORLD.get(CLAN_CODEX);
      if (!codex) {
        const now = Date.now();
        const live = await liveSources(env.WORLD, now);
        const table = await clanCodexOf(env.WORLD, live, now);
        if (table.players === 0) return bare(204);
        codex = JSON.stringify(table);
        await env.WORLD.put(CLAN_CODEX, codex);
      }
      return new Response(codex, {
        headers: { 'content-type': 'application/json', ...CORS, 'cache-control': 'public, max-age=30' },
      });
    }

    // Same cold-start rescue as `/demographics` and `/clan-codex` above, same reason.
    if (request.method === 'GET' && url.pathname === '/atlas') {
      let atlas = await env.WORLD.get(ATLAS);
      if (!atlas) {
        const now = Date.now();
        const live = await liveSources(env.WORLD, now);
        const regions = atlasOf(live);
        if (regions.length === 0) return bare(204);
        atlas = JSON.stringify({ v: 1, generatedAt: now, regions });
        await env.WORLD.put(ATLAS, atlas);
      }
      return new Response(atlas, {
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

    if (request.method === 'POST' && url.pathname === '/clan') {
      const body = (await request.json().catch(() => null)) as
        | { name?: unknown; founderId?: unknown }
        | null;
      const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 40) : '';
      const founderId = typeof body?.founderId === 'string' ? body.founderId : '';
      if (!name || !founderId) return send({ fault: 'invalid' }, 400);

      const id = await newClanId(env.WORLD);
      if (!id) return send({ fault: 'unavailable' }, 503);

      const record: ClanRecord = {
        id,
        name,
        founderId,
        founderToken: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      await env.WORLD.put(CLAN + id, JSON.stringify(record));
      return send({ id: record.id, founderToken: record.founderToken });
    }

    if (request.method === 'GET' && url.pathname.endsWith('/roster')) {
      const id = url.pathname.slice('/clan/'.length, -'/roster'.length).toUpperCase();
      if (!id) return bare(404);
      // No need to check `clan:<id>` exists first — a clan with nobody currently
      // publishing under it and one with a typo'd id look identical: an empty roster.
      const live = await liveSources(env.WORLD, Date.now());
      const raw = await env.WORLD.get(CLAN + id);
      const kicked = raw ? ((JSON.parse(raw) as ClanRecord).kicked ?? []) : [];
      const members = live
        .filter((p) => p.clanId === id && !kicked.includes(p.id))
        .map((p) => ({ id: p.id, name: p.nation ?? p.name, castle: p.castle }));
      return send({ members });
    }

    if (request.method === 'POST' && url.pathname.endsWith('/rename')) {
      const id = url.pathname.slice('/clan/'.length, -'/rename'.length).toUpperCase();
      const body = (await request.json().catch(() => null)) as
        | { founderToken?: unknown; name?: unknown }
        | null;
      const founderToken = typeof body?.founderToken === 'string' ? body.founderToken : '';
      const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 40) : '';
      if (!id || !founderToken || !name) return send({ fault: 'invalid' }, 400);

      const record = await verifiedClan(env.WORLD, id, founderToken);
      if (!record) return send({ fault: 'forbidden' }, 403);

      record.name = name;
      await env.WORLD.put(CLAN + id, JSON.stringify(record));
      return send({ ok: true });
    }

    if (request.method === 'POST' && url.pathname.endsWith('/kick')) {
      const id = url.pathname.slice('/clan/'.length, -'/kick'.length).toUpperCase();
      const body = (await request.json().catch(() => null)) as
        | { founderToken?: unknown; playerId?: unknown }
        | null;
      const founderToken = typeof body?.founderToken === 'string' ? body.founderToken : '';
      const playerId = typeof body?.playerId === 'string' ? body.playerId : '';
      if (!id || !founderToken || !playerId) return send({ fault: 'invalid' }, 400);

      const record = await verifiedClan(env.WORLD, id, founderToken);
      if (!record) return send({ fault: 'forbidden' }, 403);

      const kicked = record.kicked ?? [];
      if (!kicked.includes(playerId)) kicked.push(playerId);
      record.kicked = kicked;
      await env.WORLD.put(CLAN + id, JSON.stringify(record));
      return send({ ok: true });
    }

    if (request.method === 'GET' && url.pathname.startsWith('/clan/')) {
      const id = url.pathname.slice('/clan/'.length).toUpperCase();
      const raw = id ? await env.WORLD.get(CLAN + id) : null;
      if (!raw) return bare(404);
      const record = JSON.parse(raw) as ClanRecord;
      // The join screen needs to know a code is real and its name — never the
      // founder's token, which the founder's own device already holds.
      return send({ id: record.id, name: record.name });
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return send({
        world: 'eldritch',
        endpoints: [
          'POST /submit',
          'GET /world/<res6>',
          'GET /demographics',
          'GET /clan-codex',
          'GET /atlas',
          'POST /kingdom-story',
          'POST /clan',
          'GET /clan/<id>',
          'GET /clan/<id>/roster',
          'POST /clan/<id>/rename',
          'POST /clan/<id>/kick',
        ],
      });
    }

    return bare(404);
  },
};
