/**
 * BRDC-UI-002 — a greyed action says what it is waiting for.
 */
import { describe, expect, it } from 'vitest';
import { missingPhrase, shortNote } from './gateNote.js';

describe('missingPhrase', () => {
  it('names one shortfall plainly', () => {
    expect(missingPhrase({ stone: 60 })).toBe('60 stone');
  });

  it('joins two with "and", and three with commas', () => {
    expect(missingPhrase({ stone: 60, gold: 20 })).toBe('60 stone and 20 gold');
    expect(missingPhrase({ stone: 1, gold: 2, wood: 3 })).toBe('1 stone, 2 gold and 3 timber');
  });

  // The pouch calls it timber, so the shortfall has to as well (claude.md §10).
  it('uses the word the game uses, not the field name', () => {
    expect(missingPhrase({ wood: 25 })).toBe('25 timber');
  });

  it('says nothing when nothing is missing', () => {
    expect(missingPhrase({})).toBe('');
  });
});

describe('shortNote', () => {
  it('is a sentence, or null when the action is within reach', () => {
    expect(shortNote({ stone: 60 })).toBe('Short 60 stone.');
    expect(shortNote({})).toBeNull();
  });
});
