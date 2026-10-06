/**
 * The picture taken as a kingdom retires (BRDC-HALL-004, handoff F-31).
 *
 * The map is WebGL without `preserveDrawingBuffer`, so its pixels are only readable inside
 * a `render` callback; the HUD and markers are DOM, so `html-to-image` draws those, with the
 * retire dialog itself left out. The two are laid one over the other and kept as a JPEG,
 * the long side at most 1280 px. Any failure leaves the kingdom without a picture — the
 * retirement never waits on it or fails because of it.
 */
import { toCanvas } from 'html-to-image';
import type { Map as MapLibreMap } from 'maplibre-gl';

const MAX_SIDE = 1280;
const QUALITY = 0.8;
/** A slow phone still retires: past this the picture is given up. */
const GIVE_UP_MS = 6000;

/** The live map, as `useMap` exposes it. */
function liveMap(): MapLibreMap | null {
  return (globalThis as unknown as { __esMap?: MapLibreMap }).__esMap ?? null;
}

/** Copy the map's frame while it is still in the drawing buffer. */
function mapFrame(map: MapLibreMap): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    map.once('render', () => {
      const src = map.getCanvas();
      const copy = document.createElement('canvas');
      copy.width = src.width;
      copy.height = src.height;
      copy.getContext('2d')?.drawImage(src, 0, 0);
      resolve(copy);
    });
    map.triggerRepaint();
  });
}

/**
 * Everything drawn over the map, minus canvases (the map) and dialogs (the retire prompt).
 * The map's container and the body are opaque void behind the canvas; drawn as they are,
 * they would paint over the map frame, so they are cleared for the moment of the capture —
 * hidden behind the full-screen map, nobody sees them change.
 */
async function overlay(map: MapLibreMap, scale: number): Promise<HTMLCanvasElement> {
  const behind: HTMLElement[] = [];
  for (let el: HTMLElement | null = map.getContainer(); el; el = el.parentElement) behind.push(el);
  const saved = behind.map((el) => el.style.background);
  for (const el of behind) el.style.background = 'transparent';
  try {
    return await toCanvas(document.body, {
      pixelRatio: scale,
      filter: (node) =>
        !(node instanceof HTMLCanvasElement) &&
        !(node instanceof HTMLElement && (node.getAttribute('role') === 'dialog' || node.tagName === 'DIALOG')),
    });
  } finally {
    behind.forEach((el, i) => (el.style.background = saved[i] ?? ''));
  }
}

export async function captureRealm(): Promise<string | null> {
  const map = liveMap();
  if (!map) return null;
  const work = (async () => {
    const frame = await mapFrame(map);
    const w = window.innerWidth;
    const h = window.innerHeight;
    // CSS pixels to output pixels: the screen's density, until the long side reaches 1280.
    const scale = Math.min(window.devicePixelRatio || 1, MAX_SIDE / Math.max(w, h));
    const out = document.createElement('canvas');
    out.width = Math.round(w * scale);
    out.height = Math.round(h * scale);
    const ctx = out.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(frame, 0, 0, out.width, out.height);
    // The HUD is a nicety; a map without it is still the kingdom.
    await overlay(map, scale).then((o) => ctx.drawImage(o, 0, 0, out.width, out.height)).catch(() => {});
    return out.toDataURL('image/jpeg', QUALITY);
  })().catch(() => null);
  const late = new Promise<null>((resolve) => setTimeout(() => resolve(null), GIVE_UP_MS));
  return Promise.race([work, late]);
}
