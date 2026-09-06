/**
 * BRDC-BANNER-001 — the preset banners and the nation store.
 */
import { describe, expect, it } from 'vitest';
import { BANNER_IDS, DEFAULT_NATION, displayName, resolveBannerId } from './nation.js';
import { bannerSpriteId, bannerSvg } from './bannerSprites.js';

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

describe('bannerSprites — the map-icon form (field report 2026-09-06)', () => {
  it('renders a stroke-only SVG for every banner, with a stable id', () => {
    const ids = BANNER_IDS.map(bannerSpriteId);
    expect(new Set(ids).size).toBe(6);
    expect(bannerSpriteId('eye')).toBe('banner-eye');
    for (const id of BANNER_IDS) {
      const svg = bannerSvg(id);
      expect(svg.startsWith('<svg'), id).toBe(true);
      expect(svg, id).toContain('fill="none"');
      expect(svg, id).toMatch(/<(circle|path)/);
    }
  });
});
