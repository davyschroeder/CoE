/**
 * Act I — Ashenford self-check: every quest resolves through its own dialogues and fights, all six
 * Ashenford companions can be recruited in games where they were not chosen, and the routes to
 * `a1_warned_of_ambush` (Unbound safe house, Ysolt if persuaded, the garrison, Crane's deal) work.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { setRandomSource } from '../src/core/rng';
import { applyLevelUp, autoLevelChoices } from '../src/engine/character';
import { XP_TABLE } from '../src/rules/abilities';
import { getMap, isObjectPresent } from '../src/engine/exploration';
import { hasItem } from '../src/engine/state';
import { makeGame } from './helpers';
import { Harness, eff, txt } from './harness';
import type { GameState } from '../src/engine/types';

afterEach(() => setRandomSource(null));

const NOT_ASHENFORD = ['brakka', 'ilyra', 'vaelis'];   // Kael, Nima, Varek, Tessa unrecruited
const ASHENFORD_TRIO = ['kael', 'nima', 'varek'];       // Ilyra, Brakka, Tessa unrecruited

/** A party just after the prologue, standing in Ashenford's square. */
function postPrologue(comps: string[] = NOT_ASHENFORD, flags: Record<string, unknown> = {}): GameState {
  const s = makeGame(comps);
  for (const c of s.party) while (c.level < 4) { c.xp = XP_TABLE[c.level + 1]; applyLevelUp(c, autoLevelChoices(c)); }
  Object.assign(s.flags, {
    bell_rang: true, prologue_complete: true, heart_touched: true, bellwarden_defeated: true, vault_open: true,
    ysolt_outcome: 'escaped', lira_fate: 'faded', corvin_fate: 'handed_over', ...flags,
  });
  for (const m of ['cathedral', 'undercroft', 'vault', 'inn', 'ashenford']) s.maps[m] = { explored: '', removed: [], opened: [], revealed: [], disarmed: [], triggered: [], instability: 0, steps: 0 };
  s.chapter = 'act1';
  s.gold = 500;
  s.location = { mapId: 'ashenford', x: 27, y: 14 };
  return s;
}

const at = (s: GameState, x: number, y: number) => { s.location = { mapId: 'ashenford', x, y }; };
const present = (s: GameState, id: string) => {
  const m = getMap('ashenford');
  return isObjectPresent(s, m, m.objects.find((o) => o.id === id)!);
};

describe('Ashenford: The Wren House (a1a_wren)', () => {
  it('saved by paying the arrears — and Kael is met and recruited', () => {
    const s = postPrologue();
    const H = new Harness(s);
    at(s, 34, 21);
    expect(present(s, 'a1a_kael')).toBe(true);
    H.talk('a1a_wren', [eff('gold -150'), eff('recruit kael')]);
    expect(s.flags.a1_wren).toBe('saved');
    expect(s.quests.a1a_wren.status).toBe('completed');
    expect(s.quests.a1a_wren.outcome).toBe('saved');
    expect(hasItem(s, 'a1a_wren_ring')).toBe(true);
    expect(s.companions.kael.recruited).toBe(true);
    expect(present(s, 'a1a_kael')).toBe(false);
    expect(s.flags.a1a_wren_closed).toBe(true);
  });

  it('lost when the party stands aside — Kael still asks to come', () => {
    const s = postPrologue();
    const H = new Harness(s);
    at(s, 34, 21);
    H.talk('a1a_wren', [txt("It's Covenant law"), eff('recruit kael')]);
    expect(s.flags.a1_wren).toBe('lost');
    expect(s.quests.a1a_wren.outcome).toBe('lost');
    expect(s.companions.kael.recruited).toBe(true);
    expect(present(s, 'a1a_harrow')).toBe(false);
  });

  it('deal with Factor Greaves (Kael present) warns of the ambush through Crane\'s network', () => {
    const s = postPrologue(['kael', 'brakka', 'ilyra'], { cq_kael_outcome: 'empty' });
    const H = new Harness(s);
    at(s, 34, 21);
    H.talk('a1a_wren', [txt('What would your correspondent'), txt('Agreed'), txt('Look for Kael')]);
    expect(s.flags.a1_wren).toBe('deal');
    expect(s.flags.a1a_crane_deal).toBe(true);
    expect(s.flags.a1_warned_of_ambush).toBe(true);
    expect(s.companions.kael.memories.length).toBeGreaterThan(0);
  });

  it('a brawl with the bailiffs resolves the raid either way', () => {
    const s = postPrologue();
    const H = new Harness(s);
    at(s, 34, 21);
    H.talk('a1a_wren', [eff('combat a1a_enc_wren'), eff('recruit kael')]);
    expect(H.fights.a1a_enc_wren).toBeTruthy();
    expect(['saved', 'lost']).toContain(s.flags.a1_wren);
    expect(s.quests.a1a_wren.status).toBe('completed');
    expect(s.factions.covenant).toBeLessThan(0);
  });
});

