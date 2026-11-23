import { abilityMod, proficiencyBonus, SKILL_ABILITY, levelForXp, XP_TABLE } from '../rules/abilities';
import { CLASS_BY_ID, FULL_CASTER_SLOTS, PACT_SLOTS, type FeatureDef } from '../data/classes';
import { ANCESTRY_BY_ID } from '../data/ancestries';
import { BACKGROUND_BY_ID } from '../data/backgrounds';
import { ITEM_BY_ID, type ItemDef } from '../data/items';
import { ACTION_BY_ID, spellsForClass, type ActionDef } from '../data/actions';
import { ENEMY_BY_ID } from '../data/enemies';
import { COMPANION_BY_ID } from '../data/companions';
import { rollDice } from '../core/dice';
import type { Ability, Character, DamageType, Skill, Portrait } from './types';
import { ABILITIES } from './types';

// ─────────────────────────────── Ability scores & proficiency

export function abilityScore(c: Character, a: Ability): number {
  let v = c.abilities[a];
  for (const item of equippedItems(c)) v += item.bonus?.abilities?.[a] ?? 0;
  return Math.min(30, v);
}

export function mod(c: Character, a: Ability): number {
  return abilityMod(abilityScore(c, a));
}

export function prof(c: Character): number {
  return proficiencyBonus(c.kind === 'enemy' ? (c.monsterLevel ?? c.level) : c.level);
}

export function equippedItems(c: Character): ItemDef[] {
  const out: ItemDef[] = [];
  for (const id of Object.values(c.equipment)) {
    if (id && ITEM_BY_ID[id]) out.push(ITEM_BY_ID[id]);
  }
  return out;
}

export function hasCondition(c: Character, id: string): boolean {
  return c.conditions.some((k) => k.id === id);
}

// ─────────────────────────────── Features

export function features(c: Character): FeatureDef[] {
  const cls = CLASS_BY_ID[c.classId];
  if (!cls) return [];
  const list = cls.features.filter((f) => f.level <= c.level);
  if (c.subclassId) {
    const sub = cls.subclasses.find((s) => s.id === c.subclassId);
    if (sub) list.push(...sub.features.filter((f) => f.level <= c.level));
  }
  return list;
}

export function hasFeature(c: Character, id: string): boolean {
  return features(c).some((f) => f.id === id) || c.feats.includes(id) || (c.traits ?? []).includes(id);
}

// ─────────────────────────────── Defence & movement

export function armorClass(c: Character): number {
  let ac: number;
  const body = c.equipment.body ? ITEM_BY_ID[c.equipment.body] : undefined;
  const dex = mod(c, 'dex');
  if (c.kind === 'enemy' && c.naturalArmor !== undefined) {
    ac = c.naturalArmor;
  } else if (body?.armor) {
    const cap = body.armor.kind === 'heavy' ? 0 : body.armor.dexCap ?? 99;
    ac = body.armor.base + Math.min(dex, cap);
    if (c.feats.includes('style_defense')) ac += 1;
  } else if (hasFeature(c, 'unarmored_defense')) {
    ac = 10 + dex + mod(c, 'con');
  } else {
    ac = 10 + dex;
  }
  const off = c.equipment.offHand ? ITEM_BY_ID[c.equipment.offHand] : undefined;
  if (off?.shield) ac += off.shield.bonus;
  for (const item of equippedItems(c)) ac += item.bonus?.ac ?? 0;
  for (const k of c.conditions) if (k.id === 'shielded') ac += k.value ?? 5;
  return ac;
}

export function baseSpeed(c: Character): number {
  if (c.speedOverride !== undefined) return c.speedOverride;
  return ANCESTRY_BY_ID[c.ancestry]?.speed ?? 6;
}

export function speed(c: Character): number {
  let s = baseSpeed(c);
  const body = c.equipment.body ? ITEM_BY_ID[c.equipment.body] : undefined;
  if (body?.armor?.strReq && abilityScore(c, 'str') < body.armor.strReq && c.ancestry !== 'dwarf') s -= 2;
  if (c.feats.includes('mobile')) s += 2;
  if (hasFeature(c, 'roving')) s += 1;
  for (const item of equippedItems(c)) s += item.bonus?.speed ?? 0;
  if (hasCondition(c, 'slowed')) s = Math.floor(s / 2);
  if (hasCondition(c, 'restrained') || hasCondition(c, 'stunned') || hasCondition(c, 'incapacitated')) s = 0;
  return Math.max(0, s);
}

