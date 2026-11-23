import type { Character } from '../engine/types';
import { CLASS_BY_ID } from '../data/classes';
import { NPC_BY_ID } from '../data/npcs';
import { COMPANION_BY_ID } from '../data/companions';

/** Procedural portrait: layered SVG medallion (no external art needed). */
export function portraitSvg(opts: { hue: number; sigil: string; initials: string; style?: number; size?: number; enemy?: boolean }): string {
  const s = opts.size ?? 64;
  const h = opts.hue;
  const ring = opts.enemy ? '#7a2a2a' : '#b08d4a';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 64 64">
  <defs><radialGradient id="g${h}${opts.initials}" cx="40%" cy="35%" r="70%">
    <stop offset="0%" stop-color="hsl(${h},45%,48%)"/><stop offset="100%" stop-color="hsl(${h},40%,14%)"/></radialGradient></defs>
  <circle cx="32" cy="32" r="30" fill="url(#g${h}${opts.initials})" stroke="${ring}" stroke-width="3"/>
  <circle cx="32" cy="32" r="25" fill="none" stroke="hsla(${h},60%,80%,0.25)" stroke-width="1"/>
  <ellipse cx="32" cy="50" rx="17" ry="11" fill="hsla(${h},30%,8%,0.55)"/>
  <circle cx="32" cy="27" r="10" fill="hsla(${h},30%,8%,0.55)"/>
  <text x="32" y="37" text-anchor="middle" font-family="Georgia,serif" font-size="${opts.sigil ? 18 : 20}" font-weight="bold" fill="hsl(${h},70%,88%)">${opts.initials}</text>
  ${opts.sigil ? `<text x="50" y="56" text-anchor="middle" font-size="13" fill="#e9d29a">${opts.sigil}</text>` : ''}
</svg>`;
}

export function charPortrait(c: Character, size = 64): string {
  const sigil = c.kind === 'enemy' ? '' : CLASS_BY_ID[c.classId]?.sigil ?? '';
  const hue = c.companionId ? COMPANION_BY_ID[c.companionId].hue : c.portrait.hue;
  return portraitSvg({ hue, sigil, initials: c.portrait.initials || c.name.slice(0, 2), size, enemy: c.kind === 'enemy' });
}

export function npcPortrait(id: string, size = 64): string {
  if (id.startsWith('comp:')) {
    const d = COMPANION_BY_ID[id.slice(5)];
    if (d) return portraitSvg({ hue: d.hue, sigil: CLASS_BY_ID[d.classId].sigil, initials: d.name.split(' ').map((p) => p[0]).join(''), size });
  }
  const n = NPC_BY_ID[id];
  if (n) return portraitSvg({ hue: n.hue, sigil: '', initials: n.glyph, size });
  return portraitSvg({ hue: 230, sigil: '✦', initials: 'DM', size });
}
