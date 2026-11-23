import { describe, it, expect } from 'vitest';
import { ALL_DIALOGUES, DIALOGUE_BY_ID } from '../src/data/dialogue/index';
import { MAPS } from '../src/data/maps/prologue';
import { ENCOUNTERS, ENCOUNTER_BY_ID } from '../src/data/encounters';
import { ENEMY_BY_ID } from '../src/data/enemies';
import { ITEM_BY_ID } from '../src/data/items';
import { ACTION_BY_ID } from '../src/data/actions';
import { CLASSES } from '../src/data/classes';
import { COMPANIONS } from '../src/data/companions';
import { COMPANION_VOICES } from '../src/data/dialogue/companionVoices';
import { BANTER } from '../src/data/dialogue/banter';
import { SHOPS } from '../src/data/shops';
import { QUESTS } from '../src/data/quests';
import { NPC_BY_ID } from '../src/data/npcs';
import { TAGS } from '../src/data/schema';
import { validateCond } from '../src/engine/conditions';
import { validateEffect, parseEffect } from '../src/engine/effects';
import { tile } from '../src/data/maps/tiles';
import { makeGame } from './helpers';

const s = makeGame();
const condErr = (c?: string) => (c ? validateCond(s, c) : null);

describe('content integrity', () => {
  it('dialogue trees: nodes, conditions, effects, speakers, tags', () => {
    const problems: string[] = [];
    const ids = new Set<string>();
    for (const t of ALL_DIALOGUES) {
      if (ids.has(t.id)) problems.push(`duplicate tree ${t.id}`);
      ids.add(t.id);
      const starts = typeof t.start === 'string' ? [{ node: t.start }] : t.start;
      for (const st of starts) { if (!t.nodes[st.node]) problems.push(`${t.id}: missing start ${st.node}`); const e = condErr((st as any).if); if (e) problems.push(`${t.id}: ${e}`); }
      for (const [nid, n] of Object.entries(t.nodes)) {
        const where = `${t.id}.${nid}`;
        if (n.next && !t.nodes[n.next]) problems.push(`${where}: bad next ${n.next}`);
        if (n.speaker && n.speaker !== 'dm' && n.speaker !== 'player' && !n.speaker.startsWith('comp:') && !NPC_BY_ID[n.speaker]) problems.push(`${where}: unknown speaker ${n.speaker}`);
        if (n.speaker?.startsWith('comp:') && !COMPANIONS.some((c) => `comp:${c.id}` === n.speaker)) problems.push(`${where}: unknown companion speaker`);
        if (Array.isArray(n.text)) for (const v of n.text) { const e = condErr(v.if); if (e) problems.push(`${where}: ${e}`); }
        for (const ef of n.effects ?? []) { const e = validateEffect(ef); if (e) problems.push(`${where}: ${e}`); }
        for (const ij of n.interjections ?? []) {
          if (ij.who !== 'any' && !COMPANIONS.some((c) => c.id === ij.who)) problems.push(`${where}: interjection by unknown ${ij.who}`);
          const e = condErr(ij.if); if (e) problems.push(`${where}: ${e}`);
          for (const ef of ij.effects ?? []) { const e2 = validateEffect(ef); if (e2) problems.push(`${where}: ${e2}`); }
        }
        if (!n.options?.length && !n.next && !n.end) { /* implicit end is allowed */ }
        (n.options ?? []).forEach((o, i) => {
          const ow = `${where}[${i}]`;
          for (const k of ['next', 'success', 'failure'] as const) if (o[k] && !t.nodes[o[k]!]) problems.push(`${ow}: bad ${k} ${o[k]}`);
          const e = condErr(o.if); if (e) problems.push(`${ow}: ${e}`);
          if (o.check?.advIf) { const e2 = condErr(o.check.advIf); if (e2) problems.push(`${ow}: ${e2}`); }
          for (const ef of [...(o.effects ?? []), ...(o.successEffects ?? []), ...(o.failureEffects ?? [])]) { const e2 = validateEffect(ef); if (e2) problems.push(`${ow}: ${e2}`); }
          for (const tg of o.tags ?? []) if (!(TAGS as readonly string[]).includes(tg)) problems.push(`${ow}: bad tag ${tg}`);
          if (o.check && !o.success && !o.failure && !o.next && !o.end) problems.push(`${ow}: check without destination`);
          if (!o.next && !o.end && !o.check && !(o.effects ?? []).some((ef) => ['combat', 'goto', 'dialogue', 'epilogue', 'shop', 'camp'].includes(parseEffect(ef).cmd))) problems.push(`${ow}: option leads nowhere`);
          for (const v of Object.keys(o.voices ?? {})) if (!COMPANIONS.some((c) => c.id === v)) problems.push(`${ow}: voice for unknown ${v}`);
        });
        // effect references: dialogue/combat/shop targets
        const all = [...(n.effects ?? []), ...(n.options ?? []).flatMap((o) => [...(o.effects ?? []), ...(o.successEffects ?? []), ...(o.failureEffects ?? [])])];
        for (const ef of all) {
          const { cmd, args } = parseEffect(ef);
          if (cmd === 'dialogue' && !DIALOGUE_BY_ID[args[0]]) problems.push(`${where}: dialogue ${args[0]} missing`);
          if (cmd === 'combat' && !ENCOUNTER_BY_ID[args[0]]) problems.push(`${where}: encounter ${args[0]} missing`);
          if (cmd === 'shop' && !SHOPS.some((x) => x.id === args[0])) problems.push(`${where}: shop ${args[0]} missing`);
          if ((cmd === 'quest' || cmd === 'complete' || cmd === 'clue') && !QUESTS.some((q) => q.id === args[0])) problems.push(`${where}: quest ${args[0]} missing`);
          if (cmd === 'quest' && !QUESTS.find((q) => q.id === args[0])?.stages[args[1]]) problems.push(`${where}: stage ${args[1]} missing`);
          if (cmd === 'clue' && !QUESTS.find((q) => q.id === args[0])?.clues?.[args[1]]) problems.push(`${where}: clue ${args[1]} missing`);
          if (cmd === 'complete' && args[1] && !QUESTS.find((q) => q.id === args[0])?.outcomes?.[args[1]]) problems.push(`${where}: outcome ${args[1]} missing`);
          if ((cmd === 'goto' || cmd === 'reveal' || cmd === 'open' || cmd === 'remove') && !MAPS.some((m) => m.id === args[0])) problems.push(`${where}: map ${args[0]} missing`);
          if ((cmd === 'reveal' || cmd === 'open') && !MAPS.find((m) => m.id === args[0])?.objects.some((o) => o.id === args[1])) problems.push(`${where}: object ${args[1]} missing`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('every companion has a camp dialogue and a voice', () => {
    for (const c of COMPANIONS) {
      expect(DIALOGUE_BY_ID[`camp_${c.id}`], c.id).toBeTruthy();
      expect(COMPANION_VOICES[c.id], c.id).toBeTruthy();
      for (const l of COMPANION_VOICES[c.id].idle) expect(condErr(l.if), `${c.id} ${l.id}`).toBeNull();
    }
    expect(COMPANIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('banter references valid companions and conditions', () => {
    const ids = new Set<string>();
    for (const b of BANTER) {
      expect(ids.has(b.id), b.id).toBe(false); ids.add(b.id);
      for (const w of b.between) expect(COMPANIONS.some((c) => c.id === w), `${b.id} ${w}`).toBe(true);
      for (const l of b.lines) expect(b.between.includes(l.who), `${b.id} line by ${l.who}`).toBe(true);
      expect(condErr(b.if), b.id).toBeNull();
      for (const ef of b.effects ?? []) expect(validateEffect(ef), b.id).toBeNull();
    }
  });

  it('maps: objects sit on valid tiles and reference existing content', () => {
    const problems: string[] = [];
    for (const m of MAPS) {
      const W = m.grid[0].length;
      if (!m.grid.every((r) => r.length === W)) problems.push(`${m.id}: ragged grid`);
      for (const o of m.objects) {
        const ch = m.grid[o.y]?.[o.x];
        if (ch === undefined) { problems.push(`${m.id}.${o.id}: out of bounds`); continue; }
        if (o.kind === 'npc' && !tile(ch).walk) problems.push(`${m.id}.${o.id}: NPC on blocked tile '${ch}'`);
        if (o.dialogue && !DIALOGUE_BY_ID[o.dialogue]) problems.push(`${m.id}.${o.id}: dialogue ${o.dialogue} missing`);
        if (o.encounter && !ENCOUNTER_BY_ID[o.encounter]) problems.push(`${m.id}.${o.id}: encounter missing`);
        if (o.to) {
          const dest = MAPS.find((x) => x.id === o.to!.map);
          if (!dest) problems.push(`${m.id}.${o.id}: destination map missing`);
          else if (!tile(dest.grid[o.to.y]?.[o.to.x] ?? '#').walk) problems.push(`${m.id}.${o.id}: destination ${o.to.x},${o.to.y} not walkable`);
        }
        for (const [it] of o.loot?.items ?? []) if (!ITEM_BY_ID[it]) problems.push(`${m.id}.${o.id}: item ${it} missing`);
        const e = condErr(o.if); if (e) problems.push(`${m.id}.${o.id}: ${e}`);
      }
      for (const l of [...m.lighting, ...m.instability, ...m.music, ...m.enter]) { const e = condErr(l.if); if (e) problems.push(`${m.id}: ${e}`); }
    }
    expect(problems).toEqual([]);
  });

  it('encounters, enemies, items, classes and shops are consistent', () => {
    for (const e of ENCOUNTERS) {
      for (const en of e.enemies) expect(ENEMY_BY_ID[en.t], `${e.id}: ${en.t}`).toBeTruthy();
      for (const ef of [...e.onVictory, ...(e.onDefeat ?? [])]) expect(validateEffect(ef), `${e.id}: ${ef}`).toBeNull();
      expect(MAPS.some((m) => m.id === e.map)).toBe(true);
    }
    for (const en of Object.values(ENEMY_BY_ID)) for (const a of en.actions) expect(ACTION_BY_ID[a], `${en.id}: ${a}`).toBeTruthy();
    for (const c of CLASSES) {
      for (const it of c.startingItems) expect(ITEM_BY_ID[it], it).toBeTruthy();
      for (const f of [...c.features, ...c.subclasses.flatMap((s) => s.features)]) for (const a of f.actions ?? []) expect(ACTION_BY_ID[a], a).toBeTruthy();
    }
    for (const sh of SHOPS) for (const st of sh.stock) expect(ITEM_BY_ID[st.itemId], st.itemId).toBeTruthy();
    for (const it of Object.values(ITEM_BY_ID)) if (it.use?.kind === 'spell') expect(ACTION_BY_ID[it.use.spellId]).toBeTruthy();
    for (const c of COMPANIONS) for (const sp of [...(c.cantrips ?? []), ...(c.spells ?? [])]) expect(ACTION_BY_ID[sp]?.classes?.includes(c.classId), `${c.id}: ${sp}`).toBe(true);
  });
});
