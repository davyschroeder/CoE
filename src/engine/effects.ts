/**
 * Interpreter for the effect command language documented in data/schema.ts.
 * Pure state changes are applied immediately; things the UI must handle (combat, travel, shops,
 * chained dialogue) are returned as signals for the game controller.
 */
import type { GameState, DamageType } from './types';
import { activeParty, addItem, addLog, advanceTime, awardXp, mapRuntime, removeItem, companionChar, resonanceMax, buildCompanionCharacter } from './state';
import { reactToChoice, remember, companionLeaves, type Reaction } from './companionMind';
import { startQuest, setStage, addClue, completeQuest, failQuest } from './quests';
import { longRest, shortRest } from './rest';
import { rollDice } from '../core/dice';
import { applyDamage } from './damage';
import { ITEM_BY_ID } from '../data/items';
import { COMPANION_BY_ID } from '../data/companions';
import { clamp } from '../core/util';

export type Signal =
  | { type: 'combat'; encounterId: string }
  | { type: 'dialogue'; treeId: string }
  | { type: 'goto'; mapId: string; x: number; y: number }
  | { type: 'shop'; shopId: string }
  | { type: 'epilogue'; act: string }
  | { type: 'levelup'; names: string[] }
  | { type: 'reactions'; reactions: Reaction[] }
  | { type: 'notify'; text: string }
  | { type: 'camp' };

const KNOWN = new Set(['set', 'unset', 'add', 'quest', 'clue', 'complete', 'fail', 'give', 'take', 'gold', 'xp', 'rep', 'react', 'rel', 'bond',
  'memory', 'combat', 'goto', 'time', 'heal', 'damage', 'rest', 'res', 'unlockres', 'resmax', 'instab', 'reveal', 'remove', 'open', 'log',
  'dialogue', 'recruit', 'leave', 'hub', 'chapter', 'epilogue', 'shop', 'clock', 'camp']);

export function parseEffect(e: string): { cmd: string; args: string[]; rest: string } {
  const trimmed = e.trim();
  const sp = trimmed.indexOf(' ');
  const cmd = sp < 0 ? trimmed : trimmed.slice(0, sp);
  const rest = sp < 0 ? '' : trimmed.slice(sp + 1).trim();
  return { cmd, args: rest ? rest.split(/\s+/) : [], rest };
}

/** Static validation used by content tests: returns an error message or null. */
export function validateEffect(e: string): string | null {
  const { cmd, args } = parseEffect(e);
  if (!KNOWN.has(cmd)) return `Unknown effect command "${cmd}" in "${e}"`;
  const need: Record<string, number> = { set: 1, unset: 1, add: 2, quest: 2, clue: 2, complete: 1, fail: 1, give: 1, take: 1, gold: 1, xp: 1, rep: 2,
    react: 1, rel: 3, bond: 3, memory: 3, combat: 1, goto: 3, time: 1, heal: 1, damage: 1, rest: 1, res: 1, resmax: 1, instab: 1, reveal: 2, remove: 2,
    open: 2, log: 1, dialogue: 1, recruit: 1, leave: 1, hub: 1, chapter: 1, shop: 1, clock: 1 };
  if ((need[cmd] ?? 0) > args.length) return `Effect "${e}" needs ${need[cmd]} argument(s)`;
  if ((cmd === 'give' || cmd === 'take') && !ITEM_BY_ID[args[0]]) return `Unknown item "${args[0]}" in "${e}"`;
  if ((cmd === 'rel' || cmd === 'memory' || cmd === 'recruit' || cmd === 'leave') && !COMPANION_BY_ID[args[0]]) return `Unknown companion "${args[0]}" in "${e}"`;
  if (cmd === 'rel' && !['trust', 'respect', 'affection', 'agreement', 'fear'].includes(args[1])) return `Unknown relationship dimension in "${e}"`;
  if (['gold', 'xp', 'time', 'res', 'resmax', 'instab'].includes(cmd) && Number.isNaN(Number(args[0]))) return `Expected a number in "${e}"`;
  return null;
}

