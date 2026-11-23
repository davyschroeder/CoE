/**
 * Act I content modules. Each region file exports one ContentModule; data/act1/index.ts merges them into
 * the global registries (quests, dialogues, map objects, encounters, items, NPCs, shops, travel events).
 */
import type { QuestDef } from '../quests';
import type { DialogueTree, Cond, DText } from '../schema';
import type { MapObject } from '../maps/types';
import type { EncounterDef } from '../encounters';
import type { ItemDef } from '../items';
import type { NpcDef } from '../npcs';
import type { ShopDef } from '../shops';
import type { EnemyTemplate } from '../enemies';

export interface TravelEvent {
  id: string;
  /** Only rolled while this holds (e.g. "chapter:act1 && !valdros_done"). */
  if?: Cond;
  /** Relative weight among eligible events. */
  weight: number;
  /** Fires at most once per game. */
  once?: boolean;
  /** Either a dialogue (vignette) or an encounter (relative coordinates, map = destination). */
  dialogue?: string;
  encounter?: string;
}

export interface ContentModule {
  quests?: QuestDef[];
  dialogues?: DialogueTree[];
  objects?: { map: string; object: MapObject }[];
  encounters?: EncounterDef[];
  items?: ItemDef[];
  npcs?: NpcDef[];
  shops?: ShopDef[];
  travel?: TravelEvent[];
  /** New enemy templates (must use existing action ids from data/actions.ts). */
  enemies?: EnemyTemplate[];
  /** Arrival narration per map (first match wins); replaces the map's default text. */
  enter?: Record<string, DText[]>;
}
