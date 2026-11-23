/**
 * Act I — The Whispering Woods (Writer A).
 *
 * Scenes (all on map `woods`):
 *  - The Heartwood outpost: Warden Sefa Linden at the gate, quartermaster Dunla Reedwhistle (Verdant shop),
 *    and the Greenmother, Aunra Vell, who reveals the Old Path to Valdros (contract: `quest a1_main old_path`,
 *    `hub valdros`, `set a1_old_path_known`; `a1_greenmother_met` is set when the audience begins).
 *    If she is angered, the Old Path can still be found at the eastern waystone (hard Survival, easier with
 *    Orren, Korr, or Agna's red-cord map).
 *  - Side quest a1w_thornwake "The Breaking of the Stone": the Whispering Stone (strangled by a Conclave brace),
 *    Caddoc Briar's Thornwake camp, and the moonrise decision at the Stone → `a1_thornwake` helped|stopped|bargained,
 *    `a1_stone` broken|left|mended (a stone left standing can be mended later).
 *  - Side quest a1w_woodcutters "Red Cord": Agna Fell's lost men in the gloam hollow — Piet treed by gloam
 *    stalkers (Korr is there if not yet recruited), and Lenn, sitting on the doorstep of a life he never lived.
 *  - Recruitment: Orren (path east of the ford) and Korr (the gloam hollow), gated by `!recruited:<id>`.
 *    Companion moments when they are already in the party: Orren finds his grandmother's path-mark; Korr hears
 *    a voice in the hollow.
 *
 * `a1_woods_done` is set (dialogue a1w_woods_done) as soon as BOTH the Old Path is known AND the Thornwake decision
 * has been made. Closing options of the relevant scenes chain into that dialogue when the condition holds; a
 * map-wide trigger catches any path that completes the pair elsewhere (e.g. the waystone).
 */
import type { ContentModule } from './module';
import type { DialogueOption, DialogueTree } from '../schema';

// ───────────────────────────────────────────────────────────── shared pieces

const OLD_PATH = ['quest a1_main old_path', 'hub valdros', 'set a1_old_path_known'];
const DONE_COND = 'a1_old_path_known && a1_thornwake && !a1_woods_done';

/** A closing option that chains into the "Woods are done" beat when both main beats are complete. */
function close(text: string, tone: DialogueOption['tone'] = 'leave'): DialogueOption[] {
  return [
    { text, tone, if: DONE_COND, effects: ['dialogue a1w_woods_done'], end: true },
    { text, tone, if: `!(${DONE_COND})`, end: true },
  ];
}

/** Closing options for the woodcutters' hollow: once both men are accounted for, the quest moves to "report". */
function hollowClose(text: string, done: string): DialogueOption[] {
  return [
    { text, tone: 'leave', if: done, effects: ['quest a1w_woodcutters report'], end: true },
    { text, tone: 'leave', if: `!(${done})`, end: true },
  ];
}

const HELPED = ['set a1_thornwake helped', 'set a1_stone broken', 'complete a1w_thornwake helped', 'rep verdant 10', 'rep conclave -10', 'xp 100'];
const STOPPED = ['set a1_thornwake stopped', 'set a1_stone left', 'complete a1w_thornwake stopped'];
const BARGAINED = ['set a1_thornwake bargained', 'complete a1w_thornwake bargained', 'rep verdant 8', 'rep conclave -3', 'xp 150', 'set a1w_brace_removed'];

// ───────────────────────────────────────────────────────────── the gate

const GATE: DialogueTree = {
  id: 'a1w_gate',
  title: 'The Heartwood Gate',
  start: [{ if: 'a1w_gate_passed', node: 'after' }, { node: 'first' }],
  nodes: {
    first: {
      speaker: 'dm',
      text: `Where the dirt path climbs toward the grove, a woman steps out of a hawthorn you would have sworn was too thin to hide a cat. She is lean and weather-brown, in leathers stitched with living moss, and she holds a longbow the way other people hold a conversation: loosely, and ready to end it. Above her, in the high branches, you count three more bows. Then four. Then you stop counting, because counting is clearly the point.`,
      next: 'challenge',
    },
    challenge: {
      speaker: 'a1w_sefa',
      text: `“Sefa Linden. Warden of the Heartwood gate.” Her eyes go to your face, your hands — and then, for a long moment, to the middle of your chest, as though something there is making a noise only she can hear. “The trees have been talking about you since you crossed the ford. Most of them are frightened. One or two are angry. So tell me why I should let a thing that frightens the oldest trees in Elyndra walk up the hill to the Greenmother.”`,
      interjections: [
        { who: 'orren', text: `Orren lifts a hand, palm out — the path-warden's greeting. “Sefa. They're with me.” The warden's bow-arm relaxes by exactly one finger's width. “Mossward. Your grandmother would have made them wait a day in the rain.” “I know,” says Orren. “I'm not her.”` },
        { who: 'korr', text: `Korr counts the bows in the branches, as you did, and reaches the same number. He sets the head of his axe on the ground and leans on the haft: the posture of a man who has come to talk. Sefa notices. She approves, a little.` },
        { who: 'kael', text: `“Seven,” Kael murmurs. “The one in the holly's pretending to be a squirrel.” A pause. “Very good squirrel.”` },
      ],
      options: [
        {
          text: `Hollowmere's bell rang. Something woke beneath the cathedral, and now it's bound to me. I need the Greenmother's counsel.`,
          tone: 'diplomatic', tags: ['honesty', 'diplomacy'], effects: ['set a1w_gate_passed', 'rep verdant 2'], next: 'pass_honest',
        },
        {
          text: `Orren can vouch for us.`, if: 'comp:orren', tone: 'friendly', tags: ['tradition', 'nature'],
          effects: ['set a1w_gate_passed', 'rep verdant 2', 'rel orren trust 1'], next: 'pass_orren',
        },
        {
          text: `(Nature) The trees aren't frightened of us. They're frightened of what's happening to the stones under them — same as you.`,
          tone: 'curious', tags: ['nature'], check: { skill: 'nature', dc: 13, advIf: 'class:druid || class:ranger' },
          successEffects: ['set a1w_gate_passed', 'rep verdant 3'], success: 'pass_nature',
          failureEffects: ['set a1w_gate_passed'], failure: 'pass_soft',
        },
        {
          text: `[Resonance] Let her hear it too. (Spend 1 Resonance)`, if: 'resunlocked && res>=1', tone: 'resonance', tags: ['honesty', 'curiosity'],
          effects: ['res -1', 'set a1w_gate_passed', 'rep verdant 2'], next: 'pass_res',
        },
        {
          text: `We're herbalists from Ashenford. We lost the road.`, tone: 'deceptive', tags: ['deception'],
          check: { skill: 'deception', dc: 14 },
          successEffects: ['set a1w_gate_passed'], success: 'pass_lie',
          failureEffects: ['set a1w_gate_passed', 'set a1w_warden_wary'], failure: 'fail_lie',
        },
        {
          text: `Step aside, warden.`, tone: 'aggressive', tags: ['boldness', 'defiance'],
          check: { skill: 'intimidation', dc: 16 },
          successEffects: ['set a1w_gate_passed', 'set a1w_warden_wary'], success: 'pass_threat',
          failureEffects: ['set a1w_gate_passed', 'set a1w_warden_wary', 'rep verdant -3'], failure: 'fail_threat',
        },
        { text: `We'll come back another time.`, tone: 'leave', end: true },
      ],
    },
    pass_honest: {
      speaker: 'a1w_sefa',
      text: `She listens to the whole of it without blinking. When you finish, she lowers the bow. “That's the first true thing anyone from the towns has said to me this year,” she says. “Go up. Slowly. Mind the roots — some of them are listening.”`,
    },
    pass_orren: {
      speaker: 'a1w_sefa',
      text: `“Hesk's grandson brings guests to the Moot.” Something in Sefa's face goes almost soft. “She'd be proud. She'd also tell you to wipe your boots.” She steps aside. “Go on up.”`,
    },
    pass_nature: {
      speaker: 'a1w_sefa',
      text: `Sefa looks at you for a long moment. Above, one of the bows lowers without being told. “Yes,” she says quietly. “That's it exactly. Two of the stones have gone this year. You can hear the gap where they were, like a missing tooth.” She stands aside. “Go up. She'll want to hear you say that.”`,
    },
    pass_soft: {
      speaker: 'a1w_sefa',
      text: `“That's what the Greenmother would say.” Her eyes narrow. “Which means you've either been listening to the right people, or you're a good mimic.” A long pause. Then she steps aside anyway. “Go up. Slowly. If you're a mimic, she'll know before you've sat down.”`,
    },
    pass_res: {
      speaker: 'dm',
      text: `You let the Heart beat, once, loud enough to be heard. Sefa flinches as though a bell had been rung next to her ear. In the branches overhead every bird takes off at once — and then, very slowly, settles again, one by one, closer than before. The warden lets out a breath. “Oh,” she says. Only that. Then she steps aside and does not look you in the face as you pass, the way people do not look straight at a shrine.`,
    },
    pass_lie: {
      speaker: 'a1w_sefa',
      text: `“Herbalists.” Sefa looks at your boots, your weapons, your companions. “From Ashenford.” A long pause. “Herbalists are welcome at the Heartwood. Dunla will be thrilled.” She steps aside. You are almost sure she believed you. You are not at all sure she didn't simply decide it would be more interesting to let you go up.`,
    },
    fail_lie: {
      speaker: 'a1w_sefa',
      text: `“No,” says Sefa pleasantly, “you're not.” She does not raise the bow. She doesn't need to. “But the Greenmother told me to let you up whatever you said. So: up. And I'll walk behind you, the whole way, so we can both enjoy the view.”`,
    },
    pass_threat: {
      speaker: 'dm',
      text: `Something in your voice makes Sefa step back half a pace before she has decided to. Her jaw tightens. She lets you pass — but every bow in the branches turns with you as you go, and you can feel the trees around the path lean, very slightly, away.`,
    },
    fail_threat: {
      speaker: 'dm',
      text: `Sefa doesn't move. Neither do the bows. For a long, bright moment nobody breathes. Then, from the top of the hill, a voice as soft as moss says: “Let them come, Sefa. Everything comes into the Woods with its teeth showing, the first time.” The warden steps aside without a word. She doesn't need one. Her face says it all.`,
    },
    after: {
      speaker: 'a1w_sefa',
      text: `“Go on up,” Sefa says, without looking round. “Mind the roots.”`,
      options: [
        { text: `What's happening in the Woods, warden?`, once: true, tone: 'curious', effects: ['quest a1w_thornwake stone'], next: 'rumor' },
        { text: `Thank you, Sefa.`, tone: 'leave', end: true },
      ],
    },
    rumor: {
      speaker: 'a1w_sefa',
      text: `“Thorn-Elder Caddoc's people have been seen at the Whispering Stone, in the old ring of pillars south of the ford. Three times this week.” She keeps her eyes on the trees. “Last time Caddoc visited a stone that often, it was at Brackwater, and Brackwater isn't there any more.”`,
      options: close(`I'll look into it.`),
    },
  },
};

// ───────────────────────────────────────────────────────────── the Greenmother

const AUNRA_HUB: DialogueOption[] = [
  { text: `What is happening to the Woods?`, if: '!a1w_anchors_told', tone: 'curious', tags: ['curiosity'], next: 'anchors' },
  { text: `You know what I'm carrying, don't you?`, if: '!a1w_heart_asked', tone: 'curious', tags: ['honesty'], next: 'heart' },
  { text: `Tell me about Caddoc Briar.`, if: 'a1w_anchors_told && !a1w_asked_caddoc', tone: 'curious', next: 'caddoc' },
  {
    text: `(Glance at Orren. It's his to decide.)`, if: 'comp:orren && !a1w_acorn_choice && (orren_first_tree_known || cq_orren_outcome)',
    tone: 'compassionate', next: 'acorn',
  },
  { text: `I need to reach Valdros. I'm told there's a road.`, if: '!a1w_path_asked', tone: 'pragmatic', next: 'path_ask' },
  {
    text: `I've been to the Whispering Stone.`, if: 'a1w_aunra_deferred && (a1w_stone_seen || a1_thornwake)', tone: 'diplomatic',
    effects: ['unset a1w_aunra_deferred'], next: 'stone_report',
  },
  ...close(`I'll come back, Greenmother.`),
];

