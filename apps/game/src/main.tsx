import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/800.css';
import '@fontsource/orbitron/400.css';
import '@fontsource/inter/400.css';
import '@es3/ui/tokens.css';
import { App } from './app/App.js';

const host = document.getElementById('root');
if (!host) throw new Error('Root element missing from index.html');

document.documentElement.dataset['theme'] = 'cosmic';

/*
 * Make a new deploy actually reach the phone.
 *
 * The service worker is `registerType: 'autoUpdate'` with `clientsClaim`, so a fresh
 * build installs and takes control in the background — but a standalone PWA can stay
 * open for days without ever reloading, so the running session keeps the old bundle.
 * Field testers were stuck on stale code for that reason. Reload once, the moment the
 * new worker takes over; the guard skips the first install and any reload loop.
 */
if ('serviceWorker' in navigator) {
  // False on the very first visit, so the initial install does not trigger a reload.
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !hadController) return;
    reloading = true;
    window.location.reload();
  });
}

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
