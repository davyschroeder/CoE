/**
 * Turn-based tactical combat on a square grid (1 square = 5 ft).
 *
 * The engine is the single authority on the rules: both the player UI and the CPU AI must go
 * through `canUse`, `validTargets`, `moveAlong` and `perform`, so the AI cannot cheat.
 */
import type { Ability, Character, ConditionId, DamageType, GameState, ActiveCondition } from '../types';
import { ACTION_BY_ID, type ActionDef } from '../../data/actions';
import { ENCOUNTER_BY_ID, type EncounterDef } from '../../data/encounters';
import { ENEMY_BY_ID } from '../../data/enemies';
import type { MapDef } from '../../data/maps/types';
import { tile } from '../../data/maps/tiles';
import { ITEM_BY_ID } from '../../data/items';
import { getMap, tileAt, lineOfSight, objectsAt, isBlockingObject } from '../exploration';
import {
  armorClass, attacksPerAction, availableActionIds, castableSpells, critRange, createEnemy, hasCondition, hasFeature,
  initiativeBonus, lowestFreeSlot, mainWeapon, mod, offhandWeapon, isRangedWeapon, prof, resourceLeft, saveBonus,
  spellAttackBonus, spellMod, spellSaveDC, speed, weaponAttackBonus, weaponDamageBonus, weaponDice, weaponRange,
  cantripDiceMultiplier, creatureType, slotsAvailable,
} from '../character';
import { rollD20, rollDice, rollDie, resolveMode, averageDice, type RollMode } from '../../core/dice';
import { savingThrow, skillCheck, deathSave, contest, type CheckResult, type BonusPart } from '../../rules/checks';
import { applyDamage, heal } from '../damage';
import { activeParty, addLog, recordRoll, mapRuntime } from '../state';
import { instability } from '../exploration';
import { evalCond } from '../conditions';
import { chance, random } from '../../core/rng';
import { ABILITY_NAMES } from '../../rules/abilities';

// ─────────────────────────────── Types

export interface Combatant {
  id: string;
  char: Character;
  side: 'party' | 'enemy';
  x: number;
  y: number;
  initiative: number;
  movement: number;
  action: boolean;
  bonus: boolean;
  reaction: boolean;
  attacksLeft: number;      // remaining attacks from the current Attack action
  attackActionStarted: boolean;
  hasActed: boolean;
  concentration?: { actionId: string; targetIds: string[] };
  quickened: boolean;
  onceFlags: string[];      // per-turn once effects (sneak attack, colossus slayer...)
  fuse?: string;            // barrel id lit this turn
  removed: boolean;         // dead enemy removed from the board / fled
  summoned?: boolean;
}

export interface CombatObject { id: string; kind: 'pillar' | 'barrel'; name: string; x: number; y: number; hp: number; maxHp: number; ac: number; destroyed: boolean; }

export interface Fire { x: number; y: number; rounds: number; }

export type CombatEvent =
  | { type: 'move'; id: string; path: { x: number; y: number }[] }
  | { type: 'attack'; attackerId: string; targetId: string; roll: number; total: number; ac: number; hit: boolean; crit: boolean; mode: RollMode; label: string }
  | { type: 'damage'; targetId: string; amount: number; dtype: string; note: string }
  | { type: 'heal'; targetId: string; amount: number }
  | { type: 'save'; targetId: string; result: CheckResult }
  | { type: 'condition'; targetId: string; condition: ConditionId; added: boolean }
  | { type: 'aoe'; tiles: { x: number; y: number }[]; actionId: string; color: string }
  | { type: 'down'; targetId: string; dead: boolean }
  | { type: 'explosion'; x: number; y: number }
  | { type: 'text'; text: string; kind?: 'info' | 'bark' | 'phase' | 'crit' }
  | { type: 'spawn'; id: string };

export type Target = { id: string } | { x: number; y: number };

export interface CombatSettings {
  enemyHpMult: number;
  enemyAttackBonus: number;
  aiNoise: number;
}

export const DIFFICULTY_SETTINGS: Record<string, CombatSettings> = {
  storyteller: { enemyHpMult: 0.7, enemyAttackBonus: -1, aiNoise: 1.0 },
  adventurer: { enemyHpMult: 1.0, enemyAttackBonus: 0, aiNoise: 0.5 },
  veteran: { enemyHpMult: 1.15, enemyAttackBonus: 1, aiNoise: 0.25 },
  tactician: { enemyHpMult: 1.3, enemyAttackBonus: 1, aiNoise: 0.05 },
};

const key = (x: number, y: number) => `${x},${y}`;
export const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

// ─────────────────────────────── Engine

export class Combat {
  map: MapDef;
  encounter: EncounterDef;
  combatants: Combatant[] = [];
  order: string[] = [];
  turnIndex = 0;
  round = 1;
  objects: CombatObject[] = [];
  fires: Fire[] = [];
  events: CombatEvent[] = [];
  over: null | 'victory' | 'defeat' | 'fled' = null;
  bounds: { x0: number; y0: number; x1: number; y1: number };
  settings: CombatSettings;
  phase = 1;
  lastPlayerTarget: string | null = null;
  xpEarned = 0;
  private destroyedTiles: string[] = [];

  loot: { itemId: string; qty: number }[] = [];
  goldLoot = 0;
  legendaryLeft = new Map<string, number>();

  constructor(public s: GameState, encounter: string | EncounterDef, opts: { ambush?: 'party' | 'enemy' } = {}) {
    const enc = typeof encounter === 'string' ? ENCOUNTER_BY_ID[encounter] : encounter;
    if (!enc) throw new Error(`Unknown encounter ${encounter}`);
    this.encounter = enc;
    this.map = getMap(enc.map);
    this.settings = DIFFICULTY_SETTINGS[s.difficulty] ?? DIFFICULTY_SETTINGS.adventurer;
    const lead = { x: s.location.x, y: s.location.y };
    const occupied = new Set<string>();
    // Party placement around the leader.
    const party = activeParty(s);
    const spots = this.freeSpotsNear(lead.x, lead.y, party.length, occupied);
    party.forEach((c, i) => {
      const p = spots[i] ?? lead;
      occupied.add(key(p.x, p.y));
      this.combatants.push(this.makeCombatant(c, 'party', p.x, p.y));
    });
    // Enemies
    const inst = instability(s, this.map.id);
    enc.enemies.forEach((e, i) => {
      const echo = inst >= 5 && !ENEMY_BOSS.has(e.t) && chance(0.25);
      const ch = createEnemy(e.t, { hpMult: this.settings.enemyHpMult, echoTouched: echo, idSuffix: `${i}`, elite: e.elite });
      let x = e.x, y = e.y;
      if (enc.relative) { x = lead.x + e.x; y = lead.y + e.y; }
      const p = this.freeSpotsNear(x, y, 1, occupied)[0] ?? { x, y };
      occupied.add(key(p.x, p.y));
      this.combatants.push(this.makeCombatant(ch, 'enemy', p.x, p.y));
    });
    for (const o of enc.objects ?? []) this.objects.push({ ...o, maxHp: o.hp, destroyed: false });
    this.bounds = this.computeBounds();
    // Explosive barrels from the map grid inside the arena.
    for (let y = this.bounds.y0; y <= this.bounds.y1; y++) for (let x = this.bounds.x0; x <= this.bounds.x1; x++) {
      if (tileAt(s, this.map, x, y) === 'b') this.objects.push({ id: `tile_${x}_${y}`, kind: 'barrel', name: 'Barrel of Lamp Oil', x, y, hp: 4, maxHp: 4, ac: 10, destroyed: false });
    }
    // Story-driven surprise: e.g. a trap the party saw coming and turned on its springers.
    const ambush = opts.ambush ?? (enc.surpriseIf && evalCond(s, enc.surpriseIf) ? 'party' : undefined);
    this.rollInitiative(ambush);
    this.log(enc.intro, 'info');
    this.startTurn();
  }

  private makeCombatant(c: Character, side: 'party' | 'enemy', x: number, y: number): Combatant {
    return { id: c.id, char: c, side, x, y, initiative: 0, movement: 0, action: true, bonus: true, reaction: true, attacksLeft: 0, attackActionStarted: false, hasActed: false, quickened: false, onceFlags: [], removed: false };
  }

