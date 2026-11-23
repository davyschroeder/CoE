/**
 * Companion personal quests (stage 1 of each companion's arc) and companion-to-companion conflicts.
 * Everything here is merged into the main registries (quests, dialogues, maps, encounters, items).
 *
 * Design notes
 * - Each quest is the *first chapter* of a personal arc (see STORY_BIBLE.md §8). Big secrets are only
 *   hinted at; every quest sets `cq_<id>_outcome` plus a few narrower flags Act I can read.
 * - Quest locations only appear while the quest is at the right stage AND the companion is in the active
 *   party (`comp:<id>`), so a personal matter is always handled with the person it belongs to.
 * - Only type imports here: the registries import this module, so it must not import them at runtime.
 */
import type { QuestDef } from './quests';
import type { DialogueTree, Cond } from './schema';
import type { MapObject } from './maps/types';
import type { EncounterDef } from './encounters';
import type { ItemDef } from './items';

export interface CompanionQuestEntry { companionId: string; questId: string; startTree: string; availableIf: Cond; }
export interface ConflictEntry { id: string; between: [string, string]; if: Cond; tree: string; }

// ════════════════════════════════════════════════════════════════════════════════ ITEMS

export const CQ_ITEMS: ItemDef[] = [
  { id: 'cq_kael_coin', name: 'Kael\'s Last Coin', type: 'amulet', rarity: 'uncommon', value: 60, weight: 0,
    desc: 'A worn Solmaran silver piece, drilled and strung on a bootlace. Kael walked it across his knuckles for ten years. "If I ever stop being worth trusting, spend it." +1 initiative, +1 Sleight of Hand, +1 Deception.',
    bonus: { initiative: 1, skills: { sleightOfHand: 1, deception: 1 } } },
  { id: 'cq_orren_charm', name: 'Rootlet Charm', type: 'amulet', rarity: 'uncommon', value: 70, weight: 0,
    desc: 'A Lantern Tree rootlet carved into an acorn cap by Orren\'s knife and knotted on a cord. It stays faintly warm. +4 maximum HP, +2 Nature.',
    bonus: { maxHp: 4, skills: { nature: 2 } } },
  { id: 'cq_korr_band', name: 'Thal\'s Oath-Band', type: 'ring', rarity: 'uncommon', value: 90, weight: 0,
    desc: 'A ring of carved bone, once braided into an Ashkin war-leader\'s hair beside his own. A witness keeps the band. +1 weapon damage, +1 Athletics.',
    bonus: { damage: 1, skills: { athletics: 1 } } },
  { id: 'cq_brakka_token', name: 'Steadfast Token', type: 'ring', rarity: 'uncommon', value: 70, weight: 0,
    desc: 'An iron shield-washer that fits a dwarf\'s thumb, scratched with an honour-rune — misspelled, with two d\'s, on purpose. +1 to saving throws, +3 maximum HP.',
    bonus: { saves: 1, maxHp: 3 } },
  { id: 'cq_vaelis_lodestone', name: 'Seeker\'s Lodestone', type: 'amulet', rarity: 'rare', value: 200, weight: 0,
    desc: 'A Conclave tracking instrument of black glass and silver wire, built from Vaelis Thorne\'s old margins. Its needle has opinions. +1 spell attack, +1 Arcana, +1 Investigation.',
    bonus: { spellAttack: 1, skills: { arcana: 1, investigation: 1 } } },
  { id: 'cq_seris_ribbon', name: 'Vigil Ribbon of the Last Dawn', type: 'amulet', rarity: 'uncommon', value: 60, weight: 0,
    desc: 'A strip of white-and-gold tabard tied in the Order\'s vigil-knot. Knights give them only to those who kept watch beside them. +1 to saving throws, +1 Insight.',
    bonus: { saves: 1, skills: { insight: 1 } } },
  { id: 'cq_nima_tear', name: 'Ember-Glass Tear', type: 'ring', rarity: 'uncommon', value: 120, weight: 0,
    desc: 'A teardrop of ember-coloured glass Nima made out of nothing, set in a twist of copper wire. Still warm, always. +1 spell attack, resistance to fire.',
    bonus: { spellAttack: 1, resist: ['fire'] } },
  { id: 'cq_ilyra_stone', name: 'Mill-Race Stone', type: 'amulet', rarity: 'uncommon', value: 60, weight: 0,
    desc: 'A thumb-sized grey stone polished by nine years of water, bound in Veyra\'s knot of blessed thread. For those who remember two things at once. +1 Wisdom, resistance to cold.',
    bonus: { abilities: { wis: 1 }, resist: ['cold'] } },
  { id: 'cq_varek_locket', name: 'Choir-Verse Locket', type: 'amulet', rarity: 'rare', value: 220, weight: 0,
    desc: 'An empty silver locket that hums a descending tune with a little turn at the end. Something has been folded into it. +1 spell save DC, +1 Deception.',
    bonus: { spellDC: 1, skills: { deception: 1 } } },
  { id: 'cq_tessa_fork', name: 'Halric\'s Tuning Fork', type: 'amulet', rarity: 'uncommon', value: 90, weight: 0,
    desc: 'A bell-ringer\'s tuning fork of old bronze, found in a niche that was not there a moment before. Struck, it hums Orlen\'s Voice. +2 Performance, +1 Persuasion, +1 initiative.',
    bonus: { initiative: 1, skills: { performance: 2, persuasion: 1 } } },
];

// ════════════════════════════════════════════════════════════════════════════════ QUESTS

