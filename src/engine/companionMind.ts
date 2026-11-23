/**
 * Companion personality engine.
 *
 * Companions are not flavour text: every reaction, suggestion, vote and refusal is computed from
 * their value profile (data/companions.ts), their relationship with the player, their mood/stress,
 * and their memories. The same functions drive both dialogue reactions and party decisions.
 */
import { COMPANION_BY_ID, type CompanionDef } from '../data/companions';
import { COMPANION_VOICES } from '../data/dialogue/companionVoices';
import { BANTER } from '../data/dialogue/banter';
import type { Banter, DialogueOption, Tag } from '../data/schema';
import type { CompanionState, GameState, Relationship } from './types';
import { activeCompanionIds, addLog, player } from './state';
import { evalCond } from './conditions';
import { clamp } from '../core/util';
import { pick, random } from '../core/rng';

export interface Reaction { compId: string; score: number; text: string; leaving?: boolean; }

const clampRel = (r: Relationship) => {
  r.trust = clamp(r.trust, -100, 100); r.respect = clamp(r.respect, -100, 100);
  r.affection = clamp(r.affection, -100, 100); r.agreement = clamp(r.agreement, -100, 100); r.fear = clamp(r.fear, 0, 100);
};

export function fillName(s: GameState, text: string): string {
  return text.replace(/\{player\}/g, player(s)?.name ?? 'friend');
}

/** How strongly a companion feels about a set of tags (positive = approves). */
export function tagScore(def: CompanionDef, tags: readonly string[]): number {
  return tags.reduce((sum, t) => sum + (def.values[t as Tag] ?? 0), 0);
}

/** Which relationship dimensions a tag touches. Trust ≠ respect ≠ affection ≠ agreement. */
const TAG_DIMENSIONS: Partial<Record<Tag, (keyof Relationship)[]>> = {
  honesty: ['trust'], deception: ['trust'], mercy: ['affection'], cruelty: ['affection', 'fear'], charity: ['affection'],
  greed: ['respect'], boldness: ['respect'], caution: ['respect'], protect: ['trust', 'affection'], violence: ['fear'],
  faith: ['agreement'], forbidden: ['agreement'], knowledge: ['agreement'], curiosity: ['agreement'], authority: ['agreement'],
  defiance: ['agreement'], tradition: ['agreement'], nature: ['agreement'], diplomacy: ['respect'], stealth: ['respect'],
  humor: ['affection'], pragmatic: ['respect'],
};

/**
 * Companions react to a player choice. Applies relationship changes and returns reaction lines.
 * Strongly felt reactions become memories; crossing a hard limit twice with low trust makes them leave.
 */
export function reactToChoice(s: GameState, tags: readonly string[], context = ''): Reaction[] {
  const out: Reaction[] = [];
  for (const id of activeCompanionIds(s)) {
    const def = COMPANION_BY_ID[id];
    const cs = s.companions[id];
    if (!def || !cs) continue;
    let total = 0;
    for (const tag of tags) {
      const v = def.values[tag as Tag] ?? 0;
      if (!v) continue;
      total += v;
      for (const dim of TAG_DIMENSIONS[tag as Tag] ?? ['agreement']) {
        if (dim === 'fear') { if (v < 0) cs.rel.fear += Math.abs(v) * 2; continue; }
        (cs.rel as any)[dim] += v * 2;
      }
      cs.rel.agreement += v;
    }
    const crossed = tags.filter((t) => def.hardLimits.includes(t as Tag));
    let leaving = false;
    if (crossed.length) {
      const key = `strikes_${id}`;
      const strikes = (Number(s.flags[key]) || 0) + 1;
      s.flags[key] = strikes;
      cs.rel.trust -= 10;
      cs.mood = clamp(cs.mood - 4, -10, 10);
      remember(s, id, -3, `You crossed a line I hold sacred${context ? `: ${context}` : ''}.`);
      if (strikes >= 2 && cs.rel.trust < 0) leaving = true;
    }
    clampRel(cs.rel);
    cs.mood = clamp(cs.mood + Math.sign(total), -10, 10);
    if (Math.abs(total) >= 3 && !crossed.length && context) remember(s, id, Math.sign(total) * 2, context);
    if (total === 0 && !crossed.length) continue;
    const voice = COMPANION_VOICES[id];
    const strongest = [...tags].sort((a, b) => Math.abs(def.values[b as Tag] ?? 0) - Math.abs(def.values[a as Tag] ?? 0))[0] as Tag;
    const pool = total > 0 ? voice?.reactions[strongest]?.pos : voice?.reactions[strongest]?.neg;
    const firstName = def.name.split(' ')[0];
    const text = pool?.length ? fillName(s, pick(pool)) : total > 0 ? `${firstName} approves.` : `${firstName} disapproves.`;
    out.push({ compId: id, score: total, text, leaving });
  }
  return out;
}

