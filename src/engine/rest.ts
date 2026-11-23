import type { GameState } from './types';
import { activeParty, advanceTime, resonanceMax } from './state';
import { CLASS_BY_ID } from '../data/classes';
import { rollDice } from '../core/dice';
import { hasFeature, mod, syncResources, spellSlotsMax } from './character';
import { activeCompanionIds } from './state';

export function canShortRest(s: GameState): boolean {
  const limit = s.rules.limitedRest ? 1 : 2;
  return s.shortRestsSinceLong < limit;
}

/** Short rest: spend hit dice, recharge short-rest features and warlock slots. */
export function shortRest(s: GameState): string {
  if (!canShortRest(s)) return 'You are too restless for another short rest. You need a long rest.';
  s.shortRestsSinceLong++;
  advanceTime(s, 60);
  const party = activeParty(s);
  const songBonus = party.some((c) => hasFeature(c, 'song_of_rest')) ? rollDice('1d6').total : 0;
  const lines: string[] = [];
  for (const c of party) {
    if (c.hp <= 0) c.hp = 1;
    const die = CLASS_BY_ID[c.classId]?.hitDie ?? 8;
    let healed = 0;
    while (c.hitDice > 0 && c.hp < c.maxHp * 0.75) {
      c.hitDice--;
      const roll = Math.max(1, rollDice(`1d${die}`).total + mod(c, 'con'));
      healed += roll;
      c.hp = Math.min(c.maxHp, c.hp + roll);
    }
    if (songBonus) c.hp = Math.min(c.maxHp, c.hp + songBonus);
    for (const r of Object.values(c.resources)) if (r.recharge === 'short') r.used = 0;
    if (CLASS_BY_ID[c.classId]?.caster === 'pact') c.spellSlotsUsed = new Array(10).fill(0);
    if (c.resources.arcane_recovery && c.resources.arcane_recovery.used === 0) {
      // Arcane Recovery: regain slots up to half wizard level (rounded up), lowest first.
      let budget = Math.ceil(c.level / 2);
      for (let l = 1; l <= 5 && budget > 0; l++) {
        while (c.spellSlotsUsed[l] > 0 && budget >= l) { c.spellSlotsUsed[l]--; budget -= l; }
      }
      c.resources.arcane_recovery.used = 1;
    }
    c.conditions = c.conditions.filter((k) => k.duration < 0 && !['blessed', 'raging', 'inspired', 'hexed', 'marked', 'shielded'].includes(k.id));
    lines.push(`${c.name} ${healed ? `recovers ${healed} HP` : 'catches their breath'}`);
  }
  for (const id of activeCompanionIds(s)) s.companions[id].stress = Math.max(0, s.companions[id].stress - 2);
  return `Short rest (1 hour). ${lines.join('; ')}.`;
}

/** Long rest: full HP, spell slots, resources, half hit dice, resonance; clears stress partly. */
export function longRest(s: GameState): string {
  advanceTime(s, 8 * 60);
  s.shortRestsSinceLong = 0;
  for (const c of s.party) {
    if (c.dead) continue;
    c.hp = c.maxHp;
    c.tempHp = 0;
    c.hitDice = Math.min(c.level, c.hitDice + Math.max(1, Math.floor(c.level / 2)));
    c.spellSlotsUsed = new Array(10).fill(0);
    syncResources(c);
    for (const r of Object.values(c.resources)) r.used = 0;
    c.conditions = [];
    c.deathSaves = { successes: 0, failures: 0 };
    c.stable = false;
    void spellSlotsMax;
  }
  s.resonance.current = resonanceMax(s);
  for (const cs of Object.values(s.companions)) { cs.stress = Math.max(0, cs.stress - 5); cs.mood = Math.round(cs.mood * 0.5); }
  return 'Long rest (8 hours). Hit points, spell slots, abilities and resonance restored.';
}
