import { describe, expect, it } from 'vitest';
import { MAPS } from '../src/data/maps/prologue';
import type { MapDef } from '../src/data/maps/types';
import { activeGrid, findPath, getMap, isPassable } from '../src/engine/exploration';
import { mapArchitecture } from '../src/ui/render/mapArchitecture';
import { makeGame } from './helpers';

const layouts = MAPS.flatMap(map => [
  { label: map.id, map, grid: map.grid },
  ...(map.variants ?? []).map(v => ({ label: `${map.id}:${v.if}`, map, grid: v.grid })),
]);

describe('isometric map architecture', () => {
  it.each(layouts)('$label roofs only complete footprints and preserves door tiles', ({ map, grid }) => {
    const before = [...grid];
    const { buildings, covered } = mapArchitecture(map, grid);
    const width = grid[0].length;
    const expectedCovered = new Set<number>();
    for (const b of buildings) {
      const doors: { x: number; y: number }[] = [];
      for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) {
        const ch = grid[y][x];
        expect(['W', 'D'], `${map.id} roof over ${ch} at ${x},${y}`).toContain(ch);
        if (ch === 'W') expectedCovered.add(y * width + x);
        else {
          expect(x === b.x || y === b.y || x === b.x + b.w - 1 || y === b.y + b.h - 1).toBe(true);
          expect(covered.has(y * width + x)).toBe(false);
          doors.push({ x, y });
        }
      }
      expect(b.doors).toEqual(doors);
    }
    expect(covered).toEqual(expectedCovered);
    expect(grid).toEqual(before);
    if (!grid.some(row => row.includes('W'))) expect(buildings).toEqual([]);
  });

  it('groups all eight Hollowmere buildings at their full authored footprints', () => {
    const map = getMap('hollowmere');
    const { buildings, covered } = mapArchitecture(map, map.grid);
    expect(buildings.map(({ x, y, w, h, id }) => ({ x, y, w, h, id }))).toEqual([
      { x: 29, y: 3, w: 6, h: 5, id: 'watch_house' },
      { x: 15, y: 4, w: 7, h: 6, id: 'town_hall' },
      { x: 38, y: 4, w: 6, h: 5, id: 'mill_door' },
      { x: 5, y: 10, w: 10, h: 6, id: 'inn_door' },
      { x: 34, y: 11, w: 6, h: 5, id: 'smithy_door' },
      { x: 34, y: 18, w: 6, h: 4, id: 'quill_door' },
      { x: 10, y: 19, w: 5, h: 4, id: 'pell_house' },
      { x: 4, y: 24, w: 6, h: 5, id: 'wenna_door' },
    ]);
    expect(covered.size).toBe(map.grid.join('').split('W').length - 1);
    for (const b of buildings) {
      const entrance = map.objects.find(o => o.id === b.id)!;
      expect(b.doors).toContainEqual({ x: entrance.x, y: entrance.y });
    }
    expect(isPassable(makeGame(), map, 10, 15)).toBe(true);
  });

  it.each(['.', '#', 'D', 'n'])('never fills a small interior %s gap with a roof', gap => {
    // A single missing cell is over 98% solid: area thresholds incorrectly roof it.
    const grid = Array.from({ length: 9 }, (_, y) => y === 4 ? `WWWW${gap}WWWW` : 'WWWWWWWWW');
    const map: MapDef = { ...getMap('hollowmere'), id: `courtyard-${gap}`, grid, objects: [] };
    expect(mapArchitecture(map, grid).buildings).toEqual([]);
    expect(mapArchitecture(map, grid).covered.size).toBe(0);
  });

  it('leaves the irregular garrison and Valdros streets as native tile architecture', () => {
    const ashenford = getMap('ashenford');
    const garrison = mapArchitecture(ashenford, ashenford.grid);
    expect(garrison.buildings).toHaveLength(9);
    expect(garrison.buildings.some(b => b.x === 3 && b.y === 2)).toBe(false);
    const state = makeGame(), valdros = getMap('valdros');
    state.flags.valdros_reality = 'inhabited';
    const grid = activeGrid(state, valdros);
    const inhabited = mapArchitecture(valdros, grid);
    expect(inhabited.buildings.map(({ x, y, w, h }) => ({ x, y, w, h }))).toEqual([{ x: 32, y: 6, w: 9, h: 7 }]);
    for (const x of [16, 17, 18, 19, 20, 27, 28, 29, 30, 31]) {
      expect(grid[24][x]).toBe('.');
      expect(inhabited.buildings.some(b => x >= b.x && x < b.x + b.w && 24 >= b.y && 24 < b.y + b.h)).toBe(false);
    }
  });

  it('follows each active Valdros reality without hiding its route into the Dome', () => {
    const state = makeGame(), map = getMap('valdros');
    const doors = { inhabited: [23, 3], flooded: [31, 7], burning: [17, 3] } as const;
    const base = mapArchitecture(map, activeGrid(state, map));
    expect(base.buildings).toEqual([]);
    for (const [reality, [x, y]] of Object.entries(doors)) {
      state.flags.valdros_reality = reality;
      const grid = activeGrid(state, map);
      const before = findPath(state, map, 23, 37, x, y);
      const architecture = mapArchitecture(map, grid);
      expect(before, reality).not.toBeNull();
      expect(findPath(state, map, 23, 37, x, y)).toEqual(before);
      for (const p of before!) expect(architecture.buildings.some(b => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h)).toBe(false);
      expect(architecture).not.toBe(base);
    }
    delete state.flags.valdros_reality;
    expect(activeGrid(state, map)).toBe(map.grid);
    expect(mapArchitecture(map, activeGrid(state, map))).toBe(base);
  });
});
