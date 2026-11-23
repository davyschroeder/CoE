import type { MapDef } from './types';
import { GRIDS } from './grids';
import { CQ_OBJECTS } from '../companionQuests';
import { ACT1_MAPS } from './act1';
import { ACT1 } from '../act1/index';

const FESTIVAL = '!bell_rang';
const NIGHT = 'bell_rang';

export const HOLLOWMERE: MapDef = {
  id: 'hollowmere', name: 'Hollowmere', tileset: 'town', grid: GRIDS.hollowmere, hub: 'hollowmere',
  lighting: [{ if: 'prologue_complete', value: 'day' }, { if: NIGHT, value: 'fog' }, { value: 'dusk' }],
  instability: [{ if: 'prologue_complete', value: 1 }, { if: NIGHT, value: 3 }, { value: 0 }],
  music: [{ if: 'prologue_complete', value: 'festival' }, { if: NIGHT, value: 'fog' }, { value: 'festival' }],
  enter: [
    { if: NIGHT, text: 'The fog lies thick between the houses, grey and faintly luminous, like breath on cold glass. Lanterns still hang from every eave, but their light does not travel far. Somewhere a dog is barking at nothing. Somewhere else, someone is calling a name that no one answers to.' },
    { text: 'Hollowmere on the last night of the Festival of Lanterns: paper lanterns in every colour sway from eaves and washing lines, the square smells of roasted chestnuts and spiced cider, and a fiddler is losing a race against a drum. North, beyond the town wall, the broken silhouette of the old cathedral rises against a violet sky. Its bell tower ends in a jagged stump, eighty years dead.' },
  ],
  randomEncounters: { if: 'bell_rang && !prologue_complete', chance: 0.012, encounters: ['enc_fog_random', 'enc_fog_random2'], max: 2 },
  objects: [
    // ── Exits & transitions
    { id: 'north_gate', kind: 'exit', name: 'North Gate — Cathedral Road', x: 24, y: 0, w: 3, h: 1, if: NIGHT, to: { map: 'cathedral', x: 17, y: 27 } },
    { id: 'gate_closed', kind: 'trigger', name: 'North Gate', x: 23, y: 1, w: 5, h: 1, if: FESTIVAL, dialogue: 'gate_closed', blocks: true },
    { id: 'inn_door', kind: 'exit', name: 'The Lantern & Lamb', x: 10, y: 15, to: { map: 'inn', x: 10, y: 12 } },
    { id: 'south_road_exit', kind: 'exit', name: 'The Roads of Elyndra (travel)', x: 24, y: 33, w: 3, if: 'prologue_complete', to: { map: 'world', x: 0, y: 0 } },
    { id: 'south_road', kind: 'inspect', name: 'South Road', x: 25, y: 33, if: '!prologue_complete', desc: 'The road south winds back toward the lowlands you came from. Whatever is happening in Hollowmere, it is happening here.' },
    // ── Festival NPCs
    { id: 'maren', kind: 'npc', name: 'Sister Maren Ash', x: 21, y: 15, if: FESTIVAL, dialogue: 'maren', glyph: 'M', blocks: true },
    { id: 'maren_night', kind: 'npc', name: 'Sister Maren Ash', x: 26, y: 3, if: 'bell_rang && !prologue_complete', dialogue: 'maren', glyph: 'M', blocks: true },
    { id: 'mayor', kind: 'npc', name: 'Mayor Edda Brannock', x: 24, y: 11, if: FESTIVAL, dialogue: 'mayor', glyph: 'E', blocks: true },
    { id: 'mayor_night', kind: 'npc', name: 'Mayor Edda Brannock', x: 23, y: 8, if: 'bell_rang && !prologue_complete', dialogue: 'mayor', glyph: 'E', blocks: true },
    { id: 'hale', kind: 'npc', name: 'Captain Roderic Hale', x: 27, y: 13, if: FESTIVAL, dialogue: 'hale', glyph: 'H', blocks: true },
    { id: 'hale_night', kind: 'npc', name: 'Captain Roderic Hale', x: 26, y: 14, if: 'bell_rang && !prologue_complete', dialogue: 'hale', glyph: 'H', blocks: true },
    { id: 'wenna', kind: 'npc', name: 'Old Wenna', x: 11, y: 25, dialogue: 'wenna', glyph: 'W', blocks: true },
    { id: 'pell', kind: 'npc', name: 'Pell', x: 16, y: 21, if: FESTIVAL, dialogue: 'pell', glyph: 'p', blocks: true },
    { id: 'garrick', kind: 'npc', name: 'Garrick Dunmore', x: 32, y: 12, dialogue: 'garrick', glyph: 'G', blocks: true, if: '!bell_rang || shop_cleared || questdone:sq_fog_rescue || rescued_count>=1' },
    { id: 'ysolde', kind: 'npc', name: 'Ysolde Quill', x: 32, y: 18, if: '!bell_rang || ysolde_saved', dialogue: 'ysolde', glyph: 'Q', blocks: true },
    { id: 'hob', kind: 'npc', name: 'Old Hob', x: 29, y: 17, if: FESTIVAL, dialogue: 'hob', glyph: 'o', blocks: true },
    { id: 'mira', kind: 'npc', name: 'Mira the lantern-seller', x: 23, y: 20, if: FESTIVAL, dialogue: 'mira', glyph: 'm', blocks: true },
    { id: 'lantern_tree', kind: 'inspect', name: 'The Lantern Tree', x: 25, y: 16, dialogue: 'lantern_tree', blocks: true,
      hint: { skill: 'arcana', dc: 13, text: 'The Lantern Tree hums. Not loudly — like a wineglass someone has just stopped touching.' } },
    { id: 'pell_house', kind: 'inspect', name: 'Pell\'s House', x: 12, y: 19, dialogue: 'pell_house', blocks: true },
    { id: 'town_hall', kind: 'inspect', name: 'Town Hall', x: 21, y: 7, desc: 'The town hall is shuttered for the festival. A notice on the door lists the festival committee — every name in the Mayor\'s handwriting.', blocks: true },
    { id: 'watch_house', kind: 'inspect', name: 'Watch House', x: 29, y: 5, dialogue: 'watch_house', blocks: true },
    { id: 'smithy_door', kind: 'inspect', name: 'Dunmore Smithy', x: 34, y: 13, desc: 'Heat rolls out of the smithy door. Garrick does his trading outside at the forge tonight.', blocks: true },
    { id: 'quill_door', kind: 'inspect', name: 'Quill\'s Sundries', x: 34, y: 19, if: '!bell_rang || ysolde_saved', desc: 'Quill\'s Sundries: "Everything a sensible person needs, and several things they don\'t."', blocks: true },
    { id: 'wenna_door', kind: 'inspect', name: 'Wenna\'s Cottage', x: 9, y: 26, desc: 'Bundles of herbs hang above the door. One of them is twitching.', blocks: true },
    { id: 'mill_door', kind: 'inspect', name: 'Thorn\'s Mill', x: 41, y: 8, desc: 'The great wheel turns in the mill-race. Flour dust glitters on the door.', blocks: true },
    // ── Loot & secrets
    { id: 'market_crates', kind: 'container', name: 'Festival Stall Crates', x: 19, y: 13, loot: { items: [['lantern_oil_flask', 2]] }, blocks: true },
    { id: 'well_cache', kind: 'container', name: 'Loose Stone in the Well', x: 17, y: 22, hidden: { dc: 14, skill: 'perception' }, loot: { items: [['aether_draught', 1]], gold: 15 }, blocks: true,
      desc: 'Behind a loose stone in the rim of the well, someone hid a pouch long ago: coins stamped with a king nobody remembers, and a vial of shimmering liquid.' },
    { id: 'hollow_stump', kind: 'container', name: 'Hollow Stump', x: 38, y: 27, hidden: { dc: 12, skill: 'perception' }, loot: { items: [['healing_potion', 1], ['dagger', 1]], gold: 6 } },
    // ── Night: rescues
    { id: 'abel', kind: 'npc', name: 'Abel Thorn, the miller', x: 41, y: 16, if: 'bell_rang && !mill_resolved && !prologue_complete', dialogue: 'abel', glyph: 'A', blocks: true },
    { id: 'mill_trigger', kind: 'encounter', name: 'The Mill', x: 41, y: 12, radius: 2, if: 'bell_rang && mill_attack && !mill_cleared', encounter: 'enc_mill' },
    { id: 'ysolde_echo', kind: 'npc', name: 'The Other Ysolde', x: 33, y: 19, if: 'bell_rang && !shop_resolved && !prologue_complete', dialogue: 'shop_echo', glyph: 'q', blocks: true },
    { id: 'well_trigger', kind: 'trigger', name: 'The Old Well', x: 17, y: 20, radius: 3, if: 'bell_rang && !well_resolved && !prologue_complete', dialogue: 'well_encounter' },
  ],
};

