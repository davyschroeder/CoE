/**
 * Utility-scoring tactical AI for CPU companions and enemies.
 *
 * Each step the AI enumerates legal (move, action, target) options through the combat engine's own
 * validation API, scores them, and executes the best one. Scores combine expected damage, kill
 * chance, healing need, control value, risk (opportunity attacks, exposure), resource cost and
 * friendly fire — weighted by the character's combat personality and the player's party orders.
 */
import { Combat, dist, type Combatant, type CombatEvent } from './combat';
import { ACTION_BY_ID, type ActionDef } from '../../data/actions';
import { averageDice } from '../../core/dice';
import { COMPANION_BY_ID } from '../../data/companions';
import { hasCondition, isRangedWeapon, mainWeapon, spellMod, creatureType, cantripDiceMultiplier } from '../character';
import { random } from '../../core/rng';

export interface Plan {
  score: number;
  moveTo?: { x: number; y: number };
  actionId?: string;
  target?: { id: string } | { x: number; y: number };
  label: string;
}

interface Personality { aggression: number; caution: number; support: number; focus: number; role: string; }

function personality(c: Combatant): Personality {
  if (c.char.companionId) {
    const d = COMPANION_BY_ID[c.char.companionId];
    return { ...d.combat };
  }
  if (c.side === 'party') return { aggression: 0.7, caution: 0.5, support: 0.5, focus: 0.6, role: 'striker' };
  switch (c.char.aiProfile) {
    case 'archer': return { aggression: 0.6, caution: 0.7, support: 0, focus: 0.6, role: 'striker' };
    case 'caster': return { aggression: 0.7, caution: 0.6, support: 0, focus: 0.7, role: 'controller' };
    case 'pack': return { aggression: 0.8, caution: 0.2, support: 0, focus: 0.8, role: 'skirmisher' };
    case 'skirmisher': return { aggression: 0.7, caution: 0.4, support: 0, focus: 0.5, role: 'skirmisher' };
    default: return { aggression: 0.8, caution: 0.2, support: 0, focus: 0.4, role: 'tank' };
  }
}

function expectedDamage(cb: Combat, c: Combatant, a: ActionDef, t?: Combatant): number {
  const fake = cb.rollActionDamagePreview(c, a, t);
  return fake;
}

/** Threat a combatant poses (approximate damage per round). */
function threat(cb: Combat, t: Combatant): number {
  const acts = cb.actionsFor(t).filter((a) => a.tags.includes('damage'));
  let best = 0;
  for (const a of acts) best = Math.max(best, cb.rollActionDamagePreview(t, a));
  return best * (t.char.multiattack ?? 1);
}

function targetPriority(cb: Combat, c: Combatant, t: Combatant, dmg: number, p: Personality): number {
  let pr = 1;
  const killChance = dmg >= t.char.hp ? 1 : dmg / Math.max(1, t.char.hp);
  pr += killChance * 1.5 * (0.5 + p.focus);
  pr += threat(cb, t) / 15;
  if (t.concentration) pr += 0.4;
  if (c.side === 'party' && cb.lastPlayerTarget === t.id && cb.s.orders.stance === 'follow') pr += 0.8;
  // Protect the weakest: prefer enemies that threaten our most fragile ally.
  if (c.side === 'party' && cb.s.orders.protectWeakest) {
    const weakest = cb.alive('party').sort((a, b) => a.char.hp - b.char.hp)[0];
    if (weakest && dist(weakest, t) <= 2) pr += 0.7;
  }
  // Taunted creatures must go for their taunter.
  const taunt = c.char.conditions.find((k) => k.id === 'marked' && k.value === 4);
  if (taunt && taunt.sourceId === t.id) pr += 2;
  return pr;
}

/** Positional risk of ending the turn at (x, y). */
function exposure(cb: Combat, c: Combatant, x: number, y: number, p: Personality): number {
  const enemies = cb.enemiesOf(c);
  const adj = enemies.filter((e) => Math.max(Math.abs(e.x - x), Math.abs(e.y - y)) <= cb.reach(e)).length;
  const fragile = c.char.maxHp < 25 || p.role === 'controller' || p.role === 'healer';
  const hpFrac = c.char.hp / c.char.maxHp;
  let risk = adj * (fragile ? 1.2 : 0.3) * (1.5 - hpFrac);
  if (p.role === 'tank') risk -= adj * 0.4; // tanks want to be in the thick of it
  const t = cb.tileChar(x, y);
  if (t === 'a' || cb.fires.some((f) => f.x === x && f.y === y)) risk += 3;
  return risk * (0.5 + p.caution);
}

