import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CombatEvent } from '../src/engine/combat/combat';
import { random, seeded, setRandomSource } from '../src/core/rng';
import { CombatAnimationQueue, orderPresentationEvents, type CombatWalkHooks } from '../src/ui/render/combatAnimation';

const noopHooks = (): CombatWalkHooks => ({ startWalk: vi.fn(), advanceWalk: vi.fn(() => true), skipWalk: vi.fn() });
const attack = (targetId = 'enemy'): CombatEvent => ({ type: 'attack', attackerId: 'hero', targetId, roll: 15, total: 20, ac: 12, hit: true, crit: false, mode: 'normal', label: 'Sword' });
const damage = (targetId: string): CombatEvent => ({ type: 'damage', targetId, amount: 5, dtype: 'fire', note: '' });
const down = (targetId: string): CombatEvent => ({ type: 'down', targetId, dead: true });
const move = (id: string, x: number): CombatEvent => ({ type: 'move', id, path: [{ x, y: 2 }] });

function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

afterEach(() => { setRandomSource(null); vi.restoreAllMocks(); });

describe('combat animation sequencing', () => {
  it('waits for movement, delays impact until the strike, and remains busy through the final fall', () => {
    const queue = new CombatAnimationQueue(), trace: string[] = [];
    let arrived = false;
    const hooks: CombatWalkHooks = {
      startWalk: () => trace.push('walk'), advanceWalk: () => arrived, skipWalk: vi.fn(),
    };
    queue.enqueue({ duration: 0, walk: { id: 'hero', path: [{ x: 1, y: 2 }] } });
    queue.enqueue({ duration: 100, start: () => trace.push('attack'), clips: [
      { id: 'hero', kind: 'attack', duration: 100, direction: { x: 1, y: 0 } },
      { id: 'enemy', kind: 'hit', duration: 40, delay: 50, direction: { x: 1, y: 0 } },
    ], marks: [{ at: 50, fire: () => trace.push('impact') }] });
    queue.enqueue({ duration: 80, start: () => trace.push('fall'), finish: () => trace.push('fallen'),
      clips: [{ id: 'enemy', kind: 'fall', duration: 80, direction: { x: 1, y: 0 } }] });

    queue.tick(0, hooks);
    queue.tick(500, hooks);
    expect(trace).toEqual(['walk']);
    expect(queue.busy).toBe(true);
    arrived = true;
    queue.tick(0, hooks);
    queue.tick(25, hooks);
    expect(trace).toEqual(['walk', 'attack']);
    expect(queue.poseFor('hero')).not.toEqual({});
    expect(queue.poseFor('enemy')).toEqual({});
    expect(queue.poseFor('unrelated')).toEqual({});
    queue.tick(35, hooks);
    expect(trace).toEqual(['walk', 'attack', 'impact']);
    expect(queue.poseFor('enemy').offsetX).toBeGreaterThan(0);
    queue.tick(40, hooks);
    expect(trace).toEqual(['walk', 'attack', 'impact', 'fall']);
    queue.tick(79, hooks);
    expect(queue.busy).toBe(true);
    expect(queue.poseFor('enemy').rotation).toBeGreaterThan(1);
    expect(trace).not.toContain('fallen');
    queue.tick(1, hooks);
    expect(queue.busy).toBe(false);
    expect(trace).toEqual(['walk', 'attack', 'impact', 'fall', 'fallen']);
  });

  it('drains all instant steps in order, places walkers immediately, and fires each lifecycle hook once', () => {
    const queue = new CombatAnimationQueue(), hooks = noopHooks(), trace: string[] = [];
    queue.enqueue({ duration: 0, walk: { id: 'hero', path: [{ x: 1, y: 0 }, { x: 2, y: 0 }] },
      start: instant => trace.push(`walk:${instant}`), finish: instant => trace.push(`arrived:${instant}`) });
    queue.enqueue({ duration: 360, start: instant => trace.push(`attack:${instant}`),
      marks: [{ at: 150, fire: instant => trace.push(`impact:${instant}`) }] });
    queue.enqueue({ duration: 420, clips: [{ id: 'enemy', kind: 'fall', duration: 420, direction: { x: 1, y: 0 } }],
      finish: instant => trace.push(`fallen:${instant}`) });
    queue.tick(0, hooks, true);
    expect(queue.busy).toBe(false);
    expect(queue.poseFor('enemy')).toEqual({});
    expect(hooks.startWalk).not.toHaveBeenCalled();
    expect(hooks.advanceWalk).not.toHaveBeenCalled();
    expect(hooks.skipWalk).toHaveBeenCalledWith('hero', [{ x: 1, y: 0 }, { x: 2, y: 0 }]);
    expect(trace).toEqual(['walk:true', 'arrived:true', 'attack:true', 'impact:true', 'fallen:true']);
    queue.tick(1000, hooks, true);
    expect(trace).toHaveLength(5);
  });

  it('can switch to instant during an active walk without restarting or leaving a wait barrier', () => {
    const queue = new CombatAnimationQueue(), hooks = noopHooks();
    hooks.advanceWalk = vi.fn(() => false);
    const start = vi.fn(), finish = vi.fn(), impact = vi.fn();
    queue.enqueue({ duration: 0, walk: { id: 'hero', path: [{ x: 3, y: 2 }] }, start, finish });
    queue.enqueue({ duration: 200, marks: [{ at: 90, fire: impact }] });
    queue.tick(16, hooks);
    expect(queue.busy).toBe(true);
    queue.tick(0, hooks, true);
    expect(queue.busy).toBe(false);
    expect(start).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledWith(true);
    expect(impact).toHaveBeenCalledTimes(1);
    expect(impact).toHaveBeenCalledWith(true);
    expect(hooks.skipWalk).toHaveBeenCalledTimes(1);
  });

  it('cancels presentation cleanly when a screen is unmounted', () => {
    const queue = new CombatAnimationQueue(), hooks = noopHooks(), finish = vi.fn(), pending = vi.fn();
    queue.enqueue({ duration: 200, finish, clips: [{ id: 'hero', kind: 'cast', duration: 200, direction: { x: 1, y: 0 } }] });
    queue.enqueue({ duration: 100, start: pending });
    queue.tick(50, hooks);
    expect(queue.poseFor('hero')).not.toEqual({});
    queue.clear();
    expect(queue.busy).toBe(false);
    expect(queue.poseFor('hero')).toEqual({});
    queue.tick(1000, hooks);
    expect(finish).not.toHaveBeenCalled();
    expect(pending).not.toHaveBeenCalled();
  });

  it('copies paths for display hooks and does not mutate combat inputs or draw gameplay randomness', () => {
    const queue = new CombatAnimationQueue();
    const combatant = freeze({ id: 'hero', x: 4, y: 2, hp: 9, movement: 3 });
    const step = freeze({ duration: 0, walk: { id: combatant.id, path: [{ x: 4, y: 2 }] } });
    const before = JSON.stringify({ combatant, step }), expectedRandom = seeded(311);
    setRandomSource(seeded(311));
    expect(random()).toBe(expectedRandom());
    vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Presentation must not draw randomness'); });
    const hooks = noopHooks();
    hooks.startWalk = (_id, path) => { path[0].x = 99; path.push({ x: 100, y: 2 }); };
    queue.enqueue(step);
    queue.enqueue(freeze({ duration: 100, clips: [{ id: combatant.id, kind: 'attack' as const, duration: 100, direction: { x: 1, y: 0 } }] }));
    queue.tick(0, hooks);
    for (let i = 0; i < 10; i++) { queue.tick(10, hooks); queue.poseFor(combatant.id); }
    expect(queue.busy).toBe(false);
    expect(JSON.stringify({ combatant, step })).toBe(before);
    expect(random()).toBe(expectedRandom());
  });
});

