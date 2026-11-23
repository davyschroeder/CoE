/**
 * Companion personal quests (stage 1) and companion-to-companion conflicts.
 * Everything here is merged into the main registries (quests, dialogues, maps, encounters, items).
 * STUB — replaced by authored content.
 */
import type { QuestDef } from './quests';
import type { DialogueTree, Cond } from './schema';
import type { MapObject } from './maps/types';
import type { EncounterDef } from './encounters';
import type { ItemDef } from './items';

export interface CompanionQuestEntry { companionId: string; questId: string; startTree: string; availableIf: Cond; }
export interface ConflictEntry { id: string; between: [string, string]; if: Cond; tree: string; }

export const CQ_QUESTS: QuestDef[] = [];
export const CQ_DIALOGUES: DialogueTree[] = [];
export const CQ_OBJECTS: { map: string; object: MapObject }[] = [];
export const CQ_ENCOUNTERS: EncounterDef[] = [];
export const CQ_ITEMS: ItemDef[] = [];
export const COMPANION_QUESTS: CompanionQuestEntry[] = [];
export const CONFLICTS: ConflictEntry[] = [];
