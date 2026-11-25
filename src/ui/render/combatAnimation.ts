import type { CombatEvent } from '../../engine/combat/combat';
import { actionPose, combinePoses, type MiniatureAction, type MiniatureDirection, type MiniaturePose } from './miniatureAnimation';

export interface CombatClip {
  id: string;
  kind: MiniatureAction;
  duration: number;
  delay?: number;
  direction: MiniatureDirection;
  color?: string;
}
export interface CombatAnimationStep {
  duration: number;
  clips?: CombatClip[];
  walk?: { id: string; path: { x: number; y: number }[] };
  start?: (instant: boolean) => void;
  finish?: (instant: boolean) => void;
  marks?: { at: number; fire: (instant: boolean) => void }[];
}
export interface CombatWalkHooks {
  startWalk: (id: string, path: { x: number; y: number }[]) => void;
  advanceWalk: (id: string, dt: number) => boolean;
  skipWalk: (id: string, path: { x: number; y: number }[]) => void;
}

/** A presentation clock. It owns no combatants, rules state, random source, or timers. */
export class CombatAnimationQueue {
  private steps: CombatAnimationStep[] = [];
  private active: CombatAnimationStep | null = null;
  private elapsed = 0;
  private fired = new Set<number>();

  get busy(): boolean { return !!this.active || this.steps.length > 0; }

  enqueue(step: CombatAnimationStep): void { this.steps.push(step); }

  tick(dt: number, hooks: CombatWalkHooks, instant = false): void {
    let remaining = Math.max(0, Number.isFinite(dt) ? dt : 0);
    while (this.busy) {
      if (!this.active) {
        this.active = this.steps.shift()!;
        this.elapsed = 0; this.fired.clear();
        this.active.start?.(instant);
        if (this.active.walk && !instant) hooks.startWalk(this.active.walk.id, this.active.walk.path.map(p => ({ ...p })));
      }
      const step = this.active;
      if (instant && step.walk) hooks.skipWalk(step.walk.id, step.walk.path.map(p => ({ ...p })));
      const walking = step.walk && !instant && !hooks.advanceWalk(step.walk.id, remaining);
      if (!step.walk) this.elapsed = instant ? step.duration : Math.min(step.duration, this.elapsed + remaining);
      for (let i = 0; i < (step.marks?.length ?? 0); i++) {
        if (!this.fired.has(i) && (instant || step.marks![i].at <= this.elapsed)) {
          this.fired.add(i); step.marks![i].fire(instant);
        }
      }
      if (walking || (!instant && !step.walk && this.elapsed < step.duration)) return;
      step.finish?.(instant);
      this.active = null;
      // A completed step never spends the same frame time on the following step.
      remaining = 0;
    }
  }

  poseFor(id: string, reducedMotion = false): MiniaturePose {
    return combinePoses(...(this.active?.clips ?? []).filter(c => c.id === id && this.elapsed >= (c.delay ?? 0)).map(c =>
      actionPose(c.kind, c.duration > 0 ? (this.elapsed - (c.delay ?? 0)) / c.duration : 1, c.direction, { reducedMotion, color: c.color })));
  }

  clear(): void { this.steps = []; this.active = null; this.elapsed = 0; this.fired.clear(); }
}

/**
 * moveAlong emits its last path segment after any terrain damage it caused.
 * Move that segment before its unpaired hazard feedback. Attack/AoE damage stays
 * attached to the preceding action, preserving opportunity attacks and shoves.
 * The engine's event objects and path arrays remain untouched.
 */
export function orderPresentationEvents(events: readonly CombatEvent[], voluntaryMoverId?: string | null): CombatEvent[] {
  if (voluntaryMoverId === null) return [...events];
  const out: CombatEvent[] = [];
  const hazards = new Map<string, CombatEvent>();
  let attackTarget: string | null = null;
  let areaOrSpell = false;
  for (const event of events) {
    if (event.type === 'attack') { attackTarget = event.targetId; areaOrSpell = false; hazards.clear(); }
    else if (event.type === 'aoe' || (event.type === 'text' && event.text.includes(' casts '))) {
      attackTarget = null; areaOrSpell = true; hazards.clear();
    } else if (event.type === 'damage') {
      if (attackTarget === event.targetId) attackTarget = null;
      else if (!areaOrSpell && !hazards.has(event.targetId)) hazards.set(event.targetId, event);
    }
    if (event.type === 'move') {
      const hazard = voluntaryMoverId === undefined || voluntaryMoverId === event.id ? hazards.get(event.id) : undefined;
      const at = hazard ? out.indexOf(hazard) : -1;
      if (at >= 0) out.splice(at, 0, event); else out.push(event);
      hazards.delete(event.id); attackTarget = null; areaOrSpell = false;
    } else out.push(event);
  }
  return out;
}
