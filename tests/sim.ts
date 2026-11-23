import { Combat } from '../src/engine/combat/combat';
import { aiStep } from '../src/engine/combat/ai';
import type { GameState } from '../src/engine/types';
import { ENCOUNTER_BY_ID } from '../src/data/encounters';
import { getMap, isPassable } from '../src/engine/exploration';

/** Place the party at a sensible spot near the encounter (first enemy) for standalone simulations. */
export function stageFor(s: GameState, encounterId: string): void {
  const enc = ENCOUNTER_BY_ID[encounterId];
  const m = getMap(enc.map);
  s.location.mapId = enc.map;
  if (enc.relative) { s.location.x = 25; s.location.y = 20; return; }
  const e = enc.enemies[0];
  for (let r = 5; r < 12; r++) for (const [dx, dy] of [[0, r], [0, -r], [r, 0], [-r, 0], [r, r], [-r, r]]) {
    if (isPassable(s, m, e.x + dx, e.y + dy)) { s.location.x = e.x + dx; s.location.y = e.y + dy; return; }
  }
}

export interface SimResult { result: 'victory' | 'defeat' | 'fled' | 'timeout'; rounds: number; illegal: string[]; }

/** Run a fight to completion with the AI controlling every side (the player too). */
export function simulate(s: GameState, encounterId: string, maxRounds = 40): SimResult {
  const cb = new Combat(s, encounterId);
  const illegal: string[] = [];
  const orig = cb.perform.bind(cb);
  cb.perform = (c, id, t, o) => {
    try { return orig(c, id, t, o); } catch (e: any) { illegal.push(`${c.char.name}:${id}:${e.message}`); throw e; }
  };
  let guard = 0;
  while (!cb.over && cb.round <= maxRounds && guard++ < 5000) {
    const c = cb.current();
    for (let i = 0; i < 14 && !cb.over && c.char.hp > 0; i++) { if (!aiStep(cb, c)) break; }
    if (!cb.over) cb.endTurn();
    // invariants
    for (const x of cb.combatants) {
      if (x.char.hp > x.char.maxHp) illegal.push(`${x.char.name} hp above max`);
      if (x.char.hp < 0) illegal.push(`${x.char.name} negative hp`);
    }
  }
  return { result: cb.over ?? 'timeout', rounds: cb.round, illegal };
}
