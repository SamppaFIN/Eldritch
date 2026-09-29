/**
 * The season's boards (BRDC-SEASON-005).
 *
 *   POST /season/legacy   a realm's Legacy and counts {realm, name, legacy, counts} — taken
 *                         at most once an hour per realm: the board is "live with a 1 h
 *                         delay so nobody hunts the leader" (Eldritch-season.pdf)
 *   GET  /season/boards   ?n=<season> — the Legacy board and the Hall of Records
 *   GET  /season/ages     the Hall of Ages: best three seasons, summed
 *
 * Same trust as `/submit`: no account; the rate limit is the guard.
 */
import { hallOfAges, hallOfRecords, legacyBoard } from '@es3/core/rules';
import type { BoardRow, Season } from '@es3/core/rules';
import type { KV } from './index.js';

const BOARD = 'season:legacy:';

async function board(kv: KV, n: number): Promise<BoardRow[]> {
  const raw = await kv.get(BOARD + n);
  return raw ? Object.values(JSON.parse(raw) as Record<string, BoardRow>) : [];
}

export async function handleBoards(
  request: Request,
  url: URL,
  kv: KV,
  season: Season | null,
  send: (body: unknown, status?: number) => Response,
): Promise<Response | null> {
  if (request.method === 'POST' && url.pathname === '/season/legacy') {
    const b = (await request.json().catch(() => null)) as Partial<BoardRow> | null;
    if (!season) return send({ fault: 'no-season' }, 409);
    if (!b || typeof b.realm !== 'string' || typeof b.name !== 'string' || typeof b.legacy !== 'number' || !b.counts) {
      return send({ fault: 'invalid' }, 400);
    }
    const realm = b.realm.slice(0, 80);
    if (await kv.get(`legacy-rl:${realm}`)) return send({ ok: true, held: true });
    await kv.put(`legacy-rl:${realm}`, '1', { expirationTtl: 3_600 });
    const all = JSON.parse((await kv.get(BOARD + season.n)) ?? '{}') as Record<string, BoardRow>;
    all[realm] = { realm, name: b.name.slice(0, 60), legacy: Math.max(0, Math.floor(b.legacy)), counts: b.counts };
    await kv.put(BOARD + season.n, JSON.stringify(all));
    return send({ ok: true });
  }

  if (request.method === 'GET' && url.pathname === '/season/boards') {
    const n = Number(url.searchParams.get('n') ?? season?.n ?? 0);
    const rows = await board(kv, n);
    return send({ n, board: legacyBoard(rows), records: hallOfRecords(rows) });
  }

  if (request.method === 'GET' && url.pathname === '/season/ages') {
    const { keys } = await kv.list({ prefix: BOARD });
    const seasons = await Promise.all(keys.map((k) => board(kv, Number(k.name.slice(BOARD.length)))));
    return send({ ages: hallOfAges(seasons) });
  }
  return null;
}