function slotCost(cb: Combat, c: Combatant, a: ActionDef, p: Personality): number {
  let cost = 0;
  if (a.kind === 'spell' && (a.level ?? 0) > 0) cost += (a.level ?? 1) * 1.2;
  if (a.resource) cost += 0.8;
  if (c.side === 'party' && cb.s.orders.conserve) cost *= 2.5;
  // Spend freely when things look grim.
  const partyHp = cb.alive(c.side).reduce((s, x) => s + x.char.hp / x.char.maxHp, 0) / Math.max(1, cb.alive(c.side).length);
  if (partyHp < 0.5) cost *= 0.5;
  // Boss fights are worth the resources.
  if (cb.enemiesOf(c).some((e) => e.char.templateId === 'bellwarden' || e.char.templateId === 'seeker_ysolt' || e.char.templateId === 'echo_sentinel')) cost *= 0.4;
  return cost * (0.6 + p.caution * 0.6);
}

/** Candidate positions this turn (current square plus reachable squares), with movement risk. */
function candidatePositions(cb: Combat, c: Combatant): { x: number; y: number; risk: number; cost: number }[] {
  const hold = c.side === 'party' && cb.s.orders.stance === 'hold';
  const out: { x: number; y: number; risk: number; cost: number }[] = [{ x: c.x, y: c.y, risk: 0, cost: 0 }];
  if (hold || c.movement <= 0) return out;
  const all = cb.reachableAll(c);
  const threats = cb.enemiesOf(c).filter((e) => e.reaction && !hasCondition(c.char, 'disengaged'));
  for (const v of cb.reachable(c).values()) {
    if (v.x === c.x && v.y === c.y) continue;
    let provokes = 0;
    if (threats.length) {
      const path = cb.pathTo(c, v.x, v.y, all);
      if (!path) continue;
      provokes = cb.provokers(c, path).length;
    }
    out.push({ x: v.x, y: v.y, risk: provokes * 2.5, cost: v.cost });
  }
  return out;
}

/** Positions from which a target is in range, cheapest first (capped for performance). */
function positionsFor(cb: Combat, c: Combatant, positions: { x: number; y: number; risk: number; cost: number }[], tx: number, ty: number, range: number, cap = 10) {
  const r = Math.max(1, range);
  return positions.filter((p) => Math.max(Math.abs(p.x - tx), Math.abs(p.y - ty)) <= r)
    .sort((a, b) => a.risk - b.risk || a.cost - b.cost).slice(0, cap);
  void c;
}

/** Temporarily place a combatant to evaluate an option from another square. */
function withPosition<T>(c: Combatant, x: number, y: number, fn: () => T): T {
  const ox = c.x, oy = c.y;
  c.x = x; c.y = y;
  try { return fn(); } finally { c.x = ox; c.y = oy; }
}

