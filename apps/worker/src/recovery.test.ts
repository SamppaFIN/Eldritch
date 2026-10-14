/** BRDC-IDENTITY-001 — a recovery code issued once, and turned back into the public profile. */
import { describe, expect, it } from 'vitest';
import { issueRecovery, newCode, normaliseCode, recover } from './recovery.js';
import type { KV } from './index.js';

function memoryKv(): KV {
  const m = new Map<string, string>();
  return {
    get: async (k) => m.get(k) ?? null,
    put: async (k, v) => void m.set(k, v),
    delete: async (k) => void m.delete(k),
    list: async (o) => ({ keys: [...m.keys()].filter((k) => !o?.prefix || k.startsWith(o.prefix)).map((name) => ({ name })) }),
  };
}

describe('recovery codes', () => {
  it('look like three words and two digits', () => {
    expect(newCode()).toMatch(/^[a-z]+-[a-z]+-[a-z]+-\d{2}$/);
  });

  it('are issued once per player, and give back the public name, nation and clan', async () => {
    const kv = memoryKv();
    await kv.put('player:p1', JSON.stringify({ source: { id: 'p1', name: 'Infinite', nation: 'Härmälä', banner: 'vesica', clanId: 'c1', cells: [] } }));
    await kv.put('clan:c1', JSON.stringify({ id: 'c1', name: 'The Lake', founderId: 'p1', founderToken: 'secret' }));
    const code = await issueRecovery(kv, 'p1');
    expect(code).not.toBeNull();
    expect(await issueRecovery(kv, 'p1')).toBeNull();
    expect(await recover(kv, code as string)).toEqual({ playerId: 'p1', name: 'Infinite', nation: 'Härmälä', banner: 'vesica', clanId: 'c1', clanName: 'The Lake' });
  });

  it('forgive capitals and spaces, and say nothing about a code that does not exist', async () => {
    const kv = memoryKv();
    await kv.put('player:p2', JSON.stringify({ source: { id: 'p2', name: 'Seeker', cells: [] } }));
    const code = (await issueRecovery(kv, 'p2')) as string;
    expect((await recover(kv, `  ${code.toUpperCase().replace(/-/g, ' ')} `))?.playerId).toBe('p2');
    expect(normaliseCode(' Moss  Lantern-tide 42 ')).toBe('moss-lantern-tide-42');
    expect(await recover(kv, 'no-such-code-00')).toBeNull();
  });
});
