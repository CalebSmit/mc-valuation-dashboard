import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { registerChartDefaults } from './utils/chartConfig';

// Register Chart.js components and global dark theme defaults
registerChartDefaults();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in DOM.');
}

createRoot(rootElement).render(
  <StrictMode>
    {/* HashRouter ensures direct links work on GitHub Pages static hosting */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
