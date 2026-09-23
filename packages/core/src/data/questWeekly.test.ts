/**
 * BRDC-QUEST-007 — the troll's hoard is re-hidden every week, the tale's path never moves.
 * Its own file: the week is module state, and the other quest tests expect it unset.
 */
import { describe, expect, it } from 'vitest';
import { haversine } from '../geo/haversine.js';
import { cellAt } from '../geo/cells.js';
import {
  FUMING_PATH,
  QUEST_SITES,
  SECRET_SITES,
  anchorQuestSites,
  pinQuestCells,
  pinWeeklySecrets,
  questSiteAt,
  siteCell,
  weekOf,
} from './questSites.js';

const DAY = 86_400_000;
const MONDAY = Date.parse('2026-09-21T12:00:00Z');

describe('weekOf', () => {
  it('turns over on Monday, not on the epoch’s Thursday', () => {
    expect(weekOf(MONDAY)).toBe(weekOf(MONDAY + 6 * DAY));
    expect(weekOf(MONDAY + 7 * DAY)).toBe(weekOf(MONDAY) + 1);
    expect(weekOf(MONDAY - DAY)).toBe(weekOf(MONDAY) - 1);
  });
});

describe('pinWeeklySecrets', () => {
  const week = weekOf(MONDAY);

  it('puts each secret 100–400 m from the statue, and moves it from one week to the next', () => {
    anchorQuestSites(null);
    pinWeeklySecrets(week, null);
    const first = SECRET_SITES.map((id) => questSiteAt(id));
    for (const p of first) {
      const d = haversine(QUEST_SITES.statue, p);
      expect(d).toBeGreaterThanOrEqual(99);
      expect(d).toBeLessThanOrEqual(401);
    }

    pinWeeklySecrets(week + 1, null);
    const second = SECRET_SITES.map((id) => questSiteAt(id));
    expect(second).not.toEqual(first);
  });

  it('holds still all week — the same week rolls the same places', () => {
    anchorQuestSites(null);
    const a = pinWeeklySecrets(week, null);
    const b = pinWeeklySecrets(week, null);
    expect(b).toEqual(a);
  });

  it('reads back what was written for the same week, and rerolls for another', () => {
    anchorQuestSites(null);
    const written = pinWeeklySecrets(week, null);
    const kept = pinWeeklySecrets(week, { week, cells: { ...written.cells, trinket: cellAt(QUEST_SITES.statue) } });
    expect(kept.cells.trinket).toBe(cellAt(QUEST_SITES.statue));
    const next = pinWeeklySecrets(week + 1, { week, cells: written.cells });
    expect(next.week).toBe(week + 1);
    expect(next.cells).not.toEqual(written.cells);
  });

  it('pins the secrets and leaves the authored path where it was written', () => {
    anchorQuestSites(null);
    pinQuestCells({});
    const before = FUMING_PATH.map((id) => questSiteAt(id));
    const pinned = pinWeeklySecrets(week, null);
    expect(FUMING_PATH.map((id) => questSiteAt(id))).toEqual(before);
    for (const id of SECRET_SITES) expect(siteCell(id)).toBe(pinned.cells[id]);
  });

  it('is carried to a Hearth outside Härmälä like everything else', () => {
    const OULU = { lat: 65.0121, lng: 25.4651 };
    anchorQuestSites(OULU);
    pinWeeklySecrets(week, null);
    for (const id of SECRET_SITES) {
      const d = haversine(OULU, questSiteAt(id));
      expect(d).toBeGreaterThanOrEqual(99);
      expect(d).toBeLessThanOrEqual(401);
    }
    anchorQuestSites(null);
  });
});
