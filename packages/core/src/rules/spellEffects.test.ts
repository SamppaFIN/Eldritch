/**
 * BRDC-SPELL-002 — Scrying's reach, and the shelter numbers behind Bulwark and Aegis.
 */
import { describe, expect, it } from 'vitest';
import {
  AEGIS_SHELTER_MS,
  BULWARK_SHELTER_MS,
  SCRY_BASE_REACH,
  SCRY_LEVELS_PER_RING,
  SCRY_MAX_REACH,
  scryReach,
} from './spellEffects.js';
import { SPELLS } from './spell.js';

describe('scryReach', () => {
  it('starts at the base reach for a new player', () => {
    expect(scryReach(1)).toBe(SCRY_BASE_REACH);
  });

  it('never reads below the base, however odd the level', () => {
    expect(scryReach(0)).toBe(SCRY_BASE_REACH);
    expect(scryReach(-5)).toBe(SCRY_BASE_REACH);
  });

  // The ticket asks for exactly this: "kantama kasvaa Consciousness-tason mukana".
  it('grows a ring every few levels of Consciousness', () => {
    expect(scryReach(SCRY_LEVELS_PER_RING)).toBe(SCRY_BASE_REACH + 1);
    expect(scryReach(SCRY_LEVELS_PER_RING * 2)).toBe(SCRY_BASE_REACH + 2);
  });

  it('never decreases as the level climbs', () => {
    for (let level = 1; level < 40; level += 1) {
      expect(scryReach(level + 1)).toBeGreaterThanOrEqual(scryReach(level));
    }
  });

  // The map is not the game. A Rite that showed a whole city would replace walking with
  // reading, so the reach stops even though the level curve does not.
  it('stops at the cap, so no level turns the map into the game', () => {
    expect(scryReach(1_000)).toBe(SCRY_MAX_REACH);
  });
});

describe('the shelter numbers', () => {
  it('gives Bulwark more per cell than Aegis, which covers many', () => {
    expect(BULWARK_SHELTER_MS).toBeGreaterThan(AEGIS_SHELTER_MS);
  });

  it('matches Bulwark to its own duration, as BRDC-SPELL-001 set it', () => {
    expect(BULWARK_SHELTER_MS).toBe(SPELLS.bulwark.durationMs);
  });
});

describe('the two new Rites', () => {
  it('are both cast at home, so neither needs a server', () => {
    expect(SPELLS.scrying.via).toBe('home');
    expect(SPELLS.aegis.via).toBe('home');
  });

  // What separates Scrying from Farsight, and the reason both exist: one is permanent and
  // short, the other wide and temporary. If Scrying ever stops running, they have merged.
  it('leave Scrying running and Farsight instant', () => {
    expect(SPELLS.scrying.durationMs).toBeGreaterThan(0);
    expect(SPELLS.farsight.durationMs).toBe(0);
    expect(scryReach(1)).toBeGreaterThan(SPELLS.farsight.reach ?? 0);
  });

  it('reach further with Aegis than Bulwark, which is its whole point', () => {
    expect(SPELLS.aegis.reach ?? 0).toBeGreaterThan(SPELLS.bulwark.reach ?? 0);
  });
});
