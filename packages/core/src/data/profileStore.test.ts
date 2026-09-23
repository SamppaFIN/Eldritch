/**
 * BRDC-MODE-001 — the chosen mode only ever matters at the moment a profile is born.
 */
import { describe, expect, it } from 'vitest';
import { readProfile } from './profileStore.js';
import { MemoryStore } from './kv.js';

const newId = () => 'p1';

describe('readProfile', () => {
  it('defaults to adventure when no mode is given', async () => {
    const profile = await readProfile(new MemoryStore(), newId);
    expect(profile.mode).toBe('adventure');
  });

  it('creates a fresh profile in the mode it is given', async () => {
    const profile = await readProfile(new MemoryStore(), newId, 'route');
    expect(profile.mode).toBe('route');
  });

  it('never changes an existing profile’s mode, whatever is passed later', async () => {
    const store = new MemoryStore();
    await readProfile(store, newId, 'route');
    const again = await readProfile(store, newId, 'adventure');
    expect(again.mode).toBe('route');
  });
});
