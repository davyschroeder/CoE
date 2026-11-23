/**
 * Authoring schema for narrative content.
 *
 * Conditions (`Cond`) and effects (`Effect`) are small string languages so content stays compact and
 * readable. Both are parsed and validated by tests (tests/content.test.ts) — a typo is a test failure.
 *
 * ── Condition language (engine/conditions.ts) ──────────────────────────────────────────────
 *   flagname                 flag is truthy                    !flagname     flag is falsy
 *   flagname>=2              numeric compare (= != > < >= <=)  gold>=10      party gold
 *   quest:ID                 quest is active                   quest:ID=stage  quest at stage
 *   questdone:ID             quest completed                   questout:ID=outcome
 *   class:rogue  bg:soldier  anc:elf                            (player's class/background/ancestry)
 *   partyclass:cleric        someone in the active party has this class
 *   comp:vaelis              companion is in the active party
 *   item:maren_key           party has the item
 *   skill:arcana             player is proficient in the skill
 *   trust:seris>=20          relationship dimension (trust|respect|affection|agreement|fear)
 *   bond:kael:vaelis>=10     companion-to-companion bond
 *   rep:conclave>=15         faction reputation               reptier:unbound=Trusted (Hostile|Wary|Neutral|Trusted|Allied)
 *   res>=1                   current Aether Resonance          resunlocked
 *   time:night               time of day (dawn|day|dusk|night)
 *   chapter:prologue         current chapter
 *   diff:storyteller         difficulty
 *   visited:map_id           map has been entered
 *   Combine with && and || and parentheses:  "bell_rang && (class:cleric || item:holy_symbol)"
 *
 * ── Effect language (engine/effects.ts) ────────────────────────────────────────────────────
 *   set FLAG [VALUE]         set a flag (default true)        unset FLAG
 *   add FLAG N               add to numeric flag
 *   quest ID STAGE           start quest / advance to stage   clue ID clue_id   (adds journal clue)
 *   complete ID [OUTCOME]    complete quest                   fail ID [OUTCOME]
 *   give ITEM [N]            give item(s)                     take ITEM [N]
 *   gold N                   change gold (may be negative)    xp N   (to every active member)
 *   rep FACTION N            faction reputation               react TAG[,TAG]  (companions react)
 *   rel COMP DIM N           change one relationship dimension (trust/respect/affection/agreement/fear)
 *   bond COMPA COMPB N       change companion bond            memory COMP VALENCE text...
 *   combat ENCOUNTER_ID      end dialogue and start combat
 *   goto MAP X Y             move party to a map position     time MINUTES   (advance clock)
 *   heal all|N               heal the party                   damage DICE [TYPE]  (each active member)
 *   rest long|short          rest                             res N   (change current resonance)
 *   unlockres                unlock Aether Resonance          resmax N
 *   instab N                 change current map instability   reveal MAP OBJ  (reveal hidden object)
 *   remove MAP OBJ           remove object from map           open MAP OBJ   (unlock a door)
 *   log text...              DM narration in the log          dialogue TREE_ID  (chain into tree)
 *   recruit COMP | leave COMP  join/leave party               hub ID   (discover fast-travel hub)
 *   chapter act1             change chapter                   epilogue  (show prologue ending)
 *   shop SHOP_ID             open a merchant                  camp   (open the camp screen)
 *   clock HH:MM              advance the clock to a time of day
 */
import type { Ability, Skill } from '../engine/types';

export type Cond = string;
export type Effect = string;

/** Approach/value tags attached to choices. Companions hold a value from -3 (hates) to +3 (loves) for each. */
export const TAGS = [
  'mercy', 'cruelty', 'honesty', 'deception', 'caution', 'boldness', 'curiosity', 'forbidden',
  'greed', 'charity', 'authority', 'defiance', 'nature', 'faith', 'violence', 'diplomacy',
  'stealth', 'protect', 'humor', 'pragmatic', 'knowledge', 'tradition',
] as const;
export type Tag = (typeof TAGS)[number];

export type Tone = 'friendly' | 'diplomatic' | 'aggressive' | 'deceptive' | 'curious' | 'sarcastic'
  | 'compassionate' | 'pragmatic' | 'class' | 'background' | 'resonance' | 'leave';

export interface DText { if?: Cond; text: string; }

export interface CheckSpec {
  skill?: Skill;
  ability?: Ability;
  dc: number;
  /** 'player' = the player character rolls; 'party' (default) = the player picks who attempts it. */
  who?: 'player' | 'party';
  /** Advantage if this condition holds. */
  advIf?: Cond;
}

export interface DialogueOption {
  text: string;
  if?: Cond;
  /** If `if` fails, show the option disabled with this reason instead of hiding it. */
  lockedText?: string;
  tags?: Tag[];
  tone?: Tone;
  check?: CheckSpec;
  effects?: Effect[];
  successEffects?: Effect[];
  failureEffects?: Effect[];
  next?: string;
  success?: string;
  failure?: string;
  /** Option disappears after it has been chosen once. */
  once?: boolean;
  end?: boolean;
  /** Companion-specific lines voiced when this option is suggested at a decision point. */
  voices?: Record<string, string>;
}

export interface Interjection {
  /** Companion id, or 'any' (first active companion matching `if`). */
  who: string;
  if?: Cond;
  text: string;
  effects?: Effect[];
}

export interface DialogueNode {
  /** NPC id (data/npcs.ts), 'dm' for narration, 'player', or 'comp:<companionId>'. */
  speaker?: string;
  text: string | DText[];
  effects?: Effect[];
  interjections?: Interjection[];
  options?: DialogueOption[];
  next?: string;
  /** Marks a party decision: companions voice preferences and the Vote command is available. */
  decision?: boolean;
  end?: boolean;
}

export interface DialogueTree {
  id: string;
  title?: string;
  start: string | { if?: Cond; node: string }[];
  nodes: Record<string, DialogueNode>;
}

/** Companion voice: functional lines picked by the companion personality engine. */
export interface CompanionVoice {
  /** Short reactions when the player makes a choice carrying a tag the companion cares about. */
  reactions: Partial<Record<Tag, { pos?: string[]; neg?: string[] }>>;
  /** Used at decision points when the companion argues for an option carrying this tag. */
  suggest: Partial<Record<Tag, string[]>>;
  combat: {
    start: string[]; lowHp: string[]; kill: string[]; allyDown: string[]; crit: string[]; miss: string[];
  };
  /** Ambient remarks while exploring; picked when `if` holds and the cooldown allows. */
  idle: { id: string; if?: Cond; text: string }[];
  /** When the player orders something this companion's hard limits forbid. */
  refuse: string[];
  vote: { yes: string[]; no: string[] };
  /** Said when relationship collapses and they leave. */
  farewell: string;
}

export interface Banter {
  id: string;
  /** All listed companions must be in the active party. */
  between: string[];
  if?: Cond;
  lines: { who: string; text: string }[];
  /** e.g. ["bond vaelis kael 3"] */
  effects?: Effect[];
}
