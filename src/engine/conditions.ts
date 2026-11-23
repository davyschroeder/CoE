/**
 * Evaluator for the condition mini-language documented in data/schema.ts.
 */
import type { GameState } from './types';
import { activeCompanionIds, activeParty, hasItem, player, timeOfDay } from './state';
import { repTier } from '../data/factions';

type Tok = { t: 'atom'; v: string } | { t: 'op'; v: '&&' | '||' | '!' | '(' | ')' };

const cache = new Map<string, Tok[]>();

function tokenize(src: string): Tok[] {
  if (cache.has(src)) return cache.get(src)!;
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (src.startsWith('&&', i)) { toks.push({ t: 'op', v: '&&' }); i += 2; continue; }
    if (src.startsWith('||', i)) { toks.push({ t: 'op', v: '||' }); i += 2; continue; }
    if (ch === '(' || ch === ')') { toks.push({ t: 'op', v: ch }); i++; continue; }
    if (ch === '!' && src[i + 1] !== '=') { toks.push({ t: 'op', v: '!' }); i++; continue; }
    const m = src.slice(i).match(/^[A-Za-z_][\w:.\-]*(?:(?:>=|<=|!=|=|>|<)[\w.\-]+)?/);
    if (!m) throw new Error(`Bad condition syntax near "${src.slice(i)}" in "${src}"`);
    toks.push({ t: 'atom', v: m[0] });
    i += m[0].length;
  }
  cache.set(src, toks);
  return toks;
}

function compare(a: number | string, op: string, b: string): boolean {
  const bn = Number(b);
  const numeric = typeof a === 'number' && !Number.isNaN(bn);
  const av: any = numeric ? a : String(a);
  const bv: any = numeric ? bn : b;
  switch (op) {
    case '=': return av == bv;
    case '!=': return av != bv;
    case '>': return av > bv;
    case '<': return av < bv;
    case '>=': return av >= bv;
    case '<=': return av <= bv;
  }
  return false;
}

const REL_DIMS = ['trust', 'respect', 'affection', 'agreement', 'fear'];

/** Resolve an atom's left side to a value. Unknown prefixes throw (caught by content tests). */
function value(s: GameState, key: string): number | string | boolean {
  const parts = key.split(':');
  const head = parts[0];
  const p = player(s);
  switch (head) {
    case 'gold': return s.gold;
    case 'res': return s.resonance.current;
    case 'resunlocked': return s.resonance.unlocked;
    case 'level': return p.level;
    case 'quest': { const q = s.quests[parts[1]]; return q && q.status === 'active' ? q.stage : false; }
    case 'questdone': return s.quests[parts[1]]?.status === 'completed';
    case 'questfail': return s.quests[parts[1]]?.status === 'failed';
    case 'questout': return s.quests[parts[1]]?.outcome ?? '';
    case 'class': return p.classId === parts[1];
    case 'bg': return p.background === parts[1];
    case 'anc': return p.ancestry === parts[1];
    case 'partyclass': return activeParty(s).some((c) => c.classId === parts[1]);
    case 'comp': return activeCompanionIds(s).includes(parts[1]);
    case 'recruited': return !!s.companions[parts[1]]?.recruited && !s.companions[parts[1]]?.left;
    case 'item': return hasItem(s, parts[1]);
    case 'skill': return p.skillProfs.includes(parts[1] as any);
    case 'bond': return s.companions[parts[1]]?.bonds[parts[2]] ?? 0;
    case 'time': return timeOfDay(s) === parts[1];
    case 'chapter': return s.chapter === parts[1];
    case 'diff': return s.difficulty === parts[1];
    case 'visited': return !!s.maps[parts[1]];
    case 'rep': return s.factions[parts[1]] ?? 0;
    case 'reptier': return repTier(s.factions[parts[1]] ?? 0);
    case 'talked': return !!s.companions[parts[1]]?.talksDone.includes(parts[2]);
    default:
      if (REL_DIMS.includes(head)) {
        const cs = s.companions[parts[1]];
        if (!cs) throw new Error(`Unknown companion in condition: ${key}`);
        return (cs.rel as any)[head];
      }
      if (parts.length > 1) throw new Error(`Unknown condition prefix: ${head}`);
      return s.flags[key] ?? false;
  }
}

function evalAtom(s: GameState, atom: string): boolean {
  const m = atom.match(/^(.*?)(>=|<=|!=|=|>|<)(.*)$/);
  if (!m) {
    const v = value(s, atom);
    return typeof v === 'string' ? v.length > 0 : !!v;
  }
  const left = value(s, m[1]);
  return compare(typeof left === 'boolean' ? (left ? 1 : 0) : left, m[2], m[3]);
}

export function evalCond(s: GameState, src: string | undefined): boolean {
  if (!src || !src.trim()) return true;
  const toks = tokenize(src);
  let pos = 0;
  const peek = () => toks[pos];
  const expr = (): boolean => {
    let v = term();
    while (peek()?.t === 'op' && peek()!.v === '||') { pos++; const r = term(); v = v || r; }
    return v;
  };
  const term = (): boolean => {
    let v = factor();
    while (peek()?.t === 'op' && peek()!.v === '&&') { pos++; const r = factor(); v = v && r; }
    return v;
  };
  const factor = (): boolean => {
    const t = toks[pos++];
    if (!t) throw new Error(`Unexpected end of condition "${src}"`);
    if (t.t === 'op' && t.v === '!') return !factor();
    if (t.t === 'op' && t.v === '(') {
      const v = expr();
      const close = toks[pos++];
      if (!close || close.t !== 'op' || close.v !== ')') throw new Error(`Missing ) in "${src}"`);
      return v;
    }
    if (t.t === 'atom') return evalAtom(s, t.v);
    throw new Error(`Unexpected token in "${src}"`);
  };
  const result = expr();
  if (pos !== toks.length) throw new Error(`Trailing tokens in condition "${src}"`);
  return result;
}

/** Validate syntax and known prefixes without needing a real game. Used by content tests. */
export function validateCond(s: GameState, src: string): string | null {
  try { evalCond(s, src); return null; } catch (e: any) { return e.message; }
}
