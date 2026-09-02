/**
 * BRDC-BANNER-001 — the preset banners and the nation store.
 */
import { describe, expect, it } from 'vitest';
import { BANNER_IDS, DEFAULT_NATION, displayName, resolveBannerId } from './nation.js';

describe('resolveBannerId', () => {
  it('passes a known id through', () => {
    for (const id of BANNER_IDS) expect(resolveBannerId(id)).toBe(id);
  });

  it('falls back to the first banner for anything else', () => {
    expect(resolveBannerId('nonsense')).toBe('vesica');
    expect(resolveBannerId(undefined)).toBe('vesica');
    expect(resolveBannerId(42)).toBe('vesica');
  });
});

describe('displayName', () => {
  it('shows the wry default when the nation is unnamed', () => {
    expect(displayName(DEFAULT_NATION)).toBe('The Nameless Reach');
    expect(displayName({ ...DEFAULT_NATION, name: '   ' })).toBe('The Nameless Reach');
  });

  it('uses the name when there is one', () => {
    expect(displayName({ ...DEFAULT_NATION, name: 'Hyperborea' })).toBe('Hyperborea');
  });
});

describe('BANNER_IDS', () => {
  it('is the six presets with no duplicates', () => {
    expect(BANNER_IDS).toHaveLength(6);
    expect(new Set(BANNER_IDS).size).toBe(6);
  });
});