// ─────────────────────────────── Skills, saves, initiative

export function isProficientSkill(c: Character, s: Skill): boolean {
  return c.skillProfs.includes(s);
}

export function skillBonus(c: Character, s: Skill): number {
  const ab = SKILL_ABILITY[s];
  let b = mod(c, ab);
  if (c.skillProfs.includes(s)) b += prof(c) * (c.expertise.includes(s) ? 2 : 1);
  else if (hasFeature(c, 'jack_of_all_trades') || (hasFeature(c, 'remarkable_athlete') && ['str', 'dex', 'con'].includes(ab))) b += Math.floor(prof(c) / 2);
  for (const item of equippedItems(c)) b += item.bonus?.skills?.[s] ?? 0;
  if (s === 'perception' && c.feats.includes('observant')) b += 0; // passive only
  return b;
}

export function abilityCheckBonus(c: Character, a: Ability): number {
  let b = mod(c, a);
  if (hasFeature(c, 'jack_of_all_trades') || (hasFeature(c, 'remarkable_athlete') && (a === 'str' || a === 'dex' || a === 'con'))) b += Math.floor(prof(c) / 2);
  return b;
}

export function saveBonus(c: Character, a: Ability): number {
  let b = mod(c, a);
  const profSave = c.saveProfs.includes(a) || (a === 'con' && c.feats.includes('resilient')) || (a === 'wis' && hasFeature(c, 'iron_mind'));
  if (profSave) b += prof(c);
  for (const item of equippedItems(c)) b += item.bonus?.saves ?? 0;
  return b;
}

export function initiativeBonus(c: Character): number {
  let b = mod(c, 'dex');
  if (c.feats.includes('alert')) b += 5;
  if (hasFeature(c, 'dread_ambusher')) b += mod(c, 'wis');
  if (hasFeature(c, 'remarkable_athlete')) b += Math.floor(prof(c) / 2);
  for (const item of equippedItems(c)) b += item.bonus?.initiative ?? 0;
  return b;
}

export function passivePerception(c: Character): number {
  return 10 + skillBonus(c, 'perception') + (c.feats.includes('observant') ? 5 : 0);
}

// ─────────────────────────────── Weapons & attacks

export const UNARMED: ItemDef = {
  id: 'unarmed', name: 'Unarmed Strike', type: 'weapon', rarity: 'common', value: 0, weight: 0, desc: 'Fists, elbows, knees.',
  weapon: { dice: '1', type: 'bludgeoning', props: [], category: 'simple' },
};

export function mainWeapon(c: Character): ItemDef {
  const id = c.equipment.mainHand;
  const def = id ? ITEM_BY_ID[id] : undefined;
  return def?.weapon ? def : UNARMED;
}

export function offhandWeapon(c: Character): ItemDef | null {
  const id = c.equipment.offHand;
  const def = id ? ITEM_BY_ID[id] : undefined;
  return def?.weapon ? def : null;
}

export function weaponRange(w: ItemDef): number {
  if (!w.weapon) return 1;
  if (w.weapon.props.includes('ranged')) return w.weapon.range ?? 16;
  return w.weapon.props.includes('reach') ? 2 : 1;
}

export function isRangedWeapon(w: ItemDef): boolean {
  return !!w.weapon?.props.includes('ranged');
}

export function weaponAbility(c: Character, w: ItemDef): Ability {
  if (!w.weapon) return 'str';
  if (w.weapon.props.includes('ranged')) return 'dex';
  if (w.weapon.props.includes('finesse')) return mod(c, 'dex') > mod(c, 'str') ? 'dex' : 'str';
  return 'str';
}

export function isProficientWeapon(c: Character, w: ItemDef): boolean {
  if (c.kind === 'enemy' || w.id === 'unarmed') return true;
  if (w.weapon?.category === 'simple') return true;
  const cls = CLASS_BY_ID[c.classId];
  if (cls?.martialWeapons) return true;
  if (c.classId === 'rogue' || c.classId === 'bard') return ['rapier', 'shortsword', 'longsword', 'whisperfang'].includes(w.id);
  return false;
}