describe('Ashenford: Drowning Day (a1a_mob)', () => {
  it('dispersed by persuasion — Varek is the victim and joins', () => {
    const s = postPrologue();
    const H = new Harness(s);
    at(s, 24, 17);
    expect(present(s, 'a1a_varek_bound')).toBe(true);
    H.talk('a1a_mob', [txt('(Persuasion) Look at him'), eff('recruit varek')]);
    expect(s.flags.a1_mob).toBe('dispersed');
    expect(s.quests.a1a_mob.outcome).toBe('dispersed');
    expect(s.flags.a1a_mob_varek).toBe(true);
    expect(s.companions.varek.recruited).toBe(true);
    expect(present(s, 'a1a_sollace')).toBe(false);
    expect(present(s, 'a1a_varek_well')).toBe(false);
  });

  it('fought — with Varek in the party the victim is a Veilborn child', () => {
    const s = postPrologue(['varek', 'brakka', 'ilyra']);
    const H = new Harness(s);
    at(s, 24, 17);
    expect(present(s, 'a1a_jory')).toBe(true);
    const dawn = s.factions.dawn ?? 0;
    H.talk('a1a_mob', [eff('combat a1a_enc_mob')]);
    expect(H.fights.a1a_enc_mob).toBeTruthy();
    expect(s.flags.a1_mob).toBe('fought');
    expect(s.quests.a1a_mob.outcome).toBe('fought');
    expect(s.flags.a1a_mob_varek).toBeFalsy();
    expect(s.factions.dawn).toBeLessThan(dawn);
    expect(s.flags.a1a_mob_after_done).toBe(true);
    expect(s.companions.varek.memories.length).toBeGreaterThan(0);
  });

  it('bought — a penance for the refugee kitchens', () => {
    const s = postPrologue();
    const H = new Harness(s);
    at(s, 24, 17);
    const gold = s.gold;
    H.talk('a1a_mob', [txt('A penance')]);
    expect(s.flags.a1_mob).toBe('bought');
    expect(s.quests.a1a_mob.outcome).toBe('bought');
    expect(s.gold).toBe(gold - 40);
    expect(s.companions.varek.recruited).toBe(true); // the chained after-scene recruits by default
  });

  it('Varek can decline after the Washing and be recruited later at the well', () => {
    const s = postPrologue(NOT_ASHENFORD, { a1_mob: 'dispersed', a1a_mob_varek: true });
    const H = new Harness(s);
    at(s, 26, 17);
    H.talk('a1a_mob_after', [txt('Go home, Varek')]);
    expect(s.companions.varek.recruited).toBe(false);
    expect(present(s, 'a1a_varek_well')).toBe(true);
    H.talk('a1a_mob_after', [eff('recruit varek')]);
    expect(s.companions.varek.recruited).toBe(true);
    expect(present(s, 'a1a_varek_well')).toBe(false);
  });
});