export const CQ_QUESTS: QuestDef[] = [
  {
    id: 'cq_kael', title: 'A Letter With No Seal', category: 'companion', giver: 'Kael Veyran',
    summary: 'The unsigned letter that follows Kael wherever he goes has found him again. This time it wants to know about you.',
    stages: {
      drop: { objective: 'Go with Kael to "the usual place" — the mounting-block outside Hollowmere\'s town hall — and decide what his report will say. (Kael must be in your party.)', journal: 'The letter with no seal turned up in Kael\'s boot this morning, while he was wearing it. It wants everything about "the bearer" — you — left under the loose capstone of the mounting-block by the town hall. It ends: "Remember the house."' },
      watch: { objective: 'Keep watch on the mounting-block with Kael and see whose hand comes to collect the report.', journal: 'The report is under the stone. Kael wants to see who comes for it. "You learn more about a man from his errand-boy than from his letters."' },
    },
    clues: {
      knot: 'Kael\'s letters are folded with a dispatch knot used on Iron Covenant road-post.',
      mira: 'Mira the lantern-seller collects letters from the mounting-block for a copper apiece and hands them to the Solmara coach. A polite man in a grey coat pays her.',
    },
    outcomes: {
      honest: 'Kael sent his employer the truth about you — and added a line saying you knew.',
      lied: 'Kael sent his employer a dull, careful lie about a lucky traveller. If it is ever caught, Wren House pays.',
      empty: 'Kael left the drop empty. Somewhere in Solmara, someone will notice the silence.',
    },
  },
  {
    id: 'cq_orren', title: 'What the Roots Remember', category: 'companion', giver: 'Orren Mossward',
    summary: 'The acorn in Orren\'s pocket woke when the bell rang. Now it keeps rolling, uphill, toward the Lantern Tree.',
    stages: {
      listen: { objective: 'Listen at the roots of the Lantern Tree in the square with Orren. (Orren must be in your party.)', journal: 'Orren showed you what he keeps in his pocket: an acorn, glossy as a chestnut and warm as a sleeping bird. Since the bell it rolls, very slowly, always toward the Lantern Tree. "When a seed starts walking," his grandmother told him, "follow. Quietly."' },
      roots: { objective: 'Follow the Lantern Tree\'s roots down to the old chapel in the undercroft beneath Saint Orlen\'s.', journal: 'The Lantern Tree\'s roots go deeper than any tree\'s should — down under the hill, toward the chapel beneath the cathedral.' },
    },
    clues: {
      roots: 'The Lantern Tree\'s roots run far deeper than an oak\'s should, all the way under the hill to the chapel beneath Saint Orlen\'s.',
      vision: 'In the acorn\'s skin you glimpsed a tree whose branches held up the sky, and a path-warden walking away between its roots.',
    },
    outcomes: {
      hidden: 'Orren keeps the acorn hidden, even from you, because you told him to keep it safe.',
      shared: 'Orren told you what the acorn is — as much of it as he could bear to say aloud.',
      tested: 'You let the acorn touch the old roots. Something woke, and things that are waking get noticed.',
    },
  },
  {
    id: 'cq_korr', title: 'The Voice in the Grey', category: 'companion', giver: 'Korr Ashmane',
    summary: 'In the fog Korr hears his oath-brother Thal calling his name. Thal has been dead for years. Korr\'s hand killed him.',
    stages: {
      voice: { objective: 'Walk among the graves behind the Cathedral of Saint Orlen with Korr and find who is calling him. (Korr must be in your party.)', journal: 'Korr heard Thal call again, from the north, "where the cathedral keeps its dead in the ground." Ashkin burn their dead. Korr wants a witness.' },
      graves: { objective: 'Face the echo of Thal among the graves.', journal: 'Among the graves of Saint Orlen\'s stands the echo of an Ashkin warrior with an axe-wound in his side. He says Korr stopped singing his name.' },
    },
    clues: {
      eyes: 'Thal\'s echo says Korr\'s eyes went black at the end — "not ember, black" — and that other, older voices sang a war-song in his rage.',
    },
    outcomes: {
      sung: 'Korr sang Thal\'s deeds aloud for the first time since his exile. The echo sang the last line with him, and went quiet.',
      fought: 'Korr\'s fire took him again, and the echo of Thal broke apart under his axe. He has not spoken of it since.',
      silent: 'Korr turned his back on Thal\'s echo and let it fade unsung. He calls it mercy. He does not sound sure.',
    },
  },
  {
    id: 'cq_brakka', title: 'Steadfast', category: 'companion', giver: 'Brakka Stonevein',
    summary: 'Old Wenna remembers two Hollowmeres. Brakka remembers a hall her clan says fell four hundred years ago. She has a question for the old woman.',
    stages: {
      wenna: { objective: 'Visit Old Wenna\'s cottage on the west lane with Brakka. (Brakka must be in your party.)', journal: 'Brakka wants to ask Old Wenna a question: on the mornings her two memories disagree, which does she believe — and what does she do with the other one?' },
      tower: { objective: 'Search the rubble of the fallen bell tower, at the west end of the cathedral, for a mason\'s mark.', journal: 'In Wenna\'s other life — the one where the tower stood — a dwarf mason named Fenrik rehung the bell the year she married. Brakka knew a Fenrik. He carved the honour-stones of Hall Ostrem.' },
    },
    clues: {
      mason: 'In Wenna\'s other life a dwarf mason named Fenrik, "from a hall with a name like a sneeze," rehung the bell sixty-five years ago and left his mark on the third landing.',
      stone: 'In the bell-tower rubble lies a block that does not belong: dwarf-dressed mountain granite, a season\'s moss, and Fenrik\'s honour-rune — STEADDFAST, with two d\'s.',
    },
    outcomes: {
      wrote: 'Brakka sent a rubbing of Fenrik\'s rune to Kharn Dovrek. Her clan will have to look at it, whatever they decide it means.',
      carried: 'Brakka carries Fenrik\'s honour-stone on her back. However far home turns out to be.',
      kept: 'Brakka left Fenrik\'s stone where it lay, under a fern, until she knows what it proves.',
      lost: 'Fenrik\'s stone fell into the tower shaft and is gone. You saw it first. Brakka says that is enough to start a clan.',
    },
  },
  {
    id: 'cq_vaelis', title: 'An Instrument of His Own Design', category: 'companion', giver: 'Vaelis Thorne',
    summary: 'Since the fog lifted, Vaelis\'s resonance gauge has pointed steadily at the cathedral. "Something of mine is down there," he says, "and I don\'t remember leaving it."',
    stages: {
      gauge: { objective: 'Follow Vaelis\'s gauge into the undercroft, to the antechamber before the vault door. (Vaelis must be in your party.)', journal: 'Vaelis\'s brass gauge has stopped trembling and started pointing — north, at the cathedral, "like a dog that has smelled something it knows."' },
      case: { objective: 'Decide what to do with the Conclave field-case and what is inside it.', journal: 'A Seeker\'s field-case, left behind in the vault antechamber. Its ward-clasp is a design Vaelis drew on a napkin forty years ago.' },
    },
    clues: {
      fieldcase: 'The Conclave\'s lodestone that tracks the Heart is built on copies of a notebook in Vaelis\'s handwriting.',
      note: 'A note in the field-case, in a small upright hand: "V. — The proof was never finished. Neither were you. The door is open. — S."',
    },
    outcomes: {
      burned: 'Vaelis burned the Conclave\'s copies of his work, and the lodestone with them, reading every page before it went.',
      kept: 'Vaelis kept his old pages, and gave you the Seeker\'s lodestone to carry. "If I hold it too long I\'ll start improving it."',
      turned: 'You and Vaelis recalibrated the Seeker\'s lodestone to point at a turnip field in the Westmarch. Somewhere a Seeker is digging.',
      pinged: 'Your attempt to turn the lodestone made it sing out instead. Somewhere, a Seeker\'s needle just swung toward Hollowmere.',
    },
  },
  {
    id: 'cq_seris', title: 'Sealed Orders', category: 'companion', giver: 'Seris Dawnbound',
    summary: 'Seris was sent to judge whether Hollowmere is tainted. Her orders are sealed, to be opened only if it is. The Order\'s rider is waiting for her verdict.',
    stages: {
      survey: { objective: 'Walk Hollowmere with Seris: see the weaver by the square\'s trough and the children at the old well. (Seris must be in your party.)', journal: 'The fog has lifted and a rider of the Last Dawn waits under the Lantern Tree. Seris will judge the town "once, with my feet." She asked for a second pair of eyes. She asked for yours.' },
      verdict: { objective: 'Go with Seris to the Order\'s rider by the Lantern Tree and help her give her verdict.', journal: 'Seris has seen what there is to see. "Tell me where the rot is," she said. "I cannot find it."' },
    },
    clues: {
      weaver: 'Hesper Tull woke beside a stranger who knew how she takes her tea. She is starting again with him, introductions and all.',
      well: 'Children at the old well leave a place in their games for a playmate none of them can name.',
    },
    outcomes: {
      condemned: 'Seris judged Hollowmere tainted and opened her orders: interdict, "gathering" of the afflicted, and the burning of Saint Orlen\'s. The rider carried them south.',
      warded: 'Seris invoked the old Lantern Clause and took tainted Hollowmere under her own lamp. Any judgment on the town falls on her.',
      questioned: 'Seris pleaded for Hollowmere without the law to back her. The rider carried her plea south — and a note about her irregular conduct.',
      spared: 'Seris told her Order Hollowmere was clean and returned her orders unopened. It was the first lie of her life.',
    },
  },
  {
    id: 'cq_nima', title: 'The Voice in the Crackle', category: 'companion', giver: 'Nima Emberglass',
    summary: 'The voice in Nima\'s flames — her own voice, only older — has finally said something useful: "The vault\'s still warm, little spark. Go and drink."',
    stages: {
      whisper: { objective: 'Go down to the Anchor vault beneath the cathedral with Nima, to the dais where the Heart rested. (Nima must be in your party.)', journal: 'Nima\'s fire talked. It told her to go to the vault, where residual Aether still pools above the empty pedestal, and "drink." She wants to talk back. She wants you there when she does.' },
      experiment: { objective: 'Help Nima decide how — or whether — to answer the voice in her fire.', journal: 'Above the Heart\'s empty pedestal the air still shimmers. In Nima\'s palm, a white-gold flame speaks in her own voice, forty years older and fond.' },
    },
    clues: {
      crown: 'The voice in Nima\'s fire spoke of a crown, and of people kneeling "in rows, like glass."',
    },
    outcomes: {
      spoke: 'Nima talked to the voice in her fire while you held on. It told her she would be magnificent. It sounded proud of her, and that was the worst part.',
      contained: 'Nima answered the voice from inside a chalk circle. She heard one word through the wall: "crown."',
      flared: 'The Aether flared and Nima\'s fire made burning glass people who walked like the night her family\'s glassworks burned.',
      refused: 'You told Nima to walk away from the voice. She was furious. She did it anyway.',
    },
  },
  {
    id: 'cq_ilyra', title: 'What the Water Gave Back', category: 'companion', giver: 'Ilyra Voss',
    summary: 'A man walked out of the fog at dawn, soaking wet, and sat down by Thorn\'s Mill. He says he is Coll Thorn. Coll Thorn drowned in that mill-race nine years ago.',
    stages: {
      mill: { objective: 'Find the drenched man by the mill-race at Thorn\'s Mill, in the north-east of town. (Ilyra must be in your party.)', journal: 'Tobin says the stranger asked for "a priest who isn\'t afraid of the drowned." Ilyra wants to go to him, and wants you with her.' },
      abel: { objective: 'Speak to Abel Thorn at the mill door about the brother he buried.', journal: 'Coll Thorn remembers drowning, and remembers not drowning: a wife in Ashenford, a daughter called Posy. Both lives are tearing at him. He asked Ilyra to let him go back to the water "gently." She asked him for one day.' },
      choice: { objective: 'Return to Coll by the mill-race and decide, with Ilyra, what to offer him.', journal: 'Whatever Abel said, Coll is still by the water. Ilyra needs your help to choose.' },
    },
    clues: {
      posy: 'In his other life Coll Thorn never drowned. He married Brannagh in Ashenford and taught his daughter Posy to whistle.',
    },
    outcomes: {
      stayed: 'Coll Thorn stayed in Hollowmere with his brother Abel. The water still drips from his hands, but slower.',
      sought: 'Coll Thorn took the coach to Ashenford to learn whether Brannagh and Posy are real, with Ilyra\'s hospice in Solmara written on a page in his pocket.',
      vigil: 'Ilyra sat with Coll Thorn all night by the mill-race. In the morning he was asleep and alive. "He asked me for something," she said. "I have given it before. Not tonight."',
    },
  },
  {
    id: 'cq_varek', title: 'What the Choir Asks', category: 'companion', giver: 'Varek Sable',
    summary: 'Varek\'s patron, the Choir, has never asked him for anything. They take, or they give. Tonight they asked.',
    stages: {
      threshold: { objective: 'Go with Varek to the sealed vault door in the undercroft, where the Choir sings loudest. (Varek must be in your party.)', journal: 'The Choir has grown quieter since you touched the Heart — "quieter, and closer, like a crowd near enough to whisper." Now they want Varek at the threshold of the vault.' },
      bargain: { objective: 'Help Varek answer the Choir\'s bargain.', journal: 'The Choir wants a name to keep, "the way you\'d press a flower in a book." In return: a verse of their voice in his. They want Isel — his mother\'s name, the only thing he has left of her.' },
    },
    clues: {
      answer: 'Asked what they are, the Choir answered with a thousand voices: "We were. We are many. We are so quiet. We are waiting for the door."',
    },
    outcomes: {
      bargained: 'Varek gave the Choir his mother\'s name. He is harder to erase now. He no longer remembers what her name was.',
      refused: 'Varek told the Choir no for the first time in twelve years. They sighed, and waited. They will ask again.',
      halric: 'Varek offered the Choir the name of Halric Venn, the bell-ringer. They took it gladly, as if they had been expecting him.',
    },
  },
  {
    id: 'cq_tessa', title: 'The Bell\'s Lost Verse', category: 'companion', giver: 'Tessa Quickthorn',
    summary: 'The bell that rang at midnight played a song from Tessa\'s book of songs with no origin — including a verse she has never had.',
    stages: {
      lio: { objective: 'Find Lio Fenwick at the Lantern & Lamb with Tessa and rebuild the missing verse. (Tessa must be in your party.)', journal: 'Tessa has the bell\'s tune in her songbook, full of holes. Lio Fenwick hums the holes when he thinks nobody is listening.' },
      tower: { objective: 'Take the rebuilt verse to the foot of the fallen bell tower at the cathedral\'s west end.', journal: 'Lio\'s grandmother learned the song from the bell itself. She said you should never sing all of it "where the bell can hear." Tessa means to sing it where the bell was.' },
    },
    clues: {
      gran: 'Lio\'s grandmother\'s grandmother learned the bell\'s song from Orlen\'s Voice itself, before the tower fell: "ring for the ones who are lost in the grey, ring them back, ring them home."',
    },
    outcomes: {
      sung: 'Tessa sang the bell\'s verse whole at the fallen tower. For a heartbeat the tower stood, and a young monk waved down from the top. It was not quiet afterwards.',
      torn: 'One note of the verse was wrong, and the fog came through it. You closed the tear together. Tessa did not explain what she meant by "before."',
      half: 'Tessa sang only half the verse. Something behind the stones knows the tune now, and is waiting.',
      unsung: 'Tessa wrote the verse down and closed the book. "Last time," she said, "nobody told me not to."',
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ KAEL

const KAEL: DialogueTree[] = [
  {
    id: 'cq_kael_start',
    title: 'A personal matter: Kael',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "Morning light comes through the inn's warped glass in long yellow bars. Kael is sitting on the windowsill again, but for once the folded paper isn't vanishing as you come in. He's holding it out between two fingers, like a card he has decided to stop palming.",
        next: 'offer',
      },
      offer: {
        speaker: 'comp:kael',
        text: "“Found it in my boot this morning. My boot, which I was wearing. Whoever delivers these has either very soft hands or a very strange sense of humour.” He waggles the paper. “I've been pretending you didn't see me hide this for days. Shall we stop pretending? It's exhausting. I'm only good at it for money.”",
        options: [
          { text: "Show me.", tone: 'friendly', tags: ['honesty'], effects: ['quest cq_kael drop', 'rel kael trust 2'], next: 'letter' },
          { text: "Only if you want to, Kael.", tone: 'compassionate', tags: ['mercy'], effects: ['quest cq_kael drop', 'rel kael affection 3'], next: 'letter' },
          { text: "Not now. Keep it a little longer.", tone: 'leave', next: 'later' },
        ],
      },
      later: {
        speaker: 'comp:kael',
        text: "“Right. Yes. Later.” The paper vanishes. “It says ‘before noon,’ for what it's worth. It never says which noon. That's the part that keeps me up.”",
        end: true,
      },
      letter: {
        speaker: 'dm',
        text: "Plain paper, no seal, no signature. The hand is neat and utterly characterless, the way a ledger is. It says: The bearer. Everything. Under the capstone by the hall, before noon. Remember the house.",
        interjections: [
          { who: 'seris', text: "Seris has gone very still. “You are an informant,” she says. It is not a question." },
          { who: 'tessa', text: "Tessa reads it over your shoulder and stops humming. “‘Remember the house,’” she says softly. “That's not a signature. That's a threat wearing a signature's coat.”" },
        ],
        next: 'letter2',
      },
      letter2: {
        speaker: 'comp:kael',
        text: [
          { if: 'comp:seris', text: "“I'm a lot of things before breakfast, Dawnbound.” He doesn't look at her. He looks at you. “The bearer's you, obviously. ‘The house’ is a house. In Ashenford. Leaky roof, a great many children. Someone in Solmara bought up the paper on it, and every so often I get a letter, and I answer it, and the roof stays on.”" },
          { text: "“The bearer's you, obviously.” He doesn't look away. “‘The house’ is a house. In Ashenford. Leaky roof, a great many children. Someone in Solmara bought up the paper on it, and every so often I get a letter, and I answer it, and the roof stays on.”" },
        ],
        interjections: [
          { who: 'brakka', text: "Brakka's jaw works. “Debts held over a roof full of bairns,” she says. “That's not a leash, lad. That's a hostage.”" },
          { who: 'varek', text: "Varek, from his corner, without opening his eyes: “Everyone owes someone. Some of us at least get to choose who.”" },
        ],
        options: [
          { text: "Who's holding the leash, Kael?", tone: 'curious', tags: ['curiosity'], next: 'who' },
          { text: "(Investigation) Look at how the letter is folded.", tone: 'curious', check: { skill: 'investigation', dc: 13 }, success: 'fold_s', failure: 'fold_f' },
          { text: "You've been reporting on me. Since when?", tone: 'aggressive', tags: ['honesty'], effects: ['rel kael trust -1'], next: 'since' },
        ],
      },
      who: {
        speaker: 'comp:kael',
        text: "“Never met him. Met his letters. I don't even know it's a him; I just know it's someone who writes like a tax.” He turns the paper over. “That's the honest answer. I have about four of those a year and you've had two this morning. Pace yourself.”",
        next: 'plan',
      },
      fold_s: {
        speaker: 'dm',
        text: "The fold is a dispatch knot: three tucks and a turn, so the letter cannot be opened and closed again without the creases showing. You've seen it on Iron Covenant road-post. So has Kael, judging by his face.",
        effects: ['clue cq_kael knot', 'set kael_covenant_hint'],
        next: 'fold_s2',
      },
      fold_s2: {
        speaker: 'comp:kael',
        text: "“The Covenant.” He says it softly, the way you'd name a disease. “Of course. Iron people love a tidy fold.” He stares at the paper as if it has bitten him. “I didn't know. I want you to know I didn't know.” A flicker of the grin. “I'd have charged more.”",
        next: 'plan',
      },
      fold_f: {
        speaker: 'dm',
        text: "It's paper, folded small. You turn it over and over until Kael gently takes it back. “It doesn't do tricks,” he says. “Believe me. I've asked.”",
        next: 'plan',
      },
      since: {
        speaker: 'comp:kael',
        text: "“Since the festival. Since you walked into the Lantern & Lamb looking like trouble with a good haircut.” The grin flickers. “I've sent one letter. It said you tipped well. That one was even true.”",
        next: 'plan',
      },
      plan: {
        speaker: 'comp:kael',
        text: "“So here's my problem. If nothing goes under that stone, the house pays. If the wrong thing goes under that stone, the house pays later, with interest.” He hops off the sill. “I'd like company when I decide what to write. And I'd like to see whose hand comes to collect it. Come with me?”",
        options: [
          { text: "Let's go. Town hall, before noon.", tone: 'friendly', tags: ['protect'], effects: ['rel kael trust 2'], end: true },
          { text: "I'm coming. But no more secrets about this.", tone: 'diplomatic', tags: ['honesty'], effects: ['rel kael respect 2'], next: 'promise' },
        ],
      },
      promise: {
        speaker: 'comp:kael',
        text: "“No more secrets about this,” he repeats, very precisely. “About this. Done.” You notice the careful little fence around the words. So does he; he winks, to show you he knows you noticed.",
        end: true,
      },
    },
  },
  {
    id: 'cq_kael_drop',
    title: 'The Mounting-Block',
    start: [{ if: 'quest:cq_kael=drop', node: 'start' }, { node: 'waiting' }],
    nodes: {
      waiting: {
        speaker: 'dm',
        text: "The capstone sits snug. Kael's report lies underneath it. “Don't loiter by it,” Kael murmurs. “Loiter near it. There's an art.”",
        end: true,
      },
      start: {
        speaker: 'dm',
        text: "The mounting-block outside the town hall is a squat stone step, worn into a saddle shape by two hundred years of boots. Kael leans on it like a man waiting for a friend and taps the capstone twice with his heel. It rocks. Underneath is a hollow lined with oilcloth. Empty. He produces a blank sheet, a stub of pencil and an expression of profound reluctance.",
        next: 'decide',
      },
      decide: {
        speaker: 'comp:kael',
        decision: true,
        text: "“Right. Three kinds of letter.” He ticks them off. “The true one: you, the Heart, what you did down there, all of it. The useful lie: a lucky traveller, nothing special, stop wasting ink. Or nothing at all, and let the silence do the talking.” He clicks the pencil against his teeth. “Your life. Your call. Mostly.”",
        interjections: [
          { who: 'seris', text: "“If you put a lie to paper,” Seris says quietly, “you will have to remember it forever. The truth you are allowed to forget.”" },
          { who: 'nima', text: "“Draw him a rude picture,” Nima suggests. “Nobody's ever ready for a rude picture.”" },
          { who: 'vaelis', text: "“Whoever reads it will be clever,” Vaelis says. “Write for a clever reader. Bore them cleverly.”" },
        ],
        options: [
          { text: "Write the truth. I'd rather be watched honestly than hunted on a rumour.", tone: 'diplomatic', tags: ['honesty', 'boldness'], effects: ['set cq_kael_letter honest'], next: 'w_true' },
          { text: "(Deception) Lie for me. Make me boring.", tone: 'deceptive', tags: ['deception', 'protect'], check: { skill: 'deception', dc: 14, advIf: 'comp:varek || comp:tessa' }, successEffects: ['set cq_kael_letter lie'], success: 'w_lie', failure: 'w_lie_bad' },
          { text: "Leave the stone empty. Let him wonder.", tone: 'aggressive', tags: ['defiance'], effects: ['set cq_kael_letter empty'], next: 'w_empty' },
          { text: "You write it, Kael. It's your house on the line.", tone: 'compassionate', tags: ['mercy'], effects: ['set cq_kael_letter lie', 'rel kael trust 4'], next: 'w_his' },
        ],
      },
      w_true: {
        speaker: 'dm',
        text: "Kael writes for a long time, tongue between his teeth. He shows you the finished page without being asked. It is accurate, unsparing, and in places almost admiring. At the bottom he has added one line: The bearer knows about this letter. “Last line's mine,” he says. “If he's going to watch you, he can watch you know it.”",
        effects: ['rel kael respect 3'],
        next: 'placed',
      },
      w_lie: {
        speaker: 'dm',
        text: "Between you, you build a masterpiece of tedium: a traveller of no account who wandered into a cellar, got lucky with a bell, and spends most evenings complaining about the cider. Kael reads it back and nods, impressed despite himself. “I'd stop reading halfway. That's the highest praise I have.”",
        next: 'placed',
      },
      w_lie_bad: {
        speaker: 'dm',
        text: "The lie goes onto the paper and dies there. Every sentence is a little too smooth, a little too eager to be believed. Kael reads it twice and winces. “He'll smell this from Solmara. He'll know someone sat beside me while I wrote it.”",
        options: [
          { text: "Send it anyway. A bad lie is still a lie he has to check.", tone: 'pragmatic', tags: ['boldness'], effects: ['set cq_kael_letter lie', 'set cq_kael_lie_weak'], next: 'placed' },
          { text: "Tear it up. Write the truth instead.", tone: 'diplomatic', tags: ['honesty'], effects: ['set cq_kael_letter honest'], next: 'w_true' },
          { text: "Tear it up. Leave the stone empty.", tone: 'aggressive', tags: ['defiance'], effects: ['set cq_kael_letter empty'], next: 'w_empty' },
        ],
      },
      w_empty: {
        speaker: 'comp:kael',
        text: "Kael looks at the empty hollow for a long moment. “Silence is a message too,” he says. “He'll read it as ‘Kael's gone soft,’ or ‘Kael's gone over.’” He slides the capstone back with a gritty scrape. “Both true, probably. Huh.”",
        effects: ['rel kael trust 2'],
        next: 'placed',
      },
      w_his: {
        speaker: 'comp:kael',
        text: "Kael stares at you. Then at the paper. “That's—” He stops. “Nobody hands me the pencil.” He writes quickly, fluently, a dull little report about a dull little traveller, and he doesn't show it to you. “It's a lie,” he says. “A good one. The one thing I'd trust me with.”",
        next: 'placed',
      },
      placed: {
        speaker: 'dm',
        text: [
          { if: 'cq_kael_letter=empty', text: "The capstone goes back over an empty hollow, and Kael settles on the town hall steps with his hat tipped over his eyes, the very picture of a man with nowhere to be. “Nothing under the stone,” he murmurs. “Let's see who's disappointed.” You don't have to wait long. Within a quarter of an hour, someone small comes up the lane with a tray." },
          { text: "The page goes under the stone, the capstone goes back with a gritty scrape, and Kael settles on the town hall steps with his hat tipped over his eyes, the very picture of a man with nowhere to be. “Now,” he murmurs, “we see whose hand comes for it.” You don't have to wait long. Within a quarter of an hour, someone small comes up the lane with a tray." },
        ],
        effects: ['quest cq_kael watch', 'time 15'],
        end: true,
      },
    },
  },
  {
    id: 'cq_kael_mira',
    title: 'The Courier',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: 'cq_kael_letter=empty', text: "It's Mira, the lantern-seller: twelve years old, a tray of unsold paper lanterns on a strap round her neck. She lifts the capstone with the ease of long practice, frowns into the empty hollow — and turns straight into Kael, who has somehow arrived without crossing the street." },
          { text: "It's Mira, the lantern-seller: twelve years old, a tray of unsold paper lanterns on a strap round her neck. She lifts the capstone with the ease of long practice, tucks the folded page between two lanterns — and turns straight into Kael, who has somehow arrived without crossing the street." },
        ],
        next: 'kael1',
      },
      kael1: {
        speaker: 'comp:kael',
        text: "Kael's face does something you have never seen it do. It goes blank. Not the grin, not the mask. Nothing at all. “Oh,” he says. “Oh, no.” Then, very gently: “How long have you been doing this, sweetheart?”",
        next: 'mira1',
      },
      mira1: {
        speaker: 'mira',
        text: "“Doing what? I'm selling lanterns.” Her chin comes up. “Festival's over, they're half price. That's a bargain. You look like a man who needs a lantern.”",
        options: [
          { text: "(Persuasion) “Nobody's in trouble, Mira. Who pays you to carry these?”", tone: 'diplomatic', tags: ['diplomacy'], check: { skill: 'persuasion', dc: 13, advIf: 'comp:tessa || bg:entertainer' }, success: 'mira_talk', failure: 'mira_runs' },
          { text: "(Intimidation) “The truth. Now.”", tone: 'aggressive', tags: ['authority'], check: { skill: 'intimidation', dc: 12 }, successEffects: ['rel kael affection -3'], success: 'mira_scared', failure: 'mira_runs' },
          { text: "Buy a lantern. Full price.", if: 'gold>=1', tone: 'friendly', tags: ['charity', 'humor'], effects: ['gold -1'], next: 'mira_lantern' },
        ],
      },
      mira_lantern: {
        speaker: 'mira',
        text: "“Pleasure doing business.” She bites the coin, then counts it twice. Then, as if paying you back in kind: “It's a job, all right? A real one. I'm a courier.”",
        effects: ['rel kael affection 2'],
        next: 'mira_talk',
      },
      mira_scared: {
        speaker: 'dm',
        text: "Mira goes pale under her freckles and tells you everything in one breathless rush, the tray rattling against her ribs. Kael doesn't look at you while she talks.",
        next: 'mira_talk',
      },
      mira_talk: {
        speaker: 'mira',
        text: "“A man at the coaching house. Grey coat, ever so polite, never eats anything. He gives me a copper for every letter from the stone, and I give them to the Solmara coach at noon. He says I've got a gift for it.” She brightens. “He says one day I could work for real people. In Solmara.”",
        effects: ['clue cq_kael mira'],
        next: 'kael2',
      },
      mira_runs: {
        speaker: 'dm',
        text: "Mira is twelve and has been dodging grown-ups since she could walk. One look at your face and she's gone — tray, lanterns and all, a flash of patched skirt round the corner of the town hall. Kael watches her go. “Fast,” he says, almost proudly. Then, not proudly at all: “I was faster.”",
        effects: ['set cq_kael_mira fled'],
        next: 'resolve',
      },
      kael2: {
        speaker: 'comp:kael',
        decision: true,
        text: "Kael crouches until he's at her eye level. For a moment he says nothing at all. “Real people,” he repeats. “Yeah. That's what they told me, too.” He looks up at you, and the look is naked. “She's me. She's me at nine with a copper in her fist and no idea what she's carrying. Tell me what to do. Quick, before I do something sentimental.”",
        options: [
          { text: "Pay her double to bring his letters to us first.", if: 'gold>=5', lockedText: "You haven't the coin to outbid him.", tone: 'pragmatic', tags: ['pragmatic', 'stealth'], effects: ['gold -5', 'set cq_kael_mira informant'], next: 'mira_informant' },
          { text: "Tell her who she's really working for, and get her out.", tone: 'compassionate', tags: ['protect', 'honesty'], effects: ['set cq_kael_mira freed'], next: 'mira_freed' },
          { text: "Let her be. She's got a job. It isn't ours to take.", tone: 'pragmatic', tags: ['pragmatic'], effects: ['set cq_kael_mira left', 'rel kael affection -2'], next: 'mira_left' },
        ],
      },
      mira_informant: {
        speaker: 'dm',
        text: "Mira's eyes go round at the silver. “Double? For reading them first?” “For showing them to us first,” Kael corrects. “Reading costs extra, and you can't afford the lessons.” She spits in her palm and holds it out. He shakes it gravely. As she trots off he mutters, “Turning his courier. That's very me, actually. I hate it.”",
        effects: ['rel kael respect 2'],
        next: 'resolve',
      },
      mira_freed: {
        speaker: 'comp:kael',
        text: [
          { if: 'cq_kael_letter=empty', text: "Kael empties his pockets into her tray: silver, a ring that isn't his, a surprising quantity of buttons. Everything but one coin. “The man in the grey coat uses children because nobody looks at children,” he tells her. “Stop carrying for him. Carry lanterns. Sell them for full price.” Mira looks at the money, and at him, and something old and wary crosses her face. “There wasn't even a letter,” she says. “Then I'm done. Easy.”" },
          { text: "Kael empties his pockets into her tray: silver, a ring that isn't his, a surprising quantity of buttons. Everything but one coin. “The man in the grey coat uses children because nobody looks at children,” he tells her. “Stop carrying for him. Carry lanterns. Sell them for full price.” Mira looks at the money, and at him, and something old and wary crosses her face. She holds up the folded page. “Last one,” she says. “Then I'm done.”" },
        ],
        effects: ['rel kael affection 4', 'memory kael 3 You helped me get a kid out of the game before it had her.'],
        next: 'resolve',
      },
      mira_left: {
        speaker: 'comp:kael',
        text: "“Right,” Kael says. “Right. Not ours.” He straightens. Mira trots off toward the coaching house, humming. Kael watches her the whole way, and his hand keeps going to the coin in his pocket and not taking it out.",
        next: 'resolve',
      },
      resolve: {
        speaker: 'comp:kael',
        text: "Kael stands looking down the empty lane for a while, hands in his pockets. Then he turns back to you.",
        options: [
          { text: "Well?", if: 'cq_kael_letter=honest', tone: 'friendly', next: 'end_honest' },
          { text: "Well?", if: 'cq_kael_letter=lie', tone: 'friendly', next: 'end_false' },
          { text: "Well?", if: 'cq_kael_letter!=honest && cq_kael_letter!=lie', tone: 'friendly', next: 'end_empty' },
        ],
      },
      end_honest: {
        speaker: 'comp:kael',
        text: "“So now you know what I am. Informant. Reported, past tense. Probably.” He takes your hand, turns it palm-up and puts his walking coin in it: the silver one that's always crossing his knuckles. “Hold that. If I ever stop being worth trusting, spend it. It's my last one.” A crooked smile. “Don't spend it on cider.”",
        effects: ['complete cq_kael honest', 'set cq_kael_outcome honest', 'xp 150', 'give cq_kael_coin', 'rel kael trust 6', 'rel kael respect 2', 'rep covenant 2', 'memory kael 2 You sat with me while I told him the truth about you.'],
        end: true,
      },
      end_false: {
        speaker: 'comp:kael',
        text: [
          { if: 'cq_kael_lie_weak', text: "“He'll read it and frown, and wonder who was sitting beside me.” Kael shrugs, a little too loosely. “Then he'll send another letter, and I'll lie again, better. For you.” He sounds startled by the words. He takes your hand and puts his walking coin in it: the silver one that's always crossing his knuckles. “Hold that. If I ever stop being worth trusting, spend it. It's my last one.”" },
          { text: "“He'll read it, yawn, and send me another in a month. And I'll lie again. For you.” He sounds startled by the words. He takes your hand and puts his walking coin in it: the silver one that's always crossing his knuckles. “Hold that. If I ever stop being worth trusting, spend it. It's my last one.”" },
        ],
        effects: ['complete cq_kael lied', 'set cq_kael_outcome lied', 'xp 150', 'give cq_kael_coin', 'rel kael trust 5', 'rel kael affection 3', 'memory kael 2 You let me lie for you to the man who owns Wren House\'s paper.'],
        end: true,
      },
      end_empty: {
        speaker: 'comp:kael',
        text: "“Nothing under the stone. He'll notice by the end of the week.” Kael laughs, shakily. “And then he sends someone who isn't twelve.” He takes your hand and puts his walking coin in it: the silver one that's always crossing his knuckles. “Hold that. If I ever stop being worth trusting, spend it. It's my last one.” He looks at it in your palm. “Nobody's ever told me to just... stop.”",
        effects: ['complete cq_kael empty', 'set cq_kael_outcome empty', 'xp 150', 'give cq_kael_coin', 'rel kael trust 4', 'rel kael respect 4', 'rep covenant -3', 'memory kael 2 You told me to leave the stone empty. Nobody ever told me to stop before.'],
        end: true,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ ORREN

const ORREN: DialogueTree[] = [
  {
    id: 'cq_orren_start',
    title: 'A personal matter: Orren',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: 'prologue_complete', text: "Orren sits cross-legged by the window with the half-finished owl in his lap. He isn't carving it. On the sill in front of him an acorn is moving: rolling, very slowly, across the warped wood toward the glass, toward the square, toward the Lantern Tree. When it reaches the frame, Orren picks it up and sets it back at the start. It begins again." },
          { text: "The fog presses grey against the shutters. Orren sits cross-legged on the floor with the half-finished owl in his lap, not carving it. On the sill an acorn is rolling, very slowly and quite uphill, toward the shutter that faces the square. When it reaches the frame, Orren picks it up and sets it back at the start. It begins again." },
        ],
        next: 'orren1',
      },
      orren1: {
        speaker: 'comp:orren',
        text: "“Since the bell,” he says, without looking up. “It walks. Always the same way.” He sets it down. You watch it begin to roll. “Toward the tree in the square.”",
        interjections: [
          { who: 'vaelis', text: "Vaelis has risen halfway out of his chair. “Orren. That acorn is rolling uphill. May I—” “No,” says Orren." },
          { who: 'nima', text: "“It's adorable,” Nima whispers. “It's like a puppy. A wooden puppy. Can I name it?” Orren considers this seriously. “No.”" },
        ],
        options: [
          { text: "What is it, Orren?", tone: 'curious', tags: ['curiosity'], next: 'what' },
          { text: "Then let's follow it.", tone: 'friendly', tags: ['nature'], effects: ['quest cq_orren listen', 'rel orren trust 2'], next: 'follow' },
          { text: "Not now. Keep it safe.", tone: 'leave', tags: ['caution'], next: 'later' },
        ],
      },
      what: {
        speaker: 'comp:orren',
        text: "Orren is quiet so long the acorn reaches the window frame again. “An acorn,” he says at last. Then, because you're still looking at him: “Old. Grandmother's. Her grandmother's.” He sets it back at the start of the sill. “Older than that.”",
        options: [
          { text: "Let's follow it, then.", tone: 'friendly', tags: ['nature'], effects: ['quest cq_orren listen', 'rel orren trust 2'], next: 'follow' },
          { text: "Not now.", tone: 'leave', next: 'later' },
        ],
      },
      later: {
        speaker: 'comp:orren',
        text: "“Hm.” He pockets the acorn. Through the cloth you can see it straining, very gently, toward the window.",
        end: true,
      },
      follow: {
        speaker: 'comp:orren',
        text: "“Grandmother said: when a seed starts walking, follow. Quietly.” He tucks the acorn away, and his hand stays over the pocket. “Quietly,” he repeats, and looks round at the party, longest at whoever talks most.",
        end: true,
      },
    },
  },
  {
    id: 'cq_orren_tree',
    title: 'The Lantern Tree\'s Roots',
    start: [{ if: 'quest:cq_orren=listen', node: 'start' }, { node: 'done' }],
    nodes: {
      done: {
        speaker: 'dm',
        text: "The Lantern Tree's roots heave the cobbles in long ridges. Somewhere far beneath them, something is still listening.",
        end: true,
      },
      start: {
        speaker: 'dm',
        text: [
          { if: 'prologue_complete', text: "By daylight the Lantern Tree is ordinary and enormous: an old oak hung with the paper ghosts of last night's lanterns, its roots buckling the cobbles of the square in long ridges, like a sleeper's arm under a blanket. Orren kneels where the ridges are highest and lays his palm flat on the stone. In his other hand the acorn has gone warm enough to steam." },
          { text: "In the fog the Lantern Tree is a dim golden shape, its lanterns hanging like drowned moons. Its roots buckle the cobbles of the square in long ridges, like a sleeper's arm under a blanket. Orren kneels where the ridges are highest and lays his palm flat on the stone. In his other hand the acorn has gone warm enough to steam in the cold." },
        ],
        next: 'listen',
      },
      listen: {
        speaker: 'comp:orren',
        text: "“Listen with me.” He doesn't explain how.",
        options: [
          { text: "(Nature) Lay your hand beside his and listen the way he does.", tone: 'curious', tags: ['nature'], check: { skill: 'nature', dc: 13, advIf: 'class:ranger || class:druid' }, success: 'heard', failure: 'not_heard' },
          { text: "[Resonance] Let the Heart listen for you. (Spend 1 Resonance)", if: 'resunlocked && res>=1', tone: 'resonance', effects: ['res -1'], next: 'res_heard' },
          { text: "Keep watch over him while he listens.", tone: 'pragmatic', tags: ['protect'], next: 'watch' },
        ],
      },
      heard: {
        speaker: 'dm',
        text: "At first only the square: a cart, a gull, someone sweeping glass. Then, under your palm, slower than any heartbeat, a pulse. It goes down — not ten feet, not forty, but down past where any oak's roots should end, through clay and old stone, toward something under the hill. And something down there pulses back.",
        effects: ['clue cq_orren roots', 'quest cq_orren roots'],
        next: 'below',
      },
      res_heard: {
        speaker: 'dm',
        text: "For a breath the square is gone. In its place: forest. Not this forest, not any forest you know — trunks as wide as houses, the Lantern Tree a sapling among them, and under everything one root older than the rest, running north and down. Then it's cobbles again, and Orren is looking at you with his head on one side.",
        effects: ['clue cq_orren roots', 'quest cq_orren roots', 'rel orren respect 2'],
        next: 'below',
      },
      watch: {
        speaker: 'dm',
        text: "You stand over him with your back to the tree, watching the square, and that seems to be exactly what he needed. After a long time he opens his eyes.",
        effects: ['quest cq_orren roots', 'rel orren trust 2'],
        next: 'below',
      },
      not_heard: {
        speaker: 'dm',
        text: "You hear the square. A cart. A gull. Your own pulse in your palm, which is not the same thing at all. Beside you Orren has gone rigid, eyes closed, lips moving. When at last he takes his hand away there is a print of frost on the stone where it lay, though the air is mild. “It heard me,” he says, too quietly. “I wanted to hear it. It heard me first.”",
        effects: ['set cq_orren_noticed', 'clue cq_orren roots', 'quest cq_orren roots'],
        next: 'below',
      },
      below: {
        speaker: 'comp:orren',
        text: [
          { if: 'visited:undercroft', text: "“Down,” he says. “Under the cathedral. The old chapel, where the girl was singing.” He stands and dusts his knees. “The roots go there. So do we.”" },
          { text: "“Down,” he says. “Under the cathedral. Far under.” He stands and dusts his knees. “The roots go there. So do we.”" },
        ],
        end: true,
      },
    },
  },
  {
    id: 'cq_orren_roots',
    title: 'Roots in the Chapel',
    start: [{ if: 'quest:cq_orren=roots', node: 'start' }, { node: 'idle' }],
    nodes: {
      idle: {
        speaker: 'dm',
        text: "Pale roots hang through the cracked chapel ceiling, beaded with water. They are very still.",
        end: true,
      },
      start: {
        speaker: 'dm',
        text: [
          { if: 'cq_orren_noticed', text: "In the chapel's far corner the vaulted ceiling has split, and through the split hang roots: pale as tallow candles, thick as your arm, beaded with water. They should not be here; the Lantern Tree stands three hundred yards away and forty feet up. Orren takes the acorn out of his pocket — and the roots don't lean toward the acorn. They lean toward him. One curls around his wrist like a child's fingers, and holds on." },
          { text: "In the chapel's far corner the vaulted ceiling has split, and through the split hang roots: pale as tallow candles, thick as your arm, beaded with water. They should not be here; the Lantern Tree stands three hundred yards away and forty feet up. Orren takes the acorn out of his pocket, and every root in the corner leans toward it, slowly, the way sleepers turn toward a warm hand." },
        ],
        next: 'speak',
      },
      speak: {
        speaker: 'comp:orren',
        text: "“They remember it.” His voice is barely there. “The tree that came before trees.”",
        next: 'vision',
      },
      vision: {
        speaker: 'dm',
        text: "For a moment the chapel smells of spring rain and something older: green, enormous, patient. In the acorn's glossy skin you see, very small, a tree whose branches hold up a sky, and a road running between its roots, and on the road a little woman in a path-warden's hood, walking away.",
        effects: ['clue cq_orren vision'],
        next: 'choose',
      },
      choose: {
        speaker: 'comp:orren',
        decision: true,
        text: "“Grandmother said: whoever carries it chooses for it. Never alone, though.” He closes his hand. The roots sigh back toward the ceiling. “So.” He looks at you. “Choose with me.”",
        interjections: [
          { who: 'vaelis', text: "Vaelis is breathing very carefully, like a man near a skittish bird. “If it would help,” he says, “I could take notes. Discreet notes. In cipher.” Orren doesn't answer, which is an answer." },
          { who: 'korr', text: "Korr has put himself between the corner and the chapel door without being asked. He says nothing. He is a door." },
          { who: 'nima', text: "Nima is sitting on both her hands. “I'm not touching it,” she announces to nobody. “I'm being extremely mature.”" },
        ],
        options: [
          { text: "Put it away. Nobody needs to know what it is. Not even me.", tone: 'compassionate', tags: ['caution', 'protect'], next: 'hide' },
          { text: "Tell me what it is, Orren. Whatever it is, I'll keep it.", if: 'trust:orren>=15', tone: 'friendly', tags: ['honesty'], next: 'share_full' },
          { text: "Tell me what it is, Orren. Whatever it is, I'll keep it.", if: 'trust:orren<15', tone: 'friendly', tags: ['honesty'], next: 'share_part' },
          { text: "(Nature) Let it touch the roots. See what it wants.", tone: 'curious', tags: ['curiosity', 'nature', 'boldness'], check: { skill: 'nature', dc: 14, advIf: '!cq_orren_noticed && (class:ranger || class:druid)' }, success: 'test_ok', failure: 'test_bad' },
        ],
      },
      hide: {
        speaker: 'comp:orren',
        text: "Orren's shoulders come down a full inch. “Thank you.” He tucks the acorn deep into the pocket and buttons it. “Most people want to know. You wanted it safe.” He looks up at the roots. “So do they.”",
        effects: ['complete cq_orren hidden', 'set cq_orren_outcome hidden', 'xp 150', 'rel orren trust 6', 'rel orren respect 3', 'memory orren 3 You told me to keep the seed hidden, even from you.'],
        next: 'gift',
      },
      share_full: {
        speaker: 'comp:orren',
        text: "He looks at you for a long moment, the way he'd watch weather. Then he opens his hand. “First Tree,” he says. “Before the Woods. Before the Lights. Before whatever came before. Grandmother said the world was planted once, and this is what's left of the planting.” He closes his hand. “Thornwake would kill for it. The Conclave would cut it open to see how it works. So.” A small, dry smile. “Now you're in trouble too.”",
        effects: ['complete cq_orren shared', 'set cq_orren_outcome shared', 'set orren_first_tree_known', 'xp 150', 'rel orren trust 8', 'rel orren affection 4', 'memory orren 3 I told you what the seed is. You listened, and kept it.'],
        next: 'gift',
      },
      share_part: {
        speaker: 'comp:orren',
        text: "Orren opens his mouth, closes it. “Older than the Woods,” he says finally. “Older than the Lights, maybe. That's what I can say.” He tucks it away. “The rest... when I've known you longer. Not a judgement. A seed doesn't come up the day it's planted.”",
        effects: ['complete cq_orren shared', 'set cq_orren_outcome shared_partly', 'xp 150', 'rel orren trust 4', 'rel orren respect 2', 'memory orren 2 You asked about the seed and accepted half an answer.'],
        next: 'gift',
      },
      test_ok: {
        speaker: 'dm',
        text: "Orren holds the acorn up. The nearest root uncurls and touches it, very lightly, the way you'd touch a sleeping child's cheek. Light runs up the root, green-gold, and is gone into the ceiling. When Orren opens his hand the acorn has split along one side, and from the split a single leaf has unfolded: perfect, tiny, the green of a spring that hasn't happened yet. Far above, faint through forty feet of stone, a cheer goes up in the square.",
        effects: ['set lantern_tree_leafed'],
        next: 'test_ok2',
      },
      test_ok2: {
        speaker: 'comp:orren',
        text: "“It's never done that.” He's smiling, really smiling — and then he isn't. “It's never done that,” he says again, quieter. “Things that are waking get noticed.” He cups the leaf against the cold. “Thank you. I think.”",
        effects: ['complete cq_orren tested', 'set cq_orren_outcome tested', 'xp 175', 'rel orren trust 3', 'rel orren affection 3', 'memory orren 2 You helped me wake the seed. I don\'t know yet whether that was wise.'],
        next: 'gift',
      },
      test_bad: {
        speaker: 'dm',
        text: "The root touches the acorn and does not let go. It tightens, and the others come down out of the dark — slow, then not slow — coiling round Orren's wrist, his forearm, pulling. He sets his heels. You grab him. For one long moment the roots and the party are playing tug-of-war over a halfling, and the roots are winning. Then Orren says something in a language you don't know, quiet and firm, like a man talking to a frightened horse, and they let go all at once. He sits down hard on the chapel floor.",
        effects: ['damage 1d6 bludgeoning', 'set cq_orren_seed_scarred', 'instab 1'],
        next: 'test_bad2',
      },
      test_bad2: {
        speaker: 'comp:orren',
        text: "The acorn in his palm has a thin pale scar across its cap. He looks at it a long time. “It wanted to go home,” he says. “Down. I said not yet.” He closes his fingers over it. “Shouldn't have asked it. That's on me. Not you.” It is, you think, a very kind lie.",
        effects: ['complete cq_orren tested', 'set cq_orren_outcome scarred', 'xp 150', 'rel orren trust 1', 'memory orren -1 We tested the seed, and the roots nearly took it.'],
        next: 'gift',
      },
      gift: {
        speaker: 'dm',
        text: "On the way out Orren stops, picks up a fallen rootlet no longer than his finger, and works it with his knife as he walks. By the stair it's a tiny acorn cap on a knotted cord. He hands it to you without a word. It's warm.",
        effects: ['give cq_orren_charm'],
        end: true,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ KORR

const KORR: DialogueTree[] = [
  {
    id: 'cq_korr_start',
    title: 'A personal matter: Korr',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: 'prologue_complete', text: "Korr is sitting on the edge of the bed with his axe across his knees. He has not slept. The whetstone lies untouched beside him, and the morning light makes the ash-grey of his skin look like cold hearth-stone." },
          { text: "Korr is standing at the shuttered window with his axe in both hands and his head bowed, listening to the fog. Tobin says he has been like that for an hour." },
        ],
        next: 'korr1',
      },
      korr1: {
        speaker: 'comp:korr',
        text: [
          { if: 'prologue_complete', text: "“He called again,” Korr says. “In my sleep, this time. The grey has gone from the streets. Not from me.” His ember eyes find yours. “Thal. North. Where the cathedral keeps its dead in the ground.” His lip curls very slightly. “Ashkin burn their dead. We do not leave them in the earth to be found. And still he calls from there.”" },
          { text: "“He called again,” Korr says, without turning. “Thal. Not in the town. North. Where the cathedral keeps its dead in the ground.” His lip curls very slightly. “Ashkin burn their dead. We do not leave them in the earth to be found. And still he calls from there.”" },
        ],
        options: [
          { text: "I'll walk with you.", tone: 'friendly', tags: ['protect'], effects: ['quest cq_korr voice', 'rel korr trust 3'], next: 'witness' },
          { text: "You don't have to face this, Korr.", tone: 'compassionate', tags: ['mercy'], next: 'must' },
          { text: "Not now. Rest first.", tone: 'leave', tags: ['caution'], next: 'later' },
        ],
      },
      must: {
        speaker: 'comp:korr',
        text: "“Yes,” he says. “I do.” He stands. “The question is whether I face it alone.”",
        options: [
          { text: "You won't.", tone: 'friendly', tags: ['protect'], effects: ['quest cq_korr voice', 'rel korr trust 3'], next: 'witness' },
          { text: "Not now.", tone: 'leave', next: 'later' },
        ],
      },
      later: {
        speaker: 'comp:korr',
        text: "“Later.” He lays the axe down. He does not lie down. “He was always patient. He can wait one more night.”",
        end: true,
      },
      witness: {
        speaker: 'comp:korr',
        text: "“Good.” A long breath. “Ashkin deeds must be witnessed to be sung. Even bad ones. Especially bad ones.” He looks at you. “Whatever I do among those graves, you will see it. Remember it true.”",
        interjections: [
          { who: 'brakka', text: "Brakka is already pulling her boots on. “Not alone, you great lump,” she says. Korr doesn't argue." },
          { who: 'tessa', text: "Tessa's quill has stopped moving. For once she doesn't offer to write anything down." },
        ],
        end: true,
      },
    },
  },
  {
    id: 'cq_korr_thal',
    title: 'Thal',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: 'prologue_complete', text: "Behind the cathedral, where the morning sun doesn't reach, one thread of grey has refused to burn off. It has gathered among the leaning graves into the shape of a man: Ashkin, tall, a war-band's ash-marks on his cheeks. The light goes through him. There is a wound in his side the exact width of an axe-blade." },
          { text: "Among the leaning graves of Saint Orlen's, where the fog lies thickest, someone is standing very still: Ashkin, tall, a war-band's ash-marks on his cheeks. He is made of fog, and the lantern-light goes through him. There is a wound in his side the exact width of an axe-blade." },
        ],
        effects: ['quest cq_korr graves'],
        next: 'thal1',
      },
      thal1: {
        speaker: 'dm',
        text: "“Korr,” the echo says. It is the voice the whole town heard in the fog, calling a name nobody answered to. “You stopped singing me. I waited at the fire, brother. You did not come.”",
        next: 'korr1',
      },
      korr1: {
        speaker: 'comp:korr',
        text: "Korr's knuckles are white on the haft. “I was cast out. I have no fire. I have no right to your name.” His voice is level. It costs him everything to keep it there.",
        options: [
          { text: "(Insight) Look at Thal. Really look.", tone: 'curious', check: { skill: 'insight', dc: 14, who: 'player', advIf: 'anc:ashkin' }, success: 'afraid', failure: 'misread' },
          { text: "Ask him what he wants, Korr.", tone: 'diplomatic', tags: ['diplomacy'], next: 'wants' },
          { text: "Korr, this is an echo. It isn't really him.", tone: 'pragmatic', tags: ['pragmatic'], next: 'not_him' },
        ],
      },
      afraid: {
        speaker: 'dm',
        text: "It isn't anger in that grey face. It's fear — and not of Korr. Of something Korr carried that day. The echo's eyes keep going to Korr's eyes, checking their colour.",
        next: 'afraid2',
      },
      afraid2: {
        speaker: 'dm',
        text: "“Your eyes went black, brother,” Thal says softly. “At the end. Not ember. Black. And there were others in your fire — old voices, many, singing a war-song I never learned. I heard them as you swung.” The echo touches the wound in its side. “It was not only you who killed me. I have waited a long time to tell you so.”",
        effects: ['set korr_drevakh_hint', 'clue cq_korr eyes', 'rel korr trust 2'],
        next: 'korr_reel',
      },
      korr_reel: {
        speaker: 'comp:korr',
        text: "Korr says nothing for a long moment. “Others,” he repeats. “In my fire.” He looks down at his own hands as though they belonged to a stranger. “That is not forgiveness, Thal. That is worse.”",
        next: 'decide',
      },
      misread: {
        speaker: 'dm',
        text: "You see the wound, and the waiting, and you read the grey face as accusation. So does Korr. His breath goes short. The ember in his eyes brightens, and brightens, and the air around him starts to shimmer like the air over a forge.",
        next: 'rage',
      },
      rage: {
        speaker: 'dm',
        text: "“Korr,” Thal says, alarmed. “Brother. Your eyes.”",
        options: [
          { text: "(Persuasion) “Korr. Breathe. Stay here with me.”", tone: 'compassionate', tags: ['protect'], check: { skill: 'persuasion', dc: 13, advIf: 'comp:brakka || comp:orren' }, success: 'calmed', failure: 'snap' },
          { text: "Step back and let it come. Better here than in town.", tone: 'aggressive', tags: ['violence'], next: 'snap' },
        ],
      },
      calmed: {
        speaker: 'dm',
        text: "You don't touch him. You stand where he can see you and say his name, and keep saying it, plain and steady, the way you'd talk someone back from a ledge. The shimmer fades. Korr's breath comes back. “...Here,” he says hoarsely. “I am here.”",
        effects: ['rel korr trust 4', 'memory korr 2 You talked me back from the fire among the graves.'],
        next: 'decide',
      },
      snap: {
        speaker: 'dm',
        text: "Korr roars, and the fog answers. The echo of Thal flinches back, frays, loses its face, and from the graves around it more grey shapes pull themselves up out of the ground-mist: hounds with lantern eyes, a woman calling a name. Korr's axe is already moving.",
        options: [{ text: "Fight.", tone: 'aggressive', effects: ['combat cq_enc_korr_grey'] }],
      },
      wants: {
        speaker: 'dm',
        text: "“My name,” Thal says. “Sung. That is all the dead ever want.” His grey mouth twists. “And to know you did not stop because you forgot.”",
        next: 'decide',
      },
      not_him: {
        speaker: 'comp:korr',
        text: "“It has his voice,” Korr says. “It has his wound. It knows what I did.” He doesn't take his eyes from the echo. “That is enough to be him, for me.”",
        next: 'decide',
      },
      decide: {
        speaker: 'comp:korr',
        decision: true,
        text: "“You are my witness, {player}.” He doesn't look away from Thal. “Tell me what I do.”",
        interjections: [
          { who: 'tessa', text: "Tessa says, very quietly, “I know the Ashkin measures. If you want to sing, I'll hum under you. Nobody has to hear me.”" },
          { who: 'seris', text: "Seris has drawn her sword and lowered its point to the earth: the knight's salute to the honoured dead. She says nothing." },
        ],
        options: [
          { text: "(Performance) Sing him. Every deed you remember. I'll help you find the measure.", tone: 'compassionate', tags: ['tradition', 'mercy'], check: { skill: 'performance', dc: 13, advIf: 'comp:tessa' }, success: 'sing_ok', failure: 'sing_break' },
          { text: "Demand the truth of that day. Make him tell you everything.", tone: 'aggressive', tags: ['boldness', 'honesty'], next: 'demand' },
          { text: "Let him go, Korr. Walk away. Some names are kinder unspoken.", tone: 'pragmatic', tags: ['caution'], next: 'silent' },
        ],
      },
      sing_ok: {
        speaker: 'dm',
        text: "Korr begins badly — a cough, a false start — and then the oath-song takes him the way it's meant to, and his voice drops into the old cadence. Thal of the Cinderfang, who carried the war-band's fire across the Ashwater in his two hands. Thal who laughed at the river-wyrm. Thal who gave his last water to a merchant's child. Thal who stood at Korr's left side for nineteen years. The echo listens with its grey eyes closed. On the last line, very softly, it sings with him. Then there is only fog, and the fog is thinning.",
        next: 'sung',
      },
      sing_break: {
        speaker: 'dm',
        text: "Korr starts strong. Thal who carried the fire. Thal who laughed at the wyrm. Then his voice catches on a deed and stops dead, and you watch him reach for it and find nothing — a gap where nineteen years should be. The silence goes on too long. “The river,” the echo says gently. “You forgot the river, brother. When I carried you.” Korr's face crumples. “The river,” he whispers, and finishes the song with the dead man prompting him, line by line.",
        effects: ['set cq_korr_song_broken'],
        next: 'sung',
      },
      sung: {
        speaker: 'comp:korr',
        text: "Korr stands in the thinning fog a long time. When he speaks his voice is wrecked. “Sung,” he says. “He is sung.” He reaches up and unknots one of the two bone rings braided into his hair; you never noticed there were two. “His,” he says, and presses it into your hand. “A witness keeps the band. That is the custom. I did not think I would ever give it.”",
        effects: ['complete cq_korr sung', 'set cq_korr_outcome sung', 'xp 175', 'give cq_korr_band', 'rel korr trust 8', 'rel korr affection 5', 'memory korr 3 You were my witness when I sang Thal\'s name.'],
        end: true,
      },
      demand: {
        speaker: 'dm',
        text: "“The truth?” The echo's face twists. “You want the day? Then have it, brother. Have all of it!” Thal's shape tears like wet paper and the fog pours through the tear: grey shapes rising from the graves, hounds with lantern eyes, the day itself come back to finish what it started.",
        options: [{ text: "Fight.", tone: 'aggressive', effects: ['combat cq_enc_korr_grey'] }],
      },
      silent: {
        speaker: 'dm',
        text: "Korr closes his eyes. He turns his back on the grave, with a deliberate, terrible slowness, like a man setting down something too heavy to carry and too precious to drop. Behind him the echo calls his name. Once. Twice. Then it is only fog, and the fog is thinning, and nobody is calling anything.",
        next: 'silent2',
      },
      silent2: {
        speaker: 'comp:korr',
        text: "“That was mercy,” he says, when you're past the cathedral gate. He doesn't sound sure. He sounds like a man who will be asking himself for years. He works one of the two bone rings out of his braids and gives it to you without meeting your eyes. “Keep it. I cannot.”",
        effects: ['complete cq_korr silent', 'set cq_korr_outcome silent', 'xp 125', 'give cq_korr_band', 'rel korr respect 3', 'memory korr -1 I turned my back on Thal, and you let me.'],
        end: true,
      },
    },
  },
  {
    id: 'cq_korr_after',
    title: 'After the Grey',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "The last grey shape tears apart under Korr's axe and does not come back. Among the graves there is nothing now but trampled grass and the smell of a forge going cold. Korr stands with his chest heaving and the ember dying slowly out of his eyes.",
        next: 'k',
      },
      k: {
        speaker: 'comp:korr',
        text: "“I did not decide to swing,” he says. “I never decide.” He looks at the place where Thal stood. “Twice, now. Twice I have killed him.”",
        options: [
          { text: "It was an echo, Korr. Not him.", tone: 'pragmatic', tags: ['pragmatic'], effects: ['rel korr trust 1'], next: 'end' },
          { text: "You came back from it. That's the part I'll remember.", tone: 'compassionate', tags: ['mercy'], effects: ['rel korr trust 4', 'rel korr affection 2'], next: 'end' },
        ],
      },
      end: {
        speaker: 'comp:korr',
        text: "Korr unknots a bone ring from his braids — there were two; you never noticed — and drops it into your palm without ceremony. “Thal's. I am not fit to wear it.” He shoulders his axe. “If my eyes go black again, {player}, you will tell me. Whatever it costs.”",
        effects: ['complete cq_korr fought', 'set cq_korr_outcome fought', 'xp 150', 'give cq_korr_band', 'memory korr -2 I broke Thal\'s echo in a rage. You were there to see it.'],
        end: true,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ BRAKKA

const BRAKKA: DialogueTree[] = [
  {
    id: 'cq_brakka_start',
    title: 'A personal matter: Brakka',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "Brakka is sitting by the hearth with her boots off and her axe untouched beside her, turning a pebble over and over in her fingers. When you sit, she holds it up: an ordinary grey stone from the street. “Folk here say this town's always been like this,” she says. “I keep wanting to ask the stones.”",
        next: 'b1',
      },
      b1: {
        speaker: 'comp:brakka',
        text: "“That old woman. Wenna. Two memories of the same tower, she said. One where it stands, one where it fell.” The pebble stops. “I want to ask her a question. Probably a daft one. Would you stand with me while I ask it?”",
        options: [
          { text: "Of course. What's the question?", tone: 'friendly', tags: ['protect'], effects: ['quest cq_brakka wenna', 'rel brakka trust 2'], next: 'question' },
          { text: "You're not mad, Brakka. You don't need her to tell you that.", tone: 'compassionate', tags: ['mercy'], effects: ['quest cq_brakka wenna', 'rel brakka affection 3'], next: 'notmad' },
          { text: "Not now.", tone: 'leave', next: 'later' },
        ],
      },
      question: {
        speaker: 'comp:brakka',
        text: "“Which one she believes, on the mornings they disagree. And what she does with the other one.” She pockets the pebble. “If she says ‘you learn to live with it,’ I may throw something. You'll stop me.”",
        end: true,
      },
      notmad: {
        speaker: 'comp:brakka',
        text: "“No,” she agrees. “But I'd like it said by someone who's had to hold two of everything.” She stands and reaches for her boots. “You'll do for holding my axe while I listen.”",
        end: true,
      },
      later: {
        speaker: 'comp:brakka',
        text: "“Aye. It'll keep.” The pebble goes round and round. “Everything keeps, with me. That's the trouble.”",
        end: true,
      },
    },
  },
  {
    id: 'cq_brakka_wenna',
    title: 'Two Memories',
    start: 'start',
    nodes: {
      start: {
        speaker: 'wenna',
        text: "Old Wenna takes the pipe out of her mouth as you come up the lane. “Ah,” she says, before anyone has spoken. “The dwarf who remembers a hall. Tobin talks. Sit, if your knees still bend.”",
        next: 'ask',
      },
      ask: {
        speaker: 'comp:brakka',
        text: "Brakka doesn't sit. She stands in front of the tiny old woman like a recruit before a sergeant. “Mistress Wenna. Your two memories. When they disagree, which do you believe?”",
        next: 'w1',
      },
      w1: {
        speaker: 'wenna',
        text: "“Both, dear. I'm eighty-eight. I've no time to be choosy.” She puffs. “Some mornings I wake up a widow and some mornings I wake up a maid, and either way the kettle wants filling.” Her flint-chip eyes narrow. “That's not your real question.”",
        next: 'b2',
      },
      b2: {
        speaker: 'comp:brakka',
        text: "Brakka's jaw works. “No. The real one is: in the life where your tower stood. Was there ever... anything of mine in it? Any dwarf? Anything from the mountains?” She hears herself and flushes to the roots of her beard. “Told you it was daft.”",
        next: 'w2',
      },
      w2: {
        speaker: 'wenna',
        text: "Wenna is quiet a moment. Then she laughs, a dry crackle like kindling. “Daft? No. There was a dwarf. The year I married, the bell's yoke cracked and Brother Halric couldn't rehang it alone. A mason came down out of the mountains to do it. Grumbled the whole way up the stair. Charged double, and spelled his own name wrong on the bill.” She points the pipe-stem. “Fenrik.”",
        next: 'b3',
      },
      b3: {
        speaker: 'comp:brakka',
        text: "Brakka sits down. Not on the bench — on the ground, all at once, like a felled tree. “Fenrik,” she says. “Old Fenrik. Who carved the honour-stones.” Her voice has gone very small for so large a woman. “He's from Ostrem. He's from my hall.”",
        interjections: [
          { who: 'korr', text: "Korr puts a hand on Brakka's shoulder and leaves it there. He says nothing. He does not need to." },
          { who: 'tessa', text: "Tessa has her quill out — and then, very deliberately, she puts it away." },
          { who: 'vaelis', text: "“Bilocal memory with a shared external referent,” Vaelis murmurs — and then sees Brakka's face, and has the grace to stop talking." },
        ],
        options: [
          { text: "Did he leave anything behind, Mistress Wenna?", tone: 'curious', tags: ['curiosity'], next: 'w3' },
          { text: "(History) Ask her when, exactly. Count the years with her.", tone: 'curious', check: { skill: 'history', dc: 13 }, success: 'years_ok', failure: 'years_bad' },
        ],
      },
      years_ok: {
        speaker: 'dm',
        text: "You work it out together, Wenna counting on her knuckles: sixty-five years ago, in her other life. Brakka does her own sum and goes pale. “Fenrik would've been young then. Two hundred and some. Just the age for walking down a mountain to rehang a human bell, for the pay and the complaining.” It fits. It fits perfectly — in a world where Ostrem stood.",
        effects: ['rel brakka trust 2'],
        next: 'w3',
      },
      years_bad: {
        speaker: 'dm',
        text: "Wenna squints at the sky. “The year I married, or the year my sister did? There's two of those as well.” She counts on her knuckles, loses her place, starts again. Brakka's hands clench and unclench in her lap. “It doesn't matter,” she says, in the voice of someone to whom it matters enormously.",
        next: 'w3',
      },
      w3: {
        speaker: 'wenna',
        text: "“Masons always leave a mark. His was on the tower stair, the third landing. A rune, for luck, he said.” Wenna looks north, to the broken stump of the cathedral tower over the rooftops. “Tower's fallen, of course, in this one. But nobody ever moved those stones. Nobody wanted to.”",
        effects: ['clue cq_brakka mason', 'quest cq_brakka tower'],
        next: 'b4',
      },
      b4: {
        speaker: 'comp:brakka',
        text: "Brakka gets up off the ground. Her eyes are wet and her face is set like a wall. “Thank you, mistress.” Then, to you: “The cathedral. The tower rubble. Now, if you've the legs for it.”",
        end: true,
      },
    },
  },
  {
    id: 'cq_brakka_stone',
    title: 'The Third Landing',
    start: [{ if: 'quest:cq_brakka=tower', node: 'start' }, { node: 'idle' }],
    nodes: {
      idle: {
        speaker: 'dm',
        text: "The rubble of the bell tower lies as it has for eighty years, furred with moss.",
        end: true,
      },
      start: {
        speaker: 'dm',
        text: "The bell tower came down eighty years ago and nobody ever cleared it: a long slope of broken stone at the cathedral's west end, furred with moss, ferns in every crack. Brakka walks onto it the way a mason walks onto a building site, knocking stones with her knuckles and listening.",
        options: [
          { text: "(Investigation) Search the rubble with her, stone by stone.", tone: 'curious', check: { skill: 'investigation', dc: 13 }, success: 'found', failure: 'slide' },
          { text: "[Resonance] Let the Heart show you what doesn't belong. (Spend 1 Resonance)", if: 'resunlocked && res>=1', tone: 'resonance', effects: ['res -1'], next: 'found_res' },
          { text: "Let Brakka read the stones. Hold the lantern and wait.", tone: 'friendly', tags: ['protect'], next: 'found_slow' },
        ],
      },
      found: {
        speaker: 'dm',
        text: "Third landing, Wenna said. You find the stair first — a run of six steps still mortared together, lying on its side like a spine — and beside it one block that is wrong. The rest of the rubble is soft local sandstone, eighty years of moss deep. This block is hard grey mountain granite, dwarf-dressed, its edges crisp, and the moss on it is one season old at most.",
        next: 'rune',
      },
      found_res: {
        speaker: 'dm',
        text: "The rubble flickers. For one heartbeat the tower stands around you, whole, bell-bronze glowing at the top of the stair — and on the third landing a single block glows brighter than the rest, as though it remembers being set in place. Then it's rubble again. But you know which stone.",
        next: 'rune',
      },
      found_slow: {
        speaker: 'dm',
        text: "It takes an hour. Brakka knocks on every stone in the heap while you hold the lantern and say nothing, and the ferns tremble each time she shifts a block. Near the end her knuckles start to bleed. She doesn't notice. Then she knocks once more, and stops, and knocks again — and the sound is different: a hard, high note, like a struck anvil.",
        effects: ['time 60', 'rel brakka trust 2'],
        next: 'rune',
      },
      slide: {
        speaker: 'dm',
        text: "You pull at a promising block and the whole slope moves. Stone grinds, dust billows, and a slab the size of a door slides past your legs and drops into the black shaft where the tower's foundations used to be. It takes a long time to hit the bottom. When the dust clears, Brakka is holding you up by the collar with one hand — and the slide has uncovered a block that was buried underneath.",
        effects: ['damage 1d6 bludgeoning'],
        next: 'rune',
      },
      rune: {
        speaker: 'dm',
        text: "Brakka kneels. Carved into the block's face is a line of dwarven rune-script, deep and square: a mason's honour-mark. She reads it with one finger, the way you'd read a name on a grave. Then she laughs, and the laugh breaks in the middle.",
        effects: ['clue cq_brakka stone'],
        next: 'rune2',
      },
      rune2: {
        speaker: 'comp:brakka',
        text: "“STEADDFAST.” She taps it. “Two d's. Fenrik spelled it with two d's on every honour-stone in Ostrem. Every one. We teased him something rotten. He said the extra d was for ‘dwarf.’” Her hand is shaking. “This stone fell from a tower that came down before Wenna was ten — in this world. In the other one it stood, and Fenrik climbed it.” She looks up at you. “I'm not mad, {player}. I'm not mad.”",
        next: 'decide',
      },
      decide: {
        speaker: 'comp:brakka',
        decision: true,
        text: "She lays her palm flat on the rune. “So. What do I do with it?”",
        interjections: [
          { who: 'seris', text: "Seris frowns. “That stone is the cathedral's,” she says — and then, slowly: “Though I suppose, in a sense, it never was.”" },
          { who: 'kael', text: "“Proof's only worth what somebody'll pay to look at it,” Kael says. “Just saying. As a professional.”" },
          { who: 'korr', text: "“A deed-stone,” Korr says. “Among my people, it would be sung over. Then it would go where its people are.”" },
        ],
        options: [
          { text: "Write to Kharn Dovrek. Send them a rubbing. Make them look.", tone: 'diplomatic', tags: ['honesty', 'boldness'], next: 'wrote' },
          { text: "(Athletics) Take the stone. An honour-stone belongs with its hall.", tone: 'aggressive', tags: ['tradition', 'boldness'], check: { skill: 'athletics', dc: 14, advIf: 'comp:korr' }, success: 'carried', failure: 'lost' },
          { text: "Leave it here, and tell no one yet. Proof is safer unspoken until you know what it proves.", tone: 'pragmatic', tags: ['caution'], next: 'kept' },
        ],
      },
      wrote: {
        speaker: 'dm',
        text: "Brakka takes a sheet of paper from your pack and a lump of charcoal from her pocket and makes a rubbing, slow and careful, two d's and all. Then she sits on the rubble and writes beneath it in big square dwarven letters, frowning, crossing out, starting again. “They'll say I forged it,” she says, without looking up. “Let them say it to my face.”",
        effects: ['complete cq_brakka wrote', 'set cq_brakka_outcome wrote', 'set cq_brakka_letter', 'xp 150', 'rel brakka trust 4', 'rel brakka respect 4', 'memory brakka 3 You told me to make my clan look at the proof.'],
        next: 'token',
      },
      carried: {
        speaker: 'dm',
        text: "Brakka sets her shoulder to the block and heaves. It doesn't move. She heaves again, something in her back cracks like a knuckle, and the block rolls free of the rubble with a sound like a door opening. She gets it up onto her shoulders — granite the size of a child — and stands. Her knees shake. Her face is radiant. “I'll carry it home,” she says. “However far home turns out to be.”",
        effects: ['complete cq_brakka carried', 'set cq_brakka_outcome carried', 'set brakka_carries_stone', 'xp 150', 'rel brakka trust 4', 'rel brakka affection 4', 'memory brakka 3 You helped me lift Fenrik\'s stone out of the rubble.'],
        next: 'token',
      },
      lost: {
        speaker: 'dm',
        text: "Brakka heaves. The block shifts — and so does everything under it. The slope starts to slide, slow and then not slow, and the honour-stone tips, rolls, and goes over the lip of the foundation shaft before either of you can catch it. You hear it hit, far below. Then again. Then nothing. Brakka stays on her knees at the edge of the shaft for a long time.",
        effects: ['damage 1d4 bludgeoning'],
        next: 'lost2',
      },
      lost2: {
        speaker: 'comp:brakka',
        text: "“Well,” she says at last, getting up. “Somebody saw it. You saw it.” She dusts her hands on her knees. “That's two of us. Two's the start of a clan.”",
        effects: ['complete cq_brakka lost', 'set cq_brakka_outcome lost', 'xp 125', 'rel brakka trust 3', 'memory brakka 1 Fenrik\'s stone fell into the dark. You saw it before it did.'],
        next: 'token',
      },
      kept: {
        speaker: 'comp:brakka',
        text: "Brakka is quiet a while. Then she pulls a fern over the rune, gently, like tucking in a child. “Aye. It's waited eighty years. It can wait till I know what it means.” She stands. “And I know where it is. That's more than I had this morning.”",
        effects: ['complete cq_brakka kept', 'set cq_brakka_outcome kept', 'xp 150', 'rel brakka trust 4', 'rel brakka respect 2', 'memory brakka 2 You helped me find the proof, and keep it safe.'],
        next: 'token',
      },
      token: {
        speaker: 'dm',
        text: "Before you leave, Brakka takes an iron washer from her pack — the kind used on shield-straps — and scratches a rune into it with her dagger-point, very carefully. Two d's. She presses it into your hand and closes your fingers over it. “Shieldwardens give these to the ones who held the line with them,” she says gruffly. “Don't lose it. And don't you dare fix the spelling.”",
        effects: ['give cq_brakka_token'],
        end: true,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ VAELIS

const VAELIS: DialogueTree[] = [
  {
    id: 'cq_vaelis_start',
    title: 'A personal matter: Vaelis',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "Vaelis hasn't touched his book. His brass gauge sits on the table in front of him, and its needle is not trembling the way it has every night since the bell. It is pointing. Steadily. North, toward the cathedral, like a dog that has smelled something it knows.",
        next: 'v1',
      },
      v1: {
        speaker: 'comp:vaelis',
        text: "“It's been doing that since dawn,” he says without looking up. “The Veil here has settled — your doing, I'm told; congratulations — so it isn't the Veil. It's something resonant, calling to this gauge in particular.” Now he looks at you. “Something of mine is down there, {player}. And I don't remember leaving it.”",
        options: [
          { text: "Then let's go and get it.", tone: 'friendly', tags: ['boldness'], effects: ['quest cq_vaelis gauge'], next: 'go' },
          { text: "Something of yours — or something like yours?", if: 'vaelis_instruments_hint', tone: 'curious', tags: ['curiosity'], effects: ['quest cq_vaelis gauge', 'rel vaelis respect 3'], next: 'like' },
          { text: "Not now.", tone: 'leave', next: 'later' },
        ],
      },
      like: {
        speaker: 'comp:vaelis',
        text: "Vaelis's mouth tightens. “Yes. Well. That is exactly the question, isn't it.” He scoops up the gauge. “I do so dislike it when you're perceptive before breakfast.”",
        next: 'go',
      },
      go: {
        speaker: 'comp:vaelis',
        text: "“The undercroft, I think. The antechamber before the vault; the Seeker's people came and went that way.” He pulls on his coat with the air of a man dressing for a funeral he expects to enjoy. “Do keep up. And if anything down there has my name on it, let me read it first.”",
        interjections: [
          { who: 'nima', text: "“Ooh, is it a secret?” Nima says. “Is it a bad secret? It's a bad secret. Look at his face.” “My face,” Vaelis says, “is always like this.”" },
          { who: 'orren', text: "Orren watches the needle a while. “Hounds point like that,” he says, “at their own trail.”" },
        ],
        end: true,
      },
      later: {
        speaker: 'comp:vaelis',
        text: "“Of course. It's only my past. It will keep.” The needle keeps pointing. He turns the gauge face-down on the table and does not pick up his book.",
        end: true,
      },
    },
  },
  {
    id: 'cq_vaelis_case',
    title: 'The Field-Case',
    start: [
      { if: 'quest:cq_vaelis=gauge && cq_vaelis_wardens_done', node: 'after_fight' },
      { if: 'quest:cq_vaelis=gauge && ysolt_outcome=persuaded', node: 'found_quiet' },
      { if: 'quest:cq_vaelis=gauge', node: 'found' },
      { if: 'quest:cq_vaelis=case', node: 'open' },
      { node: 'idle' },
    ],
    nodes: {
      idle: {
        speaker: 'dm',
        text: "The antechamber is quiet. A rectangle of clean stone shows where the field-case lay.",
        end: true,
      },
      found: {
        speaker: 'dm',
        text: "The gauge leads you into the vault's antechamber, past the empty plinth where the Sentinel stood. Behind a pillar someone has wedged a flat case of grey leather, Conclave-stamped: the kind a field agent carries instruments in. Vaelis kneels beside it and goes very still. Then, from the stair behind you, boots. Two pairs. Unhurried.",
        next: 'wardens',
      },
      wardens: {
        speaker: 'dm',
        text: "Two Conclave Wardens step into the lantern-light, grey robes over armour, staffs held level. The taller one looks at the case, then at Vaelis, and her eyebrows climb. “That belongs to the Seeker,” she says. “Step away from it, please. We'd rather not make a mess of the antechamber.”",
        interjections: [
          { who: 'vaelis', text: "Vaelis rises, and something happens to his voice: it loses two centuries of sarcasm and gains a cold, clipped Citadel accent you have never heard from him. “Warden. Do you know who designed the clasp on that case?”" },
        ],
        options: [
          { text: "(Deception) “We're here on Conclave business ourselves. The Seeker's orders.”", tone: 'deceptive', tags: ['deception'], check: { skill: 'deception', dc: 14, advIf: 'comp:vaelis' }, success: 'bluff_ok', failure: 'bluff_bad' },
          { text: "(Intimidation) “You saw what we did to the thing in that vault. Leave.”", tone: 'aggressive', tags: ['boldness'], check: { skill: 'intimidation', dc: 15 }, success: 'scare_ok', failure: 'bluff_bad' },
          { text: "Weapons out. It's ours now.", tone: 'aggressive', tags: ['violence'], effects: ['combat cq_enc_vaelis_wardens'] },
        ],
      },
      bluff_ok: {
        speaker: 'dm',
        text: "Vaelis takes over the lie halfway through your first sentence, in a voice like a closed archive: a Magister's voice, all clauses and contempt. He quotes regulation numbers. He sighs at the Wardens' posture. By the end of it the taller one is apologising, and they back up the stair with their staffs grounded, promising to tell the Seeker the field-case has been secured by the proper authority. When they've gone, Vaelis leans against the pillar and shuts his eyes. “I hate,” he says, “how easily that came back.”",
        effects: ['set cq_vaelis_wardens_done'],
        next: 'open_pre',
      },
      scare_ok: {
        speaker: 'dm',
        text: "The Wardens look at you, and at the scorched stone around the vault door, and at each other. “Not paid enough,” the shorter one mutters. They back up the stair. “The Seeker will hear of this,” the taller one calls down, which is what people say when they are leaving.",
        effects: ['set cq_vaelis_wardens_done', 'rep conclave -5'],
        next: 'open_pre',
      },
      bluff_bad: {
        speaker: 'dm',
        text: "The taller Warden's face hardens. “No,” she says pleasantly. “I don't think so.” The staffs come up, crackling violet along their iron shoes.",
        options: [{ text: "Fight.", tone: 'aggressive', effects: ['combat cq_enc_vaelis_wardens'] }],
      },
      found_quiet: {
        speaker: 'dm',
        text: "The gauge leads you into the vault's antechamber, past the empty plinth where the Sentinel stood. Behind a pillar lies a flat case of grey leather, Conclave-stamped. Tucked under its strap is a card in a neat, sardonic hand: Yours, I believe. You left fingerprints all over the field, Thorne. — Y.R. Vaelis reads it twice. “She let us go,” he says, “and then she left me a present. I can't decide which frightens me more.”",
        next: 'open_pre',
      },
      after_fight: {
        speaker: 'dm',
        text: "The Wardens are gone, back up the stair at a limping run, and the antechamber smells of scorched stone and lightning. The grey case lies where they left it. Vaelis kneels beside it, and his hands are not quite steady.",
        next: 'open_pre',
      },
      open_pre: {
        speaker: 'dm',
        text: "The case has a ward-clasp: a little brass knot of runes that will bite whoever opens it wrongly.",
        effects: ['quest cq_vaelis case'],
        options: [
          { text: "(Arcana) Work the ward-clasp open yourself.", tone: 'curious', check: { skill: 'arcana', dc: 13 }, success: 'open', failure: 'clasp_bit' },
          { text: "Let Vaelis do it. It's his design, isn't it?", tone: 'curious', tags: ['curiosity'], next: 'his_design' },
        ],
      },
      his_design: {
        speaker: 'comp:vaelis',
        text: "Vaelis gives you a long look. Then he touches the clasp in three places without hesitation, and it unknots itself like a cat stretching. “Yes,” he says. “It's my design. Forty years ago I drew that clasp on a napkin in a Solmara tavern to settle a bet.” He lifts the lid. “I won the bet.”",
        effects: ['rel vaelis trust 2'],
        next: 'open',
      },
      clasp_bit: {
        speaker: 'dm',
        text: "The clasp bites. Violet light snaps up your arm like a slapped wrist, and every hair you own stands on end. Vaelis reaches past you, touches the knot in three places, and it falls open. “Forty years ago,” he says, “I drew that clasp on a napkin to settle a bet.” He doesn't apologise for the shock. He looks as though he would like to.",
        effects: ['damage 1d6 force'],
        next: 'open',
      },
      open: {
        speaker: 'dm',
        text: "Inside, in fitted velvet: a Seeker's lodestone — a disc of black glass and silver wire, its needle swinging lazily toward you, toward the Heart in your pack — and beneath it a sheaf of old pages, much copied, the ink gone brown. Theorem-work: dense, beautiful, elegant as lace. A small purse of Conclave silver for field expenses is tucked into the lining. Vaelis lifts the top page, and you see that the handwriting is his.",
        effects: ['clue cq_vaelis fieldcase'],
        next: 'pages',
      },
      pages: {
        speaker: 'comp:vaelis',
        text: "“Copies,” he says. “Of a working notebook I left behind a very long time ago. They've been using it. They built their compass out of my margins.” He laughs, and it isn't a laugh at all. A folded note is pinned to the last page. He palms it before you can see it — smoothly, the way Kael would.",
        options: [
          { text: "What's in your hand, Vaelis?", if: 'trust:vaelis>=12', tone: 'curious', tags: ['honesty'], next: 'note' },
          { text: "(Persuasion) “Whatever's in your hand, I'd rather hear it from you than find out later.”", if: 'trust:vaelis<12', tone: 'diplomatic', tags: ['honesty'], check: { skill: 'persuasion', dc: 14, who: 'player' }, success: 'note', failure: 'note_no' },
          { text: "Say nothing. Let him keep it.", tone: 'compassionate', tags: ['mercy'], effects: ['rel vaelis affection 3'], next: 'decide' },
        ],
      },
      note: {
        speaker: 'dm',
        text: "He holds out the note. One line, in a hand you don't know — small, upright, unhurried: V. — The proof was never finished. Neither were you. The door is open. — S. Vaelis takes it back before you've quite finished reading.",
        effects: ['clue cq_vaelis note', 'set vaelis_severin_hint'],
        next: 'note2',
      },
      note2: {
        speaker: 'comp:vaelis',
        text: "“An old teacher,” he says, and the words are chosen very carefully, like steps on ice. “Who always did know how to end a letter.” He folds it into a smaller and smaller square. “I would be grateful, {player}, if you didn't ask me the next question tonight. I will answer it. Not tonight.”",
        options: [
          { text: "Not tonight, then.", tone: 'compassionate', tags: ['mercy'], effects: ['rel vaelis trust 4', 'memory vaelis 2 You read the note from S. and didn\'t ask the next question.'], next: 'decide' },
          { text: "Who is S., Vaelis?", tone: 'aggressive', tags: ['curiosity'], effects: ['rel vaelis trust -3'], next: 'who_s' },
        ],
      },
      who_s: {
        speaker: 'comp:vaelis',
        text: "“Someone who has never once lied to me,” Vaelis says flatly. “Which, you will find, is far worse than the alternative.” And that, his face says, is all you get.",
        next: 'decide',
      },
      note_no: {
        speaker: 'comp:vaelis',
        text: "“Lint,” Vaelis says. “A receipt. A very old shopping list.” He meets your eyes and holds them, and something in his face asks you, quite clearly, not to push. The note is gone.",
        next: 'decide',
      },
      decide: {
        speaker: 'comp:vaelis',
        decision: true,
        text: "He sets the lodestone on the velvet. Its needle swings back to you. “It's tracking the Heart. Badly, at this range. Well enough at a hundred miles. My work, refined by people with fewer scruples and better funding.” He looks at the pages. “So. What do we do with it?”",
        interjections: [
          { who: 'seris', text: "“Fire cleanses,” Seris says. “For once I imagine the wizard will agree with me.” Vaelis's expression suggests otherwise." },
          { who: 'nima', text: "“Don't burn it! Or — no, burn it. No! Ugh.” Nima tugs at her hair. “I want to take it apart. Can I take it apart?”" },
          { who: 'kael', text: "“If we're keeping it, I know a man in Ashenford who'd pay—” Kael catches Vaelis's look. “—absolutely nothing, because we're keeping it.”" },
        ],
        options: [
          { text: "Burn it. The compass, the pages, all of it.", tone: 'pragmatic', tags: ['caution', 'protect'], next: 'burn' },
          { text: "Keep it. Know your enemy's tools — and how they think.", tone: 'curious', tags: ['knowledge', 'pragmatic'], next: 'keep' },
          { text: "(Arcana) Turn the lodestone. Make it point somewhere useless.", tone: 'curious', tags: ['deception', 'curiosity'], check: { skill: 'arcana', dc: 15, advIf: 'comp:nima || class:wizard' }, success: 'turn', failure: 'ping' },
        ],
      },
      burn: {
        speaker: 'dm',
        text: "Vaelis makes the fire himself: a small, precise flame on the antechamber floor, hotter than it looks. He feeds it the pages one at a time, reading each before it goes. His own hand, decades younger, curls and blackens. The lodestone goes last; the silver wire sings a thin high note as it melts, and then nothing is pointing at you any more.",
        next: 'burn2',
      },
      burn2: {
        speaker: 'comp:vaelis',
        text: "“There,” he says. “A century of work, and the best of it became a compass for hounds.” He watches the ash settle, then tosses you the little purse from the lining. “Field expenses. The Conclave can afford it.” A pause. “Thank you. I couldn't have done it if you'd hesitated.”",
        effects: ['complete cq_vaelis burned', 'set cq_vaelis_outcome burned', 'xp 150', 'gold 60', 'rel vaelis trust 5', 'memory vaelis 2 You helped me burn the compass they built from my work.'],
        end: true,
      },
      keep: {
        speaker: 'comp:vaelis',
        text: "“Know your enemy.” He weighs the lodestone in his palm. “And how they think. And, worst of all, how I thought.” He wraps it in his scarf and hands it to you, not himself. “You carry it. If I hold it too long I'll start improving it.” The pages go into the inside pocket where his oldest notebook lives.",
        effects: ['complete cq_vaelis kept', 'set cq_vaelis_outcome kept', 'xp 150', 'give cq_vaelis_lodestone', 'rel vaelis respect 4', 'memory vaelis 2 You told me to keep my old work and learn from it.'],
        end: true,
      },
      turn: {
        speaker: 'dm',
        text: "Between you it takes half an hour, two burnt fingers and some language Vaelis claims is Old Ithari. Then the needle shivers, swings off you, and settles — firmly and, he assures you, forever — on a point some four hundred miles to the west. “The Westmarch,” Vaelis says with deep satisfaction. “A turnip field, if my geography holds. Somewhere a Seeker is going to spend a very long autumn digging.”",
        next: 'turn2',
      },
      turn2: {
        speaker: 'comp:vaelis',
        text: "He hands you the lodestone. “Keep it close. Anyone who copies its calibration copies the lie.” A real smile, brief as a struck match. “That is the most fun I have had with my own work in a hundred years.”",
        effects: ['complete cq_vaelis turned', 'set cq_vaelis_outcome turned', 'set cq_vaelis_decoy', 'xp 175', 'give cq_vaelis_lodestone', 'rel vaelis trust 4', 'rel vaelis affection 3', 'memory vaelis 3 We made the Conclave\'s compass lie, together.'],
        end: true,
      },
      ping: {
        speaker: 'dm',
        text: "The needle resists. You push. It pushes back — and then the lodestone sings: one pure, piercing note that goes through the stone and the earth and, you are horribly sure, very far beyond them. The needle snaps back to point at you, steady as a nail. Vaelis has gone white. “That,” he says, “was it answering a query. Somewhere, another lodestone just learned exactly where this one is.”",
        next: 'ping2',
      },
      ping2: {
        speaker: 'comp:vaelis',
        text: "He shuts the case with a snap. “Well. They know we have it, so we may as well keep it.” He hands it to you, case and all. “My fault. I should have warned you about the resonant feedback.” A thin, unhappy smile. “I designed the resonant feedback.”",
        effects: ['complete cq_vaelis pinged', 'set cq_vaelis_outcome pinged', 'set cq_vaelis_pinged', 'xp 125', 'give cq_vaelis_lodestone', 'rel vaelis trust 2', 'memory vaelis -1 We tried to turn the compass and it sang out to the Conclave instead.'],
        end: true,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ SERIS

const SERIS_BOTH = {
  speaker: 'comp:seris',
  text: "“That is enough.” Seris stops in the middle of the street. “I have seen what there is to see. The rider is waiting by the Lantern Tree.” She touches the seal at her belt. “Come. Whatever I decide, I would have you there when I decide it.”",
  effects: ['quest cq_seris verdict'],
  end: true,
};

const SERIS: DialogueTree[] = [
  {
    id: 'cq_seris_start',
    title: 'A personal matter: Seris',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "Seris is at the little table with the sealed letter squared precisely in front of her, as though alignment might help. Her armour is on. Her sword is on. She looks like a woman about to walk into a battle she has already lost, in her head, several times.",
        next: 's1',
      },
      s1: {
        speaker: 'comp:seris',
        text: "“The fog has lifted. The Order's rider came in at dawn; I saw her at the Lantern Tree. She will want my verdict before she rides.” Her hand lies flat on the seal. “I am to judge whether Hollowmere is tainted, and open these only if it is. I have judged it a hundred times in my head. I will judge it once with my feet.” She looks up. “I would value a second pair of eyes. I would value... yours.”",
        options: [
          { text: "I'll walk with you.", tone: 'friendly', tags: ['protect'], effects: ['quest cq_seris survey', 'rel seris trust 2'], next: 'walk' },
          { text: "And if you find it tainted? What's in those orders, Seris?", tone: 'curious', tags: ['curiosity'], effects: ['quest cq_seris survey'], next: 'fear' },
          { text: "Not now.", tone: 'leave', next: 'later' },
        ],
      },
      fear: {
        speaker: 'comp:seris',
        text: [
          { if: 'seris_orders_fear', text: "“You saw my face, the other night. You know I do not know.” A crack in the polish. “I know what has been in such letters before. Towns placed under interdict. The afflicted ‘gathered.’ Places burned. I have never been the one to break the seal.”" },
          { text: "“I do not know. That is the point of a seal.” A pause, and a crack in the polish. “I know what has been in such letters before. Towns placed under interdict. The afflicted ‘gathered.’ Places burned. I have never been the one to break the seal.”" },
        ],
        next: 'walk',
      },
      walk: {
        speaker: 'comp:seris',
        text: "“Two places, I think. The square, where folk woke beside strangers. And the old well, where the children play.” She stands, and the armour settles around her. “I will look. You will tell me if I am seeing only what I was sent to see.”",
        interjections: [
          { who: 'ilyra', text: "Ilyra touches Seris's arm on the way past. Seris lets the hand stay a moment longer than she usually would." },
          { who: 'kael', text: "“Just so I know,” Kael says, “if the verdict's ‘tainted,’ do I start packing, or start running?” Seris does not answer, which is an answer." },
          { who: 'varek', text: "Varek says nothing at all. But he watches the seal on Seris's belt the way a man watches a lit fuse." },
        ],
        end: true,
      },
      later: {
        speaker: 'comp:seris',
        text: "“Of course.” She squares the letter again. It was already square.",
        end: true,
      },
    },
  },
  {
    id: 'cq_seris_weaver',
    title: 'Hesper Tull',
    start: [{ if: 'quest:cq_seris=survey && !cq_seris_w1', node: 'start' }, { node: 'idle' }],
    nodes: {
      idle: {
        speaker: 'dm',
        text: "Hesper Tull sits on the edge of the trough with a man's coat round her shoulders. She nods to you. She seems, on the whole, all right.",
        end: true,
      },
      start: {
        speaker: 'dm',
        text: "A woman in a weaver's apron sits on the edge of the horse trough, wrapped in a man's coat too big for her. A man stands a careful pace away, holding two cups of cider and unsure whether to offer one. Seris stops in front of them, and you watch her decide to be gentle.",
        next: 'h1',
      },
      h1: {
        speaker: 'dm',
        text: "“Hesper Tull,” the woman says. “Weaver. Yes, I'm one of them.” She nods at the man. “I woke up beside him. Never seen him in my life. He knew how I take my tea. He knew the name of my dead dog. He cried when I didn't know him.” She takes the cup at last. “So we're starting again. Introductions and all. He's called Davit. He's a terrible cook.”",
        next: 'h_seris',
      },
      h_seris: {
        speaker: 'comp:seris',
        text: "Seris's voice is very careful. “Goodwife Tull. Do you believe he is what he says he is?”",
        options: [
          { text: "Let her answer, Seris.", tone: 'compassionate', tags: ['mercy'], next: 'h2' },
          { text: "(Insight) Watch Davit while Hesper speaks.", tone: 'curious', check: { skill: 'insight', dc: 12, who: 'player' }, success: 'davit_s', failure: 'h2' },
        ],
      },
      davit_s: {
        speaker: 'dm',
        text: "Davit isn't watching Seris's sword, or the ember at her breast. He's watching Hesper, the way a man watches a candle he's afraid will go out. Whatever he is, he loves her. He loved her before he got here. Seris follows your gaze, and sees it too.",
        effects: ['rel seris trust 1'],
        next: 'h2',
      },
      h2: {
        speaker: 'dm',
        text: "“Does it matter?” Hesper says. “He's here. He's kind. Lights know there's not enough of either.” She looks up at Seris properly for the first time, at the white and the gold. “You're from that Order. You're deciding if we're wicked.” She doesn't sound afraid. She sounds tired. “Decide quick, love. I've a loom to warp.”",
        next: 's2',
      },
      s2: {
        speaker: 'comp:seris',
        text: "Seris bows: the full, formal bow of a Knight-Oathsworn to a citizen, which you have never seen her give anyone. “Thank you, Goodwife.” As you walk away she says, low: “He is a taint, by every letter of the law. A man written into a life that was not his.” A long breath. “She offered him cider.”",
        effects: ['set cq_seris_w1', 'clue cq_seris weaver'],
        options: [
          { text: "Walk on.", if: 'cq_seris_w2', tone: 'friendly', next: 'both' },
          { text: "On to the old well.", if: '!cq_seris_w2', tone: 'friendly', end: true },
        ],
      },
      both: SERIS_BOTH,
    },
  },
  {
    id: 'cq_seris_well',
    title: 'The Children at the Well',
    start: [{ if: 'quest:cq_seris=survey && !cq_seris_w2', node: 'start' }, { node: 'idle' }],
    nodes: {
      idle: {
        speaker: 'dm',
        text: "The children have gone home. The chalk figures by the well are scuffed now, but nobody has stepped on the fourth one.",
        end: true,
      },
      start: {
        speaker: 'dm',
        text: "Three children are crouched by the old well with a stub of chalk, drawing on the flagstones: four figures holding hands. Three of them have faces. The fourth is a careful, empty circle. Seris kneels — armour and all — so that she is at their height.",
        next: 'k1',
      },
      k1: {
        speaker: 'dm',
        text: "“That's us,” says the eldest, a gap-toothed girl, pointing at the three. “And that's—” She stops. Her brow creases. “That's the other one. The one who's always there. We play with her every day.” “What is her name?” Seris asks. The children look at each other. Nobody knows. The smallest one starts, very quietly, to cry, and doesn't know why.",
        options: [
          { text: "Sit down with them. Help them finish the drawing.", tone: 'compassionate', tags: ['mercy', 'charity'], next: 'k_draw' },
          { text: "(Medicine) See to the crying child.", tone: 'compassionate', check: { skill: 'medicine', dc: 12 }, success: 'k_med', failure: 'k_med_f' },
          { text: "Leave them be. This isn't something we can fix.", tone: 'pragmatic', tags: ['pragmatic'], next: 'k_leave' },
        ],
      },
      k_draw: {
        speaker: 'dm',
        text: "You sit on the cold flagstones and take the chalk, and the children tell you what the fourth one looks like, arguing over every detail. Curly hair. No — straight. A gap in her teeth like Bel's. A scar on her knee from the mill wall. When it's done, it's nobody you know. It's somebody. The smallest one stops crying and pats the chalk face, very gently.",
        effects: ['rel seris affection 2'],
        next: 's_well',
      },
      k_med: {
        speaker: 'dm',
        text: "There is nothing wrong with her but a grief too big for her that she doesn't know the shape of. You hold her hand until the worst passes and teach her the trick of counting her own breaths, and Seris watches you do it with an expression you can't read.",
        next: 's_well',
      },
      k_med_f: {
        speaker: 'dm',
        text: "Pulse, eyes, forehead. Nothing. The child keeps crying — the silent, bewildered crying of someone who has lost something and cannot remember what. Nothing you know how to do touches it.",
        next: 's_well',
      },
      k_leave: {
        speaker: 'dm',
        text: "You step back. Seris doesn't. She stays kneeling on the flagstones a long while, one gauntleted hand resting on the empty chalk circle, as though she could warm it.",
        next: 's_well',
      },
      s_well: {
        speaker: 'comp:seris',
        text: "When she stands, her knees crack. “There was a child here,” she says. “Erased. Her friends still leave her a place.” Her jaw is set. “My orders would call that taint. I was taught that taint is rot. That it spreads. That it must be cut out.” She looks down at the chalk. “Tell me where the rot is, {player}. I cannot find it.”",
        effects: ['set cq_seris_w2', 'clue cq_seris well'],
        options: [
          { text: "Walk on.", if: 'cq_seris_w1', tone: 'friendly', next: 'both' },
          { text: "On to the square.", if: '!cq_seris_w1', tone: 'friendly', end: true },
        ],
      },
      both: SERIS_BOTH,
    },
  },
  {
    id: 'cq_seris_knight',
    title: 'The Rider of the Last Dawn',
    start: [{ if: 'quest:cq_seris=verdict', node: 'start' }, { node: 'idle' }],
    nodes: {
      idle: {
        speaker: 'dm',
        text: "The rider of the Last Dawn checks her horse's girth and does not look at you.",
        end: true,
      },
      start: {
        speaker: 'dm',
        text: "The rider waits beneath the Lantern Tree with her horse's reins looped over one arm: a Knight of the Last Dawn in white and gold, older than Seris, with the sun-browned face and patient eyes of someone who has carried a great many verdicts down a great many roads. “Dame Aubrin Kesh,” she says, and inclines her head a precise degree. “Oathsworn. You have walked the town. Your judgment?”",
        next: 'pause',
      },
      pause: {
        speaker: 'dm',
        text: "Seris doesn't answer at once. She looks at you instead.",
        next: 'decide',
      },
      decide: {
        speaker: 'comp:seris',
        decision: true,
        text: "“By the letter of the law, it is tainted. The fog, the doubled, the erased. There is no question.” Her voice is quite steady. Her hand on the seal is not. “The question is what I do with that.” Quietly, so the rider cannot hear: “Help me. Please.”",
        interjections: [
          { who: 'ilyra', text: "“There's an old clause,” Ilyra murmurs to you behind her hand. “In the Hearth Rite, a keeper may take a sick house under her own lamp. Half the Order's law was borrowed from ours.”" },
          { who: 'kael', text: "Kael has drifted, very casually, to a spot between the rider and her horse. You decide not to ask." },
          { who: 'varek', text: "Varek is very quiet. He has not taken his eyes off the rider's sword. You remember a mob, and a river." },
        ],
        options: [
          { text: "It's tainted. Report it. The law is the law, and you are its knight.", tone: 'diplomatic', tags: ['authority', 'honesty'], next: 'condemn' },
          { text: "(Religion) Report the truth — and claim the judgment yourself. Isn't there an oath for exactly this?", tone: 'class', tags: ['protect', 'honesty'], check: { skill: 'religion', dc: 14, advIf: 'class:paladin || class:cleric || bg:acolyte || comp:ilyra' }, success: 'ward', failure: 'ward_fail' },
          { text: "(Persuasion) Tell her it's clean, Seris. Lie. For Hesper. For those children.", once: true, tone: 'compassionate', tags: ['mercy', 'deception'], check: { skill: 'persuasion', dc: 16, who: 'player', advIf: 'trust:seris>=20' }, success: 'lie', failure: 'lie_no' },
        ],
      },
      condemn: {
        speaker: 'dm',
        text: "Seris breaks the seal. She reads the orders once, standing, and her face doesn't move at all. Then she reads them aloud, because she is a woman who believes the condemned should hear their sentence: Should the Oathsworn find the town tainted, it is placed under interdict of the Last Dawn. The afflicted are to be gathered at the Dawnspire for purification. The ruin of Saint Orlen is to be burned to its foundations.",
        next: 'condemn2',
      },
      condemn2: {
        speaker: 'comp:seris',
        text: "“So witnessed,” she says, and hands the open letter to Dame Aubrin. The rider tucks it into her saddlebag, mounts, and is gone south at a canter, and Seris watches the road long after there is nothing on it. “I have done my duty,” she says. Her hands are shaking. She folds them behind her back so that you will not see. You see.",
        effects: ['complete cq_seris condemned', 'set cq_seris_outcome condemned', 'set hollowmere_interdict', 'xp 150', 'rep dawn 5', 'rep hollowmere -5', 'rel seris agreement 5', 'rel seris trust 3', 'rel seris affection -2', 'memory seris 1 You told me to do my duty, and I did it. I do not yet know what it cost.'],
        next: 'ribbon',
      },
      ward: {
        speaker: 'dm',
        text: "You remember it before you know you remember it: the old Lantern Clause, older than the Order's schism, from the days when knights still lived in the towns they guarded. A Knight-Oathsworn may take a tainted place beneath her own lamp, and answer for it with her own name. Seris's head comes up as if you had struck a bell.",
        next: 'ward2',
      },
      ward2: {
        speaker: 'comp:seris',
        text: "Seris breaks the seal, reads, goes white — then draws herself up and recites the Clause to Dame Aubrin word-perfect, in a voice that carries across the square. Heads turn. By the trough, Hesper Tull stands up. “Hollowmere is tainted,” Seris finishes, “and it is under my lamp. Any judgment on it falls on me.” The rider studies her a long moment. Then, unexpectedly, she smiles. “Sixty years since anyone invoked that,” she says. “They'll hate it at the Dawnspire.” She salutes. “So witnessed, Oathsworn.”",
        effects: ['complete cq_seris warded', 'set cq_seris_outcome warded', 'set hollowmere_warded', 'xp 175', 'rep hollowmere 5', 'rel seris trust 6', 'rel seris respect 5', 'memory seris 3 You found me a way to keep both the law and the town.'],
        next: 'ribbon',
      },
      ward_fail: {
        speaker: 'dm',
        text: "You're sure there is something — an oath, a clause — but it slides away as you reach for it. Seris tries anyway, haltingly, and Dame Aubrin listens with a patient frown. “I have heard of such a thing,” the rider says at last. “I am not empowered to accept it. Only a Dawnblade-Commander could.” She takes the opened orders, and Seris's plea with them. “I'll carry both. They will want to speak with you, Oathsworn. About your irregular conduct.”",
        next: 'ward_fail2',
      },
      ward_fail2: {
        speaker: 'comp:seris',
        text: "When the rider has gone, Seris stands very straight. “I have bought the town a little time,” she says, “and bought myself an inquiry.” She almost smiles. “It is the first thing I have ever bought for myself. I find I do not regret it.”",
        effects: ['complete cq_seris questioned', 'set cq_seris_outcome questioned', 'set seris_under_inquiry', 'xp 150', 'rel seris trust 4', 'rel seris respect 2', 'memory seris 2 You helped me plead for the town. It may cost me my name.'],
        next: 'ribbon',
      },
      lie: {
        speaker: 'dm',
        text: "You don't argue law. You talk about Hesper's cider and the empty chalk circle, quietly, while the rider waits. Seris listens with her eyes closed. When she opens them she turns to Dame Aubrin and says, in a voice that does not shake at all, “I find no taint in Hollowmere,” and hands her the letter, its seal unbroken. The rider looks at the seal, and at Seris, for a long moment. Then she tucks it away and rides.",
        next: 'lie2',
      },
      lie2: {
        speaker: 'comp:seris',
        text: "Seris doesn't speak until the hoofbeats are gone. Then she sits down on the Lantern Tree's roots as if her legs have been cut. “That was the first lie I have ever told,” she says. “To my own Order. Under oath.” She looks at her hands. “I thought the Lights would strike me. They did not.” It is not clear whether that comforts her.",
        effects: ['complete cq_seris spared', 'set cq_seris_outcome spared', 'set seris_orders_unopened', 'xp 150', 'rep hollowmere 5', 'rel seris affection 4', 'rel seris agreement -3', 'memory seris 0 You asked me to lie to my Order for the town, and I did.'],
        next: 'ribbon',
      },
      lie_no: {
        speaker: 'comp:seris',
        text: "“No.” She doesn't even raise her voice. “I will not lie. Not to her, not under oath, not even for this.” Something flickers in her face — grief, perhaps, that you asked. “Help me find a true way, {player}, or let me walk the one I was given.”",
        effects: ['rel seris trust -2'],
        next: 'decide',
      },
      ribbon: {
        speaker: 'dm',
        text: "Before you leave the square, Seris cuts a strip of white-and-gold ribbon from the hem of her tabard with her belt-knife, ties it in the knot the Order uses for vigils, and gives it to you. “Knights give these to those who kept watch with them,” she says. “I have never given one before. I am told it is customary to say something wise.” She considers. “I have nothing wise. Keep it anyway.”",
        effects: ['give cq_seris_ribbon'],
        end: true,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ NIMA

const NIMA: DialogueTree[] = [
  {
    id: 'cq_nima_start',
    title: 'A personal matter: Nima',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "Nima is sitting cross-legged on the floor with the shutters closed, making little flames: one in each palm, one balanced on the tip of each finger, a ring of them orbiting her head like moths. When you come in, every one of them goes out at once. She jumps about a foot.",
        next: 'n1',
      },
      n1: {
        speaker: 'comp:nima',
        text: "“Hi! Hello. I wasn't doing anything. I was doing a lot of things, but not anything.” She takes a breath. “Okay. Okay. One of them talked.” Seeing your face: “The fire. The voice. The one that sounds like me, only older. It's never said anything useful before, it just — crackles. Last night it said: ‘The vault's still warm, little spark. Go and drink.’”",
        options: [
          { text: "That sounds dangerous.", tone: 'pragmatic', tags: ['caution'], next: 'danger' },
          { text: "Then let's go and hear what else it has to say.", tone: 'friendly', tags: ['curiosity', 'boldness'], effects: ['quest cq_nima whisper', 'rel nima trust 3'], next: 'go' },
          { text: "Not now, Nima.", tone: 'leave', next: 'later' },
        ],
      },
      danger: {
        speaker: 'comp:nima',
        text: "“Of course it's dangerous! Everything good is dangerous. Cliffs. Kissing. Pie when it's just out of the oven.” She hugs her knees. “I'm going anyway. I'd just rather go with someone sensible watching. Or you.”",
        options: [
          { text: "I'll come. Somebody should stand close.", tone: 'compassionate', tags: ['protect'], effects: ['quest cq_nima whisper', 'rel nima affection 3'], next: 'go' },
          { text: "Not now.", tone: 'leave', next: 'later' },
        ],
      },
      later: {
        speaker: 'comp:nima',
        text: "“Fine. Sure. Later.” A tiny flame pops into being on her thumbnail, and she glares at it until it goes out. “Not you,” she tells it. “Shush.”",
        end: true,
      },
      go: {
        speaker: 'comp:nima',
        text: "She's already on her feet, pulling on her boots, the wrong one first. “The vault. Under the cathedral. Where you touched the—” She waves at your pack. “The air down there was so thick with it you could've spread it on toast. If there's any left, I want to talk back.”",
        interjections: [
          { who: 'vaelis', text: "“Talk back,” Vaelis repeats. “To a voice in your fire. Using residual Aether in a damaged Anchor vault.” A pause. “I'm coming. Purely to take notes on the explosion.”" },
          { who: 'tessa', text: "Tessa catches Nima's hand. “You never told me about the voice,” she says — not hurt, or not only hurt. Nima squeezes back. “I never told anyone.”" },
        ],
        end: true,
      },
    },
  },
  {
    id: 'cq_nima_pool',
    title: 'Where the Heart Rested',
    start: [{ if: 'quest:cq_nima', node: 'start' }, { node: 'idle' }],
    nodes: {
      idle: {
        speaker: 'dm',
        text: "The Heart's pedestal stands empty. The air above it is still now; whatever shimmered there is gone.",
        end: true,
      },
      start: {
        speaker: 'dm',
        text: "The vault is quiet now. The Heart's pedestal stands empty at the top of the dais, and the air above it still shimmers like the air over a summer road: residual Aether, pooled where the Heart lay for three thousand years, slowly leaking away. Nima climbs the dais step by step. With every step, sparks crawl a little further up her arms.",
        effects: ['quest cq_nima experiment'],
        next: 'voice',
      },
      voice: {
        speaker: 'dm',
        text: "She holds one hand out into the shimmer, and a flame wakes in her palm — not orange but white-gold, very clear. From inside it, in a crackle like burning glass, comes a voice that is Nima's voice, forty years older, tired and fond: “There you are. Closer, little spark. Drink. You've been so thirsty for so long.”",
        next: 'n1',
      },
      n1: {
        speaker: 'comp:nima',
        text: "Nima's face is alight. Terrified, and alight. “Did you hear that? You heard that. Tell me you heard that.” She turns to you, and the white flame turns with her. “I can do it. I can pull it in and talk back. Properly. I just need to know you'll be there if I — if it—”",
        next: 'decide',
      },
      decide: {
        speaker: 'comp:nima',
        decision: true,
        text: "“Tell me what to do,” she says. “Actually, don't. Yes, do. Quickly.”",
        interjections: [
          { who: 'seris', text: "“This is forbidden,” Seris says, very quietly, “and I think you know it.” Nima doesn't look round. “Everything fun is, Seris.”" },
          { who: 'orren', text: "Orren has stopped at the foot of the dais. “Fire that talks,” he says, “usually wants something.”" },
          { who: 'vaelis', text: "“For the record,” Vaelis says, “a containment circle takes four minutes. I'll draw it. I'll even let you take the credit.”" },
        ],
        options: [
          { text: "(Arcana) Go on. Talk to it. I'll keep you anchored.", tone: 'friendly', tags: ['boldness', 'curiosity', 'forbidden'], check: { skill: 'arcana', dc: 14 }, success: 'spoke', failure: 'flare' },
          { text: "(Arcana) Not like that. Build a circle first and do it the careful way.", tone: 'pragmatic', tags: ['caution', 'knowledge'], check: { skill: 'arcana', dc: 12, advIf: 'item:echo_shard || item:fog_essence || comp:vaelis' }, success: 'contained', failure: 'flare' },
          { text: "No. Walk away, Nima. Whatever that voice is, it doesn't get to call you.", tone: 'compassionate', tags: ['protect', 'caution'], next: 'refuse' },
        ],
      },
      spoke: {
        speaker: 'dm',
        text: "You put a hand on Nima's shoulder and hold on, and say her name whenever the shimmer gets too bright, and she pulls the Aether in like a long breath. The flame in her palm grows into a small white sun. And she talks to it. You hear only her half: “Who are you?” — a long crackle — “That's not an answer.” — “What do you mean, ‘crown’?” — and then, very small: “Why are they kneeling?”",
        next: 'spoke2',
      },
      spoke2: {
        speaker: 'dm',
        text: "The sun gutters out. Nima stands on the dais with her empty hand held out, and when she turns round her eyes are wet and enormous. “She said I'd be magnificent,” she whispers. “She said they'd kneel in rows, like glass, and I'd never be afraid of the heat again.” She laughs, and it breaks. “She sounded so proud of me. Why did that sound so awful?”",
        effects: ['clue cq_nima crown', 'set nima_crown_hint'],
        next: 'spoke3',
      },
      spoke3: {
        speaker: 'comp:nima',
        text: "She comes down off the dais and walks straight into you and stays there a while, forehead against your collarbone, warm as a stove. “Thank you for holding on,” she says into your shirt. “Don't let go of me. Like, generally. As a policy.”",
        effects: ['complete cq_nima spoke', 'set cq_nima_outcome spoke', 'xp 175', 'rel nima trust 6', 'rel nima affection 5', 'memory nima 3 You held on while I talked to the voice in the fire.'],
        next: 'tear',
      },
      contained: {
        speaker: 'dm',
        text: "It takes four minutes and a great deal of complaining: chalk on black stone, salt from your pack, a ring of symbols Nima copies with her tongue between her teeth. When she reaches into the shimmer from inside the circle, the white flame wakes small and steady, and the voice in it is muffled, as if heard through a door: “...so careful... she was never careful... crown...” Then the circle hums, the flame folds itself shut like a hand, and the shimmer is gone.",
        effects: ['clue cq_nima crown'],
        next: 'contained2',
      },
      contained2: {
        speaker: 'comp:nima',
        text: "Nima stares at her palm. “That's it? That's all I get? One word through a wall?” She kicks the chalk line, then, after a moment, kneels and smooths it out again, carefully. “...Crown,” she says. “Who says ‘crown’? Nobody normal says ‘crown.’” She looks up at you, cross and grateful in equal parts. “I'd have burned the vault down, wouldn't I. If you hadn't made me draw circles.”",
        effects: ['complete cq_nima contained', 'set cq_nima_outcome contained', 'xp 150', 'rel nima trust 4', 'rel nima respect 4', 'memory nima 2 You made me do it carefully. I hated it. You were right.'],
        next: 'tear',
      },
      flare: {
        speaker: 'dm',
        text: "Something slips. Nima gasps, and the shimmer above the pedestal stops leaking and starts pouring — white-gold, into her and through her and out of her — and the fire that comes out of her has shapes in it. People. Figures of glowing glass, still burning, walking down off the dais with their arms held out, the way people walk out of a burning workshop. Nima screams something that might be “Dad.”",
        options: [{ text: "Get between her and them!", tone: 'aggressive', tags: ['protect'], effects: ['combat cq_enc_nima_flare'] }],
      },
      refuse: {
        speaker: 'comp:nima',
        text: "For a second Nima's whole face goes hot and furious, and the white flame flares with it. “You sound like my dad,” she says. “You sound exactly like—” The flame crackles, eager, encouraging. She looks at it. Then she looks at you. Then, very slowly, she closes her fist, and the fire goes out.",
        next: 'refuse2',
      },
      refuse2: {
        speaker: 'comp:nima',
        text: "“...Fine,” she says. “Fine.” She stomps down the dais. At the bottom she stops with her back to you. “It said ‘drink,’” she says, in a much smaller voice. “Nobody nice says ‘drink’ to somebody thirsty.” A pause. “Thank you. I'm still cross. Both things.”",
        effects: ['complete cq_nima refused', 'set cq_nima_outcome refused', 'xp 125', 'rel nima trust 3', 'rel nima affection -2', 'memory nima 1 You made me walk away from the voice. I was so angry. I think you were right.'],
        next: 'tear',
      },
      tear: {
        speaker: 'dm',
        text: "On the stair Nima stops, cups something in her hands, breathes on it until it glows, and presses it into your palm: a bead of ember-coloured glass, still warm, shaped like a teardrop. “Made it,” she says. “Just now. Out of nothing. Don't ask me how; I don't know.” She sniffs. “It's for you. For being there. Don't make it weird.”",
        effects: ['give cq_nima_tear'],
        end: true,
      },
    },
  },
  {
    id: 'cq_nima_after',
    title: 'Glass and Embers',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "The last glass figure shatters into embers, and the embers into nothing. The shimmer above the pedestal is gone, burned off entirely. Nima is on her knees on the dais, hugging herself, her hair gently smoking.",
        next: 'n',
      },
      n: {
        speaker: 'comp:nima',
        text: "“They were people,” she says. “Weren't they. They looked like the glassworks. Like the night it burned.” She stares at her hands. “I did that. Again.”",
        options: [
          { text: "They were echoes, Nima. And you're not alone this time. Look — we're all still standing.", tone: 'compassionate', tags: ['protect'], effects: ['rel nima trust 5', 'rel nima affection 3'], next: 'end' },
          { text: "You did. And you'll learn to stop it. That's the job now.", tone: 'pragmatic', tags: ['honesty'], effects: ['rel nima respect 4'], next: 'end' },
        ],
      },
      end: {
        speaker: 'comp:nima',
        text: "She wipes her face with a sooty wrist, which makes it worse. “Before it went, she said one more thing. The voice. She said, ‘You'll stop flinching one day. They'll all kneel and you won't even flinch.’” She shudders. “I don't want to stop flinching.” Then she cups her hands, breathes into them until they glow, and gives you what she's made: a bead of ember-glass shaped like a tear. “For not running,” she says.",
        effects: ['complete cq_nima flared', 'set cq_nima_outcome flared', 'set nima_crown_hint', 'clue cq_nima crown', 'xp 150', 'give cq_nima_tear', 'memory nima -1 My fire made burning glass people in the vault, and you fought them beside me.'],
        end: true,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ ILYRA

const ILYRA: DialogueTree[] = [
  {
    id: 'cq_ilyra_start',
    title: 'A personal matter: Ilyra',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "Ilyra comes back up from the common room with her sleeves rolled to the elbow and someone else's blood dried on one cuff. She sits down on the bed without taking off her boots, which for Ilyra is a sign of something.",
        next: 'i1',
      },
      i1: {
        speaker: 'comp:ilyra',
        text: "“Tobin's been asking for a priest. Not for himself.” She rubs her eyes. “There's a man down by Thorn's Mill. He walked out of the fog at dawn, soaking wet, sat down on the bank of the mill-race, and won't leave. He says he's Coll Thorn. Abel Thorn's brother.” A pause. “Abel's brother drowned in that race nine years ago. Abel buried him.”",
        next: 'i2',
      },
      i2: {
        speaker: 'comp:ilyra',
        text: "“Tobin says he asked for ‘a priest who isn't afraid of the drowned.’” A small, wry smile with no humour in it. “I've been called a lot of things. Never that. I'd like to go down to him. I'd like you with me, if you'll come.”",
        options: [
          { text: "Of course I'll come.", tone: 'friendly', tags: ['mercy'], effects: ['quest cq_ilyra mill', 'rel ilyra trust 2'], next: 'go' },
          { text: "A man back from the dead. Is he dangerous?", tone: 'pragmatic', tags: ['caution'], effects: ['quest cq_ilyra mill'], next: 'danger' },
          { text: "Not now.", tone: 'leave', next: 'later' },
        ],
      },
      danger: {
        speaker: 'comp:ilyra',
        text: "“To others? Rarely. To himself?” She's quiet a moment. “The returned remember two lives, and the two lives pull. Some of them come apart at the seams. I've sat with a great many.” She doesn't elaborate.",
        next: 'go',
      },
      go: {
        speaker: 'comp:ilyra',
        text: "She stands, rolls her sleeves down, and picks up her satchel. “Thank you,” she says. Then, almost to herself: “Nine years in the water. Lights keep him.”",
        interjections: [
          { who: 'seris', text: "“The Order would call him an abomination,” Seris says. It sounds like recitation. Ilyra doesn't argue. “The Order calls a lot of things a lot of things,” she says mildly." },
          { who: 'brakka', text: "Brakka is very quiet. “Someone else who woke up in the wrong life,” she says at last. “I'll come.”" },
        ],
        end: true,
      },
      later: {
        speaker: 'comp:ilyra',
        text: "“Of course.” She doesn't sit back down. “He'll wait. They always wait. That's the hardest part.”",
        end: true,
      },
    },
  },
  {
    id: 'cq_ilyra_coll',
    title: 'The Drowned Man',
    start: [
      { if: 'quest:cq_ilyra=mill', node: 'start' },
      { if: 'quest:cq_ilyra=abel', node: 'waiting' },
      { node: 'resume' },
    ],
    nodes: {
      waiting: {
        speaker: 'dm',
        text: "Coll sits by the race, dripping. “Did he come?” he asks, without looking round. “He won't come.”",
        end: true,
      },
      resume: {
        speaker: 'dm',
        text: "Coll Thorn stands by the mill-race with the water running off his fingers, waiting for you to tell him what happens now.",
        options: [{ text: "Go to him with Ilyra.", tone: 'compassionate', effects: ['dialogue cq_ilyra_choice'] }],
      },
      start: {
        speaker: 'dm',
        text: "A man sits on the bank of the mill-race with his boots in the water, as if he's forgotten they're there. He's soaked to the skin, though the morning is dry; water drips steadily from his hair and his cuffs and the ends of his fingers, and does not stop. He has Abel Thorn's jaw and Abel Thorn's big, flour-dusted hands. He's younger. He is exactly as young as a man who drowned nine years ago.",
        next: 'c1',
      },
      c1: {
        speaker: 'dm',
        text: "“You're the priest,” he says, without looking round. “Tobin said. Sit, if you like. It's not wet here. Just me.”",
        next: 'i1',
      },
      i1: {
        speaker: 'comp:ilyra',
        text: "Ilyra sits beside him on the bank, close but not touching, the way you'd sit beside a frightened animal. “I'm Ilyra. Tell me as much as you like, Coll. Or nothing. I've got all day.”",
        next: 'c2',
      },
      c2: {
        speaker: 'dm',
        text: "“I drowned,” Coll says. “I remember it. The cold. The wheel going round over me, green light, the noise. And I remember not drowning. Walking out of the race that night with a cut on my head. Going to Ashenford. Marrying a girl called Brannagh who laughed like a gate.” His voice cracks. “We had a daughter. Posy. She's six. I taught her to whistle. Both are true. Both are true, and they're tearing me down the middle.”",
        effects: ['clue cq_ilyra posy'],
        next: 'c3',
      },
      c3: {
        speaker: 'dm',
        text: "He turns to Ilyra at last, and his eyes are the grey of deep water. “You've helped others like me,” he says. “I can see it on you, like a lamp. You know how to let us go gently.” His dripping hand finds her sleeve. “Please. Let me go back to the water. Gently. I can't carry both.”",
        next: 'i2',
      },
      i2: {
        speaker: 'dm',
        text: "Ilyra goes very still. For a long moment she doesn't answer at all, and you realise she isn't shocked. She's remembering. Then she puts her hand over his. “Give me today, Coll,” she says, quite steadily. “One day. Let me speak to your brother.”",
        effects: ['set ilyra_mercy_hint'],
        interjections: [
          { who: 'seris', text: "Seris's head turns sharply. “What does he mean,” she says, “‘helped others’?” “He means I'm a hospice priestess, Seris,” Ilyra says, without looking away from Coll. It is a true answer. It is not an answer." },
        ],
        options: [
          { text: "I'll come with you to Abel.", tone: 'friendly', tags: ['mercy'], effects: ['quest cq_ilyra abel'], end: true },
          { text: "(Insight) Ilyra — what did he see on you?", tone: 'curious', check: { skill: 'insight', dc: 15, who: 'player' }, success: 'i_seen', failure: 'i_closed' },
        ],
      },
      i_seen: {
        speaker: 'dm',
        text: "Ilyra's thumb is moving on her bare ring finger, round and round. She knows exactly what he saw. She knows, you suspect, how much of which herb, and which hour of the night, and which prayer. She meets your eyes and gives the smallest shake of her head: not here. Not now. Perhaps not ever.",
        effects: ['rel ilyra trust 2'],
        options: [{ text: "Let's find Abel.", tone: 'friendly', effects: ['quest cq_ilyra abel'], end: true }],
      },
      i_closed: {
        speaker: 'comp:ilyra',
        text: "“Grief,” Ilyra says lightly. “The returned see it on everyone. It's a kind of second sight.” Her smile is perfectly kind and perfectly closed. “Come on. Abel's at the mill.”",
        effects: ['quest cq_ilyra abel'],
        end: true,
      },
    },
  },
  {
    id: 'cq_ilyra_abel',
    title: 'Abel Thorn',
    start: [{ if: 'quest:cq_ilyra=abel', node: 'start' }, { node: 'idle' }],
    nodes: {
      idle: {
        speaker: 'abel',
        text: "Abel Thorn is working the mill. He doesn't look up.",
        end: true,
      },
      start: {
        speaker: 'abel',
        text: "Abel Thorn stands in the mill doorway with a sack of grain on one shoulder and his back very deliberately turned to the race. He sees you coming and doesn't put the sack down. “If you're here about that,” he says, “I've nothing to say to it.”",
        next: 'i1',
      },
      i1: {
        speaker: 'comp:ilyra',
        text: "“Not it, Master Thorn. Him. He says he's your brother.”",
        next: 'a1',
      },
      a1: {
        speaker: 'abel',
        text: "“My brother's in the churchyard. I dug the hole. I carved the stone myself; my hands bled for a week.” The sack thumps down at last. His voice splits like a board. “That's a fog-thing wearing Coll's face. It knows things. It knows about the apple tree. I'll not go near it.”",
        interjections: [
          { who: 'brakka', text: "“I'd give my beard,” Brakka says quietly, “for one of mine to walk out of the water. Even a wrong one.” Abel looks at her for a long moment." },
          { who: 'korr', text: "Korr says nothing. But he looks at Abel the way you'd look at a man standing at the edge of a grave you know well." },
        ],
        options: [
          { text: "(Persuasion) “It knows about the apple tree because he remembers it. Come and see. Just look.”", tone: 'compassionate', tags: ['mercy', 'diplomacy'], check: { skill: 'persuasion', dc: 14, advIf: 'comp:brakka || comp:tessa' }, success: 'a_yes', failure: 'a_no' },
          { text: "(Intimidation) “You'll come and look at your brother, Abel. Now.”", tone: 'aggressive', tags: ['authority'], check: { skill: 'intimidation', dc: 14 }, success: 'a_yes_hard', failure: 'a_no' },
        ],
      },
      a_yes: {
        speaker: 'abel',
        text: "Abel stands there a long time with his big hands hanging. “Just look,” he says at last, as if bargaining with himself. “Just look. Then I'm going back to work.” He walks down to the race like a man walking into a cold sea.",
        next: 'a_meet',
      },
      a_yes_hard: {
        speaker: 'dm',
        text: "Abel's jaw sets — and then something in him gives. Not to you; to the permission. “Fine,” he says thickly. “Fine. I'll look at it.” He walks down to the race with his fists clenched.",
        effects: ['rel ilyra trust -1'],
        next: 'a_meet',
      },
      a_meet: {
        speaker: 'dm',
        text: "The brothers look at each other across six feet of grass for a long time. Then Coll says, “You kept the apple tree, then,” and Abel makes a sound like something tearing, and crosses the six feet, and holds his dripping brother so hard that the water runs out of Coll's sleeves and down Abel's back. Neither of them lets go.",
        effects: ['set cq_ilyra_abel_came', 'quest cq_ilyra choice'],
        options: [{ text: "Give them a moment. Then go down with Ilyra.", tone: 'compassionate', tags: ['mercy'], effects: ['dialogue cq_ilyra_choice'] }],
      },
      a_no: {
        speaker: 'abel',
        text: "“No.” He shoulders the sack again. “I buried him. I'll not bury him twice.” He goes into the mill and shuts the door, and after a moment the great wheel starts to turn, loud and then louder, drowning out everything.",
        effects: ['quest cq_ilyra choice'],
        options: [{ text: "Go back down to the race.", tone: 'compassionate', effects: ['dialogue cq_ilyra_choice'] }],
      },
    },
  },
  {
    id: 'cq_ilyra_choice',
    title: 'By the Mill-Race',
    start: [{ if: 'cq_ilyra_abel_came', node: 'with_abel' }, { node: 'alone' }],
    nodes: {
      with_abel: {
        speaker: 'comp:ilyra',
        text: "Ilyra watches the brothers with her hand over her mouth. When she lowers it she's smiling, and crying, and you have never seen her look so frightened. “He still wants to go back to the water,” she says to you, very low. “I can see it. Even now. Two lives, and his brother is only in one of them.”",
        next: 'decide',
      },
      alone: {
        speaker: 'dm',
        text: "Coll has heard the wheel. He knows what it means. When you come back down the bank he is standing in the race up to his knees, very still, looking at the water. Ilyra wades in after him without a word and takes his arm.",
        next: 'decide',
      },
      decide: {
        speaker: 'comp:ilyra',
        decision: true,
        text: "“Help me,” Ilyra says over her shoulder. “What do we offer him? I've done this for years and I am still never sure.”",
        interjections: [
          { who: 'seris', text: "Seris's hand rests on her sword hilt. Not drawn. Just resting there, white-knuckled. She does not seem to know herself whether she means to stop someone or to stand guard." },
          { who: 'varek', text: "“Two lives,” Varek says softly. “And everyone wants him to choose. Nobody asks whether he could keep both.”" },
          { who: 'kael', text: "Kael has gone very quiet. “Posy,” he says, to nobody. “Six. Learning to whistle.”" },
        ],
        options: [
          { text: "Stay, Coll. Your brother's here. Start again, with him.", if: 'cq_ilyra_abel_came', tone: 'compassionate', tags: ['mercy', 'protect'], next: 'stay' },
          { text: "Go to Ashenford. Find out whether Brannagh and Posy are real. (10 gold for the coach)", tone: 'friendly', tags: ['curiosity', 'charity'], next: 'seek' },
          { text: "Ilyra... he's asking you for something, and you know what it is. Do what you think is right.", tone: 'compassionate', tags: ['mercy'], next: 'vigil' },
        ],
      },
      stay: {
        speaker: 'dm',
        text: "Coll looks at his brother, and his brother looks back, red-eyed and stubborn. “There's a bed,” Abel says roughly. “Your old one. I never—” He stops. “The roof leaks.” “It always leaked,” says Coll, and something in his face settles: not healed, not whole, but anchored, like a boat on a short rope. The water dripping from his fingers slows. Doesn't stop. Slows.",
        next: 'stay2',
      },
      stay2: {
        speaker: 'comp:ilyra',
        text: "On the walk back Ilyra says, “People will talk. Someone's Order will come asking.” She sighs. “And some mornings he'll wake up a father in Ashenford with no daughter in the house. I'll write to him. Every week.” A small, broken laugh. “I know a little about that.”",
        effects: ['complete cq_ilyra stayed', 'set cq_ilyra_outcome stayed', 'set coll_in_hollowmere', 'xp 150', 'rel ilyra trust 5', 'rel ilyra affection 3', 'memory ilyra 3 You helped Coll Thorn come home to his brother.'],
        next: 'stone',
      },
      seek: {
        speaker: 'dm',
        text: "Coll stares at you. “Ashenford,” he says, as though you had named a star. “If they're real—” “And if they're not,” Ilyra says gently, “you come to me. Not to the water. To me.” She writes on a page torn from her prayer book — the name of a hospice in Solmara, and her own — and folds his wet fingers around it, and ten of your gold with it for the coach, without asking you first. You find you don't mind.",
        effects: ['gold -10'],
        next: 'seek2',
      },
      seek2: {
        speaker: 'comp:ilyra',
        text: "When he has gone up the lane, still dripping, she says, “Maybe they're there. Maybe Posy's whistling in a yard in Ashenford right now.” She takes your arm for the walk back. “I like that one. I'm going to believe that one, until I can't.”",
        effects: ['complete cq_ilyra sought', 'set cq_ilyra_outcome sought', 'set coll_to_ashenford', 'xp 150', 'rel ilyra trust 4', 'rel ilyra respect 3', 'memory ilyra 2 We sent Coll Thorn to look for his daughter.'],
        next: 'stone',
      },
      vigil: {
        speaker: 'dm',
        text: "Ilyra looks at you for a long time. You cannot read what is in her face; you are not sure she can. “Yes,” she says at last. “I know what he's asking.” She turns to Coll. “Not today,” she tells him. “But I'll sit with you. All night, if you like. We'll talk about Posy, and the apple tree, and the green light. And in the morning you can ask me again.”",
        next: 'vigil2',
      },
      vigil2: {
        speaker: 'dm',
        text: "She sits with him on the bank until the stars come out and go in again. You keep watch from the mill wall. At dawn Coll Thorn is asleep with his head on her satchel, and the water has stopped dripping from his hands, and Ilyra is sitting very upright beside him with an expression you will remember for a long time.",
        effects: ['time 480'],
        next: 'vigil3',
      },
      vigil3: {
        speaker: 'comp:ilyra',
        text: "On the way back she says, without preamble, “He asked me for something tonight. I have given it before.” She doesn't look at you. “Not tonight.” Then, before you can answer: “Thank you for leaving it to me. Nobody ever leaves it to me. They tell me what the Church says, or what mercy says. You let me choose.”",
        effects: ['complete cq_ilyra vigil', 'set cq_ilyra_outcome vigil', 'set coll_in_hollowmere', 'xp 175', 'rel ilyra trust 7', 'rel ilyra affection 3', 'memory ilyra 3 You trusted me to choose, by the mill-race with Coll.'],
        next: 'stone',
      },
      stone: {
        speaker: 'dm',
        text: "Before you leave the mill, Ilyra stoops at the edge of the race and fishes out a smooth grey stone the size of a thumb, polished by nine years of water. She ties it into a little cradle of blessed thread and hangs it round your neck. “Veyra's knot,” she says. “For the ones who remember two things at once. I think you'll need it more than most.”",
        effects: ['give cq_ilyra_stone'],
        end: true,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ VAREK

const VAREK: DialogueTree[] = [
  {
    id: 'cq_varek_start',
    title: 'A personal matter: Varek',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "Varek is sitting in the dark with the candle unlit. When you come in, his eyes are the only light in the room: two violet points, steady. He doesn't pretend he wasn't waiting for you.",
        next: 'v1',
      },
      v1: {
        speaker: 'comp:varek',
        text: "“They've gone quieter since you touched the Heart,” he says. “Quieter, and closer. Like a crowd that has stopped shouting because it's finally near enough to whisper.” He turns his cup in his long fingers. “Tonight they asked me for something. They never ask. They take, or they give. They don't ask.”",
        options: [
          { text: "What did they ask for?", tone: 'curious', tags: ['curiosity'], effects: ['quest cq_varek threshold'], next: 'what' },
          { text: "Then don't answer them.", tone: 'pragmatic', tags: ['caution'], next: 'dont' },
          { text: "Not now.", tone: 'leave', next: 'later' },
        ],
      },
      dont: {
        speaker: 'comp:varek',
        text: "“I've tried that.” He smiles thinly. “It's like not answering the sea.” A pause. “I would rather go and hear them out properly, at the place where they're loudest, with someone beside me who isn't afraid of me.”",
        options: [
          { text: "I'll come.", tone: 'friendly', tags: ['protect'], effects: ['quest cq_varek threshold', 'rel varek trust 2'], next: 'what' },
          { text: "Not now.", tone: 'leave', next: 'later' },
        ],
      },
      what: {
        speaker: 'comp:varek',
        text: "“I don't know yet. They want me at the vault. ‘At the threshold,’ they said — the sealed door beneath the cathedral, where the Sentinel stood.” He sets the cup down very precisely. “I'd rather not go alone. And I'd rather not go with someone who'll tell me what to do.” A wry tilt of the head. “You're the compromise. Don't let it go to your head.”",
        interjections: [
          { who: 'seris', text: "Seris is on her feet. “You will not bargain with that thing under a holy roof.” Varek doesn't even look at her. “It was a holy roof,” he says. “Now it's a hole.”" },
          { who: 'ilyra', text: "Ilyra says gently, “Whatever they ask, you're allowed to say no, Varek. Even to them.” He looks at her a long moment. “I've never been sure of that,” he says." },
        ],
        end: true,
      },
      later: {
        speaker: 'comp:varek',
        text: "“Of course.” His eyes dim slightly, as if he has closed them. “They're patient. It's the worst thing about them.”",
        end: true,
      },
    },
  },
  {
    id: 'cq_varek_threshold',
    title: 'The Threshold',
    start: [{ if: 'quest:cq_varek', node: 'start' }, { node: 'idle' }],
    nodes: {
      idle: {
        speaker: 'dm',
        text: "The sealed threshold is cold and quiet. If anything is singing below it, it is singing to someone else.",
        end: true,
      },
      start: {
        speaker: 'dm',
        text: "The antechamber before the vault door is cold and very quiet. Then Varek stops at the threshold, and it isn't quiet any more. You can't hear it, not really — but your teeth can. A vibration in the stone, in the air, in the roots of your jaw: many voices, very far down, holding one long chord with no beginning. Varek's eyes blaze violet. He sways.",
        effects: ['quest cq_varek bargain'],
        next: 'v1',
      },
      v1: {
        speaker: 'comp:varek',
        text: "“They're so loud here,” he says, almost tenderly. “Listen. No — you can't. I'll translate.” He tilts his head. “They want a name. Not a soul. Not my blood. A name, to keep, the way you'd press a flower in a book. In return, a verse: a little more of their voice in mine.” His jaw tightens. “Enough that I'd be harder to erase. For a while.”",
        next: 'v2',
      },
      v2: {
        speaker: 'comp:varek',
        text: "“Whose name?” He answers before you can ask. “Mine would do. Or—” He stops. Starts again. “My mother's. I don't remember her face. They took me from her when my eyes started to glow. I remember her name. That's all I have of her. Isel.” He says it the way people touch a bruise. “They want Isel.”",
        next: 'decide',
      },
      decide: {
        speaker: 'comp:varek',
        decision: true,
        text: "“Well?” His voice is light. His hands aren't. “Tell me what I'm going to do, so that I can resent you for it later.”",
        interjections: [
          { who: 'seris', text: "“Warlock.” Seris's voice is iron. “If you sell your mother's name to whatever lies under that door, do not expect me to pray for you.” “I never have,” says Varek." },
          { who: 'kael', text: "Kael, low: “Never trade the thing they want most. Lesson one. It means it's worth more than they're offering.”" },
          { who: 'ilyra', text: "Ilyra says nothing. She simply moves to stand at Varek's shoulder, where he'll know she is there." },
        ],
        options: [
          { text: "Take the bargain. ‘Power is the only protection the forgotten get.’ Your words.", tone: 'pragmatic', tags: ['pragmatic', 'forbidden'], next: 'bargain' },
          { text: "No. Not her name, and not yours. Tell them no.", tone: 'compassionate', tags: ['defiance', 'protect'], next: 'refuse' },
          { text: "Offer them a name nobody else is holding: Halric Venn, the bell-ringer. They'd keep him.", tone: 'curious', tags: ['pragmatic', 'knowledge'], next: 'halric' },
          { text: "(Deception) Haggle. Make them say what they are before you pay anything.", once: true, tone: 'deceptive', tags: ['curiosity', 'deception'], check: { skill: 'deception', dc: 15, advIf: 'comp:tessa || comp:kael' }, success: 'haggle_ok', failure: 'haggle_bad' },
        ],
      },
      haggle_ok: {
        speaker: 'dm',
        text: "Varek speaks to the door — not in words but in a hum, the descending tune with the little turn at the end. He asks a question. You feel the chord shift under your feet, considering. When it answers, the stone carries it so clearly that you hear it too: not one voice but a thousand, whispering in unison. We were. We are many. We are so quiet. We are waiting for the door.",
        effects: ['set varek_choir_answer', 'clue cq_varek answer'],
        next: 'haggle_ok2',
      },
      haggle_ok2: {
        speaker: 'comp:varek',
        text: "Varek has gone grey under the violet glow. “They've never told me that,” he whispers. “Twelve years. They've never once said what they—” He stops. “‘We were.’ What does that mean, ‘we were’?” He shakes himself, hard. “Still. They want a name.”",
        next: 'decide',
      },
      haggle_bad: {
        speaker: 'dm',
        text: "Varek hums his question at the door, and the chord answers by getting louder. And louder. A thousand voices at once — not words, only volume. Your ears pop, your nose runs warm, and Varek drops to one knee with blood on his lip. When it stops, the silence rings. “That,” he says thickly, “was them saying no.”",
        effects: ['damage 1d6 psychic'],
        next: 'decide',
      },
      bargain: {
        speaker: 'dm',
        text: "Varek closes his eyes and says the name once, aloud, to the door. “Isel.” The chord swells, warm and pleased, and pours into him: you watch it go, a violet tide under his skin, up his throat, into his eyes. When it's done he opens them, and they are brighter. Steadier. He looks... more. More here. More permanent. And he frowns, slightly, the way you frown at a word on the tip of your tongue.",
        next: 'bargain2',
      },
      bargain2: {
        speaker: 'comp:varek',
        text: "“There was a name,” he says slowly. “My mother's. I had it a moment ago.” He searches. You watch him search. “It's fine,” he says at last — and it's the most frightening thing you have ever heard him say, because he means it. “It was a fair price. I'm harder to erase now. That's what I wanted.” He takes a silver locket from his coat — empty; it has always been empty — and hands it to you. It's humming. “Keep this. They put the verse in it. I'd rather you held it than me.”",
        effects: ['complete cq_varek bargained', 'set cq_varek_outcome bargained', 'set varek_mother_forgotten', 'xp 150', 'give cq_varek_locket', 'rel varek trust 3', 'rel varek respect 3', 'memory varek 1 You told me to take the Choir\'s bargain. I gave them a name. I don\'t remember whose.'],
        end: true,
      },
      refuse: {
        speaker: 'dm',
        text: "Varek turns his face from the door. For a long moment the chord holds, waiting. Then he says, aloud and very clearly, “No.” The stone shivers. Somewhere far below, a thousand voices sigh — not angry; disappointed, the way a crowd sighs when a song stops one note too soon. The ache in your teeth fades. Varek's eyes dim to their usual glow.",
        next: 'refuse2',
      },
      refuse2: {
        speaker: 'comp:varek',
        text: "He leans back against the wall and laughs, a little shakily. “I've never said that to them. Twelve years.” He looks at you. “Isel,” he says, testing it, and his whole face loosens with relief. “Still mine.” He presses a small purse on you. “For your time. A debt is a debt.” Then, because he can't help himself: “They'll ask again. They'll ask nicer. You'd better be there.”",
        effects: ['complete cq_varek refused', 'set cq_varek_outcome refused', 'xp 150', 'gold 50', 'rel varek trust 7', 'rel varek affection 4', 'memory varek 3 You told me to keep my mother\'s name. I did.'],
        end: true,
      },
      halric: {
        speaker: 'dm',
        text: "Varek considers that a long moment. “Halric Venn,” he says to the door, carefully. “Bell-ringer of Saint Orlen's. Who rang for eighty years for a town that forgot him.” The chord stops. Then it swells, and the swell has a shape you almost recognise: the bell's tune, the one that rang at midnight, sung by a thousand voices very far away. Pleased. Welcoming. As if he had been expected.",
        interjections: [
          { who: 'tessa', text: "Tessa has both hands over her mouth. “They're singing his tune,” she whispers. “They know his tune.”" },
        ],
        next: 'halric2',
      },
      halric2: {
        speaker: 'comp:varek',
        text: "Varek's eyes have brightened, though not as much as they might have. “They took him,” he says. “Gladly. As if they'd been waiting for him.” He frowns. “Half a verse. Half price, for a borrowed name.” He hands you a silver locket, humming faintly. “Keep it. And — thank you. For not making me choose between her and myself.”",
        effects: ['complete cq_varek halric', 'set cq_varek_outcome halric', 'set halric_name_given', 'xp 150', 'give cq_varek_locket', 'rel varek trust 5', 'rel varek affection 2', 'memory varek 2 You found the Choir a name that wasn\'t my mother\'s.'],
        end: true,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ TESSA

const TESSA: DialogueTree[] = [
  {
    id: 'cq_tessa_start',
    title: 'A personal matter: Tessa',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: 'prologue_complete', text: "Tessa is perched on the windowsill in the morning light with her songbook open on her knees and her lute untouched beside her. She's humming under her breath: the bell's tune, the one that tolled at midnight. She stops when she sees you, guiltily, like a child caught singing in church." },
          { text: "Tessa is perched on the windowsill with her songbook open on her knees and her lute untouched beside her. The fog outside makes the lantern-light soft and strange. She's humming under her breath: the bell's tune, the one that tolled at midnight. She stops when she sees you, guiltily, like a child caught singing in church." },
        ],
        next: 't1',
      },
      t1: {
        speaker: 'comp:tessa',
        text: "“It's in here.” She taps a page: a melody line in faded ink, no words, a great many crossings-out. “My songs with no origin. Tunes everyone half-knows and nobody can say where they learned. I've collected them since I was tiny.” Her finger traces the line. “The bell played this one. Exactly. Except the bell knew the second verse, and I've only ever had holes.”",
        next: 't2',
      },
      t2: {
        speaker: 'comp:tessa',
        text: "“And Lio Fenwick, the minstrel downstairs, hums it. I've heard him, when he thinks nobody's listening. He hums the holes.” She closes the book on her finger. “I want to ask him. I want to put the verse back together and hear it whole, once.” Her smile is bright and very brief. “Is that mad?”",
        options: [
          { text: "Not mad. Let's find Lio.", tone: 'friendly', tags: ['curiosity'], effects: ['quest cq_tessa lio', 'rel tessa trust 2'], next: 'go' },
          { text: "A bell from nowhere played your song. Doesn't that frighten you?", tone: 'curious', tags: ['caution'], next: 'frighten' },
          { text: "Not now.", tone: 'leave', next: 'later' },
        ],
      },
      frighten: {
        speaker: 'comp:tessa',
        text: "“Terrifies me.” She says it cheerfully, which is how you know it's true. “Songs are doors, darling. Most of them open onto a room with a fire in it. Some of them...” Her hands go still on the book. “Well. You'd want to know which kind before you knocked.” She hops down. “So we'll ask Lio. Carefully.”",
        effects: ['quest cq_tessa lio', 'rel tessa trust 1'],
        next: 'go',
      },
      go: {
        speaker: 'comp:tessa',
        text: "“He'll be at the Lantern & Lamb. He's always at the Lantern & Lamb; I think Tobin keeps him in a cupboard.” She tucks the songbook under her arm like a shield. “Bring your ears.”",
        interjections: [
          { who: 'nima', text: "“Can I come? I'll hum. I'm a terrible hummer. I'll be the bass.”" },
          { who: 'brakka', text: "“If this is one of those songs that sets the fog off,” Brakka says, “I'm bringing my shield.” “Bring it,” Tessa says. “Bring two.”" },
        ],
        end: true,
      },
      later: {
        speaker: 'comp:tessa',
        text: "“Course.” She shuts the book. “It's waited this long.” She doesn't put it away, though. She holds it.",
        end: true,
      },
    },
  },
  {
    id: 'cq_tessa_lio',
    title: 'Lio Fenwick',
    start: 'start',
    nodes: {
      start: {
        speaker: 'lio',
        text: "Lio Fenwick looks up from re-stringing his lute and sees Tessa Quickthorn bearing down on him with an open songbook and a look of terrible purpose. He goes slightly pale. “Is this about the jig? I said I was sorry about the jig.”",
        next: 't1',
      },
      t1: {
        speaker: 'comp:tessa',
        text: "“Not the jig.” She lays the book on the table in front of him and hums the bell's tune, softly. Lio's face changes. “Where did you learn that?” she asks.",
        next: 'l1',
      },
      l1: {
        speaker: 'lio',
        text: "“My gran. She hummed it pegging out the washing.” Lio's fingers have already found it on his lute without being asked. “She said her gran learned it from the bell — the real one, before the tower fell. There were words, but she only knew bits.” He plucks the holes in Tessa's melody, and fills them. “Something like... ring for the ones who are lost in the grey... ring them back...”",
        effects: ['clue cq_tessa gran'],
        next: 'rebuild',
      },
      rebuild: {
        speaker: 'dm',
        text: "Tessa sits down opposite him with her quill. For a while they work together — humming, arguing, scratching out — two minstrels hunched over a table with their heads almost touching. Then they reach the last line, and disagree about a single note.",
        options: [
          { text: "(Performance) Sing both versions. Listen for the true one.", tone: 'curious', check: { skill: 'performance', dc: 14, advIf: 'class:bard || bg:entertainer' }, success: 'whole', failure: 'flawed' },
          { text: "(History) The bell's inscription — ‘I ring for the town that remembers me.’ Does it fit the metre?", if: 'item:bell_rubbing || bellwarden_defeated', tone: 'curious', check: { skill: 'history', dc: 12 }, success: 'whole', failure: 'flawed' },
          { text: "Let Tessa decide. It's her song.", tone: 'friendly', tags: ['mercy'], effects: ['rel tessa trust 2'], next: 'flawed_tessa' },
        ],
      },
      whole: {
        speaker: 'dm',
        text: "You sing it Lio's way, then Tessa's way. Lio's way makes the candle on the table gutter. Tessa's way doesn't. You all hear it: the note that sits right, like a key turning in a lock. Tessa goes very still. Then she writes it down, and her hand is shaking. “That's it,” she says. “That's the whole verse.”",
        effects: ['set cq_tessa_verse whole'],
        next: 'after',
      },
      flawed: {
        speaker: 'dm',
        text: "You sing them both. Both sound right. Both sound wrong. Lio is sure of his, Tessa is sure of hers, and in the end she writes hers, because it's her book. “Close enough,” she says brightly. Lio opens his mouth, looks at her face, and closes it again.",
        effects: ['set cq_tessa_verse flawed'],
        next: 'after',
      },
      flawed_tessa: {
        speaker: 'dm',
        text: "Tessa doesn't hesitate. She writes her note, firmly. “Mine,” she says. “Gran's gran wasn't a professional.” Lio opens his mouth, looks at her face, and closes it again. You hope she's right. You aren't sure she is.",
        effects: ['set cq_tessa_verse flawed'],
        next: 'after',
      },
      after: {
        speaker: 'lio',
        text: "Lio looks at the finished page as though it might bite. “Are you going to sing it?” he asks. “All of it? Gran said—” He stops. “Gran said you shouldn't. Not all the way through. Not where the bell can hear.”",
        next: 'after2',
      },
      after2: {
        speaker: 'comp:tessa',
        text: "“Where the bell can hear,” Tessa repeats softly. She closes the book. “Where the bell was, then. The cathedral. The fallen tower.” She's smiling, and her eyes are far away and frightened. “Where else would you sing a bell's song?”",
        effects: ['quest cq_tessa tower'],
        end: true,
      },
    },
  },
  {
    id: 'cq_tessa_tower',
    title: 'The Fallen Tower',
    start: [{ if: 'quest:cq_tessa=tower', node: 'start' }, { node: 'idle' }],
    nodes: {
      idle: {
        speaker: 'dm',
        text: "The bell rope hangs still above the shaft.",
        end: true,
      },
      start: {
        speaker: 'dm',
        text: "The stump of the bell tower rises from its own rubble at the cathedral's west end, a broken throat open to the sky. An old bell rope still hangs from a beam above the shaft, swaying, though there is no wind. Tessa stands at the foot of the rubble with the songbook open and her lute on her back, and for once in her life she isn't saying anything.",
        next: 't1',
      },
      t1: {
        speaker: 'comp:tessa',
        text: "“I sang a whole song like this once,” she says at last, very quietly. “On a beach. Two years ago. It was beautiful.” She swallows. “Afterwards it was very, very quiet.” She looks at you. “I don't want to tell you the rest. Will you tell me what to do instead?”",
        effects: ['set tessa_secret_hint'],
        next: 'decide',
      },
      decide: {
        speaker: 'comp:tessa',
        decision: true,
        text: "She holds up the page. “All of it? Half? Or none, and I close the book?”",
        interjections: [
          { who: 'brakka', text: "Brakka has her shield up already, planted in the rubble. “Whatever comes out of that tower,” she says, “comes through me first.”" },
          { who: 'korr', text: "Korr has stepped to Tessa's left side, where an oath-brother stands. He doesn't say why." },
          { who: 'nima', text: "“If you sing it,” Nima says, “I'll set fire to anything that complains.”" },
          { who: 'vaelis', text: "“A melodic key to a resonant structure,” Vaelis murmurs. “Of course. Of course it is.” He doesn't tell her to stop. He looks like he wants to." },
        ],
        options: [
          { text: "Sing it all. Every word.", if: 'cq_tessa_verse=whole', tone: 'friendly', tags: ['boldness', 'curiosity'], next: 'sung' },
          { text: "Sing it all. Every word.", if: 'cq_tessa_verse!=whole', tone: 'friendly', tags: ['boldness', 'curiosity'], next: 'torn' },
          { text: "Sing the first half. Leave the last line unsung.", tone: 'pragmatic', tags: ['caution'], next: 'half' },
          { text: "Don't sing it. Write it down, close the book, and walk away with me.", tone: 'compassionate', tags: ['caution', 'mercy'], next: 'unsung' },
        ],
      },
      sung: {
        speaker: 'dm',
        text: "Tessa sings. Her voice is small at first and then not small at all, and the words Lio's grandmother half-remembered come out whole: ring for the ones who are lost in the grey, ring them back, ring them home. On the last line the bell rope above the shaft begins to swing on its own. And for one heartbeat the tower is there — whole, honey-coloured stone, a stair winding up into lantern-light, and at the top, very far up, the bronze curve of a bell with a young monk's hand on its rope, waving down to you.",
        next: 'sung2',
      },
      sung2: {
        speaker: 'dm',
        text: "Then it's rubble again. But one stone low in the heap has slid aside, the way stone slides when someone presses the right carving. Behind it, in a niche that was not there a moment ago, sits a small wooden box, dry and free of dust. In it: a bell-ringer's tuning fork of old bronze, a stub of candle, and a child's drawing of a bell with a smiling face.",
        effects: ['set cq_tessa_box'],
        next: 'sung3',
      },
      sung3: {
        speaker: 'comp:tessa',
        text: "Tessa is crying openly, the songbook clutched to her chest. “It wasn't quiet,” she says. “It wasn't quiet afterwards. That was — that was him, wasn't it? Waving.” She laughs, wet. “I'll write him a song. A proper one, with his name in it.” She presses the tuning fork into your hands. “You take it. You told me to sing.”",
        effects: ['complete cq_tessa sung', 'set cq_tessa_outcome sung', 'xp 175', 'give cq_tessa_fork', 'rel tessa trust 6', 'rel tessa affection 5', 'memory tessa 3 You told me to sing it all, and it wasn\'t quiet afterwards.'],
        end: true,
      },
      torn: {
        speaker: 'dm',
        text: "Tessa sings. Her voice is small at first and then not small at all, and the words come out whole — all but one note on the last line, which lands a hair's breadth wrong. You feel it go wrong. The bell rope jerks. The air above the shaft tears with a sound like wet cloth, and out of the tear the fog pours, grey and cold and full of voices, and in the voices there are shapes.",
        options: [{ text: "Get in front of her!", tone: 'aggressive', tags: ['protect'], effects: ['combat cq_enc_tessa_echoes'] }],
      },
      half: {
        speaker: 'dm',
        text: "Tessa sings the first half, and stops. The bell rope above the shaft lifts as though someone has taken hold of it — and waits. Something in the rubble shifts, a stone grinding a quarter-inch and no further. The silence afterwards isn't empty. It's expectant. After a while the rope falls still.",
        next: 'half2',
      },
      half2: {
        speaker: 'comp:tessa',
        text: "“Like knocking and running away,” Tessa says, with a shaky laugh. She closes the book carefully, as if something inside might fall out. “Whatever's behind that door knows the tune now. It'll wait.” She presses half her festival fee on you and won't hear otherwise. “Thank you. For leaving me a way back.”",
        effects: ['complete cq_tessa half', 'set cq_tessa_outcome half', 'xp 125', 'gold 40', 'rel tessa trust 4', 'memory tessa 2 You told me to sing half and leave a way back.'],
        end: true,
      },
      unsung: {
        speaker: 'comp:tessa',
        text: "Tessa looks at you for a long moment. Then she lets out a breath she seems to have been holding for two years. “...Yes,” she says. “Yes. You're right.” She closes the book and ties the ribbon round it twice. “Last time, nobody told me not to.” She stops. She doesn't say the rest. She doesn't have to.",
        next: 'unsung2',
      },
      unsung2: {
        speaker: 'comp:tessa',
        text: "On the way out she takes your hand, briefly, and squeezes it. “I'll still write it down. All of it. Somebody should remember it.” A wobbly grin. She presses half her festival fee on you and won't hear otherwise. “Just maybe not out loud.”",
        effects: ['complete cq_tessa unsung', 'set cq_tessa_outcome unsung', 'xp 125', 'gold 40', 'rel tessa trust 5', 'rel tessa affection 3', 'memory tessa 2 You told me not to sing it. Nobody stopped me last time.'],
        end: true,
      },
    },
  },
  {
    id: 'cq_tessa_after',
    title: 'The Mended Page',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "The last shape comes apart in the nave and does not come back together. The tear above the shaft has closed; you can still see where it was, a faint seam in the light, like a mended page. Tessa sits on the rubble with her lute in her lap and both hands pressed over her mouth.",
        next: 't',
      },
      t: {
        speaker: 'comp:tessa',
        text: "“One note,” she says through her fingers. “One note wrong and it opens the wrong door.” Her eyes are huge. “That's what happened before. Isn't it. That's what I did before.” She doesn't explain. She isn't really talking to you.",
        options: [
          { text: "Whatever happened before, this time we were here. We closed it.", tone: 'compassionate', tags: ['protect'], effects: ['rel tessa trust 5', 'rel tessa affection 3'], next: 'end' },
          { text: "Tessa. What happened before?", tone: 'curious', tags: ['curiosity'], effects: ['rel tessa trust -1'], next: 'before' },
        ],
      },
      before: {
        speaker: 'comp:tessa',
        text: "“My company disbanded,” Tessa says, too fast: the old line. Then she hears herself, and closes her eyes. “...Not tonight. Please. I'll tell you. Not tonight.”",
        next: 'end',
      },
      end: {
        speaker: 'dm',
        text: "When you help her up, something tumbles out of the rubble where the tear closed: a small wooden box, dry and free of dust, holding a bell-ringer's tuning fork of old bronze and a child's drawing of a bell with a smiling face. Tessa looks at the drawing a long time. Then she gives you the fork. “Keep it,” she says. “I don't trust myself to tune anything for a while.”",
        effects: ['complete cq_tessa torn', 'set cq_tessa_outcome torn', 'xp 150', 'give cq_tessa_fork', 'memory tessa -1 The verse was one note wrong, and the fog came through it.'],
        end: true,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ CONFLICTS

const CONFLICT_TREES: DialogueTree[] = [
  // ── Seris vs Varek: the warlock's pact and the Dawnblades' river.
  {
    id: 'cq_conflict_seris_varek',
    title: 'Conflict: Seris and Varek',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "You come back to the room to find Seris on her feet with the ember at her breast blazing, and Varek sitting perfectly still on the edge of his bed, his eyes glowing violet in the half-dark. Nobody has drawn a weapon. It is the kind of stillness that comes just before somebody does.",
        next: 's1',
      },
      s1: {
        speaker: 'comp:seris',
        text: [
          { if: 'heart_touched', text: "“He was speaking to it,” Seris says, without taking her eyes off him. “In the dark, while the rest of you slept. A pact-voice, under the same roof as the Heart.” Her voice is very level. “Renounce it, Sable, or leave this company. Warlocks are damned. Not by me. By what they kneel to.”" },
          { text: "“He was speaking to it,” Seris says, without taking her eyes off him. “In the dark, while the rest of you slept. A pact-voice, under the same roof as all of us.” Her voice is very level. “Renounce it, Sable, or leave this company. Warlocks are damned. Not by me. By what they kneel to.”" },
        ],
        next: 'v1',
      },
      v1: {
        speaker: 'comp:varek',
        text: "“I was humming,” Varek says. “It's a free inn.” Then, quieter, with an edge like a razor drawn slowly: “I was drowned once by people who said that sentence, Dawnbound. In a river. In Ashenford. I didn't kneel then either.”",
        next: 'decide',
      },
      decide: {
        speaker: 'dm',
        decision: true,
        text: "They both look at you.",
        interjections: [
          { who: 'ilyra', text: "Ilyra has quietly put herself between the two beds. “Both of you,” she says, “are frightened. Could we start there?” Neither of them answers her." },
          { who: 'kael', text: "Kael, from the doorway: “I'll just be over here, not being a warlock or a paladin. Very restful.”" },
        ],
        options: [
          { text: "Seris is right. Renounce the pact, Varek, or go.", tone: 'aggressive', tags: ['authority', 'faith'], next: 'side_seris' },
          { text: "Varek's pact is his own business. Stand down, Seris.", tone: 'diplomatic', tags: ['defiance', 'mercy'], next: 'side_varek' },
          { text: "(Persuasion) Judge him by his deeds, Seris. Name one thing he has done beside us that was damned.", tone: 'diplomatic', tags: ['diplomacy', 'honesty'], check: { skill: 'persuasion', dc: 15, who: 'player' }, success: 'res_ok', failure: 'res_fail' },
          { text: "(Insight) Seris. That mob in Ashenford. Ask yourself whose colours they wore.", tone: 'curious', tags: ['honesty'], check: { skill: 'insight', dc: 14, who: 'player' }, success: 'ins_ok', failure: 'res_fail' },
        ],
      },
      side_seris: {
        speaker: 'comp:varek',
        text: "Varek looks at you, and something in his face shuts like a door in a high wind. “Ah,” he says. “There it is.” He takes his coat and pauses at the threshold. “I'll stay. I go where the Heart goes; I haven't much choice in that. But I'll remember who said it.”",
        effects: ['set conflict_seris_varek_resolved', 'bond seris varek -15', 'rel varek trust -12', 'rel varek affection -8', 'rel seris agreement 4', 'rel seris trust 2', 'memory varek -3 You told me to renounce the Choir or leave.', 'memory seris 1 You stood with me against the warlock.'],
        end: true,
      },
      side_varek: {
        speaker: 'comp:seris',
        text: "Seris stares at you. The ember dims, slowly, the way a fire dims when someone closes the damper. “As you say,” she says, and the words are formal and cold. “I will watch him. And I will watch you.” She sits down on her cot with her sword across her knees, and she does not sleep.",
        effects: ['set conflict_seris_varek_resolved', 'bond seris varek -10', 'rel seris trust -6', 'rel seris agreement -5', 'rel varek trust 5', 'memory varek 2 You told Seris my pact was my own business.', 'memory seris -2 You took the warlock\'s side against me.'],
        end: true,
      },
      res_ok: {
        speaker: 'comp:seris',
        text: "Seris opens her mouth. Closes it. You watch her search — the bell, the fog, every fight — and come up empty-handed. “He turned a hound that was coming for my back,” she says at last, slowly, as if confessing. “In the fog. I did not thank him.” She lowers her hand from her sword. “I do not understand you, Sable. I find I do not have to understand you to fight beside you.”",
        next: 'res_ok2',
      },
      res_ok2: {
        speaker: 'comp:varek',
        text: "Varek's eyes dim a shade. “That's... unsettlingly fair,” he says. “I'll take it. I'll do my humming on the stairs.” A pause. “You didn't have to thank me, Dawnbound. I'd have done it anyway. That's rather the point.”",
        effects: ['set conflict_seris_varek_resolved', 'bond seris varek 15', 'rel seris trust 3', 'rel seris respect 2', 'rel varek trust 3', 'rel varek respect 2', 'memory seris 2 You asked me to judge Varek by his deeds.', 'memory varek 2 You made Seris look at what I\'ve done, not what I am.'],
        end: true,
      },
      ins_ok: {
        speaker: 'comp:seris',
        text: "Seris starts to answer, and stops. You watch the thought arrive: a river in Ashenford, a boy with violet eyes, a mob in white and gold. Her hand comes off her sword. “Dawnblades,” she says. “They were Dawnblades. They would have been my brothers and sisters.” She looks at Varek as if seeing him for the first time. “I am sorry. Not for my faith. For the river.”",
        next: 'ins_ok2',
      },
      ins_ok2: {
        speaker: 'comp:varek',
        text: "Varek is silent a long time. “Nobody from your Order has ever said that to me,” he says finally, and his voice is not quite steady. “I don't know what to do with it.” He lies back on the bed and looks at the ceiling. “Goodnight, Dawnbound.” A pause. “Goodnight, Sable.”",
        effects: ['set conflict_seris_varek_resolved', 'bond seris varek 10', 'rel seris trust 2', 'rel varek trust 4', 'memory varek 2 Seris apologised for the river. You made her see it.', 'memory seris 1 You made me look at the river in Ashenford.'],
        end: true,
      },
      res_fail: {
        speaker: 'dm',
        text: "It doesn't land. Seris's face closes: “Deeds can be borrowed, like power.” Varek laughs, short and ugly: “There it is.” Nobody wins. Seris goes back to her prayers with her back very straight; Varek goes out onto the stairs to hum where she can't hear him. The room stays cold for the rest of the night.",
        effects: ['set conflict_seris_varek_resolved', 'bond seris varek -5', 'rel seris trust -1', 'rel varek trust -1'],
        end: true,
      },
    },
  },
  // ── Vaelis vs Seris: forbidden knowledge against dogma.
  {
    id: 'cq_conflict_vaelis_seris',
    title: 'Conflict: Vaelis and Seris',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "Seris has Vaelis's notebook. She is holding it over the hearth — not in the fire, not yet — and Vaelis is on his feet with one hand out, looking more naked than you have ever seen him.",
        next: 's1',
      },
      s1: {
        speaker: 'comp:seris',
        text: "“He copied the ring of script from the vault,” Seris says. “Every line. That place was sealed beneath Saint Orlen's roof for a reason. Some things are not written for mortal eyes.”",
        next: 'v1',
      },
      v1: {
        speaker: 'comp:vaelis',
        text: "“Saint Orlen's monks sealed it because they couldn't read it,” Vaelis says. His voice is soft and very dangerous. “That isn't holiness, Dawnbound. That's illiteracy with a liturgy. Give it back.”",
        next: 'decide',
      },
      decide: {
        speaker: 'dm',
        decision: true,
        text: "The notebook hangs over the flames. Both of them look at you.",
        interjections: [
          { who: 'orren', text: "Orren, from the corner: “Fire doesn't unknow things,” he says. “Only unwrites them.”" },
          { who: 'nima', text: "“Don't you dare,” Nima breathes, to Seris — and then, to Vaelis: “And don't you dare be smug about it after.”" },
        ],
        options: [
          { text: "Burn it, Seris. Some doors should stay shut.", tone: 'aggressive', tags: ['faith', 'caution'], next: 'burn' },
          { text: "Give it back. Knowledge isn't heresy.", tone: 'diplomatic', tags: ['knowledge', 'curiosity'], next: 'give' },
          { text: "(Persuasion) Read it together. Seris, if it's heresy, you'll know it when you see it. Vaelis — teach her.", tone: 'diplomatic', tags: ['diplomacy'], check: { skill: 'persuasion', dc: 15, who: 'player' }, success: 'together', failure: 'fail' },
        ],
      },
      burn: {
        speaker: 'dm',
        text: "Seris opens her hand. The notebook falls into the hearth and catches at once, the dry pages curling, the Ithari letters shining for a moment in the flames as though they were written in light. Vaelis doesn't move to save it. He watches it burn to the end with no expression at all, and then he turns to you.",
        next: 'burn2',
      },
      burn2: {
        speaker: 'comp:vaelis',
        text: "“I copied that from a wall that has stood for three thousand years,” he says pleasantly. “It took me four hours. You took four seconds.” He picks up his coat. “I'll remember the ratio.”",
        effects: ['set conflict_vaelis_seris_resolved', 'bond vaelis seris -15', 'rel vaelis trust -12', 'rel vaelis affection -6', 'rel seris agreement 4', 'rel seris trust 2', 'memory vaelis -3 You let Seris burn my copy of the vault script.', 'memory seris 1 You helped me keep the vault\'s script from mortal eyes.'],
        end: true,
      },
      give: {
        speaker: 'comp:seris',
        text: "Seris holds the notebook a moment longer. Then she puts it into Vaelis's hand, hard, like a gauntlet thrown down. “On your head, then,” she says — to you, not him. “When it opens a door none of us can shut.” Vaelis is already checking the pages for scorch marks. He doesn't thank her. He doesn't thank you either, but he looks at you, once, the way he looks at a good proof.",
        effects: ['set conflict_vaelis_seris_resolved', 'bond vaelis seris -10', 'rel seris trust -5', 'rel seris agreement -4', 'rel vaelis trust 5', 'rel vaelis respect 3', 'memory vaelis 2 You told Seris that knowledge isn\'t heresy.', 'memory seris -2 You put the wizard\'s curiosity above my warning.'],
        end: true,
      },
      together: {
        speaker: 'dm',
        text: "There is a long, ugly silence. Then Seris lowers the book, very slowly, and Vaelis lowers his hand, and somehow they are both sitting at the little table with the candle between them and the notebook open. He reads her the first line. She asks what a word means. He tells her. She tells him he has translated it wrong. He calls her an ignorant zealot; she calls him a sneering heretic. They are still at it when you go to bed, heads bent close together, and neither of them notices you leave.",
        next: 'together2',
      },
      together2: {
        speaker: 'dm',
        text: "In the morning you find the notebook on the table, its margins full of notes in two hands: one spiky and furious, one square and furious. Neither of them mentions it.",
        effects: ['set conflict_vaelis_seris_resolved', 'bond vaelis seris 15', 'rel vaelis trust 3', 'rel seris trust 3', 'memory vaelis 2 You made Seris sit down and read the vault script with me.', 'memory seris 2 You asked me to look before I burned.'],
        end: true,
      },
      fail: {
        speaker: 'dm',
        text: "Both of them round on you at once. “Read it?” says Seris. “Teach her?” says Vaelis. They exchange a look of perfect mutual contempt — and Seris drops the notebook on the table instead of the fire, as though it's no longer worth the trouble, and walks out. Vaelis snatches it up. Nobody thanks you. Nobody's happy. But the notebook didn't burn.",
        effects: ['set conflict_vaelis_seris_resolved', 'bond vaelis seris -5', 'rel vaelis trust 1', 'rel seris trust -1'],
        end: true,
      },
    },
  },
  // ── Kael vs Seris: the law against survival.
  {
    id: 'cq_conflict_kael_seris',
    title: 'Conflict: Kael and Seris',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "Voices on the stairs, low and furious. Seris has Kael by the collar — not roughly; precisely — and Kael is letting her, which tells you he has decided this is a fight he wants to have.",
        next: 's1',
      },
      s1: {
        speaker: 'comp:seris',
        text: "“The town granary,” Seris says to you, without letting go. “The festival stores. He picked the lock last night and gave away eleven sacks of flour.”",
        next: 'k1',
      },
      k1: {
        speaker: 'comp:kael',
        text: "“To the families whose houses the fog rearranged,” Kael says. “The ones sleeping in Tobin's common room with nothing. Hale would have handed it out himself, after a week of forms. I skipped the week.” He smiles up at Seris. “You're welcome.”",
        next: 's2',
      },
      s2: {
        speaker: 'comp:seris',
        text: "“It was theft. It does not matter who ate the bread.” Her jaw is tight. “He will confess to Captain Hale, or I will confess for him.”",
        next: 'decide',
      },
      decide: {
        speaker: 'dm',
        decision: true,
        text: "Kael raises an eyebrow at you over Seris's gauntlet. Seris doesn't look away from him.",
        interjections: [
          { who: 'brakka', text: "“Bairns ate,” Brakka says. “I'm not saying it was right. I'm saying bairns ate.”" },
          { who: 'varek', text: "Varek, from his bed: “If anyone's taking bets, I have three silver on the paladin.”" },
        ],
        options: [
          { text: "She's right, Kael. Go to Hale and confess.", tone: 'aggressive', tags: ['authority', 'honesty'], next: 'side_seris' },
          { text: "Hungry people ate. That's the end of it, Seris.", tone: 'compassionate', tags: ['charity', 'pragmatic'], next: 'side_kael' },
          { text: "(Persuasion) We go to the Mayor together and pay for the flour. The law's satisfied, and the bread's already eaten. (15 gold)", if: 'gold>=15', lockedText: 'You need 15 gold to pay for eleven sacks of flour.', tone: 'diplomatic', tags: ['diplomacy', 'charity'], check: { skill: 'persuasion', dc: 14, who: 'player' }, successEffects: ['gold -15'], success: 'pay', failure: 'fail' },
        ],
      },
      side_seris: {
        speaker: 'comp:kael',
        text: "Kael looks at you a long moment over Seris's arm. Then the grin comes out: perfect, bright and completely empty. “Course,” he says. “Law's the law. Off I go.” He goes down the stairs to Hale with his hands in his pockets, whistling, and doesn't look back at you once. When he returns, hours later, with a fine to pay and a black eye nobody asks about, he doesn't speak to you at all.",
        effects: ['set conflict_kael_seris_resolved', 'bond kael seris -15', 'rel kael trust -12', 'rel kael affection -6', 'rel seris agreement 4', 'rel seris trust 2', 'memory kael -3 You sent me to Hale for feeding people.', 'memory seris 1 You upheld the law when it was hard.'],
        end: true,
      },
      side_kael: {
        speaker: 'comp:seris',
        text: "Seris lets go of Kael's collar one finger at a time. “The end of it,” she repeats. “I see.” She smooths the creases she has made in his coat, with terrible precision. “Then I will pray for you both.” She goes into the room and closes the door very quietly.",
        effects: ['set conflict_kael_seris_resolved', 'bond kael seris -10', 'rel seris trust -6', 'rel seris agreement -4', 'rel kael trust 5', 'rel kael affection 2', 'memory kael 2 You stood up for me over the flour.', 'memory seris -2 You excused a theft because you liked the thief.'],
        end: true,
      },
      pay: {
        speaker: 'dm',
        text: "Mayor Brannock is in her office before dawn, as always, adding up a list held together with string. She hears the whole story with her eyebrows climbing, takes your fifteen gold, writes it down as Charitable Purchase (Flour, Emergency), and adds without looking up, “Next time, Master Veyran, knock. I'd have given you the key.”",
        next: 'pay2',
      },
      pay2: {
        speaker: 'dm',
        text: "On the walk back, Seris and Kael don't speak. Then Seris says, stiffly, “It was well done. The distribution. Eleven households. You missed none of them.” Kael looks at her sideways. “You counted?” “I always count.” And for a moment, almost, they are smiling at the same thing.",
        effects: ['set conflict_kael_seris_resolved', 'bond kael seris 15', 'rel kael trust 3', 'rel seris trust 3', 'rep hollowmere 2', 'memory kael 2 You paid for the flour so Seris and I could both be right.', 'memory seris 2 You found a way to serve the law and the hungry both.'],
        end: true,
      },
      fail: {
        speaker: 'dm',
        text: "Kael laughs. “Paying makes it a purchase. I don't do purchases.” Seris lets go of him in disgust: “And paying does not undo a theft.” For a moment they are united in their contempt for your plan; then they remember they are angry with each other and retreat to opposite ends of the room. Nobody goes to Hale. Nobody apologises.",
        effects: ['set conflict_kael_seris_resolved', 'bond kael seris -5'],
        end: true,
      },
    },
  },
  // ── Nima vs Vaelis: control against freedom.
  {
    id: 'cq_conflict_nima_vaelis',
    title: 'Conflict: Nima and Vaelis',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "The curtains are on fire. Only a little. Nima is beating them out with a pillow while Vaelis stands in the middle of the room with his arms folded and the expression of a man who has been proven right and wishes he hadn't.",
        next: 'v1',
      },
      v1: {
        speaker: 'comp:vaelis',
        text: "“Drills,” he says. “Every morning. Breathing, focus, a candle-flame held steady for an hour. Control first, then power. That is how one keeps a storm from becoming a house fire.”",
        next: 'n1',
      },
      n1: {
        speaker: 'comp:nima',
        text: "“That's how you keep a storm in a jar!” Nima throws the smouldering pillow down. “You want me tidy. Like you. You'd put me in a nice neat box like the Conclave put you in, and then you'd call it teaching!”",
        next: 'v2',
      },
      v2: {
        speaker: 'dm',
        text: "Vaelis goes white. Not angry-white. Something else. For a moment nobody says anything at all.",
        next: 'decide',
      },
      decide: {
        speaker: 'dm',
        decision: true,
        text: "Nima is sparking. Vaelis is very, very still. They both turn to you.",
        interjections: [
          { who: 'tessa', text: "Tessa has the water jug and is pouring it carefully over the curtains. “Don't mind me,” she says. “Just being the only adult.”" },
          { who: 'orren', text: "Orren puts out a spark on the floorboards with his heel. “Fire needs a hearth,” he says. “Not a cage. A hearth.” Neither of them is listening." },
        ],
        options: [
          { text: "Vaelis is right, Nima. Control first. Do the drills.", tone: 'pragmatic', tags: ['caution', 'authority'], next: 'side_vaelis' },
          { text: "Let her find her own way, Vaelis. It's her fire.", tone: 'friendly', tags: ['boldness', 'defiance'], next: 'side_nima' },
          { text: "(Insight) Look at Vaelis. That wasn't a lecture. That was fear.", tone: 'curious', tags: ['honesty'], check: { skill: 'insight', dc: 14, who: 'player' }, success: 'res_ok', failure: 'res_fail' },
        ],
      },
      side_vaelis: {
        speaker: 'comp:nima',
        text: "Nima stares at you. Then something in her face just... goes out, like a candle. “Okay,” she says. “Drills. Sure. Every morning.” She sits on the bed with her hands clamped between her knees, and for the rest of the night there isn't a single spark in the room. It is the most frightening thing you have seen her do.",
        effects: ['set conflict_nima_vaelis_resolved', 'bond nima vaelis -15', 'rel nima trust -12', 'rel nima affection -6', 'rel vaelis agreement 4', 'rel vaelis respect 2', 'memory nima -3 You told me to put my fire in a box.', 'memory vaelis 1 You backed me about control. I wish I felt better about it.'],
        end: true,
      },
      side_nima: {
        speaker: 'comp:vaelis',
        text: "Vaelis inclines his head, very correctly. “Of course. Her fire. Her inn, presumably, when it burns down.” He picks up his book. At the door he pauses. “When it goes wrong — and it will — I would prefer not to be the one who says I told you so. Do try to spare me that.”",
        effects: ['set conflict_nima_vaelis_resolved', 'bond nima vaelis -10', 'rel vaelis trust -6', 'rel vaelis agreement -4', 'rel nima trust 5', 'rel nima affection 3', 'memory nima 2 You told Vaelis my fire was mine.', 'memory vaelis -2 You let her treat a storm like a toy.'],
        end: true,
      },
      res_ok: {
        speaker: 'dm',
        text: "You see it in his hands before his face: they're shaking. Not with anger. Vaelis isn't afraid Nima will burn the inn down. He's afraid of what happens to brilliant young people who never learn control — or worse, of what they are used for once they do. He has seen it. He was it.",
        next: 'res_ok2',
      },
      res_ok2: {
        speaker: 'comp:vaelis',
        text: "Something in your face must tell him you've seen it. He sits down abruptly on the edge of the bed. “I'm not trying to put you in a box,” he says to Nima, and his voice is quite different. “I'm trying to make sure nobody else can.” Nima stares at him. Then she sits down beside him, close, warm as a stove. “...Teach me to aim,” she says. “And I'll teach you to feel it. Deal?” “Deal,” says Vaelis, as though it hurts.",
        effects: ['set conflict_nima_vaelis_resolved', 'bond nima vaelis 15', 'rel nima trust 3', 'rel vaelis trust 3', 'memory nima 2 You saw that Vaelis was scared for me, not of me.', 'memory vaelis 2 You saw what I was afraid of, and didn\'t say it aloud.'],
        end: true,
      },
      res_fail: {
        speaker: 'dm',
        text: "You try to read Vaelis and get nothing but cold, polished contempt. Nima takes your silence for betrayal; Vaelis takes it for agreement. They retreat to opposite corners, and the only sound for the rest of the night is the hiss of a candle that Nima keeps lighting and Vaelis keeps, pointedly, snuffing out.",
        effects: ['set conflict_nima_vaelis_resolved', 'bond nima vaelis -5'],
        end: true,
      },
    },
  },
  // ── Brakka vs Korr: names against deeds.
  {
    id: 'cq_conflict_brakka_korr',
    title: 'Conflict: Brakka and Korr',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: "Brakka is sitting by the hearth saying the names of Ostrem under her breath, the way she does every night. Hulda. Fenrik. Arnja. On the other side of the fire, Korr has stopped sharpening his axe.",
        next: 'k1',
      },
      k1: {
        speaker: 'comp:korr',
        text: "“Stop,” he says. Not loud. Brakka stops. Korr doesn't look up from the blade. “Names without deeds are smoke. Sing what they did, or let them sleep. Saying the names over and over is like picking at a burn.”",
        next: 'b1',
      },
      b1: {
        speaker: 'comp:brakka',
        text: "Brakka's hands go still on her knees. “You don't get to tell me who to let go of,” she says, very quietly. “Nobody does. Not my clan. Not you.” She leans forward. “What's it to you, anyway? They're my dead.”",
        next: 'k2',
      },
      k2: {
        speaker: 'comp:korr',
        text: "“Nothing,” Korr says. The whetstone starts again, harder. “Nothing to me.”",
        next: 'decide',
      },
      decide: {
        speaker: 'dm',
        decision: true,
        text: "The whetstone grinds. Brakka is waiting. So, without looking at you, is Korr.",
        interjections: [
          { who: 'tessa', text: "Tessa has stopped tuning. She looks from one to the other like someone watching two people she loves walk toward the same cliff." },
          { who: 'orren', text: "Orren puts another log on the fire without being asked and sits down between them. Not in the way. Just there." },
        ],
        options: [
          { text: "Let her say her names, Korr. It's how she keeps them.", tone: 'compassionate', tags: ['protect', 'mercy'], next: 'side_brakka' },
          { text: "He has a point, Brakka. Maybe say what they did, not only who they were.", tone: 'pragmatic', tags: ['tradition', 'honesty'], next: 'side_korr' },
          { text: "(Insight) Korr. Whose name is it you can't say?", tone: 'curious', tags: ['honesty'], check: { skill: 'insight', dc: 14, who: 'player', advIf: 'korr_thal_hint || questdone:cq_korr' }, success: 'res_ok', failure: 'res_fail' },
        ],
      },
      side_brakka: {
        speaker: 'comp:korr',
        text: "Korr's whetstone stops. For a long moment he doesn't move. “Yes,” he says at last. “It is her way. I spoke out of turn.” He gets up and goes out to the stairs, and you hear him sitting there in the dark for a long time.",
        effects: ['set conflict_brakka_korr_resolved', 'bond brakka korr -10', 'rel korr trust -5', 'rel korr respect -2', 'rel brakka trust 4', 'rel brakka affection 2', 'memory brakka 2 You let me keep saying my names.', 'memory korr -2 You told me I spoke out of turn about the dead.'],
        end: true,
      },
      side_korr: {
        speaker: 'comp:brakka',
        text: "Brakka looks at you as if you had taken her axe off the wall and handed it to somebody else. “Deeds,” she says. “Aye. I'll think on it.” She doesn't say the names again that night. The next night you notice she says them so quietly that you can't hear them at all.",
        effects: ['set conflict_brakka_korr_resolved', 'bond brakka korr -15', 'rel brakka trust -10', 'rel brakka affection -6', 'rel korr agreement 3', 'memory brakka -3 You told me to stop saying the names of Ostrem.', 'memory korr 1 You agreed with me about the dead. It did not feel like winning.'],
        end: true,
      },
      res_ok: {
        speaker: 'dm',
        text: "Korr's whetstone stops halfway down the blade. He stays bent over the axe a long moment. Then, so low that Brakka has to lean in to hear: “Thal.” He swallows. “His name is Thal. I have not said it aloud in a long time. Every time you say yours, I hear the place where his should be.”",
        next: 'res_ok2',
      },
      res_ok2: {
        speaker: 'comp:brakka',
        text: "Brakka is quiet. Then she reaches across the fire and puts her hand on Korr's knee. “Hulda,” she says. “She kept the bread ovens. Burned every third loaf. We ate them anyway.” Korr looks at her. “Thal,” he says. “He carried our fire across the Ashwater in his own hands.” And they go on like that, the two of them, trading one name and one deed each across the fire, until the logs burn down.",
        effects: ['set conflict_brakka_korr_resolved', 'bond brakka korr 15', 'rel brakka trust 3', 'rel korr trust 3', 'rel korr affection 2', 'memory brakka 3 Korr and I traded names and deeds across the fire.', 'memory korr 3 I said Thal\'s name aloud, with Brakka, because you asked.'],
        end: true,
      },
      res_fail: {
        speaker: 'dm',
        text: "Korr's face shuts like a fist. “None,” he says. “There is no name.” He stands, takes his axe, and goes out. Brakka looks after him, then at you, then goes back to her names — quieter now, as though they might wake something.",
        effects: ['set conflict_brakka_korr_resolved', 'bond brakka korr -5', 'rel korr trust -1'],
        end: true,
      },
    },
  },
];

