import type { Ability, ConditionId, DamageType } from '../engine/types';

export type CreatureType = 'beast' | 'undead' | 'humanoid' | 'construct' | 'echo' | 'aberration';

export interface EnemyTemplate {
  id: string;
  name: string;
  desc: string;
  type: CreatureType;
  level: number;               // drives proficiency bonus
  abilities: Record<Ability, number>;
  ac: number;
  hp: string;                  // dice expression
  speed: number;               // squares
  actions: string[];
  multiattack?: number;        // number of attacks with the first action
  resist?: DamageType[];
  vuln?: DamageType[];
  immune?: DamageType[];
  condImmune?: ConditionId[];
  xp: number;
  ai: 'brute' | 'skirmisher' | 'archer' | 'caster' | 'controller' | 'boss_bellwarden' | 'sentinel' | 'pack';
  traits?: string[];
  resources?: Record<string, number>; // per-combat limited uses
  glyph: string;
  color: string;
  size?: 1 | 2;
  boss?: boolean;
  /** Per-combat resources that recharge on a d6 roll of 5–6 at the start of the creature's turn. */
  recharge?: string[];
  /** Legendary actions taken at the end of other creatures' turns. */
  legendary?: { per: number; actions: { id: string; cost: number }[] };
  /** Drops: [itemId, chance 0..1, qty]. */
  loot?: [string, number, number][];
  /** Gold dropped: dice expression. */
  gold?: string;
}

const ab = (str: number, dex: number, con: number, int: number, wis: number, cha: number) => ({ str, dex, con, int, wis, cha });

