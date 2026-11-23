/**
 * Act I — the Whispering Woods (Writer A self-check): the Greenmother audience and the Old Path (incl. the
 * angered route), the Thornwake decision (helped / stopped / bargained), the woodcutters' "Red Cord", recruiting
 * Orren and Korr, their companion moments when already in the party, and the random encounters.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { QUESTS, QUEST_BY_ID } from '../src/data/quests';
import { ENCOUNTER_BY_ID } from '../src/data/encounters';
import { getMap, isObjectPresent } from '../src/engine/exploration';
import { applyEffects } from '../src/engine/effects';
import { setRandomSource } from '../src/core/rng';
import { applyLevelUp, autoLevelChoices } from '../src/engine/character';
import { XP_TABLE } from '../src/rules/abilities';
import { makeGame } from './helpers';
import { Harness, eff, txt, type Pref } from './harness';
import type { GameState } from '../src/engine/types';

afterEach(() => setRandomSource(null));

// a1_main is owned by Writer C (valdros.ts). If it is not there yet, assume the contract's stages so our
// effects (`quest a1_main old_path`) can run, and skip the main-quest assertions.
const HAS_MAIN = !!QUEST_BY_ID.a1_main;
if (!HAS_MAIN) {
  console.warn('[act1_woods] a1_main is not defined yet (Writer C) — using a stub; main-quest assertions skipped.');
  const stub = {
    id: 'a1_main', title: 'Whispers of the Veil (stub)', category: 'main' as const, giver: 'Hollowmere', summary: 'stub',
    stages: Object.fromEntries(['aftermath', 'woods', 'old_path', 'valdros', 'dome', 'wyrm', 'severin', 'done'].map((k) => [k, { objective: k, journal: k }])),
  };
  QUESTS.push(stub);
  QUEST_BY_ID.a1_main = stub;
}

/** A party just after the prologue, at level 4, in the Whispering Woods with the main quest at "woods". */
function postPrologue(companions = ['brakka', 'ilyra', 'vaelis']): GameState {
  const s = makeGame(companions);
  for (const c of s.party) while (c.level < 4) { c.xp = XP_TABLE[c.level + 1]; applyLevelUp(c, autoLevelChoices(c)); }
  Object.assign(s.flags, {
    bell_rang: true, prologue_complete: true, heart_touched: true, bellwarden_defeated: true, vault_open: true,
    ysolt_outcome: 'escaped', lira_fate: 'faded', corvin_fate: 'freed',
  });
  for (const m of ['cathedral', 'undercroft', 'vault', 'inn']) s.maps[m] = { explored: '', removed: [], opened: [], revealed: [], disarmed: [], triggered: [], instability: 0, steps: 0 };
  s.chapter = 'act1';
  applyEffects(s, ['unlockres', 'quest a1_main woods', 'hub woods', 'hub ashenford']);
  s.location = { mapId: 'woods', x: 1, y: 20 };
  return s;
}

/** Dialogues chained by effects (e.g. after a fight) reuse the preferences of the last explicit talk. */
class WoodsHarness extends Harness {
  private sticky: Pref[] = [];
  talk(treeId: string, prefs: Pref[] = [], maxSteps = 60): void {
    if (prefs.length) this.sticky = prefs;
    super.talk(treeId, prefs.length ? prefs : this.sticky, maxSteps);
  }
}

const at = (s: GameState, x: number, y: number) => { s.location = { mapId: 'woods', x, y }; };
const present = (s: GameState, id: string) => {
  const m = getMap('woods');
  return isObjectPresent(s, m, m.objects.find((o) => o.id === id)!);
};

function greenmotherAudience(H: WoodsHarness): void {
  at(H.s, 43, 15);
  H.talk('a1w_gate', [txt('Hollowmere\'s bell rang')]);
  expect(H.s.flags.a1w_gate_passed).toBe(true);
  at(H.s, 44, 9);
  H.talk('a1w_aunra', [txt('happening to the Woods'), txt('what I\'m carrying'), txt('Then help me understand'), txt('reach Valdros'), txt('Hollowmere is forgetting itself'), txt('Thank you, Greenmother')]);
}

