/**
 * BRDC-BUILD-001 / BRDC-TECH-001 GREEN 8 — a locked building names what would open it.
 */
import { describe, expect, it } from 'vitest';
import { reason, titleCase } from './BuildPanel.js';

describe('titleCase', () => {
  it('turns a tech slug into a label', () => {
    expect(titleCase('early-farming')).toBe('Early Farming');
    expect(titleCase('masonry')).toBe('Masonry');
  });
});

describe('reason', () => {
  it('names the technology for a locked building, not just "locked"', () => {
    expect(reason('locked', 'granary')).toBe('Needs Early Farming');
    expect(reason('locked', 'storehouse')).toBe('Needs Masonry');
  });

  it('phrases the other refusals plainly', () => {
    expect(reason('wrong-terrain', 'granary')).toBe('Wrong ground');
    expect(reason('at-capacity', 'monument')).toBe('No room — build a Granary');
    expect(reason('cannot-afford', 'market')).toBe('Cannot afford');
  });
});
