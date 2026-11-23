import { describe, it, expect, afterEach } from 'vitest';
import { Combat } from '../src/engine/combat/combat';
import { ENCOUNTERS } from '../src/data/encounters';
import { setRandomSource, seeded } from '../src/core/rng';
import { applyLevelUp, autoLevelChoices } from '../src/engine/character';
import { XP_TABLE } from '../src/rules/abilities';
import { ACTION_BY_ID } from '../src/data/actions';
import { makeGame } from './helpers';
import { simulate, stageFor } from './sim';
import type { GameState } from '../src/engine/types';

afterEach(() => setRandomSource(null));

function levelParty(s: GameState, level: number) {
  for (const c of s.party) while (c.level < level) { c.xp = XP_TABLE[c.level + 1]; applyLevelUp(c, autoLevelChoices(c)); }
}

describe('combat engine', () => {
  it('rolls initiative, orders turns and respects action economy', () => {
    setRandomSource(seeded(1));
    const s = makeGame();
    stageFor(s, 'enc_fog_random');
    const cb = new Combat(s, 'enc_fog_random');
    expect(cb.order.length).toBe(6);
    const c = cb.current();
    const atk = ACTION_BY_ID.dodge;
    if (c.side === 'party' && c.char.kind !== 'enemy') {
      cb.perform(c, 'dodge');
      expect(cb.canUse(c, atk).ok).toBe(false);
    }
    expect(() => cb.perform(cb.combatants.find((x) => x.id !== cb.current().id)!, 'dodge')).toThrow();
  });

  it('prevents illegal moves and attacks', () => {
    setRandomSource(seeded(2));
    const s = makeGame();
    stageFor(s, 'enc_mill');
    const cb = new Combat(s, 'enc_mill');
    const c = cb.current();
    const far = cb.enemiesOf(c).find((e) => Math.max(Math.abs(e.x - c.x), Math.abs(e.y - c.y)) > 2);
    if (far && c.char.kind !== 'enemy') expect(() => cb.perform(c, 'attack', { id: far.id })).toThrow();
    expect(() => cb.moveAlong(c, Array.from({ length: 40 }, (_, i) => ({ x: c.x + i + 1, y: c.y })))).toThrow();
  });

  it('every encounter terminates without illegal AI actions (several seeds)', () => {
    for (const enc of ENCOUNTERS) {
      for (let seed = 1; seed <= 4; seed++) {
        setRandomSource(seeded(seed * 97 + enc.id.length));
        const s = makeGame(['brakka', 'ilyra', 'vaelis']);
        levelParty(s, enc.id === 'enc_bellwarden' || enc.id === 'enc_ysolt' || enc.id === 'enc_sentinel' ? 3 : 2);
        stageFor(s, enc.id);
        const r = simulate(s, enc.id);
        expect(r.illegal, `${enc.id} seed ${seed}`).toEqual([]);
        expect(r.result, `${enc.id} seed ${seed}`).not.toBe('timeout');
      }
    }
  });

  it('different party compositions can fight (all 10 companions)', () => {
    const groups = [['kael', 'seris', 'nima'], ['orren', 'varek', 'tessa'], ['korr', 'brakka', 'vaelis'], ['ilyra', 'tessa', 'kael']];
    for (const g of groups) {
      setRandomSource(seeded(g.join('').length));
      const s = makeGame(g, 'wizard');
      levelParty(s, 3);
      stageFor(s, 'enc_ossuary');
      const r = simulate(s, 'enc_ossuary');
      expect(r.illegal, g.join(',')).toEqual([]);
      expect(r.result).not.toBe('timeout');
    }
  });

  it('a level-3 party usually beats the Bellwarden on Adventurer', () => {
    let wins = 0;
    for (let seed = 1; seed <= 12; seed++) {
      setRandomSource(seeded(seed * 31));
      const s = makeGame(['brakka', 'ilyra', 'vaelis']);
      levelParty(s, 3);
      stageFor(s, 'enc_bellwarden');
      if (simulate(s, 'enc_bellwarden').result === 'victory') wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(6);
  });
});

describe('action economy regression', () => {
  it('Action Surge grants exactly one more Attack action', () => {
    setRandomSource(seeded(5));
    const s = makeGame();
    stageFor(s, 'enc_sentinel');
    const cb = new Combat(s, 'enc_sentinel');
    const me = cb.combatants.find((c) => c.char.kind === 'player')!;
    const foe = cb.combatants.find((c) => c.side === 'enemy')!;
    foe.char.hp = foe.char.maxHp = 999;
    cb.order = [me.id, ...cb.order.filter((id) => id !== me.id)];
    cb.turnIndex = 0;
    me.x = foe.x; me.y = foe.y - 1; me.action = true; me.attacksLeft = 0; me.attackActionStarted = false;
    let attacks = 0;
    for (let i = 0; i < 10; i++) {
      if (cb.canUse(me, ACTION_BY_ID.attack).ok) { cb.perform(me, 'attack', { id: foe.id }); attacks++; }
      else if (cb.canUse(me, ACTION_BY_ID.action_surge).ok) cb.perform(me, 'action_surge');
    }
    expect(attacks).toBe(1); // level 1 fighter: no Action Surge yet, one attack
    me.char.level = 2;
    me.char.resources.action_surge = { max: 1, used: 0, recharge: 'short' };
    me.action = true; me.attacksLeft = 0;
    attacks = 0;
    for (let i = 0; i < 10; i++) {
      if (cb.canUse(me, ACTION_BY_ID.attack).ok) { cb.perform(me, 'attack', { id: foe.id }); attacks++; }
      else if (cb.canUse(me, ACTION_BY_ID.action_surge).ok) cb.perform(me, 'action_surge');
    }
    expect(attacks).toBe(2);
  });
});
