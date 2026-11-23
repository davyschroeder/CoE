/**
 * Act I — Ashenford (Writer B).
 *
 * A smoky river town on the Sillow: glassworks, barges, Covenant tax-houses, a Dawnblade mob, and an
 * Unbound safe house beneath a cooper's shop in the Low Quarter. Ashenford is optional but rich: it never
 * gates `a1_main`, but it can warn the party that the Conclave is waiting at Valdros (`a1_warned_of_ambush`).
 *
 * Buildings have no interiors: a visit is a dialogue at the door POI.
 *
 * ── Contract flags set here (docs/ACT1_SPEC.md) ──────────────────────────────────────────────
 *   a1_warned_of_ambush   — any of five routes:
 *                             1. the Unbound safe house (Corvin reads the Index's message if corvin_fate=freed|ally;
 *                                otherwise Wick's cipher: ally with the Unbound for the key, break it with
 *                                Investigation, or read it by Resonance),
 *                             2. Seeker Ysolt at the docks (ysolt_outcome=persuaded → coded margin at the Conclave office),
 *                             3. Captain Dray's garrison report (Covenant Trusted, a Persuasion check, Kael's dispatch-knot
 *                                bluff, or as thanks for betraying the safe house),
 *                             4. the Wren House deal with Factor Greaves (Spymaster Crane's network),
 *                             5. the orders found on Conclave wardens (ysolt_outcome=fought → fight at the licensing office).
 *   a1_safehouse          — allied | visited | betrayed
 *   a1_wren               — saved | lost | deal
 *   a1_mob                — dispersed | fought | bought
 *   a1_glassworks         — reconciled | estranged | absent
 *   a1_ashenford_done     — RULE: set once the safe house is resolved (a1_safehouse has any value) AND at least two
 *                           of the other three quests (a1a_wren, a1a_mob, a1a_glassworks) are resolved. Each of those
 *                           three adds 1 to the counter `a1a_resolved` when it resolves; every terminal node of
 *                           those scenes (and of the safe house) ends with `walkOn()`, which chains into the
 *                           `a1a_done` coda when DONE holds.
 *
 * Recruitment here (each gated by !recruited:<id>, each with a companion-present variant via comp:<id>):
 *   Kael (Wren House), Nima (glassworks), Varek (the mob), Tessa (Kiln & Kettle), Ilyra (hospice), Brakka (docks).
 */
import type { ContentModule } from './module';
import type { DialogueOption, DialogueTree } from '../schema';
import type { QuestDef } from '../quests';
import type { EncounterDef } from '../encounters';
import type { ItemDef } from '../items';
import type { NpcDef } from '../npcs';
import type { ShopDef } from '../shops';
import type { EnemyTemplate } from '../enemies';
import type { MapObject } from '../maps/types';
import type { TravelEvent } from './module';

// ═══════════════════════════════════════════════════════════════════════ shared helpers

/** See the header: the safe house plus two of the three other quests. */
const DONE = 'a1_safehouse && a1a_resolved>=2 && !a1_ashenford_done';

/** Terminal options for every resolving scene: chain into the town coda when DONE holds. */
const walkOn = (text = 'Walk on.'): DialogueOption[] => [
  { text, if: DONE, effects: ['dialogue a1a_done'] },
  { text, if: `!(${DONE})`, end: true },
];

const ab = (str: number, dex: number, con: number, int: number, wis: number, cha: number) => ({ str, dex, con, int, wis, cha });

const INDEX_MESSAGE =
  "“To the bearer. You carry the thing we have been looking for since before your grandmother's grandmother was a rumour. You are not the only ones who know it. A lamp has been lit for you at Valdros, in the Senate Dome, by the Conclave — and it was lit early, because someone has told them which road you will walk. I do not know who. I know that it was not the wind. Walk in with your eyes open, or do not walk in at all. The dead are owed their names; the living are owed a warning. — O. F.”";

// ═══════════════════════════════════════════════════════════════════════ NPCs

const NPCS: NpcDef[] = [
  { id: 'a1a_cole', name: 'Sergeant Mabry Cole', title: 'North Gate Toll', hue: 205, glyph: 'C', desc: 'Slate, chalk, and an expression that has heard every excuse twice.' },
  { id: 'a1a_dray', name: 'Captain Sabine Dray', title: 'Commander of the Ashenford Garrison', hue: 210, glyph: 'D', desc: 'Iron-grey coat, iron-grey hair cropped short, ink on her cuffs and no sleep behind her eyes.' },
  { id: 'a1a_greaves', name: 'Oswin Greaves', title: 'Factor, Office of Correspondence', hue: 220, glyph: 'G', desc: 'A polite man in a grey coat. He carries a ledger the way other men carry a sword.' },
  { id: 'a1a_mott', name: 'Bailiff-Sergeant Mott', title: 'Iron Covenant', hue: 200, glyph: 'b', desc: 'A heavy, tired man with a writ, a hammer, and a mouthful of nails.' },
  { id: 'a1a_harrow', name: 'Matron Dilys Harrow', title: 'Keeper of the Wren House', hue: 30, glyph: 'H', desc: 'Flour to the elbows, and a voice that has called thirty children in for supper without ever calling twice.' },
  { id: 'a1a_sollace', name: 'Aubrine Sollace', title: 'Dawnblade of the Last Dawn', hue: 48, glyph: 'A', desc: 'White and gold, a lantern lit at noon, and the gentlest voice in the square.' },
  { id: 'a1a_jory', name: 'Jory', title: 'A Veilborn boy', hue: 275, glyph: 'j', desc: 'Eight years old, violet-eyed, very still.' },
  { id: 'a1a_bram', name: 'Bram Emberglass', title: 'Master Glazier', hue: 18, glyph: 'B', desc: 'Broad and grey-bearded; his left arm and the side of his face are a map of old burns.' },
  { id: 'a1a_hooper', name: 'Josse Hooper', title: 'Cooper of the Low Quarter', hue: 28, glyph: 'J', desc: 'Huge, slow-spoken and very careful with his hands.' },
  { id: 'a1a_wick', name: 'Wick', title: 'Archivist of the Unbound', hue: 250, glyph: 'w', desc: 'Thin, ageless, wrapped in an ink-black shawl. Speaks in catalogue entries.' },
  { id: 'a1a_pike', name: 'Registrar Anselm Pike', title: 'Conclave Licensing Office', hue: 265, glyph: 'P', desc: 'Prim, spectacled, and quietly in love with forms.' },
  { id: 'a1a_brisk', name: 'Ottoline Brisk', title: 'Sillowglass Tinctures', hue: 160, glyph: 'O', desc: 'Quick hands, a quicker tongue, and a dozen tiny bottles on a bandolier.' },
  { id: 'a1a_tarrant', name: 'Quartermaster Bede Tarrant', title: 'Garrison Surplus', hue: 205, glyph: 'T', desc: 'A ledger in one hand and a pencil behind each ear.' },
  { id: 'a1a_rusk', name: 'Lieutenant Fabian Rusk', title: 'Iron Covenant', hue: 200, glyph: 'R', desc: 'Young, polished, and reading from a card.' },
  { id: 'a1a_calder', name: 'Wynn Calder', title: 'Keeper of the Kiln & Kettle', hue: 35, glyph: 'W', desc: 'A big, soot-cheeked woman who runs her inn like a kiln: hot, loud and never allowed to go out.' },
  { id: 'a1a_pip', name: 'Pip Calder', title: 'A young fiddler', hue: 40, glyph: 'p', desc: 'Fifteen, all elbows and nerve.' },
  { id: 'a1a_odile', name: 'Sister Odile', title: 'Keeper of the Hospice of the Returned', hue: 190, glyph: 'O', desc: 'Small, grey and immovable.' },
  { id: 'a1a_aldo', name: 'Aldo Fenwright', title: 'One of the returned', hue: 15, glyph: 'a', desc: 'An old glassblower who remembers dying in the Wildfire of 2210 — eight hundred years ago.' },
  { id: 'a1a_oakes', name: 'Gorm Oakes', title: 'Barge-salvager', hue: 25, glyph: 'g', desc: 'Tar under the nails, a grin with gaps in it, and a barge full of other people\'s history.' },
  { id: 'a1a_iven', name: 'Father Iven Mercer', title: 'Penitent of the Last Dawn', hue: 45, glyph: 'I', desc: 'A ladle in one hand, a prayer in the other, and soup on both.' },
  { id: 'a1a_annick', name: 'Annick Dole', title: 'A refugee from Marrowby', hue: 90, glyph: 'n', desc: 'She carries her whole village in a list of names.' },
];

// ═══════════════════════════════════════════════════════════════════════ quests

