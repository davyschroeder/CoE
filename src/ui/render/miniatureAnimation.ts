import { COMBAT_WALK_MS } from './motion';

/** Presentation offsets in tile-width units; rotation is in radians about the feet. */
export interface MiniaturePose {
  offsetX?: number;
  offsetY?: number;
  lift?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  alpha?: number;
  glow?: { color: string; strength: number };
}

export interface MiniatureDirection { x: number; y: number; }
export interface MiniatureMotionOptions {
  reducedMotion?: boolean;
  instant?: boolean;
  moving?: boolean;
  color?: string;
}
export type MiniatureAction = 'attack' | 'cast' | 'dodge' | 'hit' | 'fall';

const ACTION_MS: Record<MiniatureAction, number> = {
  attack: 360, cast: 540, dodge: 260, hit: 220, fall: 420,
};
const clamp01 = (n: number): number => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const smooth = (n: number): number => { const t = clamp01(n); return t * t * (3 - 2 * t); };

function directionUnit(direction: MiniatureDirection): MiniatureDirection {
  const x = Number.isFinite(direction.x) ? direction.x : 0;
  const y = Number.isFinite(direction.y) ? direction.y : 0;
  const length = Math.hypot(x, y);
  return length > 1e-8 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

/** Reuses the chosen combat pace without changing the movement clock or game state. */
export function actionDuration(kind: MiniatureAction, cpuSpeed: string, reducedMotion = false): number {
  const pace = COMBAT_WALK_MS[cpuSpeed] ?? COMBAT_WALK_MS.normal;
  if (pace === 0) return 0;
  const duration = ACTION_MS[kind] * pace / COMBAT_WALK_MS.normal;
  return Math.round(reducedMotion ? Math.min(140, duration * .45) : duration);
}

/** One gentle footfall per travelled tile; standing still never advances the gait. */
export function walkPose(distanceInTiles: number, direction: MiniatureDirection, options: MiniatureMotionOptions = {}): MiniaturePose {
  if (options.moving === false || options.instant || options.reducedMotion || !Number.isFinite(distanceInTiles)) return {};
  const d = directionUnit(direction);
  if (!d.x && !d.y) return {};
  const stride = Math.sin(Math.PI * (Math.max(0, distanceInTiles) % 2));
  const rise = Math.abs(stride);
  return {
    offsetX: -d.y * stride * .012,
    offsetY: d.x * stride * .003,
    lift: rise * .025,
    rotation: stride * .035 + d.x * rise * .015,
    scaleX: 1 + rise * .01,
    scaleY: 1 - rise * .012,
  };
}

/** The resting pose is a static state, including when animation speed is instant. */
export function fallenPose(direction = 1): MiniaturePose {
  const side = direction < 0 ? -1 : 1;
  return { offsetX: -side * .08, offsetY: .08, rotation: side * 1.32, scaleX: .96, scaleY: .55, alpha: .78 };
}

function subdued(pose: MiniaturePose): MiniaturePose {
  return {
    ...pose,
    offsetX: (pose.offsetX ?? 0) * .12,
    offsetY: (pose.offsetY ?? 0) * .12,
    lift: 0,
    rotation: (pose.rotation ?? 0) * .12,
    scaleX: 1 + ((pose.scaleX ?? 1) - 1) * .18,
    scaleY: 1 + ((pose.scaleY ?? 1) - 1) * .18,
    glow: pose.glow ? { ...pose.glow, strength: pose.glow.strength * .6 } : undefined,
  };
}

/**
 * Attack points toward the target; hit points away from the attacker. Dodge steps
 * perpendicular to the supplied attack direction. All inputs are presentation data.
 */
export function actionPose(kind: MiniatureAction, progress: number, direction: MiniatureDirection, options: MiniatureMotionOptions = {}): MiniaturePose {
  const p = clamp01(progress), d = directionUnit(direction);
  if (options.instant || p >= 1) return kind === 'fall' ? fallenPose(d.x) : {};
  if (p <= 0) return {};
  if (kind === 'fall') {
    const rest = fallenPose(d.x);
    // Reduced motion fades into the resting silhouette instead of sweeping it across the board.
    if (options.reducedMotion) return p < .5 ? { alpha: 1 - p * 1.1 } : { ...rest, alpha: .45 + (p - .5) * .66 };
    const t = 1 - Math.pow(1 - p, 3);
    return {
      offsetX: rest.offsetX! * t,
      offsetY: rest.offsetY! * t,
      rotation: rest.rotation! * t,
      scaleX: 1 + (rest.scaleX! - 1) * t,
      scaleY: 1 + (rest.scaleY! - 1) * t,
      alpha: 1 + (rest.alpha! - 1) * t,
    };
  }
  const pulse = Math.sin(Math.PI * p);
  let pose: MiniaturePose;
  switch (kind) {
    case 'attack': {
      const thrust = p < .18 ? -.035 * smooth(p / .18)
        : p < .42 ? -.035 + .215 * smooth((p - .18) / .24)
        : .18 * (1 - smooth((p - .42) / .58));
      pose = { offsetX: d.x * thrust, offsetY: d.y * thrust, lift: pulse * .012, rotation: d.x * thrust * .53, scaleX: 1 + pulse * .018, scaleY: 1 - pulse * .012 };
      break;
    }
    case 'cast':
      pose = { lift: pulse * .045, rotation: d.x * pulse * .025, scaleX: 1 - pulse * .015, scaleY: 1 + pulse * .025, glow: { color: options.color ?? '#a6c9ff', strength: Math.pow(pulse, .75) } };
      break;
    case 'dodge':
      pose = { offsetX: -d.y * pulse * .15, offsetY: (d.x || 1) * pulse * .08, lift: pulse * .022, rotation: -d.y * pulse * .10, scaleX: 1 - pulse * .035, scaleY: 1 - pulse * .025 };
      break;
    case 'hit': {
      const recoil = Math.sin(Math.PI * Math.min(1, p / .78));
      pose = { offsetX: d.x * recoil * .11, offsetY: d.y * recoil * .11, rotation: d.x * recoil * .12, scaleY: 1 - recoil * .035, alpha: 1 - recoil * .12, glow: { color: options.color ?? '#efb1a0', strength: recoil * .35 } };
      break;
    }
  }
  return options.reducedMotion ? subdued(pose) : pose;
}

/** Compose independent gait and action layers without altering either input. */
export function combinePoses(...poses: (MiniaturePose | null | undefined)[]): MiniaturePose {
  const result: MiniaturePose = {};
  for (const pose of poses) {
    if (!pose) continue;
    for (const key of ['offsetX', 'offsetY', 'lift', 'rotation'] as const) {
      const value = pose[key];
      if (value !== undefined && Number.isFinite(value)) result[key] = (result[key] ?? 0) + value;
    }
    for (const key of ['scaleX', 'scaleY', 'alpha'] as const) {
      const value = pose[key];
      if (value !== undefined && Number.isFinite(value)) result[key] = (result[key] ?? 1) * value;
    }
    if (pose.glow && Number.isFinite(pose.glow.strength) && pose.glow.strength > (result.glow?.strength ?? 0)) result.glow = { color: pose.glow.color, strength: clamp01(pose.glow.strength) };
  }
  if (result.alpha !== undefined) result.alpha = clamp01(result.alpha);
  return result;
}