export function bestPlan(cb: Combat, c: Combatant): Plan | null {
  const p = personality(c);
  const noise = c.side === 'enemy' ? cb.settings.aiNoise : 0.15;
  const positions = candidatePositions(cb, c);
  const plans: Plan[] = [];
  const actions = cb.actionsFor(c).filter((a) => cb.canUse(c, a).ok && !['hide', 'interact', 'disengage', 'cunning_hide'].includes(a.id));
  const allies = cb.alive(c.side);
  const downed = cb.combatants.filter((x) => x.side === c.side && cb.isDowned(x) && !x.char.stable);

  for (const a of actions) {
    const cost = slotCost(cb, c, a, p);
    // Auras such as Spirit Guardians: worth moving into the fight for.
    if (a.special === 'spirit_guardians') {
      if (c.concentration) continue;
      const foes = cb.enemiesOf(c);
      for (const pos of positions.filter((q) => foes.some((f) => dist(f, q) <= 3)).sort((x, y) => x.cost - y.cost).slice(0, 10)) {
        const n = foes.filter((f) => dist(f, pos) <= 3).length;
        plans.push({ score: n * 9 + 2 - cost - pos.risk - exposure(cb, c, pos.x, pos.y, p) * 0.5, moveTo: pos, actionId: a.id, label: a.name });
      }
      continue;
    }
    // Self-targeted actions
    if (a.target === 'self' && !a.area) {
      const s = scoreSelf(cb, c, a, p);
      if (s > 0) plans.push({ score: s - cost, actionId: a.id, label: a.name });
      continue;
    }
    // Self-centred areas
    if (a.area?.fromSelf && a.area.shape === 'radius') {
      const foes = cb.enemiesOf(c);
      for (const pos of positions.filter((p) => foes.some((f) => Math.max(Math.abs(f.x - p.x), Math.abs(f.y - p.y)) <= a.area!.size)).sort((x, y) => x.cost - y.cost).slice(0, 12)) {
        const s = withPosition(c, pos.x, pos.y, () => scoreArea(cb, c, a, { x: pos.x, y: pos.y }, p));
        if (s > 0) plans.push({ score: s - cost - pos.risk - exposure(cb, c, pos.x, pos.y, p), moveTo: pos, actionId: a.id, target: { x: pos.x, y: pos.y }, label: a.name });
      }
      continue;
    }
    // Aimed areas (cones, lines, radius at a point)
    if (a.area) {
      const aims = cb.enemiesOf(c).map((e) => ({ x: e.x, y: e.y }));
      for (const aim of aims) {
        for (const pos of positionsFor(cb, c, positions, aim.x, aim.y, a.area.fromSelf ? a.area.size : a.range, 6)) {
          if (!a.area.fromSelf && Math.max(Math.abs(aim.x - pos.x), Math.abs(aim.y - pos.y)) > a.range) continue;
          const s = withPosition(c, pos.x, pos.y, () => (a.area!.fromSelf || cb.los(c, aim) ? scoreArea(cb, c, a, aim, p) : 0));
          if (s > 0) plans.push({ score: s - cost - pos.risk - exposure(cb, c, pos.x, pos.y, p), moveTo: pos, actionId: a.id, target: aim, label: a.name });
        }
      }
      continue;
    }
    if (a.special === 'teleport') continue;
    // Targeted actions
    const pool = a.target === 'enemy' ? cb.enemiesOf(c) : a.target === 'downedAlly' ? downed : a.target === 'ally' ? [...allies, ...downed] : [];
    for (const t of pool) {
      for (const pos of positionsFor(cb, c, positions, t.x, t.y, cb.rangeOf(c, a))) {
        const ok = withPosition(c, pos.x, pos.y, () => cb.isTargetable(c, a, t));
        if (!ok) continue;
        const s = withPosition(c, pos.x, pos.y, () => scoreTargeted(cb, c, a, t, p));
        if (s <= 0) continue;
        plans.push({ score: s - cost - pos.risk - exposure(cb, c, pos.x, pos.y, p) * 0.6, moveTo: pos, actionId: a.id, target: { id: t.id }, label: `${a.name} → ${t.char.name}` });
      }
    }
  }
  // Barrel tactics: shoot a barrel next to several enemies and no allies.
  const atk = ACTION_BY_ID.attack;
  if (c.char.kind !== 'enemy' && cb.canUse(c, atk).ok && isRangedWeapon(mainWeapon(c.char))) {
    for (const o of cb.objectTargets(c, atk).filter((o) => o.kind === 'barrel')) {
      const foes = cb.enemiesOf(c).filter((e) => dist(e, o) <= 1).length;
      const friends = cb.alive(c.side).filter((e) => dist(e, o) <= 1).length;
      if (foes >= 2 && friends === 0) plans.push({ score: foes * 4, actionId: 'attack', target: { id: o.id }, label: 'Shoot the barrel' });
    }
  }
  // Pillars: the Bellwarden's ward must come down.
  if (c.side === 'party' && cb.objects.some((o) => o.kind === 'pillar' && !o.destroyed) && cb.canUse(c, atk).ok) {
    for (const pl of cb.objects.filter((o) => o.kind === 'pillar' && !o.destroyed)) for (const pos of positionsFor(cb, c, positions, pl.x, pl.y, cb.rangeOf(c, atk), 4)) {
      for (const o of withPosition(c, pos.x, pos.y, () => cb.objectTargets(c, atk).filter((o) => o === pl))) {
        plans.push({ score: 6 + p.focus * 2 - pos.risk - exposure(cb, c, pos.x, pos.y, p) * 0.5, moveTo: pos, actionId: 'attack', target: { id: o.id }, label: 'Strike a resonance pillar' });
      }
    }
  }
  for (const pl of plans) pl.score += (random() - 0.5) * noise * 2;
  plans.sort((a, b) => b.score - a.score);
  return plans[0] && plans[0].score > 0.2 ? plans[0] : null;
}

