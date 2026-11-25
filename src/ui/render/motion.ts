/** Walking pace of miniatures on the boards (exploration and combat). */

/** Milliseconds a miniature takes to walk one tile in exploration (and in combat at normal CPU speed). */
export const WALK_MS_PER_TILE = 320;

/** Combat pace per CPU-speed setting; `instant` skips the animation. */
export const COMBAT_WALK_MS: Record<string, number> = { slow: 440, normal: WALK_MS_PER_TILE, fast: 190, instant: 0 };

/**
 * Move a displayed position toward a tile at a steady walking pace. Distance is measured like the rules
 * do (a diagonal step is one tile), so every step takes the same time. Returns true once it has arrived.
 */
export function walkToward(p: { x: number; y: number }, tx: number, ty: number, dt: number, msPerTile = WALK_MS_PER_TILE): boolean {
  const dx = tx - p.x, dy = ty - p.y;
  const dist = Math.max(Math.abs(dx), Math.abs(dy));
  const step = msPerTile > 0 ? dt / msPerTile : Infinity;
  if (dist <= step || dist < 1e-3) { p.x = tx; p.y = ty; return true; }
  p.x += (dx / dist) * step; p.y += (dy / dist) * step;
  return false;
}
