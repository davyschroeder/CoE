import type { DialogueTree, DialogueOption } from '../schema';

/**
 * Prologue side content: Hollowmere townsfolk, the Grey Hawks, the fog rescues, Lira, and Corvin's dig.
 * Festival state = !bell_rang. Night state = bell_rang.
 *
 * Pattern used throughout: a greeting node and a short "hub" node share one option list, so the
 * first line of a conversation feels like a greeting and later returns feel like "what else?".
 * Informational options are guarded by flags set in the node they lead to (and marked `once`).
 */

// ───────────────────────────────────────────────────────────── shared texts

const CORVIN_RUMOUR =
  "Tobin leans across the bar with the joy of a man who has been holding something in for very nearly a whole pint. “Right. So. Fellow upstairs. Scholar. Spectacles, says ‘fascinating’ about the drains. Corvin Thale. Took the back room a fortnight ago and paid in Old Charter silver — nobody's minted that in a hundred years. And every night, regular as the cathedral clock that doesn't work, he goes out at midnight with a shovel and a sack, and every morning he comes back looking like he's been buried and changed his mind about it.” He taps the bar. “Mud on my stairs. Grey mud. Old mud. There's only one place round here with mud that colour, and it's behind the north gate.” He spreads his hands. “Not that I'm saying anything.” He is saying everything.";

const GRIEF_QUIET =
  "Far above you, somewhere in Hollowmere, something shifts — like a scale tipping in another room — and a grief that someone has carried for years goes quiet, all at once, as though it had never been there at all.";

const GRIEF_KNOWN =
  "And you feel the price paid. Not destroyed — spent: poured out to hold this child in the world, like a stone set on the end of a kite-string. Somewhere above you, someone who has carried a loss with every ounce of their strength has just set it down. They will never know they put it down. They will never remember what it was. Somewhere near the north gate, a woman who has kept a list of names for eight years lifts her pen, and cannot think why she ever started.";

// ───────────────────────────────────────────────────────────── shared option lists

const MAYOR_DAY: DialogueOption[] = [
  { text: "How is the festival going?", tone: 'friendly', once: true, if: '!mayor_q_fest', next: 'm_fest' },
  { text: "You look like someone with more problems than lists.", tone: 'curious', once: true, if: '!mayor_q_trouble', next: 'm_trouble' },
  {
    text: "Could I see the town census?", tone: 'curious', once: true, if: '!saw_census',
    check: { skill: 'investigation', dc: 12 },
    successEffects: ['set saw_census', 'clue mq_bell census_gap', 'clue sq_lira census'], success: 'census_ok',
    failureEffects: ['set saw_census'], failure: 'census_fail',
  },
  { text: "Is there anything I can do to help?", tone: 'compassionate', once: true, if: '!mayor_q_help', tags: ['charity'], next: 'm_help' },
  { text: "I'll let you get back to it.", tone: 'leave', next: 'm_bye' },
];

const MAYOR_NIGHT: DialogueOption[] = [
  { text: "What happened? What do you need?", tone: 'pragmatic', once: true, if: '!mayor_q_night', next: 'n_need' },
  {
    text: "Let me look at that census. Something's wrong with the names, isn't it?", tone: 'curious', once: true, if: '!saw_census',
    check: { skill: 'investigation', dc: 12 },
    successEffects: ['set saw_census', 'clue mq_bell census_gap', 'clue sq_lira census'], success: 'census_ok',
    failureEffects: ['set saw_census'], failure: 'census_fail',
  },
  { text: "The people in the fog — we brought them home.", tone: 'friendly', if: 'questdone:sq_fog_rescue && !mayor_thanked', next: 'n_thanks' },
  { text: "Stay safe, Mayor.", tone: 'leave', next: 'n_bye' },
];

const GARRICK_DAY: DialogueOption[] = [
  { text: "Show me what you've got.", tone: 'pragmatic', effects: ['shop garrick'], end: true },
  { text: "Has your family always kept this forge?", tone: 'curious', once: true, if: '!garrick_q_family', next: 'g_family' },
  { text: "That's Kharn ingot-steel cooling in your trough, or I'm a goblin.", tone: 'background', if: 'anc:dwarf && !garrick_q_dwarf', once: true, next: 'g_dwarf' },
  { text: "Good night, smith.", tone: 'leave', end: true },
];

const GARRICK_NIGHT: DialogueOption[] = [
  { text: "You're still trading? Tonight?", tone: 'pragmatic', next: 'g_night_shop' },
  { text: "Are you all right?", tone: 'compassionate', once: true, if: '!garrick_q_night', next: 'g_night_talk' },
  { text: "Your great-grandfather dug out the tower. Did he ever say what happened to the bell?", tone: 'curious', once: true, if: 'garrick_q_family && !knows_bell_missing', next: 'g_bell' },
  { text: "That bell up there. When the tower fell, did anyone ever find it?", tone: 'curious', once: true, if: '!garrick_q_family && !knows_bell_missing', effects: ['set garrick_q_family'], next: 'g_bell' },
  { text: "Bar the door behind me.", tone: 'leave', end: true },
];

const YSOLDE_DAY: DialogueOption[] = [
  { text: "Let's see your wares.", tone: 'pragmatic', effects: ['shop ysolde'], end: true },
  { text: "What's the gossip?", tone: 'curious', once: true, if: '!ysolde_q_gossip', next: 'y_gossip' },
  { text: "What do you know about the old bell tower?", tone: 'curious', once: true, if: '!ysolde_q_tower', next: 'y_tower' },
  { text: "Good evening, Mistress Quill.", tone: 'leave', end: true },
];

const YSOLDE_NIGHT: DialogueOption[] = [
  { text: "Are you all right?", tone: 'compassionate', once: true, if: '!ysolde_gift', next: 'y_gift' },
  { text: "What did she say to you?", tone: 'curious', once: true, if: '!ysolde_q_echo', next: 'y_echo_talk' },
  { text: "I could use supplies.", tone: 'pragmatic', effects: ['shop ysolde'], end: true },
  { text: "Lock up. I'll see you in the morning.", tone: 'leave', end: true },
];

const TOBIN_OPTS: DialogueOption[] = [
  { text: "Food and a bed?", tone: 'friendly', once: true, if: '!tobin_q_rooms', next: 't_rooms' },
  { text: "Heard anything interesting lately?", tone: 'curious', once: true, if: '!tobin_rumour && !(quest:sq_corvin=found) && !questdone:sq_corvin', next: 't_rumour' },
  { text: "Heard anything interesting lately?", tone: 'curious', once: true, if: '!tobin_rumour && (quest:sq_corvin=found || questdone:sq_corvin)', next: 't_rumour_late' },
  { text: "What's the story with the sellswords?", tone: 'curious', once: true, if: '!brawl_resolved && !tobin_q_hawks && !bell_rang', next: 't_hawks' },
  {
    text: "Let me into the scholar's room, Tobin. Something's wrong, and you know it.", tone: 'diplomatic', tags: ['honesty'],
    if: 'tobin_rumour && !corvin_door_open && !tobin_wary',
    check: { skill: 'persuasion', dc: 12 },
    successEffects: ['set corvin_door_open', 'open inn corvin_door'], success: 't_key',
    failureEffects: ['set tobin_wary'], failure: 't_key_fail_p',
  },
  {
    text: "I'm Corvin's colleague from the Academy. He asked me to fetch his notes.", tone: 'deceptive', tags: ['deception'],
    if: 'tobin_rumour && !corvin_door_open && !tobin_wary',
    check: { skill: 'deception', dc: 13 },
    successEffects: ['set corvin_door_open', 'open inn corvin_door'], success: 't_key',
    failureEffects: ['set tobin_wary'], failure: 't_key_fail_d',
  },
  {
    text: "(Slide five gold across the bar.) For your trouble.", tone: 'pragmatic', tags: ['pragmatic'],
    if: 'tobin_rumour && !corvin_door_open && !tobin_wary && gold>=5',
    effects: ['gold -5', 'set corvin_door_open', 'open inn corvin_door'], next: 't_key_paid',
  },
  {
    text: "(Slide eight gold across the bar.) For the roof fund.", tone: 'pragmatic', tags: ['pragmatic'],
    if: 'tobin_rumour && !corvin_door_open && tobin_wary && gold>=8',
    effects: ['gold -8', 'set corvin_door_open', 'open inn corvin_door'], next: 't_key_paid',
  },
  { text: "How are you holding up?", tone: 'compassionate', once: true, if: 'bell_rang && !tobin_q_night', next: 't_night_talk' },
  { text: "Thanks, Tobin.", tone: 'leave', end: true },
];

const BRAWL_OPTS: DialogueOption[] = [
  {
    text: "Dag. You're better than shaking down a minstrel for a song. Pay Tobin and let the lad play.", tone: 'diplomatic', tags: ['diplomacy'],
    check: { skill: 'persuasion', dc: 13 },
    successEffects: ['set brawl_resolved', 'set brawl_outcome talked', 'set hawks_help', 'complete sq_brawl talked', 'xp 50'], success: 'b_talked',
    failure: 'b_escalate',
  },
  {
    text: "(Veteran to veteran.) Which company, sergeant? You've got the look of the Lowland Foot.", tone: 'background', if: 'bg:soldier', tags: ['diplomacy'],
    check: { skill: 'persuasion', dc: 10 },
    successEffects: ['set brawl_resolved', 'set brawl_outcome talked', 'set hawks_help', 'complete sq_brawl talked', 'xp 50'], success: 'b_soldier',
    failure: 'b_escalate',
  },
  {
    text: "Pay your tab and get out of this town. Tonight. Before I lose my patience.", tone: 'aggressive', tags: ['boldness'],
    check: { skill: 'intimidation', dc: 14 },
    successEffects: ['set brawl_resolved', 'set brawl_outcome intimidated', 'complete sq_brawl intimidated', 'xp 50'], success: 'b_intimidated',
    failure: 'b_escalate',
  },
  {
    text: "You want the Bathwater song? Fine. But I'm singing it — and you lot have to keep up.", tone: 'friendly', tags: ['humor'],
    if: '!brawl_sang',
    check: { skill: 'performance', dc: 12, advIf: 'class:bard || bg:entertainer' },
    successEffects: ['set brawl_resolved', 'set brawl_outcome performed', 'set hawks_help', 'complete sq_brawl performed', 'xp 50'], success: 'b_performed',
    failureEffects: ['set brawl_sang'], failure: 'b_jeered',
  },
  {
    text: "How much do they owe? I'll cover it.", tone: 'pragmatic', tags: ['pragmatic'], if: 'gold>=10', lockedText: 'You need 10 gold to cover their tab.',
    effects: ['gold -10', 'set brawl_resolved', 'set brawl_outcome bribed', 'set hawks_help', 'complete sq_brawl bribed', 'xp 25'], next: 'b_bribed',
  },
  { text: "(Throw the first punch.)", tone: 'aggressive', tags: ['violence'], effects: ['combat enc_brawl'], end: true },
  { text: "Not my business.", tone: 'leave', end: true },
];

const PELL_OPTS: DialogueOption[] = [
  { text: "I believe you.", tone: 'compassionate', tags: ['mercy'], once: true, if: '!pell_believed', next: 'p_believe' },
  {
    text: "(Study him carefully. Is he lying?)", tone: 'curious', once: true, if: '!pell_insight',
    check: { skill: 'insight', dc: 10 },
    successEffects: ['set pell_insight'], success: 'p_insight_ok',
    failureEffects: ['set pell_insight'], failure: 'p_insight_fail',
  },
  { text: "Tell me about the music box.", tone: 'curious', once: true, if: '!pell_q_box', next: 'p_box' },
  { text: "Here. Buy yourself something at the stalls.", tone: 'friendly', tags: ['charity'], once: true, if: 'gold>=1 && !pell_coin', effects: ['gold -1', 'set pell_coin'], next: 'p_coin' },
  { text: "Your mother's right, Pell. Children imagine things.", tone: 'pragmatic', tags: ['pragmatic'], next: 'p_dismiss' },
  { text: "I'll keep an eye out for her.", tone: 'leave', next: 'p_bye' },
];

const HANNE_OPTS: DialogueOption[] = [
  {
    text: "(Look past her, into the house.)", tone: 'curious', once: true, if: '!hanne_looked',
    check: { skill: 'investigation', dc: 11 },
    successEffects: ['set hanne_looked', 'clue sq_lira cradle'], success: 'h_beds',
    failureEffects: ['set hanne_looked'], failure: 'h_look_fail',
  },
  {
    text: "(Watch her face.) Are you certain there's never been anyone else?", tone: 'compassionate', once: true, if: '!hanne_read',
    check: { skill: 'insight', dc: 12 },
    successEffects: ['set hanne_read', 'clue sq_lira cradle'], success: 'h_bowls',
    failureEffects: ['set hanne_read'], failure: 'h_read_fail',
  },
  { text: "I don't think he's making it up. I think something is wrong in this town.", tone: 'compassionate', tags: ['honesty'], once: true, if: '!hanne_q_wrong', next: 'h_wrong' },
  { text: "I'll let you get back to your evening.", tone: 'leave', end: true },
];

const ABEL_OPTS: DialogueOption[] = [
  { text: "We'll handle it. Stay here.", tone: 'friendly', tags: ['protect', 'boldness'], effects: ['set mill_attack', 'set abel_asked'], next: 'a_handle' },
  {
    text: "We go in quiet — round the back, out the back, no fight.", tone: 'pragmatic', tags: ['stealth', 'caution'],
    check: { skill: 'stealth', dc: 13 },
    successEffects: ['set mill_resolved', 'set mill_saved', 'add rescued_count 1', 'xp 75'], success: 'a_sneak_ok',
    failureEffects: ['set mill_attack'], failure: 'a_sneak_fail',
  },
  {
    text: "Hounds are hounds. Give me the smoked meat from your larder and I'll draw them off.", tone: 'pragmatic', tags: ['nature'],
    check: { skill: 'animalHandling', dc: 14 },
    successEffects: ['set mill_resolved', 'set mill_saved', 'add rescued_count 1', 'xp 75'], success: 'a_lure_ok',
    failureEffects: ['set mill_attack'], failure: 'a_lure_fail',
  },
  {
    text: "Flour. A sack of it, thrown into the wind upwind of them — they hunt by something, and we can foul it.", tone: 'pragmatic', tags: ['nature'],
    check: { skill: 'nature', dc: 13 },
    successEffects: ['set mill_resolved', 'set mill_saved', 'add rescued_count 1', 'xp 75'], success: 'a_flour_ok',
    failureEffects: ['set mill_attack'], failure: 'a_flour_fail',
  },
  { text: "Slow down. Tell me exactly what you saw.", tone: 'curious', once: true, if: '!abel_q_details', next: 'a_details' },
  { text: "I can't help you right now.", tone: 'leave', next: 'a_refuse' },
];

const ECHO_RESOLVE_OPTS: DialogueOption[] = [
  {
    text: "(Look at her properly.) Who are you?", tone: 'curious', if: '!echo_insight_tried',
    check: { skill: 'insight', dc: 12 },
    successEffects: ['set echo_understood', 'set echo_insight_tried'], success: 'e_understand',
    failureEffects: ['set echo_insight_tried', 'damage 1d4 psychic'], failure: 'e_insight_fail',
  },
  {
    text: "This isn't your shop any more. Let her go.", tone: 'diplomatic', tags: ['diplomacy'], if: '!echo_understood',
    check: { skill: 'persuasion', dc: 14 },
    success: 'e_resolve', failureEffects: ['set echo_hostile'], failure: 'e_fail',
  },
  {
    text: "You kept every penny. It wasn't your fault, Ysolde. But this life is hers — and you don't need it any more.", tone: 'compassionate', tags: ['mercy', 'honesty'], if: 'echo_understood',
    check: { skill: 'persuasion', dc: 11 },
    success: 'e_resolve', failureEffects: ['set echo_hostile'], failure: 'e_fail',
  },
  {
    text: "(Resonance) Show her the life she has left — the one that's still hers to finish.", tone: 'resonance', tags: ['mercy'], if: 'resunlocked && res>=1',
    effects: ['res -1'], next: 'e_resolve_res',
  },
  {
    text: "(Speak the rite of release over her.) Veyra keeps the drowned. Let her keep you.", tone: 'compassionate', tags: ['faith', 'mercy'],
    check: { skill: 'religion', dc: 13, advIf: 'class:cleric || class:paladin || bg:acolyte' },
    success: 'e_rite', failureEffects: ['set echo_hostile'], failure: 'e_fail',
  },
  { text: "(Draw your weapon.)", tone: 'aggressive', tags: ['violence'], effects: ['combat enc_shop'], end: true },
  { text: "(Back away.)", tone: 'leave', end: true },
];

const LIRA_OPTS: DialogueOption[] = [
  { text: "Pell sent me. He's been looking for you everywhere.", tone: 'compassionate', once: true, if: '!lira_q_pell', next: 'l_pell' },
  { text: "What do you remember, Lira?", tone: 'curious', once: true, if: '!lira_q_remember', next: 'l_remember' },
  { text: "Why are you down here, all by yourself?", tone: 'curious', once: true, if: '!lira_q_why', next: 'l_why' },
  {
    text: "(Study the weave of Aether holding her together.)", tone: 'curious', once: true, if: '!knows_anchor_cost && !lira_weave_tried',
    check: { skill: 'arcana', dc: 14 },
    successEffects: ['set knows_anchor_cost', 'set lira_weave_tried'], success: 'l_cost',
    failureEffects: ['set lira_weave_tried'], failure: 'l_cost_fail',
  },
  {
    text: "(Pray over her, and listen for what the Lights would ask.)", tone: 'curious', once: true, if: '!knows_anchor_cost && !lira_prayer_tried',
    check: { skill: 'religion', dc: 14 },
    successEffects: ['set knows_anchor_cost', 'set lira_prayer_tried'], success: 'l_cost',
    failureEffects: ['set lira_prayer_tried'], failure: 'l_cost_fail',
  },
  { text: "Lira... it's time to decide what happens next.", tone: 'compassionate', next: 'choose' },
  { text: "I'll come back for you. I promise.", tone: 'leave', end: true },
];

const CORVIN_DECIDE: DialogueOption[] = [
  {
    text: "You're going to Captain Hale. Hollowmere gets to judge what you did to it.", tone: 'diplomatic', tags: ['authority', 'honesty'],
    effects: ['set corvin_fate handed_over', 'complete sq_corvin handed_over', 'rep covenant 5', 'rep hollowmere 5', 'rep unbound -10'], next: 'd_hale',
    voices: {
      seris: "He cracked the seal. People are lost in that fog because of it. Let the Captain judge him — that's what law is for.",
      brakka: "The town's got a right to look him in the eye. Hand him over.",
      orren: "Hale's an honest man. Let him weigh it. We've enough on our hands.",
    },
  },
  {
    text: "Go. Get out of Hollowmere before anyone else finds you.", tone: 'compassionate', tags: ['mercy', 'defiance'],
    effects: ['set corvin_fate freed', 'give unbound_sigil', 'rep unbound 15', 'complete sq_corvin freed'], next: 'd_free',
    voices: {
      ilyra: "He's sorry, and he's terrified. Hale will hang him to give the town someone to blame. Let him go.",
      nima: "Let him run! Hale will just lock him in a box and feel better about it.",
      kael: "A scapegoat's still a goat. Let him walk.",
    },
  },
  {
    text: "You can read Ithari. Then you're helping us open that vault.", tone: 'pragmatic', tags: ['pragmatic', 'knowledge'],
    effects: ['set corvin_fate ally', 'set corvin_ally', 'rep unbound 10', 'complete sq_corvin ally'], next: 'd_ally',
    voices: {
      vaelis: "He reads Ithari. Badly, I'd wager — but better than anyone else in this crypt. Use him.",
      varek: "He opened the wound. Let him help close it.",
      tessa: "Bring him. He owes this town a story with a better ending than the one he started.",
    },
  },
  { text: "I need to think. Stay here and stay quiet.", tone: 'leave', end: true },
];

