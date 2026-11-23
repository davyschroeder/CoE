import type { Ability, DamageType, EquipSlot, Skill } from '../engine/types';

export type ItemType = 'weapon' | 'armor' | 'shield' | 'clothing' | 'cloak' | 'amulet' | 'ring'
  | 'potion' | 'scroll' | 'material' | 'quest' | 'trinket' | 'tool' | 'component';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact';
export type WeaponProp = 'finesse' | 'light' | 'heavy' | 'twoHanded' | 'versatile' | 'thrown' | 'reach' | 'ranged' | 'ammunition';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  weight: number;
  value: number; // gold pieces
  desc: string;
  weapon?: { dice: string; type: DamageType; props: WeaponProp[]; range?: number; category: 'simple' | 'martial'; versatileDice?: string };
  armor?: { base: number; dexCap?: number; kind: 'light' | 'medium' | 'heavy'; strReq?: number; stealthDis?: boolean };
  shield?: { bonus: number };
  bonus?: {
    ac?: number; attack?: number; damage?: number; saves?: number; spellAttack?: number; spellDC?: number;
    skills?: Partial<Record<Skill, number>>; abilities?: Partial<Record<Ability, number>>;
    damageExtra?: { dice: string; type: DamageType }; resist?: DamageType[]; speed?: number; initiative?: number;
    maxHp?: number;
  };
  use?: { kind: 'heal'; dice: string } | { kind: 'spell'; spellId: string; level: number } | { kind: 'resonance'; amount: number }
    | { kind: 'cure'; conditions: string[] } | { kind: 'buff'; condition: string; duration: number };
  cursed?: string;
  quest?: boolean;
  stackable?: boolean;
}

export function slotForItem(def: ItemDef): EquipSlot[] {
  switch (def.type) {
    case 'weapon': return def.weapon?.props.includes('light') ? ['mainHand', 'offHand'] : ['mainHand'];
    case 'shield': return ['offHand'];
    case 'armor': case 'clothing': return ['body'];
    case 'cloak': return ['cloak'];
    case 'amulet': return ['amulet'];
    case 'ring': return ['ring1', 'ring2'];
    default: return [];
  }
}

const W = (id: string, name: string, dice: string, type: DamageType, props: WeaponProp[], category: 'simple' | 'martial', value: number, weight: number, desc: string, extra: Partial<ItemDef> = {}, range?: number): ItemDef =>
  ({ id, name, type: 'weapon', rarity: 'common', value, weight, desc, weapon: { dice, type, props, category, range }, ...extra });

