/**
 * Core data model shared by every engine module.
 * Everything in GameState must be plain JSON so that saving is a straight serialization.
 */

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export const ABILITIES: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export type Skill =
  | 'athletics' | 'acrobatics' | 'sleightOfHand' | 'stealth'
  | 'arcana' | 'history' | 'investigation' | 'nature' | 'religion'
  | 'animalHandling' | 'insight' | 'medicine' | 'perception' | 'survival'
  | 'deception' | 'intimidation' | 'performance' | 'persuasion';

export type DamageType =
  | 'slashing' | 'piercing' | 'bludgeoning' | 'fire' | 'cold' | 'lightning'
  | 'thunder' | 'acid' | 'poison' | 'radiant' | 'necrotic' | 'psychic' | 'force';

export type ConditionId =
  | 'poisoned' | 'frightened' | 'charmed' | 'stunned' | 'prone' | 'restrained'
  | 'blinded' | 'invisible' | 'incapacitated'
  // beneficial / class states
  | 'blessed' | 'raging' | 'dodging' | 'hidden' | 'inspired' | 'hexed' | 'marked'
  | 'shielded' | 'resonant' | 'burning' | 'slowed' | 'disengaged' | 'guarded' | 'reckless' | 'surprised';

export interface ActiveCondition {
  id: ConditionId;
  /** Rounds remaining; -1 = until removed. Decremented at the end of the bearer's turn. */
  duration: number;
  sourceId?: string;
  /** If set, the bearer may repeat this save at the end of each of its turns to end the effect. */
  saveEnds?: { ability: Ability; dc: number };
  /** Tied to the source's concentration. */
  concentration?: boolean;
  value?: number; // e.g. inspiration die, hex damage
}

export type EquipSlot = 'mainHand' | 'offHand' | 'body' | 'cloak' | 'amulet' | 'ring1' | 'ring2';
export const EQUIP_SLOTS: EquipSlot[] = ['mainHand', 'offHand', 'body', 'cloak', 'amulet', 'ring1', 'ring2'];

export interface Resource { max: number; used: number; recharge: 'short' | 'long'; }

export interface Portrait { hue: number; sigil: string; initials: string; style: number; }

export interface Character {
  id: string;
  name: string;
  kind: 'player' | 'companion' | 'enemy' | 'ally';
  companionId?: string;
  templateId?: string;      // enemies
  ancestry: string;
  classId: string;
  subclassId?: string;
  background: string;
  level: number;
  xp: number;
  abilities: Record<Ability, number>;
  skillProfs: Skill[];
  expertise: Skill[];
  saveProfs: Ability[];
  maxHp: number;
  hp: number;
  tempHp: number;
  hitDice: number;          // remaining hit dice
  equipment: Partial<Record<EquipSlot, string>>; // item ids
  spellSlotsUsed: number[]; // index = slot level (1..9); index 0 unused
  knownSpells: string[];
  preparedSpells: string[];
  resources: Record<string, Resource>;
  feats: string[];
  conditions: ActiveCondition[];
  deathSaves: { successes: number; failures: number };
  dead: boolean;
  stable: boolean;
  portrait: Portrait;
  personality?: string;
  motivation?: string;
  appearance?: string;
  // Enemy-only / monster overrides
  naturalArmor?: number;
  speedOverride?: number;
  actions?: string[];
  resistances?: DamageType[];
  vulnerabilities?: DamageType[];
  immunities?: DamageType[];
  conditionImmunities?: ConditionId[];
  xpValue?: number;
  aiProfile?: string;
  traits?: string[];
  creatureType?: string;
  monsterLevel?: number;
  multiattack?: number;
  combatResources?: Record<string, number>;
}

export interface ItemStack { itemId: string; qty: number; }

export type QuestStatus = 'active' | 'completed' | 'failed';
export interface QuestState {
  status: QuestStatus;
  stage: string;
  stagesDone: string[];
  clues: string[];
  outcome?: string;
  startedAt: number; // day
}

export interface Relationship {
  trust: number;      // do they believe you / rely on you (-100..100)
  respect: number;    // do they rate your competence & resolve
  affection: number;  // personal warmth
  agreement: number;  // ideological alignment with your choices
  fear: number;       // 0..100
}

export interface CompanionMemory { id: string; day: number; valence: number; text: string; }

export interface CompanionState {
  id: string;
  recruited: boolean;
  inParty: boolean;
  left: boolean;
  rel: Relationship;
  /** Relationships to other companions (by companion id), -100..100 */
  bonds: Record<string, number>;
  memories: CompanionMemory[];
  mood: number;        // -10..10 short-term emotional state
  stress: number;      // 0..10 rises with danger and moral strain
  talksDone: string[];
  lastSpoke: number;   // game minute timestamp of last spontaneous line
  romance?: 'none' | 'interested' | 'active' | 'ended';
}

export interface MapRuntime {
  explored: string;           // run-length bitset of explored tiles (see engine/fog.ts)
  removed: string[];          // removed object ids (looted chests, defeated spawns)
  opened: string[];           // opened doors / unlocked locks (by object id)
  revealed: string[];         // discovered secrets/traps
  disarmed: string[];         // disarmed traps
  triggered: string[];        // one-shot triggers already fired
  instability: number;        // current reality instability 0..10
  steps: number;
}

export type Difficulty = 'storyteller' | 'adventurer' | 'veteran' | 'tactician';

export interface PartyOrders {
  stance: 'follow' | 'initiative' | 'hold';
  avoidCombat: boolean;
  protectWeakest: boolean;
  conserve: boolean;
  stealth: boolean;
}

export interface LogEntry { t: number; kind: 'dm' | 'speech' | 'system' | 'roll' | 'combat' | 'reaction'; text: string; speaker?: string; }

export interface RollRecord {
  t: number;
  label: string;
  who: string;
  detail: string;
  total: number;
  dc?: number;
  success?: boolean;
  natural?: number;
}

export interface GameState {
  version: number;
  saveId: string;
  createdAt: number;
  playtimeSec: number;
  chapter: 'prologue' | 'act1';
  difficulty: Difficulty;
  rules: { permadeath: boolean; limitedRest: boolean };
  party: Character[];            // player first, then all recruited companions
  activeIds: string[];           // ids of up to 4 characters currently adventuring (player always first)
  companions: Record<string, CompanionState>;
  inventory: ItemStack[];
  gold: number;
  location: { mapId: string; x: number; y: number };
  maps: Record<string, MapRuntime>;
  discoveredHubs: string[];
  flags: Record<string, number | string | boolean>;
  quests: Record<string, QuestState>;
  factions: Record<string, number>;
  time: { day: number; minute: number }; // minute of day 0..1439
  resonance: { current: number; max: number; unlocked: boolean };
  orders: PartyOrders;
  shortRestsSinceLong: number;
  log: LogEntry[];
  rolls: RollRecord[];
  epilogue?: string[];
}