function scoreSelf(cb: Combat, c: Combatant, a: ActionDef, p: Personality): number {
  const ch = c.char;
  const hpFrac = ch.hp / ch.maxHp;
  const enemiesNear = cb.enemiesOf(c).filter((e) => dist(e, c) <= 2).length;
  switch (a.special ?? a.id) {
    case 'second_wind': return hpFrac < 0.5 ? 6 * (1 - hpFrac) : 0;
    case 'action_surge': return cb.enemiesOf(c).some((e) => dist(e, c) <= 6) ? 5 : 0;
    case 'rage': return enemiesNear > 0 || cb.enemiesOf(c).some((e) => dist(e, c) <= c.movement + 1) ? 6 : 0;
    case 'dash': return 0; // handled by approach logic
    case 'spirit_guardians': return c.concentration ? 0 : cb.enemiesOf(c).filter((e) => dist(e, c) <= 3).length * 3 + cb.enemiesOf(c).filter((e) => dist(e, c) <= 6).length;
    case 'quicken': return 0;
    default:
      if (a.id === 'dodge') return hpFrac < 0.3 && enemiesNear >= 2 ? 3 * p.caution : 0;
      if (a.tempHp) return ch.tempHp ? 0 : enemiesNear ? 3 : 1;
      if (a.condition?.id === 'guarded') return enemiesNear >= 2 && hpFrac < 0.5 ? 2 : 0;
      if (a.condition?.id === 'blessed') return 2;
      return 0;
  }
}

function scoreArea(cb: Combat, c: Combatant, a: ActionDef, aim: { x: number; y: number }, p: Personality): number {
  const tiles = cb.areaTiles(c, a, aim);
  const inArea = (t: Combatant) => tiles.some((q) => q.x === t.x && q.y === t.y);
  const foes = cb.enemiesOf(c).filter(inArea).filter((t) => !a.onlyVs || ['undead', 'echo'].includes(creatureType(t.char)));
  const sculpt = c.char.feats && c.char.knownSpells && (c.char.subclassId === 'evoker');
  const friends = sculpt || a.special === 'taunt' || a.id === 'turn_undead' ? [] : cb.alive(c.side).filter((t) => t.id !== c.id && inArea(t));
  if (!foes.length) return 0;
  let s = 0;
  for (const f of foes) {
    const dmg = a.damage ? cb.rollActionDamagePreview(c, a, f) * 0.7 : 0;
    s += dmg * targetPriority(cb, c, f, dmg, p) * 0.35 * (0.5 + p.aggression);
    if (a.condition) s += controlValue(cb, f, a);
  }
  if (a.special === 'taunt') s = foes.length * (p.role === 'tank' ? 2 : 0.5);
  if (foes.length === 1 && (a.level ?? 0) > 0) s *= 0.6; // area spells on a single foe are a waste
  for (const fr of friends) s -= (a.damage ? cb.rollActionDamagePreview(c, a, fr) : 3) * 0.8 + 3;
  return s;
}

function controlValue(cb: Combat, t: Combatant, a: ActionDef): number {
  if (!a.condition) return 0;
  if (t.char.conditionImmunities?.includes(a.condition.id)) return 0;
  if (hasCondition(t.char, a.condition.id)) return 0;
  const th = threat(cb, t);
  const weight: Record<string, number> = { stunned: 1.2, restrained: 0.7, frightened: 0.5, prone: 0.4, slowed: 0.2, incapacitated: 1.0, marked: 0, hexed: 0, poisoned: 0.4 };
  return (weight[a.condition.id] ?? 0.3) * th * 0.25 * Math.min(3, Math.max(1, a.condition.duration));
}

