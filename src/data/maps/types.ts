import type { Cond, DText, Effect } from '../schema';
import type { Ability, DamageType, Skill } from '../../engine/types';

export type Lighting = 'day' | 'dusk' | 'night' | 'fog' | 'dark';
export type Tileset = 'town' | 'cathedral' | 'undercroft' | 'vault' | 'interior' | 'forest' | 'ruins' | 'dome';

export interface MapObject {
  id: string;
  x: number;
  y: number;
  kind: 'npc' | 'container' | 'lockedDoor' | 'secretDoor' | 'trap' | 'inspect' | 'exit' | 'resonance' | 'trigger' | 'encounter';
  name: string;
  glyph?: string;
  color?: string;
  if?: Cond;
  /** Hidden until noticed (passive Perception) or found with Search. */
  hidden?: { dc: number; skill?: Skill };
  dialogue?: string;
  desc?: string;
  loot?: { items?: [string, number][]; gold?: number };
  lock?: { dc: number; key?: string; forceDc?: number };
  trap?: { disarmDc: number; save: Ability; saveDc: number; damage: string; type: DamageType; desc: string };
  to?: { map: string; x: number; y: number };
  encounter?: string;
  radius?: number;
  effects?: Effect[];
  /** Companion notices: a companion with enough passive skill points this out when the party is near. */
  hint?: { skill: Skill; dc: number; text: string };
  blocks?: boolean;
  w?: number; // exits/triggers may span an area
  h?: number;
}

export interface MapDef {
  id: string;
  name: string;
  tileset: Tileset;
  grid: string[];
  objects: MapObject[];
  lighting: { if?: Cond; value: Lighting }[];
  instability: { if?: Cond; value: number }[];
  enter: DText[];
  music: { if?: Cond; value: string }[];
  randomEncounters?: { if?: Cond; chance: number; encounters: string[]; max: number };
  hub?: string;
  restAllowed?: Cond;
  /** Alternate grids (same size) used while a condition holds — e.g. Valdros flickering between realities. */
  variants?: { if: Cond; grid: string[] }[];
  /** Where the party may make camp (talks, crafting, long rest). Wilderness camps can be interrupted. */
  camp?: Cond;
  /** Chance (0..1) that a long rest here is interrupted by one of the map's random encounters. */
  campDanger?: number;
}
