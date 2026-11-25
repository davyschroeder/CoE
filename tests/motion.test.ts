import { describe, it, expect } from 'vitest';
import { walkToward, WALK_MS_PER_TILE, COMBAT_WALK_MS } from '../src/ui/render/motion';

describe('walking pace', () => {
  it('takes WALK_MS_PER_TILE to cross one tile, straight or diagonal, at a steady speed', () => {
    for (const [tx, ty] of [[1, 0], [1, 1]]) {
      const p = { x: 0, y: 0 };
      let t = 0, half: { x: number; y: number } | null = null;
      while (!walkToward(p, tx, ty, 16)) { t += 16; if (!half && t >= WALK_MS_PER_TILE / 2) half = { ...p }; }
      t += 16;
      expect(t).toBeGreaterThanOrEqual(WALK_MS_PER_TILE);
      expect(t).toBeLessThan(WALK_MS_PER_TILE + 32);
      expect(half!.x).toBeCloseTo(tx / 2, 1); // linear, not a jump followed by a crawl
      expect(p).toEqual({ x: tx, y: ty });
    }
  });

  it('is slower than before (110 ms a tile) and instant only when combat animation is off', () => {
    expect(WALK_MS_PER_TILE).toBeGreaterThanOrEqual(250);
    const p = { x: 0, y: 0 };
    expect(walkToward(p, 3, 2, 1, COMBAT_WALK_MS.instant)).toBe(true);
    expect(p).toEqual({ x: 3, y: 2 });
  });
});