export const INN: MapDef = {
  id: 'inn', name: 'The Lantern & Lamb', tileset: 'interior', grid: GRIDS.inn,
  lighting: [{ value: 'day' }],
  instability: [{ if: NIGHT, value: 1 }, { value: 0 }],
  music: [{ value: 'tavern' }],
  enter: [
    { if: NIGHT, text: 'The common room has become a refuge. Townsfolk huddle by the fire wrapped in blankets, and Tobin is ladling stew with the grim determination of a man who believes soup can fix anything.' },
    { text: 'The Lantern & Lamb is loud, warm and packed: pipe smoke, wet wool, hot cider, a minstrel trying to be heard over a table of sellswords who would rather he wasn\'t. Tobin Marsh waves at you from behind the bar as though you are old friends.' },
  ],
  restAllowed: 'true',
  objects: [
    { id: 'inn_exit', kind: 'exit', name: 'Out to the Square', x: 10, y: 13, to: { map: 'hollowmere', x: 10, y: 16 } },
    { id: 'tobin', kind: 'npc', name: 'Tobin Marsh', x: 5, y: 1, dialogue: 'tobin', glyph: 'T', blocks: true },
    { id: 'lio', kind: 'npc', name: 'Lio Fenwick', x: 8, y: 6, dialogue: 'lio', glyph: 'l', blocks: true },
    { id: 'dag', kind: 'npc', name: 'Dag Morrow', x: 12, y: 5, if: '!brawl_resolved', dialogue: 'brawl', glyph: 'D', blocks: true },
    { id: 'hawk_a', kind: 'npc', name: 'Grey Hawk Sellsword', x: 10, y: 4, if: '!brawl_resolved', dialogue: 'brawl', glyph: 's', blocks: true },
    { id: 'hawk_b', kind: 'npc', name: 'Grey Hawk Sellsword', x: 14, y: 6, if: '!brawl_resolved', dialogue: 'brawl', glyph: 's', blocks: true },
    { id: 'inn_rooms', kind: 'inspect', name: 'Stairs to Your Rooms (Rest & Camp)', x: 19, y: 2, dialogue: 'inn_rest', blocks: false },
    { id: 'corvin_door', kind: 'lockedDoor', name: 'Locked Room', x: 18, y: 10, lock: { dc: 13, forceDc: 15 }, blocks: true },
    { id: 'corvin_desk', kind: 'inspect', name: 'Cluttered Desk', x: 19, y: 11, dialogue: 'corvin_room', blocks: true },
    { id: 'corvin_trunk', kind: 'container', name: 'Battered Trunk', x: 20, y: 12, loot: { items: [['crowbar', 1], ['ink_and_quill', 1]], gold: 8 }, blocks: true },
    { id: 'pell_inn', kind: 'npc', name: 'Pell', x: 6, y: 7, if: 'pell_safe && !questdone:sq_lira', dialogue: 'pell', glyph: 'p', blocks: true },
    { id: 'fireplace', kind: 'inspect', name: 'Fireplace', x: 9, y: 1, desc: 'Above the fireplace hangs a painting of the cathedral with its bell tower intact. Tobin says his grandmother painted it "from memory," which is odd, because the tower fell before she was born.' },
    { id: 'oil_barrel', kind: 'inspect', name: 'Barrel of Lamp Oil', x: 15, y: 11, desc: 'Lamp oil for the festival lanterns. Highly flammable — remember that if a fight breaks out.' },
  ],
};

