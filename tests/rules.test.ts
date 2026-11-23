import { describe, it, expect, afterEach } from 'vitest';
import { abilityMod, proficiencyBonus, levelForXp } from '../src/rules/abilities';
import { skillCheck, savingThrow, deathSave } from '../src/rules/checks';
import { armorClass, skillBonus, computeMaxHp, applyLevelUp, autoLevelChoices, spellSlotsMax, canLevelUp, createEnemy } from '../src/engine/character';
import { applyDamage } from '../src/engine/damage';
import { queueRandom, setRandomSource } from '../src/core/rng';
import { makePlayer } from './helpers';
import { CLASSES } from '../src/data/classes';
import { createCharacter } from '../src/engine/character';
import { XP_TABLE } from '../src/rules/abilities';

afterEach(() => setRandomSource(null));
const face = (n: number) => (n - 1) / 20 + 0.001; // rng value that yields d20 face n

describe('core rules', () => {
  it('ability modifiers and proficiency', () => {
    expect(abilityMod(10)).toBe(0); expect(abilityMod(8)).toBe(-1); expect(abilityMod(15)).toBe(2); expect(abilityMod(20)).toBe(5);
    expect(proficiencyBonus(1)).toBe(2); expect(proficiencyBonus(5)).toBe(3); expect(proficiencyBonus(17)).toBe(6);
    expect(levelForXp(299)).toBe(1); expect(levelForXp(300)).toBe(2); expect(levelForXp(355000)).toBe(20);
  });
  it('skill checks add the right modifiers', () => {
    const p = makePlayer('fighter'); // human: WIS 13 -> +1, perception proficient (+2)
    expect(skillBonus(p, 'perception')).toBe(3);
    queueRandom([face(13)]);
    const r = skillCheck(p, 'perception', 15);
    expect(r.natural).toBe(13);
    expect(r.total).toBe(16);
    expect(r.success).toBe(true);
  });
  it('natural 20 on an ability check is not an automatic success', () => {
    const p = makePlayer('fighter');
    queueRandom([face(20)]);
    const r = skillCheck(p, 'arcana', 30);
    expect(r.nat20).toBe(true);
    expect(r.success).toBe(false);
  });
  it('stunned creatures automatically fail Dexterity saves', () => {
    const p = makePlayer('fighter');
    p.conditions.push({ id: 'stunned', duration: 1 });
    queueRandom([face(20)]);
    expect(savingThrow(p, 'dex', 5).success).toBe(false);
  });
  it('poisoned gives disadvantage on checks', () => {
    const p = makePlayer('fighter');
    p.conditions.push({ id: 'poisoned', duration: 2 });
    queueRandom([face(18), face(3)]);
    const r = skillCheck(p, 'athletics');
    expect(r.mode).toBe('disadvantage');
    expect(r.natural).toBe(3);
  });
  it('death saves: natural 1 counts double, natural 20 revives', () => {
    const p = makePlayer();
    queueRandom([face(1)]); expect(deathSave(p).outcome).toBe('double_failure');
    queueRandom([face(20)]); expect(deathSave(p).outcome).toBe('revive');
    queueRandom([face(10)]); expect(deathSave(p).outcome).toBe('success');
    queueRandom([face(9)]); expect(deathSave(p).outcome).toBe('failure');
  });
  it('armour class: chain mail + shield + defence style', () => {
    const p = makePlayer('fighter');
    expect(armorClass(p)).toBe(16 + 2 + 1);
  });
  it('resistance, vulnerability, immunity and temp HP', () => {
    const e = createEnemy('ossuary_guard');
    e.hp = e.maxHp = 40;
    const hp = e.hp;
    applyDamage(e, 4, 'bludgeoning');
    expect(e.hp).toBe(hp - 8);
    const echo = createEnemy('hollow_echo');
    echo.hp = echo.maxHp = 40;
    const ehp = echo.hp;
    applyDamage(echo, 9, 'slashing');
    expect(echo.hp).toBe(ehp - 4);
    applyDamage(echo, 5, 'poison');
    expect(echo.hp).toBe(ehp - 4);
    const p = makePlayer();
    p.tempHp = 5; const php = p.hp;
    applyDamage(p, 7, 'slashing');
    expect(p.tempHp).toBe(0); expect(p.hp).toBe(php - 2);
  });
  it('every class can be created and levelled 1→20 with valid state', () => {
    for (const cls of CLASSES) {
      const c = createCharacter({ id: 'x', name: 'X', kind: 'player', ancestry: 'human', classId: cls.id, background: 'scholar',
        baseAbilities: cls.suggested, skills: cls.skillChoices.slice(0, cls.skillCount), expertise: cls.id === 'rogue' ? [cls.skillChoices[0], cls.skillChoices[1]] : [] });
      expect(c.hp).toBe(computeMaxHp(c));
      for (let l = 2; l <= 20; l++) {
        c.xp = XP_TABLE[l];
        expect(canLevelUp(c)).toBe(true);
        applyLevelUp(c, autoLevelChoices(c));
        expect(c.level).toBe(l);
      }
      expect(c.subclassId).toBeTruthy();
      expect(c.maxHp).toBeGreaterThan(40);
      if (cls.caster === 'full') expect(spellSlotsMax(c)[9]).toBeGreaterThan(0);
      for (const a of Object.values(c.abilities)) expect(a).toBeLessThanOrEqual(20);
    }
  });
});
