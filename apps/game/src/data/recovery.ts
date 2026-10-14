/**
 * The recovery code on this phone, and asking the Worker what a code stands for
 * (BRDC-IDENTITY-001). The code arrives once, with the first publish, and is kept here so
 * the You screen can show it until the player has written it down somewhere safe.
 */
import { load, saveNow } from '@es3/core';
import { WORLD_API } from './worldSource.js';

const KEY = 'recovery';

export function readRecoveryCode(): string | null {
  const code = load<string | null>(KEY, null);
  return typeof code === 'string' && code ? code : null;
}

export function saveRecoveryCode(code: string): void {
  saveNow(KEY, code);
}

export interface RecoveredIdentity {
  playerId: string;
  name: string;
  nation?: string;
  banner?: string;
  clanId?: string;
  clanName?: string;
}

export type RecoveryAnswer = { ok: true; identity: RecoveredIdentity } | { ok: false; fault: 'unknown' | 'too-soon' | 'failed' };

export async function fetchRecovery(code: string): Promise<RecoveryAnswer> {
  try {
    const res = await fetch(`${WORLD_API}/recover`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (res.status === 404) return { ok: false, fault: 'unknown' };
    if (res.status === 429) return { ok: false, fault: 'too-soon' };
    if (!res.ok) return { ok: false, fault: 'failed' };
    const data = (await res.json().catch(() => null)) as RecoveredIdentity | null;
    return data?.playerId ? { ok: true, identity: data } : { ok: false, fault: 'failed' };
  } catch {
    return { ok: false, fault: 'failed' };
  }
}
