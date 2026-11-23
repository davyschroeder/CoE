/**
 * Act I main storyline (Writer C): Hollowmere the morning after → (Writer A's Old Path handoff) → Valdros and
 * its reality shifts → the Senate Dome (Maren, the Conclave ambush, Ossaryx, Severin) → end of Act I.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { setRandomSource } from '../src/core/rng';
import { applyLevelUp, autoLevelChoices } from '../src/engine/character';
import { XP_TABLE } from '../src/rules/abilities';
import { applyEffects } from '../src/engine/effects';
import { evalCond } from '../src/engine/conditions';
import { getMap, isObjectPresent } from '../src/engine/exploration';
import { hasItem } from '../src/engine/state';
import { ACT1_EPILOGUE } from '../src/data/act1/epilogue';
import { VALDROS } from '../src/data/act1/valdros';
import type { GameState } from '../src/engine/types';
import { makeGame } from './helpers';
import { Harness, eff, txt, type Pref } from './harness';

afterEach(() => setRandomSource(null));

/** Harness whose chained dialogues (from encounter victories / `dialogue` effects) use per-tree preferences. */
class StoryHarness extends Harness {
  auto: Record<string, Pref[]> = {};
  override talk(treeId: string, prefs: Pref[] = [], maxSteps = 60): void {
    super.talk(treeId, prefs.length ? prefs : this.auto[treeId] ?? [], maxSteps);
  }
}

function levelTo(s: GameState, lvl: number): void {
  for (const c of s.party) while (c.level < lvl) { c.xp = Math.max(c.xp, XP_TABLE[c.level + 1]); applyLevelUp(c, autoLevelChoices(c)); }
}

function postPrologue(flags: Record<string, unknown> = {}): GameState {
  const s = makeGame(['brakka', 'ilyra', 'korr']);
  levelTo(s, 4);
  Object.assign(s.flags, {
    bell_rang: true, prologue_complete: true, heart_touched: true, bellwarden_defeated: true, vault_open: true,
    ysolt_outcome: 'fought', lira_fate: 'faded', corvin_fate: 'handed_over', rescued_count: 2, ...flags,
  });
  for (const m of ['cathedral', 'undercroft', 'vault', 'inn']) s.maps[m] = { explored: '', removed: [], opened: [], revealed: [], disarmed: [], triggered: [], instability: 0, steps: 0 };
  s.chapter = 'act1';
  s.resonance = { current: 1, max: 3, unlocked: true };
  s.location = { mapId: 'hollowmere', x: 25, y: 14 };
  return s;
}

const obj = (map: string, id: string) => getMap(map).objects.find((o) => o.id === id)!;
const present = (s: GameState, map: string, id: string) => isObjectPresent(s, getMap(map), obj(map, id));

/** Hollowmere the morning after, up to `a1_main` = woods. */
function playAftermath(H: StoryHarness): void {
  const s = H.s;
  expect(present(s, 'hollowmere', 'a1v_morning_trigger')).toBe(true);
  H.talk('a1v_morning', [eff('dialogue a1v_council')]);
  expect(s.quests.a1_main?.stage).toBe('aftermath');
  expect(s.flags.a1v_council_done).toBe(true);
  expect(present(s, 'hollowmere', 'a1v_morning_trigger')).toBe(false);
  H.talk('a1v_maren_request', [txt('If it will help Hollowmere'), txt('Then we\'ll meet you there'), eff('dialogue a1v_aftermath_end')]);
  expect(s.flags.a1v_maren_spoke).toBe(true);
  expect(s.quests.a1_main.stage).toBe('woods');
  expect(s.discoveredHubs).toContain('woods');
  expect(s.discoveredHubs).toContain('ashenford');
  expect(present(s, 'hollowmere', 'a1v_maren_hm')).toBe(false);
}

