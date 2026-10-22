
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': projectRoot,
    },
  },

  server: {
    // HMR can be disabled in AI Studio when required.
    hmr: process.env.DISABLE_HMR !== 'true',

    // Disable file watching only when explicitly requested.
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