  private computeBounds() {
    const W = this.map.grid[0].length, H = this.map.grid.length;
    const pts = [...this.combatants, ...this.objects];
    let x0 = Math.min(...pts.map((p) => p.x)) - 4, x1 = Math.max(...pts.map((p) => p.x)) + 4;
    let y0 = Math.min(...pts.map((p) => p.y)) - 3, y1 = Math.max(...pts.map((p) => p.y)) + 3;
    const grow = (lo: number, hi: number, min: number, max: number) => {
      while (hi - lo + 1 < min) { lo--; hi++; }
      return [lo, hi];
    };
    [x0, x1] = grow(x0, x1, 16, W);
    [y0, y1] = grow(y0, y1, 11, H);
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W - 1, x1); y1 = Math.min(H - 1, y1);
    return { x0, y0, x1, y1 };
  }

  freeSpotsNear(x: number, y: number, n: number, occupied: Set<string>): { x: number; y: number }[] {
    const out: { x: number; y: number }[] = [];
    const seen = new Set<string>([key(x, y)]);
    const q = [{ x, y }];
    while (q.length && out.length < n) {
      const p = q.shift()!;
      if (this.walkableBase(p.x, p.y) && !occupied.has(key(p.x, p.y))) out.push(p);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const nx = p.x + dx, ny = p.y + dy;
        if (seen.has(key(nx, ny)) || nx < 0 || ny < 0 || ny >= this.map.grid.length || nx >= this.map.grid[0].length) continue;
        seen.add(key(nx, ny));
        if (this.walkableBase(nx, ny) || this.walkableBase(p.x, p.y)) q.push({ x: nx, y: ny });
      }
    }
    return out;
  }

  // ─────────────────────────── Grid queries

  inBounds(x: number, y: number): boolean {
    const b = this.bounds;
    return x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
  }

  tileChar(x: number, y: number): string {
    if (this.destroyedTiles.includes(key(x, y))) return this.map.tileset === 'town' ? ',' : '.';
    return tileAt(this.s, this.map, x, y);
  }

  private walkableBase(x: number, y: number): boolean {
    if (!tile(this.tileChar(x, y)).walk) return false;
    return !objectsAt(this.s, this.map, x, y).some((o) => isBlockingObject(this.s, this.map, o) && o.kind !== 'trigger' && o.kind !== 'encounter' && o.kind !== 'exit');
  }

  walkable(x: number, y: number): boolean {
    if (!this.inBounds(x, y) || !this.walkableBase(x, y)) return false;
    return !this.objects.some((o) => !o.destroyed && o.x === x && o.y === y);
  }

  occupant(x: number, y: number): Combatant | undefined {
    return this.combatants.find((c) => !c.removed && c.x === x && c.y === y);
  }

  objectAt(x: number, y: number): CombatObject | undefined {
    return this.objects.find((o) => !o.destroyed && o.x === x && o.y === y);
  }

  los(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
    return lineOfSight(this.s, this.map, a.x, a.y, b.x, b.y);
  }

  get(id: string): Combatant | undefined { return this.combatants.find((c) => c.id === id); }

  current(): Combatant { return this.get(this.order[this.turnIndex])!; }

  alive(side?: 'party' | 'enemy'): Combatant[] {
    return this.combatants.filter((c) => !c.removed && c.char.hp > 0 && (!side || c.side === side));
  }

  enemiesOf(c: Combatant): Combatant[] { return this.alive(c.side === 'party' ? 'enemy' : 'party'); }
  alliesOf(c: Combatant): Combatant[] { return this.alive(c.side).filter((o) => o.id !== c.id); }

  isDowned(c: Combatant): boolean { return c.char.hp <= 0 && !c.char.dead && !c.removed; }

  reach(c: Combatant): number {
    if (c.char.kind === 'enemy') {
      const melee = (c.char.actions ?? []).map((a) => ACTION_BY_ID[a]).find((a) => a?.attack === 'melee');
      return melee?.range ?? 1;
    }
    const w = mainWeapon(c.char);
    return isRangedWeapon(w) ? 1 : weaponRange(w);
  }

  threatens(attacker: Combatant, x: number, y: number): boolean {
    if (attacker.char.hp <= 0 || !attacker.reaction || hasCondition(attacker.char, 'incapacitated') || hasCondition(attacker.char, 'stunned')) return false;
    return Math.max(Math.abs(attacker.x - x), Math.abs(attacker.y - y)) <= this.reach(attacker);
  }

  /** Dijkstra over the arena: cost 1 per square, 2 for difficult terrain; enemies block, allies can be passed. */
  reachable(c: Combatant, budget = c.movement): Map<string, { cost: number; prev: string | null; x: number; y: number }> {
    const res = new Map<string, { cost: number; prev: string | null; x: number; y: number }>();
    res.set(key(c.x, c.y), { cost: 0, prev: null, x: c.x, y: c.y });
    const open = [{ x: c.x, y: c.y, cost: 0 }];
    while (open.length) {
      open.sort((a, b) => a.cost - b.cost);
      const p = open.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const nx = p.x + dx, ny = p.y + dy;
        if (!this.walkable(nx, ny)) continue;
        if (dx && dy && (!this.walkable(p.x + dx, p.y) || !this.walkable(p.x, p.y + dy))) continue;
        const occ = this.occupant(nx, ny);
        if (occ && occ.side !== c.side && occ.char.hp > 0) continue;
        const step = this.stepCost(c, nx, ny);
        const cost = p.cost + step;
        if (cost > budget) continue;
        const k = key(nx, ny);
        const prev = res.get(k);
        if (prev && prev.cost <= cost) continue;
        res.set(k, { cost, prev: key(p.x, p.y), x: nx, y: ny });
        open.push({ x: nx, y: ny, cost });
      }
    }
    // Cannot end movement on an occupied square.
    for (const [k, v] of res) { const o = this.occupant(v.x, v.y); if (o && o.id !== c.id) res.delete(k); }
    return res;
  }

  pathTo(c: Combatant, x: number, y: number, all = this.reachableAll(c)): { x: number; y: number }[] | null {
    if (!all.has(key(x, y))) return null;
    const path: { x: number; y: number }[] = [];
    let k: string | null = key(x, y);
    while (k && k !== key(c.x, c.y)) {
      const node = all.get(k);
      if (!node) return null;
      path.unshift({ x: node.x, y: node.y });
      k = node.prev;
    }
    return path;
  }

  reachableAll(c: Combatant) {
    const saveRemoved = new Map<string, { cost: number; prev: string | null; x: number; y: number }>();
    const res = saveRemoved;
    res.set(key(c.x, c.y), { cost: 0, prev: null, x: c.x, y: c.y });
    const open = [{ x: c.x, y: c.y, cost: 0 }];
    while (open.length) {
      open.sort((a, b) => a.cost - b.cost);
      const p = open.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const nx = p.x + dx, ny = p.y + dy;
        if (!this.walkable(nx, ny)) continue;
        if (dx && dy && (!this.walkable(p.x + dx, p.y) || !this.walkable(p.x, p.y + dy))) continue;
        const occ = this.occupant(nx, ny);
        if (occ && occ.side !== c.side && occ.char.hp > 0) continue;
        const cost = p.cost + this.stepCost(c, nx, ny);
        const k = key(nx, ny);
        const prev = res.get(k);
        if (prev && prev.cost <= cost) continue;
        res.set(k, { cost, prev: key(p.x, p.y), x: nx, y: ny });
        open.push({ x: nx, y: ny, cost });
      }
    }
    return res;
  }

  /** Path cost for a given path (difficult terrain doubles). */
  pathCost(path: { x: number; y: number }[], c?: Combatant): number {
    return path.reduce((a, p) => a + this.stepCost(c ?? this.current(), p.x, p.y), 0);
  }

  /** Squares along a path where moving out provokes opportunity attacks (for UI warnings and AI). */
  provokers(c: Combatant, path: { x: number; y: number }[]): Combatant[] {
    if (hasCondition(c.char, 'disengaged')) return [];
    const out: Combatant[] = [];
    let cur = { x: c.x, y: c.y };
    for (const step of path) {
      for (const e of this.enemiesOf(c)) {
        if (out.includes(e)) continue;
        if (this.threatens(e, cur.x, cur.y) && !this.threatens(e, step.x, step.y)) out.push(e);
      }
      cur = step;
    }
    return out;
  }

  // ─────────────────────────── Turn flow

  private rollInitiative(ambush?: 'party' | 'enemy') {
    for (const c of this.combatants) {
      const adv = hasFeature(c.char, 'feral_instinct') ? 1 : 0;
      const r = rollD20(resolveMode(adv, 0));
      c.initiative = r.natural + initiativeBonus(c.char) + (c.side === 'party' ? 0 : this.settings.enemyAttackBonus > 0 ? 1 : 0) + Math.random() * 0.01;
      if (c.side === 'party') recordRoll(this.s, { kind: 'initiative', label: 'Initiative', who: c.char.name, whoId: c.id, natural: r.natural, rolls: r.rolls, mode: r.mode, parts: [{ label: 'Initiative bonus', value: initiativeBonus(c.char) }], total: Math.floor(c.initiative), nat1: false, nat20: false });
      if (ambush && c.side !== ambush && !c.char.feats.includes('alert')) c.char.conditions.push({ id: 'surprised', duration: 1 });
    }
    this.order = [...this.combatants].sort((a, b) => b.initiative - a.initiative).map((c) => c.id);
    this.log(`Initiative: ${this.order.map((id) => `${this.get(id)!.char.name} ${Math.floor(this.get(id)!.initiative)}`).join(', ')}`);
  }

  private startTurn(): void {
    const c = this.current();
    c.movement = speed(c.char);
    c.action = true; c.bonus = true; c.reaction = true;
    c.attacksLeft = 0; c.attackActionStarted = false; c.quickened = false; c.onceFlags = [];
    const ch = c.char;
    if (hasCondition(ch, 'surprised')) {
      ch.conditions = ch.conditions.filter((k) => k.id !== 'surprised');
      c.action = false; c.bonus = false; c.movement = 0;
      this.log(`${ch.name} is surprised and loses the turn!`);
      return;
    }
    // Hazards at start of turn
    this.hazardAt(c, true);
    for (const g of this.enemiesOf(c)) {
      if (g.concentration?.actionId !== 'spirit_guardians' || g.char.hp <= 0 || dist(g, c) > 3 || ch.hp <= 0) continue;
      const sv = this.save(c, 'wis', this.saveDcFor(g), { vsMagic: true });
      const d = rollDice('3d8').total;
      this.log(`${ch.name} is seared by ${g.char.name}’s spirit guardians (Wisdom ${sv.total} vs DC ${this.saveDcFor(g)}).`);
      this.dealDamage(g, c, [{ amount: sv.success ? Math.floor(d / 2) : d, type: 'radiant' }], false);
    }
    if (ch.hp <= 0) {
      if (c.side === 'party' && !ch.dead && !ch.stable && !this.encounter.nonlethal) this.doDeathSave(c);
      c.action = false; c.bonus = false; c.movement = 0;
      return;
    }
    if (hasFeature(ch, 'relentless_vanguard') && ch.hp < ch.maxHp / 2) {
      const h = heal(ch, 5 + mod(ch, 'con'));
      if (h) { this.events.push({ type: 'heal', targetId: c.id, amount: h }); this.log(`${ch.name} grits their teeth and fights on (+${h} HP).`); }
    }
    // Stand up from prone (costs half movement).
    if (hasCondition(ch, 'prone') && !hasCondition(ch, 'incapacitated')) {
      ch.conditions = ch.conditions.filter((k) => k.id !== 'prone');
      c.movement = Math.floor(c.movement / 2);
      this.log(`${ch.name} gets up.`);
    }
    if (hasCondition(ch, 'stunned') || hasCondition(ch, 'incapacitated')) {
      c.action = false; c.bonus = false; c.movement = 0;
      this.log(`${ch.name} cannot act this turn.`);
    }
    // Monster mechanics
    this.bossStartOfTurn(c);
  }

  private bossStartOfTurn(c: Combatant): void {
    const ch = c.char;
    const res = ch.combatResources ?? {};
    const tpl = ch.templateId ? ENEMY_BY_ID[ch.templateId] : undefined;
    for (const rid of tpl?.recharge ?? []) {
      if (res[rid] === 0 && rollDie(6) >= 5) { res[rid] = 1; this.log(`${ch.name}’s ${rid} has recharged!`, 'phase'); }
    }
    if (tpl?.legendary) this.legendaryLeft.set(c.id, tpl.legendary.per);
    if (ch.templateId === 'bellwarden') {
      const pillars = this.objects.filter((o) => o.kind === 'pillar' && !o.destroyed).length;
      if (pillars > 0 && ch.hp < ch.maxHp) {
        const h = heal(ch, 3);
        if (h) { this.events.push({ type: 'heal', targetId: c.id, amount: h }); this.log(`The resonance pillars feed the Bellwarden: +${h} HP.`); }
      }
      if (res.toll === 0 && rollDie(6) >= (this.phase === 2 ? 4 : 5)) { res.toll = 1; this.log('The great bell begins to sway again...', 'phase'); }
    }
  }

  private doDeathSave(c: Combatant): void {
    const ch = c.char;
    const r = deathSave(ch);
    recordRoll(this.s, r.result);
    if (r.outcome === 'revive') { ch.hp = 1; ch.deathSaves = { successes: 0, failures: 0 }; this.log(`${ch.name} rolls a natural 20 and surges back to consciousness!`, 'crit'); return; }
    if (r.outcome === 'success') ch.deathSaves.successes++;
    else ch.deathSaves.failures += r.outcome === 'double_failure' ? 2 : 1;
    this.log(`${ch.name} death save: ${r.result.natural} — ${r.outcome.replace('_', ' ')} (${ch.deathSaves.successes}✓ ${ch.deathSaves.failures}✗)`);
    if (ch.deathSaves.successes >= 3) { ch.stable = true; this.log(`${ch.name} is stable.`); }
    if (ch.deathSaves.failures >= 3) this.killPartyMember(c);
  }

  private killPartyMember(c: Combatant): void {
    const ch = c.char;
    if (this.s.rules.permadeath) {
      ch.dead = true;
      this.log(`${ch.name} has died.`, 'phase');
      this.events.push({ type: 'down', targetId: c.id, dead: true });
    } else {
      ch.stable = true;
      ch.deathSaves = { successes: 0, failures: 3 };
      this.log(`${ch.name} slips into deep unconsciousness. (Permadeath is off: they will survive with a lingering wound.)`, 'phase');
      this.s.flags[`wounded_${ch.id}`] = true;
    }
  }

  endTurn(): CombatEvent[] {
    if (this.over) return this.flush();
    const c = this.current();
    // Lit barrels explode at the end of the lighter's turn.
    if (c.fuse) { const b = this.objects.find((o) => o.id === c.fuse); c.fuse = undefined; if (b && !b.destroyed) this.destroyObject(b, c); }
    c.hasActed = true;
    this.endOfTurnConditions(c);
    if (this.checkEnd()) return this.flush();
    this.legendaryActions(c);
    if (this.checkEnd()) return this.flush();
    // Advance to the next living combatant.
    for (let guard = 0; guard < this.order.length * 2; guard++) {
      this.turnIndex++;
      if (this.turnIndex >= this.order.length) {
        this.turnIndex = 0; this.round++;
        this.fires = this.fires.filter((f) => --f.rounds > 0);
      }
      const n = this.current();
      if (!n || n.removed) continue;
      if (n.char.dead) continue;
      if (n.side === 'enemy' && n.char.hp <= 0) continue;
      break;
    }
    this.startTurn();
    this.checkEnd();
    return this.flush();
  }

  private endOfTurnConditions(c: Combatant): void {
    const ch = c.char;
    const keep: ActiveCondition[] = [];
    for (const k of ch.conditions) {
      if (k.saveEnds && ch.hp > 0) {
        const r = this.save(c, k.saveEnds.ability, k.saveEnds.dc, { vsMagic: true, vs: k.id });
        this.events.push({ type: 'save', targetId: c.id, result: r });
        if (r.success) { this.log(`${ch.name} shakes off ${k.id}.`); this.events.push({ type: 'condition', targetId: c.id, condition: k.id, added: false }); continue; }
      }
      if (k.duration > 0) {
        k.duration--;
        if (k.duration === 0) { this.events.push({ type: 'condition', targetId: c.id, condition: k.id, added: false }); if (k.id === 'raging' || k.id === 'hexed' || k.id === 'marked') this.dropConcentrationIfNoTargets(k.sourceId); continue; }
      }
      keep.push(k);
    }
    ch.conditions = keep;
  }

  private dropConcentrationIfNoTargets(_sourceId?: string): void { /* concentration cleanup handled in breakConcentration */ }

  checkEnd(): boolean {
    if (this.over) return true;
    if (this.alive('enemy').length === 0) { this.over = 'victory'; this.rollLoot(); this.log('Victory!', 'phase'); return true; }
    const standing = this.combatants.filter((c) => c.side === 'party' && !c.removed && c.char.hp > 0);
    if (standing.length === 0) { this.over = 'defeat'; this.log('The party has fallen...', 'phase'); return true; }
    return false;
  }

  flush(): CombatEvent[] { const e = this.events; this.events = []; return e; }

  log(text: string, kind: 'info' | 'bark' | 'phase' | 'crit' = 'info'): void {
    this.events.push({ type: 'text', text, kind });
    addLog(this.s, 'combat', text);
  }

  // ─────────────────────────── Movement

  moveAlong(c: Combatant, path: { x: number; y: number }[]): CombatEvent[] {
    if (c.id !== this.current().id) throw new Error('Not this combatant\'s turn');
    if (!path.length) return [];
    const cost = this.pathCost(path, c);
    if (cost > c.movement) throw new Error('Not enough movement');
    const final = path[path.length - 1];
    const occ = this.occupant(final.x, final.y);
    if (occ && occ.id !== c.id) throw new Error('Destination occupied');
    const walked: { x: number; y: number }[] = [];
    for (const step of path) {
      if (!this.walkable(step.x, step.y)) break;
      const blocker = this.occupant(step.x, step.y);
      if (blocker && blocker.side !== c.side && blocker.char.hp > 0) break;
      // Opportunity attacks when leaving reach.
      if (!hasCondition(c.char, 'disengaged')) {
        for (const e of this.enemiesOf(c)) {
          if (this.threatens(e, c.x, c.y) && !this.threatens(e, step.x, step.y)) {
            if (walked.length) { this.events.push({ type: 'move', id: c.id, path: [...walked] }); walked.length = 0; }
            this.opportunityAttack(e, c);
            if (c.char.hp <= 0 || this.over) { this.checkEnd(); return this.flush(); }
          }
        }
      }
      c.movement -= this.stepCost(c, step.x, step.y);
      c.x = step.x; c.y = step.y;
      walked.push(step);
      this.hazardAt(c, false);
      if (c.char.hp <= 0) break;
    }
    if (walked.length) this.events.push({ type: 'move', id: c.id, path: walked });
    if (hasCondition(c.char, 'hidden') && c.side === 'party') { /* moving keeps hidden in this simplified model */ }
    this.checkEnd();
    return this.flush();
  }

  private hazardAt(c: Combatant, startOfTurn: boolean): void {
    const t = tile(this.tileChar(c.x, c.y));
    const fire = this.fires.some((f) => f.x === c.x && f.y === c.y);
    if ((t.hazard || fire) && c.char.hp > 0) {
      const hz = fire ? { damage: '1d6', type: 'fire' as const } : t.hazard!;
      const d = rollDice(hz.damage).total;
      this.dealDamage(null, c, [{ amount: d, type: hz.type }], false);
      this.log(`${c.char.name} ${startOfTurn ? 'is burned by' : 'moves through'} ${fire ? 'the flames' : t.name.toLowerCase()}.`);
    }
    if (hasCondition(c.char, 'burning') && startOfTurn && c.char.hp > 0) {
      this.dealDamage(null, c, [{ amount: rollDie(4), type: 'fire' }], false);
    }
  }

  /** Whether a reaction may be used, honouring the player's reaction preferences. */
  private allowsReaction(c: Combatant, kind: 'shield' | 'opportunity' | 'defensive'): boolean {
    if (c.char.kind !== 'player') return true;
    const r = this.s.orders.reactions ?? { shield: 'auto', opportunity: 'always', defensive: 'auto' };
    if (kind === 'shield') return r.shield === 'auto' || (r.shield === 'lowhp' && c.char.hp <= c.char.maxHp / 2);
    if (kind === 'opportunity') return r.opportunity === 'always';
    return r.defensive === 'auto';
  }

  private opportunityAttack(attacker: Combatant, target: Combatant): void {
    if (!this.allowsReaction(attacker, 'opportunity')) { this.log(`${attacker.char.name} lets ${target.char.name} go.`); return; }
    attacker.reaction = false;
    this.log(`${attacker.char.name} makes an opportunity attack against ${target.char.name}!`);
    const act = this.primaryMeleeAction(attacker);
    if (!act) return;
    this.resolveAttack(attacker, target, act, { opportunity: true });
  }

  private primaryMeleeAction(c: Combatant): ActionDef | null {
    if (c.char.kind === 'enemy') {
      const a = (c.char.actions ?? []).map((id) => ACTION_BY_ID[id]).find((x) => x?.attack === 'melee' && !x.resource);
      return a ?? null;
    }
    return isRangedWeapon(mainWeapon(c.char)) ? null : ACTION_BY_ID.attack;
  }

  // ─────────────────────────── Action availability

  actionsFor(c: Combatant): ActionDef[] {
    return availableActionIds(c.char).map((id) => ACTION_BY_ID[id]).filter(Boolean);
  }

  canUse(c: Combatant, a: ActionDef): { ok: boolean; reason?: string } {
    const ch = c.char;
    if (c.id !== this.current().id) return { ok: false, reason: 'Not your turn' };
    if (ch.hp <= 0) return { ok: false, reason: 'Unconscious' };
    if (hasCondition(ch, 'stunned') || hasCondition(ch, 'incapacitated')) return { ok: false, reason: 'Incapacitated' };
    const cost = a.kind === 'spell' && c.quickened && a.cost === 'action' ? 'bonus' : a.cost;
    if (this.isAttackFamily(c, a) && c.attacksLeft > 0) { /* continuing an Attack action (Extra Attack / Multiattack) */ }
    else if (cost === 'action' && !c.action) return { ok: false, reason: 'Action already used' };
    if (cost === 'bonus' && !c.bonus) return { ok: false, reason: 'Bonus action already used' };
    if (cost === 'reaction') return { ok: false, reason: 'Used automatically as a reaction' };
    if (a.resource) {
      const pool = ch.kind === 'enemy' ? (ch.combatResources?.[a.resource.id] ?? 0) : resourceLeft(ch, a.resource.id);
      if (pool < (a.resource.amount ?? 1)) return { ok: false, reason: 'No uses left' };
    }
    if (a.kind === 'spell' && (a.level ?? 0) > 0 && lowestFreeSlot(ch, a.level!) === 0) return { ok: false, reason: 'No spell slots' };
    if (a.special === 'smite' && lowestFreeSlot(ch, 1) === 0) return { ok: false, reason: 'No spell slots for a smite' };
    if (a.special === 'frenzy' && !hasCondition(ch, 'raging')) return { ok: false, reason: 'Only while raging' };
    if (a.id === 'rage' && hasCondition(ch, 'raging')) return { ok: false, reason: 'Already raging' };
    if (a.special === 'offhand' && !c.attackActionStarted) return { ok: false, reason: 'Take the Attack action first' };
    if (a.special === 'action_surge' && c.action) return { ok: false, reason: 'You still have your action' };
    if (a.special === 'quicken' && c.quickened) return { ok: false, reason: 'Already quickened' };
    if (a.useWeapon === 'melee' && isRangedWeapon(mainWeapon(ch)) && a.id !== 'attack') return { ok: false, reason: 'Requires a melee weapon' };
    return { ok: true };
  }

  /** Attack, Smiting Strike, Reckless Attack and monster multiattacks share the Attack action. */
  isAttackFamily(c: Combatant, a: ActionDef): boolean {
    if (a.id === 'attack' || a.special === 'smite' || a.special === 'reckless') return true;
    return a.kind === 'monster' && !!a.attack && (c.char.multiattack ?? 1) > 1 && (c.char.actions ?? [])[0] === a.id;
  }

  /** Average damage of an action against a target, without rolling (used by the AI and UI). */
  rollActionDamagePreview(c: Combatant, a: ActionDef, t?: Combatant): number {
    const ch = c.char;
    let avg = 0;
    if (a.useWeapon && ch.kind !== 'enemy') {
      const off = a.special === 'offhand';
      const w = off ? offhandWeapon(ch) ?? mainWeapon(ch) : mainWeapon(ch);
      avg = averageDice(weaponDice(ch, w)) + weaponDamageBonus(ch, w, off);
      if (w.bonus?.damageExtra) avg += averageDice(w.bonus.damageExtra.dice);
      if (hasFeature(ch, 'sneak_attack') && !c.onceFlags.includes('sneak') && t && (w.weapon?.props.includes('finesse') || isRangedWeapon(w))
        && this.alliesOf(c).some((al) => dist(al, t) <= 1)) avg += 3.5 * Math.ceil(ch.level / 2);
    } else if (a.damage) {
      let dice = a.damage.dice;
      if (a.damage.cantripScale) { const m = dice.match(/^(\d+)d(\d+)$/); if (m) dice = `${parseInt(m[1], 10) * cantripDiceMultiplier(ch)}d${m[2]}`; }
      avg = averageDice(dice);
      if (a.damage.mod) avg += a.kind === 'spell' ? spellMod(ch) : mod(ch, a.ability ?? 'str');
      if (a.special === 'eldritch_blast' && hasFeature(ch, 'agonizing_blast')) avg += Math.max(0, mod(ch, 'cha'));
    }
    if (t) {
      if (t.char.conditions.some((k) => k.sourceId === c.id && (k.id === 'hexed' || (k.id === 'marked' && k.value === 1)))) avg += 3.5;
      const type = a.damage?.type ?? (a.useWeapon ? mainWeapon(ch).weapon?.type : undefined);
      if (type && t.char.immunities?.includes(type)) avg = 0;
      else if (type && t.char.vulnerabilities?.includes(type)) avg *= 2;
      else if (type && (t.char.resistances?.includes(type) || (hasCondition(t.char, 'raging') && ['slashing', 'piercing', 'bludgeoning'].includes(type)))) avg /= 2;
      if (t.char.templateId === 'bellwarden' && this.objects.some((o) => o.kind === 'pillar' && !o.destroyed) && type !== 'radiant' && type !== 'thunder') avg /= 2;
    }
    return Math.max(0, avg);
  }

  /** Effective range of an action for this combatant (weapons use the equipped weapon). */
  rangeOf(c: Combatant, a: ActionDef): number {
    if (a.useWeapon && c.char.kind !== 'enemy') {
      const w = a.special === 'offhand' ? offhandWeapon(c.char) ?? mainWeapon(c.char) : mainWeapon(c.char);
      return weaponRange(w);
    }
    return a.range;
  }

  isTargetable(c: Combatant, a: ActionDef, t: Combatant): boolean {
    if (t.removed) return false;
    if (t.char.conditions.some((k) => k.value === 88) && t.side !== c.side) return false;
    const d = dist(c, t);
    const range = this.rangeOf(c, a);
    switch (a.target) {
      case 'enemy':
        if (t.side === c.side || t.char.hp <= 0) return false;
        if (hasCondition(c.char, 'charmed') && c.char.conditions.some((k) => k.id === 'charmed' && k.sourceId === t.id)) return false;
        if (a.onlyVs === 'humanoid' && creatureType(t.char) !== 'humanoid') return false;
        break;
      case 'ally':
        if (t.side !== c.side || t.char.dead) return false;
        if (a.heal === undefined && a.special !== 'lay_on_hands' && t.char.hp <= 0) return false;
        break;
      case 'downedAlly':
        if (t.side !== c.side || t.char.hp > 0 || (t.char.dead && a.special !== 'revivify')) return false;
        break;
      case 'creature': break;
      default: return false;
    }
    if (d > Math.max(1, range)) return false;
    if (d > 1 && !this.los(c, t)) return false;
    return true;
  }

  validTargets(c: Combatant, a: ActionDef): Combatant[] {
    return this.combatants.filter((t) => this.isTargetable(c, a, t));
  }

  /** Objects the combatant can attack or interact with. */
  objectTargets(c: Combatant, a: ActionDef): CombatObject[] {
    if (a.id === 'interact') return this.objects.filter((o) => !o.destroyed && o.kind === 'barrel' && dist(c, o) <= 1);
    if (a.target !== 'enemy' || (!a.attack && !a.autoHit)) return [];
    const range = Math.max(1, this.rangeOf(c, a));
    return this.objects.filter((o) => !o.destroyed && dist(c, o) <= range && (dist(c, o) <= 1 || this.los(c, o)));
  }

  // ─────────────────────────── Area templates

  areaTiles(c: Combatant, a: ActionDef, aim: { x: number; y: number }): { x: number; y: number }[] {
    if (!a.area) return [];
    const out: { x: number; y: number }[] = [];
    const { shape, size, fromSelf } = a.area;
    const center = fromSelf && shape === 'radius' ? { x: c.x, y: c.y } : aim;
    const b = this.bounds;
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      if (tile(this.tileChar(x, y)).los) continue;
      if (shape === 'radius') {
        if (dist(center, { x, y }) <= size && !(fromSelf && x === c.x && y === c.y) && this.los(center, { x, y })) out.push({ x, y });
      } else if (shape === 'cone') {
        const dx = x - c.x, dy = y - c.y, ax = aim.x - c.x, ay = aim.y - c.y;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        if (d === 0 || d > size) continue;
        const dot = (dx * ax + dy * ay) / (Math.hypot(dx, dy) * Math.hypot(ax, ay) || 1);
        if (dot >= 0.75 && this.los(c, { x, y })) out.push({ x, y });
      }
    }
    if (shape === 'line') {
      const ax = aim.x - c.x, ay = aim.y - c.y;
      const len = Math.hypot(ax, ay) || 1;
      for (let i = 1; i <= size * 1.5; i++) {
        const x = Math.round(c.x + (ax / len) * i * 0.75), y = Math.round(c.y + (ay / len) * i * 0.75);
        if (!this.inBounds(x, y) || tile(this.tileChar(x, y)).los) break;
        if (dist(c, { x, y }) > size) break;
        if (!out.some((p) => p.x === x && p.y === y) && !(x === c.x && y === c.y)) out.push({ x, y });
      }
    }
    return out;
  }

  // ─────────────────────────── Perform

  perform(c: Combatant, actionId: string, target?: Target, opts: { slotLevel?: number } = {}): CombatEvent[] {
    const a = ACTION_BY_ID[actionId];
    if (!a) throw new Error(`Unknown action ${actionId}`);
    const can = this.canUse(c, a);
    if (!can.ok) throw new Error(can.reason);
    const ch = c.char;
    // Validate target
    let tc: Combatant | undefined;
    let tobj: CombatObject | undefined;
    let point: { x: number; y: number } | undefined;
    if (target && 'id' in target) {
      tc = this.get(target.id);
      tobj = this.objects.find((o) => o.id === target.id);
      if (tc && !this.isTargetable(c, a, tc)) throw new Error('Invalid target');
      if (tobj && !this.objectTargets(c, a).includes(tobj)) throw new Error('Invalid object target');
      if (!tc && !tobj) throw new Error('Unknown target');
    } else if (target) point = target;
    if ((a.target === 'enemy' || a.target === 'ally' || a.target === 'downedAlly') && !tc && !tobj) throw new Error('Target required');
    if (a.target === 'point' && !point && !a.area?.fromSelf) throw new Error('Point required');
    if (point && a.target === 'point' && !a.area?.fromSelf && dist(c, point) > a.range) throw new Error('Out of range');

    // Pay costs
    const cost = a.kind === 'spell' && c.quickened && a.cost === 'action' ? 'bonus' : a.cost;
    let slot = 0;
    if (a.kind === 'spell' && (a.level ?? 0) > 0) {
      slot = opts.slotLevel && slotsAvailable(ch, opts.slotLevel) > 0 && opts.slotLevel >= a.level! ? opts.slotLevel : lowestFreeSlot(ch, a.level!);
      ch.spellSlotsUsed[slot] = (ch.spellSlotsUsed[slot] ?? 0) + 1;
    }
    if (a.resource) {
      if (ch.kind === 'enemy') ch.combatResources![a.resource.id] -= a.resource.amount ?? 1;
      else if (a.special !== 'lay_on_hands') ch.resources[a.resource.id].used += a.resource.amount ?? 1;
    }
    if (this.isAttackFamily(c, a)) {
      if (c.attacksLeft <= 0) {
        // Starting a new Attack action (also after Action Surge) spends the action.
        c.attackActionStarted = true;
        c.action = false;
        c.attacksLeft = ch.kind === 'enemy' ? (ch.multiattack ?? 1) : attacksPerAction(ch);
      }
      c.attacksLeft--;
    } else if (cost === 'action') c.action = false;
    else if (cost === 'bonus') c.bonus = false;
    if (a.kind === 'spell' && c.quickened && a.cost === 'action') c.quickened = false;
    if (a.kind === 'spell' || a.attack) {
      ch.conditions = ch.conditions.filter((k) => k.id !== 'hidden' && !(k.id === 'invisible' && k.value !== 99 && (a.attack || a.damage)));
    }
    if (a.kind === 'spell') this.log(`${ch.name} casts ${a.name}${slot ? ` (level ${slot} slot)` : ''}.`);
    if (slot && hasFeature(ch, 'resonant_ward')) { const th = 2 * slot + Math.max(0, mod(ch, 'int')); ch.tempHp = Math.max(ch.tempHp, th); }
    const surge = slot > 0 && hasFeature(ch, 'wild_surge') && rollDie(20) <= 2;
    if (tc && c.side === 'party' && tc.side === 'enemy') this.lastPlayerTarget = tc.id;

    // Concentration
    if (a.concentration) {
      this.breakConcentration(c, false);
      c.concentration = { actionId: a.id, targetIds: [] };
    }

    this.resolveAction(c, a, tc, tobj, point, slot);
    if (surge && !this.over) this.wildSurge(c);
    this.checkEnd();
    return this.flush();
  }

  private resolveAction(c: Combatant, a: ActionDef, tc: Combatant | undefined, tobj: CombatObject | undefined, point: { x: number; y: number } | undefined, slot: number): void {
    const ch = c.char;
    // Special non-attack features
    switch (a.special) {
      case 'dash': c.movement += speed(ch); this.log(`${ch.name} dashes.`); return;
      case 'action_surge': c.action = true; this.log(`${ch.name} surges with renewed energy! (extra action)`); return;
      case 'quicken': c.quickened = true; this.log(`${ch.name} quickens the next spell.`); return;
      case 'second_wind': { const amt = rollDice('1d10').total + ch.level; const h = heal(ch, amt); this.events.push({ type: 'heal', targetId: c.id, amount: h }); this.log(`${ch.name} catches a second wind: +${h} HP.`); return; }
      case 'help': return this.doHelp(c, tc!);
      case 'shove': return this.doShove(c, tc!);
      case 'hide': return this.doHide(c);
      case 'interact': if (tobj) { c.fuse = tobj.id; this.log(`${ch.name} knocks the tap from the ${tobj.name.toLowerCase()} and sets it alight — it will burst at the end of the turn!`); } return;
      case 'lay_on_hands': {
        const pool = ch.resources.lay_on_hands;
        const need = tc!.char.maxHp - tc!.char.hp;
        const amt = Math.min(pool.max - pool.used, Math.max(1, Math.min(10, need)));
        pool.used += amt;
        const h = heal(tc!.char, amt);
        this.events.push({ type: 'heal', targetId: tc!.id, amount: h });
        this.log(`${ch.name} lays hands on ${tc!.char.name}: +${h} HP.`);
        return;
      }
      case 'teleport': {
        if (!point || !this.walkable(point.x, point.y) || this.occupant(point.x, point.y) || dist(c, point) > a.range) throw new Error('Invalid teleport destination');
        c.x = point.x; c.y = point.y;
        this.events.push({ type: 'move', id: c.id, path: [point] });
        this.log(`${ch.name} steps through a fold in the air.`);
        return;
      }
      case 'revivify': {
        const t = tc!.char;
        t.dead = false; t.hp = 1; t.deathSaves = { successes: 0, failures: 0 }; t.stable = false;
        this.events.push({ type: 'heal', targetId: tc!.id, amount: 1 });
        this.log(`${ch.name} calls ${t.name} back from the brink!`);
        return;
      }
      case 'summon_echoes': return this.summonEchoes(c);
      case 'aid': {
        const targets = [...(tc ? [tc] : []), ...this.alliesInRange(c, a.range).filter((x) => x !== tc && !x.char.dead)].slice(0, 3);
        const amt = 5 * Math.max(1, slot - 1);
        for (const t of targets) { t.char.tempHp = Math.max(t.char.tempHp, amt); const h = heal(t.char, 5); this.events.push({ type: 'heal', targetId: t.id, amount: h }); }
        this.log(`${targets.map((t) => t.char.name).join(', ')} are fortified (+${amt} temporary HP).`);
        return;
      }
      case 'spirit_guardians':
        this.log(`Spectral lantern-bearers wheel around ${ch.name}.`);
        return;
    }
    // Weapon / attack-roll actions
    if (a.attack) {
      if (tobj) { this.attackObject(c, tobj, a, slot); return; }
      const hits = a.hits ?? 1;
      for (let i = 0; i < hits; i++) {
        if (!tc || tc.char.hp <= 0) break;
        this.resolveAttack(c, tc, a, { slot });
      }
      if (a.condition && tc && !a.save) { /* conditions applied on hit inside resolveAttack */ }
      return;
    }
    if (a.autoHit && tc) {
      const dmg = this.rollActionDamage(c, a, false, slot, tc);
      this.events.push({ type: 'attack', attackerId: c.id, targetId: tc.id, roll: 0, total: 0, ac: 0, hit: true, crit: false, mode: 'normal', label: a.name });
      this.dealDamage(c, tc, dmg, false);
      return;
    }
    if (a.autoHit && tobj) { this.damageObject(c, tobj, this.rollActionDamage(c, a, false, slot).reduce((s, d) => s + d.amount, 0)); return; }
    // Area or single-target save effects
    if (a.area) {
      const tiles = this.areaTiles(c, a, point ?? { x: c.x, y: c.y });
      this.events.push({ type: 'aoe', tiles, actionId: a.id, color: a.damage ? DAMAGE_COLORS[a.damage.type] ?? '#ffd27a' : '#9fd3ff' });
      const sculpt = hasFeature(ch, 'sculpt_spells');
      const victims = this.combatants.filter((t) => !t.removed && t.char.hp > 0 && tiles.some((p) => p.x === t.x && p.y === t.y));
      for (const t of victims) {
        if (sculpt && t.side === c.side) continue;
        if (a.onlyVs === 'undead' && !['undead', 'echo'].includes(creatureType(t.char))) continue;
        if (a.special === 'taunt' && t.side === c.side) continue;
        if ((a.id === 'turn_undead' || a.id === 'destructive_wave') && t.side === c.side) continue;
        this.applySaveEffect(c, t, a, slot);
      }
      for (const o of this.objects.filter((o) => !o.destroyed && tiles.some((p) => p.x === o.x && p.y === o.y))) {
        if (a.damage) this.damageObject(c, o, rollDice(a.damage.dice).total);
      }
      if (a.push) for (const t of victims) if (t.side !== c.side && t.char.hp > 0 && !t.char.conditions.some((k) => k.id === 'guarded' && k.value === 99)) this.pushAway(c, t, a.push);
      return;
    }
    if (a.save && tc) { this.applySaveEffect(c, tc, a, slot); return; }
    // Heals & buffs
    if (a.heal) {
      const targets = a.maxTargets && a.maxTargets > 1
        ? this.alliesInRange(c, a.range).filter((t) => !t.char.dead).sort((x, y) => x.char.hp / x.char.maxHp - y.char.hp / y.char.maxHp).slice(0, a.maxTargets)
        : tc ? [tc] : [c];
      for (const t of targets) {
        let amt = rollDice(a.heal.dice + (slot > (a.level ?? 1) && a.heal.upcast ? `+${slot - (a.level ?? 1)}${a.heal.upcast.replace(/^(\d*)d/, (_m, n) => `${(n || 1)}d`)}` : '')).total;
        if (a.heal.mod) amt += spellMod(ch);
        if (hasFeature(ch, 'disciple_of_life')) amt += 2 + (slot || 1);
        const h = heal(t.char, Math.max(1, amt));
        this.events.push({ type: 'heal', targetId: t.id, amount: h });
        this.log(`${t.char.name} regains ${h} HP.`);
        if (t.id !== c.id && hasFeature(ch, 'blessed_healer')) { const sh = heal(ch, 2 + (slot || 1)); if (sh) this.events.push({ type: 'heal', targetId: c.id, amount: sh }); }
      }
      return;
    }
    if (a.tempHp) {
      const amt = rollDice(a.tempHp).total;
      ch.tempHp = Math.max(ch.tempHp, amt);
      this.log(`${ch.name} gains ${amt} temporary HP.`);
      return;
    }
    if (a.removeConditions && tc && a.special === 'greater_restoration') {
      const before = tc.char.conditions.length;
      tc.char.conditions = tc.char.conditions.filter((k) => !a.removeConditions!.includes(k.id));
      this.log(before > tc.char.conditions.length ? `${tc.char.name} is fully restored.` : `${tc.char.name} has nothing to cure.`);
      return;
    }
    if (a.removeConditions && tc) {
      const bad = tc.char.conditions.find((k) => a.removeConditions!.includes(k.id));
      if (bad) { tc.char.conditions = tc.char.conditions.filter((k) => k !== bad); this.log(`${tc.char.name} is no longer ${bad.id}.`); }
      else this.log(`${tc.char.name} has nothing to cure.`);
      return;
    }
    if (a.condition) {
      const targets = a.maxTargets && a.maxTargets > 1
        ? [...(tc ? [tc] : []), ...this.alliesInRange(c, a.range).filter((t) => t !== tc && t.char.hp > 0)].slice(0, a.maxTargets)
        : [tc ?? c];
      for (const t of targets) {
        const value = a.special === 'hunters_mark' ? 1 : a.special === 'favored_foe' ? 2 : a.special === 'vow' ? 3 : a.condition.value;
        this.addCondition(c, t, a.condition.id, a.condition.duration, { value, concentration: a.concentration });
      }
      return;
    }
  }

  alliesInRange(c: Combatant, range: number): Combatant[] {
    return this.combatants.filter((t) => t.side === c.side && !t.removed && dist(c, t) <= range && (dist(c, t) <= 1 || this.los(c, t)));
  }

  // ─────────────────────────── Attacks

  attackBonusFor(c: Combatant, a: ActionDef): number {
    const ch = c.char;
    if (a.attack === 'spell') return spellAttackBonus(ch) + (ch.kind === 'enemy' ? this.settings.enemyAttackBonus : 0);
    if (ch.kind === 'enemy' || a.kind === 'item') {
      const ab = a.ability ?? 'str';
      return mod(ch, ab) + prof(ch) + (ch.kind === 'enemy' ? this.settings.enemyAttackBonus : 0);
    }
    const w = a.special === 'offhand' ? offhandWeapon(ch) ?? mainWeapon(ch) : mainWeapon(ch);
    return weaponAttackBonus(ch, w);
  }

  /** Advantage/disadvantage sources for an attack (exposed for UI tooltips and AI). */
  attackMode(c: Combatant, t: Combatant, a: ActionDef): { mode: RollMode; reasons: string[] } {
    let adv = 0, dis = 0;
    const reasons: string[] = [];
    const A = c.char, T = t.char;
    const ranged = a.attack === 'ranged' || (a.attack === 'spell' && this.rangeOf(c, a) > 1) || (a.useWeapon && isRangedWeapon(mainWeapon(A)) && A.kind !== 'enemy');
    const d = dist(c, t);
    const add = (cond: boolean, isAdv: boolean, why: string) => { if (cond) { isAdv ? adv++ : dis++; reasons.push(`${isAdv ? '+' : '−'} ${why}`); } };
    add(hasCondition(A, 'invisible') || hasCondition(A, 'hidden'), true, 'unseen attacker');
    add(hasCondition(A, 'blinded'), false, 'blinded');
    add(hasCondition(A, 'poisoned'), false, 'poisoned');
    add(hasCondition(A, 'frightened'), false, 'frightened');
    add(hasCondition(A, 'restrained'), false, 'restrained');
    add(hasCondition(A, 'prone'), false, 'attacking while prone');
    add(a.special === 'reckless', true, 'reckless attack');
    add(T.conditions.some((k) => k.id === 'marked' && k.sourceId === c.id && k.value === 3), true, 'Vow of Enmity');
    add(T.conditions.some((k) => k.id === 'marked' && k.value === 4 && k.sourceId !== c.id) && false, false, '');
    add(A.conditions.some((k) => k.id === 'marked' && k.value === 4 && k.sourceId !== t.id), false, 'compelled to attack another');
    add(A.conditions.some((k) => k.id === 'marked' && k.value === 5 && k.sourceId !== t.id), false, 'ancestral spirits hinder');
    add(hasCondition(T, 'resonant'), true, 'guiding light');
    add(hasCondition(T, 'stunned') || hasCondition(T, 'incapacitated') || hasCondition(T, 'restrained'), true, 'target helpless');
    add(hasCondition(T, 'blinded'), true, 'target blinded');
    add(hasCondition(T, 'reckless'), true, 'target reckless');
    add(hasCondition(T, 'prone') && d <= 1, true, 'target prone (melee)');
    add(hasCondition(T, 'prone') && d > 1, false, 'target prone (ranged)');
    add(hasCondition(T, 'dodging'), false, 'target dodging');
    add(hasCondition(T, 'invisible'), false, 'target invisible');
    add(!!ranged && this.enemiesOf(c).some((e) => dist(e, c) <= 1 && !hasCondition(e.char, 'incapacitated') && !hasCondition(e.char, 'stunned')), false, 'enemy adjacent (ranged)');
    add((A.traits ?? []).includes('pack_tactics') && this.alliesOf(c).some((al) => dist(al, t) <= 1), true, 'pack tactics');
    add(hasFeature(A, 'assassinate') && !t.hasActed, true, 'assassinate');
    return { mode: resolveMode(adv, dis), reasons };
  }

  coverBonus(c: Combatant, t: Combatant | CombatObject, a: ActionDef): number {
    if (dist(c, t) <= 1 || a.special === 'sacred') return 0;
    if (c.char.feats.includes('deadeye')) return 0;
    // Half cover if a cover tile adjacent to the target lies roughly between attacker and target.
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const x = t.x + dx, y = t.y + dy;
      const tl = tile(this.tileChar(x, y));
      const objCover = this.objects.some((o) => !o.destroyed && o.x === x && o.y === y);
      if (!tl.cover && !objCover) continue;
      if (tl.cover === 2) continue;
      const toward = (c.x - t.x) * dx + (c.y - t.y) * dy;
      if (toward > 0 && dist(c, { x, y }) < dist(c, t)) return 2;
    }
    return 0;
  }

  targetAC(c: Combatant, t: Combatant, a: ActionDef): number {
    let ac = armorClass(t.char) + this.coverBonus(c, t, a);
    if (t.side === 'enemy' && t.char.templateId === 'bellwarden') ac += 0;
    return ac;
  }

  hitChance(c: Combatant, t: Combatant, a: ActionDef): number {
    const bonus = this.attackBonusFor(c, a) + (this.highGround(c, t, a) ? 2 : 0);
    const need = this.targetAC(c, t, a) - bonus;
    let p = Math.min(0.95, Math.max(0.05, (21 - need) / 20));
    const { mode } = this.attackMode(c, t, a);
    if (mode === 'advantage') p = 1 - (1 - p) ** 2;
    if (mode === 'disadvantage') p = p * p;
    return p;
  }

  private highGround(c: Combatant, t: Combatant | CombatObject, a: ActionDef): boolean {
    const ranged = a.attack === 'ranged' || a.attack === 'spell' || (a.useWeapon && isRangedWeapon(mainWeapon(c.char)));
    return !!ranged && !!tile(this.tileChar(c.x, c.y)).high && !tile(this.tileChar(t.x, t.y)).high;
  }

  resolveAttack(c: Combatant, t: Combatant, a: ActionDef, o: { slot?: number; opportunity?: boolean } = {}): boolean {
    let { mode, reasons } = this.attackMode(c, t, a);
    if (o.opportunity && hasFeature(t.char, 'escape_the_horde')) { mode = mode === 'advantage' ? 'normal' : 'disadvantage'; reasons = [...reasons, '− Escape the Horde']; }
    let r = rollD20(mode);
    let natural = r.natural;
    if (c.char.ancestry === 'halfling' && natural === 1) { r = rollD20(mode); natural = r.natural; }
    const bonusParts: { label: string; value: number }[] = [{ label: 'Attack bonus', value: this.attackBonusFor(c, a) }];
    if (this.highGround(c, t, a)) bonusParts.push({ label: 'High ground', value: 2 });
    if (hasCondition(c.char, 'blessed')) bonusParts.push({ label: 'Bless', value: rollDie(4) });
    const insp = c.char.conditions.find((k) => k.id === 'inspired');
    let valorDie = 0;
    if (insp) {
      const v = rollDie(insp.value ?? 6);
      const bard = this.get(insp.sourceId ?? '');
      if (bard && hasFeature(bard.char, 'combat_inspiration')) valorDie = rollDie(insp.value ?? 6);
      bonusParts.push({ label: 'Inspiration', value: v });
      c.char.conditions = c.char.conditions.filter((k) => k !== insp);
    }
    let total = natural + bonusParts.reduce((s, p) => s + p.value, 0);
    let ac = this.targetAC(c, t, a);
    const critOn = a.attack === 'spell' || a.kind === 'monster' ? 20 : critRange(c.char);
    let crit = natural >= critOn;
    let hit = natural !== 1 && (crit || total >= ac);
    // Paralysed (stunned) targets are critically hit by adjacent attacks.
    if (hit && dist(c, t) <= 1 && (hasCondition(t.char, 'stunned')) && t.char.hp > 0) crit = true;
    if (hasCondition(t.char, 'resonant')) t.char.conditions = t.char.conditions.filter((k) => k.id !== 'resonant');
    // Defensive reactions
    if (hit && !crit) {
      const reacted = this.defensiveReaction(c, t, total, ac);
      if (reacted.newTotal !== undefined) total = reacted.newTotal;
      if (reacted.acBonus) ac += reacted.acBonus;
      if (reacted.reroll) { const rr = rollD20('normal').natural; natural = Math.min(natural, rr); total = natural + bonusParts.reduce((s, p) => s + p.value, 0); crit = false; }
      hit = natural !== 1 && total >= ac;
    }
    recordRoll(this.s, {
      kind: 'attack', label: `Attack: ${a.name}${o.opportunity ? ' (opportunity)' : ''}`, who: c.char.name, whoId: c.id, natural, rolls: r.rolls, mode,
      parts: bonusParts, total, dc: ac, success: hit, nat20: natural === 20, nat1: natural === 1,
    });
    this.events.push({ type: 'attack', attackerId: c.id, targetId: t.id, roll: natural, total, ac, hit, crit, mode, label: a.name });
    const modeText = mode === 'normal' ? '' : ` with ${mode} (${reasons.join(', ')})`;
    this.log(`${c.char.name} → ${t.char.name}: ${a.name} ${natural}+${total - natural} = ${total} vs AC ${ac}${modeText} — ${crit && hit ? 'CRITICAL HIT!' : hit ? 'hit' : natural === 1 ? 'natural 1, miss' : 'miss'}`, crit && hit ? 'crit' : 'info');
    if (!hit) return false;
    const dmg = this.rollActionDamage(c, a, crit, o.slot ?? 0, t);
    if (valorDie) dmg.push({ amount: valorDie, type: dmg[0]?.type ?? 'bludgeoning' });
    this.onHitExtras(c, t, a, crit, dmg);
    this.dealDamage(c, t, dmg, crit);
    if (a.condition && t.char.hp > 0 && !a.save) this.addCondition(c, t, a.condition.id, a.condition.duration, { value: a.condition.value });
    if (a.special === 'no_reaction') t.reaction = false;
    if (a.special === 'knockdown' && t.char.hp > 0) {
      const sv = this.save(t, 'str', 11, { vs: 'prone' });
      this.events.push({ type: 'save', targetId: t.id, result: sv });
      if (!sv.success) this.addCondition(c, t, 'prone', -1);
    }
    if (a.special === 'poison_bite' && t.char.hp > 0) {
      const sv = this.save(t, 'con', 12, { vs: 'poison' });
      this.events.push({ type: 'save', targetId: t.id, result: sv });
      if (!sv.success) this.addCondition(c, t, 'poisoned', 2);
    }
    if (a.special === 'reckless') this.addCondition(c, c, 'reckless', 1);
    if (o.opportunity && hasFeature(c.char, 'relentless_avenger') && t.char.hp > 0) this.addCondition(c, t, 'slowed', 2);
    if (a.special === 'drain') { const total = dmg.reduce((x, d) => x + d.amount, 0); const h = heal(c.char, Math.floor(total / 2)); if (h) { this.events.push({ type: 'heal', targetId: c.id, amount: h }); this.log(`${c.char.name} drinks ${h} HP of stolen life.`); } }
    if (a.special === 'eldritch_blast' && hasFeature(c.char, 'repelling_blast') && t.char.hp > 0) this.pushAway(c, t, 1);
    if (a.special === 'pull' && t.char.hp > 0) this.pullToward(c, t, 2);
    return true;
  }

  private defensiveReaction(attacker: Combatant, t: Combatant, total: number, ac: number): { newTotal?: number; acBonus?: number; reroll?: boolean } {
    const T = t.char;
    // Shield spell
    if (t.reaction && t.char.hp > 0 && this.allowsReaction(t, 'shield') && castableSpells(T).some((s) => s.id === 'shield') && lowestFreeSlot(T, 1) > 0 && total < ac + 5 && !(t.side === 'party' && this.s.orders.conserve && T.hp > T.maxHp / 2)) {
      t.reaction = false;
      T.spellSlotsUsed[lowestFreeSlot(T, 1)]++;
      this.addCondition(t, t, 'shielded', 1, { value: 5 });
      this.log(`${T.name} snaps up a shimmering Shield! (+5 AC)`);
      return { acBonus: 5 };
    }
    if ((T.traits ?? []).includes('shield_reaction') && t.reaction && total < ac + 5) {
      t.reaction = false;
      this.log(`${T.name} raises a ward of silver light. (+5 AC)`);
      return { acBonus: 5 };
    }
    if (t.reaction && this.allowsReaction(t, 'defensive') && hasFeature(T, 'entropic_ward') && resourceLeft(T, 'entropic_ward') > 0) {
      t.reaction = false; T.resources.entropic_ward.used++;
      this.log(`${T.name} wraps themself in the Choir’s silence — the attack falters!`);
      return { reroll: true };
    }
    // Warding Flare (self)
    if (t.reaction && this.allowsReaction(t, 'defensive') && hasFeature(T, 'warding_flare') && resourceLeft(T, 'warding_flare') > 0) {
      t.reaction = false; T.resources.warding_flare.used++;
      this.log(`${T.name} flares with lantern-light, dazzling the attacker!`);
      return { reroll: true };
    }
    // Protectors: Bulwark fighters, Lore bards, Resonance wizards nearby
    for (const ally of this.alliesOf(t)) {
      if (!ally.reaction || ally.char.hp <= 0 || hasCondition(ally.char, 'incapacitated')) continue;
      const A = ally.char;
      if (hasFeature(A, 'protection') && dist(ally, t) <= 1 && A.equipment.offHand && ITEM_BY_ID[A.equipment.offHand]?.shield) {
        ally.reaction = false;
        this.log(`${A.name} interposes a shield!`);
        return { reroll: true };
      }
      if (hasFeature(A, 'cutting_words') && resourceLeft(A, 'bardic_inspiration') > 0 && dist(ally, attacker) <= 12) {
        const cut = rollDie(6);
        if (total - cut < ac) {
          ally.reaction = false; A.resources.bardic_inspiration.used++;
          this.log(`${A.name} unleashes a cutting remark — the attack falters (−${cut}).`);
          return { newTotal: total - cut };
        }
      }
      if (hasFeature(A, 'improved_flare') && resourceLeft(A, 'warding_flare') > 0 && dist(ally, t) <= 6) {
        ally.reaction = false; A.resources.warding_flare.used++;
        this.log(`${A.name} flares with lantern-light to shield ${T.name}!`);
        return { reroll: true };
      }
      if (hasFeature(A, 'probability_twist') && resourceLeft(A, 'probability_twist') > 0 && dist(ally, t) <= 6) {
        ally.reaction = false; A.resources.probability_twist.used++;
        this.log(`${A.name} twists probability — the attack must be rerolled.`);
        return { reroll: true };
      }
    }
    return {};
  }

  rollActionDamage(c: Combatant, a: ActionDef, crit: boolean, slot: number, t?: Combatant): { amount: number; type: DamageType }[] {
    const ch = c.char;
    const out: { amount: number; type: DamageType }[] = [];
    if (a.useWeapon && ch.kind !== 'enemy') {
      const off = a.special === 'offhand';
      const w = off ? offhandWeapon(ch) ?? mainWeapon(ch) : mainWeapon(ch);
      const dice = weaponDice(ch, w);
      let base = rollDice(dice, crit).total;
      if (crit && hasFeature(ch, 'brutal_critical')) base += rollDice(dice.replace(/^\d+d/, '1d')).total;
      if (ch.feats.includes('style_great') && w.weapon?.props.includes('twoHanded')) base = Math.max(base, rollDice(dice, crit).total);
      out.push({ amount: Math.max(1, base + weaponDamageBonus(ch, w, off)), type: w.weapon?.type ?? 'bludgeoning' });
      if (w.bonus?.damageExtra) out.push({ amount: rollDice(w.bonus.damageExtra.dice, crit).total, type: w.bonus.damageExtra.type });
      return out;
    }
    if (a.damage) {
      let dice = a.damage.dice;
      if (a.damage.cantripScale) {
        const m = dice.match(/^(\d+)d(\d+)$/);
        if (m) dice = `${parseInt(m[1], 10) * cantripDiceMultiplier(ch)}d${m[2]}`;
      }
      if (a.special === 'toll' && t && t.char.hp < t.char.maxHp) dice = dice.replace('d8', 'd12');
      if (a.damage.upcast && slot > (a.level ?? 0) && (a.level ?? 0) > 0) for (let i = 0; i < slot - (a.level ?? 0); i++) dice += `+${a.damage.upcast}`;
      let amount = rollDice(dice, crit).total;
      const rollDiceBase = amount;
      if (a.damage.mod) amount += a.kind === 'spell' ? spellMod(ch) : mod(ch, a.ability ?? 'str');
      if (a.special === 'eldritch_blast' && hasFeature(ch, 'agonizing_blast')) amount += Math.max(0, mod(ch, 'cha'));
      if (a.damage.type === 'fire' && hasFeature(ch, 'elemental_affinity')) amount += Math.max(0, mod(ch, 'cha'));
      if (a.kind === 'spell' && (a.level ?? 0) === 0 && hasFeature(ch, 'potent_spellcasting')) amount += Math.max(0, mod(ch, 'wis'));
      if (a.kind === 'spell' && ch.classId === 'wizard' && hasFeature(ch, 'empowered_evocation')) amount += Math.max(0, mod(ch, 'int'));
      if (a.kind === 'spell' && (a.level ?? 0) > 0 && hasFeature(ch, 'empowered_spell') && resourceLeft(ch, 'sorcery_points') >= 3) {
        const reroll = rollDice(dice, crit).total;
        const base = rollDiceBase;
        if (reroll > base) { amount += reroll - base; ch.resources.sorcery_points.used += 1; this.log(`${ch.name} empowers the spell (reroll ${base} → ${reroll}).`); }
      }
      out.push({ amount: Math.max(0, amount), type: a.damage.type });
    }
    return out;
  }

  private onHitExtras(c: Combatant, t: Combatant, a: ActionDef, crit: boolean, dmg: { amount: number; type: DamageType }[]): void {
    const ch = c.char;
    const weaponish = !!a.useWeapon || a.kind === 'monster';
    const w = mainWeapon(ch);
    if (ch.kind !== 'enemy' && a.useWeapon) {
      // Sneak attack
      if (hasFeature(ch, 'sneak_attack') && !c.onceFlags.includes('sneak') && (w.weapon?.props.includes('finesse') || isRangedWeapon(w))) {
        const { mode } = this.attackMode(c, t, a);
        const allyAdj = this.alliesOf(c).some((al) => dist(al, t) <= 1 && al.char.hp > 0);
        if (mode === 'advantage' || (allyAdj && mode !== 'disadvantage')) {
          const dice = `${Math.ceil(ch.level / 2)}d6`;
          dmg.push({ amount: rollDice(dice, crit).total, type: w.weapon?.type ?? 'piercing' });
          c.onceFlags.push('sneak');
          this.log(`Sneak Attack! (+${dice})`);
        }
      }
      if (hasFeature(ch, 'divine_strike') && !c.onceFlags.includes('divine')) { dmg.push({ amount: rollDice('1d8', crit).total, type: 'radiant' }); c.onceFlags.push('divine'); }
      if (hasFeature(ch, 'deadly_ambush') && !t.hasActed && !c.onceFlags.includes('ambush2')) { dmg.push({ amount: rollDice('2d6', crit).total, type: w.weapon?.type ?? 'piercing' }); c.onceFlags.push('ambush2'); this.log('Deadly Ambush!'); }
      if (hasFeature(ch, 'colossus_slayer') && !c.onceFlags.includes('colossus') && t.char.hp < t.char.maxHp) {
        dmg.push({ amount: rollDice('1d8', crit).total, type: w.weapon?.type ?? 'piercing' }); c.onceFlags.push('colossus');
      }
      if (hasFeature(ch, 'dread_ambusher') && this.round === 1 && !c.onceFlags.includes('ambush')) {
        dmg.push({ amount: rollDice('1d8', crit).total, type: w.weapon?.type ?? 'piercing' }); c.onceFlags.push('ambush');
      }
      if (a.special === 'smite') {
        const slot = lowestFreeSlot(ch, 1);
        if (slot) {
          ch.spellSlotsUsed[slot]++;
          let dice = `${1 + slot}d8`;
          if (['undead', 'echo'].includes(creatureType(t.char))) dice = `${2 + slot}d8`;
          dmg.push({ amount: rollDice(dice, crit).total, type: 'radiant' });
          this.log(`${ch.name}'s blade blazes with radiant light — Divine Smite (+${dice})!`, 'crit');
        }
      }
    }
    if (weaponish || a.attack === 'spell') {
      for (const k of t.char.conditions) {
        if (k.sourceId !== c.id) continue;
        if (k.id === 'hexed') dmg.push({ amount: rollDice('1d6', crit).total, type: 'necrotic' });
        if (k.id === 'marked' && k.value === 1 && weaponish) dmg.push({ amount: rollDice('1d6', crit).total, type: dmg[0]?.type ?? 'piercing' });
        if (k.id === 'marked' && k.value === 2 && weaponish && !c.onceFlags.includes('foe')) { dmg.push({ amount: rollDice('1d4', crit).total, type: dmg[0]?.type ?? 'piercing' }); c.onceFlags.push('foe'); }
      }
    }
    if ((ch.traits ?? []).includes('echo_touched')) dmg.push({ amount: rollDie(4), type: 'psychic' });
    if (a.special === 'echo_blade') dmg.push({ amount: rollDice('1d6', crit).total, type: 'psychic' });
    if (hasCondition(ch, 'raging') && hasFeature(ch, 'ancestral_protectors') && !c.onceFlags.includes('ancestors')) {
      this.addCondition(c, t, 'marked', 2, { value: 5 }); c.onceFlags.push('ancestors');
    }
  }

  private attackObject(c: Combatant, o: CombatObject, a: ActionDef, slot: number): void {
    const r = rollD20('normal');
    const total = r.natural + this.attackBonusFor(c, a);
    const hit = r.natural !== 1 && (r.natural === 20 || total >= o.ac);
    this.log(`${c.char.name} attacks the ${o.name.toLowerCase()}: ${total} vs AC ${o.ac} — ${hit ? 'hit' : 'miss'}`);
    if (!hit) return;
    const dmg = this.rollActionDamage(c, a, r.natural === 20, slot).reduce((s, d) => s + d.amount, 0);
    this.damageObject(c, o, dmg);
  }

  damageObject(c: Combatant | null, o: CombatObject, amount: number): void {
    if (o.destroyed) return;
    o.hp -= amount;
    this.events.push({ type: 'text', text: `${o.name} takes ${amount} damage.` });
    if (o.hp <= 0) this.destroyObject(o, c);
  }

  private destroyObject(o: CombatObject, by: Combatant | null): void {
    o.destroyed = true;
    if (o.kind === 'barrel') {
      this.destroyedTiles.push(key(o.x, o.y));
      mapRuntime(this.s, this.map.id).removed.push(`tile_${o.x}_${o.y}`);
      this.events.push({ type: 'explosion', x: o.x, y: o.y });
      this.log(`The barrel of lamp oil EXPLODES!`, 'crit');
      const tiles: { x: number; y: number }[] = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = o.x + dx, y = o.y + dy;
        if (!this.inBounds(x, y)) continue;
        tiles.push({ x, y });
        if (tile(this.tileChar(x, y)).walk) this.fires.push({ x, y, rounds: 3 });
      }
      this.events.push({ type: 'aoe', tiles, actionId: 'explosion', color: '#ff8a3d' });
      for (const t of this.combatants.filter((t) => !t.removed && t.char.hp > 0 && dist(t, o) <= 1)) {
        const sv = this.save(t, 'dex', 12);
        this.events.push({ type: 'save', targetId: t.id, result: sv });
        const d = rollDice('3d6').total;
        this.dealDamage(by, t, [{ amount: sv.success ? Math.floor(d / 2) : d, type: 'fire' }], false);
      }
      for (const other of this.objects.filter((x) => !x.destroyed && dist(x, o) <= 1)) this.damageObject(by, other, 6);
    } else if (o.kind === 'pillar') {
      const left = this.objects.filter((x) => x.kind === 'pillar' && !x.destroyed).length;
      this.events.push({ type: 'explosion', x: o.x, y: o.y });
      this.log(left ? `A resonance pillar shatters! ${left} remain.` : 'The last resonance pillar shatters! The Bellwarden\'s ward collapses — it can be hurt now!', 'phase');
    }
  }

  // ─────────────────────────── Saves, damage, conditions

  private applySaveEffect(c: Combatant, t: Combatant, a: ActionDef, slot: number): void {
    const dc = c.char.kind === 'enemy' ? 8 + prof(c.char) + Math.max(mod(c.char, 'wis'), mod(c.char, 'int'), mod(c.char, 'cha'), mod(c.char, 'con')) + this.settings.enemyAttackBonus : spellSaveDC(c.char);
    const save = a.save!;
    const dis = a.id === 'shatter' && creatureType(t.char) === 'construct' ? 1 : 0;
    const vs = a.condition?.id === 'frightened' ? 'frightened' : a.condition?.id === 'charmed' ? 'charmed' : undefined;
    const r = this.save(t, save.ability, dc, { vsMagic: a.kind === 'spell', dis, vs });
    if (t.side === 'party') recordRoll(this.s, r);
    this.events.push({ type: 'save', targetId: t.id, result: r });
    this.log(`${t.char.name} ${ABILITY_NAMES[save.ability]} save ${r.total} vs DC ${dc}: ${r.success ? 'success' : 'failure'}`);
    if (a.damage) {
      let dmg = this.rollActionDamage(c, a, false, slot, t);
      const halfAnyway = save.half || ((a.level ?? 0) === 0 && a.kind === 'spell' && hasFeature(c.char, 'potent_cantrip'));
      if (r.success) dmg = halfAnyway ? dmg.map((d) => ({ ...d, amount: Math.floor(d.amount / 2) })) : [];
      if (r.success && hasFeature(t.char, 'evasion') && save.ability === 'dex') dmg = [];
      if (dmg.length) this.dealDamage(c, t, dmg, false);
    }
    if (a.condition && (!r.success || !a.condition.onFail) && t.char.hp > 0) {
      if (a.condition.onFail && r.success) return;
      if (!r.success || !a.condition.onFail) {
        const value = a.special === 'taunt' ? 4 : a.special === 'banish' ? 88 : a.condition.value;
        const id = a.condition.id;
        this.addCondition(c, t, id, a.condition.duration, { value, concentration: a.concentration, saveEnds: a.condition.saveEnds ? { ability: save.ability, dc } : undefined, endsOnDamage: a.special === 'hypnotic' || a.special === 'turn' });
        if (a.special === 'hypnotic') this.addCondition(c, t, 'charmed', a.condition.duration, { concentration: true, endsOnDamage: true });
        if (a.special === 'turn') {
          this.addCondition(c, t, 'incapacitated', a.condition.duration, { endsOnDamage: true });
          if (hasFeature(c.char, 'destroy_undead') && (t.char.monsterLevel ?? 1) <= 1) { t.char.hp = 0; this.handleDown(c, t, false); }
        }
        if (a.special === 'command') this.addCondition(c, t, 'incapacitated', 1, {});
      }
    }
  }

  addCondition(source: Combatant, t: Combatant, id: ConditionId, duration: number, o: { value?: number; concentration?: boolean; saveEnds?: { ability: any; dc: number }; endsOnDamage?: boolean } = {}): void {
    if (t.char.conditionImmunities?.includes(id)) { this.log(`${t.char.name} is immune to being ${id}.`); return; }
    const blocked = this.conditionBlocked(t, id);
    if (blocked) { this.log(`${t.char.name} is protected from being ${id} (${blocked}).`); return; }
    const dur = duration > 0 && source.id === t.id ? duration + 1 : duration;
    t.char.conditions = t.char.conditions.filter((k) => !(k.id === id && k.sourceId === source.id));
    t.char.conditions.push({ id, duration: dur, sourceId: source.id, value: o.value, concentration: o.concentration, saveEnds: o.saveEnds, endsOnDamage: o.endsOnDamage });
    if (o.concentration && source.concentration) source.concentration.targetIds.push(t.id);
    this.events.push({ type: 'condition', targetId: t.id, condition: id, added: true });
    if (!['disengaged', 'shielded', 'reckless'].includes(id)) this.log(`${t.char.name} is ${CONDITION_WORDS[id] ?? id}.`);
  }

  breakConcentration(c: Combatant, announce = true): void {
    if (!c.concentration) return;
    for (const t of this.combatants) t.char.conditions = t.char.conditions.filter((k) => !(k.sourceId === c.id && k.concentration));
    if (announce) this.log(`${c.char.name} loses concentration on ${ACTION_BY_ID[c.concentration.actionId]?.name ?? 'a spell'}.`);
    c.concentration = undefined;
  }

  dealDamage(source: Combatant | null, t: Combatant, parts: { amount: number; type: DamageType }[], crit: boolean): number {
    const T = t.char;
    let total = 0;
    const notes: string[] = [];
    const wasDown = T.hp <= 0;
    if (source && source.side !== t.side && T.hp > 0 && parts.length) {
      const guard = this.alliesOf(t).find((al) => al.reaction && hasCondition(al.char, 'raging') && hasFeature(al.char, 'spirit_shield') && dist(al, t) <= 6);
      if (guard) {
        guard.reaction = false;
        const red = rollDice('2d6').total;
        parts = parts.map((p, i) => (i === 0 ? { ...p, amount: Math.max(0, p.amount - red) } : p));
        this.log(`${guard.char.name}’s ancestral spirits shield ${T.name} (−${red}).`);
      }
    }
    for (const p of parts) {
      let amount = p.amount;
      // Bellwarden: resonance pillar ward
      if (T.templateId === 'bellwarden' && this.objects.some((o) => o.kind === 'pillar' && !o.destroyed) && p.type !== 'radiant' && p.type !== 'thunder') {
        amount = Math.floor(amount / 2); notes.push('warded');
      }
      // Uncanny dodge
      if (source && hasFeature(T, 'uncanny_dodge') && t.reaction && this.allowsReaction(t, 'defensive') && T.hp > 0 && amount >= 6) { t.reaction = false; amount = Math.floor(amount / 2); notes.push('uncanny dodge'); }
      const res = applyDamage(T, amount, p.type);
      if (res.note) notes.push(res.note);
      total += res.dealt;
    }
    if (wasDown && t.side === 'party' && !T.dead && total > 0 && !this.encounter.nonlethal) {
      T.deathSaves.failures += crit ? 2 : 1;
      this.log(`${T.name} suffers a death save failure from the blow!`);
      if (T.deathSaves.failures >= 3) this.killPartyMember(t);
      return total;
    }
    this.events.push({ type: 'damage', targetId: t.id, amount: total, dtype: parts.map((p) => p.type).join('+'), note: notes.join(', ') });
    if (total > 0) this.log(`${T.name} takes ${total} damage${notes.length ? ` (${notes.join(', ')})` : ''}.`);
    if (T.hp > 0 && t.concentration && total > 0) {
      const dc = Math.max(10, Math.floor(total / 2));
      const r = this.save(t, 'con', dc, { adv: T.feats.includes('war_caster') ? 1 : 0 });
      if (!r.success) this.breakConcentration(t);
    }
    // Damage breaks turning
    if (total > 0 && T.conditions.some((k) => k.endsOnDamage)) {
      T.conditions = T.conditions.filter((k) => !k.endsOnDamage);
      this.log(`The pain snaps ${T.name} out of it.`);
    }
    if (T.hp <= 0 && !wasDown) this.handleDown(source, t, parts.every((p) => p.type !== 'radiant') && !crit, total);
    // Boss phase change
    if (T.templateId === 'bellwarden' && this.phase === 1 && T.hp > 0 && T.hp <= T.maxHp / 2) this.bellwardenPhase2(t);
    return total;
  }

  private handleDown(source: Combatant | null, t: Combatant, nonRadiant: boolean, lastHit = 0): void {
    const T = t.char;
    if (t.side === 'enemy') {
      if ((T.traits ?? []).includes('undead_fortitude') && nonRadiant && !(T.traits ?? []).includes('fortitude_used')) {
        const sv = savingThrow(T, 'con', 5 + lastHit);
        T.traits = [...(T.traits ?? []), 'fortitude_used'];
        if (sv.success) { T.hp = 1; this.log(`${T.name} refuses to fall!`); return; }
      }
      t.removed = true;
      T.dead = !this.encounter.nonlethal;
      this.xpEarned += T.xpValue ?? 0;
      this.events.push({ type: 'down', targetId: t.id, dead: !this.encounter.nonlethal });
      this.log(this.encounter.nonlethal ? `${T.name} is knocked out cold.` : `${T.name} is destroyed.`);
      if (source && hasFeature(source.char, 'dark_blessing')) {
        const amt = Math.max(1, mod(source.char, 'cha') + source.char.level);
        source.char.tempHp = Math.max(source.char.tempHp, amt);
        this.log(`The Ember Court rewards ${source.char.name}: ${amt} temporary HP.`);
      }
      if (source?.concentration) source.concentration.targetIds = source.concentration.targetIds.filter((id) => id !== t.id);
      return;
    }
    // Party member drops
    const ward = T.conditions.find((k) => k.id === 'deathward');
    if (ward) { T.conditions = T.conditions.filter((k) => k !== ward); T.hp = 1; this.log(`Death Ward flares — ${T.name} stays standing with 1 HP!`, 'phase'); return; }
    if (T.ancestry === 'ashkin' && resourceLeft(T, 'unyielding') > 0) {
      T.resources.unyielding.used++;
      T.hp = 1;
      this.log(`${T.name} should have fallen — but Ashkin blood is stubborn. (Unyielding: 1 HP)`, 'phase');
      return;
    }
    this.breakConcentration(t);
    T.deathSaves = { successes: 0, failures: 0 };
    T.stable = !!this.encounter.nonlethal;
    T.conditions = T.conditions.filter((k) => k.id !== 'raging');
    this.events.push({ type: 'down', targetId: t.id, dead: false });
    this.log(this.encounter.nonlethal ? `${T.name} is knocked senseless.` : `${T.name} falls unconscious!`, 'phase');
  }

  private bellwardenPhase2(t: Combatant): void {
    this.phase = 2;
    const T = t.char;
    T.speedOverride = (T.speedOverride ?? 5) + 1;
    if (T.combatResources) { T.combatResources.summon = 1; T.combatResources.toll = 1; }
    this.log('The bell CRACKS. A sound like a scream torn in half fills the vault. The Bellwarden lurches forward, faster now, ringing wildly.', 'phase');
    if (this.s.flags.halric_named) {
      this.addCondition(t, t, 'stunned', 1, {});
      this.log('"...Halric..." it whispers in a man\'s voice, and for a moment it simply stands there, remembering its own name.', 'phase');
    }
  }

  private summonEchoes(c: Combatant): void {
    const occupied = new Set(this.combatants.filter((x) => !x.removed).map((x) => key(x.x, x.y)));
    const spots = this.freeSpotsNear(c.x, c.y, 3, occupied).filter((p) => this.inBounds(p.x, p.y) && !(p.x === c.x && p.y === c.y)).slice(0, 2);
    spots.forEach((p, i) => {
      const e = createEnemy('hollow_echo', { hpMult: this.settings.enemyHpMult, idSuffix: `sum${this.round}_${i}` });
      e.xpValue = 10;
      const cb = this.makeCombatant(e, 'enemy', p.x, p.y);
      cb.summoned = true;
      cb.initiative = c.initiative - 0.5;
      this.combatants.push(cb);
      const idx = this.order.indexOf(c.id);
      this.order.splice(idx + 1, 0, cb.id);
      this.events.push({ type: 'spawn', id: cb.id });
    });
    this.log('The bell tolls a summons. Grey figures step out of the walls — a congregation of the forgotten.', 'phase');
  }

  private doHelp(c: Combatant, t: Combatant): void {
    const r = skillCheck(c.char, 'medicine', 10);
    recordRoll(this.s, r);
    if (r.success || c.char.feats.includes('healer')) {
      const amt = c.char.feats.includes('healer') ? rollDice('1d4+1').total : 1;
      t.char.dead = false;
      heal(t.char, amt);
      this.events.push({ type: 'heal', targetId: t.id, amount: amt });
      this.log(`${c.char.name} gets ${t.char.name} back on their feet (${amt} HP).`);
    } else {
      this.log(`${c.char.name} tries to rouse ${t.char.name} but fails (Medicine ${r.total} vs DC 10).`);
    }
  }

  private doShove(c: Combatant, t: Combatant): void {
    const res = contest(c.char, 'athletics', t.char, ['athletics', 'acrobatics']);
    recordRoll(this.s, res.a);
    this.log(`${c.char.name} shoves ${t.char.name}: ${res.a.total} vs ${res.d.total} — ${res.attackerWins ? 'success' : 'resisted'}`);
    if (!res.attackerWins) return;
    if (!this.pushAway(c, t, 1)) this.addCondition(c, t, 'prone', -1, {});
  }

  /** Pull a target toward the source, stopping adjacent to it. */
  pullToward(source: Combatant, t: Combatant, squares: number): void {
    for (let i = 0; i < squares && dist(source, t) > 1; i++) {
      const nx = t.x + Math.sign(source.x - t.x), ny = t.y + Math.sign(source.y - t.y);
      if (!this.walkable(nx, ny) || this.occupant(nx, ny)) break;
      t.x = nx; t.y = ny;
      this.events.push({ type: 'move', id: t.id, path: [{ x: nx, y: ny }] });
      this.hazardAt(t, false);
    }
    this.log(`${t.char.name} is dragged toward ${source.char.name}.`);
  }

  /** Push target away from source. Returns true if moved. Chasms and hazards hurt. */
  pushAway(source: Combatant, t: Combatant, squares: number): boolean {
    let moved = false;
    for (let i = 0; i < squares; i++) {
      const dx = Math.sign(t.x - source.x), dy = Math.sign(t.y - source.y);
      const nx = t.x + (dx || 0), ny = t.y + (dy || 0);
      if (this.tileChar(nx, ny) === 'v') {
        this.log(`${t.char.name} is hurled into the pit!`, 'crit');
        this.dealDamage(source, t, [{ amount: rollDice('3d6').total, type: 'bludgeoning' }], false);
        if (t.char.hp > 0) this.addCondition(source, t, 'prone', -1, {});
        return true;
      }
      if (!this.walkable(nx, ny) || this.occupant(nx, ny)) break;
      t.x = nx; t.y = ny; moved = true;
      this.events.push({ type: 'move', id: t.id, path: [{ x: nx, y: ny }] });
      this.hazardAt(t, false);
    }
    return moved;
  }

  private doHide(c: Combatant): void {
    const r = skillCheck(c.char, 'stealth');
    recordRoll(this.s, r);
    const seen = this.enemiesOf(c).some((e) => 10 + mod(e.char, 'wis') + (e.char.skillProfs.includes('perception') ? prof(e.char) : 0) >= r.total && this.los(e, c) && dist(e, c) <= 8);
    if (!seen) this.addCondition(c, c, 'hidden', 2, {});
    else this.log(`${c.char.name} tries to hide but is spotted (Stealth ${r.total}).`);
  }

  // ─────────────────────────── Legendary actions

  /** After another creature's turn, legendary creatures may spend legendary points. */
  private legendaryActions(justActed: Combatant): void {
    for (const L of this.combatants) {
      if (L.id === justActed.id || L.removed || L.char.hp <= 0) continue;
      const tpl = L.char.templateId ? ENEMY_BY_ID[L.char.templateId] : undefined;
      if (!tpl?.legendary) continue;
      if (hasCondition(L.char, 'stunned') || hasCondition(L.char, 'incapacitated')) continue;
      const left = this.legendaryLeft.get(L.id) ?? tpl.legendary.per;
      if (left <= 0) continue;
      // Prefer the costliest affordable option that would hit at least two foes, else a single strike.
      const foes = this.enemiesOf(L);
      let used = false;
      for (const opt of [...tpl.legendary.actions].sort((a, b) => b.cost - a.cost)) {
        if (opt.cost > left) continue;
        const a = ACTION_BY_ID[opt.id];
        if (a.area?.fromSelf) {
          const hit = foes.filter((f) => dist(f, L) <= a.area!.size).length;
          if (hit < 2) continue;
          this.log(`${L.char.name} uses a legendary action: ${a.name}!`, 'phase');
          this.resolveAction(L, a, undefined, undefined, { x: L.x, y: L.y }, 0);
        } else {
          const t = foes.filter((f) => this.isTargetable(L, a, f)).sort((x, y) => x.char.hp - y.char.hp)[0];
          if (!t) continue;
          this.log(`${L.char.name} uses a legendary action: ${a.name}!`, 'phase');
          this.resolveAttack(L, t, a);
        }
        this.legendaryLeft.set(L.id, left - opt.cost);
        used = true;
        break;
      }
      void used;
    }
  }

  /** Roll drops for defeated enemies (called once on victory). */
  private rollLoot(): void {
    for (const c of this.combatants) {
      if (c.side !== 'enemy' || c.summoned || c.char.hp > 0) continue;
      const tpl = c.char.templateId ? ENEMY_BY_ID[c.char.templateId] : undefined;
      if (!tpl) continue;
      for (const [itemId, p, qty] of tpl.loot ?? []) if (random() < p || p >= 1) this.loot.push({ itemId, qty });
      if (tpl.gold) this.goldLoot += rollDice(tpl.gold).total;
    }
  }

  // ─────────────────────────── Saving throws with auras and rerolls

  /** Saving throw including party auras (Aura of Protection, Countercharm) and luck features. */
  save(t: Combatant, ab: Ability, dc: number, o: { vsMagic?: boolean; dis?: number; adv?: number; vs?: string } = {}): CheckResult {
    const extra: BonusPart[] = [];
    const aura = this.auraOfProtection(t);
    if (aura) extra.push({ label: 'Aura of Protection', value: aura });
    let adv = o.adv ?? 0;
    if (o.vs === 'frightened' || o.vs === 'charmed') {
      if (hasFeature(t.char, 'steadfast')) adv++;
      if ([t, ...this.alliesOf(t)].some((al) => al.char.hp > 0 && hasFeature(al.char, 'countercharm') && dist(al, t) <= 6)) adv++;
    }
    let r = savingThrow(t.char, ab, dc, { vsMagic: o.vsMagic, dis: o.dis, adv, vs: o.vs, extra });
    if (r.success) return r;
    const T = t.char;
    // Ember's Own Luck: +1d10 to a failed save.
    if (hasFeature(T, 'embers_luck') && resourceLeft(T, 'embers_luck') > 0 && r.total + 10 >= dc) {
      T.resources.embers_luck.used++;
      const d = rollDie(10);
      r = { ...r, total: r.total + d, parts: [...r.parts, { label: 'Ember’s Own Luck', value: d }] };
      r.success = r.total >= dc;
      this.log(`${T.name} calls on the Ember Court’s luck (+${d}).`);
      if (r.success) return r;
    }
    // Bend Luck: an allied sorcerer adds 1d4 when it would matter.
    const bender = this.alliesOf(t).find((al) => al.reaction && al.char.hp > 0 && hasFeature(al.char, 'bend_luck') && resourceLeft(al.char, 'sorcery_points') >= 2 && dist(al, t) <= 12);
    if (bender && dc - r.total <= 4) {
      bender.reaction = false;
      bender.char.resources.sorcery_points.used += 2;
      const d = rollDie(4);
      r = { ...r, total: r.total + d, parts: [...r.parts, { label: 'Bend Luck', value: d }] };
      r.success = r.total >= dc;
      this.log(`${bender.char.name} bends luck for ${T.name} (+${d}).`);
      if (r.success) return r;
    }
    // Indomitable: reroll the save.
    if (hasFeature(T, 'indomitable') && resourceLeft(T, 'indomitable') > 0) {
      T.resources.indomitable.used++;
      this.log(`${T.name} refuses to yield — Indomitable!`);
      return savingThrow(T, ab, dc, { vsMagic: o.vsMagic, dis: o.dis, adv, vs: o.vs, extra });
    }
    return r;
  }

  /** Highest Aura of Protection bonus affecting this creature (paladins within 2 squares, conscious). */
  auraOfProtection(t: Combatant): number {
    let best = 0;
    for (const al of [t, ...this.alliesOf(t)]) {
      if (al.char.hp <= 0 || !hasFeature(al.char, 'aura_of_protection') || dist(al, t) > 2) continue;
      best = Math.max(best, Math.max(1, mod(al.char, 'cha')));
    }
    return best;
  }

  /** Conditions some features make a creature immune to. */
  conditionBlocked(t: Combatant, id: ConditionId): string | null {
    const T = t.char;
    const auraFrom = (feat: string) => [t, ...this.alliesOf(t)].find((al) => al.char.hp > 0 && hasFeature(al.char, feat) && dist(al, t) <= 2);
    if (id === 'frightened') {
      const p = auraFrom('aura_of_courage');
      if (p) return `${p.char.name}’s Aura of Courage`;
      if (hasCondition(T, 'raging') && hasFeature(T, 'mindless_rage')) return 'Mindless Rage';
    }
    if (id === 'charmed') {
      const p = auraFrom('aura_of_devotion');
      if (p) return `${p.char.name}’s Aura of Devotion`;
      if (hasCondition(T, 'raging') && hasFeature(T, 'mindless_rage')) return 'Mindless Rage';
      if (hasFeature(T, 'thought_shield')) return 'Thought Shield';
    }
    return null;
  }

  /** Movement cost of entering a square for this creature. */
  stepCost(c: Combatant | undefined, x: number, y: number): number {
    if (!tile(this.tileChar(x, y)).difficult) return 1;
    return c && hasFeature(c.char, 'lands_stride') ? 1 : 2;
  }

  /** Wild Aether surge table. */
  private wildSurge(c: Combatant): void {
    const ch = c.char;
    const roll = rollDie(6);
    this.log(`Wild Surge! The Aether answers ${ch.name} in a voice not quite their own…`, 'phase');
    switch (roll) {
      case 1: { const h = heal(ch, rollDice('2d6').total); this.events.push({ type: 'heal', targetId: c.id, amount: h }); this.log(`Warm light knits ${ch.name}’s wounds (+${h} HP).`); break; }
      case 2: {
        this.log('A ring of grey fire bursts outward!');
        for (const t of this.combatants.filter((x) => !x.removed && x.char.hp > 0 && x.id !== c.id && dist(x, c) <= 1)) this.dealDamage(c, t, [{ amount: rollDice('2d6').total, type: 'fire' }], false);
        break;
      }
      case 3: this.addCondition(c, c, 'invisible', 1); break;
      case 4: for (const al of this.alliesInRange(c, 6)) this.addCondition(c, al, 'blessed', 2); break;
      case 5: ch.tempHp = Math.max(ch.tempHp, rollDice('2d10').total); this.log(`${ch.name} is wrapped in crackling half-reality (temporary HP).`); break;
      default: { const e = this.enemiesOf(c).sort((a, b) => dist(a, c) - dist(b, c))[0]; if (e) { this.log(`A bolt of raw Aether leaps to ${e.char.name}!`); this.dealDamage(c, e, [{ amount: rollDice('1d10').total, type: 'force' }], false); } }
    }
  }

  // ─────────────────────────── Items

  /** Potions and scrolls: drinking/using costs an action (a bonus action with Fast Hands). */
  canUseItem(c: Combatant): boolean {
    if (c.id !== this.current().id || c.char.hp <= 0) return false;
    return hasFeature(c.char, 'fast_hands') ? c.bonus || c.action : c.action;
  }

  useItem(c: Combatant, itemId: string, targetId?: string): CombatEvent[] {
    const def = ITEM_BY_ID[itemId];
    if (!def?.use) throw new Error('Not a usable item');
    if (!this.canUseItem(c)) throw new Error('No action available');
    const stack = this.s.inventory.find((i) => i.itemId === itemId && i.qty > 0);
    if (!stack) throw new Error('You have none left');
    const t = targetId ? this.get(targetId) : c;
    if (!t || (t.id !== c.id && dist(c, t) > 1)) throw new Error('Target must be adjacent');
    stack.qty--; this.s.inventory = this.s.inventory.filter((i) => i.qty > 0);
    if (hasFeature(c.char, 'fast_hands') && c.bonus) c.bonus = false; else c.action = false;
    const u = def.use;
    if (u.kind === 'heal') {
      const amt = rollDice(u.dice).total;
      const healed = heal(t.char, amt);
      this.events.push({ type: 'heal', targetId: t.id, amount: healed });
      this.log(`${c.char.name} ${t === c ? 'drinks' : `administers`} ${def.name}${t === c ? '' : ` to ${t.char.name}`}: +${healed} HP.`);
    } else if (u.kind === 'cure') {
      t.char.conditions = t.char.conditions.filter((k) => !u.conditions.includes(k.id));
      this.log(`${t.char.name} is cured.`);
    } else if (u.kind === 'buff') {
      t.char.conditions = t.char.conditions.filter((k) => k.id !== 'frightened');
      this.addCondition(c, t, u.condition as ConditionId, u.duration);
    } else if (u.kind === 'spell') {
      const a = ACTION_BY_ID[u.spellId];
      this.log(`${c.char.name} uses ${def.name}.`);
      // Scroll/flask effects resolve like the spell without spending a slot; aimed at the target or nearest enemy.
      const enemy = targetId && this.get(targetId)?.side !== c.side ? this.get(targetId) : this.enemiesOf(c).sort((x, y) => dist(c, x) - dist(c, y))[0];
      if (a.target === 'ally') this.resolveAction(c, a, t, undefined, undefined, u.level);
      else if (a.area) this.resolveAction(c, a, undefined, undefined, enemy ? { x: enemy.x, y: enemy.y } : { x: c.x, y: c.y }, u.level);
      else if (enemy && dist(c, enemy) <= Math.max(1, a.range)) this.resolveAction(c, a, enemy, undefined, undefined, u.level);
      else this.log('…but there is no target in range. The item is wasted.');
    } else {
      this.log(`${def.name} has no effect in combat.`);
    }
    this.checkEnd();
    return this.flush();
  }

  // ─────────────────────────── Fleeing

  canFlee(): boolean { return !!this.encounter.canFlee; }

  flee(): void {
    this.over = 'fled';
    this.log('The party retreats!', 'phase');
  }

  /** Enemy save DC for UI display. */
  saveDcFor(c: Combatant): number {
    return c.char.kind === 'enemy' ? 8 + prof(c.char) + Math.max(mod(c.char, 'wis'), mod(c.char, 'int'), mod(c.char, 'cha'), mod(c.char, 'con')) : spellSaveDC(c.char);
  }

  saveBonusOf(c: Combatant, ab: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'): number { return saveBonus(c.char, ab); }
}

