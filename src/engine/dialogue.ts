/**
 * Dialogue / scene engine. The same machinery runs NPC conversations, Dungeon Master scenes,
 * camp talks and environmental investigations. Content lives in data/dialogue/*.
 */
import type { DialogueNode, DialogueOption, DialogueTree, DText } from '../data/schema';
import type { Character, GameState, Skill } from './types';
import { evalCond } from './conditions';
import { applyEffects, type Signal } from './effects';
import { activeParty, addLog, player, recordRoll } from './state';
import { abilityCheck, skillCheck, type CheckResult } from '../rules/checks';
import { abilityCheckBonus, skillBonus } from './character';
import { COMPANION_BY_ID } from '../data/companions';
import { NPC_BY_ID } from '../data/npcs';
import { gatherOpinions, objectors, partyVote, refusalLine, fillName, type Opinion, type VoteResult } from './companionMind';
import { SKILL_NAMES, ABILITY_NAMES } from '../rules/abilities';

export interface OptionView {
  index: number;
  text: string;
  enabled: boolean;
  lockedReason?: string;
  checkLabel?: string;
  tone?: string;
  objectors: string[];
}

export interface LineView { speaker: string; speakerName: string; text: string; }

export interface NodeView {
  treeId: string;
  nodeId: string;
  speaker: string;
  speakerName: string;
  text: string;
  interjections: LineView[];
  options: OptionView[];
  decision: boolean;
  canContinue: boolean;
  ended: boolean;
}

export interface ChoiceResult {
  roll?: CheckResult;
  signals: Signal[];
  ended: boolean;
  refusals: LineView[];
}

export function speakerName(s: GameState, speaker: string | undefined): string {
  if (!speaker || speaker === 'dm') return 'Dungeon Master';
  if (speaker === 'player') return player(s).name;
  if (speaker.startsWith('comp:')) return COMPANION_BY_ID[speaker.slice(5)]?.name ?? speaker;
  return NPC_BY_ID[speaker]?.name ?? speaker;
}

export function resolveText(s: GameState, text: string | DText[]): string {
  if (typeof text === 'string') return fill(s, text);
  for (const t of text) if (!t.if || evalCond(s, t.if)) return fill(s, t.text);
  return '';
}

function fill(s: GameState, t: string): string {
  const p = player(s);
  return fillName(s, t)
    .replace(/\{class\}/g, p.classId)
    .replace(/\{comp1\}/g, activeParty(s).find((c) => c.kind === 'companion')?.name.split(' ')[0] ?? 'your companion');
}

export class DialogueSession {
  nodeId: string;
  ended = false;
  transcript: LineView[] = [];
  private enteredSignals: Signal[] = [];

  constructor(public s: GameState, public tree: DialogueTree) {
    this.nodeId = this.startNode();
    this.enter(this.nodeId);
  }

  private startNode(): string {
    if (typeof this.tree.start === 'string') return this.tree.start;
    for (const st of this.tree.start) if (!st.if || evalCond(this.s, st.if)) return st.node;
    return this.tree.start[this.tree.start.length - 1].node;
  }

  get node(): DialogueNode {
    const n = this.tree.nodes[this.nodeId];
    if (!n) throw new Error(`Dialogue ${this.tree.id}: missing node ${this.nodeId}`);
    return n;
  }

  /** Signals produced by entering nodes (consumed once by the controller). */
  takeEnteredSignals(): Signal[] {
    const sig = this.enteredSignals;
    this.enteredSignals = [];
    return sig;
  }

  private enter(id: string): void {
    this.nodeId = id;
    const n = this.node;
    if (n.effects) this.enteredSignals.push(...applyEffects(this.s, n.effects, this.tree.title ?? ''));
    const text = resolveText(this.s, n.text);
    if (text) {
      const line = { speaker: n.speaker ?? 'dm', speakerName: speakerName(this.s, n.speaker), text };
      this.transcript.push(line);
      addLog(this.s, n.speaker && n.speaker !== 'dm' ? 'speech' : 'dm', text, n.speaker && n.speaker !== 'dm' ? line.speakerName : undefined);
    }
    for (const ij of this.interjections()) {
      this.transcript.push(ij);
      addLog(this.s, 'speech', ij.text, ij.speakerName);
    }
    if (n.end) this.ended = true;
  }