export function weaponAttackBonus(c: Character, w: ItemDef): number {
  let b = mod(c, weaponAbility(c, w));
  if (isProficientWeapon(c, w)) b += prof(c);
  b += w.bonus?.attack ?? 0;
  if (isRangedWeapon(w)) {
    if (c.feats.includes('style_archery')) b += 2;
    if (c.feats.includes('deadeye')) b += 1;
  }
  return b;
}

export function weaponDamageBonus(c: Character, w: ItemDef, offhand = false): number {
  let b = offhand ? Math.min(0, mod(c, weaponAbility(c, w))) : mod(c, weaponAbility(c, w));
  b += w.bonus?.damage ?? 0;
  if (!offhand && c.feats.includes('style_dueling') && !isRangedWeapon(w) && !w.weapon?.props.includes('twoHanded') && !offhandWeapon(c)) b += 2;
  if (hasCondition(c, 'raging') && !isRangedWeapon(w)) b += 2;
  return b;
}

/** Versatile weapons use a bigger die when the off hand is empty. */
export function weaponDice(c: Character, w: ItemDef): string {
  if (!w.weapon) return '1';
  if (w.weapon.props.includes('versatile') && !c.equipment.offHand) {
    const m = w.weapon.dice.match(/^(\d+)d(\d+)$/);
    if (m) return `${m[1]}d${Math.min(12, parseInt(m[2], 10) + 2)}`;
  }
  return w.weapon.dice;
}

export function attacksPerAction(c: Character): number {
  if (c.kind === 'enemy') return 1;
  if (hasFeature(c, 'extra_attack_2')) return 3;
  return hasFeature(c, 'extra_attack') ? 2 : 1;
}

export function critRange(c: Character): number {
  return hasFeature(c, 'improved_critical') ? 19 : 20;
}

// ─────────────────────────────── Spellcasting

export function castAbility(c: Character): Ability | null {
  return CLASS_BY_ID[c.classId]?.castAbility ?? null;
}

export function spellMod(c: Character): number {
  const a = castAbility(c);
  if (a) return mod(c, a);
  // monsters: use their action ability or int
  return Math.max(mod(c, 'int'), mod(c, 'wis'), mod(c, 'cha'));
}

export function spellAttackBonus(c: Character): number {
  let b = prof(c) + spellMod(c);
  for (const item of equippedItems(c)) b += item.bonus?.spellAttack ?? 0;
  return b;
}

export function spellSaveDC(c: Character): number {
  let b = 8 + prof(c) + spellMod(c);
  for (const item of equippedItems(c)) b += item.bonus?.spellDC ?? 0;
  return b;
}

/** Maximum spell slots by slot level (index 1..9). */
export function spellSlotsMax(c: Character): number[] {
  const out = new Array(10).fill(0);
  const cls = CLASS_BY_ID[c.classId];
  if (!cls || c.kind === 'enemy') return out;
  if (cls.caster === 'full') {
    FULL_CASTER_SLOTS[c.level].forEach((n, i) => (out[i + 1] = n));
  } else if (cls.caster === 'half' && c.level >= 2) {
    FULL_CASTER_SLOTS[Math.ceil(c.level / 2)].forEach((n, i) => (out[i + 1] = n));
  } else if (cls.caster === 'pact') {
    const [n, lvl] = PACT_SLOTS[c.level];
    if (lvl > 0) out[lvl] = n;
  }
  return out;
}

export function slotsAvailable(c: Character, level: number): number {
  return Math.max(0, spellSlotsMax(c)[level] - (c.spellSlotsUsed[level] ?? 0));
}

/** Lowest slot level >= minLevel with a free slot, or 0 if none. */
export function lowestFreeSlot(c: Character, minLevel: number): number {
  const max = spellSlotsMax(c);
  for (let l = Math.max(1, minLevel); l <= 9; l++) if (max[l] - (c.spellSlotsUsed[l] ?? 0) > 0) return l;
  return 0;
}

export function maxSpellLevel(c: Character): number {
  const max = spellSlotsMax(c);
  let lvl = 0;
  for (let l = 1; l <= 9; l++) if (max[l] > 0) lvl = l;
  return lvl;
}

export function cantripDiceMultiplier(c: Character): number {
  const l = c.kind === 'enemy' ? (c.monsterLevel ?? 1) : c.level;
  return l >= 17 ? 4 : l >= 11 ? 3 : l >= 5 ? 2 : 1;
}