export const CATHEDRAL: MapDef = {
  id: 'cathedral', name: 'Cathedral of Saint Orlen', tileset: 'cathedral', grid: GRIDS.cathedral,
  lighting: [{ value: 'night' }],
  instability: [{ value: 4 }],
  music: [{ value: 'dungeon' }],
  enter: [
    { text: 'The Cathedral of Saint Orlen squats among its graves like a kneeling giant. Its roof is mostly sky. Through the broken doors comes a smell that should not be here: burnt incense, fresh, sweet and heavy, though no one has said a service in these ruins for eighty years. Somewhere beneath the floor, something shifts — a long, slow scrape, like a heavy object being dragged an inch.' },
  ],
  objects: [
    { id: 'cath_exit', kind: 'exit', name: 'Back to Hollowmere', x: 17, y: 29, w: 2, h: 1, to: { map: 'hollowmere', x: 25, y: 2 } },
    { id: 'secret_door', kind: 'secretDoor', name: 'Hidden Door', x: 17, y: 3, hidden: { dc: 15, skill: 'investigation' } },
    { id: 'secret_stair', kind: 'exit', name: 'Stair into the Dark', x: 17, y: 1, to: { map: 'undercroft', x: 21, y: 2 } },
    { id: 'sacristy_door', kind: 'lockedDoor', name: 'Sacristy Door', x: 24, y: 7, lock: { dc: 15, key: 'maren_key', forceDc: 17 }, blocks: true },
    { id: 'sacristy_stair', kind: 'exit', name: 'Sacristy Stair', x: 27, y: 8, to: { map: 'undercroft', x: 34, y: 2 } },
    { id: 'tower_shaft', kind: 'inspect', name: 'Collapsed Bell Tower Shaft', x: 3, y: 11, dialogue: 'tower_shaft', blocks: true },
    { id: 'bell_rope', kind: 'inspect', name: 'A Bell Rope', x: 4, y: 9, dialogue: 'bell_rope' },
    { id: 'altar', kind: 'inspect', name: 'The High Altar', x: 17, y: 5, dialogue: 'altar', blocks: true,
      hint: { skill: 'perception', dc: 12, text: 'Fresh wax on the altar — on the third lantern carving, and only there. Someone has been pressing it.' } },
    { id: 'mural', kind: 'inspect', name: 'Mural of the Six Lights', x: 10, y: 4, dialogue: 'mural' },
    { id: 'wall_marks', kind: 'inspect', name: 'Scratched Marks', x: 7, y: 16, dialogue: 'wall_marks',
      hint: { skill: 'arcana', dc: 12, text: 'Those scratches by the west wall aren\'t random. That\'s writing — very old writing.' } },
    { id: 'floor_trap', kind: 'trap', name: 'Rotten Floorboards', x: 17, y: 14, hidden: { dc: 13, skill: 'perception' },
      trap: { disarmDc: 11, save: 'dex', saveDc: 12, damage: '2d6', type: 'bludgeoning', desc: 'The floor gives way beneath you with a crack like a gunshot; you catch the edge, but not before splinters and stone find you.' } },
    { id: 'offering_box', kind: 'container', name: 'Offering Box', x: 19, y: 20, loot: { items: [['scroll_cure_wounds', 1]], gold: 12 }, blocks: true },
    { id: 'reliquary', kind: 'container', name: 'Reliquary', x: 28, y: 5, loot: { items: [['orlen_shield', 1], ['healing_potion', 1]] }, blocks: true },
    { id: 'records', kind: 'inspect', name: 'Mouldering Records', x: 26, y: 9, dialogue: 'sacristy_records' },
    { id: 'nave_trigger', kind: 'encounter', name: 'The Pews', x: 17, y: 12, radius: 3, if: '!nave_cleared', encounter: 'enc_nave' },
    { id: 'grave_cache', kind: 'container', name: 'Disturbed Grave', x: 13, y: 27, hidden: { dc: 13, skill: 'perception' }, loot: { items: [['greater_healing_potion', 1]], gold: 10 }, blocks: true,
      desc: 'Someone has dug here recently and filled it in badly. Inside a rotted box: a few coins and a stoppered potion, tucked into the hands of a skeleton holding a tiny bell.' },
  ],
};