describe('Ashenford: the glassworks (a1a_glassworks)', () => {
  it('Nima met at the glassworks: reconciled with her father, then joins', () => {
    const s = postPrologue();
    const H = new Harness(s);
    at(s, 15, 15);
    H.talk('a1a_glassworks', [txt("Let's go in together"), txt('Tell him what happened'), txt('(Persuasion) Then don'), eff('recruit nima')]);
    expect(s.flags.a1_glassworks).toBe('reconciled');
    expect(s.quests.a1a_glassworks.outcome).toBe('reconciled');
    expect(hasItem(s, 'a1a_emberglass_lens')).toBe(true);
    expect(s.companions.nima.recruited).toBe(true);
  });

  it('Nima in the party: walking out leaves them estranged', () => {
    const s = postPrologue(['nima', 'brakka', 'ilyra']);
    const H = new Harness(s);
    at(s, 15, 15);
    H.talk('a1a_glassworks', [txt('This was a mistake')]);
    expect(s.flags.a1_glassworks).toBe('estranged');
    expect(s.companions.nima.memories.length).toBeGreaterThan(0);
  });

  it('Nima recruited but not with you: absent', () => {
    const s = postPrologue(['nima', 'brakka', 'ilyra']);
    s.activeIds = s.activeIds.filter((id) => id !== 'comp_nima');
    s.companions.nima.inParty = false;
    const H = new Harness(s);
    at(s, 15, 15);
    H.talk('a1a_glassworks', [txt("She's well")]);
    expect(s.flags.a1_glassworks).toBe('absent');
  });
});

describe('Ashenford: recruitment of Tessa, Ilyra and Brakka', () => {
  it('Tessa joins after the party shields her from Lieutenant Rusk', () => {
    const s = postPrologue();
    const H = new Harness(s);
    at(s, 10, 22);
    H.talk('a1a_inn', [txt('(History)'), eff('recruit tessa')]);
    expect(s.flags.a1a_inn_done).toBe(true);
    expect(s.companions.tessa.recruited).toBe(true);
  });

  it('Tessa taken to the cells can be bailed out at the garrison and joins', () => {
    const s = postPrologue();
    const H = new Harness(s);
    at(s, 10, 22);
    H.talk('a1a_inn', [txt('Take them')]);
    expect(s.flags.a1a_tessa_jailed).toBe(true);
    expect(present(s, 'a1a_tessa')).toBe(false);
    at(s, 11, 11);
    H.talk('a1a_garrison', [txt('gnome bard'), txt('Forty gold'), eff('recruit tessa'), txt('dispatches')]);
    expect(s.companions.tessa.recruited).toBe(true);
  });

  it('Ilyra joins at the Hospice of the Returned', () => {
    const s = postPrologue(ASHENFORD_TRIO, { coll_to_ashenford: true });
    const H = new Harness(s);
    at(s, 37, 15);
    H.talk('a1a_hospice', [txt('(Medicine)'), eff('recruit ilyra')]);
    expect(s.flags.a1a_aldo_calm).toBe(true);
    expect(s.companions.ilyra.recruited).toBe(true);
  });

  it('Brakka joins on the docks after the Ostrem hall-record is recovered', () => {
    const s = postPrologue(ASHENFORD_TRIO);
    const H = new Harness(s);
    at(s, 36, 28);
    H.talk('a1a_docks', [txt('(Intimidation)'), eff('recruit brakka')]);
    expect(s.flags.a1a_docks_done).toBe(true);
    expect(s.flags.a1a_ostrem_conclave).toBe(true);
    expect(s.companions.brakka.recruited).toBe(true);
  });

  it('Brakka joins after a dockside brawl', () => {
    const s = postPrologue(ASHENFORD_TRIO);
    const H = new Harness(s);
    at(s, 36, 28);
    H.fight('a1a_enc_docks');
    expect(s.flags.a1a_docks_fought).toBe(true);
    expect(s.flags.a1a_docks_done).toBe(true);
    expect(s.companions.brakka.recruited).toBe(true);
  });
});