  private interjectionCache: { node: string; lines: LineView[] } | null = null;

  interjections(): LineView[] {
    if (this.interjectionCache?.node === this.nodeId) return this.interjectionCache.lines;
    const n = this.node;
    const out: LineView[] = [];
    const active = activeParty(this.s).filter((c) => c.kind === 'companion').map((c) => c.companionId!);
    const used = new Set<string>();
    for (const ij of n.interjections ?? []) {
      let who: string | undefined;
      if (ij.who === 'any') who = active.find((id) => !used.has(id) && safe(this.s, ij.if));
      else if (active.includes(ij.who) && safe(this.s, ij.if)) who = ij.who;
      if (!who || used.has(who)) continue;
      used.add(who);
      if (ij.effects) this.enteredSignals.push(...applyEffects(this.s, ij.effects));
      out.push({ speaker: `comp:${who}`, speakerName: COMPANION_BY_ID[who].name, text: fill(this.s, ij.text) });
    }
    this.interjectionCache = { node: this.nodeId, lines: out };
    return out;
  }

  private onceKey(i: number): string { return `_once_${this.tree.id}_${this.nodeId}_${i}`; }

  visibleOptions(): { opt: DialogueOption; index: number; enabled: boolean }[] {
    const out: { opt: DialogueOption; index: number; enabled: boolean }[] = [];
    (this.node.options ?? []).forEach((opt, index) => {
      if (opt.once && this.s.flags[this.onceKey(index)]) return;
      const ok = safe(this.s, opt.if);
      if (!ok && !opt.lockedText) return;
      out.push({ opt, index, enabled: ok });
    });
    return out;
  }

  view(): NodeView {
    const n = this.node;
    const options: OptionView[] = this.visibleOptions().map(({ opt, index, enabled }) => ({
      index, enabled, text: fill(this.s, opt.text), tone: opt.tone,
      lockedReason: enabled ? undefined : opt.lockedText,
      checkLabel: opt.check ? checkLabel(this.s, opt) : undefined,
      objectors: objectors(this.s, opt.tags ?? []),
    }));
    return {
      treeId: this.tree.id, nodeId: this.nodeId, speaker: n.speaker ?? 'dm', speakerName: speakerName(this.s, n.speaker),
      text: resolveText(this.s, n.text), interjections: this.interjections(), options, decision: !!n.decision,
      canContinue: !n.options?.length && !!n.next, ended: this.ended || (!n.options?.length && !n.next),
    };
  }

  opinions(): Opinion[] {
    const vis = this.visibleOptions().filter((o) => o.enabled);
    const ops = gatherOpinions(this.s, vis.map((v) => v.opt));
    return ops.map((o) => ({ ...o, optionIndex: vis[o.optionIndex].index }));
  }

  vote(playerOptionIndex: number): VoteResult {
    const vis = this.visibleOptions().filter((o) => o.enabled);
    const local = Math.max(0, vis.findIndex((v) => v.index === playerOptionIndex));
    const res = partyVote(this.s, vis.map((v) => v.opt), local);
    return { ...res, winner: vis[res.winner].index, ballots: res.ballots.map((b) => ({ ...b, index: vis[b.index].index })) };
  }

  /** Characters able to attempt a check, best first. */
  candidates(optIndex: number): { char: Character; bonus: number }[] {
    const opt = this.node.options?.[optIndex];
    if (!opt?.check) return [];
    const chars = opt.check.who === 'player' ? [player(this.s)] : activeParty(this.s).filter((c) => c.hp > 0);
    return chars.map((c) => ({ char: c, bonus: checkBonus(c, opt) })).sort((a, b) => b.bonus - a.bonus);
  }

