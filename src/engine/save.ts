/**
 * Versioned, validated save games in localStorage.
 *
 * Each slot stores { version, meta, state, checksum }. Writes go to a temp key first, the previous
 * save is kept as a backup, and loading verifies the checksum and schema, falling back to the backup.
 */
import type { GameState } from './types';
import { SAVE_VERSION } from './state';
import { getMap } from './exploration';
import { QUEST_BY_ID } from '../data/quests';

export interface SaveMeta {
  slot: string;
  name: string;
  playerName: string;
  level: number;
  classId: string;
  location: string;
  chapter: string;
  savedAt: number;
  playtimeSec: number;
  auto: boolean;
}

export interface SaveFile { version: number; meta: SaveMeta; state: GameState; checksum: string; }

export interface Storage { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void; }

const PREFIX = 'coe.save.';
export const SLOTS = ['auto', 'quick', 'slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6'];

function store(): Storage | null {
  try { return (globalThis as any).localStorage ?? null; } catch { return null; }
}

/** FNV-1a hash — detects truncated or hand-corrupted saves (not tamper-proofing). */
export function checksum(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}

export function serialize(s: GameState, meta: SaveMeta): string {
  const stateJson = JSON.stringify(s);
  return JSON.stringify({ version: SAVE_VERSION, meta, state: JSON.parse(stateJson), checksum: checksum(stateJson) });
}

/** Migrations from older save versions, applied in order. */
const MIGRATIONS: Record<number, (s: any) => any> = {
  // 0 → 1: example scaffold (pre-release saves lacked `orders`).
  0: (s) => ({ ...s, orders: s.orders ?? { stance: 'initiative', avoidCombat: false, protectWeakest: false, conserve: false, stealth: false }, version: 1 }),
  // 1 → 2 (Phase 3): reaction preferences for the player character.
  1: (s) => ({ ...s, orders: { ...s.orders, reactions: s.orders?.reactions ?? { shield: 'auto', opportunity: 'always', defensive: 'auto' } }, version: 2 }),
};

export function migrate(raw: any): GameState {
  let s = raw;
  let v = typeof s.version === 'number' ? s.version : 0;
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new Error(`No migration from save version ${v}`);
    s = m(s);
    v = s.version;
  }
  if (v > SAVE_VERSION) throw new Error(`Save is from a newer version of the game (${v}).`);
  return s as GameState;
}

/** Structural validation; returns a list of problems (empty = valid). */
export function validateState(s: any): string[] {
  const errs: string[] = [];
  if (!s || typeof s !== 'object') return ['not an object'];
  if (!Array.isArray(s.party) || !s.party.length) errs.push('party missing');
  else {
    for (const c of s.party) {
      if (typeof c.id !== 'string' || typeof c.hp !== 'number' || typeof c.maxHp !== 'number') errs.push(`bad character ${c?.id}`);
      if (c.hp > c.maxHp + 50) errs.push(`hp out of range for ${c.id}`);
    }
  }
  if (!Array.isArray(s.activeIds) || !s.activeIds.length) errs.push('activeIds missing');
  else if (s.party && s.activeIds[0] !== s.party[0]?.id) errs.push('player must lead the party');
  if (!s.location || typeof s.location.mapId !== 'string') errs.push('location missing');
  else { try { getMap(s.location.mapId); } catch { errs.push(`unknown map ${s.location.mapId}`); } }
  if (typeof s.flags !== 'object') errs.push('flags missing');
  if (typeof s.quests !== 'object') errs.push('quests missing');
  else for (const [id, q] of Object.entries<any>(s.quests)) {
    if (!QUEST_BY_ID[id]) errs.push(`unknown quest ${id}`);
    else if (!QUEST_BY_ID[id].stages[q.stage]) errs.push(`unknown stage ${q.stage} for ${id}`);
  }
  if (!Array.isArray(s.inventory)) errs.push('inventory missing');
  if (typeof s.gold !== 'number' || s.gold < 0) errs.push('gold invalid');
  return errs;
}

export function deserialize(text: string): GameState {
  const file = JSON.parse(text) as SaveFile;
  if (!file || typeof file !== 'object' || !file.state) throw new Error('Not a save file');
  const stateJson = JSON.stringify(file.state);
  if (file.checksum && checksum(stateJson) !== file.checksum) throw new Error('Save data is corrupted (checksum mismatch)');
  const state = migrate(file.state);
  const errs = validateState(state);
  if (errs.length) throw new Error(`Invalid save: ${errs.join('; ')}`);
  return state;
}

export function makeMeta(s: GameState, slot: string, auto: boolean): SaveMeta {
  let location = s.location.mapId;
  try { location = getMap(s.location.mapId).name; } catch { /* keep id */ }
  return {
    slot, name: slot === 'auto' ? 'Autosave' : slot === 'quick' ? 'Quicksave' : `Save ${slot.replace('slot', '')}`,
    playerName: s.party[0].name, level: s.party[0].level, classId: s.party[0].classId, location,
    chapter: ({ prologue: 'Prologue', act1: 'Act I', act2: 'Act II' } as Record<string, string>)[s.chapter] ?? s.chapter, savedAt: Date.now(), playtimeSec: Math.round(s.playtimeSec), auto,
  };
}

export function saveGame(s: GameState, slot: string, auto = false, st: Storage | null = store()): void {
  if (!st) throw new Error('Local storage is unavailable');
  const text = serialize(s, makeMeta(s, slot, auto));
  // Verify our own output before committing.
  deserialize(text);
  const key = PREFIX + slot;
  st.setItem(key + '.tmp', text);
  const prev = st.getItem(key);
  if (prev) st.setItem(key + '.bak', prev);
  st.setItem(key, text);
  st.removeItem(key + '.tmp');
}

export function loadGame(slot: string, st: Storage | null = store()): { state: GameState; recovered: boolean } {
  if (!st) throw new Error('Local storage is unavailable');
  const key = PREFIX + slot;
  const main = st.getItem(key);
  if (main) {
    try { return { state: deserialize(main), recovered: false }; } catch (e) { console.warn('Primary save invalid, trying backup', e); }
  }
  const bak = st.getItem(key + '.bak');
  if (bak) return { state: deserialize(bak), recovered: true };
  throw new Error(main ? 'Save is corrupted and no backup is available.' : 'Empty slot.');
}

export function listSaves(st: Storage | null = store()): (SaveMeta & { corrupt?: boolean })[] {
  if (!st) return [];
  const out: (SaveMeta & { corrupt?: boolean })[] = [];
  for (const slot of SLOTS) {
    const t = st.getItem(PREFIX + slot);
    if (!t) continue;
    try { out.push(JSON.parse(t).meta); } catch { out.push({ slot, name: slot, playerName: '?', level: 0, classId: '', location: '?', chapter: '?', savedAt: 0, playtimeSec: 0, auto: false, corrupt: true }); }
  }
  return out;
}

export function deleteSave(slot: string, st: Storage | null = store()): void {
  st?.removeItem(PREFIX + slot); st?.removeItem(PREFIX + slot + '.bak');
}

export function latestSave(st: Storage | null = store()): SaveMeta | null {
  const all = listSaves(st).filter((m) => !(m as any).corrupt);
  return all.sort((a, b) => b.savedAt - a.savedAt)[0] ?? null;
}

export function exportSave(s: GameState): string { return serialize(s, makeMeta(s, 'export', false)); }
