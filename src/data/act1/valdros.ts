/**
 * Act I — main storyline (Writer C): quest `a1_main`, Hollowmere the morning after (council, Hale & Corvin,
 * Maren's request, Seris), the ruins of Valdros and their reality shifts (Vaelis, the flickers, the Conclave
 * scout), the Senate Dome (Maren's betrayal, the Conclave ambush, Ossaryx, Severin's projection, the end of
 * Act I) and the road events between regions.
 *
 * Flags set here (see docs/ACT1_SPEC.md): valdros_reality, valdros_ambush_started, valdros_done,
 * a1_maren_fate, ossaryx_resolved, ossaryx_fate, a1_severin, a1_complete. Everything else is prefixed a1v_.
 */
import type { ContentModule } from './module';
import type { DialogueTree, Interjection } from '../schema';

// ─────────────────────────────────────────────────────────────── shared conditions

/** Ysolt leads the ambush if she was fought or escaped in the Prologue; otherwise High Seeker Vex does. */
const YS = '(ysolt_outcome=fought || ysolt_outcome=escaped)';
const NYS = '!(ysolt_outcome=fought || ysolt_outcome=escaped)';
/** The party knows the Dome is a trap and has not already sprung it by touching the Anchor. */
const TURN = '!a1v_touched && (a1_warned_of_ambush || a1v_scout_talked || a1v_ambush_spotted)';
/** Enough understanding of Ossaryx's lost world to attempt sending it home. */
const UNDERSTANDS = '(a1v_knows_ysmerond || item:a1v_wyrm_lantern || a1v_hoard_known || a1v_anchor_read)';

// ─────────────────────────────────────────────────────────────── quest

const QUEST = {
  id: 'a1_main', title: 'Whispers of the Veil', category: 'main' as const, giver: 'Hollowmere', xp: 600,
  summary: 'The bell is silent, but the Veil is still fraying — and everyone on Elyndra who matters now knows that you carry the Heart of Aether.',
  stages: {
    aftermath: {
      xp: 1000,
      objective: 'Hollowmere, the morning after: speak with the town council under the Lantern Tree (Mayor Brannock and Captain Hale) and with Sister Maren.',
      journal: 'The fog has gone, and it has taken people with it. Hollowmere is counting itself, and the council wants a word with the strangers who came up out of the cathedral holding something that beats.',
    },
    woods: {
      objective: 'Seek the Greenmother of the Verdant Circle in the Whispering Woods (and, if you like, learn what Ashenford knows). Someone there must know the way to Valdros.',
      journal: 'Sister Maren believes the Anchor beneath the ruins of Valdros can steady Hollowmere\'s, and has gone ahead to wait for you there. Nobody in Hollowmere knows the way to a city that has been lost for two thousand years. The Verdant Circle might.',
    },
    old_path: {
      xp: 2500,
      objective: 'Follow the Old Path to the ruins of Valdros, where Sister Maren is waiting.',
      journal: 'The Old Path runs through the Woods to Valdros, greatest city of the Charter era. Travellers say it has been flickering lately, as though it cannot decide which Valdros it is.',
    },
    valdros: {
      xp: 3000,
      objective: 'Find a way into the Senate Dome. In this Valdros its doors are sealed, but the city flickers between other lives — the flickers in its streets may open a door that the ruin has closed.',
      journal: 'Valdros is four cities wearing one name: the ruin, a Valdros that burned, a Valdros the river drowned, and a Valdros where nobody ever left. Maren has gone ahead to the Anchor beneath the Senate Dome.',
    },
    dome: {
      xp: 3000,
      objective: 'Confront what waits at the Anchor beneath the Senate Dome.',
      journal: 'Ten thousand senators once argued in the Senate Dome about the shape of the world. Now there is only the Anchor, Sister Maren and her lanterns — and the feeling of being watched from the upper tiers.',
    },
    wyrm: {
      objective: 'Deal with Ossaryx, the Gloaming Wyrm.',
      journal: 'The Anchor ruptured, and something came through from a world where it is always evening: a vast, grieving wyrm wound in a hoard of stolen lanterns.',
    },
    severin: {
      objective: 'Hear the voice in the Anchor.',
      journal: 'The Anchor is still awake. Someone on the other side of it has been waiting to speak to you.',
    },
    done: {
      objective: 'Act I complete.',
      journal: 'You fled Valdros with Conclave Seekers on the road behind you and an Archon\'s voice in your ears. The road leads toward Solmara.',
    },
  },
  clues: {
    maren_request: 'Sister Maren says the Anchor beneath Valdros is the "sister-stone" of Hollowmere\'s, and that laying the Heart against it could steady the town. She seemed very sure, and very tired.',
    corvin_word: 'Corvin Thale pointed you to the Unbound in Ashenford: a safe house under a cooper\'s shop in the Low Quarter.',
    conclave_instruments: 'Conclave survey instruments stand in the ruins of Valdros, freshly set, every lodestone aimed at the Senate Dome.',
    scout: 'A Conclave watcher admitted it: Seekers have been waiting in the upper tiers of the Senate Dome for the bearer to touch the Anchor.',
    maren_letter: 'Maren\'s letter from the Archon: "The Heart of Aether can restore what was erased. With it, I can return your daughter to you."',
    ysolt_letters: 'Seeker Ravencourt let slip that the Archon had a correspondent in Hollowmere — forty-one letters in eight years.',
    ysmerond: 'Ossaryx came from Ysmerond, the Evening Sea: an Elyndra where the sun never rose after the Unmaking, lit only by lanterns.',
    hoard: 'Among the lanterns in Ossaryx\'s hoard are paper lanterns from Hollowmere\'s Lantern Tree — the ones whose names faded on the night of the bell.',
    many_anchors: 'Severin Cael: there are some forty Anchors that matter, and every one of them answers to the Heart.',
    other_realities: 'Severin Cael: other realities lie alongside this one — pages torn out of the world. Ossaryx came from one of them.',
  },
  outcomes: {
    refused: 'You refused Archon Severin Cael to his face. He thanked you for your honesty and told you which roads his Seekers were watching.',
    listened: 'You listened to Archon Severin Cael without saying yes or no. He seemed to think that was the beginning of something.',
    tempted: 'Archon Severin Cael described a world without plague or grief, and you let yourself want it. He noticed.',
  },
};

// ─────────────────────────────────────────────────────────────── helpers

/** A flicker in Valdros that shifts the city into one of its other realities. */
function flicker(id: string, reality: 'burning' | 'flooded' | 'inhabited', p: {
  title: string; look: string; arcanaFail: string; failEffects: string[]; arrive: string; vaelis: string; here: string;
  interjections?: Interjection[];
}): DialogueTree {
  const set = [`set valdros_reality ${reality}`, 'set a1v_shifted', `set a1v_seen_${reality}`];
  return {
    id, title: p.title,
    start: [{ if: `valdros_reality=${reality}`, node: 'here' }, { if: 'valdros_reality', node: 'other' }, { node: 'a' }],
    nodes: {
      a: {
        speaker: 'dm', text: p.look, interjections: p.interjections,
        options: [
          { text: `[Resonance] Reach into the flicker and hold it open. (Spend 1 Resonance)`, if: 'res>=1', lockedText: 'Requires 1 Resonance.', tone: 'resonance', tags: ['curiosity', 'forbidden'], effects: ['res -1', ...set], next: 'arrive' },
          { text: `[Arcana] Find the seam by craft and force it wider.`, check: { skill: 'arcana', dc: 14, advIf: 'a1v_instruments_read || comp:nima' }, tone: 'curious', tags: ['knowledge'], successEffects: set, success: 'arrive', failureEffects: [...p.failEffects, ...set], failure: 'fail' },
          { text: `[Vaelis] Ask Vaelis to steady the shift.`, if: 'comp:vaelis', tone: 'class', tags: ['knowledge'], effects: [...set, 'rel vaelis respect 1'], next: 'vaelis' },
          { text: `Leave it be.`, tone: 'leave', end: true },
        ],
      },
      fail: { speaker: 'dm', text: p.arcanaFail, next: 'arrive' },
      vaelis: { speaker: 'comp:vaelis', text: p.vaelis, next: 'arrive' },
      arrive: { speaker: 'dm', text: p.arrive, end: true },
      here: {
        speaker: 'dm', text: p.here,
        options: [
          { text: `Let go, and return to the ruined Valdros.`, tone: 'pragmatic', effects: ['unset valdros_reality'], next: 'back' },
          { text: `Stay in this Valdros a while longer.`, tone: 'leave', end: true },
        ],
      },
      other: {
        speaker: 'dm', text: `The flicker shows a different Valdros from the one you are standing in. To reach it, you would first have to let go of this one.`,
        options: [
          { text: `Let go of this Valdros.`, tone: 'pragmatic', effects: ['unset valdros_reality'], next: 'a' },
          { text: `Not now.`, tone: 'leave', end: true },
        ],
      },
      back: { speaker: 'dm', text: `You open your hand, and the city opens with it. White stone, strangling roots, cracked mosaics, the hum. The ruin settles back over you like dust after a slammed door. Somewhere, very faintly, the other Valdros goes on without you.`, end: true },
    },
  };
}

// ─────────────────────────────────────────────────────────────── dialogues

