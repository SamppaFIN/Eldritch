/**
 * The generated realm marks (Sigil §04, BRDC-SIGIL-004).
 *
 * The document's own twenty, each a construction rule rather than a drawing: a circle
 * count, a chord step. Ported here as data — `{ circles, d }` — read by `Banner.tsx` for
 * the Keep and by `bannerSprites.ts` for the map, the same split `RESOURCE_COLOUR` and
 * `MAP_RESOURCE_COLOUR` already make for the same reason: one needs a CSS colour, the
 * other a literal one an `Image` can decode outside the document.
 *
 * **Eighteen of the document's twenty, not twenty:**
 *
 * - *Vesica* is dropped. The hand-drawn `vesica` banner (`Banner.tsx`) already is two
 *   overlapping circles in gold and cyan — the document's own generated Vesica is the
 *   same shape a second time under a name that would collide with the existing id.
 * - *Drowned Knot* is dropped. Its own generator in the document builds an arc from a
 *   point to a point 0.01 units away — `A20,20 0 1,1 ${x+0.01},${y}` — which draws a
 *   circle a hair's width across, not a knot. Read as a bug in the source rather than a
 *   shape to port faithfully.
 *
 * Existing players keep their pick: nothing here touches `vesica`, `heptagram`,
 * `chevron`, `pale`, `eye` or `triquetra`.
 */
import {
  FRUIT_OF_LIFE,
  chords,
  pairs,
  poly,
  ring,
  spiral,
} from './realmMarkGeometry.js';
import type { MarkCircle } from './realmMarkGeometry.js';

export type RealmMarkId =
  | 'first-seed'
  | 'the-bloom'
  | 'fruit-of-the-void'
  | 'metatrons-cube'
  | 'triune-gate'
  | 'ninefold-eye'
  | 'merkaba'
  | 'the-hexad'
  | 'golden-spiral'
  | 'pentacle-of-the-deep'
  | 'the-weave'
  | 'tetrad'
  | 'octad-stone'
  | 'dodecad'
  | 'cube-of-space'
  | 'egg-of-life'
  | 'the-lattice'
  | 'squared-circle';

/**
 * Which of the game's own hues a mark draws in. A small, closed set rather than a raw
 * colour string, so `Banner.tsx` and `bannerSprites.ts` each resolve it to their own
 * syntax — the same reason `RESOURCE_COLOUR` is a lookup and not a literal per caller.
 */
export type MarkInk =
  | 'gold'
  | 'cyan'
  | 'green'
  | 'purple'
  | 'culture'
  | 'wisdom'
  | 'iron'
  | 'timber'
  | 'stone'
  | 'danger'
  | 'muted';

export interface RealmMark {
  name: string;
  lore: string;
  ink: MarkInk;
  circles: readonly MarkCircle[];
  /** An SVG path `d`, or `''` when the mark is circles alone (the Seed, the Bloom…). */
  d: string;
}

const ISO_CUBE =
  'M50,22L74,36L74,64L50,78L26,64L26,36Z M50,22L50,50 M50,50L74,64 M50,50L26,64';

