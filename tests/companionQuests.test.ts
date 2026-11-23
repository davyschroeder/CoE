/**
 * Every companion personal quest can be started at camp and completed through its own map objects,
 * and every companion conflict resolves.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { COMPANION_QUESTS, CONFLICTS, CQ_OBJECTS } from '../src/data/companionQuests';
import { COMPANIONS } from '../src/data/companions';
import { availablePersonalQuests, pendingConflicts } from '../src/engine/companionQuests';
import { evalCond } from '../src/engine/conditions';
import { getMap, isObjectPresent } from '../src/engine/exploration';
import { setRandomSource } from '../src/core/rng';
import { applyLevelUp, autoLevelChoices } from '../src/engine/character';
import { XP_TABLE } from '../src/rules/abilities';
import { makeGame } from './helpers';
import { Harness } from './harness';
import type { GameState } from '../src/engine/types';

afterEach(() => setRandomSource(null));

/** A party just after the prologue, with the companion trusting the player and their camp hints seen. */
function postPrologue(compId: string): GameState {
  const others = COMPANIONS.map((c) => c.id).filter((id) => id !== compId).slice(0, 2);
  const s = makeGame([compId, ...others]);
  for (const c of s.party) while (c.level < 4) { c.xp = XP_TABLE[c.level + 1]; applyLevelUp(c, autoLevelChoices(c)); }
  Object.assign(s.flags, { bell_rang: true, prologue_complete: true, heart_touched: true, bellwarden_defeated: true, vault_open: true, ysolt_outcome: 'escaped', lira_fate: 'faded', corvin_fate: 'freed' });
  for (const m of ['cathedral', 'undercroft', 'vault', 'inn']) s.maps[m] = { explored: '', removed: [], opened: [], revealed: [], disarmed: [], triggered: [], instability: 0, steps: 0 };
  s.chapter = 'act1';
  s.companions[compId].rel.trust = 20;
  s.companions[compId].rel.affection = 20;
  return s;
}

describe('companion personal quests', () => {
  for (const entry of COMPANION_QUESTS) {
    it(`${entry.questId} becomes available and can be completed`, () => {
      const s = postPrologue(entry.companionId);
      // Some quests are unlocked by camp-talk hints; set every flag the availability condition mentions.
      for (const m of entry.availableIf.matchAll(/(?:^|[\s(|&!])([a-z_]+)(?=$|[\s)|&])/g)) if (!m[1].includes(':')) s.flags[m[1]] = true;
      expect(evalCond(s, entry.availableIf), entry.availableIf).toBe(true);
      expect(availablePersonalQuests(s).map((q) => q.questId)).toContain(entry.questId);
      const H = new Harness(s);
      H.talk(entry.startTree);
      expect(s.quests[entry.questId], 'start tree must start the quest').toBeTruthy();
      // Follow the quest through the map objects that appear for its current stage.
      const visited = new Set<string>();
      for (let step = 0; step < 16 && s.quests[entry.questId]?.status === 'active'; step++) {
        const stage = s.quests[entry.questId].stage;
        const candidates = CQ_OBJECTS.filter(({ map, object }) => isObjectPresent(s, getMap(map), object) && (object.dialogue || object.encounter) && (object.if ?? '').includes(entry.questId));
        const next = candidates.find(({ object }) => !visited.has(`${stage}:${object.id}`)) ?? candidates[0];
        if (next) visited.add(`${stage}:${next.object.id}`);
        expect(next, `no object to advance ${entry.questId} at stage ${s.quests[entry.questId].stage}`).toBeTruthy();
        s.location = { mapId: next!.map, x: next!.object.x, y: next!.object.y };
        if (next!.object.dialogue) H.talk(next!.object.dialogue);
        else H.fight(next!.object.encounter!);
      }
      expect(s.quests[entry.questId].status).toBe('completed');
      expect(s.flags[`cq_${entry.companionId}_outcome`], 'outcome flag').toBeTruthy();
      expect(s.companions[entry.companionId].memories.length).toBeGreaterThan(0);
    }, 60000);
  }
});

describe('companion conflicts', () => {
  for (const cf of CONFLICTS) {
    it(`${cf.id} appears at camp and resolves`, () => {
      const s = postPrologue(cf.between[0]);
      const third = COMPANIONS.map((c) => c.id).find((id) => !cf.between.includes(id))!;
      const s2 = makeGame([...cf.between, third]);
      Object.assign(s2.flags, s.flags);
      s2.maps = s.maps;
      expect(pendingConflicts(s2).map((c) => c.id)).toContain(cf.id);
      const bondBefore = s2.companions[cf.between[0]].bonds[cf.between[1]] ?? 0;
      new Harness(s2).talk(cf.tree);
      expect(s2.flags[`conflict_${cf.id}_resolved`]).toBeTruthy();
      expect(pendingConflicts(s2).map((c) => c.id)).not.toContain(cf.id);
      expect(s2.companions[cf.between[0]].bonds[cf.between[1]] ?? 0).not.toBe(bondBefore);
    });
  }
});