const QUESTS: QuestDef[] = [
  {
    id: 'a1a_wren', title: 'The Wren House', category: 'side', giver: 'Matron Dilys Harrow', xp: 400,
    summary: 'Covenant bailiffs have come to seize the Wren House, an orphanage in Ashenford\'s Low Quarter, over debts someone in Solmara bought up.',
    stages: {
      writ: { objective: 'Deal with the bailiffs and the polite man in the grey coat at the Wren House door — pay, argue, bargain, fight, or let it happen.', journal: 'A writ of seizure is being nailed to the door of the Wren House. Thirty-one children watch from the windows. The man with the ledger says order is the precondition of mercy.' },
    },
    outcomes: {
      saved: 'The bailiffs pried their writ off the Wren House door and went away. The paper still sits in a drawer in Solmara.',
      lost: 'The Wren House children went to Solmara in a covered wagon. Matron Harrow walked beside it as far as the bridge.',
      deal: 'The Wren House is safe for as long as you keep writing letters to a man who folds his paper with a Covenant dispatch knot.',
    },
  },
  {
    id: 'a1a_mob', title: 'Drowning Day', category: 'side', giver: 'Ashenford', xp: 400,
    summary: 'A Dawnblade crowd in the square means to "wash" a Veilborn in the Sillow. The river does not give people back.',
    stages: {
      washing: { objective: 'Stop the Dawnblades from drowning a Veilborn in the river — by word, coin, faith, fear or force.', journal: 'In the square, Aubrine Sollace of the Dawnblades preaches gently over a bound Veilborn. They will walk him down to the river steps at the noon bell.' },
    },
    outcomes: {
      dispersed: 'The Dawnblade crowd went home without its washing. Aubrine Sollace said the river is patient.',
      fought: 'You broke up the Washing with fists and steel. The Last Dawn will remember your faces.',
      bought: 'You paid the Dawnblades a "penance" for their refugee kitchens, and they let the Veilborn go. The coin really did buy soup.',
    },
  },
  {
    id: 'a1a_glassworks', title: 'Glass Remembers Heat', category: 'side', giver: 'Bram Emberglass', xp: 300,
    summary: 'The Emberglass glassworks burned in a Veil flicker the night Nima\'s magic woke. Her father Bram still works the one kiln that survived.',
    stages: {
      kiln: { objective: 'Go into the Emberglass glassworks and see what is left between Nima and her father.', journal: 'Half of the Emberglass glassworks is still roofless, its beams charred, glass slag fused into the cobbles like frozen water. One kiln is lit.' },
    },
    outcomes: {
      reconciled: 'Nima and Bram Emberglass stood at the same kiln, and neither of them flinched.',
      estranged: 'Nima walked out of her father\'s glassworks with the door banging behind her. The kiln is still lit.',
      absent: 'Bram Emberglass asked after his daughter and said to tell her the kiln is still lit.',
    },
  },
  {
    id: 'a1a_safehouse', title: 'Beneath the Cooper\'s', category: 'faction', giver: 'The Unbound', xp: 400,
    summary: 'The Unbound keep a safe house somewhere in the Low Quarter. They are said to know things about the Heart — and about who else wants it.',
    stages: {
      rumour: { objective: 'Find the Unbound in Ashenford. Someone in the Low Quarter mends more than casks.', journal: 'A broken chain scratched beside a cooper\'s notice. A woman in an ink-black shawl who writes down the names of the vanished. Ask the cooper whether he mends old casks.' },
      cellar: { objective: 'Hear what the Unbound have to say beneath Hooper\'s cooperage.', journal: 'Behind a wall of barrels that have never held anything, a stair goes down into the river-damp.' },
    },
    clues: {
      mark: 'On Ashenford\'s notice board, a tiny broken chain is scratched beside "Casks mended — J. Hooper, Low Quarter. Old casks a specialty."',
      marrowby: 'Annick Dole of vanished Marrowby: a woman in an ink-black shawl wrote down every name, and said to ask the cooper whether he mends old casks.',
      index: 'The Index\'s message: the Conclave has lit a lamp for you at Valdros, early, because someone told them which road you would walk.',
    },
    outcomes: {
      allied: 'You promised to carry a lantern for the erased. The Unbound call you theirs, and gave you the key to the Index\'s cipher.',
      visited: 'You went beneath the cooper\'s, heard the Unbound out, and went your own way.',
      betrayed: 'You sold the cooper\'s cellar to the Covenant. Josse Hooper is in irons; the Unbound got out through the river culvert. They will remember.',
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════ items, enemies, shops

const ITEMS: ItemDef[] = [
  { id: 'a1a_emberglass_lens', name: 'Emberglass Lens', type: 'amulet', rarity: 'uncommon', weight: 0, value: 160, desc: 'A disc of amber glass on a fine chain, blown by Bram Emberglass the year his daughter left home. Look through it and fire holds still. +1 to spell attack rolls; +1 Arcana.', bonus: { spellAttack: 1, skills: { arcana: 1 } } },
  { id: 'a1a_kiln_shield', name: 'Kilnward Shield', type: 'shield', rarity: 'uncommon', weight: 6, value: 140, desc: 'Garrison issue for the kiln-yard fire crews: oak faced with fired clay under a skin of green glass. +2 AC; resistance to fire damage.', shield: { bonus: 2 }, bonus: { resist: ['fire'] } },
  { id: 'a1a_oilcloak', name: 'Bargeman\'s Oilcloak', type: 'cloak', rarity: 'uncommon', weight: 2, value: 70, desc: 'Waxed canvas the colour of river smoke, cut long for standing watch on a barge in the rain. +1 Stealth, +1 Survival; resistance to cold damage.', bonus: { skills: { stealth: 1, survival: 1 }, resist: ['cold'] } },
  { id: 'a1a_wren_ring', name: 'Tin Wren Ring', type: 'ring', rarity: 'uncommon', weight: 0, value: 40, desc: 'Hammered out of a Wren House spoon by thirty-one small, determined hands. A wren, more or less. +1 Insight, +1 Persuasion.', bonus: { skills: { insight: 1, persuasion: 1 } } },
];

const ENEMIES: EnemyTemplate[] = [
  {
    id: 'a1a_bailiff', name: 'Covenant Bailiff', type: 'humanoid', level: 1, abilities: ab(13, 11, 13, 10, 10, 10), ac: 12, hp: '3d8+3', speed: 6,
    actions: ['m_club'], xp: 25, ai: 'brute', gold: '1d6', glyph: 'b', color: '#8a9aa8',
    desc: 'Iron-grey coat, cudgel, a writ in the pocket. Paid by the door, not by the hour.',
  },
  {
    id: 'a1a_dawnblade', name: 'Dawnblade Zealot', type: 'humanoid', level: 1, abilities: ab(14, 11, 13, 9, 10, 12), ac: 13, hp: '3d8+3', speed: 6,
    actions: ['m_club'], xp: 25, ai: 'brute', glyph: 'z', color: '#e8d9a0',
    desc: 'White sash, gold thread, a stave, and the absolute certainty that this is love.',
  },
  {
    id: 'a1a_sollace', name: 'Aubrine Sollace, Dawnblade', type: 'humanoid', level: 3, abilities: ab(15, 12, 14, 10, 13, 16), ac: 16, hp: '6d8+12', speed: 6,
    actions: ['m_shortsword'], multiattack: 2, xp: 200, ai: 'brute', glyph: 'A', color: '#f2e3a6',
    desc: 'She fights the way she preaches: patiently, gently, and without the least hesitation.',
  },
  {
    id: 'a1a_rusk', name: 'Lieutenant Fabian Rusk', type: 'humanoid', level: 2, abilities: ab(13, 14, 12, 11, 11, 12), ac: 15, hp: '5d8+5', speed: 6,
    actions: ['m_shortsword', 'm_crossbow'], xp: 100, ai: 'skirmisher', gold: '2d6', glyph: 'R', color: '#9aa8b8',
    desc: 'A young officer with a polished breastplate and a card of approved phrases.',
  },
  {
    id: 'a1a_oakes', name: 'Gorm Oakes, Barge-Salvager', type: 'humanoid', level: 2, abilities: ab(16, 12, 14, 10, 10, 9), ac: 14, hp: '6d8+12', speed: 6,
    actions: ['m_shortsword'], multiattack: 2, xp: 100, ai: 'brute', gold: '3d6', glyph: 'g', color: '#b08a5a',
    desc: 'Boathook, belaying pin, and forty years of hauling other people\'s ruins out of the river.',
  },
  {
    id: 'a1a_bargehand', name: 'Salvage Crew', type: 'humanoid', level: 1, abilities: ab(13, 13, 12, 9, 10, 9), ac: 12, hp: '3d8', speed: 6,
    actions: ['m_club', 'm_crossbow'], xp: 25, ai: 'brute', gold: '1d4', glyph: 's', color: '#a48a66',
    desc: 'Tar, rope-burns and a short temper.',
  },
];

const SHOPS: ShopDef[] = [
  {
    id: 'a1a_glass', name: 'Sillowglass Tinctures', owner: 'a1a_brisk', buyMult: 1.05, sellMult: 0.55, discountFlags: ['a1a_brisk_discount'],
    stock: [
      { itemId: 'healing_potion', qty: 6 }, { itemId: 'greater_healing_potion', qty: 2 }, { itemId: 'antitoxin', qty: 3 },
      { itemId: 'elixir_courage', qty: 2 }, { itemId: 'aether_draught', qty: 2, if: 'resunlocked' }, { itemId: 'lantern_oil_flask', qty: 8 },
      { itemId: 'scroll_cure_wounds', qty: 2 }, { itemId: 'scroll_guiding_bolt', qty: 1 }, { itemId: 'scroll_shatter', qty: 1 },
      { itemId: 'a1a_oilcloak', qty: 1 },
    ],
  },
  {
    id: 'a1a_arms', name: 'Garrison Surplus', owner: 'a1a_tarrant', faction: 'covenant', buyMult: 1, sellMult: 0.5, discountFlags: ['a1a_dray_report'],
    stock: [
      { itemId: 'longsword', qty: 2 }, { itemId: 'shortsword', qty: 2 }, { itemId: 'rapier', qty: 1 }, { itemId: 'battleaxe', qty: 1 },
      { itemId: 'warhammer', qty: 1 }, { itemId: 'halberd', qty: 2 }, { itemId: 'spear', qty: 4 }, { itemId: 'light_crossbow', qty: 2 },
      { itemId: 'longbow', qty: 1 }, { itemId: 'shield', qty: 3 }, { itemId: 'a1a_kiln_shield', qty: 1 }, { itemId: 'studded_leather', qty: 1 },
      { itemId: 'scale_mail', qty: 2 }, { itemId: 'breastplate', qty: 1 }, { itemId: 'chain_mail', qty: 2 }, { itemId: 'splint_armor', qty: 1 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════ encounters

const ENCOUNTERS: EncounterDef[] = [
  {
    id: 'a1a_enc_wren', name: 'Bailiffs at the Wren House', map: 'ashenford', nonlethal: true,
    enemies: [{ t: 'covenant_soldier', x: 31, y: 21 }, { t: 'a1a_bailiff', x: 35, y: 22 }, { t: 'a1a_bailiff', x: 30, y: 22 }, { t: 'a1a_bailiff', x: 36, y: 20 }],
    intro: 'Bailiff-Sergeant Mott spits his nails into his palm and pockets them. "Cudgels, lads. Nobody dies over arithmetic." Thirty-one faces press against the Wren House windows. Somebody up there starts to cheer, and is shushed, and starts again.',
    onVictory: ['set a1_wren saved', 'complete a1a_wren saved', 'add a1a_resolved 1', 'rep covenant -10', 'xp 100', 'dialogue a1a_wren'],
    onDefeat: ['set a1_wren lost', 'set a1a_wren_brawl_lost', 'complete a1a_wren lost', 'add a1a_resolved 1', 'rep covenant -5', 'dialogue a1a_wren'],
  },
  {
    id: 'a1a_enc_mob', name: 'The Washing', map: 'ashenford', nonlethal: true,
    enemies: [{ t: 'a1a_sollace', x: 24, y: 15 }, { t: 'a1a_dawnblade', x: 22, y: 16 }, { t: 'a1a_dawnblade', x: 23, y: 18 }, { t: 'a1a_dawnblade', x: 21, y: 14 }],
    intro: 'Aubrine Sollace sets her noon-lantern down on the well-rim, very carefully, so it will not spill. "Gently, friends," she says. "They are frightened too." Then the white sashes come at you with staves.',
    onVictory: ['set a1_mob fought', 'complete a1a_mob fought', 'add a1a_resolved 1', 'rep dawn -10', 'rep covenant -3', 'xp 100', 'dialogue a1a_mob_after'],
    onDefeat: ['set a1_mob fought', 'complete a1a_mob fought', 'add a1a_resolved 1', 'rep dawn -6', 'log You come round on the cobbles with a garrison horn blaring in your ear. The crowd scattered when the soldiers came — and in the scramble, someone cut the rope.', 'dialogue a1a_mob_after'],
  },
  {
    id: 'a1a_enc_inn', name: 'Brawl at the Kiln & Kettle', map: 'ashenford', nonlethal: true,
    enemies: [{ t: 'a1a_rusk', x: 8, y: 21 }, { t: 'covenant_soldier', x: 11, y: 22 }, { t: 'covenant_soldier', x: 6, y: 22 }],
    intro: 'Lieutenant Rusk drops his card. "Right," he says, in a voice that has not been approved by anyone. Half the Kiln & Kettle spills into the street to watch, tankards in hand, still singing.',
    onVictory: ['set a1a_inn_done', 'set a1a_inn_fought', 'rep covenant -8', 'xp 75', 'dialogue a1a_inn'],
    onDefeat: ['set a1a_inn_lost', 'rep covenant -4', 'dialogue a1a_inn'],
  },
  {
    id: 'a1a_enc_docks', name: 'Salvagers on the Sillow', map: 'ashenford', nonlethal: true, canFlee: true,
    enemies: [{ t: 'a1a_bargehand', x: 43, y: 28 }, { t: 'a1a_oakes', x: 41, y: 29 }, { t: 'a1a_bargehand', x: 39, y: 29 }, { t: 'a1a_bargehand', x: 44, y: 29 }],
    intro: 'Gorm Oakes whistles through the gap in his teeth, and his crew come up off the barge with boathooks and belaying pins. "Nobody\'s drowning anybody," he calls. "We\'re just going to discuss the price."',
    onVictory: ['set a1a_docks_fought', 'xp 75', 'dialogue a1a_docks'],
    onDefeat: ['set a1a_docks_fought', 'set a1a_docks_beaten', 'dialogue a1a_docks'],
  },
  {
    id: 'a1a_enc_conclave', name: 'Wardens of the Licensing Office', map: 'ashenford', canFlee: true,
    enemies: [{ t: 'conclave_warden', x: 41, y: 10 }, { t: 'conclave_warden', x: 46, y: 10 }, { t: 'conclave_arcanist', x: 48, y: 9 }],
    intro: 'The little bell on Registrar Pike\'s desk is still ringing when the wardens come round the corner, grey robes over mail, staves already humming. Behind them an arcanist turns a page in the air with one finger.',
    onVictory: ['set a1a_conclave_fought', 'rep conclave -10', 'xp 100', 'dialogue a1a_conclave_orders'],
  },
];

// ═══════════════════════════════════════════════════════════════════════ map objects

const O = (object: MapObject) => ({ map: 'ashenford', object });

const OBJECTS: { map: string; object: MapObject }[] = [
  O({ id: 'a1a_gate', kind: 'trigger', name: 'The North Gate Toll', x: 27, y: 3, radius: 1, if: 'chapter:act1 && !a1a_gate_seen', dialogue: 'a1a_gate' }),
  O({ id: 'a1a_notice', kind: 'inspect', name: 'Notice Board', x: 26, y: 12, dialogue: 'a1a_notice' }),
  O({ id: 'a1a_taxhouse', kind: 'inspect', name: 'Covenant Tax-House', x: 25, y: 6, dialogue: 'a1a_taxhouse' }),
  O({ id: 'a1a_chapel', kind: 'inspect', name: 'Chapel of the Six Lights', x: 29, y: 6, dialogue: 'a1a_chapel' }),
  O({ id: 'a1a_garrison_door', kind: 'inspect', name: 'Ashenford Garrison', x: 10, y: 10, dialogue: 'a1a_garrison' }),
  O({ id: 'a1a_dray', kind: 'npc', name: 'Captain Sabine Dray', x: 11, y: 10, dialogue: 'a1a_garrison', glyph: 'D', blocks: true }),
  O({ id: 'a1a_conclave_door', kind: 'inspect', name: 'Conclave Licensing Office', x: 43, y: 9, dialogue: 'a1a_conclave' }),
  O({ id: 'a1a_pike', kind: 'npc', name: 'Registrar Anselm Pike', x: 44, y: 10, if: '!a1a_conclave_fought', dialogue: 'a1a_conclave', glyph: 'P', blocks: true }),
  O({ id: 'a1a_hospice_door', kind: 'inspect', name: 'Hospice of the Returned', x: 38, y: 15, dialogue: 'a1a_hospice' }),
  O({ id: 'a1a_ilyra', kind: 'npc', name: 'Ilyra Voss', x: 37, y: 16, if: '!recruited:ilyra', dialogue: 'a1a_hospice', glyph: 'I', blocks: true }),
  O({ id: 'a1a_glassworks_door', kind: 'inspect', name: 'Emberglass Glassworks', x: 14, y: 15, dialogue: 'a1a_glassworks' }),
  O({ id: 'a1a_bram', kind: 'npc', name: 'Bram Emberglass', x: 15, y: 14, dialogue: 'a1a_glassworks', glyph: 'B', blocks: true }),
  O({ id: 'a1a_nima', kind: 'npc', name: 'A half-elf woman in a scorched coat', x: 16, y: 15, if: '!recruited:nima', dialogue: 'a1a_glassworks', glyph: 'N', blocks: true }),
  O({ id: 'a1a_inn_door', kind: 'inspect', name: 'The Kiln & Kettle', x: 9, y: 22, dialogue: 'a1a_inn' }),
  O({ id: 'a1a_tessa', kind: 'npc', name: 'Tessa Quickthorn', x: 10, y: 21, if: '!recruited:tessa && !a1a_tessa_jailed', dialogue: 'a1a_inn', glyph: 'T', blocks: true }),
  O({ id: 'a1a_wren_door', kind: 'inspect', name: 'The Wren House', x: 33, y: 22, dialogue: 'a1a_wren' }),
  O({ id: 'a1a_harrow', kind: 'npc', name: 'Matron Dilys Harrow', x: 34, y: 21, if: '!a1_wren || a1_wren=saved || a1_wren=deal', dialogue: 'a1a_wren', glyph: 'H', blocks: true }),
  O({ id: 'a1a_kael', kind: 'npc', name: 'A young man in a good coat', x: 32, y: 21, if: '!recruited:kael', dialogue: 'a1a_wren', glyph: 'K', blocks: true }),
  O({ id: 'a1a_cooper_door', kind: 'inspect', name: 'Hooper\'s Cooperage', x: 41, y: 22, dialogue: 'a1a_cooper' }),
  O({ id: 'a1a_hooper', kind: 'npc', name: 'Josse Hooper, cooper', x: 42, y: 21, if: '!(a1_safehouse=betrayed)', dialogue: 'a1a_cooper', glyph: 'J', blocks: true }),
  O({ id: 'a1a_tenement', kind: 'inspect', name: 'Refugee Tenement', x: 49, y: 22, dialogue: 'a1a_tenement' }),
  O({ id: 'a1a_docks', kind: 'inspect', name: 'Sillow Docks', x: 38, y: 28, dialogue: 'a1a_docks' }),
  O({ id: 'a1a_brakka', kind: 'npc', name: 'A dwarf in scarred plate', x: 35, y: 28, if: '!recruited:brakka', dialogue: 'a1a_docks', glyph: 'B', blocks: true }),
  O({ id: 'a1a_oakes', kind: 'npc', name: 'Gorm Oakes, barge-salvager', x: 37, y: 29, if: '!a1a_docks_done', dialogue: 'a1a_docks', glyph: 'g', blocks: true }),
  O({ id: 'a1a_ysolt', kind: 'npc', name: 'A woman in a bargeman\'s coat', x: 45, y: 29, if: 'a1a_ysolt_summons && !a1a_ysolt_met', dialogue: 'a1a_ysolt', glyph: 'Y', blocks: true }),
  O({ id: 'a1a_brisk', kind: 'npc', name: 'Ottoline Brisk, tinctures', x: 21, y: 13, dialogue: 'a1a_brisk', glyph: 'O', blocks: true }),
  O({ id: 'a1a_tarrant', kind: 'npc', name: 'Quartermaster Tarrant, arms', x: 33, y: 13, dialogue: 'a1a_tarrant', glyph: 'T', blocks: true }),
  O({ id: 'a1a_sollace', kind: 'npc', name: 'Aubrine Sollace, Dawnblade', x: 24, y: 16, if: '!a1_mob', dialogue: 'a1a_mob', glyph: 'A', blocks: true }),
  O({ id: 'a1a_varek_bound', kind: 'npc', name: 'A bound Veilborn man', x: 25, y: 17, if: '!a1_mob && !recruited:varek', dialogue: 'a1a_mob', glyph: 'V', blocks: true }),
  O({ id: 'a1a_jory', kind: 'npc', name: 'A bound Veilborn boy', x: 26, y: 17, if: '!a1_mob && recruited:varek', dialogue: 'a1a_mob', glyph: 'j', blocks: true }),
  O({ id: 'a1a_varek_well', kind: 'npc', name: 'Varek Sable, on the well-rim', x: 26, y: 16, if: 'a1_mob && a1a_mob_varek && !recruited:varek', dialogue: 'a1a_mob_after', glyph: 'V', blocks: true }),
];

// ═══════════════════════════════════════════════════════════════════════ dialogues

const D: DialogueTree[] = [];

// ───────────────────────────────────────────────────────────── the north gate

D.push({
  id: 'a1a_gate', title: 'The North Gate',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: "The north road ends at a gate of new iron hung on old stone. A queue of carts waits in the kiln-smoke: turnips, barrel-staves, a family with everything they own roped to a handcart. A toll-board lists what everything costs to bring into Ashenford, including, near the bottom, in fresh paint, “Persons, Veil-touched (to be registered): no charge.”",
      interjections: [
        { who: 'nima', text: "Nima breathes in through her nose and makes a face like someone tasting bad wine she used to love. “It smells exactly the same. Hot glass and wet coal. I hate that it smells exactly the same.”" },
        { who: 'varek', text: "Varek pulls his hood lower, so that the violet in his eyes is only a rumour. He says nothing at all, which from Varek is a speech." },
      ],
      next: 'cole',
    },
    cole: {
      speaker: 'a1a_cole',
      text: "The sergeant at the barrier doesn't look up from her slate. “Names. Business. Weapons I can see. Anyone Veil-touched among you, they register at the garrison by sundown, it's free, it's for their protection, I don't write the boards.” Chalk squeaks. “Toll's two gold a head for armed strangers. Or you can turn round. Lot of people turning round lately.”",
      options: [
        { text: "Two gold. Here.", tone: 'pragmatic', tags: ['authority'], if: 'gold>=2', effects: ['gold -2'], next: 'pass' },
        { text: "(Soldier) Long day, Sergeant? I stood watches on gates like this.", if: 'bg:soldier', tone: 'background', tags: ['authority'], effects: ['rep covenant 1'], next: 'soldier' },
        { text: "(Persuasion) We're here to spend money in your town, Sergeant. Lots of it.", tone: 'diplomatic', check: { skill: 'persuasion', dc: 12 }, success: 'free', failureEffects: ['gold -2'], failure: 'pass' },
        { text: "(Deception) Conclave business. You'll want to forget you saw us.", tone: 'deceptive', tags: ['deception'], check: { skill: 'deception', dc: 14 }, success: 'free', failureEffects: ['gold -2'], failure: 'laugh' },
      ],
    },
    soldier: {
      speaker: 'a1a_cole',
      text: "She looks up, finally, and finds whatever she was looking for in the way you stand. “Long month.” The barrier lifts. “Go on. Don't make me regret it.”",
      next: 'news',
    },
    free: {
      speaker: 'a1a_cole',
      text: "“Spend it at the Kiln & Kettle and tell Wynn I sent you, then.” The barrier lifts. Not a coin changes hands. She seems almost relieved to be talked out of something.",
      next: 'news',
    },
    laugh: {
      speaker: 'a1a_cole',
      text: "“Conclave.” She laughs, short and without malice. “Conclave don't queue, friend. Conclave come in by the river with a warrant and a better coat. Two gold.” You pay.",
      next: 'news',
    },
    pass: {
      speaker: 'a1a_cole',
      text: "The coin goes into a tin box with a Covenant seal on it. The barrier lifts.",
      next: 'news',
    },
    news: {
      speaker: 'a1a_cole',
      text: "“Advice, free with the toll. There's a Washing in the square at the noon bell — Dawnblades. Keep out of it. Bailiffs are in the Low Quarter, keep out of that too. Lodging's at the Kiln & Kettle if you can stand the singing.” She is already looking past you at the next cart. “Welcome to Ashenford. Mind the ash.”",
      effects: ['set a1a_gate_seen'],
      end: true,
    },
  },
});

// ───────────────────────────────────────────────────────────── notice board

D.push({
  id: 'a1a_notice', title: 'Notice Board',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: [
        { if: 'ysolt_outcome=fought', text: "A board of weathered oak in the corner of the square, layered thick as a pastry with notices. Pinned square in the middle, on good Conclave paper, is a description of you: height, colouring, the way you walk. Someone has drawn a moustache on it. You don't have a moustache. It's oddly comforting." },
        { text: "A board of weathered oak in the corner of the square, layered thick as a pastry with notices: Covenant ordinances in black letter, Dawnblade bills in white and gold, a lost goat, a found goat (not the same goat), barges for hire, and a great many lists of names under the words HAVE YOU SEEN." },
      ],
      next: 'hub',
    },
    hub: {
      speaker: 'dm',
      text: 'The notices flap in the smoky wind.',
      options: [
        { text: "Read the Covenant ordinance.", tone: 'curious', once: true, next: 'ordinance' },
        { text: "Read the Dawnblade bill.", tone: 'curious', once: true, next: 'washing' },
        { text: "Read the writ pinned beside the Low Quarter notices.", tone: 'curious', once: true, next: 'writ' },
        { text: "Read the lists of names.", tone: 'compassionate', once: true, tags: ['mercy'], next: 'names' },
        { text: "You recognise a mark scratched in the corner: a broken chain.", if: '!a1a_cooper_known && (knows_unbound || item:unbound_sigil)', tone: 'curious', next: 'chain' },
        { text: "(Perception) Something is scratched very small in the corner of the board.", if: '!a1a_cooper_known && !knows_unbound && !item:unbound_sigil', tone: 'curious', once: true, check: { skill: 'perception', dc: 12 }, success: 'chain', failure: 'chain_f' },
        { text: "Step away from the board.", tone: 'leave', end: true },
      ],
    },
    ordinance: {
      speaker: 'dm',
      text: "ORDINANCE OF TESTIMONY. By order of the Chancellor, any person claiming recollection of events, kin or places not entered in the civil register (\"unstable testimony\") shall present themselves to the garrison for recording. The repetition of unstable testimony in song, print or public speech is sedition. Order is the precondition of mercy. Underneath, in pencil, someone has written: so is soup.",
      next: 'hub',
    },
    washing: {
      speaker: 'dm',
      text: "A WASHING at the noon bell. The river remembers how to make things clean. Bring your doubts and leave them in the Sillow. All are welcome. All are forgiven. — A. Sollace, of the Last Dawn. The bill is beautifully lettered. Somebody took real care over it.",
      next: 'hub',
    },
    writ: {
      speaker: 'dm',
      text: "NOTICE OF SEIZURE. The property known as the Wren House, Low Quarter, being in arrears, is forfeit to its creditor and shall be put to the use of the Covenant as a relocation hostel. Dependants shall be removed to the Solmara workhouses, where they will be fed. It is signed, in a neat and characterless hand, on behalf of the Office of Correspondence.",
      interjections: [
        { who: 'kael', text: "Kael reads it once. Then he reads it again, slower, the way you read a letter that might be a death. “Ah,” he says, very lightly. “That's... that's new.”" },
      ],
      next: 'hub',
    },
    names: {
      speaker: 'dm',
      text: "HAVE YOU SEEN. Under each heading, a village: Marrowby. Cobble End. The Teeth. Under each village, names, in a dozen different hands, some crossed out and then — stubbornly — written in again. Somebody has gone through every list and put a tiny dot beside each name, the way you'd tick a register.",
      next: 'hub',
    },
    chain: {
      speaker: 'dm',
      text: "Beside a cooper's card — CASKS MENDED. J. HOOPER, LOW QUARTER. OLD CASKS A SPECIALTY — someone has scratched a broken chain no bigger than a thumbnail. The sign of the Unbound. Old casks. You think you understand what kind of cask.",
      effects: ['set a1a_cooper_known', 'quest a1a_safehouse rumour', 'clue a1a_safehouse mark'],
      next: 'hub',
    },
    chain_f: {
      speaker: 'dm',
      text: "A scratch. A knot in the wood. A child's initials, possibly. Whatever it is, it isn't talking to you.",
      next: 'hub',
    },
  },
});

// ───────────────────────────────────────────────────────────── tax-house

D.push({
  id: 'a1a_taxhouse', title: 'The Covenant Tax-House',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: "The tax-house was a guildhall once; you can still see the glaziers' arms chiselled off the lintel. Inside, the air is all ink and wet wool. Clerks in iron-grey sleeves sit behind a long counter, and in front of it a queue of bargemen, glassblowers and refugees shuffles forward one tithe at a time. A clerk with a cold pinches the bridge of his nose and says “Next,” as if it were a prayer.",
      options: [
        { text: "Ask about the Wren House debt.", tone: 'curious', once: true, if: '!a1a_debt_known', next: 'debt' },
        { text: "(Investigation) Read the requisition ledger over a clerk's shoulder.", tone: 'curious', tags: ['stealth', 'curiosity'], once: true, if: '!a1a_requisition_seen', check: { skill: 'investigation', dc: 15, advIf: 'comp:kael' }, success: 'ledger', failure: 'ledger_f' },
        { text: "Leave the queue to its shuffling.", tone: 'leave', end: true },
      ],
    },
    debt: {
      speaker: 'dm',
      text: "The clerk with the cold looks it up, because looking things up is the only joy left to him. “Wren House. Arrears assigned... let me see... assigned to a private creditor in Solmara. Office of Correspondence.” He frowns at the line. “I don't know what that is. I've never known what that is. They never pay a tithe and nobody ever asks them to.” He blows his nose. “Next.”",
      effects: ['set a1a_debt_known'],
      next: 'start',
    },
    ledger: {
      speaker: 'dm',
      text: "Upside down, between a barge-levy and a lamp-oil duty: CONCLAVE REQUISITION, under a Seeker-Captain's seal. Rations for fourteen, twenty days. Lamp oil, forty flasks. Cold-iron chain, sixty feet. Destination: Valdros, by the Old Path. The date is six days ago. Whatever the Conclave wants in those ruins, it is not planning to look at it and leave — and it set out before you had decided where you were going.",
      effects: ['set a1a_requisition_seen'],
      interjections: [
        { who: 'kael', text: "Kael, very quietly, at your elbow: “Sixty feet of cold iron isn't for ruins. It's for people. Somebody's expecting a guest who might not want to stay.”" },
        { who: 'vaelis', text: "Vaelis reads it upside down faster than you do, and goes a shade paler than an elf already is. “Cold iron and lamp oil,” he murmurs. “That is a Seeker's shopping list. I know because I wrote the first one.”" },
      ],
      next: 'start',
    },
    ledger_f: {
      speaker: 'dm',
      text: "The clerk turns the page just as you lean in, and then looks up at you with the dead eyes of a man who has caught a thousand people reading over his shoulder. “Queue,” he says. You queue.",
      next: 'start',
    },
  },
});

// ───────────────────────────────────────────────────────────── chapel

D.push({
  id: 'a1a_chapel', title: 'Chapel of the Six Lights',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: [
        { if: 'a1_mob=fought', text: "The chapel is a squat thing of soot-black brick with six lanterns over the door. Inside, a soup line runs from the altar rail to the street. When you come in, a dozen faces in the line turn, and you hear the word Washing pass along it like a coin. Father Iven Mercer serves you anyway. He just doesn't smile." },
        { text: "The chapel is a squat thing of soot-black brick with six lanterns over the door. Inside, a soup line runs from the altar rail to the street — refugees, mostly, with the stunned look of people whose village is now a meadow. A priest with a ladle in one hand works his way along it, blessing and ladling, ladling and blessing." },
      ],
      next: 'iven',
    },
    iven: {
      speaker: 'a1a_iven',
      text: "“Iven Mercer. Penitent of the Last Dawn — the soup end of the Order, not the sword end.” He wipes his hand on his robe and offers it. “The Lights judge the world, friend. That is their business. Feeding it in the meantime is ours.”",
      options: [
        { text: "Put twenty gold in the alms box.", tone: 'compassionate', tags: ['charity', 'faith'], if: 'gold>=20', once: true, effects: ['gold -20', 'rep dawn 3', 'xp 25'], next: 'alms' },
        { text: "What do you make of the Washing in the square?", tone: 'curious', once: true, next: 'washing' },
        { text: "Tell me about Aubrine Sollace.", tone: 'curious', once: true, next: 'sollace' },
        { text: "Go in the Lights, Father.", tone: 'leave', end: true },
      ],
    },
    alms: {
      speaker: 'a1a_iven',
      text: "He doesn't count it. “Forty bowls,” he says, “and bread if Hanne's oven holds.” He makes the lantern-sign over you, quick and practical, like a man tying a knot. “Whatever you're carrying, may it be lighter for it.”",
      next: 'iven',
    },
    washing: {
      speaker: 'a1a_iven',
      text: "The ladle stops. “The Dawnblades answer to Commander Merrow in Solmara, not to a soup-priest in Ashenford.” He looks at the line, not at you. “I have read the same Book they have. I find in it a great deal about judgment and very little about rivers. I have said so. They were very kind to me about it.”",
      next: 'iven',
    },
    sollace: {
      speaker: 'a1a_iven',
      text: "He is quiet for a long moment. “Aubrine was a Penitent once. She ran this soup line before me. Then the Sillow took her boy, Tam, and gave him back three days later.” He sets the ladle down. “He knew her. He loved her. He remembered a different mother — a woman in a town that isn't on any map — and he cried for her every night. Aubrine took him down to the river steps herself, to wash the wrongness out.” His voice is very even. “She has never once spoken of it. She preaches the Washing as if it were a kindness, because if it is not, then she —” He stops. “Speak gently to her, if you speak to her at all.”",
      effects: ['set a1a_sollace_story'],
      interjections: [
        { who: 'ilyra', text: "Ilyra has gone very still. “I have sat with a hundred Tams,” she says. “Not one of them was a wrongness. Every one was a child.”" },
      ],
      next: 'iven',
    },
  },
});

// ───────────────────────────────────────────────────────────── refugee tenement

D.push({
  id: 'a1a_tenement', title: 'The Refugee Tenement',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: "The tenement leans against the Low Quarter wall like a drunk against a friend. Someone has chalked a number on the door in Covenant grey — 43 — and under it, in a different hand, MARROWBY. Washing hangs from every window. On the step a woman is mending a child's coat, and reciting something under her breath in time with the needle.",
      next: 'annick',
    },
    annick: {
      speaker: 'a1a_annick',
      text: "“Hedda Cope. Tam Cope. Little Liss. Old Gwyn at the ford.” She looks up without stopping the needle. “Sorry. If I stop, I lose my place. Annick Dole. We're Marrowby — what's left of it. Forty-three of us, the Covenant says. We woke up on a hillside in our nightclothes and the village was a meadow. Sheep in it. Sheep! As if they'd always been there.”",
      options: [
        { text: "Here — for the forty-three. (10 gold)", tone: 'compassionate', tags: ['charity'], if: 'gold>=10', once: true, effects: ['gold -10', 'xp 15'], next: 'gift' },
        { text: "Who's been helping you?", tone: 'curious', once: true, next: 'helpers' },
        { text: "Keep your place, Annick. I won't interrupt.", tone: 'leave', end: true },
      ],
    },
    gift: {
      speaker: 'a1a_annick',
      text: "She closes your fingers over the coins for a moment before she takes them, as if she wants you to feel them go. “That's boots for two,” she says. “I'll say your name when I say the rest. Not out loud. You don't want to be on a list in this town.”",
      next: 'annick',
    },
    helpers: {
      speaker: 'a1a_annick',
      text: "“Covenant count us. Dawnblades pray at us — they say we were judged, and the sheep weren't.” A short, angry laugh. “The only one who's been any use was a woman in a black shawl, all ink. She sat on this step two days and wrote down every name I gave her. Every one. Even Old Gwyn's dog.” The needle pauses, for the first time. “She said if I remembered any more, I should ask the cooper whether he mends old casks. Funny thing to say. I've been remembering ever since.”",
      effects: ['set a1a_cooper_known', 'quest a1a_safehouse rumour', 'clue a1a_safehouse marrowby'],
      interjections: [
        { who: 'tessa', text: "Tessa has her little notebook out, and then, after a moment, puts it away again unwritten. “Some things you don't collect,” she says. “You just carry them.”" },
      ],
      next: 'annick',
    },
  },
});

// ───────────────────────────────────────────────────────────── merchants

D.push({
  id: 'a1a_brisk', title: 'Sillowglass Tinctures',
  start: 'start',
  nodes: {
    start: {
      speaker: 'a1a_brisk',
      text: "A stall of green glass bottles racked like organ pipes, each one catching the kiln-light. The woman behind it has a bandolier of tiny vials across her chest and talks at the speed of a kettle coming to the boil. “Ottoline Brisk, Sillowglass Tinctures — the glass is local, the cures are mine, and the prices are honest-ish. Healing draughts, antitoxin, lamp oil that'll set a Dawnblade's sash alight at twenty paces, not that I'd suggest it, not that I wouldn't. What's ailing you?”",
      options: [
        { text: "Show me what you have.", tone: 'friendly', effects: ['shop a1a_glass'] },
        { text: "(Persuasion) Honest-ish? Let's make it honest.", tone: 'friendly', tags: ['humor'], once: true, if: '!a1a_brisk_discount', check: { skill: 'persuasion', dc: 14 }, successEffects: ['set a1a_brisk_discount'], success: 'haggle', failure: 'haggle_f' },
        { text: "What's the news in Ashenford?", tone: 'curious', once: true, next: 'gossip' },
        { text: "Another time.", tone: 'leave', end: true },
      ],
    },
    haggle: {
      speaker: 'a1a_brisk',
      text: "She narrows her eyes, then laughs, a short bright bark. “Fine. Fine! Honest for you. Don't tell the bargemen, they'll want it too, and then where will I be? Solvent, probably. Disgusting.”",
      next: 'start',
    },
    haggle_f: {
      speaker: 'a1a_brisk',
      text: "“Ooh, no. Nice try. My mother sold glass on this square for forty years and she could out-haggle a tax-man with a toothache. Honest-ish. Take it or leave it.”",
      next: 'start',
    },
    gossip: {
      speaker: 'a1a_brisk',
      text: "“News? Dawnblades want to drown a Veilborn at noon. Bailiffs want the Wren House. The Conclave office hasn't opened its shutters in a week except to let wardens out, north. Old Bram Emberglass lit his second kiln for the first time since the fire and then put it out again, nobody knows why.” She ticks them off on her vials. “And the cooper in the Low Quarter is making barrels nobody's buying. Make of that what you like. I sell tinctures, not opinions. The opinions are free.”",
      next: 'start',
    },
  },
});

D.push({
  id: 'a1a_tarrant', title: 'Garrison Surplus',
  start: 'start',
  nodes: {
    start: {
      speaker: 'a1a_tarrant',
      text: [
        { if: 'reptier:covenant=Hostile', text: "Quartermaster Tarrant finds your name in his ledger before you reach the counter, and puts his pencil down on it like a pin through a moth. “No.” That's all. Just no." },
        { text: "Racks of halberds, crates of mail, shields stencilled with the iron wreath of the Covenant: garrison surplus, sold to civilians at ledger price. The quartermaster has a pencil behind each ear and a third in his hand. “Bede Tarrant. Prices are what the ledger says. The ledger,” he adds, licking the pencil, “knows who's been helpful to the Covenant and who's been a nuisance. Have a look.”" },
      ],
      options: [
        { text: "Show me your stock.", tone: 'pragmatic', if: '!(reptier:covenant=Hostile)', lockedText: 'The Covenant will not trade with you.', effects: ['shop a1a_arms'] },
        { text: "Leave him to his ledger.", tone: 'leave', end: true },
      ],
    },
  },
});

// ───────────────────────────────────────────────────────────── the garrison

