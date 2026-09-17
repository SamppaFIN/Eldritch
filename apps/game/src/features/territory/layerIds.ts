/**
 * The names of every map layer this feature owns (BRDC-SIGIL-002).
 *
 * Their own file for one reason: `territoryImages.ts` has to toggle a layer's visibility
 * when its sprites land, and `TerritoryLayer.ts` has to call into the images, so anything
 * else is an import cycle. One id string written in two places is how a layer quietly
 * stops being the layer somebody meant to toggle.
 */
export const CELL_SOURCE = 'cells';
/**
 * The marks' own source: one Point per cell (BRDC-SIGIL-006).
 *
 * Separate from `cells` because a polygon wider than a 512 px tile gets its label placed
 * once per tile it is clipped into, and at zoom 20 a res-11 hex is wider than a tile.
 * Points cannot be clipped, so the marks are drawn once. See `cellMarks.ts`.
 */
export const CELL_MARK_SOURCE = 'cell-marks';
export const CELL_FILL_LAYER = 'cells-fill';
export const CELL_SHARED_LAYER = 'cells-shared';
export const CELL_BLIGHT_LAYER = 'cells-blight';
export const CELL_RIVAL_LINE_LAYER = 'cells-rival-line';
/** Your stroke, drawn above rival dashes so a shared edge reads as yours (BRDC-SIGIL-006). */
export const CELL_OWN_LINE_LAYER = 'cells-own-line';
/** A clanmate's stroke — solid, not dashed, so it reads as known rather than hostile
 *  (BRDC-CLAN-004). */
export const CELL_ALLY_LINE_LAYER = 'cells-ally-line';
export const CELL_LINE_LAYER = 'cells-line';
export const CELL_CONTESTED_LAYER = 'cells-contested';
export const CELL_ICON_LAYER = 'cells-icon';
export const CELL_GROUND_LAYER = 'cells-ground';
export const CELL_BUILDING_LAYER = 'cells-building';
export const CELL_BOUNTY_LAYER = 'cells-bounty';
export const CELL_BOUNTY_BADGE_LAYER = 'cells-bounty-badge';
export const CELL_LANDMARK_LAYER = 'cells-landmark';
export const CELL_FLAG_LAYER = 'cells-flag';
export const CELL_NEIGHBOUR_DISC_LAYER = 'cells-neighbour-disc';
export const CELL_NEIGHBOUR_LAYER = 'cells-neighbour';
export const CELL_STRENGTH_LAYER = 'cells-strength';
export const CELL_ANOMALY_LAYER = 'cells-anomaly';

/**
 * Below this, individual res-11 cells are smaller than a finger and stop being
 * information: a city block's worth collapses into a purple smudge. Shared here rather
 * than in `TerritoryLayer.ts` because `territoryMarks.ts` needs the same threshold and
 * importing it back from there would be the cycle this file exists to avoid.
 */
export const CELL_DETAIL_MINZOOM = 13;
