/**
 * End-to-end acceptance test: plays the whole prologue through the real engine — dialogue sessions,
 * skill checks, companion reactions, tactical combat (AI controls everyone), quest updates,
 * map travel, looting — and finally saves and reloads the game.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { setRandomSource } from '../src/core/rng';
import { serialize, deserialize, makeMeta } from '../src/engine/save';
import { playPrologue } from './playthrough';

afterEach(() => setRandomSource(null));

describe('prologue playthrough', () => {
  it('can be completed from character creation to Act I, and survives save/load', () => {
    const H = playPrologue();
    const s = H.s;

    // ── Save / load preserves every consequence
    const text = serialize(s, makeMeta(s, 'slot1', false));
    const loaded = deserialize(text);
    expect(loaded.flags).toEqual(s.flags);
    expect(loaded.quests).toEqual(s.quests);
    expect(loaded.party.map((c) => c.level)).toEqual(s.party.map((c) => c.level));
    expect(loaded.companions).toEqual(s.companions);
    expect(loaded.chapter).toBe('act1');
  }, 120000);
});
