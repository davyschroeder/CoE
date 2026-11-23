import { randInt } from './rng';

export const DIE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
export type DieSides = (typeof DIE_SIDES)[number];

export function rollDie(sides: number): number {
  return randInt(1, sides);
}

export interface DiceTerm { count: number; sides: number; }
export interface DiceExpr { terms: DiceTerm[]; bonus: number; }

/** Parse expressions like "2d6+3", "1d8", "d20-1", "3". */
export function parseDice(expr: string): DiceExpr {
  const clean = expr.replace(/\s+/g, '').toLowerCase();
  if (!clean) return { terms: [], bonus: 0 };
  const parts = clean.match(/[+-]?[^+-]+/g) ?? [];
  const out: DiceExpr = { terms: [], bonus: 0 };
  for (const p of parts) {
    const sign = p.startsWith('-') ? -1 : 1;
    const body = p.replace(/^[+-]/, '');
    const m = body.match(/^(\d*)d(\d+)$/);
    if (m) {
      const count = (m[1] ? parseInt(m[1], 10) : 1) * sign;
      out.terms.push({ count, sides: parseInt(m[2], 10) });
    } else if (/^\d+$/.test(body)) {
      out.bonus += sign * parseInt(body, 10);
    } else {
      throw new Error(`Invalid dice expression: ${expr}`);
    }
  }
  return out;
}

export interface DiceRollResult {
  expr: string;
  rolls: { sides: number; value: number }[];
  bonus: number;
  total: number;
}

/** Roll a dice expression. `doubleDice` doubles the number of dice (critical hits). */
export function rollDice(expr: string, doubleDice = false): DiceRollResult {
  const parsed = parseDice(expr);
  const rolls: { sides: number; value: number }[] = [];
  let total = parsed.bonus;
  for (const t of parsed.terms) {
    const n = Math.abs(t.count) * (doubleDice ? 2 : 1);
    const sign = t.count < 0 ? -1 : 1;
    for (let i = 0; i < n; i++) {
      const v = rollDie(t.sides);
      rolls.push({ sides: t.sides, value: v * sign });
      total += v * sign;
    }
  }
  return { expr, rolls, bonus: parsed.bonus, total: Math.max(0, total) };
}

export function averageDice(expr: string): number {
  const p = parseDice(expr);
  return p.terms.reduce((s, t) => s + t.count * (t.sides + 1) / 2, p.bonus);
}

export function maxDice(expr: string): number {
  const p = parseDice(expr);
  return p.terms.reduce((s, t) => s + t.count * t.sides, p.bonus);
}

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

/** Combine sources of advantage/disadvantage: any of each cancels out (5e rule). */
export function resolveMode(adv: number, dis: number): RollMode {
  if (adv > 0 && dis > 0) return 'normal';
  if (adv > 0) return 'advantage';
  if (dis > 0) return 'disadvantage';
  return 'normal';
}

export interface D20Result {
  natural: number;     // the d20 face that counts
  rolls: number[];     // one or two faces
  mode: RollMode;
}

export function rollD20(mode: RollMode = 'normal'): D20Result {
  const a = rollDie(20);
  if (mode === 'normal') return { natural: a, rolls: [a], mode };
  const b = rollDie(20);
  const natural = mode === 'advantage' ? Math.max(a, b) : Math.min(a, b);
  return { natural, rolls: [a, b], mode };
}
