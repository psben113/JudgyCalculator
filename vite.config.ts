import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the built popup works from the extension's dist/ root.
  base: './',
  build: {
    rollupOptions: {
      input: 'popup.html',
    },
  },
});
