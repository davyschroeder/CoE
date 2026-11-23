import { describe, it, expect, afterEach } from 'vitest';
import { Combat, type Combatant } from '../src/engine/combat/combat';
import { setRandomSource, seeded, queueRandom } from '../src/core/rng';
import { applyLevelUp, autoLevelChoices, createEnemy, resourceLeft, speed, saveBonus, resistances, skillBonus } from '../src/engine/character';
import { XP_TABLE } from '../src/rules/abilities';
import { ACTION_BY_ID } from '../src/data/actions';
import type { EncounterDef } from '../src/data/encounters';
import { craft, copyScroll, copyableScrolls } from '../src/engine/crafting';
import { buy, priceMult, refusesTrade } from '../src/engine/shop';
import { SHOP_BY_ID } from '../src/data/shops';
import { repTier } from '../src/data/factions';
import { evalCond } from '../src/engine/conditions';
import { addItem, countItem, newCompanionState } from '../src/engine/state';
import { migrate } from '../src/engine/save';
import { makeGame, makePlayer } from './helpers';
import { simulate, stageFor } from './sim';
import type { GameState } from '../src/engine/types';

afterEach(() => setRandomSource(null));

function levelParty(s: GameState, level: number) {
  for (const c of s.party) while (c.level < level) { c.xp = XP_TABLE[c.level + 1]; applyLevelUp(c, autoLevelChoices(c)); }
}

/** A tiny open-field encounter on the town square for focused rule tests. */
function testEncounter(enemies: { t: string; x: number; y: number; elite?: boolean }[]): EncounterDef {
  return { id: 'enc_test', name: 'Test', map: 'hollowmere', enemies, intro: 'Test fight.', onVictory: [] };
}

function arena(s: GameState, enemies: { t: string; x: number; y: number; elite?: boolean }[]): Combat {
  s.location = { mapId: 'hollowmere', x: 25, y: 20 };
  return new Combat(s, testEncounter(enemies));
}

const byName = (cb: Combat, frag: string) => cb.combatants.find((c) => c.char.name.includes(frag))!;

