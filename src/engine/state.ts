import type { Character, CompanionState, Difficulty, GameState, LogEntry, MapRuntime, PartyOrders } from './types';
import type { CheckResult } from '../rules/checks';
import { describeRoll } from '../rules/checks';
import { ITEM_BY_ID } from '../data/items';
import { COMPANION_BY_ID } from '../data/companions';
import { ACTION_BY_ID } from '../data/actions';
import { canLevelUp, createCharacter, equippedItems } from './character';
import { uid } from '../core/util';

export const SAVE_VERSION = 2;
export const START_MINUTE = 18 * 60; // 6 pm, first evening of the festival's last night

export interface NewGameOptions {
  player: Character;
  companionIds: string[];
  difficulty: Difficulty;
  rules: { permadeath: boolean; limitedRest: boolean };
}

export function buildCompanionCharacter(id: string, level = 1): Character {
  const def = COMPANION_BY_ID[id];
  if (!def) throw new Error(`Unknown companion ${id}`);
  return createCharacter({
    id: `comp_${id}`, name: def.name, kind: 'companion', companionId: id,
    ancestry: def.ancestry, classId: def.classId, background: def.background,
    baseAbilities: def.abilities, skills: def.skills, expertise: def.expertise,
    cantrips: def.cantrips, spells: (def.spells ?? []).filter((sp) => (ACTION_BY_ID[sp]?.level ?? 0) <= 1),
    fightingStyle: def.fightingStyle, level, subclassId: level >= 3 ? def.subclassId : undefined,
    portrait: { hue: def.hue, sigil: '', initials: def.name.split(' ').map((p) => p[0]).join(''), style: 2 },
    personality: def.personality,
  });
}


export function newCompanionState(id: string, inParty: boolean): CompanionState {
  const def = COMPANION_BY_ID[id];
  return {
    id, recruited: inParty, inParty, left: false,
    rel: { trust: 5, respect: 5, affection: 0, agreement: 0, fear: 0 },
    bonds: { ...(def?.bonds ?? {}) },
    memories: [], mood: 2, stress: 0, talksDone: [], lastSpoke: -9999, romance: 'none',
  };
}

export function defaultOrders(): PartyOrders {
  return { stance: 'initiative', avoidCombat: false, protectWeakest: false, conserve: false, stealth: false, reactions: { shield: 'auto', opportunity: 'always', defensive: 'auto' } };
}

export function newGame(o: NewGameOptions): GameState {
  const party: Character[] = [o.player];
  const companions: Record<string, CompanionState> = {};
  for (const id of Object.keys(COMPANION_BY_ID)) companions[id] = newCompanionState(id, o.companionIds.includes(id));
  for (const id of o.companionIds) {
    party.push(buildCompanionCharacter(id, 1));
  }
  const s: GameState = {
    version: SAVE_VERSION,
    saveId: uid('save'),
    createdAt: Date.now(),
    playtimeSec: 0,
    chapter: 'prologue',
    difficulty: o.difficulty,
    rules: o.rules,
    party,
    activeIds: party.map((p) => p.id),
    companions,
    inventory: [{ itemId: 'healing_potion', qty: 2 }, { itemId: 'rope', qty: 1 }],
    gold: 25,
    location: { mapId: 'hollowmere', x: 25, y: 31 },
    maps: {},
    discoveredHubs: ['hollowmere'],
    flags: {},
    quests: {},
    factions: { conclave: 0, covenant: 0, verdant: 0, dawn: 0, unbound: 0, hollowmere: 0 },
    time: { day: 1, minute: START_MINUTE },
    resonance: { current: 0, max: 0, unlocked: false },
    orders: defaultOrders(),
    shortRestsSinceLong: 0,
    log: [],
    rolls: [],
  };
  return s;
}

// ─────────────────────────────── Party access

export function getChar(s: GameState, id: string): Character | undefined {
  return s.party.find((c) => c.id === id);
}

export function player(s: GameState): Character {
  return s.party[0];
}

export function activeParty(s: GameState): Character[] {
  return s.activeIds.map((id) => getChar(s, id)).filter((c): c is Character => !!c && !c.dead);
}

export function activeCompanionIds(s: GameState): string[] {
  return activeParty(s).filter((c) => c.kind === 'companion' && c.companionId).map((c) => c.companionId!);
}

export function companionChar(s: GameState, compId: string): Character | undefined {
  return s.party.find((c) => c.companionId === compId);
}

// ─────────────────────────────── Map runtime