D.push({
  id: 'a1a_garrison', title: 'The Ashenford Garrison',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: "The garrison was the customs house before the Covenant came; now its arches are bricked to arrow-slits and its yard is full of conscripts drilling badly in the drizzle. Beside the gate stands the Wildfire stone, eight hundred years old, black with soot that nobody scrubs off on purpose. Captain Sabine Dray signs dispatches on the stone's flat top, because it is the only dry surface in the yard.",
      next: 'dray',
    },
    dray: {
      speaker: 'a1a_dray',
      text: [
        { if: 'a1_safehouse=betrayed', text: "Dray nods to you. Not warmly; Dray does nothing warmly. “You again. Hooper's in the cells. He asks for his tools. I've said no.” A signature. “What do you want?”" },
        { text: "“Dray. Ashenford garrison.” She doesn't look up from the dispatch. “I have four hundred refugees, sixty soldiers, a Dawnblade mob in my square, bailiffs from an office I've never heard of, and a Conclave licensing office that doesn't answer my letters. You have until I finish signing this.” She signs it. “Now you have until I finish signing the next one.”" },
      ],
      next: 'menu',
    },
    menu: {
      speaker: 'a1a_dray',
      text: 'Dray reaches for the next dispatch.',
      options: [
        { text: "What's happening in Ashenford?", tone: 'curious', once: true, next: 'news' },
        { text: "You're holding a gnome bard. Tessa Quickthorn.", if: 'a1a_tessa_jailed && !recruited:tessa', tone: 'diplomatic', next: 'bail' },
        { text: "What do you hear about Valdros?", if: '!a1_warned_of_ambush', tone: 'curious', next: 'valdros' },
        { text: "Where did the Wren House children go?", if: 'a1_wren=lost', tone: 'compassionate', once: true, next: 'wren_lost' },
        { text: "The Unbound keep a safe house in the Low Quarter. I know where.", if: 'a1a_cooper_known && !a1_safehouse', tone: 'pragmatic', tags: ['authority'], next: 'betray_confirm' },
        { text: "I'll let you get back to your dispatches.", tone: 'leave', end: true },
      ],
    },
    news: {
      speaker: 'a1a_dray',
      text: "“Refugees from three villages that aren't there any more. A Conclave detachment that came through a week ago, drew stores and went north without so much as a thank-you. Dawnblades who are technically our allies and practically a fire risk. And a factor from Solmara with a writ for the Wren House that I didn't countersign.” Her pen pauses. “Order is the precondition of mercy. I've started to wonder what mercy is the precondition of.”",
      next: 'menu',
    },
    wren_lost: {
      speaker: 'a1a_dray',
      text: "“The Solmara coach. Thirty-one children, one matron who refused to get off.” She signs something hard enough to tear it. “I countersigned nothing. Remember that, if anybody asks. Nobody will ask.”",
      next: 'menu',
    },
    bail: {
      speaker: 'a1a_dray',
      text: "“The singer.” Dray almost smiles. “Rusk brought her in reading section four aloud. She corrected his pronunciation. Bail is forty gold, or I can lose the paperwork if somebody gives me a reason I can write down.”",
      options: [
        { text: "Forty gold. Here.", tone: 'pragmatic', if: 'gold>=40', lockedText: 'You need 40 gold.', effects: ['gold -40'], next: 'bailed' },
        { text: "(Persuasion) Write down: 'Released to the custody of the Heart's bearer, who the Covenant would rather owe it a favour.'", tone: 'diplomatic', check: { skill: 'persuasion', dc: 13 }, success: 'bailed', failure: 'bail_f' },
        { text: "Not now.", tone: 'leave', next: 'menu' },
      ],
    },
    bail_f: {
      speaker: 'a1a_dray',
      text: "“That's not a reason, that's a speech.” She taps the ledger. “Forty gold.”",
      options: [
        { text: "Forty gold. Here.", tone: 'pragmatic', if: 'gold>=40', lockedText: 'You need 40 gold.', effects: ['gold -40'], next: 'bailed' },
        { text: "Not now.", tone: 'leave', next: 'menu' },
      ],
    },
    bailed: {
      speaker: 'dm',
      text: "A soldier brings Tessa up from the cells. She has a lute with no strings and an expression of enormous dignity. “I'd like it noted,” she tells the yard at large, “that the acoustics down there are criminal. Ah. My rescuers.”",
      effects: ['unset a1a_tessa_jailed', 'set a1a_inn_done'],
      next: 'tessa_out',
    },
    tessa_out: {
      speaker: 'comp:tessa',
      text: "“You came back for me. People don't, usually; it's my one complaint about people.” She restrings the lute by feel while she talks. “I'm a collector. Songs with no origin — tunes everyone half-knows and nobody wrote. I came to this valley chasing one. And the bell at Hollowmere — I was booked to play that festival, you know. Something rang there. I'd very much like to know what. Have you got room for a bard? You have the look of people who are about to need a song written about them, and it had better be written by someone who was there.”",
      options: [
        { text: "Welcome aboard, Tessa.", tone: 'friendly', tags: ['humor'], effects: ['recruit tessa', 'rel tessa affection 3', 'memory tessa 2 You paid my bail in Ashenford. Nobody ever paid my bail.'], next: 'tessa_joined' },
        { text: "Go and sing somewhere safer.", tone: 'leave', next: 'tessa_no' },
      ],
    },
    tessa_joined: {
      speaker: 'comp:tessa',
      text: "“Splendid. I'll start the ballad tonight. I'll leave out the bit where I was in prison. Or I'll make it much, much worse — it depends on the rhyme.”",
      next: 'menu',
    },
    tessa_no: {
      speaker: 'comp:tessa',
      text: "“Safer.” She tests the word like a sour note. “Right. I'll be at the Kiln & Kettle, being safe, very loudly. Come and find me if you change your mind.”",
      next: 'menu',
    },
    valdros: {
      speaker: 'a1a_dray',
      text: [
        { if: 'a1a_dray_refused', text: "“I've told you what I can tell you, which is nothing.” She doesn't look up." },
        { text: "Her pen stops. It is the first time she has stopped writing since you came in. “Why would I tell you anything about Valdros?”" },
      ],
      options: [
        { text: "Because we're on the same side, Captain.", if: 'reptier:covenant=Trusted || reptier:covenant=Allied', tone: 'diplomatic', tags: ['authority'], next: 'report' },
        { text: "(Persuasion) Because the Conclave drew your stores and didn't say thank you. And I'm the one they're waiting for.", tone: 'diplomatic', if: '!a1a_dray_refused', tags: ['honesty'], check: { skill: 'persuasion', dc: 16, advIf: 'bg:soldier || a1a_requisition_seen' }, success: 'report', failureEffects: ['set a1a_dray_refused'], failure: 'no_report' },
        { text: "(Kael) Let Kael fold a note with a Covenant dispatch knot and slide it across the stone.", if: 'comp:kael && kael_covenant_hint && !a1a_dray_refused', tone: 'deceptive', tags: ['deception'], check: { skill: 'deception', dc: 13 }, success: 'report_kael', failureEffects: ['set a1a_dray_refused'], failure: 'no_report' },
        { text: "Never mind.", tone: 'leave', next: 'menu' },
      ],
    },
    no_report: {
      speaker: 'a1a_dray',
      text: "“No.” She goes back to writing. “Whatever is at Valdros belongs to the Conclave, and the Conclave belongs to itself. I have a town to keep standing.”",
      next: 'menu',
    },
    report_kael: {
      speaker: 'dm',
      text: "Kael's fingers do something quick: three tucks and a turn. He slides the folded note across the Wildfire stone with the dull face of a junior clerk. Dray looks at the fold. Then at Kael, for a long time. “So Crane has you too,” she says, so quietly only the three of you hear it. “Fine. You'll want this, then.”",
      interjections: [
        { who: 'kael', text: "Kael keeps the clerk's face on until you're out of the yard. Then he says, “I hate that that worked,” and doesn't say anything else for a while.", effects: ['rel kael trust 2'] },
      ],
      next: 'report',
    },
    report: {
      speaker: 'a1a_dray',
      text: "She takes a dispatch from inside her coat — not from the pile — and reads it to you flat. “‘From the Office of Correspondence, Solmara. Conclave detachment under a Seeker-Captain's seal drew stores at Ashenford for fourteen, twenty days. Destination Valdros, by the Old Path. Covenant patrols are to keep off the Old Path road until recalled. Do not interfere.’” She folds it away. “The Conclave doesn't take twenty days of rations and sixty feet of chain to look at ruins. They're waiting for someone. And they are very sure that someone is coming, and by which road.” She looks at you, and for a moment the tiredness in her is something else. “I'd hate it to be you. Spymaster Crane wouldn't, particularly. Go carefully.”",
      effects: ['set a1_warned_of_ambush', 'set a1a_dray_report', 'xp 50'],
      next: 'menu',
    },
    betray_confirm: {
      speaker: 'a1a_dray',
      text: "Dray puts the pen down. “The Unbound.” She says it like the name of a cough that's going round. “Crane would give a year's pay for an Ashenford safe house. I'd give a week's sleep. Are you sure you want to tell me? Once it's in my book, it's in my book.”",
      decision: true,
      options: [
        { text: "No. Forget I spoke.", tone: 'leave', tags: ['caution'], next: 'menu' },
        { text: "Hooper's cooperage. Behind the barrels.", tone: 'pragmatic', tags: ['authority', 'pragmatic'], next: 'betray' },
      ],
    },
    betray: {
      speaker: 'dm',
      text: "Dray sends a squad. You hear the hammering from across the Low Quarter, and then a long silence. When the sergeant comes back it is with Josse Hooper in irons — the big man walking slowly, carefully, as if he were afraid of breaking the chains — and a sack of wet paper. “Cellar was empty, Captain. Ink still wet. They went out through the river culvert.” Dray writes it all down. Then she counts out coins from a strongbox and pushes them across the stone, and with them, a folded dispatch.",
      effects: ['set a1_safehouse betrayed', 'complete a1a_safehouse betrayed', 'rep covenant 10', 'rep unbound -30', 'gold 50'],
      interjections: [
        { who: 'kael', text: "Kael watches Hooper go by in chains and says nothing at all. When you look at him, he is looking at the ground, as if he'd dropped something there.", effects: ['rel kael trust -4', 'memory kael -2 You sold the cooper to the Covenant for fifty gold and a piece of paper.'] },
        { who: 'varek', text: "“There,” Varek says, very softly. “Now you know what you are worth to them. Fifty gold. I hope it was worth what it cost.”", effects: ['rel varek trust -3'] },
        { who: 'brakka', text: "Brakka grunts. “Law's law,” she says, and doesn't sound sure, and doesn't look at the cooper." },
      ],
      next: 'betray_report',
    },
    betray_report: {
      speaker: 'a1a_dray',
      text: "“Bounty. And a favour back, since you've done me one.” She taps the dispatch. “‘Conclave detachment, Seeker-Captain's seal, fourteen strong, twenty days' stores, destination Valdros by the Old Path. Covenant patrols to keep clear.’ They're waiting for someone at Valdros, and they're very sure of the road. If it's you —” She shrugs. “Well. You'll know who your friends aren't.”",
      effects: ['set a1_warned_of_ambush', 'set a1a_dray_report'],
      options: walkOn('Leave the garrison.'),
    },
  },
});

// ───────────────────────────────────────────────────────────── the Wren House (a1a_wren; Kael)

const WREN_STAND: DialogueOption[] = [
  { text: "Here — the arrears. All of it. (150 gold)", tone: 'compassionate', tags: ['charity', 'protect'], if: 'gold>=150', lockedText: 'You need 150 gold.', effects: ['gold -150'], next: 'paid' },
  { text: "What would your correspondent take instead of a house?", tone: 'pragmatic', tags: ['pragmatic'], if: '!a1a_wren_deal_refused', next: 'deal_offer' },
  { text: "Bailiffs. Step away from that door.", tone: 'aggressive', tags: ['violence', 'protect', 'defiance'], effects: ['combat a1a_enc_wren'] },
  { text: "It's Covenant law. We can't stop this.", tone: 'pragmatic', tags: ['authority', 'caution'], next: 'lost' },
  { text: "Not yet. Let me think.", tone: 'leave', end: true },
];

D.push({
  id: 'a1a_wren', title: 'The Wren House',
  start: [
    { if: 'a1a_wren_closed && !recruited:kael', node: 'kael_again' },
    { if: 'a1a_wren_closed', node: 'after' },
    { if: 'a1_wren=saved', node: 'thanks' },
    { if: 'a1_wren=lost', node: 'lost_after' },
    { if: 'a1_wren=deal', node: 'kael_check' },
    { node: 'start' },
  ],
  nodes: {
    start: {
      speaker: 'dm',
      text: [
        { if: '!recruited:kael', text: "The Wren House is three storeys of crooked timber propped against the cooperage next door, with a painted wren over the lintel that has been repainted by children so many times it is now mostly a magpie. There is a face in every window. In the lane: four bailiffs in iron-grey, a sergeant nailing a writ to the door, a man in a grey coat holding a ledger — and, between the sergeant and the door, a young man in a coat too good for the Low Quarter, talking very fast and smiling very hard." },
        { text: "The Wren House is three storeys of crooked timber propped against the cooperage next door, with a painted wren over the lintel that has been repainted by children so many times it is now mostly a magpie. There is a face in every window. In the lane: four bailiffs in iron-grey, a sergeant nailing a writ to the door with slow, regretful blows, and a man in a grey coat holding a ledger as though it might at any moment need defending." },
      ],
      effects: ['quest a1a_wren writ'],
      interjections: [
        { who: 'kael', text: "Kael stops walking. For a moment the whole easy, charming arrangement of his face simply isn't there. “That's —” he says. “That's my house.” Then, faster, the smile back on like a coat: “Not my house. A house. I know a house. Excuse me.”" },
      ],
      next: 'harrow',
    },
    harrow: {
      speaker: 'a1a_harrow',
      text: "A woman in the doorway, floured to the elbows, arms folded across a body built for lifting children out of trouble two at a time. “You're not bailiffs, and you're not buying,” says Matron Harrow, “so you're either lost or you're useful. Thirty-one of mine upstairs. Our roof's been paid five years by somebody who never signs his name. Now the paper's been called.” She jerks her chin at the grey coat. “Ask him. He likes explaining.”",
      next: 'greaves',
    },
    greaves: {
      speaker: 'a1a_greaves',
      text: [
        { if: 'comp:kael && cq_kael_outcome=empty', text: "The man in the grey coat inclines his head. “Oswin Greaves, factor. Ah — and Mister Veyran. Our mutual correspondent noticed your silence, Mister Veyran. Silence is so very expensive.” He opens the ledger. “One hundred and fifty gold in arrears. The paper has been called. The house becomes a Covenant relocation hostel; the children go to the Solmara workhouses, where they will be fed. Order is the precondition of mercy.”" },
        { if: 'comp:kael && cq_kael_outcome=lied', text: "The man in the grey coat inclines his head. “Oswin Greaves, factor. And Mister Veyran — your last letter was very dull. Our correspondent dislikes dull.” He opens the ledger. “One hundred and fifty gold in arrears. The paper has been called. The house becomes a Covenant relocation hostel; the children go to the Solmara workhouses, where they will be fed. Order is the precondition of mercy.”" },
        { if: 'comp:kael', text: "The man in the grey coat inclines his head. “Oswin Greaves, factor. Mister Veyran. How nice that you could come.” He opens the ledger. “One hundred and fifty gold in arrears. The paper has been called. The house becomes a Covenant relocation hostel; the children go to the Solmara workhouses, where they will be fed. Order is the precondition of mercy.”" },
        { if: '!recruited:kael', text: "The man in the grey coat inclines his head. “Oswin Greaves, factor, Office of Correspondence.” To the young man by the door, without looking: “Mister Veyran, you have been told. Twice.” Then, to you, opening the ledger: “One hundred and fifty gold in arrears. The paper has been called. The house becomes a Covenant relocation hostel; the children go to the Solmara workhouses, where they will be fed. Order is the precondition of mercy.”" },
        { text: "The man in the grey coat inclines his head. “Oswin Greaves, factor, Office of Correspondence.” He opens the ledger. “One hundred and fifty gold in arrears. The paper has been called. The house becomes a Covenant relocation hostel; the children go to the Solmara workhouses, where they will be fed. Order is the precondition of mercy.”" },
      ],
      interjections: [
        { who: 'brakka', text: "Brakka looks up at the faces in the windows and her jaw works. “Workhouse,” she says. “That's a word for a place where bairns go to stop being bairns.”" },
        { who: 'seris', text: "Seris reads the writ on the door with a frown. “It is lawful,” she says slowly, as though the word had a splinter in it." },
        { who: 'ilyra', text: "“Fed,” Ilyra repeats softly. “He keeps saying fed. As if that were the whole of what a child is for.”" },
      ],
      decision: true,
      options: [
        WREN_STAND[0],
        { text: "(Investigation) Let me see that writ.", tone: 'curious', tags: ['curiosity'], once: true, check: { skill: 'investigation', dc: 14, advIf: 'a1a_debt_known || comp:kael' }, success: 'writ_flaw', failure: 'writ_fail' },
        { text: "(Persuasion) Thirty-one children, Factor. Find another way to balance your book.", tone: 'diplomatic', tags: ['mercy', 'diplomacy'], once: true, check: { skill: 'persuasion', dc: 16 }, success: 'persuaded', failure: 'cold' },
        { text: "(Intimidation) Your bailiffs look tired. Shall we find out how tired?", tone: 'aggressive', tags: ['boldness', 'defiance'], once: true, check: { skill: 'intimidation', dc: 15 }, success: 'cowed', failure: 'sergeant' },
        ...WREN_STAND.slice(1),
      ],
    },
    stand: {
      speaker: 'dm',
      text: "Bailiff-Sergeant Mott spits a nail into his palm and looks at the sky, which is the colour of a cooking pot. Greaves waits with the patience of a man who is paid by the outcome. Upstairs, someone small starts to cry, and is hushed.",
      options: WREN_STAND,
    },
    writ_fail: {
      speaker: 'dm',
      text: "Greaves holds it out for you with exaggerated courtesy. Seals, signatures, a great deal of black letter. It looks in perfect order. That may be what's wrong with it, but you can't see how.",
      next: 'stand',
    },
    writ_flaw: {
      speaker: 'dm',
      text: "Seals, signatures, black letter — and at the foot, where a writ of seizure under Covenant charter law must carry the countersign of the garrison commander, there is nothing at all. Only the Office of Correspondence, in that neat and characterless hand. Captain Dray never signed this. Greaves watches you find it, and something behind his politeness gets very still.",
      options: [
        { text: "Read the foot of the writ aloud, so the bailiffs can hear it.", tone: 'aggressive', tags: ['honesty', 'defiance'], next: 'flaw_won' },
        { text: "Show it to Greaves quietly. Let him withdraw with his dignity.", tone: 'diplomatic', tags: ['diplomacy'], next: 'flaw_quiet' },
      ],
    },
    flaw_won: {
      speaker: 'a1a_mott',
      text: "Bailiff-Sergeant Mott hears it. He looks at the writ, and at the door he has been nailing it to, and at Greaves. Then he starts, very slowly, to pull the nails back out. “Captain's countersign or it's not my door,” he says to nobody in particular. “That's the rule. I like the rule.” Greaves closes his ledger with a soft clap. “Our correspondent,” he tells you pleasantly, “will be very interested in you.”",
      effects: ['set a1_wren saved', 'complete a1a_wren saved', 'add a1a_resolved 1', 'rep covenant -2', 'set a1a_greaves_noted'],
      next: 'thanks',
    },
    flaw_quiet: {
      speaker: 'a1a_greaves',
      text: "He reads the place your finger rests, and smiles a small, real smile — the first you've seen. “Courteous,” he says. “How unusual.” He tucks the writ away. “Sergeant, there seems to be a clerical matter. We'll withdraw.” As the bailiffs pull out the nails, he adds, for you alone: “The paper still exists. It always does.”",
      effects: ['set a1_wren saved', 'complete a1a_wren saved', 'add a1a_resolved 1', 'rep covenant 1'],
      next: 'thanks',
    },
    persuaded: {
      speaker: 'a1a_greaves',
      text: "“Thirty-one children,” Greaves says. “I count them every visit. I do not like the number.” He looks at the windows for a long moment, then closes the ledger. “Very well. The arrears will be deferred one year, at my discretion. Our correspondent is a patient man and I am a — I am an accountant.” He tips his hat to Matron Harrow, who does not tip anything back.",
      effects: ['set a1_wren saved', 'complete a1a_wren saved', 'add a1a_resolved 1'],
      next: 'thanks',
    },
    cold: {
      speaker: 'a1a_greaves',
      text: "“A moving appeal. I'm moved.” He turns a page. “Unfortunately, so is the paper.”",
      next: 'stand',
    },
    cowed: {
      speaker: 'dm',
      text: "You don't touch a weapon. You don't have to. The bailiffs look at you, and at each other, and the one at the back quietly decides he has somewhere to be. Greaves sees it. “No one needs to be hurt over arithmetic,” he says smoothly. “Sergeant, we'll call again. Another day. A quieter one.”",
      effects: ['set a1_wren saved', 'complete a1a_wren saved', 'add a1a_resolved 1', 'rep covenant -3'],
      next: 'thanks',
    },
    sergeant: {
      speaker: 'a1a_mott',
      text: "Bailiff-Sergeant Mott sighs through his nails. “Right. That's enough of that.” Four cudgels come up together, wearily, the way men pick up tools at the end of a long shift.",
      options: [
        { text: "Have it your way, then.", tone: 'aggressive', tags: ['violence'], effects: ['combat a1a_enc_wren'] },
        { text: "Easy. Nobody needs to bleed.", tone: 'diplomatic', tags: ['caution'], next: 'stand' },
      ],
    },
    paid: {
      speaker: 'a1a_greaves',
      text: "Greaves counts the coin twice, because he is that kind of man, and writes a receipt in a hand so neat it looks printed. “The arrears are settled. Sergeant — the nails, please.” He hands Matron Harrow the receipt. “The paper itself, of course, remains with our correspondent. Do give the children my regards.” The Matron tears the receipt in half, looks at it, and then — because she is a practical woman — tapes it back together.",
      effects: ['set a1_wren saved', 'complete a1a_wren saved', 'add a1a_resolved 1', 'rep covenant 2'],
      next: 'thanks',
    },
    deal_offer: {
      speaker: 'a1a_greaves',
      text: [
        { if: 'comp:kael', text: "Greaves smiles as if you'd finally said something in his language. “Our correspondent collects information. You are — forgive me — extremely interesting. A letter now and then: where you go, what you carry, who you meet. Mister Veyran already knows the format. Simply... write more, Mister Veyran, and write it true. And the paper sleeps in a drawer. Indefinitely.”" },
        { text: "Greaves smiles as if you'd finally said something in his language. “Our correspondent collects information. You are — forgive me — extremely interesting. A letter now and then: where you go, what you carry, who you meet. Left at any Covenant post-house, marked for the Office of Correspondence. And the paper sleeps in a drawer. Indefinitely.”" },
      ],
      decision: true,
      options: [
        { text: "Agreed. A letter now and then.", tone: 'pragmatic', tags: ['pragmatic', 'deception'], next: 'deal',
          voices: { kael: "“Don't. I mean — do. I mean, I've been doing it for five years and I'm still alive. Mostly.”" } },
        { text: "No. Find another way.", tone: 'aggressive', tags: ['defiance', 'honesty'], effects: ['set a1a_wren_deal_refused'], next: 'stand' },
      ],
    },
    deal: {
      speaker: 'a1a_greaves',
      text: "“Splendid.” He writes something small in the margin of his ledger, and you have the feeling you have just become a line in it. “Sergeant, we're finished here.” The nails come out. As the bailiffs file away he lingers, and lowers his voice. “A gift, to begin our correspondence in good faith. Our correspondent is concerned for his investments, and you are now one of them. The Conclave has drawn stores at Ashenford for a reception at Valdros — fourteen guests, twenty days, sixty feet of chain. They seem very sure of your route.” He touches his hat. “Do try not to be received.”",
      effects: ['set a1_wren deal', 'set a1a_crane_deal', 'complete a1a_wren deal', 'add a1a_resolved 1', 'rep covenant 5', 'set a1_warned_of_ambush'],
      interjections: [
        { who: 'varek', text: "Varek watches the grey coat go. “Congratulations,” he says. “You have a patron now. Mine at least sings.”" },
      ],
      next: 'kael_check',
    },
    lost: {
      speaker: 'dm',
      text: "The writ goes up. The bailiffs go in. They are not cruel about it — that is somehow the worst of it; they carry the small ones down the stairs as carefully as eggs. A covered wagon with a Covenant wreath on its side backs into the lane. Matron Harrow climbs up beside the driver, takes off her apron, folds it, and holds it in her lap all the way to the bridge.",
      effects: ['set a1_wren lost', 'complete a1a_wren lost', 'add a1a_resolved 1', 'rep covenant 2'],
      interjections: [
        { who: 'kael', text: "Kael doesn't move until the wagon is out of sight. Then he says, in a perfectly ordinary voice, “Excuse me,” and walks round the corner, and you hear him put his fist into a wall, twice.", effects: ['rel kael trust -6', 'rel kael affection -4', 'memory kael -3 You let them take the Wren House children to Solmara.'] },
        { who: 'ilyra', text: "Ilyra goes to the wagon before it leaves and touches each small hand through the slats, one by one, and tells each child her name." },
      ],
      next: 'lost_after',
    },
    lost_after: {
      speaker: 'dm',
      text: [
        { if: 'a1a_wren_brawl_lost', text: "You come round on the cobbles with a bailiff's coat folded under your head — Mott's, you think. The lane is empty. The Wren House door is nailed shut with a Covenant writ on it, and somewhere toward the bridge a wagon is rattling away. A child's shoe lies in the gutter. Nobody has come back for it." },
        { text: "The Wren House door is nailed shut, the writ flapping on it in the smoky wind. A child's shoe lies in the gutter. Nobody has come back for it. Across the lane, the cooper has stopped hammering." },
      ],
      next: 'kael_check',
    },
    thanks: {
      speaker: 'a1a_harrow',
      text: [
        { if: 'comp:kael', text: "When the lane is clear, the children come down in a flood. Matron Harrow lets them, for once. Then she walks straight past you to Kael, takes his face in her floury hands, and says, “Kay. You daft, lying boy. I've known it was you paying the roof since the second winter.” She lets go and turns to you, brisk again. “And you. They made you this. Out of a spoon. I've no idea whose spoon. Don't ask.”" },
        { text: "When the lane is clear, the children come down in a flood — around your legs, under your arms, one of them up your back before anyone can stop her. Matron Harrow lets them, for once. “Thirty-one,” she says. “Still thirty-one.” She presses something small and bent into your hand. “They made you this. Out of a spoon. I've no idea whose spoon. Don't ask.”" },
      ],
      effects: ['give a1a_wren_ring'],
      next: 'kael_check',
    },
    kael_check: {
      speaker: 'dm',
      text: "The Low Quarter goes back to its business — barrels, washing, coal-smoke — the way water closes over a stone.",
      options: [
        { text: "Find the young man in the good coat.", if: '!recruited:kael', next: 'kael_meet' },
        { text: "Look for Kael.", if: 'comp:kael && a1_wren=saved', next: 'kt_saved' },
        { text: "Look for Kael.", if: 'comp:kael && a1_wren=deal', next: 'kt_deal' },
        { text: "Look for Kael.", if: 'comp:kael && a1_wren=lost', next: 'kt_lost' },
        { text: "Leave the Wren House behind.", if: 'recruited:kael && !comp:kael', next: 'close' },
      ],
    },
    kael_meet: {
      speaker: 'comp:kael',
      text: [
        { if: 'a1_wren=lost', text: "You find him on the cooperage steps with blood on his knuckles and nothing at all on his face. “Kael Veyran,” he says. “Smuggler, liar, very occasional philanthropist. That was my house. Not on paper — nothing's ever mine on paper.” He looks at the bridge. “They're going to Solmara. So am I, sooner or later, to get them back. I'd rather go with people who know how to make enemies. You seem to have a talent for it.”" },
        { if: 'a1_wren=deal', text: "He's waiting for you at the corner, hands in his pockets. “Kael Veyran. Smuggler, liar, very occasional philanthropist. That was my house — the roof, anyway. I pay the roof.” A crooked smile. “You just signed up to write letters to the same man I write to. Welcome to the club. We meet never, the dues are your soul, and the stationery's excellent.” The smile goes. “Thank you. I mean it. Which is rare, so mark the day.”" },
        { text: "He's waiting for you at the corner, hands in his pockets, trying to look like a man who happens to be standing at a corner. “Kael Veyran. Smuggler, liar, very occasional philanthropist. That was my house. The roof, anyway — I pay the roof.” He looks at the windows, at the children still shrieking in the lane. “You just did the most expensive kind of favour. The kind I can't pay back. I hate those.” A beat. “I'll be honest, since you've earned one: somebody pays me to keep an eye on people like you. It'd be a great deal easier from inside the tent.”" },
      ],
      options: [
        { text: "Then come with us, and keep your eye on us properly.", tone: 'friendly', tags: ['honesty'], effects: ['recruit kael', 'rel kael trust 3', 'memory kael 2 You let me walk with you in Ashenford, knowing I was paid to watch you.'], next: 'kael_joined' },
        { text: "(Insight) Who's paying you, Kael?", tone: 'curious', tags: ['curiosity'], once: true, check: { skill: 'insight', dc: 13 }, success: 'kael_client', failure: 'kael_dodge' },
        { text: "Look after your house, Kael.", tone: 'leave', effects: ['set a1a_kael_declined'], next: 'kael_declined' },
      ],
    },
    kael_client: {
      speaker: 'comp:kael',
      text: "He opens his mouth to lie, sees your face, and visibly decides it isn't worth the effort. “I don't know. Truly. Letters with no seal, no name. They write like a tax. And they're folded —” his fingers sketch three tucks and a turn in the air — “like Covenant road-post. Same as that writ.” He laughs without any humour at all. “Funny, isn't it? I spend five years paying the roof, and the man who owns the roof is the man who pays me.”",
      effects: ['set a1a_kael_client_known'],
      options: [
        { text: "Then come with us. We'll find out who he is together.", tone: 'friendly', tags: ['protect'], effects: ['recruit kael', 'rel kael trust 5', 'memory kael 3 You knew who I reported to and asked me along anyway.'], next: 'kael_joined' },
        { text: "Look after your house, Kael.", tone: 'leave', effects: ['set a1a_kael_declined'], next: 'kael_declined' },
      ],
    },
    kael_dodge: {
      speaker: 'comp:kael',
      text: "“A client.” The smile is perfect and tells you nothing. “Clients pay for discretion. If I told you, I'd have to charge you, and you look skint.”",
      options: [
        { text: "Fine. Come anyway.", tone: 'friendly', effects: ['recruit kael', 'rel kael affection 2', 'memory kael 1 You asked me along in Ashenford without making me explain myself.'], next: 'kael_joined' },
        { text: "Look after your house, Kael.", tone: 'leave', effects: ['set a1a_kael_declined'], next: 'kael_declined' },
      ],
    },
    kael_joined: {
      speaker: 'comp:kael',
      text: "“Excellent. Brilliant. I'll get my things.” He has no things. He has never had things; he has pockets. “Rule one, since we're colleagues: never cheat anyone smaller than you. Rule two is negotiable.”",
      next: 'close',
    },
    kael_declined: {
      speaker: 'comp:kael',
      text: "“Right.” He looks at the house. “Someone should. I'll be around. I'm always around; it's a professional failing.”",
      next: 'close',
    },
    kael_again: {
      speaker: 'comp:kael',
      text: "Kael is sitting on the Wren House steps with a small girl asleep against his shoulder, very carefully not moving. “Changed your mind?” he whispers. “Don't answer loudly. If she wakes up she'll want a story, and all my stories are crimes.”",
      options: [
        { text: "Come with us, Kael.", tone: 'friendly', effects: ['recruit kael', 'rel kael trust 2', 'memory kael 1 You came back to the Wren House for me.'], next: 'kael_joined2' },
        { text: "Not yet.", tone: 'leave', end: true },
      ],
    },
    kael_joined2: {
      speaker: 'comp:kael',
      text: "He passes the sleeping child to Matron Harrow with the delicacy of a man handing over stolen crystal, and comes down the steps two at a time. “Lead on. Quietly. Very quietly.”",
      end: true,
    },
    kt_saved: {
      speaker: 'comp:kael',
      text: "He's in the doorway with a child on each arm, both of them trying to get at his pockets. “Five years,” he says, not looking at you. “Every job. Every fence. Every card game I shouldn't have won. Roof, flour, boots, the doctor in the bad winter.” He sets the children down. “Nobody ever helped me hold it up before. I don't know what you do with that. I'll work it out.”",
      effects: ['rel kael trust 6', 'rel kael affection 5', 'memory kael 3 You saved the Wren House. I never had to ask.'],
      next: 'close',
    },
    kt_deal: {
      speaker: 'comp:kael',
      text: "He waits until Greaves is gone. “You put your own name on his leash,” he says quietly. “For my kids.” He can't decide what his face should do, so it does several things. “That's either the kindest thing anyone's done for me or the stupidest, and I've been on the receiving end of both, and I genuinely can't tell.” He puts his hands in his pockets. “I'll help you write them. The letters. I know how to make a man very bored very truthfully.”",
      effects: ['rel kael trust 4', 'rel kael respect 3', 'memory kael 2 You made Crane\'s deal for the Wren House. Now we both write to him.'],
      next: 'close',
    },
    kt_lost: {
      speaker: 'comp:kael',
      text: "He comes back round the corner with his knuckles split. “I'm fine,” he says. “I'm fine. I'm going to get them back. Not today. Not with you, maybe.” He looks at you then, and it's a look you haven't had from Kael before: flat, and measuring, and very tired. “You said it was the law. You're right. It was.”",
      next: 'close',
    },
    close: {
      speaker: 'dm',
      text: "Somewhere above you, through an open window, a child is singing the counting-song all the Low Quarter children know: one for the river, two for the kiln, three for the ones who never come in.",
      effects: ['set a1a_wren_closed'],
      options: walkOn(),
    },
    after: {
      speaker: 'dm',
      text: [
        { if: 'a1_wren=lost', text: "The Wren House is nailed shut. Someone has hung a paper wren on the writ, folded from a page of a Covenant ordinance. Nobody has taken it down." },
        { text: "The Wren House is loud again. Matron Harrow waves a floury hand at you from a window and goes back to bellowing about boots." },
      ],
      end: true,
    },
  },
});