/** Writer A's handoff, then Valdros up to the Dome. */
function playValdros(H: StoryHarness, reality: 'flooded' | 'burning' | 'inhabited' = 'flooded', recruitVaelis = false): void {
  const s = H.s;
  applyEffects(s, ['quest a1_main old_path', 'hub valdros', 'set a1_old_path_known']);
  levelTo(s, 5);
  H.travel('valdros', 23, 36);
  expect(present(s, 'valdros', 'a1v_arrival')).toBe(true);
  H.talk('a1v_valdros_arrival', [txt('We\'ll find a way in')]);
  expect(s.quests.a1_main.stage).toBe('valdros');
  expect(present(s, 'valdros_dome', 'a1v_dome_maren')).toBe(true);
  // No way into the Dome from the ruin.
  for (const id of ['dome_door', 'dome_culvert', 'dome_breach']) expect(present(s, 'valdros', id), id).toBe(false);
  if (recruitVaelis) {
    expect(present(s, 'valdros', 'a1v_vaelis')).toBe(true);
    H.talk('a1v_vaelis', [txt('Travel with us')]);
    expect(s.companions.vaelis.recruited).toBe(true);
    expect(s.flags.vaelis_instruments_hint).toBe(true);
  }
  const flick = { flooded: 'a1v_flicker_east', burning: 'a1v_flicker_west', inhabited: 'a1v_flicker_south' }[reality];
  H.talk(flick, [eff(`set valdros_reality ${reality}`)]);
  expect(s.flags.valdros_reality).toBe(reality);
  const door = { flooded: 'dome_culvert', burning: 'dome_breach', inhabited: 'dome_door' }[reality];
  expect(present(s, 'valdros', door)).toBe(true);
  const entry = { flooded: [29, 12], burning: [2, 12], inhabited: [16, 25] }[reality];
  H.travel('valdros_dome', entry[0], entry[1]);
  H.talk('a1v_dome_enter');
  expect(s.quests.a1_main.stage).toBe('dome');
  expect(s.flags.valdros_ambush_started).toBe(true);
  levelTo(s, 6);
}

function assertActComplete(H: StoryHarness, outcome: string): void {
  const s = H.s;
  expect(s.quests.a1_main.status).toBe('completed');
  expect(s.quests.a1_main.outcome).toBe(outcome);
  expect(s.flags.a1_complete).toBe(true);
  expect(s.flags.valdros_done).toBe(true);
  expect(s.flags.ossaryx_resolved).toBe(true);
  expect(s.chapter).toBe('act2');
  expect(H.epilogue).toBe(true);
  expect(s.location.mapId).toBe('valdros');
  // Epilogue: every line's condition is valid, and each topic shows at most one line.
  const shown = ACT1_EPILOGUE.filter((l) => evalCond(s, l.if));
  for (const topic of ['a1_maren_fate', 'ossaryx_fate', 'a1_severin', 'corvin_fate', 'ysolt_outcome', 'cq_seris_outcome']) {
    expect(shown.filter((l) => l.if?.includes(topic)).length, topic).toBe(1);
  }
}

