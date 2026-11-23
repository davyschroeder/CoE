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