// ───────────────────────────────────────────────────────────── Drowning Day (a1a_mob; Varek)

const MOB_SEE: DialogueOption[] = [{ text: "See to the Veilborn.", tone: 'compassionate', effects: ['dialogue a1a_mob_after'] }];

D.push({
  id: 'a1a_mob', title: 'Drowning Day',
  start: [{ if: '!recruited:varek', node: 'start_varek' }, { node: 'start_child' }],
  nodes: {
    start_varek: {
      speaker: 'dm',
      text: "The square is full of white and gold. Thirty, forty people in Dawnblade sashes stand around the old well in a ring, singing something slow in a minor key, and at the centre of the ring a man kneels with his wrists bound behind him and a rope round his chest that runs to four pairs of hands. He is thin, dark-haired, expensively dressed and badly bruised. When he lifts his head, his eyes are violet, and they glow — faintly, like a coal you've forgotten is still lit.",
      effects: ['quest a1a_mob washing', 'set a1a_mob_varek'],
      next: 'preach',
    },
    start_child: {
      speaker: 'dm',
      text: "The square is full of white and gold. Thirty, forty people in Dawnblade sashes stand around the old well in a ring, singing something slow in a minor key, and at the centre of the ring a boy of eight sits on the cobbles with a rope round his chest. He isn't crying. He is looking at the crowd, one face at a time, as if he is memorising them. His eyes are violet. A woman is being held back at the edge of the ring, saying “please” over and over, in exactly the same voice each time, as if any one of them might be the right one.",
      effects: ['quest a1a_mob washing'],
      interjections: [
        { who: 'varek', text: "Varek has stopped. You have never seen Varek stop for anything. “The river steps,” he says, to nobody. “They walk you down the river steps. Same song. They haven't even changed the song.”", effects: ['rel varek trust 1'] },
      ],
      next: 'preach',
    },
    preach: {
      speaker: 'a1a_sollace',
      text: [
        { if: 'a1a_mob_varek', text: "On the rim of the well stands a woman in white with a lantern lit at noon. Her voice is the gentlest thing in Ashenford. “Friends. Do not be afraid of him. Be afraid for him. The Veil is a wound, and what comes through it is not wicked — it is unwritten. He did not choose those eyes. We do not hate him. We love him enough to give him back to the Lights clean.” She smiles down at the kneeling man with real tenderness. “Varek Sable. You were washed once, as a boy, and the river gave you back. The Lights are patient. Today we finish it.”" },
        { text: "On the rim of the well stands a woman in white with a lantern lit at noon. Her voice is the gentlest thing in Ashenford. “Friends. Do not be afraid of him. Be afraid for him. The Veil is a wound, and what comes through it is not wicked — it is unwritten. He did not choose those eyes. We do not hate him. We love him enough to give him back to the Lights clean.” She smiles down at the boy with real tenderness. “Jory. The river is cold, and then it is not. I promise.”" },
      ],
      interjections: [
        { who: 'seris', text: "Seris's hand finds her sword-hilt and stays there. “Dawnblades,” she says, very low. “Commander Merrow's people. My Order.” She doesn't say anything else. Her knuckles are white." },
        { who: 'ilyra', text: "“That is not mercy,” Ilyra says, quietly and clearly, and three people in the crowd turn to look at her." },
        { who: 'korr', text: "Korr looks at the rope, at the four pairs of hands, at the boy. “In the Wastes,” he says, “we would call this a hunt. And we would be ashamed.”" },
      ],
      next: 'victim',
    },
    victim: {
      speaker: 'dm',
      text: [
        { if: 'a1a_mob_varek', text: "The bound man catches your eye across the square. Somehow, even kneeling, he manages to look bored. “You're staring,” Varek Sable says, quite loud enough to carry. “Either help or sell tickets. I've no strong preference.” The rope jerks. The singing gets louder. The noon bell begins, slow, from the chapel." },
        { text: "The noon bell begins, slow, from the chapel. The four pairs of hands take up the slack in the rope. The boy, Jory, looks at you — not pleading; just looking, the way he has looked at everyone, adding your face to the list." },
      ],
      decision: true,
      options: [
        { text: "(Religion) “Raise no hand against what the Veil returns; the Lights will sort their own.” The Penitent's Rule, Sollace. Your own Book.", tone: 'diplomatic', tags: ['faith', 'mercy'], once: true, check: { skill: 'religion', dc: 13, advIf: 'class:cleric || class:paladin || comp:seris || comp:ilyra' }, success: 'faith_win', failure: 'faith_fail',
          voices: { seris: "“Use the Book. It is on his side. I — it is on his side.”", ilyra: "“Speak her scripture back to her. Gently. She has forgotten the gentle parts.”" } },
        { text: "(Persuasion) Look at him. Bound, frightened, done nothing. Which of you wants to explain that to the Lights?", tone: 'diplomatic', tags: ['mercy', 'diplomacy'], once: true, check: { skill: 'persuasion', dc: 15 }, success: 'crowd_win', failure: 'crowd_fail' },
        { text: "(Insight) Aubrine. Is this what you did for Tam?", if: 'a1a_sollace_story', tone: 'compassionate', tags: ['honesty', 'mercy'], once: true, check: { skill: 'insight', dc: 12, advIf: 'comp:ilyra' }, success: 'sollace_breaks', failure: 'sollace_hard' },
        { text: "(Intimidation) The first of you who pulls that rope goes in the river ahead of him.", tone: 'aggressive', tags: ['boldness', 'violence'], once: true, check: { skill: 'intimidation', dc: 14 }, success: 'fear_win', failure: 'brawl' },
        { text: "(Resonance) Show them what the river steps remember.", if: 'res>=1', tone: 'resonance', tags: ['forbidden', 'boldness'], effects: ['res -1'], next: 'res_win' },
        { text: "A penance, then. For your refugee kitchens. (40 gold)", if: 'gold>=40', lockedText: 'You need 40 gold.', tone: 'pragmatic', tags: ['greed', 'pragmatic'], next: 'bought',
          voices: { kael: "“Pay her. Rope's cheaper than funerals, and so are Dawnblades.”" } },
        { text: "Cut him loose. Now.", tone: 'aggressive', tags: ['violence', 'protect', 'defiance'], effects: ['combat a1a_enc_mob'],
          voices: { brakka: "“Enough talk. Shields up, and mind you don't kill any of the daft beggars.”", korr: "“Cut the rope. Then we see who is brave.”" } },
        { text: "Step back and think.", tone: 'leave', end: true },
      ],
    },
    stand: {
      speaker: 'a1a_sollace',
      text: "“Peace,” Aubrine Sollace says, to you, to the crowd, to the river. “I do not need you to agree. I only need you to stand aside.” The bell tolls again. Six. Seven.",
      options: [
        { text: "A penance, then. For your refugee kitchens. (40 gold)", if: 'gold>=40', lockedText: 'You need 40 gold.', tone: 'pragmatic', tags: ['greed', 'pragmatic'], next: 'bought' },
        { text: "(Resonance) Show them what the river steps remember.", if: 'res>=1', tone: 'resonance', tags: ['forbidden', 'boldness'], effects: ['res -1'], next: 'res_win' },
        { text: "Cut him loose. Now.", tone: 'aggressive', tags: ['violence', 'protect', 'defiance'], effects: ['combat a1a_enc_mob'] },
        { text: "Step back and think.", tone: 'leave', end: true },
      ],
    },
    faith_fail: {
      speaker: 'a1a_sollace',
      text: "“The Penitent's Rule.” She nods, as if you had made a very good point at a very bad time. “I kept it twenty years. Then I learned what the Veil gives back.” Her lantern does not waver. “Scripture is for those who have not stood at the river.”",
      next: 'stand',
    },
    crowd_fail: {
      speaker: 'dm',
      text: "A few faces in the crowd flicker. Then somebody at the back shouts “Heretic-lover!” and somebody else laughs, and the moment goes back under like a stone.",
      next: 'stand',
    },
    sollace_hard: {
      speaker: 'a1a_sollace',
      text: "Something moves behind her eyes and is put away, neatly, like a letter in a drawer. “My son is with the Lights,” she says. “Clean.” Her voice does not change at all. That is the most frightening thing you have heard in Ashenford.",
      next: 'stand',
    },
    brawl: {
      speaker: 'dm',
      text: "The zealots look at you, and then — terribly — they smile, because this is what they were told would happen. “Peace, friends,” Sollace says. “Take them gently.” White sashes close in.",
      options: [
        { text: "So be it.", tone: 'aggressive', tags: ['violence'], effects: ['combat a1a_enc_mob'] },
        { text: "A penance, then. For your refugee kitchens. (40 gold)", if: 'gold>=40', lockedText: 'You need 40 gold.', tone: 'pragmatic', tags: ['greed', 'pragmatic'], next: 'bought' },
        { text: "Back away.", tone: 'leave', end: true },
      ],
    },
    faith_win: {
      speaker: 'dm',
      text: "You give them the Rule in the old cadence, the way it is read on the Long Night, and the crowd knows it the way you know a lullaby. Somewhere near the front a woman in a Penitent's grey starts to say it with you. Then another. The singing falters and stops. The four pairs of hands on the rope look at each other, and one by one, let go. Aubrine Sollace stands on the well-rim with her lantern, alone. “The river is patient,” she says at last, and steps down.",
      effects: ['set a1_mob dispersed', 'complete a1a_mob dispersed', 'add a1a_resolved 1', 'rep dawn 2'],
      interjections: [
        { who: 'seris', text: "Seris lets go of her sword. Her hand is shaking. “The Rule,” she says. “I had forgotten there was a Rule.”", effects: ['rel seris respect 3'] },
      ],
      options: MOB_SEE,
    },
    crowd_win: {
      speaker: 'dm',
      text: "You don't argue with Sollace. You argue with the glassblower in the third row, the bargewoman with a baby on her hip, the old man who keeps glancing at the boy and then away. One by one they find somewhere else to look, and then somewhere else to be. The ring thins. The rope goes slack in hands that have stopped believing in it. “The river is patient,” Aubrine Sollace says to the empty square, and steps down from the well.",
      effects: ['set a1_mob dispersed', 'complete a1a_mob dispersed', 'add a1a_resolved 1', 'rep dawn -2'],
      options: MOB_SEE,
    },
    sollace_breaks: {
      speaker: 'a1a_sollace',
      text: "“Tam,” she says. Just the name. Her lantern tilts, and oil runs down her white sleeve, and she doesn't notice. “He knew me. He remembered another mother as well, but he knew me. He held my hand all the way down the steps.” The crowd has gone utterly silent. Aubrine Sollace looks at the rope in her people's hands as if she has never seen rope before. “Let him go,” she says. Her voice cracks straight down the middle. “Let him go. Let him go.”",
      effects: ['set a1_mob dispersed', 'set a1a_sollace_broken', 'complete a1a_mob dispersed', 'add a1a_resolved 1', 'xp 50'],
      interjections: [
        { who: 'ilyra', text: "Ilyra goes to her — to Sollace, not the Veilborn — and takes the lantern out of her hands before it falls, and holds it for her. She doesn't say anything. She doesn't have to.", effects: ['rel ilyra affection 3'] },
      ],
      options: MOB_SEE,
    },
    fear_win: {
      speaker: 'dm',
      text: "You say it quietly. That's what does it. The zealots on the rope look at you, and at each other, and at the river beyond the square; and the river, brown and fast and very cold, looks back. One lets go. Then they all do. The crowd breaks up around the edges first, like ice. “The river is patient,” Sollace says, without any fear in her at all, and steps down from the well.",
      effects: ['set a1_mob dispersed', 'complete a1a_mob dispersed', 'add a1a_resolved 1', 'rep dawn -5'],
      options: MOB_SEE,
    },
    res_win: {
      speaker: 'dm',
      text: "You let the Heart's hum rise in you and push it outward, into the stones — and the square remembers. For a breath every person in it sees the river steps as they were twenty years ago, in the rain: a boy with violet eyes going down them in a ring of white sashes, the same song, the same gentle voice, the water closing. Then a different year: a woman carrying her own son down the same steps, and coming back up alone. The vision goes out like a snuffed wick. Nobody is singing. Somebody is being sick. The rope is lying on the cobbles, and nobody is holding it.",
      effects: ['set a1_mob dispersed', 'complete a1a_mob dispersed', 'add a1a_resolved 1', 'rep dawn -5', 'rep unbound 2'],
      interjections: [
        { who: 'varek', text: "Varek is staring at you. “That was me,” he says. “On the steps. You showed them me.” He doesn't sound angry. He sounds like someone who has just been handed something heavy he's been carrying alone for twenty years.", effects: ['rel varek trust 4', 'memory varek 2 You showed the Washing crowd what the river did to me.'] },
        { who: 'seris', text: "Seris turns away. “That,” she says, “was a forbidden thing. And it was true. I do not know what to do with both.”" },
      ],
      options: MOB_SEE,
    },
    bought: {
      speaker: 'a1a_sollace',
      text: "She looks at the coin for a long moment. “The Lights accept penance in many forms,” she says, and you can't tell whether she's ashamed or simply tired. She takes it. “For the kitchens. Every copper. You may watch me count it into the box, if you doubt.” She lifts her lantern. “Release him. The river is patient.” The rope goes slack. The crowd drifts away, mostly toward the chapel — to the soup line, you realise, where your gold has just become dinner.",
      effects: ['gold -40', 'set a1_mob bought', 'complete a1a_mob bought', 'add a1a_resolved 1', 'rep dawn 3'],
      interjections: [
        { who: 'varek', text: "Varek watches the coins go into the box with an expression of extraordinary distaste. “You've just told them what a Veilborn costs,” he says. “Next time they'll know the price.”", effects: ['rel varek respect -2'] },
        { who: 'kael', text: "“Forty gold for a life,” Kael murmurs. “Cheapest thing I've seen bought all week. Best, too.”" },
      ],
      options: MOB_SEE,
    },
  },
});

