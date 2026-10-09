/**
 * BRDC-ART-008 — the card emblems are built from their rule.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DreamEmblem, GreatEmblem, GroundArt, MythosEmblem, polygram } from './CardArt.js';

const points = (d: string) => d.split(/[ML]/).filter((s) => s.trim()).length;

describe('polygram', () => {
  it('{5/2} is one closed line through five points', () => {
    const d = polygram(5, 2, 40);
    expect(points(d)).toBe(6);
    const [first = '', ...rest] = d.split(' L');
    expect(rest.at(-1)).toBe(first.slice(1)); // it closes where it began
  });

  it('{6/2} is two triangles, each closed', () => {
    const d = polygram(6, 2, 40);
    expect(d.match(/M/g)).toHaveLength(2);
    expect(points(d)).toBe(8);
  });
});

describe('the card art', () => {
  it('draws stroke only, at an explicit size', () => {
    for (const html of [DreamEmblem({}), MythosEmblem({}), GreatEmblem({})].map((e) => renderToStaticMarkup(e))) {
      expect(html).toContain('width="40" height="40"');
      expect(html).toContain('fill="none"');
    }
  });

  it('shows the ground in the map’s own art', () => {
    const html = renderToStaticMarkup(GroundArt({ kind: 'forest' }));
    expect(html.match(/<img /g)).toHaveLength(2);
    expect(html).toContain('width="120" height="120"');
    expect(html).toContain('data:image/svg+xml');
  });
});
