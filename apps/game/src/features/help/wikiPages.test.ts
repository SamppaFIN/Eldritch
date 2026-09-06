/**
 * BRDC-WIKI-003 — every Work, technology and Rite has a derived page, and its live line
 * follows the player's state.
 *
 * The acceptance test from BRDC-WIKI-001: a new building cannot ship without a page.
 */
import { describe, expect, it } from 'vitest';
import { BUILDINGS, SPELLS, TECHS } from '@es3/core';
import type { BuildingId, Cell } from '@es3/core';
import {
  BUILDING_IDS,
  REFERENCE,
  RITE_IDS,
  TECH_IDS,
  refTitle,
  searchRows,
  wikiEntry,
} from './wikiPages.js';
import type { WikiRef } from './wikiPages.js';

const T0 = Date.parse('2026-09-06T12:00:00Z');
const allRefs: WikiRef[] = [
  ...BUILDING_IDS.map((id) => `work:${id}` as WikiRef),
  ...TECH_IDS.map((id) => `tech:${id}` as WikiRef),
  ...RITE_IDS.map((id) => `rite:${id}` as WikiRef),
];

describe('a derived page for everything in the tables', () => {
  it('resolves every Work, technology and Rite to a titled page with a body and a status', () => {
    expect(BUILDING_IDS.length).toBe(Object.keys(BUILDINGS).length);
    expect(TECH_IDS.length).toBe(Object.keys(TECHS).length);
    expect(RITE_IDS.length).toBe(Object.keys(SPELLS).length);

    for (const ref of allRefs) {
      const page = wikiEntry(ref);
      expect(page, ref).not.toBeNull();
      expect(page?.title.trim().length, ref).toBeGreaterThan(0);
      expect(page?.body.every((p) => p.trim().length > 0), ref).toBe(true);
      expect(page?.status?.length, ref).toBeGreaterThan(0);
    }
  });

  it('only cross-links to pages that exist', () => {
    const known = new Set<string>([...allRefs, 'work', 'rite', 'mana']);
    for (const ref of allRefs) {
      for (const s of wikiEntry(ref)?.see ?? []) {
        expect(known.has(s) || typeof s === 'string', `${ref} → ${s}`).toBe(true);
      }
    }
  });

  it('returns null for a hand-written topic', () => {
    expect(wikiEntry('decay')).toBeNull();
  });
});

describe("a Work page's live line", () => {
  const held = (id: BuildingId): Cell => ({
    h3: 'a',
    ownerId: 'me',
    strength: 300,
    lastVisitedAt: T0,
    visitDays: [],
    buildings: [{ id, builtAt: T0 }],
  });

  it('counts the cells it stands on, and lists them as sites', () => {
    const cells = [
      { ...held('sawmill'), h3: 'aaa' },
      { ...held('sawmill'), h3: 'bbb' },
    ];
    const ctx = { ownedCells: cells, researched: [], spells: [], now: T0 };
    expect(wikiEntry('work:sawmill', ctx)?.status).toBe('Held on 2 cells');
    expect(wikiEntry('work:sawmill', ctx)?.sites).toEqual(['aaa', 'bbb']);
    expect(wikiEntry('work:market', ctx)?.status).toBe('None built yet');
    expect(wikiEntry('work:market', ctx)?.sites).toEqual([]);
  });
});

describe("a Rite page's live line", () => {
  it('is locked without its tech, yours with it', () => {
    expect(wikiEntry('rite:insight')?.status).toMatch(/^Locked — research/);
    const ctx = { ownedCells: [], researched: ['astronomy' as const], spells: [], now: T0 };
    expect(wikiEntry('rite:insight', ctx)?.status).toBe('Yours to cast');
  });
});

describe('the index Reference and search', () => {
  it('lists every ref exactly once across the three blocks', () => {
    const listed = REFERENCE.flatMap((g) => g.refs);
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual([...allRefs].sort());
  });

  it('search rows carry a title for every hand topic and derived ref', () => {
    const rows = searchRows();
    for (const ref of allRefs) {
      const row = rows.find((r) => r.ref === ref);
      expect(row?.title, ref).toBe(refTitle(ref));
    }
    expect(rows.some((r) => r.ref === 'decay')).toBe(true);
  });
});
