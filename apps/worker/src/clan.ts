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
