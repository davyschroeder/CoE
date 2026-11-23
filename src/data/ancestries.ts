import type { Ability, Skill } from '../engine/types';

export interface AncestryDef {
  id: string;
  name: string;
  desc: string;
  bonuses: Partial<Record<Ability, number>>;
  speed: number; // tiles (5 ft each)
  traits: { name: string; desc: string }[];
  skills?: Skill[];
  darkvision?: boolean;
  resist?: string[];
  hue: number;
}

export const ANCESTRIES: AncestryDef[] = [
  {
    id: 'human', name: 'Human', hue: 30, speed: 6,
    desc: 'The most numerous people of Elyndra, builders of frontier towns and fractious kingdoms. Short-lived, stubborn, and endlessly adaptable.',
    bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    traits: [{ name: 'Versatile', desc: '+1 to every ability score.' }],
  },
  {
    id: 'elf', name: 'Elf', hue: 150, speed: 6, darkvision: true, skills: ['perception'],
    desc: 'Long-lived and precise, elves keep histories in song-cycles that span centuries. Some of their oldest songs describe places that no map contains.',
    bonuses: { dex: 2, int: 1 },
    traits: [
      { name: 'Keen Senses', desc: 'Proficiency in Perception.' },
      { name: 'Darkvision', desc: 'See farther in darkness and fog.' },
      { name: 'Unbent Mind', desc: 'Advantage on saves against being charmed.' },
    ],
  },
  {
    id: 'dwarf', name: 'Dwarf', hue: 15, speed: 5, darkvision: true, resist: ['poison'],
    desc: 'Deep-delvers of the Iron Mountains who measure honour in kept promises and well-laid stone.',
    bonuses: { con: 2, str: 1 },
    traits: [
      { name: 'Stoneblood', desc: 'Resistance to poison damage; advantage on saves against poison.' },
      { name: 'Darkvision', desc: 'See farther in darkness and fog.' },
      { name: 'Sturdy Gait', desc: 'Heavy armour does not slow you.' },
    ],
  },
  {
    id: 'halfling', name: 'Halfling', hue: 90, speed: 5,
    desc: 'Small, cheerful wanderers and hearth-keepers whose luck is the stuff of tavern legend.',
    bonuses: { dex: 2, cha: 1 },
    traits: [
      { name: 'Lucky', desc: 'When you roll a natural 1 on a d20 test, reroll it once.' },
      { name: 'Brave', desc: 'Advantage on saves against being frightened.' },
    ],
  },
  {
    id: 'gnome', name: 'Gnome', hue: 280, speed: 5, darkvision: true,
    desc: 'Inventive, quick-witted folk whose curiosity has started more fires than any dragon.',
    bonuses: { int: 2, cha: 1 },
    traits: [
      { name: 'Clever Mind', desc: 'Advantage on Intelligence, Wisdom and Charisma saves against magic.' },
      { name: 'Darkvision', desc: 'See farther in darkness and fog.' },
    ],
  },
  {
    id: 'halfelf', name: 'Half-Elf', hue: 200, speed: 6, darkvision: true,
    desc: 'Children of two peoples who belong fully to neither — and so learn to read every room they enter.',
    bonuses: { cha: 2, dex: 1, wis: 1 },
    traits: [
      { name: 'Two Worlds', desc: 'Proficiency in one extra skill of your choice (Insight by default).' },
      { name: 'Darkvision', desc: 'See farther in darkness and fog.' },
    ],
    skills: ['insight'],
  },
  {
    id: 'veilborn', name: 'Veilborn', hue: 255, speed: 6, darkvision: true, resist: ['psychic'],
    desc: 'People touched by the Unwritten before birth. Their eyes hold a faint inner light, and they dream of lives they never lived.',
    bonuses: { cha: 2, int: 1 },
    traits: [
      { name: 'Echo-Touched', desc: 'Resistance to psychic damage.' },
      { name: 'Darkvision', desc: 'See farther in darkness and fog.' },
      { name: 'Veil-Sense', desc: 'Advantage on checks to perceive Aether resonance.' },
    ],
  },
  {
    id: 'ashkin', name: 'Ashkin', hue: 0, speed: 6, darkvision: true,
    desc: 'Tall, ash-grey people whose sagas speak of a homeland no historian can place. They are slow to anger and slower to forget.',
    bonuses: { str: 2, con: 1 },
    traits: [
      { name: 'Unyielding', desc: 'Once per long rest, when reduced to 0 HP but not killed outright, drop to 1 HP instead.' },
      { name: 'Darkvision', desc: 'See farther in darkness and fog.' },
      { name: 'Menacing', desc: 'Proficiency in Intimidation.' },
    ],
    skills: ['intimidation'],
  },
];

export const ANCESTRY_BY_ID: Record<string, AncestryDef> = Object.fromEntries(ANCESTRIES.map((a) => [a.id, a]));
