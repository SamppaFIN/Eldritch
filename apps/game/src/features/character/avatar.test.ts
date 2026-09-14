/**
 * BRDC-SIGIL-005 — the personal sigil: persistence, and the picture library's own shape.
 */
import { describe, expect, it } from 'vitest';
import { AVATAR_IDS, DEFAULT_AVATAR, resolveAvatarId } from './avatarIds.js';
import { AVATAR_META } from './Avatar.js';

// The read/write round-trip through localStorage is not unit-tested here, the same call
// `nation.ts` makes for the identical reason: this suite runs in a Node environment with
// no browser global to touch. `nation.spec.ts` proves a pick survives a reopen against a
// real browser; the character e2e spec does the same for the avatar.
describe('resolveAvatarId', () => {
  it('passes a known id through', () => {
    for (const id of AVATAR_IDS) expect(resolveAvatarId(id)).toBe(id);
  });

  it('falls back to the default for anything else', () => {
    expect(resolveAvatarId('nonsense')).toBe(DEFAULT_AVATAR);
    expect(resolveAvatarId(undefined)).toBe(DEFAULT_AVATAR);
    expect(resolveAvatarId(42)).toBe(DEFAULT_AVATAR);
  });
});

describe('AVATAR_IDS and AVATAR_META', () => {
  it('is twenty, with no duplicates', () => {
    expect(AVATAR_IDS).toHaveLength(20);
    expect(new Set(AVATAR_IDS).size).toBe(20);
  });

  it('gives every id a name, a family and an ink', () => {
    for (const id of AVATAR_IDS) {
      const meta = AVATAR_META[id];
      expect(meta.name.length).toBeGreaterThan(0);
      expect(meta.ink).toContain('var(--');
      expect(['silhouette', 'ocular', 'aquatic', 'stroke-sigil', 'duotone']).toContain(meta.family);
    }
  });

  // Four each, the document's own grouping — the point of five families is that no two
  // players who picked different ones look like variations of each other.
  it('splits evenly into five families of four', () => {
    const counts: Record<string, number> = {};
    for (const id of AVATAR_IDS) {
      const f = AVATAR_META[id].family;
      counts[f] = (counts[f] ?? 0) + 1;
    }
    expect(Object.values(counts)).toEqual([4, 4, 4, 4, 4]);
  });

  it('gives no two avatars the same name', () => {
    expect(new Set(AVATAR_IDS.map((id) => AVATAR_META[id].name)).size).toBe(20);
  });
});
