import { expect } from 'vitest';
import { DialogueSession } from '../src/engine/dialogue';
import { DIALOGUE_BY_ID } from '../src/data/dialogue/index';
import { ENCOUNTER_BY_ID } from '../src/data/encounters';
import { applyEffects, type Signal } from '../src/engine/effects';
import type { DialogueOption } from '../src/data/schema';
import type { GameState } from '../src/engine/types';
import { setRandomSource, seeded } from '../src/core/rng';
import { mapRuntime } from '../src/engine/state';
import { lootContainer, getMap } from '../src/engine/exploration';
import { applyLevelUp, autoLevelChoices, canLevelUp } from '../src/engine/character';
import { longRest } from '../src/engine/rest';
import { simulate, stageFor } from './sim';

export type Pref = (o: DialogueOption) => boolean;
export const eff = (frag: string): Pref => (o) => [...(o.effects ?? []), ...(o.successEffects ?? [])].some((e) => e.includes(frag));
export const txt = (frag: string): Pref => (o) => o.text.toLowerCase().includes(frag.toLowerCase());

export class Harness {
  log: string[] = [];
  fights: Record<string, string> = {};
  epilogue = false;
  constructor(public s: GameState) {}

  lucky() { setRandomSource(() => 0.93); } // d20 rolls 19 for dialogue checks
  fair(seed: number) { setRandomSource(seeded(seed)); }

  talk(treeId: string, prefs: Pref[] = [], maxSteps = 60): void {
    const tree = DIALOGUE_BY_ID[treeId];
    expect(tree, `tree ${treeId}`).toBeTruthy();
    this.lucky();
    const session = new DialogueSession(this.s, tree);
    let signals: Signal[] = session.takeEnteredSignals();
    const chosen = new Set<string>();
    for (let step = 0; step < maxSteps && !session.ended; step++) {
      const v = session.view();
      if (v.ended && !v.options.length) break;
      if (v.canContinue) { signals.push(...session.continue().signals); continue; }
      const opts = session.visibleOptions().filter((x) => x.enabled);
      if (!opts.length) break;
      let pick = prefs.map((p) => opts.find((x) => p(x.opt) && !chosen.has(`${v.nodeId}:${x.index}`))).find(Boolean);
      if (!pick) pick = opts.find((x) => x.opt.tone !== 'leave' && !x.opt.end && !chosen.has(`${v.nodeId}:${x.index}`) && !(x.opt.effects ?? []).some((e) => e.startsWith('combat') || e.startsWith('shop')));
      if (!pick) pick = opts.find((x) => x.opt.tone === 'leave' || x.opt.end) ?? opts[0];
      chosen.add(`${v.nodeId}:${pick.index}`);
      this.log.push(`${treeId}.${v.nodeId} -> ${pick.opt.text.slice(0, 60)}`);
      signals.push(...session.choose(pick.index).signals);
    }
    this.process(signals);
  }

  process(signals: Signal[]): void {
    for (const sig of signals) {
      if (sig.type === 'goto') { this.s.location = { mapId: sig.mapId, x: sig.x, y: sig.y }; mapRuntime(this.s, sig.mapId); }
      if (sig.type === 'epilogue') this.epilogue = true;
    }
    const combat = signals.find((x) => x.type === 'combat') as Extract<Signal, { type: 'combat' }> | undefined;
    const dialogue = signals.find((x) => x.type === 'dialogue') as Extract<Signal, { type: 'dialogue' }> | undefined;
    if (combat) this.fight(combat.encounterId);
    else if (dialogue) this.talk(dialogue.treeId);
  }

  fight(encId: string, seed = 11): void {
    const enc = ENCOUNTER_BY_ID[encId];
    const saved = { ...this.s.location };
    let result = '';
    for (let attempt = 0; attempt < 4 && result !== 'victory'; attempt++) {
      // Reload-on-defeat, like a player would: restore HP and retry with fresh dice.
      for (const c of this.s.party) { c.hp = Math.max(c.hp, 1); c.conditions = []; }
      if (attempt > 0) longRest(this.s);
      this.fair(seed + attempt * 101);
      stageFor(this.s, encId);
      const r = simulate(this.s, encId);
      expect(r.illegal, encId).toEqual([]);
      result = r.result;
    }
    this.fights[encId] = result;
    if (result !== 'victory' && enc.onDefeat) {
      for (const c of this.s.party) { if (c.hp <= 0) c.hp = 1; c.conditions = []; }
      this.s.location = saved;
      this.process(applyEffects(this.s, enc.onDefeat, enc.name));
      return;
    }
    expect(result, `fight ${encId}`).toBe('victory');
    for (const c of this.s.party) { if (c.hp <= 0) c.hp = 1; c.conditions = []; c.deathSaves = { successes: 0, failures: 0 }; }
    this.s.location = saved;
    this.s.flags[`won_${encId}`] = true;
    this.levelUps();
    this.process(applyEffects(this.s, enc.onVictory, enc.name));
  }

  levelUps(): void {
    for (const c of this.s.party) while (canLevelUp(c)) applyLevelUp(c, autoLevelChoices(c));
  }

  travel(mapId: string, x: number, y: number): void {
    this.s.location = { mapId, x, y };
    mapRuntime(this.s, mapId);
    if (mapId === 'cathedral') applyEffects(this.s, ['quest mq_bell cathedral']);
    if (mapId === 'undercroft') applyEffects(this.s, ['quest mq_bell undercroft']);
    if (mapId === 'vault') applyEffects(this.s, ['quest mq_bell vault']);
  }

  loot(mapId: string, objId: string): void {
    const o = getMap(mapId).objects.find((x) => x.id === objId)!;
    lootContainer(this.s, mapId, o);
  }
}