export function preparedLimit(c: Character): number {
  const cls = CLASS_BY_ID[c.classId];
  if (!cls?.prepares) return 99;
  const base = cls.caster === 'half' ? Math.floor(c.level / 2) : c.level;
  return Math.max(1, base + spellMod(c));
}

export function cantripsKnownLimit(c: Character): number {
  return CLASS_BY_ID[c.classId]?.cantrips?.[c.level] ?? 0;
}

export function spellsKnownLimit(c: Character): number {
  const cls = CLASS_BY_ID[c.classId];
  if (!cls || cls.caster === 'none') return 0;
  if (cls.spellsKnown) return cls.spellsKnown[c.level];
  if (cls.id === 'wizard') return 4 + c.level * 2; // spellbook
  return 99; // cleric/paladin know their whole list
}

/** Spells this character may currently cast (cantrips + prepared levelled spells). */
export function castableSpells(c: Character): ActionDef[] {
  const cls = CLASS_BY_ID[c.classId];
  if (!cls || cls.caster === 'none') return [];
  const list = c.knownSpells.map((id) => ACTION_BY_ID[id]).filter(Boolean);
  return list.filter((s) => (s.level ?? 0) === 0 || !cls.prepares || c.preparedSpells.includes(s.id));
}

/** Spells available to learn at this character's current level. */
export function learnableSpells(c: Character): ActionDef[] {
  return spellsForClass(c.classId, Math.max(1, maxSpellLevel(c)));
}

// ─────────────────────────────── Resources

export function resourceMax(c: Character, id: string): number {
  const cha = Math.max(1, mod(c, 'cha'));
  switch (id) {
    case 'second_wind': case 'action_surge': case 'challenging_shout': case 'choir_whispers': case 'arcane_recovery':
    case 'indomitable': case 'entropic_ward': case 'embers_luck':
      return 1;
    case 'probability_twist': return hasFeature(c, 'probability_mastery') ? 2 : 1;
    case 'natures_veil': return prof(c);
    case 'channel_divinity': return c.level >= 6 ? 2 : 1;
    case 'favored_foe': return prof(c);
    case 'lay_on_hands': return 5 * c.level;
    case 'bardic_inspiration': return cha;
    case 'rage': return c.level >= 17 ? 6 : c.level >= 12 ? 5 : c.level >= 6 ? 4 : c.level >= 3 ? 3 : 2;
    case 'sorcery_points': return c.level;
    case 'warding_flare': return Math.max(1, mod(c, 'wis'));
    case 'unyielding': return 1;
    default: return 1;
  }
}

export function syncResources(c: Character): void {
  const wanted = new Map<string, 'short' | 'long'>();
  for (const f of features(c)) if (f.resource) wanted.set(f.resource.id, f.resource.recharge);
  if (c.ancestry === 'ashkin') wanted.set('unyielding', 'long');
  if (hasFeature(c, 'font_of_inspiration')) wanted.set('bardic_inspiration', 'short');
  for (const [id, recharge] of wanted) {
    const max = resourceMax(c, id);
    const cur = c.resources[id];
    c.resources[id] = { max, used: cur ? Math.min(cur.used, max) : 0, recharge };
  }
  for (const id of Object.keys(c.resources)) if (!wanted.has(id)) delete c.resources[id];
}

export function resourceLeft(c: Character, id: string): number {
  const r = c.resources[id];
  return r ? r.max - r.used : 0;
}

// ─────────────────────────────── Hit points

export function computeMaxHp(c: Character): number {
  if (c.kind === 'enemy') return c.maxHp;
  const cls = CLASS_BY_ID[c.classId];
  const hd = cls?.hitDie ?? 8;
  const con = mod(c, 'con');
  let hp = hd + con + (c.level - 1) * (Math.floor(hd / 2) + 1 + con);
  if (c.feats.includes('tough')) hp += 2 * c.level;
  for (const item of equippedItems(c)) hp += item.bonus?.maxHp ?? 0;
  return Math.max(1, hp);
}

export function recalcHp(c: Character): void {
  const newMax = computeMaxHp(c);
  if (newMax !== c.maxHp) {
    const diff = newMax - c.maxHp;
    c.maxHp = newMax;
    c.hp = Math.max(0, Math.min(newMax, c.hp + Math.max(0, diff)));
  }
}

