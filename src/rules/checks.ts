import { rollD20, rollDie, resolveMode, type RollMode } from '../core/dice';
import { ABILITY_NAMES, SKILL_ABILITY, SKILL_NAMES } from './abilities';
import { abilityCheckBonus, hasCondition, hasFeature, prof, saveBonus, skillBonus, mod } from '../engine/character';
import type { Ability, Character, Skill } from '../engine/types';
import { signed } from '../core/util';

export interface BonusPart { label: string; value: number; }

export interface CheckResult {
  kind: 'skill' | 'ability' | 'save' | 'attack' | 'death' | 'initiative' | 'contest';
  label: string;
  who: string;
  whoId: string;
  natural: number;
  rolls: number[];
  mode: RollMode;
  parts: BonusPart[];
  total: number;
  dc?: number;
  success?: boolean;
  nat20: boolean;
  nat1: boolean;
}

export interface RollOpts {
  adv?: number;          // count of advantage sources
  dis?: number;          // count of disadvantage sources
  extra?: BonusPart[];   // situational bonuses
  consumeInspiration?: boolean;
  /** Manual-dice hook: supply the d20 roll from the UI (still random, just triggered by the player). */
  forcedRolls?: number[];
}

function d20WithLuck(c: Character, mode: RollMode, forced?: number[]): { natural: number; rolls: number[] } {
  let r = forced && forced.length ? { natural: mode === 'advantage' ? Math.max(...forced) : mode === 'disadvantage' ? Math.min(...forced) : forced[0], rolls: forced } : rollD20(mode);
  if (c.ancestry === 'halfling' && r.natural === 1) {
    const re = rollD20(mode);
    r = { natural: re.natural, rolls: [...r.rolls, ...re.rolls] };
  }
  return r;
}

/** Bonus dice from conditions such as Bless and Bardic Inspiration. */
function conditionDice(c: Character, kind: 'attack' | 'save' | 'check', consume: boolean): BonusPart[] {
  const out: BonusPart[] = [];
  if ((kind === 'attack' || kind === 'save') && hasCondition(c, 'blessed')) out.push({ label: 'Bless (d4)', value: rollDie(4) });
  const insp = c.conditions.find((k) => k.id === 'inspired');
  if (insp && consume) {
    out.push({ label: `Inspiration (d${insp.value ?? 6})`, value: rollDie(insp.value ?? 6) });
    c.conditions = c.conditions.filter((k) => k !== insp);
  }
  return out;
}

function finish(base: Omit<CheckResult, 'total' | 'success' | 'nat20' | 'nat1'>, dc?: number): CheckResult {
  const total = base.natural + base.parts.reduce((s, p) => s + p.value, 0);
  return {
    ...base, total, dc,
    success: dc === undefined ? undefined : total >= dc,
    nat20: base.natural === 20, nat1: base.natural === 1,
  };
}

export function skillCheck(c: Character, skill: Skill, dc?: number, o: RollOpts = {}): CheckResult {
  let adv = o.adv ?? 0, dis = o.dis ?? 0;
  if (hasCondition(c, 'poisoned') || hasCondition(c, 'frightened')) dis++;
  if (skill === 'athletics' && hasCondition(c, 'raging')) adv++;
  if (skill === 'survival' && hasFeature(c, 'natural_explorer')) adv++;
  if (skill === 'stealth' && c.equipment.body && ['chain_mail', 'scale_mail', 'splint_armor'].includes(c.equipment.body)) dis++;
  const mode = resolveMode(adv, dis);
  const r = d20WithLuck(c, mode, o.forcedRolls);
  const ab = SKILL_ABILITY[skill];
  const parts: BonusPart[] = [{ label: `${ABILITY_NAMES[ab]} modifier`, value: mod(c, ab) }];
  const total = skillBonus(c, skill);
  const profPart = total - mod(c, ab);
  if (profPart !== 0) {
    const label = c.expertise.includes(skill) ? 'Expertise' : c.skillProfs.includes(skill) ? 'Proficiency bonus' : 'Other bonuses';
    parts.push({ label, value: profPart });
  }
  parts.push(...conditionDice(c, 'check', o.consumeInspiration ?? true), ...(o.extra ?? []));
  return finish({ kind: 'skill', label: `${SKILL_NAMES[skill]} Check`, who: c.name, whoId: c.id, natural: r.natural, rolls: r.rolls, mode, parts }, dc);
}