export function mapRuntime(s: GameState, mapId: string): MapRuntime {
  if (!s.maps[mapId]) {
    s.maps[mapId] = { explored: '', removed: [], opened: [], revealed: [], disarmed: [], triggered: [], instability: 0, steps: 0 };
  }
  return s.maps[mapId];
}

// ─────────────────────────────── Log & rolls

const LOG_LIMIT = 400;
const ROLL_LIMIT = 200;

export function addLog(s: GameState, kind: LogEntry['kind'], text: string, speaker?: string): void {
  s.log.push({ t: Date.now(), kind, text, speaker });
  if (s.log.length > LOG_LIMIT) s.log.splice(0, s.log.length - LOG_LIMIT);
}

export function recordRoll(s: GameState, r: CheckResult): void {
  s.rolls.push({ t: Date.now(), label: r.label, who: r.who, detail: describeRoll(r), total: r.total, dc: r.dc, success: r.success, natural: r.natural });
  if (s.rolls.length > ROLL_LIMIT) s.rolls.splice(0, s.rolls.length - ROLL_LIMIT);
}

// ─────────────────────────────── Inventory

export function countItem(s: GameState, itemId: string): number {
  let n = s.inventory.filter((i) => i.itemId === itemId).reduce((a, i) => a + i.qty, 0);
  for (const c of s.party) for (const id of Object.values(c.equipment)) if (id === itemId) n++;
  return n;
}

export function hasItem(s: GameState, itemId: string): boolean {
  return countItem(s, itemId) > 0;
}

export function addItem(s: GameState, itemId: string, qty = 1): void {
  if (!ITEM_BY_ID[itemId]) throw new Error(`Unknown item ${itemId}`);
  const def = ITEM_BY_ID[itemId];
  const stack = s.inventory.find((i) => i.itemId === itemId);
  if (stack && (def.stackable || def.type === 'potion' || def.type === 'scroll' || def.type === 'material' || def.type === 'component')) stack.qty += qty;
  else if (stack) stack.qty += qty;
  else s.inventory.push({ itemId, qty });
}

/** Remove from the shared pack first, then from equipped gear. Returns how many were removed. */
export function removeItem(s: GameState, itemId: string, qty = 1): number {
  let left = qty;
  for (const stack of s.inventory) {
    if (stack.itemId !== itemId || left <= 0) continue;
    const take = Math.min(stack.qty, left);
    stack.qty -= take;
    left -= take;
  }
  s.inventory = s.inventory.filter((i) => i.qty > 0);
  for (const c of s.party) {
    for (const [slot, id] of Object.entries(c.equipment)) {
      if (left > 0 && id === itemId) { delete (c.equipment as any)[slot]; left--; }
    }
  }
  return qty - left;
}

export function carriedWeight(s: GameState): number {
  let w = s.inventory.reduce((a, i) => a + (ITEM_BY_ID[i.itemId]?.weight ?? 0) * i.qty, 0);
  for (const c of activeParty(s)) w += equippedItems(c).reduce((a, i) => a + i.weight, 0);
  return Math.round(w * 10) / 10;
}

export function carryCapacity(s: GameState): number {
  return activeParty(s).reduce((a, c) => a + c.abilities.str * 10, 0);
}

// ─────────────────────────────── Progress

/** Award XP to every active (living) party member. Returns names that can level up. */
export function awardXp(s: GameState, amount: number): string[] {
  const ready: string[] = [];
  for (const c of s.party) {
    if (c.dead) continue;
    // Reserve companions also gain (reduced) XP so swapping is never punishing.
    const share = s.activeIds.includes(c.id) ? amount : Math.floor(amount / 2);
    const could = canLevelUp(c);
    c.xp += share;
    if (!could && canLevelUp(c)) ready.push(c.name);
  }
  return ready;
}

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export function timeOfDay(s: GameState): TimeOfDay {
  const h = Math.floor(s.time.minute / 60);
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 18) return 'day';
  if (h >= 18 && h < 21) return 'dusk';
  return 'night';
}

export function advanceTime(s: GameState, minutes: number): void {
  s.time.minute += minutes;
  while (s.time.minute >= 1440) { s.time.minute -= 1440; s.time.day += 1; }
}

export function clockString(s: GameState): string {
  const h = Math.floor(s.time.minute / 60), m = s.time.minute % 60;
  return `Day ${s.time.day}, ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function resonanceMax(s: GameState): number {
  let max = s.resonance.max;
  if (player(s) && Object.values(player(s).equipment).includes('ring_of_echoes')) max += 1;
  return max;
}
