import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 3001,
    open: true
  },
  build: {
    assetsInlineLimit: 0
  }
});
