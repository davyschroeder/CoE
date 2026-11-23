import type { CompanionVoice } from '../schema';

/**
 * Functional lines for the companion personality engine.
 * Inner quotations use typographic quotes (“ ”) so the strings stay simple.
 * "{player}" is replaced with the player character's name by the engine.
 */
export const COMPANION_VOICES: Record<string, CompanionVoice> = {
  // ───────────────────────────────────────────── VAELIS ── arch, sarcastic, precise
  vaelis: {
    reactions: {
      curiosity: {
        pos: [
          "Vaelis looks almost moved. “A question. Asked aloud. By someone other than me.”",
          "“Yes. Pull the thread. Things that don't want to be understood are the only ones worth the trouble.”",
          "Vaelis makes a small note in the margin of his book. “Good instinct. I'll pretend I suggested it.”",
        ],
      },
      knowledge: {
        pos: [
          "“There. Now we know something we didn't. That is the entire point of being alive.”",
          "Vaelis nods slowly, the way a tutor nods when a student finally stops embarrassing him.",
          "“Write that down. Write everything down. The world has started forgetting things on purpose.”",
        ],
      },
      forbidden: {
        pos: [
          "Vaelis's eyes light like lamps. “Oh, somebody is going to hate that we know this. Splendid.”",
          "“Every forbidden book I've read was forbidden by someone afraid of it. Carry on.”",
          "“A locked door is just a question with a guard on it.” He sounds delighted.",
        ],
      },
      boldness: {
        pos: [
          "“Reckless,” Vaelis says, “but in the right direction.”",
          "“Decisive. I approve, provisionally, pending survival.”",
        ],
      },
      humor: {
        pos: [
          "Vaelis's mouth twitches. He would deny it under oath.",
          "“That was almost witty. Keep practising.”",
        ],
      },
      faith: {
        neg: [
          "Vaelis rolls his eyes so thoroughly it is nearly a cantrip.",
          "“Ah, prayer. The scholarly method of hoping very hard at the ceiling.”",
          "“The Lights didn't do that. We did. Please stop thanking the architecture.”",
        ],
      },
      tradition: {
        neg: [
          "“‘We've always done it this way.’ The epitaph of every civilisation I've ever read about.”",
          "Vaelis's jaw tightens. “Custom is just a mistake that got old enough to vote.”",
          "“Yes, let's honour the past. It's not as if the past is currently trying to eat us.”",
        ],
      },
      caution: {
        neg: [
          "“Caution. Of course. Let's wait politely until the answer erodes.”",
          "Vaelis drums his fingers on his spellbook, loudly enough to be an argument.",
        ],
      },
      authority: {
        neg: [
          "“Deference to rank. How very Conclave of you.” He doesn't explain the bitterness in it.",
          "Vaelis's lip curls. “Titles are hats that think they're arguments.”",
        ],
      },
    },
    suggest: {
      curiosity: [
        "We should look closer. Whatever this is, it won't explain itself.",
        "Ask the next question, and then the one after that. Answers are lazy; they have to be chased.",
      ],
      knowledge: [
        "Whatever we decide, let's decide it knowing more than we do now.",
        "Information first. Heroics afterward, if there's time and anyone still wants them.",
      ],
      forbidden: [
        "If someone went to the trouble of hiding it, it's worth finding. That isn't a rule; it's a law of nature.",
        "Yes, it's sealed. Seals are invitations written by cowards.",
      ],
      boldness: [
        "Hesitation is how interesting things get away. Move.",
        "Do the decisive thing. I'll catch whatever explodes.",
      ],
      humor: [
        "Must everything be so grim? Even the end of the world deserves a decent line.",
        "Let's not be so solemn about it. Solemn people make the worst decisions; I've attended their meetings.",
      ],
    },
    combat: {
      start: [
        "“Stand behind me. Not too close. I gesture.”",
        "“Ah. A practical examination.”",
        "“Try not to die before I've finished the calculation.”",
      ],
      lowHp: [
        "“This is a statistically improbable amount of my blood.”",
        "“I am far too clever to die in a basement.”",
        "“Someone. Anyone. Heal the genius.”",
      ],
      kill: [
        "“Footnote.”",
        "“And that is why one reads.”",
        "“Elegant. Mostly.”",
      ],
      allyDown: [
        "“Get up! I refuse to write the obituary.”",
        "“No, no, no. Someone get to them!”",
        "“Ally down. I am... displeased.”",
      ],
      crit: [
        "“Textbook.”",
        "“Did everyone see that? Someone write it down.”",
        "“Perfect resonance. As predicted.”",
      ],
      miss: [
        "“The air moved. That's my excuse and I'm keeping it.”",
        "“A calibration shot.”",
        "“That was a warning. Mostly to myself.”",
      ],
    },
    idle: [
      { id: 'vaelis_festival_lanterns', if: '!bell_rang', text: "“Lanterns for the forgotten. Charming. Though if you've truly forgotten someone, how do you know who you're lighting it for?”" },
      { id: 'vaelis_festival_tremor', if: '!bell_rang', text: "Vaelis checks a little brass instrument, frowns, and taps it twice. “Three weeks this town's been humming. Nobody else hears it. Nobody else ever does.”" },
      { id: 'vaelis_festival_pell', if: 'met_pell && !bell_rang', text: "“Everyone thinks that boy Pell is lying about his sister. I think he may be the only person in Hollowmere remembering correctly.”" },
      { id: 'vaelis_bell', if: 'bell_rang && !visited:cathedral', text: "“A bell that doesn't exist, ringing in a tower that fell eighty years ago. Either the world is broken or it's showing off.”" },
      { id: 'vaelis_fog', if: 'bell_rang && !found_secret_stair', text: "Vaelis lets the fog curl between his fingers. “This isn't weather, {player}. It's margin. We're walking along the edge of the page.”" },
      { id: 'vaelis_cathedral', if: 'visited:cathedral && !found_secret_stair', text: "“Seven niches, six statues. Everyone is always so remarkably incurious about the empty one.”" },
      { id: 'vaelis_corvin', if: 'met_corvin && !prologue_complete', text: "“The Unbound boy dug into an Anchor with a trowel and good intentions. I'd be furious if I weren't so jealous.”" },
      { id: 'vaelis_undercroft', if: 'found_secret_stair && !visited:vault', text: "Vaelis runs a fingertip along carved stone. “Ithari script. I can read perhaps one word in five. That is four words too few.”" },
      { id: 'vaelis_vault', if: 'visited:vault && !prologue_complete', text: "“Do you hear that? No? Good. Neither do I. Keep telling me that.”" },
      { id: 'vaelis_after', if: 'prologue_complete', text: "Vaelis watches you the way he'd watch an unopened book. “You feel different. Resonant. I would very much like to measure you, and I am trying very hard not to.”" },
      { id: 'vaelis_after_ysolt', if: 'prologue_complete && ysolt_outcome', text: "“That Seeker's instruments. The brasswork, the way the needle swung...” Vaelis stops, as if he's said one word too many. “Never mind. Conclave fashions.”" },
    ],
    refuse: [
      "“No. I have a long list of things I'll do in the name of curiosity. That isn't on it.”",
      "“I won't. And you'll want to remember that I said so politely.”",
      "“Find someone with fewer scruples. I can't believe I'm the one saying that.”",
    ],
    vote: {
      yes: ["“Yes. Obviously.”", "“I concur, which ought to comfort you.”"],
      no: ["“No. And I'd like my objection recorded for posterity.”", "“Absolutely not. I've read how that ends.”"],
    },
    farewell: "“Do you know what I've learned, travelling with you? That a person can be bored and appalled at the same time. The Conclave threw me out for reading the wrong books; I am throwing myself out for keeping the wrong company. Don't follow me. Don't write. If history remembers you at all, I hope it's in a footnote, in small print, at the bottom of a page nobody turns.”",
  },

  // ───────────────────────────────────────────── BRAKKA ── blunt, warm, homespun philosophy
  brakka: {
    reactions: {
      protect: {
        pos: [
          "Brakka thumps her shield once, approving. “That's what a wall is for.”",
          "“Good. Folk behind you, steel in front. That's the whole of it.”",
          "Brakka gives you a long, level look, and nods. You feel oddly like you've been knighted.",
        ],
      },
      mercy: {
        pos: [
          "“Mercy costs you nothing but pride,” Brakka says. “Cheapest thing in the world, and rarest.”",
          "Brakka grunts. It is, unmistakably, a pleased grunt.",
        ],
      },
      boldness: {
        pos: [
          "Brakka grins through her beard-braids. “Straight through the front door. My favourite door.”",
          "“Ha! Now that's a plan with a spine in it.”",
          "“Bold. Good. Fear's a fine adviser and a terrible captain.”",
        ],
      },
      honesty: {
        pos: [
          "“Plain truth. Hard to swallow, easy to digest.”",
          "Brakka nods. “You said it straight. I'll remember that.”",
        ],
      },
      tradition: {
        pos: [
          "“The old ways are old because they worked,” Brakka says. “Mostly.”",
          "Brakka touches the clan-mark on her bracer. “My grandmother would've liked you.”",
        ],
      },
      charity: {
        pos: [
          "“A full belly makes a fine friend,” Brakka says, watching the coin change hands.",
          "Brakka claps your shoulder hard enough to rattle a tooth. “Good. Generous is good.”",
        ],
      },
      cruelty: {
        neg: [
          "Brakka goes very still. “Don't. Do that. Again.”",
          "“There's hard, and there's cruel. You just walked over the line, and I watched you do it.”",
          "Brakka's knuckles whiten on her axe haft. She says nothing, which is worse.",
        ],
      },
      deception: {
        neg: [
          "Brakka sucks her teeth. “Lies are like loose stones. Sooner or later, someone trips.”",
          "“Clever,” Brakka says flatly. In her mouth, it isn't a compliment.",
        ],
      },
    },
    suggest: {
      protect: [
        "Whatever we do, the people who can't fight go first. Out of the way, out of harm.",
        "Think about who gets hurt if we're wrong. Then do the thing that keeps them standing.",
      ],
      boldness: [
        "Enough circling. Pick a door and go through it.",
        "Sometimes the shortest path is the one with the most teeth. I don't mind teeth.",
      ],
      honesty: [
        "Just tell them the truth. It's quicker, and you don't have to remember it.",
        "Say what you mean. Folk can smell a dodge, even frightened folk.",
      ],
      mercy: [
        "Let them live. A grudge buried alive digs itself out; a kindness sometimes does too.",
        "We can afford to be gentle here. We won't always be able to.",
      ],
      charity: [
        "Give what we can spare. Coin's only metal until someone eats because of it.",
        "There's always someone hungrier. Might as well be us who notice.",
      ],
    },
    combat: {
      start: [
        "“Behind me! Shields up!”",
        "“Right. Who's first?”",
        "“Stonevein holds!”",
      ],
      lowHp: [
        "“Still standing. Barely counts, but it counts.”",
        "“I've had worse. Can't remember when.”",
        "“Stone cracks. Doesn't mean it falls.”",
      ],
      kill: [
        "“Down you go.”",
        "“Rest, then.”",
        "“That's one.”",
      ],
      allyDown: [
        "“No! Get them up, I'll hold the line!”",
        "“Nobody touches them. Nobody.”",
        "“On me! Cover the fallen!”",
      ],
      crit: [
        "“Ha! Felt that in my teeth!”",
        "“Ostrem steel!”",
        "“That's how it's done.”",
      ],
      miss: [
        "“Bah. Stand still.”",
        "“Next one lands.”",
        "“Slippery, aren't you.”",
      ],
    },
    idle: [
      { id: 'brakka_festival_food', if: '!bell_rang', text: "Brakka sniffs the air. “Roast apples and tallow smoke. Ostrem smelled like this, the last night I was there.” A pause. “Last spring. Whatever the stones say.”" },
      { id: 'brakka_festival_kids', if: '!bell_rang', text: "Brakka watches children chase each other between the lantern poles. “Little ones laughing in a square. That's what all the walls in the world are for.”" },
      { id: 'brakka_festival_brawl', if: 'brawl_resolved && !bell_rang', text: "“Good to have a scuffle out of the way early. Clears the air. Like thunder, but with more ale.”" },
      { id: 'brakka_bell', if: 'bell_rang && !visited:cathedral', text: "“Folk waking up with the wrong families.” Brakka's voice is very quiet. “I know that look. I've worn it.”" },
      { id: 'brakka_fog', if: 'bell_rang && !found_secret_stair', text: "Brakka sets her shield against the fog as if it might lean on her. “Stay close, {player}. Things go missing in this. People too.”" },
      { id: 'brakka_rescued', if: 'rescued_count>=2 && !prologue_complete', text: "“We pulled folk out of that fog.” Brakka nods to herself. “Whatever else tonight is, it's that too.”" },
      { id: 'brakka_cathedral', if: 'visited:cathedral && !found_secret_stair', text: "Brakka raps her knuckles on a fallen pillar. “Good stone. Old stone. Stone that remembers being a church even though nobody's prayed here in eighty years.”" },
      { id: 'brakka_undercroft', if: 'found_secret_stair && !visited:vault', text: "“Tunnels. Finally, somewhere sensible.” Brakka rolls her shoulders. “Mind your heads. Well. Mind your heads.”" },
      { id: 'brakka_vault', if: 'visited:vault && !prologue_complete', text: "Brakka touches a vein of pale light in the black stone and pulls her hand back. “Whoever built this didn't build it to keep things out. They built it to keep something in.”" },
      { id: 'brakka_after', if: 'prologue_complete', text: "“You carry it well,” Brakka says, nodding at nothing you can see. “Whatever it is now. Just don't carry it alone.”" },
      { id: 'brakka_after_lira', if: 'prologue_complete && lira_fate', text: "“Is a person their memories or their deeds?” Brakka asks the fire, not you. “Been chewing on it since that girl in the dark. Haven't swallowed yet.”" },
    ],
    refuse: [
      "“No. I'll follow you through a lot of doors. Not that one.”",
      "Brakka plants her feet. “Order me all you like. I'm a wall, not a weapon.”",
      "“I won't. And if you try it yourself, you'll be going through me first.”",
    ],
    vote: {
      yes: ["“Aye. Let's do it.”", "“Sound enough. I'm with you.”"],
      no: ["“No. That sits wrong in my gut.”", "“Nay. And my gut's been right more than my head.”"],
    },
    farewell: "“I've been a wall for you. Took the blows, held the door, kept my mouth shut more than I'd like. But a wall's worth what it keeps safe, and I don't know what I'm keeping safe anymore. Maybe it's me that's wrong. I've been wrong before, about bigger things than you. But I'd rather be wrong on my own road than right beside you. Take care of the ones still following you. Somebody should.”",
  },

  // ───────────────────────────────────────────── KAEL ── glib, deflecting, sudden sincerity
  kael: {
    reactions: {
      pragmatic: {
        pos: [
          "Kael taps his nose. “Sensible. I hate how attractive that is.”",
          "“Cheapest solution with the fewest corpses. Now you're speaking my language.”",
          "“See, this is why I like you. No speeches, just results.”",
        ],
      },
      deception: {
        pos: [
          "Kael bites back a grin. “Lovely work. I almost believed you, and I invented lying.”",
          "“A little fiction never hurt anyone who didn't deserve it.”",
        ],
      },
      greed: {
        pos: [
          "Kael's eyes follow the coin. “Purely for expenses, of course. Very important expenses.”",
          "“Profit! The only god who answers on time.”",
        ],
      },
      stealth: {
        pos: [
          "“Quiet. Quick. Nobody the wiser,” Kael breathes. “Beautiful.”",
          "Kael melts into a shadow beside you. “Now we're having fun.”",
          "“The best fight is the one nobody knows happened.”",
        ],
      },
      humor: {
        pos: [
          "Kael laughs before he can stop himself. “Oh, that's good. I'm stealing that.”",
          "“Funny and dangerous. My two favourite qualities, in that order.”",
          "Kael raises an imaginary glass to you.",
        ],
      },
      charity: {
        pos: [
          "Kael looks away, suddenly very interested in a rooftop. “Yeah. That was... yeah. Good.”",
          "“Don't make a habit of it,” Kael says, and doesn't mean a word.",
        ],
      },
      protect: {
        pos: [
          "“Look after the little ones. Rule one. Only rule, really.”",
          "Kael's grin fades into something quieter. “Thanks for that. For them, I mean.”",
        ],
      },
      authority: {
        neg: [
          "Kael's smile goes brittle. “Yes, sir. Very good, sir. Shall I lick a boot while I'm down here?”",
          "“Every time someone bows to a badge, a pickpocket gets their wings. And not in a good way.”",
          "Kael mutters something about watchmen that would make Tobin blush.",
        ],
      },
      faith: {
        neg: [
          "“The Lights have never paid my rent,” Kael says, “but sure, let's ask them.”",
          "Kael makes a sign of the Lamp with exaggerated piety and a perfectly straight face.",
        ],
      },
      honesty: {
        neg: [
          "Kael winces. “Wow. Just... out loud. With your mouth.”",
          "“Honesty's a luxury, friend. Some of us shop at cheaper stalls.”",
        ],
      },
      cruelty: {
        neg: [
          "The humour drains out of Kael's face. “That was low. Even for the gutter.”",
          "“There are lines, {player}. I've crossed most of them. Not that one.”",
          "Kael looks at you like he's taking your measure, and coming up short.",
        ],
      },
    },
    suggest: {
      pragmatic: [
        "Let's do whatever works and argue about whether it was noble later. Much later. Over drinks.",
        "Forget pride. What gets us out alive, with the most coin and the fewest enemies?",
      ],
      stealth: [
        "Why go through the front when there's a perfectly good window?",
        "Nobody needs to know we were here. That's the beauty of it.",
      ],
      humor: [
        "Lighten up. Frightened people listen better if you make them laugh first.",
        "Everyone's so grim. Let's give them a reason to smile; it's cheaper than bribes.",
      ],
      deception: [
        "A little story never hurt anyone. Let me tell it, and try to look honest.",
        "The truth's expensive. Let's pay with something cheaper.",
      ],
      charity: [
        "Somebody here needs a break more than we do. Just saying.",
        "We can spare it. And if anyone asks, I was against it.",
      ],
    },
    combat: {
      start: [
        "“Oh good, violence. My second-favourite way to lose money.”",
        "“I'll be the one you don't see.”",
        "“Everybody pick a target. I've picked theirs.”",
      ],
      lowHp: [
        "“I'd like to formally request not dying.”",
        "“Ow. Ow. That's a lot of ow.”",
        "“I'm fine! I'm lying! I'm not fine!”",
      ],
      kill: [
        "“Should've stayed home.”",
        "“And they never saw it coming.”",
        "“Pleasure doing business.”",
      ],
      allyDown: [
        "“Hey! Hey, no, get up. That's an order. I don't give orders.”",
        "“Somebody's paying for that.”",
        "“Not them. Not on my watch.”",
      ],
      crit: [
        "“Right in the weak spot. Everyone's got one.”",
        "“Did you see that? Tell me you saw that.”",
        "“Sweet as a stolen pie.”",
      ],
      miss: [
        "“That was a feint. Obviously.”",
        "“My hand slipped. On purpose.”",
        "“Well, that's embarrassing.”",
      ],
    },
    idle: [
      { id: 'kael_festival_ale', if: '!bell_rang', text: "Kael takes an appreciative sip of festival ale. “I came for this. Truly. Nothing else. Look at my honest face.”" },
      { id: 'kael_festival_marks', if: '!bell_rang', text: "Kael's eyes drift over the crowd, purse by purse. “Habit,” he says, catching you watching. “Like birdwatching. With fewer birds.”" },
      { id: 'kael_festival_cathedral', if: '!bell_rang', text: "Kael's gaze keeps sliding to the ruined cathedral on the hill. When he notices you noticing, he grins. “Lovely architecture. Very... fallen.”" },
      { id: 'kael_festival_pell', if: 'met_pell && !bell_rang', text: "“The kid. Pell.” Kael chews on something that isn't there. “Nobody listens to kids. That's how kids end up alone.”" },
      { id: 'kael_bell', if: 'bell_rang && !visited:cathedral', text: "“Bells ringing from nowhere, people vanishing. I knew I should've stayed in Solmara. At least there the vanishings are organised.”" },
      { id: 'kael_fog', if: 'bell_rang && !found_secret_stair', text: "Kael draws his collar up against the fog. “Can't pick a lock you can't see. Can't run from something that's already everywhere. I hate this.”" },
      { id: 'kael_cathedral', if: 'visited:cathedral && !found_secret_stair', text: "Kael runs a finger down a pew and frowns at the dust. Then frowns at the footprints in it. “Someone's been through here a lot. Recently. Interesting.”" },
      { id: 'kael_undercroft', if: 'found_secret_stair && !visited:vault', text: "“Secret stairs, dead monks, mystery tunnels. If there's no treasure at the bottom, I'm writing a strongly worded letter.”" },
      { id: 'kael_vault', if: 'visited:vault && !prologue_complete', text: "Kael's hand drifts toward a glittering vein of crystal, and stops. “Nope. No. Some things you don't pocket. I just learned that. Today.”" },
      { id: 'kael_after', if: 'prologue_complete', text: "Kael fiddles with a folded paper and slips it away before you can see it. “Everyone's going to want a piece of you now, you know. Everyone.” He doesn't sound like he's joking." },
      { id: 'kael_after_corvin', if: 'prologue_complete && corvin_fate=handed_over', text: "“Corvin in a cell.” Kael shrugs too hard. “He'll be fine. People in cells are always fine. Ask me how I know.”" },
    ],
    refuse: [
      "“No. I've done a lot of ugly jobs. I pick which ones.”",
      "Kael spreads his hands. “Sorry, that's outside my rates. Permanently.”",
      "“Not doing it. Fire me, if you like. Plenty of employers out there.”",
    ],
    vote: {
      yes: ["“Sure, why not. What's the worst that could happen?”", "“I'm in. Put me down as cautiously reckless.”"],
      no: ["“Hard pass.”", "“No. And I'm usually the one saying yes to bad ideas.”"],
    },
    farewell: "“You know the funny thing? I was starting to like this. You, them, the whole doomed parade. That's always when I should leave, and I always leave too late. So here's me, leaving on time for once. Don't look for me in Solmara; I won't be there. And {player}, whatever you think you know about me, you're about half right. Pick a half. I'm done helping you guess.”",
  },

  // ───────────────────────────────────────────── SERIS ── formal, earnest, rigid, cracks of doubt
  seris: {
    reactions: {
      honesty: {
        pos: [
          "Seris inclines her head. “Truth, spoken plainly. Aurel's light falls on you.”",
          "“That was honest, and it cost you something. I saw it.”",
          "Seris's shoulders ease a fraction. “Good. We do not need to win by lying.”",
        ],
      },
      faith: {
        pos: [
          "Seris touches the ember at her breast. “The Lights hear that. I am certain of it.”",
          "“You honour the Six. Thank you.” She means it with her whole chest.",
        ],
      },
      authority: {
        pos: [
          "“Order. Thank you. Someone in this town must stand for it.”",
          "Seris nods crisply. “Rightly done. The law protects those it binds.”",
        ],
      },
      protect: {
        pos: [
          "“A shield raised for the defenceless is the purest prayer there is.”",
          "Seris steps up beside you, sword drawn, without being asked.",
          "“That is what the Dawn is for,” Seris says quietly. “That, exactly.”",
        ],
      },
      tradition: {
        pos: [
          "“The old rites endure for a reason. I am glad you respect them.”",
          "Seris murmurs a line of liturgy under her breath, approving.",
        ],
      },
      deception: {
        neg: [
          "Seris's jaw tightens. “That was a lie, and you know it.”",
          "“Deceit is a debt,” Seris says coldly. “It always comes due.”",
          "Seris looks at you as if she's adding a line to a ledger, and the line is not in your favour.",
        ],
      },
      forbidden: {
        neg: [
          "“There are doors the Lights closed for a reason.” Seris's hand is on her hilt. “We should not be opening them.”",
          "Seris goes pale. “This is how it starts. One sealed thing, and then another.”",
          "“I will not pretend I did not see that.”",
        ],
      },
      cruelty: {
        neg: [
          "“Enough!” Seris's voice cracks like a whip. “Justice does not gloat.”",
          "Seris turns away, sickened. “There was no law in that. Only spite.”",
          "“I swore oaths against exactly that,” Seris says. “Do not make me choose between them and you.”",
        ],
      },
      greed: {
        neg: [
          "“Coin,” Seris says, as if naming a disease.",
          "Seris's lips thin. “The Dawn's knights take nothing they do not need. I had hoped you would do the same.”",
        ],
      },
      stealth: {
        neg: [
          "“Skulking,” Seris mutters. “The righteous do not need shadows.”",
          "Seris crouches with obvious reluctance and clanks, faintly, in protest.",
        ],
      },
    },
    suggest: {
      honesty: [
        "Tell them the truth. If it is hard, then we bear it together.",
        "No lies. Whatever we build on a lie will fall on someone innocent.",
      ],
      protect: [
        "The innocent come first. Whatever else we decide, they must be safe.",
        "We stand between these people and harm. That is our whole duty here.",
      ],
      faith: [
        "This is a holy place, or it was. We should act as though the Lights are watching, because they are.",
        "Let us trust the Six in this. Aurel's lamp has not failed me yet.",
      ],
      authority: [
        "There is a proper way to do this. The watch, the mayor, the law. We should use it.",
        "We are not judges here. Let those charged with judgement do their office.",
      ],
      tradition: [
        "The old customs exist for a reason. Hollowmere's rites deserve our respect.",
        "Our forebears faced darkness before. We should follow the path they cut.",
      ],
    },
    combat: {
      start: [
        "“By the Lamp and the Dawn!”",
        "“Stand fast. The light is with us.”",
        "“You face a Knight-Oathsworn. Reconsider.”",
      ],
      lowHp: [
        "“Aurel, steady my hand...”",
        "“I do not yield. I do not.”",
        "“The Dawn... does not fall so easily.”",
      ],
      kill: [
        "“Judgement.”",
        "“Go to the light, or the dark. It is no longer mine to decide.”",
        "“It is done.”",
      ],
      allyDown: [
        "“To me! Protect the fallen!”",
        "“Lights, not them. Not while I stand.”",
        "“Hold on! I am coming!”",
      ],
      crit: [
        "“The Lamp guides my blade!”",
        "“For the Dawn!”",
        "“Justly struck.”",
      ],
      miss: [
        "“Patience. Again.”",
        "“My footing. Not my faith.”",
        "“A lesson in humility. Noted.”",
      ],
    },
    idle: [
      { id: 'seris_festival_lanterns', if: '!bell_rang', text: "Seris watches a lantern float up past the rooftops. “In the Dawnspire we lit them in silence. Here everyone is singing.” She sounds as if she isn't sure which is more correct." },
      { id: 'seris_festival_judgement', if: '!bell_rang', text: "“I was sent to judge whether this town is tainted.” Seris watches a baker give a child a free bun. “It is harder to do when they are kind.”" },
      { id: 'seris_festival_brawl', if: 'brawl_resolved && !bell_rang', text: "“Public drunkenness on a holy night.” Seris sniffs. “Though I admit the whole affair had a certain rustic vigour.”" },
      { id: 'seris_bell', if: 'bell_rang && !visited:cathedral', text: "“Saint Orlen's bell drove off the fog once.” Seris stares at the hill. “Why would it summon it now? Unless it is not his bell. Unless it is not his saint.”" },
      { id: 'seris_fog', if: 'bell_rang && !found_secret_stair', text: "Seris lifts the ember at her breast and the fog shrinks back from it, a little. She watches that happen with an expression you can't read." },
      { id: 'seris_cathedral', if: 'visited:cathedral && !found_secret_stair', text: "Seris kneels briefly before the six niches, then stands, and does not look at the seventh. “We do not pray to the empty one. We are taught not to wonder why.”" },
      { id: 'seris_corvin', if: 'met_corvin && !prologue_complete', text: "“The Unbound scholar's dig cracked something holy.” Seris's voice is very even. “There will have to be a reckoning for that. There should be.”" },
      { id: 'seris_undercroft', if: 'found_secret_stair && !visited:vault', text: "“Graves beneath a holy house. That is proper.” Seris pauses at a carving of a robed figure with an empty face. “That is... less proper.”" },
      { id: 'seris_vault', if: 'visited:vault && !prologue_complete', text: "The ember at Seris's breast flickers in time with the pale veins in the walls. She covers it with her hand and says nothing at all." },
      { id: 'seris_after', if: 'prologue_complete', text: "“The thing in you, {player}.” Seris chooses each word. “My Order will call it a blasphemy. I have not decided what I call it. I am... trying to decide honestly.”" },
      { id: 'seris_after_orders', if: 'prologue_complete', text: "Seris turns a sealed letter over in her gauntleted hands, again and again, and puts it away unopened." },
    ],
    refuse: [
      "“No. I am sworn, and that is not a thing a sworn knight does.”",
      "Seris steps in front of you. “You will have to go through me. I would rather you did not.”",
      "“I will not. Ask me anything else, and I will consider it.”",
    ],
    vote: {
      yes: ["“Yes. It is right.”", "“Agreed. Let it be done properly.”"],
      no: ["“No. I cannot set my name to that.”", "“I object. Formally, and with conviction.”"],
    },
    farewell: "“I wanted to believe the Lights had set you on my road for a reason. Perhaps they did. Perhaps the reason was to show me what I must not become. I have broken bread with you, bled beside you, and held my tongue when my oath told me to speak. No more. Go your way. If our roads cross again and you have done what I fear you will do, I will not be your companion. I will be your judge.”",
  },

  // ───────────────────────────────────────────── NIMA ── breathless, exclamatory, funny
  nima: {
    reactions: {
      curiosity: {
        pos: [
          "Nima practically vibrates. “Yes! Poke it! What does it do? What does it do?”",
          "“Ooh. Ooh. I knew I liked you.”",
          "Nima's fingertips spark with excitement. She shakes them out, embarrassed. “Sorry. Keep going!”",
        ],
      },
      boldness: {
        pos: [
          "“YES!” Nima punches the air. A small flame punches it too.",
          "“That's the spirit! Headfirst! Always headfirst!”",
          "Nima beams at you like you've just set something wonderful on fire.",
        ],
      },
      forbidden: {
        pos: [
          "“Forbidden? Says who? Says nobody I like, that's who.”",
          "Nima gasps happily. “Oh, we're definitely not supposed to know that. Brilliant.”",
        ],
      },
      humor: {
        pos: [
          "Nima laughs so hard she snorts, then laughs at the snort.",
          "“Hah! Oh, you're terrible. Do another.”",
        ],
      },
      defiance: {
        pos: [
          "“Tell them where to shove it!” Nima crows. “Politely! No! Not politely!”",
          "“Rules are walls built by frightened people, and you just walked through one. My hero.”",
          "Nima whistles low. “Look at you, making enemies. I'm so proud.”",
        ],
      },
      mercy: {
        pos: [
          "Nima goes quiet, then soft. “That was kind. People forget kind is allowed.”",
          "“Good,” Nima says, unusually small. “Nobody else needs to get burned tonight.”",
        ],
      },
      caution: {
        neg: [
          "Nima groans like you've told her bedtime is early. “Carefullll. Again.”",
          "“If we're any more careful we'll turn into furniture.”",
          "Nima kicks a pebble into the dark with great feeling.",
        ],
      },
      authority: {
        neg: [
          "“Oh, so we're doing what the badge says now?” Nima's eyes flash orange for a moment.",
          "Nima mimes a salute that turns into a rude gesture halfway up.",
        ],
      },
      tradition: {
        neg: [
          "“Because it's always been done that way? That's the worst reason in the world!”",
          "Nima sighs gustily. “Somebody's great-great-grandmother did it, so we have to. Wonderful.”",
        ],
      },
    },
    suggest: {
      curiosity: [
        "Come on, aren't you dying to know? I'm dying to know. Literally, possibly, but still!",
        "Let's find out! Worst case, we learn something. Second-worst case, explosions. Both fine!",
      ],
      boldness: [
        "Stop thinking so hard! Just go! The universe rewards people who go!",
        "Charge it! Whatever it is! I'll be right behind you. Well. Beside you. Slightly on fire.",
      ],
      forbidden: [
        "They hid it, so it must be good. That's basic logic!",
        "Whoever sealed this up was scared of it. I want to know why. Don't you?",
      ],
      defiance: [
        "We don't have to do what anyone says. That's the best part of being us!",
        "Somebody's trying to tell us no. I say we tell them something back.",
      ],
      humor: [
        "Can we please do the funny thing? Just once? For morale?",
        "Everyone's so serious! Let's make them laugh. It confuses enemies.",
      ],
    },
    combat: {
      start: [
        "“Ooh, finally! Stand back, it gets warm!”",
        "“Let's light it up!”",
        "“Who wants to be on fire? Nobody? Too bad!”",
      ],
      lowHp: [
        "“I'm okay! I'm okay! I'm... possibly not okay!”",
        "“Ow, ow, ow, that's my blood, I need that!”",
        "“The flames are getting loud... stay back...”",
      ],
      kill: [
        "“Toasted!”",
        "“Ha! Crispy!”",
        "“Was that me? That was me!”",
      ],
      allyDown: [
        "“No no no no, get UP!”",
        "“You hurt my friend. Now you burn.”",
        "“Somebody help them! I'll cover! Loudly!”",
      ],
      crit: [
        "“Did you SEE that?!”",
        "“KABOOM!”",
        "“Oh, that was gorgeous!”",
      ],
      miss: [
        "“Oops. That was the wall. Sorry, wall.”",
        "“It went sideways! Why did it go sideways?”",
        "“That one had a mind of its own!”",
      ],
    },
    idle: [
      { id: 'nima_festival_storm', if: '!bell_rang', text: "Nima licks a finger and holds it up. “Taste that? Like a storm right before it decides to happen. This town is about to get interesting, {player}. I can feel it in my teeth.”" },
      { id: 'nima_festival_lanterns', if: '!bell_rang', text: "“If I light a lantern, does it count if I accidentally make it explode? Asking for me.”" },
      { id: 'nima_festival_glass', if: '!bell_rang', text: "Nima stops at Ysolde's stall and turns a glass bead in the light, a little too long. “My family made these. Better than these. Anyway!”" },
      { id: 'nima_bell', if: 'bell_rang && !visited:cathedral', text: "“The bell! Did you hear it? Of course you heard it, everyone heard it, it was the best and most terrifying thing I've ever heard!”" },
      { id: 'nima_fog', if: 'bell_rang && !found_secret_stair', text: "Nima lets a flame dance on her palm. The fog leans toward it, curious. “It likes me. I don't know how I feel about that.”" },
      { id: 'nima_cathedral', if: 'visited:cathedral && !found_secret_stair', text: "“A ruined cathedral at midnight in a cursed fog. If this were a song, Tessa would call it heavy-handed.”" },
      { id: 'nima_undercroft', if: 'found_secret_stair && !visited:vault', text: "“Secret stairs! Old bones! Ancient writing! I'm going to be insufferable about this for weeks.”" },
      { id: 'nima_whisper', if: 'found_secret_stair && !prologue_complete', text: "Nima's flame gutters, then flares. She tilts her head as if listening. “Hm? Oh. Nothing. The fire just... sounded like someone. Never mind!”" },
      { id: 'nima_vault', if: 'visited:vault && !prologue_complete', text: "“Everything in here is humming. Even me. Especially me. Is that normal? Don't answer that.”" },
      { id: 'nima_after', if: 'prologue_complete', text: "Nima pokes your arm. “Do you feel sparkly? You look sparkly. Like the air right before lightning. I'm not jealous. I'm hugely jealous.”" },
      { id: 'nima_after_heart', if: 'prologue_complete && heart_touched', text: "“When you touched it, I saw them. Cities in the sea. Towers full of stars.” Nima's voice drops. “Where did they all go?”" },
    ],
    refuse: [
      "“No! Absolutely not! And I say yes to basically everything!”",
      "Nima's hands flare and she snatches them back. “I won't. Don't ask me again.”",
      "“That's not brave, that's just mean. I'm not doing it.”",
    ],
    vote: {
      yes: ["“Yes! Obviously yes! Why are we even voting?”", "“Ooh, yes. Let's.”"],
      no: ["“Boo. No. Boring and wrong.”", "“No! That's a terrible idea, and I love terrible ideas!”"],
    },
    farewell: "“You know what? Fine. FINE. I've been burned before. I've burned things before. I know what it feels like when something you care about goes up in smoke, and this is it, this is exactly it. I'm going. Don't follow me, I mean it, I don't trust what my hands would do. Maybe I'll find someone who actually wants to see what the world's made of. Maybe I'll just find a nice quiet storm.”",
  },

  // ───────────────────────────────────────────── ORREN ── few words, nature metaphors
  orren: {
    reactions: {
      nature: {
        pos: [
          "Orren nods once, slow as a tree in no wind. “Good. The land noticed.”",
          "“Roots before branches,” Orren murmurs. Approval, from him.",
          "Orren touches the earth briefly, as if thanking it on your behalf.",
        ],
      },
      caution: {
        pos: [
          "“Wise. The fox that waits sees the trap.”",
          "Orren's shoulders loosen. “Patience. Good.”",
        ],
      },
      diplomacy: {
        pos: [
          "“Words first,” Orren says. “Arrows don't come back.”",
          "Orren watches the tension go out of the room like water out of a field. He looks content.",
        ],
      },
      stealth: {
        pos: [
          "Orren is beside you without a sound. “Quiet feet. Better.”",
          "“The owl doesn't announce itself,” Orren whispers. You think he's smiling.",
        ],
      },
      mercy: {
        pos: [
          "“Let it go free,” Orren says. “Some things grow back kinder.”",
          "Orren's eyes soften. He says nothing. He doesn't have to.",
        ],
      },
      violence: {
        neg: [
          "Orren's lips press together. “Blood waters nothing good.”",
          "“Too fast,” Orren says. “Should have listened first.”",
          "Orren looks at the mess you've made and quietly tallies it, the way he'd count felled trees.",
        ],
      },
      greed: {
        neg: [
          "“Take only what you need,” Orren says. It's not the first time.",
          "Orren watches the coin with the look he gives poachers.",
        ],
      },
      forbidden: {
        neg: [
          "“Some burrows are dug deep for a reason,” Orren says, frowning. “Leave them.”",
          "Orren's hand drifts to his pocket and stays there.",
        ],
      },
      cruelty: {
        neg: [
          "Orren goes cold and quiet as first frost. “No.”",
          "“Even wolves don't do that,” Orren says. He walks a little farther from you after.",
          "Orren looks at you for a long moment, as if reading tracks he doesn't like.",
        ],
      },
      boldness: {
        neg: [
          "“Charging stag,” Orren mutters. “Breaks its neck on the fence.”",
          "Orren sighs. “Running into the dark. Again.”",
        ],
      },
    },
    suggest: {
      nature: [
        "Let the land show us. It's been here longer than any of this.",
        "Look at what's growing, and what's stopped. That'll tell us.",
      ],
      caution: [
        "Wait. Watch. The path's still there in an hour.",
        "Slow is how you get home.",
      ],
      diplomacy: [
        "Talk. Even frightened things listen, if you're quiet enough.",
        "Nobody here needs to bleed. Let's find the words.",
      ],
      stealth: [
        "Go around. Unseen. Less to clean up.",
        "Soft feet. They'll never know we passed.",
      ],
      mercy: [
        "Spare it. A broken branch can still bud.",
        "Let them go. We don't need to take everything.",
      ],
    },
    combat: {
      start: [
        "“Mark your target.”",
        "“Quietly now.”",
        "“Didn't want this. Here it is.”",
      ],
      lowHp: [
        "“Bleeding. Still breathing.”",
        "“Need cover...”",
        "“Not today. Not here.”",
      ],
      kill: [
        "“Rest.”",
        "“Clean.”",
        "“Back to the soil.”",
      ],
      allyDown: [
        "“Down! Someone's down!”",
        "“Hold on. I'm coming.”",
        "“Cover them!”",
      ],
      crit: [
        "“Heart-shot.”",
        "“There.”",
        "“True.”",
      ],
      miss: [
        "“Wind.”",
        "“Hm.”",
        "“Next.”",
      ],
    },
    idle: [
      { id: 'orren_festival_crowd', if: '!bell_rang', text: "Orren edges around the busiest part of the square. “Too many feet. Can't hear the ground.”" },
      { id: 'orren_festival_birds', if: '!bell_rang', text: "Orren watches the rooftops. “Swallows left this morning. Weeks early. Swallows don't leave early.”" },
      { id: 'orren_festival_paths', if: '!bell_rang', text: "“Every new path in the Woods points here,” Orren says, to nobody in particular. “Followed one. It ended at the inn's back door. Paths don't do that.”" },
      { id: 'orren_bell', if: 'bell_rang && !visited:cathedral', text: "Orren's hand goes to his coat pocket and stays there. “Warm,” he says, when you look. He doesn't explain what." },
      { id: 'orren_fog', if: 'bell_rang && !found_secret_stair', text: "Orren crouches and presses his palm to the cobbles. “Ground's quiet. Too quiet. Like snow, but nothing's fallen.”" },
      { id: 'orren_fog_tracks', if: 'bell_rang && !prologue_complete', text: "“Tracks in the fog. Hound-shaped. Start nowhere. End nowhere.” Orren frowns. “Don't like tracks that don't go anywhere.”" },
      { id: 'orren_cathedral', if: 'visited:cathedral && !found_secret_stair', text: "Orren touches the ivy on the broken wall. “Eighty years of green, and it won't grow past that line.” He points. “Something underneath it says no.”" },
      { id: 'orren_undercroft', if: 'found_secret_stair && !visited:vault', text: "“Roots this deep,” Orren murmurs, brushing a pale tendril in the ceiling. “Reaching for something. Not water.”" },
      { id: 'orren_vault', if: 'visited:vault && !prologue_complete', text: "Orren keeps his hand pressed over his pocket. Whatever's in there, it's humming in time with the walls." },
      { id: 'orren_after', if: 'prologue_complete', text: "“You've changed, {player},” Orren says. “Like a river after a flood. Same banks. Different water.”" },
      { id: 'orren_after_rescued', if: 'prologue_complete && rescued_count>=2', text: "“The folk we pulled from the fog. Saw the baker's girl planting lantern-seeds this morning.” Orren almost smiles. “Good sign.”" },
    ],
    refuse: [
      "“No.”",
      "Orren shakes his head slowly. “Not that. Ask the wind if you want it done.”",
      "“That's not a path I'll walk.”",
    ],
    vote: {
      yes: ["“Yes.”", "“Good path. I'll take it.”"],
      no: ["“No.”", "“Wrong way. Too many thorns.”"],
    },
    farewell: "“My grandmother said you can tell a person by what they leave behind them on a path. Footprints, or ash. I've walked behind you long enough to read it. I'm going back to the trees. They're changing, but they're still honest about it. Don't follow. You'd scare the birds.”",
  },

  // ───────────────────────────────────────────── ILYRA ── gentle, wry, wise
  ilyra: {
    reactions: {
      mercy: {
        pos: [
          "Ilyra exhales, as if she'd been holding her breath for someone else. “Thank you. That was the harder kindness.”",
          "“Mercy is a muscle,” Ilyra says gently. “You're keeping yours strong.”",
          "Ilyra touches your sleeve, brief and warm. “Veyra keeps a thread for that, I think.”",
        ],
      },
      charity: {
        pos: [
          "“That will feed someone tonight,” Ilyra says. “That's a better prayer than most of mine.”",
          "Ilyra smiles. “Generosity looks well on you.”",
        ],
      },
      faith: {
        pos: [
          "Ilyra bows her head with you. “Whoever is listening, let them be kind.”",
          "“Faith doesn't need certainty,” Ilyra murmurs. “Just a direction.”",
        ],
      },
      protect: {
        pos: [
          "“You stood in front of them.” Ilyra's voice is soft. “People remember that longer than they remember names.”",
          "Ilyra nods, pleased. “Good. The frightened deserve a door that holds.”",
        ],
      },
      honesty: {
        pos: [
          "“Truth, gently told, is a kind of medicine,” Ilyra says.",
          "Ilyra's mouth quirks. “Honest. Brave. A little blunt. Two out of three is excellent.”",
        ],
      },
      diplomacy: {
        pos: [
          "“Well talked,” Ilyra says. “That's one less wound I'll have to stitch.”",
          "Ilyra smiles as the tension drains away. “Words are cheaper than bandages.”",
        ],
      },
      cruelty: {
        neg: [
          "Ilyra's face goes very still. “I have sat with the dying for ten years. I have rarely seen anything so unnecessary.”",
          "“No,” Ilyra says, and for once there is iron in it. “That was cruel, and you knew it was.”",
          "Ilyra kneels beside the one you hurt and does not look at you at all.",
        ],
      },
      violence: {
        neg: [
          "Ilyra sighs and starts unrolling bandages. “I suppose someone has to.”",
          "“There was another way,” Ilyra says quietly. “There usually is.”",
        ],
      },
      greed: {
        neg: [
          "“Gold won't keep you warm in the grave,” Ilyra says. “I've checked.”",
          "Ilyra's smile thins. “I hope it was worth what it cost them.”",
        ],
      },
    },
    suggest: {
      mercy: [
        "Spare them. Whatever they've done, they're still frightened, and frightened people can still change.",
        "Let's choose the gentler thing. The world has more than enough of the other kind.",
      ],
      charity: [
        "If we have more than we need, someone nearby has less. Let's even it a little.",
        "Give something. It will matter more to them than it ever will to us.",
      ],
      protect: [
        "Think of who stands behind this. The children, the old, the ones who can't run. Them first.",
        "Whatever we choose, let it leave the defenceless safer than we found them.",
      ],
      diplomacy: [
        "Talk to them. Nobody has ever been stabbed into understanding.",
        "There's a conversation here that could save a lot of stitching. Let's have it.",
      ],
      faith: [
        "This place was holy once. Let's treat it that way, and see if it remembers.",
        "I'd like to pray first. Not for an answer. Just for steady hands.",
      ],
    },
    combat: {
      start: [
        "“Veyra, keep us whole.”",
        "“Stay close to me. I can't heal what I can't reach.”",
        "“Must we? Very well.”",
      ],
      lowHp: [
        "“Physician, heal thyself... quickly...”",
        "“I'm all right. I'm lying, but I'm all right.”",
        "“Someone else may have to do the praying...”",
      ],
      kill: [
        "“Rest now. Truly.”",
        "“May you find your way home.”",
        "“I'm sorry.”",
      ],
      allyDown: [
        "“Hold on, I'm coming! Don't you dare go anywhere!”",
        "“Veyra, not this thread. Not yet.”",
        "“Keep them breathing, I'm almost there!”",
      ],
      crit: [
        "“The light answers!”",
        "“Forgive me. That one was earned.”",
        "“Oh. That worked rather well.”",
      ],
      miss: [
        "“I'm a healer, not a marksman.”",
        "“Well. Humility is a virtue.”",
        "“Next time, perhaps.”",
      ],
    },
    idle: [
      { id: 'ilyra_festival_lantern', if: '!bell_rang', text: "Ilyra holds an unlit lantern in both hands. “I came to light one for someone,” she says. “I just can't remember who. Isn't that silly?” She doesn't sound as though she thinks it's silly." },
      { id: 'ilyra_festival_wenna', if: 'met_wenna && !bell_rang', text: "“Old Wenna has the hands of a midwife and the eyes of a mourner,” Ilyra says. “I'd like to sit with her for an afternoon.”" },
      { id: 'ilyra_festival_pell', if: 'met_pell && !bell_rang', text: "“The boy is grieving,” Ilyra says quietly. “Everyone thinks it's for someone imaginary. Grief doesn't come from nowhere. I know that much.”" },
      { id: 'ilyra_bell', if: 'bell_rang && !visited:cathedral', text: "“People waking up beside families they don't remember.” Ilyra's hand finds her spindle charm. “I see that every week in Solmara. I hoped I'd left it there.”" },
      { id: 'ilyra_fog', if: 'bell_rang && !found_secret_stair', text: "Ilyra pauses to tuck a blanket around a stranger in a doorway, then hurries to catch up. “Sorry. Habit. The fog makes people forget to be cold.”" },
      { id: 'ilyra_cathedral', if: 'visited:cathedral && !found_secret_stair', text: "Ilyra lights a candle in the niche of Veyra the Weaver. After a moment, she lights a second one and sets it in the empty seventh. “No one should be left out,” she says." },
      { id: 'ilyra_undercroft', if: 'found_secret_stair && !visited:vault', text: "Ilyra murmurs a rite over each set of bones you pass. “Old habit. They've been waiting a long time for someone to say the words.”" },
      { id: 'ilyra_vault', if: 'visited:vault && !prologue_complete', text: "“Can you feel it, {player}? Like a hospice at midnight. All that breathing, and nobody awake.” Ilyra shivers. “I'm being fanciful.”" },
      { id: 'ilyra_after', if: 'prologue_complete', text: "Ilyra watches you over the rim of her tea. “If it ever gets too loud, whatever's in you now, come and sit with me. I'm very good at sitting.”" },
      { id: 'ilyra_after_lira', if: 'prologue_complete && lira_fate=faded', text: "“We let her go gently,” Ilyra says. “I tell myself that's what I'd want. I'm still not sure I'm right. I'm never sure, with these.”" },
      { id: 'ilyra_letter', if: 'prologue_complete', text: "Ilyra reads a letter by the window, folds it very small, and puts it in the fire. Then she watches it burn as if waiting for it to say something back." },
    ],
    refuse: [
      "“No. I've buried too many people to help make more of them.”",
      "Ilyra shakes her head, gentle and immovable. “Not that. Not even for you.”",
      "“I won't. Ask me again in the morning, and I still won't, but I'll be kinder about it.”",
    ],
    vote: {
      yes: ["“Yes. I think it's the kinder road.”", "“I'll stand with that.”"],
      no: ["“No. Someone gets hurt that way, and it needn't be anyone.”", "“I can't agree. Forgive me.”"],
    },
    farewell: "“I've tended the dying long enough to know when something can't be saved, and when it simply won't be. I think you're the second kind, and that is the sadder one. I'll pray for you. Not because I think it will reach anyone, but because somebody should keep a thread tied to you in case you ever want to find your way back. Goodbye, {player}. Be gentler with the next ones.”",
  },

  // ───────────────────────────────────────────── VAREK ── elegant, guarded, dry
  varek: {
    reactions: {
      pragmatic: {
        pos: [
          "Varek inclines his head a fraction. “Efficient. I'd applaud, but it seems vulgar.”",
          "“No sentiment, no waste. You'd have done well at court.”",
          "A thin smile from Varek. “Sensible. How rare and how refreshing.”",
        ],
      },
      forbidden: {
        pos: [
          "Varek's violet eyes glow a little brighter. “Ah. Now we're somewhere honest.”",
          "“The things they bury are always the things worth knowing,” Varek says softly.",
        ],
      },
      knowledge: {
        pos: [
          "“Knowledge is the only inheritance no one can confiscate,” Varek murmurs.",
          "Varek files that away behind his eyes. You can practically hear the drawer close.",
        ],
      },
      defiance: {
        pos: [
          "“Defiance suits you,” Varek says. “Wear it more often.”",
          "Varek laughs, low and genuine. “They'll remember that. Good.”",
          "“Never kneel to people who'd drown you for the colour of your eyes,” Varek says. Then, more lightly: “Or for any reason.”",
        ],
      },
      deception: {
        pos: [
          "“Well lied,” Varek says, with a connoisseur's appreciation.",
          "Varek's mouth curves. “A beautiful fiction. I'd frame it.”",
        ],
      },
      authority: {
        neg: [
          "Varek's expression closes like a fan. “Of course. Obey the people with the torches.”",
          "“How obliging,” Varek says. It is not a compliment.",
          "Varek's eyes flicker violet. “I've seen what happens when people do what the badge says. I was in the river at the time.”",
        ],
      },
      faith: {
        neg: [
          "“The Lights,” Varek says, very dry. “Those famous protectors of Veilborn children.”",
          "Varek examines his nails while you pray. Thoroughly.",
        ],
      },
      cruelty: {
        neg: [
          "Varek's face doesn't change, but his voice cools. “That was beneath you. I'd assumed nothing was.”",
          "“Pointless cruelty is just weakness with better posture,” Varek says.",
        ],
      },
    },
    suggest: {
      pragmatic: [
        "Leave the sentiment for the ballads. Do what works.",
        "We have limited time, limited coin and limited friends. Spend accordingly.",
      ],
      forbidden: [
        "If it's sealed, it's sealed for a reason, and the reason is usually someone else's power.",
        "Open it. Whatever they buried here, I'd rather we knew than they did.",
      ],
      defiance: [
        "We owe nothing to the people telling us no. Remember that.",
        "Let's not ask permission. Permission is how they keep track of you.",
      ],
      knowledge: [
        "Learn first. Ignorance is the one thing they can always use against you.",
        "Whatever we choose, let's choose it knowing more than our enemies do.",
      ],
      deception: [
        "There's no need to tell anyone everything. Least of all the truth.",
        "A little misdirection. Let them look at the wrong hand.",
      ],
    },
    combat: {
      start: [
        "“How tedious. Very well.”",
        "“Sing for me, then.”",
        "“Let's be quick. I loathe a mess.”",
      ],
      lowHp: [
        "“The Choir is... very loud now...”",
        "“Unfortunate. I'm rather attached to living.”",
        "“Not yet. I am not done being remembered.”",
      ],
      kill: [
        "“Forgotten.”",
        "“Hush.”",
        "“Gone, and good riddance.”",
      ],
      allyDown: [
        "“Get up. I despise funerals.”",
        "“That was a mistake on their part.”",
        "“Someone tend to them. Now.”",
      ],
      crit: [
        "“Exquisite.”",
        "“There. Feel that in your bones.”",
        "“The Choir approves.”",
      ],
      miss: [
        "“Hm. Rude of it to move.”",
        "“A slight miscalculation.”",
        "“The voices disagreed.”",
      ],
    },
    idle: [
      { id: 'varek_festival_stares', if: '!bell_rang', text: "A mother pulls her child out of Varek's path. He doesn't break stride. “Veilborn eyes,” he says lightly. “They do so love a lantern festival, until they see a light they didn't hang themselves.”" },
      { id: 'varek_festival_foundations', if: '!bell_rang', text: "“The innkeeper says the cathedral was built on older stone. Much older.” Varek turns his wine cup. “Tobin talks far more than he realises. I find that endearing.”" },
      { id: 'varek_festival_hum', if: '!bell_rang', text: "Varek is humming something under his breath, a tune with no clear beginning. He stops when he notices you listening, faintly annoyed with himself." },
      { id: 'varek_bell', if: 'bell_rang && !visited:cathedral', text: "Varek presses his fingertips to his temple. “They're singing louder. Ignore me. It passes.” It does not seem to pass." },
      { id: 'varek_fog', if: 'bell_rang && !found_secret_stair', text: "Varek walks through the fog as if it were an old acquaintance. “I dreamed of weather like this as a boy. Every night. I used to think it was a nightmare.”" },
      { id: 'varek_cathedral', if: 'visited:cathedral && !found_secret_stair', text: "“Do you know what the Last Dawn calls people like me, {player}? Half-erased.” Varek regards the six saints with polite contempt. “I've always wondered which half they meant.”" },
      { id: 'varek_undercroft', if: 'found_secret_stair && !visited:vault', text: "Varek stops at a junction, tilts his head, and turns left without hesitation. When you ask how he knew, he says, “Lucky guess,” in a tone that forbids follow-up." },
      { id: 'varek_vault', if: 'visited:vault && !prologue_complete', text: "Varek has gone very pale. “Don't mind me,” he says. “It's only that I've never been anywhere this... crowded.” The vault is empty except for you." },
      { id: 'varek_after', if: 'prologue_complete', text: "Varek looks at you for a long moment with his luminous eyes. “It suits you,” he says finally. “Being impossible to ignore. Be careful who notices.”" },
      { id: 'varek_after_quiet', if: 'prologue_complete && heart_touched', text: "“They're quieter since you touched it,” Varek says, mostly to himself. “Not silent. Waiting.” He catches your look. “Nothing. Bad sleep.”" },
    ],
    refuse: [
      "“No. I have very few principles, and I keep them polished.”",
      "Varek smiles without warmth. “Do it yourself. I'll watch, and remember.”",
      "“I think not. Ask me something less beneath us both.”",
    ],
    vote: {
      yes: ["“Yes. Reluctantly, and with style.”", "“Agreed. Don't make me regret it.”"],
      no: ["“No. Spectacularly no.”", "“I decline, on grounds of taste and survival.”"],
    },
    farewell: "“I've spent my whole life among people who looked at me and saw something to be got rid of. I had thought, briefly and foolishly, that you didn't. My mistake. I'll find my own way from here; I always have. Do try to be worth remembering, {player}. One of us should be, and I've decided it will be me.”",
  },

  // ───────────────────────────────────────────── TESSA ── playful, musical, perceptive
  tessa: {
    reactions: {
      diplomacy: {
        pos: [
          "Tessa mimes a bow to you. “Beautifully played. No encore needed.”",
          "“See? Everybody leaves with their teeth. That's a good night.”",
          "Tessa hums a bright little triad of approval.",
        ],
      },
      humor: {
        pos: [
          "Tessa laughs, a real one, the kind she doesn't perform. “Oh, that's going in a song.”",
          "“Ha! Timing! You have timing! Do you know how rare that is?”",
          "Tessa scribbles something in her songbook, still giggling.",
        ],
      },
      mercy: {
        pos: [
          "“Kindness makes a better ending,” Tessa says softly. “Audiences always know.”",
          "Tessa squeezes your hand quickly and lets go before anyone notices.",
        ],
      },
      curiosity: {
        pos: [
          "“Ooh. A mystery. I love a verse that ends in a question.”",
          "Tessa leans in eagerly. “Go on, go on, what's the next line?”",
        ],
      },
      deception: {
        pos: [
          "Tessa winks. “A little embroidery. The truth wears it well.”",
          "“Lovely delivery,” Tessa murmurs. “I'd have believed you, and I write this stuff.”",
        ],
      },
      violence: {
        neg: [
          "Tessa winces. “Bit of a discordant note, that.”",
          "“There's always another verse before the swords,” Tessa sighs. “Always.”",
          "Tessa goes quiet, which is the loudest thing she does.",
        ],
      },
      cruelty: {
        neg: [
          "Tessa's smile slides off. “That's not a story I'd tell anyone. Not even a villain's.”",
          "“No,” Tessa says quietly. “No, that's ugly. Don't make me write that down.”",
        ],
      },
      authority: {
        neg: [
          "Tessa rolls her eyes. “Bow to the crown, the crown, the crown, the song goes on and on.”",
          "“Yes, let's do what the man with the hat says,” Tessa mutters. “That always ends well in ballads.”",
        ],
      },
    },
    suggest: {
      diplomacy: [
        "Let me talk. Or you talk. Somebody talk! Nobody needs to bleed tonight.",
        "Everyone wants something. Find out what, and give them a little of it.",
      ],
      humor: [
        "Make them laugh. It's very hard to stab someone while you're laughing. I've tested this.",
        "A joke, a song, a ridiculous hat. Anything to break the tension. Trust me.",
      ],
      curiosity: [
        "There's a story here. I want to know how it ends, don't you?",
        "Let's find out more. Every good song has a second verse.",
      ],
      mercy: [
        "Let's give this one a kind ending. They're so rare, these days.",
        "Spare them. Villains with second chances make the best songs.",
      ],
      deception: [
        "A little performance never hurt anyone. Let me set the stage.",
        "We don't have to tell them everything. Just the parts that rhyme.",
      ],
    },
    combat: {
      start: [
        "“Places, everyone!”",
        "“Oh, I hate this part. Let's make it quick and catchy.”",
        "“A fight! Somebody count me in!”",
      ],
      lowHp: [
        "“I'm missing a few notes...”",
        "“Not the face, I perform with the face!”",
        "“Somebody... play me off...”",
      ],
      kill: [
        "“And... curtain.”",
        "“Exit, pursued by me.”",
        "“That's the final verse for you.”",
      ],
      allyDown: [
        "“No! The show's not over, get UP!”",
        "“Someone help them! I'll sing louder!”",
        "“You don't get to leave the stage like that!”",
      ],
      crit: [
        "“High note!”",
        "“Bravo! Bravissimo!”",
        "“That one's going in the chorus!”",
      ],
      miss: [
        "“Flat. Very flat.”",
        "“Missed my cue.”",
        "“Rehearsal. That was a rehearsal.”",
      ],
    },
    idle: [
      { id: 'tessa_festival_gig', if: '!bell_rang', text: "Tessa tunes her lute with quick, nervous fingers. “Last night of the Festival, and I'm the closing act. Solo. Very modern. Very... solo.”" },
      { id: 'tessa_festival_company', if: '!bell_rang', text: "“The Quickthorn Wandering Company? Oh, we disbanded.” Tessa's smile is perfect. “Creative differences. Shall we get a drink?”" },
      { id: 'tessa_festival_people', if: '!bell_rang', text: "“See the woman by the well, {player}? She's waiting for someone who's late. And the man by the cart's pretending he isn't the one she's waiting for.” Tessa grins. “Festivals are better than theatre.”" },
      { id: 'tessa_bell', if: 'bell_rang && !visited:cathedral', text: "Tessa has gone pale. She's flipping through her book of songs with no origin, looking for something. When she finds the page, she closes it very quickly." },
      { id: 'tessa_fog', if: 'bell_rang && !found_secret_stair', text: "“Fog eats sound,” Tessa says, and claps once. The clap comes back from the wrong direction. “I hate that. I hate that so much.”" },
      { id: 'tessa_fog_hum', if: 'bell_rang && !prologue_complete', text: "Tessa hums to keep everyone's spirits up. It takes you a moment to notice it's the same pattern the bell rang. She doesn't seem to notice at all." },
      { id: 'tessa_cathedral', if: 'visited:cathedral && !found_secret_stair', text: "Tessa sings a single clear note into the nave. The ruins answer with a harmony nobody sang. Tessa stops singing." },
      { id: 'tessa_undercroft', if: 'found_secret_stair && !visited:vault', text: "“Catacombs. Wonderful acoustics. Terrible audience.” Tessa nods at a row of skulls. “Tough crowd.”" },
      { id: 'tessa_vault', if: 'visited:vault && !prologue_complete', text: "Tessa presses both hands over her ears, then lowers them, confused. “It isn't loud. It's just... so many melodies, very quietly, all at once.”" },
      { id: 'tessa_after', if: 'prologue_complete', text: "Tessa is scribbling in her songbook. “The Ballad of {player} and the Bell That Never Rang. Working title. Do you prefer heroic or tragic? I can do both. Ideally not at once.”" },
      { id: 'tessa_after_brawl', if: 'prologue_complete && brawl_outcome=performed', text: "“That bit in the tavern, when you performed your way out of a brawl?” Tessa sighs happily. “I've never been so professionally jealous.”" },
    ],
    refuse: [
      "“No. I've sung a lot of songs I'm not proud of. I'm not adding that one.”",
      "Tessa folds her arms. “Nope. Find a different bard. Oh wait, you can't.”",
      "“Absolutely not. Some stories shouldn't be written.”",
    ],
    vote: {
      yes: ["“Yes! That's the better story.”", "“Aye, aye, I'll harmonise.”"],
      no: ["“No. That ending's all wrong.”", "“Ugh, no. Bad verse, worse chorus.”"],
    },
    farewell: "“I've walked away from audiences before. I've had them walk away from me, which is worse. But I never thought I'd be the one leaving the stage halfway through a song I actually liked. This is me, taking my bow, {player}. No encore. No curtain call. If anyone asks, tell them we disbanded. Creative differences. I've had practice saying it; it hardly hurts anymore.”",
  },

  // ───────────────────────────────────────────── KORR ── terse, proud, heavy
  korr: {
    reactions: {
      boldness: {
        pos: [
          "Korr bares his teeth in what might be a grin. “Good. Forward.”",
          "“That is how the Cinderfang walk,” Korr says. “Toward.”",
          "Korr thumps a fist against his chest. Approval.",
        ],
      },
      protect: {
        pos: [
          "“You stood for the weak.” Korr nods slowly. “That deed will be sung.”",
          "Korr moves to your flank without a word, guarding it.",
          "“Good. The strong carry. That is what strong is for.”",
        ],
      },
      honesty: {
        pos: [
          "“Straight words. Good.”",
          "Korr grunts. “You speak like Ashkin. Plain.”",
        ],
      },
      violence: {
        pos: [
          "Korr rolls his shoulders, satisfied. “Sometimes the axe is the answer.”",
          "“Clean fight,” Korr says. “No shame in it.”",
        ],
      },
      tradition: {
        pos: [
          "“The old ways hold us when nothing else does,” Korr says.",
          "Korr touches the ash-mark on his brow. “Remembered. Good.”",
        ],
      },
      cruelty: {
        neg: [
          "Korr's ember eyes go hot and hard. “No honour in that. None.”",
          "“A coward's deed,” Korr growls. “I will not sing it.”",
          "Korr's hands are shaking. He clenches them until they stop. “Don't. Again.”",
        ],
      },
      deception: {
        neg: [
          "Korr's lip curls. “Lies. Like smoke. They choke the one who breathes them.”",
          "“You lied.” Korr says it like a fact. It is a heavy fact.",
        ],
      },
      caution: {
        neg: [
          "Korr shifts impatiently. “We wait. Again.”",
          "“Fear dressed as wisdom,” Korr mutters.",
        ],
      },
    },
    suggest: {
      boldness: [
        "Enough talk. We go now, while our blood is hot.",
        "Meet it head on. The Cinderfang never ran from a thing they could face.",
      ],
      protect: [
        "The weak first. Then we fight.",
        "Stand in front of them. That is the whole of honour.",
      ],
      honesty: [
        "Tell them true. Lies rot.",
        "Speak plain. A straight word is a strong word.",
      ],
      violence: [
        "Some things only listen to steel.",
        "Talk has failed. Let the axe speak.",
      ],
      tradition: [
        "Do as the old ones did. They knew the dark better than we do.",
        "Honour the rites. They are older than our fear.",
      ],
    },
    combat: {
      start: [
        "“Come, then!”",
        "“Cinderfang!”",
        "“Stand behind me. Or beside. Not in front.”",
      ],
      lowHp: [
        "“The fire... rises...”",
        "“Not enough. Not enough to drop me.”",
        "“Thal... not yet...”",
      ],
      kill: [
        "“Fall.”",
        "“Unsung.”",
        "“Next.”",
      ],
      allyDown: [
        "“NO!”",
        "“You will pay in blood for that.”",
        "“Up! Get up! I hold them!”",
      ],
      crit: [
        "“HA!”",
        "“Break!”",
        "“That one will be sung.”",
      ],
      miss: [
        "“Hrr.”",
        "“Again.”",
        "“Coward. Stand still.”",
      ],
    },
    idle: [
      { id: 'korr_festival_lanterns', if: '!bell_rang', text: "Korr watches the lanterns rise. “Ashkin don't light lanterns for the dead. We sing their deeds.” A pause. “Some, we don't sing.”" },
      { id: 'korr_festival_caravan', if: '!bell_rang', text: "“My caravan left at dawn,” Korr says, when you ask. “I stayed.” That seems to be the whole answer." },
      { id: 'korr_festival_brawl', if: 'brawl_outcome=fought && !bell_rang', text: "Korr flexes his bruised knuckles, then frowns at them. “Too easy to start,” he mutters. “Always too easy.”" },
      { id: 'korr_bell', if: 'bell_rang && !visited:cathedral', text: "Korr stands very still in the street, head turned toward the fog. “Did you hear?” He doesn't say what. “No. Nothing. Keep walking.”" },
      { id: 'korr_fog', if: 'bell_rang && !found_secret_stair', text: "Korr flinches at a sound you can't hear. His hand tightens on his axe until the leather creaks. “Voices in the grey. They lie,” he says. “They must.”" },
      { id: 'korr_fog_name', if: 'bell_rang && !prologue_complete', text: "“Korr,” the fog seems to murmur, so faint you might imagine it. Korr doesn't turn around. His jaw is clenched so hard you can hear his teeth." },
      { id: 'korr_cathedral', if: 'visited:cathedral && !found_secret_stair', text: "Korr looks up at the empty bell tower. “A man rang that bell every day, they say. Then the tower fell. No one sang him.” He scowls. “Someone should.”" },
      { id: 'korr_undercroft', if: 'found_secret_stair && !visited:vault', text: "“Dead in the walls. Rows and rows.” Korr touches his brow. “Rest. I am only passing.”" },
      { id: 'korr_vault', if: 'visited:vault && !prologue_complete', text: "Korr's breathing is slow and deliberate. “This place makes the fire in me want to wake,” he says. “I won't let it. Watch me, {player}. If I don't stop, stop me.”" },
      { id: 'korr_after', if: 'prologue_complete', text: "“You faced the bell-thing and did not run.” Korr nods once. “I will remember. That is how a name is made.”" },
      { id: 'korr_after_bellwarden', if: 'prologue_complete && bellwarden_defeated', text: "“The bell-monk,” Korr says. “He rang for eighty years. For people who were gone.” He looks into the fire. “I understand him. I wish I did not.”" },
    ],
    refuse: [
      "“No. Order me into fire, I go. Not into shame.”",
      "Korr folds his arms. “Find another axe.”",
      "“I will not. Not for you. Not for anyone.”",
    ],
    vote: {
      yes: ["“Yes.”", "“Do it.”"],
      no: ["“No.”", "“No. There is no honour there.”"],
    },
    farewell: "“I followed you because you walked like someone worth singing. I was wrong. I have been wrong before, and it cost me a brother. This time it costs only my road. I leave now, while my hands are still my own. Do not call my name again, {player}. I have heard enough voices calling it.”",
  },
};