D.push({
  id: 'a1a_mob_after', title: 'After the Washing',
  start: [
    { if: 'a1a_mob_after_done && a1a_mob_varek && !recruited:varek', node: 'varek_again' },
    { if: 'a1a_mob_after_done', node: 'calm' },
    { if: 'a1a_mob_varek && !recruited:varek', node: 'varek' },
    { if: 'a1a_mob_varek', node: 'calm' },
    { node: 'child' },
  ],
  nodes: {
    varek: {
      speaker: 'comp:varek',
      text: [
        { if: 'a1_mob=fought', text: "Varek is sitting on the rim of the well, rubbing the rope-burns on his wrists, watching a Dawnblade being helped away with a broken nose. “You hit a Dawnblade in the face,” he says. “I'll remember that fondly on my deathbed, which — thanks to you — has been postponed.”" },
        { if: 'a1_mob=bought', text: "Varek is sitting on the rim of the well, rubbing the rope-burns on his wrists. “Forty gold,” he says. “I've been insulted by better prices.” He looks at the chapel. “They'll buy rope with it, you know. Eventually.”" },
        { text: "Varek is sitting on the rim of the well, rubbing the rope-burns on his wrists. “Well,” he says. “That was nearly the same afternoon twice.”" },
      ],
      next: 'varek2',
    },
    varek2: {
      speaker: 'comp:varek',
      text: "“Varek Sable. Born four streets that way, with these.” He gestures at his eyes, which have dimmed to an ordinary, unsettling violet. “They walked me down the river steps when I was nine. Same song. The river gave me back. Something else gave me back, too, and I've been paying it ever since.” He stands, brushing ash from his good coat. “And you're the one the bell rang for. The Choir's been loud since Hollowmere. They say you're carrying a door.”",
      options: [
        { text: "Come with us, Varek.", tone: 'friendly', tags: ['protect'], effects: ['recruit varek', 'rel varek trust 3', 'memory varek 2 You pulled me off the river steps in Ashenford and asked me along.'], next: 'varek_joined' },
        { text: "(Insight) You could have broken that rope yourself. Why didn't you?", tone: 'curious', tags: ['curiosity'], once: true, check: { skill: 'insight', dc: 13 }, success: 'varek_why', failure: 'varek_shrug' },
        { text: "Go home, Varek.", tone: 'leave', effects: ['set a1a_mob_after_done'], next: 'varek_no' },
      ],
    },
    varek_why: {
      speaker: 'comp:varek',
      text: "For a moment he looks at you the way people look at a lock someone else has just picked. “There's a choir,” he says, “that would have done it for me. Very happily. Then I'd have owed them a little more of me, and I'm running short.” A thin smile. “I'd rather drown as myself than be saved as theirs. It turns out I'd rather be saved by you than either. Unexpected. I'll be insufferable about it for weeks.”",
      effects: ['rel varek trust 3'],
      options: [
        { text: "Then be insufferable with us. Come.", tone: 'friendly', effects: ['recruit varek', 'rel varek affection 3', 'memory varek 3 You understood why I didn\'t let the Choir save me.'], next: 'varek_joined' },
        { text: "Go home, Varek.", tone: 'leave', effects: ['set a1a_mob_after_done'], next: 'varek_no' },
      ],
    },
    varek_shrug: {
      speaker: 'comp:varek',
      text: "“Stage fright.” He doesn't blink. “I've a terrible fear of audiences. Especially ones holding rope.”",
      options: [
        { text: "Come with us anyway.", tone: 'friendly', effects: ['recruit varek', 'memory varek 1 You pulled me out of the Washing and didn\'t make me explain.'], next: 'varek_joined' },
        { text: "Go home, Varek.", tone: 'leave', effects: ['set a1a_mob_after_done'], next: 'varek_no' },
      ],
    },
    varek_joined: {
      speaker: 'comp:varek',
      text: "“Fine. I'll come.” He says it as if conceding a minor point in a debate. Then, more quietly, looking at the river: “Don't let them walk me down any more steps.”",
      effects: ['set a1a_mob_after_done'],
      options: walkOn(),
    },
    varek_no: {
      speaker: 'comp:varek',
      text: "“Home.” He tastes the word and doesn't like it. “There's a well here I'm going to sit on for a while, to annoy people. If you change your mind, it's the one with the bad memories.”",
      options: walkOn(),
    },
    varek_again: {
      speaker: 'comp:varek',
      text: "Varek is still on the well-rim, sitting there with the dogged air of a man making a political statement. Passers-by in white sashes go the long way round. “Come to haggle?” he asks.",
      options: [
        { text: "Come with us, Varek.", tone: 'friendly', effects: ['recruit varek', 'rel varek trust 2', 'memory varek 1 You came back to the well for me.'], next: 'varek_back' },
        { text: "Just passing.", tone: 'leave', end: true },
      ],
    },
    varek_back: {
      speaker: 'comp:varek',
      text: "He gets up off the well as if it has personally disappointed him. “Good. My statement was getting cold.”",
      end: true,
    },
    child: {
      speaker: 'dm',
      text: [
        { if: 'a1_mob=fought', text: "Jory's mother has him wrapped in her shawl and is checking every inch of him for damage, as if he were glass. The boy lets her. Over her shoulder, his violet eyes find you and stay. “You hit them,” he says. Not accusing. Recording." },
        { text: "Jory's mother has him wrapped in her shawl and is checking every inch of him for damage, as if he were glass. The boy lets her. Over her shoulder, his violet eyes find you and stay. “Elin Mardle,” the mother says, without letting go. “And this is Jory. And we can't stay in Ashenford. Can we.” It isn't a question." },
      ],
      interjections: [
        { who: 'varek', text: "Varek crouches in front of the boy, which brings his eyes level with Jory's: violet to violet. “Here's the trick,” he says, very quietly. “Look them in the eye. Always. It frightens them more than the glow.” He presses something into the boy's hand — a marble of violet glass. “Ashenford made. Like us.”", effects: ['rel varek affection 4', 'memory varek 2 There was a boy at the river steps in Ashenford. We were in time, this time.'] },
      ],
      options: [
        { text: "There are people in the Low Quarter who hide people like Jory. Ask the cooper whether he mends old casks.", if: 'a1a_cooper_known || a1_safehouse=allied', tone: 'compassionate', tags: ['protect', 'defiance'], effects: ['set a1a_jory_hidden', 'rep unbound 2'], next: 'child_end' },
        { text: "Take him to the Hospice of the Returned. Sister Odile will keep the door shut.", tone: 'compassionate', tags: ['protect', 'faith'], effects: ['set a1a_jory_hospice'], next: 'child_end' },
        { text: "Here. Take the morning barge downriver. (10 gold)", if: 'gold>=10', tone: 'compassionate', tags: ['charity'], effects: ['gold -10', 'set a1a_jory_barge'], next: 'child_end' },
        { text: "You'll have to find your own way. I'm sorry.", tone: 'pragmatic', tags: ['pragmatic'], next: 'child_end' },
      ],
    },
    child_end: {
      speaker: 'dm',
      text: "Elin takes Jory's hand, and he goes with her; but at the corner he turns and looks back at the well, and the river steps beyond it, and then at you, and you have the strong feeling that in some ledger only he keeps, your name has just been written in.",
      effects: ['set a1a_mob_after_done', 'xp 25'],
      options: walkOn(),
    },
    calm: {
      speaker: 'dm',
      text: "The square has gone back to its business: barrows, pigeons, a tax-man counting crates. Only the old well is different — nobody walks close to it now, and someone has left a single violet bead on its rim.",
      end: true,
    },
  },
});

// ───────────────────────────────────────────────────────────── the glassworks (a1a_glassworks; Nima)

const RECONCILED = ['set a1_glassworks reconciled', 'complete a1a_glassworks reconciled', 'add a1a_resolved 1', 'give a1a_emberglass_lens', 'rel nima trust 5', 'rel nima affection 5', 'memory nima 3 My father and I stood at the same kiln, and neither of us flinched.'];
const ESTRANGED = ['set a1_glassworks estranged', 'complete a1a_glassworks estranged', 'add a1a_resolved 1', 'rel nima trust 2', 'memory nima -1 I walked out of my father\'s glassworks again. You were there.'];

D.push({
  id: 'a1a_glassworks', title: 'The Emberglass Glassworks',
  start: [
    { if: 'a1_glassworks && !recruited:nima', node: 'nima_again' },
    { if: 'a1_glassworks', node: 'after' },
    { if: 'comp:nima', node: 'start_nima' },
    { if: '!recruited:nima', node: 'start_meet' },
    { node: 'start_absent' },
  ],
  nodes: {
    start_meet: {
      speaker: 'dm',
      text: "Half of the Emberglass glassworks is still roofless, its beams charred black, its yard paved with slag that ran like water once and froze in ripples. One chimney breathes orange. Across the lane from the door, a half-elf woman in a scorched leather coat stands with her hands jammed in her armpits, staring at it — and now and then a spark leaps off her fingertips and dies on the cobbles. A glazier's boy going past says, not unkindly, “She's been stood there since dawn.”",
      effects: ['quest a1a_glassworks kiln'],
      next: 'meet2',
    },
    meet2: {
      speaker: 'comp:nima',
      text: "She sees you looking and her chin comes up. “What? It's a free lane.” Then, all at once, deflating: “Sorry. Nima. Nima Emberglass. That's — that's my name on the sign, that's my dad in there, and that's the roof I burned off four years ago.” A spark jumps; she shakes it off like water. “You've got the look of people who walk into things. Walk into that with me? I can't make my feet do it on their own.”",
      options: [
        { text: "Let's go in together.", tone: 'friendly', tags: ['protect'], effects: ['set a1a_nima_met', 'rel nima trust 2'], next: 'enter' },
        { text: "Why do you need strangers for this?", tone: 'curious', once: true, next: 'meet_why' },
        { text: "This isn't our business.", tone: 'leave', end: true },
      ],
    },
    meet_why: {
      speaker: 'comp:nima',
      text: "“Because if it's just me, and it goes wrong —” She opens her hand. A little white-gold flame stands up on her palm like a curious animal. “It went wrong the last time I was angry in that building. My magic woke up in a Veil flicker and took the roof with it. Took more than the roof.” The flame goes out. “Strangers make me polite. Polite doesn't burn things.”",
      options: [
        { text: "Then let's be strangers together. Lead on.", tone: 'friendly', tags: ['protect', 'mercy'], effects: ['set a1a_nima_met', 'rel nima affection 2'], next: 'enter' },
        { text: "This isn't our business.", tone: 'leave', end: true },
      ],
    },
    start_nima: {
      speaker: 'dm',
      text: "Half of the Emberglass glassworks is still roofless, its beams charred black, its yard paved with slag that ran like water once and froze in ripples. One chimney breathes orange. Nima stops in the lane as if she has walked into a wall.",
      effects: ['quest a1a_glassworks kiln'],
      next: 'nima_lane',
    },
    nima_lane: {
      speaker: 'comp:nima',
      text: [
        { if: 'cq_nima_outcome=flared', text: "“I keep seeing it,” she says. “Ever since the vault. Glass people, walking out of the fire, the way they did that night.” Her hands are shaking. A spark falls and she stamps on it. “Right. Right. He's in there. Don't let me run. If I run, sit on me.”" },
        { text: "“That's him,” she says. “That chimney. He's lit the big kiln.” Sparks are coming off her hair. She doesn't seem to notice. “Four years. I wrote him letters. I burned them. Seemed fitting.” She takes a breath that doesn't go all the way down. “Don't let me run. If I run, sit on me.”" },
      ],
      next: 'enter',
    },
    enter: {
      speaker: 'dm',
      text: "Inside, the heat hits you like a hand. The surviving half of the glassworks is all orange light and moving shadow: racks of cooling glass that ring faintly when the door opens, a bench scarred by forty years of tools, a long iron pipe in the hands of a broad grey-bearded man at the gather-hole. His left arm, bare to the shoulder, and the left side of his face are a map of old burns, shiny and pulled tight. He turns with a gather of molten glass glowing on the end of the pipe. He sees Nima. The glass on the pipe sags, slowly, and drips on the floor, and he doesn't notice.",
      next: 'bram1',
    },
    bram1: {
      speaker: 'a1a_bram',
      text: "“You've let the heat out,” Bram Emberglass says at last. His voice is rough as pumice. “Shut the door.” Nobody moves. He sets the pipe down very carefully in its rest. “Four years. Not a letter. Not a word. I asked every bargeman on the Sillow if they'd seen a half-elf girl with her hair on fire.” A long breath. “Well. You're here. Say what you came to say, or help me with the annealing, one or the other.”",
      interjections: [
        { who: 'brakka', text: "Brakka, behind you, very quietly: “Gruff's how dwarves say ‘I missed you.’ Seems it's how glaziers say it too.”" },
        { who: 'tessa', text: "Tessa has stopped humming. Tessa never stops humming." },
      ],
      next: 'nima1',
    },
    nima1: {
      speaker: 'comp:nima',
      text: "“I wrote,” Nima says. “I burned them.” Her voice wobbles and she hates it; you can see her hating it. “Every time I tried, the paper caught. Seemed fitting.” She looks at you, and you understand you are being asked for something — a hand, a word, a push.",
      decision: true,
      options: [
        { text: "(Insight) Read Bram. What isn't he saying?", tone: 'curious', tags: ['curiosity', 'mercy'], once: true, check: { skill: 'insight', dc: 13 }, successEffects: ['set a1a_bram_read'], success: 'insight', failure: 'insight_f' },
        { text: "Tell him what happened that night, Nima. All of it.", tone: 'compassionate', tags: ['honesty'], next: 'truth',
          voices: { ilyra: "“Let her tell it. Things that are spoken can be forgiven. Things that are not just sit there and grow.”" } },
        { text: "Show him your fire is yours now. Light the cold kiln.", tone: 'friendly', tags: ['boldness', 'forbidden'], next: 'kiln_try',
          voices: { vaelis: "“A demonstration. Yes. Theory is for people with time; she should show him.”", orren: "“Not if she's not steady. Fire doesn't forgive being asked twice.”" } },
        { text: "This was a mistake. Nima — let's go.", tone: 'leave', tags: ['caution'], next: 'walk_out' },
      ],
    },
    insight: {
      speaker: 'dm',
      text: "It's in his hands: the left one, the burned one, keeps reaching toward her and stopping, the way you'd reach toward a stove you know is hot. It isn't anger. It's shame. Whatever happened the night of the fire, Bram Emberglass thinks he is the one who did something unforgivable.",
      next: 'nima1b',
    },
    insight_f: {
      speaker: 'dm',
      text: "He is a closed door with a fire behind it. You can feel the heat, but not what's burning.",
      next: 'nima1b',
    },
    nima1b: {
      speaker: 'comp:nima',
      text: "Nima is still waiting for you.",
      options: [
        { text: "Tell him what happened that night, Nima. All of it.", tone: 'compassionate', tags: ['honesty'], next: 'truth' },
        { text: "Show him your fire is yours now. Light the cold kiln.", tone: 'friendly', tags: ['boldness', 'forbidden'], next: 'kiln_try' },
        { text: "This was a mistake. Nima — let's go.", tone: 'leave', tags: ['caution'], next: 'walk_out' },
      ],
    },
    truth: {
      speaker: 'comp:nima',
      text: "It comes out of her in a rush, hot, unpolished. The flicker — the air going wrong, white fire coming out of her hands like it had been waiting there her whole life. The roof going. Him coming through the smoke for her. “And I reached for you,” she says, “and you — I saw your arm catch, Da, I saw it, and I couldn't make it stop, I couldn't make it stop, so I ran. Because if I stayed I'd do it again.”",
      next: 'bram_truth',
    },
    bram_truth: {
      speaker: 'a1a_bram',
      text: [
        { if: 'a1a_bram_read', text: "Bram looks at his burned arm as if seeing it for the first time. “This?” he says. “You think I'm angry about this?” He laughs, and it's an awful sound, half a sob. “Girl, I flinched. You reached for me and I flinched. That's what you took with you, isn't it — not the fire. Me, stepping back. I've had four years to remember my own face doing it.”" },
        { text: "Bram looks at his burned arm as if seeing it for the first time. “This?” he says. “This is a glazier's arm. Every glazier on the Sillow has an arm like this, from somewhere. The Wildfire took half this town eight hundred years ago and we built it back with the same kilns.” His voice drops. “That's not what you're running from. You reached for me, and I flinched. I've had four years to remember my own face doing it.”" },
      ],
      options: [
        { text: "(Persuasion) Then don't flinch now, Bram. She's right there.", tone: 'compassionate', tags: ['mercy', 'diplomacy'], check: { skill: 'persuasion', dc: 13, advIf: 'a1a_bram_read' }, success: 'reconcile', failure: 'stuck' },
        { text: "Nima — show him. Light the kiln.", tone: 'friendly', tags: ['boldness'], next: 'kiln_try' },
        { text: "Some things don't mend. Come on, Nima.", tone: 'pragmatic', tags: ['caution'], next: 'walk_out' },
      ],
    },
    stuck: {
      speaker: 'dm',
      text: "The words land, and you watch them not quite take — like glass that cools too fast and crazes. Bram looks at the floor. Nima looks at the door. Somebody has to do something.",
      options: [
        { text: "Nima — show him. Light the kiln.", tone: 'friendly', tags: ['boldness'], next: 'kiln_try' },
        { text: "Come on, Nima. We tried.", tone: 'pragmatic', tags: ['caution'], next: 'walk_out' },
      ],
    },
    kiln_try: {
      speaker: 'dm',
      text: "The second kiln, the big one, has stood cold since the fire. Nima walks to its mouth like someone walking out onto ice. She holds out her hands. Bram goes very still.",
      options: [
        { text: "(Arcana) Talk her through it — breath, pattern, a fire with edges.", tone: 'friendly', tags: ['knowledge', 'protect'], check: { skill: 'arcana', dc: 14, advIf: 'cq_nima_outcome=contained || cq_nima_outcome=spoke || comp:vaelis' }, success: 'kiln_ok', failure: 'kiln_bad' },
      ],
    },
    kiln_ok: {
      speaker: 'dm',
      text: "White-gold fire curls out of her palms into the dark mouth of the kiln — and stays there. It doesn't leap. It doesn't roar. It sits in the firebox like a cat settling, and the old bricks tick and sigh as the heat goes into them for the first time in four years. Bram Emberglass walks up beside his daughter and holds his burned hand out to the warmth, close, closer, and doesn't step back. “Steady,” he says. “Steady as your mother's.”",
      next: 'reconcile',
    },
    kiln_bad: {
      speaker: 'dm',
      text: "The fire comes out of her too fast — a white flare that fills the kiln-mouth and licks out of it, and every piece of cooling glass on every rack in the room sings at once, a high terrible chord, and three goblets crack. Bram steps back. It's only half a step. Nima sees it. Her hands drop. The fire goes out like a slap.",
      options: [
        { text: "(Persuasion) Bram. Look at her, not the fire. She stopped it. She stopped it this time.", tone: 'compassionate', tags: ['mercy', 'protect'], check: { skill: 'persuasion', dc: 15, advIf: 'a1a_bram_read' }, success: 'reconcile_hard', failure: 'estrange' },
        { text: "Say nothing. Let them find it themselves.", tone: 'pragmatic', tags: ['caution'], next: 'estrange' },
      ],
    },
    reconcile_hard: {
      speaker: 'a1a_bram',
      text: "Bram looks at the cracked goblets. Then at his daughter's hands, which are shaking, and empty, and not burning anything. “Aye,” he says slowly. “Aye. You did.” And he steps forward again — the half-step back, and then another — and puts his scarred arm round her shoulders, and holds on.",
      next: 'reconcile',
    },
    reconcile: {
      speaker: 'a1a_bram',
      text: "He doesn't let go for a long time. When he does, he goes to a shelf at the back, behind the good glass, and brings down something wrapped in a rag: a disc of amber glass on a fine chain, perfect, without a single bubble. “Made it the year you left,” he says gruffly. “Couldn't sell it. Couldn't look at it either.” He puts it in your hand, not hers. “She'll lose it. You won't. Keep it where she can borrow it.”",
      effects: RECONCILED,
      interjections: [
        { who: 'vaelis', text: "Vaelis clears his throat with great care and becomes extremely interested in the annealing ovens." },
        { who: 'kael', text: "Kael looks away, out of the window, for longer than the view deserves." },
      ],
      next: 'nima_end',
    },
    estrange: {
      speaker: 'comp:nima',
      text: "“Right,” Nima says. “Right. Of course.” She is already at the door. “You're right to. You're right to step back, Da. That's the clever thing.” The door bangs. Bram stands at the cold kiln with his hand still half raised, and says nothing at all, and then picks up his pipe and goes back to the gather-hole, because there is always glass that needs working.",
      effects: ESTRANGED,
      next: 'nima_end',
    },
    walk_out: {
      speaker: 'comp:nima',
      text: "Nima nods too quickly. “Yeah. Yeah, you're right. This was stupid.” She doesn't look at her father. Bram doesn't look at her. The door bangs behind you, and through it you hear, faintly, the ring of a glassblower's pipe set down too hard.",
      effects: ESTRANGED,
      next: 'nima_end',
    },
    nima_end: {
      speaker: 'dm',
      text: "Out in the lane, the kiln-smoke hangs low. Nima stands beside you, not quite looking at the glassworks.",
      options: [
        { text: "Talk to Nima.", if: '!recruited:nima', next: 'nima_join' },
        { text: "Talk to Nima.", if: 'comp:nima && a1_glassworks=reconciled', next: 'nima_rec' },
        { text: "Talk to Nima.", if: 'comp:nima && a1_glassworks=estranged', next: 'nima_est' },
      ],
    },
    nima_rec: {
      speaker: 'comp:nima',
      text: "“He kept it,” she says. “Four years.” She bumps your shoulder with hers, hard, like a younger sister. “I'm not crying. It's the kiln-smoke. Glassmakers' eyes always run. Don't tell anyone, especially Vaelis.”",
      options: walkOn(),
    },
    nima_est: {
      speaker: 'comp:nima',
      text: "“Don't,” she says, before you can say anything. Sparks are crawling up her sleeves. “I mean it. Not now. Maybe not ever.” A long breath. “He's still got the kiln lit. That's something. Isn't it? That's something.”",
      options: walkOn(),
    },
    nima_join: {
      speaker: 'comp:nima',
      text: [
        { if: 'a1_glassworks=reconciled', text: "“So.” Nima wipes her eyes with a scorched sleeve and pretends it's smoke. “He's going to make me write. Every week. He made me promise on the kiln.” She looks at you sideways. “You're the ones from Hollowmere. The bell. I felt that bell from forty miles off — my fire stood straight up like a dog's hackles. Wherever you're going, it's going to be loud. Can I come? I'll be useful. I'm almost never on fire by accident any more.”" },
        { text: "Nima kicks a lump of slag across the lane. “Well. That went exactly as well as last time, only with an audience.” She shoves her hands back in her armpits. “You're the ones from Hollowmere. The bell. I felt it from forty miles off — my fire stood straight up like a dog's hackles. I can't stay here. Can I come with you? I'll be useful. I'm almost never on fire by accident any more.”" },
      ],
      options: [
        { text: "Welcome aboard, Nima.", tone: 'friendly', tags: ['boldness'], effects: ['recruit nima', 'rel nima affection 2', 'memory nima 2 You walked into my father\'s glassworks with me, and then you let me come along.'], next: 'nima_joined' },
        { text: "Stay with your father a while.", tone: 'leave', next: 'nima_stay' },
      ],
    },
    nima_joined: {
      speaker: 'comp:nima',
      text: "“Yes!” A little fountain of sparks goes up from her hair. She pats it out. “Sorry. Happy sparks. They're harmless. Mostly harmless. Let's go before I change my mind about being sensible.”",
      options: walkOn(),
    },
    nima_stay: {
      speaker: 'comp:nima',
      text: "“Maybe.” She looks at the chimney. “I'll be here a day or two. On the doorstep, probably, working up to it. If you change your mind, you know where the fire is.”",
      options: walkOn(),
    },
    nima_again: {
      speaker: 'comp:nima',
      text: "Nima is sitting on the glassworks step, turning a cooling bead of glass over and over in her bare fingers. “Back again?” she says. “Is that an offer, or are you here for the glass?”",
      options: [
        { text: "It's an offer. Come with us.", tone: 'friendly', effects: ['recruit nima', 'memory nima 1 You came back to the glassworks for me.'], next: 'nima_back' },
        { text: "Just passing.", tone: 'leave', end: true },
      ],
    },
    nima_back: {
      speaker: 'comp:nima',
      text: "She leaps up. “Da! I'm going!” From inside, gruffly: “Write!” She grins. “He means it. He's going to count.”",
      end: true,
    },
    start_absent: {
      speaker: 'dm',
      text: "Half of the Emberglass glassworks is still roofless, its beams charred black, its yard paved with slag that ran like water once and froze in ripples. In the surviving half, a broad grey-bearded man with a burned arm is working a gather of molten glass at the end of a long pipe. He doesn't stop when you come in. Glass doesn't wait.",
      effects: ['quest a1a_glassworks kiln'],
      next: 'absent_bram',
    },
    absent_bram: {
      speaker: 'a1a_bram',
      text: "“Bram Emberglass.” He turns the pipe, slow, steady. “And you've the look of people who've met my daughter. Half-elf. Hair that won't lie down. Sets things alight when she's cross.” He doesn't look at you; he looks at the glass. “Is she well?”",
      options: [
        { text: "She's well. She's travelling with us — not here today.", tone: 'friendly', tags: ['honesty'], next: 'absent_end' },
        { text: "I'll bring her here.", tone: 'friendly', end: true },
      ],
    },
    absent_end: {
      speaker: 'a1a_bram',
      text: "He nods, once. The glass on the pipe swells into a perfect bubble. “Tell her the kiln's still lit,” he says. “Tell her the big one, too, if she ever wants it. Don't tell her I asked.” He goes back to his work. After a moment you realise the conversation is over, and that it is the most he has said to a stranger in four years.",
      effects: ['set a1_glassworks absent', 'complete a1a_glassworks absent', 'add a1a_resolved 1'],
      options: walkOn(),
    },
    after: {
      speaker: 'a1a_bram',
      text: [
        { if: 'a1_glassworks=reconciled', text: "Bram nods to you over the gather-hole. Both kilns are lit. “She writes,” he says, as if that settles everything, and goes back to work." },
        { text: "Bram is at the gather-hole. He doesn't look up. The big kiln is cold." },
      ],
      end: true,
    },
  },
});

// ───────────────────────────────────────────────────────────── the Kiln & Kettle (Tessa)