export function isDown(c: Character): boolean {
  return c.hp <= 0;
}

export function resistances(c: Character): DamageType[] {
  const out = new Set<DamageType>(c.resistances ?? []);
  const anc = ANCESTRY_BY_ID[c.ancestry];
  anc?.resist?.forEach((r) => out.add(r as DamageType));
  for (const item of equippedItems(c)) item.bonus?.resist?.forEach((r) => out.add(r));
  if (hasCondition(c, 'raging') || hasCondition(c, 'guarded')) ['bludgeoning', 'piercing', 'slashing'].forEach((r) => out.add(r as DamageType));
  if (hasFeature(c, 'thought_shield')) out.add('psychic');
  if (hasFeature(c, 'fiendish_resilience') || hasFeature(c, 'ember_ward')) out.add('fire');
  return [...out];
}

// ─────────────────────────────── Actions

export function availableActionIds(c: Character): string[] {
  if (c.kind === 'enemy') return [...(c.actions ?? []), 'dash', 'disengage', 'dodge'];
  const ids = ['attack', 'dash', 'disengage', 'dodge', 'help', 'shove', 'hide', 'interact'];
  const off = offhandWeapon(c);
  const main = mainWeapon(c);
  if (off && off.weapon?.props.includes('light') && main.weapon?.props.includes('light')) ids.push('offhand_attack');
  for (const f of features(c)) f.actions?.forEach((a) => { if (!ids.includes(a)) ids.push(a); });
  for (const s of castableSpells(c)) if (!ids.includes(s.id)) ids.push(s.id);
  return ids.filter((id) => ACTION_BY_ID[id]);
}

// ─────────────────────────────── Creation

export interface CreateOptions {
  id: string;
  name: string;
  kind: 'player' | 'companion';
  companionId?: string;
  ancestry: string;
  classId: string;
  background: string;
  baseAbilities: Record<Ability, number>; // before ancestry bonuses
  skills: Skill[];
  expertise?: Skill[];
  cantrips?: string[];
  spells?: string[];
  fightingStyle?: string;
  portrait?: Portrait;
  personality?: string;
  motivation?: string;
  appearance?: string;
  level?: number;
  subclassId?: string;
}

export function createCharacter(o: CreateOptions): Character {
  const cls = CLASS_BY_ID[o.classId];
  const anc = ANCESTRY_BY_ID[o.ancestry];
  const bg = BACKGROUND_BY_ID[o.background];
  if (!cls || !anc || !bg) throw new Error(`Invalid character definition for ${o.name}`);
  const abilities = { ...o.baseAbilities };
  for (const a of ABILITIES) abilities[a] = Math.min(20, abilities[a] + (anc.bonuses[a] ?? 0));
  const skills = new Set<Skill>([...o.skills, ...bg.skills, ...(anc.skills ?? [])]);
  const c: Character = {
    id: o.id, name: o.name, kind: o.kind, companionId: o.companionId,
    ancestry: o.ancestry, classId: o.classId, background: o.background,
    level: 1, xp: 0, abilities,
    skillProfs: [...skills], expertise: o.expertise ?? [], saveProfs: [...cls.saves],
    maxHp: 0, hp: 0, tempHp: 0, hitDice: 1,
    equipment: {}, spellSlotsUsed: new Array(10).fill(0),
    knownSpells: [...(o.cantrips ?? []), ...(o.spells ?? [])], preparedSpells: [...(o.spells ?? [])],
    resources: {}, feats: o.fightingStyle ? [o.fightingStyle] : [], conditions: [],
    deathSaves: { successes: 0, failures: 0 }, dead: false, stable: false,
    portrait: o.portrait ?? { hue: anc.hue, sigil: cls.sigil, initials: o.name.slice(0, 2).toUpperCase(), style: 0 },
    personality: o.personality, motivation: o.motivation, appearance: o.appearance,
  };
  if (cls.id === 'cleric' || cls.id === 'paladin') {
    // These classes know their whole list; preparation is the meaningful choice.
    autoKnowFullList(c);
  }
  autoEquip(c, cls.startingItems);
  if (cls.prepares) c.preparedSpells = c.preparedSpells.slice(0, preparedLimit(c));
  c.maxHp = computeMaxHp(c);
  c.hp = c.maxHp;
  syncResources(c);
  const target = o.level ?? 1;
  if (o.subclassId) c.subclassId = o.subclassId;
  while (c.level < target) {
    c.xp = XP_TABLE[c.level + 1];
    applyLevelUp(c, autoLevelChoices(c));
  }
  return c;
}

