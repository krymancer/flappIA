import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // Relative base so the built app works both locally and under the GitHub
  // Pages project subpath (https://<user>.github.io/flappIA/).
  base: './',
  // Static assets (sprites, audio, favicon) live in public/ and are copied
  // verbatim into dist/ on build; referenced at runtime by relative URL.
  publicDir: 'public',
  build: { outDir: 'dist' },
  server: { open: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
});