const AUNRA: DialogueTree = {
  id: 'a1w_aunra',
  title: 'The Greenmother',
  start: [
    { if: 'a1w_aunra_angered && !a1_old_path_known', node: 'angered' },
    { if: 'a1_old_path_known && a1_greenmother_met', node: 'after' },
    { if: 'a1_greenmother_met', node: 'return' },
    { if: '!a1w_gate_passed', node: 'snuck' },
    { node: 'first' },
  ],
  nodes: {
    snuck: {
      speaker: 'dm',
      text: `You come up into the grove the long way, under branches nobody meant you to duck under. You get perhaps ten paces into the clearing before the arrows arrive — not in you, but in the turf around your feet, a neat ring of them, still humming. Warden Sefa drops out of an oak with the next one already nocked. Then a voice, soft as moss, says: “Let them be, Sefa. They came round the long way. That is also a way.”`,
      effects: ['set a1w_gate_passed', 'set a1w_warden_wary'],
      next: 'first',
    },
    first: {
      speaker: 'dm',
      text: `The Heartwood is not a tree. It was a tree once, the way a cathedral was once a quarry. Its trunk is wider than the Lantern & Lamb, grey and fluted, hollowed at the base into a chamber where green light pools like water. Roots as thick as a man run out across the clearing and down into the earth, and every one of them is very faintly, very slowly moving.

In the hollow, on a seat the tree has grown for her, sits the Greenmother.

Aunra Vell is old in a way elves are not supposed to be. Her skin has the fine grain of wood. Lichen grows silver at her temples; a fern has rooted in the folds of her shawl, and nobody seems to have had the heart to move it. Her eyes are the green-gold of sunlight through leaves, and they have been watching you since before you came into the clearing.`,
      effects: ['set a1_greenmother_met'],
      next: 'greet',
    },
    greet: {
      speaker: 'a1w_aunra',
      text: [
        { if: 'a1w_warden_wary', text: `“Sit,” she says. “Sefa tells me you came up with your teeth showing. That is all right. Most things do, the first time. The roots have teeth too.” She smiles, and it is the kindest smile you have ever seen, and something about it makes the back of your neck prickle. “Sit, child. You are standing on someone.”` },
        { text: `“Sit,” she says, as though you have been expected for a very long time and are only slightly late. “No — there. You were standing on someone's root, and she is very old and does not care for boots.” When you have sat, she studies you with the frank, unhurried pleasure of a gardener looking at a seedling that has come up somewhere surprising. “There. You see? The trees said you were loud. You are not loud. You are only carrying something loud.”` },
      ],
      interjections: [
        { who: 'orren', text: `Orren has taken off his hat. He holds it in both hands like a boy at a funeral. “Greenmother.” “Hesk's grandson,” says Aunra warmly. “You have her ears. You do not yet have her patience. You will.” Orren turns the colour of a radish and says nothing at all.` },
        { who: 'korr', text: `Korr does not sit. He stands at the edge of the hollow with his arms folded, the way he would stand at the edge of another clan's fire. Aunra inclines her head to him, exactly as deep as an Ashkin elder would. Something in his shoulders unlocks, and he sits.` },
        { who: 'vaelis', text: `Vaelis's wrist-instrument has begun to tick, softly and continuously, like rain on a roof. He covers it with his hand. “My apologies. It has never been this close to anything this old.” “Neither have you, I think,” says Aunra, and he has no answer to that, which may be a first.` },
        { who: 'seris', text: `Seris's hand has strayed to the relic at her throat. It has begun, very faintly, to glow. She covers it quickly. If the Greenmother notices, she is too kind to say so — which, you suspect, is not at all the same as not noticing.` },
        { who: 'ilyra', text: `Ilyra begins the sign of Veyra, then hesitates halfway, unsure whether it is polite here. Aunra answers with a small gesture of her own: a hand turned palm-up, as if testing for rain. “It is the same blessing,” she says. “More or less. Most of them are.”` },
        { who: 'varek', text: `Varek has gone pale. “It's singing,” he murmurs, to nobody. “The tree. In the same key.” He doesn't say the same key as what, and when you look at him he pretends he said nothing.` },
        { who: 'nima', text: `Nima is staring at the fern on the Greenmother's shoulder. The fern, as far as you can tell, is staring back.` },
        { who: 'kael', text: `Kael has found the one patch of shade with a view of both ways out, and leans in it, smiling pleasantly at no one. You notice he has taken his hand off his knife. You notice he noticed you noticing.` },
        { who: 'tessa', text: `Tessa sits cross-legged in the green light with her mouth slightly open, like a child at her first puppet show. For once in her life, she does not seem to have a single thing to say.` },
        { who: 'brakka', text: `Brakka sits with her shield across her knees and her back straight as a door. “Ma'am,” she says, gruffly, the way you'd greet a clan-mother. Aunra looks delighted.` },
      ],
      next: 'hub',
    },
    hub: {
      speaker: 'a1w_aunra',
      text: [
        { if: 'a1w_aunra_deferred', text: `“The Stone first,” says the Greenmother gently. “Then roads. But ask what else you like. I have been sitting here three hundred years. I can wait while you find the right question.”` },
        { text: `“Ask,” she says. “I have been sitting here three hundred years waiting for someone to ask the right question. I can wait while you find it.”` },
      ],
      options: AUNRA_HUB,
    },
    return: {
      speaker: 'a1w_aunra',
      text: [
        { if: 'a1w_aunra_deferred && (a1w_stone_seen || a1_thornwake)', text: `“You have come back,” says Aunra, “and you smell of the ring of pillars. Sit. Tell me.”` },
        { if: 'a1w_aunra_deferred', text: `“Not yet, I think,” says the Greenmother, before you open your mouth. “You have not been to the Stone. I can hear that you haven't. But sit, if you like.”` },
        { text: `“Back again.” The Greenmother looks pleased. “Good. Ask.”` },
      ],
      options: AUNRA_HUB,
    },
    anchors: {
      speaker: 'a1w_aunra',
      text: `She lays one hand flat on the nearest root, the way you might rest a hand on the flank of a sick horse. “Under the Woods there are stones,” she says. “Older than the Woods, though the trees grew up around them and like to pretend otherwise. The Ithari set them — pins, to hold a cloth flat on a table in a high wind. You would call them Anchors. The trees call them the Quiet Places, because near them, the whispering stops.”

A pause. “It is not stopping any more. Seven stones lie under these Woods. Two have broken this year. Three more are cracked. And the one nearest this grove — the Whispering Stone, in the old ring of pillars south of the ford — has begun to scream.”`,
      effects: ['set a1w_anchors_told', 'quest a1w_thornwake stone'],
      next: 'anchors2',
    },
    anchors2: {
      speaker: 'a1w_aunra',
      text: `“Some of it is age. Most of it is hands.” Her voice does not harden; it becomes, if anything, gentler, which is worse. “There is a Thorn-Elder in my Circle, Caddoc Briar, who believes the stones are nails driven through the land's living body, and that the kindest thing is to pull them out. He has pulled two. He would like to pull a third.

“And there are grey-coated men from the Conclave with brass instruments, who come in the night and *mend* the stones. They pour their Aether into the cracks like lead into a split bell. It holds.” She smiles, sadly. “And then it rings wrong forever. Around the stone they mended at Hollin's Dell, the trees no longer grow rings. Every spring there is the same spring. The birds lay the same eggs. The *same* eggs, child.”`,
      effects: ['clue a1w_thornwake dell'],
      interjections: [
        { who: 'vaelis', text: `“A phase lock,” Vaelis says quietly, almost to himself. “They're pinning the Anchor to a single state. Holding it at one moment.” He has gone a bad colour. “That would — yes. That would do exactly that.”` },
        { who: 'orren', text: `Orren is very quiet. “Hollin's Dell. I took the spring path there in Seedmoon. Thought I'd got turned round.” He swallows. “Same nest. Same blackbird. Same song. Three days running.”` },
        { who: 'brakka', text: `“Same eggs,” Brakka repeats, under her breath. She looks like someone has struck her. You remember, then, a hall that grew four hundred years old in a night.` },
      ],
      next: 'hub',
    },
    heart: {
      speaker: 'a1w_aunra',
      text: `For the first time, the Greenmother does not answer at once. She closes her eyes. Around the clearing every root goes still, and in that stillness you hear, for the first time since you came under the trees, nothing whisper at all.

“The oldest trees in this wood grew from seed that came through the Unmaking,” she says at last. “They remember a sound from before they were seeds. A great hush. And then, very far down, a heartbeat.” Her eyes open. They are wet. “You are carrying that heartbeat, child. The trees have been weeping since you crossed the ford — not from fear. From recognition.”`,
      effects: ['set a1w_heart_asked'],
      options: [
        { text: `What is it? What's inside it?`, tone: 'curious', tags: ['curiosity'], next: 'heart_what' },
        {
          text: `(Insight) She knows more than she's saying.`, tone: 'curious', tags: ['knowledge'],
          check: { skill: 'insight', dc: 14, who: 'player' }, success: 'heart_insight_ok', failure: 'heart_insight_fail',
        },
        { text: `Then help me understand it.`, tone: 'compassionate', next: 'heart_what' },
      ],
    },
    heart_what: {
      speaker: 'a1w_aunra',
      text: `“I could tell you what the trees say,” Aunra answers. “But trees speak of grief the way rivers speak of the sea — everything runs there in the end, so everything sounds like it. I will not lay a name on a thing I am not sure of. Names are heavy. You have enough to carry.”

She leans forward and, very gently, touches two fingers to your breastbone, over the place where the Heart's bond sits. Her fingers are cool and dry as bark. “Only this. Whatever is in there is *older than the Veil*. And everything that wants to tear the Veil down, or nail it tighter, will want what you have. Caddoc will want it. The Conclave already does. Be careful whom you let close enough to listen.”`,
      interjections: [
        { who: 'varek', text: `Varek has turned away to stare at the trees, jaw tight. When he speaks, it is very low. “They're louder here.” He does not say who.` },
        { who: 'tessa', text: `Tessa has her book of songs open on her knee and is not writing anything in it, which is how you know she is frightened.` },
        { who: 'ilyra', text: `Ilyra's hand has found yours, briefly, and squeezed, and let go. She doesn't look at you. She looks at the Greenmother as if trying to memorise her.` },
      ],
      next: 'hub',
    },
    heart_insight_ok: {
      speaker: 'dm',
      text: `She knows — or guesses — far more. You see it in the way her hand trembled before she drew it back, the way she looks not at you but at the roots, as if asking their permission. Whatever she suspects frightens her more than Caddoc, more than the Conclave. And she has decided, deliberately and with enormous tenderness, that you are not ready to hear it. You are not sure whether to be grateful.`,
      effects: ['set a1w_aunra_hides'],
      next: 'heart_what',
    },
    heart_insight_fail: {
      speaker: 'dm',
      text: `Her face is calm as a pond on a still day. If there is anything beneath it, you cannot see the bottom.`,
      next: 'heart_what',
    },
    caddoc: {
      speaker: 'a1w_aunra',
      text: `“Caddoc.” She says the name fondly, the way you might speak of a grown son who has stopped writing home. “He was my student once. He hears the trees better than I do now — that is his trouble. He hears them weeping and he cannot bear it, and he has decided that a wound kept closed cannot heal.”

She sighs. “He is not wrong about the wound. He is wrong about the cure. When he pulled the stone at Brackwater, the fog took the village in a night. He carried two children out of it himself, on his back. He has not slept well since. Nor have I.”`,
      effects: ['set a1w_asked_caddoc'],
      next: 'hub',
    },
    acorn: {
      speaker: 'dm',
      text: `As the Greenmother's gaze passes over Orren, it stops — just for a heartbeat — on his coat pocket, and on the hand he has, without realising it, laid over it. Orren looks at you. It is a question. He is asking you, not her.`,
      effects: ['set a1w_acorn_choice'],
      options: [
        { text: `(Nod.) Show her, Orren.`, tone: 'friendly', tags: ['honesty', 'tradition'], next: 'acorn_show' },
        { text: `(Shake your head, very slightly.) Keep it.`, tone: 'pragmatic', tags: ['caution', 'stealth'], next: 'acorn_hide' },
      ],
    },
    acorn_show: {
      speaker: 'dm',
      text: `Orren takes the acorn out and holds it on his open palm. Glossy as a chestnut; in the green light of the hollow it is very faintly, very evenly glowing. Aunra does not reach for it. She does not even lean forward. She simply looks — and the whole Heartwood, every root and every leaf, goes utterly still, the way a congregation goes still when the bell stops.

“Hesk carried it,” she says, very low. “And her mother, and hers. I wondered if it had passed to you.” She looks up at him. “Do not let Caddoc see it. He would plant it in the ruin of every stone in Elyndra and call that healing. Do not let the Conclave near it. And do not plant it yourself. Not yet.” She looks back at the acorn, and her face is unreadable. “It is waiting for something, path-warden. It is not waiting for me.”`,
      effects: ['set a1w_acorn_shown', 'rel orren trust 3', 'memory orren 2 I showed the Greenmother the seed. She told me it is waiting for something.'],
      next: 'hub',
    },
    acorn_hide: {
      speaker: 'dm',
      text: `Orren's hand stays exactly where it is. The Greenmother's gaze moves on, unhurried, to the fern on her own shoulder, which she straightens. “Some things,” she says to nobody in particular, “are better carried than shown. Hesk knew that too.” Beside you, Orren lets out a breath he has been holding since the gate.`,
      effects: ['set a1w_acorn_hidden', 'rel orren trust 4', 'memory orren 2 At the Heartwood you let me keep the seed hidden. Even there.'],
      next: 'hub',
    },
    path_ask: {
      speaker: 'a1w_aunra',
      text: [
        { if: 'maren_forgets', text: `“Valdros.” Aunra turns the name over like a stone from a riverbed. “The white city. Your priest has gone that way ahead of you — the one with ink on her fingers. She walked fast and kept stopping to read from a list of names, as though making sure they were still there. The trees liked her. They do not like many.”

“Before her went grey coats — fourteen of them, with mules and chain — and they did not ask me either. Their instruments pried the way open, and the trees along it have been bleeding sap ever since.” Her mouth thins, very slightly; on that face it is like a shout. “There is a road. My Circle calls it the Old Path. It was laid by the Ithari when these Woods were saplings, and it does not go only *where*. Hesk Mossward used to say it goes *when*.” She regards you steadily. “Every road we open through the Woods is a wound, child. Why should I open one for you?”` },
        { text: `“Valdros.” Aunra turns the name over like a stone from a riverbed. “The white city. Your priest has gone that way ahead of you — the one with ink on her fingers. She walked fast and did not look at the trees. She had a brass compass in her hand, Conclave-made, and it hummed all the way down the Old Path. The trees did not like it.”

“Before her went grey coats — fourteen of them, with mules and chain — and they did not ask me either. Their instruments pried the way open, and the trees along it have been bleeding sap ever since.” Her mouth thins, very slightly; on that face it is like a shout. “There is a road. My Circle calls it the Old Path. It was laid by the Ithari when these Woods were saplings, and it does not go only *where*. Hesk Mossward used to say it goes *when*.” She regards you steadily. “Every road we open through the Woods is a wound, child. Why should I open one for you?”` },
      ],
      effects: ['set a1w_path_asked'],
      interjections: [
        { who: 'kael', if: '!maren_forgets', text: `“A Conclave compass,” Kael repeats, very quietly. “On a cathedral archivist.” He says nothing else. He doesn't need to.` },
      ],
      decision: true,
      options: [
        {
          text: `Because Hollowmere is forgetting itself, and whatever can stop it is in Valdros.`, tone: 'diplomatic', tags: ['diplomacy', 'protect'],
          check: { skill: 'persuasion', dc: 14, advIf: 'rep:verdant>=5 || a1w_sefa_respect' }, success: 'path_yes', failure: 'path_defer',
          voices: { brakka: `Tell her straight. People are forgetting their own families. That's reason enough.` },
        },
        {
          text: `(Nature) The new paths all point at Hollowmere. The Woods are reaching for that town's Anchor. They want this road walked.`, tone: 'curious', tags: ['nature'],
          check: { skill: 'nature', dc: 13, advIf: 'class:druid || class:ranger || comp:orren' }, success: 'path_yes_nature', failure: 'path_defer',
          voices: { orren: `Tell her about the paths. She'll know if it's true. It is.` },
        },
        {
          text: `(Religion) Offer the guest-rite of the old groves: empty hands, and a debt named aloud.`, tone: 'class', tags: ['faith', 'tradition'],
          check: { skill: 'religion', dc: 14, advIf: 'class:cleric || class:paladin || class:druid' }, success: 'path_yes_rite', failure: 'path_defer',
          voices: { ilyra: `There's a rite for this. Older than my temple. Hands open, debt spoken.`, seris: `Honour her customs. We are guests.` },
        },
        {
          text: `(Insight) You're not testing whether we deserve the road. You're testing whether you can still trust anyone.`, tone: 'curious', tags: ['honesty'],
          check: { skill: 'insight', dc: 13, who: 'player' }, success: 'path_yes_insight', failure: 'path_defer',
        },
        {
          text: `Orren — tell her about your grandmother's road.`, if: 'comp:orren', tone: 'friendly', tags: ['nature', 'tradition'], next: 'path_orren',
          voices: { orren: `Let me. Please.` },
        },
        {
          text: `[Resonance] Lay your hand on the Heartwood beside hers, and listen with her. (Spend 1 Resonance)`, if: 'resunlocked && res>=1', tone: 'resonance', tags: ['curiosity', 'nature'],
          effects: ['res -1', 'instab 1', 'set a1w_heartwood_vision'], next: 'path_res',
          voices: { vaelis: `Use it. Show her what you are. It's the only argument she can't doubt.`, nima: `Do the glowy thing!` },
        },
        {
          text: `The Circle has called me friend before. Let that be the reason.`, if: 'reptier:verdant=Trusted || reptier:verdant=Allied', tone: 'diplomatic', tags: ['tradition'], next: 'path_yes_rep',
        },
        {
          text: `We don't have time for riddles. Show us the road, or we'll find it ourselves.`, tone: 'aggressive', tags: ['boldness', 'defiance'],
          effects: ['set a1w_aunra_angered', 'rep verdant -10'], next: 'angry',
          voices: { korr: `We are wasting the day. Ask her plainly.`, nima: `Oh, just *ask* her for the road!` },
        },
      ],
    },
    path_defer: {
      speaker: 'a1w_aunra',
      text: `She shakes her head — not unkindly. “Pretty words. True ones, even. But I have heard true words from the Conclave, and from Caddoc, and the stones go on breaking.” She points south and west, past the ford. “Go to the Whispering Stone. Lay your hand on it, or your eyes, or whatever you trust most. See what is being done to it, and by whom. Then come back and tell me what you saw — and what you did. I will know a great deal about you by what you did.”`,
      effects: ['set a1w_aunra_deferred', 'quest a1w_thornwake stone'],
      options: [
        { text: `Then we'll go to the Stone.`, tone: 'friendly', end: true },
        {
          text: `We don't have time for errands.`, tone: 'aggressive', tags: ['boldness', 'defiance'],
          effects: ['set a1w_aunra_angered', 'rep verdant -10'], next: 'angry',
        },
      ],
    },
    angry: {
      speaker: 'dm',
      text: `The clearing goes very quiet. Even the fern on her shoulder seems to draw back. Aunra Vell looks at you for a long moment with an expression you will remember on bad nights: not anger. A disappointment so old and so patient that it has worn smooth.

“Then find it,” she says, and closes her eyes. Behind you, Sefa's bowstring creaks. “Sefa will see you out. Gently, Sefa.”

The roots do not trip you on the way down. You suspect that is a courtesy, and that it could be withdrawn.`,
      interjections: [
        { who: 'orren', text: `Orren walks out beside you without a word. At the gate he stops, turns, and gives the grove a long, low path-warden's bow. Then he catches you up. “Grandmother's marks,” he says quietly. “There's a waystone on the east road. If anyone can read her marks, I can.” He does not sound sure.`, effects: ['rel orren trust -2'] },
        { who: 'korr', text: `“She is right to be angry,” Korr says on the way down. Then: “We will find the road. Ashkin find water in glass. I can find a road in trees.”` },
        { who: 'kael', text: `“Well,” Kael says brightly, once you're out of bowshot. “That could have gone better. In my professional opinion.”` },
        { who: 'seris', text: `Seris says nothing until the gate. Then: “She was owed courtesy. We gave her none.” It is the closest she comes to a rebuke, and it is close enough.` },
      ],
    },
    path_yes: {
      speaker: 'a1w_aunra',
      text: `She looks at you a long time. Then she nods once, as if a scale has settled. “Yes. That is a reason a tree would understand. Trees grow toward what is dying, sometimes. To hold the soil together.”`,
      next: 'path_show',
    },
    path_yes_nature: {
      speaker: 'a1w_aunra',
      text: `“You have been listening.” Something like delight warms her whole face. “Yes. They lean toward your town the way a sick dog leans against a door — they want someone to go through. Very well. Someone shall.”`,
      next: 'path_show',
    },
    path_yes_rite: {
      speaker: 'a1w_aunra',
      text: `You hold out your empty hands and name the debt aloud: a road, owed back in kind, when the Circle calls. The Greenmother's eyebrows rise a fraction. “No one has offered the guest-rite in this grove in a hundred and forty years,” she says. “Your temples kept more than they know.” She lays her palms over yours, dry and light as leaves. “The debt is heard. Do not forget it. *We* will not.”`,
      effects: ['set a1w_circle_debt', 'rep verdant 3'],
      next: 'path_show',
    },
    path_yes_insight: {
      speaker: 'a1w_aunra',
      text: `For the first time, the Greenmother laughs — a small, surprised sound, like a bird startled out of a hedge. “Oh, child,” she says. “That is a very rude thing to say to an old woman. It is also true.” She wipes her eyes. “Caddoc was my student. The Conclave were my guests. I have been wrong about two people this year. I should like not to be wrong about you.”`,
      next: 'path_show',
    },
    path_yes_rep: {
      speaker: 'a1w_aunra',
      text: `“The Circle has spoken of you,” she says. “Not all of it kindly. Enough of it.”`,
      next: 'path_show',
    },
    path_orren: {
      speaker: 'comp:orren',
      text: `Orren steps forward, turning his hat in his hands. “Grandmother walked every path in these Woods,” he says, “and spent forty years looking for one more. Said it went *somewhen*. Said when she found it, she'd walk it with someone worth the walking.” He looks at the ground, then up at Aunra. “She didn't find it. I'd like to. With them.”

Aunra is quiet for a long moment. “Hesk found it,” she says softly. “Thirty years ago. She came up this hill and sat where you are standing and told me so. Then she said it wasn't hers to walk alone, and went home.” She smiles at Orren with enormous tenderness. “I think she was waiting for you to be ready to be told.”`,
      effects: ['rel orren trust 4', 'rel orren affection 3', 'memory orren 3 The Greenmother told me Grandmother found the Old Path after all.'],
      next: 'path_show',
    },
    path_res: {
      speaker: 'dm',
      text: `You lay your palm on the Heartwood beside hers. The bark is warm. Then it is not bark.

You are standing in the same clearing, and it is not a clearing. It is a square paved in green glass, and the Heartwood is a sapling in a bronze ring at its centre, and around it children are singing in a language with no hard sounds in it at all. A woman in a sea-blue coat is tying ribbons to the sapling's branches, one for each child. She turns, and sees you, and smiles as though she had been expecting you — and then the green glass goes grey, and the singing goes on for a moment after the children have stopped being there, and then that stops too.

The Heartwood remembers. It has been remembering every day for three thousand years.

When you take your hand away, Aunra is watching you. “Now you have heard them,” she says quietly. “Now you know why I am patient with Caddoc. And why I cannot agree with him.”`,
      interjections: [
        { who: 'vaelis', text: `Vaelis's instrument has stopped ticking. He taps it. Nothing. “It's showing a date,” he says faintly. “It isn't one of ours.”` },
        { who: 'varek', text: `Varek is gripping a root as though the ground has tilted. “They sang,” he says hoarsely. “For a second, they all sang the *same song*.” He lets go, and will not explain.` },
      ],
      next: 'path_show',
    },
    stone_report: {
      speaker: 'a1w_aunra',
      text: [
        { if: 'a1_thornwake=helped', text: `“I know,” she says, before you can speak. “I felt it go. Like a tooth pulled in the dark.” She is quiet a long while. “You chose Caddoc's grief over mine. I do not think you chose lightly.” She sighs, and rises, slowly, with a sound like a branch in wind. “I said I would know you by what you did. I do. The road is yours anyway. Come.”` },
        { if: 'a1_thornwake=stopped', text: `“I know.” She closes her eyes. “You stood between my student and the stone. Thank you. I wish with all my heart it had not needed doing.” When she opens them again they are bright. “I said I would know you by what you did. Come. The road is yours.”` },
        { if: 'a1_thornwake=bargained', text: `“I know. You made them *talk*.” She laughs, a little ruefully. “Do you know how long I have been trying to make Caddoc talk? Ten years. You did it in an evening.” She rises, slowly, with a sound like a branch in wind. “Come. You have earned a road.”` },
        { text: `You tell her about the scream under hearing, the leaves that fall upward, the brace of brass and silver bolted into the basalt. She listens without interrupting. When you finish, she is quiet a long while. “Then you have seen enough to be afraid of the right things,” she says. “That will do. Come.”` },
      ],
      next: 'path_show',
    },
    path_show: {
      speaker: 'dm',
      text: `Aunra rises. It takes a while; she does it the way a tree would, if trees decided to stand. She walks you to the eastern edge of the clearing, where the Heartwood's roots go down into the ground in a long staggered line like the steps of a stair, and lays her hand on the last of them.

The Woods *move*.

Not much. A shoulder-shrug of trunks and bracken. But when it is over there is a path running away east beneath the trees that was not there before — narrow, mossed, edged with white stones worn round as eggs, and so plainly old that your eyes keep insisting it has always been there and you simply failed to notice.

“The Old Path,” says the Greenmother. “It will take you to Valdros. Walk it remembering where you came from, or it will take you somewhere else.” She presses something into your hand: a knot of rowan twigs bound in green thread. “So the trees know you are a guest. Go carefully, child. The white city is not sure what year it is.”`,
      effects: [...OLD_PATH, 'give a1w_rowan_knot', 'xp 150', 'rep verdant 5', 'clue a1w_thornwake dell'],
      interjections: [
        { who: 'orren', text: `Orren is staring at the path the way you have seen people stare at the sea. “Grandmother's road,” he whispers. He does not move for a long moment. Then he takes out a length of red cord and ties it, very carefully, round the first white stone.` },
        { who: 'korr', text: `Korr crouches and lays his palm flat on one of the white stones, and holds it there. “Warm,” he says. “Like a hearthstone. Someone lived on this road once.”` },
        { who: 'vaelis', text: `“Ithari waymarkers,” Vaelis breathes. “Charter-era. *In situ*. Do you know how many of these survive? Four. Four in the whole of — five,” he corrects himself, counting. “Seventeen. Oh, I need to sit down.”` },
        { who: 'tessa', text: `“A road that goes *when*,” Tessa says softly. “I've got a song about one of those. It's got no ending. I always thought somebody lost the last verse.”` },
        { who: 'seris', text: `Seris kneels at the first white stone and bows her head, as she would at a wayside shrine. When she rises, she does not explain, and nobody asks.` },
      ],
      options: [
        { text: `I have more questions, Greenmother.`, tone: 'curious', next: 'after_hub' },
        ...close(`Thank you, Greenmother.`, 'friendly'),
      ],
    },
    angered: {
      speaker: 'dm',
      text: `The Greenmother sits with her eyes closed. The roots around her are still. Warden Sefa stands at her shoulder, and does not quite point an arrow at you.`,
      options: [
        {
          text: `I spoke to you like a bailiff. I was wrong, and I'm sorry.`, tone: 'compassionate', tags: ['honesty', 'diplomacy'],
          check: { skill: 'persuasion', dc: 15 },
          successEffects: ['unset a1w_aunra_angered', 'set a1w_aunra_deferred', 'rep verdant 5', 'quest a1w_thornwake stone'], success: 'apology_ok',
          failure: 'apology_fail', once: true,
        },
        {
          text: `I've been to the Whispering Stone. It's done.`, if: 'a1_thornwake', tone: 'diplomatic',
          effects: ['unset a1w_aunra_angered', 'rep verdant 5'], next: 'stone_report',
        },
        {
          text: `Orren — would you speak for us?`, if: 'comp:orren', tone: 'friendly', tags: ['tradition'],
          effects: ['unset a1w_aunra_angered', 'set a1w_aunra_deferred', 'quest a1w_thornwake stone'], next: 'apology_orren',
        },
        { text: `(Leave quietly.)`, tone: 'leave', end: true },
      ],
    },
    apology_ok: {
      speaker: 'a1w_aunra',
      text: `Her eyes open. “Thank you,” she says simply. “Apologies are seeds. They do not look like much.” She folds her hands. “Go and look at the Whispering Stone, south of the ford. Then come back, and we will speak of roads.”`,
      options: close(`We'll go.`, 'friendly'),
    },
    apology_fail: {
      speaker: 'a1w_aunra',
      text: `She does not open her eyes. “Sefa,” she says mildly, “I believe our guests were leaving.”`,
    },
    apology_orren: {
      speaker: 'comp:orren',
      text: `Orren goes and kneels by the Greenmother's seat, and speaks to her very low for a long time. You catch only scraps: *Grandmother. Hollowmere. The bell.* And once, clearly: *They came down into the fog for strangers.* When he is done, Aunra opens her eyes and looks past him at you. “Hesk's grandson vouches for you,” she says. “So. Go to the Whispering Stone. See it. Then come back, and we will speak of roads.”`,
      effects: ['rel orren trust 2'],
      options: close(`Thank you, Orren.`, 'friendly'),
    },
    after: {
      speaker: 'a1w_aunra',
      text: [
        { if: 'a1w_aunra_angered', text: `Aunra opens her eyes as you approach. “You found it without me,” she says. “Hesk's marks, or the woodcutters' cords?” She almost smiles. “The Woods have always had more doors than I have keys. Sit, if you like. I am not angry any more. I am too old to stay angry at weather.”` },
        { if: 'a1_stone=broken', text: `“The Whispering Stone is gone,” she says, when you come. “I can hear the place where it was. Like a missing tooth, when you put your tongue to it.” She folds her hands. “Sit, if you like.”` },
        { if: 'a1_stone=mended', text: `“Listen,” says the Greenmother, before you can speak. You listen. Far off, past the ford, something is humming — slow and deep, like bees in a lime tree. She smiles. “I have not heard that in eleven years. Sit, child. Ask.”` },
        { text: `“Still here?” says the Greenmother, pleased. “Good. The Woods like you, a little. Ask, if you wish.”` },
      ],
      effects: ['unset a1w_aunra_angered'],
      next: 'after_hub',
    },
    after_hub: {
      speaker: 'a1w_aunra',
      text: `“Ask.”`,
      options: [
        { text: `What is happening to the Woods?`, if: '!a1w_anchors_told', tone: 'curious', next: 'anchors_late' },
        { text: `You know what I'm carrying, don't you?`, if: '!a1w_heart_asked', tone: 'curious', next: 'heart' },
        { text: `What will happen to Caddoc now?`, if: 'a1_thornwake', once: true, tone: 'curious', next: 'caddoc_now' },
        ...close(`Farewell, Greenmother.`),
      ],
    },
    anchors_late: {
      speaker: 'a1w_aunra',
      text: `“Stones under the Woods, cracking. Some from age. Most from hands — Caddoc's Thornwake pulling them out, the Conclave nailing them tighter.” She sighs. “Go and look at the Whispering Stone, south of the ford, and you will understand it better than any words of mine.”`,
      effects: ['set a1w_anchors_told', 'quest a1w_thornwake stone', 'set a1w_asked_caddoc'],
      next: 'after_hub',
    },
    caddoc_now: {
      speaker: 'a1w_aunra',
      text: [
        { if: 'a1w_caddoc_fate=killed', text: `For a long time she says nothing at all. “I taught him to listen to the trees,” she says at last. “I will listen to them for him, now.” She does not look at you again.` },
        { if: 'a1w_caddoc_fate=moot', text: `“He is here, in the Moot. He sleeps a great deal. When he wakes he argues with me, and I argue back, and some evenings we nearly agree.” A small, tired smile. “It is the most we have spoken in ten years. Thank you for bringing him home.”` },
        { if: 'a1w_caddoc_fate=exiled', text: `“Gone west, they say. Toward the mountains.” She looks at the roots. “There are stones there too. I hope he only listens to them.”` },
        { if: 'a1_thornwake=helped', text: `“He will go to the next stone, and the next.” She does not sound angry. She sounds like someone watching weather come in. “And now he has a story to tell his people: the Heart-bearer stood with us. Remember that you gave it to him.”` },
        { if: 'a1_thornwake=bargained', text: `“He has asked for a Moot. A true one, the whole Circle, the first in sixty years.” Her eyes are bright. “We will shout at each other for a month. And then, perhaps, we will listen.”` },
        { text: `“He will sulk at his fire, and count his thorns, and wait for the next thin hour.” She sighs. “And I will wait with him, as I always have.”` },
      ],
      next: 'after_hub',
    },
  },
};

