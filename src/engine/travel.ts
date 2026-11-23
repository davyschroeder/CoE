import { ACT1 } from '../data/act1/index';
import type { TravelEvent } from '../data/act1/module';
import type { GameState } from './types';
import { evalCond } from './conditions';
import { advanceTime } from './state';
import { random } from '../core/rng';

/** Overland travel between regions: time passes and, sometimes, the road has something to say. */
export const TRAVEL_HOURS: Record<string, Record<string, number>> = {
  hollowmere: { woods: 3, ashenford: 8, valdros: 9 },
  woods: { valdros: 6, ashenford: 8 },
  ashenford: { valdros: 12 },
};

export function travelHours(from: string, to: string): number {
  return TRAVEL_HOURS[from]?.[to] ?? TRAVEL_HOURS[to]?.[from] ?? 2;
}

export function rollTravelEvent(s: GameState, from: string, to: string, events: TravelEvent[] = ACT1.travel): TravelEvent | null {
  advanceTime(s, travelHours(from, to) * 60);
  if (from === to || travelHours(from, to) < 3) return null;
  if (random() > 0.4) return null;
  const eligible = events.filter((e) => (!e.once || !s.flags[`travel_${e.id}`]) && (() => { try { return evalCond(s, e.if); } catch { return false; } })());
  const total = eligible.reduce((a, e) => a + e.weight, 0);
  if (!total) return null;
  let r = random() * total;
  const ev = eligible.find((e) => (r -= e.weight) <= 0) ?? eligible[0];
  if (ev.once) s.flags[`travel_${ev.id}`] = true;
  return ev;
}
