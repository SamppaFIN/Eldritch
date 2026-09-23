/**
 * Clan records and the clan league (BRDC-CLAN-001, -002, -003).
 *
 * Split out of `index.ts` once BRDC-ATLAS-001's own endpoint pushed that file past its
 * 400-line ceiling — this is a self-contained concern (one KV prefix, one record shape)
 * that `index.ts`'s routes call into rather than own.
 */
import { clanMeasurables, demographicsOf } from '@es3/core/data';
import type { Demographics, Measurable, WorldSource } from '@es3/core/data';
import type { KV } from './index.js';

export const CLAN = 'clan:';

export interface ClanRecord {
  id: string;
  name: string;
  founderId: string;
  founderToken: string;
  createdAt: number;
  /** Absent on a clan created before BRDC-CLAN-003 — read as empty, never migrated. */
  kicked?: string[];
}

/** The clan, only if `founderToken` is the one it was created (or last verified) with. */
export async function verifiedClan(kv: KV, id: string, founderToken: string): Promise<ClanRecord | null> {
  const raw = await kv.get(CLAN + id);
  if (!raw) return null;
  const record = JSON.parse(raw) as ClanRecord;
  return record.founderToken === founderToken ? record : null;
}

/**
 * Every clan measured against every other (BRDC-CLAN-002). `clanMeasurables` only ever
 * sees a `WorldSource`, which carries a clan's code, never its name — resolved here,
 * one KV read per clan actually present, from the same `clan:<id>` record `verifiedClan`
 * reads.
 */
export async function clanCodexOf(kv: KV, live: WorldSource[], now: number): Promise<Demographics> {
  const measurables = clanMeasurables(live);
  const named: Measurable[] = await Promise.all(
    measurables.map(async (m) => {
      const raw = await kv.get(CLAN + m.id);
      const name = raw ? (JSON.parse(raw) as ClanRecord).name : m.id;
      return { ...m, name };
    }),
  );
  return demographicsOf(named, now);
}

/** No 0/O/1/I/L — a code someone reads aloud over a phone call, not a password. */
const CLAN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CLAN_ALPHABET[b % CLAN_ALPHABET.length]).join('');
}

/** A fresh, unused clan code. Collision odds are astronomically low at this alphabet
 *  size, but a hobby project's Worker is exactly the place a "surely never" bug turns
 *  up eventually — five tries and a clear failure beats an infinite loop. */
export async function newClanId(kv: KV): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = randomCode(6);
    if (!(await kv.get(CLAN + id))) return id;
  }
  return null;
}

/**
 * Every `/clan*` route (BRDC-CLAN-001, -003, -004), moved out of `index.ts`'s own fetch
 * handler once BRDC-SEASON-001's join routes pushed it back over 400 lines. `send`/`bare`
 * and the live-sources reader are passed in rather than imported, so this stays a plain
 * function `index.ts` calls into instead of a second copy of the Worker's plumbing.
 * `null` means none of these five routes matched this request.
 */
export async function handleClanRoute(
  request: Request,
  url: URL,
  kv: KV,
  send: (body: unknown, status?: number) => Response,
  bare: (status: number) => Response,
  liveSources: (kv: KV, now: number) => Promise<WorldSource[]>,
): Promise<Response | null> {
  if (request.method === 'POST' && url.pathname === '/clan') {
    const body = (await request.json().catch(() => null)) as
      | { name?: unknown; founderId?: unknown }
      | null;
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 40) : '';
    const founderId = typeof body?.founderId === 'string' ? body.founderId : '';
    if (!name || !founderId) return send({ fault: 'invalid' }, 400);

    const id = await newClanId(kv);
    if (!id) return send({ fault: 'unavailable' }, 503);

    const record: ClanRecord = { id, name, founderId, founderToken: crypto.randomUUID(), createdAt: Date.now() };
    await kv.put(CLAN + id, JSON.stringify(record));
    return send({ id: record.id, founderToken: record.founderToken });
  }

  if (request.method === 'GET' && url.pathname.endsWith('/roster')) {
    const id = url.pathname.slice('/clan/'.length, -'/roster'.length).toUpperCase();
    if (!id) return bare(404);
    // No need to check `clan:<id>` exists first — a clan with nobody currently
    // publishing under it and one with a typo'd id look identical: an empty roster.
    const live = await liveSources(kv, Date.now());
    const raw = await kv.get(CLAN + id);
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

    const record = await verifiedClan(kv, id, founderToken);
    if (!record) return send({ fault: 'forbidden' }, 403);

    record.name = name;
    await kv.put(CLAN + id, JSON.stringify(record));
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

    const record = await verifiedClan(kv, id, founderToken);
    if (!record) return send({ fault: 'forbidden' }, 403);

    const kicked = record.kicked ?? [];
    if (!kicked.includes(playerId)) kicked.push(playerId);
    record.kicked = kicked;
    await kv.put(CLAN + id, JSON.stringify(record));
    return send({ ok: true });
  }

  if (request.method === 'GET' && url.pathname.startsWith('/clan/')) {
    const id = url.pathname.slice('/clan/'.length).toUpperCase();
    const raw = id ? await kv.get(CLAN + id) : null;
    if (!raw) return bare(404);
    const record = JSON.parse(raw) as ClanRecord;
    // The join screen needs to know a code is real and its name — never the
    // founder's token, which the founder's own device already holds.
    return send({ id: record.id, name: record.name });
  }

  return null;
}