// ───────────────────────────────────────────────────────────── the quartermaster

const DUNLA: DialogueTree = {
  id: 'a1w_dunla',
  title: 'Dunla Reedwhistle',
  start: [{ if: 'a1w_dunla_met', node: 'hub' }, { node: 'first' }],
  nodes: {
    first: {
      speaker: 'dm',
      text: `Under a canvas awning at the edge of the grove, a stout halfling woman in a leaf-green apron is sorting dried herbs into jars at a speed which suggests the herbs are in trouble if they don't cooperate.`,
      effects: ['set a1w_dunla_met'],
      next: 'greet',
    },
    greet: {
      speaker: 'a1w_dunla',
      text: `“Dunla Reedwhistle. Quartermaster to the Heartwood — which mostly means I'm the one who remembers to order salt.” She looks you over with a professional eye. “You look like people who are about to bleed. Salves on the left. Don't touch the jar with the face on it.”`,
      interjections: [
        { who: 'orren', text: `“Orren Mossward, you are thinner than last winter,” says Dunla, and hands him a biscuit without asking. He eats it without arguing. You get the impression this has happened many times before.` },
      ],
      next: 'hub',
    },
    hub: {
      speaker: 'a1w_dunla',
      text: `“Well? Bleeding, buying, or both?”`,
      options: [
        { text: `Show me what you have.`, tone: 'pragmatic', effects: ['shop a1w_heartwood_stores'], end: true },
        { text: `The jar with the face on it?`, once: true, tone: 'curious', tags: ['curiosity'], next: 'jar' },
        { text: `What's good against gloam stalkers?`, once: true, tone: 'pragmatic', next: 'stalkers' },
        { text: `Thank you, Dunla.`, tone: 'leave', end: true },
      ],
    },
    jar: {
      speaker: 'a1w_dunla',
      text: `“Gloamroot. Came up in the hollow after the summer. It's thinking about something.” She turns the jar so the face is towards the wall. “Whatever it's thinking, I'd rather it thought it facing that way.”`,
      next: 'hub',
    },
    stalkers: {
      speaker: 'a1w_dunla',
      text: `“Light. They come from somewhere the sun never got up in the morning, poor things — a brand in the face and they'll think twice. Antitoxin for the bite; it numbs, and you'll want feeling in your legs to run.” She sniffs. “And don't follow voices into the hollow. Whatever voice it's in.”`,
      next: 'hub',
    },
  },
};

// ───────────────────────────────────────────────────────────── the Whispering Stone

const STONE_WORK: DialogueOption[] = [
  {
    text: `(Arcana) Study the brace.`, if: '!a1w_brace_known && !a1w_brace_removed', tone: 'curious', tags: ['knowledge'],
    check: { skill: 'arcana', dc: 13, advIf: 'comp:vaelis || class:wizard' },
    successEffects: ['set a1w_brace_known', 'clue a1w_thornwake brace'], success: 'arcana_ok', failure: 'arcana_fail',
  },
  {
    text: `(Nature) Study the ground: the trees, the leaves, the soil.`, if: '!a1w_stone_nature', tone: 'curious', tags: ['nature'],
    check: { skill: 'nature', dc: 12, advIf: 'comp:orren' },
    successEffects: ['set a1w_stone_nature'], success: 'nature_ok', failureEffects: ['set a1w_stone_nature'], failure: 'nature_fail',
  },
  {
    text: `[Resonance] Lay your hand on the Stone and see what it holds back. (Spend 1 Resonance)`, if: 'resunlocked && res>=1 && !a1w_stone_glimpsed',
    tone: 'resonance', tags: ['curiosity', 'forbidden'],
    effects: ['res -1', 'instab 1', 'set a1w_stone_glimpsed', 'clue a1w_thornwake glimpse'], next: 'glimpse',
  },
  {
    text: `(Arcana) Work the bolts loose and take the brace off.`, if: 'a1w_brace_known && !a1w_brace_removed && !a1w_brace_failed', tone: 'pragmatic', tags: ['defiance', 'nature'],
    check: { skill: 'arcana', dc: 15, advIf: 'comp:vaelis' },
    successEffects: ['set a1w_brace_removed', 'rep conclave -5', 'give a1w_conclave_brace', 'xp 75'], success: 'brace_off',
    failureEffects: ['damage 2d6 force', 'instab 1', 'set a1w_brace_failed'], failure: 'brace_fail',
  },
  {
    text: `(Sleight of Hand) Pick the bolts with thieves' tools, one by one.`, if: 'a1w_brace_known && !a1w_brace_removed && item:thieves_tools', tone: 'pragmatic', tags: ['defiance'],
    check: { skill: 'sleightOfHand', dc: 14 },
    successEffects: ['set a1w_brace_removed', 'rep conclave -5', 'give a1w_conclave_brace', 'xp 75'], success: 'brace_off',
    failureEffects: ['damage 1d6 force', 'set a1w_brace_failed'], failure: 'brace_fail',
  },
];

const STONE_OPTIONS: DialogueOption[] = [
  ...STONE_WORK,
  {
    text: `[Resonance] Reach into the Stone and help it find its own note again. (Spend 1 Resonance)`, if: 'a1_stone=left && a1w_brace_removed && resunlocked && res>=1',
    tone: 'resonance', tags: ['nature', 'protect'], effects: ['res -1', 'set a1_stone mended', 'rep verdant 3', 'xp 100'], next: 'mend_res',
  },
  {
    text: `(Arcana) Re-tune the Stone by hand, the way the clamp did — but gently.`, if: 'a1_stone=left && a1w_brace_removed && !a1w_mend_tried',
    tone: 'curious', tags: ['knowledge', 'protect'], check: { skill: 'arcana', dc: 16, advIf: 'comp:vaelis' },
    successEffects: ['set a1_stone mended', 'rep verdant 3', 'xp 100'], success: 'mend_arcana',
    failureEffects: ['set a1w_mend_tried', 'instab 1'], failure: 'mend_fail',
  },
  { text: `Leave the Stone.`, tone: 'leave', effects: ['quest a1w_thornwake camp'], next: 'leave_stone' },
];

const STONE: DialogueTree = {
  id: 'a1w_stone',
  title: 'The Whispering Stone',
  start: [
    { if: 'a1_stone=broken', node: 'broken' },
    { if: 'a1_stone=mended', node: 'mended' },
    { if: 'a1_thornwake', node: 'left' },
    { if: 'a1w_stone_seen', node: 'study' },
    { node: 'first' },
  ],
  nodes: {
    first: {
      speaker: 'dm',
      text: `The ring of pillars stands in a hollow of the Woods where nothing grows taller than your knee: six of them, Ithari-white, leaning together like old men sharing a secret. In the middle stands the Whispering Stone.

It is basalt, black as wet slate, three times your height and veined with a pale light that pulses — not steadily, but in stutters, the way a heart does when it has been frightened too long. The leaves around its foot fall *up*, drift a little way, and settle back. Moss will not touch it. And bolted into its western face, about the height of your heart, is something that does not belong here at all: a brace of brass and silver, sigil-etched, clamped into the rock with six iron bolts. Around each bolt the basalt has cracked, and a thin light weeps from the cracks like sap.

Up close, the whispering of the Woods has stopped. In its place is a sound just under hearing. It takes you a moment to understand that it is the Stone, and that it is screaming.`,
      effects: ['set a1w_stone_seen', 'quest a1w_thornwake stone'],
      interjections: [
        { who: 'vaelis', text: `Vaelis has gone white. He walks to the brace very slowly and puts out one hand, and does not touch it. “That's a Cael lattice,” he says. His voice is perfectly level, which is how you know something is very wrong. “Harmonic clamp. Fourth order. I—” He stops. “I know this mathematics. I know it extremely well.” He does not explain, and when you look at him, he will not look back.`, effects: ['set a1w_vaelis_brace'] },
        { who: 'seris', text: `The relic at Seris's throat is glowing through her fingers now, hot enough that she hisses and lets it go. It hangs against her breastplate, pulsing — in time, you realise, with the Stone. Seris stares down at it. She says nothing at all.` },
        { who: 'orren', text: `Orren won't come inside the ring. He stands at its edge, between two pillars, with his hand over his pocket. “Grandmother brought me here when I was small,” he says. “It used to hum. Like bees. Like a lullaby.” He swallows. “That's not humming.”` },
        { who: 'korr', text: `Korr's lip has drawn back from his teeth. “A beast in a snare sounds like that,” he says. “Before you cut its throat.”` },
        { who: 'varek', text: `“The Choir's gone quiet,” Varek murmurs. “It never goes quiet.” A pause. “It's *listening*.”` },
        { who: 'nima', text: `Nima's sparks have all gone out. She shakes her fingers, puzzled. Nothing. “Huh,” she says, very small.` },
      ],
      next: 'study',
    },
    study: {
      speaker: 'dm',
      text: [
        { if: 'a1w_brace_removed', text: `The Stone moans in its ring of pillars, breathing in long, ragged pulses. Without the brace, it sounds less like a scream and more like a sleeper in a fever.` },
        { text: `The Stone screams on, under hearing, in its ring of white pillars.` },
      ],
      options: STONE_OPTIONS,
    },
    arcana_ok: {
      speaker: 'dm',
      text: `It is beautiful work, which makes it worse. The brace is a harmonic clamp: it finds the Stone's own note — the one it has been singing for three thousand years — and *pins* it. Holds it at a single, perfect, unchanging pitch, like holding one note of a song forever. But the Stone was built to breathe, to flex as the Veil flexes. This one cannot. Every time the Veil pulls on it, the clamp pulls back, and the basalt cracks a little more.

The Conclave did not break this Anchor. They mended it. It is the mending that is killing it.`,
      interjections: [
        { who: 'vaelis', text: `“It's a good design,” Vaelis says hollowly. “An *elegant* design. It assumes the Veil is a machine.” He laughs without any humour at all. “Someone was very sure of that, once.”` },
        { who: 'kael', text: `Kael whistles low. “Six bolts. Brass and silver. Someone in a grey coat signed a requisition for this.” He tilts his head. “Someone's going to be very cross if it walks off.”` },
      ],
      next: 'study',
    },
    arcana_fail: {
      speaker: 'dm',
      text: `You lean in to trace the sigils, and the brace notices you. A crack of blue-white light leaps from the nearest bolt to your fingertips and throws you flat in the bracken. When the stars clear, the Stone is still screaming, and your hand smells of struck flint.`,
      effects: ['damage 1d6 force'],
      next: 'study',
    },
    nature_ok: {
      speaker: 'dm',
      text: `The trees inside the ring are dying from the inside out — not rotting, but *stopping*. The newest growth on every branch is exactly the same length. You snap a dead twig, and the rings inside are perfectly, impossibly even, as though one year had been grown over and over. Outside the ring, the Woods lean *away* from the Stone like people edging back from a fever-bed. Something is badly wrong with the land here, and it is worse with every pulse.`,
      next: 'study',
    },
    nature_fail: {
      speaker: 'dm',
      text: `The ground tells you it is ground. The trees are trees. The leaves keep falling upward, and you could not for the life of you say why.`,
      next: 'study',
    },
    glimpse: {
      speaker: 'dm',
      text: `You lay your palm against the basalt below the brace, and the scream goes through you like cold water.

And then you are on the other side of it.

You are standing in this same hollow, and there are no Woods. There is a town: low white houses roofed in blue tile, a market, a well with a bronze lid, washing strung between windows. People. Hundreds of people, lantern-carrying, half-made, their faces blurred like faces in a fogged mirror, pressed up against the air where the Stone stands as though against a pane of glass. They are not angry. They are not trying to break through. They are only *looking*, the way you might look through a window at a room you used to live in.

Behind them, much further back, the town frays into something that is not dark and not light — a margin, a blank, the edge of a page — and the blank is moving, tide-slow, and wherever it touches, a house stops having ever been there.

The Stone is all that holds it back. Every pulse, it pushes. Every pulse, it cracks.

One of the half-made people, a little boy with a wooden bird in his fist, raises his free hand and waves at you.

You come back on your knees in the leaves.`,
      interjections: [
        { who: 'ilyra', text: `Ilyra is kneeling beside you, two fingers on your wrist. “You're back,” she says. “You went somewhere cold. Your lips are blue.” She does not let go for a while.` },
        { who: 'brakka', text: `Brakka hauls you to your feet. “What did you see?” And when you tell her, she sits down hard on a fallen pillar and says nothing for a long time.` },
        { who: 'tessa', text: `Tessa is humming under her breath, a tune with no hard notes in it anywhere. She stops when she realises. She has no idea where she learned it.` },
        { who: 'varek', text: `Varek is watching you with an expression you cannot read. “Did they see you?” he asks. Then, before you can answer: “No. Don't tell me.”` },
      ],
      next: 'study',
    },
    brace_off: {
      speaker: 'dm',
      text: `It takes a quarter of an hour and every bit of nerve you own. The bolts come out one by one, each with a shriek of protesting light; on the last, the whole brace drops into the leaves, smoking.

The Stone shudders — and then, for the first time since you entered the ring, it *breathes*. The pulse slows. Steadies. The scream sinks to a moan, and the moan to something that is almost, almost a hum. Inside the ring a single leaf, falling upward, changes its mind and drifts down.

It is not mended. The cracks are still there. But it is no longer being strangled.`,
      interjections: [
        { who: 'orren', text: `Orren has stepped inside the ring at last. He lays his palm against a pillar and closes his eyes. “Bees,” he says, very softly. “Far off. But bees.”`, effects: ['rel orren trust 2'] },
        { who: 'vaelis', text: `Vaelis lifts the brace out of the leaves with two fingers, turns it over, and finds the maker's stamp on the underside. Whatever it says, he hands the thing back to you without a word, and does not meet your eyes for some time.` },
        { who: 'seris', text: `Seris's relic has stopped burning. She touches it, warily, then looks at the Stone. “It was in pain,” she says. “I did not know stones could be in pain.” She does not sound as though she likes knowing.` },
      ],
      next: 'study',
    },
    brace_fail: {
      speaker: 'dm',
      text: `The fourth bolt bites back. Light jumps up your arms like a dog going for your throat; when it lets go you are ten feet away, your teeth aching, and the bolts are back in their sockets tighter than before. The Stone's scream climbs a note. Somewhere in the Woods, every bird goes up at once. Whatever you try next, it will not be that.`,
      next: 'study',
    },
    leave_stone: {
      speaker: 'dm',
      text: [
        { if: 'a1_thornwake', text: `You leave the Stone in its ring of white pillars. Behind you, it breathes on.` },
        { if: 'a1w_caddoc_met', text: `You turn to go. Behind you the Stone pulses on in its ring of pillars. Caddoc said: moonrise.` },
        { text: `As you turn to go, you notice what the scream kept you from seeing: tracks in the soft earth at the edge of the ring. Bare feet, a lot of them. Paws, too, far too large for any wolf. Thorn-scratches on the pillars, fresh as this morning, and cut into the tallest pillar a sigil you will learn to know well: a ring of thorns, broken at the top. The tracks lead south-east.` },
      ],
      options: close(`(Go.)`),
    },
    left: {
      speaker: 'dm',
      text: [
        { if: 'a1w_brace_removed', text: `The Whispering Stone stands in its ring of pillars, breathing in long ragged pulses — no longer strangled, not yet well. Cracks of light run through the basalt like veins in an old hand.` },
        { text: `The Whispering Stone stands in its ring of pillars, the Conclave's brace still bolted into its side, screaming under hearing as it has for months. Nobody is going to break it tonight. Nobody has saved it, either.` },
      ],
      options: STONE_OPTIONS,
    },
    mend_res: {
      speaker: 'dm',
      text: `You lay both hands on the basalt and go looking for its note.

It is a long way down. Past the cracks, past the scars the bolts left, past three thousand years of holding — and there it is, faint as a hum heard through a wall: the song the Stone was made to sing. Not one note. A chord that shifts and breathes, the way the Woods breathe. You let the Heart beat once, in time with it, and the Stone remembers.

The hum swells. The cracks fill with light, and the light cools to silver, and the silver sets. Inside the ring, every leaf falls the right way at once, like a held breath let go.`,
      interjections: [
        { who: 'orren', text: `Orren is laughing, quietly, with his forehead against a pillar. “Bees,” he says. “Close, now. A whole hive.”`, effects: ['rel orren affection 3', 'memory orren 3 We mended the Whispering Stone. It hums again, like when I was small.'] },
        { who: 'nima', text: `Nima's sparks come back all at once, in a shower that makes her yelp. “It *likes* us,” she says, delighted. “I think the stone likes us!”` },
      ],
      options: close(`(Leave it humming.)`),
    },
    mend_arcana: {
      speaker: 'dm',
      text: `It takes until the stars are out. You work as the brace worked, finding the Stone's note — but instead of pinning it, you coax it: a nudge here, a loosening there, letting the chord shift and breathe as it was built to. Twice it slips away from you. The third time it holds.

The Stone hums. The cracks are still there, but they have the look of a bone that has set: stronger, a little crooked, alive.`,
      interjections: [
        { who: 'vaelis', text: `Vaelis, who has been reading the hum off his instrument and calling numbers to you all evening, sits down in the leaves when it's over. “Not a lock,” he says. “A *tuning*. We let it breathe.” He looks at the brace in your pack. “Nobody in the Citadel would have thought to try that. I wouldn't have. Once.”` },
      ],
      options: close(`(Leave it humming.)`),
    },
    mend_fail: {
      speaker: 'dm',
      text: `The note slides away from you like a fish in dark water. The Stone shudders, and the cracks flare, and when it settles it is no worse — but no better, either. Someone with more skill, or something stranger than skill, might do better.`,
      options: close(`(Step back.)`),
    },
    broken: {
      speaker: 'dm',
      text: `Where the Whispering Stone stood there is a shallow crater of black glass, and in the crater nothing grows, and above it the air ripples like heat over a summer road. Sometimes, from the corner of your eye, there is a white house with a blue roof on the far side of the ripple, and a well with a bronze lid. Sometimes there is nothing at all, which is worse.

The Woods are louder here than anywhere. You can almost make out the words.`,
      options: close(`(Leave.)`),
    },
    mended: {
      speaker: 'dm',
      text: `The Whispering Stone hums: a deep, slow, contented sound, like bees in a lime tree in high summer, and the leaves at its foot fall the right way. The cracks are still there — silver seams in the black — but they have healed over the way a bone heals: stronger, a little crooked, alive.`,
      options: close(`(Leave it humming.)`),
    },
  },
};

// ───────────────────────────────────────────────────────────── the Thornwake camp

