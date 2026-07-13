import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'assets-public', // non-existent dir on purpose: keep Vite from copying; we reference /assets directly
  build: { outDir: 'dist' },
  server: { open: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
});
