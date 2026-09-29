import { describe, expect, it } from 'vitest';
import { MemoryStore } from './kv.js';
import { reckoningApi } from './reckoningStore.js';
import { keepApi } from './citizenStore.js';
import { writePouch } from './pouch.js';
import { K } from './keys.js';
import { EMPTY_POOL } from '../rules/terrain.js';
import { STRIKE_COOLDOWN_MS } from '../rules/reckoning.js';

const T0 = Date.parse('2026-10-01T12:00:00Z');
const faces = (...f: number[]) => {
  let i = 0;
  return () => ((f[i++ % f.length] as number) - 1) / 6 + 0.01;
};

describe('reckoningApi (BRDC-DOOM-004)', () => {
  it('refuses on a Season 1 save', async () => {
    const store = new MemoryStore();
    expect(await reckoningApi(() => store, async () => []).strike(T0)).toEqual({ ok: false, refused: 'no-keep' });
  });

  it('strikes with a Fight test, rests between blows, and keeps what is not yet sent', async () => {
    const store = new MemoryStore();
    const r = reckoningApi(() => store, async () => []);
    await keepApi(() => store, async () => []).found(T0);
    const blow = await r.strike(T0, faces(6, 5, 1, 1));
    expect(blow).toMatchObject({ ok: true, damage: 200 });
    expect(await r.strike(T0 + 1_000)).toEqual({ ok: false, refused: 'resting' });
    expect((await r.ledger()).unsent).toBe(200);
    await r.sent(200);
    expect(await r.ledger()).toMatchObject({ unsent: 0, dealt: 200, readyAt: T0 + STRIKE_COOLDOWN_MS });
    expect((await store.get<{ stamina: number }>(K.investigator))?.stamina).toBe(6);
  });

  it('a rite costs thirty mana and lands its harm', async () => {
    const store = new MemoryStore();
    const r = reckoningApi(() => store, async () => []);
    await keepApi(() => store, async () => []).found(T0);
    expect(await r.rite(T0)).toEqual({ ok: false, refused: 'cannot-afford' });
    await writePouch(store, { ...EMPTY_POOL, mana: 40 }, T0);
    expect(await r.rite(T0)).toEqual({ ok: true, damage: 150 });
  });
});
