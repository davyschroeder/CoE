/**
 * Random number source. All dice in the game go through this module.
 * In play it uses crypto-quality randomness; tests can install a seeded generator.
 */
export type RandomFn = () => number; // returns [0, 1)

function cryptoRandom(): number {
  const g = globalThis as any;
  if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    g.crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return Math.random();
}

let source: RandomFn = cryptoRandom;

export function random(): number {
  return source();
}

/** Integer in [min, max] inclusive. */
export function randInt(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

export function chance(p: number): boolean {
  return random() < p;
}

/** Mulberry32 — small deterministic PRNG for tests and reproducible procedural content. */
export function seeded(seed: number): RandomFn {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function setRandomSource(fn: RandomFn | null): void {
  source = fn ?? cryptoRandom;
}

/** Force a queue of specific values (each in [0,1)) — used by unit tests. */
export function queueRandom(values: number[]): void {
  const q = [...values];
  const fallback = source;
  source = () => (q.length ? q.shift()! : fallback());
}