export const REALM_MARKS: Readonly<Record<RealmMarkId, RealmMark>> = {
  'first-seed': {
    name: 'First Seed',
    lore: 'Seven circles. Where every realm begins.',
    ink: 'gold',
    circles: [{ x: 50, y: 50, r: 16 }, ...ring(6, 16, 0, 16)],
    d: '',
  },
  'the-bloom': {
    name: 'The Bloom',
    lore: 'Nineteen. The Seed, opened.',
    ink: 'green',
    circles: [
      { x: 50, y: 50, r: 10 },
      ...ring(6, 10, 0, 10),
      ...ring(6, 20, 0, 10),
      ...ring(6, 17.32, 30, 10),
    ],
    d: '',
  },
  'fruit-of-the-void': {
    name: 'Fruit of the Void',
    lore: 'Thirteen centres, nothing joined yet.',
    ink: 'culture',
    circles: FRUIT_OF_LIFE,
    d: '',
  },
  'metatrons-cube': {
    name: "Metatron's Cube",
    lore: 'Those thirteen, every centre joined. Seventy-eight lines, all earned.',
    ink: 'gold',
    circles: FRUIT_OF_LIFE.map((c) => ({ ...c, r: 3 })),
    d: pairs(FRUIT_OF_LIFE),
  },
  'triune-gate': {
    name: 'Triune Gate',
    lore: 'Three rings, one door.',
    ink: 'wisdom',
    circles: ring(3, 13, -90, 21),
    d: poly(3, 13, -90),
  },
  'ninefold-eye': {
    name: 'Ninefold Eye',
    lore: 'Nine points, every fourth joined. It never closes.',
    ink: 'cyan',
    circles: [{ x: 50, y: 50, r: 34 }],
    d: chords(9, 4, 34, -90),
  },
  merkaba: {
    name: 'Merkaba',
    lore: 'Two tetrahedra, one still and one turning.',
    ink: 'gold',
    circles: [{ x: 50, y: 50, r: 34 }],
    d: poly(3, 34, -90) + poly(3, 34, 90),
  },
  'the-hexad': {
    name: 'The Hexad',
    lore: 'What the ground is already made of.',
    ink: 'purple',
    circles: [],
    d: poly(6, 34, -90) + poly(3, 34, -90) + poly(3, 34, 90) + poly(6, 17, -90),
  },
  'golden-spiral': {
    name: 'Golden Spiral',
    lore: 'Growth that never changes shape.',
    ink: 'gold',
    circles: [],
    d: spiral(3, 2.4, 4.4),
  },
  'pentacle-of-the-deep': {
    name: 'Pentacle of the Deep',
    lore: 'Five, drawn without lifting the hand.',
    ink: 'iron',
    circles: [{ x: 50, y: 50, r: 34 }],
    d: chords(5, 2, 34, -90),
  },
  'the-weave': {
    name: 'The Weave',
    lore: 'Twenty-four points, every seventh. A net you can see through.',
    ink: 'wisdom',
    circles: [{ x: 50, y: 50, r: 35 }],
    d: chords(24, 7, 35, -90),
  },
  tetrad: {
    name: 'Tetrad',
    lore: 'The least a solid can be.',
    ink: 'timber',
    circles: [],
    d: `${poly(3, 32, -90)}M50,50L50,18M50,50L22.3,66M50,50L77.7,66`,
  },
  'octad-stone': {
    name: 'Octad Stone',
    lore: 'Eight faces. Air, in the old reckoning.',
    ink: 'cyan',
    circles: [],
    d: 'M50,16L78,50L50,84L22,50Z M22,50L78,50 M50,16L50,84 M22,50L50,62L78,50 M50,16L50,62',
  },
  dodecad: {
    name: 'Dodecad',
    lore: 'Twelve faces — what they used for the heavens.',
    ink: 'culture',
    circles: [],
    d:
      poly(5, 15, -90) +
      ring(5, 27, -90, 0)
        .map((p, i) => poly(5, 14, -90 + i * 72 + 36, p.x, p.y))
        .join(''),
  },
  'cube-of-space': {
    name: 'Cube of Space',
    lore: 'Six directions and the centre you stand in.',
    ink: 'muted',
    circles: [{ x: 50, y: 50, r: 34 }],
    d: ISO_CUBE,
  },
  'egg-of-life': {
    name: 'Egg of Life',
    lore: 'Seven, before the eighth division.',
    ink: 'green',
    circles: [{ x: 50, y: 50, r: 14 }, ...ring(6, 14, 30, 14)],
    d: '',
  },
  'the-lattice': {
    name: 'The Lattice',
    lore: 'Every triangle the hexagon contains.',
    ink: 'stone',
    circles: [],
    d: poly(6, 34, -90) + chords(6, 2, 34, -90) + chords(6, 3, 34, -90) + poly(6, 17, 90),
  },
  'squared-circle': {
    name: 'Squared Circle',
    lore: 'The old impossible problem, kept as a warning.',
    ink: 'danger',
    circles: [{ x: 50, y: 50, r: 34 }],
    d: poly(4, 34, -45) + poly(3, 34, -90) + poly(4, 17, -45),
  },
};

export const REALM_MARK_IDS = Object.keys(REALM_MARKS) as RealmMarkId[];

export function isRealmMark(id: string): id is RealmMarkId {
  return Object.prototype.hasOwnProperty.call(REALM_MARKS, id);
}
