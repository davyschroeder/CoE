import type { Ability, Skill } from '../engine/types';
import type { Tag } from './schema';

export interface CompanionDef {
  id: string;
  name: string;
  title: string;
  pronoun: 'he' | 'she' | 'they';
  ancestry: string;
  classId: string;
  subclassId: string;
  background: string;
  abilities: Record<Ability, number>; // before ancestry bonuses
  skills: Skill[];
  expertise?: Skill[];
  cantrips?: string[];
  spells?: string[];
  fightingStyle?: string;
  hue: number;
  blurb: string;
  bio: string;
  personality: string;
  philosophy: string;
  ambition: string;
  fear: string;
  /** Kept hidden from the player in the UI until discovered in camp conversations. */
  secret: string;
  questHook: string;
  /** -3 (despises) .. +3 (cherishes) — drives reactions, suggestions and votes. */
  values: Partial<Record<Tag, number>>;
  /** Tags this companion will not accept from the player; repeated violations can make them leave. */
  hardLimits: Tag[];
  /** Personality dials (0..1) used by the companion mind. */
  traits: { curiosity: number; caution: number; talkative: number; initiative: number; humor: number; temper: number };
  /** Combat personality weights (0..1) used by the tactical AI. */
  combat: { role: 'tank' | 'striker' | 'healer' | 'controller' | 'skirmisher'; aggression: number; caution: number; support: number; focus: number };
  bonds: Record<string, number>;
}

const ab = (str: number, dex: number, con: number, int: number, wis: number, cha: number) => ({ str, dex, con, int, wis, cha });

