import { describe, it, expect, afterEach } from 'vitest';
import { parseDice, rollDice, rollD20, resolveMode, averageDice, maxDice } from '../src/core/dice';
import { setRandomSource, seeded, queueRandom } from '../src/core/rng';

afterEach(() => setRandomSource(null));

describe('dice', () => {
  it('parses expressions', () => {
    expect(parseDice('2d6+3')).toEqual({ terms: [{ count: 2, sides: 6 }], bonus: 3 });
    expect(parseDice('d20-1')).toEqual({ terms: [{ count: 1, sides: 20 }], bonus: -1 });
    expect(parseDice('1d4+1d6+2').terms.length).toBe(2);
    expect(() => parseDice('2x6')).toThrow();
  });
  it('rolls within bounds for every die type', () => {
    setRandomSource(seeded(42));
    for (const sides of [4, 6, 8, 10, 12, 20, 100]) {
      for (let i = 0; i < 500; i++) {
        const r = rollDice(`1d${sides}`).total;
        expect(r).toBeGreaterThanOrEqual(1);
        expect(r).toBeLessThanOrEqual(sides);
      }
    }
  });
  it('doubles dice on critical hits', () => {
    expect(rollDice('2d6', true).rolls.length).toBe(4);
  });
  it('averages and maxima', () => {
    expect(averageDice('2d6+3')).toBe(10);
    expect(maxDice('1d8+2')).toBe(10);
  });
  it('advantage takes the higher, disadvantage the lower', () => {
    queueRandom([0.0, 0.95]); // 1 and 20
    expect(rollD20('advantage').natural).toBe(20);
    queueRandom([0.0, 0.95]);
    expect(rollD20('disadvantage').natural).toBe(1);
  });
  it('advantage and disadvantage cancel', () => {
    expect(resolveMode(2, 1)).toBe('normal');
    expect(resolveMode(1, 0)).toBe('advantage');
    expect(resolveMode(0, 3)).toBe('disadvantage');
  });
  it('is roughly uniform', () => {
    setRandomSource(seeded(7));
    const counts = new Array(21).fill(0);
    for (let i = 0; i < 20000; i++) counts[rollD20().natural]++;
    for (let f = 1; f <= 20; f++) expect(counts[f]).toBeGreaterThan(800);
  });
});
