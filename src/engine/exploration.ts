/**
 * Exploration: map state, movement, fog of war, hidden things, traps, locks and triggers.
 */
import { MAP_BY_ID } from '../data/maps/prologue';
import type { Lighting, MapDef, MapObject } from '../data/maps/types';
import { tile } from '../data/maps/tiles';
import type { Character, GameState, Skill } from './types';
import { evalCond } from './conditions';
import { activeParty, addItem, addLog, advanceTime, hasItem, mapRuntime, recordRoll, timeOfDay } from './state';
import { skillCheck, savingThrow, type CheckResult } from '../rules/checks';
import { skillBonus, passivePerception } from './character';
import { rollDice } from '../core/dice';
import { applyDamage } from './damage';
import { ITEM_BY_ID } from '../data/items';
import { ANCESTRY_BY_ID } from '../data/ancestries';
import { chance, pick } from '../core/rng';
import { SKILL_NAMES } from '../rules/abilities';

export function getMap(id: string): MapDef {
  const m = MAP_BY_ID[id];
  if (!m) throw new Error(`Unknown map ${id}`);
  return m;
}

function safe(s: GameState, c?: string): boolean {
  try { return evalCond(s, c); } catch { return false; }
}

export function resolveList<T>(s: GameState, list: { if?: string; value: T }[], fallback: T): T {
  for (const e of list) if (safe(s, e.if)) return e.value;
  return fallback;
}

export function lighting(s: GameState, m: MapDef): Lighting { return resolveList(s, m.lighting, 'day'); }
export function baseInstability(s: GameState, m: MapDef): number { return resolveList(s, m.instability, 0); }
export function music(s: GameState, m: MapDef): string { return resolveList(s, m.music, 'festival'); }

export function instability(s: GameState, mapId: string): number {
  const rt = mapRuntime(s, mapId);
  return Math.min(10, Math.max(rt.instability, baseInstability(s, getMap(mapId))));
}

// ─────────────────────────────── Objects & tiles

export function objectCovers(o: MapObject, x: number, y: number): boolean {
  return x >= o.x && x < o.x + (o.w ?? 1) && y >= o.y && y < o.y + (o.h ?? 1);
}

export function isObjectPresent(s: GameState, m: MapDef, o: MapObject): boolean {
  const rt = mapRuntime(s, m.id);
  if (rt.removed.includes(o.id)) return false;
  if (!safe(s, o.if)) return false;
  return true;
}

/** Visible to the player: present and (if hidden) discovered. */
export function isObjectKnown(s: GameState, m: MapDef, o: MapObject): boolean {
  if (!isObjectPresent(s, m, o)) return false;
  if (o.hidden && !mapRuntime(s, m.id).revealed.includes(o.id)) return false;
  return true;
}

export function objectsAt(s: GameState, m: MapDef, x: number, y: number): MapObject[] {
  return m.objects.filter((o) => objectCovers(o, x, y) && isObjectPresent(s, m, o));
}

export function tileAt(s: GameState, m: MapDef, x: number, y: number): string {
  if (y < 0 || y >= m.grid.length || x < 0 || x >= m.grid[0].length) return '#';
  const rt = mapRuntime(s, m.id);
  for (const o of m.objects) {
    if (o.kind === 'secretDoor' && o.x === x && o.y === y && rt.revealed.includes(o.id)) return 'D';
  }
  // Barrels destroyed in combat are recorded as removed objects keyed by position.
  if (rt.removed.includes(`tile_${x}_${y}`)) return m.tileset === 'town' ? ',' : '.';
  return m.grid[y][x];
}

export function isBlockingObject(s: GameState, m: MapDef, o: MapObject): boolean {
  const rt = mapRuntime(s, m.id);
  if (o.kind === 'lockedDoor') return !rt.opened.includes(o.id);
  if (o.kind === 'secretDoor') return !rt.revealed.includes(o.id);
  if (o.kind === 'container' && o.hidden && !rt.revealed.includes(o.id)) return false;
  return !!o.blocks;
}

