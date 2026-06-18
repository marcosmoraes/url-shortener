import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from './Analytics.js';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Analytics />
    </StrictMode>,
  );
}
