/**
 * BRDC-KEEP-003, -007 — the Keep's sections are present and reachable.
 *
 * The panel itself is React and this suite has no renderer, so this locks the tab
 * contract: the sections, in order, each with an id the panel switches on and a label
 * the player reads. Research left for its own HUD button and dialog (BRDC-KEEP-007), so
 * the Keep is Mana and Buildings now.
 */
import { describe, expect, it } from 'vitest';
import { TABS } from './HearthPanel.js';

describe('the Keep tabs', () => {
  it('are the tabbed sections, in order', () => {
    expect(TABS.map((t) => t.id)).toEqual(['mana', 'buildings']);
  });

  it('every tab has a non-empty label', () => {
    for (const t of TABS) expect(t.label.trim().length).toBeGreaterThan(0);
  });
});