const RUE: DialogueTree = {
  id: 'a1w_rue',
  title: 'The Thornwake Sentry',
  start: [{ if: 'a1w_rue_met', node: 'again' }, { node: 'first' }],
  nodes: {
    first: {
      speaker: 'dm',
      text: `A girl of perhaps sixteen drops out of a yew in front of you with a short spear and the expression of someone who has practised this moment in her head many times. Brambles are braided through her hair. Some of them are still flowering.`,
      effects: ['set a1w_rue_met', 'quest a1w_thornwake camp'],
      next: 'challenge',
    },
    challenge: {
      speaker: 'a1w_rue',
      text: `“Thornwake ground. State your business or go back to your towns.” Her voice cracks on *towns*. She scowls, as though it betrayed her on purpose.`,
      options: [
        { text: `We're here to see Caddoc Briar.`, tone: 'diplomatic', next: 'pass' },
        { text: `Where are you from, Rue?`, once: true, tone: 'compassionate', tags: ['mercy'], next: 'home' },
        { text: `(Leave.)`, tone: 'leave', end: true },
      ],
    },
    home: {
      speaker: 'a1w_rue',
      text: `“How do you know my— oh. The trees.” She lifts her chin. “Brackwater. It isn't there any more. The fog came the night the stone broke. Caddoc carried me out on his back, and my brother. My mother was—” She stops. “He said he was sorry. He said it would've come anyway, slower and worse. He said it was a wound that had to be opened.” She looks at you, defiant and sixteen. “I believe him. I have to, don't I?”`,
      interjections: [
        { who: 'ilyra', text: `“You don't *have* to,” Ilyra says gently. “But you're allowed to.” Rue stares at her, and for a moment her face crumples, and then she has it back under control.` },
        { who: 'korr', text: `Korr looks at the girl for a long moment. “He went back for your mother,” he says. It isn't a question. Rue nods, once, fiercely. Korr nods back. “Then he is a man,” he says, and that is all.` },
        { who: 'brakka', text: `Brakka's jaw is tight. “A whole village,” she says. “Gone in a night.” She doesn't say: like my hall. She doesn't have to.` },
      ],
      options: [
        { text: `We're here to see Caddoc.`, tone: 'diplomatic', next: 'pass' },
        { text: `(Leave.)`, tone: 'leave', end: true },
      ],
    },
    pass: {
      speaker: 'a1w_rue',
      text: `“He knows. He's known since you crossed the ford.” She jerks her head toward the green-hearted fire. Then, as you pass: “He's not what they say. Whatever they say.”`,
    },
    again: {
      speaker: 'a1w_rue',
      text: [
        { if: 'a1_thornwake=helped', text: `Rue grins at you, fierce and wet-eyed. “You did it. You stood with us.” She touches her hand to her heart, then holds it out to you, palm open: the Thornwake greeting.` },
        { if: 'a1_thornwake=stopped', text: `Rue will not look at you. She stands her post with her spear held very straight, and her knuckles are white.` },
        { if: 'a1_thornwake=bargained', text: `“A Moot,” Rue says, as if testing the word. “He's going to *talk* to her.” She doesn't know whether to be disappointed or relieved. You suspect she is both.` },
        { text: `“He's by the fire,” says Rue. “He's always by the fire.”` },
      ],
    },
  },
};

const CADDOC: DialogueTree = {
  id: 'a1w_caddoc',
  title: 'Caddoc Briar',
  start: [
    { if: 'a1_thornwake=helped', node: 'after_helped' },
    { if: 'a1_thornwake=bargained', node: 'after_bargained' },
    { if: 'a1_thornwake=stopped', node: 'after_stopped' },
    { if: 'a1w_caddoc_greeted', node: 'again' },
    { node: 'first' },
  ],
  nodes: {
    first: {
      speaker: 'dm',
      text: `The Thornwake camp is a ring of bent-willow shelters around a fire that burns green at its heart. A dozen people sit or work around it — woodsfolk, runaway apprentices, a halfling family with three children, an Ashkin woman with ritual scars on her forearms — and every one of them stops what they are doing when you walk into the firelight.

By the fire, a big man is feeding thorn-branches to the flames one at a time, as though each were a name he was saying goodbye to.

Caddoc Briar was broad once. He has gone lean the way a winter oak goes lean. His beard is braided with blackthorn; a crown of living bramble grows from his scalp, rooted there, and where the thorns go in there is a little dried blood that nobody has wiped away. When he looks up, his eyes are grey and very tired and perfectly clear.`,
      effects: ['set a1w_caddoc_greeted', 'quest a1w_thornwake camp'],
      next: 'greet',
    },
    greet: {
      speaker: 'a1w_caddoc',
      text: `“The Heart-bearer.” His voice is low and rough, like a log being split slowly. “Sit. Or don't. The trees have been shouting about you for a day and a half; I wanted to see what the noise was.” He looks at your chest for a long, unblinking moment. “I can hear it. Like iron in rain.” He turns back to the fire. “If I were the man the Greenmother thinks I am, I'd take it off you now and drop it down the deepest hole in Elyndra. Lucky for you, I'm only the man I am.”`,
      interjections: [
        { who: 'korr', text: `Korr has stopped at the edge of the firelight. Across the fire, the Ashkin woman has risen to her feet, and the two of them regard each other for a long moment. She touches two fingers to her scars. Korr does not return the gesture. After a while, she sits back down.` },
        { who: 'orren', text: `Orren has gone very still beside you. “Thorn-Elder.” Caddoc's eyes flick to him, and something in them softens. “Hesk's grandson. Your gran threw a pot at me once.” “She threw pots at everyone.” “She threw this one *hard*.”` },
        { who: 'seris', text: `Seris's hand rests on her sword. Caddoc glances at it, and back at the fire, entirely unimpressed. “Last Dawn. You think the world is ending as a punishment. I think it's ending as medicine. We'll have a lot to talk about.”` },
        { who: 'kael', text: `Kael leans close. “I like him,” he murmurs. “That's never a good sign.”` },
        { who: 'vaelis', text: `Vaelis eyes the bramble crown with clinical interest. “Is that rooted in the *periosteum*?” Caddoc looks at him. “Yes,” he says. “Does it hurt?” “Yes.” Vaelis opens his mouth, and wisely closes it.` },
      ],
      next: 'hub',
    },
    again: {
      speaker: 'a1w_caddoc',
      text: [
        { if: 'a1w_caddoc_met', text: `“Moonrise,” says Caddoc, without looking up from the fire. “At the Stone. I'll be there.”` },
        { text: `Caddoc feeds another thorn to the fire. “Back again, Heart-bearer. Ask.”` },
      ],
      next: 'hub',
    },
    hub: {
      speaker: 'a1w_caddoc',
      text: `“Ask, then. And then I'll tell you what I want.”`,
      options: [
        { text: `Why break the Stone?`, once: true, tone: 'curious', tags: ['curiosity'], next: 'why' },
        { text: `Brackwater. Did you break its Anchor?`, once: true, tone: 'aggressive', tags: ['honesty'], next: 'brackwater' },
        { text: `The Conclave bolted a brace into the Stone. That's what's killing it.`, once: true, if: 'a1w_brace_known || a1w_brace_removed', tone: 'diplomatic', tags: ['knowledge'], next: 'brace_talk' },
        {
          text: `(Insight) Watch him while he talks.`, once: true, tone: 'curious', tags: ['caution'],
          check: { skill: 'insight', dc: 14, who: 'player' }, successEffects: ['set a1w_caddoc_read'], success: 'insight_ok', failure: 'insight_fail',
        },
        { text: `What do you want from us?`, if: '!a1w_caddoc_met', tone: 'pragmatic', next: 'ask' },
        { text: `(Leave the fire.)`, tone: 'leave', end: true },
      ],
    },
    why: {
      speaker: 'a1w_caddoc',
      text: `“Because it's a nail.” He holds up a thorn-branch and turns it in the firelight. “Three thousand years ago, someone took this land — the real land, the one that was here first — and folded it up like a letter and wrote a new one over the top. Then they drove nails through the new page so it wouldn't blow away.” He drops the branch into the flames. “The trees remember the old page. They've been weeping for it for three thousand years. We call it *whispering*, because that's prettier.

“The Veil isn't a wall, Heart-bearer. It's a scar. And a scar doesn't heal by being stitched tighter. You open it. You clean it. You let it bleed. And then — maybe — it heals clean.”`,
      interjections: [
        { who: 'vaelis', text: `“That is a dreadful metaphor for a structure with a forty-node load path,” Vaelis says. Caddoc looks at him. “Yes,” he agrees. “Yours would be worse.”` },
        { who: 'nima', text: `Nima has gone thoughtful, firelight in her eyes. “Let it burn clean,” she murmurs. “I know that song.” She does not look happy about knowing it.` },
        { who: 'varek', text: `Varek is watching Caddoc with an odd, unwilling respect. “He's not wrong that something's on the other side,” he says to you, low. “He's just never asked whether it wants to come back the way he thinks.”` },
      ],
      next: 'hub',
    },
    brackwater: {
      speaker: 'a1w_caddoc',
      text: `“Yes.” No hesitation; no excuse. “The fog came the same night. Forty-one people. I got thirty-three of them out. I carried Rue and her brother on my back, and I went back for their mother, and the house wasn't there.” He looks at his hands. “The Greenmother will tell you I'm a monster. She isn't wrong. She'll also tell you that stone would have gone by itself inside five years — slower, with the fog eating the valley a mile at a time. She isn't wrong about that either.”

He meets your eyes. “I counted the cost. I'll count it every night until I'm dead. Have you ever counted the cost of *not* paying it? Every year the Veil holds, something on the other side forgets it was ever real.”`,
      interjections: [
        { who: 'ilyra', text: `“Thirty-three,” Ilyra says quietly. “And eight.” Caddoc nods. “And eight,” he agrees. “I say their names every morning. Do your Lights?”` },
        { who: 'korr', text: `“You went back,” Korr says. It is not a question. Caddoc looks up. “I went back.” Korr nods once, slowly, as though something has been settled between the two of them.` },
        { who: 'brakka', text: `Brakka's hands have tightened on her shield-strap until the leather creaks. She says nothing, and it is very loud.` },
      ],
      next: 'hub',
    },
    brace_talk: {
      speaker: 'a1w_caddoc',
      text: [
        { if: 'a1w_brace_removed', text: `Caddoc goes very still. “I know about the braces. I've seen three. Hollin's Dell. Mere-Cross. This one.” Then he stares at you. “*Took it off*. You took it off, and it—” He gets up, walks to the edge of the camp, and stands facing the ring of pillars for a long moment, listening. When he comes back he sits down more slowly than he got up. “It's breathing,” he says. “Well. Well. That's a thing I didn't know.”` },
        { text: `Caddoc goes very still. “I know about the braces,” he says. “I've seen three. Hollin's Dell. Mere-Cross. This one.” His jaw works. “They come at night with their brass and their numbers and they *fix* things. Have you heard what it sounds like now? The screaming? I would rather break it clean than listen to it scream another month.”` },
      ],
      effects: ['set a1w_caddoc_doubts'],
      next: 'hub',
    },
    insight_ok: {
      speaker: 'dm',
      text: `He is not certain. That is what you see, beneath the conviction and the thorns. He has said these words so many times they have worn a groove, and under the groove is a man lying awake doing sums that never come out. He does not want permission. He wants a witness: someone to stand there and see it done, so that if he is wrong, he will not have been wrong alone.`,
      next: 'hub',
    },
    insight_fail: {
      speaker: 'dm',
      text: `He feeds another thorn to the fire. His face, in its light, tells you only that he is tired, and that he means every word.`,
      next: 'hub',
    },
    ask: {
      speaker: 'a1w_caddoc',
      text: `“From you?” He laughs, short and surprised. “Nothing. I want you *there*. At moonrise the Stone's eye opens — the moon looks straight down through the ring — and for an hour it's as thin as it will ever be. That's when we break it.” He stands, and the bramble crown creaks. “Come and watch. Come and help. Come and stop me, if you think you can. But come. If I'm going to do this, I want someone from the towns to see it done. I'm done doing it in the dark.”`,
      effects: ['set a1w_caddoc_met', 'quest a1w_thornwake moonrise'],
      options: [
        { text: `We'll be there.`, tone: 'friendly', end: true },
        { text: `I'll stop you. You know that.`, tone: 'aggressive', tags: ['boldness', 'protect'], next: 'ask_stop' },
        { text: `Help us find another way.`, tone: 'diplomatic', tags: ['diplomacy'], next: 'ask_other' },
      ],
    },
    ask_stop: {
      speaker: 'a1w_caddoc',
      text: `“I know you'll try.” He sits back down. “Not here. Not at my fire, with children watching. At the Stone.”`,
    },
    ask_other: {
      speaker: 'a1w_caddoc',
      text: `“Bring me one by moonrise,” says Caddoc, “and I'll listen.” He looks into the fire. “Nobody's brought me one yet.”`,
    },
    after_helped: {
      speaker: 'dm',
      text: `Caddoc looks up as you come into the firelight, and for a moment he simply looks at you. Then he lays his hand flat on his chest, over his heart — the Thornwake greeting. “Heart-bearer,” he says. “The trees are louder. Can you hear them? They're saying things I've not heard in my life.” A pause. “Some of it is screaming. Some of it is singing. I don't know yet which is which.”`,
      options: [
        { text: `What will you do now?`, once: true, tone: 'curious', next: 'after_next' },
        ...close(`Farewell, Caddoc.`),
      ],
    },
    after_next: {
      speaker: 'a1w_caddoc',
      text: `“Watch what grows. Then go to the next stone.” He smiles, very slightly. “And tell everyone I meet that the Heart-bearer stood at the Whispering Stone and put their hands on it beside mine. You gave me that. I'll use it.”`,
      options: close(`Farewell, Caddoc.`),
    },
    after_bargained: {
      speaker: 'a1w_caddoc',
      text: `Caddoc nods to you across the fire, the way one tired workman nods to another. “I've sent word to the Moot. The Greenmother and I will talk, the way we haven't in ten years.” He snaps a thorn and turns it in his fingers. “If she won't listen, I'll come back for the stone. But she'll listen. She's stubborn. She's not stupid.”`,
      options: close(`Good luck, Caddoc.`),
    },
    after_stopped: {
      speaker: 'a1w_caddoc',
      text: [
        { if: 'a1w_lost_fight', text: `Caddoc doesn't look up from the fire. “You cost me the moon,” he says. “It'll be a year before the Stone's eye opens like that again.” He feeds a thorn to the flames. “A year of screaming. I hope you listen to every night of it, the way I will.”` },
        { text: `Caddoc doesn't look up from the fire. “You'd have let me break you before you let me break it,” he says. “I don't know whether that makes you brave or a fool. I'll find out when the stone goes on its own.” He feeds a thorn to the flames. “Go away, Heart-bearer. My people don't want to look at you.”` },
      ],
      options: close(`(Leave.)`),
    },
  },
};

// ───────────────────────────────────────────────────────────── the breaking

const BREAKING: DialogueTree = {
  id: 'a1w_breaking',
  title: 'Moonrise at the Whispering Stone',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: [
        { if: 'a1w_brace_removed', text: `The moon comes up over the Woods like a lantern carried up a stair. It lifts above the treeline, and its light falls through the ring of pillars at an angle so exact it cannot be an accident, and lays a white road across the hollow straight into the Whispering Stone.

The Thornwake are already here. Caddoc stands at the foot of the Stone with both hands spread on the basalt, and four of his people stand around him with their palms pressed to the pillars. At the edge of the light lies something enormous and dark: a gloam stalker, twilight-furred, eyes like coins of dusk, a braided thorn collar round its neck. It watches you, and does not move.

The Stone is breathing — it has breathed since you took the brace off — but as the moonlight finds it, its breath catches and quickens, like a sleeper on the edge of a nightmare.

Caddoc does not turn round. “You came,” he says. “Good.”` },
        { text: `The moon comes up over the Woods like a lantern carried up a stair. It lifts above the treeline, and its light falls through the ring of pillars at an angle so exact it cannot be an accident, and lays a white road across the hollow straight into the Whispering Stone.

The Thornwake are already here. Caddoc stands at the foot of the Stone with both hands spread on the basalt, and four of his people stand around him with their palms pressed to the pillars. At the edge of the light lies something enormous and dark: a gloam stalker, twilight-furred, eyes like coins of dusk, a braided thorn collar round its neck. It watches you, and does not move.

Inside the Stone, the scream is climbing toward a pitch you can feel in your teeth.

Caddoc does not turn round. “You came,” he says. “Good.”` },
      ],
      next: 'choose',
    },
    choose: {
      speaker: 'a1w_caddoc',
      text: `“It'll take a quarter of an hour. Less, with help.” He looks over his shoulder at you, and the moonlight catches the blood at the roots of his crown. “Well, Heart-bearer?”`,
      decision: true,
      options: [
        {
          text: `Then let's do it. I'll help you break it.`, tone: 'pragmatic', tags: ['defiance', 'nature', 'boldness'],
          effects: [...HELPED, 'instab 2'], next: 'help',
          voices: { nima: `Let it break clean! It's screaming — end it.`, varek: `Let it go. Whatever's on the other side has waited long enough.` },
        },
        {
          text: `[Resonance] Put the Heart to it. Break it in one stroke, not a hundred cracks. (Spend 1 Resonance)`, if: 'resunlocked && res>=1',
          tone: 'resonance', tags: ['forbidden', 'boldness', 'defiance'],
          effects: ['res -1', ...HELPED, 'instab 1', 'set a1w_heart_broke_stone'], next: 'help_res',
        },
        {
          text: `(Persuasion) Wait. There's a third way: let it breathe instead of breaking it — and take this to the Moot, not the moon.`, if: '!a1w_bargain_failed',
          tone: 'diplomatic', tags: ['diplomacy', 'mercy'],
          check: { skill: 'persuasion', dc: 17, advIf: 'a1w_brace_removed || a1w_caddoc_doubts || a1w_caddoc_read || a1w_circle_debt' },
          success: 'bargain', failureEffects: ['set a1w_bargain_failed'], failure: 'bargain_fail',
          voices: { orren: `Talk. Please. Talk first.`, tessa: `There's always another verse. Make him hear it.`, ilyra: `There's a way where nobody's mother vanishes. Find it.` },
        },
        {
          text: `(Intimidation) Step away from the Stone, Caddoc. Now.`, tone: 'aggressive', tags: ['boldness', 'protect'],
          check: { skill: 'intimidation', dc: 18, advIf: 'comp:korr || comp:brakka' },
          success: 'stop_cowed', failure: 'stop_fight',
          voices: { brakka: `Stand in front of it. Make him go through you. He won't.`, seris: `It is an Anchor. Holy ground. Forbid it.` },
        },
        {
          text: `Then we stop you. (Attack.)`, tone: 'aggressive', tags: ['violence', 'protect'],
          effects: ['combat a1w_enc_thornwake'],
          voices: { korr: `He has made his choice. So do we.` },
        },
        { text: `Not tonight. I need to think.`, tone: 'leave', next: 'wait' },
      ],
    },
    wait: {
      speaker: 'a1w_caddoc',
      text: `“The moon won't wait,” Caddoc says, without turning. “But it comes back. So will I.” He takes his hands from the Stone. “Tomorrow night, Heart-bearer. Think fast.”`,
    },
    help: {
      speaker: 'dm',
      text: `You lay your hands on the basalt beside his. It is warm, and it is shaking.

Caddoc begins to sing — not words, a long low note like wind in a hollow log — and the Thornwake at the pillars take it up, and the pillars take it up after them. The cracks around the brace widen. Light pours from them, white and then gold and then a colour you do not have a word for. The brace screams and buckles and drops away. The Stone screams with it.

Then it breaks, with a sound like the whole Woods drawing breath.

For a long moment the hollow is full of a town: white houses, blue roofs, a market and a bronze-lidded well, and people, hundreds of them, lantern-carrying, turning in wonder to look at the moon. Then the Woods come back, and the town folds away into the trees like a letter put back in a drawer — but not all of it. One blue-roofed house remains, half-sunk in the bracken at the edge of the ring, its door open, its hearth cold.

Across the Woods, every tree begins to whisper at once.`,
      next: 'broken_world',
    },
    help_res: {
      speaker: 'dm',
      text: `You lay your hand on the basalt, and you let the Heart beat.

The Stone does not crack. It *opens*, like a fist unclenching after three thousand years. The brace falls away as though it had never been bolted on; the light pours out not in a scream but in a single held note, and the Thornwake at the pillars stagger, and Caddoc's song dies in his throat as he turns to stare at you.

For a long moment the hollow is full of a town: white houses, blue roofs, a market and a bronze-lidded well, and people, hundreds of them, lantern-carrying, turning toward *you* — as though they know exactly whose hand opened the door. Then the Woods come back, and the town folds away into the trees — but not all of it. One blue-roofed house remains, half-sunk in the bracken at the edge of the ring, its door open, its hearth cold.

Across the Woods, every tree begins to whisper at once. Some of them, you are almost sure, are whispering your name.`,
      next: 'broken_world',
    },
    broken_world: {
      speaker: 'dm',
      text: `Where the Whispering Stone stood there is a crater of black glass, still ticking as it cools.`,
      interjections: [
        { who: 'orren', text: `Orren is on his knees at the edge of the ring with both hands pressed flat to the earth, as if trying to hold it still. When he looks up, his face is wet. “Too loud,” he says. “It's all too loud. I can't — I can't *read* it.”`, effects: ['rel orren trust -4', 'memory orren -2 We broke the Whispering Stone. The Woods have not stopped shouting since.'] },
        { who: 'seris', text: `“That was an Anchor,” Seris says. Her voice shakes. “That was a *holy* thing, and we—” She turns away before she says anything else.`, effects: ['rel seris trust -3'] },
        { who: 'vaelis', text: `Vaelis is staring at the blue-roofed house. “Partial reconstitution,” he whispers. “A pre-Charter structure. From *nothing*. The Conclave would burn the Woods down for this.” He looks, for a moment, as though he might weep, and you cannot tell from which feeling.` },
        { who: 'nima', text: `Nima whoops — then stops, and looks at the house with the open door. “Did… did we do that? Is someone going to come out?” Nobody does.` },
        { who: 'varek', text: `Varek has one hand pressed to his ear. “They're singing,” he says hoarsely. “All of them. For a moment, *all* of them.”` },
        { who: 'korr', text: `Korr stands over the black glass with his axe in his hand, though there was nothing to fight. “It sounded like a dying thing,” he says. “Then like a born thing.” He does not say which he thinks it was.` },
        { who: 'brakka', text: `Brakka walks to the blue-roofed house and stands in its open doorway for a long time, looking in at the cold hearth. When she comes back she says only: “Somebody lived there.”` },
      ],
      next: 'help_after',
    },
    help_after: {
      speaker: 'a1w_caddoc',
      text: `Caddoc stands in the broken light, breathing like a man who has carried something a very long way. “Thank you,” he says. “I won't forget it. Neither will the trees.” He looks at the half-sunk house with an expression you cannot read: hope, or terror, or the place where they are the same. “Now we watch what grows.”`,
      options: close(`(Leave the ring.)`),
    },
    bargain: {
      speaker: 'a1w_caddoc',
      text: [
        { if: 'a1w_brace_removed', text: `You talk. About the brace you took off with your own hands, and the breath that came back into the Stone. About the town behind the glass, pressed to the window, not trying to break in. About a Greenmother who has been waiting ten years for her student to come home and shout at her.

Caddoc listens with his hands still on the basalt. When you are done, he stands like that a long time.

“Let it breathe,” he says slowly. “Not break it. Loosen it. Let what's grieving on the other side through a little at a time, the way you'd bleed a fever, instead of all at once.” He takes his hands from the Stone. “It's slower. It's harder. It means talking to *her*.” A long breath. “All right, Heart-bearer. I'll try your way. But if it starts screaming again—”` },
        { text: `You talk. About the brace strangling the Stone, and what it would mean to take it off instead of breaking what it's bolted to. About the town behind the glass, pressed to the window, not trying to break in. About a Greenmother who has been waiting ten years for her student to come home and shout at her.

Caddoc listens with his hands still on the basalt. When you are done, he stands like that a long time. Then — without a word — he takes hold of the brace with his bare hands, thorns and all, and tears it out of the rock. Bolts and blood and blue-white light go everywhere. The Stone shudders, and breathes.

“Let it breathe,” he says slowly, staring at the ruin of the clamp in his bleeding hands. “Not break it. Loosen it.” He tosses the brace into the bracken. “It's slower. It's harder. It means talking to *her*.” A long breath. “All right, Heart-bearer. I'll try your way. But if it starts screaming again—”` },
      ],
      interjections: [
        { who: 'orren', text: `Orren lets out a breath so long it sounds like it started in Hollowmere.`, effects: ['rel orren trust 3', 'rel orren respect 2'] },
        { who: 'tessa', text: `“Another verse,” Tessa whispers, delighted. “There was another verse after all.”` },
        { who: 'korr', text: `Korr nods slowly. “Words that hold,” he says. “Harder than an axe.”` },
      ],
      options: [
        {
          text: `[Resonance] Then let me help it find its own note — open it just enough to breathe. (Spend 1 Resonance)`, if: 'resunlocked && res>=1',
          tone: 'resonance', tags: ['nature', 'mercy'], effects: ['res -1', ...BARGAINED, 'set a1_stone mended'], next: 'bargain_mended',
        },
        {
          text: `(Arcana) Sing with them, and I'll tune it by hand.`, tone: 'curious', tags: ['knowledge', 'nature'],
          check: { skill: 'arcana', dc: 15, advIf: 'comp:vaelis || a1w_brace_known' },
          successEffects: [...BARGAINED, 'set a1_stone mended'], success: 'bargain_mended',
          failureEffects: [...BARGAINED, 'set a1_stone left'], failure: 'bargain_left_fail',
        },
        {
          text: `Leave it as it is. Let the Moot decide what it needs.`, tone: 'diplomatic', tags: ['caution', 'tradition'],
          effects: [...BARGAINED, 'set a1_stone left'], next: 'bargain_left',
        },
      ],
    },
    bargain_fail: {
      speaker: 'a1w_caddoc',
      text: `“Words,” Caddoc says. Not cruelly. “I've had words from the Greenmother for ten years, and the stones keep breaking.” He turns back to the basalt. “Help me, or stop me. There isn't time for anything else.”`,
      next: 'choose',
    },
    bargain_mended: {
      speaker: 'dm',
      text: `Caddoc sings, and the Thornwake take up the note, and this time you go down into the Stone with them, looking for its own song: not one note but a chord that shifts and breathes the way the Woods breathe.

It takes until the moon has passed the Stone's eye. When it is over, the Stone is humming — deep and slow, like bees in a lime tree — and the cracks in it have filled with light and cooled to silver, like a bone that has set. Through the hum, if you listen, you can hear something on the other side: not pressing. Not pounding. Breathing with it.

Caddoc sits down in the bracken with his back against a pillar and laughs until he cries. Nobody in the Thornwake has ever seen him do either.`,
      options: close(`(Leave them to it.)`),
    },
    bargain_left_fail: {
      speaker: 'dm',
      text: `You try. The note slides away from you like a fish in dark water, and the moon passes the Stone's eye, and it is over. The Stone breathes on, ragged but unbound. Caddoc puts a heavy hand on your shoulder. “It's still alive,” he says. “That'll do, for tonight. The Moot can do the rest.”`,
      options: close(`(Leave the ring.)`),
    },
    bargain_left: {
      speaker: 'a1w_caddoc',
      text: `“Then we leave it,” says Caddoc, “and watch it, and I go and shout at an old woman under a tree.” He looks at the Stone, breathing raggedly in the moonlight. “If you're wrong, Heart-bearer, I'll be back here with a hammer.” A pause. “I hope you're not wrong.”`,
      options: close(`(Leave the ring.)`),
    },
    stop_cowed: {
      speaker: 'dm',
      text: `Caddoc turns. He looks at you — your face, your hands, the Heart beating under your breastbone — and whatever he sees there, he believes it.

“You'd do it,” he says. “You'd stand there and let me break you before you let me break it.” He lets his hands fall from the Stone. “I won't kill the Heart-bearer to make a point. That's what *they* would do.” He jerks his head; one by one, the Thornwake take their palms from the pillars. The gloam stalker rises and pads after them into the dark.

At the edge of the ring he stops. “This isn't over. It's still dying. When it screams loud enough, you'll hear it in Hollowmere, and you'll think of me.”`,
      effects: [...STOPPED, 'rep verdant -3', 'rep conclave 5', 'xp 150'],
      interjections: [
        { who: 'brakka', text: `Brakka has been standing between Caddoc and the Stone with her shield up the whole time. Only now does she lower it. Her arm is trembling. “Good,” she says. “Good. Nobody had to die for a rock.”` },
        { who: 'nima', text: `“That's it?” Nima says. “We just — leave it screaming?” Nobody answers her.` },
      ],
      options: close(`(Leave the ring.)`),
    },
    stop_fight: {
      speaker: 'a1w_caddoc',
      text: `Caddoc almost smiles. “No,” he says gently. “I don't think I will.” He takes his hands from the Stone, and the brambles at his feet begin to move.`,
      options: [{ text: `(Fight.)`, tone: 'aggressive', tags: ['violence'], effects: ['combat a1w_enc_thornwake'] }],
    },
  },
};