const DIALOGUES: DialogueTree[] = [
  // ═══════════════════════════════════════════ HOLLOWMERE, THE MORNING AFTER
  {
    id: 'a1v_morning', title: 'The Morning After',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        effects: ['quest a1_main aftermath'],
        text: [
          { if: 'rescued_count>=3', text: `Hollowmere wakes the way a hand unclenches: slowly, and aching.

Smoke rises from chimneys that were cold an hour ago. Somebody is sweeping broken glass outside Quill's Sundries and singing while she does it, badly, on purpose. The miller's children are chasing each other round the well as though nothing happened last night, which is how children say that something did. A woman walks the square calling a man's name, and the man walks beside her holding her hand, answering every time; she only wants to keep hearing him say it.

The Lantern Tree has lost half its lanterns to the night. The ones that remain are mostly blank, the names gone like frost.` },
          { text: `Hollowmere wakes the way a hand unclenches: slowly, and aching.

Smoke rises from chimneys that were cold an hour ago. Somebody is sweeping broken glass outside Quill's Sundries. Two houses on Tanner's Row have their shutters closed and a chalk mark on the door, the old sign for a house in mourning, though nobody can say for whom. A woman walks the square calling a man's name, and the man walks beside her holding her hand, answering every time; she only wants to keep hearing him say it.

The Lantern Tree has lost half its lanterns to the night. The ones that remain are mostly blank, the names gone like frost.` },
        ],
        interjections: [
          { who: 'brakka', text: `Brakka counts roofs under her breath, the way other people count blessings. "Six need thatch. One needs a miracle. The wall held." A pause. "The wall held," she says again, quieter, as if she needed to hear it.` },
          { who: 'ilyra', text: `Ilyra has stopped beside the woman calling her husband's name. She doesn't interrupt. She only stands near enough that the woman isn't alone with it.` },
          { who: 'kael', text: `Kael watches a grey crow on the cathedral roof watching him back. "That bird," he says, "has a silver ring on its leg and the posture of a clerk. I hate it."` },
          { who: 'tessa', text: `Tessa is humming the lullaby from the undercroft without seeming to know it. When she notices, she stops, and doesn't start anything else.` },
        ],
        next: 'b',
      },
      b: {
        speaker: 'dm',
        text: [
          { if: 'cq_seris_outcome=condemned', text: `A white cord has been strung across the south road, hung with the sunburst seals of the Order of the Last Dawn: INTERDICT. People step over it carefully, as though it might bite. Under the Lantern Tree, Mayor Edda Brannock has dragged a trestle table out of the town hall and buried it in lists. Captain Hale stands beside her with his helmet under his arm. Sister Maren waits a little apart, by the cold brazier, with her lanterns.` },
          { if: 'recruited:seris', text: `Under the Lantern Tree, Mayor Edda Brannock has dragged a trestle table out of the town hall and buried it in lists. Captain Hale stands beside her with his helmet under his arm, looking like a man who has not sat down since midnight. Sister Maren waits a little apart, by the cold brazier, with her lanterns. By the south road, a rider in the Order's white and gold is watering her horse and waiting for a verdict.` },
          { text: `Under the Lantern Tree, Mayor Edda Brannock has dragged a trestle table out of the town hall and buried it in lists. Captain Hale stands beside her with his helmet under his arm, looking like a man who has not sat down since midnight. Sister Maren waits a little apart, by the cold brazier, with her lanterns.

And at the edge of the square, very still, a knight in the white and gold of the Order of the Last Dawn is watching everyone. Including you. Especially you.` },
        ],
        interjections: [
          { who: 'seris', if: 'cq_seris_outcome=condemned', text: `Seris looks at the white cord across the road and does not look away. "I did that," she says. "It was the law. I keep waiting for it to feel like the law."` },
          { who: 'seris', if: 'cq_seris_outcome=warded', text: `Seris touches the lamp-sigil she chalked on the Lantern Tree's trunk at dawn: the Lantern Clause, the town under her own light. "If they come for Hollowmere," she says, "they come through me first. That is not a threat. It is a filing."` },
          { who: 'seris', if: 'cq_seris_outcome=questioned', text: `Seris watches the south road, where the Order's rider vanished with her plea. "They'll send someone to ask why a Knight-Oathsworn begged instead of judging," she says. "I'll have an answer. I think."` },
          { who: 'seris', if: 'cq_seris_outcome=spared', text: `Seris's hand rests on her coat where the sealed orders used to be. They went south unopened, with a lie in her handwriting. She doesn't say anything. She doesn't have to.` },
          { who: 'seris', if: '!cq_seris_outcome', text: `Seris watches the Order's rider by the south road. Her sealed orders are inside her coat, against her heart, and she keeps touching them as though they might have opened on their own. "I am supposed to judge this town," she says. "I have been looking for the rot since dawn. I keep finding bread."` },
        ],
        options: [
          { text: `Join the Mayor and the Captain at their table.`, tone: 'friendly', effects: ['dialogue a1v_council'], end: true },
          { text: `Look around first.`, tone: 'leave', end: true },
        ],
      },
    },
  },
  {
    id: 'a1v_council', title: 'The Council under the Lantern Tree',
    start: [{ if: 'a1v_council_done', node: 'after' }, { node: 'a' }],
    nodes: {
      a: {
        speaker: 'mayor',
        effects: ['quest a1_main aftermath'],
        text: [
          { if: 'rescued_count>=3', text: `"Sit, if you like. Nobody else will." Edda Brannock taps the topmost list with an ink-black finger. "Three hundred and twelve people in Hollowmere at sundown. Three hundred and nine this morning, and four I've never seen before who know where my spoons are kept." She looks up. "Everyone the watch sent you after came home. I've written that down too. I wanted it somewhere it couldn't fade."` },
          { text: `"Sit, if you like. Nobody else will." Edda Brannock taps the topmost list with an ink-black finger. "Three hundred and twelve people in Hollowmere at sundown. Three hundred and four this morning, and four I've never seen before who know where my spoons are kept." She looks at the numbers for a moment. "I've lost people before. Fevers. The river. I've never lost them so that their own mothers argue with me about whether they existed."` },
        ],
        next: 'b',
      },
      b: {
        speaker: 'hale',
        text: [
          { if: 'corvin_fate=handed_over', text: `Captain Hale clears his throat. "Watch report, such as it is. Fog's gone. Hounds are gone. The scholar Thale's in my cells, and a Covenant magistrate's riding out from Ashenford to hear his case." He scratches his beard. "Magistrates from Ashenford don't hear cases. They close them."` },
          { if: 'corvin_fate=killed', text: `Captain Hale clears his throat. "Watch report, such as it is. Fog's gone. Hounds are gone. That scholar who lodged at the Lantern & Lamb never came back up out of the cathedral." He looks at you, steadily, and lets the silence ask the question for him.` },
          { text: `Captain Hale clears his throat. "Watch report, such as it is. Fog's gone. Hounds are gone. Scholar Thale's gone too — and left word for you, which I'll get to." He scratches his beard. "And a rider in Covenant colours took one look at us at dawn and turned back for Solmara at the gallop. That's never good news. That's news on its way to becoming somebody's orders."` },
        ],
        options: [
          { text: `"What does Hollowmere need?"`, once: true, tone: 'compassionate', tags: ['charity'], next: 'need' },
          { text: `"What do you want done about the Heart?"`, once: true, tone: 'pragmatic', next: 'heart' },
          { text: `"Where do we start? Something is breaking, and it isn't only here."`, once: true, tone: 'curious', tags: ['curiosity'], next: 'start' },
          { text: `"We're done here. We'll find out what's happening."`, tone: 'pragmatic', next: 'close' },
        ],
      },
      need: {
        speaker: 'mayor',
        text: `"Thatch. Carts. Two roofers who aren't drunk. A week without anyone new riding in to tell us what we are." She ticks them off. "Lord-Marshal Vanbrook's 'relocation officers' cleared four towns in the west last year, for their own good. I can hold this town together with lists. I can't hold it together with lists and soldiers." She looks at you. "The best thing you can do for Hollowmere is make sure that when they come, they come for something that isn't us."`,
        interjections: [
          { who: 'kael', text: `"She's right," Kael says, low. "When the Covenant decides a town's a problem, the town stops being a town and starts being a column in a ledger. I've seen the ledger."` },
        ],
        next: 'b',
      },
      heart: {
        speaker: 'mayor',
        text: `"I want it as far from Hollowmere as legs and horses can take it." Edda doesn't soften it. Then, after a moment: "I'd also like you to come back. I haven't decided which I'd like more." She glances at the crow on the cathedral roof. "Either way, people know. A Conclave bird was here before the fog had finished lifting."`,
        interjections: [
          { who: 'vaelis', text: `Vaelis follows her glance to the crow. "Courier-familiar. Conclave issue. Bound to a lodestone in Ashenford, I'd guess." He sniffs. "Inelegant. Effective. Like most things the Conclave builds once the clever people have left."` },
        ],
        next: 'b',
      },
      start: {
        speaker: 'hale',
        text: `"Old Wenna says the stone under the cathedral isn't the only one," Hale says. "There's another in the Whispering Woods. The Verdant Circle keeps it — or kept it — and their Greenmother would know if it's failing too. Wenna says the Greenmother's older than the town." He grimaces. "Then there's Ashenford. Covenant garrison, Conclave licensing office, half the gossip in the east. If anyone knows who's coming for you, it's somebody in Ashenford who'll sell it."`,
        effects: ['set a1v_heard_greenmother'],
        next: 'b',
      },
      close: {
        speaker: 'mayor',
        decision: true,
        text: `Edda Brannock stacks her lists and squares their edges, which is how you can tell she is moved. "Then go and find out. Take what the town can spare." She slides a small purse and a pair of stoppered bottles across the table: Wenna's work, from the smell. "It isn't much. It's what we have."`,
        options: [
          { text: `Accept it. "We'll put it to good use."`, tone: 'friendly', effects: ['gold 40', 'give healing_potion 2', 'set a1v_council_done', 'rep hollowmere 2'], next: 'end' },
          { text: `"Keep it. You'll need it more than we will."`, tone: 'compassionate', tags: ['charity'], effects: ['set a1v_council_done', 'rep hollowmere 6', 'set a1v_refused_purse'], next: 'end',
            voices: { ilyra: `"Keep it for the town. They've lost enough."`, brakka: `"Leave it. They'll need thatch more than we need coin."` } },
        ],
      },
      end: {
        speaker: 'hale',
        text: `Hale puts his helmet back on, which seems to be how he says thank you. "One more thing. Sister Maren's been wanting a word with you since dawn. Wouldn't say what about. She's been holding those lanterns like they're the only thing keeping her upright."`,
        interjections: [
          { who: 'seris', if: 'recruited:seris', text: `Seris inclines her head to the Mayor: a knight's courtesy, stiff and sincere. "The Order will hear that Hollowmere kept its lists," she says. Edda looks at her a long moment. "See that it hears the rest as well."` },
        ],
        options: [
          { text: `Go to Sister Maren.`, if: '!a1v_maren_spoke', tone: 'friendly', end: true },
          { text: `"We've spoken. It's time we were on the road."`, if: 'a1v_maren_spoke', tone: 'pragmatic', effects: ['dialogue a1v_aftermath_end'], end: true },
        ],
      },
      after: {
        speaker: 'mayor',
        text: [
          { if: 'a1_complete', text: `Edda Brannock looks up from a fresh list. "You came back," she says, and then, practical as ever, she writes your name down, so that it will stay.` },
          { if: 'a1v_aftermath_done', text: `"Still here?" Edda doesn't look up from her lists. "The Woods are east. Ashenford is south. Valdros is wherever the Verdant Circle says it is today. Go on. I'll keep your names written down."` },
          { text: `"Speak to Sister Maren," Edda says, not looking up. "Then go and do whatever it is people like you do. I'll keep the lists."` },
        ],
        options: [
          { text: `"We're ready to leave."`, if: 'a1v_maren_spoke && !a1v_aftermath_done', tone: 'pragmatic', effects: ['dialogue a1v_aftermath_end'], end: true },
          { text: `Leave her to her lists.`, tone: 'leave', end: true },
        ],
      },
    },
  },
  {
    id: 'a1v_hale', title: 'Captain Hale',
    start: [
      { if: 'corvin_fate=handed_over && !a1v_corvin', node: 'cell' },
      { if: 'corvin_fate=freed && !a1v_corvin', node: 'freed' },
      { if: 'corvin_fate=ally && !a1v_corvin', node: 'ally' },
      { if: 'corvin_fate=killed && !a1v_corvin', node: 'killed' },
      { node: 'gen' },
    ],
    nodes: {
      gen: {
        speaker: 'hale',
        text: [
          { if: 'a1_complete', text: `"Heard about Valdros," Hale says. "Heard three versions. In one you killed a dragon, in one you talked to it, in one you were the dragon." He shrugs. "I put down the second one. Seemed most like you."` },
          { text: `Hale is checking the hinges on the north gate, as if the gate had been the problem. "Watch is twelve men and a dog," he says. "The dog's the only one who slept. Go careful out there."` },
        ],
        options: [{ text: `"You too, Captain."`, tone: 'leave', end: true }],
      },
      cell: {
        speaker: 'hale',
        text: `"Your scholar." Hale jerks his head at the watch house. "Corvin Thale. He's eaten, he's slept a bit, he's apologised to me eleven times and to the door twice. Covenant magistrate's due from Ashenford in two days." He lowers his voice. "Last man an Ashenford magistrate heard for 'endangering the realm by sorcery' was hanged on the bridge. He'd been reading a horoscope."`,
        options: [
          { text: `"Let me talk to him."`, once: true, tone: 'compassionate', next: 'corvin_talk' },
          { text: `[Persuasion] "Release him to us. The Covenant will hang him for a cave-in. We'll make sure he answers for it — usefully."`, check: { skill: 'persuasion', dc: 14, advIf: 'rep:hollowmere>=10' }, tone: 'diplomatic', tags: ['mercy', 'defiance'], success: 'released', failure: 'refused' },
          { text: `"Write down what really happened down there. Let the magistrate hear it from you, not from rumour."`, tone: 'diplomatic', tags: ['honesty', 'authority'], effects: ['set a1v_corvin testified', 'rep covenant 2'], next: 'testified' },
          { text: `"He cracked an Anchor and people vanished. He's where he belongs."`, tone: 'pragmatic', tags: ['authority'], effects: ['set a1v_corvin left', 'rep covenant 3', 'rep unbound -3'], next: 'left' },
        ],
      },
      corvin_talk: {
        speaker: 'corvin',
        text: `Through the bars of the watch-house window, Corvin Thale looks smaller than he did underground. His spectacles have been mended with thread. "You came. I didn't think — well. I didn't think." He presses close and drops his voice. "Listen. If you go to Ashenford, there's a cooper in the Low Quarter. His cellar is deeper than a cooper needs. Tell them Corvin says the Heart has a bearer and the bearer has a conscience. They'll know what that means. I'm not sure I do."`,
        effects: ['set a1v_corvin_tip', 'clue a1_main corvin_word'],
        interjections: [
          { who: 'varek', text: `Varek studies the scholar through the bars with something that is almost sympathy. "The Unbound will remember you're in a cell," he says. "Whether they'll do anything about it is another question. Rememberers are rarely rescuers."` },
        ],
        next: 'cell',
      },
      released: {
        speaker: 'hale',
        text: `Hale looks at you for a long moment. Then he takes the ring of keys off his belt and weighs it in his palm. "Magistrate'll arrive to find an empty cell and a captain who can't remember where he put his keys," he says. "I'm told memory's been unreliable round here lately." He unlocks the door. Corvin stumbles out into the morning, blinking, and grips your hand in both of his. "I'll be in Ashenford," he says. "Under the cooper's. I owe you a life, and the Unbound pay their debts — eventually, and with interest, and usually in pamphlets."`,
        effects: ['set a1v_corvin released', 'set a1v_corvin_tip', 'clue a1_main corvin_word', 'rep unbound 10', 'rep covenant -5', 'xp 50'],
        interjections: [
          { who: 'seris', text: `Seris's jaw tightens. "He broke the seal that let the fog in," she says. "That deserves an answer." A pause. "It does not deserve a rope on a bridge. I will not argue."` },
        ],
        options: [{ text: `"Get out of here, Corvin."`, tone: 'leave', end: true }],
      },
      refused: {
        speaker: 'hale',
        text: `"No." Hale says it kindly, which is worse. "I gave my word to the Covenant's courier. I don't have a lot, but I have that." He sighs. "I'll write down what I saw. Every word. Maybe it'll help."`,
        effects: ['set a1v_corvin testified'],
        options: [{ text: `"Thank you, Captain."`, tone: 'leave', end: true }],
      },
      testified: {
        speaker: 'hale',
        text: `Hale nods slowly. "Aye. I can do that. Cave-in, a trapped man, a fog he didn't make on purpose, and him helping where he could." He takes out a stub of pencil. "It won't save him from the Covenant. It might save him from the bridge."`,
        options: [{ text: `Leave Hale to his writing.`, tone: 'leave', end: true }],
      },
      left: {
        speaker: 'hale',
        text: `"Aye." Hale doesn't argue. He doesn't look happy, either. "Law's the law. Somebody has to be the one who keeps it, even when it's a stupid law." He glances at the barred window. "Especially then, maybe."`,
        options: [{ text: `Leave.`, tone: 'leave', end: true }],
      },
      freed: {
        speaker: 'hale',
        text: `"Your scholar friend." Hale's mouth twitches. "Somebody chalked a broken chain on my watch-house door last night. Under it: 'Ashenford. The cooper. Ask for the Index's friend.'" He hands you a scrap of paper with the same words copied out in his blocky hand. "I wiped the door. I'm not daft. But I copied it first."`,
        effects: ['set a1v_corvin word', 'set a1v_corvin_tip', 'clue a1_main corvin_word'],
        options: [{ text: `"Thank you, Captain."`, tone: 'leave', end: true }],
      },
      ally: {
        speaker: 'hale',
        text: `Hale holds out a letter sealed with a blob of candle-wax and a thumbprint. "Thale left this with me before dawn. Said you'd come asking. Said I wasn't to read it, so I only read it the once." You break the seal. In a cramped, hurried hand: "Gone ahead to Ashenford to warn the Unbound before the Conclave's crows do. Cooper's shop, Low Quarter. Don't knock on the front. Don't trust anyone who says they're me. (Unless it IS me. You'll know: I'll apologise.) — C."`,
        effects: ['set a1v_corvin word', 'set a1v_corvin_tip', 'clue a1_main corvin_word'],
        options: [{ text: `Pocket the letter.`, tone: 'leave', end: true }],
      },
      killed: {
        speaker: 'hale',
        text: `"That scholar," Hale says. "Thale. Tobin keeps asking after him. Says his room's still locked and his boots are still by the bed." He looks at you, not unkindly. "You were down there. Is he coming back?"`,
        options: [
          { text: `"No. He died in the undercroft."`, tone: 'compassionate', tags: ['honesty'], effects: ['set a1v_corvin told'], next: 'k_truth' },
          { text: `"I don't know."`, tone: 'deceptive', tags: ['deception'], effects: ['set a1v_corvin lied'], next: 'k_lie' },
        ],
      },
      k_truth: { speaker: 'hale', text: `Hale nods. "Thought so." He takes his helmet off and holds it a moment, the way men do at gravesides. "I'll tell Tobin. He'll want to give the boots to someone who needs them."`, options: [{ text: `Leave.`, tone: 'leave', end: true }] },
      k_lie: { speaker: 'hale', text: `"Aye," says Hale. "Nobody knows much of anything, lately." He doesn't believe you. He doesn't press.`, options: [{ text: `Leave.`, tone: 'leave', end: true }] },
    },
  },
  {
    id: 'a1v_maren_request', title: 'Sister Maren\'s Request',
    start: [{ if: 'a1v_maren_spoke', node: 'after' }, { if: 'maren_forgets', node: 'f' }, { node: 'a' }],
    nodes: {
      a: {
        speaker: 'maren',
        text: `Sister Maren has not slept. You can see it in the careful way she stands, as if any sudden movement might spill her. Both of her lanterns are lit, though it is full morning.

"Thank you," she says first, before anything else, and means it. Then, quickly, as though she has rehearsed it and is afraid of losing her place: "The stone under the cathedral is not the only one. I've been through every record Saint Orlen's kept. There is a sister-stone. An Anchor beneath the old Senate Dome at Valdros, built as a pair with ours — 'the lamp that answers the lamp,' the inscription says." Her fingers tighten on the lantern-poles. "If the Heart were laid against Valdros's keystone, the two would sing to each other. Ours would remember how to hold. Hollowmere would be safe."`,
        interjections: [
          { who: 'vaelis', text: `Vaelis tilts his head. "Paired Anchors. That's a real theory," he admits. "It's mostly mine, in fact. I'd be fascinated to know where a cathedral archivist read it."` },
          { who: 'ilyra', text: `Ilyra looks at the two lit lanterns, then at Maren's face. She says nothing, but she moves a little closer, the way she does at bedsides.` },
        ],
        options: [
          { text: `"Valdros? That city's been lost for two thousand years."`, once: true, tone: 'curious', next: 'where' },
          { text: `"Do you still hang a lantern for Elsa?"`, once: true, tone: 'compassionate', tags: ['mercy'], next: 'elsa' },
          { text: `[Insight] She's holding something back. Watch her.`, once: true, check: { skill: 'insight', dc: 14 }, tone: 'curious', success: 'ins_ok', failure: 'ins_fail' },
          { text: `"If it will help Hollowmere, we'll go."`, tone: 'friendly', tags: ['protect'], next: 'agree' },
        ],
      },
      where: {
        speaker: 'maren',
        text: `"Lost to maps. Not to everyone." A ghost of her old smile. "It's deep in the Whispering Woods, past where the woodcutters' cords run out. The Verdant Circle knows the Old Path; their Greenmother has walked it. I'll go ahead — I know enough of the Woods' edges to find my way — and I'll wait for you at the Anchor." She hesitates. "It's been flickering, Valdros. They say it can't decide which Valdros it is. Don't let that frighten you. I think it's only remembering."`,
        next: 'a',
      },
      elsa: {
        speaker: 'maren',
        text: `Something crosses her face too fast to name. "Every year," she says. "Every festival since she was seven." She looks down at the second lantern. "I used to think, if I hung it high enough, someone would look up and remember her. Just one person. I'd settle for one." A breath. "Perhaps not for many more years. Perhaps soon I won't need to." She hears herself say it, and her smile comes back like a shutter closing. "Forgive me. I haven't slept."`,
        effects: ['set a1v_maren_elsa'],
        interjections: [
          { who: 'ilyra', text: `"You don't need to apologise for grief, Sister," Ilyra says gently. Maren flinches as if she'd been struck, and then thanks her, and does not meet her eyes.` },
        ],
        next: 'a',
      },
      ins_ok: {
        speaker: 'dm',
        text: `It is not a lie, exactly. The records are real; you'd bet on it. But she is telling you the part of the truth she has practised, and there is another part underneath it that she hasn't practised at all, and every so often her eyes go to the south road as though she expects someone to be standing on it. Whatever she wants from Valdros, she wants it more than she has ever wanted anything.`,
        effects: ['set a1v_maren_suspected'],
        next: 'a',
      },
      ins_fail: { speaker: 'dm', text: `She is exhausted, frightened and stubbornly hopeful, like everyone else in Hollowmere this morning. If there is anything more, it is buried too deep for you to see.`, next: 'a' },
      agree: {
        speaker: 'maren',
        text: `Her shoulders drop half an inch, as if a rope has been cut. "Thank you. Thank you." She takes one of your hands in both of hers; her fingers are cold and stained with ink. "Find the Greenmother. Find the Old Path. I'll be waiting at the Anchor, with the lanterns lit so you can find me." She lets go. "I'm so glad it's you," she says, and you will remember later how carefully she said it.`,
        effects: ['set a1v_maren_spoke', 'clue a1_main maren_request'],
        next: 'go',
      },
      go: {
        speaker: 'dm',
        text: `Maren picks up her lanterns and walks toward the parsonage to pack, not hurrying, not looking back.`,
        options: [
          { text: `Return to the council. It's time to go.`, if: 'a1v_council_done', tone: 'pragmatic', effects: ['dialogue a1v_aftermath_end'], end: true },
          { text: `The Mayor and Captain Hale are still waiting at their table.`, if: '!a1v_council_done', tone: 'leave', end: true },
        ],
      },
      f: {
        speaker: 'maren',
        text: `Sister Maren is sitting on the edge of the cold brazier with a ledger on her knees, and when she sees you she stands up so fast she nearly drops it. One lantern burns beside her. On her belt there are two hooks. One of them is empty, and her hand keeps drifting to it and finding nothing.

"Thank you. For last night. For all of it." She smiles; it is gentler than it used to be, and stranger, like a house with one room shut up. "I've been reading. I couldn't sleep. There's a stone under the cathedral, you've seen it — and the records say it has a sister. An Anchor under the Senate Dome at Valdros, built as a pair with ours. 'The lamp that answers the lamp.'" Her eyes are bright. "If I could read the Valdros inscriptions, I might learn how to mend ours. Properly. Not with prayers."`,
        interjections: [
          { who: 'ilyra', text: `Ilyra watches Maren's hand reach for the empty hook again. Her own hand goes to the lantern pendant at her throat, and stays there.` },
          { who: 'vaelis', text: `"Paired Anchors," Vaelis murmurs. "A real theory, as it happens. Mostly mine." He sounds, for once, more interested than offended.` },
        ],
        options: [
          { text: `"Is something wrong, Sister? You keep reaching for that hook."`, once: true, tone: 'compassionate', tags: ['mercy'], next: 'f_hook' },
          { text: `"Valdros? That city's been lost for two thousand years."`, once: true, tone: 'curious', next: 'f_where' },
          { text: `"Then we'll meet you there."`, tone: 'friendly', next: 'f_agree' },
        ],
      },
      f_hook: {
        speaker: 'maren',
        text: `She looks down at it as though it belongs to someone else. "I don't know," she says. "I've always carried two lanterns at the festival. I'm sure of that. I just can't think who the second one was for." She laughs, unsteadily. "My mother, and — someone. It's like reaching for a step in the dark that isn't there. Isn't that silly?" She sets her hand very deliberately on the ledger instead. "There's so much I could be remembering about Valdros, and I keep wasting it on a hook."`,
        effects: ['set a1v_maren_hook'],
        interjections: [
          { who: 'tessa', text: `Tessa opens her mouth, closes it, and looks at you. You both know what Lira cost. Neither of you says it.` },
        ],
        next: 'f',
      },
      f_where: {
        speaker: 'maren',
        text: `"Lost to maps, not to everyone. The Verdant Circle knows the Old Path; the Greenmother has walked it." She hugs the ledger. "I'll go ahead. Novices of Saint Orlen used to make the pilgrimage, centuries ago — there's a way into the Dome the records call the Penitents' Stair, too narrow for more than one. I've wanted to see those inscriptions since I was a girl. Isn't that strange? I've never wanted anything for myself before."`,
        next: 'f',
      },
      f_agree: {
        speaker: 'maren',
        text: `"Good. Oh, good." She tucks the ledger under her arm. "Find the Greenmother. Find the Old Path. I'll be at the Anchor with my lantern lit. I'll have the inscriptions half-copied by the time you arrive, you'll see." At the edge of the square she turns back, frowning faintly, as though she has forgotten to say something. Then she shakes her head and goes.`,
        effects: ['set a1v_maren_spoke', 'clue a1_main maren_request'],
        next: 'go',
      },
      after: {
        speaker: 'maren',
        text: `"I'll see you at Valdros," Maren says, packing her satchel. "At the Anchor. The lanterns will be lit."`,
        options: [
          { text: `"We're leaving now."`, if: 'a1v_council_done && !a1v_aftermath_done', tone: 'pragmatic', effects: ['dialogue a1v_aftermath_end'], end: true },
          { text: `"Safe travels, Sister."`, tone: 'leave', end: true },
        ],
      },
    },
  },
  {
    id: 'a1v_aftermath_end', title: 'The Road Out of Hollowmere',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        effects: ['quest a1_main woods', 'hub woods', 'hub ashenford', 'set a1v_aftermath_done', 'xp 100'],
        text: `You gather what you have at the south gate. Somebody has hung a fresh lantern on the gatepost, unlit, with your names painted on it in a child's careful capitals. Pell, by the spelling.

East, the Whispering Woods stand along the horizon like a held breath; the Greenmother is somewhere in there, and so, if Maren is right, is the Old Path to a city no map remembers. South, the river road runs down to Ashenford, its kiln-smoke a grey thumbprint on the sky: the Covenant's garrison, the Conclave's licensing office, and everyone who might sell you news of who is coming.

In your pack, the Heart of Aether beats. You could swear it is listening.`,
        interjections: [
          { who: 'orren', text: `Orren is already facing east, head cocked, listening to the trees. "The Woods have been growing new paths for a month," he says. "Every one of them points toward Hollowmere. I'd like very much to know who they're coming to fetch."` },
          { who: 'nima', text: `Nima looks south toward Ashenford's smoke for a long moment, and her hands spark without her meaning them to. "Glassworks," she says, to no one. Then, brightly: "Right! Woods! Trees! Probably nothing on fire!"` },
          { who: 'korr', text: `Korr rolls his shoulders. "Good. Roads. I think better walking."` },
          { who: 'seris', text: `Seris looks back once at Hollowmere, the way a judge looks at a sentence she isn't finished writing. Then she turns her back on it and walks.` },
        ],
        options: [{ text: `Take to the road. (The Whispering Woods and Ashenford are now on your world map.)`, tone: 'pragmatic', end: true }],
      },
    },
  },
  {
    id: 'a1v_seris_hm', title: 'The Knight of the Last Dawn',
    start: [{ if: 'a1v_seris_met', node: 'again' }, { node: 'a' }],
    nodes: {
      a: {
        speaker: 'comp:seris',
        effects: ['set a1v_seris_met'],
        text: `The knight does not move as you approach. She has the stillness of someone trained to stand watch for a whole night and the faint grey under the eyes of someone who just did. Her armour is white enamel over steel, scrubbed clean; at her throat, a small reliquary glows like a coal.

"Seris Dawnbound. Knight-Oathsworn of the Order of the Last Dawn." Her voice is low and precise. "I was sent to judge whether Hollowmere is tainted by the Veil's collapse, and what must be done if it is. I have been watching since before dawn." Her eyes go to your pack, where the Heart is. "I watched you come down the cathedral road. You were carrying something that beats."`,
        interjections: [
          { who: 'varek', text: `Varek has stopped a careful distance away, violet eyes half-lidded. Seris's gaze touches him once and goes cold. Neither of them says anything. Neither of them needs to.` },
          { who: 'ilyra', text: `Ilyra gives the knight a small bow, priest to knight. "Sister of the Dawn. Veyra's peace on your watch." Seris returns it exactly, without warmth or insult. "And on yours, healer."` },
        ],
        options: [
          { text: `"And? Is Hollowmere tainted?"`, once: true, tone: 'curious', next: 'judge' },
          { text: `"What happens to the town if it is?"`, once: true, tone: 'pragmatic', next: 'orders' },
          { text: `"The taint isn't in Hollowmere. It's in what's underneath every town like it — and it's spreading."`, once: true, tone: 'diplomatic', tags: ['honesty'], next: 'source' },
          { text: `"Ride with us. Judge the Veil, not a town that survived it."`, if: 'a1v_seris_source', tone: 'friendly', tags: ['faith', 'boldness'], next: 'join',
            voices: { brakka: `"She stood a night's watch for strangers. Good shield-arm. Ask her."`, korr: `"She has the eyes of someone who keeps her word. Bring her."` } },
          { text: `"Good luck with your judging."`, tone: 'leave', end: true },
        ],
      },
      judge: {
        speaker: 'comp:seris',
        text: `"I don't know." It clearly costs her to say it. "My instructions describe taint: unnatural fog, the dead walking, false memories, people unmade. I have seen all of it, in one night, here." She looks at the woman by the Lantern Tree, still calling her husband's name, still holding his hand. "And this morning a baker gave the watch free bread, and the Mayor is counting everyone twice so that no one is missed. I was taught that rot spreads. I have been looking for it since dawn. I keep finding people."`,
        next: 'a',
      },
      orders: {
        speaker: 'comp:seris',
        text: `Her hand goes to a sealed packet inside her coat, stamped with the Order's sunburst. "My orders are sealed. I open them only if I find the town tainted." A pause. "I have read orders like these before. Interdict. Removal of the afflicted. The burning of the site of corruption." She does not look at the cathedral. "I have never had to be the one who opens them."`,
        next: 'a',
      },
      source: {
        speaker: 'comp:seris',
        text: `She studies you a long moment. "You believe that." It isn't a question. "Then Hollowmere is not the wound. It is where the wound bled." She looks at your pack again, and this time it is not suspicion in her face; it is something closer to dread. "If what you carry is at the root of it, then the judgment I was sent to make is the wrong size. I would be condemning a symptom."`,
        effects: ['set a1v_seris_source'],
        next: 'a',
      },
      join: {
        speaker: 'comp:seris',
        text: `Seris is quiet for a long time. Then she takes the sealed packet out of her coat and looks at it, and puts it back.

"Very well. I will follow the taint to its source, and I will judge it there." She meets your eyes, steady as a drawn line. "Understand me. I am not your friend yet. If I find the rot in you, I will say so to your face, and I will not enjoy it. But I will say it to your face." She holds out a gauntleted hand. "That is more than most judges offer."`,
        effects: ['recruit seris', 'set talk_seris_hook', 'rel seris respect 3', 'rel seris trust 2', 'memory seris 1 You asked me to judge the Veil, not a town that survived it.'],
        options: [{ text: `Take her hand.`, tone: 'friendly', end: true }],
      },
      again: {
        speaker: 'comp:seris',
        text: [
          { if: 'a1v_seris_source', text: `"You're still here." Seris hasn't moved from her post. "The offer stands, if you made one. I am not in the habit of asking twice."` },
          { text: `Seris inclines her head. "Bearer." She is still watching the square. She is still not sure what she is looking for.` },
        ],
        options: [
          { text: `"Ride with us. Judge the Veil, not a town that survived it."`, tone: 'friendly', tags: ['faith', 'boldness'], next: 'join' },
          { text: `"Then we'll leave you to your watch."`, tone: 'leave', end: true },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════ VALDROS
  {
    id: 'a1v_valdros_arrival', title: 'The Gate of Valdros',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        effects: ['quest a1_main valdros', 'set a1v_arrived'],
        text: `The Old Path ends at a gate of white stone so tall that the trees have given up trying to climb it. Beyond it lies Valdros.

Spires like bleached bones, strangled in roots. Avenues wide enough for a parade of elephants, paved in mosaics of a sky with the wrong stars in it. Fountains full of leaves. And under everything a hum, low and constant, like a choir holding one note for two thousand years. As you watch, the colonnade to your left is whole and freshly painted for a single heartbeat — blue and gold, hung with banners — and then it is ruin again, and a crow on its broken capital caws as if nothing happened.

At the far end of the great avenue, above everything, sits the Senate Dome: a white skull of a building, its doors shut.`,
        interjections: [
          { who: 'vaelis', text: `Vaelis has stopped breathing. When he starts again, it is to say, very softly, "Oh. Oh, you beautiful, impossible thing." He is not talking to anyone in the party.` },
          { who: 'brakka', text: `Brakka puts her palm flat against the gate's stone. "Good work," she says to it, as one mason to another across two thousand years. "Shame about the rest."` },
          { who: 'tessa', text: `Tessa whistles one note, testing the echo. The city answers with a different note entirely, from a direction with nothing in it. She stops whistling.` },
          { who: 'kael', text: `Kael looks at the dome, then at the wide, open, endlessly overlooked avenue between here and there. "Lovely," he says. "Nowhere to hide and a building made for watching people from. Very senatorial."` },
        ],
        next: 'm',
      },
      m: {
        speaker: 'maren',
        text: [
          { if: 'maren_forgets', text: `Sister Maren is sitting on the base of a toppled statue just inside the gate, her ledger open on her knees, a single lantern beside her. She jumps up when she sees you. "You came! I've been here since yesterday. I've copied — oh, never mind what I've copied, look at it." She sweeps her arm at the city. "The Anchor's under the Dome. In this Valdros the doors are sealed. But the city flickers — you'll see the flickers in the streets, like heat over a road. Through them there are other Valdroses: one that burned, one the river took, one where nobody ever left. Each has a door this one doesn't."` },
          { text: `Sister Maren is waiting just inside the gate, sitting on the base of a toppled statue with both lanterns lit beside her in broad daylight. She stands when she sees you, and for a moment her face does something complicated before it settles into gladness. "You came. I knew you would." She gestures at the city. "The Anchor's under the Dome. In this Valdros the doors are sealed. But the city flickers — you'll see the flickers in the streets, like heat over a road. Through them there are other Valdroses: one that burned, one the river took, one where nobody ever left. Each of them has a door this one doesn't."` },
        ],
        options: [
          { text: `"And how will you get in?"`, once: true, tone: 'curious', next: 'stair' },
          { text: `"Come with us. It isn't safe to go alone."`, once: true, tone: 'compassionate', tags: ['protect'], next: 'stay' },
          { text: `[Insight] Watch her face as she talks about the Dome.`, if: '!maren_forgets', once: true, check: { skill: 'insight', dc: 14, advIf: 'a1v_maren_suspected || a1v_letters_hint' }, tone: 'curious', success: 'ins_ok', failure: 'ins_fail' },
          { text: `[Insight] Watch her face as she talks about the Dome.`, if: 'maren_forgets', once: true, check: { skill: 'insight', dc: 12 }, tone: 'curious', success: 'f_ins', failure: 'ins_fail' },
          { text: `"We'll find a way in. Wait for us at the Anchor."`, tone: 'friendly', next: 'go' },
        ],
      },
      stair: {
        speaker: 'maren',
        text: [
          { if: 'maren_forgets', text: `"The Penitents' Stair. The old Saint Orlen novices used it on pilgrimage — it's in the records, a crawlway under the east tiers. Too narrow for armour, too narrow for more than one, and it seals behind you." She beams. "I tried it this morning to be sure. I've been dying to get at those inscriptions."` },
          { text: `"The Penitents' Stair." It comes out smoothly. "The old Saint Orlen novices used it on pilgrimage — it's in the records. A crawlway under the east tiers, too narrow for armour, too narrow for more than one. It seals behind you." She does not quite look at you. "I'll go through and wait for you at the Anchor. I'll keep the lanterns lit, so you can find me."` },
        ],
        next: 'm',
      },
      stay: {
        speaker: 'maren',
        text: [
          { if: 'maren_forgets', text: `"I'd only slow you down. I'm a records-keeper, not a — whatever you are." She squeezes your hand. "I'll be quite safe at the Anchor. It's the quietest place in the city. The hum's almost restful once you're used to it."` },
          { text: `"I'd only slow you down." She smiles her apologising smile. "And I've been alone with the Anchor all night. I'm used to it." A pause, and something in her voice goes thin. "Please. Just come. Whatever happens, come."` },
        ],
        next: 'm',
      },
      ins_ok: {
        speaker: 'dm',
        text: `She tells it well. Too well: it has the smoothness of a story told to oneself in the dark, over and over, until the edges wore off. And every time she says "the Anchor," her eyes slide past the Dome's sealed doors to its upper galleries, as though someone up there might be listening for the word. Whatever is waiting at the end of the Penitents' Stair, she is more afraid of it than of anything in these ruins.`,
        effects: ['set a1v_maren_suspected'],
        next: 'm',
      },
      f_ins: {
        speaker: 'dm',
        text: `Nothing hidden. Nothing practised. Only a scholar's greed for old words, and underneath it, like water under ice, a sorrow she cannot find the shape of. Her hand reaches for the empty hook on her belt three times while she talks. She doesn't notice once.`,
        next: 'm',
      },
      ins_fail: { speaker: 'dm', text: `She is tired and too excited and a little frightened of the ruins. So are you, if you're honest.`, next: 'm' },
      go: {
        speaker: 'maren',
        text: [
          { if: 'maren_forgets', text: `"The Anchor, then." She gathers her ledger and her one lantern and sets off down the avenue at a pace that is almost a skip, and then, at a broken arch, she simply isn't there any more, the way people in Valdros apparently aren't.` },
          { text: `"The Anchor, then." She picks up her lanterns. "Thank you. For coming. For — " She doesn't finish. She walks away down the great avenue toward the Dome without looking back, and at a broken arch halfway there she is simply gone, the way people in Valdros apparently are.` },
        ],
        interjections: [
          { who: 'ilyra', if: '!maren_forgets', text: `Ilyra watches the place where Maren vanished. "She said 'whatever happens,'" she says quietly. "People don't say that about walks."` },
          { who: 'seris', if: '!maren_forgets', text: `Seris's hand has found her sword-hilt without her seeming to notice. "That woman is carrying something heavier than lanterns," she says.` },
        ],
        options: [{ text: `Explore Valdros. (Look for the flickers — and anything else that should not be here.)`, tone: 'pragmatic', end: true }],
      },
    },
  },
  {
    id: 'a1v_vaelis', title: 'The Collapsed Observatory',
    start: [{ if: 'a1v_vaelis_met', node: 'again' }, { node: 'a' }],
    nodes: {
      a: {
        speaker: 'comp:vaelis',
        effects: ['set a1v_vaelis_met'],
        text: `In the shell of the old observatory, among fallen star-charts and a bronze armillary sphere the size of a cottage, a tall elf in a travel-stained scholar's coat is sitting cross-legged on a slab with three brass instruments ticking around him and a notebook balanced on one knee. He does not look up.

"If you're a flicker, please hold still; you're the clearest one yet. If you're a person, please be quiet; you're interrupting the single most important afternoon of the last two centuries." His pen keeps moving. "If you're from the Conclave, I'm not here, I've never been here, and I'll know if you touch my gauges."`,
        options: [
          { text: `"We're none of those. We came for the Senate Dome."`, tone: 'friendly', next: 'who' },
          { text: `"Two centuries? You don't look a day over a hundred and ninety."`, tone: 'sarcastic', tags: ['humor'], next: 'who' },
        ],
      },
      who: {
        speaker: 'comp:vaelis',
        text: `That makes him look up. His eyes are a startling green and very tired. They go to you, to your companions, and then, slowly, to your pack, and stay there. His gauges have all swung round to point at it, ticking furiously.

"Ah," says Vaelis Thorne. "Well. That explains the readings." He closes the notebook on his pen to keep the place. "Vaelis Thorne. Formerly of the Aether Conclave, expelled for reading the wrong books. Currently the only living authority on whatever this city is doing, and I've been here eleven days, so you'll understand I'm a little territorial."`,
        options: [
          { text: `"What is this city doing?"`, once: true, tone: 'curious', tags: ['curiosity'], next: 'city' },
          { text: `"Someone else has instruments in these ruins. Grey ones."`, once: true, tone: 'curious', next: 'instruments' },
          { text: `"Can you get us into the Senate Dome?"`, once: true, tone: 'pragmatic', next: 'dome' },
          { text: `"Travel with us. You want to study the Veil — we're walking straight into it."`, if: '!recruited:vaelis', tone: 'friendly', tags: ['curiosity', 'knowledge'], next: 'join',
            voices: { nima: `"Him? He's insufferable. Ask him. Ask him!"`, tessa: `"Everyone needs a footnote. Ask the footnote along."` } },
          { text: `"Good luck with your afternoon."`, tone: 'leave', end: true },
        ],
      },
      city: {
        speaker: 'comp:vaelis',
        text: `"Remembering." He says it with relish. "Every Anchor pins one history in place. This one is failing, so Valdros is being pinned in four places at once. There is the ruin you walked in through. There is a Valdros that burned the night the Quiet Decline turned loud. There is a Valdros the river took. And there is a Valdros where nobody ever left — still in session, still lighting the lamps." He taps a gauge. "Where they touch, you get flickers. Where they overlap, you can step from one to another, if you're foolish and well-equipped. I am both."`,
        next: 'who',
      },
      instruments: {
        speaker: 'comp:vaelis',
        text: `His face goes very still. "Yes. I'd noticed." A long pause. "Survey tripods. Silver lodestones, tuned to resonance spikes, aimed at the Dome. Set within the week." He turns the pen over in his fingers. "They're mine. My design, I mean. Stolen. It's a long story, and mostly about other people's failings." He doesn't sound like he believes the last part. "Somebody in the Conclave is waiting for something resonant to touch that Anchor. I'd very much prefer it wasn't you."`,
        effects: ['set vaelis_instruments_hint', 'set a1v_instruments_read', 'clue a1_main conclave_instruments'],
        next: 'who',
      },
      dome: {
        speaker: 'comp:vaelis',
        text: `"Not in this Valdros. The doors were sealed when the city was abandoned and the walls are three yards of Ithari stone." He smiles, thin and pleased. "In another Valdros, though… The burning one has a breach in the west wall. The drowned one floods the old culvert under the east tiers. The living one simply leaves its great doors open during session. Find a flicker, step through, walk in." He shrugs. "I can steady the step, if I'm with you. Otherwise it's resonance or brute arcana, and I wouldn't recommend brute arcana to anyone who likes their skin."`,
        next: 'who',
      },
      join: {
        speaker: 'comp:vaelis',
        text: `Vaelis looks at your pack for a long, long moment. Then he begins packing his gauges with quick, practised hands.

"You are carrying," he says, "the most interesting object on the continent, through the most interesting city on the continent, toward a trap built from my notes. Of course I'm coming." He snaps the last case shut. "I warn you now: I am brilliant, I am rude, and I will explain things to you that you already understand. I am also, occasionally, right about the things that matter. You'll have to put up with all four."`,
        effects: ['recruit vaelis', 'set vaelis_instruments_hint', 'rel vaelis respect 2', 'memory vaelis 1 You found me in Valdros and asked me to come and look at the Veil up close.'],
        options: [{ text: `"We'll manage."`, tone: 'friendly', end: true }],
      },
      again: {
        speaker: 'comp:vaelis',
        text: `Vaelis doesn't look up from his gauges. "Still here? The Dome is that way. It's the large one."`,
        options: [
          { text: `"Travel with us."`, if: '!recruited:vaelis', tone: 'friendly', tags: ['curiosity'], next: 'join' },
          { text: `"What is this city doing?"`, tone: 'curious', next: 'city' },
          { text: `Leave him to it.`, tone: 'leave', end: true },
        ],
      },
    },
  },
  {
    id: 'a1v_instruments', title: 'Grey Survey Tripods',
    start: [{ if: 'comp:vaelis && !a1v_vaelis_instr', node: 'v' }, { node: 'a' }],
    nodes: {
      a: {
        speaker: 'dm',
        text: `Half-hidden among the observatory's fallen pillars stand three tripods of grey steel, each crowned with a silver lodestone in a cage of fine wire. They are new: no moss, no rust, fresh scratches where someone forced their feet into the mosaic. Every lodestone is aimed at the Senate Dome. Every one of them is very faintly trembling.`,
        options: [
          { text: `[Arcana] Work out what they're for.`, once: true, check: { skill: 'arcana', dc: 13 }, tone: 'curious', tags: ['knowledge'], success: 'ok', failure: 'fail' },
          { text: `Kick them over.`, once: true, tone: 'aggressive', tags: ['defiance'], effects: ['set a1v_tripods_kicked'], next: 'kick' },
          { text: `Leave them.`, tone: 'leave', end: true },
        ],
      },
      ok: {
        speaker: 'dm',
        text: `They are listening instruments, tuned to resonance — the kind you have carried since the Heart chose you. Set like this, they would wait for a spike at the Anchor and then lock onto its source like hounds onto a scent. Someone has been patient. Someone expects a resonant person to lay a hand on the Anchor, and wants to know the exact moment they do.`,
        effects: ['set a1v_instruments_read', 'clue a1_main conclave_instruments', 'xp 50'],
        next: 'a',
      },
      fail: { speaker: 'dm', text: `Conclave work, plainly; beyond that, the wire-cages are a tangle of precision you can't follow. They are aimed at the Dome. That much is obvious, and not comforting.`, effects: ['clue a1_main conclave_instruments'], next: 'a' },
      kick: { speaker: 'dm', text: `The nearest tripod goes over with a satisfying clang. Its lodestone rolls across the mosaic, spinning, and then, slowly, rights itself and points at the Dome again from where it lies.`, next: 'a' },
      v: {
        speaker: 'comp:vaelis',
        effects: ['set a1v_vaelis_instr', 'set vaelis_instruments_hint', 'set a1v_instruments_read', 'clue a1_main conclave_instruments'],
        text: `Vaelis stops so abruptly that someone walks into him. He crouches by the nearest tripod and does not touch it, the way you would not touch a sleeping snake.

"These are my calibrations." His voice is quite flat. "The wire-cage. The three-point damping. I drew that on a napkin in a tavern in Solmara thirty years ago to win an argument." He laughs; it isn't one. "They've built a whole Seeker's kit out of my napkins. Listening for resonance at the Anchor — for you, touching it. When you do, every lodestone in this city will sing, and whoever's holding the other end will know exactly where to put their hands." He stands, dusting his knees, not looking at you. "I'd like it noted that I was much better at this before I learned what it was for."`,
        interjections: [
          { who: 'nima', text: `Nima peers at him. "You're shaking." "I'm cold." "It's summer." "I'm an elf. We feel the cold of history."` },
        ],
        options: [
          { text: `"Who did you win the argument against, Vaelis?"`, tone: 'curious', tags: ['curiosity'], next: 'v2' },
          { text: `"Then we know it's a trap. That helps."`, tone: 'pragmatic', tags: ['caution'], end: true },
        ],
      },
      v2: {
        speaker: 'comp:vaelis',
        text: `He is quiet so long you think he won't answer. "Someone who never lost an argument before or since," he says at last. "Ask me again when we're somewhere with walls." He turns toward the Dome. "Shall we go and be listened to?"`,
        effects: ['rel vaelis trust 1'],
        options: [{ text: `Let it go.`, tone: 'leave', end: true }],
      },
    },
  },
  {
    id: 'a1v_scout', title: 'A Watcher in a Grey Coat',
    start: 'a',
    nodes: {
      a: {
        speaker: 'a1v_scout',
        text: `Behind a fallen column on the edge of the Dome's plaza, a young man in Conclave warden's grey is crouched over a silver lodestone in his lap. When your shadow falls across it, he jumps nearly out of his boots, and the lodestone swings round to point at your pack and starts to sing.

"Oh, Lights," he says. "Oh, no. You're early."`,
        options: [
          { text: `[Intimidation] "Talk. Now. Who's waiting in the Dome?"`, check: { skill: 'intimidation', dc: 12 }, tone: 'aggressive', tags: ['violence'], success: 'talk', failure: 'bolt' },
          { text: `[Persuasion] "Nobody needs to get hurt today. Tell me what you're watching for."`, check: { skill: 'persuasion', dc: 13 }, tone: 'diplomatic', tags: ['diplomacy', 'mercy'], success: 'talk', failure: 'bolt' },
          { text: `[Vaelis] Let Vaelis have a look at that lodestone.`, if: 'comp:vaelis', tone: 'class', next: 'vaelis' },
          { text: `Knock him out before he can signal anyone.`, tone: 'aggressive', tags: ['violence', 'stealth'], effects: ['set a1v_scout_done', 'set a1v_scout_ko'], next: 'ko' },
          { text: `"Go. Run home, and don't come back."`, tone: 'compassionate', tags: ['mercy'], effects: ['set a1v_scout_done', 'set a1v_scout_fled'], next: 'go' },
        ],
      },
      vaelis: {
        speaker: 'comp:vaelis',
        text: `Vaelis plucks the lodestone out of the boy's hands like a tutor confiscating a toy, turns it over, and makes a disgusted noise. "Third-generation copy. They've lost the damping entirely. It'll sing at a sneeze." He looks down at the boy. "Your Seeker is in the Dome, isn't she? Waiting in the tiers for the Anchor to light. Don't bother lying. You're holding the instrument that would tell me if you did. I designed it."

The boy stares at him, and then — perhaps because no one has ever spoken to him like that, or perhaps because he is nineteen and terrified — he tells you everything.`,
        next: 'talk',
      },
      talk: {
        speaker: 'a1v_scout',
        text: [
          { if: `${YS} && maren_forgets`, text: `"Seeker Ravencourt. Four of us besides her, up in the top tiers since the day before yesterday." The words tumble out. "We're to wait until the bearer touches the Anchor. Then the lodestones lock and we — we take them. Alive, she said, alive. We tracked your resonance from the Woods; it's like following a bonfire." He swallows. "Please don't tell her I told you. She'll be so disappointed. She's worse when she's disappointed."` },
          { if: YS, text: `"Seeker Ravencourt. Four of us besides her, up in the top tiers since the day before yesterday." The words tumble out. "We're to wait until the bearer touches the Anchor. Then the lodestones lock and we — we take them. Alive, she said, alive." He swallows. "There's someone who's meant to bring the bearer to the Anchor. I don't know who. Someone you'd trust, the Seeker said, and she didn't look happy about it." He shuts his eyes. "Please don't tell her I told you."` },
          { if: 'maren_forgets', text: `"High Seeker Vex. Four of us besides him, in the top tiers, since the day before yesterday." The words tumble out. "We're to wait until the bearer touches the Anchor. Then the lodestones lock and we take them. Alive. We tracked your resonance from the Woods; it's like following a bonfire." He swallows. "The High Seeker doesn't shout. He just writes your name down. Please don't make him write mine down."` },
          { text: `"High Seeker Vex. Four of us besides him, in the top tiers, since the day before yesterday." The words tumble out. "We're to wait until the bearer touches the Anchor. Then the lodestones lock and we take them. Alive." He swallows. "There's someone who's meant to bring the bearer to the Anchor. I don't know who. Someone you'd trust, the High Seeker said. He said it like a figure in a ledger."` },
        ],
        effects: ['set a1v_scout_talked', 'set a1v_scout_done', 'set a1v_maren_suspected', 'clue a1_main scout', 'xp 75'],
        interjections: [
          { who: 'kael', text: `Kael crouches, picks a bit of grit off the boy's collar, and smiles at him with every tooth. "See? Wasn't that easier than dying for a pension?"` },
          { who: 'seris', if: '!maren_forgets', text: `"Someone we would trust," Seris repeats. She looks down the long avenue, to the broken arch where Maren vanished. She doesn't say the name. Nobody does.` },
        ],
        options: [
          { text: `Let him go south, away from the Dome.`, tone: 'compassionate', tags: ['mercy'], next: 'go' },
          { text: `Tie him up behind the column. Someone can collect him later.`, tone: 'pragmatic', tags: ['caution'], next: 'tied' },
        ],
      },
      bolt: {
        speaker: 'dm',
        text: `He doesn't talk. He runs — not toward the Dome, to your surprise, but south, away from everything, his grey coat flapping, his lodestone abandoned on the mosaic where it goes on singing at you until you put your boot on it.`,
        effects: ['set a1v_scout_done', 'set a1v_scout_fled'],
        options: [{ text: `Let him go.`, tone: 'leave', end: true }],
      },
      ko: { speaker: 'dm', text: `One quick blow and he folds with a small, surprised sigh. You prop him against the column in the shade. He'll wake with a headache and no idea what he would have told you.`, options: [{ text: `Move on.`, tone: 'leave', end: true }] },
      go: { speaker: 'dm', text: `He goes, and he does not look back, and something about the way he runs makes you think he will not stop until he reaches his mother's house, wherever that is.`, options: [{ text: `Move on.`, tone: 'leave', end: true }] },
      tied: { speaker: 'dm', text: `You bind his wrists with his own belt and gag him with his own scarf. He submits with the air of a young man who has decided he is in a ballad and would like to survive to the final verse.`, options: [{ text: `Move on.`, tone: 'leave', end: true }] },
    },
  },
  flicker('a1v_flicker_west', 'burning', {
    title: 'A Flicker of Fire',
    look: `Where the cross-avenue meets the western wall, the air shimmers like heat over a road. Through the shimmer it is night, and the night is orange. You can smell it from here: smoke, hot stone, burning paper. Somewhere very close and two thousand years away, a bell is ringing the alarm.`,
    interjections: [{ who: 'nima', text: `Nima has gone pale under her freckles. "That's — fire. Big fire. City fire." Her fingers spark and she shoves them under her arms. "I'm fine. I'm totally fine. Fire and I have an understanding."` }],
    arcanaFail: `The seam fights you, and the fire on the other side comes through first — a roaring breath of it, singeing hair and eyebrows and the hems of cloaks — before the city gives way and lets you in.`,
    failEffects: ['damage 2d6 fire'],
    vaelis: `Vaelis spreads his long fingers into the shimmer as though parting a curtain. "Burning Valdros. The night the Decline stopped being quiet." The shimmer stills under his hands. "In you go. Don't breathe through your mouth; there are archives on fire, and I refuse to have inhaled the Senate minutes."`,
    arrive: `The city turns over like a page, and you are standing in Valdros the night it fell.

The sky is a lid of smoke lit from beneath. The colonnades are burning, and the observatory, and the great libraries along the avenue, their windows pouring sparks. People run past you: Ithari in night-robes carrying children, carrying books, carrying nothing. None of them see you. They run through the places where you are standing as if you were smoke. The west wall of the Senate Dome has fallen outward in a slope of burning rubble. There is a way in.`,
    here: `The flicker hangs in the burning air, and through it you can see the cool white ruin, quiet as snow. The fire roars around you. Somewhere a roof comes down.`,
  }),
  flicker('a1v_flicker_east', 'flooded', {
    title: 'A Flicker of Water',
    look: `At the eastern end of the cross-avenue the light goes green and wavering, as though you were looking up at the sun from the bottom of a pond. Something drifts past on the far side of the shimmer: a chair, slowly turning. A shoal of silver fish. A paper lantern, still lit, sinking.`,
    interjections: [{ who: 'brakka', text: `Brakka eyes the green water-light with deep dwarven suspicion. "I don't swim," she says. "I sink efficiently. There's a difference."` }],
    arcanaFail: `You force it, and the water comes through first: a cold green slam of river that knocks the breath out of you and the feet from under you and fills your boots, before the city gives way and lets you in, gasping.`,
    failEffects: ['damage 2d6 cold', 'time 30'],
    vaelis: `"The drowned Valdros. The Sillow changed course in that one and never changed back." Vaelis presses his palm to the shimmer; it ripples outward from his hand in neat rings. "Hold your breath for the first step. Only the first. After that it's merely very, very damp."`,
    arrive: `The city turns over like a page, and the river closes over Valdros.

You stand waist-deep in clear green water under a sky the colour of pewter. The plaza is a lake. The avenues are canals. Spires rise out of the water with drowned banners still hanging from them, swaying in a current that comes from nowhere. Your breath is loud. Everything else is silent except, very far off, the slow tolling of a bell under the water. Along the east flank of the Dome, the old culvert stands open, a dark mouth at the waterline. There is a way in.

The light is wrong here, you realise. There is no sun in this sky. Only, here and there across the water, the faint gold of lanterns, drifting.`,
    here: `The flicker hangs over the water like a reflection of a dry world. Through it, the ruin is white and still, and nobody in it is wet.`,
  }),
  flicker('a1v_flicker_south', 'inhabited', {
    title: 'A Flicker of Voices',
    look: `In the middle of the great avenue, close to the gate, the air is full of voices. Not loud — the murmur of a market heard through a wall. Through the shimmer you can see the avenue thronged: sunlight, awnings, a man selling roasted chestnuts, children chasing a hoop. A lamplighter on a ladder. A white Dome with its great doors standing open.`,
    interjections: [{ who: 'tessa', text: `Tessa's eyes are enormous. "They're singing," she breathes. "Somebody's singing over there. I don't know the song." A pause. "I know all the songs."` }],
    arcanaFail: `You force it. For an instant you are in both cities at once and neither, and a thousand Ithari voices pour through your skull — prices, prayers, gossip, lullabies — before the city gives way and lets you in, with a headache like a struck bell.`,
    failEffects: ['damage 2d4 psychic', 'instab 1'],
    vaelis: `Vaelis stares through the shimmer at the living city and, for a moment, forgets to be clever. "They never left," he says. "In this one, they simply… never left." Then he collects himself and presses the shimmer flat with both hands. "Go on. Mind your manners. We're the ghosts here."`,
    arrive: `The city turns over like a page, and Valdros is alive.

Sunlight. Noise. The smell of chestnuts and horse dung and incense. The avenue is a river of people in bright Ithari silks, and the great doors of the Senate Dome stand open at the end of it while a bell calls the Senate to session. Nobody bumps into you. People step around you without looking, the way you step around a cold patch of air. A small girl stares straight at you, clutches her mother's sleeve, and whispers something. Her mother makes a quick sign with two fingers — a ward against ghosts — and pulls her away.

They can feel you. To them, you are the ruin's dead.`,
    here: `The flicker is a patch of silence in the living city. Through it, you can see the ruin: empty, white, roots and quiet. A passing Ithari boy walks into it, shivers, and runs.`,
  }),
  {
    id: 'a1v_archivist', title: 'An Archivist in the Fire',
    start: 'a',
    nodes: {
      a: {
        speaker: 'a1v_archivist',
        text: `An old Ithari in the singed blue robes of a Senate archivist is kneeling in the burning street, stuffing scrolls into a satchel already too full to close. Sparks have caught in his hair; he hasn't noticed. When you come close he looks up, straight at you, and doesn't flinch.

"You're from after," he says. "Aren't you? You have that look. The ones from after always have it." He goes back to packing. "Help me or don't. They're burning the minutes of eleven hundred years and somebody has to remember what we argued about."`,
        interjections: [
          { who: 'vaelis', text: `Vaelis makes a sound like a man watching a dropped glass in the instant before it hits the floor. Then he kneels in the street and starts packing scrolls without a word.` },
        ],
        options: [
          { text: `Help him save the scrolls.`, once: true, tone: 'compassionate', tags: ['knowledge', 'protect'], effects: ['xp 50'], next: 'help' },
          { text: `"How did the fire start?"`, once: true, tone: 'curious', tags: ['curiosity'], next: 'how' },
          { text: `"What's under the Dome?"`, once: true, tone: 'curious', next: 'anchor' },
          { text: `Leave him to the fire.`, tone: 'leave', end: true },
        ],
      },
      help: {
        speaker: 'a1v_archivist',
        text: `You pack scrolls in the heat until your hands blister. He does not thank you. He tells you, instead, the name of each scroll as it goes into the satchel, as though introducing old friends: the Water Debates, the Lamp Census, the Ninth Charter Concordance. "There," he says at last, buckling the satchel shut. "Now they've been read by someone from after. That counts. That counts for something." He presses a small stoppered vial into your hand. "Senate issue. For the smoke. I won't need it."`,
        effects: ['give healing_potion 1', 'set a1v_archivist_helped'],
        next: 'a',
      },
      how: {
        speaker: 'a1v_archivist',
        text: `"The Magisters." He spits the word. "The Anchor was faltering, so they decided to improve it. Not mend — improve. Pull a better Valdros through from wherever better Valdroses are kept. No famine. No Decline. They had lovely diagrams." He laughs, a dry, cracked sound. "The Anchor reached for a better city and caught hold of a burning one. That is what happens when you put your hand into the dark and grab. You don't get to choose what grabs back."`,
        effects: ['set a1v_heard_magisters'],
        interjections: [
          { who: 'vaelis', text: `Vaelis has stopped packing. "Improve," he repeats, very softly, as if the word had a taste he recognised.` },
        ],
        next: 'a',
      },
      anchor: {
        speaker: 'a1v_archivist',
        text: `"The lamp that answers the lamp." He nods toward the Dome. "Every Anchor answers another. Ours answered Hollowmere's — a little frontier chapel, then. And all of them answer to the one at the bottom of the well." He pauses, frowning, as though the words had come from somewhere he did not expect. "Something lives in ours, these last nights. In the glass. A great dark shape, circling. Behind it there is a sea where it is always evening, and lamps on the water." He shivers in the heat. "It is so sad. I don't know how I know that. It is so terribly sad."`,
        effects: ['set a1v_heard_evening_sea'],
        next: 'a',
      },
    },
  },
  {
    id: 'a1v_drift_lantern', title: 'A Lantern Adrift',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `At the edge of the drowned plaza, where the water deepens to black-green, a lantern is turning slowly on the surface: not paper, but glass the colour of dusk, caged in dark metal worked into the shape of waves. It is lit. The flame inside it is not fire. It is a small, steady blue, like the last of the light after sunset, and it does not flicker when the water moves.

It is not from Valdros. You are not sure it is from anywhere.`,
        interjections: [
          { who: 'varek', text: `Varek has gone very still. "Listen," he says. "Under the water. Can you hear it?" You can't. "Singing," he says. "A lot of voices. A long way off. Like the Choir, but…" He frowns. "Further. Lonelier."` },
        ],
        options: [
          { text: `[Resonance] Touch the lantern and listen to what it remembers. (Spend 1 Resonance)`, if: 'res>=1', lockedText: 'Requires 1 Resonance.', tone: 'resonance', tags: ['curiosity', 'forbidden'], effects: ['res -1'], next: 'vision' },
          { text: `[Perception] Fish it out carefully and study it.`, check: { skill: 'perception', dc: 12 }, tone: 'curious', success: 'study', failure: 'study_fail' },
          { text: `Leave it drifting.`, tone: 'leave', end: true },
        ],
      },
      vision: {
        speaker: 'dm',
        text: `Your fingers close on the cage, and the drowned city falls away.

Water. Water to every horizon, flat and dark under a sky that is the colour of a bruise and has been for four thousand years. No sun. There has never been a sun, not since the Unmaking; the people here have a word for it in their oldest songs, and no one living knows what it meant. Towers rise from the water, roofed with shells, linked by roads of floating lanterns — thousands, hundreds of thousands, every one lit by hand. And along the lantern-roads swims something vast and dark and patient, its long body sliding between the towers, and wherever it passes, the dimming lanterns flare bright again, and people at the windows lift their hands to it.

A word comes to you, the way names come in dreams, whole and certain: YSMEROND. The Evening Sea.

Then the lantern in your hand is only a lantern, and you are standing in green water in a drowned city with your face wet, and you are not entirely sure it is the river.`,
        effects: ['set a1v_knows_ysmerond', 'set a1v_lantern_taken', 'give a1v_wyrm_lantern', 'clue a1_main ysmerond', 'xp 100'],
        interjections: [
          { who: 'ilyra', text: `Ilyra puts a hand on your arm and leaves it there until you stop shaking. "Whatever you saw," she says, "it was beautiful. I can tell by how much it hurt."` },
          { who: 'tessa', text: `Tessa is mouthing something. "Ysmerond," she says at last, trying it. "That's — that's a Sael sound. That's a tide-word." She looks frightened, and then she looks hungry, and then she looks frightened again.` },
        ],
        options: [{ text: `Keep the lantern.`, tone: 'leave', end: true }],
      },
      study: {
        speaker: 'dm',
        text: `You hook it out of the water. The glass is cold and perfectly dry. Worked into the metal cage, among the waves, is a tiny relief: a long serpentine shape coiled around a tower, its jaws open — not to bite, you realise, but to breathe light onto a lantern. Around the base, in a script you have never seen, a single word is repeated over and over. It looks like a name. It looks like a prayer.`,
        effects: ['set a1v_lantern_taken', 'give a1v_wyrm_lantern', 'xp 50'],
        options: [{ text: `Keep the lantern.`, tone: 'leave', end: true }],
      },
      study_fail: { speaker: 'dm', text: `You lunge for it and the current — there should not be a current — turns it just out of reach. It drifts a little further into the deep water, still lit, still turning, patient as a held breath.`, next: 'a' },
    },
  },
  {
    id: 'a1v_lamplighter', title: 'The Lamplighter of Valdros',
    start: 'a',
    nodes: {
      a: {
        speaker: 'a1v_lamplighter',
        text: `At the foot of a lamp-post on the cross-avenue, a woman in a lamplighter's leather apron is setting down a shallow clay bowl of oil and a heel of bread on the paving, the way you would set them out for a cat. Then she straightens, looks almost exactly at you, and speaks — politely, slowly, as one speaks to the very old or the very dead.

"There's oil for your lamps," she says, "and bread, though I don't suppose you eat. My grandmother always said the ghosts of the ruin-city walk the avenue at session time. I never believed her." She swallows. "I believe her now. You're very clear today."`,
        interjections: [
          { who: 'ilyra', text: `Ilyra's breath catches. "She's leaving offerings," she says. "For us. For the dead. Just like the festival." Her voice wobbles. "They light lanterns for us here."` },
          { who: 'korr', text: `Korr looks down at the bowl of oil for a long moment. Then, gravely, he bows to the woman, Ashkin-fashion, fist to heart. She can't see it. He does it anyway.` },
        ],
        options: [
          { text: `"We're not ghosts. We're from another Valdros — one where your city fell."`, once: true, tone: 'diplomatic', tags: ['honesty'], next: 'truth' },
          { text: `"Thank you for the offering."`, once: true, tone: 'compassionate', tags: ['tradition', 'mercy'], next: 'thanks' },
          { text: `[Resonance] Let her see you properly, just for a moment. (Spend 1 Resonance)`, if: 'res>=1', once: true, lockedText: 'Requires 1 Resonance.', tone: 'resonance', tags: ['boldness'], effects: ['res -1'], next: 'seen' },
          { text: `"What does the Senate meet about, these days?"`, once: true, tone: 'curious', tags: ['curiosity'], next: 'senate' },
          { text: `Walk on toward the Dome's open doors.`, tone: 'leave', end: true },
        ],
      },
      truth: {
        speaker: 'a1v_lamplighter',
        text: `She tilts her head, listening to something that reaches her as a whisper on the wind. "Fell," she repeats. "My grandmother said that too. That the ghosts come from a Valdros that ended." She looks up at the lamps along the avenue, every one of them hers to light. "Then I'm sorry for you. Truly. It must be very dark there."`,
        next: 'a',
      },
      thanks: {
        speaker: 'dm',
        text: `She can't hear the words, but something reaches her; her shoulders loosen. As you stand by the bowl, the oil in it flares briefly, as though a lamp you can't see has been lit from it, and a small warmth runs through you, the kind you feel walking into a lit house out of the cold.`,
        effects: ['res 1', 'heal 5', 'set a1v_offering_taken'],
        next: 'a',
      },
      seen: {
        speaker: 'a1v_lamplighter',
        text: `For one heartbeat the light around you changes, and she sees you — truly sees you, dust and road-wear and all. She gasps, and then, astonishingly, she laughs. "Oh! You're young! I thought ghosts would be old." She reaches out, and her fingers pass through your sleeve like cold water. "Go well, ghost. Whatever you came for, I hope you find it. I'll light a lamp for you tonight. It's what we do."`,
        effects: ['set a1v_seen_by_living', 'xp 50'],
        next: 'a',
      },
      senate: {
        speaker: 'a1v_lamplighter',
        text: `"Sewers, mostly." She laughs. "And the Anchor. Always the Anchor. The astronomers say there's something on the other side of it lately — a sea behind the sky where it's always evening, and something there that keeps lamps, like me." She shrugs, lamplighter to lamplighter. "I'd like to meet it. I'd ask how it manages the wicks in all that wet."`,
        effects: ['set a1v_heard_evening_sea'],
        next: 'a',
      },
    },
  },

  // ═══════════════════════════════════════════ THE SENATE DOME
  {
    id: 'a1v_dome_enter', title: 'The Senate Dome',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        effects: ['quest a1_main dome', 'set a1v_dome_entered', 'set valdros_ambush_started'],
        text: [
          { if: 'valdros_reality=inhabited', text: `You walk in through the great doors among the senators, and not one of them sees you. The Dome closes over you, vast and echoing. Inside the doors the living city thins like mist, as though even in this Valdros no one quite dares the floor of the Senate: the benches empty, the session bell fading, until it is only the old stone and the hum.` },
          { if: 'valdros_reality=flooded', text: `You come up out of the culvert soaked to the waist, into air that is suddenly dry, as though the Dome itself refuses to drown. Water runs off you and down the tiers in little bright threads and vanishes. The hum is very loud in here.` },
          { if: 'valdros_reality=burning', text: `You climb the slope of hot rubble through the fallen wall, with smoke in your hair and the roar of a burning city at your back — and then you are inside, and the roar is gone as if a door had shut on it. The Dome is cool and dark and quiet. Embers drift down from nowhere and go out before they land.` },
          { text: `You come into the Senate Dome.` },
        ],
        next: 'b',
      },
      b: {
        speaker: 'dm',
        text: [
          { if: 'maren_forgets', text: `Tier upon tier of stone benches descend toward a dais at the centre, where the Anchor stands: a column of black glass veined with failing light, taller than a house. At its foot a single lantern burns, and Sister Maren kneels beside it with chalk and paper, so absorbed in copying the inscriptions that she hasn't heard you come in.

The upper tiers are lost in shadow. Somewhere up there, something small and metal is ticking.` },
          { text: `Tier upon tier of stone benches descend toward a dais at the centre, where the Anchor stands: a column of black glass veined with failing light, taller than a house. At its foot two lanterns burn, one on either side, like candles at a shrine. Sister Maren stands between them with her hands folded, waiting. She has heard you come in. She doesn't turn round yet.

The upper tiers are lost in shadow. Somewhere up there, something small and metal is ticking.` },
        ],
        interjections: [
          { who: 'korr', text: `Korr's nostrils flare. "Steel," he says, very low. "And lamp-oil. And fear-sweat. Up." He doesn't point. He doesn't need to.` },
          { who: 'orren', text: `Orren has gone still in the way of a warden who has heard a twig snap in the wrong place. He touches your sleeve and tilts his head, once, at the high galleries.` },
          { who: 'vaelis', if: 'a1v_instruments_read', text: `"Ticking," Vaelis murmurs. "Lodestones settling. They're up there." He says it the way another man would say a prayer, or a curse.` },
        ],
        options: [
          { text: `[Perception] Study the shadows of the upper tiers before you go down.`, once: true, check: { skill: 'perception', dc: 15, advIf: 'a1v_instruments_read || a1v_maren_suspected || a1_warned_of_ambush || a1v_scout_talked' }, tone: 'curious', tags: ['caution'], success: 'spotted', failure: 'nothing' },
          { text: `Go down to the Anchor.`, tone: 'pragmatic', end: true },
        ],
      },
      spotted: {
        speaker: 'dm',
        text: `You let your eyes go soft, the way you look for deer at dusk. There: a glint of silver at the top of the eastern tier. There: a grey sleeve, where no sleeve should be, among the broken statues of the north gallery. Wardens, lying flat along the benches. A tall shape standing perfectly still in an archway with a lodestone in each hand, like a cleric holding two censers. They are waiting for something. For you to reach the Anchor, by the way the lodestones are pointing.

They don't know you've seen them.`,
        effects: ['set a1v_ambush_spotted', 'xp 50'],
        options: [{ text: `Go down to the Anchor — carefully.`, tone: 'pragmatic', tags: ['caution'], end: true }],
      },
      nothing: { speaker: 'dm', text: `Shadows, broken statues, the slow drift of dust in the Anchor's light. If anything is up there, it is better at waiting than you are at looking.`, options: [{ text: `Go down to the Anchor.`, tone: 'pragmatic', end: true }] },
    },
  },
  {
    id: 'a1v_maren_dome', title: 'The Lamp That Answers the Lamp',
    start: [
      { if: 'a1v_ambush_done && maren_forgets', node: 'f_after' },
      { if: 'a1v_ambush_done', node: 'after' },
      { if: 'maren_forgets', node: 'f_a' },
      { node: 'a' },
    ],
    nodes: {
      // ── Maren remembers Elsa: the betrayal
      a: {
        speaker: 'maren',
        effects: ['quest a1_main dome'],
        text: `"You found a way." Maren turns. Up close she looks as if she hasn't slept since Hollowmere; there is chalk on her sleeves and soot on her cheek and her eyes are very bright. "I knew you would. Come — come and look."

She lays her palm on the black glass, gently, as one touches a sleeping animal. "The sister of ours. 'The lamp that answers the lamp.' If you lay the Heart against the keystone, they'll sing to each other, and Hollowmere's Anchor will remember how to hold." Her smile is the apologising one, stretched very thin. "That's what the records say. That's what I believe."`,
        interjections: [
          { who: 'vaelis', text: `"That's… not nonsense," Vaelis says slowly, reading the glass. "Paired Anchors do resonate. Which is precisely why I'd want to know who else is listening when they do."` },
          { who: 'ilyra', text: `Ilyra isn't looking at the Anchor at all. She is watching Maren's hands, which are shaking, and her own hands, which are very still.` },
          { who: 'seris', text: `Seris has stopped at the edge of the dais, as a knight stops at the threshold of a court. She does not take her eyes off the Sister.` },
        ],
        options: [
          { text: `"Tell me exactly what will happen when I touch it."`, once: true, tone: 'curious', next: 'explain' },
          { text: `[Insight] Watch her — not the Anchor.`, once: true, check: { skill: 'insight', dc: 15, advIf: 'a1v_maren_suspected || a1v_letters_hint' }, tone: 'curious', tags: ['caution'], success: 'tells', failure: 'nofind' },
          { text: `"How many of them are up in the tiers, Maren?"`, if: TURN, tone: 'aggressive', tags: ['honesty'], next: 'caught' },
          { text: `Lay the Heart against the Anchor.`, tone: 'friendly', tags: ['boldness', 'faith'], effects: ['set a1v_touched'], next: 'touch',
            voices: { nima: `"Do it! Make it sing! What's the worst that — no, don't answer that."` } },
          { text: `"Not yet. Something about this is wrong."`, tone: 'pragmatic', tags: ['caution'], next: 'wrong',
            voices: { kael: `"Every instinct I have says the nice lady is about to ruin our day."`, orren: `"Listen before you act. Something up there is listening too."` } },
        ],
      },
      explain: {
        speaker: 'maren',
        text: `"Light, I think. A hum. Perhaps you'll feel Hollowmere, the way you'd feel a hand in the dark." She swallows. "It will do what I said. Ours will be steadier. I promise you that much." It is the most carefully chosen sentence you have ever heard.`,
        next: 'a',
      },
      nofind: { speaker: 'dm', text: `She is exhausted and frightened and painfully, desperately hopeful. Whatever else is there, you cannot see past the hope.`, next: 'a' },
      tells: {
        speaker: 'dm',
        text: `You have seen this face before — on people standing at the edge of a roof. She keeps not looking up. Not at the Dome's high curve: at the top tier of the benches, the eastern side, as though someone up there is holding a rope tied to her wrist. And every time she says "Hollowmere," her eyes fill.

She is not lying about the Anchor. She is lying about what happens after.`,
        effects: ['set a1v_maren_suspected'],
        options: [
          { text: `"Who's up there, Maren?"`, tone: 'compassionate', tags: ['honesty'], next: 'confess' },
          { text: `"Look at me. What did they promise you?"`, tone: 'compassionate', tags: ['mercy'], next: 'confess' },
        ],
      },
      caught: {
        speaker: 'dm',
        text: `Maren flinches as though you had struck her. For a second her face is completely empty. Then something in it gives way, quite quietly, like a floor in an old house, and she sits down on the dais steps between her two lanterns because her legs won't hold her any more.`,
        next: 'confess',
      },
      wrong: {
        speaker: 'dm',
        text: `"Wrong?" Maren laughs, too high. "Nothing's wrong. Nothing's — please. Please, just touch it. It will help Hollowmere, I swear it will, I swear on —" She stops. She cannot think of anything left to swear on. Her hands come up over her face.`,
        next: 'confess',
      },
      touch: {
        speaker: 'dm',
        text: `You lay the Heart against the keystone.

For one heartbeat it is exactly as she said. The Anchor sings, and through the song, very far away, you feel Hollowmere's stone answer: an old bell-note, a lantern-warmth, a town holding on. It was true. It was true.

Then silver light lances down from every tier of the Dome and fastens on you like fish-hooks. Lodestones scream. High above, a voice says, calmly, "Now." And Maren, between her two lanterns, says, "I'm sorry. Oh, Lights, I'm sorry, I'm so sorry —"`,
        next: 'confess',
      },
      confess: {
        speaker: 'maren',
        effects: ['give a1v_severin_letter', 'clue a1_main maren_letter', 'set a1v_maren_confessed'],
        text: `"I wrote to the Conclave for eight years." She says it to the floor. "Forty-one letters. I described her. Elsa. Every freckle. The gap in her teeth. The way she said 'lantern' with three Ls, lan-tern-l, because she thought it sounded more like a light. I asked if there was anything — any working, any instrument — anything at all that could bring back someone the world had forgotten. Not one answer. Not one."

She takes a folded letter out of her sleeve and holds it out to you without looking up. It is heavy Conclave paper, the seal already broken.

"The morning after the bell, this was on my desk. In his own hand." She doesn't need to read it; she knows it by heart. "'The Heart of Aether can restore what was erased. With it, I can return your daughter to you. Bring its bearer to the Anchor at Valdros. I will not pretend that is my only reason for wanting it.'" Her voice cracks straight down the middle. "He didn't even lie to me. Do you understand? In eight years he was the only one who didn't lie to me."

She looks up at you at last. "I liked you. I want you to know that. It didn't help."`,
        interjections: [
          { who: 'ilyra', text: `Ilyra makes a small sound, as if something has been pulled out of her. "Oh, Maren," she whispers. "Oh, you poor woman."` },
          { who: 'kael', text: `Kael has gone white around the mouth. "Someone you trust," he says. "Of course. Of course it's always someone you trust."` },
          { who: 'seris', text: `Seris's voice is iron. "You led them to a trap, Sister." Then, lower, and not iron at all: "For a child no one remembers." She closes her eyes.` },
          { who: 'varek', text: `Varek is staring at the letter in your hand. "His handwriting," he says, almost too quietly to hear. "I'd know it anywhere." He doesn't explain.` },
        ],
        options: [
          { text: `"You sold us to them."`, tone: 'aggressive', tags: ['honesty'], next: 'c_anger' },
          { text: `"Oh, Maren."`, tone: 'compassionate', tags: ['mercy'], next: 'c_grief' },
          { text: `"Did he say what they'd do to us?"`, tone: 'pragmatic', next: 'c_what' },
        ],
      },
      c_anger: {
        speaker: 'maren',
        text: `"Yes." She doesn't flinch from it. "I'd sell you again. I'd sell Hollowmere. I'd sell my own soul, if anyone would give me a copper for it." She wipes her face with the back of a chalky hand. "She was seven. She'd be fifteen now. I've been drawing her older every year, so I'd recognise her." A terrible little laugh. "I'm not a good woman. I was, once. I was good for eight years and it bought me forty-one letters into the dark."`,
        next: 'spring',
      },
      c_grief: {
        speaker: 'maren',
        text: `Your pity undoes her more than anger would have. She bends double on the steps as though struck in the stomach, and the sound she makes is not quite crying. "Don't," she says. "Don't be kind. I can't — if you're kind I can't bear it." Her fingers find the second lantern and close on its pole. "She was seven. She'd be fifteen now. I've been drawing her older every year, so I'd recognise her."`,
        next: 'spring',
      },
      c_what: {
        speaker: 'maren',
        text: `"He said — " She stops. "He said you would not be harmed if it could be helped. He said it could probably be helped." A breath. "I told myself 'probably' was enough. I've told myself a great many things."`,
        next: 'spring',
      },
      spring: {
        speaker: 'dm',
        text: `High above you, in the dark of the upper tiers, someone begins to clap. Slowly. Not mockingly — the way an audience claps for a performance that went on a little long.`,
        options: [
          { text: `Look up.`, if: YS, tone: 'pragmatic', next: 'ysolt' },
          { text: `Look up.`, if: NYS, tone: 'pragmatic', next: 'vex' },
        ],
      },
      // ── Maren has forgotten Elsa: no deal, only horror
      f_a: {
        speaker: 'maren',
        effects: ['quest a1_main dome'],
        text: `"Oh! You found a way in — I hoped you would. Look at this. Look." Sister Maren is kneeling by the Anchor with a stub of chalk and a sheaf of rubbings, ink to the wrists, happier than you have ever seen her. One lantern burns at the Anchor's foot. "It's the sister-stone. It truly is. 'The lamp that answers the lamp.' If the Heart and this keystone resonated, I think Hollowmere's Anchor might remember its shape."

She sits back on her heels. "I keep wanting to tell someone about this. Someone in particular." Her chalk hovers. "I can't think who."`,
        interjections: [
          { who: 'ilyra', text: `Ilyra kneels beside Maren and looks at the rubbings with her, and does not say anything about the empty hook on Maren's belt. Her hand rests for a moment on the Sister's shoulder.` },
          { who: 'vaelis', text: `Vaelis is reading over Maren's shoulder, lips moving. "Your Ithari is atrocious," he tells her, "and your transcription is impeccable." Maren beams as if he'd crowned her.` },
        ],
        options: [
          { text: `"What would happen if I touched it?"`, once: true, tone: 'curious', next: 'f_explain' },
          { text: `[Insight] Is she hiding anything?`, once: true, check: { skill: 'insight', dc: 12 }, tone: 'curious', success: 'f_honest', failure: 'f_honest' },
          { text: `"Maren — we're not alone in here."`, if: TURN, tone: 'pragmatic', tags: ['caution'], next: 'f_spring' },
          { text: `Lay the Heart against the Anchor.`, tone: 'friendly', tags: ['boldness'], effects: ['set a1v_touched'], next: 'f_touch' },
          { text: `"Something's wrong. Get behind me."`, tone: 'pragmatic', tags: ['protect'], next: 'f_spring' },
        ],
      },
      f_explain: {
        speaker: 'maren',
        text: `"I truly don't know," she says happily. "The inscriptions say the stones 'speak' — but they also say this one is a window as well as a lock. I've no idea what that means. Isn't it wonderful? Nobody's known what it means for two thousand years."`,
        next: 'f_a',
      },
      f_honest: { speaker: 'dm', text: `Nothing. Not a thing — except the shape of something missing, like a pale patch on a wall where a picture used to hang. Whatever brought Maren here, it was only Maren.`, next: 'f_a' },
      f_touch: {
        speaker: 'dm',
        text: `You lay the Heart against the keystone. The Anchor sings, and far away you feel Hollowmere's stone answer — a bell-note, a lantern-warmth. Maren gasps with delight.

Then silver light lances down from the upper tiers and fastens on you like fish-hooks. Lodestones scream. A voice above says, calmly, "Now."`,
        next: 'f_spring',
      },
      f_spring: {
        speaker: 'maren',
        text: `Maren's chalk falls out of her fingers. She stares up into the dark of the tiers, where grey shapes are rising from the benches, and then she stares at you, and all the colour has gone out of her face. "I didn't," she says. "I didn't bring them. I swear on the Lights, I didn't — I came to read a stone —"

She means it. You have never been surer of anything.`,
        options: [
          { text: `"I know. Stay behind the Anchor."`, if: YS, tone: 'compassionate', tags: ['protect'], next: 'ysolt' },
          { text: `"I know. Stay behind the Anchor."`, if: NYS, tone: 'compassionate', tags: ['protect'], next: 'vex' },
        ],
      },
      // ── The ambushers
      ysolt: {
        speaker: 'ysolt',
        text: [
          { if: 'ysolt_outcome=fought', text: `Seeker Ysolt Ravencourt comes down the tiers one step at a time, her grey coat swinging, her silver instruments ticking at her belt. She moves a little stiffly on the left side. "Hello again," she says. "I've had those ribs set twice since Hollowmere. The second surgeon was very rude about the first." Grey-robed wardens rise from the benches behind her, and an arcanist with fire already curled in his palm.` },
          { if: 'ysolt_fooled', text: `Seeker Ysolt Ravencourt comes down the tiers one step at a time, her grey coat swinging. "You," she says, "owe me a Sentinel core. Or rather, I owe the Conclave one, and I've been paying it off in very humiliating paperwork." Grey-robed wardens rise from the benches behind her, and an arcanist with fire already curled in his palm.` },
          { text: `Seeker Ysolt Ravencourt comes down the tiers one step at a time, her grey coat swinging, her silver instruments ticking. "You left through a wall," she says. "In Hollowmere. I have thought about that a great deal. I've decided I admire it, which is unprofessional of me." Grey-robed wardens rise from the benches behind her, and an arcanist with fire already curled in his palm.` },
        ],
        next: 'ysolt2',
      },
      ysolt2: {
        speaker: 'ysolt',
        decision: true,
        text: [
          { if: 'maren_forgets', text: `"I don't know who you are, Sister, and I'd like to keep it that way. Step away from the Anchor, please." Her pale eyes come back to you. "Bearer. The Archon would like a word. He was very specific that you arrive in one piece. He was less specific about the others. Shall we make this dull?"` },
          { text: `"Sister. Step away from the Anchor, please. You've done your part." Something that might be pity crosses her face and is filed away. "The Archon keeps his word. So, for the moment, do I." Her pale eyes come back to you. "Bearer. He would like a word. He was very specific that you arrive in one piece. He was less specific about the others. Shall we make this dull?"` },
        ],
        options: [
          { text: `Strike now — before they're set. (You saw them first.)`, if: TURN, tone: 'aggressive', tags: ['boldness', 'violence'], effects: ['set a1v_ambush_turned', 'combat a1v_enc_turned_ysolt'],
            voices: { korr: `"They hid. We saw. Now we hit."`, brakka: `"They're strung out along the benches. Hit them before they close up."`, kael: `"Ambush the ambushers. My favourite kind of irony."` } },
          { text: `[Persuasion] "Look at the Anchor, Seeker. Your lodestones are tearing it open. Pull your people out, or nobody walks out of here."`, if: TURN, check: { skill: 'persuasion', dc: 16, advIf: 'comp:vaelis || a1v_instruments_read || ysolt_outcome=escaped' }, tone: 'diplomatic', tags: ['diplomacy', 'honesty'], success: 'parley_ok', failure: 'parley_fail_ys',
            voices: { vaelis: `"Tell her about the damping. She'll understand. She's the only one of them who reads the manuals."`, tessa: `"She's tired and clever and doesn't like her orders. Talk to the clever part."` } },
          { text: `"Come and take it."`, tone: 'aggressive', tags: ['violence', 'defiance'], effects: ['combat a1v_enc_ambush_ysolt'],
            voices: { seris: `"The Conclave has no right to it. If she wants a fight, she'll have one."` } },
        ],
      },
      vex: {
        speaker: 'a1v_vex',
        text: `A big man comes down the tiers in grey plate under grey robes, unhurried, with a lodestone in each fist like a priest carrying censers. His face is broad and calm and completely uninterested, the face of a man reading a ledger in which you are a single line. Wardens rise from the benches behind him, and an arcanist with fire already curled in his palm.

"High Seeker Dorran Vex," he says. "I'm not going to make a speech."`,
        next: 'vex2',
      },
      vex2: {
        speaker: 'a1v_vex',
        decision: true,
        text: [
          { if: 'maren_forgets', text: `"The Archon wants the bearer alive and the Heart intact. Everything else in this room is negotiable." His eyes pass over Maren without stopping. "Including whoever that is."` },
          { text: `"The Archon wants the bearer alive and the Heart intact. Everything else in this room is negotiable." His eyes pass over Maren without stopping. "Including the Sister. Her account is settled, as far as I'm concerned. What the Archon promised her is the Archon's business."` },
        ],
        options: [
          { text: `Strike now — before they're set. (You saw them first.)`, if: TURN, tone: 'aggressive', tags: ['boldness', 'violence'], effects: ['set a1v_ambush_turned', 'combat a1v_enc_turned_vex'],
            voices: { korr: `"They hid. We saw. Now we hit."`, brakka: `"They're strung out along the benches. Hit them before they close up."`, kael: `"Ambush the ambushers. My favourite kind of irony."` } },
          { text: `[Arcana] "Your lodestones are cracking the Anchor, High Seeker. Look at the veins. You'll deliver the Archon a crater, not a bearer."`, if: TURN, check: { skill: 'arcana', dc: 16, advIf: 'comp:vaelis || a1v_instruments_read' }, tone: 'diplomatic', tags: ['knowledge', 'diplomacy'], success: 'parley_ok', failure: 'parley_fail_vex',
            voices: { vaelis: `"He's loyal to results. Show him the result."` } },
          { text: `"Come and take it."`, tone: 'aggressive', tags: ['violence', 'defiance'], effects: ['combat a1v_enc_ambush_vex'],
            voices: { seris: `"The Conclave has no right to it. If he wants a fight, he'll have one."` } },
        ],
      },
      parley_ok: {
        speaker: 'dm',
        effects: ['set a1v_ambush_done', 'set a1v_ambush_parleyed', 'xp 300'],
        text: [
          { if: YS, text: `Ysolt looks at the Anchor — really looks, the way she looks at a readout. The black glass is crazed with light now, cracks spreading from every point a lodestone touches, and the hum has climbed to a whine. Her mouth goes thin. "…You're right," she says. "And I hate it." She raises a hand. "Wardens. Withdraw." She looks back at you once from the top tier. "This isn't mercy, Bearer. It's arithmetic. The Archon will have to ask you himself." Then she snaps a glass sigil between her fingers and the Conclave is simply gone.` },
          { text: `Vex looks at the Anchor the way he looks at everything: as a figure. He watches the cracks spread from each point his lodestones touch. Then he nods, once, as if you'd corrected a sum. "Noted," he says. "Wardens: withdraw." He pockets his lodestones. "I will report that the bearer was well-informed. The Archon will find that interesting." He turns and walks up the tiers without hurrying, and his wardens follow him into the dark.` },
        ],
        options: [
          { text: `Turn back to the Anchor.`, if: '!maren_forgets', tone: 'pragmatic', next: 'after' },
          { text: `Turn back to the Anchor.`, if: 'maren_forgets', tone: 'pragmatic', next: 'f_after' },
        ],
      },
      parley_fail_ys: { speaker: 'ysolt', text: `"A good try," says Ysolt, and seems to mean it. "But the Anchor has been cracking for two thousand years, and I have orders for today." Silver light kindles in her hands.`, effects: ['combat a1v_enc_ambush_ysolt'], end: true },
      parley_fail_vex: { speaker: 'a1v_vex', text: `"Interesting," says Vex. "Irrelevant." He opens his hands, and the lodestones in them begin to scream.`, effects: ['combat a1v_enc_ambush_vex'], end: true },
      // ── After the ambush
      after: {
        speaker: 'dm',
        text: [
          { if: 'a1v_ambush_parleyed', text: `The Dome is quiet except for the Anchor, which is not quiet at all. The hum has risen to a thin, continuous keening, and the cracks in the black glass are spreading like frost on a window.

Maren is on her knees at the foot of the Anchor, between her two lanterns. She hasn't tried to run. She hasn't tried anything.` },
          { if: YS, text: `The last warden goes down. Ysolt Ravencourt, one knee on the bench-stone, wipes blood from her lip and looks at you with something that is almost approval. "Twice," she says. "Remarkable." She snaps a glass sigil between her fingers, and light swallows her and every Conclave survivor in the Dome. Her voice hangs a moment after she's gone: "He'll come himself, you know. He always does, in the end."

Maren is on her knees at the foot of the Anchor, between her two lanterns. She hasn't tried to run.` },
          { text: `The last warden goes down. High Seeker Vex, bleeding from the scalp, regards the ruin of his ambush the way an accountant regards a bad quarter. "Noted," he says, and steps backward into a seam of silver light that closes behind him like a door.

Maren is on her knees at the foot of the Anchor, between her two lanterns. She hasn't tried to run.` },
        ],
        next: 'fate',
      },
      fate: {
        speaker: 'maren',
        decision: true,
        text: `"Well," she says. "Go on, then." She folds her chalky hands in her lap. "I'd have done it. I want you to know that. If he'd held out his hand with Elsa in it, I'd have given you to him and never slept again and called it a fair price." She looks at the second lantern. "That's who I am now. I don't know when it happened. I think it was the twentieth letter."`,
        options: [
          { text: `"Tell me about Elsa."`, once: true, tone: 'compassionate', tags: ['mercy'], next: 'elsa' },
          { text: `"Go home, Maren. Hang your lanterns. Live."`, tone: 'compassionate', tags: ['mercy'], next: 'spare',
            voices: {
              ilyra: `"She is a mother who was offered her child back. Any one of us might have walked her road. Let her go home."`,
              seris: `"Justice is owed — and she has paid in coin I would not wish on anyone. Let her go, under the law's eye, not its axe."`,
              brakka: `"She's no soldier. She's a wreck. Let her go."`,
              tessa: `"Let her go. Somebody has to keep remembering the girl."`,
              varek: `"I know what it is to owe him something. Let her go."`,
              orren: `"Take only what you need. We don't need her death."`,
            } },
          { text: `"You'll write to him again. And this time you'll write exactly what we tell you."`, tone: 'pragmatic', tags: ['pragmatic', 'deception'], next: 'turn',
            voices: {
              kael: `"She's already a spy. Make her ours."`,
              vaelis: `"Severin answered her letter. Let her keep writing to him — our way."`,
              seris: `"Let her make restitution. That is justice that does some good."`,
            } },
          { text: `"You sold us to the people who would have taken the Heart from my dead hand."`, tone: 'aggressive', tags: ['violence', 'cruelty'], next: 'kill',
            voices: {
              korr: `"She chose. She knew. Honour is not owed to the one who sells you." He does not sound glad.`,
              nima: `"She led us here to — I don't — just do something!"`,
            } },
        ],
      },
      elsa: {
        speaker: 'maren',
        text: `For a moment she can't speak. Then the words come out of her the way water comes out of a cracked jug, all at once and everywhere.

"She hated porridge. She sang to the hens. She had a wooden horse called Sir Biscuit that she took to bed every night until she was six, and then she said she was too old, and then she took him to bed anyway." Maren is smiling. It is the worst thing you have ever seen. "She was afraid of the dark, so I made her a lantern. A little one, for her room. The morning she was gone the lantern was still there, still lit, on a hook beside a bed that had always been a linen-press. Nobody remembered her. Not the midwife. Not her father." She looks at the second lantern. "That's the one. I've kept it lit eight years."`,
        effects: ['set a1v_heard_elsa'],
        interjections: [
          { who: 'ilyra', text: `Ilyra sits down on the dais steps beside Maren, close enough that their shoulders touch. She doesn't say anything at all. It is the kindest thing anyone has done in the Dome all day.` },
          { who: 'korr', text: `Korr looks away, at the dark tiers, jaw working. "Thal had a daughter," he says, to no one. Then nothing else.` },
        ],
        next: 'fate',
      },
      spare: {
        speaker: 'maren',
        effects: ['set a1_maren_fate spared', 'give a1v_maren_lists', 'xp 100'],
        text: `"…Why?" She searches your face as though the answer might be written on it. You don't have one that fits into words. Perhaps that is the answer.

She stands, slowly, like a much older woman. Then she presses something into your hands: a thick sheaf of papers, soft with handling, tied with lantern-string. "My lists," she says. "Eight years of them. Every name I ever found scraped out of a register. Every gap in a census. Every bed that became a linen-press." Her voice steadies. "I was keeping them for Elsa. I think they were always for someone going where the answers are." She picks up her two lanterns. "I'll go home. I'll hang them on the tree. Both of them." At the foot of the tiers she stops without turning. "If you ever find her. If there is anything left of her, anywhere. Tell her I drew her older every year."`,
        interjections: [
          { who: 'seris', text: `Seris watches her climb the tiers. "That was mercy," she says. "I was taught that mercy without justice is cowardice." She is quiet a moment. "I am no longer certain which of those she has just received."`, effects: ['rel seris respect 2'] },
          { who: 'ilyra', text: `Ilyra lets out a long breath. "Thank you," she says, to you, very quietly — as if you had spared someone of hers.`, effects: ['rel ilyra affection 3', 'memory ilyra 2 You let Sister Maren go home to her lanterns.'] },
        ],
        next: 'rupture',
      },
      turn: {
        speaker: 'maren',
        effects: ['set a1_maren_fate turned', 'xp 100'],
        text: `She looks at you for a long moment, and something in her straightens: not hope, exactly, but its harder cousin, purpose. "Yes," she says. "Yes. I can do that. I'm very good at letters." She wipes her face. "I'll tell him the bearer was wounded. That you fled north, to the Iron Mountains. That the Heart is cracked." A ghost of the old smile. "He'll know eventually. He always knows. But not soon." She stands, and gathers up her lanterns. "And when he does know, at least I'll have been useful to someone who didn't lie to me either."`,
        interjections: [
          { who: 'kael', text: `Kael watches her go with an expression you can't read. "Welcome to the trade, Sister," he murmurs. "It doesn't get easier. You just get better at it."` },
          { who: 'seris', text: `Seris says nothing, but her jaw is tight. Restitution, she called it. It looks a great deal like using someone.` },
        ],
        next: 'rupture',
      },
      kill: {
        speaker: 'dm',
        effects: ['set a1_maren_fate killed', 'rep hollowmere -5'],
        text: `She doesn't run. She doesn't raise her hands. She only reaches out and turns the second lantern a little, so that its light falls on her face instead of the floor.

"Light one for both of us," she says.

Afterwards, the Dome is very quiet. The two lanterns go on burning on the dais steps. You find that you can't bring yourself to put them out, and you can't bring yourself to take them with you, and so you leave them there, burning, beside her.`,
        interjections: [
          { who: 'ilyra', text: `Ilyra kneels by Maren's body and closes her eyes with two fingers and says the rite for the dead in a voice that never once breaks. Then she gets up and walks away from you, and doesn't come back for a long time.`, effects: ['rel ilyra affection -5', 'rel ilyra trust -3', 'memory ilyra -3 You killed Sister Maren at the foot of the Anchor, between her two lanterns.'] },
          { who: 'seris', text: `"Judgment," Seris says. Her voice is steady. Her hands are not. "That is what I was raised to call it. I find I do not want to call it anything."`, effects: ['memory seris -1 Sister Maren died at the Anchor in Valdros, by your order.'] },
          { who: 'korr', text: `Korr says the Ashkin word for a debt that was paid in the wrong coin, and nothing else.` },
        ],
        next: 'rupture',
      },
      f_after: {
        speaker: 'maren',
        effects: ['set a1_maren_fate absent', 'set a1v_anchor_read', 'xp 50'],
        text: `Maren comes out from behind the Anchor with her one lantern held in both hands like a shield, chalk smeared across her cheek. "They followed you," she says. "Not me. They followed you." She is shaking. "I came here to read a stone. I didn't think — I never think, Abbess always said so —"

She stops. Then, because she is Maren, and because she does not know how to do anything else with fear, she turns back to the inscriptions. "Here. Look. I didn't understand it before." Her finger traces a line of Ithari script that is glowing brighter than the rest. "'I am a lock, and I am a window. Through me the evening looks in.' It's not just an Anchor. It's — it's looking at somewhere. Somewhere specific. Somewhere where it's always…" She looks up, white. "Evening."`,
        interjections: [
          { who: 'vaelis', text: `"A window," Vaelis breathes. "A window onto a specific page. Oh, that's — that's not in any of my — " He looks at the cracking glass. "That's very bad, isn't it. Windows break."` },
        ],
        next: 'rupture',
      },
      rupture: {
        speaker: 'dm',
        text: `The Anchor screams.

There is no other word for it. The black glass cracks along every vein of light at once, and through the cracks, instead of the dark beneath the Dome, you see evening: a sky the colour of a bruise, and water to the horizon, and lanterns drifting on it like scattered stars. The air turns cold and smells of salt. The hum becomes a roar becomes a single held note that you feel in your teeth.

Something on the other side of the glass turns toward the crack. Something very large.

It is in no hurry. The crack widens a finger's breadth at a time, and in that long, terrible slowness you have just enough time to bind what is bleeding, drink what is left in your flasks, and breathe.`,
        effects: ['rest short'],
        options: [{ text: `Stand your ground.`, tone: 'pragmatic', effects: ['dialogue a1v_ossaryx'], end: true }],
      },
    },
  },
  {
    id: 'a1v_ossaryx', title: 'Ossaryx, the Gloaming Wyrm',
    start: [{ if: 'a1v_ossaryx_met', node: 'resume' }, { node: 'a' }],
    nodes: {
      a: {
        speaker: 'dm',
        effects: ['quest a1_main wyrm', 'set a1v_ossaryx_met'],
        text: `It comes through the Anchor the way the tide comes through a breached wall: not all at once, but without any possibility of stopping.

First a head, long and narrow and crowned with backswept horns of something like dark coral, scaled the deep blue-grey of the sky an hour after sunset. Then a neck, and a neck, and more neck, coil on coil of it pouring down the dais and up the tiers, scattering stone benches like twigs. Its eyes are the size of shields and the colour of a candle seen through fog. It is so large that it has to curl around the Dome's whole circumference, and still the end of it is somewhere on the other side of the glass, in the evening.

It flinches from the Anchor's light as though the light were a blade.`,
        interjections: [
          { who: 'korr', text: `Korr's lips pull back from his teeth. Not a snarl: a grin, half terror, half reverence. "Wyrm," he breathes. "The old songs were too small."` },
          { who: 'brakka', text: `Brakka sets her shield, plants her feet, and says, with great calm, "Right. That's bigger than the wall."` },
          { who: 'nima', text: `Nima's sparks have gone out completely, which you have never seen happen. "Oh," she whispers. "Oh, it's beautiful. Oh, we're going to die."` },
          { who: 'kael', text: `Kael has already found the nearest exit, the next nearest exit, and a pillar to hide behind. He doesn't move toward any of them. "I want it on record," he says, "that I'm staying."` },
          { who: 'orren', text: `Orren has gone very quiet. "It's not hunting," he says. "Look at it. It's lost."` },
        ],
        next: 'b',
      },
      b: {
        speaker: 'dm',
        text: `Caught in its coils, carried with it like a dragon's gold, are lanterns.

Hundreds of them. Paper and glass and horn and tin; lanterns from villages you know and lanterns from places that have never been on any map; lanterns shaped like fish and stars and little houses. Every one of them is lit, with a steady, sourceless, dusk-blue light that does not flicker. Among them — you are almost sure of it — hang a handful of honey-coloured paper lanterns, the festival kind, the kind Mira sells from a tray in Hollowmere's square. Their name-panels are blank.`,
        next: 'speaks',
      },
      speaks: {
        speaker: 'a1v_ossaryx',
        text: `When it speaks, the voice does not come from its mouth. It comes from the cracks in the Anchor, and from the lanterns, and from somewhere behind your breastbone, all at once.

"LIGHT." The word is a wound. "Always this light. Is this how you live, little ones — flayed by it, day upon day, with nowhere to hide your eyes? And you call it mercy." The great head lowers until one candle-eye is level with you. "I can smell what you carry. The hand that turned our page. Have you come to finish the turning?"`,
        options: [
          { text: `"Who are you?"`, once: true, tone: 'curious', next: 'who' },
          { text: `"Where have you come from?"`, once: true, tone: 'curious', tags: ['curiosity'], next: 'where' },
          { text: `"Why do you carry the lanterns?"`, once: true, tone: 'compassionate', next: 'lanterns' },
          { text: `[Perception] Study the lanterns caught in its coils.`, once: true, check: { skill: 'perception', dc: 14, advIf: 'a1v_knows_ysmerond' }, tone: 'curious', tags: ['curiosity'], success: 'hoard_ok', failure: 'hoard_fail' },
          { text: `"What do you want?"`, once: true, tone: 'diplomatic', next: 'want' },
          { text: `"Enough. Decide what happens now."`, tone: 'pragmatic', next: 'choice' },
        ],
      },
      who: {
        speaker: 'a1v_ossaryx',
        text: `"I am Ossaryx." It says its own name the way you would say the name of a country that has ended. "Keeper of the lamps. Last of the sovereigns of the evening. For four thousand evenings I swam the lantern-roads between the drowned towers, and wherever I passed, the little lights were lit again, and the people at the windows knew they were not yet forgotten." A long breath, like wind across water. "Then the sky tore. And I fell into your noon."`,
        next: 'speaks',
      },
      where: {
        speaker: 'a1v_ossaryx',
        text: [
          { if: 'a1v_knows_ysmerond', text: `Before it can answer, you say the word that came to you in the drowned city: "Ysmerond."

The whole vast body goes still. Every lantern in its coils flares at once. "You know its name," Ossaryx says, and its voice is suddenly very quiet, and very close. "How? How do you know its name? No one in this burning place has ever — " The candle-eye blinks, slowly. "Say it again." You do. "Yes," it whispers. "Yes. Ysmerond. The Evening Sea. Where the sun never rose after the Unmaking, and so we made our own."` },
          { text: `"From the Evening Sea." The great head turns toward the crack in the Anchor, where the bruise-coloured sky still shows. "From the world where your Unmaking was never mended. The sun went out, little one, and never came back. We built our towers on the water and lit our lamps and sang to each other across the dark, and it was enough. It was enough." Its voice drops. "Then your world reached through and pulled, and here I am, and there it is, and I cannot find the way."` },
        ],
        effects: ['clue a1_main ysmerond'],
        next: 'speaks',
      },
      lanterns: {
        speaker: 'a1v_ossaryx',
        text: `"These?" It curls a coil a little tighter around them, protective as a mother. "These were left burning for the forgotten. In every world there are people who light lamps for those no one remembers — did you know that? Even in yours. And when the forgotten slip through into the margins, the lamps follow them, and drift." The candle-eyes half close. "I found them in the dark between worlds, guttering. I gathered them. Someone must keep the lamps lit for the ones nobody remembers. That is what I am for." A long silence. "That is what I was for."`,
        interjections: [
          { who: 'ilyra', text: `Ilyra's hand is pressed to her mouth. "The festival," she whispers. "'For those we have forgotten.' It's been keeping them. All this time, something has been keeping them."` },
          { who: 'tessa', text: `Tessa has tears running down her face and doesn't seem to know it. "Every culture," she says. "Every culture has a version. Lights for the missing. Nobody ever knows why." She laughs, cracked. "Because it's true. That's why. Because somebody's there to catch them."` },
        ],
        next: 'speaks',
      },
      hoard_ok: {
        speaker: 'dm',
        text: `You look, really look. And there, tangled in a fold of the great coil, is a honey-coloured paper lantern with a name-panel that is not quite blank: the ghost of brushed letters, faded almost to nothing. M-A-R-T-I-N.

You caught that lantern once. On the night of the bell, in the fog, before its name could disappear, while the woman beside you asked why you were holding it so carefully. And it ended up here: carried out of the world on the tide of forgetting, and caught, and kept lit, by a grieving thing at the edge of everything.`,
        effects: ['set a1v_hoard_known', 'clue a1_main hoard', 'xp 50'],
        next: 'speaks',
      },
      hoard_fail: { speaker: 'dm', text: `There are too many, and they are too bright, and every time you try to fix on one the coils shift, and it is gone among the others.`, next: 'speaks' },
      want: {
        speaker: 'a1v_ossaryx',
        text: `"Want?" It considers the word as if tasting it. "I want the dark. I want the water. I want the towers and the lamp-roads and the voices at the windows." Its voice hardens. "And since I cannot have them, I want your sun put out, so that the next one who falls through the sky into your noon does not have to scream." The coils tighten; benches crack. "Your world is a lie that ate mine, little light-bearer. I do not see why it should go on shining."`,
        next: 'maelis',
      },
      maelis: {
        speaker: 'maelis',
        text: `"It is telling the truth," says Maelis, very softly, in the back of your mind. Her voice is not steady. "Its world was a page that could not be saved. I am sorry. I am so sorry." A pause, and you have the strange impression that she is apologising for something she did. "It is grieving, bearer. Grief can be killed. It can sometimes be carried home. I have never managed either."`,
        next: 'speaks',
      },
      choice: {
        speaker: 'a1v_ossaryx',
        decision: true,
        text: `The Gloaming Wyrm rears until its horns scrape the Dome's high curve, lanterns swinging in its coils like a whole sky of small stars. Dusk pours off its scales and pools on the floor, cold as deep water.

"So. Will you be the next thing that devours me, little light-bearer?" it asks. "Or will you stand aside, while I put out your sun?"`,
        options: [
          { text: `Draw your weapons. "Then let us both be done grieving."`, tone: 'aggressive', tags: ['violence', 'boldness'], effects: ['combat a1_enc_ossaryx'],
            voices: {
              korr: `"Wyrm. Finally, something worth the song."`,
              brakka: `"It's big and it's angry and it's between us and the door. Shields."`,
              kael: `"Can we not? No? Fine. Aim for the eyes."`,
              seris: `"Whatever it was, it means to burn this world. I will not let it."`,
            } },
          { text: `[Resonance] "I can show you the way home." Reach into the cracked Anchor and find its world. (Spend 2 Resonance)`, if: `res>=2 && ${UNDERSTANDS}`, lockedText: 'Requires 2 Resonance — and some understanding of where Ossaryx came from. Valdros remembers; so does its hoard.', tone: 'resonance', tags: ['mercy', 'forbidden'], effects: ['res -2', 'set a1v_return_tried'], next: 'ret1',
            voices: {
              ilyra: `"It's grieving. I know grieving. Help it home."`,
              orren: `"It doesn't belong here. Nothing should die for being lost."`,
              tessa: `"It's a song with no origin standing right in front of us. Let's sing it home."`,
              varek: `"I can hear its sea. It's close. We can open it."`,
              vaelis: `"This is theoretically impossible. I would give a century to watch you do it."`,
            } },
        ],
      },
      ret1: {
        speaker: 'dm',
        text: `You put your hand on the cracked black glass, and the Heart in your pack wakes, and the Anchor opens under your palm like a book.

It is not one window. It is a thousand. Pages of the Unwritten flutter past you in the dark: a city of white towers on a sea you know is not this sea; high meadows under two moons; a forest of a single tree; a desert of red glass that is still burning. Somewhere among them, evening. Somewhere among them, water to the horizon and lanterns on it. You have to find the right page. If you open the wrong one, you will pour some other world's ruin into this Dome.`,
        options: [
          { text: `[Insight] Search the pages for the one that grieves the way Ossaryx grieves.`, check: { skill: 'insight', dc: 16, advIf: 'item:a1v_wyrm_lantern || a1v_knows_ysmerond' }, tone: 'resonance', tags: ['mercy'], success: 'ret2', failure: 'ret_fail' },
          { text: `[Arcana] Hold the Anchor still and read its window like a map.`, check: { skill: 'arcana', dc: 16, advIf: 'comp:vaelis || a1v_anchor_read' }, tone: 'resonance', tags: ['knowledge'], success: 'ret2', failure: 'ret_fail' },
        ],
      },
      ret2: {
        speaker: 'a1v_ossaryx',
        text: `There. You find it: the bruise-dark sky, the drowned towers, the lantern-roads. And the lanterns on them are lit. Not all of them — but many. More than one creature could ever have tended.

You hold the window open, trembling, and Ossaryx looks through it, and its whole vast body goes rigid.

"No," it says. "A trick. A painted window. You would show me a picture of my home and call it a door, so that I swim into the dark between worlds and drown there, and trouble your sun no more." The coils tighten. Lanterns clink. "Why should I believe you, child of the page that ate mine?"`,
        options: [
          { text: `[Persuasion] "Look at the lanterns. Someone lit them after you fell. Someone is keeping your duty — and waiting for you to come back."`, check: { skill: 'persuasion', dc: 18, advIf: 'a1v_knows_ysmerond || a1v_hoard_known' }, tone: 'diplomatic', tags: ['mercy', 'honesty'], success: 'ret_ok', failure: 'ret_fail' },
          { text: `[Performance] Sing the lantern-song of Hollowmere's festival — the one nobody knows the origin of.`, check: { skill: 'performance', dc: 18, advIf: 'comp:tessa || a1v_hoard_known' }, tone: 'friendly', tags: ['tradition', 'mercy'], success: 'ret_song', failure: 'ret_fail' },
        ],
      },
      ret_song: {
        speaker: 'dm',
        text: `You don't know why you do it. You open your mouth and sing the lantern-song, the one every child in Hollowmere learns before they can read, the one with the tune that goes up where you expect it to come down: "Hush now, the lantern's lit, the bell will bring you home…"

Ossaryx goes utterly still. The lanterns in its coils pulse in time, every one of them, all at once.

"That is our song," it says. "That is the lamp-song of Ysmerond. That is what the children sing at the windows when I pass." Its voice is breaking. "How does your world know our song?"

You don't know. You only know that somebody, three thousand years ago, remembered.`,
        next: 'ret_ok',
      },
      ret_ok: {
        speaker: 'a1v_ossaryx',
        effects: ['set ossaryx_fate returned', 'set ossaryx_resolved', 'quest a1_main severin', 'give a1v_ysmerond_lantern', 'xp 900'],
        text: `For a long time the Gloaming Wyrm does not move. Then, very slowly, it lowers its great head until its brow — cool as river stone, rough as coral — rests against your outstretched hand.

"Then I am not the last," says Ossaryx. "Someone is lighting the lamps." The candle-eyes close. "I was so certain I was the last."

It begins to uncoil. As it goes, it sets down lanterns on the dais, one by one, gently, the way you would set down sleeping children: the honey-coloured paper ones from Hollowmere, and others from towns you have never heard of. "These are yours," it says. "They were lit for your forgotten. Take them home. Light them again. And if one day the sun goes out in your world, little light-bearer —" it pauses at the crack in the Anchor, half in evening, half in day — "I will know how to find you."

Then it is gone, through the window into the Evening Sea, and the last thing you see of it is a long dark shape sliding away along a road of lanterns, and each one it passes flaring bright.`,
        next: 'gone',
      },
      gone: {
        speaker: 'dm',
        text: `The window narrows. The cracks in the Anchor seal themselves, slowly, like ice forming in reverse. The salt smell fades. A last breath of evening air stirs the lanterns on the dais, and then it is only the Dome, and the hum, and the dust.

One lantern remains in your hands: dusk-blue glass in a cage of dark metal waves, still lit, warm as a palm.`,
        interjections: [
          { who: 'ilyra', text: `Ilyra is weeping openly and doesn't care who sees. "It went home," she says. "Some things get to go home."`, effects: ['rel ilyra affection 4', 'memory ilyra 3 We sent the Gloaming Wyrm home instead of killing it.'] },
          { who: 'tessa', text: `Tessa is still humming the lamp-song under her breath. "A Sael tide-tune," she says at last, hoarse. "It's a tide-tune. I'd know it anywhere." She hugs herself. "I need to write this down before I forget it. I'm never going to forget it."`, effects: ['rel tessa affection 3', 'memory tessa 3 We sang a wyrm home with a festival song.'] },
          { who: 'korr', text: `Korr lets out a breath he seems to have been holding since the Anchor cracked. "No song," he says, "will ever be big enough for that." He sounds happy about it.`, effects: ['rel korr respect 2'] },
          { who: 'vaelis', text: `Vaelis is staring at the sealed Anchor with an expression of naked hunger. "Theoretically impossible," he says. "I'm going to have to rewrite everything." A beat. "Splendid."`, effects: ['rel vaelis respect 3'] },
          { who: 'varek', text: `Varek touches the glass where the window was. "It's quieter," he says, puzzled. "The Choir. For a moment there they all stopped and listened." He takes his hand away quickly.` },
        ],
        options: [{ text: `The Anchor is still glowing.`, tone: 'pragmatic', effects: ['dialogue a1v_severin'], end: true }],
      },
      ret_fail: {
        speaker: 'a1v_ossaryx',
        text: `The window slips. The page tears in your grip and shows, for an instant, something else — a burning desert, a frozen crowd — and Ossaryx recoils from it with a roar that cracks the Dome's high curve.

"LIES," it says. "Painted windows. You are just like the others: you would trick me into the dark and call it kindness." Dusk pours from its jaws, cold and lightless. "Very well. I will be done grieving, and so will you."`,
        options: [{ text: `Then it's a fight.`, tone: 'aggressive', tags: ['violence'], effects: ['combat a1_enc_ossaryx'] }],
      },
      resume: {
        speaker: 'a1v_ossaryx',
        text: `The Gloaming Wyrm turns its terrible head back toward you, lanterns swinging in its coils. "Still here, little light-bearer?"`,
        next: 'choice',
      },
    },
  },
  {
    id: 'a1v_ossaryx_slain', title: 'The Lamps Go Out',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `Ossaryx falls the way a sky falls at the end of the day: slowly, and then all at once.

Its long body slides down the tiers, scattering benches, and comes to rest coiled around the Anchor as though trying to keep warm. The dusk that poured off its scales thins and drains away into the cracks in the floor. Its great head lies on the dais steps at your feet, and one candle-eye is still open, and still looking at you.`,
        next: 'b',
      },
      b: {
        speaker: 'a1v_ossaryx',
        text: `"…Light the lamps," it says. Its voice is very small now; it comes only from the lanterns. "Someone… must light the lamps. For the ones nobody remembers." The eye begins to dim. "I was so tired of the light. Isn't that strange? I kept it for four thousand evenings, and I was so tired…"`,
        next: 'c',
      },
      c: {
        speaker: 'dm',
        text: `The candle-eye goes out. And then, one by one, all through its coils, the lanterns go out too — paper and glass and horn and tin, lanterns from everywhere and nowhere, winking out like a city going to sleep, until the Dome is dark except for the Anchor.

All but one. A honey-coloured paper lantern from Hollowmere's festival, its name-panel blank, is still burning beside its jaw. You pick it up. It is warm.`,
        interjections: [
          { who: 'korr', text: `Korr kneels beside the great head and lays his palm flat on its brow, the way the Ashkin honour a fallen enemy who fought well. "Sleep, sovereign," he says. "I will make the song big enough. Somehow."`, effects: ['rel korr respect 3', 'memory korr 2 We slew Ossaryx the Gloaming Wyrm in the Senate Dome of Valdros.'] },
          { who: 'brakka', text: `Brakka lowers her shield very slowly. "We won," she says, and then, quieter, frowning at the dead lanterns: "Didn't we?"` },
          { who: 'ilyra', text: `Ilyra says the rite for the dead over it, every word, the same as she would for anyone. When she finishes her voice is hoarse. "It was grieving," she says. "We killed something that was grieving."` },
          { who: 'tessa', text: `Tessa stares at the dark lanterns. "That's the saddest thing I've ever seen," she says, "and I've seen my own — " She stops. She does not finish the sentence.` },
          { who: 'seris', text: `Seris wipes her blade clean and sheathes it, and only then do her hands begin to shake. "It would have burned this world," she says. "I know that." She does not sound as if knowing it is helping.` },
        ],
        options: [{ text: `The Anchor flares.`, tone: 'pragmatic', effects: ['dialogue a1v_severin'], end: true }],
      },
    },
  },
  {
    id: 'a1v_severin', title: 'The Voice in the Anchor',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        effects: ['quest a1_main severin'],
        text: `The Anchor does not go dark. Instead, its light draws in on itself, gathering at the heart of the black glass, folding and refolding, until it is the height of a man. Then it is the shape of a man. Then it is a man: lean, silver-templed, in a plain dark coat with no badge on it, standing inside the glass as though behind a window, with his hands clasped loosely at his back.

He looks at you for a while before he speaks. He does not seem to blink.`,
        interjections: [
          { who: 'vaelis', text: `Vaelis makes a sound you have never heard from him: a small, involuntary sound, like a man who has stepped on a stair that isn't there. All the colour has left his face.`, effects: ['set a1v_vaelis_saw_severin'] },
          { who: 'varek', text: `Varek takes one step back, and then, deliberately, one step forward again. His violet eyes are very bright.` },
        ],
        next: 'b',
      },
      b: {
        speaker: 'a1v_severin',
        text: `"Good evening." His voice is quiet, courteous, unhurried — the voice of a physician at a bedside. "Forgive the manner of my arrival. This Anchor is the only door in Valdros I can open from where I am, and it is not a comfortable one." A slight inclination of the head. "My name is Severin Cael. I am the Archon of the Aether Conclave. You have been told things about me, I expect. Most of them are true."`,
        options: [
          { text: `"You sent soldiers to take us."`, once: true, tone: 'aggressive', tags: ['defiance'], next: 'ambush' },
          { text: `"What did you promise Maren?"`, once: true, tone: 'compassionate', next: 'maren' },
          { text: `"What is the Heart? Why does everyone want it?"`, once: true, tone: 'curious', tags: ['curiosity'], next: 'heart' },
          { text: `"Where did Ossaryx come from?"`, once: true, tone: 'curious', tags: ['knowledge'], next: 'realities' },
          { text: `[Vaelis] Vaelis has gone very still beside you.`, if: 'comp:vaelis', once: true, tone: 'class', next: 'v1' },
          { text: `"Why me?"`, once: true, tone: 'curious', next: 'whyme' },
          { text: `"What do you want?"`, tone: 'pragmatic', next: 'offer' },
        ],
      },
      ambush: {
        speaker: 'a1v_severin',
        text: [
          { if: 'a1v_ambush_parleyed', text: `"I sent them to bring you to me. Not to kill you; I was specific." A faint smile. "I was less specific about how gently, and I won't insult you by pretending otherwise. You talked them out of it, I gather. That's a better result than I planned for. I'm grateful to you; I'd have had to write to their families."` },
          { text: `"I sent them to bring you to me. Not to kill you; I was specific about that." He glances at something beyond the glass that you cannot see. "I was less specific about how gently, and I won't insult you by pretending otherwise. Some of them are dead now. I'll write to their families tonight. That's my cost, not yours. I chose it."` },
        ],
        next: 'b',
      },
      maren: {
        speaker: 'a1v_severin',
        text: [
          { if: 'maren_forgets', text: `"Sister Maren?" A pause, as if consulting a ledger in his head. "She wrote to me. Forty-one letters, over eight years, about a child the world had forgotten. Then the letters stopped, on the night of your bell. I imagine she no longer knows why she ever wrote them." His voice does not change, but something behind it does. "That is the kind of thing the Veil does to people. It is the kind of thing I intend to end."` },
          { if: 'a1_maren_fate=killed', text: `"That the Heart could restore her daughter. It can. That I would do it if she brought you here. I would have." He is silent a moment. "She's dead, isn't she? I'm sorry. Not for my part — I knew what I was offering, and to whom. But I'm sorry. She drew the girl older every year. Did she tell you that? She sent me the drawings."` },
          { text: `"That the Heart could restore her daughter. It can. That I would do it, if she brought you here. I would have." He holds your gaze steadily. "I make very few promises, so that I can keep all of them. I didn't lie to her. I'm not going to lie to you. You'll find that's the most inconvenient thing about me."` },
        ],
        next: 'b',
      },
      heart: {
        speaker: 'a1v_severin',
        effects: ['set a1v_many_anchors', 'clue a1_main many_anchors'],
        text: `"You've been thinking of it as a treasure. It's a key." He says it simply, as a teacher states a premise. "There are some forty Anchors that matter, holding this world in its shape — under temples, under lakes, under fortresses, under this Dome. Every one of them answers to the thing in your pack. Hollowmere's rang because the Heart was waking. Valdros tore tonight because you walked into it carrying the Heart, and because my Seekers' instruments pulled at it. I won't apportion the blame more finely than that."

He tilts his head. "What else it is — I know more than I'm going to tell you tonight. Not because the truth would be a lie. Because you wouldn't believe it yet, and I'd rather you heard it from the right source when you're ready. Ask it, someday. It may even answer."`,
        next: 'heart_m',
      },
      heart_m: {
        speaker: 'maelis',
        text: `In the back of your mind, Maelis has gone so quiet you can hear her not speaking.`,
        next: 'b',
      },
      realities: {
        speaker: 'a1v_severin',
        effects: ['clue a1_main other_realities'],
        text: [
          { if: 'ossaryx_fate=returned', text: `"From a world where the sun never rose again. There are others alongside this one, many others — pages torn out of the book, still being written somewhere in the margins. I have read a few of them." A pause, and for the first time something like real feeling enters his voice. "You sent it home. I didn't think that could be done. I am rarely surprised. Thank you. I'll need to revise some figures."` },
          { text: `"From a world where the sun never rose again. There are others alongside this one, many others — pages torn out of the book, still being written somewhere in the margins. I have read a few of them." He looks at the great dark coils lying around the Anchor. "You killed the last sovereign of one of them tonight. It would have killed you. I don't judge you for it. I only want you to notice what it cost. Most people never do."` },
        ],
        next: 'b',
      },
      whyme: {
        speaker: 'a1v_severin',
        text: `"The Heart could have been taken from you. It would have been ugly and quite probably fatal, and I dislike waste." He says it without menace, as a fact about weather. "But that isn't why I'm speaking to you. You heard the second toll, in Hollowmere. You held the Heart and it did not burn you out. It chose you." He steps closer to the glass. "I don't want the stone. I want you. Your eyes, your hands, the way it speaks to you. I want you at my side when I use it."`,
        next: 'b',
      },
      v1: {
        speaker: 'comp:vaelis',
        text: `"Severin." Vaelis's voice comes out thin and dry, like paper. "You look old."`,
        next: 'v2',
      },
      v2: {
        speaker: 'a1v_severin',
        effects: ['set a1v_vaelis_met_severin', 'set vaelis_severin_hint'],
        text: [
          { if: 'cq_vaelis_outcome', text: `"Hello, Vaelis." Warmth: real, unhurried, terrible. "I am old. You look well. You always looked well when you were frightened." His eyes move over Vaelis's face as if reading a page he once wrote. "You found my note, then. The proof was never finished." The smallest smile. "The door is still open."` },
          { text: `"Hello, Vaelis." Warmth: real, unhurried, terrible. "I am old. You look well. You always looked well when you were frightened." His eyes move over Vaelis's face as if reading a page he once wrote. "The proof was never finished, you know. Neither were you." The smallest smile. "The door is still open."` },
        ],
        next: 'v3',
      },
      v3: {
        speaker: 'comp:vaelis',
        text: `Vaelis does not answer. His hands, at his sides, are clenched so tight the knuckles are white as Ithari stone. After a moment he turns his face away from the glass, and then, very slightly, he moves to stand a half-step closer to you. It is the bravest thing you have ever seen him do.`,
        effects: ['rel vaelis trust 3', 'memory vaelis 1 Severin spoke to me through the Anchor at Valdros, and I stood beside you instead of answering.'],
        next: 'b',
      },
      offer: {
        speaker: 'a1v_severin',
        decision: true,
        text: `"Partnership." He lets the word sit. "Come to the Obsidian Citadel. Not in chains — walk through the front gate. I will open every archive the Conclave has. I will show you what the Veil is, and what it's for, and what it costs. And then you'll decide, with all the facts, whether to help me." A pause. "That is more than anyone has ever offered me."

"Here is what I want, since you asked and I don't lie: to mend the world. Properly. It was written once, in a hurry, by frightened people, and it shows. I'd like it written again by someone who has had time to think. Without plague. Without children turned away from temple doors to die in the street." His voice does not rise. It doesn't need to. "I watched that happen when I was nine. I have been thinking about it ever since."`,
        options: [
          { text: `"No. Whatever you're building, I won't help you build it."`, tone: 'aggressive', tags: ['defiance', 'honesty'], effects: ['set a1_severin refused'], next: 'refused',
            voices: {
              seris: `"He speaks like a saint and sends soldiers like a tyrant. Refuse him."`,
              brakka: `"No. Just — no. Some walls you don't open."`,
              kael: `"When a man that polite wants you this badly, run."`,
              korr: `"He offers a world with no grief. The Ashkin have a word for that. It means 'grave.'"`,
            } },
          { text: `"I'm not saying yes. But I'm listening."`, tone: 'diplomatic', tags: ['caution', 'knowledge'], effects: ['set a1_severin listened'], next: 'listened',
            voices: {
              vaelis: `"Listen to him. He never lies. That's what makes him dangerous — and what makes him worth hearing."`,
              tessa: `"Listening isn't agreeing. Get the whole song before you decide you hate it."`,
              orren: `"Listen before you act."`,
            } },
          { text: `"A world without plague. Without grief." You find you want it. "Say that again."`, tone: 'curious', tags: ['forbidden', 'curiosity'], effects: ['set a1_severin tempted'], next: 'tempted',
            voices: {
              nima: `"A world where fire doesn't take your family's house…? Don't — I don't know. Say yes. No. I don't know."`,
              varek: `"He has offered me things before. He always paid in full. That's what frightens me."`,
            } },
        ],
      },
      refused: {
        speaker: 'a1v_severin',
        text: `He nods, as if you had confirmed a figure he had already written down. "Thank you for being honest. It's rarer than you'd think." He seems, if anything, faintly pleased. "Then we'll be opponents, and I'll be courteous about it. You'll find I'm patient."

"One more thing, since I'd rather you didn't die in a ditch before you've heard the rest. My Seekers will be at the south gate of Valdros within the hour, and on the Woods road by dusk. The road toward Solmara is watched less closely than the others. I tell you this not as a threat. Good night."`,
        next: 'maelis',
      },
      listened: {
        speaker: 'a1v_severin',
        text: `"Thank you." He says it as though you had given him something valuable, and perhaps you have. "That is all I ask, for now. Listening is the beginning of every honest thing." He glances away, at something on his side of the glass. "My Seekers will be at the south gate within the hour. I can't call them off without explaining why, and I would rather not lie to them either. Take the road toward Solmara. We'll speak again. I'll make sure of it."`,
        next: 'maelis',
      },
      tempted: {
        speaker: 'a1v_severin',
        text: `"I know." His voice is gentle. "It's a good world I'm describing. I've had thirty years to make sure of it." He watches your face, and you know he has seen exactly how much you wanted it, and that he will remember. "Don't decide tonight. Tonight you're tired and frightened and grieving, and I'd rather have you rested and certain. My Seekers will be at the south gate within the hour; I can't call them off without lying to them. Take the road toward Solmara. Think. When you're ready, I'll be waiting."`,
        next: 'maelis',
      },
      maelis: {
        speaker: 'maelis',
        text: [
          { if: 'a1_severin=tempted', text: `The light in the glass goes out. In the silence, Maelis speaks, and her voice is very old and very tired. "He is right about more than I would like," she says. "He is wrong about the one thing that matters most. I cannot tell you which thing yet." A pause. "When you wanted his world just now — I felt it. So did he. Be careful what you want near him, bearer. He keeps very good notes."` },
          { if: 'a1_severin=listened', text: `The light in the glass goes out. In the silence, Maelis speaks. "Listen to him, then," she says. "He has earned that much, by never lying. But remember that a man can say only true things and still lead you somewhere false, if he chooses which true things to say." A pause. "I should know."` },
          { text: `The light in the glass goes out. In the silence, Maelis speaks, and there is something in her voice like relief, and something like grief. "He wants what I keep," she says. "He believes he knows what it is. He is… not entirely wrong." A long breath. "Thank you for saying no. I do not know yet whether it was right. I only know that I was afraid you would say yes."` },
        ],
        next: 'flee',
      },
      flee: {
        speaker: 'dm',
        text: `Far above, at the Dome's high doors, something booms: a ram, or a spell, or both. Silver light flickers in the cracks of the upper tiers. Boots, many of them, coming fast.

You run.

Out through the Dome by whatever door this Valdros allows, down the great avenue through a city that cannot decide which city it is, past the flickers, past the gate, into the Woods. Behind you Valdros flickers between its lost lives: burning, drowned, alive, ruined, burning. Ahead, the road bends west and south, toward the river-lands and the white terraces of Solmara, and toward everyone who has now learned your name.

In your pack, the Heart of Aether beats. Faster, now.`,
        interjections: [
          { who: 'kael', text: `Kael keeps pace beside you, breathing hard, grinning like a man who has just pickpocketed a god. "For the record," he pants, "I hate him. I hate how much I liked him. Both. Mostly the second."` },
          { who: 'seris', text: `Seris runs in full armour as if it weighed nothing, eyes front. "When this is done," she says, "I will have questions for my Order. And for the Lights." She doesn't say what kind.` },
          { who: 'vaelis', text: `Vaelis runs with his notebook clutched to his chest and does not speak at all, the whole way down the avenue. At the gate he looks back once at the Dome. Then he doesn't look back again.` },
          { who: 'orren', text: `Orren leads you into the trees by a path that wasn't there an hour ago. "The Woods want us gone," he says. "I think, today, that's a kindness."` },
        ],
        options: [
          { text: `Run for the road to Solmara.`, if: 'a1_severin=refused', tone: 'pragmatic', effects: ['set valdros_done', 'quest a1_main done', 'complete a1_main refused', 'set a1_complete', 'xp 300', 'chapter act2', 'goto valdros 23 30', 'epilogue act1'] },
          { text: `Run for the road to Solmara.`, if: 'a1_severin=listened', tone: 'pragmatic', effects: ['set valdros_done', 'quest a1_main done', 'complete a1_main listened', 'set a1_complete', 'xp 300', 'chapter act2', 'goto valdros 23 30', 'epilogue act1'] },
          { text: `Run for the road to Solmara.`, if: 'a1_severin=tempted', tone: 'pragmatic', effects: ['set valdros_done', 'quest a1_main done', 'complete a1_main tempted', 'set a1_complete', 'xp 300', 'chapter act2', 'goto valdros 23 30', 'epilogue act1'] },
        ],
      },
    },
  },
  {
    id: 'a1v_anchor', title: 'The Valdros Anchor',
    start: [{ if: 'quest:a1_main=severin', node: 'sev' }, { if: 'valdros_done', node: 'after' }, { node: 'a' }],
    nodes: {
      a: {
        speaker: 'dm',
        text: `A column of black glass, taller than a house, veined with pale light that pulses slow and uneven like a sick man's heartbeat. Ithari script spirals up its surface, so fine it looks like frost. The hum is so deep here you feel it in your back teeth.`,
        options: [
          { text: `[Arcana] Read what you can of the script.`, once: true, check: { skill: 'arcana', dc: 14 }, tone: 'curious', tags: ['knowledge'], success: 'read', failure: 'noread' },
          { text: `Step back.`, tone: 'leave', end: true },
        ],
      },
      read: { speaker: 'dm', text: `Most of it is beyond you. One phrase repeats, again and again, in every band of script: "I am a lock, and I am a window." Another, near the base, smaller, almost hidden: "The lamp that answers the lamp."`, effects: ['set a1v_anchor_studied'], next: 'a' },
      noread: { speaker: 'dm', text: `The letters slide away from your eyes like fish. You catch one word that might mean "lamp" and another that might mean "evening," or possibly "sorrow."`, next: 'a' },
      sev: {
        speaker: 'dm',
        text: `The light in the Anchor has drawn in on itself, gathering into a shape behind the glass. It is waiting for you.`,
        options: [{ text: `Listen.`, tone: 'pragmatic', effects: ['dialogue a1v_severin'], end: true }],
      },
      after: {
        speaker: 'dm',
        text: [
          { if: 'ossaryx_fate=returned', text: `The Anchor is quiet now, its cracks sealed like ice. If you put your ear to the glass you can hear, very faintly, water moving under a sky with no sun, and something far away singing a lamp-song.` },
          { text: `The Anchor is quiet now, its light steady and dim. The great dark coils around its base have already begun to turn grey, like ash, like evening. Nobody has touched the two lanterns on the steps.` },
        ],
        options: [{ text: `Step back.`, tone: 'leave', end: true }],
      },
    },
  },

  // ═══════════════════════════════════════════ ROAD EVENTS
  {
    id: 'a1v_tr_refugees', title: 'The People of Brindle Ford',
    start: 'a',
    nodes: {
      a: {
        speaker: 'a1v_refugee',
        text: `A handcart blocks the road, one wheel in the ditch. Around it: a grey-haired woman, two half-grown boys, a girl of about six asleep on a pile of bedding, and a goat with the air of a creature that has seen enough. The woman straightens from the stuck wheel when she sees you, and doesn't bother to be afraid.

"Brindle Ford," she says, before you can ask. "Down by the Sillow. Sixty houses, a mill, a chapel, the best eels on the river." She wipes her hands. "We went to the market at Tolley's Cross on Firstday. When we came back there was a lake where the village was. Old lake. Reeds and all. Fish in it older than me." She looks at the sleeping girl. "My husband was at home. And my daughter. And the eel-man's whole family. And everyone."`,
        interjections: [
          { who: 'ilyra', text: `Ilyra is already kneeling by the cart, checking the sleeping girl's breathing, the boys' blistered feet, the woman's hands. "I'm a hospice priestess," she says. "I've seen this before. I'm so sorry. I have seen this before."` },
          { who: 'seris', text: `Seris looks at the cart for a long time. "In the Order, we would call Brindle Ford 'taken by the Veil,'" she says quietly. "We would light a candle in the Dawnspire, and write it in a book. And then we would go on to the next." She swallows. "It is a very large book."` },
        ],
        options: [
          { text: `Help them free the wheel.`, once: true, tone: 'friendly', tags: ['charity', 'protect'], effects: ['xp 25'], next: 'wheel' },
          { text: `Give them coin for the road. (20 gold)`, if: 'gold>=20', once: true, tone: 'compassionate', tags: ['charity'], effects: ['gold -20', 'rep hollowmere 2', 'set a1v_refugees_helped'], next: 'coin' },
          { text: `"Go to Hollowmere. Ask for Mayor Brannock. Tell her we sent you."`, if: '!cq_seris_outcome=condemned', once: true, tone: 'compassionate', tags: ['charity'], effects: ['set a1v_refugees_hollowmere', 'rep hollowmere 2'], next: 'hollowmere' },
          { text: `[Resonance] Look at the place they came from, through the girl's dreams. (Spend 1 Resonance)`, if: 'res>=1', once: true, lockedText: 'Requires 1 Resonance.', tone: 'resonance', tags: ['curiosity'], effects: ['res -1'], next: 'vision' },
          { text: `Wish them luck and go on.`, tone: 'leave', end: true },
        ],
      },
      wheel: { speaker: 'dm', text: `It takes four of you and the goat's grudging cooperation, but the wheel comes up out of the ditch with a sucking sound. One of the boys laughs, surprised at himself, and then looks guilty for laughing.`, next: 'a' },
      coin: { speaker: 'a1v_refugee', text: `She looks at the coins in her hand as though they were in a foreign currency. "We had a house," she says. "With a door that stuck in winter." Then she closes her fingers over them, tight. "Thank you. I'll buy the girl shoes. She'll need shoes. Wherever we're going."`, next: 'a' },
      hollowmere: { speaker: 'a1v_refugee', text: `"Hollowmere." She tries the name. "They had the fog, didn't they? The bell." A nod. "Then they'll understand. That's worth more than a roof." She turns the cart east.`, next: 'a' },
      vision: {
        speaker: 'dm',
        text: `You touch the sleeping girl's hair, gently, and close your eyes, and the Heart shows you.

Brindle Ford. Sixty houses, a mill, a chapel, the smell of eels smoking. A man on a doorstep with a pipe, looking up the road for a handcart that is late. It is there. It is all there — one page over, a breath away, the width of a sheet of paper. It simply isn't here.

You open your eyes. The girl is smiling in her sleep.`,
        effects: ['set a1v_saw_brindle', 'xp 25'],
        interjections: [
          { who: 'varek', text: `Varek has gone grey. "It's still there," he says. "Isn't it? You saw it." He looks at the woman, who is not listening, and then away. "Don't tell her. Lights, don't tell her."` },
        ],
        next: 'a',
      },
    },
  },
  {
    id: 'a1v_tr_lanternbearer', title: 'A Life You Never Lived',
    start: 'a',
    nodes: {
      a: {
        speaker: 'a1v_lanternbearer',
        text: `At a crossroads shrine, a woman in a travelling cloak is sitting on the milestone with a lantern in her lap, as though she has been waiting a long time. When she sees you she stands up so fast the lantern swings.

"You came back," she says, and her face breaks open with joy. "You said you would, and everyone said you wouldn't, and you did." She takes your hands. Hers are cold. "Don't you know me? You taught me my letters. In the house by the mill, where you lived with your sister, and the roof leaked over the stairs, and you used to put a pan there and call it 'the music.'"

You have never seen her before in your life. You are certain of it. Almost.`,
        interjections: [
          { who: 'brakka', text: `Brakka has gone very still beside you. Her hand finds the haft of her axe and grips it, white-knuckled, though there is nothing here to fight. "She remembers you," she says, hoarsely. "And you don't remember her. Which of you is wrong?"` },
        ],
        options: [
          { text: `"I'm sorry. I don't know you."`, tone: 'diplomatic', tags: ['honesty'], next: 'truth' },
          { text: `"Of course I know you." Let her have this.`, tone: 'compassionate', tags: ['mercy', 'deception'], next: 'kind' },
          { text: `[Resonance] Look at the life she remembers. (Spend 1 Resonance)`, if: 'res>=1', lockedText: 'Requires 1 Resonance.', tone: 'resonance', tags: ['curiosity', 'forbidden'], effects: ['res -1'], next: 'vision' },
        ],
      },
      truth: {
        speaker: 'a1v_lanternbearer',
        text: `Her face doesn't fall the way you expect. It goes puzzled, then thoughtful, then very gentle. "No," she says. "No, you wouldn't, would you. It's happening everywhere. People remember people who aren't theirs." She presses the lantern into your hands anyway. "Take it. I kept it lit for you. It doesn't matter if you're not the one. Somebody should have it."`,
        effects: ['give aether_draught 1'],
        next: 'end',
      },
      kind: {
        speaker: 'a1v_lanternbearer',
        text: `She laughs and cries at once and hugs you hard, and you hug her back, a stranger on a cold road. "I knew it. I knew." She presses the lantern into your hands. "I kept it lit. Every night. I'll be all right now." She picks up her bundle and walks away down the west road without looking back, light as a girl.`,
        effects: ['give aether_draught 1'],
        next: 'end',
      },
      vision: {
        speaker: 'dm',
        text: `You hold her cold hands and let the Heart look.

A house by a mill. A leaking roof. A pan on the stairs going plink, plink. A girl at a kitchen table forming letters with her tongue between her teeth, and someone beside her, patient, laughing, pointing at the page — someone with your hands, your voice, your face. Someone who lived a whole quiet life in a village that does not exist, and died there, perhaps, or simply stopped, when that page was turned.

It was you. In some way that you will never be able to explain to anyone, it was you.`,
        effects: ['set a1v_saw_other_self', 'give aether_draught 1', 'xp 25'],
        next: 'end',
      },
      end: { speaker: 'dm', text: `The lantern is warm in your hands long after she has gone.`, options: [{ text: `Walk on.`, tone: 'leave', end: true }] },
    },
  },
  {
    id: 'a1v_tr_riders', title: 'Conclave Riders',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `Hoofbeats ahead, coming fast. Around the bend: five riders in Conclave grey on tall grey horses, a silver lodestone swinging from the lead rider's saddle-horn like a censer. The lodestone is turning. Slowly. Toward you.`,
        options: [
          { text: `[Stealth] Get off the road and into the trees before it finishes turning.`, check: { skill: 'stealth', dc: 13 }, tone: 'pragmatic', tags: ['stealth', 'caution'], success: 'hid', failure: 'seen' },
          { text: `[Deception] Stay on the road. You're pilgrims bound for the Dawnspire, nothing more.`, check: { skill: 'deception', dc: 14, advIf: 'bg:acolyte || comp:seris' }, tone: 'deceptive', tags: ['deception'], success: 'fooled', failure: 'seen' },
          { text: `Stand your ground and let them come.`, tone: 'aggressive', tags: ['boldness'], next: 'seen' },
        ],
      },
      hid: { speaker: 'dm', text: `You are flat in the bracken before the lead rider's head comes round. The lodestone hesitates, trembling, pointing at the trees, at you — and then a hare bolts across the road and every horse shies, and the riders curse and spur on. You lie still until the hoofbeats are gone.`, effects: ['xp 50'], options: [{ text: `Back to the road.`, tone: 'leave', end: true }] },
      fooled: { speaker: 'a1v_rider', text: `The lead rider, a hard-faced woman with a scar through one eyebrow, looks you over. Her lodestone is swinging wildly. "Pilgrims," she says flatly. Then she taps the lodestone, frowns, and shakes it like a broken watch. "Cheap Ashenford copies. Sings at a sneeze." She waves you past. "The Dawnspire's that way. Pray for better instruments."`, effects: ['xp 50'], options: [{ text: `Walk on, unhurried.`, tone: 'leave', end: true }] },
      seen: {
        speaker: 'a1v_rider',
        text: `The lodestone stops turning. It points straight at your pack and begins to sing. The lead rider, a hard-faced woman with a scar through one eyebrow, draws her staff. "Bearer," she says. "By order of the Archon, you're to come with us. Alive, if it's all the same to you."`,
        options: [
          { text: `"It isn't." Fight them in the trees, where horses are no use.`, tone: 'aggressive', tags: ['violence'], effects: ['goto woods 22 19', 'combat a1v_enc_riders'] },
          { text: `[Intimidation] "Five of you. Are you sure that's enough?"`, check: { skill: 'intimidation', dc: 16 }, tone: 'aggressive', tags: ['boldness'], success: 'backed', failure: 'fight' },
        ],
      },
      backed: { speaker: 'a1v_rider', text: `She looks at you, and at your companions, and at whatever is in your face. Then she lowers her staff a precise two inches. "No," she admits. "I'll report the sighting. That's what I'm paid for." She turns her horse. "They'll send more next time."`, effects: ['xp 75'], options: [{ text: `Let them go.`, tone: 'leave', end: true }] },
      fight: { speaker: 'a1v_rider', text: `"Yes," she says. "Quite sure." The riders spread out to flank you, and you fall back into the trees where their horses can't follow.`, effects: ['goto woods 22 19', 'combat a1v_enc_riders'], end: true },
    },
  },
  {
    id: 'a1v_tr_ysolt', title: 'A Seeker on the Road',
    start: [{ if: 'ysolt_outcome=persuaded', node: 'p' }, { node: 'e' }],
    nodes: {
      p: {
        speaker: 'ysolt',
        text: `At a ford, a lone figure in a grey coat is watering a grey horse. She doesn't look round. "Don't stop," says Ysolt Ravencourt. "Don't wave. Water your horses, if you have any, and look at the river while I talk."

She checks a silver instrument, frowns at it, and puts it away. "The Archon has taken a personal interest in you. That is not a figure of speech. He reads every report with your name in it twice." A pause. "And he has a correspondent in your Hollowmere. Forty-one letters in eight years. He answered one of them, the morning after the bell. I saw the copy." She swings up into the saddle. "I don't know who. I only know he never answers anyone unless he has a use for them. I wasn't here."`,
        options: [
          { text: `"Thank you, Ysolt."`, tone: 'friendly', effects: ['set a1v_letters_hint', 'clue a1_main ysolt_letters', 'rep conclave 2'], next: 'p_end' },
          { text: `"Why are you helping us?"`, tone: 'curious', effects: ['set a1v_letters_hint', 'clue a1_main ysolt_letters'], next: 'p_why' },
        ],
      },
      p_why: { speaker: 'ysolt', text: `"I'm not." She gathers the reins. "I'm keeping a ledger, the way the High Seeker does. Mine has a different column in it." She rides off without looking back.`, next: 'p_end' },
      p_end: { speaker: 'dm', text: `By the time you look up from the river, she is gone.`, options: [{ text: `Walk on.`, tone: 'leave', end: true }] },
      e: {
        speaker: 'ysolt',
        text: `You make camp at dusk in a ring of old stones, and find a grey-coated woman already sitting at your fire, warming her hands. Ysolt Ravencourt doesn't get up. "Relax," she says. "I'm off duty. It's in the regulations. Even Seekers sleep."

She looks at you over the flames. "I could have taken you twice since Hollowmere. Once at the ford, once in the Woods. Both times you did something clever and I wanted to see what you'd do next." She sounds annoyed about it. "That is a professional failing. I am going to correct it." She stands, brushing off her coat. "Next time we meet, I'll be working. I'd rather you knew."`,
        options: [
          { text: `"Then why tell us?"`, tone: 'curious', next: 'e_why' },
          { text: `"We'll be ready."`, tone: 'aggressive', tags: ['boldness'], next: 'e_end' },
          { text: `Offer her some of the stew.`, tone: 'friendly', tags: ['humor', 'mercy'], effects: ['rep conclave 2'], next: 'e_stew' },
        ],
      },
      e_why: { speaker: 'ysolt', text: `"Because I don't like ambushes." She pauses at the edge of the firelight. "Isn't that ridiculous, in my line of work?" And she is gone into the dark.`, effects: ['set a1v_ysolt_respect'], next: 'e_end' },
      e_stew: { speaker: 'ysolt', text: `She looks at the bowl for a long moment as if it might be a trap. Then she takes it, eats every bite in silence, hands it back, and says, "Terrible. Thank you." And she is gone into the dark.`, effects: ['set a1v_ysolt_respect'], next: 'e_end' },
      e_end: { speaker: 'dm', text: `The fire crackles. Somewhere out in the dark, a horse whickers, and then there is nothing but the night.`, options: [{ text: `Keep watch.`, tone: 'leave', end: true }] },
    },
  },
  {
    id: 'a1v_tr_procession', title: 'The Procession',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `At dusk, at a bend in the road, you come upon a procession crossing it: thirty or forty people walking single file out of the trees on one side and into the trees on the other, each carrying a lantern. They wear the clothes of a dozen different centuries. They make no sound at all. You can see the trees through them.

Not one of them looks at you. They are all looking the same way: east and north, toward the deep Woods.`,
        interjections: [
          { who: 'ilyra', text: `Ilyra takes a step toward them before she can stop herself. "Tamsin?" she says, to a tall man near the back. He doesn't turn. It isn't him. She stands very still for a long time after that.`, effects: ['memory ilyra 0 On the road we saw a procession of the forgotten, and none of them was Tamsin.'] },
          { who: 'korr', text: `Korr bows his head as they pass, the way the Ashkin do for a war-band of the dead. "They walk to something," he says. "The dead don't walk unless something calls."` },
        ],
        options: [
          { text: `Stand aside and let them pass.`, tone: 'compassionate', tags: ['tradition', 'mercy'], next: 'pass' },
          { text: `[Resonance] Listen to where they're going. (Spend 1 Resonance)`, if: 'res>=1', lockedText: 'Requires 1 Resonance.', tone: 'resonance', tags: ['curiosity'], effects: ['res -1'], next: 'listen' },
          { text: `Light a lantern of your own and walk with them a little way.`, if: 'item:lantern_oil_flask', tone: 'friendly', tags: ['tradition', 'faith'], effects: ['take lantern_oil_flask', 'xp 50', 'heal all'], next: 'walk' },
        ],
      },
      pass: { speaker: 'dm', text: `They pass. The last of them, a small boy with a lantern almost as big as he is, glances at you at the very end — just once — and smiles. Then the road is empty, and the dusk is ordinary dusk again.`, options: [{ text: `Walk on.`, tone: 'leave', end: true }] },
      listen: {
        speaker: 'dm',
        text: `You close your eyes and listen with the Heart, and under the silence of the procession there is a sound like a long, low note held by a choir: the hum of Valdros. They are walking toward the Anchor. All of them. Drawn to the thin place the way moths are drawn to a lamp — and beyond it, very faintly, you hear water, and something singing a lamp-song.`,
        effects: ['set a1v_heard_evening_sea', 'xp 25'],
        options: [{ text: `Walk on.`, tone: 'leave', end: true }],
      },
      walk: { speaker: 'dm', text: `You light your lantern and fall in at the end of the line. For half a mile you walk with the forgotten, in silence, through the dusk. You never feel more at peace in your life. At the edge of the trees, the procession goes on without you, and you find that you are warm, and rested, and not quite sure why you are crying.`, options: [{ text: `Walk on.`, tone: 'leave', end: true }] },
    },
  },
];

