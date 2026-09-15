/**
 * Whether a map was removed while something was waiting on it (BRDC-SIGIL-006).
 *
 * The sprite loaders await rasterisation and then write into the map's image atlas. If the
 * map is removed in between — an unmount, or an error thrown elsewhere in the same effect —
 * `map.remove()` has already run `setStyle(null)`, and `hasImage` reads `this.style`:
 * "Cannot read properties of undefined (reading 'getImage')", uncaught, because the loaders
 * run as `void` promises. Infinite's console showed exactly that after a crash.
 *
 * The signal is MapLibre's public `remove` event (fired by `remove()` itself), not the
 * private `_removed` flag, so it survives an upgrade that renames the internal.
 */
import type { Map as MapLibreMap } from 'maplibre-gl';

export interface RemovalWatch {
  /** True once the map fired `remove` after the watch began. */
  gone: () => boolean;
  /** Stop listening — call it as soon as the awaited work is back. */
  stop: () => void;
}

export function watchRemoval(map: Pick<MapLibreMap, 'on' | 'off'>): RemovalWatch {
  let removed = false;
  const onRemove = (): void => {
    removed = true;
  };
  map.on('remove', onRemove);
  return {
    gone: () => removed,
    stop: () => {
      map.off('remove', onRemove);
    },
  };
}