const CADDOC_BEATEN: DialogueTree = {
  id: 'a1w_caddoc_beaten',
  title: 'After the Fight at the Stone',
  start: [{ if: 'a1w_lost_fight', node: 'lost' }, { node: 'won' }],
  nodes: {
    won: {
      speaker: 'dm',
      text: `Caddoc Briar is on his knees in the bracken, his crown of thorns torn half out of his scalp, blood and green sap running down his face. The gloam stalker has fled; the Thornwake who were not beaten have run. Above you, the moon slides past the Stone's eye, and the hour is over.

He looks up at you. He does not ask for anything.`,
      decision: true,
      options: [
        {
          text: `Go. Leave the Woods, and don't come back to this Stone.`, tone: 'compassionate', tags: ['mercy'],
          effects: ['set a1w_caddoc_fate exiled', 'set a1w_caddoc_gone', 'rep verdant 2'], next: 'exiled',
          voices: { ilyra: `Let him go. He's lost enough tonight.` },
        },
        {
          text: `The Greenmother can judge you. Not me.`, tone: 'diplomatic', tags: ['tradition', 'mercy'],
          effects: ['set a1w_caddoc_fate moot', 'set a1w_caddoc_gone', 'rep verdant 5'], next: 'moot',
          voices: { orren: `Take him to the Moot. She'll know what to do.`, seris: `Let his own elders judge him.` },
        },
        {
          text: `(Kill him.)`, tone: 'aggressive', tags: ['cruelty', 'violence'],
          effects: ['set a1w_caddoc_fate killed', 'set a1w_caddoc_gone', 'rep verdant -15'], next: 'killed',
        },
      ],
    },
    exiled: {
      speaker: 'a1w_caddoc',
      text: `He gets up slowly, the way an old tree comes down: in stages. “West, then,” he says. “There are stones in the mountains too.” He looks at the Stone, still screaming under hearing. “Listen to it, Heart-bearer. Every night. That's all I ever wanted from anyone.” Then he limps away into the dark, and the Woods close behind him.`,
      options: close(`(Let him go.)`),
    },
    moot: {
      speaker: 'dm',
      text: `It is a long, slow walk to the Heartwood with Caddoc leaning on your shoulder. He doesn't speak until the roots of the great tree are in sight. Then he says, quite quietly: “She's going to be so *pleased* with herself.” And you think — though it's dark, and hard to tell — that he is almost smiling.

Warden Sefa meets you at the gate, takes one look, and sends for a stretcher.`,
      interjections: [
        { who: 'orren', text: `Orren walks on Caddoc's other side the whole way, saying nothing, taking some of the weight.`, effects: ['rel orren trust 2'] },
      ],
      options: close(`(Leave him in the Moot's care.)`),
    },
    killed: {
      speaker: 'dm',
      text: `It is quick. That is the only thing about it that is.

When it is done, the Woods are utterly silent — not the hush of the Stone, but the silence of a room where someone has said something unforgivable. Then, very slowly, the whispering begins again. You do not want to know what it is saying.`,
      interjections: [
        { who: 'orren', text: `Orren will not look at you. He kneels by Caddoc and closes his eyes, and lays a single thorn on his chest, and walks away into the trees, and is gone a long time.`, effects: ['rel orren trust -8', 'rel orren affection -6', 'memory orren -3 We killed Caddoc Briar on his knees at the Whispering Stone.'] },
        { who: 'korr', text: `Korr stares at you. “He was beaten,” he says. “He was *on his knees*.” He turns his back on you, and stays that way.`, effects: ['rel korr respect -6', 'rel korr trust -5', 'memory korr -3 You killed a beaten man. I watched.'] },
        { who: 'brakka', text: `Brakka says nothing at all. She doesn't need to. She simply moves, so that she is no longer standing beside you.`, effects: ['rel brakka trust -6'] },
        { who: 'ilyra', text: `Ilyra kneels by the body and prays, very softly. She does not pray for you.`, effects: ['rel ilyra trust -6'] },
      ],
      options: close(`(Leave the ring.)`),
    },
    lost: {
      speaker: 'dm',
      text: `You come round on your back in the bracken with the taste of sap in your mouth. The moon has moved — a long way. It is past the Stone's eye; the hour is gone.

The Stone is still standing. Still screaming.

Caddoc sits on a fallen pillar a few feet away, his crown of thorns bleeding freely, his people binding their wounds in silence around him. He looks at the moon, and then at you.

“You cost me the moon,” he says. “It'll be a year before it lines up like that again.” He gets up, slowly. “I don't kill people for getting in my way, Heart-bearer. That's the difference between us and the grey coats. Remember it.” He limps away toward his fire, and the Thornwake follow him, and the gloam stalker pauses to look back at you, once, with its dusk-coin eyes, before it goes.`,
      options: close(`(Get up.)`),
    },
  },
};

// ───────────────────────────────────────────────────────────── the woodcutters

const AGNA: DialogueTree = {
  id: 'a1w_agna',
  title: 'Agna Fell',
  start: [
    { if: 'questdone:a1w_woodcutters', node: 'after' },
    { if: 'quest:a1w_woodcutters=report', node: 'report' },
    { if: 'a1w_agna_met', node: 'again' },
    { node: 'first' },
  ],
  nodes: {
    first: {
      speaker: 'dm',
      text: `The woodcutters' camp is a clearing of stumps and stacked cordwood, lashed shelters and a long table under a canvas fly — and all of it is strung with cords of red wool. They are tied to every tree, every post, every tent-peg, running off into the Woods in a dozen directions like the veins on the back of a hand. A brazier burns by the table. Around it, eight or nine big men and women in leather aprons are not working. They are waiting, and they have been waiting long enough that it has gone sour.

The woman at the head of the table stands up when she sees you. She is grey-haired and built like a wine-barrel, with forearms that could fell an oak without the axe.`,
      effects: ['set a1w_agna_met'],
      next: 'greet',
    },
    greet: {
      speaker: 'a1w_agna',
      text: `“Agna Fell. I run the Hollowmere cutters.” She doesn't offer her hand; she's got a length of red cord wound round it so tight the fingers have gone white. “You came from the town. You're the ones went into the cathedral? Good. Then you're not frightened of things that don't make sense.” She points with her chin at the cords. “Forty years we've tied those. You tie a cord, you follow it home. That's the rule. The Woods move; the cord doesn't.

“Two nights ago the cords moved.”`,
      next: 'story',
    },
    story: {
      speaker: 'a1w_agna',
      text: [
        { if: '!recruited:korr', text: `“Piet Marrow and my brother Lenn went to mark the south stand, by the hollow. Followed the cord out. When they went to follow it back, it went somewhere else. Piet's horn sounded at dusk, from the hollow. Then again at midnight. Then nothing.” Her mouth twists. “I paid an Ashkin — big lad, quiet, a caravan guard whose caravan left without him — every coin in the cutters' box to go in after them at noon yesterday. He went. He hasn't come out either.”` },
        { text: `“Piet Marrow and my brother Lenn went to mark the south stand, by the hollow. Followed the cord out. When they went to follow it back, it went somewhere else. Piet's horn sounded at dusk, from the hollow. Then again at midnight. Then nothing.” Her mouth twists. “Nobody'll go in. Not for money, not for love. I'd go myself if this knee would carry me down a slope.”` },
      ],
      effects: ['quest a1w_woodcutters search'],
      interjections: [
        { who: 'korr', text: `“I will go,” Korr says, before anyone else can speak. Agna looks him up and down, and something in her face eases. “Aye,” she says. “Aye, you look like you would.”` },
        { who: 'orren', text: `Orren is running a length of the red cord through his fingers, frowning. “South stand,” he says. “Hollow's been bad since summer. Things in it that don't belong. Paths that go down and don't come up.”` },
        { who: 'kael', text: `Kael eyes the cords with professional respect. “You know, in Solmara we'd call this a very elaborate security system.” Agna looks at him. “In Hollowmere we call it not dying,” she says.` },
      ],
      next: 'ask',
    },
    ask: {
      speaker: 'a1w_agna',
      text: `“Will you go?”`,
      options: [
        { text: `We'll find them.`, tone: 'friendly', tags: ['protect', 'charity'], next: 'accept' },
        {
          text: `(Survival) Show me where the cords went wrong. Let me read the ground.`, tone: 'pragmatic', tags: ['nature', 'caution'],
          check: { skill: 'survival', dc: 13, advIf: 'comp:orren || class:ranger' },
          successEffects: ['set a1w_quiet_route'], success: 'route', failure: 'route_fail',
        },
        { text: `What's it worth to you?`, once: true, tone: 'pragmatic', tags: ['greed', 'pragmatic'], next: 'pay' },
        { text: `Not now.`, tone: 'leave', end: true },
      ],
    },
    pay: {
      speaker: 'a1w_agna',
      text: `Agna looks at you for a long moment. Then she laughs, short and ugly. “The box is empty. I gave it to the Ashkin.” She thinks. “Thirty gold, out of the winter's wood money, when they're home. And my gran's map. Forty years of cords. It's worth more than gold to anyone who means to walk these Woods.”`,
      next: 'ask',
    },
    accept: {
      speaker: 'a1w_agna',
      text: `“Here.” She cuts a length of cord from round her hand and ties it round your wrist, hard. “If you hear them — if you hear *anyone* — calling from the wrong direction, you don't answer. Whatever voice it's in. You follow the cord.”`,
    },
    route: {
      speaker: 'dm',
      text: `Between you, you find it. The old cords run straight south; the new ones — the ones that moved — curl away into the hollow like a dropped skein. But along the hollow's western rim there is a deer-trail the cords never touched, and the paw-prints on it are old. Whatever is hunting down there doesn't use the rim.

“Huh,” says Agna, impressed despite herself. She ties a cord round your wrist. “You follow that. And if you hear anyone calling from the wrong direction — *anyone* — you don't answer.”`,
    },
    route_fail: {
      speaker: 'dm',
      text: `The cords cross and recross until your eyes ache. Old knots, new knots, cords that seem to have tied themselves. Whatever moved them, it didn't leave a trail you can follow. Agna watches you give up without a word, and ties a cord round your wrist. “Then you go straight down, and you keep your blades out. And if you hear anyone calling from the wrong direction, you don't answer.”`,
    },
    again: {
      speaker: 'a1w_agna',
      text: `Agna looks up from the cord she's winding. “Any sign?”`,
      options: [
        { text: `Not yet. We're going.`, tone: 'friendly', end: true },
        { text: `Tell me again what happened.`, tone: 'curious', next: 'story' },
      ],
    },
    report: {
      speaker: 'dm',
      text: [
        { if: 'a1w_lenn_fate=remembered', text: `Agna sees Lenn before she sees you. She makes a sound like a trunk splitting and crosses the camp at a run her knee should not allow, and gets her brother by both shoulders and shakes him, and then just holds on.

Lenn has a little straw doll in his hand, and he will not put it down. He is smiling and weeping at once. “Agna,” he says. “Agna, I've so much to tell you. I had a daughter.” Agna looks at the doll, and at his face, and does not understand, and holds on anyway. Behind them, Piet is being thumped on the back by every cutter in the camp.` },
        { if: 'a1w_lenn_fate=returned', text: `Agna sees Lenn before she sees you. She makes a sound like a trunk splitting and crosses the camp at a run her knee should not allow, and gets her brother by both shoulders and shakes him, and then just holds on.

Lenn lets her. Over her shoulder his eyes are dry and very far away, looking at something down the cord that nobody else can see. Behind them, Piet is being thumped on the back by every cutter in the camp.` },
        { text: `Piet is being thumped on the back by every cutter in the camp. Agna has hold of him by both shoulders, laughing. Then she looks past him — at you — and then, with a small frown, past you, at the empty path.

“Is that it?” she says. “Just Piet? I thought—” She stops. Her hand goes to the cord around her wrist, the one she has been winding all this time, and she looks at it as though she has never seen it before.

“I thought there were two,” she says slowly. “Why did I think there were two?”` },
      ],
      interjections: [
        { who: 'ilyra', if: 'a1w_lenn_fate=stayed', text: `Ilyra puts her hand on Agna's arm. “There were,” she says, very gently. Agna looks at her, blank and polite, and Ilyra takes her hand away.` },
        { who: 'korr', if: 'a1w_lenn_fate=stayed', text: `Korr is frowning at the cord on Agna's wrist. He opens his mouth, and closes it, and looks troubled for the rest of the day without being able to say why.` },
        { who: 'brakka', if: 'a1w_lenn_fate=returned || a1w_lenn_fate=remembered', text: `Brakka watches the brother and sister holding on to each other, and quietly looks away, and rubs her eyes with the back of a gauntlet. “Woodsmoke,” she says, to nobody.` },
      ],
      next: 'reward',
    },
    reward: {
      speaker: 'a1w_agna',
      text: [
        { if: 'a1w_lenn_fate=stayed', text: `“Here.” Agna presses a roll of oilcloth into your hands, soft with handling, and a purse. “For Piet. Forty years of cords, my gran's and my mam's and mine. There's a black one on there, east past the river — Gran tied it. Said it was the old road the cords won't hold. Never worked out where it went.” She looks at the cord on her wrist again, and frowns, and unwinds it, and doesn't seem to know what to do with it. In the end she gives that to you too.` },
        { text: `“Here.” Agna presses a roll of oilcloth into your hands, soft with handling, and a purse. “Forty years of cords, my gran's and my mam's and mine. There's a black one on there, east past the river — Gran tied it. Said it was the old road the cords won't hold. Never worked out where it went.” She wipes her nose on her sleeve. “Maybe you will.”` },
      ],
      options: [
        { text: `Thank you, Agna.`, if: 'a1w_lenn_fate=remembered', tone: 'friendly', effects: ['complete a1w_woodcutters remembered', 'gold 30', 'give a1w_cord_map', 'rep hollowmere 3'], next: 'done' },
        { text: `Thank you, Agna.`, if: 'a1w_lenn_fate=returned', tone: 'friendly', effects: ['complete a1w_woodcutters home', 'gold 30', 'give a1w_cord_map', 'rep hollowmere 3'], next: 'done' },
        { text: `Thank you, Agna.`, if: 'a1w_lenn_fate=stayed', tone: 'friendly', effects: ['complete a1w_woodcutters lost', 'gold 30', 'give a1w_cord_map', 'rep hollowmere 1'], next: 'done' },
      ],
    },
    done: {
      speaker: 'a1w_agna',
      text: `“Hollowmere cutters remember who comes for them,” says Agna. “Whatever else it forgets.”`,
      options: close(`(Leave the camp.)`),
    },
    after: {
      speaker: 'a1w_agna',
      text: [
        { if: 'a1w_lenn_fate=stayed', text: `Agna nods to you from the table. Every so often she glances at the empty stool beside her, as if expecting it to be filled. She doesn't know she does it.` },
        { text: `Agna nods to you from the table. “Follow the cord,” she says. “Always.”` },
      ],
    },
  },
};