describe('Ashenford: the warning about Valdros', () => {
  it('Unbound safe house via the notice board and Wick: allied, warned', () => {
    const s = postPrologue();
    const H = new Harness(s);
    at(s, 26, 13);
    H.talk('a1a_notice', [txt('(Perception)'), txt('Step away')]);
    expect(s.flags.a1a_cooper_known).toBe(true);
    expect(s.quests.a1a_safehouse.stage).toBe('rumour');
    at(s, 42, 22);
    H.talk('a1a_cooper', [txt('Do you mend old casks'), txt('What would it mean'), txt('Agreed'), txt('Read the Index')]);
    expect(s.flags.a1_safehouse).toBe('allied');
    expect(s.quests.a1a_safehouse.outcome).toBe('allied');
    expect(s.flags.a1_warned_of_ambush).toBe(true);
    expect(hasItem(s, 'unbound_sigil')).toBe(true);
    expect(s.factions.unbound).toBeGreaterThanOrEqual(15);
  });

  it('Unbound safe house with Corvin (freed) present: he reads the message; visited, warned', () => {
    const s = postPrologue(NOT_ASHENFORD, { corvin_fate: 'freed' });
    const H = new Harness(s);
    at(s, 42, 22);
    H.talk('a1a_cooper', [txt('Corvin Thale said'), txt('go our own way')]);
    expect(s.flags.a1_safehouse).toBe('visited');
    expect(s.flags.a1_warned_of_ambush).toBe(true);
  });

  it('Unbound safe house: breaking the cipher warns; refusing it does not', () => {
    const s = postPrologue(NOT_ASHENFORD, { a1a_cooper_known: true });
    const H = new Harness(s);
    at(s, 42, 22);
    H.talk('a1a_cooper', [txt('Do you mend old casks'), txt('(Investigation)'), txt('go our own way')]);
    expect(s.flags.a1_safehouse).toBe('visited');
    expect(s.flags.a1_warned_of_ambush).toBe(true);

    const s2 = postPrologue(NOT_ASHENFORD, { a1a_cooper_known: true });
    new Harness(s2).talk('a1a_cooper', [txt('Do you mend old casks'), txt('Keep your cipher')]);
    expect(s2.flags.a1_safehouse).toBe('visited');
    expect(s2.flags.a1_warned_of_ambush).toBeFalsy();
  });

  it('Ysolt (persuaded) leaves a coded margin at the Conclave office and meets the party at the docks', () => {
    const s = postPrologue(NOT_ASHENFORD, { ysolt_outcome: 'persuaded' });
    const H = new Harness(s);
    at(s, 44, 11);
    expect(present(s, 'a1a_ysolt')).toBe(false);
    H.talk('a1a_conclave');
    expect(s.flags.a1a_ysolt_summons).toBe(true);
    expect(present(s, 'a1a_ysolt')).toBe(true);
    at(s, 45, 28);
    H.talk('a1a_ysolt', [txt('Thank you')]);
    expect(s.flags.a1_warned_of_ambush).toBe(true);
    expect(present(s, 'a1a_ysolt')).toBe(false);
  });

  it('Ysolt (fought): the licensing office fight yields the wardens\' orders', () => {
    const s = postPrologue(NOT_ASHENFORD, { ysolt_outcome: 'fought' });
    const H = new Harness(s);
    at(s, 44, 11);
    H.talk('a1a_conclave', [eff('combat a1a_enc_conclave')]);
    expect(H.fights.a1a_enc_conclave).toBe('victory');
    expect(s.flags.a1_warned_of_ambush).toBe(true);
  });

  it('Captain Dray\'s garrison report (Persuasion)', () => {
    const s = postPrologue();
    const H = new Harness(s);
    at(s, 11, 11);
    H.talk('a1a_garrison', [txt('Valdros'), txt('(Persuasion)'), txt('dispatches')]);
    expect(s.flags.a1a_dray_report).toBe(true);
    expect(s.flags.a1_warned_of_ambush).toBe(true);
  });

  it('betraying the safe house to the garrison: betrayed, warned, the Unbound turn hostile', () => {
    const s = postPrologue(NOT_ASHENFORD, { a1a_cooper_known: true });
    const H = new Harness(s);
    at(s, 11, 11);
    H.talk('a1a_garrison', [txt('The Unbound keep'), txt('Hooper')]);
    expect(s.flags.a1_safehouse).toBe('betrayed');
    expect(s.quests.a1a_safehouse.outcome).toBe('betrayed');
    expect(s.flags.a1_warned_of_ambush).toBe(true);
    expect(s.factions.unbound).toBeLessThan(0);
    expect(present(s, 'a1a_hooper')).toBe(false);
  });
});