function coerce(v: string | undefined): number | string | boolean {
  if (v === undefined) return true;
  if (v === 'true') return true;
  if (v === 'false') return false;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

export function applyEffects(s: GameState, effects: readonly string[] | undefined, context = ''): Signal[] {
  const signals: Signal[] = [];
  if (!effects) return signals;
  for (const e of effects) applyEffect(s, e, signals, context);
  return signals;
}

function applyEffect(s: GameState, e: string, out: Signal[], context: string): void {
  const { cmd, args, rest } = parseEffect(e);
  const n = (i: number) => Number(args[i]);
  switch (cmd) {
    case 'set': s.flags[args[0]] = coerce(args[1]); break;
    case 'unset': delete s.flags[args[0]]; break;
    case 'add': s.flags[args[0]] = (Number(s.flags[args[0]]) || 0) + n(1); break;
    case 'quest': {
      const notes = s.quests[args[0]] ? setStage(s, args[0], args[1]) : startQuest(s, args[0], args[1]);
      if (notes) out.push({ type: 'notify', text: notes });
      break;
    }
    case 'clue': addClue(s, args[0], args[1]); break;
    case 'complete': { const t = completeQuest(s, args[0], args[1]); if (t) out.push({ type: 'notify', text: t }); break; }
    case 'fail': { const t = failQuest(s, args[0], args[1]); if (t) out.push({ type: 'notify', text: t }); break; }
    case 'give': {
      const qty = args[1] ? n(1) : 1;
      addItem(s, args[0], qty);
      out.push({ type: 'notify', text: `Received: ${ITEM_BY_ID[args[0]].name}${qty > 1 ? ` ×${qty}` : ''}` });
      break;
    }
    case 'take': removeItem(s, args[0], args[1] ? n(1) : 1); break;
    case 'gold': s.gold = Math.max(0, s.gold + n(0)); out.push({ type: 'notify', text: `${n(0) >= 0 ? '+' : ''}${n(0)} gold` }); break;
    case 'xp': {
      const ready = awardXp(s, n(0));
      out.push({ type: 'notify', text: `+${n(0)} XP` });
      if (ready.length) out.push({ type: 'levelup', names: ready });
      break;
    }
    case 'rep': s.factions[args[0]] = clamp((s.factions[args[0]] ?? 0) + n(1), -100, 100); break;
    case 'react': {
      const reactions = reactToChoice(s, args[0].split(','), context);
      if (reactions.length) out.push({ type: 'reactions', reactions });
      break;
    }
    case 'rel': {
      const cs = s.companions[args[0]];
      if (cs) (cs.rel as any)[args[1]] = clamp((cs.rel as any)[args[1]] + n(2), args[1] === 'fear' ? 0 : -100, 100);
      break;
    }
    case 'bond': {
      const [a, b] = [args[0], args[1]];
      for (const [x, y] of [[a, b], [b, a]]) {
        const cs = s.companions[x];
        if (cs) cs.bonds[y] = clamp((cs.bonds[y] ?? 0) + n(2), -100, 100);
      }
      break;
    }
    case 'memory': remember(s, args[0], n(1), args.slice(2).join(' ')); break;
    case 'combat': out.push({ type: 'combat', encounterId: args[0] }); break;
    case 'goto': out.push({ type: 'goto', mapId: args[0], x: n(1), y: n(2) }); break;
    case 'time': advanceTime(s, n(0)); break;
    case 'heal': {
      for (const c of activeParty(s)) {
        if (args[0] === 'all') { c.hp = c.maxHp; c.deathSaves = { successes: 0, failures: 0 }; c.stable = false; }
        else c.hp = Math.min(c.maxHp, c.hp + n(0));
      }
      break;
    }
    case 'damage': {
      for (const c of activeParty(s)) {
        if (c.hp <= 0) continue;
        const dmg = rollDice(args[0]).total;
        const res = applyDamage(c, dmg, (args[1] as DamageType) ?? 'bludgeoning');
        if (c.hp <= 0) c.hp = 1; // narrative damage never kills outright
        addLog(s, 'system', `${c.name} takes ${res.dealt} ${args[1] ?? ''} damage.`);
      }
      break;
    }
    case 'rest': {
      const msg = args[0] === 'long' ? longRest(s) : shortRest(s);
      out.push({ type: 'notify', text: msg });
      break;
    }
    case 'res': s.resonance.current = clamp(s.resonance.current + n(0), 0, resonanceMax(s)); break;
    case 'unlockres': s.resonance.unlocked = true; if (s.resonance.max < 1) s.resonance.max = 1; s.resonance.current = Math.max(s.resonance.current, 1); break;
    case 'resmax': s.resonance.max = Math.max(0, s.resonance.max + n(0)); s.resonance.current = Math.min(s.resonance.current, resonanceMax(s)); break;
    case 'instab': { const rt = mapRuntime(s, s.location.mapId); rt.instability = clamp(rt.instability + n(0), 0, 10); break; }
    case 'reveal': { const rt = mapRuntime(s, args[0]); if (!rt.revealed.includes(args[1])) rt.revealed.push(args[1]); break; }
    case 'remove': { const rt = mapRuntime(s, args[0]); if (!rt.removed.includes(args[1])) rt.removed.push(args[1]); break; }
    case 'open': { const rt = mapRuntime(s, args[0]); if (!rt.opened.includes(args[1])) rt.opened.push(args[1]); break; }
    case 'log': addLog(s, 'dm', rest); break;
    case 'dialogue': out.push({ type: 'dialogue', treeId: args[0] }); break;
    case 'recruit': {
      const id = args[0];
      const cs = s.companions[id];
      if (!cs) break;
      cs.recruited = true; cs.left = false;
      if (!companionChar(s, id)) s.party.push(buildCompanionCharacter(id, Math.max(1, s.party[0].level)));
      const pid = `comp_${id}`;
      if (s.activeIds.length < 4 && !s.activeIds.includes(pid)) { s.activeIds.push(pid); cs.inParty = true; }
      out.push({ type: 'notify', text: `${COMPANION_BY_ID[id].name} joins you.` });
      break;
    }
    case 'leave': companionLeaves(s, args[0]); break;
    case 'hub': if (!s.discoveredHubs.includes(args[0])) s.discoveredHubs.push(args[0]); break;
    case 'chapter': s.chapter = args[0] as GameState['chapter']; break;
    case 'epilogue': out.push({ type: 'epilogue', act: args[0] ?? 'prologue' }); break;
    case 'shop': out.push({ type: 'shop', shopId: args[0] }); break;
    case 'camp': out.push({ type: 'camp' }); break;
    case 'clock': {
      // Advance the clock forward to the given time of day (HH:MM), rolling over midnight if needed.
      const [h, mm] = args[0].split(':').map(Number);
      const target = h * 60 + (mm || 0);
      let delta = target - s.time.minute;
      if (delta < 0) delta += 1440;
      advanceTime(s, delta);
      break;
    }
    default: console.warn(`Unknown effect: ${e}`);
  }
}
