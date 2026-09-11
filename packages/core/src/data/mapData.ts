/**
 * Hand-drawn map data — one hex at a time (BRDC-MAP-EDIT-001, PIVOT-2026-09-09 §8).
 *
 * `terrainSeed.ts` was the first attempt at curated ground: circles and boxes over
 * Härmälä, typed out by hand. It works, and it does not scale past one neighbourhood —
 * a shoreline is not a circle, and a park is not a box.
 *
 * This is the per-hex version. A drawing is a flat map of `h3 → what is there`, made in
 * the editor and **committed to the repository**, not something a running game writes.
 * That distinction is the whole anti-cheat story: terrain decides what ground yields
 * (`TERRAIN_TABLE`), so a player who could paint their own neighbourhood could paint
 * themselves an iron mine. The editor is a dev tool and its output is content.
 *
 * Where it sits in the chain: a drawing beats the hash and beats a tile reading, and is
 * beaten by nothing — it is the most deliberate answer available about a hex, because a
 * person looked at that hex and said so.
 */
import type { Terrain, TerrainKind } from '../rules/terrain.js';
import type { BountyId } from '../rules/bounty.js';
import type { H3Index } from '../types/domain.js';

/** The file's own shape version, separate from every other. Raise it when this changes. */
export const MAP_DATA_VERSION = 1;

/** What a person can say about one hex. Short keys: a drawing is thousands of these. */
export interface PaintedCell {
  /** Terrain. Absent means "left alone" — the hash still answers. */
  t?: TerrainKind;
  /** A bounty placed by hand, overriding the deterministic one (BRDC-BOUNTY-001). */
  b?: BountyId;
  /** A note for the next person to open the file. Never shown in the game. */
  note?: string;
}

export interface MapDrawing {
  v: number;
  /** What area this covers, for a human reading the directory. */
  name: string;
  cells: Record<H3Index, PaintedCell>;
}

export type DrawingFault = 'not-json' | 'not-a-drawing' | 'wrong-version';
export type DrawingParse = { ok: true; drawing: MapDrawing } | { ok: false; fault: DrawingFault };

/**
 * Read a drawing. Refuses rather than throwing, and refuses loudly: a half-understood
 * file would silently give a neighbourhood the wrong ground, which is worse than none.
 */
export function parseDrawing(text: string): DrawingParse {
  let raw: unknown;
  try {
    raw = JSON.parse(text.trim());
  } catch {
    return { ok: false, fault: 'not-json' };
  }
  if (typeof raw !== 'object' || raw === null) return { ok: false, fault: 'not-a-drawing' };

  const d = raw as Partial<MapDrawing>;
  if (typeof d.v !== 'number' || typeof d.cells !== 'object' || d.cells === null) {
    return { ok: false, fault: 'not-a-drawing' };
  }
  if (d.v !== MAP_DATA_VERSION) return { ok: false, fault: 'wrong-version' };

  return { ok: true, drawing: { v: d.v, name: d.name ?? 'untitled', cells: d.cells } };
}

export function encodeDrawing(drawing: MapDrawing): string {
  return JSON.stringify(drawing, null, 2);
}

/** An empty drawing, ready to be painted on. */
export function newDrawing(name: string): MapDrawing {
  return { v: MAP_DATA_VERSION, name, cells: {} };
}

/**
 * Paint one hex, or scrub it clean.
 *
 * Returns a new drawing — nothing here mutates, so an editor can keep a history without
 * copying by hand. Painting a hex with nothing on it removes the entry rather than
 * leaving `{}` behind, so a scrubbed drawing is actually empty.
 */
export function paint(drawing: MapDrawing, h3: H3Index, what: PaintedCell | null): MapDrawing {
  const cells = { ...drawing.cells };
  const empty = !what || (what.t === undefined && what.b === undefined && !what.note);
  if (empty) delete cells[h3];
  else cells[h3] = what;
  return { ...drawing, cells };
}

/* --- What the running game reads ---------------------------------------- */

let painted: Record<H3Index, PaintedCell> = {};

/**
 * Load the drawings the build ships with. Called once, at boot, beside
 * `enableTerrainSurvey` — the same module-level shape and the same reason.
 *
 * Later drawings win on a hex two of them name, so an area file can be refined by a
 * smaller one without editing it.
 */
export function loadDrawings(...drawings: readonly MapDrawing[]): void {
  painted = {};
  for (const d of drawings) Object.assign(painted, d.cells);
}

/** Everything loaded, for the editor to open and keep drawing. */
export function loadedCells(): Readonly<Record<H3Index, PaintedCell>> {
  return painted;
}

/** The hand-drawn terrain for a hex, or null when nobody has said. */
export function paintedTerrainOf(h3: H3Index): Terrain | null {
  const kind = painted[h3]?.t;
  return kind ? { kind, source: 'seed' } : null;
}

/** The hand-placed bounty for a hex, or null when nobody has said. */
export function paintedBountyOf(h3: H3Index): BountyId | null {
  return painted[h3]?.b ?? null;
}
