/**
 * `resolveInstantCapture` (BRDC-CLAIM-017) — the "last visitor owns it" ruleset for
 * Adventure mode, sibling to `capture.test.ts` (already near its own line budget).
 */
import { describe, expect, it } from 'vitest';
import type { Cell } from '../types/domain.js';
import { emptyCell, resolveInstantCapture } from './capture.js';
import { BASE_STRENGTH } from './constants.js';

const H3 = '8b088a2dab1cfff';
const ME = { id: 'me', level: 1 };
const RIVAL = 'the-pale-warden';
const NOW = Date.parse('2026-09-23T12:00:00Z');

function ownedBy(owner: string, strength: number, visitedAt: number, days: string[] = []): Cell {
  return { h3: H3, ownerId: owner, strength, lastVisitedAt: visitedAt, visitDays: days };
}

describe('resolveInstantCapture', () => {
  it('claims unowned ground exactly as resolveCapture does', () => {
    const { cell, outcome } = resolveInstantCapture(emptyCell(H3), ME, NOW);
    expect(cell.ownerId).toBe('me');
    expect(cell.strength).toBe(BASE_STRENGTH);
    expect(outcome.kind).toBe('claimed');
  });

  it('takes a rival cell in one step, regardless of its strength', () => {
    const strong = ownedBy(RIVAL, 480, NOW - 1_000);
    const { cell, outcome } = resolveInstantCapture(strong, ME, NOW);
    expect(cell.ownerId).toBe('me');
    expect(cell.strength).toBe(BASE_STRENGTH);
    expect(outcome.kind).toBe('taken');
    expect(outcome.previousOwner).toBe(RIVAL);
  });

  it('carries the building, terrain, finder and owned-days forward like a worn-down siege', () => {
    const rival: Cell = {
      ...ownedBy(RIVAL, 100, NOW - 1_000),
      buildings: [{ id: 'sawmill', builtAt: NOW - 5_000 }],
      terrain: { kind: 'forest', source: 'hash' },
      finder: 'first-finder',
      revealedAt: NOW - 9_000,
      ownedDays: 7,
    };
    const { cell } = resolveInstantCapture(rival, ME, NOW);
    expect(cell.buildings).toEqual(rival.buildings);
    expect(cell.terrain).toEqual(rival.terrain);
    expect(cell.finder).toBe('first-finder');
    expect(cell.ownedDays).toBe(7);
  });

  it('still refuses to take the Hearth outright, wearing it down like resolveCapture instead', () => {
    const hearth = ownedBy(RIVAL, 100, NOW - 1_000);
    const weak = resolveInstantCapture(hearth, ME, NOW, H3);
    // A single BASE_STRENGTH-ish blow does not clear even a worn Hearth's floor of 1.
    expect(weak.cell.ownerId).toBe(RIVAL);
    expect(weak.cell.strength).toBeGreaterThanOrEqual(1);
    expect(weak.outcome.kind).not.toBe('taken');
  });

  it('still refuses to take ground held by a Fortress outright', () => {
    const fortressGround = ownedBy(RIVAL, 100, NOW - 1_000);
    const result = resolveInstantCapture(fortressGround, ME, NOW, null, true);
    expect(result.cell.ownerId).toBe(RIVAL);
    expect(result.outcome.kind).not.toBe('taken');
  });

  it('reinforces your own cell exactly as resolveCapture does, not an instant re-claim', () => {
    const mine = ownedBy('me', 200, NOW - 90_000_000, []);
    const { cell, outcome } = resolveInstantCapture(mine, ME, NOW);
    expect(cell.ownerId).toBe('me');
    expect(outcome.kind).toBe('reinforced');
    expect(cell.strength).toBeGreaterThan(200);
  });
});
