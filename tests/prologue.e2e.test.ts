/**
 * End-to-end acceptance test: plays the whole prologue through the real engine — dialogue sessions,
 * skill checks, companion reactions, tactical combat (AI controls everyone), quest updates,
 * map travel, looting — and finally saves and reloads the game.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { setRandomSource } from '../src/core/rng';
import { mapRuntime, activeParty } from '../src/engine/state';
import { stepTo } from '../src/engine/exploration';
import { longRest } from '../src/engine/rest';
import { serialize, deserialize, makeMeta } from '../src/engine/save';
import { makeGame } from './helpers';
import { Harness, eff, txt } from './harness';

afterEach(() => setRandomSource(null));

describe('prologue playthrough', () => {
  it('can be completed from character creation to Act I, and survives save/load', () => {
    const s = makeGame(['brakka', 'ilyra', 'vaelis']);
    const H = new Harness(s);

    // ── Festival
    H.talk('intro');
    expect(s.quests.mq_bell.stage).toBe('festival');
    H.talk('maren', [txt('two lanterns'), txt('I believe you')]);
    H.talk('wenna', [txt('looking at the cathedral')]);
    H.talk('pell', [eff('quest sq_lira')]);
    expect(s.quests.sq_lira?.status).toBe('active');
    H.travel('inn', 10, 12);
    H.talk('brawl', [(o) => !!o.check && o.check.skill === 'persuasion']);
    expect(s.flags.brawl_resolved).toBeTruthy();
    expect(s.quests.sq_brawl.status).toBe('completed');
    H.talk('tobin', [eff('sq_corvin')]);
    H.travel('hollowmere', 25, 17);
    H.talk('lantern_tree', [txt('hang your own'), txt('leave it blank'), txt('wait for the midnight vigil now'), txt('we wait')]);
    expect(s.flags.bell_rang).toBe(true);
    expect(s.resonance.unlocked).toBe(true);
    expect(s.quests.mq_bell.stage).toBe('midnight');

    // ── Night: Hale, leads, rescues
    H.talk('hale', [txt('your people first')]);
    expect(s.quests.mq_bell.stage).toBe('investigate');
    expect(s.quests.sq_fog_rescue.status).toBe('active');
    H.talk('wenna', [txt('happening to me'), txt('halric')]);
    H.talk('maren', [txt('records')]);
    expect(s.flags.knows_halric).toBeTruthy();
    H.talk('abel', [eff('set mill_resolved'), eff('set mill_attack')]);
    if (!s.flags.mill_resolved) H.fight('enc_mill');
    expect(s.flags.mill_resolved).toBeTruthy();
    H.talk('shop_echo', [(o) => !!o.check && o.check.skill === 'insight', (o) => !!o.check && o.check.skill === 'persuasion']);
    if (!s.flags.shop_resolved) H.fight('enc_shop');
    expect(s.flags.shop_resolved).toBeTruthy();
    H.talk('well_encounter', [(o) => !!o.check]);
    if (!s.flags.well_resolved) H.fight('enc_well');
    expect(s.flags.well_resolved).toBeTruthy();
    expect(s.quests.sq_lira.stage).toBe('search');
    H.talk('hale', [txt("it's done"), txt('accept it')]);
    expect(s.quests.sq_fog_rescue.status).toBe('completed');
    expect(Number(s.flags.rescued_count)).toBe(3);

    // ── Rest, then the cathedral
    longRest(s);
    H.travel('cathedral', 17, 27);
    expect(s.quests.mq_bell.stage).toBe('cathedral');
    H.fight('enc_nave');
    H.talk('altar', [txt('resonance'), txt('press it'), txt('investigation')]);
    expect(mapRuntime(s, 'cathedral').revealed).toContain('secret_door');
    // The revealed secret door is now walkable.
    s.location = { mapId: 'cathedral', x: 17, y: 4 };
    const ev = stepTo(s, 17, 3);
    expect(ev.some((e) => e.type === 'trigger' && e.blocked)).toBe(false);
    expect(s.location.y).toBe(3);

    // ── Undercroft
    H.travel('undercroft', 21, 2);
    expect(s.quests.mq_bell.stage).toBe('undercroft');
    H.fight('enc_ossuary');
    H.loot('undercroft', 'ossuary_chest');
    expect(s.inventory.some((i) => i.itemId === 'vault_sigil')).toBe(true);
    H.talk('lira_echo', [eff('set lira_fate faded')]);
    expect(s.flags.lira_fate).toBe('faded');
    H.fight('enc_crawlers');
    H.talk('corvin_rescue', [eff('set corvin_fate ally')]);
    expect(s.flags.corvin_fate).toBe('ally');
    H.talk('sentinel', [txt('corvin')]);
    expect(s.flags.sentinel_fate).toBe('disabled');
    H.talk('vault_door', [txt('sigil-stone')]);
    expect(s.flags.vault_open).toBe(true);
    longRest(s);

    // ── The vault
    H.travel('vault', 13, 20);
    expect(s.quests.mq_bell.stage).toBe('vault');
    H.talk('bellwarden_meet', [txt('halric')]);
    expect(H.fights.enc_bellwarden).toBe('victory');
    expect(s.flags.bellwarden_defeated).toBe(true);
    H.talk('heart', [txt('touch it'), txt('who are you'), txt('can i trust'), txt('fold yourselves')]);
    expect(s.flags.heart_touched).toBe(true);
    expect(s.inventory.some((i) => i.itemId === 'heart_of_aether')).toBe(true);
    expect(s.flags.ysolt_outcome).toBe('escaped');
    expect(s.flags.prologue_complete).toBe(true);
    expect(s.chapter).toBe('act1');
    expect(s.quests.mq_bell.status).toBe('completed');
    expect(H.epilogue).toBe(true);

    // Pell gets his report (side quest closes).
    H.talk('pell', [eff('complete sq_lira')]);
    expect(s.quests.sq_lira.status).toBe('completed');

    // Party gained levels and companions formed opinions.
    expect(activeParty(s)[0].level).toBeGreaterThanOrEqual(3);
    expect(Object.values(s.companions).some((c) => c.memories.length > 0 || c.rel.trust !== 5)).toBe(true);

    // ── Save / load preserves every consequence
    const text = serialize(s, makeMeta(s, 'slot1', false));
    const loaded = deserialize(text);
    expect(loaded.flags).toEqual(s.flags);
    expect(loaded.quests).toEqual(s.quests);
    expect(loaded.party.map((c) => c.level)).toEqual(s.party.map((c) => c.level));
    expect(loaded.companions).toEqual(s.companions);
    expect(loaded.chapter).toBe('act1');
  }, 120000);
});
