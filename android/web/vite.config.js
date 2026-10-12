import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
    outDir: '../app/src/main/assets/www',
    emptyOutDir: true,
    assetsDir: 'assets'
  }
});