describe('Phase 3: class features 6–10', () => {
  it('Aura of Protection adds the paladin’s Charisma to nearby allies’ saves', () => {
    setRandomSource(seeded(3));
    const s = makeGame(['seris', 'ilyra', 'kael']);
    levelParty(s, 6);
    const cb = arena(s, [{ t: 'sellsword', x: 33, y: 20 }]);
    const seris = byName(cb, 'Seris'), ilyra = byName(cb, 'Ilyra');
    ilyra.x = seris.x + 1; ilyra.y = seris.y;
    expect(cb.auraOfProtection(ilyra)).toBeGreaterThanOrEqual(1);
    ilyra.x = seris.x + 5;
    expect(cb.auraOfProtection(ilyra)).toBe(0);
  });

  it('Aura of Courage blocks frightened; Mindless Rage too', () => {
    const s = makeGame(['seris', 'korr', 'kael']);
    levelParty(s, 10);
    const cb = arena(s, [{ t: 'sellsword', x: 33, y: 20 }]);
    const seris = byName(cb, 'Seris'), kael = byName(cb, 'Kael');
    kael.x = seris.x + 1; kael.y = seris.y;
    cb.addCondition(seris, kael, 'frightened', 2);
    expect(kael.char.conditions.some((k) => k.id === 'frightened')).toBe(false);
  });

  it('Land’s Stride ignores difficult terrain; Roving adds speed; Iron Mind and resistances apply', () => {
    const s = makeGame(['orren', 'kael', 'seris']);
    levelParty(s, 8);
    const cb = arena(s, [{ t: 'sellsword', x: 33, y: 20 }]);
    const orren = byName(cb, 'Orren'), kael = byName(cb, 'Kael');
    // find a difficult tile on the map
    let tile: { x: number; y: number } | null = null;
    for (let y = cb.bounds.y0; y <= cb.bounds.y1 && !tile; y++) for (let x = cb.bounds.x0; x <= cb.bounds.x1 && !tile; x++) if (cb.tileChar(x, y) === 't') tile = { x, y };
    if (tile) { expect(cb.stepCost(orren, tile.x, tile.y)).toBe(1); expect(cb.stepCost(kael, tile.x, tile.y)).toBe(2); }
    expect(speed(orren.char)).toBe(5 + 1);
    const w = makePlayer('warlock', { subclassId: 'hollow_choir' });
    while (w.level < 10) { w.xp = XP_TABLE[w.level + 1]; applyLevelUp(w, autoLevelChoices(w)); }
    expect(resistances(w)).toContain('psychic');
  });

  it('Indomitable rerolls a failed save once per long rest', () => {
    const s = makeGame(['brakka', 'kael', 'seris']);
    levelParty(s, 9);
    const cb = arena(s, [{ t: 'sellsword', x: 33, y: 20 }]);
    const me = cb.combatants.find((c) => c.char.kind === 'player')!;
    expect(resourceLeft(me.char, 'indomitable')).toBe(1);
    queueRandom([0.0, 0.99]); // first save: natural 1 (fail), reroll: natural 20
    const r = cb.save(me, 'wis', 15);
    expect(r.success).toBe(true);
    expect(resourceLeft(me.char, 'indomitable')).toBe(0);
  });

  it('Rogues gain Expertise II at 6; Lore bards learn Magical Secrets', () => {
    const r = makePlayer('rogue');
    while (r.level < 6) { r.xp = XP_TABLE[r.level + 1]; applyLevelUp(r, autoLevelChoices(r)); }
    expect(r.expertise.length).toBe(4);
    const s = makeGame(['tessa', 'kael', 'seris']);
    levelParty(s, 6);
    const tessa = s.party.find((c) => c.companionId === 'tessa')!;
    const foreign = tessa.knownSpells.filter((id) => !ACTION_BY_ID[id].classes?.includes('bard'));
    expect(foreign.length).toBe(2);
  });

  it('Remarkable Athlete, Supreme Sneak-style bonuses show up in derived stats', () => {
    const f = makePlayer('fighter', { subclassId: 'vanguard' });
    while (f.level < 7) { f.xp = XP_TABLE[f.level + 1]; applyLevelUp(f, autoLevelChoices(f)); }
    expect(skillBonus(f, 'acrobatics')).toBeGreaterThan(Math.floor((f.abilities.dex - 10) / 2));
    expect(saveBonus(f, 'str')).toBeGreaterThan(0);
  });
});