function autoKnowFullList(c: Character): void {
  const all = learnableSpells(c).filter((s) => (s.level ?? 0) > 0).map((s) => s.id);
  const cantrips = c.knownSpells.filter((id) => (ACTION_BY_ID[id]?.level ?? 0) === 0);
  c.knownSpells = [...cantrips, ...all];
  c.preparedSpells = c.preparedSpells.filter((id) => all.includes(id));
}

/** Equip starting items into slots; returns items that could not be equipped (they go to the pack). */
export function autoEquip(c: Character, itemIds: string[]): string[] {
  const leftovers: string[] = [];
  for (const id of itemIds) {
    const def = ITEM_BY_ID[id];
    if (!def) continue;
    if (def.type === 'weapon') {
      if (!c.equipment.mainHand) c.equipment.mainHand = id;
      else leftovers.push(id);
    } else if (def.type === 'shield' && !c.equipment.offHand && !mainWeapon(c).weapon?.props.includes('twoHanded')) c.equipment.offHand = id;
    else if ((def.type === 'armor' || def.type === 'clothing') && !c.equipment.body) c.equipment.body = id;
    else if (def.type === 'cloak' && !c.equipment.cloak) c.equipment.cloak = id;
    else if (def.type === 'amulet' && !c.equipment.amulet) c.equipment.amulet = id;
    else if (def.type === 'ring' && !c.equipment.ring1) c.equipment.ring1 = id;
    else leftovers.push(id);
  }
  return leftovers;
}

// ─────────────────────────────── Levelling

export interface LevelChoices {
  subclassId?: string;
  asi?: Partial<Record<Ability, number>>;
  feat?: string;
  newSpells?: string[];
  newCantrips?: string[];
  fightingStyle?: string;
  /** Skills gaining expertise (rogue level 6). */
  expertise?: Skill[];
  /** Spells from any class list (Magical Secrets). */
  secretSpells?: string[];
}

export function canLevelUp(c: Character): boolean {
  return c.level < 20 && levelForXp(c.xp) > c.level;
}

export function needsSubclass(c: Character, nextLevel: number): boolean {
  return nextLevel === 3 && !c.subclassId;
}

export function isAsiLevel(classId: string, level: number): boolean {
  const lv = [4, 8, 12, 16, 19];
  if (classId === 'fighter') lv.push(6, 14);
  if (classId === 'rogue') lv.push(10);
  return lv.includes(level);
}

export function needsFightingStyle(c: Character, nextLevel: number): boolean {
  return (c.classId === 'paladin' || c.classId === 'ranger') && nextLevel === 2 && !c.feats.some((f) => f.startsWith('style_'));
}

/** How many new spells/cantrips a known-caster or wizard gains at the next level. */
/** Number of Magical Secrets picks gained at the next level. */
export function secretsGain(c: Character): number {
  const next = c.level + 1;
  let n = 0;
  if (c.classId === 'bard' && next === 10) n += 2;
  if (c.classId === 'bard' && c.subclassId === 'lore' && next === 6) n += 2;
  return n;
}

export function expertiseGain(c: Character): number {
  return c.classId === 'rogue' && c.level + 1 === 6 ? 2 : 0;
}

/** Spells of any class up to a level (for Magical Secrets). */
export function anyClassSpells(maxLevel: number): ActionDef[] {
  return Object.values(ACTION_BY_ID).filter((a) => a.kind === 'spell' && (a.level ?? 0) <= maxLevel && (a.level ?? 0) > 0);
}

export function spellGains(c: Character): { cantrips: number; spells: number } {
  const cls = CLASS_BY_ID[c.classId];
  if (!cls || cls.caster === 'none') return { cantrips: 0, spells: 0 };
  const next = { ...c, level: c.level + 1 } as Character;
  const cantrips = (cls.cantrips?.[c.level + 1] ?? 0) - (cls.cantrips?.[c.level] ?? 0);
  let spells = 0;
  if (cls.id === 'wizard') spells = 2;
  else if (cls.spellsKnown) spells = cls.spellsKnown[c.level + 1] - cls.spellsKnown[c.level];
  void next;
  return { cantrips: Math.max(0, cantrips), spells: Math.max(0, spells) };
}

