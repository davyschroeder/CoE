import type { Ability, Skill } from '../engine/types';

export type CasterType = 'none' | 'full' | 'half' | 'pact';

export interface FeatureDef {
  id: string;
  name: string;
  level: number;
  desc: string;
  /** Combat/exploration actions granted by this feature. */
  actions?: string[];
  /** Resource granted: max computed in engine/character.ts (RESOURCE_MAX). */
  resource?: { id: string; recharge: 'short' | 'long' };
}

export interface SubclassDef { id: string; name: string; desc: string; features: FeatureDef[]; }

export interface ClassDef {
  id: string;
  name: string;
  desc: string;
  role: string;
  hitDie: number;
  primary: Ability[];
  saves: Ability[];
  armor: ('light' | 'medium' | 'heavy' | 'shield')[];
  martialWeapons: boolean;
  skillChoices: Skill[];
  skillCount: number;
  startingItems: string[];
  startingGold: number;
  caster: CasterType;
  castAbility?: Ability;
  /** Prepared casters may swap prepared spells on a long rest. */
  prepares?: boolean;
  cantrips?: number[];     // known cantrips by level (index = level)
  spellsKnown?: number[];  // spells known by level for known-casters (index = level)
  features: FeatureDef[];
  subclasses: SubclassDef[];
  suggested: Record<Ability, number>;
  strengths: string;
  weaknesses: string;
  sigil: string;
}

const L = (arr: number[]) => [0, ...arr]; // helper to index by level

