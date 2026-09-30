/**
 * An open gate and a found wonder, as structures on their hex (field report 2026-09-30:
 * *"Sain viestin että Gate on auennut.. haluan että siinä on näkyvissä grafiikkana
 * portaali"*, and a found Arkham nowhere on the map).
 *
 * Same construction as `placeSprites.ts`: procedural SVG on the 64-unit iso plinth,
 * rasterised once into the map's atlas. Hex literals, not tokens: the SVG is decoded by an
 * `Image`, outside the document, where `var()` does not resolve.
 */
import { rasteriseSvgs } from '../territory/spriteRaster.js';

export type SeasonMarkKind = 'gate' | 'wonder';
export const SEASON_MARK_KINDS: readonly SeasonMarkKind[] = ['gate', 'wonder'];
export const SEASON_SPRITE_PX = 192;
export const seasonSpriteId = (kind: SeasonMarkKind): string => `season-${kind}`;

const plinth = (top: string, edge: string): string =>
  `<polygon points="6,51 32,64 58,51 58,53 32,66 6,53" fill="${edge}"/>` +
  `<polygon points="6,50 32,37 58,50 32,63" fill="${top}"/>`;

/** An upright ring of cyan fire around a violet swirl, standing on scorched ground. */
const GATE =
  plinth('#2a1030', '#160818') +
  `<ellipse cx="32" cy="50" rx="16" ry="6" fill="#b04cff" opacity="0.28"/>` +
  `<ellipse cx="32" cy="30" rx="12.5" ry="19" fill="#1a0624"/>` +
  `<ellipse cx="32" cy="30" rx="10" ry="16" fill="#6a1f9a" opacity="0.85"/>` +
  `<path d="M32 16 C41 20 40 34 32 36 C25 38 24 28 32 27 C37 26 37 32 33 32" fill="none" stroke="#e0a8ff" stroke-width="1.8" stroke-linecap="round"/>` +
  `<ellipse cx="32" cy="30" rx="12.5" ry="19" fill="none" stroke="#00d4ff" stroke-width="3"/>` +
  `<ellipse cx="32" cy="30" rx="15" ry="21.5" fill="none" stroke="#00d4ff" stroke-width="1" opacity="0.45"/>`;

/** A gold-capped monolith of old stone: the wonder is found, and it stands here. */
const WONDER =
  plinth('#3a3222', '#211c12') +
  `<polygon points="24,50 32,54 40,50 32,46" fill="#5a4f38"/>` +
  `<polygon points="26,49 26,18 32,14 32,52" fill="#8a8170"/>` +
  `<polygon points="32,52 32,14 38,18 38,49" fill="#5e5747"/>` +
  `<path d="M29 26 L29 42 M35 24 L35 40" stroke="#ffd700" stroke-width="1.2" opacity="0.7"/>` +
  `<circle cx="32" cy="10" r="6" fill="#ffd700" opacity="0.3"/><circle cx="32" cy="10" r="3.2" fill="#ffd700"/>`;

const BODY: Readonly<Record<SeasonMarkKind, string>> = { gate: GATE, wonder: WONDER };

export function seasonSvg(kind: SeasonMarkKind): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 2 64 64" width="${SEASON_SPRITE_PX}" height="${SEASON_SPRITE_PX}">${BODY[kind]}</svg>`;
}

export async function rasteriseSeasonMarks(): Promise<Map<string, ImageData> | null> {
  return rasteriseSvgs(SEASON_MARK_KINDS, seasonSvg, seasonSpriteId, SEASON_SPRITE_PX);
}
