import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Ship MapLibre's tile-parsing worker.
 *
 * MapLibre 6 finds its worker with `new URL('./maplibre-gl-worker.mjs', import.meta.url)`.
 * Rollup cannot see a URL assembled from a string, so neither the worker nor the shared
 * chunk it imports is emitted. The worker then fetches the SPA fallback HTML, dies
 * parsing it, and the map goes quiet in the worst possible way: style loads, TileJSON
 * loads, no error is raised, and not one tile is ever requested.
 *
 * Both files are emitted under their original names so MapLibre's own resolution finds
 * them, and so the worker's `./maplibre-gl-shared.mjs` import resolves alongside it.
 */
function maplibreWorker(): Plugin {
  const require = createRequire(import.meta.url);
  const dist = dirname(require.resolve('maplibre-gl/dist/maplibre-gl.mjs'));

  return {
    name: 'es3:maplibre-worker',
    apply: 'build',
    generateBundle() {
      for (const name of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
        this.emitFile({
          type: 'asset',
          fileName: `assets/${name}`,
          source: readFileSync(join(dist, name), 'utf8'),
        });
      }
    },
  };
}

// VITE_BASE_PATH lets the same build serve from a GitHub Pages sub-path
// and from the root inside Capacitor (Phase 5).
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    maplibreWorker(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Eldritch Sanctuary',
        short_name: 'Sanctuary',
        description: 'Walk a closed loop. Claim the ground inside it.',
        theme_color: '#0a0612',
        background_color: '#0a0612',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
      },
    }),
  ],
  /*
   * Serve MapLibre straight from node_modules in dev.
   *
   * The dep optimiser rewrites it into .vite/deps, which breaks the sibling layout its
   * worker resolution depends on — the same silent failure the build plugin above fixes
   * for production. Dev matters here specifically: the WASD walk simulator only exists
   * in dev builds, so a dev map that never loads means the simulator can never be used.
   */
  optimizeDeps: { exclude: ['maplibre-gl'] },
  // MapLibre parses tiles in a Web Worker built from ES modules. Without this the
  // worker is emitted as IIFE, dies on its first import, and the map goes quiet:
  // style loads, TileJSON loads, and then no tile is ever requested.
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