export function remember(s: GameState, compId: string, valence: number, text: string): void {
  const cs = s.companions[compId];
  if (!cs) return;
  if (cs.memories.some((m) => m.text === text)) return;
  cs.memories.push({ id: `m${cs.memories.length + 1}`, day: s.time.day, valence, text });
  if (cs.memories.length > 60) cs.memories.shift();
}

/** Remove a companion from the party for good (they leave in anger or by choice). */
export function companionLeaves(s: GameState, compId: string): string {
  const cs = s.companions[compId];
  const def = COMPANION_BY_ID[compId];
  if (!cs || !def) return '';
  cs.left = true; cs.inParty = false;
  s.activeIds = s.activeIds.filter((pid) => pid !== `comp_${compId}`);
  const farewell = COMPANION_VOICES[compId]?.farewell ?? `${def.name} gathers their things and leaves without a word.`;
  addLog(s, 'speech', fillName(s, farewell), def.name);
  addLog(s, 'system', `${def.name} has left the party.`);
  return farewell;
}

// ─────────────────────────────── Decisions

export interface Opinion {
  compId: string;
  optionIndex: number;
  strength: number; // how strongly they prefer it over the alternatives
  text: string;
}

/** Utility of an option for a companion, including personality, mood, stress and relationship. */
export function optionUtility(s: GameState, compId: string, opt: DialogueOption): number {
  const def = COMPANION_BY_ID[compId];
  const cs = s.companions[compId];
  if (!def || !cs) return 0;
  const tags = opt.tags ?? [];
  let u = tagScore(def, tags);
  // Personality dials colour the raw values.
  if (tags.includes('curiosity')) u += def.traits.curiosity - 0.5;
  if (tags.includes('caution')) u += def.traits.caution - 0.5 + cs.stress * 0.1;
  if (tags.includes('boldness')) u += (1 - def.traits.caution) - 0.5 - cs.stress * 0.1;
  if (tags.includes('violence')) u += def.traits.temper - 0.5;
  if (opt.tone === 'leave') u -= 0.5;
  // A bad mood makes companions more contrarian; an exhausted party wants caution.
  u += (random() - 0.5) * (1.2 - Math.abs(cs.mood) * 0.05);
  return u;
}

export function gatherOpinions(s: GameState, options: DialogueOption[]): Opinion[] {
  const out: Opinion[] = [];
  if (options.length < 2) return out;
  for (const id of activeCompanionIds(s)) {
    const def = COMPANION_BY_ID[id];
    const utils = options.map((o) => optionUtility(s, id, o));
    let best = 0;
    utils.forEach((u, i) => { if (u > utils[best]) best = i; });
    const sorted = [...utils].sort((a, b) => b - a);
    const strength = sorted[0] - (sorted[1] ?? 0);
    const opt = options[best];
    let text = opt.voices?.[id];
    if (!text) {
      const topTag = [...(opt.tags ?? [])].sort((a, b) => (def.values[b as Tag] ?? 0) - (def.values[a as Tag] ?? 0))[0] as Tag | undefined;
      const lines = topTag ? COMPANION_VOICES[id]?.suggest[topTag] : undefined;
      text = lines?.length ? pick(lines) : `I'd go with: "${opt.text}"`;
    }
    out.push({ compId: id, optionIndex: best, strength, text: fillName(s, text) });
  }
  return out;
}

export interface VoteResult { tally: number[]; winner: number; ballots: { compId: string; index: number; text: string }[]; }

/** Party vote. The player's own vote counts double (they are the leader), ties go to the player. */
export function partyVote(s: GameState, options: DialogueOption[], playerIndex: number): VoteResult {
  const tally = options.map(() => 0);
  tally[playerIndex] += 2;
  const ballots: VoteResult['ballots'] = [];
  for (const op of gatherOpinions(s, options)) {
    tally[op.optionIndex] += 1;
    const voice = COMPANION_VOICES[op.compId];
    const agrees = op.optionIndex === playerIndex;
    const line = agrees ? voice?.vote.yes : voice?.vote.no;
    ballots.push({ compId: op.compId, index: op.optionIndex, text: fillName(s, line?.length ? pick(line) : op.text) });
  }
  let winner = playerIndex;
  tally.forEach((v, i) => { if (v > tally[winner]) winner = i; });
  return { tally, winner, ballots };
}