function scoreTargeted(cb: Combat, c: Combatant, a: ActionDef, t: Combatant, p: Personality): number {
  const ch = c.char;
  // Healing and revival
  if (a.target === 'downedAlly' || (a.target === 'ally' && cb.isDowned(t))) {
    if (!a.heal && a.special !== 'help' && a.special !== 'revivify' && a.special !== 'lay_on_hands') return 0;
    return 12 + p.support * 6;
  }
  if (a.target === 'ally') {
    if (a.heal || a.special === 'lay_on_hands') {
      const missing = t.char.maxHp - t.char.hp;
      const frac = t.char.hp / t.char.maxHp;
      if (frac > 0.6) return 0;
      const amount = a.heal ? averageDice(a.heal.dice) + (a.heal.mod ? spellMod(ch) : 0) : 10;
      return Math.min(missing, amount) * 0.5 * (1.4 - frac) * (0.5 + p.support * 1.5);
    }
    if (a.special === 'aid') return cb.round <= 2 && cb.enemiesOf(c).length >= 2 ? 3 + p.support * 2 : 0;
    if (a.removeConditions) return t.char.conditions.some((k) => a.removeConditions!.includes(k.id)) ? 4 * (0.5 + p.support) : 0;
    if (a.condition) {
      if (hasCondition(t.char, a.condition.id)) return 0;
      if (a.condition.id === 'inspired') return t.id !== c.id && cb.enemiesOf(c).length ? 1.5 + p.support : 0;
      if (a.condition.id === 'blessed') return 1.2 + p.support;
      if (a.condition.id === 'shielded') return t.char.hp < t.char.maxHp * 0.7 && cb.enemiesOf(t).some((e) => dist(e, t) <= 2) ? 2 + p.support : 0;
      if (a.condition.id === 'invisible') return t.char.hp < t.char.maxHp * 0.35 ? 3 : 0;
      return 1;
    }
    return 0;
  }
  // Offensive
  if (a.condition && !a.damage && !a.attack && !a.save) {
    // marks & curses — only worth it if we will keep hitting this target
    if (t.char.conditions.some((k) => (k.id === a.condition!.id) && k.sourceId === c.id)) return 0;
    if (c.concentration && a.concentration) return 0;
    return t.char.hp > 10 ? 2.5 * (0.5 + p.focus) : 0.5;
  }
  if (a.special === 'shove') {
    const behind = { x: t.x + Math.sign(t.x - c.x), y: t.y + Math.sign(t.y - c.y) };
    const tc = cb.tileChar(behind.x, behind.y);
    if (tc === 'v') return 9;
    if (tc === 'a' || cb.fires.some((f) => f.x === behind.x && f.y === behind.y)) return 4;
    return 0;
  }
  if (a.special === 'help') return 0;
  let dmg = cb.rollActionDamagePreview(c, a, t);
  let pHit = 1;
  if (a.attack) pHit = cb.hitChance(c, t, a);
  else if (a.save) pHit = 0.55;
  if (a.hits) dmg *= a.hits;
  if (a.special === 'smite') dmg += averageDice('2d8') * 0.9 + (t.char.hp < 20 ? 3 : 0);
  if (a.special === 'reckless') dmg *= 1.15;
  // Extra Attack: an Attack action is worth more than one swing.
  if ((a.id === 'attack' || a.special === 'smite' || a.special === 'reckless') && c.attacksLeft === 0 && ch.kind !== 'enemy') dmg *= Math.min(1.8, 1 + (ch.level >= 5 ? 0.8 : 0));
  if (ch.kind === 'enemy' && a.attack && (ch.multiattack ?? 1) > 1 && c.attacksLeft === 0) dmg *= ch.multiattack ?? 1;
  const expected = dmg * pHit;
  let s = expected * targetPriority(cb, c, t, expected, p) * (0.6 + p.aggression * 0.6) * 0.45;
  if (a.condition) s += controlValue(cb, t, a) * pHit;
  // Do not waste radiant on non-vulnerable foes when weapon would do; vulnerability bonus
  if (a.damage && t.char.vulnerabilities?.includes(a.damage.type)) s *= 1.6;
  if (a.damage && t.char.immunities?.includes(a.damage.type)) s = 0;
  if (a.damage && t.char.resistances?.includes(a.damage.type)) s *= 0.6;
  // Don't attack downed party members (enemies prefer standing threats)
  return s;
}

// ─────────────────────────────── Execution

/** Execute one step of the AI's turn. Returns events, or null when the AI is done. */
export function aiStep(cb: Combat, c: Combatant): CombatEvent[] | null {
  if (cb.over || c.char.hp <= 0) return null;
  if (hasCondition(c.char, 'stunned') || hasCondition(c.char, 'incapacitated')) return null;
  // Boss scripts first
  const script = bossScript(cb, c);
  if (script) return script;
  const plan = bestPlan(cb, c);
  if (plan) {
    const ev: CombatEvent[] = [];
    if (plan.moveTo && (plan.moveTo.x !== c.x || plan.moveTo.y !== c.y)) {
      const path = cb.pathTo(c, plan.moveTo.x, plan.moveTo.y);
      if (path && cb.pathCost(path) <= c.movement) ev.push(...cb.moveAlong(c, path));
      if (c.char.hp <= 0 || cb.over) return ev;
    }
    // The world may have changed while moving (opportunity attacks, phase changes): re-validate.
    const act = ACTION_BY_ID[plan.actionId!];
    if (!act || !cb.canUse(c, act).ok) return ev.length ? ev : null;
    try {
      ev.push(...cb.perform(c, plan.actionId!, plan.target));
    } catch {
      // The world changed (e.g. target moved out of reach after an opportunity attack); end this plan.
      return ev.length ? ev : approachOrEnd(cb, c);
    }
    return ev;
  }
  return approachOrEnd(cb, c);
}

