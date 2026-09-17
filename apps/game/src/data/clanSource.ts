/**
 * Talking to the Worker's clan endpoints (BRDC-CLAN-001, BRDC-CLAN-004).
 *
 * Same honesty as `worldSource.ts`: every failure here is swallowed into a named
 * outcome, never thrown — a friend group is a nice-to-have, not something that should
 * ever break the map underneath it.
 */
import type { H3Index, PlayerId } from '@es3/core';
import { WORLD_API } from './worldSource.js';

export type CreateClanResult =
  | { ok: true; id: string; founderToken: string }
  | { ok: false; reason: 'failed' };

export async function createClan(name: string, founderId: string): Promise<CreateClanResult> {
  try {
    const res = await fetch(`${WORLD_API}/clan`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, founderId }),
    });
    if (!res.ok) return { ok: false, reason: 'failed' };
    const data = (await res.json()) as { id?: string; founderToken?: string };
    if (!data.id || !data.founderToken) return { ok: false, reason: 'failed' };
    return { ok: true, id: data.id, founderToken: data.founderToken };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

export interface ClanMember {
  id: PlayerId;
  name: string;
  castle: H3Index | null;
}

/** Every clanmate currently publishing, for pulling their ground in regardless of the
 *  camera's own position (BRDC-CLAN-004). `null` on any failure — never thrown. */
export async function fetchClanRoster(clanId: string): Promise<ClanMember[] | null> {
  try {
    const res = await fetch(`${WORLD_API}/clan/${encodeURIComponent(clanId)}/roster`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { members?: ClanMember[] };
    return Array.isArray(data.members) ? data.members : null;
  } catch {
    return null;
  }
}

export type FindClanResult =
  | { ok: true; id: string; name: string }
  | { ok: false; reason: 'not-found' | 'failed' };

/** Look a code up before committing to it locally — a typo should not silently "join". */
export async function findClan(id: string): Promise<FindClanResult> {
  try {
    const res = await fetch(`${WORLD_API}/clan/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (res.status === 404) return { ok: false, reason: 'not-found' };
    if (!res.ok) return { ok: false, reason: 'failed' };
    const data = (await res.json()) as { id?: string; name?: string };
    if (!data.id || !data.name) return { ok: false, reason: 'failed' };
    return { ok: true, id: data.id, name: data.name };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
