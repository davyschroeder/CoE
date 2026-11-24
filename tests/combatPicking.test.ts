import { describe, it, expect } from 'vitest';
import { CombatScreen } from '../src/ui/screens/combat';
import { createIsoView, isoPoint } from '../src/ui/render/isometric';

// Exercise the real screen picker without a browser. The tactical rules operate
// on integer world cells, while creature artwork rises above those cells.
function screen(width = 72) {
  const screen = Object.create(CombatScreen.prototype) as any;
  screen.canvas = { getBoundingClientRect: () => ({ left: 17, top: 23 }) };
  screen.view = createIsoView(1440, 900, 12.5, 8.5, width);
  screen.ts = width;
  screen.disp = new Map();
  screen.selected = null;
  screen.cb = { combatants: [], objects: [], tileChar: () => '.' };
  return screen;
}

function mouse(x: number, y: number): MouseEvent { return { clientX: x + 17, clientY: y + 23 } as MouseEvent; }
function actor(id: string, x: number, y: number) {
  return { id, x, y, side: 'enemy', removed: false, char: { hp: 10, creatureType: 'humanoid' } };
}

describe('isometric combat targeting', () => {
  it('picks the same world cells after zoom and camera panning', () => {
    for (const width of [24, 48, 72, 128]) {
      const s = screen(width);
      s.view.originX += 137; s.view.originY -= 63;
      for (const [x, y] of [[0, 0], [8, 15], [12, 8], [21, 29]]) {
        const p = isoPoint(x, y, s.view);
        expect(s.toTile(mouse(p.x, p.y))).toEqual({ x, y });
      }
    }
  });

  it('targets the body above its tile instead of the floor behind its head', () => {
    const s = screen();
    s.cb.combatants = [actor('guard', 12, 8)];
    const p = isoPoint(12, 8, s.view);
    expect(s.toTile(mouse(p.x + 5, p.y - s.ts * 0.7))).toEqual({ x: 12, y: 8 });
  });

  it('uses the visual position while movement is interpolating', () => {
    const s = screen();
    s.cb.combatants = [actor('guard', 14, 8)];
    s.disp.set('guard', { x: 12.3, y: 8, queue: [{ x: 13, y: 8 }] });
    const p = isoPoint(12.3, 8, s.view);
    expect(s.toTile(mouse(p.x, p.y - s.ts * 0.6))).toEqual({ x: 14, y: 8 });
  });

  it('does not snap area spells and teleport destinations to raised creature art', () => {
    const s = screen();
    s.cb.combatants = [actor('guard', 12, 8)];
    const p = isoPoint(12, 8, s.view);
    for (const selected of [{ target: 'point' }, { target: 'enemy', area: { shape: 'radius' } }]) {
      s.selected = selected;
      expect(s.toTile(mouse(p.x, p.y - s.ts * 0.5))).toEqual({ x: 11, y: 7 });
    }
  });

  it('ignores removed enemies and gives frontmost overlapping figures priority', () => {
    const s = screen();
    s.cb.combatants = [actor('behind', 12, 8), actor('front', 13, 9)];
    const p = isoPoint(13, 9, s.view);
    expect(s.toTile(mouse(p.x, p.y - s.ts * 0.6))).toEqual({ x: 13, y: 9 });
    s.cb.combatants[1].removed = true;
    expect(s.toTile(mouse(p.x, p.y - s.ts * 0.6))).toEqual({ x: 12, y: 8 });
  });

  it('allows targeting a fallen companion by its still visible silhouette', () => {
    const s = screen(), fallen = actor('fallen', 12, 8);
    fallen.side = 'party'; fallen.char.hp = 0;
    s.cb.combatants = [fallen]; s.selected = { target: 'ally' };
    const p = isoPoint(12, 8, s.view);
    expect(s.toTile(mouse(p.x, p.y - s.ts * .65))).toEqual({ x: 12, y: 8 });
  });

  it('targets destructible object art but leaves point spells on the floor', () => {
    const s = screen();
    s.cb.objects = [{ x: 12, y: 8, kind: 'pillar', destroyed: false }];
    const p = isoPoint(12, 8, s.view), click = mouse(p.x, p.y - s.ts * .55);
    expect(s.toTile(click)).toEqual({ x: 12, y: 8 });
    s.selected = { target: 'point' };
    expect(s.toTile(click)).toEqual({ x: 11, y: 7 });
    s.selected = null; s.cb.objects[0].destroyed = true;
    expect(s.toTile(click)).toEqual({ x: 11, y: 7 });
  });
});