const ENEMY_BOSS = new Set(['bellwarden', 'seeker_ysolt', 'echo_sentinel', 'sellsword_captain']);

export const DAMAGE_COLORS: Record<string, string> = {
  fire: '#ff8a3d', cold: '#8fd8ff', lightning: '#c7b3ff', thunder: '#e8d38c', acid: '#9be36b', poison: '#7fd66b',
  radiant: '#fff0a8', necrotic: '#8e6bbf', psychic: '#ff8fd8', force: '#b8c8ff', slashing: '#ddd', piercing: '#ddd', bludgeoning: '#ddd',
};

export const CONDITION_WORDS: Partial<Record<ConditionId, string>> = {
  poisoned: 'poisoned', frightened: 'frightened', charmed: 'charmed', stunned: 'stunned', prone: 'knocked prone', restrained: 'restrained',
  blinded: 'blinded', invisible: 'invisible', incapacitated: 'incapacitated', blessed: 'blessed', raging: 'raging', dodging: 'dodging',
  hidden: 'hidden', inspired: 'inspired', hexed: 'hexed', marked: 'marked', shielded: 'shielded', resonant: 'limned in guiding light',
  burning: 'on fire', slowed: 'slowed', disengaged: 'disengaging', guarded: 'warded against weapons', reckless: 'reckless', surprised: 'surprised',
};

