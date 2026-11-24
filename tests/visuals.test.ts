/** Aetherfall visual edition: painted portraits are keyed by companion id, never by initials. */
import { describe, it, expect } from 'vitest';
import css from '../src/visual-edition.css?raw';
import { COMPANIONS } from '../src/data/companions';
import { companionArt, portraitSvg } from '../src/ui/portraits';

const ASSETS = new Set(Object.keys(import.meta.glob('../src/assets/visuals/*')).map((p) => p.replace('../src/', '')));

describe('visual edition', () => {
  it('every companion has a painted portrait, used in their medallion', () => {
    for (const c of COMPANIONS) {
      expect(ASSETS.has(`assets/visuals/${c.id}.webp`), c.id).toBe(true);
      expect(companionArt(c.id), c.id).toBeTruthy();
      expect(portraitSvg({ hue: 0, sigil: '', initials: 'XX', companionId: c.id })).toContain('<image');
    }
  });

  it('a player or NPC whose initials match a companion keeps the procedural medallion', () => {
    expect(portraitSvg({ hue: 10, sigil: '', initials: 'KV' })).not.toContain('<image');
    expect(companionArt('not_a_companion')).toBeUndefined();
  });

  it('the theme only references bundled art and never repositions screens or HUD panels', () => {
    for (const [, url] of css.matchAll(/url\('\.\/([^']+)'\)/g)) expect(ASSETS.has(url), url).toBe(true);
    expect(css).not.toMatch(/https?:/);
    expect(css).not.toMatch(/(^|[}\s,])\.(panel|screen|creation|explore|combat|hud-[a-z]+|cb-[a-z]+|dialogue)\s*\{[^}]*position\s*:/);
  });
});