function meetCaddoc(H: WoodsHarness): void {
  at(H.s, 30, 28);
  H.talk('a1w_stone', [txt('Study the brace'), txt('Leave the Stone')]);
  expect(H.s.flags.a1w_stone_seen).toBe(true);
  expect(H.s.flags.a1w_brace_known).toBe(true);
  at(H.s, 46, 30);
  H.talk('a1w_rue', [txt('see Caddoc')]);
  H.talk('a1w_caddoc', [txt('Why break the Stone'), txt('Brackwater'), txt('brace into the Stone'), txt('What do you want'), txt('We\'ll be there')]);
  expect(H.s.flags.a1w_caddoc_met).toBe(true);
  expect(H.s.quests.a1w_thornwake.stage).toBe('moonrise');
  expect(present(H.s, 'a1w_breaking')).toBe(true);
  expect(present(H.s, 'a1w_caddoc')).toBe(false);
}

describe('Act I — the Whispering Woods', () => {
  it('the Greenmother reveals the Old Path (contract flags, hub, main quest)', () => {
    const s = postPrologue();
    const H = new WoodsHarness(s);
    greenmotherAudience(H);
    expect(s.flags.a1_greenmother_met).toBe(true);
    expect(s.flags.a1_old_path_known).toBe(true);
    expect(s.discoveredHubs).toContain('valdros');
    expect(s.flags.a1w_anchors_told).toBe(true);
    expect(s.flags.a1w_heart_asked).toBe(true);
    expect(s.inventory.some((i) => i.itemId === 'a1w_rowan_knot')).toBe(true);
    if (HAS_MAIN) expect(s.quests.a1_main.stage).toBe('old_path');
    // Thornwake not decided yet: the Woods are not done.
    expect(s.flags.a1_woods_done).toBeFalsy();
    expect(s.quests.a1w_thornwake?.status).toBe('active');
  });

  it('an angered Greenmother still leaves the Old Path reachable (waystone + woodcutters\' map)', () => {
    const s = postPrologue();
    const H = new WoodsHarness(s);
    at(s, 44, 9);
    H.talk('a1w_aunra', [txt('reach Valdros'), txt('riddles')]);
    expect(s.flags.a1_greenmother_met).toBe(true);
    expect(s.flags.a1w_aunra_angered).toBe(true);
    expect(s.flags.a1_old_path_known).toBeFalsy();
    // She will not talk while angered (apology fails at this point only if chosen; here we leave quietly).
    H.talk('a1w_aunra', [txt('Leave quietly')]);
    expect(s.flags.a1_old_path_known).toBeFalsy();
    // The woodcutters' map makes the waystone search easier.
    applyEffects(s, ['give a1w_cord_map']);
    at(s, 52, 20);
    H.talk('a1w_waystone', [txt('black cord')]);
    expect(s.flags.a1_old_path_known).toBe(true);
    expect(s.discoveredHubs).toContain('valdros');
    if (HAS_MAIN) expect(s.quests.a1_main.stage).toBe('old_path');
    // Returning to her later is calm again.
    H.talk('a1w_aunra', [txt('Farewell')]);
    expect(s.flags.a1w_aunra_angered).toBeFalsy();
  });

  it('Thornwake: helping Caddoc break the Stone (helped / broken) completes the Woods', () => {
    const s = postPrologue();
    const H = new WoodsHarness(s);
    greenmotherAudience(H);
    meetCaddoc(H);
    const v0 = s.factions.verdant ?? 0, c0 = s.factions.conclave ?? 0;
    at(s, 30, 27);
    H.talk('a1w_breaking', [txt('I\'ll help you break it'), txt('Leave the ring')]);
    expect(s.flags.a1_thornwake).toBe('helped');
    expect(s.flags.a1_stone).toBe('broken');
    expect(s.quests.a1w_thornwake.status).toBe('completed');
    expect(s.quests.a1w_thornwake.outcome).toBe('helped');
    expect(s.factions.verdant ?? 0).toBeGreaterThan(v0);
    expect(s.factions.conclave ?? 0).toBeLessThan(c0);
    expect(s.flags.a1_woods_done).toBe(true);
    expect(present(s, 'a1w_breaking')).toBe(false);
    expect(present(s, 'a1w_caddoc')).toBe(true);
    // Later visits reflect the outcome.
    H.talk('a1w_stone');
    H.talk('a1w_caddoc', [txt('What will you do now'), txt('Farewell')]);
  });

  it('Thornwake: stopping Caddoc by force (stopped / left), then mending the Stone', () => {
    const s = postPrologue();
    const H = new WoodsHarness(s);
    meetCaddoc(H);
    at(s, 30, 27);
    H.talk('a1w_breaking', [eff('combat a1w_enc_thornwake'), txt('Greenmother can judge you'), txt('Leave him')]);
    expect(H.fights.a1w_enc_thornwake).toBeTruthy();
    expect(s.flags.a1_thornwake).toBe('stopped');
    expect(s.quests.a1w_thornwake.outcome).toBe('stopped');
    expect(s.flags.a1w_caddoc_fate).toBe(H.fights.a1w_enc_thornwake === 'victory' ? 'moot' : 'withdrew');
    expect(['left', 'mended']).toContain(s.flags.a1_stone);
    expect(s.flags.a1_stone).toBe('left');
    // Old Path not known yet → Woods not done.
    expect(s.flags.a1_woods_done).toBeFalsy();
    // Remove the brace and mend the Stone with resonance.
    s.resonance.current = Math.max(1, s.resonance.current);
    at(s, 30, 28);
    H.talk('a1w_stone', [txt('Work the bolts loose'), txt('help it find its own note'), txt('Leave it humming')]);
    expect(s.flags.a1w_brace_removed).toBe(true);
    expect(s.flags.a1_stone).toBe('mended');
    // Now the Greenmother: the Old Path completes the Woods.
    greenmotherAudience(H);
    expect(s.flags.a1_old_path_known).toBe(true);
    expect(s.flags.a1_woods_done).toBe(true);
  });

  it('Thornwake: a hard bargain (bargained / mended)', () => {
    const s = postPrologue();
    const H = new WoodsHarness(s);
    greenmotherAudience(H);
    at(s, 30, 28);
    H.talk('a1w_stone', [txt('Study the brace'), txt('Work the bolts loose'), txt('Leave the Stone')]);
    expect(s.flags.a1w_brace_removed).toBe(true);
    expect(s.inventory.some((i) => i.itemId === 'a1w_conclave_brace')).toBe(true);
    H.talk('a1w_caddoc', [txt('brace into the Stone'), txt('What do you want'), txt('another way')]);
    expect(s.flags.a1w_caddoc_doubts).toBe(true);
    at(s, 30, 27);
    H.talk('a1w_breaking', [txt('(Persuasion)'), txt('(Arcana) Sing with them'), txt('Leave them to it')]);
    expect(s.flags.a1_thornwake).toBe('bargained');
    expect(s.quests.a1w_thornwake.outcome).toBe('bargained');
    expect(s.flags.a1_stone).toBe('mended');
    expect(s.flags.a1_woods_done).toBe(true);
    H.talk('a1w_aunra', [txt('What will happen to Caddoc'), txt('Farewell')]);
  });

  it('Red Cord + recruiting Korr (not chosen at the start): fight at the larch, bring Lenn home', () => {
    const s = postPrologue();
    expect(s.companions.korr.recruited).toBeFalsy();
    const H = new WoodsHarness(s);
    at(s, 10, 11);
    H.talk('a1w_agna', [txt('(Survival)')]);
    expect(s.quests.a1w_woodcutters.stage).toBe('search');
    expect(s.flags.a1w_quiet_route).toBe(true);
    at(s, 11, 32);
    expect(present(s, 'a1w_tree')).toBe(true);
    H.talk('a1w_tree', [eff('combat a1w_enc_tree'), txt('And you, friend'), txt('somewhere worse than this'), txt('Now — Lenn')]);
    expect(H.fights.a1w_enc_tree).toBe('victory');
    expect(s.flags.a1w_piet_safe).toBe(true);
    expect(s.companions.korr.recruited).toBe(true);
    expect(present(s, 'a1w_korr')).toBe(false);
    at(s, 10, 30);
    H.talk('a1w_lenn', [txt('(Persuasion)'), txt('get you home')]);
    expect(s.flags.a1w_lenn_fate).toBe('returned');
    expect(s.quests.a1w_woodcutters.stage).toBe('report');
    at(s, 10, 11);
    H.talk('a1w_agna', [txt('Thank you, Agna'), txt('Leave the camp')]);
    expect(s.quests.a1w_woodcutters.status).toBe('completed');
    expect(s.quests.a1w_woodcutters.outcome).toBe('home');
    expect(s.inventory.some((i) => i.itemId === 'a1w_cord_map')).toBe(true);
    expect(present(s, 'a1w_lenn_home')).toBe(true);
  });

  it('Red Cord: letting Lenn go leaves Agna forgetting him; Korr can be recruited later', () => {
    const s = postPrologue();
    const H = new WoodsHarness(s);
    at(s, 10, 30);
    H.talk('a1w_lenn', [txt('want to be, Lenn'), txt('Climb out')]);
    expect(s.flags.a1w_lenn_fate).toBe('stayed');
    at(s, 11, 32);
    H.talk('a1w_tree', [txt('(Intimidation)'), txt('Get him down'), txt('And you, friend'), txt('Good luck, Korr'), txt('(Go.)')]);
    expect(s.flags.a1w_tree_done).toBe(true);
    expect(s.companions.korr.recruited).toBeFalsy();
    expect(s.quests.a1w_woodcutters.stage).toBe('report');
    expect(present(s, 'a1w_korr')).toBe(true);
    H.talk('a1w_korr', [txt('Come with us')]);
    expect(s.companions.korr.recruited).toBe(true);
    at(s, 10, 11);
    H.talk('a1w_agna', [txt('Thank you, Agna')]);
    expect(s.quests.a1w_woodcutters.outcome).toBe('lost');
  });

  it('recruiting Orren (not chosen at the start)', () => {
    const s = postPrologue();
    const H = new WoodsHarness(s);
    at(s, 35, 18);
    expect(present(s, 'a1w_orren')).toBe(true);
    H.talk('a1w_orren', [txt('pebbles for'), txt('family'), txt('help us find your grandmother\'s road')]);
    expect(s.companions.orren.recruited).toBe(true);
    expect(present(s, 'a1w_orren')).toBe(false);
  });

  it('Orren and Korr already in the party get companion moments instead', () => {
    const s = postPrologue(['orren', 'korr', 'ilyra']);
    Object.assign(s.flags, { cq_korr_outcome: 'sung', cq_orren_outcome: 'shared', orren_first_tree_known: true });
    const H = new WoodsHarness(s);
    expect(present(s, 'a1w_orren')).toBe(false);
    expect(present(s, 'a1w_hesk_mark')).toBe(true);
    at(s, 37, 18);
    H.talk('a1w_hesk_mark', [txt('fourth notch'), txt('Walk on')]);
    expect(s.flags.a1w_hesk_mark_done).toBe(true);
    expect(s.companions.orren.memories.length).toBeGreaterThan(0);
    at(s, 11, 32);
    H.talk('a1w_tree', [txt('Answer him'), eff('combat a1w_enc_tree'), txt('Go home, Piet')]);
    expect(s.flags.a1w_korr_thal_done).toBe(true);
    expect(s.flags.a1w_piet_safe).toBe(true);
    // Orren speaks for the party at the Heartwood; the acorn moment is offered.
    at(s, 43, 15);
    H.talk('a1w_gate', [txt('Orren can vouch')]);
    H.talk('a1w_aunra', [txt('Glance at Orren'), txt('Show her'), txt('reach Valdros'), txt('Orren — tell her'), txt('Thank you, Greenmother')]);
    expect(s.flags.a1w_acorn_shown).toBe(true);
    expect(s.flags.a1_old_path_known).toBe(true);
  });

  it('random encounters a1_enc_gloam and a1_enc_wolves are fightable in the Woods', () => {
    for (const id of ['a1_enc_gloam', 'a1_enc_wolves']) {
      expect(ENCOUNTER_BY_ID[id]?.relative).toBe(true);
      expect(ENCOUNTER_BY_ID[id].map).toBe('woods');
    }
    const s = postPrologue();
    const H = new WoodsHarness(s);
    H.fight('a1_enc_gloam');
    H.fight('a1_enc_wolves');
    expect(H.fights.a1_enc_gloam).toBe('victory');
    expect(H.fights.a1_enc_wolves).toBe('victory');
  });
});