export function isPassable(s: GameState, m: MapDef, x: number, y: number): boolean {
  if (!tile(tileAt(s, m, x, y)).walk) {
    // a revealed secret door is passable even though the grid says wall
    return false;
  }
  return !objectsAt(s, m, x, y).some((o) => isBlockingObject(s, m, o));
}

export function blocksSight(s: GameState, m: MapDef, x: number, y: number): boolean {
  return tile(tileAt(s, m, x, y)).los;
}

// ─────────────────────────────── Fog of war

export function sightRadius(s: GameState, m: MapDef): number {
  const l = lighting(s, m);
  const base = { day: 14, dusk: 10, night: 7, fog: 5, dark: 6 }[l];
  const dv = activeParty(s).some((c) => ANCESTRY_BY_ID[c.ancestry]?.darkvision) ? 2 : 0;
  return l === 'day' ? base : base + dv;
}

export function lineOfSight(s: GameState, m: MapDef, x0: number, y0: number, x1: number, y1: number): boolean {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  while (!(x === x1 && y === y1)) {
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
    if (x === x1 && y === y1) break;
    if (blocksSight(s, m, x, y)) return false;
  }
  return true;
}

export function visibleTiles(s: GameState, m: MapDef, cx: number, cy: number): Set<number> {
  const r = sightRadius(s, m);
  const W = m.grid[0].length, H = m.grid.length;
  const out = new Set<number>();
  for (let y = Math.max(0, cy - r); y <= Math.min(H - 1, cy + r); y++) {
    for (let x = Math.max(0, cx - r); x <= Math.min(W - 1, cx + r); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > r * r + r) continue;
      if (lineOfSight(s, m, cx, cy, x, y)) out.add(y * W + x);
    }
  }
  return out;
}

export function decodeExplored(str: string, size: number): Uint8Array {
  const bits = new Uint8Array(size);
  for (let i = 0; i < str.length; i++) {
    const v = parseInt(str[i], 16);
    for (let b = 0; b < 4; b++) { const idx = i * 4 + b; if (idx < size) bits[idx] = (v >> b) & 1; }
  }
  return bits;
}

export function encodeExplored(bits: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bits.length; i += 4) {
    let v = 0;
    for (let b = 0; b < 4; b++) if (bits[i + b]) v |= 1 << b;
    out += v.toString(16);
  }
  return out;
}

export function updateExplored(s: GameState, m: MapDef, visible: Set<number>): void {
  const rt = mapRuntime(s, m.id);
  const size = m.grid.length * m.grid[0].length;
  const bits = decodeExplored(rt.explored, size);
  let changed = false;
  for (const i of visible) if (!bits[i]) { bits[i] = 1; changed = true; }
  if (changed || !rt.explored) rt.explored = encodeExplored(bits);
}

// ─────────────────────────────── Pathfinding

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Shortest walkable path (8-directional, no squeezing between diagonal walls). Excludes start. */
export function findPath(s: GameState, m: MapDef, sx: number, sy: number, tx: number, ty: number, allowTargetBlocked = false, avoid?: Set<number>): { x: number; y: number }[] | null {
  const W = m.grid[0].length, H = m.grid.length;
  const key = (x: number, y: number) => y * W + x;
  const prev = new Map<number, number>();
  const start = key(sx, sy), target = key(tx, ty);
  const q = [start];
  prev.set(start, -1);
  while (q.length) {
    const cur = q.shift()!;
    if (cur === target) break;
    const cx = cur % W, cy = Math.floor(cur / W);
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const k = key(nx, ny);
      if (prev.has(k)) continue;
      const isTarget = k === target;
      if (!(isPassable(s, m, nx, ny) || (isTarget && allowTargetBlocked))) continue;
      if (avoid?.has(k) && !isTarget) continue;
      if (dx && dy && (!isPassable(s, m, cx + dx, cy) || !isPassable(s, m, cx, cy + dy))) continue;
      prev.set(k, cur);
      q.push(k);
    }
  }
  if (!prev.has(target)) return null;
  const path: { x: number; y: number }[] = [];
  let cur = target;
  while (cur !== start) { path.unshift({ x: cur % W, y: Math.floor(cur / W) }); cur = prev.get(cur)!; }
  return path;
}