export const ENEMIES: EnemyTemplate[] = [
  {
    id: 'fog_hound', name: 'Fog Hound', type: 'echo', level: 1, abilities: ab(12, 15, 12, 3, 12, 6), ac: 13, hp: '3d8', speed: 8,
    actions: ['m_fog_bite'], xp: 50, ai: 'pack', loot: [['fog_essence', 0.4, 1]], traits: ['pack_tactics'], glyph: 'h', color: '#9fb3c8',
    desc: 'A lean, dog-shaped absence in the fog. Its eyes are two points of lantern-light that belong to someone else\'s memory of a dog. Pack Tactics: advantage when an ally is adjacent to its target.',
  },
  {
    id: 'hollow_echo', name: 'Hollow Echo', type: 'echo', level: 1, abilities: ab(8, 14, 12, 8, 10, 12), ac: 12, hp: '4d8', speed: 6,
    actions: ['m_echo_touch', 'm_echo_wail'], resist: ['bludgeoning', 'piercing', 'slashing'], vuln: ['radiant'], immune: ['poison'],
    condImmune: ['poisoned'], xp: 50, ai: 'skirmisher', resources: { wail: 1 }, loot: [['echo_shard', 0.4, 1]], glyph: 'e', color: '#c9d6ff',
    desc: 'The translucent outline of a person who was erased from the world. It does not know it is dead — or that it never lived. Resistant to weapons, vulnerable to radiant light.',
  },
  {
    id: 'sellsword', name: 'Grey Hawk Sellsword', type: 'humanoid', level: 1, abilities: ab(13, 13, 12, 10, 10, 10), ac: 13, hp: '3d8+3', speed: 6,
    actions: ['m_club', 'm_crossbow'], xp: 25, ai: 'brute', gold: '1d6', glyph: 's', color: '#c49a6c',
    desc: 'A hired blade with a grey feather in his cap, a long way from his last paycheque.',
  },
  {
    id: 'sellsword_captain', name: 'Dag Morrow, Grey Hawk Captain', type: 'humanoid', level: 2, abilities: ab(15, 13, 14, 10, 11, 12), ac: 15, hp: '6d8+6', speed: 6,
    actions: ['m_shortsword'], multiattack: 2, xp: 100, ai: 'brute', glyph: 'D', color: '#d4a373',
    desc: 'Broad, scarred and loud. Dag has never lost a tavern brawl he started, and he started most of them.',
  },
  {
    id: 'restless_pilgrim', name: 'Restless Pilgrim', type: 'undead', level: 1, abilities: ab(13, 6, 16, 3, 6, 5), ac: 8, hp: '3d8+9', speed: 4,
    actions: ['m_club'], immune: ['poison'], condImmune: ['poisoned'], vuln: ['radiant'], xp: 50, ai: 'brute', traits: ['undead_fortitude'], glyph: 'z', color: '#8a9a6b',
    desc: 'A pilgrim who came to pray at Saint Orlen\'s eighty years ago and never left. Undead Fortitude: may cling to 1 HP when struck down by non-radiant damage.',
  },
  {
    id: 'ossuary_guard', name: 'Ossuary Guard', type: 'undead', level: 1, abilities: ab(10, 14, 15, 6, 8, 5), ac: 13, hp: '2d8+4', speed: 6,
    actions: ['m_bone_blade'], vuln: ['bludgeoning', 'radiant'], immune: ['poison'], condImmune: ['poisoned', 'frightened'], xp: 50, ai: 'brute', loot: [['bone_dust', 0.5, 1]], glyph: 'k', color: '#e6e1cf',
    desc: 'Bones of the cathedral\'s old guard, still wearing the rotted tabard of the lantern.',
  },
  {
    id: 'ossuary_archer', name: 'Ossuary Archer', type: 'undead', level: 1, abilities: ab(10, 14, 15, 6, 8, 5), ac: 13, hp: '2d8+4', speed: 6,
    actions: ['m_bone_bow', 'm_bone_blade'], vuln: ['bludgeoning', 'radiant'], immune: ['poison'], condImmune: ['poisoned', 'frightened'], xp: 50, ai: 'archer', glyph: 'a', color: '#e6e1cf',
    desc: 'A skeletal archer that keeps its distance with unnerving discipline.',
  },
  {
    id: 'ossuary_crawler', name: 'Ossuary Crawler', type: 'aberration', level: 2, abilities: ab(14, 13, 14, 2, 12, 3), ac: 13, hp: '4d10+8', speed: 6,
    actions: ['m_crawler_bite'], xp: 100, ai: 'brute', loot: [['bone_dust', 0.6, 2], ['antitoxin', 0.15, 1]], glyph: 'C', color: '#a3785c',
    desc: 'A many-legged thing that nests in old bones and paralyses its prey with venom.',
  },
  {
    id: 'echo_sentinel', name: 'Echo Sentinel', type: 'construct', level: 3, abilities: ab(18, 9, 18, 3, 11, 1), ac: 16, hp: '8d10+24', speed: 5,
    actions: ['m_sentinel_slam', 'm_sentinel_beam'], vuln: ['thunder'], immune: ['poison', 'psychic'], condImmune: ['poisoned', 'frightened', 'charmed'], xp: 450, ai: 'sentinel',
    resources: { beam: 1 }, recharge: ['beam'], traits: ['beam_recharge'], glyph: 'S', color: '#7fd1d8', size: 1,
    desc: 'An Ithari guardian of carved stone and singing crystal, built to keep the living away from the Anchor. Vulnerable to thunder. Its Erasure Beam recharges.',
  },
  {
    id: 'bellwarden', name: 'The Bellwarden', type: 'echo', level: 3, abilities: ab(17, 10, 16, 10, 14, 14), ac: 14, hp: '9d10+27', speed: 5,
    actions: ['m_bell_strike', 'm_toll', 'm_summon_echo'], multiattack: 2, vuln: ['radiant'], immune: ['poison'], condImmune: ['poisoned', 'charmed', 'frightened'],
    xp: 900, ai: 'boss_bellwarden', resources: { toll: 1, summon: 1 }, traits: ['pillar_ward', 'phase2'], glyph: 'B', color: '#d9b45a', boss: true, size: 1,
    desc: 'Once Brother Halric Venn, bell-ringer, in a Hollowmere where the tower never fell. Displaced into this world, he fused with his bell. While resonance pillars stand, he resists all damage except radiant and thunder and heals each round. Shatter the pillars.',
  },
  {
    id: 'conclave_warden', name: 'Conclave Warden', type: 'humanoid', level: 2, abilities: ab(15, 12, 14, 12, 12, 10), ac: 16, hp: '5d8+10', speed: 6,
    actions: ['m_ward_staff'], multiattack: 2, xp: 100, ai: 'brute', gold: '2d6', glyph: 'w', color: '#8f7cff',
    desc: 'A grey-robed enforcer of the Aether Conclave, armoured beneath the robes, eyes trained on your hands.',
  },
  {
    id: 'seeker_ysolt', name: 'Seeker Ysolt Ravencourt', type: 'humanoid', level: 4, abilities: ab(9, 14, 13, 18, 14, 15), ac: 14, hp: '8d8+8', speed: 6,
    actions: ['m_arcane_bolt', 'm_binding_sigil'], multiattack: 2, xp: 450, ai: 'caster', resources: { sigil: 2 }, traits: ['shield_reaction'], glyph: 'Y', color: '#b49cff', boss: true,
    desc: 'A Seeker of the Aether Conclave: precise, patient, utterly certain. She has come for the Heart.',
  },

  // ───────── Act I-ready creatures (Phase 3). Not yet placed in story encounters.
  {
    id: 'thornwake_warden', name: 'Thornwake Warden', type: 'humanoid', level: 3, abilities: ab(10, 14, 13, 11, 16, 10), ac: 14, hp: '6d8+6', speed: 6,
    actions: ['m_thorn_lash', 'm_healing_sap'], xp: 200, ai: 'caster', resources: { sap: 2 }, loot: [['healing_potion', 0.3, 1]], gold: '2d6', glyph: 't', color: '#6faa5a',
    desc: 'A Verdant Circle radical in a cloak of living bramble. Lashes with thorned vines that drag prey close, and mends allies with green sap.',
  },
  {
    id: 'gloam_stalker', name: 'Gloam Stalker', type: 'beast', level: 3, abilities: ab(14, 17, 13, 3, 13, 6), ac: 14, hp: '5d10+5', speed: 8,
    actions: ['m_gloam_bite'], multiattack: 2, xp: 200, ai: 'pack', traits: ['pack_tactics'], loot: [['fog_essence', 0.5, 2]], glyph: 'g', color: '#5d5a86',
    desc: 'A twilight panther from a world where the sun never rose. Hunts in pairs; its bite carries a numbing venom.',
  },
  {
    id: 'covenant_soldier', name: 'Iron Covenant Soldier', type: 'humanoid', level: 2, abilities: ab(16, 11, 14, 10, 11, 10), ac: 17, hp: '4d8+8', speed: 6,
    actions: ['m_halberd'], xp: 100, ai: 'brute', gold: '2d8', loot: [['healing_potion', 0.2, 1]], glyph: 'c', color: '#8a9aa8',
    desc: 'Disciplined, armoured, and very sure the Covenant is the only thing holding the world together. Its halberd reaches two squares.',
  },
  {
    id: 'conclave_arcanist', name: 'Conclave Arcanist', type: 'humanoid', level: 4, abilities: ab(9, 14, 12, 17, 13, 11), ac: 13, hp: '7d8+7', speed: 6,
    actions: ['m_arcane_firebolt', 'm_arcane_web'], xp: 300, ai: 'caster', resources: { web: 1 }, traits: ['shield_reaction'], gold: '3d6', loot: [['scroll_shatter', 0.2, 1], ['aether_draught', 0.2, 1]], glyph: 'a', color: '#9b88ff',
    desc: 'A Conclave field mage: precise, unhurried, prepared. Shields itself with a ward when struck.',
  },
  {
    id: 'echo_knight', name: 'Echo Knight', type: 'echo', level: 4, abilities: ab(17, 12, 15, 10, 12, 12), ac: 17, hp: '8d10+16', speed: 6,
    actions: ['m_echo_blade'], multiattack: 2, resist: ['necrotic', 'psychic'], vuln: ['radiant'], immune: ['poison'], condImmune: ['poisoned', 'frightened'],
    xp: 450, ai: 'brute', loot: [['echo_shard', 1, 2]], glyph: 'K', color: '#b8c6ff',
    desc: 'The armoured echo of a knight from an erased kingdom, still keeping a vigil no one remembers ordering. Its blade cuts at memory as much as flesh.',
  },
  {
    id: 'ossaryx', name: 'Ossaryx, the Gloaming Wyrm', type: 'aberration', level: 8, abilities: ab(21, 12, 19, 14, 15, 18), ac: 18, hp: '15d12+60', speed: 8,
    actions: ['m_wyrm_bite', 'm_dusk_breath', 'm_frightful_presence'], multiattack: 2, resist: ['necrotic', 'cold'], vuln: ['radiant'], condImmune: ['frightened', 'charmed'],
    xp: 3900, ai: 'brute', resources: { breath: 1, presence: 1 }, recharge: ['breath'], boss: true, glyph: 'O', color: '#3e4a7a',
    legendary: { per: 3, actions: [{ id: 'lg_tail', cost: 1 }, { id: 'lg_wing', cost: 2 }] },
    loot: [['echo_shard', 1, 6]], gold: '10d10',
    desc: 'The last sovereign of a twilight world, dragged through the Valdros Anchor into blinding day. Legendary: acts at the end of other creatures’ turns (tail sweep, wing buffet). Its Dusk Breath recharges. Vulnerable to radiant light.',
  },
];

export const ENEMY_BY_ID: Record<string, EnemyTemplate> = Object.fromEntries(ENEMIES.map((e) => [e.id, e]));