describe('Act I main story (Valdros)', () => {
  it('epilogue conditions are valid and per-topic exclusive', () => {
    const s = postPrologue();
    for (const l of ACT1_EPILOGUE) expect(() => evalCond(s, l.if), l.if).not.toThrow();
    for (const fate of ['spared', 'turned', 'killed', 'absent']) {
      s.flags.a1_maren_fate = fate;
      expect(ACT1_EPILOGUE.filter((l) => l.if?.startsWith('a1_maren_fate') && evalCond(s, l.if)).length).toBe(1);
    }
  });

  it('Hollowmere aftermath → Valdros → betrayal & ambush (Ysolt) → Ossaryx slain → Severin refused', () => {
    const s = postPrologue();
    const H = new StoryHarness(s);
    playAftermath(H);

    // Seris arrives to judge the town, and joins.
    expect(present(s, 'hollowmere', 'a1v_seris')).toBe(true);
    H.talk('a1v_seris_hm', [txt('Ride with us')]);
    expect(s.companions.seris.recruited).toBe(true);
    // Corvin awaits a Covenant magistrate; intervene.
    H.talk('a1v_hale', [txt('[Persuasion] "Release him')]);
    expect(s.flags.a1v_corvin).toBe('released');

    playValdros(H, 'flooded', true);

    H.auto = {
      a1v_maren_dome: [eff('combat a1v_enc_ambush_ysolt'), txt('Go home, Maren'), eff('dialogue a1v_ossaryx')],
      a1v_ossaryx: [eff('combat a1_enc_ossaryx')],
      a1v_severin: [eff('set a1_severin refused'), eff('epilogue act1')],
    };
    H.talk('a1v_maren_dome');
    expect(s.flags.a1v_maren_confessed).toBe(true);
    expect(hasItem(s, 'a1v_severin_letter')).toBe(true);
    expect(H.fights.a1v_enc_ambush_ysolt).toBe('victory');
    expect(s.flags.a1_maren_fate).toBe('spared');
    expect(hasItem(s, 'a1v_maren_lists')).toBe(true);
    expect(H.fights.a1_enc_ossaryx).toBe('victory');
    expect(s.flags.ossaryx_fate).toBe('slain');
    expect(s.flags.a1_severin).toBe('refused');
    assertActComplete(H, 'refused');
  }, 120000);

  it('Ossaryx can be sent home (Resonance + understanding + hard checks); Maren turned; Severin listened', () => {
    const s = postPrologue({ ysolt_outcome: 'escaped', corvin_fate: 'ally' });
    const H = new StoryHarness(s);
    playAftermath(H);
    H.talk('a1v_hale');
    expect(s.flags.a1v_corvin_tip).toBe(true);
    playValdros(H, 'flooded');
    // The flooded Valdros: a lantern from the Evening Sea, and the name of Ossaryx's world.
    s.resonance.current = 1;
    H.talk('a1v_drift_lantern', [txt('[Resonance]')]);
    expect(s.flags.a1v_knows_ysmerond).toBe(true);
    expect(hasItem(s, 'a1v_wyrm_lantern')).toBe(true);
    s.resonance.current = 3;
    s.location = { mapId: 'valdros_dome', x: 16, y: 16 };

    H.auto = {
      a1v_maren_dome: [eff('combat a1v_enc_ambush_ysolt'), txt('You\'ll write to him again'), eff('dialogue a1v_ossaryx')],
      a1v_ossaryx: [eff('set a1v_return_tried'), txt('[Persuasion]')],
      a1v_severin: [eff('set a1_severin listened'), eff('epilogue act1')],
    };
    H.talk('a1v_maren_dome');
    expect(s.flags.a1_maren_fate).toBe('turned');
    expect(H.fights.a1_enc_ossaryx).toBeUndefined();
    expect(s.flags.ossaryx_fate).toBe('returned');
    expect(hasItem(s, 'a1v_ysmerond_lantern')).toBe(true);
    assertActComplete(H, 'listened');
  }, 120000);

  it('the return path is locked without Resonance or understanding', () => {
    const s = postPrologue();
    s.flags.a1v_ossaryx_met = true;
    const tree = VALDROS.dialogues!.find((d) => d.id === 'a1v_ossaryx')!;
    const opt = tree.nodes.choice.options!.find((o) => o.text.startsWith('[Resonance]'))!;
    s.resonance.current = 3;
    expect(evalCond(s, opt.if)).toBe(false);
    s.flags.a1v_hoard_known = true;
    expect(evalCond(s, opt.if)).toBe(true);
    s.resonance.current = 1;
    expect(evalCond(s, opt.if)).toBe(false);
  });

  it('maren_forgets: no bargain, the Conclave (High Seeker Vex) tracked the Heart itself — Maren absent', () => {
    const s = postPrologue({ maren_forgets: true, lira_fate: 'anchored', ysolt_outcome: 'persuaded' });
    const H = new StoryHarness(s);
    playAftermath(H);
    playValdros(H, 'burning');
    H.auto = {
      a1v_maren_dome: [eff('combat a1v_enc_ambush_vex'), eff('dialogue a1v_ossaryx')],
      a1v_ossaryx: [eff('combat a1_enc_ossaryx')],
      a1v_severin: [eff('set a1_severin tempted'), eff('epilogue act1')],
    };
    H.talk('a1v_maren_dome');
    expect(s.flags.a1v_maren_confessed).toBeUndefined();
    expect(H.fights.a1v_enc_ambush_vex).toBe('victory');
    expect(s.flags.a1_maren_fate).toBe('absent');
    expect(s.flags.a1v_anchor_read).toBe(true);
    expect(s.flags.ossaryx_fate).toBe('slain');
    assertActComplete(H, 'tempted');
  }, 120000);

  it('a1_warned_of_ambush: the party springs the trap on its springers', () => {
    const s = postPrologue({ a1_warned_of_ambush: true, ysolt_outcome: 'escaped' });
    const H = new StoryHarness(s);
    playAftermath(H);
    playValdros(H, 'inhabited');
    s.resonance.current = 3;
    s.flags.a1v_hoard_known = true;
    H.auto = {
      a1v_maren_dome: [eff('combat a1v_enc_turned_ysolt'), txt('You sold us to the people'), eff('dialogue a1v_ossaryx')],
      a1v_ossaryx: [eff('set a1v_return_tried'), txt('[Performance]')],
      a1v_severin: [eff('set a1_severin refused'), eff('epilogue act1')],
    };
    H.talk('a1v_maren_dome');
    expect(s.flags.a1v_ambush_turned).toBe(true);
    expect(H.fights.a1v_enc_turned_ysolt).toBe('victory');
    expect(H.fights.a1v_enc_ambush_ysolt).toBeUndefined();
    expect(s.flags.a1_maren_fate).toBe('killed');
    expect(s.flags.ossaryx_fate).toBe('returned');
    assertActComplete(H, 'refused');
  }, 120000);

  it('warned (via the Conclave scout): parley makes the Conclave withdraw without a fight', () => {
    const s = postPrologue({ ysolt_outcome: 'persuaded' });
    const H = new StoryHarness(s);
    playAftermath(H);
    applyEffects(s, ['quest a1_main old_path', 'hub valdros']);
    H.travel('valdros', 23, 36);
    H.talk('a1v_valdros_arrival');
    H.talk('a1v_scout', [txt('[Persuasion]'), txt('Let him go south')]);
    expect(s.flags.a1v_scout_talked).toBe(true);
    applyEffects(s, ['set valdros_reality inhabited']);
    H.travel('valdros_dome', 16, 25);
    H.talk('a1v_dome_enter', [txt('Go down to the Anchor')]);
    levelTo(s, 6);
    H.auto = {
      a1v_maren_dome: [txt('[Arcana]'), txt('Go home, Maren'), eff('dialogue a1v_ossaryx')],
      a1v_ossaryx: [eff('combat a1_enc_ossaryx')],
      a1v_severin: [eff('set a1_severin listened'), eff('epilogue act1')],
    };
    H.talk('a1v_maren_dome');
    expect(s.flags.a1v_ambush_parleyed).toBe(true);
    expect(Object.keys(H.fights).filter((k) => k.includes('ambush') || k.includes('turned'))).toEqual([]);
    expect(s.flags.a1_maren_fate).toBe('spared');
    assertActComplete(H, 'listened');
  }, 120000);

  it('Valdros extras: realities, their inhabitants, and the random/road encounters', () => {
    const s = postPrologue();
    const H = new StoryHarness(s);
    playAftermath(H);
    applyEffects(s, ['quest a1_main old_path', 'hub valdros']);
    levelTo(s, 5);
    H.travel('valdros', 23, 36);
    H.talk('a1v_valdros_arrival');
    H.talk('a1v_instruments');
    expect(s.flags.a1v_instruments_read).toBe(true);
    s.resonance.current = 3;
    H.talk('a1v_flicker_west', [eff('set valdros_reality burning')]);
    expect(present(s, 'valdros', 'a1v_archivist')).toBe(true);
    H.talk('a1v_archivist');
    expect(s.flags.a1v_heard_evening_sea).toBe(true);
    // Back to the ruin through the same flicker, then into the living Valdros by Arcana.
    H.talk('a1v_flicker_west', [eff('unset valdros_reality')]);
    expect(s.flags.valdros_reality).toBeUndefined();
    H.talk('a1v_flicker_south', [txt('[Arcana]')]);
    expect(s.flags.valdros_reality).toBe('inhabited');
    expect(present(s, 'valdros', 'a1v_vaelis')).toBe(false);
    expect(present(s, 'valdros', 'dome_door')).toBe(true);
    H.talk('a1v_lamplighter', [txt('Thank you for the offering')]);
    expect(s.flags.a1v_offering_taken).toBe(true);
    // Another reality's flicker first lets go of this one.
    H.talk('a1v_flicker_east', [eff('unset valdros_reality'), eff('set valdros_reality flooded')]);
    expect(s.flags.valdros_reality).toBe('flooded');
    expect(present(s, 'valdros', 'a1v_drift_lantern')).toBe(true);
    // Encounters.
    H.fight('a1_enc_echoes_valdros');
    H.fight('a1v_enc_riders');
    // Road vignettes all run to an end.
    for (const t of VALDROS.travel!) {
      expect(evalCond(s, t.if) || t.id === 'a1v_ysolt_road').toBe(true);
      H.talk(t.dialogue!);
    }
    expect(H.fights.a1_enc_echoes_valdros).toBe('victory');
  }, 120000);
});
