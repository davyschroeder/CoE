import { defineConfig } from 'vite';

// Relative base so the built game runs from any folder (and later from a desktop wrapper).
export default defineConfig({
  base: './',
  build: { target: 'es2020', outDir: 'dist', sourcemap: true },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
