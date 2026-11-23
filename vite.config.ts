import { defineConfig } from 'vite';

// Relative base so the built game runs from any folder (and later from a desktop wrapper).
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Narrative content is large and changes often: keep it in its own chunks, separate from the engine.
        manualChunks(id: string) {
          if (id.includes('/src/data/dialogue/prologue')) return 'content-prologue';
          if (id.includes('/src/data/companionQuests')) return 'content-companion-quests';
          if (id.includes('/src/data/dialogue/')) return 'content-companions';
          if (id.includes('/src/data/')) return 'content-data';
          if (id.includes('/src/ui/')) return 'ui';
          return undefined;
        },
      },
    },
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
