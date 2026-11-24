import type { Character } from '../engine/types';
import { NPC_BY_ID } from '../data/npcs';
import { COMPANION_BY_ID } from '../data/companions';

/** Authored portrait atlases. Cropping happens in SVG, preserving original image files. */
export interface PortraitArt {
  id: string;
  name: string;
  file: string;
  /** Bundled image URL; when set it is used instead of `art/<file>`. */
  src?: string;
  crop: [number, number, number, number];
  full: [number, number, number, number];
  width?: number;
  height?: number;
}

const hero = (id: string, name: string, col: number, row: number): PortraitArt => ({
  id, name, file: 'hero-portraits.png',
  crop: [col * 362 + 35, row * 543 + 44, 292, 292],
  full: [col * 362 + 30, row * 543 + 36, 300, 467],
});
const npcA = (id: string, name: string, col: number, row: number): PortraitArt => ({
  id, name, file: 'npc-portraits-a.png',
  crop: [col * 286 + 39, row ? 575 : 146, 244, 244],
  full: [col * 286 + 36, row ? 571 : 145, 247, row ? 415 : 374],
});
const npcB = (id: string, name: string, col: number, row: number): PortraitArt => ({
  id, name, file: 'npc-portraits-b.png',
  crop: [col * 286 + 27, row * 543 + 71, 247, 247],
  full: [col * 286 + 24, row * 543 + 47, 252, 459],
});
const story = (id: string, name: string, col: number, row: number): PortraitArt => ({
  id, name, file: 'story-portraits.png',
  crop: [col * 443.5 + 32, row * 443.5 + 2, 380, 380],
  full: [col * 443.5 + 8, row * 443.5 + 1, 427, 441],
  width: 1774, height: 887,
});
const miniature = (id: string, name: string, col: number, row: number): PortraitArt => ({
  id, name, file: 'miniatures.png',
  crop: [col * 362 + 57, row * 271.5 + 5, 250, 250],
  full: [col * 362 + 25, row * 271.5 + 3, 313, 262],
});

const HERO_ART: PortraitArt[] = [
  hero('hero-knight', 'The Knight', 0, 0),
  hero('hero-arcanist', 'The Arcanist', 1, 0),
  hero('hero-wayfarer', 'The Wayfarer', 2, 0),
  hero('hero-veilborn', 'The Veilborn', 3, 0),
  hero('hero-stoneguard', 'The Stoneguard', 0, 1),
  hero('hero-ashkin', 'The Ashkin', 1, 1),
  hero('hero-warden', 'The Warden', 2, 1),
  hero('hero-lightbearer', 'The Lightbearer', 3, 1),
];
const NPC_ART: PortraitArt[] = [
  npcA('npc-archmage', 'The Archmage', 0, 0),
  npcA('npc-innkeeper', 'The Innkeeper', 1, 0),
  npcA('npc-noble', 'The Noble', 2, 0),
  npcA('npc-seer', 'The Seer', 3, 0),
  npcA('npc-captain', 'The Captain', 4, 0),
  npcA('npc-trader', 'The Trader', 0, 1),
  npcA('npc-scholar', 'The Scholar', 1, 1),
  npcA('npc-elder', 'The Elder', 2, 1),
  npcA('npc-prophet', 'The Prophet', 3, 1),
  npcA('npc-stranger', 'The Stranger', 4, 1),
  npcB('npc-regent', 'The Regent', 0, 0),
  npcB('npc-smith', 'The Blacksmith', 1, 0),
  npcB('npc-apprentice', 'The Apprentice', 2, 0),
  npcB('npc-outrider', 'The Outrider', 3, 0),
  npcB('npc-greenmother', 'The Greenmother', 4, 0),
  npcB('npc-corsair', 'The Corsair', 0, 1),
  npcB('npc-matron', 'The Matron', 1, 1),
  npcB('npc-sentinel', 'The Sentinel', 2, 1),
  npcB('npc-alchemist', 'The Alchemist', 3, 1),
  npcB('npc-spymaster', 'The Spymaster', 4, 1),
];
const STORY_ART: PortraitArt[] = [
  story('story-pell', 'Pell', 0, 0), story('story-mira', 'Mira', 1, 0),
  story('story-lira', 'Lira', 2, 0), story('story-jory', 'Jory', 3, 0),
  story('story-brakka', 'Brakka Stonevein', 0, 1), story('story-vaelis', 'Vaelis Thorne', 1, 1),
  story('story-orren', 'Orren Mossward', 2, 1), story('story-tessa', 'Tessa Quickthorn', 3, 1),
];
const MONSTER_ART: PortraitArt[] = [
  miniature('monster-wolf', 'A snarling wolf', 0, 3),
  miniature('monster-wraith', 'An echo of the Veil', 1, 3),
  miniature('monster-skeleton', 'An ossuary guardian', 1, 2),
  miniature('monster-cultist', 'A hooded arcanist', 2, 2),
  miniature('monster-ogre', 'A hulking monster', 3, 2),
  miniature('monster-crystal', 'A crystal-bound beast', 3, 3),
];
/**
 * Dedicated painted portraits (Aetherfall Visual Edition) for the companions without a story portrait,
 * so that no companion shares a face with an NPC or with a portrait the player can choose.
 */
