import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/mc-valuation-dashboard/', // MUST match GitHub repo name exactly
  worker: {
    format: 'es', // ESM workers supported in all modern browsers
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
});