/** No useful action from here: move toward the enemy (or retreat if fragile), then stop. */
function approachOrEnd(cb: Combat, c: Combatant): CombatEvent[] | null {
  if (c.movement <= 0 || (c.side === 'party' && cb.s.orders.stance === 'hold')) return null;
  const p = personality(c);
  const foes = cb.enemiesOf(c);
  if (!foes.length) return null;
  const reach = cb.reachable(c);
  const all = cb.reachableAll(c);
  const ranged = c.char.kind !== 'enemy' ? isRangedWeapon(mainWeapon(c.char)) || p.role === 'controller' || p.role === 'healer' : c.char.aiProfile === 'archer' || c.char.aiProfile === 'caster';
  let best: { x: number; y: number; s: number } | null = null;
  for (const v of reach.values()) {
    const dNear = Math.min(...foes.map((f) => dist(f, v)));
    let s = ranged ? -Math.abs(dNear - 5) : -dNear;
    s -= exposure(cb, c, v.x, v.y, p);
    if (best && s - 3 < best.s) continue;
    const path = cb.pathTo(c, v.x, v.y, all);
    if (!path) continue;
    s -= cb.provokers(c, path).length * 3;
    if (c.side === 'party' && cb.s.orders.protectWeakest && p.role === 'tank') {
      const weakest = cb.alive('party').filter((x) => x.id !== c.id).sort((a, b) => a.char.hp - b.char.hp)[0];
      if (weakest) s -= dist(weakest, v) * 0.5;
    }
    if (!best || s > best.s) best = { x: v.x, y: v.y, s };
  }
  if (!best || (best.x === c.x && best.y === c.y)) {
    // Consider dashing toward far enemies
    const dash = ACTION_BY_ID.dash;
    if (cb.canUse(c, dash).ok && !ranged && Math.min(...foes.map((f) => dist(f, c))) > c.movement + 1) return cb.perform(c, 'dash');
    return null;
  }
  const path = cb.pathTo(c, best.x, best.y);
  if (!path) return null;
  const ev = cb.moveAlong(c, path);
  c.movement = Math.min(c.movement, 0) === 0 && ev.length ? c.movement : c.movement;
  return ev.length ? ev : null;
}

function bossScript(cb: Combat, c: Combatant): CombatEvent[] | null {
  const ch = c.char;
  if (ch.templateId === 'bellwarden' && c.action) {
    const res = ch.combatResources ?? {};
    const near = cb.enemiesOf(c).filter((e) => dist(e, c) <= 5).length;
    if (res.summon && cb.alive('enemy').length <= 2 && (cb.round >= 2 || cb.phase === 2) && cb.canUse(c, ACTION_BY_ID.m_summon_echo).ok) return cb.perform(c, 'm_summon_echo');
    if (res.toll && near >= 2 && cb.canUse(c, ACTION_BY_ID.m_toll).ok) return cb.perform(c, 'm_toll', { x: c.x, y: c.y });
  }
  if (ch.templateId === 'echo_sentinel' && c.action && ch.combatResources?.beam) {
    let bestAim: { x: number; y: number } | null = null, bestN = 1;
    const a = ACTION_BY_ID.m_sentinel_beam;
    for (const e of cb.enemiesOf(c)) {
      const tiles = cb.areaTiles(c, a, e);
      const n = cb.enemiesOf(c).filter((t) => tiles.some((q) => q.x === t.x && q.y === t.y)).length;
      if (n > bestN) { bestN = n; bestAim = { x: e.x, y: e.y }; }
    }
    if (bestAim && cb.canUse(c, a).ok) return cb.perform(c, 'm_sentinel_beam', bestAim);
  }
  return null;
}

/** Run a whole CPU turn (used by tests and fast-forward). */
export function runAiTurn(cb: Combat, c: Combatant, maxSteps = 12): CombatEvent[] {
  const all: CombatEvent[] = [];
  for (let i = 0; i < maxSteps; i++) {
    const ev = aiStep(cb, c);
    if (!ev) break;
    all.push(...ev);
    if (cb.over) break;
  }
  return all;
}

void expectedDamage;
void cantripDiceMultiplier;