const INN_STAND: DialogueOption[] = [
  { text: "(History) That song's older than the Covenant, Lieutenant. You can't arrest a song with no origin.", tone: 'curious', tags: ['knowledge'], once: true, check: { skill: 'history', dc: 13 }, success: 'shield_history', failure: 'inn_fail' },
  { text: "(Persuasion) Arrest her, and every glassblower in this room sings it under your window tonight.", tone: 'diplomatic', tags: ['diplomacy', 'defiance'], once: true, check: { skill: 'persuasion', dc: 14 }, success: 'shield_talk', failure: 'inn_fail' },
  { text: "(Performance) Climb up beside the singer and change the words — make it a toast to the Lord-Marshal.", tone: 'friendly', tags: ['humor', 'boldness'], once: true, check: { skill: 'performance', dc: 14, advIf: 'comp:tessa' }, success: 'shield_song', failure: 'inn_fail' },
  { text: "Pay the fine. (25 gold)", if: 'gold>=25', lockedText: 'You need 25 gold.', tone: 'pragmatic', tags: ['pragmatic'], effects: ['gold -25'], next: 'shield_paid' },
  { text: "Lieutenant, you're going to have to go through us.", tone: 'aggressive', tags: ['violence', 'protect', 'defiance'], effects: ['combat a1a_enc_inn'] },
  { text: "Take them. It's not our quarrel.", tone: 'pragmatic', tags: ['authority', 'caution'], next: 'taken' },
];

const INN_SHIELD = ['set a1a_inn_done', 'rep covenant -2', 'xp 50'];

D.push({
  id: 'a1a_inn', title: 'The Kiln & Kettle',
  start: [
    { if: 'a1a_inn_lost && !a1a_inn_done', node: 'lost' },
    { if: 'a1a_inn_done && !recruited:tessa && !a1a_tessa_jailed && !a1a_tessa_declined && a1a_inn_target_tessa', node: 'tessa_join' },
    { if: 'a1a_inn_done', node: 'after' },
    { if: 'a1a_tessa_jailed', node: 'jailed' },
    { if: '!recruited:tessa', node: 'start_tessa' },
    { node: 'start_pip' },
  ],
  nodes: {
    start_tessa: {
      speaker: 'dm',
      text: "The Kiln & Kettle is low-beamed and roaring, built round a hearth of kiln-brick with a copper kettle the size of a barrel steaming on it. Glassblowers off shift, bargemen, two tax clerks pretending not to be. On a table in the middle of it all stands a gnome with a lute, conducting the whole room with her chin through the chorus of something that is clearly, joyously rude: “And the tithe-man counts the stars, my love, and charges for the dark —” Then the door bangs open, and the singing dies in thirty throats at once.",
      effects: ['set a1a_inn_target_tessa'],
      next: 'rusk_tessa',
    },
    rusk_tessa: {
      speaker: 'a1a_rusk',
      text: "A young lieutenant in a polished breastplate, two soldiers behind him, reads from a card. “Tessa Quickthorn. By the Ordinance of Testimony, section four, you are detained for the public performance of seditious material.” The gnome on the table looks down at him with enormous interest. “Section four? I'm flattered,” says Tessa. “Most people don't read past three.”",
      interjections: [
        { who: 'kael', text: "Kael, out of the side of his mouth: “I like her. I'd like her more if she weren't about to get us all arrested.”" },
      ],
      decision: true,
      options: INN_STAND,
    },
    start_pip: {
      speaker: 'dm',
      text: "The Kiln & Kettle is low-beamed and roaring, built round a hearth of kiln-brick with a copper kettle the size of a barrel steaming on it. On a table in the middle, a gangly boy with a fiddle is leading the room through the chorus of something clearly, joyously rude: “And the tithe-man counts the stars, my love, and charges for the dark —” Then the door bangs open and the singing dies in thirty throats at once.",
      interjections: [
        { who: 'tessa', text: "Tessa has gone pink to the ears. “That's mine,” she whispers. “The third verse. I wrote that in this room three years ago, on that table, on a dare. He's got the scansion wrong on ‘dark’.”" },
      ],
      next: 'rusk_pip',
    },
    rusk_pip: {
      speaker: 'a1a_rusk',
      text: "A young lieutenant in a polished breastplate, two soldiers behind him, reads from a card. “Pip Calder. By the Ordinance of Testimony, section four, you are detained for the public performance of seditious material.” The boy goes white. Behind the bar, a huge soot-cheeked woman puts down a tankard very slowly. “That's my son,” says Wynn Calder. “He's fifteen.” “Section four doesn't specify an age, madam,” says Lieutenant Rusk, reading.",
      interjections: [
        { who: 'tessa', text: "“Oh, for —” Tessa is already climbing onto a bench. “Let me. Please. It's my verse. If anyone's getting arrested for it, I'd like the credit.”", effects: ['rel tessa trust 1'] },
      ],
      decision: true,
      options: INN_STAND,
    },
    inn_fail: {
      speaker: 'a1a_rusk',
      text: "Rusk turns his card over, finds nothing useful on the back, and turns it over again. “Be that as it may,” he says, which is clearly the phrase they give lieutenants for exactly this moment. The soldiers step forward.",
      options: INN_STAND.slice(3),
    },
    shield_history: {
      speaker: 'dm',
      text: "You give the room the tune's pedigree: sung on the Sillow barges before the Covenant was a word, written down in a Charter-era songbook under ‘Air, origin unknown,’ half-known in every tavern from here to the Shattered Isles. The ordinance covers new testimony, not old songs. Rusk checks his card. It does not say anything about old songs. He looks, for a moment, about fifteen himself. “Carry on,” he says, “but quieter,” and leaves to the loudest silence you've ever heard.",
      effects: INN_SHIELD,
      next: 'shielded',
    },
    shield_talk: {
      speaker: 'dm',
      text: "You don't argue with Rusk; you just gesture, gently, at the room. Thirty glassblowers with forearms like hams look back at him, tankards in hand, not singing — yet. Rusk is young, but he isn't stupid. He folds his card into his breastplate. “A warning,” he says loudly. “This is a warning.” The door closes behind him. The room erupts.",
      effects: INN_SHIELD,
      next: 'shielded',
    },
    shield_song: {
      speaker: 'dm',
      text: "You climb up beside the singer and take the chorus away from them — same tune, new words: a toast to the Lord-Marshal, to her roads and her granaries and her iron-grey tax-men, sung so sweetly and so very, very sincerely that by the second line the whole room has caught on and is roaring it back at the lieutenant with tankards raised. Rusk cannot arrest a toast to the Lord-Marshal. He tries to think of a way. He cannot. He salutes, scarlet, and goes.",
      effects: INN_SHIELD,
      interjections: [
        { who: 'tessa', text: "Tessa is laughing so hard she has to hold onto the beam. “That,” she says, “was criminally good. I'm stealing it. I steal everything good; it's my only virtue.”", effects: ['rel tessa affection 3'] },
      ],
      next: 'shielded',
    },
    shield_paid: {
      speaker: 'a1a_rusk',
      text: "Rusk accepts the coin, writes a receipt with great care, and reads it back to you. “Fine paid. Matter closed.” He hesitates at the door. “It is a very catchy song,” he says, apparently to the doorframe, and goes.",
      effects: ['set a1a_inn_done', 'xp 25'],
      next: 'shielded',
    },
    shielded: {
      speaker: 'dm',
      text: "The Kiln & Kettle exhales. Somebody starts the chorus again, softly, and then not softly at all. Wynn Calder sets a round on the house down in front of you with a crash that says more than thanks.",
      options: [
        { text: "Talk to the gnome.", if: 'a1a_inn_target_tessa && !recruited:tessa', next: 'tessa_join' },
        { text: "Drink your round.", if: '!a1a_inn_target_tessa || recruited:tessa', next: 'pip_end' },
      ],
    },
    pip_end: {
      speaker: 'a1a_calder',
      text: "“Pip,” Wynn Calder says to her son, very calmly, “go and wash every tankard in the cellar, and while you do it, think about the word ‘quieter.’” The boy goes, grinning. Wynn turns to you. “You've a bed here, any night, for nothing. Don't argue. I've an arm like a kiln-door.”",
      interjections: [
        { who: 'tessa', text: "Tessa catches Pip at the cellar stairs and fixes the scansion on ‘dark’ for him, very fast, with her hands. He goes down the stairs humming it right.", effects: ['memory tessa 1 Someone in Ashenford still sings my verse. Wrong, but loudly.'] },
      ],
      end: true,
    },
    taken: {
      speaker: 'dm',
      text: [
        { if: 'a1a_inn_target_tessa', text: "The soldiers lift Tessa off the table, lute and all. She doesn't struggle. As they carry her past you she says, quite pleasantly, “Right. Noted,” and then, to the room: “Somebody finish the chorus for me,” and somebody does, softly, as the door closes." },
        { text: "The soldiers march Pip out between them. Wynn Calder watches them go and then looks at you for a long, long moment before she goes back to wiping the bar. Nobody finishes the chorus." },
      ],
      effects: ['set a1a_inn_done', 'rep covenant 2'],
      next: 'taken2',
    },
    taken2: {
      speaker: 'dm',
      text: [
        { if: 'a1a_inn_target_tessa', text: "Her lute lies on the table where she left it. Wynn Calder puts it behind the bar, carefully, for later. “Garrison cells,” she says, not to you. “Forty gold bail, usually. Dray's fair, for a Covenant.”" },
        { text: "“He'll get a night in the cells and a fine,” Wynn says to the bar. “He's fifteen. He'll be a hero to every apprentice on the Sillow by morning.” She doesn't sound comforted." },
      ],
      effects: ['set a1a_tessa_jailed'],
      end: true,
    },
    lost: {
      speaker: 'dm',
      text: [
        { if: 'a1a_inn_target_tessa', text: "You come round with Wynn Calder holding a wet cloth to your head and the Kiln & Kettle's furniture in a ring of splinters around you. The soldiers are gone. So is Tessa. “Garrison cells,” says Wynn. “Forty gold bail, usually. You put up a fight, I'll give you that. You'll want to sit up slowly.”" },
        { text: "You come round with Wynn Calder holding a wet cloth to your head and the Kiln & Kettle's furniture in a ring of splinters around you. “They took him,” she says. “A night in the cells and a fine. You tried. That counts for something in my house.”" },
      ],
      effects: ['set a1a_inn_done', 'set a1a_tessa_jailed'],
      end: true,
    },
    jailed: {
      speaker: 'a1a_calder',
      text: "Wynn Calder nods at the lute behind the bar. “Still in the garrison cells, your gnome. Forty gold bail. Dray's fair, for a Covenant.”",
      end: true,
    },
    tessa_join: {
      speaker: 'comp:tessa',
      text: [
        { if: 'a1a_inn_fought', text: "Tessa sits on the edge of the table, swinging her feet over the wreckage of three chairs and a lieutenant's dignity. “Well!” she says. “I've been rescued by people before. Never with quite so much furniture.” She offers a small hand. “Tessa Quickthorn, of the Quickthorn Wandering Company, which has disbanded, don't ask. I collect songs with no origin — tunes everyone half-knows and nobody wrote. And you're the ones from Hollowmere. The bell.”" },
        { text: "Tessa hops down from the table and offers you a small, calloused hand. “Tessa Quickthorn, of the Quickthorn Wandering Company, which has disbanded, don't ask. Thank you. I mean it, and I say lots of things I don't mean, professionally, so do notice the difference.” She tilts her head. “You're the ones from Hollowmere, aren't you? The bell.”" },
      ],
      next: 'tessa_join2',
    },
    tessa_join2: {
      speaker: 'comp:tessa',
      text: "“I was booked to play that festival. Something rang there that night, something old, and I've been chasing its tune ever since.” She plucks a string; it hums like a bell a long way off. “You need a bard. You have the look of people who are about to need a song written about them — and it had better be written by somebody who was there.”",
      options: [
        { text: "Welcome aboard, Tessa.", tone: 'friendly', tags: ['humor'], effects: ['recruit tessa', 'rel tessa affection 3', 'memory tessa 2 You stood between me and the Covenant at the Kiln & Kettle.'], next: 'tessa_joined' },
        { text: "(Insight) Your company disbanded. Why do you say it like that?", tone: 'curious', tags: ['curiosity'], once: true, check: { skill: 'insight', dc: 15 }, success: 'tessa_company', failure: 'tessa_deflect' },
        { text: "Stay and sing, Tessa. Safely.", tone: 'leave', effects: ['set a1a_tessa_declined'], next: 'tessa_no' },
      ],
    },
    tessa_company: {
      speaker: 'comp:tessa',
      text: "For one heartbeat the performance stops, and you see the person behind it: small, very tired, very alone. Then it's back, bright as a coin. “Like what? Disbanded. People disband. Musicians especially; we're very disbandable.” She doesn't meet your eye. “Ask me again some night when there's a fire and nobody's listening. I might even tell you.”",
      effects: ['set a1a_tessa_company_hint'],
      options: [
        { text: "I will. Come with us.", tone: 'friendly', tags: ['mercy'], effects: ['recruit tessa', 'rel tessa trust 4', 'memory tessa 3 You heard the thing I didn\'t say about my company, and you let me keep it.'], next: 'tessa_joined' },
        { text: "Stay and sing, Tessa. Safely.", tone: 'leave', effects: ['set a1a_tessa_declined'], next: 'tessa_no' },
      ],
    },
    tessa_deflect: {
      speaker: 'comp:tessa',
      text: "“Like a musician, darling. Everything we say sounds like that. It's the training.”",
      options: [
        { text: "Welcome aboard, Tessa.", tone: 'friendly', effects: ['recruit tessa', 'rel tessa affection 2', 'memory tessa 2 You stood between me and the Covenant at the Kiln & Kettle.'], next: 'tessa_joined' },
        { text: "Stay and sing, Tessa. Safely.", tone: 'leave', effects: ['set a1a_tessa_declined'], next: 'tessa_no' },
      ],
    },
    tessa_joined: {
      speaker: 'comp:tessa',
      text: "“Splendid!” She swings her lute onto her back. “I'll start the ballad tonight. Verse one: in which our heroes stand up to a lieutenant with a card. It rhymes with ‘guard’. Everything does, eventually.”",
      end: true,
    },
    tessa_no: {
      speaker: 'comp:tessa',
      text: "“Safely.” She tastes the word like a sour note. “I'll be here, being safe, very loudly. If you change your mind, follow the chorus.”",
      end: true,
    },
    after: {
      speaker: 'a1a_calder',
      text: [
        { if: 'a1a_tessa_declined && !recruited:tessa', text: "Tessa is on the table again, mid-chorus. She sees you and lifts her eyebrows over the lute — an offer, still open. Wynn Calder slides you a tankard. “On the house. Always.”" },
        { text: "Wynn Calder slides you a tankard before you reach the bar. “On the house. Always.” Somewhere by the hearth, someone is humming the tithe-man song, very quietly, which in the Kiln & Kettle counts as a whisper." },
      ],
      options: [
        { text: "Ask Tessa to come with you after all.", if: 'a1a_tessa_declined && !recruited:tessa', tone: 'friendly', effects: ['recruit tessa', 'memory tessa 1 You came back to the Kiln & Kettle for me.'], next: 'tessa_joined' },
        { text: "Drink up and go.", tone: 'leave', end: true },
      ],
    },
  },
});

// ───────────────────────────────────────────────────────────── the Hospice of the Returned (Ilyra)

D.push({
  id: 'a1a_hospice', title: 'The Hospice of the Returned',
  start: [
    { if: 'a1a_hospice_done && !recruited:ilyra', node: 'ilyra_again' },
    { if: 'a1a_hospice_done', node: 'after' },
    { if: '!recruited:ilyra', node: 'start_ilyra' },
    { node: 'start_other' },
  ],
  nodes: {
    start_ilyra: {
      speaker: 'dm',
      text: [
        { if: 'coll_to_ashenford', text: "The hospice was an almshouse once: a long whitewashed room of cots under a ceiling painted with six faded lanterns. The people in the cots came back from death with other lives in their heads. On the bench by the door sits a man who drips steadily onto the boards — Coll Thorn, from Hollowmere's mill-race. He lifts a hand to you. “I found them,” he says. “Brannagh. Posy. Posy whistles.” His smile breaks. “Brannagh doesn't know me. She was very kind about it.” Halfway down the room, a priestess in plain grey is kneeling beside an old man who is screaming." },
        { text: "The hospice was an almshouse once: a long whitewashed room of cots under a ceiling painted with six faded lanterns. The people in the cots came back from death with other lives in their heads — a girl who remembers being somebody's grandmother, a soldier from a war nobody fought. It smells of lye and lavender and, under that, the kilns. Halfway down the room, a priestess in plain grey is kneeling beside an old man who is screaming." },
      ],
      next: 'aldo',
    },
    aldo: {
      speaker: 'a1a_aldo',
      text: "“The kilns!” He has her by the wrist, hard enough to bruise. “Can't you smell them? They're breathing, they're breathing again, the whole valley's going to catch — Mother of Lights, the children are in the drying-sheds —” His eyes are white all round. “What year is it? Tell me the year!”",
      next: 'ilyra1',
    },
    ilyra1: {
      speaker: 'comp:ilyra',
      text: "The priestess doesn't pull her wrist away. “Aldo,” she says, low and steady, as if they had all the time in the world. “Aldo, I'm here. It's 3011. The Wildfire was a long time ago.” To you, without turning her head, in exactly the same calm voice: “He died in the Wildfire of 2210. Eight hundred years ago. He came back last week, smelling of smoke. I'm Ilyra. I could use a second pair of hands, if you have them.”",
      decision: true,
      options: [
        { text: "(Medicine) Help her — slow his breathing, cool cloth, the old remedies.", tone: 'compassionate', tags: ['mercy'], check: { skill: 'medicine', dc: 12 }, success: 'calm_med', failure: 'calm_fail' },
        { text: "(Persuasion) Aldo, look out the window. The town's still here. You built it back — with the same kilns.", tone: 'compassionate', tags: ['mercy', 'diplomacy'], check: { skill: 'persuasion', dc: 13, advIf: 'a1_glassworks=reconciled' }, success: 'calm_word', failure: 'calm_fail' },
        { text: "(Resonance) Let the Heart show him the Wildfire ending.", if: 'res>=1', tone: 'resonance', tags: ['forbidden', 'mercy'], effects: ['res -1'], next: 'calm_res' },
        { text: "Step outside and let her work.", tone: 'pragmatic', tags: ['caution'], next: 'mercy_hint' },
      ],
    },
    calm_med: {
      speaker: 'dm',
      text: "You work together without needing to speak: cool water, a hand flat on his chest to count his breathing down, her voice underneath it all saying the same three things over and over. Slowly the old man's grip loosens. “3011,” he whispers. “Three thousand and eleven.” He starts to laugh, weakly. “I've missed a great deal of rent.”",
      effects: ['set a1a_aldo_calm', 'xp 50'],
      next: 'ilyra2',
    },
    calm_word: {
      speaker: 'dm',
      text: "You pull back the shutter. Ashenford, smoky and alive: barges on the Sillow, glassblowers arguing in the street, a chimney breathing orange. “That's not the Wildfire,” you tell him. “That's Tuesday.” Aldo stares out for a long time. “They kept the kilns,” he says at last, wondering. “The fools. The glorious fools. They kept the kilns.”",
      effects: ['set a1a_aldo_calm', 'xp 50'],
      next: 'ilyra2',
    },
    calm_res: {
      speaker: 'dm',
      text: "You put your hand on his and let the Heart's hum rise, and the old man sees what the stones of Ashenford remember: the Wildfire, yes — and then the rain that came on the third day, and the people walking back down the valley with buckets and barrows, and the first new kiln lit, and the second, and eight hundred years of glass. He weeps. Then he sleeps, like a child after a long day.",
      effects: ['set a1a_aldo_calm', 'xp 50'],
      interjections: [
        { who: 'ilyra', text: "Ilyra watches it with an expression you can't read — wonder, and something like fear. “I have prayed for that,” she says. “For him to see it end. I have never once been answered so plainly.”" },
      ],
      next: 'ilyra2',
    },
    calm_fail: {
      speaker: 'dm',
      text: "It goes wrong: he flinches from your hands, upends the cot, scrambles into the corner with his arms over his head and screams about the drying-sheds. Ilyra goes after him without hurry and kneels in the corner and simply sits there, very close, saying his name, until — a long time later — he stops.",
      next: 'ilyra2',
    },
    mercy_hint: {
      speaker: 'dm',
      text: "You wait outside in the smoke. It's quiet a long while. When Ilyra comes out, she is wiping her hands on her robe. “He asked me for something,” she says. “He's asked before. I didn't give it to him today.” She looks at you directly for the first time. “Thank you for leaving the room. Most people don't think to.”",
      effects: ['set a1a_ilyra_mercy_hint'],
      next: 'ilyra2',
    },
    ilyra2: {
      speaker: 'comp:ilyra',
      text: "“I'm from Solmara. A hospice like this one, bigger and sadder.” She sits back on her heels. “I came out east to light a lantern at Hollowmere for someone I can't name, and found the whole road full of people like Aldo coming back.” She studies you with tired, kind eyes. “And you — forgive me — you hum. The way they do. As if something in you remembers more than one world. I've been asking the Lights where the returned belong. I've had no answer. Perhaps I should ask you.”",
      options: [
        { text: "Come with us and ask properly.", tone: 'friendly', tags: ['faith', 'mercy'], effects: ['recruit ilyra', 'rel ilyra trust 3', 'memory ilyra 2 You knelt with me beside Aldo Fenwright in the Ashenford hospice.'], next: 'ilyra_joined' },
        { text: "Who did you light the lantern for?", tone: 'curious', tags: ['curiosity'], once: true, next: 'tamsin' },
        { text: "Aldo needs you more than we do.", tone: 'leave', effects: ['set a1a_hospice_done'], next: 'ilyra_no' },
      ],
    },
    tamsin: {
      speaker: 'comp:ilyra',
      text: "She smiles, and it hurts to watch. “There's a man in my hospice in Solmara called Tamsin. He came back three years ago. He remembers being my husband. Twelve years married; a house with a blue door; the way I take my tea.” A pause. “I have never married anyone. I do take my tea that way.” She stands, brushing off her robe. “So I light lanterns for people I can't name. It seems the least a priestess can do.”",
      options: [
        { text: "Come with us. Maybe we'll find out where he came from.", tone: 'compassionate', tags: ['mercy'], effects: ['recruit ilyra', 'rel ilyra trust 4', 'rel ilyra affection 2', 'memory ilyra 3 You asked about Tamsin, and you didn\'t look away.'], next: 'ilyra_joined' },
        { text: "Aldo needs you more than we do.", tone: 'leave', effects: ['set a1a_hospice_done'], next: 'ilyra_no' },
      ],
    },
    ilyra_joined: {
      speaker: 'comp:ilyra',
      text: "“Then I'll come.” She goes to Sister Odile at the end of the room and they speak a while in low voices, and the small grey nun nods once, as if granting a dispensation. Ilyra comes back with a satchel and a prayer book with most of its pages marked. “Odile will keep Aldo. She says I'm to bring you back if you start humming any louder.”",
      effects: ['set a1a_hospice_done'],
      end: true,
    },
    ilyra_no: {
      speaker: 'comp:ilyra',
      text: "“He does,” she agrees. “For now.” She goes back to the cot. “I'll be here a while. Come and find me if you need a priestess who doesn't mind the dead.”",
      end: true,
    },
    ilyra_again: {
      speaker: 'comp:ilyra',
      text: "Ilyra looks up from a cot where a girl who remembers being somebody's grandmother is teaching her to knit. “You're back,” she says. “Are you humming louder?”",
      options: [
        { text: "Come with us, Ilyra.", tone: 'friendly', effects: ['recruit ilyra', 'memory ilyra 1 You came back to the hospice for me.'], next: 'ilyra_joined' },
        { text: "Just visiting.", tone: 'leave', end: true },
      ],
    },
    start_other: {
      speaker: 'dm',
      text: [
        { if: 'coll_to_ashenford', text: "The hospice was an almshouse once: a long whitewashed room of cots under a ceiling painted with six faded lanterns. On the bench by the door sits a man who drips steadily onto the boards — Coll Thorn, from Hollowmere's mill-race. “I found them,” he says. “Brannagh. Posy. Posy whistles.” His smile breaks. “Brannagh doesn't know me. She was very kind about it.” Down the room, an old man is screaming about kilns, and a small grey nun is failing to hold him." },
        { text: "The hospice was an almshouse once: a long whitewashed room of cots under a ceiling painted with six faded lanterns. The people in the cots came back from death with other lives in their heads. Down the room, an old man is screaming about kilns, and a small grey nun is failing to hold him." },
      ],
      interjections: [
        { who: 'ilyra', text: "Ilyra is already moving — down the aisle between the cots, unhurried, unbuckling her satchel as she goes. “Coll,” she says in passing, and touches his wet shoulder, and he leans into her hand like a tired horse. Then she kneels by the screaming man as though she had done it a thousand times, because she has.", effects: ['rel ilyra trust 1'] },
      ],
      next: 'odile',
    },
    odile: {
      speaker: 'a1a_odile',
      text: [
        { if: 'comp:ilyra', text: "“You'll be the Solmara priestess,” says Sister Odile, looking at Ilyra. “The one who sits up with them. They talk about you on the coaches.” To you: “Aldo Fenwright. Glassblower. Died in the Wildfire of 2210. Came back last week smelling of smoke. Every time the kilns breathe, he thinks it's happening again.”" },
        { text: "“Aldo Fenwright,” says the nun, breathless, holding on. “Glassblower. Died in the Wildfire of 2210. Came back last week smelling of smoke. Every time the kilns breathe, he thinks it's happening again.” She looks at you, measuring. “Sister Odile. If you're not here to register anyone, you can hold his other arm.”" },
      ],
      options: [
        { text: "(Medicine) Help — slow his breathing, cool cloth, the old remedies.", tone: 'compassionate', tags: ['mercy'], check: { skill: 'medicine', dc: 12, advIf: 'comp:ilyra' }, success: 'other_calm', failure: 'other_fail' },
        { text: "(Persuasion) Aldo, look out the window. The town's still here. They kept the kilns.", tone: 'compassionate', tags: ['mercy', 'diplomacy'], check: { skill: 'persuasion', dc: 13, advIf: 'comp:ilyra || a1_glassworks=reconciled' }, success: 'other_calm', failure: 'other_fail' },
        { text: "(Resonance) Let the Heart show him the Wildfire ending.", if: 'res>=1', tone: 'resonance', tags: ['forbidden', 'mercy'], effects: ['res -1'], next: 'other_calm' },
        { text: "This isn't for us.", tone: 'leave', end: true },
      ],
    },
    other_calm: {
      speaker: 'dm',
      text: "Between you, he quiets. It takes a long time, and then all at once it doesn't: the grip loosens, the breathing slows, the eyes find the painted lanterns on the ceiling and stay there. “Three thousand and eleven,” Aldo whispers. “They kept the kilns. The glorious fools.” He sleeps.",
      effects: ['set a1a_aldo_calm', 'set a1a_hospice_done', 'xp 50'],
      interjections: [
        { who: 'ilyra', text: "Ilyra sits back on her heels and looks at the sleeping man for a long moment. “Eight hundred years,” she says, “and he came back worried about the children in the drying-sheds.” She wipes her eyes, unashamed. “Wherever they come back from, it doesn't take that away. I needed to see that.”", effects: ['rel ilyra affection 3', 'memory ilyra 2 We calmed a man who died in the Wildfire, in the Ashenford hospice.'] },
      ],
      end: true,
    },
    other_fail: {
      speaker: 'dm',
      text: "He tears free and scrambles into the corner with his arms over his head. It's Sister Odile — or Ilyra, if she's with you — who goes after him and simply sits close, saying his name, until he stops. Nobody blames you. That's almost worse.",
      effects: ['set a1a_hospice_done'],
      end: true,
    },
    after: {
      speaker: 'a1a_odile',
      text: [
        { if: 'a1a_aldo_calm', text: "Aldo Fenwright is sitting up in his cot with a lump of cold glass in his hands, turning it to the window. He's explaining to the girl in the next cot how they used to do it, eight hundred years ago. She's pretending not to be interested. Sister Odile nods to you." },
        { text: "Sister Odile nods to you, and goes back to her cots." },
      ],
      end: true,
    },
  },
});