// ════════════════════════════════════════════════════════════════════════════════ REGISTRIES

export const CQ_DIALOGUES: DialogueTree[] = [
  ...KAEL, ...ORREN, ...KORR, ...BRAKKA, ...VAELIS, ...SERIS, ...NIMA, ...ILYRA, ...VAREK, ...TESSA, ...CONFLICT_TREES,
];

/** Quest locations. Every coordinate is a walkable tile (checked against grids.ts) not used by a prologue object. */
export const CQ_OBJECTS: { map: string; object: MapObject }[] = [
  // ── Kael: the town hall mounting-block and the courier.
  { map: 'hollowmere', object: { id: 'cq_kael_drop', kind: 'inspect', name: 'Mounting-Block by the Town Hall', x: 22, y: 6, if: 'quest:cq_kael && comp:kael', dialogue: 'cq_kael_drop', blocks: true } },
  { map: 'hollowmere', object: { id: 'cq_kael_mira', kind: 'npc', name: 'Mira the lantern-seller', x: 23, y: 6, if: 'quest:cq_kael=watch && comp:kael', dialogue: 'cq_kael_mira', glyph: 'm', blocks: true } },
  // ── Orren: the Lantern Tree's roots, and where they come down into the chapel.
  { map: 'hollowmere', object: { id: 'cq_orren_tree', kind: 'inspect', name: 'Buckled Roots of the Lantern Tree', x: 24, y: 17, if: 'quest:cq_orren=listen && comp:orren', dialogue: 'cq_orren_tree' } },
  { map: 'undercroft', object: { id: 'cq_orren_roots', kind: 'inspect', name: 'Pale Roots through the Ceiling', x: 3, y: 27, if: 'quest:cq_orren=roots && comp:orren', dialogue: 'cq_orren_roots', blocks: true,
    hint: { skill: 'nature', dc: 11, text: 'Roots — in the chapel ceiling, forty feet under the hill. Oak, by the look of them. That isn\'t possible.' } } },
  // ── Korr: Thal's echo among the graves behind the cathedral.
  { map: 'cathedral', object: { id: 'cq_korr_thal', kind: 'npc', name: 'A Grey Figure among the Graves', x: 27, y: 26, if: 'quest:cq_korr && comp:korr', dialogue: 'cq_korr_thal', glyph: 'T', color: '#b8c4d6', blocks: true } },
  // ── Brakka: Wenna's lane, and the bell-tower rubble.
  { map: 'hollowmere', object: { id: 'cq_brakka_wenna', kind: 'trigger', name: 'Old Wenna\'s Lane', x: 13, y: 25, radius: 2, if: 'quest:cq_brakka=wenna && comp:brakka', dialogue: 'cq_brakka_wenna' } },
  { map: 'cathedral', object: { id: 'cq_brakka_stone', kind: 'inspect', name: 'Bell-Tower Rubble', x: 2, y: 13, if: 'quest:cq_brakka=tower && comp:brakka', dialogue: 'cq_brakka_stone',
    hint: { skill: 'perception', dc: 12, text: 'One block in the tower rubble is the wrong colour. Grey granite, among all this sandstone.' } } },
  // ── Vaelis: the Seeker's field-case in the vault antechamber.
  { map: 'undercroft', object: { id: 'cq_vaelis_case', kind: 'inspect', name: 'Grey Leather Field-Case', x: 17, y: 25, if: 'quest:cq_vaelis && comp:vaelis', dialogue: 'cq_vaelis_case', blocks: true } },
  // ── Seris: two witnesses and the Order's rider.
  { map: 'hollowmere', object: { id: 'cq_seris_weaver', kind: 'npc', name: 'Hesper Tull, a weaver', x: 21, y: 17, if: 'quest:cq_seris=survey && comp:seris', dialogue: 'cq_seris_weaver', glyph: 'h', blocks: true } },
  { map: 'hollowmere', object: { id: 'cq_seris_children', kind: 'npc', name: 'Children Drawing in Chalk', x: 19, y: 23, if: 'quest:cq_seris=survey && comp:seris', dialogue: 'cq_seris_well', glyph: 'c', blocks: true } },
  { map: 'hollowmere', object: { id: 'cq_seris_knight', kind: 'npc', name: 'Dame Aubrin Kesh, Knight of the Last Dawn', x: 28, y: 17, if: 'quest:cq_seris=verdict && comp:seris', dialogue: 'cq_seris_knight', glyph: 'K', color: '#f2e2a0', blocks: true } },
  // ── Nima: the empty pedestal in the vault, plus a way out once the Heart is gone.
  { map: 'vault', object: { id: 'cq_nima_pool', kind: 'inspect', name: 'Where the Heart Rested', x: 13, y: 4, if: 'quest:cq_nima && comp:nima', dialogue: 'cq_nima_pool' } },
  { map: 'vault', object: { id: 'cq_vault_return', kind: 'exit', name: 'Climb back to the Undercroft', x: 9, y: 19, if: 'heart_touched', to: { map: 'undercroft', x: 21, y: 31 } } },
  // ── Ilyra: the drowned man and his brother at Thorn's Mill.
  { map: 'hollowmere', object: { id: 'cq_ilyra_coll', kind: 'npc', name: 'A Drenched Man by the Mill-Race', x: 44, y: 9, if: 'quest:cq_ilyra && comp:ilyra', dialogue: 'cq_ilyra_coll', glyph: 'C', color: '#8fb3c9', blocks: true } },
  { map: 'hollowmere', object: { id: 'cq_ilyra_abel', kind: 'npc', name: 'Abel Thorn, the miller', x: 40, y: 9, if: 'quest:cq_ilyra=abel && comp:ilyra', dialogue: 'cq_ilyra_abel', glyph: 'A', blocks: true } },
  // ── Varek: the sealed threshold.
  { map: 'undercroft', object: { id: 'cq_varek_threshold', kind: 'inspect', name: 'The Sealed Threshold', x: 19, y: 30, if: 'quest:cq_varek && comp:varek', dialogue: 'cq_varek_threshold' } },
  // ── Tessa: Lio's corner of the common room, and the fallen tower.
  { map: 'inn', object: { id: 'cq_tessa_lio', kind: 'trigger', name: 'Lio\'s Corner', x: 9, y: 8, radius: 3, if: 'quest:cq_tessa=lio && comp:tessa', dialogue: 'cq_tessa_lio' } },
  { map: 'cathedral', object: { id: 'cq_tessa_tower', kind: 'inspect', name: 'Foot of the Fallen Tower', x: 2, y: 10, if: 'quest:cq_tessa=tower && comp:tessa', dialogue: 'cq_tessa_tower' } },
];