export function applyLevelUp(c: Character, ch: LevelChoices): void {
  if (c.level >= 20) return;
  c.level += 1;
  c.hitDice = Math.min(c.level, c.hitDice + 1);
  if (ch.subclassId) c.subclassId = ch.subclassId;
  if (ch.fightingStyle && !c.feats.includes(ch.fightingStyle)) c.feats.push(ch.fightingStyle);
  if (ch.asi) for (const [a, n] of Object.entries(ch.asi)) c.abilities[a as Ability] = Math.min(20, c.abilities[a as Ability] + (n ?? 0));
  if (ch.feat && !c.feats.includes(ch.feat)) {
    c.feats.push(ch.feat);
    if (ch.feat === 'resilient') c.abilities.con = Math.min(20, c.abilities.con + 1);
    if (ch.feat === 'observant') c.abilities.wis = Math.min(20, c.abilities.wis + 1);
  }
  for (const s of [...(ch.newCantrips ?? []), ...(ch.newSpells ?? []), ...(ch.secretSpells ?? [])]) if (!c.knownSpells.includes(s)) c.knownSpells.push(s);
  for (const sk of ch.expertise ?? []) if (c.skillProfs.includes(sk) && !c.expertise.includes(sk)) c.expertise.push(sk);
  const cls = CLASS_BY_ID[c.classId];
  if (cls?.id === 'cleric' || cls?.id === 'paladin') autoKnowFullList(c);
  if (cls && !cls.prepares) c.preparedSpells = c.knownSpells.filter((id) => (ACTION_BY_ID[id]?.level ?? 0) > 0);
  else if (cls?.prepares && c.kind === 'companion') {
    // CPU companions re-prepare: their signature spells first, then the strongest, keeping a healing option.
    c.preparedSpells = companionPreparation(c);
  } else if (cls?.prepares) {
    // The player keeps their choices; newly learned spells are added while there is room.
    for (const id of c.knownSpells) {
      if ((ACTION_BY_ID[id]?.level ?? 0) > 0 && !c.preparedSpells.includes(id) && c.preparedSpells.length < preparedLimit(c)) c.preparedSpells.push(id);
    }
  }
  const oldMax = c.maxHp;
  c.maxHp = computeMaxHp(c);
  c.hp += c.maxHp - oldMax;
  syncResources(c);
}

/** Spell preparation for a CPU companion: preferred spells, then highest level, always some healing. */
export function companionPreparation(c: Character): string[] {
  const preferred = c.companionId ? COMPANION_BY_ID[c.companionId]?.spells ?? [] : [];
  const max = maxSpellLevel(c);
  const levelled = c.knownSpells.map((id) => ACTION_BY_ID[id]).filter((a) => a && (a.level ?? 0) > 0 && (a.level ?? 0) <= max);
  const score = (a: ActionDef) => (preferred.includes(a.id) ? 15 : 0) + (a.level ?? 0) * 10 + (a.tags.includes('heal') ? 8 : 0) + (a.tags.includes('aoe') ? 5 : 0) + (a.tags.includes('damage') ? 5 : 0) + (a.tags.includes('control') ? 4 : 0);
  return levelled.sort((a, b) => score(b) - score(a)).slice(0, preparedLimit(c)).map((a) => a.id);
}

