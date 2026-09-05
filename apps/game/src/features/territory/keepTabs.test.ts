/**
 * BRDC-KEEP-003 — the Keep's sections are all present and reachable.
 *
 * The panel itself is React and this suite has no renderer, so this locks the tab
 * contract: four sections, in order, each with an id the panel switches on and a label
 * the player reads. A footer button (`⌂ Keep`) opens the panel from anywhere — that
 * wiring lives in Hud/MapView; here we guard against a section quietly going missing.
 */
import { describe, expect, it } from 'vitest';
import { TABS } from './HearthPanel.js';

describe('the Keep tabs', () => {
  it('are the tabbed sections, in order', () => {
    expect(TABS.map((t) => t.id)).toEqual(['mana', 'wisdom', 'buildings']);
  });

  it('every tab has a non-empty label', () => {
    for (const t of TABS) expect(t.label.trim().length).toBeGreaterThan(0);
  });

  it('research is labelled Research, not the ritual word nobody read as a tech tree', () => {
    // Field report 2026-09-05: "Rites" hid the tech tree from a player looking for one.
    expect(TABS.find((t) => t.id === 'wisdom')?.label).toBe('Research');
  });
});
