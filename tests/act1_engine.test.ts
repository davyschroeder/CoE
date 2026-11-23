import { describe, it, expect, afterEach } from 'vitest';
import { getMap, tileAt, isPassable, findPath, activeGrid } from '../src/engine/exploration';
import { rollTravelEvent, travelHours } from '../src/engine/travel';
import { setRandomSource } from '../src/core/rng';
import { evalCond } from '../src/engine/conditions';
import { makeGame } from './helpers';
import { POIS } from '../src/data/maps/grids';

afterEach(() => setRandomSource(null));

describe('Act I engine: Valdros realities', () => {
  it('each reality swaps the grid and opens exactly one way into the Senate Dome', () => {
    const s = makeGame();
    const m = getMap('valdros');
    const [sx, sy] = POIS.valdros.gate_south;
    const doors = { inhabited: [23, 3], flooded: [31, 7], burning: [17, 3] } as const; // the exit tiles themselves
    expect(activeGrid(s, m)).toBe(m.grid);
    for (const [x, y] of Object.values(doors)) expect(findPath(s, m, sx, sy, x, y)).toBeNull();
    for (const [reality, [x, y]] of Object.entries(doors)) {
      s.flags.valdros_reality = reality;
      expect(activeGrid(s, m)).not.toBe(m.grid);
      expect(findPath(s, m, sx, sy, x, y), reality).not.toBeNull();
      const exit = m.objects.find((o) => o.kind === 'exit' && o.to?.map === 'valdros_dome' && evalCond(s, o.if));
      expect(exit, reality).toBeTruthy();
    }
    s.flags.valdros_reality = 'flooded';
    expect(tileAt(s, m, 20, 15)).toBe('~');
    expect(isPassable(s, m, 20, 15)).toBe(false);
  });
});

describe('Act I engine: travel', () => {
  it('long journeys take hours and may roll an eligible event', () => {
    const s = makeGame();
    const start = s.time.day * 1440 + s.time.minute;
    setRandomSource(() => 0.1);
    const ev = rollTravelEvent(s, 'hollowmere', 'ashenford', [
      { id: 'a', weight: 1, if: 'never_set_flag', dialogue: 'x' },
      { id: 'b', weight: 1, once: true, dialogue: 'y' },
    ]);
    expect(s.time.day * 1440 + s.time.minute - start).toBe(travelHours('hollowmere', 'ashenford') * 60);
    expect(ev?.id).toBe('b');
    expect(rollTravelEvent(s, 'hollowmere', 'ashenford', [{ id: 'b', weight: 1, once: true, dialogue: 'y' }])).toBeNull();
  });

  it('the Act I regions are reachable from their entry points and the old exits appear only after the prologue', () => {
    const s = makeGame();
    const hm = getMap('hollowmere');
    const exit = hm.objects.find((o) => o.id === 'south_road_exit')!;
    expect(evalCond(s, exit.if)).toBe(false);
    s.flags.prologue_complete = true;
    expect(evalCond(s, exit.if)).toBe(true);
    for (const [map, from, to] of [['woods', 'entry_west', 'greenmother'], ['ashenford', 'gate_north', 'docks'], ['valdros_dome', 'entry_south', 'maren_spot']] as const) {
      const m = getMap(map);
      const a = (POIS as any)[map][from], b = (POIS as any)[map][to];
      expect(findPath(s, m, a[0], a[1], b[0], b[1]), `${map} ${from}→${to}`).not.toBeNull();
    }
  });
});

describe('Act I engine: milestones, story surprise, arrival', () => {
  it('main-quest stages grant their milestone XP exactly once', async () => {
    const { applyEffects } = await import('../src/engine/effects');
    const s = makeGame();
    const xp0 = s.party[0].xp;
    applyEffects(s, ['quest a1_main aftermath']);
    expect(s.party[0].xp).toBe(xp0 + 1000);
    applyEffects(s, ['quest a1_main woods', 'quest a1_main old_path']);
    expect(s.party[0].xp).toBe(xp0 + 3500);
    applyEffects(s, ['quest a1_main old_path', 'quest a1_main woods']); // repeats and regressions grant nothing
    expect(s.party[0].xp).toBe(xp0 + 3500);
  });

  it('surpriseIf surprises the enemy side when its condition holds', async () => {
    const { Combat } = await import('../src/engine/combat/combat');
    const s = makeGame();
    s.location = { mapId: 'valdros_dome', x: 16, y: 16 };
    const surprised = (cb: InstanceType<typeof Combat>) => cb.combatants.filter((c) => c.char.conditions.some((k) => k.id === 'surprised')).map((c) => c.side);
    expect(surprised(new Combat(s, 'a1v_enc_turned_ysolt'))).toEqual([]);
    s.flags.a1v_ambush_turned = true;
    const sides = surprised(new Combat(s, 'a1v_enc_turned_ysolt'));
    expect(sides.length).toBeGreaterThan(0);
    expect(sides.every((x) => x === 'enemy')).toBe(true);
  });

  it('the world-map arrival point of every Act I map is walkable', () => {
    const s = makeGame();
    for (const [map, x, y] of [['woods', 1, 20], ['ashenford', 27, 1], ['valdros', 23, 37]] as const) {
      expect(isPassable(s, getMap(map), x, y), map).toBe(true);
    }
  });
});

describe('Act I: Hollowmere remembers the prologue', () => {
  it('Pell\'s scene follows every Lira outcome', async () => {
    const { Harness, txt } = await import('./harness');
    for (const [fate, pick, flag] of [['anchored', 'Look after her', 'a1h_pell_seen'], ['bottled', 'find one', 'a1h_promised_pell'], ['faded', 'proud of you', 'a1h_pell_seen']] as const) {
      const s = makeGame(['vaelis', 'ilyra', 'nima']);
      Object.assign(s.flags, { prologue_complete: true, lira_fate: fate });
      s.chapter = 'act1';
      const H = new Harness(s);
      H.talk('a1h_pell', [txt(pick)]);
      expect(s.flags[flag], fate).toBe(true);
      expect(H.log[0], fate).toContain(`a1h_pell.${fate}`);
    }
  });
});