/** Sensible automatic choices for CPU companions (and for "auto level" in the UI). */
export function autoLevelChoices(c: Character): LevelChoices {
  const next = c.level + 1;
  const cls = CLASS_BY_ID[c.classId];
  const ch: LevelChoices = {};
  if (needsSubclass(c, next) && cls) ch.subclassId = cls.subclasses[0].id;
  if (needsFightingStyle(c, next)) ch.fightingStyle = c.classId === 'ranger' ? 'style_archery' : 'style_defense';
  if (isAsiLevel(c.classId, next) && cls) {
    const p = cls.primary[0];
    ch.asi = c.abilities[p] <= 18 ? { [p]: 2 } : { con: 2 };
  }
  const gains = spellGains(c);
  if (gains.cantrips || gains.spells) {
    const preferred = c.companionId ? COMPANION_BY_ID[c.companionId]?.spells ?? [] : [];
    const rank = (id: string) => { const i = preferred.indexOf(id); return i < 0 ? 99 : i; };
    const pool = spellsForClass(c.classId, Math.max(1, maxSpellLevel({ ...c, level: next } as Character)))
      .sort((a, b) => rank(a.id) - rank(b.id));
    ch.newCantrips = pool.filter((s) => s.level === 0 && !c.knownSpells.includes(s.id)).slice(0, gains.cantrips).map((s) => s.id);
    ch.newSpells = pool.filter((s) => (s.level ?? 0) > 0 && !c.knownSpells.includes(s.id))
      .sort((a, b) => rank(a.id) - rank(b.id) || (b.level ?? 0) - (a.level ?? 0)).slice(0, gains.spells).map((s) => s.id);
  }
  const secrets = secretsGain(c);
  if (secrets) {
    const maxL = Math.max(1, maxSpellLevel({ ...c, level: next } as Character));
    const taken = new Set([...c.knownSpells, ...(ch.newSpells ?? [])]);
    ch.secretSpells = anyClassSpells(maxL).filter((sp) => !taken.has(sp.id) && !sp.classes?.includes(c.classId))
      .sort((a, b) => (b.level ?? 0) - (a.level ?? 0) || (b.tags.includes('heal') ? 1 : 0) - (a.tags.includes('heal') ? 1 : 0)).slice(0, secrets).map((sp) => sp.id);
  }
  const exp = expertiseGain(c);
  if (exp) ch.expertise = c.skillProfs.filter((sk) => !c.expertise.includes(sk)).sort((a, b) => skillBonus(c, b) - skillBonus(c, a)).slice(0, exp);
  return ch;
}

// ─────────────────────────────── Enemies

let enemyCounter = 0;

export function createEnemy(templateId: string, opts: { hpMult?: number; echoTouched?: boolean; idSuffix?: string; elite?: boolean } = {}): Character {
  const t = ENEMY_BY_ID[templateId];
  if (!t) throw new Error(`Unknown enemy ${templateId}`);
  const hp = Math.max(1, Math.round(rollDice(t.hp).total * (opts.hpMult ?? 1) * (opts.elite ? 1.5 : 1))) + (opts.echoTouched ? 5 : 0);
  enemyCounter++;
  const c: Character = {
    id: `${templateId}_${opts.idSuffix ?? enemyCounter}`,
    name: `${opts.elite ? 'Elite ' : ''}${opts.echoTouched ? 'Echo-Touched ' : ''}${t.name}`,
    kind: 'enemy', templateId, ancestry: 'none', classId: 'none', background: 'none',
    level: t.level, monsterLevel: t.level + (opts.elite ? 4 : 0), xp: 0,
    abilities: { ...t.abilities }, skillProfs: ['perception'], expertise: [], saveProfs: [],
    maxHp: hp, hp, tempHp: 0, hitDice: 0, equipment: {}, spellSlotsUsed: new Array(10).fill(0),
    knownSpells: [], preparedSpells: [], resources: {}, feats: [], conditions: [],
    deathSaves: { successes: 0, failures: 0 }, dead: false, stable: false,
    portrait: { hue: 0, sigil: t.glyph, initials: t.glyph, style: 1 },
    naturalArmor: t.ac + (opts.elite ? 1 : 0), speedOverride: t.speed, actions: [...t.actions],
    resistances: [...(t.resist ?? []), ...(opts.echoTouched ? ['psychic' as DamageType] : [])],
    vulnerabilities: [...(t.vuln ?? [])], immunities: [...(t.immune ?? [])], conditionImmunities: [...(t.condImmune ?? [])],
    xpValue: Math.round(t.xp * (opts.elite ? 2 : 1)), aiProfile: t.ai, traits: [...(t.traits ?? []), ...(opts.echoTouched ? ['echo_touched'] : []), ...(opts.elite ? ['elite'] : [])],
    creatureType: t.type, multiattack: t.multiattack, combatResources: { ...(t.resources ?? {}) },
  };
  return c;
}

export function creatureType(c: Character): string {
  return c.creatureType ?? 'humanoid';
}

export function xpToNext(c: Character): number {
  return c.level >= 20 ? 0 : XP_TABLE[c.level + 1] - c.xp;
}
