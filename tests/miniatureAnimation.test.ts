import { afterEach, describe, expect, it, vi } from 'vitest';
import { random, seeded, setRandomSource } from '../src/core/rng';
import {
  actionDuration, actionPose, combinePoses, fallenPose, walkPose,
  type MiniatureAction, type MiniaturePose,
} from '../src/ui/render/miniatureAnimation';

const actions: MiniatureAction[] = ['attack', 'cast', 'dodge', 'hit', 'fall'];
const transientActions: MiniatureAction[] = ['attack', 'cast', 'dodge', 'hit'];
const direction = Object.freeze({ x: 0.8, y: 0.6 });
const neutral = { offsetX: 0, offsetY: 0, lift: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1, glow: 0 };
const normalized = (p: MiniaturePose) => ({
  offsetX: p.offsetX ?? 0, offsetY: p.offsetY ?? 0, lift: p.lift ?? 0,
  rotation: p.rotation ?? 0, scaleX: p.scaleX ?? 1, scaleY: p.scaleY ?? 1,
  alpha: p.alpha ?? 1, glow: p.glow?.strength ?? 0,
});

afterEach(() => { setRandomSource(null); vi.restoreAllMocks(); });

describe('miniature presentation poses', () => {
  it('gait follows travelled distance, alternates footfalls, and settles immediately when movement stops', () => {
    const first = walkPose(0.5, { x: 1, y: 0 });
    const second = walkPose(1.5, { x: 1, y: 0 });
    expect(first.lift).toBeGreaterThan(0);
    expect(first.rotation).toBeGreaterThan(0);
    expect(second.rotation).toBeLessThan(0);
    expect(walkPose(0.5, { x: 1, y: 0 })).toEqual(first);
    expect(normalized(walkPose(0.5, direction, { moving: false }))).toEqual(neutral);
    expect(normalized(walkPose(0.5, direction, { instant: true }))).toEqual(neutral);
    expect(normalized(walkPose(0.5, direction, { reducedMotion: true }))).toEqual(neutral);
  });

  it.each(actions)('%s respects every CPU speed and reduced-motion duration', kind => {
    const slow = actionDuration(kind, 'slow'), normal = actionDuration(kind, 'normal'), fast = actionDuration(kind, 'fast');
    expect(slow).toBeGreaterThan(normal);
    expect(normal).toBeGreaterThan(fast);
    expect(fast).toBeGreaterThan(0);
    expect(actionDuration(kind, 'instant')).toBe(0);
    expect(actionDuration(kind, 'instant', true)).toBe(0);
    for (const speed of ['slow', 'normal', 'fast']) {
      expect(actionDuration(kind, speed, true)).toBeGreaterThan(0);
      expect(actionDuration(kind, speed, true)).toBeLessThanOrEqual(140);
      expect(actionDuration(kind, speed, true)).toBeLessThan(actionDuration(kind, speed));
    }
  });

  it.each(transientActions)('%s returns to a neutral pose and has no transition in instant mode', kind => {
    expect(normalized(actionPose(kind, 0, direction))).toEqual(neutral);
    expect(normalized(actionPose(kind, 0.4, direction))).not.toEqual(neutral);
    expect(normalized(actionPose(kind, 1, direction))).toEqual(neutral);
    expect(normalized(actionPose(kind, 2, direction))).toEqual(neutral);
    for (const progress of [0, 0.3, 0.8, 1]) expect(normalized(actionPose(kind, progress, direction, { instant: true }))).toEqual(neutral);
  });

  it('fall ends in a persistent resting silhouette, including instant and reduced motion', () => {
    for (const side of [-1, 1]) {
      const dir = { x: side, y: 0 }, resting = fallenPose(side);
      expect(actionPose('fall', 1, dir)).toEqual(resting);
      expect(actionPose('fall', 8, dir)).toEqual(resting);
      expect(actionPose('fall', 1, dir, { reducedMotion: true })).toEqual(resting);
      expect(actionPose('fall', 0.1, dir, { instant: true })).toEqual(resting);
      expect(Math.abs(resting.rotation!)).toBeGreaterThan(1);
      expect(resting.alpha).toBeGreaterThan(0);
      expect(resting.scaleY).toBeGreaterThan(0);
    }
  });

  it('reduced motion suppresses gait and makes transient action displacement smaller', () => {
    for (const kind of transientActions) for (const progress of [0.2, 0.4, 0.6, 0.8]) {
      const normal = normalized(actionPose(kind, progress, direction));
      const reduced = normalized(actionPose(kind, progress, direction, { reducedMotion: true }));
      expect(Math.abs(reduced.offsetX)).toBeLessThanOrEqual(Math.abs(normal.offsetX));
      expect(Math.abs(reduced.offsetY)).toBeLessThanOrEqual(Math.abs(normal.offsetY));
      expect(Math.abs(reduced.rotation)).toBeLessThanOrEqual(Math.abs(normal.rotation));
      expect(reduced.lift).toBe(0);
      expect(reduced.glow).toBeLessThanOrEqual(normal.glow);
    }
  });

  it('mirrors directional attack and hit reactions without moving the logical tile', () => {
    for (const kind of ['attack', 'hit'] as const) {
      const right = actionPose(kind, 0.4, { x: 1, y: 0 });
      const left = actionPose(kind, 0.4, { x: -1, y: 0 });
      expect(right.offsetX).toBeGreaterThan(0);
      expect(left.offsetX).toBeCloseTo(-right.offsetX!);
      expect(left.rotation).toBeCloseTo(-right.rotation!);
    }
  });

  it('composes gait and action layers without changing their input poses', () => {
    const gait = Object.freeze({ offsetX: 0.04, lift: 0.03, rotation: 0.02, scaleY: 0.98 });
    const hit = Object.freeze({ offsetX: 0.1, rotation: -0.08, scaleY: 0.9, alpha: 0.8, glow: Object.freeze({ color: '#ffffff', strength: 0.3 }) });
    const combined = combinePoses(gait, hit, { alpha: 0.5 });
    expect(combined.offsetX).toBeCloseTo(0.14);
    expect(combined.lift).toBe(0.03);
    expect(combined.rotation).toBeCloseTo(-0.06);
    expect(combined.scaleY).toBeCloseTo(0.882);
    expect(combined.alpha).toBeCloseTo(0.4);
    expect(combined.glow).not.toBe(hit.glow);
    expect(gait).toEqual({ offsetX: 0.04, lift: 0.03, rotation: 0.02, scaleY: 0.98 });
  });

  it('keeps engine inputs and the gameplay RNG sequence unchanged during repeated sampling', () => {
    const enginePoint = Object.freeze({ x: 4, y: 2, hp: 17, movement: 3 });
    const options = Object.freeze({ reducedMotion: false, color: '#bb88ee' });
    const before = JSON.stringify(enginePoint), expectedRandom = seeded(842);
    setRandomSource(seeded(842));
    expect(random()).toBe(expectedRandom());
    vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Presentation must not draw randomness'); });
    for (const kind of actions) for (const progress of [-1, 0, 0.25, 0.5, 0.75, 1, 3]) {
      const pose = combinePoses(walkPose(progress, enginePoint), actionPose(kind, progress, enginePoint, options));
      for (const value of Object.values(normalized(pose))) expect(Number.isFinite(value)).toBe(true);
    }
    expect(JSON.stringify(enginePoint)).toBe(before);
    expect(random()).toBe(expectedRandom());
  });
});