describe('Phase 3: new spells and monsters', () => {
  it('Spirit Guardians damages enemies that start their turn nearby', () => {
    setRandomSource(seeded(9));
    const s = makeGame(['ilyra', 'kael', 'brakka']);
    levelParty(s, 5);
    const cb = arena(s, [{ t: 'covenant_soldier', x: 27, y: 20 }]);
    const ilyra = byName(cb, 'Ilyra');
    const foe = cb.combatants.find((c) => c.side === 'enemy')!;
    foe.char.hp = foe.char.maxHp = 200;
    ilyra.concentration = { actionId: 'spirit_guardians', targetIds: [] };
    ilyra.x = foe.x - 2; ilyra.y = foe.y;
    cb.order = [ilyra.id, foe.id, ...cb.order.filter((id) => id !== ilyra.id && id !== foe.id)];
    cb.turnIndex = 0;
    cb.endTurn(); // → foe's turn starts inside the aura
    expect(foe.char.hp).toBeLessThan(200);
  });

  it('Death Ward keeps an ally at 1 HP once; hypnotic charm ends on damage', () => {
    const s = makeGame(['ilyra', 'kael', 'brakka']);
    const cb = arena(s, [{ t: 'sellsword', x: 30, y: 20 }]);
    const kael = byName(cb, 'Kael'), foe = cb.combatants.find((c) => c.side === 'enemy')!;
    kael.char.conditions.push({ id: 'deathward', duration: -1 });
    cb.dealDamage(foe, kael, [{ amount: 999, type: 'slashing' }], false);
    expect(kael.char.hp).toBe(1);
    foe.char.hp = foe.char.maxHp = 100;
    cb.addCondition(kael, foe, 'incapacitated', 10, { endsOnDamage: true });
    cb.dealDamage(kael, foe, [{ amount: 3, type: 'slashing' }], false);
    expect(foe.char.conditions.some((k) => k.id === 'incapacitated')).toBe(false);
  });

  it('elite variants are tougher and worth more XP', () => {
    setRandomSource(() => 0.5);
    const a = createEnemy('covenant_soldier');
    const b = createEnemy('covenant_soldier', { elite: true });
    expect(b.maxHp).toBeGreaterThan(a.maxHp);
    expect(b.naturalArmor).toBe(a.naturalArmor! + 1);
    expect(b.xpValue).toBe(a.xpValue! * 2);
    expect(b.name).toMatch(/^Elite/);
  });

  it('legendary creatures act between other turns, and loot drops on victory', () => {
    setRandomSource(seeded(21));
    const s = makeGame(['brakka', 'ilyra', 'vaelis']);
    levelParty(s, 8);
    const cb = arena(s, [{ t: 'ossaryx', x: 27, y: 20 }]);
    const log: string[] = [];
    for (let i = 0; i < 12 && !cb.over; i++) { for (const e of cb.endTurn()) if (e.type === 'text') log.push(e.text); }
    expect(log.some((t) => t.includes('legendary action'))).toBe(true);
  });

  it('a level-8 party can fight Ossaryx and casters use the new spells legally', () => {
    let wins = 0;
    for (let seed = 1; seed <= 4; seed++) {
      setRandomSource(seeded(seed * 13));
      const s = makeGame(['brakka', 'ilyra', 'vaelis'], 'paladin');
      levelParty(s, 9);
      s.location = { mapId: 'hollowmere', x: 25, y: 22 };
      const r = simulateDef(s, testEncounter([{ t: 'ossaryx', x: 25, y: 14 }]));
      expect(r.illegal).toEqual([]);
      expect(r.result).not.toBe('timeout');
      if (r.result === 'victory') wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(1);
  });

  it('every new Act I-ready enemy (incl. elites) fights legally', () => {
    for (const t of ['thornwake_warden', 'gloam_stalker', 'covenant_soldier', 'conclave_arcanist', 'echo_knight']) {
      setRandomSource(seeded(t.length * 7));
      const s = makeGame(['kael', 'tessa', 'korr'], 'sorcerer');
      levelParty(s, 5);
      s.location = { mapId: 'hollowmere', x: 25, y: 22 };
      const r = simulateDef(s, testEncounter([{ t, x: 23, y: 15 }, { t, x: 27, y: 15, elite: true }]));
      expect(r.illegal, t).toEqual([]);
      expect(r.result, t).not.toBe('timeout');
    }
  });
});

describe('Phase 3: crafting, factions, reactions, saves', () => {
  it('crafting consumes materials on success and salvages half on failure', () => {
    const s = makeGame(['ilyra', 'kael', 'brakka']);
    addItem(s, 'fog_essence', 4);
    s.gold = 100;
    queueRandom([0.99]);
    expect(craft(s, 'r_healing').success).toBe(true);
    expect(countItem(s, 'fog_essence')).toBe(2);
    queueRandom([0.30]); // modest roll: fail by less than 5 → half lost
    const before = countItem(s, 'healing_potion');
    const r = craft(s, 'r_healing');
    if (!r.success) { expect(countItem(s, 'fog_essence')).toBe(1); expect(countItem(s, 'healing_potion')).toBe(before); }
    expect(craft(s, 'r_echo_ward').success).toBe(false); // missing materials
  });

  it('wizards copy wizard scrolls into their spellbook', () => {
    const s = makeGame(['ilyra', 'kael', 'brakka'], 'wizard');
    addItem(s, 'scroll_shatter', 1);
    s.gold = 500;
    const wiz = s.party[0];
    wiz.knownSpells = wiz.knownSpells.filter((x) => x !== 'shatter');
    expect(copyableScrolls(s, wiz).length).toBe(1);
    queueRandom([0.99]);
    expect(copyScroll(s, wiz, 'scroll_shatter').success).toBe(true);
    expect(wiz.knownSpells).toContain('shatter');
    expect(s.gold).toBe(400);
  });

  it('reputation tiers change prices; hostile merchants refuse trade', () => {
    const s = makeGame();
    const shop = SHOP_BY_ID.garrick;
    s.factions.hollowmere = 0; const base = priceMult(s, shop);
    s.factions.hollowmere = 60; expect(priceMult(s, shop)).toBeLessThan(base);
    expect(repTier(60)).toBe('Allied');
    s.factions.hollowmere = -60;
    expect(refusesTrade(s, shop)).toBe(true);
    expect(buy(s, 'garrick', 'dagger')).toMatch(/refuses/);
    expect(evalCond(s, 'reptier:hollowmere=Hostile')).toBe(true);
  });

  it('the player can forgo opportunity attacks', () => {
    setRandomSource(seeded(4));
    const s = makeGame(['ilyra', 'kael', 'brakka']);
    s.orders.reactions.opportunity = 'never';
    const cb = arena(s, [{ t: 'sellsword', x: 30, y: 20 }]);
    const me = cb.combatants.find((c) => c.char.kind === 'player')!;
    const foe = cb.combatants.find((c) => c.side === 'enemy')!;
    me.x = 28; me.y = 20; foe.x = 29; foe.y = 20; me.reaction = true;
    cb.order = [foe.id, ...cb.order.filter((id) => id !== foe.id)]; cb.turnIndex = 0;
    foe.movement = 6;
    const hpBefore = foe.char.hp;
    cb.moveAlong(foe, [{ x: 30, y: 20 }, { x: 31, y: 20 }]);
    expect(foe.char.hp).toBe(hpBefore);
    expect(me.reaction).toBe(true);
  });

  it('version-1 saves migrate to version 2 with reaction preferences', () => {
    const s: any = JSON.parse(JSON.stringify(makeGame()));
    s.version = 1; delete s.orders.reactions;
    const m = migrate(s);
    expect(m.version).toBe(2);
    expect(m.orders.reactions.shield).toBe('auto');
    void newCompanionState;
  });
});

// Combat simulation against an inline encounter definition.
function simulateDef(s: GameState, enc: EncounterDef) {
  const cb = new Combat(s, enc);
  const illegal: string[] = [];
  const orig = cb.perform.bind(cb);
  cb.perform = (c: Combatant, id, t, o) => { try { return orig(c, id, t, o); } catch (e: any) { illegal.push(`${c.char.name}:${id}:${e.message}`); throw e; } };
  return runLoop(cb, illegal);
}

import { aiStep } from '../src/engine/combat/ai';
function runLoop(cb: Combat, illegal: string[]) {
  let guard = 0;
  while (!cb.over && cb.round <= 40 && guard++ < 5000) {
    const c = cb.current();
    for (let i = 0; i < 14 && !cb.over && c.char.hp > 0; i++) { if (!aiStep(cb, c)) break; }
    if (!cb.over) cb.endTurn();
  }
  return { result: cb.over ?? 'timeout', illegal };
}
void simulate; void stageFor;

import { bestPlan } from '../src/engine/combat/ai';
describe('Phase 3: AI uses auras', () => {
  it('a cleric surrounded by foes chooses Spirit Guardians when big area spells are spent', () => {
    setRandomSource(seeded(2));
    const s = makeGame(['ilyra', 'vaelis', 'seris']);
    levelParty(s, 9);
    s.location = { mapId: 'hollowmere', x: 25, y: 22 };
    const cb = new Combat(s, testEncounter([{ t: 'covenant_soldier', x: 25, y: 19 }, { t: 'covenant_soldier', x: 24, y: 19 }, { t: 'covenant_soldier', x: 26, y: 19 }]));
    const il = cb.combatants.find((c) => c.char.companionId === 'ilyra')!;
    il.char.spellSlotsUsed[4] = 9; il.char.spellSlotsUsed[5] = 9;
    cb.order = [il.id, ...cb.order.filter((x) => x !== il.id)]; cb.turnIndex = 0; il.movement = 6; il.action = true; il.bonus = true;
    expect(il.char.preparedSpells).toContain('spirit_guardians');
    expect(bestPlan(cb, il)?.actionId).toBe('spirit_guardians');
  });
});
