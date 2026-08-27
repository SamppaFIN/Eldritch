import { describe, expect, it } from 'vitest';
import { compassPoint } from './FirstLook.js';

/**
 * The first sentence the game says to anyone points somewhere. It was hard-coded to
 * "east" while the territory sat north-east — a small lie, in the worst possible place.
 */
describe('compassPoint', () => {
  it('names the cardinals', () => {
    expect(compassPoint(0)).toBe('north');
    expect(compassPoint(90)).toBe('east');
    expect(compassPoint(180)).toBe('south');
    expect(compassPoint(270)).toBe('west');
  });

  it('names the diagonals', () => {
    expect(compassPoint(45)).toBe('north-east');
    expect(compassPoint(135)).toBe('south-east');
    expect(compassPoint(225)).toBe('south-west');
    expect(compassPoint(315)).toBe('north-west');
  });

  it('rounds to the nearest point', () => {
    expect(compassPoint(20)).toBe('north');
    expect(compassPoint(30)).toBe('north-east');
    expect(compassPoint(359)).toBe('north');
  });

  it('wraps rather than falling off the end', () => {
    expect(compassPoint(360)).toBe('north');
    expect(compassPoint(-90)).toBe('west');
    expect(compassPoint(720 + 90)).toBe('east');
  });
});
