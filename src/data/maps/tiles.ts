export interface TileDef {
  name: string;
  walk: boolean;
  los: boolean;        // true = blocks line of sight
  difficult?: boolean;
  cover?: 1 | 2;       // 1 = half cover (+2 AC), 2 = full (blocks)
  hazard?: { damage: string; type: 'fire' | 'acid' | 'necrotic' };
  high?: boolean;      // elevated: +2 to ranged attacks against lower targets
  light?: number;      // emits light (radius)
  floorOnly?: boolean;
}

export const TILES: Record<string, TileDef> = {
  '#': { name: 'Stone wall', walk: false, los: true, cover: 2 },
  'W': { name: 'Building', walk: false, los: true, cover: 2 },
  '.': { name: 'Floor', walk: true, los: false },
  ',': { name: 'Grass', walk: true, los: false },
  '=': { name: 'Cobblestones', walk: true, los: false },
  ':': { name: 'Dirt path', walk: true, los: false },
  '~': { name: 'Deep water', walk: false, los: false },
  'w': { name: 'Shallow water', walk: true, los: false, difficult: true },
  'T': { name: 'Tree', walk: false, los: true, cover: 2 },
  't': { name: 'Thicket', walk: true, los: false, difficult: true, cover: 1 },
  '%': { name: 'Rubble', walk: true, los: false, difficult: true, cover: 1 },
  'c': { name: 'Crates', walk: false, los: false, cover: 1 },
  'b': { name: 'Barrel of lamp oil', walk: false, los: false, cover: 1 },
  'f': { name: 'Brazier', walk: false, los: false, light: 4 },
  'F': { name: 'Burning ground', walk: true, los: false, hazard: { damage: '1d6', type: 'fire' }, light: 2 },
  'a': { name: 'Pool of ichor', walk: true, los: false, difficult: true, hazard: { damage: '1d6', type: 'acid' } },
  'h': { name: 'Raised dais', walk: true, los: false, high: true },
  'D': { name: 'Door', walk: true, los: false },
  '+': { name: 'Pews', walk: true, los: false, difficult: true, cover: 1 },
  'A': { name: 'Altar', walk: false, los: false, cover: 1 },
  'P': { name: 'Pillar', walk: false, los: true, cover: 2 },
  'g': { name: 'Gravestone', walk: false, los: false, cover: 1 },
  'l': { name: 'Lantern post', walk: false, los: false, light: 3 },
  'o': { name: 'Old well', walk: false, los: false, cover: 1 },
  'n': { name: 'Fence', walk: false, los: false, cover: 1 },
  'B': { name: 'Furniture', walk: false, los: false, cover: 1 },
  'K': { name: 'Table', walk: false, los: false, cover: 1 },
  'v': { name: 'Chasm', walk: false, los: false },
  's': { name: 'Stairs', walk: true, los: false },
  'x': { name: 'Bone pile', walk: true, los: false, difficult: true },
  '_': { name: 'Wooden planks', walk: true, los: false },
  'L': { name: 'The Lantern Tree', walk: false, los: true, light: 5, cover: 2 },
};

export function tile(ch: string): TileDef {
  return TILES[ch] ?? TILES['#'];
}