// ───────────────────────────────────────────────────────────── the docks (Brakka)

const DOCKS_DONE = ['set a1a_docks_done', 'set a1a_ostrem_plate', 'xp 50'];

D.push({
  id: 'a1a_docks', title: 'The Sillow Docks',
  start: [
    { if: 'a1a_docks_done && !recruited:brakka', node: 'brakka_again' },
    { if: 'a1a_docks_done', node: 'after' },
    { if: 'a1a_docks_fought', node: 'won' },
    { if: '!recruited:brakka', node: 'start_brakka' },
    { node: 'start_other' },
  ],
  nodes: {
    start_brakka: {
      speaker: 'dm',
      text: "The Sillow runs brown and fast past the docks, thick with barges and the smell of tar. Covenant tally-men count crates with chalk. On the deck of a squat salvage barge called the Lucky Ottoline, a man with a gap-toothed grin has laid out his wares on a tarpaulin — \"GENUINE DWARVEN ANTIQUITIES, FOUR HUNDRED YEARS OLD\" — and is currently being held a foot off his own deck by the collar by a dwarf in scarred plate, who is holding a rune-carved stone plate in her other hand and speaking very, very quietly.",
      next: 'brakka1',
    },
    brakka1: {
      speaker: 'comp:brakka',
      text: "“Four hundred years,” the dwarf says. “Is that right.” She turns the plate so you can see it: a hall-record, rune-cut, weathered smooth by centuries. “Hall Ostrem. The hearth-names of the third landing. Fenrik Oarsson. Ulla Brannsdottir.” Her voice doesn't change at all. “I ate breakfast with Fenrik last spring. He burned the porridge. Four hundred years.” Her thumb moves to a slot near the bottom where a name has been chipped away. “Who did this? Where did you get it?”",
      next: 'oakes1',
    },
    oakes1: {
      speaker: 'a1a_oakes',
      text: "“Salvage!” Gorm Oakes squeaks, feet kicking. “Legal salvage! I've a licence! Ruined hall up in the Iron Mountains, nobody's lived there for centuries, everybody knows it —” He catches sight of you and tries a grin. “Friends of the lady? Tell her. Tell her it's legal.”",
      decision: true,
      options: [
        { text: "(Intimidation) Answer the lady's questions, Gorm. All of them.", tone: 'aggressive', tags: ['boldness', 'protect'], check: { skill: 'intimidation', dc: 13 }, success: 'oakes_talks', failure: 'oakes_whistle' },
        { text: "(Investigation) Let me see that licence of yours.", tone: 'curious', tags: ['curiosity'], check: { skill: 'investigation', dc: 13 }, success: 'manifest', failure: 'oakes_whistle' },
        { text: "We'll buy it. What's your price? (40 gold)", if: 'gold>=40', lockedText: 'You need 40 gold.', tone: 'pragmatic', tags: ['charity', 'pragmatic'], effects: ['gold -40'], next: 'bought' },
        { text: "Put him down. Then we'll talk about it.", tone: 'diplomatic', tags: ['diplomacy', 'caution'], check: { skill: 'persuasion', dc: 14 }, success: 'oakes_talks', failure: 'oakes_whistle' },
      ],
    },
    start_other: {
      speaker: 'dm',
      text: "The Sillow runs brown and fast past the docks, thick with barges and the smell of tar. On the deck of a squat salvage barge called the Lucky Ottoline, a gap-toothed man has laid out his wares on a tarpaulin under a sign: \"GENUINE DWARVEN ANTIQUITIES, FOUR HUNDRED YEARS OLD.\" Rune-cut stone, a dented shield-boss, a child's bronze cup.",
      interjections: [
        { who: 'brakka', text: "Brakka has stopped dead on the quay. Then she is on the barge, and the plate is in her hands — a hall-record, rune-cut, weathered smooth — and she is reading it with her lips moving. “Hall Ostrem,” she says. “The third landing. Fenrik. Ulla.” Her thumb finds a slot near the bottom where a name has been chipped away, and stops there. “I ate breakfast with Fenrik last spring,” she says, to no one. “He burned the porridge.”", effects: ['rel brakka trust 2'] },
      ],
      next: 'oakes_other',
    },
    oakes_other: {
      speaker: 'a1a_oakes',
      text: [
        { if: 'comp:brakka', text: "“Legal salvage!” Gorm Oakes says quickly, eyeing the dwarf in his cargo. “I've a licence! Ruined hall up in the Iron Mountains, nobody's lived there in centuries, everybody knows that —”" },
        { text: "“Gorm Oakes, salvage and antiquities.” He spreads his hands over the tarpaulin. “All legal. Licensed! Ruined dwarf-hall up in the Iron Mountains, nobody's lived there in centuries. Bit of history for your mantel?”" },
      ],
      options: [
        { text: "(Intimidation) Where did this really come from, Gorm?", tone: 'aggressive', tags: ['boldness'], check: { skill: 'intimidation', dc: 13 }, success: 'oakes_talks', failure: 'oakes_whistle' },
        { text: "(Investigation) Let me see that licence of yours.", tone: 'curious', tags: ['curiosity'], check: { skill: 'investigation', dc: 13 }, success: 'manifest', failure: 'oakes_whistle' },
        { text: "We'll take the hall-record. (40 gold)", if: 'gold>=40', lockedText: 'You need 40 gold.', tone: 'pragmatic', tags: ['charity'], effects: ['gold -40'], next: 'bought' },
        { text: "Not interested.", if: '!comp:brakka', tone: 'leave', end: true },
      ],
    },
    oakes_whistle: {
      speaker: 'a1a_oakes',
      text: "Gorm's grin goes thin. He puts two fingers in his mouth and whistles, and four of his crew come up out of the hold with boathooks and belaying pins. “Let's all calm down,” he says, “or let's all not.”",
      options: [
        { text: "Let's not.", tone: 'aggressive', tags: ['violence'], effects: ['combat a1a_enc_docks'],
          voices: { brakka: "“Shields. Fists. Nobody goes in the river who can't swim.”" } },
        { text: "Fine. Forty gold, and we all go home dry.", if: 'gold>=40', lockedText: 'You need 40 gold.', tone: 'pragmatic', tags: ['pragmatic'], effects: ['gold -40'], next: 'bought' },
        { text: "Back away.", if: '!comp:brakka && recruited:brakka', tone: 'leave', end: true },
      ],
    },
    oakes_talks: {
      speaker: 'a1a_oakes',
      text: "Gorm sags. “All right. All right! It's not my licence. It's a Conclave survey warrant — they're paying salvagers to haul anything with writing on it out of the old halls up north. Halls that went... strange. Overnight, the miners say. One day lived in, next day ruins.” He licks his lips. “The Conclave buys the writing. I'm allowed to sell the junk. That plate's junk, they said. Just names.” He looks at the dwarf, and for the first time seems to understand what he's saying. “Just names,” he says again, more quietly.",
      effects: ['set a1a_ostrem_conclave'],
      next: 'plate_given',
    },
    manifest: {
      speaker: 'dm',
      text: "It isn't a salvage licence. It's a Conclave survey warrant, seal and all: Iron Mountains, halls designated ANOMALOUS, salvagers to deliver ‘all inscribed material’ to the Ashenford licensing office. Anything uninscribed, or ‘of no theoretical interest,’ may be sold. Someone has written Ostrem — names only — N.T.I. in the margin of the manifest. No theoretical interest. You hold it up so Gorm can see you've read it. He gives you the plate without another word.",
      effects: ['set a1a_ostrem_conclave'],
      next: 'plate_given',
    },
    bought: {
      speaker: 'a1a_oakes',
      text: "Gorm counts the coin with the speed of long practice. “Pleasure doing business. Mind, it's only names. The Conclave lot said so.” He doesn't seem to notice what he's just said. You do.",
      effects: ['set a1a_ostrem_conclave'],
      next: 'plate_given',
    },
    won: {
      speaker: 'dm',
      text: [
        { if: 'a1a_docks_beaten', text: "You come up spluttering on the edge of the quay with someone's boathook through your belt. You lost. Brakka — or whichever of you was still standing — didn't: Gorm Oakes is sitting on his own deck with a very solid dwarf sitting on him, and the hall-record is safe under her arm. “Conclave survey warrant,” Gorm wheezes from under her. “They buy the writing. Names are junk. Let me up.”" },
        { text: "Gorm's crew are in various states of damp disarray along the quay; one is hanging from a crane-rope by his belt, slowly rotating. Gorm sits on his own deck, nursing his jaw. “Conclave survey warrant,” he mumbles. “They pay us to haul writing out of the strange halls up north. Names are junk, they said. Take the stupid plate.”" },
      ],
      effects: ['set a1a_ostrem_conclave'],
      next: 'plate_given',
    },
    plate_given: {
      speaker: 'dm',
      text: "The hall-record of Hall Ostrem is cold and heavy and smells of river. Someone, centuries ago or last spring, cut those names with great care. Someone else, more recently, chipped one of them away.",
      effects: DOCKS_DONE,
      options: [
        { text: "Give it to the dwarf.", if: '!recruited:brakka', next: 'brakka_join' },
        { text: "Give it to Brakka.", if: 'comp:brakka', next: 'brakka_comp' },
        { text: "Keep it for Brakka.", if: 'recruited:brakka && !comp:brakka', next: 'plate_keep' },
      ],
    },
    plate_keep: {
      speaker: 'dm',
      text: "You wrap the plate in sailcloth. Brakka will want it, whenever you see her next. Whatever it says to her, it should say it to her face.",
      end: true,
    },
    brakka_comp: {
      speaker: 'comp:brakka',
      text: "Brakka holds the plate against her breastplate like a shield turned the wrong way round. “Fenrik,” she says. “Ulla. Old Harsk.” Her thumb stays on the chipped slot. “Third landing had eleven hearths. I count ten names.” She is quiet a long while. “The Conclave's buying up our walls,” she says finally. “Our records. Our names. ‘No theoretical interest.’” She looks at you, and her eyes are dry and very hard. “I'll want words with them, when it's time.”",
      effects: ['rel brakka trust 4', 'rel brakka affection 3', 'memory brakka 3 You took back Hall Ostrem\'s hearth-record from a salvage barge in Ashenford.'],
      end: true,
    },
    brakka_join: {
      speaker: 'comp:brakka',
      text: [
        { if: 'a1a_docks_fought', text: "The dwarf sets Gorm down, finally, a little harder than necessary, and turns to you, flexing a bruised hand. “Brakka Stonevein. Shieldwarden of Kharn Dovrek.” She holds the plate against her breastplate like a shield turned the wrong way round. “Good brawl. Nobody drowned. My mother would've called that a wedding.”" },
        { text: "The dwarf sets Gorm down — not gently, but not into the river either — and turns to you. “Brakka Stonevein. Shieldwarden of Kharn Dovrek.” She holds the plate against her breastplate like a shield turned the wrong way round." },
      ],
      next: 'brakka_join2',
    },
    brakka_join2: {
      speaker: 'comp:brakka',
      text: "“Hall Ostrem was my home. One morning my clan found it a ruin, four hundred years fallen, and told me I must be remembering wrong.” Her thumb rests on the chipped slot. “I've been following places that changed overnight ever since. And then I hear about a bell in Hollowmere that rang from a tower that wasn't there.” She looks at you, steady as a wall. “You're going where the world's gone wrong. So am I. A wall's worth only what it keeps safe — and I've nothing left to keep. Let me stand in front of you a while.”",
      options: [
        { text: "Glad to have you, Brakka.", tone: 'friendly', tags: ['protect'], effects: ['recruit brakka', 'rel brakka trust 3', 'memory brakka 2 You got Ostrem\'s hearth-record back for me on the Ashenford docks.'], next: 'brakka_joined' },
        { text: "Is a person their memories, or their deeds?", tone: 'curious', tags: ['knowledge'], once: true, next: 'brakka_philo' },
        { text: "Look after that plate, Shieldwarden.", tone: 'leave', next: 'brakka_no' },
      ],
    },
    brakka_philo: {
      speaker: 'comp:brakka',
      text: "She looks at you a long moment, and then, unexpectedly, laughs — a short bark that makes the tally-men jump. “That's a campfire question, that is. Ask me at a campfire.” Then, sober again: “If it's memories, I'm a liar or a ghost. If it's deeds —” she hefts the plate — “then I'd best go and do some.”",
      options: [
        { text: "Then come and do some with us.", tone: 'friendly', effects: ['recruit brakka', 'rel brakka respect 3', 'memory brakka 3 You asked me whether a person is their memories or their deeds. I am still thinking.'], next: 'brakka_joined' },
        { text: "Look after that plate, Shieldwarden.", tone: 'leave', next: 'brakka_no' },
      ],
    },
    brakka_joined: {
      speaker: 'comp:brakka',
      text: "She straps the plate to the back of her shield with two turns of rope and a knot you couldn't undo with an axe. “Right,” says Brakka Stonevein. “Where's the trouble? Point me at it.”",
      end: true,
    },
    brakka_no: {
      speaker: 'comp:brakka',
      text: "“Aye. I will.” She nods to you like one soldier to another. “I'll be on the docks a day or two, asking about the other barges. If you want a wall, you know where to find one.”",
      end: true,
    },
    brakka_again: {
      speaker: 'comp:brakka',
      text: "Brakka is sitting on a bollard with the Ostrem plate across her knees, glaring at every Conclave-licensed barge that passes. “Well?” she says.",
      options: [
        { text: "Come with us, Brakka.", tone: 'friendly', effects: ['recruit brakka', 'memory brakka 1 You came back to the docks for me.'], next: 'brakka_joined' },
        { text: "Not yet.", tone: 'leave', end: true },
      ],
    },
    after: {
      speaker: 'dm',
      text: "The docks are busy with ordinary things: tar, rope, crates, a cat asleep on a coil of hawser. The Lucky Ottoline has moved to the far end of the quay, as far from you as the quay allows.",
      end: true,
    },
  },
});

// ───────────────────────────────────────────────────────────── the Conclave licensing office (Ysolt)

D.push({
  id: 'a1a_conclave', title: 'The Conclave Licensing Office',
  start: [
    { if: 'a1a_conclave_fought', node: 'gone' },
    { if: 'a1a_conclave_visited', node: 'return' },
    { if: 'ysolt_outcome=persuaded', node: 'start_p' },
    { if: 'ysolt_outcome=fought', node: 'start_f' },
    { node: 'start_e' },
  ],
  nodes: {
    start_p: {
      speaker: 'dm',
      text: "The licensing office is the only clean building in Ashenford: grey stone scrubbed of soot, brass instruments ticking in the window, a queue of nervous hedge-witches and herb-mages clutching forms. Behind the desk sits a prim man in spectacles who looks at you, then at a paper on his blotter, then at you again, and goes slightly pink.",
      effects: ['set a1a_conclave_visited'],
      next: 'pike_p',
    },
    pike_p: {
      speaker: 'a1a_pike',
      text: "“Ah. Yes. You'll be the matter regarding Form Nine — Unlicensed Resonance, Provisional Notice Of.” Registrar Pike slides a form across the desk with two fingers, as if it were warm. “Sign here, and here, and here. And do read the margins.” He clears his throat. “The margins are where we keep the important things.”",
      next: 'margin',
    },
    margin: {
      speaker: 'dm',
      text: "In the margin, in small, sharp handwriting you last saw on a Seeker's warrant beneath Saint Orlen's: Sillow docks, east end, past the third bollard. The dusk bell. Come quietly. — Y.",
      effects: ['set a1a_ysolt_summons'],
      interjections: [
        { who: 'vaelis', text: "Vaelis looks at the handwriting and his mouth thins. “Ravencourt. She always did write as if the ink cost her personally.”" },
      ],
      options: [
        { text: "Sign the form and register. (15 gold)", if: 'gold>=15', tone: 'pragmatic', tags: ['authority'], effects: ['gold -15', 'rep conclave 3'], next: 'signed' },
        { text: "Fold the form away and leave.", tone: 'leave', end: true },
      ],
    },
    signed: {
      speaker: 'a1a_pike',
      text: "“Splendid. Splendid! Provisional licence, valid sixty days, renewable on application in triplicate.” He stamps it with a joy that is almost moving. “Do come again.”",
      end: true,
    },
    start_f: {
      speaker: 'dm',
      text: "The licensing office is the only clean building in Ashenford: grey stone scrubbed of soot, brass instruments ticking in the window. Behind the desk a prim man in spectacles looks up, looks at a sheet pinned beside his blotter — a sheet with a description of you on it — and, with great calm, rings the little bell on his desk.",
      effects: ['set a1a_conclave_visited'],
      next: 'pike_f',
    },
    pike_f: {
      speaker: 'a1a_pike',
      text: "“Do sit,” says Registrar Pike. “The wardens will be with you directly. Seeker Ravencourt files very thorough reports, and she was quite specific about you. Quite —” he touches his own cheekbone, delicately — “specific.” Somewhere at the back of the building, a door opens.",
      options: [
        { text: "(Deception) There's been a mistake. We're from the Covenant tax-house — about your arrears.", tone: 'deceptive', tags: ['deception'], check: { skill: 'deception', dc: 14 }, success: 'slip', failure: 'wardens' },
        { text: "Leave. Now.", tone: 'pragmatic', tags: ['caution'], next: 'slip' },
        { text: "We'll wait.", tone: 'aggressive', tags: ['boldness', 'violence'], effects: ['combat a1a_enc_conclave'] },
      ],
    },
    slip: {
      speaker: 'dm',
      text: "You're out of the door and into the smoke before the wardens are round the counter. Behind you, Registrar Pike's voice, aggrieved: “— but you haven't signed anything!”",
      effects: ['set a1a_conclave_fled'],
      end: true,
    },
    wardens: {
      speaker: 'a1a_pike',
      text: "“Arrears?” Pike looks genuinely wounded. “This office has never been in arrears in its life.” The wardens come round the corner.",
      options: [
        { text: "Fight.", tone: 'aggressive', tags: ['violence'], effects: ['combat a1a_enc_conclave'] },
        { text: "Run.", tone: 'pragmatic', tags: ['caution'], next: 'slip' },
      ],
    },
    start_e: {
      speaker: 'dm',
      text: "The licensing office is the only clean building in Ashenford: grey stone scrubbed of soot, brass instruments ticking in the window, a queue of nervous hedge-witches clutching forms. The prim man behind the desk looks up, looks at a description of you pinned beside his blotter, and sighs the sigh of a man whose day has just become complicated.",
      effects: ['set a1a_conclave_visited'],
      next: 'pike_e',
    },
    pike_e: {
      speaker: 'a1a_pike',
      text: "“You match a description,” says Registrar Pike. “However. You are not on my desk; you are on the Seeker's desk, and the Seeker is not in Ashenford. I am a registrar, not a warden. I register.” He pushes a form toward you. “Would you like to register? It would make my day considerably tidier.”",
      options: [
        { text: "Register. (15 gold)", if: 'gold>=15', tone: 'pragmatic', tags: ['authority'], effects: ['gold -15', 'rep conclave 3'], next: 'signed' },
        { text: "(Insight) Where is the Seeker, Registrar?", tone: 'curious', tags: ['curiosity'], once: true, check: { skill: 'insight', dc: 14 }, success: 'pike_tell', failure: 'pike_shut' },
        { text: "Good day, Registrar.", tone: 'leave', end: true },
      ],
    },
    pike_tell: {
      speaker: 'a1a_pike',
      text: "“I really couldn't say.” He says it to the form, not to you, and his pen makes a very small, involuntary movement toward the north window. “The office has been very quiet since the detachment went through. Very quiet. One could almost —” he catches himself, “— register in peace.”",
      next: 'pike_e',
    },
    pike_shut: {
      speaker: 'a1a_pike',
      text: "“I really couldn't say,” he says, and means it, and goes back to his forms.",
      next: 'pike_e',
    },
    return: {
      speaker: 'a1a_pike',
      text: [
        { if: 'a1a_conclave_fled', text: "Registrar Pike sees you in the doorway, reaches for his bell, thinks better of it, and slowly takes his hand away. “Please,” he says. “I have a great many forms today.”" },
        { text: "Registrar Pike looks up, and down again. “The margins,” he murmurs, “are where we keep the important things.” He says nothing else." },
      ],
      end: true,
    },
    gone: {
      speaker: 'dm',
      text: "The licensing office is shuttered. Somebody has pinned a notice to the door: CLOSED FOR REORGANISATION. Underneath, in a prim hand: Forms may be left in the box.",
      end: true,
    },
  },
});

D.push({
  id: 'a1a_conclave_orders', title: 'The Wardens\' Orders',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: "The licensing office is a wreck of spilled ink and cracked brass. Registrar Pike is under his desk, clutching his stamp to his chest. On the senior warden, folded inside his glove, you find a slip of Conclave paper under a High Seeker's sigil: The bearer is expected at Valdros by the Old Path. Do not engage in Ashenford. Observe and report only. The reception will be ready. — V. Someone, it seems, has told the Conclave exactly where you are going.",
      effects: ['set a1_warned_of_ambush', 'set a1a_conclave_orders'],
      interjections: [
        { who: 'vaelis', text: "Vaelis reads the sigil and goes very still. “Dorran Vex,” he says. “He does not plan receptions. He plans funerals, and lets other people bring the flowers.”" },
      ],
      end: true,
    },
  },
});

