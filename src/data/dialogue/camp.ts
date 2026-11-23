import type { DialogueTree } from '../schema';

/**
 * Private camp conversations (the party's rented room at the Lantern & Lamb).
 * Every conditional DText list is written as mutually exclusive, exhaustive variants,
 * so exactly one paragraph applies whatever the engine's selection rule is.
 * Secrets are only foreshadowed here; trust-gated talks reveal personal history, not the big secret.
 */
export const CAMP_DIALOGUES: DialogueTree[] = [
  // ════════════════════════════════════════════════════════════ VAELIS
  {
    id: 'camp_vaelis',
    title: 'Vaelis, by candlelight',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: '!bell_rang', text: "Vaelis is sitting cross-legged on the bed with three books open around him and a fourth balanced on his knee. He doesn't look up when you come in, but he moves one book, which from him is practically a bow." },
          { if: 'bell_rang && !prologue_complete', text: "Vaelis is at the window with his little brass gauge in one hand, watching its needle shiver. The fog presses against the glass like something trying to read over his shoulder." },
          { if: 'prologue_complete', text: "Vaelis has stopped reading. The book is open in his lap, but his eyes are on you, and they have the look of someone working a problem he cannot quite solve." },
        ],
        next: 'hub',
      },
      hub: {
        speaker: 'comp:vaelis',
        text: [
          { if: '!bell_rang', text: "“If you're here to tell me the festival is ‘fun,’ I've been informed. Otherwise, ask. You have the look of someone with questions, and I have the look of someone with answers.”" },
          { if: 'bell_rang && !prologue_complete', text: "“We have perhaps an hour before something else impossible happens. Use it well.”" },
          { if: 'prologue_complete', text: "“Ask, then. I seem to have become interested in your opinion. It's very inconvenient.”" },
        ],
        options: [
          { text: "Who are you, really?", tone: 'curious', once: true, effects: ['set talk_vaelis_intro'], next: 'intro' },
          { text: "That bell. What do you make of it?", if: 'bell_rang', tone: 'curious', once: true, effects: ['set talk_vaelis_bell'], next: 'bell' },
          { text: "What did you think of the cathedral?", if: 'visited:cathedral', tone: 'curious', once: true, effects: ['set talk_vaelis_cathedral'], next: 'cathedral' },
          { text: "We made it out of the vault. How are you holding up?", if: 'prologue_complete', tone: 'compassionate', once: true, effects: ['set talk_vaelis_ending'], next: 'ending' },
          { text: "That brass instrument you keep checking. What is it?", if: 'bell_rang', tone: 'curious', once: true, effects: ['set talk_vaelis_hook'], next: 'hook' },
          { text: "Tell me why you really left the Conclave.", if: 'trust:vaelis>=15', lockedText: "He'd only deflect. He needs to trust you more first.", tone: 'curious', once: true, next: 'deep' },
          { text: "Stay up with me a while. No books.", if: 'affection:vaelis>=25 && talk_vaelis_deep', tone: 'friendly', once: true, next: 'romance' },
          { text: "Get some sleep, Vaelis.", tone: 'leave', end: true },
        ],
      },
      intro: {
        speaker: 'comp:vaelis',
        text: "“Vaelis Thorne. Two hundred and twelve years old, formerly of the Aether Conclave, currently the cleverest person in Hollowmere by a margin I find embarrassing on the town's behalf. They expelled me for reading the wrong books. Which books, you'll ask. All the interesting ones.” He turns a page. “I came because my instruments said the Veil was trembling here. Everyone else came for the cider.”",
        options: [
          { text: "Expelled? That sounds like a story.", tone: 'curious', tags: ['curiosity'], effects: ['rel vaelis trust 2'], next: 'intro_story' },
          { text: "Is the cleverest-person thing a joke, or do you actually believe it?", tone: 'sarcastic', tags: ['humor'], effects: ['rel vaelis respect 2'], next: 'intro_joke' },
          { text: "A fellow wizard. Which school did they train you in?", if: 'class:wizard', tone: 'class', tags: ['knowledge'], effects: ['rel vaelis respect 3'], next: 'intro_wizard' },
          { text: "(Insight) Watch his face when he says “expelled.”", tone: 'curious', check: { skill: 'insight', dc: 13, who: 'player' }, success: 'intro_insight_s', failure: 'intro_insight_f' },
          { text: "Fair enough.", tone: 'friendly', next: 'hub' },
        ],
      },
      intro_story: {
        speaker: 'comp:vaelis',
        text: "“Not a story. A footnote. Bureaucrats with excellent penmanship decided certain texts were dangerous. I decided they were wrong. One of us had the authority to make it stick.” He shrugs, slightly too casually. “I don't miss it. The coffee was abominable.”",
        next: 'hub',
      },
      intro_joke: {
        speaker: 'comp:vaelis',
        text: "Vaelis looks up at last, and something in his face sharpens with interest. “Oh, I believe it. But I'm delighted you asked. Most people simply resent me in silence.” A faint smile. “You may stay.”",
        next: 'hub',
      },
      intro_wizard: {
        speaker: 'comp:vaelis',
        text: "“Evocation, officially. Unofficially, everything they'd let me near and several things they wouldn't.” He eyes your spellbook with naked greed. “Show me yours sometime. I promise to be only moderately insufferable about your margins.”",
        next: 'hub',
      },
      intro_insight_s: {
        speaker: 'dm',
        text: "When he says “expelled,” his thumb drifts to the cover of his oldest notebook and presses down, as if holding it shut. Whatever happened at the Conclave, he didn't leave it behind. He carries it. He catches you looking and shifts the notebook out of sight. “Staring is unbecoming, {player}.”",
        effects: ['set vaelis_notebook_noticed'],
        next: 'hub',
      },
      intro_insight_f: {
        speaker: 'dm',
        text: "His face gives you nothing but mild, well-practised boredom. Two centuries is a long time to perfect a mask.",
        next: 'hub',
      },
      bell: {
        speaker: 'comp:vaelis',
        text: "“Orlen's Voice. Rung by nobody, from a tower that doesn't exist, eighty years after it fell.” He ticks the points off on long fingers. “Either a very elaborate prank, or a hole in the world shaped exactly like a bell. I know which I'd wager on.”",
        next: 'bell2',
      },
      bell2: {
        speaker: 'comp:vaelis',
        text: [
          { if: 'rescued_count>=2', text: "“And you went into that fog for strangers. More than once. I'd call it reckless if it hadn't worked.” A pause, as if the next words are expensive. “It was well done.”" },
          { if: 'rescued_count<2', text: "“People are missing out there. I keep running the numbers on how many.” He sets the gauge down. “I'd like to stop running them. I find I can't.”" },
        ],
        next: 'hub',
      },
      cathedral: {
        speaker: 'comp:vaelis',
        text: "“Seven niches. Six saints. One conspicuously empty pedestal that the faithful have apparently agreed not to notice for a few thousand years.” He smiles thinly. “Religion is the art of collectively not looking at something. I find the empty one more honest than the rest.”",
        options: [
          { text: "Maybe it's left empty out of respect.", tone: 'diplomatic', tags: ['faith'], effects: ['rel vaelis agreement -2'], next: 'cath_faith' },
          { text: "I'm sworn to the Lights. Mind your tongue.", if: 'class:cleric || class:paladin', tone: 'class', tags: ['faith'], effects: ['rel vaelis respect 2'], next: 'cath_faith' },
          { text: "Someone wanted it forgotten. I want to know who.", tone: 'curious', tags: ['curiosity', 'forbidden'], effects: ['rel vaelis agreement 3'], next: 'cath_agree' },
        ],
      },
      cath_faith: {
        speaker: 'comp:vaelis',
        text: [
          { if: 'class:cleric || class:paladin', text: "“Noted. I'll mind it in your presence and say it twice as loudly behind your back. That's what passes for respect among intellectuals.” Then, unexpectedly quiet: “Do you ever wonder who it was? The seventh? You must have knelt in front of that empty space a thousand times.”" },
          { if: '!class:cleric && !class:paladin', text: "“Respect.” He tastes the word and finds it overcooked. “People don't leave a space empty for three thousand years out of respect. They do it because someone told them to, and then forgot they'd been told.”" },
        ],
        next: 'hub',
      },
      cath_agree: {
        speaker: 'comp:vaelis',
        text: "Vaelis points at you with his quill, delighted. “Yes. Exactly that. Erasure is never an accident; it's an editorial decision.” He scribbles something. “If you find out before I do, I shall be furious. Tell me anyway.”",
        next: 'hub',
      },
      ending: {
        speaker: 'comp:vaelis',
        text: "“How am I holding up? I watched a man fused to a bell die, met a girl made of memory, and stood beside the most important object on the continent while you put your hand on it.” He closes his book. “I'm holding up magnificently. Ask me again in a decade.”",
        next: 'ending_lira',
      },
      ending_lira: {
        speaker: 'comp:vaelis',
        text: [
          { if: 'lira_fate=anchored', text: "“You anchored the girl. Lira. Pinned her back into the world at a cost to yourself.” He studies you like a difficult text. “Foolish. Remarkable. I'm still deciding which word to underline.”" },
          { if: 'lira_fate=faded', text: "“You let Lira fade. Gently, I'll grant you. I keep telling myself it was the reasonable choice.” His fingers drum the cover. “I've told myself that about a great many things.”" },
          { if: 'lira_fate=bottled', text: "“You held on to her. Lira. Not quite here, not quite gone, kept like a pressed flower between pages.” For once he isn't smiling. “I'd have done the same, and I would very much like someone to tell me that's a good thing.”" },
          { if: '!lira_fate', text: "“I keep thinking about the boy. Pell. Whatever we found down there, he was right all along, and nobody believed him. They rarely do, the ones who remember correctly.”" },
        ],
        next: 'ending_corvin',
      },
      ending_corvin: {
        speaker: 'comp:vaelis',
        text: [
          { if: 'corvin_fate=handed_over', text: "“Corvin in irons. Justice, or a convenient scapegoat? The watch won't know the difference. I'm not sure I do.”" },
          { if: 'corvin_fate=freed', text: "“You let Corvin go. Good. The world needs people who dig in the wrong places. It merely needs them to dig more carefully.”" },
          { if: 'corvin_fate=ally', text: "“And Corvin is with us now, more or less. An Unbound scholar with a shovel and no instinct for self-preservation. I like him enormously, and I shall never say so.”" },
          { if: 'corvin_fate=killed', text: "“Corvin is dead.” He says it flatly. “He was an idiot who asked brilliant questions. There are fewer of those than you'd think.”" },
          { if: '!corvin_fate', text: "“And the Unbound scholar is out there somewhere with his trowel. I suspect we haven't seen the last of him.”" },
        ],
        next: 'ending_ysolt',
      },
      ending_ysolt: {
        speaker: 'comp:vaelis',
        text: [
          { if: 'ysolt_outcome=fought', text: "“And you bloodied a Conclave Seeker. They'll remember that; they keep excellent records.” His voice is light. His hands are not entirely steady." },
          { if: 'ysolt_outcome=persuaded', text: "“And you talked a Seeker of the Conclave out of her prize. I've watched archmages fail at that. Do try not to let it go to your head. Leave that to me.”" },
          { if: 'ysolt_outcome=escaped', text: "“And then we ran from the Seeker. Sensible. Running is an underrated branch of magic.” He glances at the window. “She'll be back. They always come back.”" },
          { if: '!ysolt_outcome', text: "“Someone from the Conclave will come for that Heart. For you. I'd like you to be ready when they do. I'd like to be ready.”" },
        ],
        options: [
          { text: "(Insight) What aren't you telling me about the Conclave?", tone: 'curious', check: { skill: 'insight', dc: 15, who: 'player', advIf: 'vaelis_notebook_noticed' }, success: 'ending_insight_s', failure: 'ending_insight_f' },
          { text: "Get some rest. We both need it.", tone: 'compassionate', effects: ['rel vaelis affection 1'], next: 'hub' },
        ],
      },
      ending_insight_s: {
        speaker: 'comp:vaelis',
        text: "Vaelis is quiet a beat too long. “The Seeker's instruments,” he says at last. “The way the needle swung toward you. I have seen that design before. Closer than I would like.” He opens his book again, firmly. “That is all you get tonight, {player}. Don't make me regret the first part.”",
        effects: ['set vaelis_instruments_hint', 'rel vaelis trust 2'],
        next: 'hub',
      },
      ending_insight_f: {
        speaker: 'comp:vaelis',
        text: "“I'm telling you everything relevant,” Vaelis says smoothly, which is exactly what a man would say if he weren't.",
        next: 'hub',
      },
      hook: {
        speaker: 'comp:vaelis',
        text: "He holds it up: a palm-sized disc of brass and crystal, a needle trembling at its heart. “A resonance gauge. It measures how taut the Veil is, for want of a better word. I built it myself.” Something flickers across his face. “The Conclave carries more elegant ones now, I'm told. Proper field instruments. I'd rather not see one up close. Professional jealousy.”",
        options: [
          { text: "Professional jealousy. Sure.", tone: 'sarcastic', tags: ['humor'], effects: ['rel vaelis respect 1'], next: 'hook_tease' },
          { text: "Could someone track us with a thing like that?", tone: 'pragmatic', tags: ['caution'], next: 'hook_track' },
        ],
      },
      hook_tease: {
        speaker: 'comp:vaelis',
        text: "“Your scepticism is noted and filed under ‘irritatingly perceptive.’” He pockets the gauge. “Ask me again when I've had more wine. Or less. One of the two.”",
        next: 'hub',
      },
      hook_track: {
        speaker: 'comp:vaelis',
        text: "“Track the Veil? Yes. Track a person?” He hesitates, which he never does. “Only if that person became very, very interesting. So let's be dull, shall we? I'll find it a tremendous strain.”",
        next: 'hub',
      },
      deep: {
        speaker: 'comp:vaelis',
        text: "Vaelis is silent long enough that you think he won't answer. Then: “I worked on something there. A piece of theory. Beautiful work. The best I have ever done, or ever will. And then I saw what the people around me wanted to do with it.”",
        next: 'deep2',
      },
      deep2: {
        speaker: 'comp:vaelis',
        text: "“Let's say ‘expelled’ is the version of events that flatters me most.” His smile is thin and aimed inward. “I left. Quickly. At night, with one bag and four notebooks. And I have spent a very long time telling myself it was principle.” He doesn't look at you. “Go on. Draw your conclusions. Everyone does.”",
        options: [
          { text: "Leaving was right, whatever the reason. You got out.", tone: 'compassionate', effects: ['rel vaelis trust 5', 'rel vaelis affection 4', 'memory vaelis 2 You didn\'t judge me for how I left the Conclave.', 'set talk_vaelis_deep'], next: 'deep_kind' },
          { text: "If you're afraid of what they'll do with your work, help me stop them.", tone: 'pragmatic', tags: ['boldness'], effects: ['rel vaelis respect 4', 'rel vaelis trust 3', 'set talk_vaelis_deep'], next: 'deep_bold' },
          { text: "So the great Vaelis Thorne ran away. Good to know.", tone: 'sarcastic', effects: ['rel vaelis trust -6', 'rel vaelis affection -4', 'memory vaelis -2 You mocked me when I told you how I left.', 'set talk_vaelis_deep'], next: 'deep_cruel' },
        ],
      },
      deep_kind: {
        speaker: 'comp:vaelis',
        text: "He looks at you as though you've spoken a language he was once fluent in and forgot. “That is a remarkably generous reading of the text.” He clears his throat. “Thank you. Don't make me say that twice.”",
        next: 'hub',
      },
      deep_bold: {
        speaker: 'comp:vaelis',
        text: "“Stop them.” He tastes the words. “You do realise who you're proposing to annoy? No, of course you don't. That's what makes it so appealing.” A real smile, brief as a struck match. “Very well. Consider me conscripted.”",
        next: 'hub',
      },
      deep_cruel: {
        speaker: 'comp:vaelis',
        text: "Vaelis's face closes like a book. “Yes,” he says pleasantly. “Thank you. Somehow it had never occurred to me.” He turns back to his reading and doesn't turn a single page for the rest of the night.",
        end: true,
      },
      romance: {
        speaker: 'dm',
        text: "Vaelis marks his page, hesitates, and then, astonishingly, closes the book. The candle gutters between you. “I've spent two centuries being the most interesting thing in every room,” he says quietly. “It's disconcerting to find I'd rather listen.”",
        options: [
          { text: "Then listen. I'll talk until the candle's out.", tone: 'friendly', effects: ['rel vaelis affection 5', 'set romance_vaelis_hint'], next: 'romance_yes' },
          { text: "Don't go sentimental on me, Thorne.", tone: 'sarcastic', next: 'romance_no' },
        ],
      },
      romance_yes: {
        speaker: 'dm',
        text: "He laughs, low and surprised, and settles back against the headboard. You talk until the candle drowns in its own wax, and he doesn't open a single book.",
        end: true,
      },
      romance_no: {
        speaker: 'comp:vaelis',
        text: "“Heavens forbid,” he says, and you could swear he looks relieved and disappointed in precisely equal measure. He reopens the book. “Goodnight, {player}.”",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════════ BRAKKA
  {
    id: 'camp_brakka',
    title: 'Brakka, by the hearth',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: '!bell_rang', text: "Brakka has claimed the floor by the hearth. Her shield leans against the wall and her boots are off, which in a dwarf is a gesture of enormous trust. She's oiling her axe in slow, even strokes." },
          { if: 'bell_rang && !prologue_complete', text: "Brakka sits facing the door with her axe across her knees, still in her mail. She hasn't taken her eyes off the latch since you came in, except to look at you." },
          { if: 'prologue_complete', text: "Brakka is mending a strap on her shield by firelight. When she sees you, she shifts along the bench without a word, making room." },
        ],
        next: 'hub',
      },
      hub: {
        speaker: 'comp:brakka',
        text: [
          { if: '!bell_rang', text: "“Sit. Talk, if you've a mind to. I'm a decent listener for someone who's mostly beard.”" },
          { if: 'bell_rang && !prologue_complete', text: "“Speak. I'll keep one eye on the door, but the other's yours.”" },
          { if: 'prologue_complete', text: "“Go on, then. Fire's warm and I'm in no hurry.”" },
        ],
        options: [
          { text: "Who are you, really?", tone: 'curious', once: true, effects: ['set talk_brakka_intro'], next: 'intro' },
          { text: "About that brawl at the Lantern & Lamb...", if: 'brawl_resolved', tone: 'friendly', once: true, effects: ['set talk_brakka_brawl'], next: 'brawl' },
          { text: "The bell. The fog. What do you make of it?", if: 'bell_rang', tone: 'curious', once: true, effects: ['set talk_brakka_bell'], next: 'bell' },
          { text: "What did you make of the cathedral?", if: 'visited:cathedral', tone: 'curious', once: true, effects: ['set talk_brakka_cathedral'], next: 'cathedral' },
          { text: "It's over, for now. How are you?", if: 'prologue_complete', tone: 'compassionate', once: true, effects: ['set talk_brakka_ending'], next: 'ending' },
          { text: "You said you came here following rumours. What rumours?", tone: 'curious', once: true, effects: ['set talk_brakka_hook'], next: 'hook' },
          { text: "Tell me about the people of Ostrem.", if: 'trust:brakka>=15', lockedText: "She keeps that door shut. She needs to trust you more.", tone: 'compassionate', once: true, next: 'deep' },
          { text: "Rest well, Brakka.", tone: 'leave', end: true },
        ],
      },
      intro: {
        speaker: 'comp:brakka',
        text: "“Brakka Stonevein, Shieldwarden of Kharn Dovrek. Of Hall Ostrem, if you ask me, which nobody does these days.” She sets down the oil-rag. “You'll hear stories. That I'm mad. That I'm grieving a hall that fell before my grandmother's grandmother was born.”",
        options: [
          { text: "What happened to Ostrem?", tone: 'curious', tags: ['curiosity'], effects: ['rel brakka trust 2'], next: 'intro_ostrem' },
          { text: "You carry yourself like someone who's stood in a shield-wall.", if: 'bg:soldier', tone: 'background', effects: ['rel brakka respect 3'], next: 'intro_soldier' },
          { text: "Grief makes people see things.", tone: 'pragmatic', tags: ['honesty'], effects: ['rel brakka affection -2', 'rel brakka respect 1'], next: 'intro_blunt' },
          { text: "Fair enough.", tone: 'friendly', next: 'hub' },
        ],
      },
      intro_ostrem: {
        speaker: 'comp:brakka',
        text: "“I went to sleep in it. Woke in a hunting camp three days' walk away with no memory of getting there. Walked back.” She stops. “Found ruins. Moss on the hearthstones. Old moss. My clan says it fell four hundred years ago. I remember eating porridge in the great hall last spring. One of us is wrong.”",
        next: 'hub',
      },
      intro_soldier: {
        speaker: 'comp:brakka',
        text: "Brakka's eyes narrow, then warm. “And you look at a room like someone who's had to hold one.” She waves a hand before you can answer. “Doesn't matter where you served. Soldiers know soldiers. Means I don't have to explain why I sit facing the door.”",
        next: 'hub',
      },
      intro_blunt: {
        speaker: 'comp:brakka',
        text: "“Aye. It does.” She doesn't flinch. “And sometimes it makes them see things that are there. I've chewed on it every night since. If you've a better answer than ‘you're mad,’ I'll hear it. If not, I'll thank you to let me keep mine.”",
        next: 'hub',
      },
      brawl: {
        speaker: 'comp:brakka',
        text: [
          { if: 'brawl_outcome=talked', text: "“You talked them down. A room full of festival drunks, and you talked them down.” She shakes her head, grinning. “I had my shield half up. Felt almost cheated.”" },
          { if: 'brawl_outcome=intimidated', text: "“You stared them down. Good. Though one of them'll be dreaming about your face for a week, and I'm not sure he started it.” A shrug. “Fear's a blunt tool. Works, though.”" },
          { if: 'brawl_outcome=fought', text: "“Fists it was, then.” Brakka cracks her knuckles fondly. “Nobody killed, everybody humbled, and Tobin only lost a chair or two. That's a good brawl, by dwarf reckoning.”" },
          { if: 'brawl_outcome=performed', text: "“You put on a show. In the middle of a brawl. And they stopped to watch.” She stares at you as if you'd grown a second head and it was handsome. “I'll be telling that one at fires for years.”" },
          { if: '!brawl_outcome', text: "“A brawl's a brawl. Folk needed to let off steam before the dark came in. Can't say I blame them.”" },
        ],
        next: 'hub',
      },
      bell: {
        speaker: 'comp:brakka',
        text: "“Folk in the street, crying because their husband's a stranger. Or because he isn't, and they are.” She turns her axe over in her hands. “I know that. That wrongness. Waking in the right place and finding it gone. I'd not wish it on anyone, and tonight it happened to a whole town.”",
        next: 'bell2',
      },
      bell2: {
        speaker: 'comp:brakka',
        text: [
          { if: 'rescued_count>=2', text: "“But we pulled folk out of it. I keep telling myself that. Whatever's broken, we put a few pieces back where they belong.”" },
          { if: 'rescued_count<2', text: "“And not everyone came back out of that fog.” Her jaw sets. “I'll carry that. Someone should.”" },
        ],
        next: 'hub',
      },
      cathedral: {
        speaker: 'comp:brakka',
        text: "“Good stonework. Old. Humans built it on top of something older, which humans always do. Like a hat on a hat.” She frowns. “The floor hums. Did you feel it? My clan would say the stone's trying to tell you something. My clan also says I'm mad, so.”",
        options: [
          { text: "I felt it too.", tone: 'friendly', tags: ['honesty'], effects: ['rel brakka trust 2'], next: 'cath_felt' },
          { text: "Maybe the stone doesn't know what it's talking about either.", tone: 'sarcastic', tags: ['humor'], effects: ['rel brakka affection 1'], next: 'cath_joke' },
        ],
      },
      cath_felt: {
        speaker: 'comp:brakka',
        text: "“Did you.” She looks at you a long moment. “Good. That's two of us. Two's a lot better than one, when it comes to being mad.”",
        next: 'hub',
      },
      cath_joke: {
        speaker: 'comp:brakka',
        text: "Brakka barks a laugh. “Ha! Maybe not. Maybe the whole world's gone daft and we're the last ones sane. That'd be a comfort, in its way.”",
        next: 'hub',
      },
      ending: {
        speaker: 'comp:brakka',
        text: "“Tired in my bones. But standing.” She studies you. “You put your hand on that thing. The Heart. I saw your face when you did. Like you'd fallen down a well and found the bottom was the sky.”",
        next: 'ending_lira',
      },
      ending_lira: {
        speaker: 'comp:brakka',
        text: [
          { if: 'lira_fate=anchored', text: "“And the girl. You held her here. Paid for it too; I can see it in how you sit.” She nods slowly. “That's what a wall does. Takes the weight so the little ones don't have to.”" },
          { if: 'lira_fate=faded', text: "“The girl. Lira. You let her go easy. I've been chewing on it.” Her voice roughens. “If someone came for me, said I wasn't real, said best to let me fade gentle... I'd want them to ask me first. I hope we asked her right.”" },
          { if: 'lira_fate=bottled', text: "“The girl. Kept, not freed, not gone.” Brakka shifts uneasily. “I understand wanting to hold on. I'm holding on to a whole hall. Just mind you don't hold too tight.”" },
          { if: '!lira_fate', text: "“And the boy, Pell. Whatever we found down there proved him right. Somebody tell that lad he's not mad. Somebody should've told me.”" },
        ],
        next: 'ending_corvin',
      },
      ending_corvin: {
        speaker: 'comp:brakka',
        text: [
          { if: 'corvin_fate=handed_over', text: "“The scholar's in a cell. Fair, maybe. He broke something. But I saw him shaking. Didn't look like a villain. Looked like a lad who'd dropped a lamp in a hayloft.”" },
          { if: 'corvin_fate=freed', text: "“You let the scholar go. Good. He'll carry what he did. Some punishments don't need bars.”" },
          { if: 'corvin_fate=ally', text: "“The scholar's ours now, more or less. Fine. I'll keep an eye on him. Someone ought to keep him away from shovels.”" },
          { if: 'corvin_fate=killed', text: "“The scholar's dead.” She is quiet a long while. “I hope it was needed. I'm not sure it was. I'll carry that as well.”" },
          { if: '!corvin_fate', text: "“That scholar, Corvin. Wherever he's got to, I hope he's learned to dig shallower.”" },
        ],
        next: 'hub',
      },
      hook: {
        speaker: 'comp:brakka',
        text: "“Places that changed overnight. A mill in the Westmarch that's always been a lake, apparently. A road that goes somewhere new.” She lowers her voice. “And here, an old woman. Wenna. Tobin says she talks about that bell tower like she climbed it last week. Someone else who remembers what isn't there.”",
        options: [
          { text: "(Insight) She's not telling you everything.", tone: 'curious', check: { skill: 'insight', dc: 12, who: 'player', advIf: 'bg:soldier' }, success: 'hook_s', failure: 'hook_f' },
          { text: "Then we'll find out together.", tone: 'friendly', tags: ['protect'], effects: ['rel brakka trust 2', 'rel brakka affection 2'], next: 'hook_together' },
        ],
      },
      hook_s: {
        speaker: 'comp:brakka',
        text: "Brakka's hands stop on the axe. “...There's a thing I don't say,” she admits. “Some mornings I wake, and for a breath I don't know which version's true. Mine, or theirs. And for that breath I'm frightened it's me who's the ghost.” She resumes oiling the blade, harder. “There. Said it. Don't make a thing of it.”",
        effects: ['rel brakka trust 3', 'set brakka_ghost_fear'],
        next: 'hub',
      },
      hook_f: {
        speaker: 'comp:brakka',
        text: "Brakka gives you a flat, friendly look. “You've a face like you're trying to read runes off me. I'm a dwarf, not a tablet.” She goes back to her axe.",
        next: 'hub',
      },
      hook_together: {
        speaker: 'comp:brakka',
        text: "“Together.” She tries the word out like a new boot. “Aye. All right. It's been a long road on my own. Shorter with company, I'd wager.”",
        next: 'hub',
      },
      deep: {
        speaker: 'comp:brakka',
        text: "Brakka is quiet. Then, slowly, she starts to name them. “Hulda, who kept the bread ovens. Old Fenrik, who carved the honour-stones and spelled half of them wrong. My cousin Arnja, who could out-drink a mountain. My shield-mates, eleven of them.” Her voice doesn't break. It only gets lower. “No one in Kharn Dovrek remembers a single name. I say them every night so somebody does.”",
        next: 'deep2',
      },
      deep2: {
        speaker: 'comp:brakka',
        text: "“Here's what I can't put down, {player}. Is a person their memories, or their deeds? If nobody remembers Hulda's bread, did she bake it? And if I'm the only one who remembers... what does that make me?”",
        options: [
          { text: "Then I'll remember them too. Say the names again.", tone: 'compassionate', tags: ['protect'], effects: ['rel brakka trust 5', 'rel brakka affection 5', 'memory brakka 3 You learned the names of Ostrem\'s people.', 'set talk_brakka_deep'], next: 'deep_names' },
          { text: "Deeds. What you do is what you are, and you're a good person.", tone: 'friendly', tags: ['honesty'], effects: ['rel brakka trust 4', 'rel brakka respect 3', 'set talk_brakka_deep'], next: 'deep_deeds' },
          { text: "Maybe your clan is right, and you should let it go.", tone: 'pragmatic', effects: ['rel brakka trust -4', 'rel brakka affection -5', 'memory brakka -2 You told me to let Ostrem go.', 'set talk_brakka_deep'], next: 'deep_bad' },
        ],
      },
      deep_names: {
        speaker: 'dm',
        text: "Brakka looks at you for a long, long moment. Then she says them again, slower, and waits after each one for you to repeat it. Hulda. Fenrik. Arnja. When you're done she clears her throat roughly and doesn't look at you. “Two of us, now,” she says. “Two's the start of a clan.”",
        next: 'hub',
      },
      deep_deeds: {
        speaker: 'comp:brakka',
        text: "“Deeds.” She turns the word over like a stone in her palm. “I'd like that to be true. It'd mean Ostrem still stands, in a way, every time I hold the line.” A long breath. “Thank you. I'll sleep on it. Might even sleep.”",
        next: 'hub',
      },
      deep_bad: {
        speaker: 'dm',
        text: "Brakka's face doesn't change. That's the worst of it. “Aye,” she says. “Maybe they are.” She picks her axe back up and doesn't say another word for the rest of the night.",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════════ KAEL
  {
    id: 'camp_kael',
    title: 'Kael, at the window',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: '!bell_rang', text: "Kael is sprawled on the bed with his boots on, walking a silver coin across his knuckles. It vanishes and reappears at intervals, as if checking whether you're paying attention." },
          { if: 'bell_rang && !prologue_complete', text: "Kael is at the window with one hand on the shutter, watching the fog press against the glass. He turns with a grin that arrives a second too late." },
          { if: 'prologue_complete', text: "Kael sits on the windowsill with a folded paper in his hand. It disappears the instant he sees you, and the grin comes out in its place." },
        ],
        next: 'hub',
      },
      hub: {
        speaker: 'comp:kael',
        text: [
          { if: '!bell_rang', text: "“Ah, my favourite employer. Pull up a chair. Or a bed. Or a floor. I'm not fussy.”" },
          { if: 'bell_rang && !prologue_complete', text: "“Talk to me. Distract me. I hate fog. Did I mention I hate fog?”" },
          { if: 'prologue_complete', text: "“What's on your mind, hero? Besides everyone on the continent wanting a word with you.”" },
        ],
        options: [
          { text: "Who are you, really?", tone: 'curious', once: true, effects: ['set talk_kael_intro'], next: 'intro' },
          { text: "You vanished during that brawl.", if: 'brawl_resolved', tone: 'sarcastic', once: true, effects: ['set talk_kael_brawl'], next: 'brawl' },
          { text: "The bell. The fog. Thoughts?", if: 'bell_rang', tone: 'curious', once: true, effects: ['set talk_kael_bell'], next: 'bell' },
          { text: "You seemed very interested in the cathedral.", if: 'visited:cathedral', tone: 'curious', once: true, effects: ['set talk_kael_cathedral'], next: 'cathedral' },
          { text: "We survived. How are you doing?", if: 'prologue_complete', tone: 'compassionate', once: true, effects: ['set talk_kael_ending'], next: 'ending' },
          { text: "That letter you keep hiding. What is it?", if: 'kael_pocket_noticed || bell_rang', tone: 'curious', once: true, effects: ['set talk_kael_hook'], next: 'hook' },
          { text: "What would you do if you ever got out of the game?", if: 'trust:kael>=15', lockedText: "He'd laugh it off. He doesn't trust you with that yet.", tone: 'friendly', once: true, next: 'deep' },
          { text: "Sit with me by the window.", if: 'affection:kael>=25 && talk_kael_deep', tone: 'friendly', once: true, next: 'romance' },
          { text: "Try to get some sleep, Kael.", tone: 'leave', end: true },
        ],
      },
      intro: {
        speaker: 'comp:kael',
        text: "“Kael Veyran. Solmara born, gutter raised, currently between employers.” He bows from the waist while still lying down, which shouldn't be possible. “I'm here for the festival ale. Purely the ale. Look how honest my face is.”",
        options: [
          { text: "Nobody comes to Hollowmere for the ale.", tone: 'sarcastic', tags: ['humor'], effects: ['rel kael affection 2'], next: 'intro_ale' },
          { text: "I know a working thief when I see one. Who are you here for?", if: 'bg:criminal', tone: 'background', effects: ['rel kael trust 3', 'rel kael respect 2'], next: 'intro_crim' },
          { text: "(Insight) Watch his hands while he talks.", tone: 'curious', check: { skill: 'insight', dc: 14, who: 'player' }, success: 'intro_insight_s', failure: 'intro_insight_f' },
          { text: "Fine. Keep your secrets.", tone: 'friendly', next: 'hub' },
        ],
      },
      intro_ale: {
        speaker: 'comp:kael',
        text: "“Have you tried it? Of course nobody comes for it. That's what makes it the perfect excuse.” He winks. “See, I'm being completely honest about lying to you. That's practically a relationship.”",
        next: 'hub',
      },
      intro_crim: {
        speaker: 'comp:kael',
        text: "The coin stops. Kael looks at you properly for the first time. “Ah. One of us.” He relaxes, which is somehow more alarming. “Let's say I've been paid to keep my eyes open round here, and leave it at that. Professional courtesy?”",
        next: 'hub',
      },
      intro_insight_s: {
        speaker: 'dm',
        text: "His hands never stop: the coin, a bootlace, the edge of the blanket. But when he says “between employers,” his left hand goes still against his chest, right over an inner pocket. Something papery crinkles there. Then the coin is moving again, and his grin is twice as wide.",
        effects: ['set kael_pocket_noticed'],
        next: 'hub',
      },
      intro_insight_f: {
        speaker: 'comp:kael',
        text: "Kael catches you watching and makes the coin disappear with a flourish. “Eyes up here, friend. The hands are just for show.” Everything about him is for show. You can't tell where it stops.",
        next: 'hub',
      },
      brawl: {
        speaker: 'comp:kael',
        text: [
          { if: 'brawl_outcome=talked', text: "“You talked a roomful of drunks out of a fight. I had money on chairs being thrown. You cost me three silver.” He beams. “Worth it.”" },
          { if: 'brawl_outcome=intimidated', text: "“You scared them so badly one of them apologised to the table. Remind me never to owe you money.”" },
          { if: 'brawl_outcome=fought', text: "“I didn't vanish. I strategically repositioned. Behind the bar. Near the good bottles.” He pats his coat, which clinks. “Somebody had to protect them.”" },
          { if: 'brawl_outcome=performed', text: "“You put on a show in the middle of a brawl. A show!” He clasps his heart. “I've never been so jealous of anyone in my life.”" },
          { if: '!brawl_outcome', text: "“Brawls are excellent cover, you know. For all sorts of things. Not that I did any of them.”" },
        ],
        next: 'hub',
      },
      bell: {
        speaker: 'comp:kael',
        text: "“Thoughts? Bells shouldn't ring when there's no bell. People shouldn't wake up married to strangers. And I shouldn't be in a town where both are happening.” He laughs, but his knuckles are white on the shutter.",
        next: 'bell2',
      },
      bell2: {
        speaker: 'comp:kael',
        text: [
          { if: 'rescued_count>=2', text: "“You went back in for them, though. Into the fog. Every time.” He looks at you strangely. “Most people don't. Most people make excuses. I'm very good at excuses; I'd know.”" },
          { if: 'rescued_count<2', text: "“And some of them we didn't find. I keep thinking about them. Wish I didn't. Thinking's terrible for business.”" },
        ],
        next: 'hub',
      },
      cathedral: {
        speaker: 'comp:kael',
        text: "“Me? I'm interested in everything. Curious soul. Ask anyone. Actually, don't ask anyone.” He scratches his jaw. “Fine. Footprints. Lots of them. Someone's been in and out of that ruin for weeks. I like to know who's been where before I get there.”",
        options: [
          { text: "Who are you working for, Kael?", tone: 'aggressive', tags: ['honesty'], effects: ['rel kael trust -1'], next: 'cath_who' },
          { text: "Good instinct. Keep your eyes open.", tone: 'pragmatic', tags: ['pragmatic'], effects: ['rel kael agreement 2'], next: 'cath_good' },
        ],
      },
      cath_who: {
        speaker: 'comp:kael',
        text: "“Working for? Me? I'm a free spirit.” The grin is perfect. Too perfect. “Tell you what. If anyone ever pays me to follow you around, I'll make sure they pay extra.”",
        next: 'hub',
      },
      cath_good: {
        speaker: 'comp:kael',
        text: "“Always do. Only useful thing my mother taught me. Well, that and crying convincingly on cue.” He demonstrates; a single perfect tear. “Impressive, no?”",
        next: 'hub',
      },
      ending: {
        speaker: 'comp:kael',
        text: "“Me? Fantastic. I've seen a monk fused to a bell, a glowing rock with opinions, and you touching it, which every self-preserving instinct I own screamed at you not to do.” He's smiling. His eyes aren't.",
        next: 'ending_lira',
      },
      ending_lira: {
        speaker: 'comp:kael',
        text: [
          { if: 'lira_fate=anchored', text: "“And the kid's sister. Lira. You brought her back.” His voice goes odd. “Pell gets to grow up with a sister. Because of you. Do you know how... no. Never mind. Good. That's good.”" },
          { if: 'lira_fate=faded', text: "“And Lira. You let her go.” He studies the floor. “Probably right. Probably the kind thing. I'm just thinking about Pell, alone, remembering someone nobody else does. Hard way to grow up.”" },
          { if: 'lira_fate=bottled', text: "“And the kid's sister is... in a jar. Sort of. Not here, not gone.” Kael rubs his face. “Not saying it's wrong. Saying I'd want to visit her. Is that strange?”" },
          { if: '!lira_fate', text: "“And the kid, Pell. Turns out he wasn't lying. Kids usually aren't, about the things that matter.”" },
        ],
        next: 'ending_ysolt',
      },
      ending_ysolt: {
        speaker: 'comp:kael',
        text: [
          { if: 'ysolt_outcome=fought', text: "“Then we picked a fight with a Conclave Seeker. You know they keep grudges in triplicate? Everyone and their spymaster will want a word with you now.”" },
          { if: 'ysolt_outcome=persuaded', text: "“And you talked a Seeker into walking away. I've been talking my way out of things my whole life. Teach me. Before every spymaster in Elyndra comes asking about you.”" },
          { if: 'ysolt_outcome=escaped', text: "“And then we ran. Good. Running's my best subject. Better get used to it; every spymaster on the continent will be asking after you.”" },
          { if: '!ysolt_outcome', text: "“Everyone and their spymaster is going to want a word with you now.” He says it lightly. Too lightly." },
        ],
        options: [
          { text: "(Insight) You said ‘spymaster’ like you'd met one.", tone: 'curious', check: { skill: 'insight', dc: 15, who: 'player', advIf: 'kael_pocket_noticed' }, success: 'ending_insight_s', failure: 'ending_insight_f' },
          { text: "Get some rest, Kael.", tone: 'friendly', next: 'hub' },
        ],
      },
      ending_insight_s: {
        speaker: 'dm',
        text: "Kael's hand drifts toward his inner pocket and stops halfway, as if remembering itself. “Figure of speech,” he says. Then, quieter, almost to himself: “Everyone owes somebody, {player}. Some of us just owe worse people.”",
        effects: ['set kael_debt_hint', 'rel kael trust 1'],
        next: 'hub',
      },
      ending_insight_f: {
        speaker: 'comp:kael',
        text: "“It's a colourful word. I collect them. Spymaster, mountebank, ne'er-do-well.” He grins. “That last one's me. Usually.”",
        next: 'hub',
      },
      hook: {
        speaker: 'comp:kael',
        text: "Kael's hand goes to his coat before he can stop it. “Letter? What letter? I'm illiterate. Tragic, really.”",
        options: [
          { text: "You read the inn's menu out loud. In three accents.", tone: 'sarcastic', tags: ['humor'], effects: ['rel kael trust 2'], next: 'hook_tease' },
          { text: "Give it to me.", tone: 'aggressive', tags: ['authority'], effects: ['rel kael trust -3'], next: 'hook_demand' },
          { text: "Forget it. Everyone gets letters.", tone: 'friendly', effects: ['rel kael affection 2'], next: 'hook_drop' },
        ],
      },
      hook_tease: {
        speaker: 'comp:kael',
        text: "“...Damn. I did do that.” He sighs, and after a moment pulls out the folded paper. Plain. No seal. He doesn't open it. “It finds me. Wherever I go. Never signed, always knows where I've been. It's from someone I owe.” He tucks it away. “That's the whole of what you get. Don't push.”",
        effects: ['set kael_letter_hint'],
        next: 'hub',
      },
      hook_demand: {
        speaker: 'comp:kael',
        text: "“No.” The word is flat, and the grin is gone entirely. Then, as if remembering where he left it, it comes back. “Sorry. I mean, ‘no, darling.’ But no.”",
        next: 'hub',
      },
      hook_drop: {
        speaker: 'comp:kael',
        text: "Kael relaxes so much it's almost a collapse. “Everyone gets letters,” he agrees. “Exactly. You're my favourite person. Have I said?”",
        next: 'hub',
      },
      deep: {
        speaker: 'comp:kael',
        text: "The coin stops. For once he doesn't fill the silence. “There's a house,” he says eventually. “In Ashenford. The Low Quarter. Wren House. Leaky roof, thirty-one kids, one very tired woman called Mother Abbet. I grew up there. Sort of. Until I grew out of it.”",
        next: 'deep2',
      },
      deep2: {
        speaker: 'comp:kael',
        text: "“They'll lose it. Debts. Somebody bought up the paper on it.” He laughs without any humour. “So I steal, and smuggle, and lie, and I send what I can. And one day I'm going to buy that deed, nail it to the front door, and retire. Grow fat. Teach the little ones to pick locks. Responsibly.”",
        options: [
          { text: "That might be the most honourable thing I've ever heard.", tone: 'compassionate', tags: ['charity'], effects: ['rel kael trust 5', 'rel kael affection 5', 'memory kael 3 You didn\'t laugh about the Wren House.', 'set talk_kael_deep'], next: 'deep_kind' },
          { text: "Let me help. We'll get that deed together.", tone: 'friendly', tags: ['protect', 'charity'], effects: ['rel kael trust 3', 'rel kael affection 3', 'set talk_kael_deep'], next: 'deep_help' },
          { text: "A thief with a heart of gold. How original.", tone: 'sarcastic', effects: ['rel kael trust -6', 'rel kael affection -4', 'memory kael -3 You laughed at the Wren House.', 'set talk_kael_deep'], next: 'deep_bad' },
        ],
      },
      deep_kind: {
        speaker: 'comp:kael',
        text: "“Don't.” But he's smiling, small and real, and his ears have gone red. “Don't tell anyone. Seriously. If people find out I've got something to lose, they'll use it.” A beat. “...Thanks, though.”",
        next: 'hub',
      },
      deep_help: {
        speaker: 'comp:kael',
        text: "Kael stares at you as though you'd offered him a live snake. “Why would you— no. You don't have to. That's not how it works. Nobody helps for free.” He swallows. “...I'll think about it. That's all. I'll think.”",
        next: 'hub',
      },
      deep_bad: {
        speaker: 'dm',
        text: "The coin reappears. The grin reappears. Everything reappears except Kael. “Yeah,” he says breezily. “Terrible cliché. Made it up for sympathy. Did it work? Shame.” He's out of the room before you can answer.",
        end: true,
      },
      romance: {
        speaker: 'dm',
        text: "You sit on the sill beside him, close enough that your shoulders touch. Kael goes very still, the way he does just before a lock gives. “Careful,” he says lightly. “I've been told I'm a terrible influence.”",
        options: [
          { text: "I'll risk it.", tone: 'friendly', effects: ['rel kael affection 5', 'set romance_kael_hint'], next: 'romance_yes' },
          { text: "Then I'd better keep my purse close.", tone: 'sarcastic', next: 'romance_no' },
        ],
      },
      romance_yes: {
        speaker: 'dm',
        text: "“You really shouldn't,” he murmurs. But he doesn't move away. For a long while you watch the street together, and for once Kael doesn't say anything clever at all.",
        end: true,
      },
      romance_no: {
        speaker: 'dm',
        text: "Kael laughs, and the moment slips away like a coin up a sleeve. “Wise,” he says. “Very wise.” If he's disappointed, he hides it professionally.",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════════ SERIS
  {
    id: 'camp_seris',
    title: 'Seris, keeping vigil',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: '!bell_rang', text: "Seris kneels at the foot of her cot, her armour laid out beside her in perfect order, every buckle polished. She finishes her prayer before she looks up. She does not hurry it." },
          { if: 'bell_rang && !prologue_complete', text: "Seris has not removed her armour. She sits on the edge of her cot with her sword across her knees, and the ember at her breast glows faintly in the dark room." },
          { if: 'prologue_complete', text: "Seris is at the little table with a sealed letter in front of her. She has been looking at it for some time. When you come in, she turns it face-down." },
        ],
        next: 'hub',
      },
      hub: {
        speaker: 'comp:seris',
        text: [
          { if: '!bell_rang', text: "“{player}. You wish to speak? I am at your disposal.”" },
          { if: 'bell_rang && !prologue_complete', text: "“Speak. The night is long, and my watch is longer.”" },
          { if: 'prologue_complete', text: "“Please. Sit. I would welcome the distraction more than I care to admit.”" },
        ],
        options: [
          { text: "Who are you, really?", tone: 'curious', once: true, effects: ['set talk_seris_intro'], next: 'intro' },
          { text: "About the fight at the inn.", if: 'brawl_resolved', tone: 'friendly', once: true, effects: ['set talk_seris_brawl'], next: 'brawl' },
          { text: "The bell. You know its story, don't you?", if: 'bell_rang', tone: 'curious', once: true, effects: ['set talk_seris_bell'], next: 'bell' },
          { text: "You were quiet in the cathedral.", if: 'visited:cathedral', tone: 'compassionate', once: true, effects: ['set talk_seris_cathedral'], next: 'cathedral' },
          { text: "What happens now? With the Heart. With me.", if: 'prologue_complete', tone: 'diplomatic', once: true, effects: ['set talk_seris_ending'], next: 'ending' },
          { text: "That letter you turned over. Your orders?", if: 'bell_rang', tone: 'curious', once: true, effects: ['set talk_seris_hook'], next: 'hook' },
          { text: "What are you afraid of, Seris?", if: 'trust:seris>=15', lockedText: "She would answer with scripture. She needs to trust you more.", tone: 'compassionate', once: true, next: 'deep' },
          { text: "You don't have to keep watch alone tonight.", if: 'affection:seris>=25 && talk_seris_deep', tone: 'friendly', once: true, next: 'romance' },
          { text: "Lights keep you, Seris.", tone: 'leave', end: true },
        ],
      },
      intro: {
        speaker: 'comp:seris',
        text: "“Seris Dawnbound, Knight-Oathsworn of the Order of the Last Dawn.” She says it the way other people say their own names, as if it is her name. “I was raised in the Order's foundling house. I have no other family, and have needed none. I was sent to Hollowmere to judge whether the town is tainted by the Veil's decay.”",
        options: [
          { text: "And what happens if it is?", tone: 'curious', tags: ['curiosity'], next: 'intro_judge' },
          { text: "I was raised in the faith too.", if: 'class:paladin || class:cleric || bg:acolyte', tone: 'class', tags: ['faith'], effects: ['rel seris trust 3'], next: 'intro_faith' },
          { text: "Judging a whole town on a festival night. That's grim work.", tone: 'compassionate', effects: ['rel seris affection 2'], next: 'intro_grim' },
          { text: "Your Order drowns Veilborn children, doesn't it?", tone: 'aggressive', tags: ['defiance'], effects: ['rel seris trust -3', 'rel seris affection -2'], next: 'intro_drown' },
        ],
      },
      intro_judge: {
        speaker: 'comp:seris',
        text: "Seris hesitates. Only for a moment, but you see it. “Then I report it, and the Order acts as the Order sees fit.” She straightens. “It is not my place to know more than my orders tell me. My orders are sufficient.”",
        next: 'hub',
      },
      intro_faith: {
        speaker: 'comp:seris',
        text: "Her expression softens, actually softens, for the first time since you met her. “Then you understand. The prayers at dawn. The cold floors. The certainty.” A pause. “It is a comfort, to be understood without explanation.”",
        next: 'hub',
      },
      intro_grim: {
        speaker: 'comp:seris',
        text: "“It is necessary work.” Then, more quietly: “A woman at the bread stall gave me a loaf this afternoon and would not take my coin. A child tied a ribbon on my scabbard for luck.” She touches it. It's still there. “It is harder, when they are kind.”",
        next: 'hub',
      },
      intro_drown: {
        speaker: 'comp:seris',
        text: "Seris goes white, then red. “That practice was abolished forty years ago,” she says tightly. “The Order is not its worst members.” She turns away. “I would ask you not to speak of it again.”",
        next: 'hub',
      },
      brawl: {
        speaker: 'comp:seris',
        text: [
          { if: 'brawl_outcome=talked', text: "“You settled it with words. That was well done. Reason is the law's first instrument.”" },
          { if: 'brawl_outcome=intimidated', text: "“You frightened them into peace. It worked.” She frowns. “I am not certain it was just. Fear is a poor foundation for order.”" },
          { if: 'brawl_outcome=fought', text: "“Brawling. On a holy night.” She sighs. “No one was badly hurt and the instigators were dealt with. I shall record it as a vigorous restoration of the peace.”" },
          { if: 'brawl_outcome=performed', text: "“You turned a brawl into a performance.” Seris's lips twitch, very slightly. “I do not know which commandment covers that. I shall have to look.”" },
          { if: '!brawl_outcome', text: "“A fight in a tavern is a small sin. I have seen worse tonight.”" },
        ],
        next: 'hub',
      },
      bell: {
        speaker: 'comp:seris',
        text: "“Orlen's Voice was the bell that drove away the fog. Saint Orlen rang it nine days and nights so the lost could follow the sound home. Every child in the foundling house knew the story.” Her hand tightens on her hilt. “Tonight it called the fog instead. Either the story was wrong, or something is wearing the saint's voice.”",
        next: 'bell2',
      },
      bell2: {
        speaker: 'comp:seris',
        text: [
          { if: 'rescued_count>=2', text: "“And you went into that fog for the lost. Again and again, without being commanded.” She bows her head to you, briefly and formally. “That is what the Dawn is for. I wish more of my brothers and sisters understood it.”" },
          { if: 'rescued_count<2', text: "“And there are people still lost in it. We could not save them all.” Her jaw sets. “I will pray for them. I would rather have saved them.”" },
        ],
        next: 'hub',
      },
      cathedral: {
        speaker: 'comp:seris',
        text: "“A holy house, broken. It grieves me.” Seris looks into the fire. “I knelt at the six niches, and I did not look at the seventh, because we are taught not to. I have never once questioned that.” A pause. “Tonight I nearly did.”",
        options: [
          { text: "Why is the seventh niche empty?", tone: 'curious', tags: ['curiosity'], effects: ['rel seris trust 2'], next: 'cath_curious' },
          { text: "Some questions are best left alone.", tone: 'diplomatic', tags: ['faith', 'tradition'], effects: ['rel seris agreement 3'], next: 'cath_faith' },
        ],
      },
      cath_curious: {
        speaker: 'comp:seris',
        text: "“The Silent Light. Unnamed, unpetitioned.” She recites it like a catechism, then stops. “I do not know why. I was told it was not a question for the faithful.” Her voice drops. “It frightens me that I do not know.”",
        next: 'hub',
      },
      cath_faith: {
        speaker: 'comp:seris',
        text: "“Yes.” Relief floods her face. “Yes. Thank you. That is what I was taught.” She breathes out. “You are a steadying presence, {player}. I do not say that lightly.”",
        next: 'hub',
      },
      ending: {
        speaker: 'comp:seris',
        text: "“We went beneath a holy place and found... I do not know what we found. A thing the Order has no hymn for.” She looks at your hand, the one that touched the Heart. “My orders will require me to report it. To report you. I have not yet decided what I will say.”",
        next: 'ending_corvin',
      },
      ending_corvin: {
        speaker: 'comp:seris',
        text: [
          { if: 'corvin_fate=handed_over', text: "“The Unbound scholar has been surrendered to lawful authority. That was correct.” She nods firmly. Then, less firmly: “He wept when they took him. I did not expect that to trouble me.”" },
          { if: 'corvin_fate=freed', text: "“You released the Unbound scholar.” Her voice is cool. “His dig cracked the seal that began all this. I do not agree with what you did. I am trying to understand why you did it.”" },
          { if: 'corvin_fate=ally', text: "“And now an Unbound heretic travels in our shadow.” She exhales. “I will tolerate him, for your sake. Do not ask me to like him.”" },
          { if: 'corvin_fate=killed', text: "“The scholar is dead. Justice is sometimes a blade.” She says it as if reciting. Her hands are not quite steady." },
          { if: '!corvin_fate', text: "“The scholar who cracked the seal is still at large. A loose thread. I dislike loose threads.”" },
        ],
        next: 'ending_ysolt',
      },
      ending_ysolt: {
        speaker: 'comp:seris',
        text: [
          { if: 'ysolt_outcome=fought', text: "“And we drew steel on a Conclave Seeker. Lawful or not, she meant to take the Heart by force. I would do it again.”" },
          { if: 'ysolt_outcome=persuaded', text: "“And you turned the Seeker aside with words alone. I have seen bishops fail to do as much with scripture.”" },
          { if: 'ysolt_outcome=escaped', text: "“And we fled the Seeker. I mislike running.” A pause. “I mislike more the thought of you in Conclave chains.”" },
          { if: '!ysolt_outcome', text: "“There will be others who come for it. For you. I must decide what I am, when they do.”" },
        ],
        next: 'hub',
      },
      hook: {
        speaker: 'comp:seris',
        text: "Seris's hand rests flat on the letter. “My orders regarding Hollowmere. I am to open them only if I judge the town to be tainted.” Her voice is perfectly even. “It is a simple matter of procedure.”",
        options: [
          { text: "(Insight) Read her face.", tone: 'curious', check: { skill: 'insight', dc: 13, who: 'player' }, success: 'hook_s', failure: 'hook_f' },
          { text: "Open it. Now. Know what you're carrying.", tone: 'aggressive', tags: ['boldness'], effects: ['rel seris trust -1'], next: 'hook_open' },
        ],
      },
      hook_s: {
        speaker: 'dm',
        text: "She isn't looking at the letter. She's looking past it, the way people look away from a wound. Whatever she thinks is inside, she's afraid of it, and more afraid of the moment she'll have to break the seal and know. “Do not look at me like that,” Seris says quietly. “I know what my Order is capable of. I have chosen to believe it will not be asked of me.”",
        effects: ['set seris_orders_fear', 'rel seris trust 2'],
        next: 'hub',
      },
      hook_f: {
        speaker: 'dm',
        text: "Seris's face is a closed gate, polished and barred. Whatever she feels about the letter, she keeps it on the far side.",
        next: 'hub',
      },
      hook_open: {
        speaker: 'comp:seris',
        text: "“No.” She covers the letter with her hand. “I will open it when I am required to. Not before. That is what an oath means.” Then, so softly you almost miss it: “And I am not ready.”",
        next: 'hub',
      },
      deep: {
        speaker: 'comp:seris',
        text: "Seris is silent a long time. The ember at her breast pulses, slow. “When I was nine, I had a fever. Three days. The sisters said I would die. I prayed to Aurel the whole time, and on the third night the ember in the chapel glowed, and the fever broke. I have never doubted since.”",
        next: 'deep2',
      },
      deep2: {
        speaker: 'comp:seris',
        text: [
          { if: 'visited:vault', text: "“In the vault, the ember on my breast glowed the same way. Not because I prayed. Because the walls did.” She closes her hand over it. “I am afraid, {player}, that I have spent my life thanking someone who was never in the room.”" },
          { if: '!visited:vault', text: "“In the fog tonight, the ember pushed it back. Not because I prayed. I had no time to pray.” She closes her hand over it. “I am afraid, {player}, that I have spent my life thanking someone who was never in the room.”" },
        ],
        options: [
          { text: "Doubt isn't the opposite of faith. It's part of it.", tone: 'compassionate', tags: ['faith'], effects: ['rel seris trust 5', 'rel seris affection 4', 'memory seris 3 You told me doubt was part of faith.', 'set talk_seris_deep'], next: 'deep_faith' },
          { text: "Whoever answered, you were the one who kept fighting that fever. That strength is yours.", tone: 'friendly', tags: ['honesty'], effects: ['rel seris trust 4', 'rel seris respect 4', 'set talk_seris_deep'], next: 'deep_self' },
          { text: "Maybe they aren't there. Better to know.", tone: 'pragmatic', effects: ['rel seris trust -5', 'rel seris affection -5', 'memory seris -3 You told me the Lights might not be there.', 'set talk_seris_deep'], next: 'deep_bad' },
        ],
      },
      deep_faith: {
        speaker: 'comp:seris',
        text: [
          { if: 'comp:ilyra', text: "Seris looks at you as if you'd handed her a blade by the wrong end. “Ilyra says that,” she says slowly. “I always thought it was heresy.” A long pause. “I would like it to be true. Let me think on it.”" },
          { if: '!comp:ilyra', text: "Seris looks at you as if you'd handed her a blade by the wrong end. “The sisters would call that heresy,” she says slowly. “And yet.” A long pause. “I would like it to be true. Let me think on it.”" },
        ],
        next: 'hub',
      },
      deep_self: {
        speaker: 'comp:seris',
        text: "“Mine.” She says it like a word in a foreign tongue. “The Order teaches that our strength is lent.” She looks down at her hands, scarred from years of drill. “I do not know what to do with the idea that it might be mine. It is... heavier. And somehow easier to carry.”",
        next: 'hub',
      },
      deep_bad: {
        speaker: 'comp:seris',
        text: "Seris stands. Every line of her is rigid. “Thank you for your candour,” she says, in a voice like a closing door. “I find I must pray now. Alone.”",
        end: true,
      },
      romance: {
        speaker: 'dm',
        text: "Seris looks up, startled, as though no one has ever offered her that before. Perhaps no one has. “It is my duty,” she says. Then: “...I would not object to company. For the watch. Strictly for the watch.”",
        options: [
          { text: "Strictly for the watch.", tone: 'friendly', effects: ['rel seris affection 5', 'set romance_seris_hint'], next: 'romance_yes' },
          { text: "On second thought, you should get some rest.", tone: 'diplomatic', next: 'romance_no' },
        ],
      },
      romance_yes: {
        speaker: 'dm',
        text: "You sit beside her on the cot, shoulder to armoured shoulder, and watch the door. Somewhere around the third hour her head comes to rest against yours. She doesn't move it, and neither do you, and neither of you mentions it in the morning.",
        end: true,
      },
      romance_no: {
        speaker: 'comp:seris',
        text: "“Yes. Of course.” Seris nods, crisp and correct. Her ears are pink. “Goodnight, {player}. Lights keep you.”",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════════ NIMA
  {
    id: 'camp_nima',
    title: 'Nima, not sitting still',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: '!bell_rang', text: "Nima is perched on the windowsill with her legs dangling over the street, catching festival sparks on her fingertips and making them change colour. Some are colours you're fairly sure don't have names." },
          { if: 'bell_rang && !prologue_complete', text: "Nima is pacing. Little flames wink in and out along her knuckles as she walks. When she sees you she claps her hands together and they go out in a puff of smoke." },
          { if: 'prologue_complete', text: "Nima is lying on the floor with her feet up on the bed, staring at the ceiling. A tiny flame floats above her face, turning slowly, like a thought she can't quite finish." },
        ],
        next: 'hub',
      },
      hub: {
        speaker: 'comp:nima',
        text: [
          { if: '!bell_rang', text: "“{player}! Hi! Talk to me, I'm bored and everything's exciting, it's very confusing!”" },
          { if: 'bell_rang && !prologue_complete', text: "“Okay. Okay. I'm calm. I'm completely calm. What do you want to talk about? Is it the bell? It's the bell, isn't it.”" },
          { if: 'prologue_complete', text: "“Hey. Sit. The floor's comfier than it looks. Mostly.”" },
        ],
        options: [
          { text: "Who are you, really?", tone: 'curious', once: true, effects: ['set talk_nima_intro'], next: 'intro' },
          { text: "How are you feeling about the bell?", if: 'bell_rang', tone: 'compassionate', once: true, effects: ['set talk_nima_bell'], next: 'bell' },
          { text: "What did you think of the cathedral?", if: 'visited:cathedral', tone: 'curious', once: true, effects: ['set talk_nima_cathedral'], next: 'cathedral' },
          { text: "So. The Heart of Aether.", if: 'prologue_complete', tone: 'friendly', once: true, effects: ['set talk_nima_ending'], next: 'ending' },
          { text: "Your flames. Do they ever... answer you?", if: 'found_secret_stair || prologue_complete', tone: 'curious', once: true, effects: ['set talk_nima_hook'], next: 'hook' },
          { text: "What are you most afraid of?", if: 'trust:nima>=15', lockedText: "She'd make a joke of it. She needs to trust you more.", tone: 'compassionate', once: true, next: 'deep' },
          { text: "Goodnight, Nima. Try not to set the bed on fire.", tone: 'leave', end: true },
        ],
      },
      intro: {
        speaker: 'comp:nima',
        text: "“Nima Emberglass! Sorcerer, ex-glassblower, part-time disaster.” She flicks a spark into the air and it bursts into a tiny glittering flower. “My magic woke up during a Veil flicker in Ashenford. Most beautiful thing that ever happened to me.” The flower fades. “It also burned down my family's glassworks. So. Mixed review.”",
        options: [
          { text: "Was anyone hurt?", tone: 'compassionate', tags: ['mercy'], effects: ['rel nima trust 2'], next: 'intro_hurt' },
          { text: "Mine woke up the hard way too.", if: 'class:sorcerer', tone: 'class', effects: ['rel nima affection 3'], next: 'intro_sorc' },
          { text: "Sounds like you should be more careful.", tone: 'pragmatic', tags: ['caution'], effects: ['rel nima agreement -2'], next: 'intro_careful' },
          { text: "Show me the flower again.", tone: 'curious', tags: ['curiosity'], effects: ['rel nima affection 2'], next: 'intro_flower' },
        ],
      },
      intro_hurt: {
        speaker: 'comp:nima',
        text: "Nima's smile stays exactly where it is, which is how you know. “My dad. His hands. He was a glassblower; he needed his hands.” She shrugs, fast and jerky. “He's fine. He's alive. We don't talk. It's fine! Ask me something else!”",
        next: 'hub',
      },
      intro_sorc: {
        speaker: 'comp:nima',
        text: "Nima sits bolt upright. “Really? REALLY? What happened? Did it hurt? Does yours ever talk— no, forget that, that's a weird question, nobody's talks.” She laughs too loudly. “We should compare notes! Sorcerer club. Two members. I'm president.”",
        next: 'hub',
      },
      intro_careful: {
        speaker: 'comp:nima',
        text: "Nima groans and flops backward. “Everyone says that. Careful, careful, careful. Careful is how you end up never knowing what you could do.” She stares at the ceiling. “Besides. I am careful. You have no idea how careful I am.”",
        next: 'hub',
      },
      intro_flower: {
        speaker: 'comp:nima',
        text: "“Glass-fire! Dad taught me. Well, he taught me with sand and a blowpipe; I just skip the sand.” She makes another, gold this time, and sets it floating between you. “You heat it until it remembers it wants to be something else. That's the whole trick. With glass and with people.”",
        next: 'hub',
      },
      bell: {
        speaker: 'comp:nima',
        text: "“The BELL! Did you feel it? Right in the chest. Like the whole world took a breath and forgot to let it out!” She's practically vibrating. Then she stops. “Also people are missing and it's horrible. Both things. I can feel both things at once and it's very tiring.”",
        next: 'bell2',
      },
      bell2: {
        speaker: 'comp:nima',
        text: [
          { if: 'rescued_count>=2', text: "“You kept going back into the fog for people. I was so scared I could feel my heartbeat in my fingers. You just... went.” She bumps your shoulder. “I want to be brave like that. The useful kind, not the explode-y kind.”" },
          { if: 'rescued_count<2', text: "“I wanted to burn the fog away. Just WHOOSH, make it go.” Her hands spark and she sits on them. “I didn't. I'd have burned the people in it too. That's the problem with me. Always the problem.”" },
        ],
        next: 'hub',
      },
      cathedral: {
        speaker: 'comp:nima',
        text: "“Spooky-amazing. And the air in there! It tasted like the moment before lightning, all over, all the time.” Nima holds up a hand and tiny sparks crawl over it like ants. “My fire loved it. It got all... loud.”",
        options: [
          { text: "Do you think the Veil is breaking?", tone: 'curious', tags: ['curiosity'], effects: ['rel nima agreement 1'], next: 'cath_veil' },
          { text: "Let's not go back there unless we have to.", tone: 'pragmatic', tags: ['caution'], effects: ['rel nima agreement -1'], next: 'cath_caution' },
        ],
      },
      cath_veil: {
        speaker: 'comp:nima',
        text: "“Breaking. Changing. Waking up!” She sits up, eyes shining. “Everyone talks about it like a roof caving in. What if it's more like an egg?” She considers this. “Vaelis would say I'm being romantic. Vaelis can kiss a fire-newt.”",
        next: 'hub',
      },
      cath_caution: {
        speaker: 'comp:nima',
        text: "“What? No! We have to go back. There's so much we haven't touched yet!” She catches your look. “Carefully touched. I'd touch it so carefully.”",
        next: 'hub',
      },
      ending: {
        speaker: 'comp:nima',
        text: "“You touched the Heart of Aether. The actual Heart. The thing from every story!” Nima grabs your hand and peers at it as if it might glow. It doesn't. She looks disappointed. “Did it hurt? Was it beautiful? It was both, wasn't it.”",
        next: 'ending_lira',
      },
      ending_lira: {
        speaker: 'comp:nima',
        text: [
          { if: 'lira_fate=anchored', text: "“And you pulled Lira back into the world. Just pulled her! Like snatching a coal out of the fire with your bare hands.” Nima's voice wobbles. “Pell has his sister. That's the best thing anyone's ever done that I got to watch.”" },
          { if: 'lira_fate=faded', text: "“And Lira... went.” Nima hugs her knees. “It was gentle. I know it was. I just hate it when things go out. Candles. Lanterns. People.”" },
          { if: 'lira_fate=bottled', text: "“And Lira's kept. Somewhere in between.” Nima frowns at her little flame. “Stuck halfway. Not burning, not out. That sounds like the loneliest thing.”" },
          { if: '!lira_fate', text: "“And Pell was right all along. I knew it. People who say things nobody believes are usually right. I should know; I'm right constantly.”" },
        ],
        next: 'ending_ysolt',
      },
      ending_ysolt: {
        speaker: 'comp:nima',
        text: [
          { if: 'ysolt_outcome=fought', text: "“And we fought a Conclave Seeker and WON. Sort of. She ran. That counts!” Nima glows, a little literally. “They'll put us on posters. I hope they get my good side.”" },
          { if: 'ysolt_outcome=persuaded', text: "“And you talked the Seeker down! No fireballs at all! I had four fireballs ready.” She sighs. “I'm proud of you. Also a bit disappointed. Mostly proud.”" },
          { if: 'ysolt_outcome=escaped', text: "“And we RAN. Out of a secret vault, away from a Conclave agent, through a haunted town! Most exciting thing I've ever done, and I once set a lake on fire.”" },
          { if: '!ysolt_outcome', text: "“Somebody's going to come for it. For you. Let them. I'm warm and I'm ready.”" },
        ],
        next: 'hub',
      },
      hook: {
        speaker: 'comp:nima',
        text: "Nima's flame goes still in the air. “What? Why would you ask that? That's a weird thing to ask.” She laughs. It isn't a very good laugh.",
        options: [
          { text: "(Insight) She wants to tell you. Give her room to.", tone: 'compassionate', check: { skill: 'insight', dc: 13, who: 'player' }, success: 'hook_s', failure: 'hook_f' },
          { text: "Never mind. Just a thought.", tone: 'friendly', next: 'hub' },
        ],
      },
      hook_s: {
        speaker: 'dm',
        text: "You don't press. You just wait, and let the quiet be safe. Nima's shoulders come down by degrees. “Sometimes,” she whispers. “When it's loud. When I'm burning really hard. There's a voice in the crackle, and it sounds like me. Only older. And sadder. Like me if I'd made every mistake.” She swallows. “I've never told anyone that. Not even Tessa.”",
        effects: ['rel nima trust 4', 'set nima_voice_hint'],
        next: 'hub',
      },
      hook_f: {
        speaker: 'comp:nima',
        text: "“Fire doesn't talk!” Nima says, much too loudly. “That would be mad. I'm not mad. I'm just enthusiastic.” She snuffs the flame out between two fingers and doesn't relight it.",
        next: 'hub',
      },
      deep: {
        speaker: 'comp:nima',
        text: "Nima doesn't answer straight away, which for Nima is like anyone else not answering for an hour. “Not dying. Not monsters. Not even the Conclave.” She lets a flame bloom in her palm, beautiful and bright. “This. Doing it again. Somebody I love standing too close when it goes wrong.”",
        next: 'deep2',
      },
      deep2: {
        speaker: 'comp:nima',
        text: "“My dad pulled me out of the fire. I was the fire. He pulled me out anyway.” Her voice cracks. “Sometimes I think the bravest thing I could do is never use it again. Then I think about never feeling it again and I want to scream.”",
        options: [
          { text: "You don't have to choose between careful and yourself. We'll learn it together.", tone: 'compassionate', tags: ['protect'], effects: ['rel nima trust 5', 'rel nima affection 5', 'memory nima 3 You said we would learn my fire together.', 'set talk_nima_deep'], next: 'deep_together' },
          { text: "Your father pulled you out because you're worth it. Go and see him, when this is done.", tone: 'friendly', tags: ['mercy'], effects: ['rel nima trust 4', 'rel nima affection 2', 'set talk_nima_deep', 'set nima_father_seed'], next: 'deep_father' },
          { text: "Then maybe you should stop using it. For everyone's sake.", tone: 'pragmatic', tags: ['caution'], effects: ['rel nima trust -5', 'rel nima affection -4', 'memory nima -3 You told me to stop using my fire.', 'set talk_nima_deep'], next: 'deep_bad' },
        ],
      },
      deep_together: {
        speaker: 'dm',
        text: "Nima stares at you. Then she throws her arms around you so hard you both nearly topple off the bed. She smells of smoke and cinnamon. “Okay,” she says into your shoulder. “Okay. Together. You're stuck with me now. I'm very sticky.”",
        next: 'hub',
      },
      deep_father: {
        speaker: 'comp:nima',
        text: "“See him?” The flame in her hand flickers. “He'd... I don't know what he'd do.” She closes her fist and the fire goes out. “Maybe. If you came. Not to hold my hand. Just to stand nearby.”",
        next: 'hub',
      },
      deep_bad: {
        speaker: 'comp:nima',
        text: "Nima's face crumples and rebuilds itself into a grin so fast it's like watching glass shatter backward. “Sure! Great idea. I'll take up knitting.” She hops up. “I'm going to see if Tobin has pie. Don't follow me.”",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════════ ORREN
  {
    id: 'camp_orren',
    title: 'Orren, carving',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: '!bell_rang', text: "Orren sits in the corner by the window, carving something small out of a length of birch. The shavings fall into a neat pile in his lap. He doesn't waste any." },
          { if: 'bell_rang && !prologue_complete', text: "Orren is crouched by the door with one ear tilted toward it. He holds up a finger: wait. After a moment, satisfied with whatever he heard or didn't, he lowers it." },
          { if: 'prologue_complete', text: "Orren has propped the window open to the night. There's a cup of water on the sill and a seed set in a pinch of soil. He's watching it as if he expects it to say something." },
        ],
        next: 'hub',
      },
      hub: {
        speaker: 'comp:orren',
        text: [
          { if: '!bell_rang', text: "Orren nods at the floor beside him. “Sit.”" },
          { if: 'bell_rang && !prologue_complete', text: "“Quiet out there. Too quiet. Talk, if you want.”" },
          { if: 'prologue_complete', text: "“Fire's good. Company's good. Ask.”" },
        ],
        options: [
          { text: "Who are you, really?", tone: 'curious', once: true, effects: ['set talk_orren_intro'], next: 'intro' },
          { text: "What did the bell sound like to you?", if: 'bell_rang', tone: 'curious', once: true, effects: ['set talk_orren_bell'], next: 'bell' },
          { text: "You looked hard at the cathedral walls.", if: 'visited:cathedral', tone: 'curious', once: true, effects: ['set talk_orren_cathedral'], next: 'cathedral' },
          { text: "Long night. How are you?", if: 'prologue_complete', tone: 'compassionate', once: true, effects: ['set talk_orren_ending'], next: 'ending' },
          { text: "Your hand hasn't left your pocket since the bell rang.", if: 'bell_rang', tone: 'curious', once: true, effects: ['set talk_orren_hook'], next: 'hook' },
          { text: "What scares you, Orren?", if: 'trust:orren>=15', lockedText: "He'd just shrug. He needs to trust you more.", tone: 'compassionate', once: true, next: 'deep' },
          { text: "Goodnight, Orren.", tone: 'leave', end: true },
        ],
      },
      intro: {
        speaker: 'comp:orren',
        text: "Orren considers the question longer than most people would. “Orren Mossward. Path-warden. Whispering Woods. Like my grandmother.” He turns the carving. “Woods have been growing new paths. Every one points here. So I came.”",
        options: [
          { text: "That's it? That's the whole story?", tone: 'sarcastic', tags: ['humor'], effects: ['rel orren affection 1'], next: 'intro_short' },
          { text: "How do you read a forest that's changing?", if: 'class:ranger || bg:outlander', tone: 'class', tags: ['nature'], effects: ['rel orren respect 3'], next: 'intro_ranger' },
          { text: "Tell me about your grandmother.", tone: 'curious', effects: ['rel orren trust 2'], next: 'intro_gran' },
          { text: "Trees, paths, birds. Do you ever talk about anything else?", tone: 'sarcastic', effects: ['rel orren affection -2'], next: 'intro_rude' },
        ],
      },
      intro_short: {
        speaker: 'comp:orren',
        text: "“Mostly.” A pause. The ghost of a smile. “Long stories scare the birds.”",
        next: 'hub',
      },
      intro_ranger: {
        speaker: 'comp:orren',
        text: "Orren looks up properly, pleased in his quiet way. “Same as always. Slowly. Moss still grows on the shady side. Water still runs down. When those lie, you worry.” He goes back to carving. “Moss hasn't lied yet.”",
        next: 'hub',
      },
      intro_gran: {
        speaker: 'comp:orren',
        text: "“Hesk Mossward. Walked every path in the Woods. Said there was one more she never found. The Old Path.” He blows dust off the carving. “Said it didn't go somewhere. Went somewhen.” A shrug. “She told stories. Most were true.”",
        next: 'hub',
      },
      intro_rude: {
        speaker: 'dm',
        text: "Orren regards you mildly. “Sometimes. When it's worth it.” He returns to his carving. It's clear the conversation has been weighed and found light.",
        next: 'hub',
      },
      bell: {
        speaker: 'comp:orren',
        text: "“Bell rang. Birds went quiet. All of them. At once.” Orren sets down his knife. “Never heard that. Not in a storm. Not in a fire.”",
        next: 'bell2',
      },
      bell2: {
        speaker: 'comp:orren',
        text: [
          { if: 'rescued_count>=2', text: "“You brought people back out of the fog. Like lambs out of a snowdrift.” He nods once. “Good work. Hard work.”" },
          { if: 'rescued_count<2', text: "“Some didn't come back. Fog took them like the tide takes a footprint.” He looks at the window. “Maybe they're somewhere. Maybe not.”" },
        ],
        next: 'hub',
      },
      cathedral: {
        speaker: 'comp:orren',
        text: "“Ivy on the walls. Eighty years growing. Stops in a line, like it hit a fence.” His hand drifts to his coat pocket, absently. “Ground under that church is old. Older than the Woods. Hums like a hive.”",
        options: [
          { text: "What do you think is down there?", tone: 'curious', tags: ['curiosity'], next: 'cath_down' },
          { text: "Ivy has opinions now?", tone: 'sarcastic', tags: ['humor'], effects: ['rel orren affection 1'], next: 'cath_humor' },
        ],
      },
      cath_down: {
        speaker: 'comp:orren',
        text: "“Something that holds. Like a root holds a hill.” He frowns. “And somebody's been digging at the root.”",
        next: 'hub',
      },
      cath_humor: {
        speaker: 'comp:orren',
        text: "“Ivy always had opinions,” Orren says gravely. “Most people just don't ask.”",
        next: 'hub',
      },
      ending: {
        speaker: 'comp:orren',
        text: "Orren is quiet a while. “You touched it. The light in the vault. I saw you. Looked like a tree on the first warm day. Waking up.”",
        next: 'ending_lira',
      },
      ending_lira: {
        speaker: 'comp:orren',
        text: [
          { if: 'lira_fate=anchored', text: "“And the girl. You held her. Like holding a seedling in a flood.” He nods slowly. “Cost you. Roots always cost.”" },
          { if: 'lira_fate=faded', text: "“And the girl went. Like leaves in autumn.” A long pause. “Leaves fall. Feed the roots. Maybe she's feeding something.”" },
          { if: 'lira_fate=bottled', text: "“And the girl. Kept in between. Like a seed in a jar.” Orren's brow creases. “Seeds want soil. Remember that.”" },
          { if: '!lira_fate', text: "“And the boy was right. Children notice. Like dogs notice weather.”" },
        ],
        next: 'ending_corvin',
      },
      ending_corvin: {
        speaker: 'comp:orren',
        text: [
          { if: 'corvin_fate=handed_over', text: "“The digger's in a cage now.” Orren shakes his head slowly. “Caged things learn nothing but cages.”" },
          { if: 'corvin_fate=freed', text: "“You let the digger go. Good. Let him learn to listen before he digs.”" },
          { if: 'corvin_fate=ally', text: "“The digger walks with us. Fine. I'll teach him where not to put a shovel.”" },
          { if: 'corvin_fate=killed', text: "“The digger's dead.” Orren looks at his hands. “Didn't need to be. I think.”" },
          { if: '!corvin_fate', text: "“The digger's out there somewhere. Hope he's learned.”" },
        ],
        next: 'hub',
      },
      hook: {
        speaker: 'comp:orren',
        text: "Orren's hand stays exactly where it is. “Habit.”",
        options: [
          { text: "(Insight) That's not habit. He's protecting something.", tone: 'curious', check: { skill: 'insight', dc: 14, who: 'player', advIf: 'class:ranger' }, success: 'hook_s', failure: 'hook_f' },
          { text: "Fair enough. Everyone's got their habits.", tone: 'friendly', tags: ['caution'], effects: ['rel orren trust 2'], next: 'hook_respect' },
        ],
      },
      hook_s: {
        speaker: 'dm',
        text: "Orren meets your eyes for a long, measuring moment, the way he'd watch a deer deciding whether to bolt. Then, very slowly, he takes his hand out of his pocket. Empty. But the cloth where it rested is faintly, impossibly warm, and for a breath you smell green leaves in spring. “Something my grandmother gave me,” he says. “It woke up when the bell rang. That's all. For now.” He puts his hand back. “Later. Maybe.”",
        effects: ['set orren_acorn_hint', 'rel orren trust 3'],
        next: 'hub',
      },
      hook_f: {
        speaker: 'comp:orren',
        text: "“Cold hands,” Orren says simply, and that's the end of it.",
        next: 'hub',
      },
      hook_respect: {
        speaker: 'comp:orren',
        text: "Orren relaxes a fraction. “Thank you,” he says. You're not sure what for. He seems to think you are.",
        next: 'hub',
      },
      deep: {
        speaker: 'comp:orren',
        text: "Orren puts the carving down. It's a little owl, you see now, half-finished. “Woods are a book. Grandmother taught me to read it. Every track. Every broken twig. I've never been lost.” He turns the owl over. “Last month I walked a path I've walked a hundred times. Came out somewhere I'd never been.”",
        next: 'deep2',
      },
      deep2: {
        speaker: 'comp:orren',
        text: "“If the Woods become something I can't read...” He stops. Starts again. “Then I'm just a small man in a big dark. Like everyone else.”",
        options: [
          { text: "Then we'll learn to read it again. Together.", tone: 'compassionate', tags: ['nature'], effects: ['rel orren trust 5', 'rel orren affection 4', 'memory orren 3 You said we would learn to read the new woods together.', 'set talk_orren_deep'], next: 'deep_kind' },
          { text: "You're the most careful listener I've ever met. That still counts in the dark.", tone: 'friendly', tags: ['caution'], effects: ['rel orren trust 4', 'rel orren respect 3', 'set talk_orren_deep'], next: 'deep_listen' },
          { text: "Woods change. Get used to it.", tone: 'pragmatic', effects: ['rel orren trust -4', 'rel orren affection -3', 'memory orren -2 You told me to get used to losing the woods.', 'set talk_orren_deep'], next: 'deep_bad' },
        ],
      },
      deep_kind: {
        speaker: 'dm',
        text: "Orren looks at you for a long moment. Then he holds out the half-finished owl. “For you. When it's done.” He takes it back, gently. “When it's done.”",
        next: 'hub',
      },
      deep_listen: {
        speaker: 'dm',
        text: "Orren's ears go faintly pink. “Hm.” He resumes carving, a little faster. “Hm.” You think it might be the happiest you've ever seen him.",
        next: 'hub',
      },
      deep_bad: {
        speaker: 'comp:orren',
        text: "Orren nods slowly. “Yes,” he says. “People too.” He goes back to his carving and doesn't speak again.",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════════ ILYRA
  {
    id: 'camp_ilyra',
    title: 'Ilyra, with tea',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: '!bell_rang', text: "Ilyra sits by the fire with an unlit lantern in her lap, turning it slowly so its paper sides catch the light. She has been about to light it for some time." },
          { if: 'bell_rang && !prologue_complete', text: "Ilyra is rolling bandages with quick, practised hands, a pot of willow-bark tea steaming beside her. She has clearly already treated half the inn. She pours you a cup without asking." },
          { if: 'prologue_complete', text: "Ilyra is reading a letter by the fire. She folds it very small when you come in and tucks it into her sleeve. Then she smiles at you, and it's a real smile, if a tired one." },
        ],
        next: 'hub',
      },
      hub: {
        speaker: 'comp:ilyra',
        text: [
          { if: '!bell_rang', text: "“Sit with me. I'm told I'm very restful. Mostly by the dying, but still.”" },
          { if: 'bell_rang && !prologue_complete', text: "“Drink the tea. It tastes terrible; that's how you know it works. Now. What's on your mind?”" },
          { if: 'prologue_complete', text: "“Come in, {player}. There's always room by a hearth.”" },
        ],
        options: [
          { text: "Who are you, really?", tone: 'curious', once: true, effects: ['set talk_ilyra_intro'], next: 'intro' },
          { text: "The bell. The fog. The people waking up wrong.", if: 'bell_rang', tone: 'compassionate', once: true, effects: ['set talk_ilyra_bell'], next: 'bell' },
          { text: "I saw you light a candle in the cathedral.", if: 'visited:cathedral', tone: 'curious', once: true, effects: ['set talk_ilyra_cathedral'], next: 'cathedral' },
          { text: "Tell me honestly. How do I look?", if: 'prologue_complete', tone: 'friendly', once: true, effects: ['set talk_ilyra_ending'], next: 'ending' },
          { text: "You keep reading that letter.", if: 'bell_rang || prologue_complete', tone: 'curious', once: true, effects: ['set talk_ilyra_hook'], next: 'hook' },
          { text: "Do you ever doubt? Your faith, I mean.", if: 'trust:ilyra>=15', lockedText: "She'd answer kindly and say nothing. She needs to trust you more.", tone: 'compassionate', once: true, next: 'deep' },
          { text: "Thank you for the tea, Ilyra.", tone: 'leave', end: true },
        ],
      },
      intro: {
        speaker: 'comp:ilyra',
        text: "“Ilyra Voss. Priestess of Veyra the Weaver, from Solmara. I keep a hospice there.” She sets down the lantern. “For the returned dead, mostly. The ones who come back carrying memories of lives they never lived. Someone has to sit with them, and it turns out I'm very good at sitting.”",
        options: [
          { text: "That must be hard.", tone: 'compassionate', tags: ['mercy'], effects: ['rel ilyra affection 2'], next: 'intro_hard' },
          { text: "A fellow servant of the Lights. What brings you so far from the cities?", if: 'class:cleric', tone: 'class', tags: ['faith'], effects: ['rel ilyra respect 2', 'rel ilyra affection 2'], next: 'intro_cleric' },
          { text: "Why come to Hollowmere?", tone: 'curious', effects: ['rel ilyra trust 2'], next: 'intro_why' },
          { text: "The returned dead. Are they even people?", tone: 'pragmatic', effects: ['rel ilyra agreement -2'], next: 'intro_people' },
        ],
      },
      intro_hard: {
        speaker: 'comp:ilyra',
        text: "“It's hard the way gardening is hard. Your back aches and your hands are dirty and sometimes things die anyway.” She smiles. “And sometimes something blooms that you never planted. I wouldn't trade it.”",
        next: 'hub',
      },
      intro_cleric: {
        speaker: 'comp:ilyra',
        text: "“A sister of the cloth! Thank goodness. I've been dying to complain about liturgy to someone who'll understand.” She leans in, conspiratorial. “The third verse of the Spindle Hymn is unsingable. You know it is.”",
        next: 'hub',
      },
      intro_why: {
        speaker: 'comp:ilyra',
        text: "Ilyra looks down at the lantern. “To light this. For someone.” A small, embarrassed laugh. “I just can't remember who. Isn't that absurd? I came all this way to light a lantern for a name I don't have.”",
        next: 'hub',
      },
      intro_people: {
        speaker: 'comp:ilyra',
        text: "Ilyra's smile doesn't falter, but something behind it sharpens. “They eat. They weep. They ask for their mothers in the night.” She picks up her tea. “I've never found a better definition. Have you?”",
        next: 'hub',
      },
      bell: {
        speaker: 'comp:ilyra',
        text: "“A town waking up with the wrong memories.” Ilyra's hands go still on the bandages. “I see this every week, {player}. One person at a time, in a quiet room. I've never seen a whole town of it.”",
        next: 'bell2',
      },
      bell2: {
        speaker: 'comp:ilyra',
        text: [
          { if: 'rescued_count>=2', text: "“And you brought people back. I tended a few of them. One kept asking who'd carried him, so he could say thank you.” She smiles. “I told him a stubborn friend of mine.”" },
          { if: 'rescued_count<2', text: "“There are people still out there. I keep thinking I should light a lantern for each of them. I'm running out of lanterns.”" },
        ],
        next: 'hub',
      },
      cathedral: {
        speaker: 'comp:ilyra',
        text: "“At the seventh niche.” Ilyra says it the way someone confesses a small theft. “The empty one. We're not supposed to. But it seemed so lonely, all those centuries, everyone pretending it isn't there.”",
        options: [
          { text: "Who do you think the seventh is?", tone: 'curious', tags: ['curiosity'], effects: ['rel ilyra trust 2'], next: 'cath_who' },
          { text: "Rules exist for a reason.", tone: 'pragmatic', tags: ['tradition'], effects: ['rel ilyra agreement -1'], next: 'cath_rules' },
        ],
      },
      cath_who: {
        speaker: 'comp:ilyra',
        text: "“I don't know. Nobody does. That's rather the point, I suppose.” She considers. “But if I were a goddess nobody was allowed to name, I think I'd be very tired. And very lonely. And grateful for one small candle.”",
        next: 'hub',
      },
      cath_rules: {
        speaker: 'comp:ilyra',
        text: "“They do,” Ilyra agrees placidly. “Usually the reason is that someone was frightened, once. I just like to check whether they still need to be.”",
        next: 'hub',
      },
      ending: {
        speaker: 'comp:ilyra',
        text: "Ilyra studies you with a healer's look, checking for fever. “Tired. Pale. Something behind the eyes that wasn't there yesterday. You touched the Heart, and it touched back.” She presses a cup into your hands. “How do you feel? Truly. Not the brave answer.”",
        next: 'ending_lira',
      },
      ending_lira: {
        speaker: 'comp:ilyra',
        text: [
          { if: 'lira_fate=anchored', text: "“And Lira. You gave her back to the world, and it cost you. I saw you sway.” Her voice is soft. “That was a holy thing, whatever the Church would say of it. Drink. You're paying for it still.”" },
          { if: 'lira_fate=faded', text: "“And Lira. You let her go gently.” Ilyra is quiet. “I've sat with so many at the end. When they're ready, letting go is the last kindness. I think she was ready. I hope she was.”" },
          { if: 'lira_fate=bottled', text: "“And Lira, held in between. Not alive, not at rest.” Ilyra's brow furrows. “I'd like to sit with her, sometime, if she can be sat with. No one should wait alone.”" },
          { if: '!lira_fate', text: "“And the little boy was right. I keep thinking of how many people told him he was lying. Grief deserves better witnesses.”" },
        ],
        next: 'ending_ysolt',
      },
      ending_ysolt: {
        speaker: 'comp:ilyra',
        text: [
          { if: 'ysolt_outcome=fought', text: "“And we fought the Seeker. I stitched what I could of us. I hope someone's stitching her, too.”" },
          { if: 'ysolt_outcome=persuaded', text: "“And you talked her down. No blood. You've no idea how much I love a night with no blood.”" },
          { if: 'ysolt_outcome=escaped', text: "“And we ran. Good. Running from a fight is underrated by people who've never had to bury anyone.”" },
          { if: '!ysolt_outcome', text: "“Others will come. I'll be here when they do, for whatever my being here is worth.”" },
        ],
        next: 'hub',
      },
      hook: {
        speaker: 'comp:ilyra',
        text: "Ilyra's hand goes to her sleeve. “Oh. Yes. Correspondence. A patient of mine, in Solmara. He writes every week.”",
        options: [
          { text: "(Insight) There's more to it than a patient.", tone: 'curious', check: { skill: 'insight', dc: 13, who: 'player' }, success: 'hook_s', failure: 'hook_f' },
          { text: "A patient who writes every week? That's devotion.", tone: 'friendly', next: 'hook_devotion' },
        ],
      },
      hook_s: {
        speaker: 'dm',
        text: "She is turning her bare ring finger with her thumb, round and round, as if worrying at a ring that isn't there. “He signs them ‘your husband,’” Ilyra says softly. “Tamsin. He came back three years ago remembering a whole life with me. Our wedding. Our house. A dog called Biscuit.” Her laugh is fragile. “I've never been married, {player}. And I read every letter twice.”",
        effects: ['rel ilyra trust 3', 'set ilyra_tamsin_hint'],
        next: 'hub',
      },
      hook_f: {
        speaker: 'comp:ilyra',
        text: "“Just a patient,” Ilyra says pleasantly, and tucks the letter away. Her smile is perfectly kind and perfectly closed.",
        next: 'hub',
      },
      hook_devotion: {
        speaker: 'comp:ilyra',
        text: "“Isn't it?” Ilyra says, a little too brightly. “Devotion. Yes.” She refills your cup, though it's still full.",
        next: 'hub',
      },
      deep: {
        speaker: 'comp:ilyra',
        text: "Ilyra laughs, warm and rueful. “Every day. Usually before breakfast.” She looks into her tea. “Doubt is part of faith, I think. If you never doubt, you aren't believing anything. You're just agreeing.”",
        next: 'deep2',
      },
      deep2: {
        speaker: 'comp:ilyra',
        text: "“But there's one doubt I can't put down.” Her voice drops. “At the very end, they ask me things I can't answer. Where they're going. Whether it will hurt. Whether anyone will be there. And I pray with them, and I don't know who hears it. I'm afraid one day I'll learn my prayers go nowhere. Or that they go to someone cruel.”",
        options: [
          { text: "Your prayers reach me. Isn't that somewhere?", tone: 'compassionate', tags: ['faith'], effects: ['rel ilyra trust 5', 'rel ilyra affection 4', 'memory ilyra 3 You told me my prayers reached you.', 'set talk_ilyra_deep'], next: 'deep_kind' },
          { text: "If no one's listening, what you do matters even more. It's all yours.", tone: 'friendly', tags: ['honesty'], effects: ['rel ilyra trust 4', 'rel ilyra respect 4', 'set talk_ilyra_deep'], next: 'deep_honest' },
          { text: "Maybe the cruel one is the one answering. Ever think of that?", tone: 'sarcastic', effects: ['rel ilyra trust -5', 'rel ilyra affection -5', 'memory ilyra -3 You mocked my deepest fear.', 'set talk_ilyra_deep'], next: 'deep_bad' },
        ],
      },
      deep_kind: {
        speaker: 'comp:ilyra',
        text: "Ilyra goes very still. Then she reaches across and squeezes your hand. “That is terrible theology,” she says, “and the kindest thing anyone has said to me in a year.”",
        next: 'hub',
      },
      deep_honest: {
        speaker: 'comp:ilyra',
        text: "Ilyra considers it seriously, the way she considers everything. “That's frightening,” she says. “And a little freeing. Like walking down a stair without the bannister.” She nods slowly. “Thank you for not lying to make me feel better.”",
        next: 'hub',
      },
      deep_bad: {
        speaker: 'dm',
        text: "Ilyra's face goes very white. “Every night,” she says quietly. “Thank you for the reminder.” She gathers her bandages and goes to sit by the window with her back to the room.",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════════ VAREK
  {
    id: 'camp_varek',
    title: 'Varek, in the dark',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: '!bell_rang', text: "Varek has commandeered the only good chair and angled it toward the fire. He holds a cup of Tobin's wine as though it were a much better vintage, and his violet eyes catch the light like a cat's." },
          { if: 'bell_rang && !prologue_complete', text: "Varek sits in the dark with the candle unlit. His eyes glow faintly, enough to see by. Two fingers are pressed to his temple; he lowers them when you come in, as if caught at something." },
          { if: 'prologue_complete', text: "Varek stands at the window, watching the town settle. He doesn't turn when you enter, but he says your name before you've spoken, as though he'd been waiting." },
        ],
        next: 'hub',
      },
      hub: {
        speaker: 'comp:varek',
        text: [
          { if: '!bell_rang', text: "“Ah. Company. Come in, and try not to stare. Everyone does, the first time.”" },
          { if: 'bell_rang && !prologue_complete', text: "“Ask your questions. I'm in a generous mood. It won't last.”" },
          { if: 'prologue_complete', text: "“{player}. Sit. I find I don't mind your company nearly as much as I'd planned to.”" },
        ],
        options: [
          { text: "Who are you, really?", tone: 'curious', once: true, effects: ['set talk_varek_intro'], next: 'intro' },
          { text: "What did the bell do to you? You went pale.", if: 'bell_rang', tone: 'compassionate', once: true, effects: ['set talk_varek_bell'], next: 'bell' },
          { text: "You looked at those saints like they owed you something.", if: 'visited:cathedral', tone: 'curious', once: true, effects: ['set talk_varek_cathedral'], next: 'cathedral' },
          { text: "What did you feel, when I touched the Heart?", if: 'prologue_complete', tone: 'curious', once: true, effects: ['set talk_varek_ending'], next: 'ending' },
          { text: "You hum something, when you think no one's listening.", if: 'bell_rang', tone: 'curious', once: true, effects: ['set talk_varek_hook'], next: 'hook' },
          { text: "What do you want, Varek? Really.", if: 'trust:varek>=15', lockedText: "He'd answer with something clever and empty. He needs to trust you more.", tone: 'curious', once: true, next: 'deep' },
          { text: "You don't have to sit alone in the dark.", if: 'affection:varek>=25 && talk_varek_deep', tone: 'friendly', once: true, next: 'romance' },
          { text: "Goodnight, Varek.", tone: 'leave', end: true },
        ],
      },
      intro: {
        speaker: 'comp:varek',
        text: "“Varek Sable. Of Ashenford, originally, though Ashenford would prefer otherwise.” He gestures at his eyes. “Veilborn. You'll have noticed. Everyone notices. Some of them bring torches.”",
        options: [
          { text: "Tell me about your patron.", tone: 'curious', tags: ['forbidden'], effects: ['rel varek trust 1'], next: 'intro_patron' },
          { text: "I know about the torches. I've seen them too.", if: 'anc:veilborn', tone: 'background', effects: ['rel varek trust 4', 'rel varek affection 2'], next: 'intro_veilborn' },
          { text: "One pact-bound to another: who holds your leash?", if: 'class:warlock', tone: 'class', effects: ['rel varek respect 3'], next: 'intro_warlock' },
          { text: "(Insight) Why did you really come to Hollowmere?", tone: 'curious', check: { skill: 'insight', dc: 14, who: 'player' }, success: 'intro_insight_s', failure: 'intro_insight_f' },
        ],
      },
      intro_patron: {
        speaker: 'comp:varek',
        text: "“A choir,” Varek says. “And that is all I'll say about it, so please don't make me be rude.” He swirls his wine. “We have an arrangement. It sings; I listen. Some nights it's very loud.”",
        next: 'hub',
      },
      intro_veilborn: {
        speaker: 'comp:varek',
        text: "Varek's eyes meet yours, and something in them flickers: recognition, wary and raw. “Then you know,” he says simply. For a moment he isn't elegant at all, only tired. “It's good not to have to explain. Thank you.”",
        next: 'hub',
      },
      intro_warlock: {
        speaker: 'comp:varek',
        text: "Varek smiles, thin as a razor. “Nobody holds my leash. Some nights it holds me.” He tilts his cup toward you. “I won't ask about yours if you don't ask about mine. A fair trade between the damned.”",
        next: 'hub',
      },
      intro_insight_s: {
        speaker: 'dm',
        text: "He answers smoothly, something about old stone and idle curiosity, but you watch his hand. It has drifted back to his temple, and his eyes have slid, unfocused, toward the cathedral on the hill, the way a compass needle slides north. Whatever brought him here, he didn't choose it. It called.",
        effects: ['set varek_called_hint'],
        next: 'hub',
      },
      intro_insight_f: {
        speaker: 'comp:varek',
        text: "“I came for the festival,” Varek says. “Lanterns. Ale. Mobs. All my favourite things.” His smile gives away nothing whatsoever.",
        next: 'hub',
      },
      bell: {
        speaker: 'comp:varek',
        text: "“The bell.” Varek's mouth twists. “Do you know, when it rang, they stopped. The voices. For the length of one toll, perfect silence. I had never heard silence before.” He rubs his temple. “Then they began again. Louder.”",
        next: 'bell2',
      },
      bell2: {
        speaker: 'comp:varek',
        text: [
          { if: 'rescued_count>=2', text: "“And you went into that fog for strangers. Repeatedly.” He regards you with something like bafflement. “Some of the people you saved would have thrown stones at me a week ago. You'd have saved them anyway.” It isn't quite a question." },
          { if: 'rescued_count<2', text: "“Some of them didn't come back from the fog.” His voice is very even. “I know what it is to be forgotten by everyone around you. I hope it's quicker for them.”" },
        ],
        next: 'hub',
      },
      cathedral: {
        speaker: 'comp:varek',
        text: "“Six saints in a row, all very serene.” Varek's lip curls. “When I was seven, a mob tried to drown me in a river in the name of one of them. Which one, do you suppose? I never thought to ask while I was under.”",
        options: [
          { text: "I'm sorry that happened to you.", tone: 'compassionate', tags: ['mercy'], effects: ['rel varek affection 3'], next: 'cath_sorry' },
          { text: "The Lights didn't do that. People did.", tone: 'diplomatic', tags: ['faith'], effects: ['rel varek agreement -1'], next: 'cath_faith' },
          { text: "Then let's make them regret it.", tone: 'aggressive', tags: ['defiance'], effects: ['rel varek agreement 2'], next: 'cath_defy' },
        ],
      },
      cath_sorry: {
        speaker: 'comp:varek',
        text: "Varek waves a hand, too quickly. “A long time ago. A fisherman pulled me out. I've been fond of fishermen ever since. Nobody else.” A pause. “...Thank you,” he says, as if the words belong to a language he's rusty in.",
        next: 'hub',
      },
      cath_faith: {
        speaker: 'comp:varek',
        text: "“A distinction that matters a great deal to theologians,” Varek says, “and not at all to drowning children.” But he looks at you a moment longer than he needs to. “Still. You believe it. That's something.”",
        next: 'hub',
      },
      cath_defy: {
        speaker: 'comp:varek',
        text: "Varek laughs, a low, startled sound. “Oh, I like you. That's very inconvenient.”",
        next: 'hub',
      },
      ending: {
        speaker: 'comp:varek',
        text: "Varek is quiet a long moment. “When you touched it, they... the Choir... it was like a held breath. All those voices, waiting.” He turns from the window. His eyes are brighter than usual. “I don't know what that means. I dislike not knowing.”",
        next: 'ending_corvin',
      },
      ending_corvin: {
        speaker: 'comp:varek',
        text: [
          { if: 'corvin_fate=handed_over', text: "“The Unbound scholar in chains. The watch will hand him on to someone with a grander title, and he'll disappear very politely.” Varek's mouth thins. “I know how that goes.”" },
          { if: 'corvin_fate=freed', text: "“You let the scholar go. Good. The world needs more people asking forbidden questions, and fewer hanging them for it.”" },
          { if: 'corvin_fate=ally', text: "“The Unbound scholar is ours, it seems. Useful. The Unbound have the best maps of places that don't exist.”" },
          { if: 'corvin_fate=killed', text: "“The scholar is dead.” Varek sips his wine. “Efficient, I suppose. I'd have preferred him owing us.”" },
          { if: '!corvin_fate', text: "“That Unbound scholar slipped the net, I hear. Good for him.”" },
        ],
        next: 'ending_ysolt',
      },
      ending_ysolt: {
        speaker: 'comp:varek',
        text: [
          { if: 'ysolt_outcome=fought', text: "“And we bloodied a Seeker. The Conclave will want you now, and not politely.” A thin smile. “Welcome to the life of the hunted. The food is terrible but the company improves.”" },
          { if: 'ysolt_outcome=persuaded', text: "“And you talked a Conclave Seeker out of her prize. Do you know how rare that is? I've seen them take a child for having the wrong eyes.”" },
          { if: 'ysolt_outcome=escaped', text: "“And we ran. Sensible. Never fight on ground your enemy chose.”" },
          { if: '!ysolt_outcome', text: "“They'll come for you. All of them. You've become the most interesting thing on the continent.” He raises his cup. “My condolences.”" },
        ],
        next: 'hub',
      },
      hook: {
        speaker: 'comp:varek',
        text: "Varek freezes with his cup halfway to his lips. “I do not hum.”",
        options: [
          { text: "Descending, then a little turn. Over and over.", tone: 'curious', tags: ['curiosity'], effects: ['rel varek trust 3', 'set varek_choir_hint'], next: 'hook_tune' },
          { text: "It was nice. Whatever it was.", tone: 'friendly', effects: ['rel varek affection 2'], next: 'hook_nice' },
        ],
      },
      hook_tune: {
        speaker: 'comp:varek',
        text: "He sets the cup down very carefully. “It's... theirs,” he says at last. “The Choir's. Sometimes it gets into me like a song you can't stop thinking of.” His jaw tightens. “The closer I came to this town, the louder they sang. I came to find out why. That's the truth. Make of it what you like.”",
        next: 'hub',
      },
      hook_nice: {
        speaker: 'comp:varek',
        text: "Varek looks at you as though you'd complimented a scar. “...Nice,” he repeats. “Nobody has ever—” He stops. “Never mind. Thank you.”",
        next: 'hub',
      },
      deep: {
        speaker: 'comp:varek',
        text: "“Want.” Varek turns his cup slowly. “I want to be someone who can't be erased. Not by a mob, not by a river, not by a crumbling Veil or a god or a Seeker with a ledger.” His eyes glow faintly in the dim room. “I want to matter so much that the world has to remember me, whether it likes me or not.”",
        next: 'deep2',
      },
      deep2: {
        speaker: 'comp:varek',
        text: "“And sometimes,” he says, much more quietly, “I'm afraid the price of that is becoming one more voice in a choir. Loud, and eternal, and no longer me.”",
        options: [
          { text: "You already matter. To me. That's a start.", tone: 'compassionate', effects: ['rel varek trust 5', 'rel varek affection 5', 'memory varek 3 You told me I already mattered.', 'set talk_varek_deep'], next: 'deep_kind' },
          { text: "Then don't hand yourself to anyone. Not the Choir, not anyone. Stay you.", tone: 'friendly', tags: ['defiance'], effects: ['rel varek trust 4', 'rel varek respect 4', 'set talk_varek_deep'], next: 'deep_defy' },
          { text: "Power at any cost. That's how monsters are made.", tone: 'aggressive', effects: ['rel varek trust -6', 'rel varek affection -4', 'memory varek -3 You called me a monster.', 'set talk_varek_deep'], next: 'deep_bad' },
        ],
      },
      deep_kind: {
        speaker: 'comp:varek',
        text: "Varek opens his mouth for something cutting, and nothing comes out. He looks away. “That's a very dangerous thing to say to a warlock,” he manages at last. “We collect debts.” A pause. “...I'll keep it. Somewhere safe.”",
        next: 'hub',
      },
      deep_defy: {
        speaker: 'comp:varek',
        text: "“Stay me.” He laughs softly. “You make it sound simple.” He considers you over the rim of his cup. “Perhaps it is, with someone watching who'd notice the difference.”",
        next: 'hub',
      },
      deep_bad: {
        speaker: 'comp:varek',
        text: "“Ah.” Varek's face smooths into perfect, polite blankness. “There it is. I wondered how long it would take.” He rises and bows, flawlessly. “Goodnight. Do bolt your door. Monsters, you know.”",
        end: true,
      },
      romance: {
        speaker: 'dm',
        text: "Varek's eyes find you in the dimness, two soft violet lights. “I'm rarely alone,” he says. “That's rather the problem.” Then, almost too low to hear: “But I wouldn't mind a voice I chose.”",
        options: [
          { text: "Then choose mine.", tone: 'friendly', effects: ['rel varek affection 5', 'set romance_varek_hint'], next: 'romance_yes' },
          { text: "I'll light the candle. For both of us.", tone: 'diplomatic', next: 'romance_no' },
        ],
      },
      romance_yes: {
        speaker: 'dm',
        text: "He is silent a long moment. Then he reaches out and, very lightly, touches the back of your hand with his fingertips, as if checking that you're real. “Chosen,” he murmurs. In the dark his eyes are the only light, and they don't look away.",
        end: true,
      },
      romance_no: {
        speaker: 'dm',
        text: "You light the candle. Varek watches the flame catch and, after a moment, smiles. A small, real one. “Thank you,” he says, and it seems to be for more than the light.",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════════ TESSA
  {
    id: 'camp_tessa',
    title: 'Tessa, between songs',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: '!bell_rang', text: "Tessa sits cross-legged on her bed with her lute in her lap and her songbook open beside her, trying a phrase, crossing it out, trying again. She waves you in with the neck of the lute." },
          { if: 'bell_rang && !prologue_complete', text: "Tessa is strumming the same three chords over and over, too softly to carry to the next room. When you come in she stops mid-chord and puts on a smile like a costume." },
          { if: 'prologue_complete', text: "Tessa is scribbling in her songbook by candlelight, ink on her fingers and a quill behind her ear. “Don't look! It's not finished. Nothing's ever finished. Actually, look. I need a rhyme for ‘Bellwarden.’”" },
        ],
        next: 'hub',
      },
      hub: {
        speaker: 'comp:tessa',
        text: [
          { if: '!bell_rang', text: "“Come in, come in! An audience of one, my favourite size. What'll it be?”" },
          { if: 'bell_rang && !prologue_complete', text: "“Talk to me, {player}. I need someone to talk over the quiet.”" },
          { if: 'prologue_complete', text: "“Go on. Ask me anything. I'll answer at least half of it truthfully.”" },
        ],
        options: [
          { text: "Who are you, really?", tone: 'curious', once: true, effects: ['set talk_tessa_intro'], next: 'intro' },
          { text: "You must have opinions about that brawl.", if: 'brawl_resolved', tone: 'friendly', once: true, effects: ['set talk_tessa_brawl'], next: 'brawl' },
          { text: "You went pale when the bell rang.", if: 'bell_rang', tone: 'compassionate', once: true, effects: ['set talk_tessa_bell'], next: 'bell' },
          { text: "What happened when you sang in the cathedral?", if: 'visited:cathedral', tone: 'curious', once: true, effects: ['set talk_tessa_cathedral'], next: 'cathedral' },
          { text: "So. How does the ballad end?", if: 'prologue_complete', tone: 'friendly', once: true, effects: ['set talk_tessa_ending'], next: 'ending' },
          { text: "That page in your songbook. The one that matches the bell.", if: 'bell_rang', tone: 'curious', once: true, effects: ['set talk_tessa_hook'], next: 'hook' },
          { text: "What scares you, Tessa?", if: 'trust:tessa>=15', lockedText: "She'd answer with a joke. She needs to trust you more.", tone: 'compassionate', once: true, next: 'deep' },
          { text: "Play me something. Something just for me.", if: 'affection:tessa>=25 && talk_tessa_deep', tone: 'friendly', once: true, next: 'romance' },
          { text: "Goodnight, Tessa. Break a string.", tone: 'leave', end: true },
        ],
      },
      intro: {
        speaker: 'comp:tessa',
        text: "“Tessa Quickthorn! Lead player, lutenist, collector of songs nobody knows the origin of.” A quick flourish. “Of the Quickthorn Wandering Company, formerly. We, ah. Disbanded.” Another flourish, a little too fast. “Creative differences. Booked to close the Festival tonight. Solo. Very modern.”",
        options: [
          { text: "Disbanded? What happened?", tone: 'curious', next: 'intro_company' },
          { text: "(Insight) ‘Disbanded’ came out a little too smoothly.", tone: 'curious', check: { skill: 'insight', dc: 14, who: 'player' }, success: 'intro_insight_s', failure: 'intro_insight_f' },
          { text: "One performer to another: what's in the songbook?", if: 'class:bard || bg:entertainer', tone: 'class', tags: ['curiosity'], effects: ['rel tessa affection 3', 'rel tessa respect 2'], next: 'intro_bard' },
          { text: "Do you ever stop performing?", tone: 'sarcastic', effects: ['rel tessa affection -2'], next: 'intro_perform' },
        ],
      },
      intro_company: {
        speaker: 'comp:tessa',
        text: "“Oh, you know. Players. Tempers. Somebody wanted more comedy, somebody wanted more tragedy, somebody wanted more pay.” She laughs. “Next question! I'm far more interesting than ancient history.”",
        next: 'hub',
      },
      intro_insight_s: {
        speaker: 'dm',
        text: "Her fingers never stop moving on the strings, but you notice what she's playing under the chatter. A lullaby. Gnomish, old. The kind of thing you'd sing to a child, or to people you missed so much you couldn't say their names aloud.",
        effects: ['set tessa_company_hint'],
        next: 'hub',
      },
      intro_insight_f: {
        speaker: 'comp:tessa',
        text: "“Creative differences,” Tessa repeats, beaming, and she says it so well you almost believe she believes it.",
        next: 'hub',
      },
      intro_bard: {
        speaker: 'comp:tessa',
        text: "Tessa's eyes light up. “Finally, someone who'll appreciate it!” She spins the book around. “Songs with no origin. Melodies that turn up everywhere: a fishing shanty in the Isles, a dwarf work-song, an elven lament, all the same tune. Nobody wrote them. Nobody remembers who did.” She hugs the book. “I'm going to find out. And then I'm going to write the song they all came from.”",
        next: 'hub',
      },
      intro_perform: {
        speaker: 'comp:tessa',
        text: "Tessa's smile doesn't slip; she's far too good for that. “Darling,” she says lightly, “if I stopped performing, what would be left?” Then she plays a bright little tune, and the moment is gone as if it never was.",
        next: 'hub',
      },
      brawl: {
        speaker: 'comp:tessa',
        text: [
          { if: 'brawl_outcome=talked', text: "“You talked a whole tavern out of a brawl! Do you know how hard that is? I've seen professional diplomats take a chair to the head for less.”" },
          { if: 'brawl_outcome=intimidated', text: "“You glared a tavern into silence. Very dramatic. A bit much for a festival night, maybe, but very dramatic.”" },
          { if: 'brawl_outcome=fought', text: "“Fists and flying tankards! Very traditional. I've already got four verses and a chorus that goes ‘and the table went OVER.’”" },
          { if: 'brawl_outcome=performed', text: "“You PERFORMED your way out of a brawl!” Tessa clutches her heart. “I've been doing this twenty years and never once managed that. I'm so jealous I could bite my lute.”" },
          { if: '!brawl_outcome', text: "“A tavern brawl on festival night. Practically a tradition. I'd have played chase music if I'd had my lute.”" },
        ],
        next: 'hub',
      },
      bell: {
        speaker: 'comp:tessa',
        text: "Tessa's fingers go still on the strings. “It played a tune, {player}. Did you notice? Not just tolling. A pattern.” For a moment she doesn't sound like a performer at all. She closes the songbook, carefully. “It's in here. One of the songs with no origin.”",
        next: 'bell2',
      },
      bell2: {
        speaker: 'comp:tessa',
        text: [
          { if: 'rescued_count>=2', text: "“And you went into the fog for people. I counted. I always count; performer's habit. Every one of them is going to tell their children about it.” She smiles. “I'll make sure they get the details right.”" },
          { if: 'rescued_count<2', text: "“And some people are just... gone. Into the quiet.” Her voice catches, only slightly. “I hate the quiet. Did I ever tell you that?”" },
        ],
        next: 'hub',
      },
      cathedral: {
        speaker: 'comp:tessa',
        text: "“The acoustics in that ruin! I sang one note and the walls sang back. A harmony I didn't make.” She rubs her arms. “Music is supposed to come from someone. That didn't come from anyone. Or it came from someone I couldn't see.”",
        options: [
          { text: "Maybe someone was listening.", tone: 'curious', tags: ['curiosity'], effects: ['rel tessa trust 1'], next: 'cath_listen' },
          { text: "Write a song about it. It'll be a hit.", tone: 'friendly', tags: ['humor'], effects: ['rel tessa affection 1'], next: 'cath_song' },
        ],
      },
      cath_listen: {
        speaker: 'comp:tessa',
        text: "“Listening. Yes.” Tessa looks down at her songbook. “Some songs are knocks on a door, you know. You never know who'll answer.” She laughs, a beat too late. “Listen to me! So gothic. I should write that down.”",
        next: 'hub',
      },
      cath_song: {
        speaker: 'comp:tessa',
        text: "“Oh, I am. ‘The Echo in the Nave.’ Minor key. Very moody.” She grins. “Everyone will say they hate it, and everyone will hum it on the road for a month.”",
        next: 'hub',
      },
      ending: {
        speaker: 'comp:tessa',
        text: "“We did it! Bell-monster, glowing vault, magic rock, Conclave villain. That's a whole cycle of ballads. That's a career!” Tessa beams. Then she sees your face and her voice softens. “...And it was terrible, and you're tired. I know. I'm doing the thing. Sorry.”",
        next: 'ending_lira',
      },
      ending_lira: {
        speaker: 'comp:tessa',
        text: [
          { if: 'lira_fate=anchored', text: "“And Lira! You sang her back. Well, not sang. But that's how I'll write it.” Tessa's eyes are wet. “Pell gets his sister. Do you know how few songs end like that?”" },
          { if: 'lira_fate=faded', text: "“And Lira.” Tessa looks down at her strings. “There are songs for people who fade. They're the oldest kind. I'll write her one, so somebody remembers how she laughed.”" },
          { if: 'lira_fate=bottled', text: "“And Lira, held in between, like a note you never resolve.” Tessa frowns. “Unresolved notes want to go somewhere. Don't forget her, {player}.”" },
          { if: '!lira_fate', text: "“And Pell. The boy everyone called a liar was the only one remembering properly. That's going in the song. That's the whole song, really.”" },
        ],
        next: 'ending_ysolt',
      },
      ending_ysolt: {
        speaker: 'comp:tessa',
        text: [
          { if: 'ysolt_outcome=fought', text: "“And the Seeker fight! Very rousing. Lots of clashing. Terrible for my nerves, wonderful for my verses.”" },
          { if: 'ysolt_outcome=persuaded', text: "“And you talked the Seeker down! No swords, just words. That's my favourite kind of ending. Don't tell the others.”" },
          { if: 'ysolt_outcome=escaped', text: "“And the great escape! Every good ballad needs one. I'll make it sound braver than it was. That's my job.”" },
          { if: '!ysolt_outcome', text: "“And now everyone's going to want you. I'll write that part with lots of ominous chords.”" },
        ],
        next: 'hub',
      },
      hook: {
        speaker: 'comp:tessa',
        text: "Tessa's hand settles flat on the songbook. “Oh, that. That's a sea-song. From the Shattered Isles. I learned it a long time ago.” She smiles. “Two years. That's a long time for a gnome, isn't it? No. It isn't, actually.”",
        options: [
          { text: "You don't have to tell me. But I'm listening, if you want to.", tone: 'compassionate', tags: ['mercy'], effects: ['rel tessa trust 4', 'rel tessa affection 2', 'set tessa_song_hint'], next: 'hook_kind' },
          { text: "Sing it for me.", tone: 'curious', tags: ['curiosity'], effects: ['rel tessa trust -2'], next: 'hook_sing' },
        ],
      },
      hook_kind: {
        speaker: 'dm',
        text: "Tessa is quiet so long you think she won't answer. Then she plays four notes. Only four, very soft. The room feels colder. She stops. “I sang the whole thing, once,” she whispers. “And afterward it was very, very quiet.” She closes the book. “That's all. That's all I can, right now.”",
        next: 'hub',
      },
      hook_sing: {
        speaker: 'comp:tessa',
        text: "“No.” It comes out sharp and unperformed, and Tessa looks as startled by it as you are. Then the smile returns. “I mean, it's not a party piece, darling. Ask me for a jig. I do a marvellous jig.”",
        next: 'hub',
      },
      deep: {
        speaker: 'comp:tessa',
        text: "“Scares me? Nothing! I'm fearless. I once played a troll wedding.” Tessa strums a chord. Then another. Then lets her hand fall. “...Silence,” she says. “Rooms where there used to be voices. Being the last one still singing when everyone else has stopped.”",
        next: 'deep2',
      },
      deep2: {
        speaker: 'comp:tessa',
        text: "“Stories keep people alive. That's what I believe. If I remember them carefully enough, sing them often enough, they're not gone. Not really.” She swallows. “So I never, ever stop singing. Just in case.”",
        options: [
          { text: "Then I'll listen. Every song, for as long as you want to sing.", tone: 'compassionate', effects: ['rel tessa trust 5', 'rel tessa affection 5', 'memory tessa 3 You promised to listen to every song.', 'set talk_tessa_deep'], next: 'deep_kind' },
          { text: "You don't have to carry everyone alone. Let some of us remember too.", tone: 'friendly', tags: ['diplomacy'], effects: ['rel tessa trust 4', 'rel tessa respect 3', 'set talk_tessa_deep', 'set tessa_shared_song'], next: 'deep_share' },
          { text: "Maybe some people should be allowed to be forgotten.", tone: 'pragmatic', effects: ['rel tessa trust -5', 'rel tessa affection -5', 'memory tessa -3 You said some people should be forgotten.', 'set talk_tessa_deep'], next: 'deep_bad' },
        ],
      },
      deep_kind: {
        speaker: 'comp:tessa',
        text: "Tessa laughs, and it breaks in the middle and turns into something else. She wipes her eyes with an inky wrist. “You'll regret that,” she says thickly. “I know four hundred songs.” A pause. “...Thank you. Truly.”",
        next: 'hub',
      },
      deep_share: {
        speaker: 'dm',
        text: "Tessa looks at you a long moment. Then she turns the songbook around and slides it across to you. “Pick one,” she says. “Any page. Learn it. Then there'll be two of us.”",
        next: 'hub',
      },
      deep_bad: {
        speaker: 'dm',
        text: "The music stops. Tessa looks at you, and for once there's no performance in her face at all, only something hurt and very old. “Yes,” she says. “Maybe.” She puts the lute away. “I think I'll turn in early.”",
        end: true,
      },
      romance: {
        speaker: 'dm',
        text: "Tessa raises an eyebrow, then takes up the lute. What she plays isn't a ballad, or a jig, or anything from the songbook. It's new and a little hesitant, and it keeps circling back to the same few notes, as if trying out a name.",
        options: [
          { text: "What's it called?", tone: 'friendly', effects: ['rel tessa affection 5', 'set romance_tessa_hint'], next: 'romance_yes' },
          { text: "Lovely. You should play that at the next festival.", tone: 'diplomatic', next: 'romance_no' },
        ],
      },
      romance_yes: {
        speaker: 'comp:tessa',
        text: "Tessa doesn't look up from the strings. “Not finished yet,” she says. “I'll tell you when it is.” Her cheeks are pink in the candlelight. “You might have to stay around a while, if you want to hear how it ends.”",
        end: true,
      },
      romance_no: {
        speaker: 'dm',
        text: "“Maybe I will,” Tessa says brightly, and the new tune slides seamlessly into an old jig, as if it had never been there at all.",
        end: true,
      },
    },
  },

  // ════════════════════════════════════════════════════════════ KORR
  {
    id: 'camp_korr',
    title: 'Korr, by the fire',
    start: 'start',
    nodes: {
      start: {
        speaker: 'dm',
        text: [
          { if: '!bell_rang', text: "Korr sits on the floor with his back to the wall, because the bed is too short and the chair too fragile. He's sharpening his axe in long, patient strokes. He doesn't stop when you come in, but he nods." },
          { if: 'bell_rang && !prologue_complete', text: "Korr stands by the shuttered window, utterly still, head tilted toward the fog outside. His hand is white-knuckled on his axe haft. It takes him a moment to notice you, and when he does he lets out a long breath." },
          { if: 'prologue_complete && comp:tessa', text: "Korr sits by the hearth, staring into it. In his lap, folded small, is a sheet covered in Tessa's looping handwriting. He tucks it away when he sees you, not quickly enough." },
          { if: 'prologue_complete && !comp:tessa', text: "Korr sits by the hearth, staring into it, turning a small charred stone over and over in his fingers. He closes his fist around it when he sees you." },
        ],
        next: 'hub',
      },
      hub: {
        speaker: 'comp:korr',
        text: [
          { if: '!bell_rang', text: "“Speak.”" },
          { if: 'bell_rang && !prologue_complete', text: "“The fog is loud. Talk. It helps.”" },
          { if: 'prologue_complete', text: "“Sit. Ask what you want.”" },
        ],
        options: [
          { text: "Who are you, really?", tone: 'curious', once: true, effects: ['set talk_korr_intro'], next: 'intro' },
          { text: "That brawl at the inn. What did you make of it?", if: 'brawl_resolved', tone: 'friendly', once: true, effects: ['set talk_korr_brawl'], next: 'brawl' },
          { text: "You hear something in the fog, don't you?", if: 'bell_rang', tone: 'compassionate', once: true, effects: ['set talk_korr_bell'], next: 'bell' },
          { text: "You stared at the empty bell tower a long time.", if: 'visited:cathedral', tone: 'curious', once: true, effects: ['set talk_korr_cathedral'], next: 'cathedral' },
          { text: "The Bellwarden is quiet now. How are you?", if: 'prologue_complete', tone: 'compassionate', once: true, effects: ['set talk_korr_ending'], next: 'ending' },
          { text: "Whose voice is it, in the fog?", if: 'talk_korr_bell', tone: 'curious', once: true, effects: ['set talk_korr_hook'], next: 'hook' },
          { text: "Tell me why you were exiled.", if: 'trust:korr>=15', lockedText: "He would only say ‘a deed that cannot be sung.’ He needs to trust you more.", tone: 'compassionate', once: true, next: 'deep' },
          { text: "Rest, Korr. I'll take the first watch.", tone: 'leave', end: true },
        ],
      },
      intro: {
        speaker: 'comp:korr',
        text: "“Korr Ashmane.” A long pause, as if deciding how much more to give. “Once war-leader of the Cinderfang. Now, caravan guard.” He runs the whetstone down the blade. “The caravan left. I stayed. That is all.”",
        options: [
          { text: "Why did you stay?", tone: 'curious', effects: ['rel korr trust 1'], next: 'intro_stay' },
          { text: "I know the fire you carry.", if: 'anc:ashkin || class:barbarian', tone: 'background', effects: ['rel korr trust 3', 'rel korr respect 2'], next: 'intro_kin' },
          { text: "War-leader to caravan guard. Quite a fall.", tone: 'sarcastic', effects: ['rel korr affection -2'], next: 'intro_fall' },
          { text: "Why did you leave the Cinderfang?", tone: 'curious', tags: ['honesty'], effects: ['rel korr respect 1'], next: 'intro_exile' },
        ],
      },
      intro_stay: {
        speaker: 'comp:korr',
        text: "Korr is quiet. “A feeling,” he says at last. “Ashkin do not trust feelings. I trusted this one.” He shrugs his massive shoulders. “Maybe wrong. We will see.”",
        next: 'hub',
      },
      intro_kin: {
        speaker: 'comp:korr',
        text: "Korr looks up, ember eyes narrowing. Then he nods slowly, as if greeting a fellow traveller on a hard road. “Then you know it lies,” he says. “It says it is strength. It is not. It is only fire.”",
        next: 'hub',
      },
      intro_fall: {
        speaker: 'dm',
        text: "Korr's whetstone stops. “Yes,” he says. Only that. Then the stone resumes, harder.",
        next: 'hub',
      },
      intro_exile: {
        speaker: 'comp:korr',
        text: "“I did not leave. I was sent.” He looks at the blade, not at you. “I did a thing that cannot be sung. That is all tonight.”",
        next: 'hub',
      },
      brawl: {
        speaker: 'comp:korr',
        text: [
          { if: 'brawl_outcome=talked', text: "“Words, in a tavern full of fists.” Korr grunts. “Good. I was ready to break heads. Better I did not.”" },
          { if: 'brawl_outcome=intimidated', text: "“You made them afraid.” Korr nods, approving. “Fear stops a fight before blood. Honest fear is not cruel.”" },
          { if: 'brawl_outcome=fought', text: "Korr flexes his knuckles. “A good fight. Clean. No one killed.” He looks at his hands a moment too long. “I stopped myself. That is the part that matters.”" },
          { if: 'brawl_outcome=performed', text: "“You performed. In a brawl.” Korr stares at you. “Ashkin would make a chant of that. A strange chant. But a chant.”" },
          { if: '!brawl_outcome', text: "“Drunk men fighting. Nothing worth singing.”" },
        ],
        next: 'hub',
      },
      bell: {
        speaker: 'comp:korr',
        text: "“The bell rang, and the grey came.” Korr's voice is low. “In it, I hear—” He stops. Starts again. “Voices. Old ones. They call names. Mine.”",
        next: 'bell2',
      },
      bell2: {
        speaker: 'comp:korr',
        text: [
          { if: 'rescued_count>=2', text: "“But we pulled people from it. Many. That is a deed.” He nods slowly. “When the voices are loudest, I will think of that.”" },
          { if: 'rescued_count<2', text: "“And we did not save them all.” His jaw works. “I count the ones we lost. Ashkin always count.”" },
        ],
        next: 'hub',
      },
      cathedral: {
        speaker: 'comp:korr',
        text: "“A man rang that bell every day,” Korr says. “For years. Then the tower fell, and no one sang his name.” He scowls into the fire. “Bad. A man's deeds should outlive his bones.”",
        options: [
          { text: "Then we'll remember him. That's how a name lasts.", tone: 'friendly', tags: ['tradition'], effects: ['rel korr respect 3'], next: 'cath_remember' },
          { text: "He's long dead. What does it matter?", tone: 'pragmatic', tags: ['pragmatic'], effects: ['rel korr agreement -3'], next: 'cath_matter' },
        ],
      },
      cath_remember: {
        speaker: 'comp:korr',
        text: [
          { if: 'met_wenna', text: "Korr looks at you a long moment. “Yes. The old woman called him Halric. Brother Halric, who let children pull the rope.” He nods. “Good. You understand.”" },
          { if: '!met_wenna', text: "Korr looks at you a long moment. “Yes,” he says. “Good. You understand.”" },
        ],
        next: 'hub',
      },
      cath_matter: {
        speaker: 'comp:korr',
        text: "“It matters.” Korr's voice is a growl. “To be unsung is to die twice. Ashkin know this better than any.”",
        next: 'hub',
      },
      ending: {
        speaker: 'comp:korr',
        text: "“The bell-monk is quiet now.” Korr turns his axe in his hands. “I struck him. I did not rage. I chose each blow.” He looks at you. “You were there. You saw. That matters to me.”",
        next: 'ending_lira',
      },
      ending_lira: {
        speaker: 'comp:korr',
        text: [
          { if: 'lira_fate=anchored', text: "“And the girl. You held her in the world.” Korr nods, deeply. “A strong deed. I will sing it at a fire, one day.”" },
          { if: 'lira_fate=faded', text: "“And the girl went quiet.” Korr's voice is rough. “No one will sing her. Except the boy. Let it be enough.”" },
          { if: 'lira_fate=bottled', text: "“And the girl. Kept, not living.” Korr frowns. “Ashkin would not do this. But Ashkin do many foolish things.”" },
          { if: '!lira_fate', text: "“And the boy was right. Remember that. The ones no one believes.”" },
        ],
        next: 'ending_ysolt',
      },
      ending_ysolt: {
        speaker: 'comp:korr',
        text: [
          { if: 'ysolt_outcome=fought', text: "“And the Seeker. She fought well. She ran well too.” A grim smile. “She will be back. Good. I want a second fight.”" },
          { if: 'ysolt_outcome=persuaded', text: "“And you turned the Seeker with words. No blood. I would not have thought it. I was wrong.”" },
          { if: 'ysolt_outcome=escaped', text: "“And we ran.” Korr's lip curls. Then he shrugs. “Living is a deed too. Sometimes.”" },
          { if: '!ysolt_outcome', text: "“Others will come. I will be in front of you when they do.”" },
        ],
        next: 'hub',
      },
      hook: {
        speaker: 'dm',
        text: "Korr is silent for a very long time. The fire pops. His hands are still on the axe.",
        options: [
          { text: "(Insight) Wait. Let the silence do the work.", tone: 'compassionate', check: { skill: 'insight', dc: 12, who: 'player', advIf: 'anc:ashkin' }, success: 'hook_s', failure: 'hook_f' },
          { text: "Tell me.", tone: 'aggressive', effects: ['rel korr trust -1'], next: 'hook_push' },
        ],
      },
      hook_s: {
        speaker: 'comp:korr',
        text: "You don't fill the silence, and something in his shoulders gives. “Thal,” he says. “My oath-brother. He calls my name in the grey. As he did on the last day.” His huge hands tighten on the haft. “He cannot call me. He is dead. I know he is dead.” A long breath. “I know because it was my hand.”",
        effects: ['rel korr trust 4', 'set korr_thal_hint'],
        next: 'hub',
      },
      hook_f: {
        speaker: 'comp:korr',
        text: "“No one,” Korr says at last. “Wind.” He goes back to his axe, and the moment closes like a fist.",
        next: 'hub',
      },
      hook_push: {
        speaker: 'comp:korr',
        text: "“No.” Korr doesn't raise his voice. He doesn't need to. “Not tonight.”",
        next: 'hub',
      },
      deep: {
        speaker: 'comp:korr',
        text: "Korr sets the axe aside. That alone tells you how much this costs. “A caravan raid. Years ago. Thal at my side, as always.” His voice is flat and careful, a man walking on thin ice. “The fire took me. I do not remember the fight. I remember after. Thal on the ground. My axe.”",
        next: 'deep2',
      },
      deep2: {
        speaker: 'comp:korr',
        text: "“The Cinderfang sent me out. No name. No song. Unsung.” He looks at his hands. “Some nights I think they were right. That something in Ashkin blood is wrong. That we were made to burn.”",
        options: [
          { text: "One moment doesn't unmake a person. Every day since, you've chosen differently.", tone: 'compassionate', tags: ['mercy'], effects: ['rel korr trust 5', 'rel korr affection 4', 'memory korr 3 You told me I choose who I am every day.', 'set talk_korr_deep'], next: 'deep_kind' },
          { text: "Then earn your name back. I'll be your witness.", tone: 'friendly', tags: ['boldness', 'tradition'], effects: ['rel korr trust 4', 'rel korr respect 5', 'set talk_korr_deep'], next: 'deep_witness' },
          { text: "Maybe they were right to send you away.", tone: 'pragmatic', effects: ['rel korr trust -5', 'rel korr affection -5', 'memory korr -3 You said my exile was deserved.', 'set talk_korr_deep'], next: 'deep_bad' },
        ],
      },
      deep_kind: {
        speaker: 'comp:korr',
        text: "Korr looks at you a long time. “Chosen,” he repeats. “Every day.” He nods, slowly. “Yes. That is a thing I can do. Every day.” He reaches out and grips your forearm, Ashkin-fashion, hard enough to bruise. “You I will remember.”",
        next: 'hub',
      },
      deep_witness: {
        speaker: 'comp:korr',
        text: "Something kindles in Korr's ember eyes that isn't rage. “A witness,” he says. “Ashkin deeds must be seen to be sung.” He nods once, decisive. “Then watch me. I will give you things worth seeing.”",
        next: 'hub',
      },
      deep_bad: {
        speaker: 'dm',
        text: "Korr's face doesn't change. Slowly he picks the axe back up and resumes sharpening it. The stone makes a long, flat sound. “Yes,” he says. “I think it every night. Now I do not have to think it alone.”",
        end: true,
      },
    },
  },
];
