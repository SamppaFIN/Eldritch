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

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
