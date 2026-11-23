import type { Skill } from '../engine/types';

export interface BackgroundDef {
  id: string;
  name: string;
  desc: string;
  skills: Skill[];
  feature: { name: string; desc: string };
  items: string[];
  gold: number;
}

/** Backgrounds unlock dialogue options via the `bg:<id>` condition. */
export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: 'soldier', name: 'Soldier', skills: ['athletics', 'intimidation'], gold: 10, items: ['bedroll', 'insignia_rank'],
    desc: 'You marched under a banner — perhaps the Iron Covenant\'s — and learned that orders and conscience do not always agree.',
    feature: { name: 'Military Rank', desc: 'Watchmen and soldiers treat you as one of their own. Some conversations open up only to a veteran.' },
  },
  {
    id: 'scholar', name: 'Scholar', skills: ['arcana', 'history'], gold: 10, items: ['ink_and_quill', 'scholar_journal'],
    desc: 'You studied in the archives of Ashenford, where whole shelves are kept locked and the librarians do not explain why.',
    feature: { name: 'Researcher', desc: 'You can recall or locate obscure lore others would miss.' },
  },
  {
    id: 'criminal', name: 'Criminal', skills: ['deception', 'stealth'], gold: 15, items: ['thieves_tools', 'dark_cloak'],
    desc: 'You know which doors are watched and which guards can be bought. You also know what it costs to be caught.',
    feature: { name: 'Underworld Contacts', desc: 'You recognise thieves\' signs and can speak the language of smugglers.' },
  },
  {
    id: 'acolyte', name: 'Acolyte', skills: ['insight', 'religion'], gold: 8, items: ['prayer_beads'],
    desc: 'You served in a temple of the Lantern Faith, tending candles for saints whose names are slowly fading from the hymnals.',
    feature: { name: 'Shelter of the Faithful', desc: 'Clergy offer you aid and confidences.' },
  },
  {
    id: 'folkhero', name: 'Folk Hero', skills: ['animalHandling', 'survival'], gold: 10, items: ['bedroll'],
    desc: 'You stood up when no one else would — against a tax collector, a beast, a flood. Common folk remember.',
    feature: { name: 'Rustic Hospitality', desc: 'Ordinary people trust you and will hide or help you.' },
  },
  {
    id: 'noble', name: 'Noble', skills: ['history', 'persuasion'], gold: 25, items: ['signet_ring', 'fine_clothes'],
    desc: 'Your family\'s name still opens doors in Solmara, though you may have reasons to keep it quiet.',
    feature: { name: 'Position of Privilege', desc: 'Officials and wealthy folk grant you an audience.' },
  },
  {
    id: 'outlander', name: 'Outlander', skills: ['athletics', 'survival'], gold: 8, items: ['hunting_trap'],
    desc: 'You grew up beyond the frontier, where the forests sometimes rearrange themselves overnight.',
    feature: { name: 'Wanderer', desc: 'You read land and weather and can always find food and a path.' },
  },
  {
    id: 'entertainer', name: 'Entertainer', skills: ['acrobatics', 'performance'], gold: 12, items: ['lute', 'costume'],
    desc: 'You have played every tavern from Ashenford to the Ember Wastes. Audiences tell you things they tell no one else.',
    feature: { name: 'By Popular Demand', desc: 'Crowds know you; performances can open conversations or change moods.' },
  },
];

export const BACKGROUND_BY_ID: Record<string, BackgroundDef> = Object.fromEntries(BACKGROUNDS.map((b) => [b.id, b]));
