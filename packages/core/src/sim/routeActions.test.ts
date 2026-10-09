/**
 * BRDC-SIM-003 — a played-back route says what it does on the way.
 */
import { describe, expect, it } from 'vitest';
import { gpxActions, parseAction } from './routeActions.js';
import { parseRoute, routeJson } from './playback.js';

const gpx = (...pts: string[]) => `<?xml version="1.0"?><gpx version="1.1" xmlns:es3="https://es3.dev/route"><trk><trkseg>${pts.join('')}</trkseg></trk></gpx>`;
const pt = (lat: number, s: number, ...does: string[]) =>
  `<trkpt lat="${lat}" lon="23.72"><time>2026-10-09T10:00:${String(s).padStart(2, '0')}Z</time>` +
  (does.length ? `<extensions>${does.map((d) => `<es3:do>${d}</es3:do>`).join('')}</extensions>` : '') +
  `</trkpt>`;

describe('parseAction', () => {
  it('reads the verbs a route may use', () => {
    expect(parseAction('grant')).toEqual({ kind: 'grant' });
    expect(parseAction('collect')).toEqual({ kind: 'collect' });
    expect(parseAction('build monument')).toEqual({ kind: 'build', id: 'monument' });
    expect(parseAction('research masonry')).toEqual({ kind: 'research', id: 'masonry' });
    expect(parseAction(' adventure  start fuming-lake ')).toEqual({ kind: 'start', id: 'fuming-lake' });
    expect(parseAction('adventure choose 2')).toEqual({ kind: 'choose', index: 2 });
    expect(parseAction('go wisdom')).toEqual({ kind: 'go', site: 'wisdom' });
  });

  it('knows nothing it was not taught', () => {
    for (const t of ['', 'fly', 'build', 'adventure choose two', 'adventure start', 'grant everything', 'go', 'go to wisdom']) expect(parseAction(t)).toBeNull();
  });
});

describe('a GPX route with actions', () => {
  const text = gpx(pt(61.47, 0, 'grant', 'build monument'), pt(61.4701, 10), pt(61.4702, 20, 'adventure choose 0'));

  it('finds every action by its point', () => {
    expect(gpxActions(text)).toEqual([
      { t: Date.UTC(2026, 9, 9, 10, 0, 0), do: 'grant' },
      { t: Date.UTC(2026, 9, 9, 10, 0, 0), do: 'build monument' },
      { t: Date.UTC(2026, 9, 9, 10, 0, 20), do: 'adventure choose 0' },
    ]);
  });

  it('places them on the sorted points, and still reads as a plain walk', () => {
    const r = parseRoute(text, 'tale.gpx');
    expect(r.ok && r.route.points).toHaveLength(3);
    expect(r.ok && r.route.actions).toEqual([
      { at: 0, do: 'grant' },
      { at: 0, do: 'build monument' },
      { at: 2, do: 'adventure choose 0' },
    ]);
  });

  it('survives a round trip through JSON', () => {
    const r = parseRoute(text, 'tale.gpx');
    if (!r.ok) throw new Error('unreadable');
    expect(parseRoute(routeJson(r.route))).toEqual(r);
  });

  it('leaves a plain walk without any', () => {
    const r = parseRoute(gpx(pt(61.47, 0), pt(61.4701, 10)));
    expect(r.ok && r.route.actions).toBeUndefined();
  });
});
