/**
 * End-to-end acceptance test for Act I: continues the real prologue playthrough (no state surgery, no
 * forced levels — only XP the story itself awards) through Hollowmere the morning after, the Whispering
 * Woods, Ashenford, the realities of Valdros, the Senate Dome (Maren, the Conclave ambush, Ossaryx,
 * Severin) to the Act I epilogue, and checks the result survives save/load.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { setRandomSource } from '../src/core/rng';
import { serialize, deserialize, makeMeta } from '../src/engine/save';
import { evalCond } from '../src/engine/conditions';
import { longRest } from '../src/engine/rest';
import { activeParty } from '../src/engine/state';
import { getMap, isObjectPresent } from '../src/engine/exploration';
import { ACT1_EPILOGUE } from '../src/data/act1/epilogue';
import type { GameState } from '../src/engine/types';
import { playPrologue } from './playthrough';
import { eff, txt, type Harness } from './harness';

afterEach(() => setRandomSource(null));

const at = (s: GameState, mapId: string, x: number, y: number) => { s.location = { mapId, x, y }; };
const present = (s: GameState, map: string, id: string) => {
  const m = getMap(map);
  const o = m.objects.find((x) => x.id === id);
  expect(o, `${map}/${id}`).toBeTruthy();
  return isObjectPresent(s, m, o!);
};
const levels = (s: GameState) => activeParty(s).map((c) => c.level);

function rest(H: Harness): void { H.levelUps(); longRest(H.s); }

describe('Act I playthrough', () => {
  it('runs from the prologue to the Act I epilogue on earned XP, and survives save/load', () => {
    const H = playPrologue();
    const s = H.s;
    const trace: string[] = [`prologue end: L${levels(s)}`];
    expect(s.flags.corvin_fate).toBe('ally');
    expect(s.flags.ysolt_outcome).toBe('escaped');
    rest(H);

    // ── Hollowmere, the morning after
    at(s, 'hollowmere', 25, 14);
    expect(present(s, 'hollowmere', 'a1v_morning_trigger')).toBe(true);
    H.talk('a1v_morning', [eff('dialogue a1v_council')]);
    expect(s.quests.a1_main.stage).toBe('aftermath');
    H.talk('a1v_hale');
    expect(s.flags.a1v_corvin_tip).toBe(true);
    H.talk('a1v_maren_request', [txt('If it will help Hollowmere'), txt('Then we\'ll meet you there'), eff('dialogue a1v_aftermath_end')]);
    expect(s.quests.a1_main.stage).toBe('woods');
    expect(s.discoveredHubs).toEqual(expect.arrayContaining(['woods', 'ashenford']));
    // Seris joins — the party is full, so she waits at camp.
    H.talk('a1v_seris_hm', [txt('Ride with us')]);
    expect(s.companions.seris.recruited).toBe(true);
    expect(s.companions.seris.inParty).toBe(false);
    // The town remembers the night: Lira's brother, the Grey Hawks, Brother Halric's name.
    for (const id of ['a1h_pell', 'a1h_hawks', 'a1h_halric']) expect(present(s, 'hollowmere', id), id).toBe(true);
    H.talk('a1h_pell', [txt('proud of you')]);
    expect(s.flags.a1h_pell_seen).toBe(true);
    H.talk('a1h_hawks', [txt('Watch the town')]);
    expect(s.flags.a1h_hawks_guard).toBe(true);
    H.talk('a1h_halric', [txt('Add a line')]);
    expect(present(s, 'hollowmere', 'a1h_halric')).toBe(false);
    H.levelUps(); trace.push(`aftermath: L${levels(s)}`);

    // ── The Whispering Woods: the Greenmother, the Old Path, and a hard bargain with the Thornwake
    H.travel('woods', 1, 20);
    at(s, 'woods', 43, 15);
    H.talk('a1w_gate', [txt('Hollowmere\'s bell rang')]);
    at(s, 'woods', 44, 9);
    H.talk('a1w_aunra', [txt('happening to the Woods'), txt('what I\'m carrying'), txt('Then help me understand'), txt('reach Valdros'), txt('Hollowmere is forgetting itself'), txt('Thank you, Greenmother')]);
    expect(s.flags.a1_old_path_known).toBe(true);
    expect(s.quests.a1_main.stage).toBe('old_path');
    expect(s.discoveredHubs).toContain('valdros');
    at(s, 'woods', 30, 28);
    H.talk('a1w_stone', [txt('Study the brace'), txt('Work the bolts loose'), txt('Leave the Stone')]);
    at(s, 'woods', 46, 30);
    H.talk('a1w_caddoc', [txt('brace into the Stone'), txt('What do you want'), txt('another way')]);
    at(s, 'woods', 30, 27);
    H.talk('a1w_breaking', [txt('(Persuasion)'), txt('(Arcana) Sing with them'), txt('Leave them to it')]);
    expect(s.flags.a1_thornwake).toBe('bargained');
    expect(s.flags.a1_stone).toBe('mended');
    expect(s.flags.a1_woods_done).toBe(true);
    H.fight('a1_enc_wolves');
    rest(H);
    H.levelUps(); trace.push(`woods: L${levels(s)}`);

    // ── Ashenford: the safe house (Corvin reads the warning), the Wren House, the mob, the glassworks
    H.travel('ashenford', 27, 1);
    at(s, 'ashenford', 42, 22);
    H.talk('a1a_cooper', [txt('Corvin Thale said'), txt('go our own way')]);
    expect(s.flags.a1_safehouse).toBe('visited');
    expect(s.flags.a1_warned_of_ambush).toBe(true);
    at(s, 'ashenford', 34, 21);
    H.talk('a1a_wren', [txt('(Investigation) Let me see that writ'), txt('Read the foot of the writ aloud'), txt('Look after your house')]);
    expect(s.flags.a1_wren).toBe('saved');
    at(s, 'ashenford', 24, 17);
    H.talk('a1a_mob', [txt('(Persuasion) Look at him'), txt('Go home, Varek')]);
    expect(s.flags.a1_mob).toBe('dispersed');
    at(s, 'ashenford', 15, 15);
    H.talk('a1a_glassworks', [txt("Let's go in together"), txt('Tell him what happened'), txt('(Persuasion) Then don'), eff('recruit nima')]);
    expect(s.flags.a1_glassworks).toBe('reconciled');
    expect(s.companions.nima.recruited).toBe(true);
    expect(s.flags.a1_ashenford_done).toBe(true);
    rest(H);
    H.levelUps(); trace.push(`ashenford: L${levels(s)}`);

    // ── Valdros: arrival on the Old Path, Vaelis reads the Conclave's instruments, the flooded reality
    H.travel('valdros', 23, 37);
    expect(present(s, 'valdros', 'a1v_arrival')).toBe(true);
    H.talk('a1v_valdros_arrival', [txt('We\'ll find a way in')]);
    expect(s.quests.a1_main.stage).toBe('valdros');
    H.talk('a1v_instruments');
    H.fight('a1_enc_echoes_valdros');
    H.talk('a1v_flicker_east', [eff('set valdros_reality flooded')]);
    expect(s.flags.valdros_reality).toBe('flooded');
    expect(present(s, 'valdros', 'dome_culvert')).toBe(true);
    rest(H);
    H.levelUps(); trace.push(`valdros: L${levels(s)}`);

    // ── The Senate Dome: warned, the party turns the ambush; Maren spared; Ossaryx fought; Severin refused
    H.travel('valdros_dome', 29, 12);
    H.talk('a1v_dome_enter');
    expect(s.quests.a1_main.stage).toBe('dome');
    H.auto = {
      a1v_maren_dome: [eff('combat a1v_enc_turned_ysolt'), txt('Go home, Maren'), eff('dialogue a1v_ossaryx')],
      a1v_ossaryx: [eff('combat a1_enc_ossaryx')],
      a1v_severin: [eff('set a1_severin refused'), eff('epilogue act1')],
    };
    H.levelUps(); trace.push(`dome: L${levels(s)} xp ${activeParty(s).map((c) => c.xp)}`);
    console.log('[act1 e2e]', trace.join(' | '));
    H.talk('a1v_maren_dome');
    expect(s.flags.a1v_ambush_turned).toBe(true);
    expect(H.fights.a1v_enc_turned_ysolt).toBe('victory');
    expect(s.flags.a1_maren_fate).toBe('spared');
    expect(H.fights.a1_enc_ossaryx).toBe('victory');
    expect(s.flags.ossaryx_fate).toBe('slain');
    expect(s.flags.a1_severin).toBe('refused');

    // ── The end of Act I
    expect(s.quests.a1_main.status).toBe('completed');
    expect(s.flags.a1_complete).toBe(true);
    expect(s.chapter).toBe('act2');
    expect(H.epilogue).toBe(true);
    const shown = ACT1_EPILOGUE.filter((l) => evalCond(s, l.if));
    for (const topic of ['a1_maren_fate', 'ossaryx_fate', 'a1_severin', 'a1_thornwake', 'a1_stone', 'a1_wren', 'a1_mob', 'a1_glassworks', 'a1_safehouse']) {
      expect(shown.filter((l) => l.if?.includes(topic)).length, topic).toBe(1);
    }
    H.levelUps();
    H.levelUps(); trace.push(`end: L${levels(s)}`);
    console.log('[act1 e2e] levels —', trace.join(' | '), '| fights:', JSON.stringify(H.fights));
    // Earned XP alone carries the party to the level the Act was designed for.
    expect(Math.min(...levels(s))).toBeGreaterThanOrEqual(6);

    // ── Save / load
    const loaded = deserialize(serialize(s, makeMeta(s, 'slot1', false)));
    expect(loaded.flags).toEqual(s.flags);
    expect(loaded.quests).toEqual(s.quests);
    expect(loaded.companions).toEqual(s.companions);
    expect(loaded.chapter).toBe('act2');
  }, 300000);
});