export const FULL_CASTER_SLOTS: number[][] = [
  [], [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/** Warlock pact magic: [slot count, slot level] by warlock level. */
export const PACT_SLOTS: [number, number][] = [
  [0, 0], [1, 1], [2, 1], [2, 2], [2, 2], [2, 3], [2, 3], [2, 4], [2, 4], [2, 5], [2, 5],
  [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [3, 5], [4, 5], [4, 5], [4, 5], [4, 5],
];

export const CLASSES: ClassDef[] = [
  {
    id: 'fighter', name: 'Fighter', sigil: '⚔', role: 'Weapon specialist and tactical defender',
    desc: 'Masters of arms and armour who win battles through discipline, positioning and sheer endurance.',
    hitDie: 10, primary: ['str', 'con'], saves: ['str', 'con'], armor: ['light', 'medium', 'heavy', 'shield'], martialWeapons: true,
    skillChoices: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'], skillCount: 2,
    startingItems: ['longsword', 'chain_mail', 'shield', 'healing_potion'], startingGold: 10, caster: 'none',
    suggested: { str: 15, dex: 12, con: 14, int: 8, wis: 13, cha: 10 },
    strengths: 'Highest sustained damage and armour; Second Wind and Action Surge.', weaknesses: 'No magic; few social tools.',
    features: [
      { id: 'fighting_style', name: 'Fighting Style', level: 1, desc: 'Adopt a fighting style (chosen at creation).' },
      { id: 'second_wind', name: 'Second Wind', level: 1, desc: 'Bonus action: regain 1d10 + fighter level HP. Once per short rest.', actions: ['second_wind'], resource: { id: 'second_wind', recharge: 'short' } },
      { id: 'action_surge', name: 'Action Surge', level: 2, desc: 'Take one additional action on your turn. Once per short rest.', actions: ['action_surge'], resource: { id: 'action_surge', recharge: 'short' } },
      { id: 'asi', name: 'Ability Score Improvement', level: 4, desc: 'Increase abilities or take a feat.' },
      { id: 'extra_attack', name: 'Extra Attack', level: 5, desc: 'Attack twice when you take the Attack action.' },
      { id: 'indomitable', name: 'Indomitable', level: 9, desc: 'Reroll a failed saving throw once per long rest.', resource: { id: 'indomitable', recharge: 'long' } },
      { id: 'extra_attack_2', name: 'Extra Attack (3)', level: 11, desc: 'Attack three times when you take the Attack action.' },
    ],
    subclasses: [
      { id: 'vanguard', name: 'Vanguard', desc: 'A relentless front-liner who turns every opening into a decisive blow.', features: [
        { id: 'improved_critical', name: 'Improved Critical', level: 3, desc: 'Your weapon attacks score a critical hit on a roll of 19 or 20.' },
        { id: 'remarkable_athlete', name: 'Remarkable Athlete', level: 7, desc: 'Add half your proficiency bonus to Strength, Dexterity and Constitution checks and to initiative.' },
        { id: 'relentless_vanguard', name: 'Relentless', level: 10, desc: 'At the start of your turn, if you are below half HP, regain 5 + Constitution modifier HP.' },
      ] },
      { id: 'bulwark', name: 'Bulwark', desc: 'A shield for others: you make yourself the most dangerous target to ignore.', features: [
        { id: 'protection', name: 'Protection', level: 3, desc: 'Reaction: impose disadvantage on an attack against an adjacent ally (requires a shield).' },
        { id: 'taunt', name: 'Challenging Shout', level: 3, desc: 'Bonus action: enemies within 2 squares must make a Wisdom save or be compelled to attack you.', actions: ['challenging_shout'], resource: { id: 'challenging_shout', recharge: 'short' } },
        { id: 'guardian_aura', name: 'Guardian’s Aura', level: 7, desc: 'Allies adjacent to you gain +1 AC.' },
        { id: 'steadfast', name: 'Steadfast', level: 10, desc: 'Advantage on saves against being frightened or charmed.' },
      ] },
    ],
  },
  {
    id: 'wizard', name: 'Wizard', sigil: '✶', role: 'Powerful arcane spellcaster',
    desc: 'Scholars who bend the Aether through precise formulae. The Veil\'s fraying makes their art both stronger and less predictable.',
    hitDie: 6, primary: ['int'], saves: ['int', 'wis'], armor: [], martialWeapons: false,
    skillChoices: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'], skillCount: 2,
    startingItems: ['quarterstaff', 'scholar_robes', 'spellbook', 'healing_potion'], startingGold: 12,
    caster: 'full', castAbility: 'int', prepares: true, cantrips: L([3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]),
    suggested: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
    strengths: 'The broadest and strongest spell list; area damage and control.', weaknesses: 'Fragile; low hit points and armour.',
    features: [
      { id: 'spellcasting', name: 'Spellcasting', level: 1, desc: 'Cast wizard spells using Intelligence.' },
      { id: 'arcane_recovery', name: 'Arcane Recovery', level: 1, desc: 'Once per long rest, recover expended spell slots during a short rest.', resource: { id: 'arcane_recovery', recharge: 'long' } },
      { id: 'asi', name: 'Ability Score Improvement', level: 4, desc: 'Increase abilities or take a feat.' },
    ],
    subclasses: [
      { id: 'evoker', name: 'School of Evocation', desc: 'You shape destructive magic around your allies.', features: [
        { id: 'sculpt_spells', name: 'Sculpt Spells', level: 3, desc: 'Allies are unharmed by your area spells.' },
        { id: 'potent_cantrip', name: 'Potent Cantrip', level: 6, desc: 'Creatures that succeed on a save against your cantrips still take half damage.' },
        { id: 'empowered_evocation', name: 'Empowered Evocation', level: 10, desc: 'Add your Intelligence modifier to the damage of your wizard spells.' },
      ] },
      { id: 'resonance', name: 'School of Resonance', desc: 'A young discipline studying the Veil\'s vibrations — and how to nudge probability.', features: [
        { id: 'probability_twist', name: 'Probability Twist', level: 3, desc: 'Reaction, once per short rest: force an enemy that hits an ally to reroll the attack.', resource: { id: 'probability_twist', recharge: 'short' } },
        { id: 'resonant_ward', name: 'Resonant Ward', level: 6, desc: 'When you cast a levelled spell, gain temporary HP equal to twice the spell’s level + Intelligence modifier.' },
        { id: 'probability_mastery', name: 'Probability Mastery', level: 10, desc: 'Probability Twist can be used twice per short rest.' },
      ] },
    ],
  },
  {
    id: 'rogue', name: 'Rogue', sigil: '◆', role: 'Stealth, traps and precision attacks',
    desc: 'Specialists in locks, lies and lethal timing. Where others see walls, rogues see doors.',
    hitDie: 8, primary: ['dex'], saves: ['dex', 'int'], armor: ['light'], martialWeapons: false,
    skillChoices: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleightOfHand', 'stealth'], skillCount: 4,
    startingItems: ['rapier', 'shortbow', 'leather_armor', 'thieves_tools', 'healing_potion'], startingGold: 15, caster: 'none',
    suggested: { str: 8, dex: 15, con: 13, int: 12, wis: 10, cha: 14 },
    strengths: 'Sneak Attack, Expertise, best at traps, locks and stealth.', weaknesses: 'Moderate durability; relies on positioning.',
    features: [
      { id: 'expertise', name: 'Expertise', level: 1, desc: 'Double proficiency in two skills.' },
      { id: 'sneak_attack', name: 'Sneak Attack', level: 1, desc: 'Once per turn, deal extra damage with a finesse or ranged weapon when you have advantage or an ally is adjacent to the target.' },
      { id: 'cunning_action', name: 'Cunning Action', level: 2, desc: 'Dash, Disengage or Hide as a bonus action.', actions: ['cunning_dash', 'cunning_disengage', 'cunning_hide'] },
      { id: 'asi', name: 'Ability Score Improvement', level: 4, desc: 'Increase abilities or take a feat.' },
      { id: 'uncanny_dodge', name: 'Uncanny Dodge', level: 5, desc: 'Reaction: halve the damage of an attack that hits you.' },
      { id: 'expertise_2', name: 'Expertise (II)', level: 6, desc: 'Double proficiency in two more skills.' },
      { id: 'evasion', name: 'Evasion', level: 7, desc: 'Take no damage on a successful Dexterity save against area effects, half on a failure.' },
    ],
    subclasses: [
      { id: 'nightblade', name: 'Nightblade', desc: 'An assassin who strikes before the enemy understands a fight has begun.', features: [
        { id: 'assassinate', name: 'Assassinate', level: 3, desc: 'Advantage on attacks against creatures that have not yet taken a turn in this combat.' },
        { id: 'deadly_ambush', name: 'Deadly Ambush', level: 9, desc: 'Your first hit against a creature that has not yet acted deals +2d6 damage.' },
      ] },
      { id: 'veilthief', name: 'Veil-Thief', desc: 'A burglar of impossible places, as quick with a potion as with a lock.', features: [
        { id: 'fast_hands', name: 'Fast Hands', level: 3, desc: 'Use an item (such as a potion) as a bonus action.' },
        { id: 'supreme_sneak', name: 'Supreme Sneak', level: 9, desc: 'Advantage on Stealth checks.' },
      ] },
    ],
  },
  {
    id: 'cleric', name: 'Cleric', sigil: '☀', role: 'Divine magic, healing and protection',
    desc: 'Priests whose faith is a living power. In an age when saints are being forgotten, that faith is tested daily.',
    hitDie: 8, primary: ['wis'], saves: ['wis', 'cha'], armor: ['light', 'medium', 'shield'], martialWeapons: false,
    skillChoices: ['history', 'insight', 'medicine', 'persuasion', 'religion'], skillCount: 2,
    startingItems: ['mace', 'scale_mail', 'shield', 'holy_symbol', 'healing_potion'], startingGold: 8,
    caster: 'full', castAbility: 'wis', prepares: true, cantrips: L([3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]),
    suggested: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 },
    strengths: 'Best healer; solid armour; radiant damage against undead.', weaknesses: 'Limited ranged damage early.',
    features: [
      { id: 'spellcasting', name: 'Spellcasting', level: 1, desc: 'Cast cleric spells using Wisdom.' },
      { id: 'channel_divinity', name: 'Channel Divinity: Turn the Faithless', level: 2, desc: 'Undead and echoes within 6 squares must make a Wisdom save or be turned.', actions: ['turn_undead'], resource: { id: 'channel_divinity', recharge: 'short' } },
      { id: 'asi', name: 'Ability Score Improvement', level: 4, desc: 'Increase abilities or take a feat.' },
      { id: 'destroy_undead', name: 'Destroy Undead', level: 5, desc: 'Turned undead of low power are destroyed outright.' },
    ],
    subclasses: [
      { id: 'hearth', name: 'Hearth Domain', desc: 'The saint of warm doors and full tables: healing magic that never runs thin.', features: [
        { id: 'disciple_of_life', name: 'Disciple of the Hearth', level: 3, desc: 'Healing spells restore an extra 2 + spell level HP.' },
        { id: 'blessed_healer', name: 'Blessed Healer', level: 6, desc: 'When your spell heals another creature, you regain 2 + the spell’s level HP.' },
        { id: 'divine_strike', name: 'Divine Strike', level: 8, desc: 'Once per turn, your weapon hits deal +1d8 radiant damage.' },
      ] },
      { id: 'lantern', name: 'Lantern Domain', desc: 'Light carried into forgotten places; the faith of Saint Orlen.', features: [
        { id: 'warding_flare', name: 'Warding Flare', level: 3, desc: 'Reaction: impose disadvantage on an attack against you. Uses = Wisdom modifier per long rest.', resource: { id: 'warding_flare', recharge: 'long' } },
        { id: 'improved_flare', name: 'Improved Flare', level: 6, desc: 'Warding Flare can protect any ally within 6 squares.' },
        { id: 'potent_spellcasting', name: 'Potent Spellcasting', level: 8, desc: 'Add your Wisdom modifier to cleric cantrip damage.' },
      ] },
    ],
  },
  {
    id: 'ranger', name: 'Ranger', sigil: '➶', role: 'Wilderness survival, archery and tracking',
    desc: 'Wardens of the wild places between towns, who notice when a forest has grown a path it did not have yesterday.',
    hitDie: 10, primary: ['dex', 'wis'], saves: ['str', 'dex'], armor: ['light', 'medium', 'shield'], martialWeapons: true,
    skillChoices: ['animalHandling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'], skillCount: 3,
    startingItems: ['longbow', 'shortsword', 'leather_armor', 'healing_potion'], startingGold: 10,
    caster: 'half', castAbility: 'wis', spellsKnown: L([0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11]),
    suggested: { str: 10, dex: 15, con: 13, int: 8, wis: 14, cha: 12 },
    strengths: 'Excellent archer; tracking; Favored Foe damage.', weaknesses: 'Fewer spells; middling defences.',
    features: [
      { id: 'natural_explorer', name: 'Natural Explorer', level: 1, desc: 'Advantage on Survival checks; you notice tracks others miss.' },
      { id: 'favored_foe', name: 'Favored Foe', level: 1, desc: 'Bonus action: mark a creature; your hits deal +1d4 damage to it. Uses = proficiency bonus per long rest.', actions: ['favored_foe'], resource: { id: 'favored_foe', recharge: 'long' } },
      { id: 'fighting_style', name: 'Fighting Style', level: 2, desc: 'Adopt a fighting style.' },
      { id: 'spellcasting', name: 'Spellcasting', level: 2, desc: 'Cast ranger spells using Wisdom.' },
      { id: 'asi', name: 'Ability Score Improvement', level: 4, desc: 'Increase abilities or take a feat.' },
      { id: 'extra_attack', name: 'Extra Attack', level: 5, desc: 'Attack twice when you take the Attack action.' },
      { id: 'roving', name: 'Roving', level: 6, desc: '+1 square of speed.' },
      { id: 'lands_stride', name: 'Land’s Stride', level: 8, desc: 'Difficult terrain costs you no extra movement.' },
      { id: 'natures_veil', name: 'Nature’s Veil', level: 10, desc: 'Bonus action: become invisible until the end of your next turn. Uses = proficiency bonus per long rest.', actions: ['natures_veil'], resource: { id: 'natures_veil', recharge: 'long' } },
    ],
    subclasses: [
      { id: 'hunter', name: 'Hunter', desc: 'You specialise in bringing down wounded prey.', features: [
        { id: 'colossus_slayer', name: 'Colossus Slayer', level: 3, desc: 'Once per turn, +1d8 damage to a creature below its maximum HP.' },
        { id: 'escape_the_horde', name: 'Escape the Horde', level: 7, desc: 'Opportunity attacks against you have disadvantage.' },
      ] },
      { id: 'fogwalker', name: 'Fogwalker', desc: 'A ranger of the grey places, deadliest in the first moments of a fight.', features: [
        { id: 'dread_ambusher', name: 'Dread Ambusher', level: 3, desc: '+Wisdom modifier to initiative; on your first turn, your first hit deals +1d8 damage.' },
        { id: 'iron_mind', name: 'Iron Mind', level: 7, desc: 'Proficiency in Wisdom saving throws.' },
      ] },
    ],
  },
  {
    id: 'paladin', name: 'Paladin', sigil: '✚', role: 'Armoured holy warrior, oaths and support',
    desc: 'Warriors bound by a sworn oath whose conviction burns as radiant power.',
    hitDie: 10, primary: ['str', 'cha'], saves: ['wis', 'cha'], armor: ['light', 'medium', 'heavy', 'shield'], martialWeapons: true,
    skillChoices: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'], skillCount: 2,
    startingItems: ['longsword', 'chain_mail', 'shield', 'holy_symbol', 'healing_potion'], startingGold: 10,
    caster: 'half', castAbility: 'cha', prepares: true,
    suggested: { str: 15, dex: 10, con: 13, int: 8, wis: 12, cha: 14 },
    strengths: 'Divine Smite burst damage; Lay on Hands; heavy armour.', weaknesses: 'Slow; resource-hungry.',
    features: [
      { id: 'lay_on_hands', name: 'Lay on Hands', level: 1, desc: 'A pool of healing equal to 5 × paladin level. Action: restore HP from the pool.', actions: ['lay_on_hands'], resource: { id: 'lay_on_hands', recharge: 'long' } },
      { id: 'fighting_style', name: 'Fighting Style', level: 2, desc: 'Adopt a fighting style.' },
      { id: 'spellcasting', name: 'Spellcasting', level: 2, desc: 'Cast paladin spells using Charisma.' },
      { id: 'divine_smite', name: 'Divine Smite', level: 2, desc: 'Expend a spell slot when you hit with a melee weapon to deal +2d8 radiant (+1d8 per slot level above 1st).', actions: ['smite_attack'] },
      { id: 'asi', name: 'Ability Score Improvement', level: 4, desc: 'Increase abilities or take a feat.' },
      { id: 'extra_attack', name: 'Extra Attack', level: 5, desc: 'Attack twice when you take the Attack action.' },
      { id: 'aura_of_protection', name: 'Aura of Protection', level: 6, desc: 'You and allies within 2 squares add your Charisma modifier (min +1) to saving throws while you are conscious.' },
      { id: 'aura_of_courage', name: 'Aura of Courage', level: 10, desc: 'You and allies within 2 squares cannot be frightened while you are conscious.' },
    ],
    subclasses: [
      { id: 'lantern_oath', name: 'Oath of the Lantern', desc: 'Swear to carry light into every forgotten dark.', features: [
        { id: 'sacred_weapon', name: 'Sacred Weapon', level: 3, desc: 'Bonus action, once per short rest: add Charisma modifier to weapon attack rolls for 10 rounds.', actions: ['sacred_weapon'], resource: { id: 'channel_divinity', recharge: 'short' } },
        { id: 'aura_of_devotion', name: 'Aura of Devotion', level: 7, desc: 'You and allies within 2 squares cannot be charmed while you are conscious.' },
      ] },
      { id: 'iron_vow', name: 'Oath of the Iron Vow', desc: 'Swear that no wrong goes unanswered.', features: [
        { id: 'vow_of_enmity', name: 'Vow of Enmity', level: 3, desc: 'Bonus action, once per short rest: advantage on attacks against one creature.', actions: ['vow_of_enmity'], resource: { id: 'channel_divinity', recharge: 'short' } },
        { id: 'relentless_avenger', name: 'Relentless Avenger', level: 7, desc: 'When you hit with an opportunity attack, the target is slowed.' },
      ] },
    ],
  },
  {
    id: 'bard', name: 'Bard', sigil: '♪', role: 'Social abilities, music, magic and inspiration',
    desc: 'Performers and lore-keepers. In a world forgetting itself, bards are the last who remember the old songs.',
    hitDie: 8, primary: ['cha'], saves: ['dex', 'cha'], armor: ['light'], martialWeapons: false,
    skillChoices: ['acrobatics', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'performance', 'persuasion', 'sleightOfHand', 'stealth', 'arcana', 'perception'], skillCount: 3,
    startingItems: ['rapier', 'leather_armor', 'lute', 'healing_potion'], startingGold: 12,
    caster: 'full', castAbility: 'cha', cantrips: L([2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]),
    spellsKnown: L([4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22]),
    suggested: { str: 8, dex: 14, con: 12, int: 10, wis: 13, cha: 15 },
    strengths: 'Best social skills; Bardic Inspiration; healing and control.', weaknesses: 'Modest damage and armour.',
    features: [
      { id: 'spellcasting', name: 'Spellcasting', level: 1, desc: 'Cast bard spells using Charisma.' },
      { id: 'bardic_inspiration', name: 'Bardic Inspiration', level: 1, desc: 'Bonus action: an ally gains a d6 to add to one attack roll, check or save. Uses = Charisma modifier per long rest.', actions: ['bardic_inspiration'], resource: { id: 'bardic_inspiration', recharge: 'long' } },
      { id: 'jack_of_all_trades', name: 'Jack of All Trades', level: 2, desc: 'Add half your proficiency bonus to checks you are not proficient in.' },
      { id: 'song_of_rest', name: 'Song of Rest', level: 2, desc: 'Allies regain an extra 1d6 HP during a short rest.' },
      { id: 'asi', name: 'Ability Score Improvement', level: 4, desc: 'Increase abilities or take a feat.' },
      { id: 'font_of_inspiration', name: 'Font of Inspiration', level: 5, desc: 'Bardic Inspiration recharges on a short rest.' },
      { id: 'countercharm', name: 'Countercharm', level: 6, desc: 'Allies within 6 squares have advantage on saves against being frightened or charmed.' },
      { id: 'magical_secrets', name: 'Magical Secrets', level: 10, desc: 'Learn two spells from any class’s list.' },
    ],
    subclasses: [
      { id: 'lore', name: 'College of Lore', desc: 'Collectors of every story — including the ones that were erased.', features: [
        { id: 'cutting_words', name: 'Cutting Words', level: 3, desc: 'Reaction: spend an inspiration to reduce an enemy attack roll by 1d6.' },
        { id: 'additional_secrets', name: 'Additional Magical Secrets', level: 6, desc: 'Learn two spells from any class’s list.' },
      ] },
      { id: 'valor', name: 'College of Valor', desc: 'Skalds who sing in the front line.', features: [
        { id: 'combat_inspiration', name: 'Combat Inspiration', level: 3, desc: 'Inspired allies may add the die to damage; you gain medium armour and shields.' },
        { id: 'extra_attack', name: 'Extra Attack', level: 6, desc: 'Attack twice when you take the Attack action.' },
      ] },
    ],
  },
  {
    id: 'warlock', name: 'Warlock', sigil: '☾', role: 'Supernatural pacts and distinctive magic',
    desc: 'Bargainers with powers from beyond the Veil. Every pact has a price; most warlocks are still paying.',
    hitDie: 8, primary: ['cha'], saves: ['wis', 'cha'], armor: ['light'], martialWeapons: false,
    skillChoices: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'], skillCount: 2,
    startingItems: ['dagger', 'leather_armor', 'arcane_focus', 'healing_potion'], startingGold: 10,
    caster: 'pact', castAbility: 'cha', cantrips: L([2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]),
    spellsKnown: L([2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]),
    suggested: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
    strengths: 'Eldritch Blast; Hex; slots recharge on a short rest.', weaknesses: 'Very few spell slots.',
    features: [
      { id: 'pact_magic', name: 'Pact Magic', level: 1, desc: 'Cast warlock spells using Charisma; slots recharge on a short rest.' },
      { id: 'agonizing_blast', name: 'Eldritch Invocation: Agonizing Blast', level: 2, desc: 'Add Charisma modifier to Eldritch Blast damage.' },
      { id: 'repelling_blast', name: 'Eldritch Invocation: Repelling Blast', level: 5, desc: 'Eldritch Blast pushes the target 1 square away.' },
      { id: 'asi', name: 'Ability Score Improvement', level: 4, desc: 'Increase abilities or take a feat.' },
    ],
    subclasses: [
      { id: 'hollow_choir', name: 'Patron: The Hollow Choir', desc: 'A chorus of voices from the Unwritten that sings your name.', features: [
        { id: 'awaken_whispers', name: 'Whispers of the Choir', level: 3, desc: 'Action, once per short rest: a creature makes a Wisdom save or is frightened for 2 rounds and takes 2d6 psychic.', actions: ['choir_whispers'], resource: { id: 'choir_whispers', recharge: 'short' } },
        { id: 'entropic_ward', name: 'Entropic Ward', level: 6, desc: 'Reaction, once per short rest: impose disadvantage on an attack against you.', resource: { id: 'entropic_ward', recharge: 'short' } },
        { id: 'thought_shield', name: 'Thought Shield', level: 10, desc: 'Resistance to psychic damage; immune to being charmed.' },
      ] },
      { id: 'ember_court', name: 'Patron: The Ember Court', desc: 'A court of burning nobles who reward ambition.', features: [
        { id: 'dark_blessing', name: 'Ember Blessing', level: 3, desc: 'When you reduce an enemy to 0 HP, gain temporary HP equal to Charisma modifier + warlock level.' },
        { id: 'embers_luck', name: 'Ember’s Own Luck', level: 6, desc: 'Once per short rest, add 1d10 to a failed saving throw.', resource: { id: 'embers_luck', recharge: 'short' } },
        { id: 'fiendish_resilience', name: 'Fiendish Resilience', level: 10, desc: 'Resistance to fire damage.' },
      ] },
    ],
  },
  {
    id: 'sorcerer', name: 'Sorcerer', sigil: '✺', role: 'Innate, volatile spellcaster',
    desc: 'Born with the Aether in their blood. As the Veil frays, sorcerers feel it first — and burn brightest.',
    hitDie: 6, primary: ['cha'], saves: ['con', 'cha'], armor: [], martialWeapons: false,
    skillChoices: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'], skillCount: 2,
    startingItems: ['dagger', 'traveler_clothes', 'arcane_focus', 'healing_potion'], startingGold: 10,
    caster: 'full', castAbility: 'cha', cantrips: L([4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]),
    spellsKnown: L([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15]),
    suggested: { str: 8, dex: 13, con: 14, int: 10, wis: 12, cha: 15 },
    strengths: 'Flexible metamagic; strong blasting.', weaknesses: 'Few spells known; fragile.',
    features: [
      { id: 'spellcasting', name: 'Spellcasting', level: 1, desc: 'Cast sorcerer spells using Charisma.' },
      { id: 'font_of_magic', name: 'Font of Magic', level: 2, desc: 'Sorcery points (= sorcerer level) fuel metamagic.', resource: { id: 'sorcery_points', recharge: 'long' } },
      { id: 'quickened_spell', name: 'Metamagic: Quickened Spell', level: 3, desc: 'Spend 2 sorcery points: next spell costs a bonus action instead of an action.', actions: ['quicken'] },
      { id: 'empowered_spell', name: 'Metamagic: Empowered Spell', level: 10, desc: 'Spend 1 sorcery point to reroll a levelled damage spell and keep the better result (used automatically).' },
      { id: 'asi', name: 'Ability Score Improvement', level: 4, desc: 'Increase abilities or take a feat.' },
    ],
    subclasses: [
      { id: 'wild_aether', name: 'Wild Aether', desc: 'Your magic is entangled with the fraying Veil. Sometimes it answers in voices not your own.', features: [
        { id: 'wild_surge', name: 'Wild Surge', level: 3, desc: 'Casting a levelled spell may trigger an unpredictable surge (roll of 1–2 on a d20).' },
        { id: 'bend_luck', name: 'Bend Luck', level: 6, desc: 'Reaction: spend 2 sorcery points to add 1d4 to an ally’s failed save (used automatically).' },
      ] },
      { id: 'ember_blood', name: 'Ember Bloodline', desc: 'Fire runs in your family, in more than one sense.', features: [
        { id: 'elemental_affinity', name: 'Elemental Affinity', level: 3, desc: 'Add Charisma modifier to fire spell damage.' },
        { id: 'ember_ward', name: 'Ember Ward', level: 6, desc: 'Resistance to fire damage.' },
      ] },
    ],
  },
  {
    id: 'barbarian', name: 'Barbarian', sigil: '⚒', role: 'Primal warrior fuelled by rage',
    desc: 'Warriors who channel fury into unstoppable force — and who must live with what that fury costs.',
    hitDie: 12, primary: ['str', 'con'], saves: ['str', 'con'], armor: ['light', 'medium', 'shield'], martialWeapons: true,
    skillChoices: ['animalHandling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'], skillCount: 2,
    startingItems: ['greataxe', 'hide_armor', 'handaxe', 'healing_potion'], startingGold: 8, caster: 'none',
    suggested: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
    strengths: 'Enormous hit points; Rage halves weapon damage.', weaknesses: 'No magic; reckless.',
    features: [
      { id: 'rage', name: 'Rage', level: 1, desc: 'Bonus action: for 10 rounds, +2 melee damage, resistance to bludgeoning, piercing and slashing, advantage on Strength checks.', actions: ['rage'], resource: { id: 'rage', recharge: 'long' } },
      { id: 'unarmored_defense', name: 'Unarmoured Defence', level: 1, desc: 'Without armour, AC = 10 + Dexterity + Constitution.' },
      { id: 'reckless_attack', name: 'Reckless Attack', level: 2, desc: 'Attack with advantage; attacks against you have advantage until your next turn.', actions: ['reckless_attack'] },
      { id: 'danger_sense', name: 'Danger Sense', level: 2, desc: 'Advantage on Dexterity saving throws.' },
      { id: 'asi', name: 'Ability Score Improvement', level: 4, desc: 'Increase abilities or take a feat.' },
      { id: 'extra_attack', name: 'Extra Attack', level: 5, desc: 'Attack twice when you take the Attack action.' },
      { id: 'feral_instinct', name: 'Feral Instinct', level: 7, desc: 'Advantage on initiative.' },
      { id: 'brutal_critical', name: 'Brutal Critical', level: 9, desc: 'Roll one extra weapon damage die on a critical hit.' },
    ],
    subclasses: [
      { id: 'unbroken', name: 'Path of the Unbroken', desc: 'Fury without end.', features: [
        { id: 'frenzy', name: 'Frenzy', level: 3, desc: 'While raging, make a melee weapon attack as a bonus action.', actions: ['frenzy_strike'] },
        { id: 'mindless_rage', name: 'Mindless Rage', level: 6, desc: 'While raging you cannot be charmed or frightened.' },
      ] },
      { id: 'ancestors', name: 'Path of the Forgotten Ancestors', desc: 'The spirits of an erased people fight at your side.', features: [
        { id: 'ancestral_protectors', name: 'Ancestral Protectors', level: 3, desc: 'While raging, the first creature you hit each turn has disadvantage on attacks against anyone but you.' },
        { id: 'spirit_shield', name: 'Spirit Shield', level: 6, desc: 'While raging, reaction: reduce damage to an ally within 6 squares by 2d6.' },
      ] },
    ],
  },
];

export const CLASS_BY_ID: Record<string, ClassDef> = Object.fromEntries(CLASSES.map((c) => [c.id, c]));

export const FIGHTING_STYLES = [
  { id: 'style_archery', name: 'Archery', desc: '+2 to ranged weapon attack rolls.' },
  { id: 'style_defense', name: 'Defence', desc: '+1 AC while wearing armour.' },
  { id: 'style_dueling', name: 'Duelling', desc: '+2 damage with a one-handed melee weapon and no other weapon.' },
  { id: 'style_great', name: 'Great Weapon Fighting', desc: 'Reroll 1s and 2s on damage dice of two-handed weapons.' },
];

export const FEATS = [
  { id: 'tough', name: 'Tough', desc: '+2 maximum HP per level.' },
  { id: 'alert', name: 'Alert', desc: '+5 initiative; you cannot be surprised.' },
  { id: 'war_caster', name: 'War Caster', desc: 'Advantage on Constitution saves to maintain concentration.' },
  { id: 'deadeye', name: 'Deadeye', desc: '+1 to ranged attack rolls and ignore half cover.' },
  { id: 'mobile', name: 'Mobile', desc: '+2 squares of speed; Dash ignores difficult terrain.' },
  { id: 'resilient', name: 'Resilient (Constitution)', desc: '+1 Constitution and proficiency in Constitution saves.' },
  { id: 'healer', name: 'Healer', desc: 'Your Help action on a downed ally restores them to 1d4+1 HP.' },
  { id: 'observant', name: 'Observant', desc: '+1 Wisdom and +5 passive Perception.' },
];
