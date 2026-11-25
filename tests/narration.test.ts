import { describe, it, expect } from 'vitest';
import { NARRATION, narrationFor } from '../src/data/narration';
import { DIALOGUE_BY_ID } from '../src/data/dialogue/index';

const FILES = new Set(Object.keys(import.meta.glob('../public/audio/narration/*.mp3')).map((p) => p.split('/').pop()));

describe('narration', () => {
  it('every clip reads existing Dungeon Master nodes of an existing dialogue', () => {
    for (const [treeId, clip] of Object.entries(NARRATION)) {
      const tree = DIALOGUE_BY_ID[treeId];
      expect(tree, treeId).toBeTruthy();
      for (const n of clip.nodes) {
        expect(tree.nodes[n], `${treeId}.${n}`).toBeTruthy();
        expect(tree.nodes[n].speaker ?? 'dm', `${treeId}.${n}`).toBe('dm');
      }
      expect(clip.file).toMatch(/^[a-z0-9_-]+\.mp3$/);
      expect(FILES.has(clip.file), clip.file).toBe(true);
    }
  });

  it('a clip keeps playing across its own nodes and nowhere else', () => {
    expect(narrationFor('intro', 'a')).toBe(NARRATION.intro);
    expect(narrationFor('intro', 'b')).toBe(NARRATION.intro);
    expect(narrationFor('intro', 'zz')).toBeNull();
    expect(narrationFor('maren', 'a')).toBeNull();
  });

  it('every recording in public/audio/narration is used', () => {
    const used = new Set(Object.values(NARRATION).map((c) => c.file));
    for (const f of FILES) expect(used.has(f!), f).toBe(true);
  });
});