export const ITEMS: ItemDef[] = [
  // ── Simple weapons
  W('dagger', 'Dagger', '1d4', 'piercing', ['finesse', 'light', 'thrown'], 'simple', 2, 1, 'A plain, well-balanced blade.', {}, 4),
  W('club', 'Cudgel', '1d4', 'bludgeoning', ['light'], 'simple', 1, 2, 'Knotted oak. Popular with tavern bouncers.'),
  W('quarterstaff', 'Quarterstaff', '1d6', 'bludgeoning', ['versatile'], 'simple', 1, 4, 'Ash wood, iron-shod at both ends.'),
  W('mace', 'Mace', '1d6', 'bludgeoning', [], 'simple', 5, 4, 'A flanged head on a sturdy haft.'),
  W('handaxe', 'Handaxe', '1d6', 'slashing', ['light', 'thrown'], 'simple', 5, 2, 'Good for kindling and for worse things.', {}, 4),
  W('spear', 'Spear', '1d6', 'piercing', ['thrown', 'versatile'], 'simple', 1, 3, 'Ash shaft, leaf-shaped head.', {}, 4),
  W('light_crossbow', 'Light Crossbow', '1d8', 'piercing', ['ranged', 'ammunition', 'twoHanded'], 'simple', 25, 5, 'A watchman\'s crossbow.', {}, 16),
  W('shortbow', 'Shortbow', '1d6', 'piercing', ['ranged', 'ammunition', 'twoHanded'], 'simple', 25, 2, 'Compact horn-and-yew bow.', {}, 16),
  // ── Martial weapons
  W('shortsword', 'Shortsword', '1d6', 'piercing', ['finesse', 'light'], 'martial', 10, 2, 'A short, stabbing blade.'),
  W('rapier', 'Rapier', '1d8', 'piercing', ['finesse'], 'martial', 25, 2, 'A slender, elegant blade.'),
  W('longsword', 'Longsword', '1d8', 'slashing', ['versatile'], 'martial', 15, 3, 'The classic knightly sword.'),
  W('battleaxe', 'Battleaxe', '1d8', 'slashing', ['versatile'], 'martial', 10, 4, 'A broad-bladed dwarven axe.'),
  W('warhammer', 'Warhammer', '1d8', 'bludgeoning', ['versatile'], 'martial', 15, 2, 'Iron head, leather grip.'),
  W('greataxe', 'Greataxe', '1d12', 'slashing', ['heavy', 'twoHanded'], 'martial', 30, 7, 'A crescent blade on a long haft.'),
  W('greatsword', 'Greatsword', '2d6', 'slashing', ['heavy', 'twoHanded'], 'martial', 50, 6, 'Two-handed steel.'),
  W('longbow', 'Longbow', '1d8', 'piercing', ['ranged', 'ammunition', 'heavy', 'twoHanded'], 'martial', 50, 2, 'Tall yew bow with a long reach.', {}, 24),
  W('halberd', 'Halberd', '1d10', 'slashing', ['heavy', 'reach', 'twoHanded'], 'martial', 20, 6, 'Axe, spike and hook on a pole.'),
  // ── Magic & unique weapons
  W('lanternblade', 'Lanternblade', '1d8', 'slashing', ['versatile'], 'martial', 250, 3,
    'A longsword whose fuller holds a sliver of lantern-glass. It glows faintly near echoes. +1 to attack and damage; +1d4 radiant.',
    { rarity: 'uncommon', bonus: { attack: 1, damage: 1, damageExtra: { dice: '1d4', type: 'radiant' } } }),
  W('whisperfang', 'Whisperfang', '1d4', 'piercing', ['finesse', 'light', 'thrown'], 'simple', 200, 1,
    'A dagger that hums a note only its wielder can hear. +1 to attack and damage; +1d4 psychic.',
    { rarity: 'uncommon', bonus: { attack: 1, damage: 1, damageExtra: { dice: '1d4', type: 'psychic' } } }, 4),
  W('bellbreaker', 'Bellbreaker', '1d8', 'bludgeoning', ['versatile'], 'martial', 300, 4,
    'A warhammer cast from the bronze of a bell that should not exist. +1 attack; +1d6 thunder. It rings softly with each blow.',
    { rarity: 'rare', bonus: { attack: 1, damageExtra: { dice: '1d6', type: 'thunder' } } }),
  W('greyhawk_bow', 'Sellsword\'s Recurve', '1d6', 'piercing', ['ranged', 'ammunition', 'twoHanded'], 'simple', 60, 2,
    'A well-made recurve with grey hawk feathers on the grip. +1 to attack rolls.', { rarity: 'uncommon', bonus: { attack: 1 } }, 18),
  // ── Armour
  { id: 'leather_armor', name: 'Leather Armour', type: 'armor', rarity: 'common', value: 10, weight: 10, desc: 'Boiled and shaped leather.', armor: { base: 11, kind: 'light' } },
  { id: 'studded_leather', name: 'Studded Leather', type: 'armor', rarity: 'common', value: 45, weight: 13, desc: 'Leather reinforced with rivets.', armor: { base: 12, kind: 'light' } },
  { id: 'hide_armor', name: 'Hide Armour', type: 'armor', rarity: 'common', value: 10, weight: 12, desc: 'Thick furs and pelts.', armor: { base: 12, kind: 'medium', dexCap: 2 } },
  { id: 'scale_mail', name: 'Scale Mail', type: 'armor', rarity: 'common', value: 50, weight: 45, desc: 'Overlapping steel scales.', armor: { base: 14, kind: 'medium', dexCap: 2, stealthDis: true } },
  { id: 'breastplate', name: 'Breastplate', type: 'armor', rarity: 'common', value: 400, weight: 20, desc: 'A fitted steel chest piece.', armor: { base: 14, kind: 'medium', dexCap: 2 } },
  { id: 'chain_mail', name: 'Chain Mail', type: 'armor', rarity: 'common', value: 75, weight: 55, desc: 'Interlocking rings over padding.', armor: { base: 16, kind: 'heavy', strReq: 13, stealthDis: true } },
  { id: 'splint_armor', name: 'Splint Armour', type: 'armor', rarity: 'common', value: 200, weight: 60, desc: 'Vertical metal strips riveted to leather.', armor: { base: 17, kind: 'heavy', strReq: 15, stealthDis: true } },
  { id: 'wardens_mail', name: 'Warden\'s Coat', type: 'armor', rarity: 'uncommon', value: 350, weight: 20, desc: 'An old watch captain\'s brigandine, blessed at the cathedral long ago. Medium armour, AC 14 + Dex (max 2), +1 AC.', armor: { base: 14, kind: 'medium', dexCap: 2 }, bonus: { ac: 1 } },
  { id: 'scholar_robes', name: 'Scholar\'s Robes', type: 'clothing', rarity: 'common', value: 5, weight: 4, desc: 'Ink-stained robes with many pockets.' },
  { id: 'traveler_clothes', name: 'Traveller\'s Clothes', type: 'clothing', rarity: 'common', value: 2, weight: 4, desc: 'Sturdy, unremarkable clothes.' },
  { id: 'fine_clothes', name: 'Fine Clothes', type: 'clothing', rarity: 'common', value: 15, weight: 6, desc: 'Silk and velvet. +1 Persuasion with nobility.', bonus: { skills: { persuasion: 1 } } },
  { id: 'costume', name: 'Performer\'s Costume', type: 'clothing', rarity: 'common', value: 5, weight: 4, desc: 'Bright and theatrical. +1 Performance.', bonus: { skills: { performance: 1 } } },
  { id: 'festival_mantle', name: 'Lantern-Festival Mantle', type: 'cloak', rarity: 'uncommon', value: 80, weight: 1, desc: 'A mantle stitched with tiny glass beads that hold the light of festival lanterns. +1 to saving throws.', bonus: { saves: 1 } },
  { id: 'dark_cloak', name: 'Dark Cloak', type: 'cloak', rarity: 'common', value: 5, weight: 1, desc: 'Charcoal wool. +1 Stealth.', bonus: { skills: { stealth: 1 } } },
  { id: 'shield', name: 'Shield', type: 'shield', rarity: 'common', value: 10, weight: 6, desc: 'A wooden shield banded with iron. +2 AC.', shield: { bonus: 2 } },
  { id: 'orlen_shield', name: 'Shield of Saint Orlen', type: 'shield', rarity: 'uncommon', value: 300, weight: 6, desc: 'A battered shield bearing a lantern sigil. +3 AC, resistance to necrotic damage.', shield: { bonus: 3 }, bonus: { resist: ['necrotic'] } },
  // ── Jewellery
  { id: 'signet_ring', name: 'Family Signet Ring', type: 'ring', rarity: 'common', value: 25, weight: 0, desc: 'Your family crest in worn gold.' },
  { id: 'ring_of_echoes', name: 'Ring of Echoes', type: 'ring', rarity: 'rare', value: 500, weight: 0, desc: 'A ring of grey metal from a timeline that no longer exists. +1 maximum Resonance; +2 Insight.', bonus: { skills: { insight: 2 } } },
  { id: 'wenna_charm', name: 'Wenna\'s Ward-Charm', type: 'amulet', rarity: 'uncommon', value: 60, weight: 0, desc: 'Knotted hair, a bead of blue glass and a sprig of rue. +1 to all saving throws and +1 Perception.', bonus: { saves: 1, skills: { perception: 1 } } },
  { id: 'unbound_sigil', name: 'Unbound Sigil', type: 'amulet', rarity: 'uncommon', value: 50, weight: 0, desc: 'A brass disc engraved with a broken chain. +1 History; certain people may recognise it.', bonus: { skills: { history: 1 } } },
  { id: 'insignia_rank', name: 'Insignia of Rank', type: 'trinket', rarity: 'common', value: 1, weight: 0, desc: 'A tarnished badge from your old company.' },
  // ── Consumables
  { id: 'healing_potion', name: 'Potion of Healing', type: 'potion', rarity: 'common', value: 50, weight: 0.5, stackable: true, desc: 'Red and faintly warm. Restores 2d4+2 HP.', use: { kind: 'heal', dice: '2d4+2' } },
  { id: 'greater_healing_potion', name: 'Potion of Greater Healing', type: 'potion', rarity: 'uncommon', value: 150, weight: 0.5, stackable: true, desc: 'Restores 4d4+4 HP.', use: { kind: 'heal', dice: '4d4+4' } },
  { id: 'antitoxin', name: 'Antitoxin', type: 'potion', rarity: 'common', value: 50, weight: 0, stackable: true, desc: 'Cures the poisoned condition.', use: { kind: 'cure', conditions: ['poisoned'] } },
  { id: 'lantern_oil_flask', name: 'Lantern Oil Flask', type: 'potion', rarity: 'common', value: 2, weight: 1, stackable: true, desc: 'Throw (range 4): 2d6 fire to the target.', use: { kind: 'spell', spellId: 'oil_flask', level: 0 } },
  { id: 'aether_draught', name: 'Aether Draught', type: 'potion', rarity: 'uncommon', value: 120, weight: 0.5, stackable: true, desc: 'Shimmering, tastes of static. Restores 1 Resonance.', use: { kind: 'resonance', amount: 1 } },
  { id: 'scroll_cure_wounds', name: 'Scroll of Cure Wounds', type: 'scroll', rarity: 'common', value: 60, weight: 0, stackable: true, desc: 'Anyone can read it: casts Cure Wounds (1st level).', use: { kind: 'spell', spellId: 'cure_wounds', level: 1 } },
  { id: 'scroll_shatter', name: 'Scroll of Shatter', type: 'scroll', rarity: 'uncommon', value: 120, weight: 0, stackable: true, desc: 'Casts Shatter (2nd level).', use: { kind: 'spell', spellId: 'shatter', level: 2 } },
  { id: 'scroll_guiding_bolt', name: 'Scroll of Guiding Bolt', type: 'scroll', rarity: 'common', value: 75, weight: 0, stackable: true, desc: 'Casts Guiding Bolt (1st level).', use: { kind: 'spell', spellId: 'guiding_bolt', level: 1 } },
  { id: 'elixir_courage', name: 'Elixir of Steady Nerve', type: 'potion', rarity: 'uncommon', value: 80, weight: 0.5, stackable: true, desc: 'Cures frightened and grants Bless for 10 rounds.', use: { kind: 'buff', condition: 'blessed', duration: 10 } },
  // ── Tools, materials, components
  { id: 'thieves_tools', name: 'Thieves\' Tools', type: 'tool', rarity: 'common', value: 25, weight: 1, desc: 'Picks, files and a tiny mirror. Needed to pick locks and disarm traps without penalty.' },
  { id: 'spellbook', name: 'Spellbook', type: 'tool', rarity: 'common', value: 50, weight: 3, desc: 'Your arcane notes and formulae.' },
  { id: 'holy_symbol', name: 'Holy Symbol', type: 'tool', rarity: 'common', value: 5, weight: 1, desc: 'A lantern-shaped pendant of the Lantern Faith.' },
  { id: 'arcane_focus', name: 'Arcane Focus', type: 'tool', rarity: 'common', value: 10, weight: 1, desc: 'A crystal shard bound in copper wire.' },
  { id: 'lute', name: 'Lute', type: 'tool', rarity: 'common', value: 35, weight: 2, desc: 'Well-travelled, recently re-strung.' },
  { id: 'bedroll', name: 'Bedroll', type: 'tool', rarity: 'common', value: 1, weight: 7, desc: 'For nights under strange stars.' },
  { id: 'ink_and_quill', name: 'Ink and Quill', type: 'tool', rarity: 'common', value: 2, weight: 0, desc: 'For copying inscriptions.' },
  { id: 'scholar_journal', name: 'Scholar\'s Journal', type: 'trinket', rarity: 'common', value: 1, weight: 1, desc: 'Half-filled with notes on Aether theory.' },
  { id: 'prayer_beads', name: 'Prayer Beads', type: 'trinket', rarity: 'common', value: 1, weight: 0, desc: 'Worn smooth by years of devotion.' },
  { id: 'hunting_trap', name: 'Hunting Snare', type: 'tool', rarity: 'common', value: 5, weight: 2, desc: 'Wire and stake.' },
  { id: 'rope', name: 'Hempen Rope (50 ft)', type: 'tool', rarity: 'common', value: 1, weight: 10, desc: 'Helps climb and descend safely (+2 Athletics where rope is useful).' },
  { id: 'crowbar', name: 'Crowbar', type: 'tool', rarity: 'common', value: 2, weight: 5, desc: 'Advantage-like +2 to Athletics checks to force doors or lids.' },
  { id: 'echo_shard', name: 'Echo Shard', type: 'material', rarity: 'uncommon', value: 30, weight: 0, stackable: true, desc: 'A sliver of crystallised memory left when an echo dissolves. Warm to the touch, it sometimes shows faces.' },
  { id: 'fog_essence', name: 'Fog Essence', type: 'material', rarity: 'common', value: 10, weight: 0, stackable: true, desc: 'Grey mist that refuses to leave its vial. Alchemists pay for it.' },
  { id: 'bone_dust', name: 'Ossuary Dust', type: 'component', rarity: 'common', value: 4, weight: 0, stackable: true, desc: 'Fine grey powder. Useful in certain rites.' },
  { id: 'silver_bell_clapper', name: 'Bronze Clapper Fragment', type: 'material', rarity: 'rare', value: 100, weight: 2, desc: 'A piece of the Bellwarden\'s bell. It is warm, and it remembers ringing.' },
  // ── Crafted items (Phase 3)
  { id: 'echo_ward_charm', name: 'Echo-Ward Charm', type: 'amulet', rarity: 'rare', value: 300, weight: 0, desc: 'A Sentinel core re-tuned to hum against the Unwritten. +1 to saving throws; resistance to psychic damage.', bonus: { saves: 1, resist: ['psychic'] } },
  { id: 'bellsong_pendant', name: 'Bellsong Pendant', type: 'amulet', rarity: 'rare', value: 350, weight: 0, desc: 'A sliver of the Bellwarden’s bronze. +1 to spell attack rolls and spell save DCs.', bonus: { spellAttack: 1, spellDC: 1 } },
  { id: 'fogweave_cloak', name: 'Fogweave Cloak', type: 'cloak', rarity: 'uncommon', value: 180, weight: 1, desc: 'Never quite stops being somewhere else. +1 AC, +2 Stealth.', bonus: { ac: 1, skills: { stealth: 2 } } },
  // ── Quest items
  { id: 'maren_key', name: 'Maren\'s Iron Key', type: 'quest', rarity: 'common', value: 0, weight: 0, quest: true, desc: 'An old iron key to the cathedral\'s sacristy, given to you by Sister Maren.' },
  { id: 'bell_rubbing', name: 'Charcoal Rubbing of the Bell', type: 'quest', rarity: 'common', value: 0, weight: 0, quest: true, desc: 'A rubbing of an inscription in Old Ithari: "I ring for the town that remembers me."' },
  { id: 'corvin_notes', name: 'Corvin\'s Excavation Notes', type: 'quest', rarity: 'uncommon', value: 0, weight: 0, quest: true, desc: 'Precise diagrams of the undercroft and an Anchor-vault. In the margin: "THE SEAL WAS ALREADY CRACKED. NOT MY FAULT. (Mostly.)"' },
  { id: 'lira_music_box', name: 'Lira\'s Music Box', type: 'quest', rarity: 'common', value: 0, weight: 0, quest: true, desc: 'A tin music box that plays a lullaby no one in Hollowmere has heard — except Pell.' },
  { id: 'bottled_echo', name: 'Bottled Echo', type: 'quest', rarity: 'rare', value: 0, weight: 0, quest: true, desc: 'A sealed vial in which a small girl\'s silhouette sometimes presses her palms against the glass.' },
  { id: 'heart_of_aether', name: 'Heart of Aether', type: 'quest', rarity: 'artifact', value: 0, weight: 1, quest: true, desc: 'A fist-sized crystal that beats, slowly, like a sleeping heart. When you hold it, you remember places that never were.' },
  { id: 'sentinel_core', name: 'Sentinel Core', type: 'material', rarity: 'uncommon', value: 75, weight: 2, desc: 'The humming heart of an Echo Sentinel.' },
  { id: 'vault_sigil', name: 'Vault Sigil-Stone', type: 'quest', rarity: 'uncommon', value: 0, weight: 1, quest: true, desc: 'A hexagonal stone carved with the seven-pointed star of the Scribes.' },
];

import { CQ_ITEMS } from './companionQuests';
ITEMS.push(...CQ_ITEMS);
export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#d8cfb8', uncommon: '#6fcf7a', rare: '#5aa8ff', 'very rare': '#b07cff', legendary: '#ffb347', artifact: '#ff6f6f',
};
