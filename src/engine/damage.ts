import type { Character, DamageType } from './types';
import { resistances } from './character';

export interface DamageResult { raw: number; dealt: number; note: string; dropped: boolean; }

/** Apply resistances, immunities, vulnerabilities and temporary HP. Does not handle death saves. */
export function applyDamage(c: Character, amount: number, type: DamageType): DamageResult {
  let dmg = Math.max(0, amount);
  let note = '';
  if (c.immunities?.includes(type)) { dmg = 0; note = 'immune'; }
  else {
    if (resistances(c).includes(type)) { dmg = Math.floor(dmg / 2); note = 'resisted'; }
    if (c.vulnerabilities?.includes(type)) { dmg *= 2; note = note ? '' : 'vulnerable!'; }
  }
  const wasUp = c.hp > 0;
  let rest = dmg;
  if (c.tempHp > 0) {
    const absorbed = Math.min(c.tempHp, rest);
    c.tempHp -= absorbed;
    rest -= absorbed;
  }
  c.hp = Math.max(0, c.hp - rest);
  return { raw: amount, dealt: dmg, note, dropped: wasUp && c.hp === 0 };
}

export function heal(c: Character, amount: number): number {
  if (c.dead) return 0;
  const before = c.hp;
  c.hp = Math.min(c.maxHp, c.hp + Math.max(0, amount));
  if (c.hp > 0) { c.deathSaves = { successes: 0, failures: 0 }; c.stable = false; }
  return c.hp - before;
}
