import type { Skill } from '../engine/types';

export interface RecipeDef {
  id: string;
  name: string;
  output: { itemId: string; qty: number };
  materials: [string, number][];
  gold?: number;
  skill?: Skill;          // check made by the best party member
  dc?: number;
  requiresClass?: string; // someone in the active party must have this class
  desc: string;
}

/** Crafting turns battlefield spoils into supplies. Failure wastes some materials, never all (unless badly failed). */
export const RECIPES: RecipeDef[] = [
  { id: 'r_healing', name: 'Brew a Potion of Healing', output: { itemId: 'healing_potion', qty: 1 }, materials: [['fog_essence', 2]], gold: 10, skill: 'medicine', dc: 12,
    desc: 'Fog essence binds the healing herbs; the potion keeps a faint grey shimmer.' },
  { id: 'r_greater_healing', name: 'Distil a Potion of Greater Healing', output: { itemId: 'greater_healing_potion', qty: 1 }, materials: [['healing_potion', 1], ['echo_shard', 2]], skill: 'medicine', dc: 15,
    desc: 'Dissolve memory-crystal into an ordinary healing draught: the body remembers being whole.' },
  { id: 'r_antitoxin', name: 'Mix Antitoxin', output: { itemId: 'antitoxin', qty: 1 }, materials: [['bone_dust', 2]], skill: 'medicine', dc: 11,
    desc: 'Ossuary dust, boiled and filtered — old remedies from the cathedral infirmary.' },
  { id: 'r_courage', name: 'Brew an Elixir of Steady Nerve', output: { itemId: 'elixir_courage', qty: 1 }, materials: [['echo_shard', 1], ['fog_essence', 1]], skill: 'medicine', dc: 13,
    desc: 'Fear is a memory of pain. This elixir makes it briefly forget.' },
  { id: 'r_aether', name: 'Condense an Aether Draught', output: { itemId: 'aether_draught', qty: 1 }, materials: [['echo_shard', 2]], skill: 'arcana', dc: 13,
    desc: 'Melt echo shards into a drinkable resonance. It tastes of static and other people’s birthdays.' },
  { id: 'r_oil', name: 'Fill Lantern Oil Flasks', output: { itemId: 'lantern_oil_flask', qty: 2 }, materials: [], gold: 4,
    desc: 'Buy oil, find bottles, cork carefully.' },
  { id: 'r_scroll_guiding', name: 'Scribe a Scroll of Guiding Bolt', output: { itemId: 'scroll_guiding_bolt', qty: 1 }, materials: [['bone_dust', 1]], gold: 25, skill: 'religion', dc: 13, requiresClass: 'cleric',
    desc: 'A cleric inks the prayer with lantern-soot and consecrated bone dust.' },
  { id: 'r_echo_ward', name: 'Craft an Echo-Ward Charm', output: { itemId: 'echo_ward_charm', qty: 1 }, materials: [['sentinel_core', 1], ['echo_shard', 2]], skill: 'arcana', dc: 15,
    desc: 'Re-tune a Sentinel’s core to hum against the Unwritten instead of for it.' },
  { id: 'r_bellsong', name: 'Forge a Bellsong Pendant', output: { itemId: 'bellsong_pendant', qty: 1 }, materials: [['silver_bell_clapper', 1], ['echo_shard', 1]], skill: 'arcana', dc: 14,
    desc: 'A sliver of the Bellwarden’s bronze, still remembering how to ring.' },
  { id: 'r_fogweave', name: 'Weave a Fogweave Cloak', output: { itemId: 'fogweave_cloak', qty: 1 }, materials: [['dark_cloak', 1], ['fog_essence', 4]], skill: 'arcana', dc: 14,
    desc: 'Fog essence soaked into wool: the cloak never quite stops being somewhere else.' },
];

export const RECIPE_BY_ID: Record<string, RecipeDef> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
