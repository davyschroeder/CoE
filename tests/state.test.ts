import { describe, it, expect, afterEach } from 'vitest';
import { applyEffects } from '../src/engine/effects';
import { evalCond } from '../src/engine/conditions';
import { reactToChoice, gatherOpinions, partyVote, objectors } from '../src/engine/companionMind';
import { DialogueSession } from '../src/engine/dialogue';
import { DIALOGUE_BY_ID } from '../src/data/dialogue/index';
import { setRandomSource } from '../src/core/rng';
import { makeGame } from './helpers';

afterEach(() => setRandomSource(null));

describe('quests and effects', () => {
  it('quests only move forward and rewards are never granted twice', () => {
    const s = makeGame();
    applyEffects(s, ['quest mq_bell festival', 'quest mq_bell investigate']);
    applyEffects(s, ['quest mq_bell festival']);
    expect(s.quests.mq_bell.stage).toBe('investigate');
    const xp0 = s.party[0].xp;
    applyEffects(s, ['complete sq_brawl talked']);
    applyEffects(s, ['complete sq_brawl talked', 'complete sq_brawl fought']);
    expect(s.party[0].xp - xp0).toBe(75);
    expect(s.quests.sq_brawl.outcome).toBe('talked');
  });
  it('conditions language', () => {
    const s = makeGame();
    s.flags.n = 3; s.flags.fate = 'faded'; s.gold = 10;
    expect(evalCond(s, 'n>=3 && fate=faded && !missing')).toBe(true);
    expect(evalCond(s, '(n<2 || gold>=10) && comp:ilyra && class:fighter && bg:soldier')).toBe(true);
    expect(evalCond(s, 'comp:kael || item:heart_of_aether')).toBe(false);
    expect(evalCond(s, 'trust:ilyra>=5 && unsetflag<2')).toBe(true);
    expect(() => evalCond(s, 'bogus:thing')).toThrow();
  });
});

describe('companion personality engine', () => {
  it('reactions follow values; hard limits strike and can make a companion leave', () => {
    const s = makeGame(['seris', 'kael', 'vaelis']);
    const r = reactToChoice(s, ['deception']);
    expect(r.find((x) => x.compId === 'seris')!.score).toBeLessThan(0);
    expect(r.find((x) => x.compId === 'kael')!.score).toBeGreaterThan(0);
    expect(s.companions.seris.rel.trust).toBeLessThan(5);
    expect(objectors(s, ['cruelty'])).toContain('seris');
    reactToChoice(s, ['cruelty'], 'test');
    const second = reactToChoice(s, ['cruelty'], 'test');
    expect(second.find((x) => x.compId === 'seris')!.leaving).toBe(true);
    expect(s.companions.seris.memories.length).toBeGreaterThan(0);
  });
  it('opinions differ by personality and votes count the leader double', () => {
    setRandomSource(() => 0.5);
    const s = makeGame(['vaelis', 'orren', 'nima']);
    const opts = [{ text: 'Investigate the strange glow', tags: ['curiosity', 'boldness'] as any }, { text: 'Leave quietly', tags: ['caution', 'stealth'] as any }];
    const ops = gatherOpinions(s, opts);
    expect(ops.find((o) => o.compId === 'vaelis')!.optionIndex).toBe(0);
    expect(ops.find((o) => o.compId === 'nima')!.optionIndex).toBe(0);
    expect(ops.find((o) => o.compId === 'orren')!.optionIndex).toBe(1);
    const v = partyVote(s, opts, 1);
    expect(v.tally).toEqual([2, 3]);
    expect(v.winner).toBe(1);
  });
  it('dialogue choices change state and trigger companion reactions', () => {
    const s = makeGame(['seris', 'ilyra', 'brakka']);
    const d = new DialogueSession(s, DIALOGUE_BY_ID.maren);
    const idx = d.node.options!.findIndex((o) => o.text.includes('two lanterns'));
    d.choose(idx);
    const bel = d.node.options!.findIndex((o) => o.text.includes('I believe you'));
    const res = d.choose(bel);
    expect(s.flags.maren_believed).toBe(true);
    expect(res.signals.some((x) => x.type === 'reactions')).toBe(true);
    expect(s.companions.ilyra.rel.affection).toBeGreaterThan(0);
  });
});