/** Four small, optional fights. All are non-lethal: losing still moves the story on. */
export const CQ_ENCOUNTERS: EncounterDef[] = [
  {
    id: 'cq_enc_vaelis_wardens', name: 'The Seeker\'s Wardens', map: 'undercroft', nonlethal: true,
    enemies: [{ t: 'conclave_warden', x: 20, y: 23 }, { t: 'conclave_warden', x: 24, y: 24 }],
    intro: 'The Wardens level their staffs, violet light crawling along the iron shoes. “Alive, if convenient,” the taller one says, in a tone that suggests it may not be.',
    onVictory: ['set cq_vaelis_wardens_done', 'rep conclave -10', 'xp 50', 'dialogue cq_vaelis_case'],
    onDefeat: ['set cq_vaelis_wardens_done', 'rep conclave -5', 'log You come round on the cold antechamber floor. The Wardens are gone — limping, by the blood on the stair — and in their hurry they have left the grey case behind.', 'dialogue cq_vaelis_case'],
  },
  {
    id: 'cq_enc_nima_flare', name: 'The Glassworks Burning', map: 'vault', nonlethal: true,
    enemies: [{ t: 'hollow_echo', x: 11, y: 6 }, { t: 'hollow_echo', x: 15, y: 6 }, { t: 'fog_hound', x: 13, y: 8 }],
    intro: 'Out of the white-gold flare step figures of burning glass: glassblowers, an apprentice, a man with his arms held out. Echoes of a workshop on fire in another life. They do not know they are dead. They only want to be warm.',
    onVictory: ['dialogue cq_nima_after'],
    onDefeat: ['log The flare burns itself out before you do. When you can see again, the glass figures have crumbled to warm sand on the dais.', 'dialogue cq_nima_after'],
  },
  {
    id: 'cq_enc_tessa_echoes', name: 'The Wrong Note', map: 'cathedral', nonlethal: true,
    enemies: [{ t: 'hollow_echo', x: 7, y: 11 }, { t: 'hollow_echo', x: 7, y: 13 }, { t: 'fog_hound', x: 9, y: 12 }],
    intro: 'The fog pours out of the tear above the tower shaft and stands up into shapes: a pilgrim calling for the bell, a hound with lantern eyes. They turn toward the song. They turn toward Tessa.',
    onVictory: ['dialogue cq_tessa_after'],
    onDefeat: ['log The last of the fog drains back into the tear, and the tear seals itself like a mended page. Nobody is quite sure who won.', 'dialogue cq_tessa_after'],
  },
  {
    id: 'cq_enc_korr_grey', name: 'The Day Come Back', map: 'cathedral', nonlethal: true,
    enemies: [{ t: 'hollow_echo', x: 26, y: 24 }, { t: 'fog_hound', x: 24, y: 26 }, { t: 'fog_hound', x: 29, y: 24 }],
    intro: 'The graves give up their mist. What was Thal tears into a grey, howling thing, and the fog-hounds come with it — and somewhere inside the noise, very faint, a war-song you do not know.',
    onVictory: ['dialogue cq_korr_after'],
    onDefeat: ['log Korr stands alone among the graves when you come round, chest heaving, the grey gone to rags around him.', 'dialogue cq_korr_after'],
  },
];