const DEDICATED = import.meta.glob('../assets/visuals/{kael,seris,nima,ilyra,varek,korr}.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const COMPANION_SOLO_ART: PortraitArt[] = Object.entries(DEDICATED).map(([path, src]) => {
  const id = path.replace(/^.*\/(.+)\.webp$/, '$1');
  return { id: `companion-${id}`, name: COMPANION_BY_ID[id]?.name ?? id, file: `${id}.webp`, src, crop: [0, 0, 256, 256], full: [0, 0, 256, 256], width: 256, height: 256 };
});
const ART: Record<string, PortraitArt> = Object.fromEntries([...HERO_ART, ...NPC_ART, ...STORY_ART, ...MONSTER_ART, ...COMPANION_SOLO_ART].map(a => [a.id, a]));

/** Cosmetic choices: selecting a face never changes class, ancestry or abilities. */
export const PLAYER_PORTRAITS: readonly PortraitArt[] = [
  ...HERO_ART,
  ...NPC_ART.filter(a => ['npc-scholar', 'npc-captain', 'npc-stranger', 'npc-elder', 'npc-alchemist', 'npc-outrider', 'npc-matron', 'npc-noble'].includes(a.id)),
];
export const DEFAULT_PLAYER_PORTRAIT = 'hero-knight';

/** Every companion has a face of their own: never an NPC archetype or a player choice. */
const COMPANION_ART: Record<string, string> = {
  vaelis: 'story-vaelis', brakka: 'story-brakka', orren: 'story-orren', tessa: 'story-tessa',
  kael: 'companion-kael', seris: 'companion-seris', nima: 'companion-nima',
  ilyra: 'companion-ilyra', varek: 'companion-varek', korr: 'companion-korr',
};

/** Art id of a companion's portrait (for tests and galleries). */
export function companionArtId(id: string): string | undefined { return COMPANION_ART[id]; }

