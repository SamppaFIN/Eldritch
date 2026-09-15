/**
 * Cells to GeoJSON features. Pure, and therefore testable.
 *
 * Split out of TerritoryLayer because everything here is a decision — who owns what
 * colour, when a cell counts as contested, which properties the paint expressions read —
 * and decisions deserve tests. What is left in TerritoryLayer is MapLibre plumbing.
 */
import {
  BLIGHT_EDGE_FACTOR,
  anomalyAt,
  blightLevel,
  bountyOn,
  bountyYield,
  emptyCell,
  isCityState,
  neighboursOf,
  terrainOf,
  TERRAIN_TABLE,
} from '@es3/core';
import { worksOn } from '@es3/core';
import type {
  BountyId,
  Cell,
  CaptureOutcome,
  H3Index,
  PlayerId,
  ResourceKind,
  TerrainKind,
} from '@es3/core';
import { buildingGlyph } from './buildingGlyphs.js';

/**
 * The cells a just-closed loop should flare gold, and when. `null` when the last claim
 * took no ground — a lap that only reinforced has nothing to light up. Pulled out of
 * MapView, which was at its line ceiling; pure, so it is tested here.
 */
export function awakeningReveal(
  claim: { outcomes: readonly CaptureOutcome[]; at: number } | null,
): { cells: H3Index[]; at: number } | null {
  if (!claim) return null;
  const cells = claim.outcomes
    .filter((o) => o.kind === 'claimed' || o.kind === 'taken')
    .map((o) => o.h3);
  return cells.length > 0 ? { cells, at: claim.at } : null;
}

/** --cosmic-purple and a lifted version of it, inlined from tokens.css. */
export const OWN_FILL = '#4a1a5c';
export const OWN_STROKE = '#8b3fb8';
/**
 * Any rival's ground, one fixed colour. A dark red, the same relation to `--danger`
 * (`oklch(0.65 0.21 25)`) that `OWN_FILL` is to `--cosmic-purple`. A hue arc per rival
 * was tried (BRDC-CLAIM-006) and dropped once real rival ground rendered: one "this is
 * hostile" signal reads faster than a rainbow nobody can tell apart outdoors.
 */
export const ENEMY_FILL = '#5c1a1a';

/** A village's own mark. `--sacred-gold`, because a settlement is the map's landmark. */
export const CITY_COLOUR = '#ffd700';
export const ENEMY_STROKE = '#a13b3b';
/**
 * Seen but not held — a cell revealed only by being next to yours. A neutral pale tone
 * (from `--glass-border`, `oklch(1 0 0 / 0.1)`), never `OWN_FILL`, so "explored,
 * unclaimed" stops looking identical to your own territory at low strength.
 */
export const REVEAL_FILL = '#cdc7d6';
/** --danger. The dashed stroke on a cell someone is walking on. */
export const CONTESTED_STROKE = '#d94a4a';

/**
 * Below base strength, someone has been walking on it.
 *
 * A cell only drops under 100 by being attacked or by decaying, and either way it is
 * worth the player's attention — this is the threshold the dashed stroke keys off.
 */
export const CONTESTED_BELOW = 100;

export interface CellProperties {
  strength: number;
  mine: boolean;
  contested: boolean;
  color: string;
  /** Terrain glyph, or `''` where the ground shows nothing (plain). */
  icon: string;
  /** The glyph's colour — the resource the terrain gives. `''` alongside an empty icon. */
  iconColor: string;
  /** Anomaly mark on your own ground: `◌` a site, `◐` under study, `✦` in a chain, `''` none. */
  anomaly: string;
  /** Building glyph (BRDC-ART-002), `''` when the cell has no building. On any owner's cell. */
  building: string;
  /** The building glyph's colour, by role. `''` alongside an empty building glyph. */
  buildingColor: string;
  /** The terrain, as the isometric ground tile's name (Sigil §03). */
  ground: string;
  /** A Work worth seeing from a street away, or a village. Drawn over the hex, not in it. */
  landmark: string;
  landmarkColor: string;
  /**
   * What this hex was found to hold, drawn on the map (Sigil §03, BRDC-SIGIL-003).
   *
   * `''` unless the cell is both **mine** and **revealed** — the map must never draw
   * something the reveal mechanic has not paid out yet. `bountyOn` is deterministic and
   * would happily answer for an unrevealed hex; gating happens here; the whole reason
   * `revealed` is threaded down to this function.
   */
  bounty: string;