const TREE: DialogueTree = {
  id: 'a1w_tree',
  title: 'The Fallen Larch',
  start: [{ if: 'comp:korr', node: 'korr_thal' }, { if: '!recruited:korr', node: 'korr_holding' }, { node: 'treed' }],
  nodes: {
    korr_holding: {
      speaker: 'dm',
      text: `You hear it before you see it: a low, rhythmic chant, Ashkin, deep as a drum — and under it, the snarling.

At the bottom of the hollow a great larch has come down across a stream, and on its trunk, with his back to the upturned roots, stands an Ashkin warrior. He is enormous, red-black of skin and ember-eyed, bleeding from a dozen places and paying none of them the least attention. A greataxe rests on his shoulder. Behind and above him, wedged in the larch's dead branches, a terrified man in a woodcutter's apron clings on with both arms.

Circling the fallen tree, low and patient, are two gloam stalkers: twilight panthers with coats like a sky an hour after sunset and eyes like coins of dusk. A third lies dead in the stream. The warrior has not stopped chanting. You get the impression he has not stopped for some time.

He sees you. The chant does not break. But he lifts his chin a fraction toward the nearer stalker, as if to say: *that one is yours, if you want it.*`,
      effects: ['set a1w_korr_met', 'quest a1w_woodcutters search'],
      next: 'act',
    },
    korr_thal: {
      speaker: 'dm',
      text: `The hollow is quiet — quieter than the rest of the Woods, the whispering muffled as if by snow. At the top of the slope, Korr stops dead.

“Thal,” he says.

You hear nothing. Then — you are not sure — something very faint from the bottom of the hollow: a man's voice, calling a name. It could be Korr's. It could be anyone's.`,
      effects: ['quest a1w_woodcutters search'],
      next: 'korr_thal2',
    },
    korr_thal2: {
      speaker: 'comp:korr',
      text: [
        { if: 'cq_korr_outcome=sung', text: `“No.” Korr shakes his head slowly. “Not Thal. Thal is quiet now. I sang him quiet.” He listens. “This is another voice. Older. It sings a war-song I do not know.” His hand tightens on the haft. “And I know every word.”` },
        { if: 'cq_korr_outcome=fought', text: `“He is still angry.” Korr's voice is flat. “I broke his echo, and he is still angry.” He breathes out, long and slow, and the ember in his eyes dims by an effort you can see. “No. Not today. Today I go down there for the living.”` },
        { if: 'cq_korr_outcome=silent', text: `“I did not sing for him,” Korr says, jaw tight. “So he still calls.” He looks at you. “If I answer this time — will you stop me, if I go somewhere I should not?”` },
        { text: `“Thal is dead,” Korr says, to the hollow, to himself. “By my hand. Years ago. He cannot be here.” The voice calls again, far off and patient. “He is here.”` },
      ],
      interjections: [
        { who: 'tessa', text: `Tessa slips her small hand into Korr's enormous one, and says nothing at all, and he does not let go.` },
        { who: 'brakka', text: `Brakka steps up on his other side, shoulder to shoulder. “Names in the fog,” she says. “I hear mine too. We go down together.”` },
        { who: 'orren', text: `Orren unwinds a length of red cord from his own wrist and ties it, without asking, round Korr's. “Follow the cord,” he says. Korr looks at it for a long moment, and nods.` },
      ],
      options: [
        {
          text: `Answer him, Korr. Say his name. We're right here.`, tone: 'compassionate', tags: ['protect', 'honesty'],
          effects: ['set a1w_korr_thal_done', 'rel korr trust 3', 'rel korr affection 2', 'memory korr 2 In the gloam hollow you told me to answer the voice, and stood beside me while I did.'], next: 'korr_answer',
        },
        {
          text: `Don't answer. Agna's rule: whatever voice it's in, follow the cord.`, tone: 'pragmatic', tags: ['caution', 'tradition'],
          effects: ['set a1w_korr_thal_done', 'rel korr respect 3'], next: 'korr_cord',
        },
        {
          text: `Use it. Let it make you angry. We may need that down there.`, tone: 'aggressive', tags: ['violence', 'pragmatic'],
          effects: ['set a1w_korr_thal_done', 'rel korr trust -3', 'memory korr -1 You told me to use the voice to feed the fire.'], next: 'korr_rage',
        },
      ],
    },
    korr_answer: {
      speaker: 'dm',
      text: `Korr lifts his head and calls down into the hollow in Ashkin — a few words, a name, a phrase with the shape of a greeting across a fire. The voice below stops. In the silence, very faintly, something laughs: not cruelly. The way a man laughs when an old friend surprises him. Then there is only the snarling, rising from the bottom of the slope.

Korr lets out a breath. “Thank you,” he says. “Now. The living.”`,
      next: 'treed',
    },
    korr_cord: {
      speaker: 'comp:korr',
      text: `Korr looks at the red cord around your wrist for a long moment. Then he winds the end of it round his own. “Follow the cord,” he repeats. “Yes. That is a good law.” The voice calls once more, and he does not turn his head.`,
      next: 'treed',
    },
    korr_rage: {
      speaker: 'dm',
      text: `Korr's eyes flare. For one heartbeat you see the ember in them go, not red, but *black*. Then he blinks, and it is gone, and he is looking at you with an expression you cannot read. “Do not ask that of me,” he says quietly. “Not ever.”`,
      next: 'treed',
    },
    treed: {
      speaker: 'dm',
      text: `At the bottom of the hollow a great larch has come down across a stream, and wedged in its dead branches, clinging on with both arms, is a terrified man in a woodcutter's apron: Piet Marrow, by Agna's description. Two gloam stalkers circle the fallen trunk, low and patient — twilight panthers, coats the colour of a sky an hour after sunset, eyes like coins of dusk. They haven't noticed you yet.`,
      effects: ['quest a1w_woodcutters search'],
      next: 'act',
    },
    act: {
      speaker: 'dm',
      text: [
        { if: '!recruited:korr', text: `The stalkers circle the Ashkin's log, patient as the moon. Up in the larch, Piet whimpers.` },
        { text: `The stalkers circle the larch, patient as the moon. Up in the branches, Piet whimpers.` },
      ],
      options: [
        { text: `Attack.`, tone: 'aggressive', tags: ['violence', 'protect'], effects: ['combat a1w_enc_tree'] },
        {
          text: `(Survival) They come from a world without a sun. Light every brand we have and drive them off.`, tone: 'pragmatic', tags: ['nature', 'caution'],
          check: { skill: 'survival', dc: 14, advIf: 'a1w_quiet_route || comp:orren || class:ranger || class:druid' },
          success: 'drive_off', failureEffects: ['combat a1w_enc_tree'],
        },
        {
          text: `(Animal Handling) They're hunting, not hating. Calm them, and let them go.`, tone: 'compassionate', tags: ['nature', 'mercy'],
          check: { skill: 'animalHandling', dc: 15, advIf: 'class:druid || class:ranger' },
          success: 'calm', failureEffects: ['combat a1w_enc_tree'],
        },
        {
          text: `(Stealth) Slip round by the rim trail and get Piet down without a fight.`, if: 'a1w_quiet_route && recruited:korr', tone: 'pragmatic', tags: ['stealth', 'caution'],
          check: { skill: 'stealth', dc: 13 },
          success: 'sneak', failureEffects: ['combat a1w_enc_tree'],
        },
        {
          text: `(Intimidation) Roar with the Ashkin. Make them believe this hollow belongs to you.`, if: '!recruited:korr', tone: 'aggressive', tags: ['boldness'],
          check: { skill: 'intimidation', dc: 13 },
          success: 'roar', failureEffects: ['combat a1w_enc_tree'],
        },
        { text: `(Back away up the slope.)`, tone: 'leave', end: true },
      ],
    },
    drive_off: {
      speaker: 'dm',
      text: `You tear dead branches from the larch, strike flint, and come down the slope in a blaze of pitch-smoke and noise. The stalkers recoil from the light as though it were boiling water — hissing, flattening, their dusk-coin eyes squeezed shut — and then they are gone, two shadows pouring away into the deeper dark. Somewhere far off, one of them yowls, sounding more offended than hurt.`,
      effects: ['set a1w_tree_done', 'xp 100'],
      options: [{ text: `Get him down.`, tone: 'friendly', effects: ['dialogue a1w_tree_after'], end: true }],
    },
    calm: {
      speaker: 'dm',
      text: `You go down slowly, hands open, making yourself small and dull and uninteresting, the way you'd walk past a farm dog. The nearer stalker watches you come with its ears flat. Then — slowly — its ears come up. It sniffs the air in your direction, sneezes, and pads away into the bracken. The second follows it. They look back once, at the edge of the dark, with something that might almost be curiosity.`,
      effects: ['set a1w_tree_done', 'xp 100', 'rep verdant 2'],
      options: [{ text: `Get him down.`, tone: 'friendly', effects: ['dialogue a1w_tree_after'], end: true }],
    },
    sneak: {
      speaker: 'dm',
      text: `The rim trail takes you round behind the larch's upturned roots. You climb; Piet climbs down into your arms; and the two of you are halfway up the slope before the stalkers notice the tree is empty. By then you are on the cord-line, and they do not follow.`,
      effects: ['set a1w_tree_done', 'xp 100'],
      options: [{ text: `Catch your breath.`, tone: 'friendly', effects: ['dialogue a1w_tree_after'], end: true }],
    },
    roar: {
      speaker: 'dm',
      text: `You come down the slope roaring. The Ashkin hears you, and his chant breaks into a war-cry that shakes the needles off the larch, and the two of you meet the stalkers in the stream like a landslide meeting a road. They do not stay to argue. In three heartbeats there is nothing in the hollow but you, the warrior, and a woodcutter in a tree, laughing hysterically.`,
      effects: ['set a1w_tree_done', 'xp 100'],
      options: [{ text: `Get him down.`, tone: 'friendly', effects: ['dialogue a1w_tree_after'], end: true }],
    },
  },
};

const TREE_AFTER: DialogueTree = {
  id: 'a1w_tree_after',
  title: 'The Fallen Larch',
  start: 'piet',
  nodes: {
    piet: {
      speaker: 'dm',
      text: [
        { if: '!recruited:korr', text: `The hollow is quiet. The Ashkin warrior stops chanting at last. He lowers his axe, looks at you, and nods once — the nod of one professional to another. Then he turns and holds up his arms, and the man in the larch drops into them like a sack of meal.` },
        { text: `Piet Marrow comes down out of the larch in a rush of bark and dead needles, lands on his backside in the stream, and sits there, laughing and crying at the same time.` },
      ],
      effects: ['set a1w_tree_done', 'set a1w_piet_safe', 'quest a1w_woodcutters search'],
      next: 'piet2',
    },
    piet2: {
      speaker: 'a1w_piet',
      text: [
        { if: 'a1w_lenn_fate', text: `“Thank you — oh, Lights, thank you — two days I've been up there, two *days*, they don't sleep—” Piet grabs both your hands. “And Lenn? You've been down to the bottom already? Is he—” He looks at your face, and stops asking.` },
        { text: `“Thank you — oh, Lights, thank you — two days I've been up there, two *days*, they don't sleep—” Piet grabs both your hands. Then he remembers something, and his face falls. “Lenn. Lenn Fell, he was with me. The second night he heard someone calling him. A woman. Calling him *love*, calling him home for his supper.” Piet swallows. “Lenn's never been married. He went down to the bottom of the hollow, toward the voice. I shouted and shouted. He didn't even turn round.”` },
      ],
      effects: ['clue a1w_woodcutters voices'],
      interjections: [
        { who: 'ilyra', text: `Ilyra goes very still at *calling him home*. She doesn't say anything, but her hand finds her holy symbol and holds it.` },
        { who: 'tessa', text: `Tessa gives Piet her waterskin and a smile that is mostly professional. Under her breath, to you: “Voices calling people home. In a hollow. At night.” She shudders. “I've sung that song. It never ends well in the song.”` },
      ],
      options: [
        { text: `And you, friend? (Turn to the Ashkin.)`, if: '!recruited:korr', tone: 'friendly', next: 'korr_intro' },
        ...hollowClose(`Go home, Piet. Follow the cord. We'll find Lenn.`, 'a1w_lenn_fate').map((o) => ({ ...o, if: `recruited:korr && ${o.if}` })),
      ],
    },
    korr_intro: {
      speaker: 'comp:korr',
      text: `“Korr Ashmane.” He wipes his axe on the moss, slowly and thoroughly. “Caravan guard. The caravan went on to Ashenford without me. The old woman paid me to come here. I came.” He looks at the dead stalker in the stream. “Two days. They do not sleep. Neither did I.”`,
      interjections: [
        { who: 'brakka', text: `Brakka looks the Ashkin up and down with open professional approval. “Two days on a log against gloam stalkers.” “Three,” says Korr. “The first does not count. I was only tired.”` },
        { who: 'tessa', text: `Tessa already has her book out. “Two days,” she says, writing fast. “Alone. On a log. *Chanting*.” Korr looks at her. “Do not,” he says. “Oh, I absolutely will,” says Tessa.` },
        { who: 'orren', text: `Orren and the Ashkin regard each other with the silent, measuring respect of two people who have both spent too many nights awake in the dark. Neither says a word. Both of them nod.` },
        { who: 'seris', text: `Seris inclines her head to him, knight to warrior. “You held the line alone.” Korr considers this. “There was no one else to hold it with,” he says. “That is not the same as wanting to.”` },
      ],
      next: 'korr_why',
    },
    korr_why: {
      speaker: 'comp:korr',
      text: `“Why did I stay?” He seems to weigh whether the question deserves an answer. “Since the bell, I hear a voice in the fog. It calls my name. I thought—” He stops. “It does not matter what I thought. The old woman needed men found. I find things.” He looks at you, ember-eyed, measuring. “You came down into the hollow for a stranger in a tree. Not for coin. I saw your faces.”`,
      options: [
        {
          text: `Come with us. We could use someone who doesn't sleep.`, tone: 'friendly', tags: ['humor'],
          effects: ['recruit korr', 'rel korr affection 2'], next: 'korr_join',
        },
        {
          text: `We're going somewhere worse than this — Valdros, maybe further. Walk with us.`, tone: 'pragmatic', tags: ['boldness', 'honesty'],
          effects: ['recruit korr', 'rel korr respect 3'], next: 'korr_join',
        },
        {
          text: `(Insight) The voice in the fog. You know whose it is.`, once: true, tone: 'curious', tags: ['honesty'],
          check: { skill: 'insight', dc: 14, who: 'player' }, success: 'korr_read', failure: 'korr_unread',
        },
        { text: `Thank you for Piet. Good luck, Korr.`, tone: 'leave', next: 'korr_stays' },
      ],
    },
    korr_read: {
      speaker: 'dm',
      text: `It is not fear in his face when he speaks of the voice. It is grief — old, careful grief, carried the way you carry a full cup across a room. Whoever is calling him, he owes them something, and he has not paid it.

Korr sees you see it. He doesn't look away. “Someone I owe a song,” he says. “That is all I will say on a log in a stream.”`,
      effects: ['rel korr respect 2'],
      next: 'korr_why',
    },
    korr_unread: {
      speaker: 'comp:korr',
      text: `“A voice,” says Korr, flatly. His face is a closed door. “That is all.”`,
      next: 'korr_why',
    },
    korr_join: {
      speaker: 'comp:korr',
      text: `Korr considers this for exactly as long as it takes him to shoulder the axe. “Yes,” he says. “But know this. In a fight, sometimes I go somewhere. In my head. If I do not come back when the fight is done—” he looks at you steadily “—call my name. Loud. Until I answer.”`,
      options: hollowClose(`Now — Lenn.`, 'a1w_lenn_fate'),
    },
    korr_stays: {
      speaker: 'comp:korr',
      text: `Korr nods. “I will sit here a while. My legs have opinions.” He settles on the larch with the axe across his knees. “If you change your mind, I am easy to find. I am the large one.”`,
      options: hollowClose(`(Go.)`, 'a1w_lenn_fate'),
    },
  },
};

const KORR: DialogueTree = {
  id: 'a1w_korr',
  title: 'Korr Ashmane',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: `Korr is sitting on the fallen larch where you left him, sharpening his axe in long, patient strokes. He looks up. “You came back,” he says.`,
      options: [
        { text: `Come with us, Korr.`, tone: 'friendly', tags: ['protect'], effects: ['recruit korr', 'rel korr trust 2'], next: 'join' },
        { text: `Just passing. Rest well.`, tone: 'leave', end: true },
      ],
    },
    join: {
      speaker: 'comp:korr',
      text: `He stands, and keeps standing for some time, there being a great deal of him. “Good,” he says. “My legs have finished their opinions.” He falls in beside you. “If I go somewhere in a fight — call my name. Loud.”`,
    },
  },
};

const LENN_FINISH = (text: string): DialogueOption[] => hollowClose(text, 'a1w_piet_safe');

const LENN: DialogueTree = {
  id: 'a1w_lenn',
  title: 'The Doorstep',
  start: 'first',
  nodes: {
    first: {
      speaker: 'dm',
      text: `The bottom of the hollow is very still. Mist lies knee-deep, and the trees lean in close overhead, and in the middle of the mist there is a doorstep.

Just a doorstep: three worn stone steps going up to nothing. Sitting on the bottom step, elbows on his knees, is a lean, grey-bearded man in a woodcutter's apron. Lenn Fell. His hands, hanging between his knees, have gone the colour of ash up to the wrist, and you can see the stone of the step through them.

Then your eyes adjust, the way they do to a dark room, and the rest of it is there.

A cottage. Low, whitewashed, a vegetable patch, smoke rising from the chimney. Washing on a line. In the doorway at the top of the steps, a woman in a flour-dusted apron, drying her hands and smiling down at Lenn with such ordinary, everyday love that it hurts to look at. At her hip, a little girl with Lenn's nose clutches a straw doll. Both of them are grey and soft at the edges, like a drawing someone has begun to rub out.`,
      effects: ['quest a1w_woodcutters search'],
      next: 'maddie',
    },
    maddie: {
      speaker: 'a1w_maddie',
      text: `“Supper's on, love.”

She has said it before. You can tell. She will say it again.`,
      next: 'lenn',
    },
    lenn: {
      speaker: 'a1w_lenn',
      text: `Lenn doesn't look round. “I know,” he says. “Before you say it. I know she isn't real.” His voice is quite calm. “Her name's Maddie. Madlen Cray, from the mill at Eastbrook. I never met her. I remember the wedding. I remember her hands. I remember the night Bett was born and the midwife was late and I had to—” He stops. “Both. I remember both. Forty years of cutting wood and sleeping alone, and fifteen years of *her*, at the same time, in the same head.” He looks at his grey hands. “It doesn't hurt. You'd think it would hurt.”`,
      interjections: [
        { who: 'ilyra', text: `Ilyra kneels in the wet grass beside him, not touching him. “I know a man,” she says quietly, “who remembers being married to me. We never met either.” Lenn turns his head and looks at her for the first time. “What did you do?” “I'm still deciding,” says Ilyra.` },
        { who: 'brakka', text: `Brakka has stopped at the edge of the mist. “Two memories of the same life,” she says, very low. “And one of them's a lie, and you don't get to know which.” She does not come any closer.` },
        { who: 'tessa', text: `Tessa is looking at the little girl with the straw doll. The little girl is looking back. Tessa waves, very small. The little girl waves back. Tessa turns away fast.` },
        { who: 'kael', text: `Kael, for once, has nothing to say. He is looking at the washing on the line — the small shirts among the big ones. It is the sort of thing a person notices, if they grew up without one.` },
      ],
      next: 'choice',
    },
    choice: {
      speaker: 'dm',
      text: [
        { if: 'a1w_lenn_slipping', text: `The grey has crept past Lenn's elbows. In the doorway, Maddie calls again — *supper's on, love* — and his head turns toward her, just a little. You do not have long.` },
        { text: `The mist stirs around the steps. In the doorway, the woman waits.` },
      ],
      decision: true,
      options: [
        {
          text: `(Persuasion) Agna's waiting up top with a red cord, Lenn. Your sister. Your real one. Come home.`, if: '!a1w_lenn_slipping',
          tone: 'compassionate', tags: ['mercy', 'protect'], check: { skill: 'persuasion', dc: 13, advIf: 'a1w_piet_safe' },
          successEffects: ['set a1w_lenn_fate returned', 'xp 75'], success: 'home',
          failureEffects: ['set a1w_lenn_slipping'], failure: 'slipping',
          voices: { brakka: `Bring him back. Someone up there remembers him.`, korr: `His sister waits. Tell him.` },
        },
        {
          text: `[Resonance] Hold the door open long enough for a real goodbye — and let him carry something back. (Spend 1 Resonance)`, if: 'resunlocked && res>=1',
          tone: 'resonance', tags: ['mercy', 'forbidden'], effects: ['res -1', 'instab 1', 'set a1w_lenn_fate remembered', 'xp 100'], next: 'goodbye',
          voices: { ilyra: `Let him say goodbye. Properly. Nobody ever gets to.`, tessa: `Let him keep them. Somebody should.` },
        },
        {
          text: `If that's where you want to be, Lenn — go. We won't stop you.`, tone: 'compassionate', tags: ['mercy', 'defiance'],
          effects: ['set a1w_lenn_fate stayed', 'xp 50'], next: 'stay',
          voices: { varek: `Let him go. Who are we to say which life is the real one?` },
        },
        {
          text: `(Grab him and haul him out of the mist. Now.)`, tone: 'aggressive', tags: ['protect', 'violence'],
          effects: ['set a1w_lenn_dragged', 'combat a1w_enc_hollow'],
          voices: { seris: `It is an echo. A lie. Pull him free.` },
        },
      ],
    },
    slipping: {
      speaker: 'dm',
      text: `Lenn smiles, sadly, and doesn't move. “Agna,” he says. “Aye. She'll be cross.” It's as if the name has to come a long way to reach him.`,
      next: 'choice',
    },
    home: {
      speaker: 'dm',
      text: `He looks at the cord around your wrist for a long time. Then — slowly, like a man getting up after a long illness — he stands, and turns, and looks up at the woman in the doorway.

“I'm sorry, Maddie,” he says. “I've a sister.”

The woman's face does something complicated, and then it is only kind. “Go on, love,” she says. “Someone ought to remember us.” She lifts the little girl's hand to wave. The girl waves. Then the doorway is empty, and the steps are three mossy stones in the mist, and Lenn Fell's hands are the colour of hands again.

He doesn't cry. He walks up out of the hollow beside you without a word, and he doesn't look back once, which is how you know what it costs him.`,
      options: LENN_FINISH(`Come on, Lenn. Let's get you home.`),
    },
    goodbye: {
      speaker: 'dm',
      text: `You put your hand on the doorframe — and it *is* a doorframe, warm painted wood under your palm, solid for as long as you hold it. The Heart beats in your chest, slow and enormous, and the grey of the cottage deepens into colour: whitewash, red geraniums, a blue checked cloth on the table inside.

“Go on,” you tell Lenn. “Say it properly.”

He goes up the steps. You do not listen. You look at the Woods instead, and give him that. When he comes back down he has the little straw doll in his hands, and his face is wet, and his hands are his own.

“She said to keep it,” he says. “Bett did. Said I'd need it more than her.” He holds the doll as though it were made of glass. “I'll remember them. Both lives. I'll carry both.”

You take your hand from the doorframe. The cottage folds away into the mist like a letter into its envelope. The doll stays.`,
      interjections: [
        { who: 'ilyra', text: `Ilyra watches Lenn cradle the doll, and her face is very naked for a moment. “Both,” she says softly. “You can carry both.” She sounds as though she is trying the idea on, to see if it fits.`, effects: ['rel ilyra affection 3'] },
        { who: 'vaelis', text: `“A persistent artefact from a counterfactual,” Vaelis murmurs, staring at the straw doll. “Made of straw. Held together by grief and a *bootlace*.” He clears his throat, rather hard. “Remarkable.”` },
      ],
      options: LENN_FINISH(`Come on, Lenn. Let's get you home.`),
    },
    stay: {
      speaker: 'dm',
      text: `Lenn looks at you, and for the first time he smiles properly. “Thank you,” he says. “Tell Agna—” He frowns. “Tell Agna,” he says again, more slowly, as if the name has grown heavy in his mouth. Then he stands, and goes up the three steps, and the woman in the doorway puts her arms around him, and the door closes.

The steps are three mossy stones in the mist. There is nobody here. There was — you are almost sure — somebody here a moment ago. You are holding a length of red cord, and you are not certain why.`,
      interjections: [
        { who: 'ilyra', text: `Ilyra is crying, without any fuss, the way someone cries who does it often and has learned not to frighten the patients. “That was mercy,” she says. “I think. Ask me again in a year.”` },
        { who: 'seris', text: `“He chose,” Seris says, rigid. “He chose a lie.” Then, quieter: “It looked like a kind one.”` },
        { who: 'korr', text: `Korr is frowning at the steps. “There was a man,” he says. “Was there a man?” Nobody answers him, and after a while he stops asking, and that is the worst part.` },
      ],
      options: LENN_FINISH(`(Climb out of the hollow.)`),
    },
  },
};

