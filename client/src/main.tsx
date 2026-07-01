// microvm first: patches window.WebSocket before colyseus.js (pulled in by App) loads.
import { initMicrovm } from './network/microvm';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Load the MicroVM endpoint+token and patch WebSocket before the app can
// connect. If config fails to load, still render (single-player works offline).
initMicrovm().catch((e) => console.warn('[microvm] config load failed', e)).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
