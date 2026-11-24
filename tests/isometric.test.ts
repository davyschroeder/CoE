import { describe, expect, it } from 'vitest';
import { createIsoView, isoPoint, isoTileAt, miniatureIndex } from '../src/ui/render/isometric';

describe('isometric picking', () => {
  it('maps every centre back to its tile at several zoom levels and camera positions', () => {
    for (const width of [32, 60, 76, 112]) for (const [cx, cy] of [[0, 0], [25, 31], [4.27, 19.83]]) {
      const view = createIsoView(1366, 768, cx, cy, width, -45);
      for (let y = -4; y < 35; y += 3) for (let x = -4; x < 55; x += 3) {
        const p = isoPoint(x, y, view);
        expect(isoTileAt(p.x, p.y, view)).toEqual({ x, y });
        const inside = isoPoint(x + .4, y - .4, view);
        expect(isoTileAt(inside.x, inside.y, view)).toEqual({ x, y });
      }
    }
  });
  it('moves to the adjacent tile when a diamond edge is crossed', () => {
    const view = createIsoView(1920, 1080, 9, 12, 80);
    for (const [x, y, expected] of [[3.51, 6, { x: 4, y: 6 }], [3, 5.49, { x: 3, y: 5 }]] as const) {
      const p = isoPoint(x, y, view);
      expect(isoTileAt(p.x, p.y, view)).toEqual(expected);
    }
  });
  it('uses monster identity for the miniature instead of the letter glyph', () => {
    expect(miniatureIndex(undefined, '', 'fog_hound')).toBe(12);
    expect(miniatureIndex(undefined, '', 'hollow_echo')).toBe(13);
    expect(miniatureIndex(undefined, '', 'ossuary_guard')).toBe(9);
    expect(miniatureIndex(undefined, '', 'corvin')).toBeNull();
  });
});
