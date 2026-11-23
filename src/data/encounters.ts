import type { Cond, Effect } from './schema';

export interface EncounterDef {
  id: string;
  name: string;
  map: string;
  /** Absolute map coordinates, or offsets from the party leader when `relative` is set. */
  enemies: { t: string; x: number; y: number; elite?: boolean }[];
  relative?: boolean;
  objects?: { id: string; kind: 'pillar' | 'barrel'; x: number; y: number; hp: number; ac: number; name: string }[];
  intro: string;
  onVictory: Effect[];
  /** Effects when the party loses but the story continues (non-lethal fights). Otherwise defeat = game over. */
  onDefeat?: Effect[];
  nonlethal?: boolean;
  canFlee?: boolean;
  /** Group Stealth vs passive Perception lets the party avoid or ambush this fight when sneaking. */
  stealthDc?: number;
  music?: string;
  surpriseIf?: Cond;
}

export const ENCOUNTERS: EncounterDef[] = [
  {
    id: 'enc_brawl', name: 'Tavern Brawl', map: 'inn', nonlethal: true,
    enemies: [{ t: 'sellsword_captain', x: 12, y: 5 }, { t: 'sellsword', x: 10, y: 4 }, { t: 'sellsword', x: 14, y: 6 }],
    intro: 'Dag Morrow cracks his knuckles. "Right, then." Tables scrape back. Somebody cheers. This is going to be a brawl — fists and cudgels, nobody dies tonight.',
    onVictory: ['set brawl_resolved', 'set brawl_outcome fought', 'complete sq_brawl fought', 'xp 75', 'log The Grey Hawks lie groaning among the broken stools. Tobin is already sweeping up, and Captain Hale arrives to march Dag to the stocks.'],
    onDefeat: ['set brawl_resolved', 'set brawl_outcome fought', 'complete sq_brawl fought', 'gold -10', 'log You come round on the floor with Tobin fanning you with a dishcloth. The Grey Hawks have gone — with ten of your gold — and Captain Hale has Dag in the stocks.'],
  },
  {
    id: 'enc_mill', name: 'Hounds at the Mill', map: 'hollowmere', canFlee: true, stealthDc: 12,
    enemies: [{ t: 'fog_hound', x: 40, y: 11 }, { t: 'fog_hound', x: 42, y: 12 }, { t: 'fog_hound', x: 39, y: 13 }],
    intro: 'Three shapes peel out of the fog by the mill — dog-shaped, lantern-eyed, wrong. Upstairs a child is screaming.',
    onVictory: ['set mill_cleared', 'xp 50', 'dialogue mill_rescue'],
  },
  {
    id: 'enc_well', name: 'The Old Well', map: 'hollowmere', canFlee: true,
    enemies: [{ t: 'fog_hound', x: 15, y: 23 }, { t: 'fog_hound', x: 19, y: 23 }, { t: 'hollow_echo', x: 17, y: 24 }],
    intro: 'The echo by the well turns. It has a woman\'s face, and it is reaching for Pell as though he were its own son.',
    onVictory: ['set well_cleared', 'xp 50', 'dialogue well_rescue'],
  },
  {
    id: 'enc_shop', name: 'Echoes at Quill\'s', map: 'hollowmere', canFlee: true,
    enemies: [{ t: 'hollow_echo', x: 33, y: 18 }, { t: 'hollow_echo', x: 32, y: 21 }],
    intro: 'The other Ysolde shrieks and the fog answers: two hollow echoes drift from the walls of the shop.',
    onVictory: ['set shop_cleared', 'xp 50', 'dialogue shop_rescue_after'],
  },
  {
    id: 'enc_fog_random', name: 'Something in the Fog', map: 'hollowmere', relative: true, canFlee: true, stealthDc: 11,
    enemies: [{ t: 'fog_hound', x: 4, y: -3 }, { t: 'fog_hound', x: -4, y: 3 }],
    intro: 'Paws on cobbles, too light for their size. Two fog hounds circle out of the grey.',
    onVictory: ['xp 25', 'give fog_essence 1'],
  },
  {
    id: 'enc_fog_random2', name: 'A Lost Echo', map: 'hollowmere', relative: true, canFlee: true, stealthDc: 11,
    enemies: [{ t: 'hollow_echo', x: 3, y: -3 }, { t: 'fog_hound', x: -3, y: -2 }],
    intro: 'A grey woman stands in the road calling a name you do not know. When she turns toward you, her mouth keeps calling.',
    onVictory: ['xp 25', 'give echo_shard 1'],
  },
  {
    id: 'enc_nave', name: 'The Restless Congregation', map: 'cathedral', stealthDc: 10,
    enemies: [{ t: 'restless_pilgrim', x: 13, y: 11 }, { t: 'restless_pilgrim', x: 22, y: 11 }, { t: 'restless_pilgrim', x: 18, y: 9 }],
    intro: 'In the pews, figures you took for heaps of rags sit up. Pilgrims, eighty years dead, turning their heads toward the living.',
    onVictory: ['set nave_cleared', 'xp 50', 'log The pilgrims settle back into the dust. One of them, before it stills, murmurs: "...the bell... we came to hear the bell..."'],
  },
  {
    id: 'enc_ossuary', name: 'The Ossuary Guard', map: 'undercroft', stealthDc: 12,
    enemies: [{ t: 'ossuary_guard', x: 7, y: 13 }, { t: 'ossuary_guard', x: 10, y: 15 }, { t: 'ossuary_archer', x: 5, y: 18 }],
    intro: 'Bones in the niches rattle, rise and assemble. The old cathedral guard still keeps its watch.',
    onVictory: ['set ossuary_cleared', 'xp 75'],
  },
  {
    id: 'enc_crawlers', name: 'Crawlers in the Dig', map: 'undercroft',
    enemies: [{ t: 'ossuary_crawler', x: 35, y: 14 }, { t: 'ossuary_crawler', x: 37, y: 17 }],
    intro: 'Something clicks in the excavation pit — many legs, many joints. A voice behind the rubble yelps: "Oh, thank the Lights — mind the mandibles!"',
    onVictory: ['set crawlers_cleared', 'xp 100', 'dialogue corvin_rescue'],
  },
  {
    id: 'enc_sentinel', name: 'The Echo Sentinel', map: 'undercroft',
    enemies: [{ t: 'echo_sentinel', x: 21, y: 27 }],
    intro: 'Crystal veins along the Sentinel\'s arms brighten from blue to white. Stone grinds on stone as it steps off its plinth. A voice like a struck glass: "UNWRITTEN. UNWELCOME."',
    onVictory: ['set sentinel_fate destroyed', 'give sentinel_core 1', 'xp 150'],
  },
  {
    id: 'enc_bellwarden', name: 'The Bellwarden', map: 'vault', music: 'boss',
    enemies: [{ t: 'bellwarden', x: 13, y: 9 }],
    objects: [
      { id: 'pillar_a', kind: 'pillar', x: 8, y: 7, hp: 10, ac: 11, name: 'Resonance Pillar' },
      { id: 'pillar_b', kind: 'pillar', x: 18, y: 7, hp: 10, ac: 11, name: 'Resonance Pillar' },
      { id: 'pillar_c', kind: 'pillar', x: 13, y: 13, hp: 10, ac: 11, name: 'Resonance Pillar' },
    ],
    intro: 'The bell that was the Bellwarden\'s body swings, and the vault fills with a sound like grief made solid. Three crystal pillars hum in answer — they are feeding him.',
    onVictory: ['set bellwarden_defeated', 'give silver_bell_clapper 1', 'give bellbreaker 1', 'xp 300', 'quest mq_bell heart', 'dialogue bellwarden_after'],
  },
  {
    id: 'enc_ysolt', name: 'The Seeker', map: 'vault', music: 'boss', canFlee: false,
    enemies: [{ t: 'seeker_ysolt', x: 13, y: 17 }, { t: 'conclave_warden', x: 11, y: 15 }, { t: 'conclave_warden', x: 15, y: 15 }],
    intro: 'Ysolt Ravencourt sighs, as if you have disappointed her personally. "Very well. Wardens — alive, if convenient."',
    onVictory: ['set ysolt_outcome fought', 'xp 200', 'rep conclave -20', 'dialogue ysolt_defeated'],
  },
];

import { CQ_ENCOUNTERS } from './companionQuests';
ENCOUNTERS.push(...CQ_ENCOUNTERS);
export const ENCOUNTER_BY_ID: Record<string, EncounterDef> = Object.fromEntries(ENCOUNTERS.map((e) => [e.id, e]));
