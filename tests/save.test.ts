import { describe, it, expect } from 'vitest';
import { serialize, deserialize, makeMeta, saveGame, loadGame, listSaves, validateState, migrate, type Storage } from '../src/engine/save';
import { SAVE_VERSION } from '../src/engine/state';
import { makeGame } from './helpers';

class MemStore implements Storage {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

describe('save system', () => {
  it('round-trips the full state', () => {
    const s = makeGame();
    s.flags.bell_rang = true; s.flags.lira_fate = 'faded'; s.gold = 123;
    s.companions.ilyra.rel.trust = 42;
    const back = deserialize(serialize(s, makeMeta(s, 'slot1', false)));
    expect(back).toEqual(s);
  });
  it('detects corruption via checksum and validation', () => {
    const s = makeGame();
    const text = serialize(s, makeMeta(s, 'slot1', false));
    const tampered = text.replace('"gold":25', '"gold":99999');
    expect(() => deserialize(tampered)).toThrow(/corrupt/i);
    expect(() => deserialize('{not json')).toThrow();
    const bad = JSON.parse(JSON.stringify(s)); bad.location.mapId = 'nowhere';
    expect(validateState(bad).join()).toMatch(/unknown map/);
    const bad2 = JSON.parse(JSON.stringify(s)); bad2.quests = { mq_bell: { status: 'active', stage: 'bogus', stagesDone: [], clues: [], startedAt: 1 } };
    expect(validateState(bad2).join()).toMatch(/unknown stage/);
  });
  it('keeps a backup and recovers from a corrupted primary', () => {
    const st = new MemStore();
    const s = makeGame();
    saveGame(s, 'slot1', false, st);
    s.gold = 77;
    saveGame(s, 'slot1', false, st);
    st.setItem('coe.save.slot1', st.getItem('coe.save.slot1')!.slice(0, 200)); // truncate primary
    const r = loadGame('slot1', st);
    expect(r.recovered).toBe(true);
    expect(r.state.gold).toBe(25);
    expect(listSaves(st).length).toBe(1);
  });
  it('migrates old versions and rejects newer ones', () => {
    const s: any = JSON.parse(JSON.stringify(makeGame()));
    delete s.orders; s.version = 0;
    const m = migrate(s);
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.orders).toBeTruthy();
    expect(() => migrate({ ...s, version: 999 })).toThrow(/newer/);
  });
});