/** Tiles of revealed, un-disarmed traps — click-to-move routes around them. */
export function knownTrapTiles(s: GameState, m: MapDef): Set<number> {
  const rt = mapRuntime(s, m.id);
  const W = m.grid[0].length;
  return new Set(m.objects.filter((o) => o.kind === 'trap' && rt.revealed.includes(o.id) && !rt.disarmed.includes(o.id)).map((o) => o.y * W + o.x));
}

// ─────────────────────────────── Stepping

export type StepEvent =
  | { type: 'exit'; obj: MapObject }
  | { type: 'trap'; obj: MapObject; save: CheckResult; damage: number; victim: string }
  | { type: 'trigger'; obj: MapObject; blocked: boolean }
  | { type: 'encounter'; encounterId: string; obj?: MapObject }
  | { type: 'notice'; text: string; speaker: string }
  | { type: 'fragment'; text: string };

/** Per-session record of which radius triggers the party currently stands inside (not saved). */
const insideTriggers = new Set<string>();
export function resetTriggerMemory(): void { insideTriggers.clear(); }

function inRadius(o: MapObject, x: number, y: number): boolean {
  if (o.radius !== undefined) return Math.max(Math.abs(o.x - x), Math.abs(o.y - y)) <= o.radius;
  return objectCovers(o, x, y);
}

const FRAGMENTS = [
  'For a heartbeat the wall beside you is whole and freshly painted, hung with a tapestry of a city you do not know. Then it is ruin again.',
  'You smell bread baking. There is no oven within a mile.',
  'Your shadow lags a moment behind you, as if remembering a different way you might have walked.',
  'Someone says your name in a voice you almost recognise. Nobody is there.',
  'Dust drifts upward, briefly, then remembers which way is down.',
  'For an instant you remember a scar you do not have. Then the memory is gone, and so is the scar.',
  'A child\'s laughter rings out, very close — and then very far away.',
  'The stones underfoot are warm, as though a hearth burned here moments ago in some other year.',
];

export function stepTo(s: GameState, x: number, y: number): StepEvent[] {
  const m = getMap(s.location.mapId);
  const events: StepEvent[] = [];
  // Triggers that block movement are evaluated before moving.
  for (const o of m.objects) {
    if (o.kind !== 'trigger' || !o.blocks || !isObjectPresent(s, m, o) || !inRadius(o, x, y)) continue;
    events.push({ type: 'trigger', obj: o, blocked: true });
    return events;
  }
  s.location.x = x;
  s.location.y = y;
  const rt = mapRuntime(s, m.id);
  rt.steps++;
  if (rt.steps % 4 === 0) advanceTime(s, 1);
  for (const o of objectsAt(s, m, x, y)) {
    if (o.kind === 'exit' && o.to) { events.push({ type: 'exit', obj: o }); return events; }
    if (o.kind === 'trap' && o.trap && !rt.disarmed.includes(o.id)) {
      events.push(triggerTrap(s, m, o));
    }
  }
  for (const o of m.objects) {
    if ((o.kind !== 'trigger' && o.kind !== 'encounter') || o.blocks) continue;
    const key = `${m.id}:${o.id}`;
    const present = isObjectPresent(s, m, o);
    const inside = present && inRadius(o, x, y);
    if (!inside) { insideTriggers.delete(key); continue; }
    if (insideTriggers.has(key)) continue;
    insideTriggers.add(key);
    if (o.kind === 'encounter' && o.encounter) events.push({ type: 'encounter', encounterId: o.encounter, obj: o });
    else events.push({ type: 'trigger', obj: o, blocked: false });
  }
  events.push(...passiveNotices(s, m));
  // Reality instability: occasional fragments of other timelines.
  const inst = instability(s, m.id);
  if (inst >= 3 && chance(0.004 * inst)) events.push({ type: 'fragment', text: pick(FRAGMENTS) });
  // Random encounters
  const re = m.randomEncounters;
  if (re && safe(s, re.if) && !events.some((e) => e.type === 'encounter' || e.type === 'trigger')) {
    const key = `_rand_${m.id}`;
    const count = Number(s.flags[key] ?? 0);
    const mult = s.orders.stealth ? 0.5 : 1;
    if (count < re.max && chance(re.chance * mult)) {
      s.flags[key] = count + 1;
      events.push({ type: 'encounter', encounterId: pick(re.encounters) });
    }
  }
  return events;
}