export const UNDERCROFT: MapDef = {
  id: 'undercroft', name: 'The Undercroft of Saint Orlen', tileset: 'undercroft', grid: GRIDS.undercroft,
  lighting: [{ value: 'dark' }],
  instability: [{ value: 5 }],
  music: [{ value: 'dungeon' }],
  enter: [
    { text: 'Cold, dry air, and the taste of old stone. Your light finds niches full of bones, arches carved with lanterns, and footprints in the dust — a single set of boots, recent, heading deeper. Far below, so faint it might be your own pulse, something is ringing.' },
  ],
  objects: [
    { id: 'up_secret', kind: 'exit', name: 'Stair up to the Nave', x: 21, y: 1, to: { map: 'cathedral', x: 17, y: 2 } },
    { id: 'up_sacristy', kind: 'exit', name: 'Stair up to the Sacristy', x: 35, y: 1, to: { map: 'cathedral', x: 26, y: 7 } },
    { id: 'up_tower', kind: 'exit', name: 'Climb up the Tower Shaft', x: 4, y: 6, to: { map: 'cathedral', x: 5, y: 12 } },
    { id: 'dart_trap', kind: 'trap', name: 'Pressure Plate', x: 12, y: 4, hidden: { dc: 14, skill: 'perception' },
      trap: { disarmDc: 13, save: 'dex', saveDc: 13, damage: '2d6', type: 'piercing', desc: 'A click underfoot — then darts hiss from the walls.' } },
    { id: 'ossuary_trigger', kind: 'encounter', name: 'The Ossuary', x: 7, y: 15, radius: 4, if: '!ossuary_cleared', encounter: 'enc_ossuary' },
    { id: 'ossuary_memory', kind: 'resonance', name: 'Resonant Niche', x: 3, y: 15, dialogue: 'ossuary_memory' },
    { id: 'ossuary_chest', kind: 'container', name: 'Guard-Captain\'s Coffer', x: 11, y: 18, loot: { items: [['vault_sigil', 1], ['healing_potion', 1]], gold: 20 }, blocks: true },
    { id: 'lira', kind: 'npc', name: 'A Singing Child', x: 7, y: 26, if: '!lira_fate', dialogue: 'lira_echo', glyph: 'L', blocks: true },
    { id: 'chapel_font', kind: 'inspect', name: 'Dry Font', x: 7, y: 23, dialogue: 'chapel_font', blocks: true },
    { id: 'crawler_trigger', kind: 'encounter', name: 'The Excavation', x: 36, y: 13, radius: 4, if: '!crawlers_cleared', encounter: 'enc_crawlers' },
    { id: 'corvin', kind: 'npc', name: 'Corvin Thale', x: 40, y: 18, if: 'crawlers_cleared && !corvin_fate', dialogue: 'corvin_rescue', glyph: 'c', blocks: true },
    { id: 'dig_supplies', kind: 'container', name: 'Corvin\'s Supplies', x: 31, y: 19, loot: { items: [['lantern_oil_flask', 2], ['rope', 1]], gold: 5 }, blocks: true },
    { id: 'dig_pit', kind: 'inspect', name: 'Excavation Pit', x: 35, y: 15, dialogue: 'dig_pit', blocks: true },
    { id: 'sentinel_trigger', kind: 'trigger', name: 'The Plinth', x: 21, y: 24, radius: 2, if: '!sentinel_fate', dialogue: 'sentinel' },
    { id: 'sentinel', kind: 'npc', name: 'Echo Sentinel (dormant)', x: 21, y: 27, if: '!sentinel_fate', dialogue: 'sentinel', glyph: 'S', blocks: true },
    { id: 'vault_door', kind: 'inspect', name: 'Sealed Vault Door', x: 21, y: 32, w: 2, if: '!vault_open', dialogue: 'vault_door', blocks: true },
    { id: 'vault_exit', kind: 'exit', name: 'The Anchor Vault', x: 21, y: 32, w: 2, h: 1, if: 'vault_open', to: { map: 'vault', x: 13, y: 20 } },
    { id: 'crypt_sarcophagus', kind: 'container', name: 'Sarcophagus of a Lantern-Knight', x: 21, y: 13, hidden: { dc: 12, skill: 'investigation' }, loot: { items: [['lanternblade', 1]] },
      desc: 'The lid bears a carved knight holding a lantern. It slides aside more easily than it should — the knight inside was buried with his sword, its fuller set with lantern-glass.' },
  ],
};

