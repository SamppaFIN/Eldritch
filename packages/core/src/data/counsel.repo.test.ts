import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { keepApi } from './citizenStore.js';
import { resetForSeason } from './seasonReset.js';
import { K } from './keys.js';
import { cellAt } from '../geo/cells.js';
import { CODEX_CARDS } from '../rules/counsel.js';
import type { Cell } from '../types/domain.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const tower: Cell = { h3: cellAt({ lat: 61.4729, lng: 23.7258 }), ownerId: 'me', strength: 100, lastVisitedAt: T0, visitDays: [], buildings: [{ id: 'watchtower', builtAt: T0 }] };

describe('the Counsel in the store (BRDC-COUNSEL-001)', () => {
  it('is absent on a Season 1 save', async () => {
    const store = new MemoryStore();
    expect(await keepApi(() => store, async () => []).counsel(T0)).toBeNull();
  });

  it('names the idle citizen and the empty work', async () => {
    const store = new MemoryStore();
    const keep = keepApi(() => store, async () => [tower]);
    await keep.found(T0);
    const counsel = await keep.counsel(T0);
    expect(counsel?.find((c) => c.id === 'idle')?.why).toContain('Watchtower');
  });

  it('reads each codex card once, and remembers across seasons', async () => {
    const store = new MemoryStore();
    const keep = keepApi(() => store, async () => []);
    expect((await keep.codex())?.id).toBe(CODEX_CARDS[0]?.id);
    await keep.readCodex(CODEX_CARDS[0]?.id as string);
    await resetForSeason(store);
    expect((await keep.codex())?.id).toBe(CODEX_CARDS[1]?.id);
    expect(await store.get(K.codexRead)).toEqual([CODEX_CARDS[0]?.id]);
  });
});