D.push({
  id: 'a1a_ysolt', title: 'Past the Third Bollard',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: "The dusk bell is ringing from the chapel when you reach the east end of the docks. Past the third bollard, a woman in a bargeman's oilcloak is sitting on an upturned crate, smoking a short clay pipe and watching the Sillow go by. The coat is all wrong. The posture is not. Seeker Ysolt Ravencourt doesn't look up.",
      next: 'ysolt1',
    },
    ysolt1: {
      speaker: 'ysolt',
      text: "“You came quietly. Good. I am about to do something I will have to lie about, and I would like it to be worth the lie.” She taps out the pipe on the crate. “High Seeker Vex has laid a reception for you at Valdros. The Senate Dome. Wardens, arcanists, chain, a very good plan. They know you're going there, and by which road. They knew before you did, I think.” Now she looks at you, and her eyes are flat and grey and tired. “I was not told how they know. I was told not to ask. I find that I mind.”",
      effects: ['set a1_warned_of_ambush', 'set a1a_ysolt_met'],
      options: [
        { text: "Why are you telling us?", tone: 'curious', tags: ['curiosity'], once: true, next: 'why' },
        { text: "(Insight) You're afraid of Vex.", tone: 'curious', tags: ['curiosity', 'honesty'], once: true, check: { skill: 'insight', dc: 14 }, success: 'afraid', failure: 'afraid_f' },
        { text: "Come with us. Get out of the Conclave.", tone: 'compassionate', tags: ['mercy'], once: true, next: 'come' },
        { text: "Thank you, Seeker.", tone: 'friendly', next: 'bye' },
      ],
    },
    why: {
      speaker: 'ysolt',
      text: "“Because the Archon wants what you carry very badly, and I have learned to distrust anything a great man wants very badly.” A thin smile. “And because in that vault, you could have made me a corpse or a fool, and you made me neither. I dislike owing people.”",
      next: 'ysolt1b',
    },
    afraid: {
      speaker: 'ysolt',
      text: "She is quiet long enough that you think she won't answer. “Vex is loyal to results,” she says at last. “Only to results. When a man like that is told not to ask questions, he doesn't. When he tells his Seekers not to ask, it's because the answers would make us less useful.” She refills the pipe with steady hands. “Yes. A little.”",
      next: 'ysolt1b',
    },
    afraid_f: {
      speaker: 'ysolt',
      text: "“I'm cold,” she says. “It's a river. Don't flatter yourself.”",
      next: 'ysolt1b',
    },
    come: {
      speaker: 'ysolt',
      text: "She actually laughs — short, surprised, almost warm. “And do what? Carry your bags? No. I'm a great deal more use to you inside, where I can read the mail.” She stands. “Don't make me regret this. I'm very good at regret; I've had practice.”",
      effects: ['set a1a_ysolt_informant'],
      next: 'ysolt1b',
    },
    ysolt1b: {
      speaker: 'ysolt',
      text: "The dusk bell stops. Ysolt glances along the quay.",
      options: [
        { text: "Why are you telling us?", tone: 'curious', once: true, next: 'why' },
        { text: "Come with us. Get out of the Conclave.", tone: 'compassionate', once: true, next: 'come' },
        { text: "Thank you, Seeker.", tone: 'friendly', next: 'bye' },
      ],
    },
    bye: {
      speaker: 'ysolt',
      text: "“Don't thank me. Survive. It's more useful and much less embarrassing.” She pulls the oilcloak's hood up. “If you walk into that Dome, walk in expecting them. And if you meet anyone at Valdros who seems very glad to see you —” she pauses, frowns at nothing, and shakes her head. “No. I don't know anything. That's the problem.” Then she is just a bargewoman walking away along the Sillow in the dark.",
      effects: ['xp 50'],
      end: true,
    },
  },
});

// ───────────────────────────────────────────────────────────── beneath the cooper's (a1a_safehouse)

D.push({
  id: 'a1a_cooper', title: 'Hooper\'s Cooperage',
  start: [
    { if: 'a1_safehouse=betrayed', node: 'betrayed' },
    { if: 'a1_safehouse', node: 'after' },
    { if: 'a1a_safehouse_open', node: 'pass' },
    { node: 'start' },
  ],
  nodes: {
    start: {
      speaker: 'dm',
      text: "The cooperage smells of oak shavings, hot iron and pitch. Steam curls from a bending-box where staves soften like bread. Barrels everywhere: finished, half-hooped, stacked to the rafters against the back wall in a great curved bank. The cooper is the biggest man you've seen in Ashenford, working a hoop down over a cask with small, careful taps, as if the barrel might mind.",
      next: 'hooper',
    },
    hooper: {
      speaker: 'a1a_hooper',
      text: "“Casks?” Josse Hooper doesn't stop tapping. His voice is slow and deep, like something being rolled down a cellar ramp. “I make 'em. I mend 'em. What d'you need?”",
      options: [
        { text: "Do you mend old casks?", if: 'a1a_cooper_known', tone: 'curious', next: 'pass' },
        { text: "Corvin Thale said if we ever came through Ashenford, we should see the cooper.", if: 'corvin_fate=freed || corvin_fate=ally', tone: 'friendly', next: 'pass' },
        { text: "Show him the broken chain.", if: 'item:unbound_sigil', tone: 'friendly', next: 'pass' },
        { text: "(Insight) Those barrels by the back wall have never held anything, have they?", if: '!a1a_cooper_known', tone: 'curious', tags: ['curiosity'], once: true, check: { skill: 'insight', dc: 14, advIf: 'comp:kael' }, success: 'sharp', failure: 'nope' },
        { text: "Nothing today.", tone: 'leave', end: true },
      ],
    },
    nope: {
      speaker: 'a1a_hooper',
      text: "“Barrels hold what's put in 'em.” Tap. Tap. “Mostly air, till someone buys 'em.” He is not looking at you any more. He is very carefully not looking at you.",
      options: [
        { text: "Nothing today, then.", tone: 'leave', end: true },
      ],
    },
    sharp: {
      speaker: 'a1a_hooper',
      text: "The tapping stops. Hooper looks at you for a long moment over the cask, and then at the street door, and then he goes and shuts it. “Sharp,” he says. “Too sharp for your own good, likely.” He wipes his hands on his apron. “You'd best come and say that to someone who decides things.”",
      next: 'pass',
    },
    pass: {
      speaker: 'a1a_hooper',
      text: [
        { if: 'a1a_cooper_known', text: "“Only the ones that remember what they held,” Hooper says, as if finishing a line of an old song. He sets down his mallet, goes to the bank of barrels against the back wall, and puts his shoulder to one. A whole section swings inward on a hinge, barrels and all, with the soft sigh of good oil. Beyond it, a stair goes down into the river-damp." },
        { text: "Hooper sets down his mallet, goes to the bank of barrels against the back wall, and puts his shoulder to one. A whole section swings inward on a hinge, barrels and all, with the soft sigh of good oil. Beyond it, a stair goes down into the river-damp." },
      ],
      effects: ['set a1a_safehouse_open', 'set a1a_cooper_known', 'quest a1a_safehouse cellar'],
      options: [
        { text: "Follow Hooper down.", if: 'corvin_fate=freed || corvin_fate=ally', next: 'cellar_corvin' },
        { text: "Follow Hooper down.", if: '!(corvin_fate=freed || corvin_fate=ally)', next: 'cellar' },
        { text: "Not yet.", tone: 'leave', end: true },
      ],
    },
    cellar: {
      speaker: 'dm',
      text: "A vaulted brick cellar under the Low Quarter, cold and wet-walled, the river audible somewhere behind the bricks. Strung across it on lines, like washing hung to dry, are thousands of pages: census rolls, letters, children's drawings, a recipe for plum cake in a hand nobody alive will recognise. A map of Elyndra covers one wall, its towns crossed out and pencilled stubbornly back in. Beneath it, at a table of upturned casks, a thin figure in an ink-black shawl is copying names by the light of one candle.",
      next: 'wick',
    },
    wick: {
      speaker: 'a1a_wick',
      text: [
        { if: 'corvin_fate=handed_over', text: "“Entry: the bearer.” The archivist doesn't look up. The pen keeps moving. “Cross-reference: Hollowmere; bell; Corvin Thale, field agent, currently in a Covenant cell in Hollowmere, on your account.” The pen stops. “I'm Wick. The Index asked me not to hold that against you. I'm holding it very slightly. She's written to you.”" },
        { if: 'corvin_fate=killed', text: "“Entry: the bearer.” The archivist doesn't look up. “Cross-reference: Hollowmere; bell; Corvin Thale, field agent, deceased.” The pen stops, and stays stopped. “I'm Wick. I wrote his name in the book myself. The Index asked me to give you this anyway. She says grief is a bad archivist.” A page of thick paper slides across the casks." },
        { text: "“Entry: the bearer.” The archivist doesn't look up. The pen keeps moving. “Cross-reference: Hollowmere; bell; the third lantern from the left. You're late. You're also early. I'm Wick.” The pen stops. “The Index has written to you.”" },
      ],
      interjections: [
        { who: 'vaelis', text: "Vaelis is already reading the hanging pages, head tilted, lips moving. “This is a Charter-era tax roll,” he breathes. “This one's older. This one — this one shouldn't exist.” Wick, without looking: “None of it should. That's rather the point.”" },
        { who: 'seris', text: "Seris stands at the foot of the stair with her hand on her sword and does not come any further in. “Heresy,” she says, but quietly, and she is reading the names too." },
      ],
      next: 'cipher',
    },
    cipher: {
      speaker: 'dm',
      text: "The message is a single sheet of heavy paper, pricked all over with tiny raised dots — not ink at all, but something you could read with your fingertips. A blind woman's cipher. Wick taps it. “She writes for those she trusts. If you're ours, I'll give you the key. If you're not —” a shrug of the shawl — “people have been known to read it anyway. Not many.”",
      options: [
        { text: "What would it mean to be ‘yours’?", if: '!a1a_ally_refused', tone: 'curious', tags: ['curiosity'], next: 'ally_offer' },
        { text: "(Investigation) Let me try to read it.", tone: 'curious', tags: ['knowledge', 'curiosity'], once: true, check: { skill: 'investigation', dc: 15, advIf: 'comp:vaelis || comp:kael || class:wizard || class:rogue' }, success: 'decoded', failure: 'cipher_fail' },
        { text: "(Resonance) Read it the way she wrote it — by feel, by what the paper remembers.", if: 'res>=1', tone: 'resonance', tags: ['forbidden'], effects: ['res -1'], next: 'decoded_res' },
        { text: "Keep your cipher. We'll go our own way.", tone: 'leave', tags: ['caution'], next: 'visited' },
      ],
    },
    cipher_fail: {
      speaker: 'dm',
      text: "You run your fingers over the dots until they swim. You get two words you're sure of — Valdros, and lamp — and a great many you aren't. Wick watches with mild sympathy. “Most people get ‘lamp’,” Wick says. “She likes lamps.”",
      effects: ['set a1a_cipher_failed'],
      options: [
        { text: "What would it mean to be ‘yours’?", if: '!a1a_ally_refused', tone: 'curious', next: 'ally_offer' },
        { text: "Valdros and a lamp. It'll have to do.", tone: 'leave', next: 'visited' },
      ],
    },
    decoded: {
      speaker: 'dm',
      text: "It's a substitution cipher laid over a cataloguing system — every word a shelf-mark in some vast imaginary archive. Once you see the shelves, the words come down off them one by one.",
      next: 'index_msg',
    },
    decoded_res: {
      speaker: 'dm',
      text: "You close your eyes and let the Heart's hum rise. The paper remembers being written: a cold room, a woman's fingers pressing each dot with great care, and the words under her breath as she pressed them. You hear them in her voice.",
      next: 'index_msg',
    },
    cellar_corvin: {
      speaker: 'dm',
      text: "A vaulted brick cellar under the Low Quarter, cold and wet-walled, the river audible somewhere behind the bricks. Strung across it on lines, like washing hung to dry, are thousands of pages: census rolls, letters, children's drawings. A map of Elyndra covers one wall, its towns crossed out and pencilled stubbornly back in. At a table of upturned casks, a thin figure in an ink-black shawl is copying names — and beside it, leaping up so fast he knocks over the candle, is a man in cracked spectacles.",
      next: 'corvin',
    },
    corvin: {
      speaker: 'corvin',
      text: [
        { if: 'corvin_fate=ally', text: "“You came! You actually — sorry. Sorry. Sit. Mind the — that's the Marrowby census, don't sit on Marrowby.” Corvin Thale rights the candle, burns his fingers, and doesn't notice. “I told the Index you'd come. I may have bet on it. With money I don't technically have.” He gestures at the shawled figure, who has not stopped writing. “This is Wick. Wick is our archivist. Wick does not approve of me.” Wick: “Entry: Thale. See also: candles, knocked over.”" },
        { text: "“You came! You actually — sorry. Sorry. Sit. Mind the — that's the Marrowby census, don't sit on Marrowby.” Corvin Thale rights the candle, burns his fingers, and doesn't notice. “You let me go, under the cathedral. I haven't forgotten. I've written it down, actually, in three places.” He gestures at the shawled figure, who has not stopped writing. “This is Wick. Wick is our archivist.” Wick: “Entry: Thale. See also: candles, knocked over.”" },
      ],
      next: 'corvin2',
    },
    corvin2: {
      speaker: 'corvin',
      text: "Corvin's face goes serious, which on him looks like a borrowed coat. “The Index has written to you. It's in her cipher — she writes for the people she trusts.” He takes the pricked sheet from Wick before Wick can object. “She trusts me. Which means she trusts you, by a sort of... ethical transitive property. I'll read it.”",
      next: 'index_msg',
    },
    index_msg: {
      speaker: 'dm',
      text: [
        { if: '(corvin_fate=freed || corvin_fate=ally) && !a1_safehouse', text: `Corvin reads it aloud, quietly, his finger moving across the dots: ${INDEX_MESSAGE}` },
        { text: `The message, word by word: ${INDEX_MESSAGE}` },
      ],
      effects: ['set a1a_msg_read', 'set a1_warned_of_ambush', 'clue a1a_safehouse index'],
      interjections: [
        { who: 'kael', text: "Kael has gone quiet. “‘Someone has told them which road,’” he repeats. “That's a short list, isn't it? Shorter than I'd like.”" },
        { who: 'brakka', text: "Brakka cracks her knuckles one at a time. “An ambush you know about,” she says, “is just a fight that's late.”" },
        { who: 'varek', text: "Varek is looking at the pricked paper as if it were a mirror. “The Choir has been saying Valdros for a week,” he says. “I thought it was being poetic.”" },
      ],
      next: 'after_msg',
    },
    after_msg: {
      speaker: 'a1a_wick',
      text: [
        { if: 'a1_safehouse=allied', text: "“Now you know what we know,” says Wick. “More or less. Mostly less.”" },
        { text: "“Now you know what we know,” says Wick, pinning the message back on its line like a shirt. “The question is whether we know you.”" },
      ],
      options: [
        { text: "What would it mean to be ‘yours’?", if: '!a1_safehouse && !a1a_ally_refused', tone: 'curious', tags: ['curiosity'], next: 'ally_offer' },
        { text: "Thank you. We'll go our own way.", if: '!a1_safehouse', tone: 'leave', tags: ['caution'], next: 'visited' },
        { text: "Time to go.", if: 'a1_safehouse', tone: 'leave', next: 'farewell' },
      ],
    },
    ally_offer: {
      speaker: 'a1a_wick',
      text: "“Ours.” Wick finally puts the pen down. “Carry a lantern for the erased. Literally, now and then: we'll ask you to look at something with that resonance of yours and tell us what it remembers. And when you find a name that's been scraped away — on a census, a hall-record, a gravestone — write it down and send it here. That's all. That's everything.” A pause. “The Covenant hangs people for less. The Conclave does worse. The Index will know your name, which is a kind of protection and a kind of chain.”",
      decision: true,
      options: [
        { text: "Agreed. We'll carry a lantern for the erased.", if: '!item:unbound_sigil', tone: 'friendly', tags: ['defiance', 'knowledge', 'mercy'], effects: ['give unbound_sigil'], next: 'allied',
          voices: { vaelis: "“Say yes. Say yes. Do you have any idea what is on those lines?”", tessa: "“Names are songs that haven't been sung yet. Say yes.”", seris: "“They are heretics and thieves of history. I —” She stops. “I cannot tell you no.”" } },
        { text: "Agreed. We'll carry a lantern for the erased.", if: 'item:unbound_sigil', tone: 'friendly', tags: ['defiance', 'knowledge', 'mercy'], next: 'allied' },
        { text: "Not today.", if: 'a1a_msg_read', tone: 'pragmatic', tags: ['caution'], effects: ['set a1a_ally_refused'], next: 'after_msg' },
        { text: "Not today.", if: '!a1a_msg_read', tone: 'pragmatic', tags: ['caution'], effects: ['set a1a_ally_refused'], next: 'cipher' },
      ],
    },
    allied: {
      speaker: 'a1a_wick',
      text: [
        { if: 'item:unbound_sigil', text: "Wick takes a book from under the table — a ledger bound in black cloth — and writes something in it, and blots it. “Entry: the bearer. Status: ours.” A brass disc stamped with a broken chain sits by your hand, as if it had always been there. “That's the key, by the way. The disc. Turn it under your fingers and it reads her dots. She thought you'd like that.”" },
        { text: "Wick takes a book from under the table — a ledger bound in black cloth — and writes something in it, and blots it. “Entry: the bearer. Status: ours.”" },
      ],
      effects: ['set a1_safehouse allied', 'complete a1a_safehouse allied', 'rep unbound 15'],
      interjections: [
        { who: 'seris', text: "Seris turns and goes back up the stair without a word. You hear her waiting at the top, very still, for a long time.", effects: ['rel seris agreement -3'] },
        { who: 'vaelis', text: "Vaelis has already found the oldest page on the lines and is holding it to the candle like a lover's letter.", effects: ['rel vaelis affection 2'] },
      ],
      options: [
        { text: "Read the Index's message.", if: '!a1a_msg_read', next: 'index_msg' },
        { text: "Time to go.", if: 'a1a_msg_read', next: 'farewell' },
      ],
    },
    visited: {
      speaker: 'a1a_wick',
      text: "“Your own way.” Wick picks the pen back up. “Entry: the bearer. Status: visited. Unbound by us, too.” The ghost of a smile. “The Index will be pleased. She likes people who can't be catalogued.”",
      effects: ['set a1_safehouse visited', 'complete a1a_safehouse visited', 'rep unbound 3'],
      next: 'farewell',
    },
    farewell: {
      speaker: 'a1a_hooper',
      text: [
        { if: 'corvin_fate=freed || corvin_fate=ally', text: "Hooper sees you back up the stair, and Corvin calls after you, “Valdros! Eyes open! And if you see any Charter-era inscriptions, please, please copy them, especially the —” The barrel-wall swings shut on whatever he was about to say. Hooper picks up his mallet. Tap. Tap." },
        { text: "Hooper sees you back up the stair and swings the barrel-wall shut behind you with one hand. “Mind how you go,” he says. Tap. Tap. Just a cooper, mending casks." },
      ],
      options: walkOn('Step out into the Low Quarter.'),
    },
    after: {
      speaker: 'a1a_hooper',
      text: [
        { if: 'a1_safehouse=allied', text: "Hooper nods to you, and tilts his head an inch toward the back wall. An invitation, if you want it. “Wick says the Index read your name,” he rumbles. “Said it hummed.”" },
        { text: "Hooper nods to you and goes on tapping hoops onto casks. If you hadn't been down the stair yourself, you'd never guess there was one." },
      ],
      end: true,
    },
    betrayed: {
      speaker: 'dm',
      text: "Hooper's cooperage is shut, a Covenant seal across the door. Through the window you can see the barrel-wall, split open with axes, and the stair beyond it, dark. Someone has scratched a tiny broken chain into the seal. Then, beside it, very small and very deep: your name.",
      end: true,
    },
  },
});

// ───────────────────────────────────────────────────────────── the town coda

D.push({
  id: 'a1a_done', title: 'Ashenford, at Dusk',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: [
        { if: 'a1_warned_of_ambush', text: "The dusk bell rings over Ashenford. The kilns breathe orange; the barges light their lamps; somewhere in the Low Quarter, children are singing the counting-song. You have done what you can here — and you have learned something that weighs more than anything in your packs: at Valdros, someone is waiting for you, and they knew your road before you did. The road north and east is the same road it was this morning. You will walk it differently." },
        { text: "The dusk bell rings over Ashenford. The kilns breathe orange; the barges light their lamps; somewhere in the Low Quarter, children are singing the counting-song. You have done what you can here. The town will remember some of it, and the river will remember the rest." },
      ],
      effects: ['set a1_ashenford_done', 'xp 200', 'log Ashenford: whatever else it is, the town is a little different for your having been in it.'],
      end: true,
    },
  },
});

// ───────────────────────────────────────────────────────────── travel vignettes

D.push({
  id: 'a1a_road_refugees', title: 'On the Ashenford Road',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: "The road dips toward the Sillow valley, and a smudge of kiln-smoke on the horizon tells you Ashenford is close. A handcart blocks half the road with a broken axle: a family of five, everything they own roped on top, and a Covenant relocation docket nailed to the cart-tail. The smallest child is under a blanket in the cart. When the blanket slips you see her eyes — violet, faintly glowing — before her mother twitches it back into place and gives you a look like a closing door.",
      options: [
        { text: "(Athletics) Help them lift the cart and splint the axle.", tone: 'friendly', tags: ['charity', 'protect'], check: { skill: 'athletics', dc: 12 }, success: 'fixed', failure: 'fixed_slow' },
        { text: "Tell them: if they're going to Ashenford, keep the child away from the square at noon.", tone: 'compassionate', tags: ['protect', 'honesty'], next: 'warned' },
        { text: "Walk on by.", tone: 'leave', end: true },
      ],
    },
    fixed: {
      speaker: 'dm',
      text: "The axle splints clean. The father shakes your hand without a word. The mother, after a long moment, lifts the edge of the blanket so the child can see you properly, and the little girl waves.",
      effects: ['xp 25'],
      end: true,
    },
    fixed_slow: {
      speaker: 'dm',
      text: "It takes an hour, two skinned knuckles and a great deal of swearing, but the cart rolls again. The mother never lets the blanket slip twice.",
      effects: ['xp 15', 'time 60'],
      end: true,
    },
    warned: {
      speaker: 'dm',
      text: "The mother's face goes tight. “The Washing,” she says. “Aye. We heard.” She looks at the docket nailed to her cart. “Relocated to Ashenford, it says. For our protection.” She laughs, and it isn't a laugh. “Thank you, stranger.”",
      effects: ['xp 15'],
      end: true,
    },
  },
});

D.push({
  id: 'a1a_road_pilgrims', title: 'Pilgrims on the Road',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: [
        { if: 'a1_mob=fought', text: "A column of Dawnblade pilgrims comes the other way, white sashes grey with road-dust, singing the slow minor-key song from the square. The singing stops when they see you. Someone at the front says a word — Washing — and the whole column steps off the road into the ditch to let you pass, every face turned to watch you go by. Nobody lifts a hand. That is somehow worse." },
        { if: 'a1a_sollace_broken', text: "A column of Dawnblade pilgrims comes the other way, singing. At the back, without a lantern, walks Aubrine Sollace. She sees you and stops, and the column goes on without her. “I am walking to the Dawnspire,” she says, “to ask the Hierophant a question I should have asked twenty years ago.” She looks at the road. “I don't expect an answer. I find I want to ask anyway.” She goes on." },
        { text: "A column of Dawnblade pilgrims comes the other way, white sashes grey with road-dust, singing a slow song in a minor key. They nod to you as they pass, kindly. One presses a heel of bread into your hand. “The Lights are patient,” she says, and smiles, and you think of the river steps." },
      ],
      effects: ['xp 15'],
      end: true,
    },
  },
});

// ═══════════════════════════════════════════════════════════════════════ module

const TRAVEL: TravelEvent[] = [
  { id: 'a1a_road_refugees', weight: 2, once: true, if: 'chapter:act1 && !visited:ashenford', dialogue: 'a1a_road_refugees' },
  { id: 'a1a_road_pilgrims', weight: 2, once: true, if: 'chapter:act1 && visited:ashenford && !a1_complete', dialogue: 'a1a_road_pilgrims' },
];

export const ASHENFORD: ContentModule = {
  quests: QUESTS,
  dialogues: D,
  objects: OBJECTS,
  encounters: ENCOUNTERS,
  items: ITEMS,
  npcs: NPCS,
  shops: SHOPS,
  travel: TRAVEL,
  enemies: ENEMIES,
  enter: {
    ashenford: [
      { if: 'a1_ashenford_done', text: 'Ashenford again: coal-smoke and river mud and hot glass, the Sillow brown and fast under its barges. A tax-man nods to you as if you were a regular. Somewhere in the Low Quarter a child is singing the counting-song, and somewhere by the glassworks a kiln is breathing orange.' },
      { text: 'Ashenford smells of coal-smoke, river mud and hot glass. Barges crowd the brown Sillow; Covenant tax-men in iron-grey coats count everything that moves; kiln-dust settles ash-grey on every sill. From the square comes slow singing in a minor key, and from the Low Quarter the sound of hammering — someone nailing something to a door. Above the rooftops the glassworks chimneys breathe orange into a pewter sky, the same kilns that burned this valley eight hundred years ago, and nobody here has ever once thought of putting them out.' },
    ],
  },
};
