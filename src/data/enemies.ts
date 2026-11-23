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
}

const ab = (str: number, dex: number, con: number, int: number, wis: number, cha: number) => ({ str, dex, con, int, wis, cha });

export const ENEMIES: EnemyTemplate[] = [
  {
    id: 'fog_hound', name: 'Fog Hound', type: 'echo', level: 1, abilities: ab(12, 15, 12, 3, 12, 6), ac: 13, hp: '3d8', speed: 8,
    actions: ['m_fog_bite'], xp: 50, ai: 'pack', traits: ['pack_tactics'], glyph: 'h', color: '#9fb3c8',
    desc: 'A lean, dog-shaped absence in the fog. Its eyes are two points of lantern-light that belong to someone else\'s memory of a dog. Pack Tactics: advantage when an ally is adjacent to its target.',
  },
  {
    id: 'hollow_echo', name: 'Hollow Echo', type: 'echo', level: 1, abilities: ab(8, 14, 12, 8, 10, 12), ac: 12, hp: '4d8', speed: 6,
    actions: ['m_echo_touch', 'm_echo_wail'], resist: ['bludgeoning', 'piercing', 'slashing'], vuln: ['radiant'], immune: ['poison'],
    condImmune: ['poisoned'], xp: 50, ai: 'skirmisher', resources: { wail: 1 }, glyph: 'e', color: '#c9d6ff',
    desc: 'The translucent outline of a person who was erased from the world. It does not know it is dead — or that it never lived. Resistant to weapons, vulnerable to radiant light.',
  },
  {
    id: 'sellsword', name: 'Grey Hawk Sellsword', type: 'humanoid', level: 1, abilities: ab(13, 13, 12, 10, 10, 10), ac: 13, hp: '3d8+3', speed: 6,
    actions: ['m_club', 'm_crossbow'], xp: 25, ai: 'brute', glyph: 's', color: '#c49a6c',
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
    actions: ['m_bone_blade'], vuln: ['bludgeoning', 'radiant'], immune: ['poison'], condImmune: ['poisoned', 'frightened'], xp: 50, ai: 'brute', glyph: 'k', color: '#e6e1cf',
    desc: 'Bones of the cathedral\'s old guard, still wearing the rotted tabard of the lantern.',
  },
  {
    id: 'ossuary_archer', name: 'Ossuary Archer', type: 'undead', level: 1, abilities: ab(10, 14, 15, 6, 8, 5), ac: 13, hp: '2d8+4', speed: 6,
    actions: ['m_bone_bow', 'm_bone_blade'], vuln: ['bludgeoning', 'radiant'], immune: ['poison'], condImmune: ['poisoned', 'frightened'], xp: 50, ai: 'archer', glyph: 'a', color: '#e6e1cf',
    desc: 'A skeletal archer that keeps its distance with unnerving discipline.',
  },
  {
    id: 'ossuary_crawler', name: 'Ossuary Crawler', type: 'aberration', level: 2, abilities: ab(14, 13, 14, 2, 12, 3), ac: 13, hp: '4d10+8', speed: 6,
    actions: ['m_crawler_bite'], xp: 100, ai: 'brute', glyph: 'C', color: '#a3785c',
    desc: 'A many-legged thing that nests in old bones and paralyses its prey with venom.',
  },
  {
    id: 'echo_sentinel', name: 'Echo Sentinel', type: 'construct', level: 3, abilities: ab(18, 9, 18, 3, 11, 1), ac: 16, hp: '8d10+24', speed: 5,
    actions: ['m_sentinel_slam', 'm_sentinel_beam'], vuln: ['thunder'], immune: ['poison', 'psychic'], condImmune: ['poisoned', 'frightened', 'charmed'], xp: 450, ai: 'sentinel',
    resources: { beam: 1 }, traits: ['beam_recharge'], glyph: 'S', color: '#7fd1d8', size: 1,
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
    actions: ['m_ward_staff'], multiattack: 2, xp: 100, ai: 'brute', glyph: 'w', color: '#8f7cff',
    desc: 'A grey-robed enforcer of the Aether Conclave, armoured beneath the robes, eyes trained on your hands.',
  },
  {
    id: 'seeker_ysolt', name: 'Seeker Ysolt Ravencourt', type: 'humanoid', level: 4, abilities: ab(9, 14, 13, 18, 14, 15), ac: 14, hp: '8d8+8', speed: 6,
    actions: ['m_arcane_bolt', 'm_binding_sigil'], multiattack: 2, xp: 450, ai: 'caster', resources: { sigil: 2 }, traits: ['shield_reaction'], glyph: 'Y', color: '#b49cff', boss: true,
    desc: 'A Seeker of the Aether Conclave: precise, patient, utterly certain. She has come for the Heart.',
  },
];

export const ENEMY_BY_ID: Record<string, EnemyTemplate> = Object.fromEntries(ENEMIES.map((e) => [e.id, e]));