const LENN_AFTER: DialogueTree = {
  id: 'a1w_lenn_after',
  title: 'The Doorstep',
  start: 'start',
  nodes: {
    start: {
      speaker: 'dm',
      text: `The last of the grey shapes comes apart like wet paper. Lenn sits in the trampled grass where you dropped him, staring at three mossy stones in the mist that are only stones now.

He doesn't speak to you on the way up. Once, on the slope, you hear him say a name under his breath — *Bett* — and then stop himself, like a man stepping back from a cliff-edge.`,
      effects: ['set a1w_lenn_fate returned'],
      interjections: [
        { who: 'brakka', text: `Brakka walks beside Lenn the whole way up, close enough to catch him if he falls. He doesn't fall. She stays close anyway.` },
      ],
      options: LENN_FINISH(`(Climb out of the hollow.)`),
    },
  },
};

const LENN_HOME: DialogueTree = {
  id: 'a1w_lenn_home',
  title: 'Lenn Fell',
  start: [{ if: 'a1w_lenn_fate=remembered', node: 'remembered' }, { node: 'returned' }],
  nodes: {
    returned: {
      speaker: 'a1w_lenn',
      text: `Lenn is splitting kindling with short, hard, careful strokes. He nods to you without stopping. “Agna keeps asking what's wrong. I tell her nothing.” *Thock.* “It's even true, most days.”`,
    },
    remembered: {
      speaker: 'a1w_lenn',
      text: `Lenn is sitting on a stump, whittling. The straw doll sits on the stump beside him, propped up so it can see. “Making her a friend,” he says, holding up a half-carved wooden rabbit. “Agna thinks I'm soft in the head.” He smiles. “I tell her Bett's stories to the cutters' children, of an evening. They like the one about the midwife.”`,
    },
  },
};

// ───────────────────────────────────────────────────────────── Orren

const ORREN: DialogueTree = {
  id: 'a1w_orren',
  title: 'The Path-Warden',
  start: [{ if: 'a1w_orren_met', node: 'again' }, { node: 'first' }],
  nodes: {
    first: {
      speaker: 'dm',
      text: `On the path east of the river, a halfling is sitting cross-legged in the exact middle of the road, doing nothing at all.

He is small even for a halfling, brown and weathered as a walnut, in a green-grey cloak that is mostly patches. A bow lies across his knees. In front of him, laid on the path in a careful row, are five pebbles, a feather, and a length of red cord. He is watching the pebbles.

As you come closer, one of the pebbles rolls — slowly, uphill, about the width of a thumb — toward the west. Toward Hollowmere.

The halfling sighs, and moves it back.`,
      effects: ['set a1w_orren_met'],
      next: 'greet',
    },
    greet: {
      speaker: 'comp:orren',
      text: `“Don't step on the path,” he says, without looking up. “Not that bit. It's thinking.” He moves the feather a fraction. “Orren Mossward. Path-warden. You're from the town. You walk like town. Loud, but polite about it.”

Then he does look up — at you — and his hand goes to his coat pocket, and stays there.

“…Oh,” he says, very quietly. “It's *you*.”`,
      interjections: [
        { who: 'korr', text: `Korr crouches to the halfling's level, which takes a while. “Mossward. You walked the caravan through the Woods. Last spring.” “You carried the cook,” says Orren. “When the bridge went.” “She was heavy.” “She was *very* heavy.” They nod at each other with deep satisfaction.` },
        { who: 'nima', text: `Nima crouches by the pebbles, fascinated, and very nearly touches one. Orren, without looking, moves her hand away with the end of his bow. “Thinking,” he reminds her. “Sorry,” whispers Nima.` },
      ],
      next: 'hub',
    },
    again: {
      speaker: 'comp:orren',
      text: `Orren is back at his pebbles. “Still leaning,” he says. “Still toward you.”`,
      next: 'hub',
    },
    hub: {
      speaker: 'comp:orren',
      text: `“Ask, then. Quietly.”`,
      options: [
        { text: `What are the pebbles for?`, once: true, tone: 'curious', tags: ['curiosity', 'nature'], next: 'pebbles' },
        { text: `What did you mean — “it's you”?`, once: true, tone: 'curious', tags: ['honesty'], next: 'you' },
        { text: `You said path-warden. Like your family?`, once: true, tone: 'friendly', next: 'gran' },
        { text: `We're going to Valdros. Come with us — help us find your grandmother's road.`, if: 'a1w_orren_gran', tone: 'friendly', tags: ['nature', 'tradition'], effects: ['recruit orren', 'rel orren trust 4'], next: 'join' },
        { text: `Whatever you're carrying, I'd rather you walked with us than followed us. Quietly.`, tone: 'friendly', tags: ['humor', 'honesty'], effects: ['recruit orren', 'rel orren affection 3'], next: 'join' },
        { text: `Good luck with the pebbles.`, tone: 'leave', next: 'stays' },
      ],
    },
    pebbles: {
      speaker: 'comp:orren',
      text: `“Paths go where they're walked. Woods have been growing new ones. Every one points at your town.” He taps the pebble that rolled. “Since the bell, the stones lean too. I want to know what they're leaning toward.” A pause. “I think it's you.”`,
      next: 'hub',
    },
    you: {
      speaker: 'comp:orren',
      text: `His hand does not leave his pocket. “Something I carry got warm when your bell rang. It's warm now.” He studies you the way he'd study weather. “Grandmother said: when a thing starts walking, follow. Quietly.” He considers you. “You're not very quiet.”`,
      next: 'hub',
    },
    gran: {
      speaker: 'comp:orren',
      text: `“Hesk Mossward. Path-warden, like me. Walked every path in the Woods. Said there was one more she never found. The Old Path.” He gathers up his pebbles one by one. “Goes to the white city, she said. Valdros. Said it didn't go *somewhere*. Went *somewhen*.” A small, dry smile. “She told stories. Most were true.”`,
      effects: ['set a1w_orren_gran'],
      next: 'hub',
    },
    join: {
      speaker: 'comp:orren',
      text: [
        { if: 'a1_old_path_known', text: `Orren looks at you for a long moment. Then he puts the pebbles away, one by one, and coils the red cord. “You've found it already,” he says. “Grandmother's road. I can smell it on your boots.” He stands — exactly as tall as you expected, which is to say not very. “Then I'll walk it with you. She said it wasn't for walking alone.” Over his shoulder, already moving: “Don't step on the moss. It's listening too.”` },
        { text: `Orren looks at you for a long time. Then he puts the pebbles away, one by one, in a pouch, and coils the red cord, and stands up — exactly as tall as you expected, which is to say not very. “Grandmother said the Old Path wasn't for walking alone,” he says. “All right. I'll come.” He sets off without waiting to see if you follow. Over his shoulder: “Don't step on the moss. It's listening too.”` },
      ],
    },
    stays: {
      speaker: 'comp:orren',
      text: `“Thank you.” He goes back to watching the pebbles. As you leave, one of them rolls after you, a thumb's width, and he does not move it back.`,
    },
  },
};

const HESK_MARK: DialogueTree = {
  id: 'a1w_hesk_mark',
  title: 'The Path-Warden\'s Mark',
  start: 'first',
  nodes: {
    first: {
      speaker: 'dm',
      text: `Orren stops so suddenly that whoever is behind him walks into him. He is staring at an ash tree at the side of the path — at a mark cut into its bark at halfling height: a circle with a line through it and three notches underneath, old and grown over, the edges swollen into the bark like a healed scar.

“Grandmother's,” he says.

He goes to it. He lays his hand flat over it, and it fits; his small hand covers it exactly.`,
      next: 'hesk',
    },
    hesk: {
      speaker: 'comp:orren',
      text: `“Path-warden's mark. Means: *this path is honest.* She cut it when I was six. I watched.” He traces the notches. “Three notches: honest three ways. Morning, evening, fog.”

Then his thumb stops. Below the three, so faint you would never see it unless you were looking beside someone who knew, someone has cut a fourth notch. Fresh. Pale wood. This year.

Orren goes very still. “That's her hand,” he says. “That's *her* cut. She's been dead nine years.”`,
      interjections: [
        { who: 'korr', text: `Korr says nothing. He moves to stand at Orren's back, facing outward, the way you would guard a man at a graveside.` },
        { who: 'vaelis', text: `Vaelis peers at the fourth notch and opens his mouth to say something about temporal displacement. Then he looks at Orren's face, and closes it again, and that may be the kindest thing you have ever seen him do.` },
        { who: 'nima', text: `Nima opens her mouth, and closes it, and — very carefully, for her — doesn't set anything on fire.` },
        { who: 'tessa', text: `Tessa sits down on the path beside Orren, close but not touching, the way you sit by a friend at a wake. She doesn't sing. That is how you know how much it matters.` },
      ],
      options: [
        {
          text: `What does a fourth notch mean?`, tone: 'curious', tags: ['curiosity'],
          effects: ['set a1w_hesk_mark_done', 'rel orren trust 3', 'memory orren 2 We found Grandmother\'s mark with a fourth notch cut this year. Somewhen.'], next: 'fourth',
        },
        {
          text: `(Put a hand on his shoulder, and say nothing at all.)`, tone: 'compassionate', tags: ['mercy'],
          effects: ['set a1w_hesk_mark_done', 'rel orren affection 4', 'rel orren trust 2', 'memory orren 3 You stood with me at Grandmother\'s mark and said nothing. It was the right thing.'], next: 'quiet',
        },
        {
          text: `We should keep moving, Orren.`, tone: 'pragmatic', tags: ['pragmatic'],
          effects: ['set a1w_hesk_mark_done', 'rel orren respect 1'], next: 'move',
        },
      ],
    },
    fourth: {
      speaker: 'comp:orren',
      text: `Orren is quiet a long time. “There isn't a fourth,” he says. “Three ways. Morning, evening, fog. That's all there is.” He takes his hand away from the bark. “Unless she found one more. Unless there's a time of day I don't know about.” He looks east, toward where the Old Path would run. “*Somewhen*,” he whispers.`,
      options: close(`(Walk on together.)`),
    },
    quiet: {
      speaker: 'dm',
      text: `You stand with him. After a while he leans — just a little — against your hand.

“Woods are home,” he says at last. “Even when they're strange. I keep forgetting that.” He sniffs. “Thank you for reminding me without saying anything. Grandmother would've liked that. She hated talkers.”`,
      options: close(`(Walk on together.)`),
    },
    move: {
      speaker: 'comp:orren',
      text: `“Aye.” He takes out his knife and, very carefully, cuts a small notch of his own beside hers. Then he walks on, and does not speak for a mile.`,
      options: close(`(Walk on.)`),
    },
  },
};

// ───────────────────────────────────────────────────────────── the waystone (the hard way to the Old Path)

const WAYSTONE: DialogueTree = {
  id: 'a1w_waystone',
  title: 'The Eastern Waystone',
  start: [{ if: 'a1_old_path_known', node: 'known' }, { node: 'first' }],
  nodes: {
    first: {
      speaker: 'dm',
      text: [
        { if: 'a1w_aunra_angered', text: `By the eastern road stands a waystone, knee-high, mossed to the shoulders, carved with a path-warden's mark: a circle with a line through it. Beyond it the Woods are thick and dark, and every time you look at them they arrange themselves into a different set of paths — four, then three, then seven — none of which goes anywhere you could put a name to.

Somewhere in there is the Old Path to Valdros. The Greenmother will not open it for you. You will have to find it yourselves.` },
        { text: `By the eastern road stands a waystone, knee-high, mossed to the shoulders, carved with a path-warden's mark: a circle with a line through it. Beyond it the Woods are thick and dark, and every time you look at them they arrange themselves into a different set of paths — four, then three, then seven — none of which goes anywhere you could put a name to.

Somewhere in there, the woodcutters say, is the Old Path to Valdros. The Greenmother keeps it. The Woods hide it.` },
      ],
      interjections: [
        { who: 'orren', text: `Orren crouches by the waystone and brushes the moss from the mark with his thumb. “Grandmother's,” he says. “She came this way. Many times.”` },
      ],
      options: [
        {
          text: `(Survival) Follow the black cord on Agna's map.`, if: 'item:a1w_cord_map', tone: 'pragmatic', tags: ['nature'],
          check: { skill: 'survival', dc: 12 }, successEffects: [...OLD_PATH, 'xp 100'], success: 'found_map',
          failureEffects: ['time 180', 'damage 1d6 psychic'], failure: 'lost',
        },
        {
          text: `Orren — your grandmother's marks. Can you read them?`, if: 'comp:orren', tone: 'friendly', tags: ['nature', 'tradition'],
          check: { skill: 'survival', dc: 14, advIf: 'comp:orren' }, successEffects: [...OLD_PATH, 'xp 100', 'rel orren trust 3', 'memory orren 3 I found Grandmother\'s Old Path by her marks, with you behind me.'], success: 'found_orren',
          failureEffects: ['time 180', 'damage 1d6 psychic'], failure: 'lost',
        },
        {
          text: `Korr. You've found water in glass deserts. Find us a road.`, if: 'comp:korr', tone: 'friendly', tags: ['boldness'],
          check: { skill: 'survival', dc: 15, advIf: 'comp:korr' }, successEffects: [...OLD_PATH, 'xp 100', 'rel korr respect 3'], success: 'found_korr',
          failureEffects: ['time 180', 'damage 1d6 psychic'], failure: 'lost',
        },
        {
          text: `(Survival) Read the Woods and find the Old Path ourselves.`, tone: 'pragmatic', tags: ['nature', 'boldness'],
          check: { skill: 'survival', dc: 17, advIf: 'class:ranger || class:druid' }, successEffects: [...OLD_PATH, 'xp 100'], success: 'found',
          failureEffects: ['time 180', 'damage 1d6 psychic'], failure: 'lost',
        },
        { text: `(Leave the waystone.)`, tone: 'leave', end: true },
      ],
    },
    found: {
      speaker: 'dm',
      text: `It takes until the light goes amber. You learn to ignore the paths that move and watch the ones that don't — and there, under bracken, under a hundred years of leaf-litter, are white stones worn round as eggs, running east in a line so straight it could only have been laid by people who meant it.

The moment you set foot on it, the Woods go quiet around you, the way a room goes quiet when someone it was waiting for walks in. The Old Path. It will take you to Valdros.`,
      options: close(`(Walk back to the road for now.)`),
    },
    found_map: {
      speaker: 'dm',
      text: `Agna's gran tied her black cord to things that do not move: a split boulder, a lightning-blasted oak, a spring that has run in the same place for a thousand years. You follow them one by one, map in hand, while the paths around you shuffle like cards. At the last of them, under the bracken, there are white stones worn round as eggs, running east.

The moment you set foot on it, the Woods go quiet, the way a room goes quiet when someone it was waiting for walks in. The Old Path. It will take you to Valdros.`,
      options: close(`(Walk back to the road for now.)`),
    },
    found_orren: {
      speaker: 'comp:orren',
      text: `Orren walks ahead of you for an hour, touching trees. Here a notch; there a circle and a line, half-swallowed by bark. Twice he stops, and stands with his eyes shut, listening to something you can't hear. The third time, he kneels and brushes away the leaf-litter with both hands, and under it are white stones worn round as eggs.

“There,” he says. His voice is not steady. “There you are.” He stays kneeling a long while with his palm flat on the first stone. Then he stands up and dusts off his knees. “Grandmother's road. Valdros is that way.” A pause. “Somewhen.”`,
      options: close(`(Walk back to the road for now.)`),
    },
    found_korr: {
      speaker: 'comp:korr',
      text: `Korr doesn't look at the paths at all. He looks at the light, and the way the wind sits in the treetops, and once he lies down flat with his ear to the ground for a long time. Then he gets up and walks straight into a thicket that is very obviously not a path, and on the other side of it are white stones worn round as eggs, running east.

“Old roads are like old rivers,” he says, unbothered. “They remember where they went. You only have to stop looking at what is new.”`,
      options: close(`(Walk back to the road for now.)`),
    },
    lost: {
      speaker: 'dm',
      text: `You walk for hours. The paths fold and refold around you. You pass your own footprints, then footprints that are *almost* yours, going the other way — and come out, at last, exactly where you started, by the waystone, at dusk, with sore feet and a headache like a held breath.

The Woods whisper. It sounds a great deal like laughter.`,
    },
    known: {
      speaker: 'dm',
      text: `The waystone stands by the road. Beyond it, the white stones of the Old Path run east beneath the trees, patient as ever.`,
    },
  },
};

// ───────────────────────────────────────────────────────────── the Woods, done

const WOODS_DONE: DialogueTree = {
  id: 'a1w_woods_done',
  title: 'The Whispering Woods',
  start: [{ if: '!a1_woods_done', node: 'start' }, { node: 'quiet' }],
  nodes: {
    start: {
      speaker: 'dm',
      text: [
        { if: 'a1_stone=broken', text: `On your way back through the Woods, you notice that the whispering has changed. It was half-heard before: fragments, syllables. Now it is loud, and nearly words, and some of the words are in languages that have not been spoken in three thousand years. The trees are telling each other something over and over, the way people repeat news they cannot believe.

You have done what you came to the Woods to do. The Old Path waits in the east. Behind you, the Woods are not going to be quiet again for a long time.` },
        { if: 'a1_stone=mended', text: `On your way back through the Woods, you realise the whispering has changed. Near the ford it has a rhythm now, slow and even, like breathing — like a sleeper who has stopped having the bad dream. A blackbird is singing somewhere. It is not, you are fairly sure, the same song as yesterday.

You have done what you came to the Woods to do. The Old Path waits in the east.` },
        { text: `On your way back through the Woods, the whispering follows you as it always has — half a word here, a name there. Near the ford, under it, so faint you could be imagining it, you can still hear the Whispering Stone. Not screaming any more. Waiting.

You have done what you came to the Woods to do. The Old Path waits in the east.` },
      ],
      effects: ['set a1_woods_done', 'xp 100'],
      interjections: [
        { who: 'orren', if: 'a1_stone=broken', text: `Orren walks with his hands over his ears. When you ask, he lowers them. “It's not the noise,” he says. “It's that I can *almost* understand it.”` },
        { who: 'orren', text: `Orren walks a little ahead, as he always does, and every so often reaches out to touch a tree as he passes — like a man running his hand along the wall of his own house in the dark.` },
        { who: 'korr', text: `Korr walks at the rear. Once he stops, turns, and looks back the way you came for a long moment. Then he catches up. “Nothing,” he says, before you can ask. “Only making sure nothing we left behind is following.”` },
        { who: 'tessa', text: `Tessa is humming. After a while you realise she is trying to harmonise with the Woods. After a while longer, you realise the Woods are trying to harmonise back.` },
        { who: 'vaelis', text: `Vaelis has been writing in his notebook since the ford. When you glance over, the page is covered in a single equation, crossed out and rewritten again and again. He shuts the book. “Revisions,” he says. “To something old.”` },
      ],
    },
    quiet: {
      speaker: 'dm',
      text: `The Woods whisper around you. You let them.`,
    },
  },
};

