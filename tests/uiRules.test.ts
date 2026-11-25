/** Interface rules that keep the game working inside embedded views (the online artifact, app web views). */
import { describe, it, expect } from 'vitest';

const SOURCES = import.meta.glob('../src/**/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

describe('interface rules', () => {
  it('never uses the browser\'s blocking dialogs (embedded views answer them with "no" or nothing)', () => {
    for (const [file, text] of Object.entries(SOURCES)) {
      const code = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      expect(code, file).not.toMatch(/(^|[^\w.])(window\.)?(confirm|alert|prompt)\s*\(/m);
    }
  });
});