/** Companions who refuse to go along with an option (hard limits). */
export function objectors(s: GameState, tags: readonly string[]): string[] {
  return activeCompanionIds(s).filter((id) => COMPANION_BY_ID[id]?.hardLimits.some((t) => tags.includes(t)));
}

export function refusalLine(s: GameState, compId: string): string {
  const lines = COMPANION_VOICES[compId]?.refuse;
  return fillName(s, lines?.length ? pick(lines) : 'No. I won\'t be part of this.');
}

// ─────────────────────────────── Ambient behaviour

const IDLE_COOLDOWN_MIN = 25; // game minutes between unprompted remarks per companion
const PARTY_COOLDOWN_MIN = 8;

export function gameMinutes(s: GameState): number {
  return s.time.day * 1440 + s.time.minute;
}

/** Possibly produce one ambient remark. Rate-limited so companions never chatter constantly. */
export function maybeIdleRemark(s: GameState): { compId: string; text: string } | null {
  const now = gameMinutes(s);
  const lastAny = Number(s.flags['_last_idle'] ?? -9999);
  if (now - lastAny < PARTY_COOLDOWN_MIN) return null;
  const candidates: { compId: string; id: string; text: string; w: number }[] = [];
  for (const id of activeCompanionIds(s)) {
    const cs = s.companions[id];
    const def = COMPANION_BY_ID[id];
    if (now - cs.lastSpoke < IDLE_COOLDOWN_MIN) continue;
    for (const line of COMPANION_VOICES[id]?.idle ?? []) {
      if (cs.talksDone.includes(line.id)) continue;
      if (!safeEval(s, line.if)) continue;
      candidates.push({ compId: id, id: line.id, text: line.text, w: def.traits.talkative });
    }
  }
  if (!candidates.length) return null;
  const total = candidates.reduce((a, c) => a + c.w, 0);
  let r = random() * total;
  const choice = candidates.find((c) => (r -= c.w) <= 0) ?? candidates[0];
  const cs = s.companions[choice.compId];
  cs.talksDone.push(choice.id);
  cs.lastSpoke = now;
  s.flags['_last_idle'] = now;
  return { compId: choice.compId, text: fillName(s, choice.text) };
}

export function maybeBanter(s: GameState): Banter | null {
  const now = gameMinutes(s);
  if (now - Number(s.flags['_last_banter'] ?? -9999) < 30) return null;
  const active = activeCompanionIds(s);
  const ok = BANTER.filter((b) => !s.flags[`banter_${b.id}`] && b.between.every((c) => active.includes(c)) && safeEval(s, b.if));
  if (!ok.length) return null;
  const b = pick(ok);
  s.flags[`banter_${b.id}`] = true;
  s.flags['_last_banter'] = now;
  return b;
}

export function bark(s: GameState, compId: string, kind: keyof NonNullable<typeof COMPANION_VOICES[string]>['combat']): string | null {
  const lines = COMPANION_VOICES[compId]?.combat[kind];
  if (!lines?.length) return null;
  return fillName(s, pick(lines));
}

function safeEval(s: GameState, cond?: string): boolean {
  try { return evalCond(s, cond); } catch { return false; }
}

/** Danger and moral strain build stress; rest relieves it. Stress makes companions more cautious. */
export function addStress(s: GameState, amount: number): void {
  for (const id of activeCompanionIds(s)) {
    const cs: CompanionState = s.companions[id];
    cs.stress = clamp(cs.stress + amount * (1 - COMPANION_BY_ID[id].traits.caution * 0.3), 0, 10);
  }
}

export function relationshipSummary(cs: CompanionState): string {
  const r = cs.rel;
  const word = (v: number, pos: string, neg: string, mid = 'neutral') => (v >= 25 ? pos : v <= -15 ? neg : mid);
  return [
    `Trust: ${word(r.trust, 'relies on you', 'wary of you', 'cautious')}`,
    `Respect: ${word(r.respect, 'admires your resolve', 'doubts your judgement', 'reserved')}`,
    `Affection: ${word(r.affection, 'fond of you', 'cold toward you', 'friendly')}`,
    `Agreement: ${word(r.agreement, 'shares your outlook', 'opposes your path', 'mixed')}`,
    r.fear >= 20 ? `Fear: ${r.fear >= 50 ? 'afraid of you' : 'uneasy around you'}` : '',
  ].filter(Boolean).join(' · ');
}