describe('Ashenford: a1_ashenford_done', () => {
  it('is set once the safe house and two other quests are resolved', () => {
    const s = postPrologue();
    const H = new Harness(s);
    at(s, 34, 21);
    H.talk('a1a_wren', [txt("It's Covenant law"), txt('Look after your house')]);
    expect(s.flags.a1_ashenford_done).toBeFalsy();
    at(s, 24, 17);
    H.talk('a1a_mob', [txt('A penance'), txt('Go home, Varek')]);
    expect(s.flags.a1a_resolved).toBe(2);
    expect(s.flags.a1_ashenford_done).toBeFalsy();
    at(s, 42, 22);
    s.flags.a1a_cooper_known = true;
    H.talk('a1a_cooper', [txt('Do you mend old casks'), txt('Keep your cipher')]);
    expect(s.flags.a1_safehouse).toBe('visited');
    expect(s.flags.a1_ashenford_done).toBe(true);
  });

  it('also triggers when the last of the three quests resolves after the safe house', () => {
    const s = postPrologue(NOT_ASHENFORD, { a1a_cooper_known: true });
    const H = new Harness(s);
    H.talk('a1a_cooper', [txt('Do you mend old casks'), txt('Keep your cipher')]);
    H.talk('a1a_wren', [eff('gold -150'), txt('Look after your house')]);
    expect(s.flags.a1_ashenford_done).toBeFalsy();
    H.talk('a1a_glassworks', [txt("Let's go in together"), txt('This was a mistake'), txt('Stay with your father')]);
    expect(s.flags.a1_glassworks).toBe('estranged');
    expect(s.flags.a1_ashenford_done).toBe(true);
  });
});

describe('Ashenford: small scenes', () => {
  it('gate, tenement, chapel, tax-house and merchants play without dead ends', () => {
    const s = postPrologue();
    const H = new Harness(s);
    H.talk('a1a_gate');
    expect(s.flags.a1a_gate_seen).toBe(true);
    H.talk('a1a_tenement', [txt('Who\'s been helping'), txt('Keep your place')]);
    expect(s.flags.a1a_cooper_known).toBe(true);
    H.talk('a1a_chapel', [txt('Aubrine'), txt('Go in the Lights')]);
    expect(s.flags.a1a_sollace_story).toBe(true);
    H.talk('a1a_taxhouse', [txt('(Investigation)'), txt('Wren House'), txt('Leave the queue')]);
    expect(s.flags.a1a_requisition_seen).toBe(true);
    H.talk('a1a_brisk', [txt('(Persuasion)'), txt('Another time')]);
    H.talk('a1a_tarrant', [txt('Leave him')]);
    H.talk('a1a_road_refugees');
    H.talk('a1a_road_pilgrims');
    // The mob scene with Sollace's story: breaking her disperses the crowd.
    H.talk('a1a_mob', [txt('Tam?'), eff('recruit varek')]);
    expect(s.flags.a1a_sollace_broken).toBe(true);
    expect(s.flags.a1_mob).toBe('dispersed');
  });
});
