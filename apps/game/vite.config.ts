import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// VITE_BASE_PATH lets the same build serve from a GitHub Pages sub-path
// and from the root inside Capacitor (Phase 5).
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
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
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