// ───────────────────────────────────────────────────────────── trees

export const SIDE_DIALOGUES: DialogueTree[] = [
  // ════════════════════════════════════════════════════════ 1. North gate (festival)
  {
    id: 'gate_closed',
    title: 'The North Gate',
    start: 'gate',
    nodes: {
      gate: {
        speaker: 'dm',
        text: "The north gate is shut, and leaning against it with the air of a man who has been leaning against it since dusk is a young watchman with a lantern on a pole in one hand and a pastry in the other. “Evening. Gate's shut,” says Jory, around the pastry. “Cathedral grounds are closed after dark. Always have been. Graves, loose stones, the odd fox with opinions. Come back in daylight — or take it up with Captain Hale. He's in the square, pretending to enjoy himself.”",
        interjections: [
          { who: 'kael', text: "Left hinge squeals, right one doesn't. Just an observation. For later. Or never." },
          { who: 'orren', text: "He's not wrong about the foxes. Something's put every animal north of that wall on edge." },
        ],
        options: [
          { text: "What's so dangerous about an old ruin?", tone: 'curious', next: 'gate_why' },
          { text: "A coin for the gate fund, perhaps? Nobody need know.", tone: 'background', if: 'bg:criminal', tags: ['deception'], next: 'gate_bribe' },
          { text: "Fair enough. Enjoy the festival, Jory.", tone: 'leave', next: 'gate_bye' },
        ],
      },
      gate_why: {
        speaker: 'dm',
        text: "“Nothing, probably,” Jory admits. “Only my nan says you can hear it humming, some nights. The ground. Like a pot just before it boils.” He shrugs and takes another bite. “Also the Captain would have my hide for a drum. Daylight. Or Hale.”",
        end: true,
      },
      gate_bribe: {
        speaker: 'dm',
        text: "Jory looks at your hand, then at his pastry, then back at your hand, plainly weighing the two. “That's very kind,” he says at last, “and I'd love to, and my mam would skin me. Hollowmere watch doesn't take coin.” A pause. “Hollowmere watch takes pastries. But I've already got one.”",
        end: true,
      },
      gate_bye: {
        speaker: 'dm',
        text: "“Hang a lantern for me,” Jory calls after you. “I can never think who to hang mine for.”",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 2. Mayor Edda Brannock
  {
    id: 'mayor',
    title: 'Mayor Edda Brannock',
    start: [
      { if: 'bell_rang', node: 'night' },
      { if: 'mayor_met', node: 'again' },
      { node: 'festival' },
    ],
    nodes: {
      festival: {
        speaker: 'mayor',
        effects: ['set mayor_met'],
        text: "The Mayor of Hollowmere stands at the edge of the square holding a ledger, three loose lists and a pencil behind each ear. “Welcome to Hollowmere, last night of the Festival of Lanterns, please don't stand on the bunting. Edda Brannock. Mayor. Are you a guest of the inn, somebody's cousin, or a problem nobody's told me about yet?”",
        interjections: [
          { who: 'tessa', text: "Somebody's cousin. Definitely. Everyone's somebody's cousin at a festival." },
        ],
        options: MAYOR_DAY,
      },
      again: {
        speaker: 'mayor',
        text: "“{player}. Again. Lovely.” She does not look up from her list. “If it's about the cider queue, it's being dealt with. By which I mean I've written it down.”",
        options: MAYOR_DAY,
      },
      hub_day: {
        speaker: 'mayor',
        text: "She licks the end of a pencil and makes a small, vicious tick on a list. “What else?”",
        options: MAYOR_DAY,
      },
      m_fest: {
        speaker: 'mayor',
        effects: ['set mayor_q_fest'],
        text: "“Going? It's going. Forty-two lanterns on the Tree by sundown, which is a record. A fistfight over the pie judging, which is tradition. And the fiddler's been paid in advance, which I already regret.” Something in her face softens, briefly. “People come home for this. Folk who swore they'd never set foot in Hollowmere again. You hang a lantern for someone you've forgotten, and somehow, for one night, you remember being the kind of town that bothers. That's the idea, anyway.”",
        next: 'hub_day',
      },
      m_trouble: {
        speaker: 'mayor',
        effects: ['set mayor_q_trouble'],
        text: "“I have precisely as many problems as lists. That's the system.” She lowers her voice. “Small things. Wells running warm. Dogs barking at the cathedral wall. The Ashcombes — Tallow Lane, nice family, three children — packed their cart a month ago and left. Said the house felt wrong. Said the stairs had thirteen steps going up and fourteen coming down.” She snorts, but her pencil has stopped moving. “I went and counted them myself. Thirteen. Both ways.” A beat. “I counted them twice.”",
        interjections: [
          { who: 'brakka', text: "Keep counting, Mayor. The day you stop is the day you can't prove it was ever otherwise. Trust me on that." },
          { who: 'vaelis', text: "Thirteen up, fourteen down. Charming. My instruments would like a word with that staircase." },
        ],
        next: 'hub_day',
      },
      m_help: {
        speaker: 'mayor',
        effects: ['set mayor_q_help'],
        text: "She looks at you as if nobody has asked her that in several years and she is not sure of the correct form. “Hang a lantern. Buy a pie — any pie, the judging's done, they're all losers now. Don't start fights.” She hesitates. “And if you're passing the Lantern & Lamb, those Grey Hawk sellswords are drinking on credit again and young Lio's getting the worst of it. Tobin's too soft and the Captain's too fond of a war story. Somebody with no reason to be scared of them might… well. I didn't say anything.”",
        next: 'hub_day',
      },
      census_ok: {
        speaker: 'dm',
        text: [
          {
            if: 'quest:sq_lira',
            text: "She hands over the ledger with the expression of a woman lending out a kidney. The Hollowmere census of 3009, every household in her small, square hand. It takes you a while to see it. Every few pages a line has been scraped clean — not crossed out or blotted, but scraped, the vellum thinned almost to light. And the entries around the gaps are wrong: a household of ‘four souls’ with three names; a widow whose husband is listed as living. Then you find Tallow Lane. Household of Hanne Wick: Hanne, weaver. Tam, carter. Pell, son, aged eight. And beneath Pell's name, a gap exactly one line wide, scraped so hard the knife went through. “I wrote every line of that myself,” the Mayor says over your shoulder. Her voice has gone thin. “I don't remember doing that.”",
          },
          {
            text: "She hands over the ledger with the expression of a woman lending out a kidney. The Hollowmere census of 3009, every household in her small, square hand. It takes you a while to see it. Every few pages a line has been scraped clean — not crossed out or blotted, but scraped, the vellum thinned almost to light. And the entries around the gaps are wrong: a household of ‘four souls’ with three names; a widow whose husband is listed as living; a cradle tax paid on a house with no children. “I wrote every line of that myself,” the Mayor says over your shoulder. Her voice has gone thin. “I don't remember doing that.”",
          },
        ],
        interjections: [
          { who: 'kael', text: "Nobody scrapes a ledger by accident. I've done it on purpose — it takes an hour and a very sharp knife. This took someone a lot longer." },
          { who: 'seris', text: "Erasing a name from a record is a grave act. The Order punishes it. Whoever did this—" },
        ],
        next: 'census_after',
      },
      census_after: {
        speaker: 'mayor',
        text: [
          { if: 'bell_rang', text: "She takes the ledger back and holds it against her chest like a shield. “Tonight half the town's woken up with the wrong family. And my book has holes in it shaped like people.” A breath. “Go. Do something. I'll keep counting.”" },
          { text: "She takes the ledger back and holds it against her chest. “I'll recopy those pages. Tomorrow. I keep meaning to.” She looks at the lanterns. “I keep forgetting to.”" },
        ],
        options: [
          { text: "(Continue.)", tone: 'pragmatic', if: 'bell_rang', next: 'hub_night' },
          { text: "(Continue.)", tone: 'pragmatic', if: '!bell_rang', next: 'hub_day' },
        ],
      },
      census_fail: {
        speaker: 'mayor',
        text: "She lets you hold it for roughly as long as it takes to read one page upside down. “That's enough — this isn't a lending library and you've got cider on your thumb.” She snaps the ledger shut, then hesitates, hugging it. “Some of the pages are… odd. I keep meaning to recopy them.” She says it lightly. She doesn't look light.",
        options: [
          { text: "(Continue.)", tone: 'pragmatic', if: 'bell_rang', next: 'hub_night' },
          { text: "(Continue.)", tone: 'pragmatic', if: '!bell_rang', next: 'hub_day' },
        ],
      },
      m_bye: {
        speaker: 'mayor',
        text: "“Bunting,” she reminds you, pointing at your feet, and is already turning to intercept a man carrying a goat towards the pie table.",
        end: true,
      },
      night: {
        speaker: 'mayor',
        text: [
          { if: 'mayor_met', text: "“{player}! You're alive. Good — good. Hold this.” A blanket lands in your arms before you can argue. The Mayor's hair has come loose from its pins and there is mud to her knees, but the ledger is still under her arm. “Everyone with a roof that isn't safe goes to the Lamb. Everyone who's lost somebody gives the name to me. I'm writing it all down. If I write it all down it stays real.”" },
          { text: "A woman with mud to her knees and a ledger under one arm is shouting names into the fog and ticking them off as voices answer. She catches sight of you and thrusts a blanket into your arms. “Edda Brannock, Mayor, you're carrying that to the Lantern & Lamb. Everyone with a roof that isn't safe goes to the Lamb. Everyone who's lost somebody gives the name to me.” Her voice cracks and she ignores it. “If I write it down, it stays real.”" },
        ],
        interjections: [
          { who: 'ilyra', text: "Mayor — when did you last sit down? No, don't answer. Just… when this is done, sit. Promise me." },
          { who: 'korr', text: "This one leads like a war-chief. Shouting, counting heads, no sword. My people would give her a name for that." },
        ],
        options: MAYOR_NIGHT,
      },
      hub_night: {
        speaker: 'mayor',
        text: "Somewhere in the fog a door bangs, and she flinches, and makes a tick on her list anyway. “What else?”",
        options: MAYOR_NIGHT,
      },
      n_need: {
        speaker: 'mayor',
        effects: ['set mayor_q_night'],
        text: "“What I need is for this to be a nightmare I can sort into columns.” She jabs her pencil at the inn. “Shelter's at the Lamb. Hale has the watch — what's left of it. People keep coming in saying their husband's a stranger. Gilly Prentice came in screaming that her children were wrong. Same faces. Wrong.” The pencil trembles. “I don't have a list for wrong. I don't have a column for that.” She swallows. “If you can fight, help Hale. If you can't, carry blankets. Either way, don't go into the fog alone.”",
        next: 'hub_night',
      },
      n_thanks: {
        speaker: 'mayor',
        effects: ['set mayor_thanked', 'rep hollowmere 5'],
        text: "For a moment she just looks at you. Then the Mayor of Hollowmere, who holds the town together with lists and the lists together with string, puts the ledger down on a barrel, takes both your hands in her ink-stained ones, and squeezes them so hard it hurts. “Every name,” she says. “I had every one of their names on the list of the missing. And now I get to cross them off the right way.” She picks the ledger back up. Her eyes are wet; her voice is not. “Hollowmere won't forget this. I'll make sure of it. I'll write it down.”",
        next: 'hub_night',
      },
      n_bye: {
        speaker: 'mayor',
        text: "“You too.” She's already turned back to the fog, cupping her hands. “PRENTICE! GILLY PRENTICE! YOUR CHILDREN ARE AT THE INN AND THEY ARE FINE!”",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 3. Old Hob
  {
    id: 'hob',
    title: 'Old Hob',
    start: 'hob',
    nodes: {
      hob: {
        speaker: 'hob',
        text: "“Evenin'! Evenin'. You're not from here — I can tell, you're looking up. Locals don't look up. Seen it all.” He jabs his pipe at the sky, where a thin moon hangs over the cathedral stump. “Used to be bigger, y'know. The moon. When I was a lad it filled half the sky over the barley. Now look at it. Shrivelled. Like an apple left in the loft.”",
        options: [
          { text: "The moon doesn't change size, Hob.", tone: 'sarcastic', next: 'hob_moon' },
          { text: "What else has changed?", tone: 'curious', next: 'hob_stars' },
          { text: "Enjoy the festival, grandfather.", tone: 'leave', end: true },
        ],
      },
      hob_moon: {
        speaker: 'hob',
        effects: ['set hob_seen_moon'],
        text: "“That's what they all say! Wife used to say it too.” He beams, then frowns. “My wife. Lovely woman. Bread like a cloud. Laugh like a gate that needs oiling. Her name was…” His mouth works around a shape that isn't there. “Funny. Forty-one years married. It's on the tip of me tongue. Begins with a sort of — soft sound.” He laughs, too loudly. “Ah, it'll come. It always comes back by morning.”",
        interjections: [
          { who: 'tessa', text: "Hob — when it comes back, write it down. Somewhere it can't wriggle out. Promise me." },
          { who: 'ilyra', text: "Take your time. There's no hurry. Names come when they're ready." },
        ],
        options: [
          { text: "Does it? Come back by morning?", tone: 'compassionate', next: 'hob_wife' },
          { text: "What else has changed, Hob?", tone: 'curious', if: '!hob_seen_stars', next: 'hob_stars' },
          { text: "Good night, Hob.", tone: 'leave', end: true },
        ],
      },
      hob_stars: {
        speaker: 'hob',
        effects: ['set hob_seen_stars'],
        text: "“Stars!” He says it like a man revealing a winning hand. “Last spring, over the Whispering Woods. One night — just the one — they were all in the wrong places. The Plough on its back like a dead beetle. The Shepherd's Lamp clean gone. I woke my boy and he said, ‘Da, go to bed.’ Next night, all back where they belong, pretty as you like.” He taps the side of his nose. “Not all of 'em. There's a little red one over the Woods now. Never seen it in my life before that night. Nobody else has noticed.” He shrugs, delighted. “Nobody else looks up.”",
        interjections: [
          { who: 'orren', text: "He's right. There's a red star over the Woods that wasn't there before. The new paths started growing the same week. I'd hoped I was the only one who'd noticed." },
        ],
        options: [
          { text: "Who else would notice? Your wife?", tone: 'curious', if: '!hob_seen_moon', next: 'hob_moon' },
          { text: "Keep looking up, Hob.", tone: 'leave', end: true },
        ],
      },
      hob_wife: {
        speaker: 'hob',
        text: "“Mostly.” He looks at the Lantern Tree for a long moment, at all the little lights swaying. “I hang one every year. For her, I always thought. Only this year I got to the Tree and I couldn't think who it was for.” He sucks his empty pipe. “Hung it anyway. Felt right.” And then, brightening as though none of it was said: “Chestnuts! Have you had the chestnuts? Go and have the chestnuts. Tell 'em Hob sent you, they'll give you the burnt ones, that's where the flavour is.”",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 4. Mira the lantern-seller
  {
    id: 'mira',
    title: 'Mira the Lantern-seller',
    start: [
      { if: 'bought_lantern', node: 'after' },
      { node: 'pitch' },
    ],
    nodes: {
      pitch: {
        speaker: 'mira',
        text: "“Lanterns! Festival lanterns! Paper from Ashenford, wax from Hob's bees, string from my own personal string! One gold, which is robbery, but I'm the one doing the robbing so it's fine.” She thrusts a tray at you: a dozen paper lanterns, each painted with a different small picture — a boat, a fox, a key, a door standing on its own with no house around it.",
        interjections: [
          { who: 'kael', text: "‘My own personal string.’ She's good. I'd have hired her at twelve. Actually, I'd have worked for her." },
        ],
        options: [
          { text: "What are they for?", tone: 'curious', once: true, if: '!mira_q_custom', next: 'mira_custom' },
          { text: "I'll take one. (1 gold)", tone: 'friendly', tags: ['charity'], if: 'gold>=1 && !mira_price_up', effects: ['gold -1', 'set bought_lantern'], next: 'mira_sold' },
          { text: "Fine. Two gold. (2 gold)", tone: 'pragmatic', if: 'gold>=2 && mira_price_up', effects: ['gold -2', 'set bought_lantern'], next: 'mira_sold' },
          {
            text: "One gold? For paper? A merchant of your obvious talent can surely do better for a weary traveller.", tone: 'diplomatic', tags: ['humor'], if: '!mira_haggled',
            check: { skill: 'persuasion', dc: 10 },
            successEffects: ['set mira_haggled', 'set bought_lantern'], success: 'mira_free',
            failureEffects: ['set mira_haggled', 'set mira_price_up'], failure: 'mira_haggle_fail',
          },
          { text: "Trade you a song for a lantern.", tone: 'background', if: '(bg:entertainer || class:bard) && !mira_haggled', effects: ['set mira_haggled', 'set bought_lantern'], next: 'mira_song' },
          { text: "Not right now.", tone: 'leave', end: true },
        ],
      },
      hub: {
        speaker: 'mira',
        text: "She jiggles the tray so the lanterns rustle invitingly. “Well?”",
        options: [
          { text: "I'll take one. (1 gold)", tone: 'friendly', tags: ['charity'], if: 'gold>=1 && !mira_price_up && !bought_lantern', effects: ['gold -1', 'set bought_lantern'], next: 'mira_sold' },
          { text: "Fine. Two gold. (2 gold)", tone: 'pragmatic', if: 'gold>=2 && mira_price_up && !bought_lantern', effects: ['gold -2', 'set bought_lantern'], next: 'mira_sold' },
          {
            text: "One gold? For paper? Surely we can come to an arrangement.", tone: 'diplomatic', tags: ['humor'], if: '!mira_haggled && !bought_lantern',
            check: { skill: 'persuasion', dc: 10 },
            successEffects: ['set mira_haggled', 'set bought_lantern'], success: 'mira_free',
            failureEffects: ['set mira_haggled', 'set mira_price_up'], failure: 'mira_haggle_fail',
          },
          { text: "Maybe later.", tone: 'leave', end: true },
        ],
      },
      mira_custom: {
        speaker: 'mira',
        effects: ['set mira_q_custom'],
        text: "“You don't know? Where are you from, a cave?” She sighs the sigh of a professional forced to explain the basics. “You light it and you hang it on the Lantern Tree for somebody you've forgotten. Not somebody dead — dead's different, dead you remember. Somebody you've forgotten. Nan says the lantern helps them find their way back.” She adjusts the door-lantern on her tray so it hangs straight. “I don't know who mine's for. I hang one every year anyway. That's the point, Nan says. You don't have to know.”",
        interjections: [
          { who: 'tessa', text: "Lanterns for the forgotten. I've heard that custom in three countries, and nowhere could anyone tell me who started it. My favourite kind of song." },
          { who: 'ilyra', text: "That's what I came for. A lantern for someone I can't name. Your nan sounds like a wise woman, Mira." },
        ],
        next: 'hub',
      },
      mira_free: {
        speaker: 'mira',
        text: "Mira narrows her eyes. You can actually watch her doing sums. “Fine. Free. But only because you're going to tell everybody where you got it, and they're going to pay double.” She picks one off the tray for you: the door with no house. “This one. It's been waiting.” Before you can ask what that means, she adds: “Light it before you hang it. People always forget to light it.”",
        end: true,
      },
      mira_haggle_fail: {
        speaker: 'mira',
        text: "“Do better?” Mira draws herself up to her full height, which reaches approximately your belt. “The price just went up. Two gold. That's the insult tax.” She waits, chin out, utterly immovable.",
        interjections: [
          { who: 'kael', text: "Pay the kid. You've been beaten. It's a fair cop." },
        ],
        next: 'hub',
      },
      mira_song: {
        speaker: 'mira',
        text: "You give her a verse of something quick and silly, and by the second chorus three other children have gathered, and Mira is pretending very hard not to tap her foot. “Fine,” she says, when you finish. “Fair trade. That was worth about one gold.” She considers. “Ninety copper. But I'm rounding up because you did the voice.” She gives you the lantern with the door on it. “Light it before you hang it.”",
        end: true,
      },
      mira_sold: {
        speaker: 'mira',
        text: "The coin vanishes. She picks a lantern for you — not the one you were reaching for; the one with the door standing on its own. “That one. Trust me.” She taps the little painted door. “Hang it on the Tree in the square. And light it first! People always forget to light it, and then what's the point?”",
        end: true,
      },
      after: {
        speaker: 'mira',
        text: "“You've already got one. Did you hang it? You have to hang it. Unhung lanterns are bad luck.” A pause. “I just made that up. It's probably true though.”",
        options: [
          { text: "What are the lanterns for, exactly?", tone: 'curious', once: true, if: '!mira_q_custom', next: 'mira_custom' },
          { text: "I'll hang it. Promise.", tone: 'leave', end: true },
        ],
      },
    },
  },

  // ════════════════════════════════════════════════════════ 5. Garrick Dunmore
  {
    id: 'garrick',
    title: 'Garrick Dunmore',
    start: [
      { if: 'bell_rang', node: 'night' },
      { node: 'day' },
    ],
    nodes: {
      day: {
        speaker: 'garrick',
        text: "The blacksmith doesn't look up from the horseshoe glowing on his anvil. “Forge is open. Festival or no festival, horses don't stop throwing shoes.” Clang. “Buying or talking?”",
        interjections: [
          { who: 'brakka', text: "Good hammer-rhythm. Three and a rest. My uncle swung like that." },
        ],
        options: GARRICK_DAY,
      },
      hub_day: {
        speaker: 'garrick',
        text: "Clang. Clang. Clang. He waits.",
        options: GARRICK_DAY,
      },
      g_family: {
        speaker: 'garrick',
        effects: ['set garrick_q_family'],
        text: "“Dunmores have had this forge a hundred and sixty years.” He sets the hammer down, which seems to be a mark of respect for the subject. “My great-grandda Bram was at this anvil the Night of Falling Stone. Tower came down in the middle of evening prayers. He dug for three days with his hands. Pulled out nineteen living.” A pause. “Forty-one dead.”",
        options: [
          { text: "What happened to the bell?", tone: 'curious', next: 'g_bell' },
          { text: "I'm sorry. That's a heavy thing to inherit.", tone: 'compassionate', next: 'g_heavy' },
        ],
      },
      g_heavy: {
        speaker: 'garrick',
        text: "He grunts. “Lighter than a tower.” Then, after a moment: “He never talked about the dead. Only the nineteen. Knew all their names till the day he died.” He picks the hammer back up. “Ask about the bell sometime. That's the bit nobody can explain.”",
        options: [
          { text: "Then explain it. What happened to the bell?", tone: 'curious', next: 'g_bell' },
          { text: "Another time.", tone: 'leave', next: 'hub_day' },
        ],
      },
      g_bell: {
        speaker: 'garrick',
        effects: ['set knows_bell_missing'],
        text: "“That's the thing.” He wipes his hands slowly on his apron. “They cleared every stone of that tower. Every stone. Built half the new town wall out of it — you walked past it coming in. And they never found the bell. Eight tons of bronze, big as this forge. No crack of it. No clapper. Not a scrap.” He looks north, toward the stump against the sky. “Grandda used to say: a stone falls down. A man falls down. A bell that size doesn't fall anywhere.” Clang. “It goes somewhere.”",
        interjections: [
          { who: 'vaelis', text: "Bronze doesn't evaporate. Either someone stole a bell the size of a cottage in the middle of a disaster, or it went somewhere bronze doesn't usually go." },
          { who: 'seris', text: "The Order teaches that Orlen's Voice was taken up into the Light. I always assumed that was a metaphor." },
        ],
        options: [
          { text: "(Continue.)", tone: 'pragmatic', if: 'bell_rang', next: 'hub_night' },
          { text: "(Continue.)", tone: 'pragmatic', if: '!bell_rang', next: 'hub_day' },
        ],
      },
      g_dwarf: {
        speaker: 'garrick',
        effects: ['set garrick_q_dwarf'],
        text: "For the first time, Garrick looks up properly. Then he grins — a rare thing, like sun on a slag heap. “Good eye. Traded a Kharn caravan four horseshoes and a hinge for two bars of it. Never had the nerve to use it.” He considers you. “Thought I'd save it for something that mattered. Seems a waste now. Come back if you've a blade that deserves it.”",
        next: 'hub_day',
      },
      night: {
        speaker: 'garrick',
        text: "A hammer in one fist, a pitchfork in the other, Garrick stands square in front of his forge like a door that has decided not to open. “Stay where I can see you.” He squints through the fog. “…You. Fine. You're real. You're the right shape.” He doesn't lower the pitchfork. “Some of what's walking about out there isn't.”",
        interjections: [
          { who: 'korr', text: "Good. A man guarding his hearth with what he has. My people would sing that." },
          { who: 'brakka', text: "Keep the fork low, smith. They come in under it otherwise." },
        ],
        options: GARRICK_NIGHT,
      },
      hub_night: {
        speaker: 'garrick',
        text: "He shifts his grip on the pitchfork and keeps one eye on the fog. “What?”",
        options: GARRICK_NIGHT,
      },
      g_night_shop: {
        speaker: 'garrick',
        text: "“Especially tonight. Iron doesn't care what the fog is.” He jerks his head at the racks behind him. “Take what you need. Pay what you can. Haggle and I'll hit you.”",
        options: [
          { text: "Show me.", tone: 'pragmatic', effects: ['shop garrick'], end: true },
          { text: "Maybe later.", tone: 'leave', next: 'hub_night' },
        ],
      },
      g_night_talk: {
        speaker: 'garrick',
        effects: ['set garrick_q_night'],
        text: "“My wife's at the Lamb with the girls. I'm here because if those things want iron, they'll get it pointy end first.” He's quiet a moment. “I heard it, you know. The bell. Grandda always said it'd ring once more. I thought he meant it would be nice.”",
        next: 'hub_night',
      },
    },
  },

  // ════════════════════════════════════════════════════════ 6. Ysolde Quill
  {
    id: 'ysolde',
    title: 'Ysolde Quill',
    start: [
      { if: 'bell_rang && ysolde_saved', node: 'grateful' },
      { node: 'day' },
    ],
    nodes: {
      day: {
        speaker: 'ysolde',
        text: "“Welcome to Quill's Sundries, now trading from a trestle because the festival committee — meaning Edda — says shop doors ‘disrupt the flow of revellers.’ Rope, oil, salves, candles, and advice, which is free and therefore overpriced.” She takes you in with one efficient sweep, boots to collar. “Boots, local. Coat, not. Purse…” A thin smile. “We'll see.”",
        interjections: [
          { who: 'kael', text: "She priced my whole outfit in one look. I'm insulted. She was right." },
        ],
        options: YSOLDE_DAY,
      },
      hub_day: {
        speaker: 'ysolde',
        text: "She straightens a row of candles that were already straight. “Anything else, or are we just enjoying each other's company?”",
        options: YSOLDE_DAY,
      },
      y_gossip: {
        speaker: 'ysolde',
        effects: ['set ysolde_q_gossip'],
        text: "“Gossip is for people with nothing to sell.” A pause precisely long enough to be decent. “Tobin's got a scholar upstairs who pays in Old Charter silver — nobody's minted that in a century. The Grey Hawks are drinking on credit at the Lamb and Tobin's too soft to say no. Edda's recounting her census for the third time this month, which means she's lost something and won't say what. And Sister Maren bought six quires of my best paper on Tuesday, when she hasn't bought so much as a sheet in a year.” She smiles, all edges. “None of which you heard from me. That'll be nothing.”",
        interjections: [
          { who: 'kael', text: "Old Charter silver. Either he's robbed a museum, or he's been somewhere it's still being minted." },
          { who: 'varek', text: "Sister Maren. Six quires of paper. Someone is making a very long list." },
        ],
        next: 'hub_day',
      },
      y_tower: {
        speaker: 'ysolde',
        effects: ['set ysolde_q_tower'],
        text: "“I know it fell before my grandmother was born and it's been bad for business ever since. Pilgrims used to come for the bell. Now they come for the festival, buy one candle, and cry.” She taps the counter. “My great-aunt used to say Hollowmere was a richer town in some other version of itself. Said she could feel it, like a draught under a door.” She shrugs. “She was drunk. Doesn't mean she was wrong.”",
        next: 'hub_day',
      },
      grateful: {
        speaker: 'ysolde',
        text: "Ysolde Quill is sweeping glass from the doorstep of her shop at an hour when no sensible person sweeps anything. Her hands are not quite steady. “Don't. Don't say anything kind, I'll come apart, and I've only just got myself back together.” She leans on the broom. “She thought she was me. She had my face. My voice. She knew where I keep the spare key.” A breath. “She'd drowned. I could smell the river on her.”",
        interjections: [
          { who: 'ilyra', text: "You don't have to be together yet, Ysolde. Sit for a moment. The broom will wait." },
          { who: 'varek', text: "She wasn't a ghost. Ghosts are of the dead. She was a might-have-been — and they're always angrier." },
        ],
        options: YSOLDE_NIGHT,
      },
      hub_night: {
        speaker: 'ysolde',
        text: "She goes back to sweeping, which seems to help. “Well?”",
        options: YSOLDE_NIGHT,
      },
      y_gift: {
        speaker: 'ysolde',
        effects: ['set ysolde_gift', 'set ysolde_discount', 'give aether_draught 1'],
        text: "“No. Obviously not. Here.” She presses a stoppered vial into your hand; inside, something shimmers like oil on a puddle. “Aether Draught. Tastes like licking a thunderstorm. Take it. And from tonight you pay what I pay, near enough.” She holds up a finger before you can speak. “Don't argue. I'm a merchant. I know exactly what my life's worth, and it's more than a markup.”",
        next: 'hub_night',
      },
      y_echo_talk: {
        speaker: 'ysolde',
        effects: ['set ysolde_q_echo'],
        text: "“That I'd stolen her life. That I'd been lucky where she'd been brave.” The broom stops. “Thing is, I nearly did lose this place. Six years back. A Solmara lender, a bad winter, a letter written and sealed to sell up. Then Garrick walked in and bought forty pounds of nails he didn't need, and Tobin ordered candles for a year, and Edda found a ‘clerical error’ in my rates.” She laughs, and it wobbles. “Every day since, I've wondered what would have happened if they hadn't. Now I know. I'd have walked into the river.” She starts sweeping again, harder. “Remind me to buy Garrick a drink. Several.”",
        next: 'hub_night',
      },
    },
  },

  // ════════════════════════════════════════════════════════ 7. Tobin Marsh
  {
    id: 'tobin',
    title: 'Tobin Marsh',
    start: [
      { if: 'bell_rang', node: 'night' },
      { node: 'day' },
    ],
    nodes: {
      day: {
        speaker: 'tobin',
        text: "“There they are! Come in, come in — mind the step, mind the dog — that's not a dog, that's Gerrold, he's had a long day. Tobin Marsh, the Lantern & Lamb, best cider north of the Selenne and the only cider, so I win by default.” He beams at you as if you were a long-lost nephew. “Hungry? Thirsty? Lonely? I can fix two of those and talk you out of the third.”",
        interjections: [
          { who: 'varek', text: "He told me yesterday I was ‘a pale gentleman with ominous eyes.’ He told the entire room. Twice." },
        ],
        options: TOBIN_OPTS,
      },
      night: {
        speaker: 'tobin',
        text: "Tobin is ladling stew into bowls as fast as hands can reach for them, sleeves rolled to the shoulder, face set. There is no beam tonight. When he sees you, something in his jaw unclenches by about a hair. “You're in one piece. Good. Sit if you can, eat if you can't sit.” Ladle, bowl, ladle. “Thirty-one people in my common room and the soup's holding. That's the news.”",
        interjections: [
          { who: 'ilyra', text: "Tobin, you've fed everyone in this room twice. Let me take the ladle for a while." },
        ],
        options: TOBIN_OPTS,
      },
      hub: {
        speaker: 'tobin',
        text: [
          { if: 'bell_rang', text: "He tops up a bowl that didn't need topping up. “What else?”" },
          { text: "He polishes a tankard with tremendous enthusiasm and no visible effect. “What else can I do you for?”" },
        ],
        options: TOBIN_OPTS,
      },
      t_rooms: {
        speaker: 'tobin',
        effects: ['set tobin_q_rooms'],
        text: [
          { if: 'bell_rang', text: "“No charge tonight. Nobody's paying for anything tonight.” He jerks his chin at the stairs at the back. “If you need to shut your eyes, go up. Take any room with the door open. Bang on the floor if anything comes through the walls and I'll come up with the cleaver.”" },
          { text: "“Stew's mutton and barley and something Mrs. Marsh calls ‘the secret,’ which I'm fairly sure is more barley. Rooms are up the stairs at the back — take any with the door open. Rest your bones, I'll put it on a tab and forget to collect it.” He sighs happily. “I always do. It's why I'm poor and beloved.”" },
        ],
        next: 'hub',
      },
      t_rumour: {
        speaker: 'tobin',
        effects: ['set tobin_rumour', 'quest sq_corvin rumor', 'clue mq_bell corvin_seen'],
        text: CORVIN_RUMOUR,
        interjections: [
          { who: 'kael', text: "Back room. Single lock, old door. Just saying. For nobody's benefit." },
          { who: 'vaelis', text: "A scholar with a shovel. Either a very determined gardener or a very bad idea." },
        ],
        next: 'hub',
      },
      t_rumour_late: {
        speaker: 'tobin',
        effects: ['set tobin_rumour', 'clue mq_bell corvin_seen'],
        text: "“The scholar? Corvin Thale? Spectacles, says ‘fascinating’ about the drains?” Tobin's eyebrows shoot up. “You've met him! Then you know more than me. All I know is he went out every midnight with a shovel and came back every morning looking buried, and he left grey mud on my stairs. Cathedral mud.” He lowers his voice. “His room's still locked. Back corner. I've not had the heart to clear it.”",
        next: 'hub',
      },
      t_hawks: {
        speaker: 'tobin',
        effects: ['set tobin_q_hawks'],
        text: "“Dag Morrow's lot. The Grey Hawks. Sellswords between wars. Good customers until they stopped paying, which was Tuesday.” He winces as a nutshell pings off Lio's lute across the room. “They've taken against poor Lio. I'd call the Captain, but last time Hale came in, Dag bought him a drink and they sang about a siege until two in the morning.” He leans closer. “Dag's not wicked. He's bored. That's worse, in a sellsword.”",
        next: 'hub',
      },
      t_key: {
        speaker: 'tobin',
        text: "Tobin chews his lip, looks at the stairs, looks at you, and visibly loses an argument with himself. A key comes off a hook under the bar. “Back corner room. Don't touch anything that looks old or expensive, which is everything. And if he asks—” He drops it into your palm. “You found it on the floor. Floors are terrible for keys. Everyone knows that.”",
        next: 'hub',
      },
      t_key_fail_p: {
        speaker: 'tobin',
        text: "“Now, now.” Tobin's cheer slips into something stubborner. “Man's paid through the week. A Marsh doesn't open a paying guest's door for a stranger with a nice face. My da would rise from his grave and hit me with a ladle.” He polishes a tankard pointedly. “…Mind you, my da also said a wise innkeeper can be persuaded to look the other way by a sufficient contribution to the roof fund. The roof fund is eight gold.” He glances up. A drip lands on the bar. “It leaks.”",
        next: 'hub',
      },
      t_key_fail_d: {
        speaker: 'tobin',
        text: "Tobin gives you a long, merry look. “Colleague. From the Academy. Which Academy would that be, then?” Before you can answer: “He told me he hasn't got any colleagues. Said it very sadly, into his third cider.” He pats your hand. “Nice try, love. If you want in that badly, the roof fund's eight gold. And it is for the roof.” Drip.",
        interjections: [
          { who: 'kael', text: "Never claim a colleague for a man who drinks alone. Rookie mistake. I'm almost proud of him." },
        ],
        next: 'hub',
      },
      t_key_paid: {
        speaker: 'tobin',
        text: "The coins disappear with a speed that suggests long practice. “For the roof,” Tobin says solemnly, and a key slides across the bar under a dishcloth. “Back corner room. I didn't see you. I'm a very unobservant man.” He is the most observant man in Hollowmere.",
        next: 'hub',
      },
      t_night_talk: {
        speaker: 'tobin',
        effects: ['set tobin_q_night'],
        text: "“Holding? I'm holding a ladle. It's what I've got.” He doesn't stop ladling. “Old Pim keeps asking me where his wife is, and she's sat right next to him, and she keeps asking me who he is. Forty years married, the pair of them. I've given them both extra bread.” His voice catches, just once. “Soup. Soup's the thing. You can't be properly frightened with a full bowl. I read that somewhere.” A pause. “I didn't. I made it up. Eat something.”",
        next: 'hub',
      },
    },
  },

  // ════════════════════════════════════════════════════════ 8. Lio Fenwick
  {
    id: 'lio',
    title: 'Lio Fenwick',
    start: [
      { if: 'bell_rang', node: 'night' },
      { if: 'brawl_resolved', node: 'grateful' },
      { node: 'nervous' },
    ],
    nodes: {
      nervous: {
        speaker: 'lio',
        text: "Lio Fenwick is tuning the same string for the fourth time, his back very carefully turned to the sellswords' table. A bruise is coming up yellow under one eye. “Oh — hello. Sorry. Do you have a request? Please have a request. If I'm playing a request, they can't make me play ‘The Bishop's Bathwater’ again.” He lowers his voice. “That's the one with the actions.”",
        options: [
          { text: "Are they bothering you?", tone: 'compassionate', once: true, if: '!lio_q_hawks', next: 'l_hawks' },
          { text: "Play me something.", tone: 'friendly', once: true, if: '!lio_q_play', next: 'l_play_nervous' },
          { text: "Good luck, Lio.", tone: 'leave', end: true },
        ],
      },
      nervous_hub: {
        speaker: 'lio',
        text: "He plucks the string again. It's still flat. “Anything else?”",
        options: [
          { text: "Are they bothering you?", tone: 'compassionate', once: true, if: '!lio_q_hawks', next: 'l_hawks' },
          { text: "Play me something.", tone: 'friendly', once: true, if: '!lio_q_play', next: 'l_play_nervous' },
          { text: "Good luck, Lio.", tone: 'leave', end: true },
        ],
      },
      l_hawks: {
        speaker: 'lio',
        effects: ['set lio_q_hawks'],
        text: "“Bothering is… a strong word. They've been here three nights. They don't pay Tobin, they don't pay me, they throw nutshells at the high notes, and the big one, Dag, says if I play anything sad he'll show me what sad is.” He swallows. “I'm all right. I'm fine. I've been hit by better people.” A pause. “Not many. Some.”",
        interjections: [
          { who: 'korr', text: "A man who keeps playing while they throw things has more courage than the men throwing. Remember that, bard." },
          { who: 'seris', text: "Three nights of this and no one has stopped it? Where is the watch?" },
        ],
        next: 'nervous_hub',
      },
      l_play_nervous: {
        speaker: 'lio',
        effects: ['set lio_q_play'],
        text: "He launches into a jig at the pace of a man who would like it to be over. He's good — genuinely good, quick clean fingers — right up until a sellsword bellows “BATHWATER!” and a walnut bounces off his forehead, and the jig falls over its own feet. Lio keeps smiling. The smile has a crack down the middle.",
        next: 'nervous_hub',
      },
      grateful: {
        speaker: 'lio',
        text: "“It's you!” Lio grabs your hand and shakes it like a pump handle. “Tobin says the Hawks are behaving, and nobody's thrown a single nut at me in an hour. An hour! I could weep. I might weep. Excuse me.” He does not weep, quite. “What can I play you? Anything. Except the Bathwater. I'm never playing the Bathwater again.”",
        options: [
          { text: "Play me something of yours.", tone: 'friendly', once: true, if: '!lio_q_tune', next: 'l_tune' },
          { text: "Will you be all right now?", tone: 'compassionate', once: true, if: '!lio_q_future', next: 'l_future' },
          { text: "Keep playing, Lio.", tone: 'leave', end: true },
        ],
      },
      grateful_hub: {
        speaker: 'lio',
        text: "He settles the lute back against his knee, grinning like a man who's just remembered he's allowed to.",
        options: [
          { text: "Play me something of yours.", tone: 'friendly', once: true, if: '!lio_q_tune', next: 'l_tune' },
          { text: "Will you be all right now?", tone: 'compassionate', once: true, if: '!lio_q_future', next: 'l_future' },
          { text: "Keep playing, Lio.", tone: 'leave', end: true },
        ],
      },
      l_tune: {
        speaker: 'lio',
        effects: ['set lio_q_tune', 'set heard_bell_tune'],
        text: "“Something new. Well. Not new. I don't know.” He settles the lute, suddenly shy. “I woke up with it one morning last month. Just — there, in my head, finished, like I'd known it all my life. I've asked every musician from here to Ashenford. Nobody knows it.” He plays. It is a slow, rolling melody built on four descending notes, each one landing like a stone dropped into still water, and the common room goes quiet around it without quite knowing why. Something in your chest answers it the way a wineglass hums when someone across the room strikes the right note.",
        interjections: [
          { who: 'tessa', if: 'comp:tessa', text: "Lio. Where did you learn that? — No. You didn't learn it, did you. It turned up. Whole. I collect those: songs with no origin. Tunes that appear in people's heads in five countries at once, no composer, no first singer. They're always remembering something. …The last one I chased cost me everything I had. Play it again. Slowly. I want to write it down." },
          { who: 'varek', text: "…I've heard that before. Not with my ears." },
        ],
        next: 'grateful_hub',
      },
      l_future: {
        speaker: 'lio',
        effects: ['set lio_q_future'],
        text: "“I'll be better than all right. I'm playing the Lantern Tree at midnight — every year the minstrel plays the last song of the festival under the Tree, while the lanterns are lit. It's tradition.” He flushes. “I've never been asked before. Old Benno always did it, but Benno's hands shake now.” He plucks a nervous chord. “I thought I might play the new one. The one nobody knows. Seems right, for a festival about forgetting.”",
        next: 'grateful_hub',
      },
      night: {
        speaker: 'lio',
        text: [
          { if: 'heard_bell_tune', text: "Lio sits on the bottom stair with his lute in his lap, playing so softly it's barely more than breathing. A little girl sleeps against his knee. When he sees you he doesn't stop. “It helps,” he whispers. “Don't ask me why. They stop crying when I play this one.” It's his tune: the four descending notes, each one landing like a stone into still water. And now you know where else you've heard them — at midnight, in bronze, from a tower that isn't there." },
          { text: "Lio sits on the bottom stair with his lute in his lap, playing so softly it's barely more than breathing. A little girl sleeps against his knee. When he sees you, he doesn't stop. “It helps,” he whispers. “Don't ask me why. They stop crying when I play this one.” Four descending notes, slow, each one landing like a stone into still water — and the skin on the back of your neck crawls, because you heard that exact phrase at midnight, rolling down from a tower that isn't there." },
        ],
        interjections: [
          { who: 'tessa', if: 'comp:tessa', text: "That's the bell's song. Lio, that's a song with no origin — I'd stake my lute on it. It was in your head before the bell ever rang. Something's been humming it to this town for weeks." },
          { who: 'ilyra', text: "Look at them. Whatever that tune is, it's doing more good in here tonight than any prayer I know." },
        ],
        options: [
          { text: "Lio… that's the tune the bell played.", tone: 'curious', once: true, if: '!lio_q_night', next: 'l_night_tune' },
          { text: "(Sit a while and listen.)", tone: 'compassionate', next: 'l_night_listen' },
          { text: "Keep playing. Don't stop.", tone: 'leave', end: true },
        ],
      },
      l_night_tune: {
        speaker: 'lio',
        effects: ['set lio_q_night', 'set heard_bell_tune'],
        text: "Lio's fingers falter on the third note. The little girl stirs; he catches the tune again before she wakes. For a long moment he doesn't say anything. “I thought it was a lullaby,” he says at last, very quietly. He keeps playing anyway, slow and steady, watching the sleeping faces around the fire. “Maybe it's both.”",
        end: true,
      },
      l_night_listen: {
        speaker: 'dm',
        text: "You sit on the stair beside him for a while. The fire pops. Somebody snores. The tune goes round and round, four notes falling and climbing back up to fall again, and for the length of it the fog outside the windows seems a little further away. When you finally stand, your legs are stiff and your heart is lighter than it has any right to be.",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 9. The Grey Hawks
  {
    id: 'brawl',
    title: 'Trouble at the Lantern & Lamb',
    start: [
      { if: 'brawl_met', node: 'again' },
      { node: 'intro' },
    ],
    nodes: {
      intro: {
        speaker: 'dag',
        effects: ['quest sq_brawl start', 'set brawl_met'],
        text: "Dag Morrow sits with his boots on the table and a grey hawk feather bobbing in his cap, three empty jugs in front of him and a fourth in progress. Around him, half a dozen Grey Hawks lounge with their crossbows slung on the backs of their chairs. Lio stands frozen with his lute halfway to his chest. “No, no, the Bathwater, lad, the one with the actions,” Dag is saying, perfectly cheerful. “I'll do the actions. I'm very good at the actions.” Then he notices you, and his grin widens by exactly one scar. “Oh-ho. Hawks, look. A hero. You can always tell. They walk in like the floor owes them money.”",
        interjections: [
          { who: 'korr', text: "Six of them, one of me. These are good odds. For me." },
          { who: 'kael', text: "Crossbows on the chairs, not in their hands. They're not here to kill anyone. Doesn't mean they won't by accident." },
        ],
        options: BRAWL_OPTS,
      },
      again: {
        speaker: 'dag',
        text: "“Back again! Have you come to apologise or to sing?” Dag spreads his arms to the room. “Either way, I'm thrilled. Sit. Don't sit. Mind the lad, he bruises.”",
        options: BRAWL_OPTS,
      },
      hub: {
        speaker: 'dag',
        text: "Dag drums his fingers on the table. “Well? We haven't got all night.” He considers. “Actually, we have. That's the whole problem with peacetime.”",
        options: BRAWL_OPTS,
      },
      b_escalate: {
        speaker: 'dag',
        text: "Dag laughs — a big, warm, genuinely delighted laugh — and stands up. He is a great deal taller standing than seemed physically reasonable. “That,” he says, “was lovely. Truly. I'm touched.” He rolls his neck until it cracks. “Hawks? Furniture.” Every chair at the table scrapes back at once.",
        interjections: [
          { who: 'korr', text: "Finally." },
          { who: 'brakka', text: "Fists only. Nobody draws steel in a man's taproom. Hear me?" },
        ],
        options: [
          { text: "(Here we go.)", tone: 'aggressive', effects: ['combat enc_brawl'], end: true },
        ],
      },
      b_talked: {
        speaker: 'dag',
        text: "Dag looks at you for a long moment. Then, slowly, he takes his boots off the table. “Gods. You sound like my old sergeant. She was a bastard too.” He tosses a fat purse at Tobin, who catches it against his chest like a baby. “Lad. Play what you like. Sorry about the eye.” Then, quieter, just to you: “We're not bad lads. Just bored ones. Nine months since the last war and nobody's had the decency to start another.” He tips his head toward the window, toward the north and the black stump of the tower. “But I'll tell you something for free. My Hawks have been jumpy since we rode in. Horses won't settle. Felt like this the night before Greyford, and Greyford was a bad night.” He taps the crossbow on his chair. “If trouble comes tonight — real trouble — you'll find six of these at this table, and they'll be pointing the right way.”",
        interjections: [
          { who: 'orren', text: "He's right about the horses. Animals know before we do. Mark that." },
        ],
        end: true,
      },
      b_soldier: {
        speaker: 'dag',
        text: "Dag's eyebrows climb into his cap. “Lowland Foot? Hah! You poor sod. Were you at Marrow Bend? The river crossing, the one where the bridge was made of—” “—Cheese,” you both say at once, because everyone who was there calls it that, and Dag roars and slaps the table hard enough to make Lio jump. “Hawks! This one's been in the mud. Pay the man his tab.” A purse thumps onto the bar. Dag leans in, the laughter going out of his eyes. “Between us, old soldier — my horses won't settle. Felt like this the night before Greyford. If trouble comes tonight, you know where six crossbows are drinking. We'll be pointing them the right way.”",
        end: true,
      },
      b_intimidated: {
        speaker: 'dag',
        text: "Dag stares at you. You stare back. Somewhere a Hawk swallows audibly. Then Dag laughs, but it's shorter this time and it never reaches his eyes. “Right. Right. Know when the wind's changed.” He slaps coin onto the table — the whole tab, and a little over. “Hawks, saddle up. Town's turned sour.” They file out, crossbows over their shoulders. At the door Dag pauses, one hand on the frame. “Shame,” he says, not unkindly. “Had a feeling this place was going to need us tonight.” The door bangs. The crossbows go with him.",
        interjections: [
          { who: 'kael', text: "You know he meant that last bit, right? He wasn't threatening you. He was warning you." },
          { who: 'seris', text: "Order restored. Good." },
        ],
        end: true,
      },
      b_performed: {
        speaker: 'dm',
        text: "You climb onto a chair. You take a breath. You sing ‘The Bishop's Bathwater’ — all nine verses, with the actions, with actions they've never seen, with a key change nobody asked for. By the third verse half the Hawks are doing the soap bit. By the fifth, Dag is weeping with laughter and conducting with a chicken leg. By the last, the whole common room is roaring the chorus, Tobin included, and Lio is playing along with a grin so wide it must hurt his bruise. Dag pays the tab in one fistful. “Anyone who can make Corporal Wend do the Bishop's wiggle,” he gasps, “has my sword. And my crossbows. If anything comes for this town tonight, it'll have to get past six Hawks who now owe you a drink.”",
        interjections: [
          { who: 'nima', text: "AGAIN! Do the bit with the soap again!" },
          { who: 'tessa', text: "That key change was a crime. I've never been prouder of anyone." },
        ],
        end: true,
      },
      b_jeered: {
        speaker: 'dag',
        text: "You get one verse in before a walnut catches you on the ear. The Hawks drown you out with a chorus so filthy that Tobin makes the sign of the Lamp with a ladle. Dag wipes his eyes. “Oh, that was brave. That was dreadful, but it was brave.” He waves magnanimously. “Go on, then. What else have you got?”",
        next: 'hub',
      },
      b_bribed: {
        speaker: 'dag',
        text: "Dag's eyebrows climb. “Ten gold. For a stranger's tab.” He weighs the coins in his palm, then looks at you as though you're a puzzle he's quite enjoying. “Either you're very rich or very soft.” The coins go to Tobin. “Tell you what, soft. You've bought more than cider. Horses have been jumpy since we rode in, and I don't like it. If trouble comes tonight, you've bought yourself six crossbows. Lad — play something. Not the Bathwater.”",
        interjections: [
          { who: 'kael', text: "Paying a bully to stop bullying. That's how most of the world works, you know. Still tastes like copper." },
          { who: 'orren', text: "Cheapest peace you'll ever buy. I'd have done the same." },
        ],
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 10. Pell
  {
    id: 'pell',
    title: 'Pell',
    start: [
      { if: 'pell_safe && lira_fate=anchored', node: 'report_anchored' },
      { if: 'pell_safe && lira_fate=faded', node: 'report_faded' },
      { if: 'pell_safe && lira_fate=bottled', node: 'report_bottled' },
      { if: 'pell_safe', node: 'inn' },
      { if: 'pell_met', node: 'again' },
      { node: 'intro' },
    ],
    nodes: {
      intro: {
        speaker: 'pell',
        effects: ['quest sq_lira ask', 'set pell_met'],
        text: "A boy of about ten sits on the rim of the old well, heels drumming against the stones, a tin music box clutched in both hands like something that might try to escape. He looks up at you with the ferocity of someone who has been not-believed all day. “Have you seen my sister? Lira. She's seven. She's got a red kite and a gap here—” he jabs at his front teeth— “and she was standing right there yesterday. Right there.” He points to an empty patch of cobbles. “And now everyone says I'm making it up.”",
        interjections: [
          { who: 'ilyra', text: "Hello, Pell. That's a fine music box. Is it yours?" },
          { who: 'brakka', text: "Yesterday, he says. Right there. And nobody else remembers." },
        ],
        options: PELL_OPTS,
      },
      again: {
        speaker: 'pell',
        text: "Pell looks up from the well. Hope flares in his face, and then he reads yours. “You didn't find her.” Not a question. “You'd have said.” He scrubs his nose with the back of his wrist. “Well, don't stand there. Ask me things. Nobody asks me things. They just pat my head.”",
        options: PELL_OPTS,
      },
      hub: {
        speaker: 'pell',
        text: "“What?” He hugs the music box. “Ask, then. I'm not going anywhere. Not till she comes back.”",
        options: PELL_OPTS,
      },
      p_believe: {
        speaker: 'pell',
        effects: ['set pell_believed'],
        text: "Pell stares at you. “You're just saying that.” He waits for you to take it back. You don't. “Nobody's said that. Not even Mam. Mam says—” His chin wobbles and he grits his teeth until it stops. “Mam says I've always been her only. She says it nicely. That's worse.”",
        next: 'hub',
      },
      p_insight_ok: {
        speaker: 'dm',
        text: "He isn't lying — not even the way children lie, to themselves. There's no performance in it, no glance to check that you're impressed. He remembers his sister the way you remember your own front door. And there's something else, harder to name: the small, haunted wrongness of someone who keeps reaching for a hand that isn't there, and keeps being surprised.",
        next: 'hub',
      },
      p_insight_fail: {
        speaker: 'pell',
        text: "You can't read him. A lonely boy with an imaginary friend? A grieving one? He catches you looking, and his face shuts like a shop at closing. “You think I'm mad too.” He hugs the box tighter. “Fine. Lira would've kicked you. She kicks hard. She's little but she's got pointy boots.”",
        next: 'hub',
      },
      p_box: {
        speaker: 'pell',
        effects: ['set pell_q_box'],
        text: "He opens the lid. A thin tin melody spills out — a lullaby, slow and a little lopsided, in a key that makes the back of your neck prickle. “It's hers. Well. It's ours. She winds it and I hold it, that's the rule.” He listens with his whole face. “Mam sang this to us. Every night.” Pause. “Mam says she doesn't know it. Says she's never heard it in her life.” He closes the lid very gently, as if it might bruise. “But she hums it when she's kneading. She doesn't know she does.”",
        interjections: [
          { who: 'ilyra', text: "Pell. I came to this festival to light a lantern for someone I can't name. I don't know who they are. I only know there's a shape in my life where they ought to be. You're not mad. You're just the only one who still remembers the shape." },
          { who: 'tessa', text: "I know a thousand lullabies. I don't know that one. And that bothers me more than I'd like." },
        ],
        next: 'hub',
      },
      p_coin: {
        speaker: 'pell',
        text: "He looks at the coin for a long time, as if suspecting a trick. “I'll buy her a honey-cake. For when she comes back.” He tucks it carefully into his sock. “She likes the burnt bits. I give her mine. Don't tell her, she thinks I don't like them.”",
        next: 'hub',
      },
      p_dismiss: {
        speaker: 'pell',
        text: "Pell's face shuts like a door. “Fine.” He turns back to the well and stares down into it. “When she comes back I'm not telling her you said that,” he says to the water. “She'd be upset. She's soft.” A sniff, swallowed. “I'm not.”",
        end: true,
      },
      p_bye: {
        speaker: 'pell',
        text: "“Red kite!” he shouts after you. “Gap in her teeth! Pointy boots!” And then, quieter, so you almost don't hear it: “She sings when she's scared.”",
        end: true,
      },
      // ── at the inn, after the well
      inn: {
        speaker: 'pell',
        text: "Pell sits by the fire wrapped in a blanket big enough for three, the music box in his lap. He's on his feet the instant he sees you. “You have to go under the cathedral. She's there. I heard her. She was singing our song, and she sounded—” His voice cracks clean in half. He waits until it mends. “She sounded like she couldn't hear herself.”",
        interjections: [
          { who: 'ilyra', text: "We're going, Pell. Drink your milk. Let someone look after you for an hour." },
          { who: 'korr', text: "Little warrior. You stood your ground in the fog. We will go where you point." },
        ],
        options: [
          { text: "I'll find her, Pell. I promise.", tone: 'compassionate', tags: ['mercy', 'protect'], next: 'p_promise' },
          { text: "What exactly did you hear?", tone: 'curious', once: true, if: '!pell_q_heard', next: 'p_heard' },
          { text: "Stay here by the fire. That's your job now.", tone: 'leave', end: true },
        ],
      },
      p_heard: {
        speaker: 'pell',
        effects: ['set pell_q_heard'],
        text: "“The bottom part. Of the song.” He holds up the box. “Mam sings the top bit and Lira sings the bottom bit and I just hum because I'm no good at either. And I heard the bottom bit coming up out of the well, all echoey, like down a long pipe. From that way.” He points north, toward the cathedral. “Deep down. Deeper than cellars.” He grips your sleeve. “She's not dead. Dead people don't sing.”",
        next: 'inn',
      },
      p_promise: {
        speaker: 'pell',
        text: "He nods once, very hard, as though nodding hard enough makes it binding. “Bring the box back if— no. Bring her back.” He sits down. He doesn't let go of the music box. “I'll wait. I'm good at waiting. I've been doing it all day.”",
        end: true,
      },
      // ── report: anchored
      report_anchored: {
        speaker: 'dm',
        text: "There is a little girl sitting next to Pell by the fire. She has a gap in her front teeth and grey-green eyes and scabs on both knees, and she is eating a honey-cake from the burnt end inward, and she is entirely, unremarkably real. Around the common room, people keep glancing at her and frowning, the way you frown at a familiar word that suddenly looks misspelt. Whose is she? Was she always—? Pell is not frowning. Pell is sitting so close to her that their elbows have practically fused. When he sees you, he doesn't run over. He doesn't let go of her sleeve. He just looks at you over the top of her head with an expression much too old for his face.",
        next: 'ra_pell',
      },
      ra_pell: {
        speaker: 'pell',
        text: "“I knew,” he says. “I told everybody. I knew.”",
        interjections: [
          { who: 'ilyra', text: "Oh. Oh, look at them." },
          { who: 'nima', text: "We did that. We actually did that. I'm going to cry and set something on fire, in that order." },
        ],
        options: [
          { text: "You did, Pell. You never stopped. She's home.", tone: 'compassionate', tags: ['mercy'], effects: ['complete sq_lira anchored'], next: 'ra_lira' },
        ],
      },
      ra_lira: {
        speaker: 'lira',
        text: "Lira looks up at you, crumbs on her chin. “I know you. You were in the dark place. You had a light.” She considers you seriously. “You've got a sad face. Is it because of the lady?” Before you can ask what lady, Pell elbows her, and she elbows him back harder, and he says ‘ow’ and she says ‘baby,’ and it is the most ordinary thing in the world, and it is a miracle, and nobody in the room but you and Pell knows it.",
        next: 'ra_end',
      },
      ra_end: {
        speaker: 'dm',
        text: [
          { if: 'knows_anchor_cost', text: "You think of the weight the anchor needed. Of a grief, somewhere in Hollowmere, poured out to hold this child here. Through the inn window, the fog drifts past the north road, and for a moment you think of a tired woman with ink-stained fingers who keeps lists of names. You don't know. You may never know. Lira steals the last of Pell's honey-cake, and he lets her." },
          { text: "Through the inn window the fog drifts past, quieter now. Somewhere out there, you remember, something gave a little to make room for her: a weight shifted, a grief went still. You don't know whose. Lira steals the last of Pell's honey-cake, and he lets her." },
        ],
        end: true,
      },
      // ── report: faded
      report_faded: {
        speaker: 'pell',
        text: "Pell is sitting by the fire. He knows before you say anything. You can see him know it, the way a child knows a door has closed by the change in the draught. “She's gone,” he says. It isn't a question.",
        interjections: [
          { who: 'ilyra', text: "Sit with him. Don't explain yet. Just sit." },
        ],
        options: [
          { text: "(Give him the music box.) She wanted you to have this.", tone: 'compassionate', tags: ['mercy'], if: 'item:lira_music_box', effects: ['take lira_music_box', 'complete sq_lira faded'], next: 'rf_box' },
          { text: "She went peacefully, Pell. She wasn't afraid.", tone: 'compassionate', tags: ['honesty'], if: '!item:lira_music_box', effects: ['complete sq_lira faded'], next: 'rf_nobox' },
        ],
      },
      rf_box: {
        speaker: 'dm',
        text: "He turns the music box over in his hands. On its base, scratched with a nail in letters that lean like tired fence posts: LIRA. The R is backwards. “She always does the R backwards,” Pell says. “I told her and told her.” He winds it. He's never wound it, you realise — that was always her job. She winds and he holds. That was the rule. The lullaby plays, thin and lopsided, and Pell holds it, and when it slows he winds it again, and holds it.",
        next: 'rf_sang',
      },
      rf_nobox: {
        speaker: 'dm',
        text: "He takes it the way small, fierce people take things: all at once, with his jaw set, staring very hard at the fire so nothing can get out. His own tin box is in his lap. He opens the lid. It plays, thin and lopsided, and he listens to the bottom part of the song, the part that was hers, and hums it — badly, the way he always has.",
        next: 'rf_sang',
      },
      rf_sang: {
        speaker: 'pell',
        text: [
          { if: 'lira_sang', text: "“Did she sing?” he asks. “At the end?” You tell him yes. You tell him she sang the whole thing, all the way to the last note, and that you sang the top part with her, and that she wasn't frightened at all. Pell listens without blinking. “Good,” he says. “She sings when she's scared. But she sings louder when she's happy.”" },
          { text: "“Did she sing?” he asks. “At the end?” You tell him she did. You tell him she sang herself to sleep, and that she wasn't frightened, and that you stayed with her until the last note. Pell listens without blinking. “Good,” he says. “She sings when she's scared. So if she was singing, she knew she wasn't on her own.”" },
        ],
        next: 'rf_end',
      },
      rf_end: {
        speaker: 'pell',
        text: "He leans against your arm, very briefly, as if by accident. Then he straightens up. “I'm going to remember her. All of her. Every day. The kite and the boots and the R.” He holds the music box against his chest. “Somebody has to.”",
        interjections: [
          { who: 'tessa', text: "Remember carefully, Pell. Stories keep people alive. I'd know." },
          { who: 'orren', text: "He will, too. Some people are made for keeping things." },
        ],
        end: true,
      },
      // ── report: bottled
      report_bottled: {
        speaker: 'dm',
        text: "You've barely sat down when Pell sees it: the vial at your belt, and the small grey shape inside it, palms pressed to the glass. He goes white. He reaches out — stops — reaches again, and lays one fingertip on the glass, over her hand. Inside, very faintly, the little shape tilts her head.",
        next: 'rb_pell',
      },
      rb_pell: {
        speaker: 'pell',
        text: "“Lira?” Barely a breath. Then, with terrible practicality: “Can she breathe in there? Is she cold? She hates being shut in. She won't even go in the wardrobe.”",
        interjections: [
          { who: 'vaelis', text: "She's preserved, boy. Not dying, not fading. That's not nothing. Most of history doesn't even get that much." },
          { who: 'seris', text: "…" },
          { who: 'varek', text: "She's safe from the world. That's more than the world ever offered her." },
        ],
        options: [
          { text: "She doesn't need to breathe. Nothing can unmake her now. She's safe.", tone: 'compassionate', tags: ['honesty'], effects: ['complete sq_lira bottled'], next: 'rb_end' },
          { text: "I'll find a way to bring her all the way back. I swear it.", tone: 'friendly', tags: ['boldness'], effects: ['complete sq_lira bottled', 'set swore_to_pell'], next: 'rb_end' },
        ],
      },
      rb_end: {
        speaker: 'pell',
        text: "Pell keeps his finger on the glass a long time. “Can I—” He stops. Swallows. “No. You keep her. You're going places. She always wanted to go places. She wanted to go to the sea.” He takes his hand away. It leaves a small warm print on the outside of the glass that fades, slowly — and for a moment, on the inside too. “Lira,” he tells the vial, with tremendous seriousness, “behave.”",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 11. Pell's house (Hanne)
  {
    id: 'pell_house',
    title: "Pell's House",
    start: [
      { if: 'bell_rang && pell_safe', node: 'night_safe' },
      { if: 'bell_rang', node: 'night_lost' },
      { if: 'hanne_met', node: 'again' },
      { node: 'day' },
    ],
    nodes: {
      day: {
        speaker: 'dm',
        effects: ['set hanne_met'],
        text: "A narrow house with a blue door and a window box of tired marigolds. The woman who answers your knock has flour to the elbows and the bruised look under the eyes of somebody who hasn't slept properly in a week. “If it's about Pell, I'm sorry, whatever he's done.” She tries a smile; it nearly works. “Hanne. His mam. He's not a bad boy. He's just got it into his head that he has a sister. Lira. He's told the whole town. He tells me every morning, and every morning I have to tell him again, and every morning he looks at me like I've—” She stops. “I've only ever had the one. I'd remember. Wouldn't I? A mother would remember.”",
        interjections: [
          { who: 'ilyra', text: "Of course you would. That's what makes it so frightening, isn't it?" },
        ],
        options: HANNE_OPTS,
      },
      again: {
        speaker: 'dm',
        text: "Hanne opens the door with a dishcloth over her shoulder. “Oh — you again. Is he all right? He's at the well, isn't he. He's always at the well.”",
        options: HANNE_OPTS,
      },
      hub: {
        speaker: 'dm',
        text: "Hanne glances back toward the stove, where something is just on the edge of burning. “Was there something else?”",
        options: HANNE_OPTS,
      },
      h_beds: {
        speaker: 'dm',
        text: "Past her shoulder: one room, a hearth, a loft ladder. Up in the loft, through the gap in the boards, you can see two small beds tucked under the eaves, side by side. One has a patched blanket and a wooden horse. The other is made up neat as a pin, as if no one has ever slept in it — and on its pillow lies a scrap of red cloth. The tail of a kite. Hanne follows your gaze. “Oh — that's the spare. For visitors.” She frowns. “We never have visitors.” Her voice slows. “I make that bed every week. I don't know why I make it.”",
        interjections: [
          { who: 'kael', text: "Two beds, one kid, and a kite-tail on the empty pillow. You don't need to be a detective. You just need to not look away." },
        ],
        next: 'hub',
      },
      h_look_fail: {
        speaker: 'dm',
        text: "You crane a little too obviously. Hanne shifts the door half-closed against her hip — polite, and firm. “It's not much to look at, and I've not swept.” The warmth in her voice has dropped a degree. She's still standing there, though. Still waiting to see if you're going to say anything about her son.",
        next: 'hub',
      },
      h_bowls: {
        speaker: 'dm',
        text: "She opens her mouth to say yes. It doesn't come out. “I set four bowls,” she says instead, so quietly you nearly miss it. “At supper. Tam, me, Pell — three. Only sometimes I set four, and I stand there looking at the fourth bowl like it's about to tell me something.” Her hand has found her apron pocket and is turning something over and over: a child's wooden comb, small, three teeth missing. “Pell says this is Lira's. I found it in the wash. I can't throw it out.” Her knuckles whiten. “I've tried.”",
        interjections: [
          { who: 'brakka', text: "Keep the comb, Hanne. Whatever anyone tells you. Keep it." },
        ],
        next: 'hub',
      },
      h_read_fail: {
        speaker: 'dm',
        text: "She meets your eyes steadily and you see only what she means you to see: a tired mother, a little embarrassed, a little defensive. “I'm sure,” she says. “I'm his mam. I'm sure.” A pause, sharper. “And I'd thank you not to encourage him. He's hurting enough without strangers telling him he's right.”",
        next: 'hub',
      },
      h_wrong: {
        speaker: 'dm',
        effects: ['set hanne_q_wrong'],
        text: "Hanne wraps her floury arms around herself. “Don't. Please. Don't put that in my head.” Her eyes are bright. “If he's right, then I've forgotten my own—” She can't finish it. She takes a breath, and another. “Just bring him home before the lanterns go out, if you see him. That's all I'm asking. Bring him home.”",
        next: 'hub',
      },
      night_lost: {
        speaker: 'dm',
        text: "The blue door bangs open before you reach it. Hanne, barefoot on the wet cobbles, a lantern in her fist, hair coming down. “Pell. Have you seen Pell? He was in bed, he was in bed, and then the bell, and the fog, and his bed was empty and the window was open—” She has your sleeve in a grip like a vice. “The well. He always goes to the old well. He says it's where he last saw her. Please. I can't go out there, they took Jem Orley right off his own doorstep, I watched it happen—”",
        interjections: [
          { who: 'brakka', text: "We'll find him. Bar the door, and don't open it for anyone who doesn't knock twice and say your name." },
          { who: 'orren', text: "The well's south-west of the square. If he's there, the fog will have found him first. Let's not waste breath." },
        ],
        options: [
          { text: "Go inside and bar the door. I'll bring him back.", tone: 'friendly', tags: ['protect'], next: 'h_night_go' },
          { text: "(Take her hands.) Hanne. Look at me. We're going to get him.", tone: 'compassionate', tags: ['mercy'], next: 'h_night_comfort' },
        ],
      },
      h_night_go: {
        speaker: 'dm',
        text: "She nods, jerkily, and backs inside. You hear the bar thud down. Then, muffled through the wood: “He'll be singing. If he's frightened. He'll be singing.”",
        end: true,
      },
      h_night_comfort: {
        speaker: 'dm',
        text: "Her hands are freezing. For a moment she just holds on, shaking. Then she breathes, once, all the way down. “All right,” she says. “All right.” She lets go. “The old well. Past the square, by the Wick yard. Go. Go.” The door closes and the bar drops. Through the wood, faint and wavering, you hear her start to hum — a lopsided lullaby she has told the whole town she's never heard.",
        end: true,
      },
      night_safe: {
        speaker: 'dm',
        text: "Hanne opens the door with a coat thrown over her nightdress, already halfway out. “They told me. He's at the Lamb — he's safe, Tobin's got him by the fire. I'm going now, I just—” She stops on the step. “I just had to bank the fire. Isn't that stupid? The world's ending and I'm banking the fire.” She takes your hand in both of hers. “Thank you. Thank you.” Then, puzzled, glancing back into the dark kitchen: “I put four cups out. For when we get home. I don't know why I did that.”",
        options: [
          { text: "Go to him, Hanne.", tone: 'leave', end: true },
        ],
      },
    },
  },

  // ════════════════════════════════════════════════════════ 12. Watch house
  {
    id: 'watch_house',
    title: 'The Watch House',
    start: [
      { if: 'bell_rang', node: 'night' },
      { node: 'day' },
    ],
    nodes: {
      day: {
        speaker: 'dm',
        text: "The watch house door stands open to let the heat out. Inside, under a rack of halberds nobody has polished since spring, a broad off-duty watchman named Osk is playing dice against himself and losing. “Evening,” he says, without looking up. “Reporting a crime? Captain's in the square. Reporting a pie? Mayor's in the square. Want a game? Two gold a throw, double if you beat me.” He scoops up the dice. “I'm due a loss, and I'd rather it went to someone with a face.”",
        interjections: [
          { who: 'kael', text: "Watch his left hand. He's been palming a six since we walked in. Against himself. That's commitment." },
        ],
        options: [
          {
            text: "One throw. (2 gold)", tone: 'friendly', if: 'gold>=2 && !dice_played',
            check: { skill: 'sleightOfHand', dc: 13, advIf: 'bg:criminal || comp:kael' },
            successEffects: ['gold 4', 'set dice_played'], success: 'w_win',
            failureEffects: ['gold -2', 'set dice_played'], failure: 'w_lose',
          },
          { text: "Quiet night?", tone: 'curious', once: true, if: '!watch_q_quiet', next: 'w_quiet' },
          { text: "Enjoy your evening, Osk.", tone: 'leave', end: true },
        ],
      },
      hub: {
        speaker: 'dm',
        text: "Osk rattles the dice in a tin cup, idly. “Anything else?”",
        options: [
          { text: "Quiet night?", tone: 'curious', once: true, if: '!watch_q_quiet', next: 'w_quiet' },
          { text: "Enjoy your evening, Osk.", tone: 'leave', end: true },
        ],
      },
      w_win: {
        speaker: 'dm',
        text: "The dice skitter across the table, bounce off the halberd rack, and come to rest showing two sixes. Osk stares at them. Then at you. Then at his own left hand, which is still holding the six he'd palmed. “Well,” he says, with great dignity, counting coins into your palm, “that's the Lights telling me something about honesty, and I don't care for it.”",
        next: 'hub',
      },
      w_lose: {
        speaker: 'dm',
        text: "You throw a two and a one, which is the dice equivalent of falling down the stairs. Osk throws a suspiciously confident pair of sixes and scoops your coins with the tenderness of a man reunited with old friends. “Better luck next festival,” he says. “Or don't come back. Either way, I'm up.”",
        next: 'hub',
      },
      w_quiet: {
        speaker: 'dm',
        effects: ['set watch_q_quiet'],
        text: "“Festival nights always are. Everyone's too happy to steal.” He considers. “Except the Hawks, drinking on tick at the Lamb. And that scholar, out every night with a shovel — the Captain says leave him be, he's got papers. Papers!” Osk snorts. “I've got papers. Doesn't mean I can go digging up a churchyard.” He rolls the dice. Snake eyes. He re-rolls without comment.",
        next: 'hub',
      },
      night: {
        speaker: 'dm',
        text: [
          { if: 'met_hale', text: "The watch house is lit end to end and full of shouting. The armoury door hangs open; townsfolk who plainly don't know which end of a spear goes forward are being handed spears anyway. Osk, in a breastplate buckled on backwards, spots you and waves you over. “You're the one the Captain's sent out into it. Here — wait. Before you go.”" },
          { text: "The watch house is lit end to end and full of shouting. The armoury door hangs open; townsfolk who plainly don't know which end of a spear goes forward are being handed spears anyway. Osk, in a breastplate buckled on backwards, holds up a hand. “Not you. Not yet. Captain's in the square, by the Tree. See him before you go anywhere near that fog. He'll want to know who's out there.”" },
        ],
        interjections: [
          { who: 'seris', text: "Spear butt down, sir. Point up. — Yes. Thank you. Now you won't stab the man behind you." },
          { who: 'korr', text: "Farmers with spears. They're terrified, and they're here anyway. That's worth more than the spears." },
        ],
        options: [
          { text: "Anything you can spare for the people out there?", tone: 'pragmatic', if: 'met_hale && !watch_potions', effects: ['set watch_potions', 'give healing_potion 2'], next: 'w_potions' },
          { text: "Anything you can spare for the people out there?", tone: 'pragmatic', if: '!met_hale', next: 'w_nohale' },
          { text: "Your breastplate's on backwards.", tone: 'sarcastic', once: true, if: '!watch_q_armour', next: 'w_armour' },
          { text: "Hold the line, Osk.", tone: 'leave', end: true },
        ],
      },
      w_nohale: {
        speaker: 'dm',
        text: "Osk shakes his head, not unkindly. “Not without the Captain's say-so. Every potion in that armoury's spoken for twice over. See Hale in the square — he'll want to know who's going out into it, and then I'll find you something.”",
        next: 'night_hub',
      },
      w_potions: {
        speaker: 'dm',
        text: "Osk ducks into the armoury and comes back with two stoppered vials, red and faintly warm. “Captain's private stock. He said if anyone was going out into that, they'd get these, and if anyone asked, he'd broken them by accident.” He pushes them into your hands. “Bring people back. Bring yourself back, too. I'm owed a rematch.”",
        options: [
          { text: "Thank you.", tone: 'leave', end: true },
        ],
      },
      w_armour: {
        speaker: 'dm',
        effects: ['set watch_q_armour'],
        text: "Osk looks down. Looks up. “…I know,” he says, with enormous dignity. “It's so I can see what's behind me.” He makes no move to fix it. His hands are shaking too badly for buckles, and both of you know it.",
        next: 'night_hub',
      },
      night_hub: {
        speaker: 'dm',
        text: "Behind Osk someone drops a halberd with a clang that makes the whole room flinch.",
        options: [
          { text: "Anything you can spare for the people out there?", tone: 'pragmatic', if: 'met_hale && !watch_potions', effects: ['set watch_potions', 'give healing_potion 2'], next: 'w_potions' },
          { text: "Anything you can spare for the people out there?", tone: 'pragmatic', if: '!met_hale', next: 'w_nohale' },
          { text: "Hold the line, Osk.", tone: 'leave', end: true },
        ],
      },
    },
  },

  // ════════════════════════════════════════════════════════ 13. Abel Thorn (night)
  {
    id: 'abel',
    title: 'Abel Thorn',
    start: [
      { if: 'hawks_help', node: 'hawks' },
      { if: 'abel_asked', node: 'again' },
      { node: 'intro' },
    ],
    nodes: {
      hawks: {
        speaker: 'dm',
        effects: ['set mill_resolved', 'set mill_saved', 'add rescued_count 1', 'xp 50'],
        text: "Crossbow bolts are still smoking in the mud by the mill-race — actually smoking, where they struck things that weren't entirely there. Abel Thorn is on his knees by the great wheel with his arms around a woman and two children, all four of them floury and soaked and shaking, all four of them alive. Leaning against the mill wall, reloading with the bored efficiency of long practice, is Dag Morrow.",
        next: 'hawks_dag',
      },
      hawks_dag: {
        speaker: 'dag',
        text: "“Evening, hero. Told you. Six crossbows, pointing the right way.” He jerks his chin at the fog. “Three of 'em. Dog-shaped. Turns out they don't like bolts much — bit of a surprise for everybody.” He spits. “Little one upstairs was screaming fit to wake the dead. Which, tonight, might've been a poor choice of noise.” Then, more quietly, not looking at the family: “Had a sister once. About that size.” He slings the crossbow. “Anyway. Hawks'll hold the east road. You go and do whatever it is heroes do.”",
        interjections: [
          { who: 'brakka', text: "A wall is only worth what it keeps safe. That one kept four. I'd stand a shift beside him." },
          { who: 'korr', text: "That man did a deed worth singing tonight. Remind me to sing it, sellsword. You won't like how loud I am." },
        ],
        next: 'hawks_abel',
      },
      hawks_abel: {
        speaker: 'abel',
        text: "Abel grips your hand in his huge, floury one and doesn't seem able to let go of it. “Tobin said. He said you'd squared the Hawks. That they'd come because of you.” His voice breaks. “Anything. Anything you need. Ever. Flour for life. Bread for life. My firstborn — no, Bett's glaring — my second-born.” Bett, from the mud, laughs through her tears. “Ignore him. Thank you.”",
        end: true,
      },
      intro: {
        speaker: 'abel',
        text: "A huge man in a flour-white apron comes stumbling out of the fog toward you with his arms wide, as if he means to catch you by the coat and haul you back the way he came. “Help! Please — please — my family, they're in the mill, upstairs — Bett and the little ones — there's things circling, dogs, they're not dogs, they've got lantern eyes and they make no sound when they walk—” He's gasping, nearly sobbing. “I went for the watch. I left them. I left them there to get help. Gods, tell me I didn't leave them—”",
        interjections: [
          { who: 'orren', text: "Lantern eyes and silent feet. They're not hunting by scent — or not only. Watch how they move, not where they are." },
          { who: 'brakka', text: "Breathe, miller. You went for help. That's what a wall does when it can't hold alone. Now show us where." },
        ],
        options: ABEL_OPTS,
      },
      again: {
        speaker: 'abel',
        text: "Abel is still standing where you left him, wringing his apron into a rope. “Please — they're still in there, I can hear the little one crying — please—”",
        options: ABEL_OPTS,
      },
      hub: {
        speaker: 'abel',
        text: "He looks from you to the mill and back, every second visibly costing him. “Please. What do we do?”",
        options: ABEL_OPTS,
      },
      a_details: {
        speaker: 'abel',
        effects: ['set abel_q_details'],
        text: "He forces himself to slow down. “Three of them. Big as wolfhounds. They came out of the fog by the race and just — circled. Round and round the mill. They didn't try the door. They didn't howl. They just waited.” He shudders. “Bett's got the kids up in the loft with the ladder pulled up. There's a back hatch on the race side, over the water. And there's smoked pork in the larder — and forty sacks of flour, for all the good that does anyone.”",
        next: 'hub',
      },
      a_handle: {
        speaker: 'abel',
        text: "“Bless you — bless you, bless you.” He grips your arm, then lets go as if remembering you need it. “Go — go!” He points east, toward the black bulk of the mill and the slow turn of its wheel in the fog.",
        end: true,
      },
      a_refuse: {
        speaker: 'abel',
        text: "He stares at you as though you've struck him. Then his face crumples and hardens in the same moment. “Then I'll go back myself,” he says, and turns toward the fog, and stops, because his legs won't carry him into it. He stands there, a huge man shaking like a leaf, staring at the mill. He'll still be standing there if you change your mind.",
        end: true,
      },
      a_sneak_ok: {
        speaker: 'dm',
        text: "You go round by the mill-race, ankle-deep in black water, so slow and quiet it hurts. The hounds are circling the front door, patient as tax collectors. Up the slick timbers, through the back hatch, and there they are: Bett Thorn with a carving knife in one hand and a toddler in the other arm, and a boy of six beside her holding a rolling pin like a mace. It takes one long, breathless minute to get them down the back ladder and across the race. Behind you, a hound lifts its head and sniffs at the place where you just were. Then it goes back to watching the door.",
        next: 'a_reunion',
      },
      a_sneak_fail: {
        speaker: 'dm',
        text: "Halfway up the back timbers, a rung snaps with a crack like a broken bone. Three lantern-eyed heads turn as one. The hounds don't bark. They don't growl. They simply start running toward you, silently, across the mud.",
        options: [
          { text: "(Fight!)", tone: 'aggressive', effects: ['combat enc_mill'], end: true },
        ],
      },
      a_lure_ok: {
        speaker: 'dm',
        text: "You take the smoked pork and swing wide through the fog, upwind, letting the smell go before you, whistling low the way a huntsman calls his pack. One by one the lantern eyes turn — and follow — loping after you toward the river like dogs anywhere, stupid with hunger. You fling the meat into the shallows and double back fast. By the time the hounds lose interest, Bett and the children are down the ladder, across the race, and in Abel's arms.",
        next: 'a_reunion',
      },
      a_lure_fail: {
        speaker: 'dm',
        text: "The hounds don't even glance at the meat. They glance at you. Whatever these things hunger for, it isn't smoked pork — and the way they're looking at you now, it might be something closer to warm.",
        options: [
          { text: "(Fight!)", tone: 'aggressive', effects: ['combat enc_mill'], end: true },
        ],
      },
      a_flour_ok: {
        speaker: 'dm',
        text: "You split a sack upwind of the mill and let the night breeze take it. A white cloud rolls over the yard, thick as the fog itself, and the hounds stop dead, heads swinging, suddenly blind to whatever it is they were following. They whine — the first sound they've made — and slink away from the choking white. You go in through the cloud, flour in your teeth and eyes, and come out with Bett and two coughing, floury, furious children.",
        next: 'a_reunion',
      },
      a_flour_fail: {
        speaker: 'dm',
        text: "The wind turns at precisely the wrong moment. The cloud of flour rolls back over you instead, and you come out of it coughing and white as a ghost — which, it turns out, is exactly what the hounds find interesting. They turn toward you, silent, lantern eyes narrowing.",
        options: [
          { text: "(Fight!)", tone: 'aggressive', effects: ['combat enc_mill'], end: true },
        ],
      },
      a_reunion: {
        speaker: 'abel',
        text: "Abel makes a sound you'll remember for a long time — not a word, just a sound — and goes down on his knees in the mud with his whole family in his arms. Over his wife's shoulder he looks up at you, tears cutting clean lines through the flour on his face. “I'll never—” he tries. “I can't ever—” He gives up on words entirely. The little boy, still clutching his rolling pin, says solemnly: “I was going to hit them.”",
        interjections: [
          { who: 'brakka', text: "You'd have done it too, lad. I could see it in you. Now go and keep your mam warm." },
          { who: 'ilyra', text: "Get them to the Lamb, Abel. Tobin will have soup. Go on." },
        ],
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 14. After the mill fight
  {
    id: 'mill_rescue',
    title: 'The Mill',
    start: 'rescue',
    nodes: {
      rescue: {
        speaker: 'dm',
        effects: ['set mill_resolved', 'set mill_saved', 'add rescued_count 1', 'rep hollowmere 5'],
        text: "The last hound comes apart like smoke in a draught, and the yard is suddenly, ringingly quiet but for the creak of the wheel. The mill door bangs open and Abel goes through it like a bull through a hedge. A moment later he's back with his whole family bundled against him: Bett, white-faced and furious, with a carving knife she hasn't put down; a boy of six with a rolling pin; and a toddler wrapped in a flour sack, who has stopped screaming and is now merely very, very offended.",
        interjections: [
          { who: 'brakka', text: "Four. All four of them. Good work. That's what we're for." },
          { who: 'orren', text: "The fog's thinner here now. They were holding it close around the mill. Interesting." },
        ],
        next: 'reward',
      },
      reward: {
        speaker: 'abel',
        text: "“I can't — there's no—” Abel gives up on words and digs in his apron, coming up with a heavy purse. “Fifteen gold. It's the flour money for the winter. Take it. Don't argue. Bett'll hit me if you argue.” Behind him Bett, still holding the knife, says: “I will.”",
        options: [
          { text: "Thank you, Abel. Get them somewhere warm.", tone: 'friendly', effects: ['gold 15'], next: 'bye' },
          { text: "Keep it. You'll need it more than I will this winter.", tone: 'compassionate', tags: ['charity'], effects: ['gold 15'], next: 'refuse' },
        ],
      },
      bye: {
        speaker: 'abel',
        text: "He presses the purse into your hand and closes your fingers over it with his own. “Bread for life,” he says. “Whenever you come through Hollowmere. For the rest of my life.” Then he picks up both children at once, as easily as sacks of flour, and carries his family toward the lights of the Lamb.",
        end: true,
      },
      refuse: {
        speaker: 'dm',
        text: "Abel nods solemnly, appears to put the purse away, and claps you on the back hard enough to rattle your teeth. It is only much later, digging in your pack for something else entirely, that you find fifteen gold coins tucked inside, wrapped in a twist of paper. On it, in a child's careful letters: THANK YOU FOR THE DOGS.",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 15. The Other Ysolde
  {
    id: 'shop_echo',
    title: 'The Other Ysolde',
    start: [
      { if: 'echo_hostile', node: 'hostile' },
      { if: 'echo_met', node: 'again' },
      { node: 'intro' },
    ],
    nodes: {
      intro: {
        speaker: 'ysolde_echo',
        effects: ['set echo_met'],
        text: "The door of Quill's Sundries is shut, and in front of it stands Ysolde Quill — or a woman wearing her face like an old coat. Grey, translucent, river-weed tangled in her hair, water running from her hem and vanishing before it reaches the cobbles. Through the shop window behind her you glimpse the real Ysolde, pressed into a corner among the brooms, very pale. The grey woman's voice is Ysolde's, sanded down to the grain. “We're closed. Closed to thieves. Closed to the friends of thieves.” Her drowned eyes find you. “Are you one of hers? Did she send you to finish taking it?”",
        interjections: [
          { who: 'varek', text: "Careful. She isn't a ghost — ghosts are of the dead. She's a might-have-been. They're always angrier." },
          { who: 'kael', text: "That's not hate in her face. That's a debt collector's face. Someone who's been on the wrong side of the desk." },
        ],
        options: ECHO_RESOLVE_OPTS,
      },
      again: {
        speaker: 'ysolde_echo',
        text: "“Still here?” Water patters from her fingertips. Inside the shop, the real Ysolde hasn't moved. “I've been standing at this door for a long time. I can stand longer than you.”",
        options: ECHO_RESOLVE_OPTS,
      },
      hub: {
        speaker: 'ysolde_echo',
        text: "She waits, arms folded, river-water running off her sleeves. “Well? Say your piece and go.”",
        options: ECHO_RESOLVE_OPTS,
      },
      e_understand: {
        speaker: 'dm',
        text: "You look past the water and the weed and the fury, and you see it: a woman who made one different choice. A Solmara lender's letter, sealed and sent. The shop sold to settle the debt. The years after — rented rooms, a cousin's grudging charity, a ledger kept immaculately for a business that no longer existed. And one cold spring morning, the river. She isn't a monster. She's the Ysolde Quill who lost, come back to the one place she still recognises, to find someone else living in her life.",
        next: 'e_understand2',
      },
      e_understand2: {
        speaker: 'ysolde_echo',
        text: "As if she felt you see it, the echo's voice drops. “I kept the ledger so well,” she says. “Every penny. Every single penny.” A breath that bubbles. “It didn't matter.”",
        interjections: [
          { who: 'ilyra', text: "I've sat with people like her. Not echoes — just people who believe they've been robbed of a life. You don't argue with the grief. You honour it, and then you show them the door gently." },
        ],
        next: 'hub',
      },
      e_insight_fail: {
        speaker: 'dm',
        text: "You look too hard, and the echo's grief turns and looks back. Cold river water floods your throat, your lungs — a cramping, thrashing, drowning panic that isn't yours, that is suddenly entirely yours. You stagger, gasping. She laughs, a horrible wet sound. “Feel it? That's what she owes me.”",
        next: 'hub',
      },
      e_fail: {
        speaker: 'ysolde_echo',
        text: "She shrieks — Ysolde's voice and the river's voice together — and the windows of the shop frost over from the inside. “LIARS. Both of you. All of you.” Behind her, in the fog, shapes peel away from the walls: grey and slow and reaching.",
        options: [
          { text: "(Draw your weapon.)", tone: 'aggressive', tags: ['violence'], effects: ['combat enc_shop'], end: true },
          { text: "(Back away — for now.)", tone: 'leave', end: true },
        ],
      },
      hostile: {
        speaker: 'ysolde_echo',
        text: "“Back again?” The grey woman doesn't turn from the door. Frost spiders across the glass behind her. “Come to help her count my money?”",
        options: [
          { text: "(Resonance) Show her the life she has left — the one that's still hers to finish.", tone: 'resonance', tags: ['mercy'], if: 'resunlocked && res>=1', effects: ['res -1'], next: 'e_resolve_res' },
          { text: "(Draw your weapon.)", tone: 'aggressive', tags: ['violence'], effects: ['combat enc_shop'], end: true },
          { text: "(Back away.)", tone: 'leave', end: true },
        ],
      },
      e_rite: {
        speaker: 'dm',
        text: [
          { if: 'class:cleric || bg:acolyte', text: "You speak the rite of release — Veyra's words for the drowned, the ones you have said before over strangers laid out on riverbanks, and never once over anyone who could hear them. “What was spun is unspun. What was owed is paid. Go down into the quiet water and be still.” The echo listens. The water stops running from her hem." },
          { text: "You speak the old words of release — Veyra's words for the drowned, half-remembered from some funeral long ago. “What was spun is unspun. What was owed is paid. Go down into the quiet water and be still.” Your voice shakes on the last line. The echo listens. The water stops running from her hem." },
        ],
        next: 'e_resolve',
      },
      e_resolve_res: {
        speaker: 'dm',
        text: "You reach down into the thrum beneath the world and find her thread — and instead of pulling, you turn it to the light. You show her the life that was hers: not this shop, but the rented room with a geranium on the sill; the cousin who loved her clumsily; the morning by the river, before she stepped in, when the light on the water was so beautiful she nearly turned back. “That one is still yours,” you tell her. “Go home and finish it.”",
        next: 'e_resolve',
      },
      e_resolve: {
        speaker: 'dm',
        effects: ['set shop_resolved', 'set ysolde_saved', 'add rescued_count 1', 'xp 75', 'set ysolde_discount'],
        text: "For a long moment the grey woman just stands there, water dripping. Then she turns and looks through the window at the real Ysolde — and the real Ysolde, shaking, looks back. Two faces. One alive. “She's still got the good scales,” the echo says at last. “I sold those first.” Her voice is softer now, almost amused. “Tell her to mend the back step. I never did.” She steps away from the door. With every step she is less there — the weed in her hair, the grey of her skin, the drowned weight of her — and then there is only river-smell, and a puddle drying fast on the cobbles, and the bell over the shop door jangling as the real Ysolde stumbles out into the street.",
        interjections: [
          { who: 'ilyra', text: "Go gently, Ysolde. The other one. Wherever you're going." },
          { who: 'tessa', text: "Two versions of one woman, and one of them walked away. I'll remember that one. Someone should." },
        ],
        next: 'e_after',
      },
      e_after: {
        speaker: 'ysolde',
        text: "“Is she — is she gone?” Ysolde grips your arm with fingers like ice. “She had my face. She kept calling me thief. She knew where I keep the spare key.” She laughs, shakily, and it nearly turns into something else. “Lights. Right. Right.” She straightens her collar with great care. “Come by the shop when this is over. You will never pay full price at Quill's again. I'll write it in the ledger.” A breath. “In ink.”",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 16. After the shop fight
  {
    id: 'shop_rescue_after',
    title: "Quill's Sundries",
    start: 'after',
    nodes: {
      after: {
        speaker: 'dm',
        effects: ['set shop_resolved', 'set ysolde_saved', 'add rescued_count 1'],
        text: "The last echo unravels into the fog like wet wool, and the frost on the shop windows runs down the glass in long, weeping lines. The Other Ysolde is gone. Where she stood there is only a puddle, drying fast, that smells of river. The bell over the door of Quill's Sundries jangles, and Ysolde Quill steps out, a broom held in front of her like a pike.",
        interjections: [
          { who: 'varek', text: "She didn't want to hurt anyone. She wanted her life back. I know the feeling." },
        ],
        next: 'ysolde',
      },
      ysolde: {
        speaker: 'ysolde',
        effects: ['set ysolde_discount'],
        text: "“Is it over? Is she—” Ysolde looks at the puddle for a long moment. “She said she'd drowned. She said I'd had all the luck.” Her mouth twists. “Maybe I did.” Then she shakes herself, like a cat coming in from rain. “Right. Listen to me. You'll never pay full price at Quill's again, not while I'm breathing, and I intend to be breathing for a very long time out of sheer spite.” She clutches the broom. “Now, if you'll excuse me, I'm going to go inside and shake for a bit.”",
        interjections: [
          { who: 'ilyra', text: "Shake all you like. Then drink something hot. Then come and find us if you can't stop." },
        ],
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 17. The old well (night)
  {
    id: 'well_encounter',
    title: 'The Old Well',
    start: 'well',
    nodes: {
      well: {
        speaker: 'dm',
        text: "The fog is thickest around the old well, spilling over the rim like milk boiling over. Pell is there. A grey woman kneels on the cobbles with her arms wrapped around him from behind, rocking, humming, her face pressed into his hair. Pell's eyes are enormous. He isn't struggling; he's too frightened to. At the edge of your light, two lantern-eyed shapes pace a slow, patient circle. “Shh,” the grey woman murmurs. “Shh, my Tam, my lamb. Mammy's got you. Nothing's going to take you away again.” Pell, in a very small voice: “I'm not Tam.”",
        interjections: [
          { who: 'orren', text: "Those hounds aren't hunting. They're waiting on her. Take her out of it and I'd wager they lose interest." },
          { who: 'ilyra', text: "Gently. Please. She thinks she's saving him." },
          { who: 'korr', text: "Say the word and I put myself between the boy and everything else." },
        ],
        options: [
          {
            text: "He isn't yours. Yours is waiting somewhere else — and he's been waiting a long time.", tone: 'compassionate', tags: ['mercy', 'diplomacy'],
            check: { skill: 'persuasion', dc: 13 },
            success: 'w_ok', failure: 'w_fail',
          },
          {
            text: "(Look at what she's really holding on to.) Tell me about Tam.", tone: 'curious', tags: ['mercy'],
            check: { skill: 'insight', dc: 13 },
            success: 'w_ok_insight', failure: 'w_fail',
          },
          { text: "(Resonance) Show her the boy she's truly looking for.", tone: 'resonance', tags: ['mercy'], if: 'resunlocked && res>=1', effects: ['res -1'], next: 'w_res' },
          { text: "(Attack — get Pell out of there.)", tone: 'aggressive', tags: ['violence', 'protect'], effects: ['combat enc_well'], end: true },
          { text: "(Back off, slowly.)", tone: 'leave', end: true },
        ],
      },
      w_ok_insight: {
        speaker: 'dm',
        text: "You watch her hands. She isn't holding Pell like a child she knows; she's holding the back of a head, smoothing hair that won't lie flat at the crown — over and over, the way you'd smooth a cowlick. “Tam had a cowlick,” you say softly. “Right there. And he hated you combing it. And he'd be — how old now?” Her hand stops.",
        next: 'w_ok',
      },
      w_res: {
        speaker: 'dm',
        text: "You reach into the thrum under the world and find what she's reaching for: a boy with a cowlick and muddy knees, laughing, forty years gone — not here, not in Pell, but somewhere further along her own thread, waiting where the grey goes soft. You turn her face toward it. Just for a moment, she sees him.",
        next: 'w_ok',
      },
      w_ok: {
        speaker: 'dm',
        effects: ['set well_resolved', 'set pell_safe', 'add rescued_count 1', 'xp 75', 'quest sq_lira search'],
        text: "The humming stops. The grey woman lifts her face from Pell's hair and looks at him — really looks — and sees freckles that aren't Tam's, a stubborn chin that isn't Tam's, a stranger's boy. “Oh,” she says. Just that. Her arms fall open. Pell scrambles free and straight into your legs, and clings. The woman stays kneeling on the cobbles. “He'd be forty now,” she says, puzzled, to no one. “Where did all the time go?” She is fading as she speaks, from the edges inward, like breath off a window. As she goes, the hounds stop pacing, lower their heads, and slink backward into the fog — as if whatever held them here has finally let go of the leash.",
        next: 'w_pell',
      },
      w_pell: {
        speaker: 'pell',
        text: "Pell is shaking so hard his teeth click, but he grabs your sleeve in both fists. “Listen. Listen, I have to tell you, before I forget, before it goes grey. Before she got me — I heard Lira.” He points down, into the well, then north, toward the cathedral. “Under the ground. Singing our song — the bottom part, her part. It came up the well all echoey, from that way. From under Saint Orlen's.” His voice cracks. “She sounded like she couldn't hear herself.”",
        interjections: [
          { who: 'ilyra', text: "You were so brave, Pell. You can stop being brave now. We've got it from here." },
        ],
        options: [
          { text: "I'll find her. Go to the inn — Tobin will keep you warm.", tone: 'compassionate', tags: ['protect'], next: 'w_end' },
        ],
      },
      w_end: {
        speaker: 'dm',
        text: "He wants to argue. You can see it. Then he looks at the fog, and at the place where the grey woman was, and he nods, and runs — music box clutched to his chest — toward the warm yellow windows of the Lantern & Lamb. At the door he turns and shouts back, high and fierce: “UNDER THE CHURCH!” Then he's inside, and the door bangs, and the fog closes up behind him.",
        end: true,
      },
      w_fail: {
        speaker: 'dm',
        text: "The grey woman's head snaps up. “You want to take him. Everyone always wants to take him.” Her mouth opens much too wide and the humming becomes a scream, high and thin as wind in a chimney, and the hounds stop pacing and turn toward you as one. Pell screws his eyes shut.",
        options: [
          { text: "(Fight!)", tone: 'aggressive', effects: ['combat enc_well'], end: true },
        ],
      },
    },
  },

  // ════════════════════════════════════════════════════════ 18. After the well fight
  {
    id: 'well_rescue',
    title: 'The Old Well',
    start: 'after',
    nodes: {
      after: {
        speaker: 'dm',
        effects: ['set well_resolved', 'set pell_safe', 'add rescued_count 1', 'quest sq_lira search'],
        text: "The last hound dissolves into the fog it came from. Where the grey woman knelt there is nothing but a cold patch on the cobbles, already warming. Pell is crouched against the side of the well with his arms over his head and the music box crushed against his chest. He doesn't move until you say his name. Then he looks up, and his face is white, and furious, and soaked.",
        interjections: [
          { who: 'ilyra', text: "Pell. Pell, sweetheart, it's over. Are you hurt? Let me see your hands." },
          { who: 'brakka', text: "Up you get, soldier. Nobody's taking you anywhere you don't want to go." },
        ],
        next: 'pell',
      },
      pell: {
        speaker: 'pell',
        text: "“I'm not crying.” He is. He doesn't care. “Listen — before she grabbed me — I heard Lira. Her song. Our song. It was coming up out of the well, from deep underground, all echoey like down a pipe.” He flings an arm north, toward the cathedral. “From under Saint Orlen's. She's under the church. She's singing and nobody can hear her but me.”",
        options: [
          { text: "Then that's where we're going. Get to the inn, Pell. Stay by the fire.", tone: 'compassionate', tags: ['protect'], next: 'go' },
        ],
      },
      go: {
        speaker: 'dm',
        text: "He wipes his face with his whole sleeve and nods. Then he's running — music box clutched tight — toward the yellow windows of the Lantern & Lamb. He turns once at the door, a small shape against the light, as if to make sure you're really going north. Then he's gone inside.",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 19. Lira's echo (undercroft)
  {
    id: 'lira_echo',
    title: 'The Singing Child',
    start: [
      { if: 'lira_met', node: 'again' },
      { node: 'intro' },
    ],
    nodes: {
      intro: {
        speaker: 'dm',
        effects: ['quest sq_lira found', 'set lira_met'],
        text: "The old ossuary chapel is small and very cold, and someone is singing in it. Not loudly. The way a child sings to herself when she thinks no one is listening: a slow, lopsided lullaby you have heard before, from a tin box in a boy's hands. She is sitting on the steps of the dry font with her knees drawn up — a little girl made of grey light, the edges of her soft as chalk in rain. A kite-string is wound around one wrist; the kite itself is long gone. When your light touches her she stops singing and blinks up at you, slowly, the way a child blinks when she's been woken too early.",
        interjections: [
          { who: 'varek', text: "…I know that voice. The Choir has a thread like it — thin as a hair, very far back. She's halfway to them already." },
          { who: 'ilyra', text: "Oh. Oh, little one." },
        ],
        next: 'lira1',
      },
      lira1: {
        speaker: 'lira',
        text: "“Oh. Are you real? You look real. Nobody's been real for ages.” She yawns enormously. “Is it morning? I'm waiting for Pell. He was meant to come and find me. We were playing hide, and I hid really, really good.” A small frown creases her grey forehead. “Too good, maybe.”",
        options: LIRA_OPTS,
      },
      again: {
        speaker: 'lira',
        text: "She's singing again when you come back, and stops. “You came back. People don't, usually.” She pats the font step beside her, as if offering you a seat. “Is it time to go home yet?”",
        options: LIRA_OPTS,
      },
      hub: {
        speaker: 'lira',
        text: "Lira swings her feet against the font, humming the bottom half of the lullaby under her breath. Every so often she fades a little at the edges, and pulls herself back, like someone nodding off in church.",
        options: LIRA_OPTS,
      },
      l_pell: {
        speaker: 'lira',
        effects: ['set lira_q_pell'],
        text: "Her whole face lights up — literally lights, a soft brightening from the inside, like a lantern catching. “Pell! Is he cross? He gets cross when I win.” She hugs her knees. “He's got our box. I've got the other half of the song. Mam sings the top part and I sing the bottom part and Pell's no good at either, he just hums.” She considers. “Tell him he can stop looking now. Tell him I win.”",
        next: 'hub',
      },
      l_remember: {
        speaker: 'lira',
        effects: ['set lira_q_remember'],
        text: "She thinks hard, chin on her knees. “The red kite. Da made it, and it went up so high over the barley that Pell said it'd hit the moon, and I said the moon used to be bigger, Old Hob said so.” A small, sleepy giggle. “Mam's bread. The burnt end's mine. Pell has the middle, because he's a baby about crusts.” Then her voice goes quieter, and slower, like a music box winding down. “And then… it all went grey. And I called and called, and Mam walked right past me. She looked right at me and walked past.” She looks up at you, bewildered. “Why won't anybody answer?”",
        interjections: [
          { who: 'ilyra', text: "Because they forgot how to hear you, sweetheart. Not because you stopped being worth hearing. Never that." },
          { who: 'brakka', text: "…I know that one. Calling and nobody turning round." },
          { who: 'varek', text: "The forgotten always ask that. Every one of them. I've never had an answer that was good enough." },
        ],
        next: 'hub',
      },
      l_why: {
        speaker: 'lira',
        effects: ['set lira_q_why'],
        text: "“I followed the singing.” She points down — at the floor, at something far beneath it. “There's a big sad bell down there. He sings so loud. He's looking for someone too, I think. Someone who's meant to remember him.” She tilts her head. “I thought if I sang back, he wouldn't be so lonely. I thought maybe we could look together.”",
        next: 'hub',
      },
      l_cost: {
        speaker: 'dm',
        text: "You see how she is held: by a single thread of memory — Pell's — like a kite in a high wind, straining. Not enough to bring her back. To make her real again, to anchor her, would need a weight on the other end of the string. Something heavy enough to pin her to the world. The weave answers you in the only language it has: an anchor needs a weight. The strongest grief nearby will be spent to hold her. Not destroyed. Spent. Somewhere in Hollowmere, someone who has been grieving with all their strength would simply… stop. Would set the grief down and never remember picking it up. You don't know whose it would be. You suspect you could find out. You suspect you wouldn't want to.",
        interjections: [
          { who: 'vaelis', text: "Conservation of meaning. Nothing is made from nothing — not even in the Unwritten. I hate that it's elegant." },
          { who: 'seris', text: "Then it's not ours to spend. Someone's sorrow is theirs. It belongs to the one they lost." },
          { who: 'nima', text: "Grief isn't a treasure. If someone stopped hurting — is that so terrible? Is it?" },
        ],
        next: 'hub',
      },
      l_cost_fail: {
        speaker: 'dm',
        text: "The weave around her is a tangle of grey light you can't follow; every thread you trace doubles back on itself. All you take away is a feeling, faint and uneasy — a pull, like a scale tipping somewhere out of sight, as if anything done here would have to be balanced by something taken elsewhere.",
        next: 'hub',
      },
      choose: {
        speaker: 'dm',
        decision: true,
        text: "Lira has started singing again, very softly, more to herself than to you. She's fading at the edges a little more each time she comes back. Whatever you do for her, it should be soon. Your companions are watching you, and her, and saying nothing — for now.",
        options: [
          {
            text: "(Resonance) Anchor her. Pull her back into the world.", tone: 'resonance', tags: ['mercy', 'boldness'],
            if: 'resunlocked && res>=1', lockedText: 'You would need Aether Resonance to attempt this.',
            check: { ability: 'wis', dc: 12, who: 'player' },
            successEffects: ['res -1', 'set lira_fate anchored', 'set maren_forgets', 'quest sq_lira report', 'xp 100'], success: 'anchor_ok',
            failureEffects: ['res -1', 'damage 2d6 psychic', 'set lira_fate anchored', 'set maren_forgets', 'quest sq_lira report', 'xp 100'], failure: 'anchor_hurt',
            voices: {
              nima: "Do it! Rules are just walls frightened people built. Pull her through — she's seven!",
              korr: "A lost child. We bring her home. There is no other song worth singing.",
              brakka: "If someone could pull me back to my own breakfast table… I'd want them to. Do it.",
            },
          },
          {
            text: "Let her go gently. Sing her to sleep.", tone: 'compassionate', tags: ['mercy', 'tradition'],
            next: 'fade_sing',
            voices: {
              ilyra: "Let her rest. Sing with her. There's no shame in a gentle ending — I've given a few, and they were the kindest thing I ever did.",
              seris: "She is a memory, not a child. Let the Light take her. Anything else is presumption.",
              orren: "Some things are meant to go back to the ground. Let her go easy, and let the boy keep the song.",
              tessa: "Sing her out. I'll take the harmony. Someone should remember this song properly.",
            },
          },
          {
            text: "Bottle her echo. Preserve her until there's a better answer.", tone: 'pragmatic', tags: ['forbidden', 'knowledge'],
            if: 'partyclass:wizard || partyclass:warlock || partyclass:sorcerer || comp:vaelis || comp:varek',
            next: 'bottle',
            voices: {
              vaelis: "Preserve her. An echo this coherent is unprecedented — and it isn't death, it's a pause. We decide later what kindness looks like.",
              varek: "Keep her. The world threw her away once. Don't let it do it twice.",
              kael: "Can't believe I'm saying it. But a kid in a jar beats a kid in nothing. Keep her till someone cleverer knows what to do.",
            },
          },
          { text: "Not yet. I need to think.", tone: 'leave', next: 'hub' },
          { text: "(Leave her for now.)", tone: 'leave', end: true },
        ],
      },
      // ── anchor
      anchor_ok: {
        speaker: 'dm',
        text: [
          { if: 'knows_anchor_cost', text: "You reach into the thrum beneath everything and take hold of her — not her hand; her pattern: kite and crust and the bottom half of a lullaby — and you pull. The world resists like a stuck drawer, and then it gives. Lira gasps. Colour floods into her from the centre outward: brown hair, grey-green eyes, scabbed knees, the gap in her teeth. She is suddenly heavy on the font step, solid, breathing fog into the cold air. She sneezes. " + GRIEF_KNOWN },
          { text: "You reach into the thrum beneath everything and take hold of her — not her hand; her pattern: kite and crust and the bottom half of a lullaby — and you pull. The world resists like a stuck drawer, and then it gives. Lira gasps. Colour floods into her from the centre outward: brown hair, grey-green eyes, scabbed knees, the gap in her teeth. She is suddenly heavy on the font step, solid, breathing fog into the cold air. She sneezes. " + GRIEF_QUIET },
        ],
        next: 'anchor_end',
      },
      anchor_hurt: {
        speaker: 'dm',
        text: [
          { if: 'knows_anchor_cost', text: "You reach into the thrum beneath everything and take hold of her pattern, and the world fights you. It does not want to be edited, and it says so: a spike of pain behind your eyes, a sound like a bell struck inside your skull, the taste of blood. Your companions stagger with you. You hold on anyway. You pull. And the world gives — all at once, like a rope snapping — and there is a little girl on the font step, solid and blinking, brown-haired, scab-kneed, sneezing. " + GRIEF_KNOWN },
          { text: "You reach into the thrum beneath everything and take hold of her pattern, and the world fights you. It does not want to be edited, and it says so: a spike of pain behind your eyes, a sound like a bell struck inside your skull, the taste of blood. Your companions stagger with you. You hold on anyway. You pull. And the world gives — all at once, like a rope snapping — and there is a little girl on the font step, solid and blinking, brown-haired, scab-kneed, sneezing. " + GRIEF_QUIET },
        ],
        next: 'anchor_end',
      },
      anchor_end: {
        speaker: 'lira',
        text: "“I'm cold,” Lira says, astonished. “I'm COLD. I haven't been cold for ages.” She looks at her hands, turning them over, pink and grubby. Then she looks at you. “Can I go home now? Pell's going to be so cross that I won.”",
        interjections: [
          { who: 'nima', text: "She sneezed. She SNEEZED. Real people sneeze!" },
          { who: 'seris', text: "…What did that cost? Does anyone here know what that cost?" },
          { who: 'korr', text: "Today, little one, you have a song. I will make sure it is sung." },
        ],
        next: 'anchor_after',
      },
      anchor_after: {
        speaker: 'dm',
        text: "It takes the better part of half an hour to carry her up through the ruined nave and across the fog to the Lantern & Lamb. She falls asleep on your shoulder before you reach the north gate, warm and heavy and snoring faintly. Tobin takes her from you at the door without a single question — which may be the most surprising thing that happens all night — and carries her to the fire, where a boy in an enormous blanket has already stood up. You don't stay to watch. You'll see them both when this is done. Then you go back down into the dark.",
        end: true,
      },
      // ── fade
      fade_sing: {
        speaker: 'lira',
        text: "Lira's eyes are very heavy now. She leans her grey head against the stone of the font. “I'm so tired,” she says. “Will you sing? Mam always sings the top part. I can't do the top part, it's too high.” She yawns. “Then I'll sing mine, and it'll be the whole song.”",
        options: [
          {
            text: "(Sing the top part with her.)", tone: 'compassionate', tags: ['mercy'],
            check: { skill: 'performance', dc: 10, advIf: 'class:bard || bg:entertainer || comp:tessa' },
            success: 'fade_beautiful', failure: 'fade_cracked',
          },
          { text: "(Hold the light steady, and listen.)", tone: 'compassionate', next: 'fade_plain' },
        ],
      },
      fade_beautiful: {
        speaker: 'dm',
        effects: ['set lira_fate faded', 'set lira_sang', 'give lira_music_box', 'quest sq_lira report', 'xp 100'],
        text: "You find the top line — you don't know how; it's as if the tune was waiting for you in the stone of the chapel — and Lira's thin voice slides in underneath it, the bottom half, the part that was always hers. Two voices, top and bottom, a whole song that nobody in the world remembers but two children and now you. The ossuary seems to lean in to listen. On the last verse her voice grows softer, and softer, and lighter, like a kite climbing out of sight into a high white sky — and then there is only your voice, finishing the song on its own. On the font step where she sat lies a small tin music box, warm to the touch, with a kite-string wound twice around it.",
        interjections: [
          { who: 'tessa', text: "…I got the harmony. I've got it now. I'll never lose it. I promise you, little one. Never." },
          { who: 'ilyra', text: "Veyra keep you, Lira. Sleep well." },
          { who: 'varek', text: "She didn't go to the Choir. She went somewhere quieter. …Good." },
        ],
        end: true,
      },
      fade_cracked: {
        speaker: 'dm',
        text: "Your voice cracks on the very first high note, loud and graceless in the little chapel. Lira giggles sleepily. “You sing like Pell,” she says, delighted, and then she starts her part anyway, and you keep going, wrong notes and all, because it doesn't matter, because she's smiling.",
        next: 'fade_plain',
      },
      fade_plain: {
        speaker: 'dm',
        effects: ['set lira_fate faded', 'give lira_music_box', 'quest sq_lira report', 'xp 100'],
        text: "She sings the bottom half of the lullaby, slow and lopsided, her grey head against the stone. You don't interrupt. Each line comes a little softer than the one before, and her edges blur like chalk in rain, and the kite-string around her wrist goes slack. On the last line her voice is barely a breath. Then the chapel is quiet. On the font step where she sat lies a small tin music box, warm to the touch, with a kite-string wound twice around it.",
        interjections: [
          { who: 'ilyra', text: "Veyra keep you, Lira. Sleep well." },
          { who: 'orren', text: "Easy, now. Easy. That's the way." },
        ],
        end: true,
      },
      // ── bottle
      bottle: {
        speaker: 'dm',
        effects: ['set lira_fate bottled', 'give bottled_echo', 'quest sq_lira report', 'xp 100'],
        text: [
          { if: 'comp:vaelis', text: "Vaelis produces an empty vial from one of his many pockets, as if he's carried it for exactly this for years, and talks you through the binding in a low, rapid voice — a circle of chalk, a word in a language that hurts your teeth, a thread of Aether drawn tight. Lira watches, curious and trusting. “Is it a game?” Then she flows into the glass like smoke into a bottle. The vial fogs, and clears, and there she is: a small grey silhouette, palms pressed flat to the inside, looking out at you. Not frightened. Not anything you can read. The singing has stopped." },
          { if: 'comp:varek', text: "Varek uncorks an empty vial and holds it out, and murmurs something to the Choir that sounds less like a spell than a promise. Lira watches, curious and trusting. “Is it a game?” Then she flows into the glass like smoke into a bottle. The vial fogs, and clears, and there she is: a small grey silhouette, palms pressed flat to the inside, looking out at you. Not frightened. Not anything you can read. The singing has stopped." },
          { text: "You draw a circle in the dust around the font and work the binding the way the old texts describe it — a word, a thread of Aether pulled tight, an empty vial uncorked. Lira watches, curious and trusting. “Is it a game?” Then she flows into the glass like smoke into a bottle. The vial fogs, and clears, and there she is: a small grey silhouette, palms pressed flat to the inside, looking out at you. Not frightened. Not anything you can read. The singing has stopped." },
        ],
        interjections: [
          { who: 'seris', text: "You put a child in a bottle. Whatever you tell yourself later — remember that's what you did." },
          { who: 'vaelis', text: "She's stable. Coherent. Preserved. …I had expected to feel rather more triumphant than this." },
          { who: 'ilyra', text: "Keep her warm. Keep her close. Don't you dare put her on a shelf." },
        ],
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 20. Corvin's room (inn)
  {
    id: 'corvin_room',
    title: "The Scholar's Desk",
    start: 'desk',
    nodes: {
      desk: {
        speaker: 'dm',
        text: "The scholar's room is less a room than a nest. Books are stacked in towers that lean on one another for support; muddy boots stand guard by the door; a coat hangs from the bedpost so caked in grey clay it could stand on its own. The desk under the window is buried in paper — maps, rubbings, notes in three inks and two languages — and a half-eaten pie that has achieved a kind of geological stability.",
        interjections: [
          { who: 'kael', text: "Lot of paper for a man with one lock on his door. Either he trusts people, or he's never had anything stolen. Both are fixable." },
          { who: 'vaelis', text: "Look at those margins. Annotations on annotations. I loathe him already. We'd get on terribly." },
        ],
        options: [
          {
            text: "(Search the desk thoroughly.)", tone: 'curious', if: '!corvin_desk_searched && !(quest:sq_corvin=found) && !questdone:sq_corvin',
            check: { skill: 'investigation', dc: 12 },
            successEffects: ['set corvin_desk_searched', 'set knows_altar_secret', 'quest sq_corvin rumor', 'clue mq_bell corvin_seen'], success: 'c_plan',
            failureEffects: ['set corvin_desk_searched'], failure: 'c_receipts',
          },
          {
            text: "(Search the desk thoroughly.)", tone: 'curious', if: '!corvin_desk_searched && (quest:sq_corvin=found || questdone:sq_corvin)',
            check: { skill: 'investigation', dc: 12 },
            successEffects: ['set corvin_desk_searched', 'set knows_altar_secret', 'clue mq_bell corvin_seen'], success: 'c_plan',
            failureEffects: ['set corvin_desk_searched'], failure: 'c_receipts',
          },
          {
            text: "(Examine the brass-rubbing pinned above the desk.)", tone: 'curious', if: '!corvin_rubbing_tried',
            check: { skill: 'history', dc: 13 },
            successEffects: ['set corvin_rubbing_tried', 'set knows_unbound'], success: 'c_unbound',
            failureEffects: ['set corvin_rubbing_tried'], failure: 'c_rubbing_fail',
          },
          { text: "(Read the unfinished letter on top of the pile.)", tone: 'curious', once: true, if: '!corvin_letter_read', next: 'c_letter' },
          { text: "(Leave it all as you found it.)", tone: 'leave', end: true },
        ],
      },
      hub: {
        speaker: 'dm',
        text: "The pie regards you. The papers rustle in a draught from the badly-fitted window.",
        options: [
          {
            text: "(Examine the brass-rubbing pinned above the desk.)", tone: 'curious', if: '!corvin_rubbing_tried',
            check: { skill: 'history', dc: 13 },
            successEffects: ['set corvin_rubbing_tried', 'set knows_unbound'], success: 'c_unbound',
            failureEffects: ['set corvin_rubbing_tried'], failure: 'c_rubbing_fail',
          },
          { text: "(Read the unfinished letter on top of the pile.)", tone: 'curious', once: true, if: '!corvin_letter_read', next: 'c_letter' },
          {
            text: "(Search the desk thoroughly.)", tone: 'curious', if: '!corvin_desk_searched && !(quest:sq_corvin=found) && !questdone:sq_corvin',
            check: { skill: 'investigation', dc: 12 },
            successEffects: ['set corvin_desk_searched', 'set knows_altar_secret', 'quest sq_corvin rumor', 'clue mq_bell corvin_seen'], success: 'c_plan',
            failureEffects: ['set corvin_desk_searched'], failure: 'c_receipts',
          },
          {
            text: "(Search the desk thoroughly.)", tone: 'curious', if: '!corvin_desk_searched && (quest:sq_corvin=found || questdone:sq_corvin)',
            check: { skill: 'investigation', dc: 12 },
            successEffects: ['set corvin_desk_searched', 'set knows_altar_secret', 'clue mq_bell corvin_seen'], success: 'c_plan',
            failureEffects: ['set corvin_desk_searched'], failure: 'c_receipts',
          },
          { text: "(Step away from the desk.)", tone: 'leave', end: true },
        ],
      },
      c_plan: {
        speaker: 'dm',
        text: "Under a drift of rubbings you find it: a hand-drawn plan of the Cathedral of Saint Orlen, ruled and labelled with obsessive care. Nave, transepts, sacristy, the collapsed stump of the bell tower. A heavy X sits on the high altar, and beside it, circled three times so hard the nib has torn the paper: third lantern. Beneath, in smaller, shakier writing: Press. Then down. Don't look at the singing ones.",
        interjections: [
          { who: 'nima', text: "‘Don't look at the singing ones.’ Brilliant. Great. I'm definitely going to look at the singing ones now." },
        ],
        next: 'hub',
      },
      c_receipts: {
        speaker: 'dm',
        text: "You can't make head or tail of most of it — diagrams of things that might be arches or might be teeth, notes that break off mid-word. What you do find is a stack of receipts from Quill's Sundries in Ysolde's sharp hand: one shovel (good); one shovel (better — ‘first one broke, apparently’); fifty feet of rope; six flasks of lamp oil; one pick, iron; chalk, a great deal of chalk; two pies. Whatever Corvin Thale has been doing, he's been doing it for a while, and he's been doing it underground.",
        next: 'hub',
      },
      c_unbound: {
        speaker: 'dm',
        text: "The rubbing shows a sigil: a chain, every link drawn in careful detail, broken clean in the middle. You know it — from footnotes, mostly, and from one lecture where the lecturer lowered his voice. The Unbound: a secret society of historians who believe history has been stolen, and that every erased thing is owed a remembering. Some call them scholars. Some call them grave-robbers with bibliographies. Their members don't usually pin their sigil over their desk for anyone to find. Unless, you think, they were very lonely, and a very long way from home.",
        interjections: [
          { who: 'vaelis', text: "The Unbound. They stole a book from me once. Returned it a year later, annotated. The annotations were excellent, which was worse." },
          { who: 'seris', text: "Grave-robbers with ideals are still grave-robbers." },
        ],
        next: 'hub',
      },
      c_rubbing_fail: {
        speaker: 'dm',
        text: "A chain, broken in the middle, rubbed from brass in charcoal. It feels like it ought to mean something — a guild mark, a family crest, a tavern sign — but whatever it is, it's beyond you. Somebody cared about it enough to pin it level, though. That much you can tell.",
        next: 'hub',
      },
      c_letter: {
        speaker: 'dm',
        effects: ['set corvin_letter_read'],
        text: "An unfinished letter, the ink smudged where a sleeve dragged through it: “Dear O. — I have found the door. The seal is cracked (NOT by me — mostly — it was cracked when I got here, I swear on the Index). I think I may be making it worse. The ground hums at night. Sometimes I think it's humming a tune. I would like to come home now, please. I know you'll say no. — C.” Below the signature, a line has been written and crossed out so many times it's nearly a black bar. You can just make out the first word: “I'm—”",
        next: 'hub',
      },
    },
  },

  // ════════════════════════════════════════════════════════ 21. Corvin Thale (undercroft)
  {
    id: 'corvin_rescue',
    title: 'Corvin Thale',
    start: [
      { if: 'corvin_talked', node: 'return' },
      { node: 'intro' },
    ],
    nodes: {
      intro: {
        speaker: 'corvin',
        effects: ['set corvin_talked', 'quest sq_corvin found', 'give corvin_notes'],
        text: "A thin young man unfolds himself from behind a collapsed shoring beam, spectacles cracked across one lens, coat more mud than coat, a notebook clutched to his chest like a shield. “Oh, thank the Lights. Thank all six of them. And the seventh, whoever she is — sorry. Sorry. I've been down here since — what day is it? Don't answer that.” He offers you a hand, realises it's coated in centuries-old muck, offers the other one, which is worse. “Corvin Thale. Scholar. Mostly. I'd like to say I can explain all this.” He looks at the pit, at the dead crawlers, at the faint blue light pulsing in the cracks. “I can't. But I can explain some of it, and I can feel very bad about the rest.” He thrusts a sheaf of muddy pages into your hands. “Here — my notes. Take them. If the next thing with mandibles gets me, somebody ought to have them.”",
        interjections: [
          { who: 'vaelis', text: "He thanked the seventh Light. Nobody thanks the seventh Light. Interesting." },
          { who: 'kael', text: "Takes guts or stupidity to hand your notes to a stranger with a sword. Possibly both. I like him." },
        ],
        options: [
          { text: "Start explaining.", tone: 'pragmatic', next: 'conf1' },
          {
            text: "(Grab him by the collar.) Talk. Fast.", tone: 'aggressive', tags: ['cruelty'],
            check: { skill: 'intimidation', dc: 10 },
            success: 'threat_ok', failure: 'threat_fail',
          },
        ],
      },
      conf1: {
        speaker: 'corvin',
        text: "“Right. Yes. Explaining.” He takes a breath that seems to come up from his boots. “I'm with the Unbound. That's — you might not know — we're historians. Secret ones. The world's been edited, you see, whole peoples cut out of the record, and we think the truth belongs to everyone, and also we're not very popular.” He pushes his spectacles up his nose and leaves a stripe of mud. “The Index — our, um, leader — sent me to Hollowmere to find an Anchor. One of the old Ithari vaults that pin the world in place. She said there'd be one under the cathedral.” A miserable little laugh. “She was right. She's always right. It's very annoying.”",
        interjections: [
          { who: 'vaelis', text: "The Unbound. Of course. Who else would dig up a cathedral for footnotes?" },
          { who: 'seris', text: "An Anchor. You came here looking for an Anchor, and you brought a shovel." },
        ],
        next: 'conf2',
      },
      conf2: {
        speaker: 'corvin',
        text: "“The seal was already cracked when I got here. I want that understood. Cracked. Hairline. Very old.” A pause. “…Mostly cracked. And then I dug down to have a look at it, and I may have — widened the hairline. With a pick.” He takes his spectacles off and polishes them on a filthy sleeve, which makes them worse. “The night my pick broke through, I heard the bell. Down here, through the stone. Ringing. From a tower that isn't there. Then the fog came up the stair, and the crawlers came up out of the crack, and I've been behind that beam ever since, writing very fast.”",
        interjections: [
          { who: 'nima', text: "You put a pick through an Ithari seal. Corvin, that's the most reckless thing I've ever heard, and I once set my own eyebrows on fire on purpose." },
          { who: 'brakka', text: "People are lost in that fog up there. Children. You know that?" },
        ],
        next: 'conf3',
      },
      conf3: {
        speaker: 'corvin',
        text: "He flinches, but nods. “I know. I know.” Then, steadier, because this part he's sure of: “The vault lies below the sentinel chamber — south of here; you'll know it, there's a great stone thing on a plinth that you'll want very much not to wake. The vault door's sealed with Ithari wards. It wants a seven-pointed sigil-stone to open — the Scribes' star — or somebody who can actually read Ithari, which is a very short list.” He winces. “I'm on it. Only just. Near the bottom.” He looks at you, hopeful and wretched in equal measure. “So. That's everything. What happens to me now?”",
        next: 'decide',
      },
      threat_ok: {
        speaker: 'corvin',
        text: "He squeaks. Then all of it comes out in a single breath, as if he's been rehearsing it for days: “Unbound — sent by the Index — find the Anchor — seal was cracked, mostly — I made it worse — bell rang the night my pick went through — vault's below the sentinel chamber — door needs a seven-pointed sigil-stone or someone who reads Ithari — please don't hit me, I bruise like a peach.” You let go. He sits down hard in the mud.",
        interjections: [
          { who: 'ilyra', text: "He was going to tell you anyway. You know that." },
          { who: 'orren', text: "Didn't need the collar. Could see it on him." },
        ],
        next: 'threat_decide',
      },
      threat_fail: {
        speaker: 'corvin',
        text: "He flinches — and then, surprisingly, doesn't fold. “You — you can hit me. I've been chased by crawlers for two days; I'm rather past being frightened of people.” His voice wobbles badly. He keeps going. “But I'll tell you anyway. Not because you're frightening. Because somebody should know, and you're the only somebody who's come.”",
        next: 'conf1',
      },
      threat_decide: {
        speaker: 'dm',
        decision: true,
        text: "Corvin Thale sits in the mud where you dropped him, spectacles askew, notebook in his lap, waiting. He doesn't try to run. He doesn't look like he has anywhere left to run to.",
        options: [
          {
            text: "(Finish him.) He's the reason people are dying up there.", tone: 'aggressive', tags: ['cruelty', 'violence'],
            effects: ['set corvin_fate killed', 'complete sq_corvin killed', 'rep unbound -30'], next: 'd_killed',
          },
          {
            text: "Get out of my sight. Crawl.", tone: 'aggressive', tags: ['mercy'],
            effects: ['set corvin_fate freed', 'complete sq_corvin freed'], next: 'd_crawl',
            voices: {
              ilyra: "Enough. You have what you wanted. Let him go.",
              brakka: "You've had your answers. Leave him be.",
              korr: "There's no honour in more. Let him crawl.",
            },
          },
          {
            text: "You're going to Captain Hale.", tone: 'diplomatic', tags: ['authority', 'honesty'],
            effects: ['set corvin_fate handed_over', 'complete sq_corvin handed_over', 'rep covenant 5', 'rep hollowmere 5', 'rep unbound -10'], next: 'd_hale',
            voices: {
              seris: "Let the law have him. It's what the law is for.",
              orren: "Hale will be fair. Fairer than we're feeling.",
            },
          },
        ],
      },
      decide: {
        speaker: 'corvin',
        decision: true,
        text: "Corvin stands in the wreck of his own dig, waiting to be judged. He looks like a man who has been judging himself for days, and losing every time.",
        options: CORVIN_DECIDE,
      },
      return: {
        speaker: 'corvin',
        text: "“You came back!” Corvin has not moved from his beam. He has, however, filled four more pages of his notebook. “I've been sitting very still. I'm excellent at sitting still. Have you — decided?”",
        next: 'decide',
      },
      d_hale: {
        speaker: 'corvin',
        text: "He nods slowly. “That's… fair. That's probably fair.” He tucks his notebook inside his coat as if it were the only thing he owned, which it may be. “Tell Captain Hale I'll come quietly. I'll wait on the cathedral steps. I do everything quietly. It's my main skill.” Then, as an afterthought, very small: “Will you tell the Index what happened? She'll want to know. She won't come for me. But she'll want to know.”",
        interjections: [
          { who: 'seris', text: "It's right. It is. …I don't know why it feels like this." },
          { who: 'kael', text: "Well, Hollowmere gets its villain. Shame he's about as villainous as a wet cat." },
        ],
        end: true,
      },
      d_free: {
        speaker: 'corvin',
        text: "He stares at you as if you've spoken Ithari. Then he fumbles at his neck and presses something into your palm: a brass disc engraved with a broken chain, still warm from his skin. “Show this to the right people and doors will open. Show it to the wrong people and run.” His eyes are wet behind the cracked lenses. “The Unbound will remember this. We're very good at remembering. It's the whole point of us.” And he goes — at a stumbling, mud-slapping run toward the sacristy stair — and is gone.",
        interjections: [
          { who: 'ilyra', text: "That was kind. It might not be wise. It was kind." },
          { who: 'seris', text: "People are lost in the fog because of that man, and you let him walk out." },
        ],
        end: true,
      },
      d_ally: {
        speaker: 'corvin',
        text: "His face does something complicated — disbelief, then terror, then something underneath both that looks a lot like joy. “Help? You want me to help? Nobody ever wants me to help. They usually want me to stop helping.” He clutches his notebook. “I'll meet you at the vault door. I'll bring chalk. And a lamp. And my courage, if I can remember where I put it.” He trots off south toward the sentinel chamber, then trots back. “Don't wake the big stone one. I can't stress that enough.” Then he's gone again.",
        interjections: [
          { who: 'vaelis', text: "An Unbound field agent with a lamp and a phrasebook. What could possibly go wrong." },
          { who: 'nima', text: "I like him! He's like you, Vaelis, but nice." },
        ],
        end: true,
      },
      d_killed: {
        speaker: 'dm',
        text: "It is quick, and it is not clean, and he doesn't fight. He only says “oh” — the same small, surprised sound a person makes on missing a stair. The notebook falls into the mud and lies open at a page headed, in a neat, careful hand: Things I Must Put Right. The list is very long. Almost nothing on it is crossed out.",
        interjections: [
          { who: 'ilyra', text: "…No. No. He was on his knees." },
          { who: 'korr', text: "There will be no song for this. Not from me." },
          { who: 'seris', text: "That was not justice. Justice has a judge." },
          { who: 'varek', text: "Well. That's one fewer person in the world who knew how to read Ithari." },
        ],
        end: true,
      },
      d_crawl: {
        speaker: 'dm',
        text: "He goes, scrabbling up on hands and knees and then on unsteady feet, notebook pressed to his chest, toward the sacristy stair. He doesn't look back. You hear him slip twice on the steps, and keep going, and then you don't hear him at all.",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════ 22. The excavation pit
  {
    id: 'dig_pit',
    title: 'The Excavation Pit',
    start: 'pit',
    nodes: {
      pit: {
        speaker: 'dm',
        text: "The pit drops away beneath your light, terraced as neatly as a mine — Corvin dug like a man who'd read books about digging. At the bottom, where the shovel-marks stop, the earth gives way to something else: a seam of black stone, and in the stone, cracks, and in the cracks, a faint blue light that pulses, slowly, like something breathing in its sleep.",
        interjections: [
          { who: 'nima', text: "Oh. Oh, it's singing. Can you hear it? It's singing in my teeth." },
          { who: 'orren', text: "Nothing grows near the edge. Not even moss. Even the crawlers kept away from the bottom." },
        ],
        options: [
          {
            text: "(Study the light in the stone.)", tone: 'curious', if: '!pit_arcana_tried',
            check: { skill: 'arcana', dc: 12 },
            successEffects: ['set pit_arcana_tried', 'set saw_conduit'], success: 'pit_conduit',
            failureEffects: ['set pit_arcana_tried', 'damage 1d4 lightning'], failure: 'pit_arcana_fail',
          },
          {
            text: "(Search the bottom of the pit.)", tone: 'curious', if: '!pit_looked',
            check: { skill: 'perception', dc: 11 },
            successEffects: ['set pit_looked'], success: 'pit_pick',
            failureEffects: ['set pit_looked'], failure: 'pit_look_fail',
          },
          { text: "(Step back from the edge.)", tone: 'leave', end: true },
        ],
      },
      hub: {
        speaker: 'dm',
        text: "The blue light pulses at the bottom of the pit. In. Out. In.",
        options: [
          {
            text: "(Study the light in the stone.)", tone: 'curious', if: '!pit_arcana_tried',
            check: { skill: 'arcana', dc: 12 },
            successEffects: ['set pit_arcana_tried', 'set saw_conduit'], success: 'pit_conduit',
            failureEffects: ['set pit_arcana_tried', 'damage 1d4 lightning'], failure: 'pit_arcana_fail',
          },
          {
            text: "(Search the bottom of the pit.)", tone: 'curious', if: '!pit_looked',
            check: { skill: 'perception', dc: 11 },
            successEffects: ['set pit_looked'], success: 'pit_pick',
            failureEffects: ['set pit_looked'], failure: 'pit_look_fail',
          },
          { text: "(Step back from the edge.)", tone: 'leave', end: true },
        ],
      },
      pit_conduit: {
        speaker: 'dm',
        text: "Not cracks. Veins. Crystalline channels running through the black stone like the leading in a stained-glass window, every one of them sloping down, converging, toward something far below — something enormous, and very old, humming at a pitch just under hearing. This is an Ithari conduit. It carries Aether the way an aqueduct carries water. Whatever it feeds lies deep, and vast, and older than the cathedral, older than Hollowmere, older than the names of the Lights. And the light in the veins, you realise with a cold thrill, is pulsing in time with the bell you heard at midnight.",
        interjections: [
          { who: 'nima', text: "That's what I could taste in the air all festival. That. It's been leaking up through the whole town like steam through floorboards." },
          { who: 'vaelis', text: "Do not touch the conduit, Nima. I can see your hand moving. Put it in your pocket." },
          { who: 'seris', text: "My relic is warm. It's never warm." },
        ],
        next: 'hub',
      },
      pit_arcana_fail: {
        speaker: 'dm',
        text: "You lean in too close, trying to follow one of the glowing lines, and the light leans back. A spark leaps from the stone to your outstretched fingers and up your arm — a jolt like grabbing a doorknob in a thunderstorm, a mouthful of ozone, every hair on your body standing up at once. When your vision clears, the light is just light again, pulsing, unreadable, and faintly smug.",
        next: 'hub',
      },
      pit_pick: {
        speaker: 'dm',
        text: "Wedged in a crack at the very bottom of the pit, its iron head snapped clean off the haft, is a pick. The crack around it glows a faint, steady blue — and so does the broken edge of the iron, as though the metal had been struck by something, rather than the other way round. Scratched into the haft, in neat little capitals: C.T. This is where it happened. This is where a scholar with good intentions swung once too often, and a bell eighty years gone began to ring.",
        next: 'hub',
      },
      pit_look_fail: {
        speaker: 'dm',
        text: "Shadows, mud, and Corvin's shovel-terraces going down into the dark. Anything at the bottom would mean climbing further in, and the lip of the pit crumbles under your boot in a way that suggests it would rather you didn't. Whatever's down there, it'll keep.",
        next: 'hub',
      },
    },
  },
];
