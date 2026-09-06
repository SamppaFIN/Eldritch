/**
 * The six banners as map icons (BRDC-BANNER-001, field report 2026-09-06).
 *
 * `Banner.tsx` draws them in the Keep as inline React SVG; the map needs a raster in its
 * image atlas. Same shapes, emitted as an SVG string and `map.addImage`d once — the exact
 * pattern `buildingSprites.ts` uses for the Work icons. Picking a banner in the Keep now
 * shows on every hex you hold.
 */
import { BANNER_IDS } from './nation.js';
import type { BannerId } from './nation.js';

/** Rendered size, device pixels. Small — it sits on one res-11 hex. */
export const BANNER_PX = 40;

/** id → the `map.addImage` name. */
export const bannerSpriteId = (id: BannerId): string => `banner-${id}`;

const GOLD = '#ffd700';
const CYAN = '#00d4ff';

/** The stroke shapes for one banner — the same geometry as `Banner.tsx#shape`. */
const SHAPE: Readonly<Record<BannerId, string>> = {
  vesica:
    `<circle cx="19" cy="24" r="13" stroke="${GOLD}"/><circle cx="29" cy="24" r="13" stroke="${CYAN}"/>`,
  heptagram: `<path stroke="${GOLD}" d="M24 5 L38 40 L9 18 L39 18 L10 40 Z M24 5 L34 43 L4 22 L44 22 L14 43 Z"/>`,
  chevron:
    `<path stroke="${GOLD}" d="M6 20 L24 8 L42 20"/><path stroke="${CYAN}" d="M6 32 L24 20 L42 32"/><path stroke="${GOLD}" d="M6 42 L24 30 L42 42"/>`,
  pale: `<path stroke="${GOLD}" d="M24 4 V44"/><path stroke="${CYAN}" d="M12 4 V44"/><path stroke="${CYAN}" d="M36 4 V44"/>`,
  eye: `<path stroke="${GOLD}" d="M4 24 C14 10 34 10 44 24 C34 38 14 38 4 24 Z"/><circle cx="24" cy="24" r="6" stroke="${CYAN}"/>`,
  triquetra:
    `<circle cx="24" cy="16" r="11" stroke="${GOLD}"/><circle cx="15" cy="31" r="11" stroke="${GOLD}"/><circle cx="33" cy="31" r="11" stroke="${GOLD}"/>`,
};

export function bannerSvg(id: BannerId): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${BANNER_PX}" height="${BANNER_PX}">` +
    `<g fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${SHAPE[id]}</g></svg>`
  );
}

/**
 * Rasterise every banner to an `ImageData`, keyed by `bannerSpriteId`. `null` on a
 * platform with no 2D canvas (a test runner) — the caller no-ops. Real Chromium resolves.
 */
export async function rasteriseBanners(): Promise<Map<string, ImageData> | null> {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = BANNER_PX;
  canvas.height = BANNER_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const out = new Map<string, ImageData>();
  await Promise.all(
    BANNER_IDS.map(async (id) => {
      const img = new Image(BANNER_PX, BANNER_PX);
      img.src = `data:image/svg+xml;utf8,${encodeURIComponent(bannerSvg(id))}`;
      try {
        await img.decode();
      } catch {
        return;
      }
      ctx.clearRect(0, 0, BANNER_PX, BANNER_PX);
      ctx.drawImage(img, 0, 0, BANNER_PX, BANNER_PX);
      out.set(bannerSpriteId(id), ctx.getImageData(0, 0, BANNER_PX, BANNER_PX));
    }),
  );
  return out.size > 0 ? out : null;
}