export const CONDITION_RULES: Partial<Record<ConditionId, string>> = {
  poisoned: 'Disadvantage on attack rolls and ability checks.',
  frightened: 'Disadvantage on attack rolls and ability checks.',
  charmed: 'Cannot attack the charmer.',
  stunned: 'Cannot act or move; fails Strength and Dexterity saves; attacks against it have advantage, and adjacent hits are critical.',
  prone: 'Disadvantage on own attacks. Melee attacks against it have advantage, ranged attacks disadvantage. Standing costs half movement.',
  restrained: 'Speed 0. Disadvantage on own attacks and Dexterity saves; attacks against it have advantage.',
  blinded: 'Disadvantage on own attacks; attacks against it have advantage.',
  invisible: 'Advantage on own attacks; attacks against it have disadvantage. Ends when attacking or casting.',
  incapacitated: 'Cannot take actions or reactions.',
  blessed: 'Adds 1d4 to attack rolls and saving throws.',
  raging: '+2 melee damage; resistance to bludgeoning, piercing and slashing; advantage on Strength checks and saves.',
  dodging: 'Attacks against it have disadvantage; advantage on Dexterity saves.',
  hidden: 'Unseen: next attack has advantage.',
  inspired: 'Adds a bonus die to the next attack, check or save.',
  hexed: 'Takes extra necrotic damage from the caster\'s hits.',
  marked: 'Marked by an enemy ability (quarry, vow or challenge).',
  shielded: 'Bonus to Armour Class.',
  resonant: 'The next attack against it has advantage.',
  burning: 'Takes 1d4 fire damage at the start of its turn.',
  slowed: 'Speed halved.',
  disengaged: 'Movement does not provoke opportunity attacks this turn.',
  guarded: 'Resistance to bludgeoning, piercing and slashing damage.',
  reckless: 'Attacks against it have advantage until its next turn.',
  surprised: 'Loses its first turn.',
};