  /**
   * The find's own hue, for the badge that stands in when the sprite is too small to
   * read (Sigil §03). Its resource's colour — gems gold, deer green — so the badge and
   * the income line in the panel agree by eye.
   */
  bountyColor: string;
  /** Blight, 0..1 (BRDC-BLIGHT-001) — how far the Void has crept in. Rendering only. */
  blight: number;
  /** Your flag on ground you hold that carries no building (BRDC-BANNER-001), else `''`. */
  flag: string;
  /** Both you and an imported Wager claim this cell (BRDC-WAGER-JSON-005) — `cell.shared`. */
  shared: boolean;
  /**
   * How many of the six neighbours you already hold, on your own ground (Sigil §03's
   * "neighbour count"). It is the `NEIGHBOUR_BONUS` made visible: the number that decides
   * how much easier the next claim around here will be. Zero on anyone else's cell.
   */
  neighbours: number;
}

/** The map flag glyph and its colour (BRDC-BANNER-001). Geometric Shapes block, so it
 *  renders in MapLibre's bundled font; one mark, not the full banner (see the ticket). */
export const FLAG_GLYPH = '◈';
export const FLAG_COLOR = '#ffd700';

/**
 * One colour per resource the ground can give. Drives both the map's terrain glyph and
 * the same glyph in `CellPanel`, so a lake reads the same colour in both places.
 */
/**
 * The colour law: one hue per resource, everywhere it is ever named (Sigil §01).
 *
 * A number, an icon, a tech effect, a leaderboard row — wherever food is named it is food
 * green. It is the one rule that makes a dense screen scannable at walking pace, and the
 * corollary is blunt: **a grey resource number is a bug.**
 *
 * These read from `tokens.css` rather than repeating hex here, so a palette change lands
 * once. The old literals were close to these already; the difference is that the token is
 * now the single definition and this table is the lookup.
 *
 * `var()` is fine everywhere the browser resolves it — CSS, inline styles, SVG paint. The
 * one place it is not is a MapLibre paint expression, which is why `mapResourceColour`
 * exists below.
 */
export const RESOURCE_COLOUR: Readonly<Record<ResourceKind, string>> = {
  wood: 'var(--r-timber)',
  stone: 'var(--r-stone)',
  iron: 'var(--r-iron)',
  food: 'var(--r-food)',
  gold: 'var(--r-gold)',
  wisdom: 'var(--r-wisdom)',
  mana: 'var(--r-mana)',
  culture: 'var(--r-culture)',
  tokens: 'var(--r-token)',
};

/**
 * The same law, resolved, for the map.
 *
 * MapLibre parses paint values itself and has never heard of a custom property, so the
 * hex has to be literal here. Kept beside its `var()` twin and in the same order, because
 * two colour tables in two files is how the law quietly stops being one.
 */
export const MAP_RESOURCE_COLOUR: Readonly<Record<ResourceKind, string>> = {
  wood: '#5fae6a',
  stone: '#a8b2c4',
  iron: '#a9cbdb',
  food: '#6fdc8c',
  gold: '#ffd700',
  wisdom: '#b07fe0',
  mana: '#00d4ff',
  culture: '#f07bb5',
  tokens: '#ffd84d',
};

/** The word the pouch uses for each resource — "timber", not "wood". */
export const RESOURCE_WORD: Readonly<Record<ResourceKind, string>> = {
  wood: 'timber',
  stone: 'stone',
  iron: 'iron',
  food: 'food',
  gold: 'gold',
  wisdom: 'wisdom',
  mana: 'mana',
  culture: 'culture',
  tokens: 'tokens',
};

