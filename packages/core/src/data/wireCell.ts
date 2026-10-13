/**
 * A held cell, trimmed to what travels — and the checksum that seals a payload of them.
 *
 * The shared world (`world.ts`, `worldMerge.ts`) sends ground in this shape. It began as
 * the Wager's wire format (`challenge.ts`); the Wager, the duel carried by hand, was taken
 * out on 2026-10-13 (BRDC-WAGER-008) and this is the part of it the shared world kept.
 */
import type { BuildingId, Cell, H3Index, TerrainKind } from '../types/domain.js';

/**
 * One cell on the wire (BRDC-WAGER-JSON-004, -006).
 *
 * `h3` and `strength` are the ground; `t` and `b` are the picture — the terrain the
 * sender had resolved and the building on the border; `d` is how many distinct days the
 * sender has held the cell, which breaks a tie when a shared cell's yield is split. All
 * optional: a message from before a given change, or a cell whose terrain was never read,
 * simply omits them and imports without. `world.ts` sends the same shape.
 */
export interface WireCell {
  h3: H3Index;
  strength: number;
  t?: TerrainKind;
  /** Every Work on the cell (BRDC-BUILD-007). A single id until CHALLENGE_VERSION 4. */
  b?: BuildingId[];
  d?: number;
}

/** A stored cell, trimmed to what travels. */
export function toWireCell(c: Cell): WireCell {
  const w: WireCell = { h3: c.h3, strength: Math.round(c.strength) };
  if (c.terrain) w.t = c.terrain.kind;
  if (c.buildings?.length) w.b = c.buildings.map((x) => x.id);
  if (c.ownedDays) w.d = c.ownedDays;
  return w;
}

/**
 * FNV-1a over the payload, in hex.
 *
 * This catches a message that lost its last line in a chat app, not someone editing
 * their strength upward — a client-side checksum cannot do the second thing and pretending
 * otherwise would be worse than admitting it. Phase 3's server is where authority lives.
 */
export function checksum(payload: object): string {
  const text = JSON.stringify(payload);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