export function abilityCheck(c: Character, ab: Ability, dc?: number, o: RollOpts = {}): CheckResult {
  let adv = o.adv ?? 0, dis = o.dis ?? 0;
  if (hasCondition(c, 'poisoned') || hasCondition(c, 'frightened')) dis++;
  if (ab === 'str' && hasCondition(c, 'raging')) adv++;
  const mode = resolveMode(adv, dis);
  const r = d20WithLuck(c, mode, o.forcedRolls);
  const parts: BonusPart[] = [{ label: `${ABILITY_NAMES[ab]} modifier`, value: mod(c, ab) }];
  const extra = abilityCheckBonus(c, ab) - mod(c, ab);
  if (extra) parts.push({ label: 'Jack of All Trades', value: extra });
  parts.push(...conditionDice(c, 'check', o.consumeInspiration ?? true), ...(o.extra ?? []));
  return finish({ kind: 'ability', label: `${ABILITY_NAMES[ab]} Check`, who: c.name, whoId: c.id, natural: r.natural, rolls: r.rolls, mode, parts }, dc);
}

export function savingThrow(c: Character, ab: Ability, dc: number, o: RollOpts & { vsMagic?: boolean; vs?: string } = {}): CheckResult {
  let adv = o.adv ?? 0, dis = o.dis ?? 0;
  const autoFail = (ab === 'str' || ab === 'dex') && (hasCondition(c, 'stunned') || hasCondition(c, 'incapacitated'));
  if (ab === 'dex') {
    if (hasCondition(c, 'dodging')) adv++;
    if (hasFeature(c, 'danger_sense')) adv++;
    if (hasCondition(c, 'restrained')) dis++;
  }
  if (ab === 'str' && hasCondition(c, 'raging')) adv++;
  if (o.vs === 'frightened' && c.ancestry === 'halfling') adv++;
  if (o.vs === 'charmed' && c.ancestry === 'elf') adv++;
  if (o.vs === 'poison' && c.ancestry === 'dwarf') adv++;
  if (o.vsMagic && c.ancestry === 'gnome' && (ab === 'int' || ab === 'wis' || ab === 'cha')) adv++;
  const mode = resolveMode(adv, dis);
  const r = d20WithLuck(c, mode, o.forcedRolls);
  const parts: BonusPart[] = [{ label: `${ABILITY_NAMES[ab]} modifier`, value: mod(c, ab) }];
  const extra = saveBonus(c, ab) - mod(c, ab);
  if (extra) parts.push({ label: c.saveProfs.includes(ab) ? 'Proficiency & items' : 'Items', value: extra });
  parts.push(...conditionDice(c, 'save', o.consumeInspiration ?? true), ...(o.extra ?? []));
  const res = finish({ kind: 'save', label: `${ABILITY_NAMES[ab]} Save`, who: c.name, whoId: c.id, natural: r.natural, rolls: r.rolls, mode, parts }, dc);
  if (autoFail) { res.success = false; res.parts.push({ label: 'Incapacitated — automatic failure', value: 0 }); }
  return res;
}

/** Contested check (e.g. Shove: Athletics vs Athletics/Acrobatics). Ties go to the defender. */
export function contest(attacker: Character, aSkill: Skill, defender: Character, dSkills: Skill[]): { a: CheckResult; d: CheckResult; attackerWins: boolean } {
  const a = skillCheck(attacker, aSkill);
  const best = dSkills.reduce((b, s) => (skillBonus(defender, s) > skillBonus(defender, b) ? s : b), dSkills[0]);
  const d = skillCheck(defender, best);
  a.kind = 'contest'; d.kind = 'contest';
  return { a, d, attackerWins: a.total > d.total };
}

export interface DeathSaveOutcome { result: CheckResult; outcome: 'success' | 'failure' | 'double_failure' | 'revive'; }

export function deathSave(c: Character): DeathSaveOutcome {
  const r = rollD20('normal');
  const parts: BonusPart[] = conditionDice(c, 'save', false);
  const res = finish({ kind: 'death', label: 'Death Saving Throw', who: c.name, whoId: c.id, natural: r.natural, rolls: r.rolls, mode: 'normal', parts }, 10);
  // Natural 20 and natural 1 have special meaning on death saves (unlike ordinary checks).
  if (res.natural === 20) return { result: res, outcome: 'revive' };
  if (res.natural === 1) { res.success = false; return { result: res, outcome: 'double_failure' }; }
  return { result: res, outcome: res.total >= 10 ? 'success' : 'failure' };
}

export function profBonusPart(c: Character): BonusPart {
  return { label: 'Proficiency bonus', value: prof(c) };
}

/** Human-readable breakdown, e.g. for the dice log and roll toasts. */
export function describeRoll(r: CheckResult): string {
  const faces = r.rolls.length > 1 ? `${r.rolls.join(' / ')} (${r.mode}) → ${r.natural}` : `${r.natural}`;
  const parts = r.parts.map((p) => `${p.label} ${signed(p.value)}`).join(', ');
  return `d20: ${faces}${parts ? '; ' + parts : ''}; total ${r.total}${r.dc !== undefined ? ` vs DC ${r.dc}` : ''}`;
}