/** Explicit identity mapping keeps recurring speakers consistent across acts. */
const NPC_ART_IDS: Record<string, string> = {
  maren: 'npc-scholar', wenna: 'npc-matron', hale: 'npc-smith', mayor: 'npc-regent',
  tobin: 'npc-trader', garrick: 'npc-smith', ysolde: 'npc-innkeeper', pell: 'story-pell',
  corvin: 'npc-archmage', dag: 'npc-corsair', lio: 'npc-apprentice', hob: 'npc-elder',
  mira: 'story-mira', abel: 'npc-smith', lira: 'story-lira', halric: 'npc-prophet',
  ysolt: 'npc-spymaster', maelis: 'npc-seer', sentinel: 'npc-sentinel', ysolde_echo: 'npc-innkeeper',
  a1a_cole: 'npc-outrider', a1a_dray: 'npc-captain', a1a_greaves: 'npc-noble',
  a1a_mott: 'npc-smith', a1a_harrow: 'npc-innkeeper', a1a_sollace: 'hero-lightbearer',
  a1a_jory: 'story-jory', a1a_bram: 'npc-smith', a1a_hooper: 'npc-smith',
  a1a_wick: 'npc-seer', a1a_pike: 'npc-archmage', a1a_brisk: 'npc-alchemist',
  a1a_tarrant: 'npc-noble', a1a_rusk: 'npc-apprentice', a1a_calder: 'npc-innkeeper',
  a1a_pip: 'npc-apprentice', a1a_odile: 'npc-matron', a1a_aldo: 'npc-elder',
  a1a_oakes: 'npc-corsair', a1a_iven: 'npc-archmage', a1a_annick: 'npc-matron',
  a1w_aunra: 'npc-greenmother', a1w_caddoc: 'npc-elder', a1w_sefa: 'npc-outrider',
  a1w_dunla: 'npc-alchemist', a1w_rue: 'hero-warden', a1w_agna: 'npc-matron',
  a1w_piet: 'npc-apprentice', a1w_lenn: 'npc-smith', a1w_maddie: 'npc-innkeeper',
  a1v_severin: 'npc-archmage', a1v_vex: 'npc-sentinel', a1v_ossaryx: 'monster-crystal',
  a1v_scout: 'npc-apprentice', a1v_archivist: 'npc-elder', a1v_lamplighter: 'npc-smith',
  a1v_refugee: 'npc-matron', a1v_lanternbearer: 'npc-innkeeper', a1v_rider: 'npc-outrider',
};

const esc = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const assetUrl = (file: string) => `${import.meta.env.BASE_URL}art/${file}`;
let nextPortrait = 0;

export function portraitArt(id: string): PortraitArt { return ART[id] ?? ART[DEFAULT_PLAYER_PORTRAIT]; }

