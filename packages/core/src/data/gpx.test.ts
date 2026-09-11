/**
 * BRDC-GPX-001 — a track read into the same points a walk produces, and nothing else.
 */
import { describe, expect, it } from 'vitest';
import { GPX_ASSUMED_ACCURACY_M, parseGpx } from './gpx.js';
import { MAX_ACCURACY_M } from '../rules/constants.js';

const gpx = (body: string) =>
  `<?xml version="1.0"?><gpx version="1.1" creator="test"><trk><trkseg>${body}</trkseg></trk></gpx>`;

const pt = (lat: number, lng: number, time: string, extra = '') =>
  `<trkpt lat="${lat}" lon="${lng}"><ele>90</ele><time>${time}</time>${extra}</trkpt>`;

const ok = (text: string) => {
  const parsed = parseGpx(text);
  if (!parsed.ok) throw new Error(`expected ok, got ${parsed.fault}`);
  return parsed.points;
};
const why = (text: string) => {
  const parsed = parseGpx(text);
  return parsed.ok ? 'accepted' : parsed.fault;
};

describe('parseGpx', () => {
  it('reads a track into trail points, oldest first', () => {
    const points = ok(
      gpx(
        pt(61.4729, 23.7259, '2026-09-11T10:00:00Z') + pt(61.4731, 23.7262, '2026-09-11T10:00:10Z'),
      ),
    );
    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ lat: 61.4729, lng: 23.7259 });
    expect(points[1]?.t).toBeGreaterThan(points[0]?.t ?? 0);
  });

  /*
   * A track merged from two devices, or one a tool has rewritten, can arrive out of order.
   * A backwards interval reads as a negative speed, and the filters were never written to
   * judge one.
   */
  it('sorts by time rather than trusting the order in the file', () => {
    const points = ok(
      gpx(
        pt(61.4731, 23.7262, '2026-09-11T10:00:10Z') + pt(61.4729, 23.7259, '2026-09-11T10:00:00Z'),
      ),
    );
    expect(points.map((p) => p.lat)).toEqual([61.4729, 61.4731]);
  });

  it('accepts the self-closing form, which plenty of trackers write', () => {
    /*
     * `no-times` rather than `no-points` is the proof: the element was found and read, and
     * then refused for the one thing it is missing. `no-points` would have meant the
     * parser never saw it at all.
     */
    expect(why('<gpx><trkpt lat="61.4" lon="23.7"/></gpx>')).toBe('no-times');
  });

  it('reads waypoints and route points too, not only track points', () => {
    const text = `<gpx><wpt lat="61.4729" lon="23.7259"><time>2026-09-11T10:00:00Z</time></wpt></gpx>`;
    expect(ok(text)).toHaveLength(1);
  });
});

describe('accuracy, which GPX does not carry', () => {
  it('stands in a stated number when the file says nothing', () => {
    const points = ok(gpx(pt(61.4729, 23.7259, '2026-09-11T10:00:00Z')));
    expect(points[0]?.accuracy).toBe(GPX_ASSUMED_ACCURACY_M);
    // And it has to be usable: an assumption above the limit would reject every point.
    expect(GPX_ASSUMED_ACCURACY_M).toBeLessThan(MAX_ACCURACY_M);
  });

  it('reads hdop when there is one, at five metres a unit', () => {
    const points = ok(gpx(pt(61.4729, 23.7259, '2026-09-11T10:00:00Z', '<hdop>2.4</hdop>')));
    expect(points[0]?.accuracy).toBeCloseTo(12, 5);
  });

  // A wild hdop must not become an accuracy the rest of the game has never seen.
  it('never reports worse accuracy than the game itself allows', () => {
    const points = ok(gpx(pt(61.4729, 23.7259, '2026-09-11T10:00:00Z', '<hdop>99</hdop>')));
    expect(points[0]?.accuracy).toBe(MAX_ACCURACY_M);
  });
});

describe('refusals', () => {
  it('knows what is not a GPX file at all', () => {
    expect(why('{"not":"gpx"}')).toBe('not-gpx');
    expect(why('<kml><Placemark/></kml>')).toBe('not-gpx');
  });

  it('says when a file is a GPX with nothing in it', () => {
    expect(why('<gpx version="1.1"></gpx>')).toBe('no-points');
  });

  /*
   * Points without times are refused rather than given invented ones: the interval and
   * speed filters are the anti-cheat, and a made-up timestamp is a made-up speed.
   */
  it('refuses a track with no times, by name', () => {
    expect(why(gpx('<trkpt lat="61.4729" lon="23.7259"><ele>90</ele></trkpt>'))).toBe('no-times');
  });

  it('keeps the timed points when only some of them are timed', () => {
    const text = gpx(
      '<trkpt lat="61.40" lon="23.70"></trkpt>' + pt(61.4729, 23.7259, '2026-09-11T10:00:00Z'),
    );
    expect(ok(text)).toHaveLength(1);
  });

  it('skips a point whose coordinates will not parse', () => {
    const text = gpx(
      '<trkpt lat="north" lon="23.7"><time>2026-09-11T10:00:00Z</time></trkpt>' +
        pt(61.4729, 23.7259, '2026-09-11T10:00:05Z'),
    );
    expect(ok(text)).toHaveLength(1);
  });
});
