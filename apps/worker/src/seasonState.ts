/**
 * The one shared season (BRDC-SEASON-002).
 *
 *   GET  /season         the current `Season`, advanced to now; 204 before any is opened
 *   POST /season/open    admin: open season n {n, name, seed, reckoningByDay?}
 *   POST /season/phase   admin: force a phase {phase} — the season's length is Infinite's
 *                        call (*"season kestää kunnes saadaan uusi versio tulille"*)
 *
 * Admin routes need `x-admin-key` to match the `ADMIN_KEY` Worker secret; with no secret
 * set they are simply off. The key never reaches the game client — Infinite uses curl.
 * Separate from `season.ts`, which is SEASON-001's daily tournament trail.
 */
import { advanceSeason, forcePhase, openSeason } from '@es3/core/rules';
import type { Season, SeasonPhase } from '@es3/core/rules';
import type { WorldSource } from '@es3/core/data';
import type { KV } from './index.js';

const STATE = 'season:state';
const PHASES: readonly SeasonPhase[] = ['open', 'reckoning', 'sealed', 'interregnum', 'next'];

async function readSeason(kv: KV): Promise<Season | null> {
  const raw = await kv.get(STATE);
  return raw ? (JSON.parse(raw) as Season) : null;
}

export async function handleSeasonState(
  request: Request,
  url: URL,
  kv: KV,
  adminKey: string | undefined,
  send: (body: unknown, status?: number) => Response,
  bare: (status: number) => Response,
  liveSources: (kv: KV, now: number) => Promise<WorldSource[]>,
): Promise<Response | null> {
  const now = Date.now();
  const realms = async () => (await liveSources(kv, now)).length;

  if (request.method === 'GET' && url.pathname === '/season') {
    const season = await readSeason(kv);
    if (!season) return bare(204);
    // Only the phases that can move on their own need the realm count; `open` needs it
    // just for the moment the Reckoning starts, so it is fetched lazily.
    const next = advanceSeason(season, now, season.phase === 'open' ? await realms() : 0);
    if (next !== season) await kv.put(STATE, JSON.stringify(next));
    return send(next);
  }

  const admin = url.pathname === '/season/open' || url.pathname === '/season/phase';
  if (request.method !== 'POST' || !admin) return null;
  if (!adminKey || request.headers.get('x-admin-key') !== adminKey) return send({ fault: 'forbidden' }, 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (url.pathname === '/season/open') {
    const { n, name, seed, reckoningByDay } = body ?? {};
    if (typeof n !== 'number' || typeof name !== 'string' || typeof seed !== 'string') {
      return send({ fault: 'invalid' }, 400);
    }
    const day = typeof reckoningByDay === 'number' ? reckoningByDay : undefined;
    const season = openSeason(n, name.slice(0, 60), seed.slice(0, 60), now, day);
    await kv.put(STATE, JSON.stringify(season));
    return send(season);
  }

  const season = await readSeason(kv);
  const phase = body?.phase as SeasonPhase | undefined;
  if (!season) return send({ fault: 'no-season' }, 409);
  if (!phase || !PHASES.includes(phase)) return send({ fault: 'invalid' }, 400);
  const next = forcePhase(season, phase, now, await realms());
  await kv.put(STATE, JSON.stringify(next));
  return send(next);
}