function triggerTrap(s: GameState, m: MapDef, o: MapObject): StepEvent {
  const rt = mapRuntime(s, m.id);
  const victim = activeParty(s)[0];
  const t = o.trap!;
  const save = savingThrow(victim, t.save, t.saveDc);
  recordRoll(s, save);
  let dmg = rollDice(t.damage).total;
  if (save.success) dmg = Math.floor(dmg / 2);
  const res = applyDamage(victim, dmg, t.type);
  if (victim.hp <= 0) victim.hp = 1;
  rt.disarmed.push(o.id); // a sprung trap is spent
  if (!rt.revealed.includes(o.id)) rt.revealed.push(o.id);
  addLog(s, 'dm', `${t.desc} ${victim.name} ${save.success ? 'twists aside and' : ''} takes ${res.dealt} ${t.type} damage.`);
  return { type: 'trap', obj: o, save, damage: res.dealt, victim: victim.name };
}

/** Passive Perception (and other passive skills) reveal hidden things and prompt companion remarks. */
export function passiveNotices(s: GameState, m: MapDef): StepEvent[] {
  const out: StepEvent[] = [];
  const rt = mapRuntime(s, m.id);
  const { x, y } = s.location;
  const party = activeParty(s).filter((c) => c.hp > 0);
  for (const o of m.objects) {
    if (!isObjectPresent(s, m, o)) continue;
    const dist = Math.max(Math.abs(o.x - x), Math.abs(o.y - y));
    if (dist > 4 || !lineOfSight(s, m, x, y, o.x, o.y) && dist > 1) continue;
    if (o.hidden && !rt.revealed.includes(o.id)) {
      const skill = o.hidden.skill ?? 'perception';
      const best = bestPassive(party, skill);
      if (best && best.value >= o.hidden.dc) {
        rt.revealed.push(o.id);
        out.push({ type: 'notice', speaker: best.char.name, text: noticeLine(best.char, o) });
      }
    }
    if (o.hint && !rt.revealed.includes(`hint:${o.id}`)) {
      const best = bestPassive(party, o.hint.skill);
      if (best && best.value >= o.hint.dc) {
        rt.revealed.push(`hint:${o.id}`);
        out.push({ type: 'notice', speaker: best.char.name, text: o.hint.text });
      }
    }
  }
  return out;
}

function bestPassive(party: Character[], skill: Skill): { char: Character; value: number } | null {
  let best: { char: Character; value: number } | null = null;
  for (const c of party) {
    const v = skill === 'perception' ? passivePerception(c) : 10 + skillBonus(c, skill);
    if (!best || v > best.value) best = { char: c, value: v };
  }
  return best;
}

function noticeLine(c: Character, o: MapObject): string {
  if (o.kind === 'trap') return `Stop — don't step there. ${o.name}. I can see it from here.`;
  if (o.kind === 'secretDoor') return 'There\'s a draught coming through that wall. There\'s a door here — a hidden one.';
  void c;
  return `Wait. There's something here — ${o.name.toLowerCase()}.`;
}

// ─────────────────────────────── Active interaction

export interface SearchResult { roll: CheckResult; found: MapObject[]; }

/** Active search with the chosen character: reveals hidden objects within 4 squares. Takes 10 minutes. */
export function search(s: GameState, searcher: Character): SearchResult {
  const m = getMap(s.location.mapId);
  const rt = mapRuntime(s, m.id);
  advanceTime(s, 10);
  const nearby = m.objects.filter((o) => o.hidden && !rt.revealed.includes(o.id) && isObjectPresent(s, m, o)
    && Math.max(Math.abs(o.x - s.location.x), Math.abs(o.y - s.location.y)) <= 4);
  const skill: Skill = nearby.some((o) => o.hidden?.skill === 'investigation') ? 'investigation' : 'perception';
  const roll = skillCheck(searcher, skill);
  recordRoll(s, roll);
  const found: MapObject[] = [];
  for (const o of nearby) {
    const sk = o.hidden!.skill ?? 'perception';
    const total = sk === skill ? roll.total : roll.total - 2;
    if (total >= o.hidden!.dc) { rt.revealed.push(o.id); found.push(o); }
  }
  addLog(s, 'system', `${searcher.name} searches the area (${SKILL_NAMES[skill]} ${roll.total})${found.length ? ` and finds: ${found.map((f) => f.name).join(', ')}.` : ' but finds nothing new.'}`);
  return { roll, found };
}

