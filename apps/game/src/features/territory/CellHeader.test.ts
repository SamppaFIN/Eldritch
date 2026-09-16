/**
 * BRDC-CARD-001 — the "Surveyed" / "?" chip's own rule.
 *
 * The component is React and this suite has no renderer, so it locks the rule `surveyed`
 * encodes: real map data and hand-painted hexes are certain, a Worldseed hex is only as
 * sure as its own classifier confidence, and the hash anywhere else is a guess.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enableWorldseed, hexSeedOf } from '@es3/core';
import type { Cell } from '@es3/core';
import { surveyed } from './CellHeader.js';

const T0 = Date.parse('2026-09-16T12:00:00Z');
const cell = (h3: string): Cell => ({ h3, ownerId: 'me', strength: 300, lastVisitedAt: T0, visitDays: [] });

/** Real Härmälänranta hexes, confirmed against the built seed (`hexSeedOf`) rather than
 *  assumed — one classified inside a mapped zone, one the classifier only guessed at. */
const CONFIDENT_HEX = '8b088a2da898fff';
const UNSURE_HEX = '8b1124974962fff';

beforeAll(() => enableWorldseed(true));
afterAll(() => enableWorldseed(false));

describe('surveyed', () => {
  it('trusts real map data and hand-painted ground unconditionally', () => {
    expect(surveyed(cell('x'), { kind: 'plain', source: 'tiles' })).toBe(true);
  });

  it('never trusts the bare hash — nothing confirms it', () => {
    expect(surveyed(cell('x'), { kind: 'plain', source: 'hash' })).toBe(false);
  });

  it('trusts a Worldseed hex classified inside a mapped zone', () => {
    expect(hexSeedOf(CONFIDENT_HEX)?.confidence).toBeGreaterThanOrEqual(0.5);
    expect(surveyed(cell(CONFIDENT_HEX), { kind: 'plain', source: 'seed' })).toBe(true);
  });

  it('does not trust a Worldseed hex the classifier could only guess at', () => {
    expect(hexSeedOf(UNSURE_HEX)?.confidence).toBeLessThan(0.5);
    expect(surveyed(cell(UNSURE_HEX), { kind: 'plain', source: 'seed' })).toBe(false);
  });
});
