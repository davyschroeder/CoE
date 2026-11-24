/** Visual identity: every companion has a face of their own, and the theme never breaks the layout. */
import { describe, it, expect } from 'vitest';
import css from '../src/visual-edition.css?raw';
import { COMPANIONS } from '../src/data/companions';
import { NPCS } from '../src/data/npcs';
import { ACT1 } from '../src/data/act1/index';
import { companionArtId, companionPortrait, npcPortrait, portraitSvg, PLAYER_PORTRAITS } from '../src/ui/portraits';

const ASSETS = new Set(Object.keys(import.meta.glob('../src/assets/visuals/*')).map((p) => p.replace('../src/', '')));
const artOf = (svg: string) => /data-coa-painted="([^"]+)"/.exec(svg)?.[1];

describe('visual identity', () => {
  it('every companion has a distinct portrait that resolves to real art', () => {
    const ids = COMPANIONS.map((c) => companionArtId(c.id));
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(COMPANIONS.length);
    for (const c of COMPANIONS) {
      expect(artOf(companionPortrait(c.id)), c.id).toBe(companionArtId(c.id));
      expect(companionPortrait(c.id)).toMatch(/<image href="[^"]+"/);
    }
  });

  it('no NPC and no player portrait choice wears a companion\'s face', () => {
    const companionFaces = new Set(COMPANIONS.map((c) => companionArtId(c.id)));
    for (const p of PLAYER_PORTRAITS) expect(companionFaces.has(p.id), p.id).toBe(false);
    for (const n of [...NPCS, ...ACT1.npcs]) {
      if (COMPANIONS.some((c) => c.id === n.id)) continue;
      expect(companionFaces.has(artOf(npcPortrait(n.id))), n.id).toBe(false);
    }
    // Initials never select art: a player called "Kael Vance" gets the default portrait.
    expect(companionFaces.has(artOf(portraitSvg({ hue: 10, sigil: '', initials: 'KV' })))).toBe(false);
  });

  it('the theme only references bundled art and never repositions screens or HUD panels', () => {
    for (const [, url] of css.matchAll(/url\('\.\/([^']+)'\)/g)) expect(ASSETS.has(url), url).toBe(true);
    expect(css).not.toMatch(/https?:/);
    expect(css).not.toMatch(/(^|[}\s,])\.(panel|screen|creation|explore|combat|hud-[a-z]+|cb-[a-z]+|dialogue)\s*\{[^}]*position\s*:/);
  });
});
