import type { MapDef } from '../../data/maps/types';

/** Art follows collision geometry. Never move an entrance or conceal a route to a quest. */
export interface BuildingFootprint {
  x: number; y: number; w: number; h: number; id: string;
  /** Actual perimeter door tiles, in map coordinates rather than facade offsets. */
  doors?: { x: number; y: number }[];
}
export interface MapArchitecture { buildings: BuildingFootprint[]; covered: Set<number>; }
const cache = new WeakMap<MapDef, WeakMap<string[], MapArchitecture>>();

export function mapArchitecture(map: MapDef, grid: string[]): MapArchitecture {
  let mapCache = cache.get(map);
  if (!mapCache) { mapCache = new WeakMap(); cache.set(map, mapCache); }
  const saved = mapCache.get(grid);
  if (saved) return saved;
  const width = grid[0].length;
  const visited = new Set<number>();
  const covered = new Set<number>();
  const buildings: BuildingFootprint[] = [];
  // W is a solid external building footprint. Interior wall # remains individually rendered.
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < width; x++) {
    if (grid[y][x] !== 'W' || visited.has(y * width + x)) continue;
    const queue: [number, number][] = [[x, y]];
    const cells: [number, number][] = [];
    visited.add(y * width + x);
    for (let i = 0; i < queue.length; i++) {
      const [cx, cy] = queue[i];
      cells.push([cx, cy]);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = cx + dx, ny = cy + dy, key = ny * width + nx;
        if (grid[ny]?.[nx] === 'W' && !visited.has(key)) { visited.add(key); queue.push([nx, ny]); }
      }
    }
    const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
    const bx = Math.min(...xs), by = Math.min(...ys);
    const w = Math.max(...xs) - bx + 1, h = Math.max(...ys) - by + 1;
    // Only complete rectangular footprints receive a roof. Even one courtyard,
    // room, fence or walkable gap must remain visible as native tile architecture.
    let complete = w >= 2 && h >= 2;
    const doors: { x: number; y: number }[] = [];
    for (let yy = by; yy < by + h; yy++) for (let xx = bx; xx < bx + w; xx++) {
      const ch = grid[yy][xx];
      if (ch === 'W') continue;
      if (ch === 'D' && (xx === bx || xx === bx + w - 1 || yy === by || yy === by + h - 1)) doors.push({ x: xx, y: yy });
      else complete = false;
    }
    if (!complete) continue;
    const door = map.objects.find(o => o.x >= bx - 1 && o.x <= bx + w && o.y >= by - 1 && o.y <= by + h && /door|mill|forge|hall|inn|house/i.test(o.id + o.name));
    buildings.push({ x: bx, y: by, w, h, id: door?.id ?? `${map.id}-building-${bx}-${by}`, doors });
    for (const [cx, cy] of cells) covered.add(cy * width + cx);
  }
  const out = { buildings, covered };
  mapCache.set(grid, out);
  return out;
}