/** One glyph per terrain kind, from the same register as the HUD's `⬢ ⬡ ◈ ◇`. */
const TERRAIN_CHAR: Readonly<Record<TerrainKind, string>> = {
  plain: '',
  forest: '♣',
  hill: '△',
  mountain: '▲',
  lake: '≈',
  coast: '≈',
  market: '◆',
};

/**
 * The glyph and colour for a terrain kind, or `null` when there is nothing to show
 * (plain ground). Exported for `CellPanel`, which draws the same mark beside its
 * terrain description.
 */
export function terrainGlyph(kind: TerrainKind): { char: string; color: string } | null {
  const char = TERRAIN_CHAR[kind];
  if (!char) return null;
  const resource = TERRAIN_TABLE[kind].resource;
  // The map needs a literal; `terrainGlyph` feeds a MapLibre paint property.
  return { char, color: resource ? MAP_RESOURCE_COLOUR[resource] : OWN_STROKE };
}

/**
 * A find's hue: the colour of the resource it pays. `''` where there is no find.
 *
 * Read out of `bountyYield` rather than the `BOUNTIES` table, which core does not export —
 * and the indirection earns its keep, because a badge tinted by what the find *pays*
 * cannot drift from the table the way a second hard-coded mapping would.
 */
export function bountyInk(id: BountyId | null): string {
  if (!id) return '';
  const [resource] = Object.keys(bountyYield(id)) as ResourceKind[];
  return resource ? MAP_RESOURCE_COLOUR[resource] : '';
}

/**
 * Fog of war: the only cells the map draws are the ones you hold, the ring of cells
 * around them, and every cell an import put on the map (BRDC-WAGER-JSON-006 — a Wager or
 * `world.json`: you asked to see their whole reach, so it is not hidden). Everything else
 * is left as bare basemap.
 *
 * A neighbour with no stored cell of its own still appears — as `emptyCell(h3)` — so it
 * can carry the pale reveal tint and its terrain glyph. The full set stays available to
 * the rest of the game (selection, the rival compass); only what reaches the map is
 * narrowed here.
 */
export function withFogOfWar(
  all: readonly Cell[],
  owned: readonly Cell[],
  /** A running Scrying lifts the fog where it looks, and only while it runs. */
  scried: readonly Cell[] = [],
): Cell[] {
  const byH3 = new Map(all.map((c) => [c.h3, c]));
  const visible = new Set<string>();
  for (const cell of owned) {
    visible.add(cell.h3);
    for (const n of neighboursOf(cell.h3)) visible.add(n);
  }
  for (const cell of all) if (cell.imported) visible.add(cell.h3);
  // Added here rather than merged into `all`, because this is exactly what the Rite does:
  // it lifts the fog, it does not create ground. Nothing about it is written anywhere, so
  // when the spell stops running these simply stop arriving (BRDC-SPELL-002).
  for (const cell of scried) visible.add(cell.h3);
  return [...visible].map((h3) => byH3.get(h3) ?? emptyCell(h3));
}

/**
 * The anomaly mark for one of your cells (BRDC-EVENT-001). Different glyphs, not just a
 * tint — the state has to read without colour. `''` for ground with nothing on it, and
 * for a finished anomaly.
 */
export function anomalyGlyphFor(cell: Cell): string {
  if (anomalyAt(cell.h3) === null) return '';
  const a = cell.anomaly;
  if (!a) return '◌';
  if (a.done) return '';
  return a.stage !== undefined ? '✦' : '◐';
}

/**
 * Works you can see from the next street, and a city state's own ground (BRDC-FX-002).
 *
 * Infinite: *"jos sulla on temppeli, niin se näkyy.. saa olla isompi kun se alkuperäinen
 * heksa.. tai jos siinä on joku kalastuskylä.. korvaa siis koko heksa näillä."*
 *
 * Most Works are a 15 px glyph tucked under the terrain mark, which is right for a farm
 * and wrong for a monument: a hex at walking zoom is about eighty pixels across, so the
 * thing that ought to be a landmark reads as a speck. These five, plus any village,
 * *replace* the hex instead — drawn centred and large enough to spill over its edges.
 *
 * Five and not fifteen on purpose. If everything is a landmark the map is a wall of
 * glyphs again, just a bigger one.
 */