describe('combat event presentation order', () => {
  it('moves onto a damaging tile before showing that hazard hit and death', () => {
    const hit = damage('hero'), fell = down('hero'), walked = move('hero', 4);
    const input = freeze([hit, { type: 'text' as const, text: 'The hero takes 5 damage.' }, fell, walked]);
    const before = JSON.stringify(input);
    expect(orderPresentationEvents(input)).toEqual([walked, hit, input[1], fell]);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('preserves an opportunity attack between movement segments, then orders a later hazard correctly', () => {
    const firstMove = move('hero', 2), opportunity = { ...attack('hero'), attackerId: 'enemy' } as CombatEvent;
    const weaponHit = damage('hero'), terrainHit = damage('hero'), fell = down('hero'), lastMove = move('hero', 3);
    const input = freeze([firstMove, opportunity, weaponHit, terrainHit, fell, lastMove]);
    expect(orderPresentationEvents(input)).toEqual([firstMove, opportunity, weaponHit, lastMove, terrainHit, fell]);
  });

  it('does not reorder attack damage or area damage as a walking hazard', () => {
    const weapon = freeze([attack(), damage('enemy'), move('enemy', 5)]);
    const area = freeze<CombatEvent[]>([
      { type: 'aoe', tiles: [{ x: 1, y: 2 }], actionId: 'explosion', color: '#ffaa55' },
      damage('hero'), move('hero', 5),
    ]);
    expect(orderPresentationEvents(weapon)).toEqual(weapon);
    expect(orderPresentationEvents(area)).toEqual(area);
  });

  it('preserves forced movement and start/end-turn damage when the victim is not the voluntary mover', () => {
    const forced = freeze([move('victim', 3), damage('victim'), move('victim', 4), damage('victim')]);
    expect(orderPresentationEvents(forced, 'caster')).toEqual(forced);
    const turnEnd = freeze([damage('hero'), down('hero'), move('hero', 4)]);
    expect(orderPresentationEvents(turnEnd, null)).toEqual(turnEnd);
  });
});
