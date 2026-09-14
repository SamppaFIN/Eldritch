/**
 * One picture at a time, into a canvas that expects to be read back.
 *
 * Every sprite family in the game — banners, terrain, bounties, buildings — turns an SVG
 * string into `ImageData` for `map.addImage`. All four did it the same way, and that way
 * had two faults. The field report is what they cost (Infinite, S23 Ultra: *"kännyllä ei
 * kartta avaudu"* — works on desktop, the map never opens on the phone).
 *
 * **One context, shared across concurrent tasks.** Each family ran `Promise.all` over its
 * ids, and every task did `clearRect` → `drawImage` → `getImageData` on the *same*
 * context. `await img.decode()` yields, so one task's clear can land between another's
 * draw and its read: a sprite comes back blank, or wearing its neighbour's picture.
 * Desktop decodes tiny data-URI SVGs in near-lockstep and mostly got away with it, which
 * is exactly why it survived to here.
 *
 * **And there were forty-odd of them at once, on the main thread, at map open.** Chromium
 * says it out loud in the console: *"Multiple readback operations using getImageData are
 * faster with the willReadFrequently attribute set to true"*, and *"GPU stall due to
 * ReadPixels"*. Measured on the 360 px project: an import that takes seconds on desktop
 * took 20–22 s while this was going on.
 *
 * So: one at a time, into a context that knows it will be read. Sequential is not the
 * slower choice — forty parallel decodes contend for the one main thread regardless, and
 * arrive as a single unbroken stall rather than forty interruptible ones.
 *
 * Returns `null` where there is no canvas at all (the test runner), which is the signal
 * every caller already uses to keep its text-glyph fallback.
 */
export async function rasteriseSvgs<T extends string>(
  ids: readonly T[],
  svgOf: (id: T) => string,
  spriteIdOf: (id: T) => string,
  px: number,
): Promise<Map<string, ImageData> | null> {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  // The hint is the whole point of this file's existence on a phone.
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const out = new Map<string, ImageData>();
  for (const id of ids) {
    const img = new Image(px, px);
    img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgOf(id))}`;
    try {
      await img.decode();
    } catch {
      // One unreadable sprite is not worth losing the rest of the family over.
      continue;
    }
    ctx.clearRect(0, 0, px, px);
    ctx.drawImage(img, 0, 0, px, px);
    out.set(spriteIdOf(id), ctx.getImageData(0, 0, px, px));
  }
  return out.size > 0 ? out : null;
}