export const VAULT: MapDef = {
  id: 'vault', name: 'The Anchor Vault', tileset: 'vault', grid: GRIDS.vault,
  lighting: [{ value: 'dark' }],
  instability: [{ value: 7 }],
  music: [{ if: '!bellwarden_defeated', value: 'boss' }, { value: 'dungeon' }],
  enter: [
    { if: 'bellwarden_defeated', text: 'The vault is quiet now, except for the slow, patient beat coming from the pedestal.' },
    { text: 'The vault is a perfect dome of black stone veined with blue light, older than the cathedral above it by thousands of years. The air tastes of lightning. At its heart a figure stands motionless: a monk in a rotted habit whose body ends, below the chest, in the bronze curve of a great bell.' },
  ],
  objects: [
    { id: 'vault_back', kind: 'exit', name: 'Back to the Undercroft', x: 12, y: 21, w: 3, h: 1, if: '!heart_touched', to: { map: 'undercroft', x: 21, y: 31 } },
    { id: 'boss_trigger', kind: 'trigger', name: 'The Bellwarden', x: 13, y: 16, radius: 3, if: '!bellwarden_defeated', dialogue: 'bellwarden_meet' },
    { id: 'heart', kind: 'inspect', name: 'The Heart of Aether', x: 13, y: 3, if: 'bellwarden_defeated && !heart_touched', dialogue: 'heart', blocks: true },
    { id: 'vault_inscription', kind: 'inspect', name: 'Ring of Inscriptions', x: 13, y: 6, if: 'bellwarden_defeated', dialogue: 'vault_inscription' },
  ],
};

export const MAPS: MapDef[] = [HOLLOWMERE, INN, CATHEDRAL, UNDERCROFT, VAULT, ...ACT1_MAPS];
for (const { map, object } of [...CQ_OBJECTS, ...ACT1.objects]) MAPS.find((m) => m.id === map)?.objects.push(object);
for (const m of MAPS) if (ACT1.enter[m.id]) m.enter = ACT1.enter[m.id];
export const MAP_BY_ID: Record<string, MapDef> = Object.fromEntries(MAPS.map((m) => [m.id, m]));