export const COMPANIONS: CompanionDef[] = [
  {
    id: 'vaelis', name: 'Vaelis Thorne', title: 'Elf Wizard', pronoun: 'he', ancestry: 'elf', classId: 'wizard', subclassId: 'evoker', background: 'scholar',
    abilities: ab(8, 13, 14, 15, 12, 10), skills: ['investigation', 'insight'], cantrips: ['fire_bolt', 'ray_of_frost', 'shocking_grasp'],
    spells: ['magic_missile', 'burning_hands', 'thunderwave', 'shield', 'scorching_ray', 'shatter'], hue: 210,
    blurb: 'Brilliant, sarcastic, obsessed with forbidden knowledge.',
    bio: 'Two hundred and twelve years old and still the cleverest person in any room — a fact he will mention. A former prodigy of the Aether Conclave who says he was "expelled for reading the wrong books." He is in Hollowmere because his instruments registered a Veil tremor here three weeks before the festival.',
    personality: 'Analytical, sarcastic, impatient with ignorance, secretly lonely.', philosophy: 'No knowledge is evil. Ignorance is the only sin.',
    ambition: 'To read the Unwritten and know everything that was ever lost.', fear: 'Mediocrity. Becoming a footnote.',
    secret: 'He was Archon Severin Cael\'s apprentice and co-authored the theorem the Conclave uses to track the Heart. He fled out of fear, not principle.',
    questHook: 'He recognises the Conclave\'s tracking instruments as his own design.',
    values: { curiosity: 3, knowledge: 3, forbidden: 2, boldness: 1, faith: -2, tradition: -2, caution: -1, authority: -1, humor: 1 },
    hardLimits: [],
    traits: { curiosity: 0.95, caution: 0.25, talkative: 0.8, initiative: 0.7, humor: 0.6, temper: 0.4 },
    combat: { role: 'controller', aggression: 0.7, caution: 0.6, support: 0.2, focus: 0.6 },
    bonds: { nima: 5, seris: -10, orren: 5, ilyra: 0, kael: 0 },
  },
  {
    id: 'brakka', name: 'Brakka Stonevein', title: 'Dwarf Fighter', pronoun: 'she', ancestry: 'dwarf', classId: 'fighter', subclassId: 'bulwark', background: 'soldier',
    abilities: ab(15, 10, 14, 10, 13, 8), skills: ['perception', 'insight'], fightingStyle: 'style_defense', hue: 20,
    blurb: 'Loyal, stubborn, protective — and unexpectedly philosophical.',
    bio: 'A Shieldwarden of Kharn Dovrek whose home, Hall Ostrem, was found one morning as a centuries-old ruin. Her clan insists it fell four hundred years ago. She remembers eating breakfast there last spring. She came to Hollowmere following rumours of other places that "changed overnight."',
    personality: 'Steady, blunt, protective, prone to campfire philosophy.', philosophy: 'A wall is worth only what it keeps safe.',
    ambition: 'To learn what happened to Ostrem and bring its people home — or bury them properly.', fear: 'That she is the one who is wrong.',
    secret: 'Unknown even to her: she is partly an echo. In this reality, Brakka Stonevein died as a child.',
    questHook: 'Someone in Hollowmere also remembers a place that no longer exists.',
    values: { protect: 3, mercy: 1, boldness: 2, honesty: 2, cruelty: -3, deception: -1, caution: 0, tradition: 1, violence: 0, charity: 1 },
    hardLimits: ['cruelty'],
    traits: { curiosity: 0.4, caution: 0.5, talkative: 0.5, initiative: 0.6, humor: 0.4, temper: 0.5 },
    combat: { role: 'tank', aggression: 0.6, caution: 0.3, support: 0.6, focus: 0.5 },
    bonds: { korr: 10, kael: -5, tessa: 5 },
  },
  {
    id: 'kael', name: 'Kael Veyran', title: 'Human Rogue', pronoun: 'he', ancestry: 'human', classId: 'rogue', subclassId: 'veilthief', background: 'criminal',
    abilities: ab(8, 15, 12, 12, 10, 14), skills: ['sleightOfHand', 'perception', 'persuasion', 'investigation'], expertise: ['sleightOfHand', 'stealth'], hue: 40,
    blurb: 'Charming, cynical, opportunistic — and secretly kind.',
    bio: 'A Solmara street thief turned smuggler, currently "between employers." He claims he came to Hollowmere for the festival ale. In truth, a client paid him to keep an eye on anyone who goes near the old cathedral.',
    personality: 'Quick-tongued, cynical, generous when he thinks nobody is watching.', philosophy: 'The game is rigged, so cheat back — but never cheat anyone smaller than you.',
    ambition: 'To buy the deed of the Wren House orphanage and get out of the game.', fear: 'Being trusted, and failing.',
    secret: 'An Iron Covenant spymaster holds the orphanage\'s debts and has Kael reporting on anyone interesting. You are about to become very interesting.',
    questHook: 'A letter with no seal finds him wherever he goes.',
    values: { pragmatic: 2, deception: 1, greed: 1, stealth: 2, humor: 2, charity: 1, authority: -2, faith: -1, honesty: -1, cruelty: -2, protect: 1 },
    hardLimits: [],
    traits: { curiosity: 0.6, caution: 0.6, talkative: 0.85, initiative: 0.6, humor: 0.9, temper: 0.3 },
    combat: { role: 'striker', aggression: 0.7, caution: 0.6, support: 0.2, focus: 0.9 },
    bonds: { seris: -5, brakka: -5, varek: -5 },
  },
  {
    id: 'seris', name: 'Seris Dawnbound', title: 'Human Paladin', pronoun: 'she', ancestry: 'human', classId: 'paladin', subclassId: 'lantern_oath', background: 'acolyte',
    abilities: ab(15, 10, 13, 8, 12, 14), skills: ['athletics', 'persuasion'], spells: ['bless', 'cure_wounds', 'shield_of_faith', 'command'], hue: 45,
    blurb: 'Honourable and courageous, but rigid in her judgements.',
    bio: 'A Knight-Oathsworn of the Order of the Last Dawn, raised in its foundling house. She was sent to Hollowmere to judge whether the town is "tainted" by the Veil\'s collapse — and what must be done if it is.',
    personality: 'Brave, principled, disciplined, terrified of doubt.', philosophy: 'Law is absolute. Mercy without justice is cowardice.',
    ambition: 'To be named Dawnblade of her Order.', fear: 'That the Lights are not there.',
    secret: 'Her relic, the Ember of Aurel, is a shard of an Ithari Anchor. Her "divine" power may be Aether. Her superiors know.',
    questHook: 'Her orders regarding Hollowmere are sealed — and heavier than she admits.',
    values: { honesty: 3, faith: 2, authority: 2, protect: 2, tradition: 1, deception: -3, forbidden: -3, cruelty: -3, greed: -2, stealth: -1, mercy: 0 },
    hardLimits: ['cruelty', 'forbidden'],
    traits: { curiosity: 0.3, caution: 0.4, talkative: 0.6, initiative: 0.8, humor: 0.2, temper: 0.7 },
    combat: { role: 'tank', aggression: 0.7, caution: 0.3, support: 0.5, focus: 0.6 },
    bonds: { kael: -5, varek: -15, ilyra: 5, vaelis: -10 },
  },
  {
    id: 'nima', name: 'Nima Emberglass', title: 'Half-Elf Sorcerer', pronoun: 'she', ancestry: 'halfelf', classId: 'sorcerer', subclassId: 'wild_aether', background: 'entertainer',
    abilities: ab(8, 13, 14, 10, 10, 15), skills: ['arcana', 'persuasion'], cantrips: ['fire_bolt', 'ray_of_frost', 'shocking_grasp', 'blade_ward'],
    spells: ['burning_hands', 'magic_missile', 'veil_shroud', 'scorching_ray'], hue: 15,
    blurb: 'Impulsive, curious and fascinated by unstable magic.',
    bio: 'Her magic woke in a Veil flicker that burned down her family\'s glassworks in Ashenford. She has been chasing flickers ever since — and Hollowmere, she says, "tastes like a storm about to happen."',
    personality: 'Excitable, emotional, reckless, fiercely warm.', philosophy: 'Rules are walls built by frightened people.',
    ambition: 'To master her storm and learn who whispers in her flames.', fear: 'Hurting someone she loves. Again.',
    secret: 'Her power flows from an unrealised future in which she became the Ember Queen, who burned half of Elyndra.',
    questHook: 'The flames sometimes answer her in a voice that sounds like her own, only older.',
    values: { curiosity: 3, boldness: 3, forbidden: 2, humor: 2, defiance: 2, caution: -2, authority: -2, tradition: -2, mercy: 1 },
    hardLimits: [],
    traits: { curiosity: 1.0, caution: 0.1, talkative: 0.9, initiative: 0.9, humor: 0.8, temper: 0.6 },
    combat: { role: 'striker', aggression: 0.95, caution: 0.2, support: 0.1, focus: 0.4 },
    bonds: { vaelis: 0, orren: 10, tessa: 15 },
  },
  {
    id: 'orren', name: 'Orren Mossward', title: 'Halfling Ranger', pronoun: 'he', ancestry: 'halfling', classId: 'ranger', subclassId: 'hunter', background: 'outlander',
    abilities: ab(10, 15, 13, 10, 14, 8), skills: ['perception', 'stealth', 'nature'], spells: ['hunters_mark', 'cure_wounds'], hue: 100,
    blurb: 'Quiet, observant, patient; prefers diplomacy and stealth.',
    bio: 'A path-warden of the Whispering Woods, like his grandmother before him. The woods have been growing paths that were not there yesterday, and every new path points toward Hollowmere.',
    personality: 'Calm, watchful, dry-humoured, slow to judge.', philosophy: 'Listen before you act. Take only what you need.',
    ambition: 'To keep the Woods whole and find his grandmother\'s "Old Path."', fear: 'That the Woods will become something he cannot read.',
    secret: 'He carries an acorn from the First Tree — a living seed from before the Unmaking.',
    questHook: 'The acorn in his pocket grew warm when the bell rang.',
    values: { nature: 3, caution: 2, diplomacy: 2, stealth: 2, mercy: 1, violence: -2, greed: -2, forbidden: -1, cruelty: -3, boldness: -1 },
    hardLimits: ['cruelty'],
    traits: { curiosity: 0.5, caution: 0.85, talkative: 0.3, initiative: 0.4, humor: 0.5, temper: 0.1 },
    combat: { role: 'skirmisher', aggression: 0.5, caution: 0.8, support: 0.4, focus: 0.8 },
    bonds: { nima: 10, korr: 10, vaelis: 0 },
  },
  {
    id: 'ilyra', name: 'Ilyra Voss', title: 'Human Cleric', pronoun: 'she', ancestry: 'human', classId: 'cleric', subclassId: 'hearth', background: 'acolyte',
    abilities: ab(12, 10, 14, 10, 15, 12), skills: ['medicine', 'persuasion'], cantrips: ['sacred_flame', 'toll_the_dead', 'blade_ward'],
    spells: ['cure_wounds', 'healing_word', 'bless', 'guiding_bolt', 'spiritual_weapon', 'lesser_restoration'], hue: 50,
    blurb: 'Compassionate, deeply religious, troubled by her faith.',
    bio: 'A hospice priestess from Solmara who tends the returned dead. One of them, Tamsin, remembers being her husband — a man she never married. She came to Hollowmere\'s festival to light a lantern for someone she cannot name.',
    personality: 'Gentle, wry, patient, quietly brave.', philosophy: 'Compassion before doctrine. Doubt is part of faith.',
    ambition: 'To learn where the returned dead belong.', fear: 'That her prayers go nowhere — or to someone cruel.',
    secret: 'She has granted mercy deaths to returned dead who begged for them. The Church calls it murder.',
    questHook: 'A returned man in Solmara writes to her every week, signing as her husband.',
    values: { mercy: 3, charity: 2, faith: 1, protect: 2, honesty: 1, diplomacy: 1, cruelty: -3, violence: -1, greed: -2 },
    hardLimits: ['cruelty'],
    traits: { curiosity: 0.5, caution: 0.6, talkative: 0.5, initiative: 0.5, humor: 0.5, temper: 0.1 },
    combat: { role: 'healer', aggression: 0.3, caution: 0.6, support: 0.95, focus: 0.4 },
    bonds: { seris: 5, varek: 5, vaelis: 0 },
  },
  {
    id: 'varek', name: 'Varek Sable', title: 'Veilborn Warlock', pronoun: 'he', ancestry: 'veilborn', classId: 'warlock', subclassId: 'hollow_choir', background: 'noble',
    abilities: ab(8, 14, 13, 12, 10, 15), skills: ['deception', 'arcana'], cantrips: ['eldritch_blast', 'chill_touch'], spells: ['hex', 'veil_shroud', 'dissonant_whispers', 'misty_step'], hue: 270,
    blurb: 'Mysterious, ambitious, reluctant to discuss his patron.',
    bio: 'Born in Ashenford with violet, faintly luminous eyes; nearly drowned by a mob as a boy. His patron is "a choir" — he will say no more. He arrived in Hollowmere the day before the festival and has been asking the innkeeper about the cathedral\'s foundations.',
    personality: 'Dry, elegant, guarded, ambitious, occasionally startlingly kind.', philosophy: 'Power is the only protection the forgotten ever get.',
    ambition: 'To become someone who cannot be erased.', fear: 'Becoming one more voice in the Choir.',
    secret: 'His patron, the Hollow Choir, is the multitude of souls folded inside the Heart of Aether. They chose him to carry them toward it.',
    questHook: 'The Choir sang louder the closer he came to Hollowmere.',
    values: { pragmatic: 2, forbidden: 2, knowledge: 1, defiance: 2, deception: 1, authority: -2, faith: -2, cruelty: -1, mercy: 0 },
    hardLimits: [],
    traits: { curiosity: 0.7, caution: 0.5, talkative: 0.4, initiative: 0.6, humor: 0.5, temper: 0.4 },
    combat: { role: 'controller', aggression: 0.7, caution: 0.6, support: 0.2, focus: 0.7 },
    bonds: { seris: -15, kael: -5, ilyra: 5 },
  },
  {
    id: 'tessa', name: 'Tessa Quickthorn', title: 'Gnome Bard', pronoun: 'she', ancestry: 'gnome', classId: 'bard', subclassId: 'lore', background: 'entertainer',
    abilities: ab(8, 14, 12, 12, 10, 15), skills: ['insight', 'persuasion', 'deception'], cantrips: ['vicious_mockery', 'blade_ward'],
    spells: ['healing_word', 'dissonant_whispers', 'cure_wounds', 'thunderwave', 'shatter', 'invisibility'], hue: 320,
    blurb: 'Playful, persuasive, witty and socially perceptive.',
    bio: 'Lead player of the Quickthorn Wandering Company and collector of "songs with no origin." She is booked to play the Festival of Lanterns. Her company, she says, "disbanded." She changes the subject quickly.',
    personality: 'Bright, teasing, perceptive, quietly lonely.', philosophy: 'Stories keep people alive — so remember carefully.',
    ambition: 'To compose the Song of Everything Forgotten.', fear: 'Silence. Being left behind.',
    secret: 'Two years ago she sang a reconstructed tide-song that opened the Veil. Her whole company vanished into the Unwritten.',
    questHook: 'The bell\'s tolling matches a melody in her book of songs with no origin.',
    values: { diplomacy: 3, humor: 3, mercy: 1, curiosity: 2, honesty: 0, deception: 1, violence: -2, cruelty: -2, authority: -1 },
    hardLimits: [],
    traits: { curiosity: 0.8, caution: 0.4, talkative: 0.95, initiative: 0.7, humor: 1.0, temper: 0.2 },
    combat: { role: 'controller', aggression: 0.4, caution: 0.6, support: 0.8, focus: 0.5 },
    bonds: { brakka: 5, nima: 15, korr: 5 },
  },
  {
    id: 'korr', name: 'Korr Ashmane', title: 'Ashkin Barbarian', pronoun: 'he', ancestry: 'ashkin', classId: 'barbarian', subclassId: 'ancestors', background: 'outlander',
    abilities: ab(15, 13, 14, 8, 12, 10), skills: ['athletics', 'perception'], hue: 0,
    blurb: 'Intimidating, proud, loyal; carries deep guilt.',
    bio: 'Former war-leader of the Ashkin band Cinderfang, exiled after he killed his oath-brother Thal in a battle-rage. He works as a caravan guard now. His caravan left Hollowmere without him; he has not said why he stayed.',
    personality: 'Blunt, proud, protective, warm once he trusts you.', philosophy: 'Honour is what you do when no one will sing of it.',
    ambition: 'To earn back his name — and learn what the Ashkin really were.', fear: 'His own rage.',
    secret: 'His rage is an echo of the Drevakh, a people erased because they fought the Rewriting.',
    questHook: 'In the fog he hears Thal calling his name.',
    values: { boldness: 2, protect: 2, honesty: 2, violence: 1, cruelty: -3, deception: -2, caution: -1, tradition: 1 },
    hardLimits: ['cruelty'],
    traits: { curiosity: 0.3, caution: 0.2, talkative: 0.3, initiative: 0.8, humor: 0.3, temper: 0.8 },
    combat: { role: 'tank', aggression: 0.95, caution: 0.1, support: 0.3, focus: 0.6 },
    bonds: { brakka: 10, tessa: 5, orren: 10 },
  },
];

export const COMPANION_BY_ID: Record<string, CompanionDef> = Object.fromEntries(COMPANIONS.map((c) => [c.id, c]));