function renderPortrait(art: PortraitArt, size: number, hue: number, enemy: boolean, rectangular = false, label = art.name): string {
  const clip = `aether-portrait-${++nextPortrait}`;
  const crop = rectangular ? art.full : art.crop;
  const width = rectangular ? 240 : 64, height = rectangular ? 310 : 64;
  const ring = enemy ? '#cb6565' : '#d4ae72';
  const frame = rectangular
    ? '<rect x="3" y="3" width="234" height="304" rx="6"/>'
    : '<circle cx="32" cy="32" r="28.3"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="aether-portrait${rectangular ? ' portrait-art-card' : ''}" data-coa-painted="${esc(art.id)}" width="${size}" height="${rectangular ? Math.round(size * height / width) : size}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">
    <defs><clipPath id="${clip}">${frame}</clipPath></defs>
    <g clip-path="url(#${clip})">
      <rect width="${width}" height="${height}" fill="#161321"/>
      <svg x="${rectangular ? 3 : 3.7}" y="${rectangular ? 3 : 3.7}" width="${rectangular ? 234 : 56.6}" height="${rectangular ? 304 : 56.6}" viewBox="${crop.join(' ')}" preserveAspectRatio="xMidYMid slice">
        <image href="${esc(art.src ?? assetUrl(art.file))}" width="${art.width ?? 1448}" height="${art.height ?? 1086}" preserveAspectRatio="none"/>
      </svg>
    </g>
    <g fill="none" stroke="${ring}" stroke-width="${rectangular ? 1.5 : 1.8}">${frame}</g>
    ${rectangular ? '<path d="M13 2h25M2 13v25M202 2h25M238 13v25M13 308h25M2 272v25M202 308h25M238 272v25" stroke="#f0d197" fill="none"/>' : `<circle cx="32" cy="32" r="30.5" fill="none" stroke="hsl(${hue},35%,50%)" stroke-width="0.8" opacity="0.65"/><circle cx="32" cy="32" r="26.5" fill="none" stroke="#f6dab0" stroke-width="0.45" opacity="0.4"/>`}
  </svg>`;
}

/** Legacy signature retained; explicit art IDs are used in all player and companion callers. */
export function portraitSvg(opts: { hue: number; sigil: string; initials: string; style?: number; size?: number; enemy?: boolean; art?: string; companionId?: string }): string {
  const id = opts.companionId ? COMPANION_ART[opts.companionId] : opts.art;
  return renderPortrait(portraitArt(id ?? DEFAULT_PLAYER_PORTRAIT), opts.size ?? 64, opts.hue, !!opts.enemy);
}

export function portraitCardSvg(id: string, size = 260): string {
  return renderPortrait(portraitArt(id), size, 265, false, true);
}

export function companionPortrait(id: string, size = 64): string {
  const c = COMPANION_BY_ID[id];
  return renderPortrait(portraitArt(COMPANION_ART[id] ?? DEFAULT_PLAYER_PORTRAIT), size, c?.hue ?? 240, false, false, c?.name);
}

function enemyArt(c: Character): string {
  const id = c.templateId ?? c.id;
  if (/ossaryx|wyrm|crawler/.test(id)) return 'monster-crystal';
  if (/hound|wolf|stalker/.test(id)) return 'monster-wolf';
  if (/hollow|wraith|echo/.test(id) && !/knight|sentinel/.test(id)) return 'monster-wraith';
  if (/sentinel|construct|knight/.test(id)) return 'npc-sentinel';
  if (/ossuary|pilgrim|skeleton/.test(id)) return 'monster-skeleton';
  if (/bellwarden/.test(id)) return 'npc-prophet';
  if (/ysolt/.test(id)) return 'npc-spymaster';
  if (/arcanist|caster|severin|vex/.test(id)) return 'monster-cultist';
  if (/captain|sellsword/.test(id)) return 'npc-corsair';
  if (/thorn|caddoc/.test(id)) return 'npc-elder';
  if (/brute|ogre/.test(id)) return 'monster-ogre';
  return c.creatureType === 'undead' ? 'monster-skeleton' : c.creatureType === 'beast' ? 'monster-wolf' : 'hero-knight';
}

export function characterPortraitArt(c: Character): PortraitArt {
  if (c.companionId) return portraitArt(COMPANION_ART[c.companionId]);
  if (c.kind === 'enemy') return portraitArt(enemyArt(c));
  if (c.portrait.art && ART[c.portrait.art]) return ART[c.portrait.art];
  // Existing saves get artwork without altering their serialized character data.
  if (c.ancestry === 'dwarf') return ART['hero-stoneguard'];
  if (c.ancestry === 'ashkin') return ART['hero-ashkin'];
  if (c.ancestry === 'veilborn') return ART['hero-veilborn'];
  const fallback: Record<string, string> = { wizard: 'npc-archmage', rogue: 'npc-stranger', cleric: 'hero-lightbearer', ranger: 'hero-warden', bard: 'npc-noble', warlock: 'hero-veilborn', sorcerer: 'hero-arcanist' };
  return portraitArt(fallback[c.classId] ?? DEFAULT_PLAYER_PORTRAIT);
}

export function charPortrait(c: Character, size = 64): string {
  return renderPortrait(characterPortraitArt(c), size, c.portrait.hue, c.kind === 'enemy', false, c.name);
}

export function npcPortrait(id: string, size = 64): string {
  if (id.startsWith('comp:')) return companionPortrait(id.slice(5), size);
  if (COMPANION_BY_ID[id]) return companionPortrait(id, size);
  const npc = NPC_BY_ID[id];
  const known = NPC_ART_IDS[id];
  if (known) return renderPortrait(portraitArt(known), size, npc?.hue ?? 230, false, false, npc?.name ?? id);
  if (id === 'dm') return renderPortrait(ART['npc-archmage'], size, 255, false, false, 'Dungeon Master');
  const desc = `${id} ${npc?.name ?? ''} ${npc?.title ?? ''} ${npc?.desc ?? ''}`.toLowerCase();
  const fallback = /girl|child|daughter/.test(desc) ? 'story-mira'
    : /boy|son/.test(desc) ? 'story-pell'
    : /ghost|echo/.test(desc) ? 'monster-wraith'
    : /soldier|guard|knight/.test(desc) ? 'hero-knight'
    : /elder|old|farmer/.test(desc) ? 'npc-elder'
    : /merchant|innkeep/.test(desc) ? 'npc-trader'
    : /witch|matron|mother/.test(desc) ? 'npc-matron'
    : /woman|sister/.test(desc) ? 'npc-scholar' : 'npc-stranger';
  return renderPortrait(portraitArt(fallback), size, npc?.hue ?? 230, false, false, npc?.name ?? 'A traveller');
}