  continue(): ChoiceResult {
    const n = this.node;
    if (n.next) { this.enter(n.next); return { signals: this.takeEnteredSignals(), ended: this.ended, refusals: [] }; }
    this.ended = true;
    return { signals: this.takeEnteredSignals(), ended: true, refusals: [] };
  }

  choose(optIndex: number, rollerId?: string, forcedRolls?: number[]): ChoiceResult {
    const opt = this.node.options?.[optIndex];
    if (!opt) throw new Error(`No option ${optIndex}`);
    if (!safe(this.s, opt.if)) throw new Error('Option not available');
    if (opt.once) this.s.flags[this.onceKey(optIndex)] = true;
    const signals: Signal[] = [];
    const refusals: LineView[] = [];
    this.transcript.push({ speaker: 'player', speakerName: player(this.s).name, text: fill(this.s, opt.text) });
    addLog(this.s, 'speech', fill(this.s, opt.text), player(this.s).name);
    for (const id of objectors(this.s, opt.tags ?? [])) {
      const line = { speaker: `comp:${id}`, speakerName: COMPANION_BY_ID[id].name, text: refusalLine(this.s, id) };
      refusals.push(line);
      this.transcript.push(line);
      addLog(this.s, 'speech', line.text, line.speakerName);
    }
    const context = fill(this.s, opt.text).slice(0, 80);
    signals.push(...applyEffects(this.s, opt.effects, context));
    if (opt.tags?.length) signals.push(...applyEffects(this.s, [`react ${opt.tags.join(',')}`], context));
    let next = opt.next;
    let roll: CheckResult | undefined;
    if (opt.check) {
      const cands = this.candidates(optIndex);
      const roller = cands.find((c) => c.char.id === rollerId)?.char ?? cands[0]?.char ?? player(this.s);
      const adv = opt.check.advIf && safe(this.s, opt.check.advIf) ? 1 : 0;
      roll = opt.check.skill
        ? skillCheck(roller, opt.check.skill, opt.check.dc, { adv, forcedRolls })
        : abilityCheck(roller, opt.check.ability ?? 'cha', opt.check.dc, { adv, forcedRolls });
      recordRoll(this.s, roll);
      if (roll.success) {
        signals.push(...applyEffects(this.s, opt.successEffects, context));
        next = opt.success ?? next;
      } else {
        signals.push(...applyEffects(this.s, opt.failureEffects, context));
        next = opt.failure ?? next;
      }
    }
    // Combat or travel signals end the conversation immediately.
    if (opt.end || signals.some((x) => x.type === 'combat' || x.type === 'goto' || x.type === 'epilogue')) {
      this.ended = true;
      return { roll, signals: [...signals, ...this.takeEnteredSignals()], ended: true, refusals };
    }
    if (next) {
      this.interjectionCache = null;
      this.enter(next);
    } else this.ended = true;
    return { roll, signals: [...signals, ...this.takeEnteredSignals()], ended: this.ended, refusals };
  }
}

function safe(s: GameState, cond?: string): boolean {
  try { return evalCond(s, cond); } catch (e) { console.warn(e); return false; }
}

function checkBonus(c: Character, opt: DialogueOption): number {
  if (!opt.check) return 0;
  return opt.check.skill ? skillBonus(c, opt.check.skill as Skill) : abilityCheckBonus(c, opt.check.ability ?? 'cha');
}

function checkLabel(s: GameState, opt: DialogueOption): string {
  const ch = opt.check!;
  const name = ch.skill ? SKILL_NAMES[ch.skill] : ABILITY_NAMES[ch.ability ?? 'cha'];
  const chars = ch.who === 'player' ? [player(s)] : activeParty(s).filter((c) => c.hp > 0);
  const best = chars.map((c) => checkBonus(c, opt)).reduce((a, b) => Math.max(a, b), -99);
  return `${name} DC ${ch.dc} (best ${best >= 0 ? '+' : ''}${best})`;
}
