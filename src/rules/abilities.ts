import type { Ability, Skill } from '../engine/types';

export const ABILITY_NAMES: Record<Ability, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
};
export const ABILITY_SHORT: Record<Ability, string> = {
  str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA',
};

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((Math.max(1, level) - 1) / 4);
}

export const SKILL_ABILITY: Record<Skill, Ability> = {
  athletics: 'str',
  acrobatics: 'dex', sleightOfHand: 'dex', stealth: 'dex',
  arcana: 'int', history: 'int', investigation: 'int', nature: 'int', religion: 'int',
  animalHandling: 'wis', insight: 'wis', medicine: 'wis', perception: 'wis', survival: 'wis',
  deception: 'cha', intimidation: 'cha', performance: 'cha', persuasion: 'cha',
};

export const SKILL_NAMES: Record<Skill, string> = {
  athletics: 'Athletics', acrobatics: 'Acrobatics', sleightOfHand: 'Sleight of Hand', stealth: 'Stealth',
  arcana: 'Arcana', history: 'History', investigation: 'Investigation', nature: 'Nature', religion: 'Religion',
  animalHandling: 'Animal Handling', insight: 'Insight', medicine: 'Medicine', perception: 'Perception',
  survival: 'Survival', deception: 'Deception', intimidation: 'Intimidation', performance: 'Performance',
  persuasion: 'Persuasion',
};

export const ALL_SKILLS = Object.keys(SKILL_ABILITY) as Skill[];

/** Standard array and point-buy costs (27 points, scores 8..15). */
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

/** XP needed to reach each level (index = level). */
export const XP_TABLE = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

export function levelForXp(xp: number): number {
  let lvl = 1;
  for (let l = 2; l <= 20; l++) if (xp >= XP_TABLE[l]) lvl = l;
  return lvl;
}