const LANDMARKS: ReadonlySet<string> = new Set([
  'monument',
  'temple-grove',
  'lighthouse',
  'fortress',
  'library',
]);

/** A village on the map is a place, not a building — one glyph for the whole settlement. */
const VILLAGE_GLYPH = '⌂';

/** No reveal state — most callers (tests, the editor) have none and must not invent one. */
const EMPTY_REVEALED: Readonly<Record<H3Index, number>> = {};

export function cellProperties(
  cell: Cell,
  me: PlayerId | null,
  now = 0,
  home: H3Index | null = null,
  isBorder = false,
  /** Cells this player has revealed. Empty by default — most callers (tests, the
   *  editor) have no reveal state and must not have to invent one. */
  revealed: Readonly<Record<H3Index, number>> = EMPTY_REVEALED,
): CellProperties {
  const mine = cell.ownerId !== null && cell.ownerId === me;
  const rival = cell.ownerId !== null && !mine;
  const glyph = terrainGlyph(terrainOf(cell.h3).kind);
  // Shown on any owner's cell — a rival's building on a bordering hex is intel. A cell
  // can hold several Works now (BUILD-007); the text layer marks the newest, which is
  // what makes a just-built one appear. BRDC-ART-003 draws them all as icons.
  const works = worksOn(cell);
  const newest = works[works.length - 1];
  const bg = newest ? buildingGlyph(newest.id) : null;
  const village = isCityState(cell.ownerId);
  const isLandmark = village || (newest !== undefined && LANDMARKS.has(newest.id));
  const mineRevealed = mine && revealed[cell.h3] !== undefined;
  return {
    strength: cell.strength,
    mine,
    // Filled in by `cellsToGeoJson`, which is the only caller that knows the whole realm.
    neighbours: 0,
    contested: cell.ownerId !== null && cell.strength < CONTESTED_BELOW,
    // Three tiers: mine, a rival's, or seen-but-unclaimed. Strength drives opacity in
    // the paint expression, so a fresh reveal (strength 0) is naturally faint.
    color: mine ? OWN_FILL : rival ? ENEMY_FILL : REVEAL_FILL,
    // The ground you hold and everything one ring around it reads its terrain
    // (BRDC-MAP-003, reverted 2026-09-02 on Infinite's call: a bordering cell is
    // *known*). Anything past that ring is never drawn — that is the fog.
    icon: glyph?.char ?? '',
    iconColor: glyph?.color ?? '',
    // The isometric tile's name, which is simply the terrain (Sigil §03). Kept beside the
    // glyph rather than replacing it: no canvas, no tiles, and the glyph layer stands in.
    ground: terrainOf(cell.h3).kind,
    anomaly: mine ? anomalyGlyphFor(cell) : '',
    // A landmark is drawn by its own layer instead, so it is never drawn twice.
    building: isLandmark ? '' : (bg?.char ?? ''),
    buildingColor: bg?.color ?? '',
    landmark: village ? VILLAGE_GLYPH : isLandmark ? (bg?.char ?? '') : '',
    landmarkColor: village ? CITY_COLOUR : (bg?.color ?? ''),
    bounty: mineRevealed ? (bountyOn(cell) ?? '') : '',
    bountyColor: bountyInk(mineRevealed ? bountyOn(cell) : null),
    blight: Math.min(1, blightLevel(cell, now, home) * (isBorder ? BLIGHT_EDGE_FACTOR : 1)),
    // Your flag on ground you hold — but not where a building already carries the mark.
    flag: mine && works.length === 0 ? FLAG_GLYPH : '',
    shared: cell.shared !== undefined,
  };
}