export function lootContainer(s: GameState, mapId: string, o: MapObject): string[] {
  const rt = mapRuntime(s, mapId);
  if (rt.removed.includes(o.id)) return [];
  const got: string[] = [];
  for (const [id, qty] of o.loot?.items ?? []) { addItem(s, id, qty); got.push(`${ITEM_BY_ID[id]?.name ?? id}${qty > 1 ? ` ×${qty}` : ''}`); }
  if (o.loot?.gold) { s.gold += o.loot.gold; got.push(`${o.loot.gold} gold`); }
  rt.removed.push(o.id);
  addLog(s, 'system', got.length ? `Looted ${o.name}: ${got.join(', ')}.` : `${o.name} is empty.`);
  return got;
}

export type LockMethod = 'key' | 'pick' | 'force';

export interface LockResult { success: boolean; roll?: CheckResult; text: string; }

export function attemptLock(s: GameState, mapId: string, o: MapObject, method: LockMethod, who: Character): LockResult {
  const rt = mapRuntime(s, mapId);
  const lock = o.lock!;
  if (method === 'key') {
    if (lock.key && hasItem(s, lock.key)) {
      rt.opened.push(o.id);
      return { success: true, text: `The ${ITEM_BY_ID[lock.key]?.name ?? 'key'} turns with a gritty click.` };
    }
    return { success: false, text: 'You have no key for this lock.' };
  }
  if (method === 'pick') {
    const tools = hasItem(s, 'thieves_tools');
    const roll = skillCheck(who, 'sleightOfHand', lock.dc, { dis: tools ? 0 : 1 });
    recordRoll(s, roll);
    advanceTime(s, 5);
    if (roll.success) { rt.opened.push(o.id); return { success: true, roll, text: `${who.name} coaxes the lock open.` }; }
    const breakTool = roll.total <= lock.dc - 5 && tools;
    return { success: false, roll, text: breakTool ? `A pick snaps inside the lock. ${who.name} swears softly — the lock is jammed for now; try forcing it.` : `${who.name} can't get the tumblers to catch.` };
  }
  const extra = hasItem(s, 'crowbar') ? [{ label: 'Crowbar', value: 2 }] : [];
  const roll = skillCheck(who, 'athletics', lock.forceDc ?? lock.dc + 2, { extra });
  recordRoll(s, roll);
  if (roll.success) { rt.opened.push(o.id); return { success: true, roll, text: `${who.name} throws a shoulder into it — wood splinters and the door bursts open. Loudly.` }; }
  return { success: false, roll, text: `${who.name} bounces off. The door holds, and the noise echoes.` };
}

export function disarmTrap(s: GameState, mapId: string, o: MapObject, who: Character): LockResult {
  const rt = mapRuntime(s, mapId);
  const tools = hasItem(s, 'thieves_tools');
  const roll = skillCheck(who, 'sleightOfHand', o.trap!.disarmDc, { dis: tools ? 0 : 1 });
  recordRoll(s, roll);
  if (roll.success) { rt.disarmed.push(o.id); return { success: true, roll, text: `${who.name} disarms the ${o.name.toLowerCase()}.` }; }
  if (roll.total <= o.trap!.disarmDc - 5) {
    const ev = triggerTrap(s, getMap(mapId), o) as Extract<StepEvent, { type: 'trap' }>;
    return { success: false, roll, text: `${who.name} fumbles — the trap goes off! (${ev.damage} damage)` };
  }
  return { success: false, roll, text: `${who.name} isn't sure how it works. Better not touch it yet — or go around.` };
}

export function describeTime(s: GameState): string {
  return { dawn: 'Dawn', day: 'Day', dusk: 'Evening', night: 'Night' }[timeOfDay(s)];
}
