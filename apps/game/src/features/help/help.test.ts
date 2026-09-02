import { describe, expect, it } from 'vitest';
import { GROUPS, HELP } from './help.js';
import type { HelpTopic } from './help.js';

const ALL = Object.keys(HELP) as HelpTopic[];

describe('the guide index (GROUPS)', () => {
  it('places every entry in exactly one group — no orphan, no duplicate', () => {
    const grouped = GROUPS.flatMap((g) => [...g.topics]);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect([...grouped].sort()).toEqual([...ALL].sort());
  });

  it('never names a topic that has no entry, and every group has a heading', () => {
    for (const g of GROUPS) {
      expect(g.heading.trim().length).toBeGreaterThan(0);
      for (const t of g.topics) expect(HELP[t]).toBeDefined();
    }
  });
});

describe('every entry', () => {
  it('has a title and at least one non-empty paragraph', () => {
    for (const t of ALL) {
      expect(HELP[t].title.trim().length).toBeGreaterThan(0);
      expect(HELP[t].body.length).toBeGreaterThan(0);
      for (const p of HELP[t].body) expect(p.trim().length).toBeGreaterThan(0);
    }
  });

  it('only points "See also" at a real entry, never at itself', () => {
    for (const t of ALL) {
      for (const ref of HELP[t].see ?? []) {
        expect(HELP[ref], `${t} → ${ref}`).toBeDefined();
        expect(ref, `${t} links to itself`).not.toBe(t);
      }
    }
  });
});