// ───────────────────────────────────────────────────────────── module

export const WOODS: ContentModule = {
  quests: [
    {
      id: 'a1w_thornwake', title: 'The Breaking of the Stone', category: 'faction', giver: 'The Whispering Woods', xp: 250,
      summary: 'The Whispering Stone, an Anchor south of the ford, is screaming. The Thornwake mean to break it; the Conclave already "mended" it.',
      stages: {
        stone: { objective: 'Examine the Whispering Stone in the ring of pillars south of the ford.', journal: 'The Greenmother\'s people say the Anchor nearest the Heartwood — the Whispering Stone — has begun to scream, and that Thorn-Elder Caddoc Briar has been seen there.' },
        camp: { objective: 'Find Caddoc Briar\'s Thornwake camp in the south-east of the Woods.', journal: 'Fresh tracks lead from the Stone toward the south-east: bare feet, and paws too big for any wolf. A ring of thorns, broken at the top, is cut into the tallest pillar.' },
        moonrise: { objective: 'Return to the Whispering Stone at moonrise, where Caddoc means to break it — and decide what you will do.', journal: 'Caddoc Briar does not want your help or your blessing. He wants a witness. At moonrise, when the Stone is thinnest, he will break it.' },
      },
      clues: {
        dell: 'Around Hollin\'s Dell, where the Conclave mended a stone, the trees no longer grow rings. Every spring is the same spring.',
        brace: 'A Conclave harmonic clamp is bolted into the Stone, pinning it to a single note. The Stone was built to breathe; the mending is what is killing it.',
        glimpse: 'Through resonance you saw what the Stone holds back: a town of white houses and blue roofs, its people pressed to the air like faces at a window — and behind them, a blank, unwriting everything it touches.',
      },
      outcomes: {
        helped: 'You helped Caddoc Briar break the Whispering Stone. The Woods will not be quiet again for a long time, and something of a town that never was stands half-sunk in the bracken.',
        stopped: 'You stood between the Thornwake and the Whispering Stone. It still stands — for now.',
        bargained: 'You talked Caddoc Briar out of breaking the Stone, and into talking to the Greenmother instead.',
      },
    },
    {
      id: 'a1w_woodcutters', title: 'Red Cord', category: 'side', giver: 'Agna Fell', xp: 200,
      summary: 'The woodcutters\' red cords moved in the night, and two men followed them into the gloam hollow.',
      stages: {
        search: { objective: 'Find Piet Marrow and Lenn Fell in the gloam hollow, in the south-west of the Woods.', journal: 'Agna Fell\'s cutters tie red cord to find their way home. Two nights ago the cords moved, and Piet Marrow and her brother Lenn did not come back from the hollow.' },
        report: { objective: 'Return to Agna Fell at the woodcutters\' camp.', journal: 'You have found what there was to find in the gloam hollow. Agna is waiting.' },
      },
      clues: {
        voices: 'Lenn heard a woman calling him "love", calling him home for his supper. Lenn has never been married.',
      },
      outcomes: {
        home: 'Both of Agna\'s men came home. Lenn does not talk about what he left at the bottom of the hollow.',
        remembered: 'Lenn came home carrying a straw doll and two lives, and chose to keep both.',
        lost: 'Lenn walked up three steps into a life he never lived. Agna does not remember that she had a brother.',
      },
    },
  ],

  dialogues: [GATE, AUNRA, DUNLA, STONE, RUE, CADDOC, BREAKING, CADDOC_BEATEN, AGNA, TREE, TREE_AFTER, KORR, LENN, LENN_AFTER, LENN_HOME, ORREN, HESK_MARK, WAYSTONE, WOODS_DONE],

  npcs: [
    { id: 'a1w_aunra', name: 'Aunra Vell', title: 'The Greenmother of the Verdant Circle', hue: 110, glyph: 'A', desc: 'An elf so old her skin has the grain of wood. A fern has rooted in her shawl; her eyes are the green-gold of light through leaves. Patient, ancient, and unsettlingly kind.' },
    { id: 'a1w_caddoc', name: 'Caddoc Briar', title: 'Thorn-Elder of the Thornwake', hue: 95, glyph: 'C', desc: 'A big man gone lean as a winter oak, beard braided with blackthorn, a crown of living bramble rooted in his scalp. Grieving, fierce, articulate.' },
    { id: 'a1w_sefa', name: 'Sefa Linden', title: 'Warden of the Heartwood Gate', hue: 140, glyph: 'S', desc: 'Lean and weather-brown in moss-stitched leathers. Holds a longbow the way other people hold a conversation.' },
    { id: 'a1w_dunla', name: 'Dunla Reedwhistle', title: 'Quartermaster of the Heartwood', hue: 75, glyph: 'd', desc: 'A stout halfling in a leaf-green apron who sorts herbs as if they owe her money.' },
    { id: 'a1w_rue', name: 'Rue Tallis', title: 'Thornwake Sentry', hue: 100, glyph: 'r', desc: 'Sixteen, fierce, brambles braided through her hair. Brackwater was her village.' },
    { id: 'a1w_agna', name: 'Agna Fell', title: 'Forewoman of the Hollowmere Woodcutters', hue: 10, glyph: 'F', desc: 'Grey-haired, built like a wine-barrel, a length of red cord wound tight around one hand.' },
    { id: 'a1w_piet', name: 'Piet Marrow', title: 'Woodcutter', hue: 30, glyph: 'p', desc: 'A young woodcutter who has spent two days up a tree and would like never to do so again.' },
    { id: 'a1w_lenn', name: 'Lenn Fell', title: 'Woodcutter', hue: 25, glyph: 'L', desc: 'Lean, grey-bearded, Agna\'s younger brother. He remembers two lives.' },
    { id: 'a1w_maddie', name: 'Maddie', title: 'A Woman in a Doorway', hue: 200, glyph: 'm', desc: 'Grey and soft at the edges, like a drawing someone has begun to rub out. She is drying her hands.' },
  ],

  items: [
    { id: 'a1w_rowan_knot', name: 'Greenmother\'s Rowan Knot', type: 'amulet', rarity: 'uncommon', value: 120, weight: 0, desc: 'A knot of rowan twigs bound in green thread, given by Aunra Vell "so the trees know you are a guest." +2 Survival, +1 Nature, +1 to saving throws.', bonus: { saves: 1, skills: { survival: 2, nature: 1 } } },
    { id: 'a1w_cord_map', name: 'Agna\'s Red-Cord Map', type: 'quest', rarity: 'common', value: 0, weight: 0, quest: true, desc: 'Oilcloth soft with handling: forty years of the woodcutters\' red cords, three generations of them. One cord, east past the river, is drawn in black: "the old road the cords won\'t hold."' },
    { id: 'a1w_conclave_brace', name: 'Conclave Harmonic Brace', type: 'quest', rarity: 'uncommon', value: 0, weight: 3, quest: true, desc: 'Brass and silver, sigil-etched, six iron bolts. It pinned the Whispering Stone to a single note. The maker\'s stamp on the underside has been carefully filed away.' },
    { id: 'a1w_heartwood_salve', name: 'Heartwood Salve', type: 'potion', rarity: 'uncommon', value: 75, weight: 0.5, stackable: true, desc: 'Green-gold, smells of crushed fern and honey. Restores 3d4+3 HP.', use: { kind: 'heal', dice: '3d4+3' } },
    { id: 'a1w_thornweave_cloak', name: 'Thornweave Cloak', type: 'cloak', rarity: 'uncommon', value: 160, weight: 1, desc: 'Woven by the Verdant Circle from bramble-fibre and moss. Things that grab at you get thorns for their trouble. +1 AC, +1 Survival.', bonus: { ac: 1, skills: { survival: 1 } } },
  ],

  shops: [
    {
      id: 'a1w_heartwood_stores', name: 'Heartwood Stores', owner: 'a1w_dunla', buyMult: 1, sellMult: 0.5, faction: 'verdant',
      discountFlags: ['a1_greenmother_met', 'a1w_circle_debt'],
      stock: [
        { itemId: 'healing_potion', qty: 4 }, { itemId: 'a1w_heartwood_salve', qty: 3 }, { itemId: 'antitoxin', qty: 3 },
        { itemId: 'elixir_courage', qty: 1 }, { itemId: 'greater_healing_potion', qty: 1, if: 'rep:verdant>=10' },
        { itemId: 'aether_draught', qty: 1, if: 'resunlocked' }, { itemId: 'a1w_thornweave_cloak', qty: 1, if: 'a1_greenmother_met' },
        { itemId: 'shortbow', qty: 1 }, { itemId: 'longbow', qty: 1 }, { itemId: 'hide_armor', qty: 1 },
        { itemId: 'hunting_trap', qty: 2 }, { itemId: 'rope', qty: 2 },
      ],
    },
  ],

  enemies: [
    {
      id: 'a1w_twilight_wolf', name: 'Twilight Wolf', type: 'beast', level: 2,
      abilities: { str: 14, dex: 15, con: 12, int: 3, wis: 12, cha: 6 }, ac: 13, hp: '4d8+4', speed: 8,
      actions: ['m_bite'], xp: 100, ai: 'pack', traits: ['pack_tactics'], loot: [['fog_essence', 0.3, 1]], glyph: 'w', color: '#8f86b8',
      desc: 'Grey-violet, frost-eyed, breath steaming on a warm night: a wolf from a world where dusk never ended. Its howl sounds like a lullaby sung by something with too many teeth. Pack Tactics.',
    },
    {
      id: 'a1w_caddoc_foe', name: 'Caddoc Briar, Thorn-Elder', type: 'humanoid', level: 4,
      abilities: { str: 14, dex: 12, con: 15, int: 12, wis: 17, cha: 14 }, ac: 15, hp: '9d8+18', speed: 6,
      actions: ['m_thorn_lash', 'm_healing_sap'], multiattack: 2, xp: 450, ai: 'caster', resources: { sap: 2 },
      loot: [['healing_potion', 0.5, 1]], gold: '3d6', glyph: 'C', color: '#4f8a3a',
      desc: 'The Thorn-Elder of the Thornwake, crowned with living bramble. Lashes twice with barbed vines that drag his foes close, and mends his people with green sap.',
    },
  ],

  encounters: [
    {
      id: 'a1_enc_gloam', name: 'Gloam Stalkers', map: 'woods', relative: true, canFlee: true, stealthDc: 13,
      enemies: [{ t: 'gloam_stalker', x: 4, y: -3 }, { t: 'gloam_stalker', x: -4, y: 3 }],
      intro: 'The light goes wrong first — an hour too late, as if dusk has come down on just this part of the Woods. Then two shapes slide out of it: twilight panthers, coats like a sky after sunset, eyes like coins of dusk. They come from a world where the sun never rose, and they hunt as though they have never once been hungry for long.',
      onVictory: ['xp 25', 'give fog_essence 1'],
    },
    {
      id: 'a1_enc_wolves', name: 'Twilight Wolves', map: 'woods', relative: true, canFlee: true, stealthDc: 12,
      enemies: [{ t: 'a1w_twilight_wolf', x: 4, y: -2 }, { t: 'a1w_twilight_wolf', x: -4, y: -2 }, { t: 'a1w_twilight_wolf', x: 0, y: 4 }],
      intro: 'A howl goes up behind you, and another answers ahead, and neither sounds like any wolf of Elyndra: long and falling and strangely sweet, like a lullaby sung by something with too many teeth. Three wolves lope out of the bracken — grey-violet, frost-eyed, their breath steaming though the night is warm.',
      onVictory: ['xp 25'],
    },
    {
      id: 'a1w_enc_tree', name: 'The Fallen Larch', map: 'woods', canFlee: true,
      enemies: [{ t: 'gloam_stalker', x: 14, y: 32 }, { t: 'gloam_stalker', x: 8, y: 34 }],
      intro: 'The stalkers turn as one, dusk-coin eyes finding you across the stream. Then they flow toward you, low and silent, like smoke that has learned to want things.',
      onVictory: ['set a1w_tree_done', 'xp 50', 'dialogue a1w_tree_after'],
    },
    {
      id: 'a1w_enc_thornwake', name: 'The Thorn-Elder at the Stone', map: 'woods',
      enemies: [{ t: 'a1w_caddoc_foe', x: 30, y: 32 }, { t: 'thornwake_warden', x: 27, y: 31 }, { t: 'gloam_stalker', x: 33, y: 29 }],
      intro: 'Caddoc sighs, and takes his hands from the Stone. “So be it.” The Thornwake step back from the pillars; the gloam stalker uncoils at the edge of the moonlight with a sound like a cello string being drawn; and all around Caddoc\'s feet, brambles come crawling up out of the earth.',
      onVictory: [...STOPPED, 'rep conclave 5', 'rep verdant -5', 'xp 50', 'dialogue a1w_caddoc_beaten'],
      onDefeat: [...STOPPED, 'rep verdant -5', 'set a1w_lost_fight', 'set a1w_caddoc_fate withdrew', 'dialogue a1w_caddoc_beaten'],
    },
    {
      id: 'a1w_enc_hollow', name: 'The Life That Never Was', map: 'woods', canFlee: false,
      enemies: [{ t: 'hollow_echo', x: 7, y: 30, elite: true }, { t: 'hollow_echo', x: 13, y: 29 }, { t: 'hollow_echo', x: 9, y: 33 }],
      intro: 'You get both hands in Lenn\'s apron and heave. The woman in the doorway screams — not in anger. In grief. The mist boils up around the steps and comes apart into shapes: grey people, half-made, reaching for him with the faces of neighbours from a village that never was.',
      onVictory: ['xp 50', 'dialogue a1w_lenn_after'],
    },
  ],

  objects: [
    // The Heartwood outpost
    { map: 'woods', object: { id: 'a1w_sefa', kind: 'npc', name: 'Sefa Linden, Warden of the Gate', x: 43, y: 15, dialogue: 'a1w_gate', glyph: 'S', color: '#7fb069' } },
    { map: 'woods', object: { id: 'a1w_aunra', kind: 'npc', name: 'The Greenmother, Aunra Vell', x: 44, y: 8, dialogue: 'a1w_aunra', glyph: 'A', color: '#a3d977' } },
    { map: 'woods', object: { id: 'a1w_dunla', kind: 'npc', name: 'Dunla Reedwhistle, Quartermaster', x: 41, y: 9, dialogue: 'a1w_dunla', glyph: 'd', color: '#c9b26b', blocks: true } },
    // The woodcutters
    { map: 'woods', object: { id: 'a1w_agna', kind: 'npc', name: 'Agna Fell, Woodcutters\' Forewoman', x: 10, y: 10, dialogue: 'a1w_agna', glyph: 'F', color: '#c0583c', blocks: true } },
    { map: 'woods', object: { id: 'a1w_woodfire', kind: 'inspect', name: 'Woodcutters\' Brazier', x: 11, y: 9, desc: 'A brazier of split oak, burning low. Every post and peg around it is tied with red wool cord, running off into the Woods in a dozen directions. Some of the knots look very old. A few look as though they tied themselves.' } },
    { map: 'woods', object: { id: 'a1w_lenn_home', kind: 'npc', name: 'Lenn Fell', x: 9, y: 11, if: 'a1w_lenn_fate=returned || a1w_lenn_fate=remembered', dialogue: 'a1w_lenn_home', glyph: 'L', color: '#b0896a', blocks: true } },
    // The gloam hollow
    { map: 'woods', object: { id: 'a1w_tree', kind: 'npc', name: 'Snarling by a Fallen Larch', x: 11, y: 33, if: '!a1w_tree_done', dialogue: 'a1w_tree', glyph: '!', color: '#5d5a86', blocks: true } },
    { map: 'woods', object: { id: 'a1w_korr', kind: 'npc', name: 'Korr Ashmane', x: 12, y: 33, if: 'a1w_tree_done && !recruited:korr', dialogue: 'a1w_korr', glyph: 'K', color: '#d0603a', blocks: true } },
    { map: 'woods', object: { id: 'a1w_lenn', kind: 'npc', name: 'A Man on a Doorstep', x: 10, y: 31, if: '!a1w_lenn_fate', dialogue: 'a1w_lenn', glyph: 'L', color: '#9aa4b0', blocks: true,
      hint: { skill: 'perception', dc: 12, text: "There's smoke down there. Chimney smoke. There's no chimney." } } },
    // The Whispering Stone
    { map: 'woods', object: { id: 'a1w_stone', kind: 'inspect', name: 'The Whispering Stone', x: 30, y: 30, dialogue: 'a1w_stone', blocks: true,
      hint: { skill: 'arcana', dc: 12, text: 'That stone is an Anchor. And something is bolted into it that shouldn\'t be.' } } },
    { map: 'woods', object: { id: 'a1w_breaking', kind: 'npc', name: 'Caddoc Briar at the Stone', x: 30, y: 28, if: 'a1w_caddoc_met && !a1_thornwake', dialogue: 'a1w_breaking', glyph: 'C', color: '#4f8a3a', blocks: true } },
    // The Thornwake camp
    { map: 'woods', object: { id: 'a1w_caddoc', kind: 'npc', name: 'Caddoc Briar, Thorn-Elder', x: 46, y: 31, if: '(!a1w_caddoc_met || a1_thornwake) && !a1w_caddoc_gone', dialogue: 'a1w_caddoc', glyph: 'C', color: '#4f8a3a', blocks: true } },
    { map: 'woods', object: { id: 'a1w_rue', kind: 'npc', name: 'Rue, Thornwake Sentry', x: 46, y: 29, if: '!a1w_caddoc_gone || a1w_caddoc_fate=moot', dialogue: 'a1w_rue', glyph: 'r', color: '#8fbf6a', blocks: true } },
    { map: 'woods', object: { id: 'a1w_thornfire', kind: 'inspect', name: 'The Thornwake Fire', x: 47, y: 31, desc: 'A fire of thorn-branches that burns green at its heart and gives off a smell like cut grass after rain. Small charms of knotted bramble hang from the willow-frames around it, one for each name. There are a great many names.' } },
    // Orren
    { map: 'woods', object: { id: 'a1w_orren', kind: 'npc', name: 'A Halfling Watching Pebbles', x: 36, y: 18, if: '!recruited:orren', dialogue: 'a1w_orren', glyph: 'O', color: '#8db06a', blocks: true } },
    { map: 'woods', object: { id: 'a1w_hesk_mark', kind: 'inspect', name: 'A Path-Warden\'s Mark', x: 37, y: 17, if: 'comp:orren && !a1w_hesk_mark_done', dialogue: 'a1w_hesk_mark' } },
    // The eastern waystone (the hard way to the Old Path)
    { map: 'woods', object: { id: 'a1w_waystone', kind: 'inspect', name: 'Eastern Waystone', x: 52, y: 19, dialogue: 'a1w_waystone' } },
    // Map-wide catch: once the Old Path is known and the Thornwake decided, the Woods' main beats are done.
    { map: 'woods', object: { id: 'a1w_done_trigger', kind: 'trigger', name: 'The Woods Exhale', x: 22, y: 19, radius: 60, if: DONE_COND, dialogue: 'a1w_woods_done' } },
  ],

  enter: {
    woods: [
      { if: 'a1_stone=broken', text: 'The Whispering Woods close around the road, and they are not whispering any more. They are talking — loud, overlapping, almost words — and here and there between the trunks you glimpse a blue-tiled roof, a bronze-lidded well, that will not quite stay in the corner of your eye.' },
      { if: 'a1_woods_done && a1_stone=mended', text: 'The Whispering Woods close around the road like a held breath let go. The wind in the leaves still sounds like voices, but from somewhere south of the ford comes a deep, contented hum, like bees in a lime tree, and the red cords lie where the woodcutters tied them.' },
      { if: 'a1_woods_done', text: 'The Whispering Woods close around the road. Half a word here, a name there. The red cords hang where the woodcutters tied them, and the Old Path waits in the east.' },
      { if: 'comp:orren', text: 'The Whispering Woods close around the road like a held breath. The wind in the leaves sounds almost like voices — half a word here, a name there. Beside you, Orren lets out a long breath of his own and, without seeming to notice he is doing it, reaches up to touch the bark of the first tree he passes, the way you would touch a door-frame coming home.' },
      { text: 'The Whispering Woods close around the road like a held breath. The wind in the leaves sounds almost like voices — half a word here, a name there — and the path is not quite where the woodcutters\' red cords say it should be. Smoke rises from a camp to the north-west; on a hill to the north-east, something vast and grey that might once have been a tree stands over a grove.' },
    ],
  },
};
