/**
 * The one shared season (BRDC-SEASON-002).
 *
 *   GET  /season         the current `Season`, advanced to now; 204 before any is opened
 *   POST /season/open    admin: open season n {n, name, seed, reckoningByDay?, doomEveryNDawns?}
 *   POST /season/phase   admin: force a phase {phase} — the season's length is Infinite's
 *                        call (*"season kestää kunnes saadaan uusi versio tulille"*)
 *   POST /season/doom    a gate moved the shared Doom {gateId, delta: 1 | -1} (DOOM-002):
 *                        taken once per gate and direction, however often it is sent
 *   POST /season/strike  a realm hurts the Ancient One {realm, damage} (DOOM-004)
 *   GET  /season/reckoning  its strength and every realm's damage
 *   POST /season/archive admin: every realm into the Chronicles {era, wipe?} (SEASON-004)
 *   GET  /season/ruins   the Fortresses the last season left standing (SEASON-007)
 *
 * Admin routes need `x-admin-key` to match the `ADMIN_KEY` Worker secret; with no secret
 * set they are simply off. The key never reaches the game client — Infinite uses curl.
 * Separate from `season.ts`, which is SEASON-001's daily tournament trail.
 */
import { MAX_DAMAGE_PER_CALL, STRIKE_COOLDOWN_MS, advanceSeason, damageBoss, forcePhase, openSeason } from '@es3/core/rules';
import type { Season, SeasonPhase } from '@es3/core/rules';
import type { WorldSource } from '@es3/core/data';
import type { KV } from './index.js';
import { RUINS, archiveSeason } from './archive.js';

const STATE = 'season:state';
const DAMAGE = 'season:reckoning:damage';
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

  if (request.method === 'POST' && url.pathname === '/season/doom') {
    const body = (await request.json().catch(() => null)) as { gateId?: unknown; delta?: unknown } | null;
    const gateId = typeof body?.gateId === 'string' ? body.gateId.slice(0, 120) : null;
    const delta = body?.delta === 1 || body?.delta === -1 ? body.delta : null;
    if (!gateId || delta === null) return send({ fault: 'invalid' }, 400);
    const season = await readSeason(kv);
    if (!season || season.phase !== 'open') return send({ fault: 'no-open-season' }, 409);
    // Same trust as /submit: no account. A gate moves the Doom once each way, at most.
    const once = `doomgate:${gateId}:${delta}`;
    if (!(await kv.get(once))) {
      await kv.put(once, '1', { expirationTtl: 60 * 86_400 });
      const next = advanceSeason({ ...season, doomShift: (season.doomShift ?? 0) + delta }, now, await realms());
      await kv.put(STATE, JSON.stringify(next));
    }
    return send({ ok: true });
  }

  if (request.method === 'GET' && url.pathname === '/season/reckoning') {
    const season = await readSeason(kv);
    if (!season) return bare(204);
    const damage = JSON.parse((await kv.get(DAMAGE)) ?? '{}') as Record<string, number>;
    return send({ bossHp: season.bossHp, bossMaxHp: season.bossMaxHp, phase: season.phase, standings: Object.entries(damage).map(([realm, d]) => ({ realm, damage: d })) });
  }

  if (request.method === 'POST' && url.pathname === '/season/strike') {
    const body = (await request.json().catch(() => null)) as { realm?: unknown; damage?: unknown } | null;
    const realm = typeof body?.realm === 'string' ? body.realm.slice(0, 80) : null;
    const dmg = typeof body?.damage === 'number' ? Math.floor(body.damage) : 0;
    if (!realm || dmg < 1 || dmg > MAX_DAMAGE_PER_CALL) return send({ fault: 'invalid' }, 400);
    const season = await readSeason(kv);
    if (!season || season.phase !== 'reckoning') return send({ fault: 'not-reckoning' }, 409);
    // Same trust as /submit; the cap and the ration keep one phone from ending it alone.
    if (await kv.get(`strike-rl:${realm}`)) return send({ fault: 'too-soon' }, 429);
    await kv.put(`strike-rl:${realm}`, '1', { expirationTtl: Math.max(60, STRIKE_COOLDOWN_MS / 1000) });
    const damage = JSON.parse((await kv.get(DAMAGE)) ?? '{}') as Record<string, number>;
    damage[realm] = (damage[realm] ?? 0) + dmg;
    await kv.put(DAMAGE, JSON.stringify(damage));
    const next = advanceSeason(damageBoss(season, dmg), now, 0);
    await kv.put(STATE, JSON.stringify(next));
    return send({ bossHp: next.bossHp, bossMaxHp: next.bossMaxHp, phase: next.phase, damage: damage[realm] });
  }

  if (request.method === 'GET' && url.pathname === '/season/ruins') {
    const raw = await kv.get(RUINS);
    return raw ? send(JSON.parse(raw)) : bare(204);
  }

  const admin = url.pathname === '/season/open' || url.pathname === '/season/phase' || url.pathname === '/season/archive';
  if (request.method !== 'POST' || !admin) return null;
  if (!adminKey || request.headers.get('x-admin-key') !== adminKey) return send({ fault: 'forbidden' }, 403);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (url.pathname === '/season/archive') {
    const era = typeof body?.era === 'string' && body.era.trim() ? body.era.trim() : 'Season 1';
    return send(await archiveSeason(kv, now, era, body?.wipe === true));
  }

  if (url.pathname === '/season/open') {
    const { n, name, seed, reckoningByDay, doomEveryNDawns } = body ?? {};
    if (typeof n !== 'number' || typeof name !== 'string' || typeof seed !== 'string') {
      return send({ fault: 'invalid' }, 400);
    }
    const day = typeof reckoningByDay === 'number' ? reckoningByDay : undefined;
    const opened = openSeason(n, name.slice(0, 60), seed.slice(0, 60), now, day);
    // The Doom's dawn clock is optional too (DOOM-001): the document's 3, or none.
    const season = typeof doomEveryNDawns === 'number' && doomEveryNDawns > 0 ? { ...opened, doomEveryNDawns } : opened;
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