// ─────────────────────────────────────────────────────────────── module

export const VALDROS: ContentModule = {
  quests: [QUEST],
  dialogues: DIALOGUES,

  npcs: [
    { id: 'a1v_severin', name: 'Archon Severin Cael', title: 'Archon of the Aether Conclave (a projection)', hue: 250, glyph: 'S', desc: 'Lean, silver-templed, quietly spoken. He rarely blinks, and he has never once lied to you.' },
    { id: 'a1v_vex', name: 'High Seeker Dorran Vex', title: 'Enforcer of the Aether Conclave', hue: 270, glyph: 'V', desc: 'A big, calm man in grey plate under grey robes, with the face of someone reading a ledger in which you are one line.' },
    { id: 'a1v_ossaryx', name: 'Ossaryx', title: 'The Gloaming Wyrm', hue: 230, glyph: 'O', desc: 'The last sovereign of a twilight world, wound in a hoard of lanterns. Terrible, articulate, grieving.' },
    { id: 'a1v_scout', name: 'A Young Warden', title: 'Conclave watcher', hue: 260, glyph: 'w', desc: 'Nineteen, terrified, holding a lodestone he does not understand.' },
    { id: 'a1v_archivist', name: 'An Ithari Archivist', title: 'Senate archivist of a burning Valdros', hue: 200, glyph: 'a', desc: 'Old, singed, stubborn. Saving the minutes of eleven hundred years from a fire two thousand years ago.' },
    { id: 'a1v_lamplighter', name: 'The Lamplighter', title: 'Of the Valdros that never fell', hue: 45, glyph: 'l', desc: 'A lamplighter in a leather apron, who leaves oil and bread out for the ghosts of the ruin-city.' },
    { id: 'a1v_refugee', name: 'Widow Annet Corran', title: 'Of Brindle Ford, which is a lake now', hue: 35, glyph: 'r', desc: 'Grey-haired, red-handed, done with being afraid.' },
    { id: 'a1v_lanternbearer', name: 'A Woman with a Lantern', title: 'Who remembers you', hue: 55, glyph: 'w', desc: 'She knows your face. She has kept a lantern lit for you every night.' },
    { id: 'a1v_rider', name: 'Warden-Captain Ressa Hollin', title: 'Conclave outrider', hue: 260, glyph: 'R', desc: 'Hard-faced, scarred through one eyebrow, with a lodestone swinging from her saddle-horn.' },
  ],

  items: [
    { id: 'a1v_severin_letter', name: 'A Letter from the Archon', type: 'quest', rarity: 'uncommon', weight: 0, value: 0, quest: true, desc: 'Heavy Conclave paper, seal broken. "The Heart of Aether can restore what was erased. With it, I can return your daughter to you. Bring its bearer to the Anchor at Valdros. I will not pretend that is my only reason for wanting it. — S. Cael"' },
    { id: 'a1v_maren_lists', name: 'Maren\'s Lists of the Erased', type: 'quest', rarity: 'rare', weight: 1, value: 0, quest: true, desc: 'Eight years of names scraped out of registers, gaps in censuses and beds that became linen-presses, tied with lantern-string. Someone going where the answers are should have them.' },
    { id: 'a1v_wyrm_lantern', name: 'A Lantern from the Evening Sea', type: 'quest', rarity: 'rare', weight: 1, value: 0, quest: true, desc: 'Dusk-coloured glass in a cage of dark metal waves, lit by a steady blue flame that is not fire. A tiny relief shows a serpent breathing light onto a lantern.' },
    { id: 'a1v_ysmerond_lantern', name: 'Lamp of Ysmerond', type: 'amulet', rarity: 'rare', weight: 0, value: 400, desc: 'A small lantern of dusk-blue glass on a chain, given by Ossaryx as it went home. It never goes out. +1 to saving throws; resistance to necrotic damage.', bonus: { saves: 1, resist: ['necrotic'] } },
    { id: 'a1v_gloaming_scale', name: 'Gloaming Scale Mantle', type: 'cloak', rarity: 'rare', weight: 2, value: 400, desc: 'A cloak sewn from a single scale of Ossaryx, the colour of the sky an hour after sunset. It is always cool to the touch. +1 AC; resistance to necrotic damage.', bonus: { ac: 1, resist: ['necrotic'] } },
  ],

  enemies: [
    {
      id: 'a1v_high_seeker', name: 'High Seeker Dorran Vex', type: 'humanoid', level: 5, abilities: { str: 14, dex: 12, con: 15, int: 18, wis: 15, cha: 13 }, ac: 16, hp: '9d8+18', speed: 6,
      actions: ['m_arcane_bolt', 'm_binding_sigil'], multiattack: 2, xp: 700, ai: 'caster', resources: { sigil: 2 }, traits: ['shield_reaction'], glyph: 'V', color: '#7d6bff', boss: true,
      gold: '4d10', loot: [['aether_draught', 0.5, 1]],
      desc: 'The Conclave\'s enforcer: grey plate under grey robes, a lodestone in each fist. Loyal to results. Binds with glowing sigils and hammers with disciplined force.',
    },
  ],

  objects: [
    // ── Hollowmere, the morning after
    { map: 'hollowmere', object: { id: 'a1v_morning_trigger', kind: 'trigger', name: 'The Square at Dawn', x: 25, y: 10, radius: 5, if: 'prologue_complete && !quest:a1_main && !questdone:a1_main', dialogue: 'a1v_morning' } },
    { map: 'hollowmere', object: { id: 'a1v_mayor', kind: 'npc', name: 'Mayor Edda Brannock', x: 24, y: 13, if: 'prologue_complete', dialogue: 'a1v_council', glyph: 'E', blocks: true } },
    { map: 'hollowmere', object: { id: 'a1v_hale', kind: 'npc', name: 'Captain Roderic Hale', x: 28, y: 16, if: 'prologue_complete', dialogue: 'a1v_hale', glyph: 'H', blocks: true } },
    { map: 'hollowmere', object: { id: 'a1v_maren_hm', kind: 'npc', name: 'Sister Maren Ash', x: 21, y: 16, if: 'prologue_complete && !a1v_aftermath_done', dialogue: 'a1v_maren_request', glyph: 'M', blocks: true } },
    { map: 'hollowmere', object: { id: 'a1v_seris', kind: 'npc', name: 'A Knight of the Last Dawn', x: 29, y: 14, if: 'prologue_complete && !recruited:seris', dialogue: 'a1v_seris_hm', glyph: 'S', color: '#f2e2a0', blocks: true } },
    // ── Valdros
    { map: 'valdros', object: { id: 'a1v_arrival', kind: 'trigger', name: 'The Gate of Valdros', x: 23, y: 35, radius: 3, if: 'prologue_complete && !a1v_arrived', dialogue: 'a1v_valdros_arrival' } },
    { map: 'valdros', object: { id: 'a1v_vaelis', kind: 'npc', name: 'An Elf among the Star-Charts', x: 12, y: 10, if: '!recruited:vaelis && valdros_reality!=inhabited', dialogue: 'a1v_vaelis', glyph: 'V', color: '#9fd6a8', blocks: true } },
    { map: 'valdros', object: { id: 'a1v_instruments', kind: 'inspect', name: 'Grey Survey Tripods', x: 11, y: 9, if: 'valdros_reality!=inhabited', dialogue: 'a1v_instruments', blocks: true } },
    { map: 'valdros', object: { id: 'a1v_scout', kind: 'npc', name: 'A Watcher in a Grey Coat', x: 27, y: 9, if: 'a1v_arrived && !a1v_scout_done && !valdros_ambush_started', hidden: { dc: 13, skill: 'perception' }, dialogue: 'a1v_scout', glyph: 'w', color: '#8f7cff', blocks: true } },
    { map: 'valdros', object: { id: 'a1v_flicker_w', kind: 'resonance', name: 'A Flicker of Fire', x: 6, y: 20, dialogue: 'a1v_flicker_west', glyph: '≈', color: '#ff9a4a' } },
    { map: 'valdros', object: { id: 'a1v_flicker_e', kind: 'resonance', name: 'A Flicker of Water', x: 41, y: 20, dialogue: 'a1v_flicker_east', glyph: '≈', color: '#6fc3d9' } },
    { map: 'valdros', object: { id: 'a1v_flicker_s', kind: 'resonance', name: 'A Flicker of Voices', x: 24, y: 33, dialogue: 'a1v_flicker_south', glyph: '≈', color: '#f2e2a0' } },
    { map: 'valdros', object: { id: 'a1v_archivist', kind: 'npc', name: 'An Archivist in the Fire', x: 20, y: 13, if: 'valdros_reality=burning', dialogue: 'a1v_archivist', glyph: 'a', color: '#ffb36b', blocks: true } },
    { map: 'valdros', object: { id: 'a1v_drift_lantern', kind: 'inspect', name: 'A Lantern Adrift', x: 21, y: 15, if: 'valdros_reality=flooded && !a1v_lantern_taken', dialogue: 'a1v_drift_lantern', glyph: '*', color: '#7fa8ff' } },
    { map: 'valdros', object: { id: 'a1v_lamplighter', kind: 'npc', name: 'A Lamplighter', x: 21, y: 17, if: 'valdros_reality=inhabited', dialogue: 'a1v_lamplighter', glyph: 'l', color: '#f2d27a', blocks: true } },
    // ── The Senate Dome
    { map: 'valdros_dome', object: { id: 'a1v_dome_trig_s', kind: 'trigger', name: 'Into the Dome', x: 16, y: 24, radius: 2, if: '!a1v_dome_entered', dialogue: 'a1v_dome_enter' } },
    { map: 'valdros_dome', object: { id: 'a1v_dome_trig_e', kind: 'trigger', name: 'Into the Dome', x: 28, y: 12, radius: 2, if: '!a1v_dome_entered', dialogue: 'a1v_dome_enter' } },
    { map: 'valdros_dome', object: { id: 'a1v_dome_trig_w', kind: 'trigger', name: 'Into the Dome', x: 4, y: 12, radius: 2, if: '!a1v_dome_entered', dialogue: 'a1v_dome_enter' } },
    { map: 'valdros_dome', object: { id: 'a1v_dome_maren', kind: 'npc', name: 'Sister Maren Ash', x: 16, y: 15, if: 'a1v_arrived && !a1_maren_fate', dialogue: 'a1v_maren_dome', glyph: 'M', blocks: true } },
    { map: 'valdros_dome', object: { id: 'a1v_dome_wyrm', kind: 'npc', name: 'Ossaryx, the Gloaming Wyrm', x: 16, y: 7, if: 'quest:a1_main=wyrm && !ossaryx_resolved', dialogue: 'a1v_ossaryx', glyph: 'O', color: '#3e4a7a', blocks: true } },
    { map: 'valdros_dome', object: { id: 'a1v_anchor', kind: 'inspect', name: 'The Valdros Anchor', x: 16, y: 12, dialogue: 'a1v_anchor', blocks: true } },
  ],

  encounters: [
    {
      id: 'a1_enc_echoes_valdros', name: 'Echoes of Valdros', map: 'valdros', relative: true, canFlee: true, stealthDc: 12,
      enemies: [{ t: 'hollow_echo', x: 4, y: -1 }, { t: 'hollow_echo', x: -4, y: 1 }, { t: 'fog_hound', x: 3, y: 1 }],
      intro: 'Two grey senators in the robes of a Valdros that never was turn from an argument two thousand years old and notice you. Their mouths keep arguing. A fog-hound pads out from between them, lantern-eyed, wrong.',
      onVictory: ['xp 50', 'give echo_shard 1'],
    },
    {
      id: 'a1v_enc_riders', name: 'Conclave Riders', map: 'woods', relative: true, canFlee: true,
      enemies: [{ t: 'conclave_warden', x: 3, y: -1 }, { t: 'conclave_warden', x: -3, y: 1 }, { t: 'conclave_arcanist', x: 5, y: 1 }],
      intro: 'The riders leave their horses at the treeline and come in after you on foot: two wardens with iron-shod staves and a field arcanist, fire already curling in his palm.',
      onVictory: ['xp 100', 'set a1v_riders_beaten', 'rep conclave -3', 'log The Conclave riders lie groaning in the bracken. Their horses have already gone home without them. Somewhere, someone will be writing a report.'],
    },
    {
      id: 'a1v_enc_ambush_ysolt', name: 'The Conclave Ambush', map: 'valdros_dome', canFlee: false, music: 'boss',
      enemies: [
        { t: 'seeker_ysolt', x: 16, y: 4 }, { t: 'conclave_warden', x: 12, y: 6 }, { t: 'conclave_warden', x: 20, y: 6 },
        { t: 'conclave_warden', x: 23, y: 4 }, { t: 'conclave_arcanist', x: 16, y: 3 },
      ],
      intro: 'Grey shapes pour down the tiers of the Senate Dome. Lodestones scream. Seeker Ysolt Ravencourt raises a gloved hand, and silver light kindles in it.',
      onVictory: ['set a1v_ambush_done', 'set a1v_ambush_won', 'xp 200', 'dialogue a1v_maren_dome'],
    },
    {
      id: 'a1v_enc_ambush_vex', name: 'The Conclave Ambush', map: 'valdros_dome', canFlee: false, music: 'boss',
      enemies: [
        { t: 'a1v_high_seeker', x: 16, y: 4 }, { t: 'conclave_warden', x: 12, y: 6 }, { t: 'conclave_warden', x: 20, y: 6 },
        { t: 'conclave_warden', x: 23, y: 4 }, { t: 'conclave_arcanist', x: 16, y: 3 },
      ],
      intro: 'Grey shapes pour down the tiers of the Senate Dome. Lodestones scream. High Seeker Dorran Vex opens his fists, and the silver stones in them begin to sing.',
      onVictory: ['set a1v_ambush_done', 'set a1v_ambush_won', 'xp 200', 'dialogue a1v_maren_dome'],
    },
    {
      id: 'a1v_enc_turned_ysolt', name: 'The Ambush Turned', map: 'valdros_dome', canFlee: false, music: 'boss', surpriseIf: 'a1v_ambush_turned',
      enemies: [{ t: 'seeker_ysolt', x: 16, y: 4 }, { t: 'conclave_warden', x: 12, y: 6 }, { t: 'conclave_warden', x: 20, y: 6 }, { t: 'conclave_arcanist', x: 16, y: 3 }],
      intro: 'You move first. The wardens are still scrambling up from the benches, the arcanist still fumbling his gloves off, and Ysolt Ravencourt has time to say only, "Oh, well done —" before you are among them.',
      onVictory: ['set a1v_ambush_done', 'set a1v_ambush_won', 'xp 250', 'dialogue a1v_maren_dome'],
    },
    {
      id: 'a1v_enc_turned_vex', name: 'The Ambush Turned', map: 'valdros_dome', canFlee: false, music: 'boss', surpriseIf: 'a1v_ambush_turned',
      enemies: [{ t: 'a1v_high_seeker', x: 16, y: 4 }, { t: 'conclave_warden', x: 12, y: 6 }, { t: 'conclave_warden', x: 20, y: 6 }, { t: 'conclave_arcanist', x: 16, y: 3 }],
      intro: 'You move first. The wardens are still scrambling up from the benches, the arcanist still fumbling his gloves off, and High Seeker Vex has time only to frown, as at an unexpected figure, before you are among them.',
      onVictory: ['set a1v_ambush_done', 'set a1v_ambush_won', 'xp 250', 'dialogue a1v_maren_dome'],
    },
    {
      id: 'a1_enc_ossaryx', name: 'Ossaryx, the Gloaming Wyrm', map: 'valdros_dome', canFlee: false, music: 'boss',
      enemies: [{ t: 'ossaryx', x: 16, y: 7 }],
      intro: 'Ossaryx rears until its horns scrape the Dome. Lanterns swing in its coils like a sky of small stars, and dusk pours from its jaws, cold and lightless. It is vulnerable to radiant light — and it hates the light more than anything.',
      onVictory: ['set ossaryx_resolved', 'set ossaryx_fate slain', 'quest a1_main severin', 'give a1v_gloaming_scale', 'xp 500', 'dialogue a1v_ossaryx_slain'],
    },
  ],

  travel: [
    { id: 'a1v_refugees', if: 'chapter:act1 && prologue_complete && !valdros_done', weight: 3, once: true, dialogue: 'a1v_tr_refugees' },
    { id: 'a1v_lanternbearer', if: 'chapter:act1 && heart_touched', weight: 2, once: true, dialogue: 'a1v_tr_lanternbearer' },
    { id: 'a1v_riders', if: 'chapter:act1 && quest:a1_main && !valdros_done', weight: 2, once: true, dialogue: 'a1v_tr_riders' },
    { id: 'a1v_ysolt_road', if: 'chapter:act1 && (ysolt_outcome=persuaded || ysolt_outcome=escaped) && !valdros_ambush_started', weight: 2, once: true, dialogue: 'a1v_tr_ysolt' },
    { id: 'a1v_procession', if: 'chapter:act1 && !valdros_done', weight: 1, once: true, dialogue: 'a1v_tr_procession' },
  ],

  enter: {
    valdros: [
      { if: 'valdros_reality=burning', text: 'Valdros is burning. It has been burning for two thousand years, every night, this night: libraries pouring sparks, colonnades crashing, people running through you without seeing you. The smoke smells of paper.' },
      { if: 'valdros_reality=flooded', text: 'Valdros lies under the river. You wade green, silent canals between drowned spires under a sky that has no sun in it — only, here and there across the water, the faint gold of drifting lanterns.' },
      { if: 'valdros_reality=inhabited', text: 'Valdros is alive: silks and chestnut-sellers and a session bell ringing from the Dome. People step around you the way you would step around a cold patch of air. To them, you are the ruin\'s ghosts.' },
      { if: 'valdros_done', text: 'Valdros flickers between its lost lives, quieter now. The Dome sits at the end of the great avenue like a closed eye. Somewhere far off, if you listen, water moves under a sky with no sun.' },
      { text: 'White spires strangled by roots. Cracked mosaics of a city that ruled half the world. And under it all a hum, like a held note — as you watch, a broken wall is whole for a heartbeat, then broken again. Valdros is not quite sure which Valdros it is.' },
    ],
    valdros_dome: [
      { if: 'valdros_done', text: 'The Senate Dome is silent. The Anchor glows, dim and steady, over the scattered benches. Dust settles where a world came through.' },
      { text: 'Tier upon tier of stone benches descend toward a dais where the Anchor stands: a column of black glass veined with failing light. Ten thousand senators once argued here about the shape of the world. Now there is only the hum — and, beneath it, something very large breathing on the other side of reality.' },
    ],
  },
};

