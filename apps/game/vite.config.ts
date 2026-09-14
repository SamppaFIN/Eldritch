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
      /*
       * What the phone must already have before it walks out of range.
       *
       * Workbox's default glob is `**\/*.{js,css,html,ico,png,svg}` — which quietly
       * leaves out the two files MapLibre needs most: `maplibre-gl-worker.mjs` and the
       * `maplibre-gl-shared.mjs` it imports (emitted under fixed names by the plugin
       * above, because MapLibre resolves them by URL). Everything else was precached, so
       * the app shell opened offline and then asked the network for its tile worker.
       *
       * Field report, S23 Ultra (BRDC-MOBILE-004): *"desktopilla toimii, mutta kännyllä
       * ei kartta avaudu"*. That is this file's own documented failure, twice over:
       * style loads, TileJSON loads, and not one tile is ever requested. A desktop on
       * office wifi fetches the worker and never notices.
       *
       * Fonts go in for the same reason — §9's Phase 1 gate is *walk ten minutes in
       * airplane mode*, and a game that needs the network to draw its own words has not
       * passed it. `woff2` only: every browser that can run this build reads it, and
       * precaching `woff` as well would double the type weight for nobody.
       */
      workbox: {
        globPatterns: ['**/*.{js,mjs,css,html,svg,webmanifest,woff2}'],
      },
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
        /*
         * One SVG, marked maskable as well as any.
         *
         * The palette is fixed and the mark is a stroke drawing, so there is nothing a
         * raster set would add except four more files to keep in step. Android will
         * rasterise it when the game is added to a home screen.
         */
        icons: [
          { src: `${base}icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: `${base}icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
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
