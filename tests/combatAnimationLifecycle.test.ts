import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { settings, updateSettings } from '../src/core/settings';
import { CombatScreen } from '../src/ui/screens/combat';
import { CombatAnimationQueue } from '../src/ui/render/combatAnimation';
import { actionDuration } from '../src/ui/render/miniatureAnimation';
import { createIsoView, isoPoint } from '../src/ui/render/isometric';

let priorSpeed = settings().cpuSpeed;

beforeEach(() => {
  priorSpeed = settings().cpuSpeed;
  updateSettings({ cpuSpeed: 'normal' });
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  vi.stubGlobal('document', { hidden: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  updateSettings({ cpuSpeed: priorSpeed });
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// Like the targeting regression tests, exercise real screen methods through a
// small prototype fixture. No canvas or RAF is provided: the wait clock must work
// even if drawing is suspended, without mutating the engine's final result.
function finalFallScreen(duration: number) {
  const screen = Object.create(CombatScreen.prototype) as any;
  const actor = Object.freeze({ id: 'hero', x: 2, y: 3, char: Object.freeze({ hp: 0 }) });
  Object.assign(screen, {
    app: { state: Object.freeze({ gold: 17 }) },
    cb: Object.freeze({ over: 'defeat', encounter: Object.freeze({ nonlethal: false }), combatants: Object.freeze([actor]) }),
    animations: new CombatAnimationQueue(),
    disp: new Map([['hero', { x: 2, y: 3, queue: [] }]]),
    walkHooks: { startWalk: vi.fn(), advanceWalk: vi.fn(() => true), skipWalk: vi.fn() },
    waits: new Set(), disposed: false, done: false, presentationTime: 0, raf: 0,
    fallen: new Set(), retained: new Set(), fallDirection: new Map(),
    floats: [], flashes: [], strikes: [], onDone: vi.fn(),
  });
  const landed = vi.fn();
  screen.animations.enqueue({ duration, finish: landed,
    clips: [{ id: 'hero', kind: 'fall', duration, direction: { x: 1, y: 0 } }] });
  return { screen, landed, actor };
}

describe('combat final-animation lifecycle', () => {
  it('waits for the last fall before resolving defeat, even without a rendered frame', async () => {
    const { screen, landed, actor } = finalFallScreen(actionDuration('fall', 'normal'));
    const finished = screen.finish();
    await vi.advanceTimersByTimeAsync(160);
    expect(screen.animations.busy).toBe(true);
    expect(landed).not.toHaveBeenCalled();
    expect(screen.onDone).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(500);
    await finished;
    expect(landed).toHaveBeenCalledTimes(1);
    expect(screen.onDone).toHaveBeenCalledWith('defeat');
    expect(screen.done).toBe(true);
    expect(screen.waits.size).toBe(0);
    expect(actor).toEqual({ id: 'hero', x: 2, y: 3, char: { hp: 0 } });
    expect(screen.app.state).toEqual({ gold: 17 });
  });

  it('resolves an instant final action without waiting for an animation frame', async () => {
    updateSettings({ cpuSpeed: 'instant' });
    // Even a previously queued normal-speed fall must drain after the setting changes.
    const { screen, landed } = finalFallScreen(actionDuration('fall', 'normal'));
    const finished = screen.finish();
    expect(screen.animations.busy).toBe(false);
    expect(landed).toHaveBeenCalledWith(true);
    await vi.advanceTimersByTimeAsync(1);
    await finished;
    expect(screen.onDone).toHaveBeenCalledTimes(1);
    expect(screen.waits.size).toBe(0);
  });

  it('locks player input during a brief reduced-motion action and unlocks only after it finishes', async () => {
    const duration = actionDuration('attack', 'slow', true);
    const { screen } = finalFallScreen(duration);
    const player = Object.freeze({ id: 'hero', x: 2, y: 3, char: Object.freeze({ kind: 'player', hp: 9 }) });
    screen.cb = Object.freeze({ over: null, current: () => player, combatants: Object.freeze([player]) });
    screen.running = false;
    screen.animations.clear();
    screen.animations.enqueue({ duration, clips: [{ id: 'hero', kind: 'attack', duration, direction: { x: 1, y: 0 } }] });
    expect(screen.isPlayerTurn()).toBe(false);
    const finished = screen.waitAnim();
    await vi.advanceTimersByTimeAsync(48);
    expect(screen.isPlayerTurn()).toBe(false);
    expect(screen.animations.busy).toBe(true);
    await vi.advanceTimersByTimeAsync(160);
    await finished;
    expect(screen.animations.busy).toBe(false);
    expect(screen.isPlayerTurn()).toBe(true);
    expect(player.char.hp).toBe(9);
  });

  it('unmount cancels pending waits and prevents a late battle result callback', async () => {
    const { screen, landed } = finalFallScreen(actionDuration('fall', 'normal'));
    const finished = screen.finish();
    await vi.advanceTimersByTimeAsync(32);
    screen.unmount();
    await finished;
    await vi.advanceTimersByTimeAsync(1000);
    expect(screen.animations.busy).toBe(false);
    expect(screen.waits.size).toBe(0);
    expect(screen.onDone).not.toHaveBeenCalled();
    expect(landed).not.toHaveBeenCalled();
  });
});

describe('fallen miniature targeting', () => {
  it.each([-1, 1])('keeps the sideways body targetable for healing when falling toward side %s', side => {
    const screen = Object.create(CombatScreen.prototype) as any;
    const fallen = { id: 'fallen', x: 12, y: 8, side: 'party', removed: false, char: { hp: 0, creatureType: 'humanoid' } };
    Object.assign(screen, {
      canvas: { getBoundingClientRect: () => ({ left: 17, top: 23 }) },
      ts: 72, view: createIsoView(1440, 900, 12, 8, 72),
      disp: new Map(), fallen: new Set(['fallen']), fallDirection: new Map([['fallen', side]]),
      selected: { target: 'ally' }, cb: { combatants: [fallen], objects: [], tileChar: () => '.' },
    });
    const feet = isoPoint(fallen.x, fallen.y, screen.view);
    // This visible part of the resting body extends outside the standing hitbox
    // and projects onto a neighbouring floor tile, so ordinary tile picking fails.
    const click = { clientX: feet.x + side * screen.ts * 0.4 + 17, clientY: feet.y + screen.ts * 0.06 + 23 } as MouseEvent;
    expect(screen.toTile(click)).toEqual({ x: 12, y: 8 });
    screen.selected = { target: 'point' };
    expect(screen.toTile(click)).not.toEqual({ x: 12, y: 8 });
  });
});