/** The camp's "A personal matter…" entries. Trust thresholds never exceed 20. */
export const COMPANION_QUESTS: CompanionQuestEntry[] = [
  { companionId: 'vaelis', questId: 'cq_vaelis', startTree: 'cq_vaelis_start', availableIf: 'prologue_complete && (vaelis_instruments_hint || vaelis_notebook_noticed || trust:vaelis>=10)' },
  { companionId: 'brakka', questId: 'cq_brakka', startTree: 'cq_brakka_start', availableIf: 'prologue_complete && (talk_brakka_hook || brakka_ghost_fear || trust:brakka>=10)' },
  { companionId: 'kael', questId: 'cq_kael', startTree: 'cq_kael_start', availableIf: 'prologue_complete && (kael_letter_hint || kael_pocket_noticed || kael_debt_hint || trust:kael>=10)' },
  { companionId: 'seris', questId: 'cq_seris', startTree: 'cq_seris_start', availableIf: 'prologue_complete && (talk_seris_hook || talk_seris_ending || trust:seris>=10)' },
  { companionId: 'nima', questId: 'cq_nima', startTree: 'cq_nima_start', availableIf: 'prologue_complete && (nima_voice_hint || trust:nima>=12)' },
  { companionId: 'orren', questId: 'cq_orren', startTree: 'cq_orren_start', availableIf: 'bell_rang && (orren_acorn_hint || trust:orren>=12)' },
  { companionId: 'ilyra', questId: 'cq_ilyra', startTree: 'cq_ilyra_start', availableIf: 'prologue_complete && (ilyra_tamsin_hint || talk_ilyra_hook || trust:ilyra>=10)' },
  { companionId: 'varek', questId: 'cq_varek', startTree: 'cq_varek_start', availableIf: 'prologue_complete && heart_touched && (varek_choir_hint || varek_called_hint || trust:varek>=10)' },
  { companionId: 'tessa', questId: 'cq_tessa', startTree: 'cq_tessa_start', availableIf: 'bell_rang && (talk_tessa_hook || tessa_song_hint || trust:tessa>=10)' },
  { companionId: 'korr', questId: 'cq_korr', startTree: 'cq_korr_start', availableIf: 'bell_rang && (korr_thal_hint || trust:korr>=10)' },
];

export const CONFLICTS: ConflictEntry[] = [
  { id: 'seris_varek', between: ['seris', 'varek'], if: 'prologue_complete || bond:seris:varek<=-20', tree: 'cq_conflict_seris_varek' },
  { id: 'vaelis_seris', between: ['vaelis', 'seris'], if: 'visited:vault && (prologue_complete || bond:vaelis:seris<=-20)', tree: 'cq_conflict_vaelis_seris' },
  { id: 'kael_seris', between: ['kael', 'seris'], if: 'prologue_complete || (bell_rang && bond:kael:seris<=-20)', tree: 'cq_conflict_kael_seris' },
  { id: 'nima_vaelis', between: ['nima', 'vaelis'], if: 'prologue_complete || bond:nima:vaelis<=-20', tree: 'cq_conflict_nima_vaelis' },
  { id: 'brakka_korr', between: ['brakka', 'korr'], if: 'prologue_complete || bond:brakka:korr<=-20', tree: 'cq_conflict_brakka_korr' },
];
