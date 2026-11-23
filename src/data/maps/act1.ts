import type { MapDef } from './types';
import { GRIDS } from './grids';

const WORLD = { map: 'world', x: 0, y: 0 };

export const WOODS_MAP: MapDef = {
  id: 'woods', name: 'The Whispering Woods', tileset: 'forest', grid: GRIDS.woods, hub: 'woods',
  lighting: [{ value: 'dusk' }], instability: [{ value: 4 }], music: [{ value: 'forest' }],
  enter: [{ text: 'The Whispering Woods close around the road like a held breath. The wind in the leaves sounds almost like voices — half a word here, a name there — and the path is not quite where the woodcutters’ red cords say it should be.' }],
  randomEncounters: { if: 'chapter:act1', chance: 0.008, encounters: ['a1_enc_gloam', 'a1_enc_wolves'], max: 3 },
  camp: 'true', campDanger: 0.25,
  objects: [
    { id: 'woods_exit_west', kind: 'exit', name: 'Road to Hollowmere (travel)', x: 0, y: 20, h: 2, to: WORLD },
    { id: 'woods_exit_east', kind: 'exit', name: 'The Old Path (travel)', x: 55, y: 20, h: 2, to: WORLD },
  ],
};

export const ASHENFORD_MAP: MapDef = {
  id: 'ashenford', name: 'Ashenford', tileset: 'town', grid: GRIDS.ashenford, hub: 'ashenford',
  lighting: [{ value: 'day' }], instability: [{ value: 1 }], music: [{ value: 'city' }],
  enter: [{ text: 'Ashenford smells of coal-smoke, river mud and hot glass. Barges crowd the Sillow; Covenant tax-men in iron-grey coats count everything that moves; and above the rooftops the kiln-chimneys of the glassworks breathe orange into a pewter sky.' }],
  camp: 'true', campDanger: 0,
  objects: [
    { id: 'ash_exit_north', kind: 'exit', name: 'North Road (travel)', x: 26, y: 0, w: 3, to: WORLD },
    { id: 'ash_exit_south', kind: 'exit', name: 'South Road (travel)', x: 26, y: 39, w: 3, to: WORLD },
  ],
};

export const VALDROS_MAP: MapDef = {
  id: 'valdros', name: 'The Ruins of Valdros', tileset: 'ruins', grid: GRIDS.valdros, hub: 'valdros',
  variants: [
    { if: 'valdros_reality=flooded', grid: GRIDS['valdros@flooded'] },
    { if: 'valdros_reality=burning', grid: GRIDS['valdros@burning'] },
    { if: 'valdros_reality=inhabited', grid: GRIDS['valdros@inhabited'] },
  ],
  lighting: [{ if: 'valdros_reality=burning', value: 'dusk' }, { value: 'day' }],
  instability: [{ value: 7 }], music: [{ value: 'ruins' }],
  enter: [{ text: 'White spires strangled by roots. Cracked mosaics of a city that ruled half the world. And under it all a hum, like a held note — as you watch, a broken wall is whole for a heartbeat, then broken again. Valdros is not quite sure which Valdros it is.' }],
  randomEncounters: { if: 'chapter:act1 && !valdros_done', chance: 0.01, encounters: ['a1_enc_echoes_valdros'], max: 2 },
  camp: '!valdros_ambush_started', campDanger: 0.35,
  objects: [
    { id: 'valdros_exit_south', kind: 'exit', name: 'Leave the ruins (travel)', x: 22, y: 38, w: 4, to: WORLD },
    { id: 'dome_door', kind: 'exit', name: 'The Great Doors of the Senate Dome', x: 23, y: 3, w: 2, if: 'valdros_reality=inhabited', to: { map: 'valdros_dome', x: 16, y: 25 } },
    { id: 'dome_culvert', kind: 'exit', name: 'Flooded Culvert under the Dome', x: 31, y: 7, if: 'valdros_reality=flooded', to: { map: 'valdros_dome', x: 29, y: 12 } },
    { id: 'dome_breach', kind: 'exit', name: 'Breach in the Burning Wall', x: 17, y: 3, if: 'valdros_reality=burning', to: { map: 'valdros_dome', x: 2, y: 12 } },
  ],
};

export const VALDROS_DOME_MAP: MapDef = {
  id: 'valdros_dome', name: 'The Senate Dome of Valdros', tileset: 'dome', grid: GRIDS.valdros_dome,
  lighting: [{ value: 'dark' }], instability: [{ value: 8 }], music: [{ if: '!ossaryx_resolved', value: 'boss' }, { value: 'ruins' }],
  enter: [{ text: 'Tier upon tier of stone benches descend toward a dais where the Anchor stands: a column of black glass veined with failing light. Ten thousand senators once argued here about the shape of the world. Now there is only the hum — and, beneath it, something very large breathing on the other side of reality.' }],
  objects: [
    { id: 'dome_exit_south', kind: 'exit', name: 'Back into Valdros', x: 14, y: 27, w: 5, to: { map: 'valdros', x: 23, y: 6 } },
    { id: 'dome_exit_west', kind: 'exit', name: 'Back through the breach', x: 1, y: 12, to: { map: 'valdros', x: 18, y: 5 } },
    { id: 'dome_exit_east', kind: 'exit', name: 'Back through the culvert', x: 30, y: 12, to: { map: 'valdros', x: 30, y: 7 } },
  ],
};

export const ACT1_MAPS: MapDef[] = [WOODS_MAP, ASHENFORD_MAP, VALDROS_MAP, VALDROS_DOME_MAP];
