import type { DialogueTree } from '../schema';

/**
 * Prologue — "The Bell That Never Rang": main-quest scenes, investigation objects and the climax.
 * Side-quest NPCs live in prologueSide.ts; companion camp talks in camp.ts.
 */
export const MAIN_DIALOGUES: DialogueTree[] = [
  // ───────────────────────────────────────────────────────── Opening
  {
    id: 'intro', title: 'Arrival',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `The road into Hollowmere is lined with lanterns. Paper ones, mostly — red, amber, sea-green — strung from fence posts and hung from the low branches of the apple trees, so that the last mile of your journey feels less like arriving at a town than walking into a held breath of light.

It is the fifteenth of Lanternmoon, the final night of the Festival of Lanterns. Every family hangs a lantern tonight "for those we have forgotten." Nobody in Hollowmere can tell you where the custom comes from. That has never bothered them before.

You did not arrive alone.`,
        interjections: [
          { who: 'vaelis', text: `Vaelis adjusts a brass instrument at his wrist, frowning at a needle that will not hold still. "Three weeks of tremors, all pointing here. If this turns out to be a particularly enthusiastic candle-making competition, I am going to be insufferable about it."` },
          { who: 'brakka', text: `Brakka plants her shield against the fence and surveys the town like a quartermaster counting supplies. "Good walls. Bad gate. Too many lanterns near the hay." A pause. "It's pretty, though. I'll give it that."` },
          { who: 'kael', text: `Kael has already relieved a passing vendor of a skewer of roasted chestnuts — paid for, he insists, "spiritually." "Festival towns are my favourite kind of town. Everyone's happy, nobody's counting, and the ale is mandatory."` },
          { who: 'seris', text: `Seris Dawnbound walks with one gauntleted hand on her sword hilt, though nothing here warrants it. "My Order asked me to judge this place," she says quietly. "I would rather it gave me nothing to judge."` },
          { who: 'nima', text: `Nima spins in a slow circle under the lanterns, sparks fizzing off her fingertips. "Can you feel that? Like the air before a lightning storm. Like the whole town is about to sneeze." She grins. "I love it here."` },
          { who: 'orren', text: `Orren has been silent for most of the road. Now he stops, crouches, and lays his palm flat on the earth. "The ground's restless," he says. "Like a sleeper about to wake." Then he stands and brushes off his hands as if he'd said nothing at all.` },
          { who: 'ilyra', text: `Ilyra Voss touches the lantern pendant at her throat. "I promised myself I'd light one for someone this year," she says, smiling a little ruefully. "I just wish I knew who."` },
          { who: 'varek', text: `Varek Sable's violet eyes catch the lantern-light and keep some of it. "They sing louder here," he murmurs, to no one in particular — and then, noticing you noticing: "The crickets. Obviously."` },
          { who: 'tessa', text: `Tessa Quickthorn is already humming along to a fiddle you can barely hear over the crowd. "Last festival of the season, a booked gig at the inn, and nobody here has heard my material," she says happily. "Paradise."` },
          { who: 'korr', text: `Korr Ashmane ducks beneath a string of lanterns that would have cleared any other head in the crowd. Children stare. He lets them. "Loud town," he rumbles. "Good. Loud towns don't have time to be afraid."` },
        ],
        next: 'b',
      },
      b: {
        speaker: 'dm',
        text: `You met on the road this afternoon, the way people do in stories: a broken axle, a shared fire, an argument about the right way to cook river trout. By the time Hollowmere's lanterns came into view, you were travelling together — not quite friends, not quite strangers. A party, the old songs would call it.

North, beyond the town wall, the ruin of the Cathedral of Saint Orlen squats against a violet sky. Its bell tower ends in a jagged stump. It fell eighty years ago, on a night the town still calls the Night of Falling Stone.

The square is full of music. The night is young.`,
        options: [
          { text: `"Let's see this festival." (Explore Hollowmere — talk to people, shop, and hang a lantern on the Lantern Tree when you're ready.)`, tone: 'friendly', effects: ['quest mq_bell festival', 'set intro_done'], end: true },
        ],
      },
    },
  },

  // ───────────────────────────────────────────────────────── The Lantern Tree
  {
    id: 'lantern_tree', title: 'The Lantern Tree',
    start: [{ if: 'bell_rang', node: 'night' }, { node: 'fest' }],
    nodes: {
      fest: {
        speaker: 'dm',
        text: [
          { if: 'lantern_hung', text: `Your lantern hangs among the others now, one small light in a tree full of them. The crowd around the Lantern Tree has thickened; people are beginning to drift toward it for the midnight vigil.` },
          { text: `The Lantern Tree is an old oak at the heart of the square, so hung with lanterns that its branches seem to be made of light. Hundreds of them. Some bear names painted in careful letters — GRANDMOTHER ALIS, LITTLE TOM, THE FERRYMAN — and some bear no name at all.

A wooden board at its foot reads, in old and newer paint: FOR THOSE WE HAVE FORGOTTEN.` },
        ],
        options: [
          { text: `Hang your own lantern.`, if: '!lantern_hung', next: 'hang', tone: 'friendly' },
          { text: `Read the names on the lanterns.`, once: true, next: 'names', tone: 'curious', tags: ['curiosity'] },
          { text: `[History] Where does this custom come from?`, once: true, check: { skill: 'history', dc: 13 }, success: 'hist_ok', failure: 'hist_fail', tone: 'curious' },
          { text: `Wait for the midnight vigil.`, if: 'lantern_hung', next: 'vigil', tone: 'pragmatic' },
          { text: `Leave the tree for now.`, end: true, tone: 'leave' },
        ],
      },
      names: {
        speaker: 'dm',
        text: `You walk slowly around the trunk. MOTHER. OLD JEB WHO MENDED NETS. THE TWINS. Here and there, a lantern bears a name that has been painted over and repainted, as if someone kept forgetting and remembering it.

Near the bottom, a child's lantern reads, in wobbly letters: LIRA. A smaller hand has added: MY SISTER.`,
        interjections: [
          { who: 'ilyra', text: `"So many unnamed ones," Ilyra says softly. "People hanging lights for someone they can't remember. That's either the saddest thing I've ever seen or the bravest."` },
          { who: 'tessa', text: `Tessa tilts her head at the blank lanterns. "Every culture I've ever played for has a version of this. Lights for the missing. Songs for the lost. Nobody ever knows why." She doesn't sound amused, for once.` },
          { who: 'kael', text: `"Lira," Kael reads. "Written by a kid. Someone ought to tell that kid's parents their child is writing names on the Sad Tree." He says it lightly. He keeps looking at it.` },
        ],
        next: 'fest',
      },
      hist_ok: {
        speaker: 'dm',
        text: `You remember a footnote in a dry provincial history: the Festival of Lanterns is older than Hollowmere, older than the kingdom, possibly older than the Charter Reckoning itself. The earliest records describe it the same way — "for those we have forgotten" — as if the people who began it knew exactly what they were forgetting, and chose to remember that they had.`,
        next: 'fest',
      },
      hist_fail: {
        speaker: 'dm',
        text: `You rack your memory and come up with nothing but a vague sense that the custom is very old. An old woman nearby, overhearing, says cheerfully: "Nobody knows, dearie. That's rather the point, isn't it?"`,
        next: 'fest',
      },
      hang: {
        speaker: 'dm',
        text: `A girl with a tray of paper lanterns presses one into your hands before you can reach for coin — "Festival price for strangers: free, if you hang it properly." The paper is the colour of honey. There's a blank space for a name.`,
        options: [
          { text: `Paint a name: someone you lost.`, tone: 'compassionate', tags: ['tradition'], effects: ['set lantern_hung', 'set lantern_for lost'], next: 'hung_lost' },
          { text: `Leave it blank — for whoever you've forgotten.`, tone: 'curious', tags: ['curiosity'], effects: ['set lantern_hung', 'set lantern_for blank'], next: 'hung_blank' },
          { text: `Write the name of your party, all of you. "For the ones I travel with."`, tone: 'friendly', tags: ['humor'], effects: ['set lantern_hung', 'set lantern_for party'], next: 'hung_party' },
          { text: `[Acolyte] Bless it in the old words of the Six Lights before hanging it.`, if: 'bg:acolyte || class:cleric || class:paladin', tone: 'background', tags: ['faith'], effects: ['set lantern_hung', 'set lantern_for blessed'], next: 'hung_blessed' },
        ],
      },
      hung_lost: { speaker: 'dm', text: `You paint the name. It comes easier than you expected, and hurts more. The lantern finds a branch, and the branch seems glad of it.`, next: 'after_hang' },
      hung_blank: { speaker: 'dm', text: `You hang it blank. For a moment — just a moment — you could swear that letters begin to form on the paper, in handwriting you almost recognise. Then the light flickers and it is blank again.`, next: 'after_hang' },
      hung_party: { speaker: 'dm', text: `You write all your names, crowded together on the little lantern. It's not the custom. Nobody seems to mind.`,
        interjections: [
          { who: 'brakka', text: `Brakka grunts. "Hanging our names on a tree for the forgotten. Bit morbid." Then, quieter: "...Thank you."` },
          { who: 'nima', text: `"We're going to be legends," Nima announces. "Or a cautionary tale. Either way: lantern."` },
          { who: 'korr', text: `Korr looks at his name on the paper for a long moment, as though he has not seen it written in a while.` },
        ],
        next: 'after_hang' },
      hung_blessed: { speaker: 'dm', text: `You murmur the invocation of the Six Lights over the paper. When you reach the end — the place where some old prayer-books have a seventh line, scratched out — the lantern flares bright for an instant, though no wind has touched it.`, next: 'after_hang' },
      after_hang: {
        speaker: 'dm',
        text: `The festival goes on around you. Sister Maren is leading a small choir near the tree; Captain Hale is pretending not to watch a table of rowdy sellswords; an old woman at the edge of the square — the hedge-witch, people say — is staring at the cathedral ruin with an expression you can't read.

At midnight, the whole town will gather here for the vigil.`,
        options: [
          { text: `Wait for the midnight vigil now.`, next: 'vigil', tone: 'pragmatic' },
          { text: `Not yet — there's more of Hollowmere to see.`, end: true, tone: 'leave' },
        ],
      },
      vigil: {
        speaker: 'dm', decision: true,
        text: `The vigil means waiting here until midnight. Once it begins, there will be no wandering off to the inn or the market. If there is anyone you wanted to speak to first — the hedge-witch, the sister, the captain — now is the time.`,
        options: [
          { text: `"We wait." (Begin the midnight vigil.)`, tags: ['tradition', 'caution'], effects: ['clock 23:50'], next: 'go', voices: { orren: `"Let's wait with them. You learn a lot about a place by how it keeps its silences."`, seris: `"We should stand vigil with the town. It is the proper thing."` } },
          { text: `"Not yet. Let's look around a little more."`, tags: ['curiosity'], end: true, voices: { vaelis: `"Midnight will keep. That hedge-witch looked like she knew something. People who know things are my favourite people."`, kael: `"There's still a whole inn we haven't been thrown out of."`, nima: `"There's SO much we haven't poked yet."` } },
        ],
      },
      go: { speaker: 'dm', text: `You find a place in the crowd as the last songs fade. Lanterns sway. Someone passes around a flask of cider. Children are being hushed. The bells of the little town chapel begin to count down the hour…`, effects: ['dialogue midnight'], end: true },
      night: {
        speaker: 'dm',
        text: [
          { if: 'tree_glimpsed', text: `The Lantern Tree stands in the fog, its lanterns guttering. You know now what it remembers. It does not look like an oak to you anymore — it looks like a promise someone made a very long time ago.` },
          { text: `In the fog, the Lantern Tree's lights have dimmed to embers. As you watch, the painted name on one lantern fades — letter by letter, like frost melting — until the paper is blank.

The tree is humming. You feel it in your teeth. It is, you realise, the same note the bell rang.` },
        ],
        options: [
          { text: `[Resonance] Lay your hand on the trunk and listen. (Spend 1 Resonance)`, if: 'resunlocked && res>=1 && !tree_glimpsed', tone: 'resonance', tags: ['curiosity', 'forbidden'], effects: ['res -1', 'instab 1', 'set tree_glimpsed', 'clue mq_bell tree_vision'], next: 'glimpse' },
          { text: `Watch the names fade.`, once: true, next: 'fade', tone: 'compassionate' },
          { text: `Leave.`, end: true, tone: 'leave' },
        ],
      },
      fade: {
        speaker: 'dm',
        text: `You catch a lantern before its name disappears entirely. It read MARTIN. The woman beside you — eyes red, holding a little girl's hand — asks you, puzzled, why you are holding her lantern so carefully. She cannot remember why she hung it.`,
        interjections: [
          { who: 'ilyra', text: `Ilyra closes her eyes. "That's how it happens," she whispers. "Not with screaming. With people simply… not remembering why they're sad."` },
          { who: 'korr', text: `Korr's hands have closed into fists. There is nothing here to hit. You can see he knows it.` },
        ],
        next: 'night',
      },
      glimpse: {
        speaker: 'dm',
        text: `The bark is warm. Then it is not bark.

You stand in Hollowmere's square on a bright spring morning. The Lantern Tree is a sapling, staked and tied with ribbon. North, over the town wall, the Cathedral of Saint Orlen is whole — and its bell tower rises, tall and white, a bronze bell glinting in the open belfry. A young monk leans out of the tower and waves down at a cluster of children; one of them is pulling, delighted, on a rope that runs all the way up.

The bell rings. In that world, it has always rung.

Then you are back in the fog, your palm pressed to cold bark, and somebody is saying your name.`,
        interjections: [
          { who: 'vaelis', text: `Vaelis is staring at you. "Your eyes," he says. "For a moment they were — reflecting something that isn't here. Tell me everything. Slowly. With diagrams, if possible."` },
          { who: 'varek', text: `Varek steadies you with one gloved hand. "You went somewhere," he says softly. "The choir went quiet while you were gone. That has never happened before."` },
          { who: 'nima', text: `"WHAT did you just do," Nima breathes. "Do it again. No — don't. Yes. Maybe. Teach me."` },
        ],
        next: 'night',
      },
    },
  },

  // ───────────────────────────────────────────────────────── Midnight
  {
    id: 'midnight', title: 'The Bell That Never Rang',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `The chapel bell strikes twelve. The crowd falls silent, as it has every year, for the space of one breath.

And from the north — from beyond the town wall, from the ruined cathedral whose tower fell eighty years ago — a bell answers.

It is a deep, bronze note. It does not echo. It simply arrives, as if it had always been in the air and you have only now been allowed to hear it. Every lantern on the Lantern Tree flickers at once.

Nobody breathes.`,
        effects: ['set bell_rang', 'clock 00:02', 'quest mq_bell midnight'],
        next: 'b',
      },
      b: {
        speaker: 'dm',
        text: `At the edge of the crowd, the old hedge-witch drops her lantern. It rolls across the cobbles, still burning. "Halric?" she whispers. "Halric, is that you?"

Then the fog comes.

It pours over the town wall like milk over the lip of a bowl — grey, faintly luminous, utterly silent — and in the space of a dozen heartbeats the square is a world twenty feet wide. Lanterns become smudges. Voices become far away.

Somewhere in the fog, a man is saying "Wait — wait, where is —" and then he is not saying anything at all.`,
        next: 'c',
      },
      c: {
        speaker: 'dm',
        text: `The bell tolls again.

But this time, only you hear it.

The sound goes through you like a key through a lock. For one dizzying instant you are somewhere else — you are someone else — you are living a life that branched from yours long ago:`,
        next: 'flash',
      },
      flash: {
        speaker: 'dm',
        text: [
          { if: 'bg:soldier', text: `— you are standing in a muddy field under a banner you never served, and the sergeant beside you, who died in your arms years ago, is alive and laughing at a joke you haven't told yet —` },
          { if: 'bg:scholar', text: `— you are standing in a library that burned before you were born, reading a book whose title you will never remember, and every word in it is true —` },
          { if: 'bg:criminal', text: `— you are standing in a courtroom, and the judge is reading out a sentence for a crime you never committed, in a city that never caught you —` },
          { if: 'bg:acolyte', text: `— you are kneeling in a temple with seven altars, not six, and the seventh flame is burning, and everyone around you knows its name —` },
          { if: 'bg:noble', text: `— you are standing in your family's great hall, and the portrait of your grandmother has a different face, and everyone calls you by a name that is almost yours —` },
          { if: 'bg:entertainer', text: `— you are on a stage in front of ten thousand people, singing a song you never wrote, and they all know the words —` },
          { if: 'bg:outlander', text: `— you are walking a forest path that does not exist, toward a home that was never built, and someone at the door is waving —` },
          { text: `— you are standing in a village square that looks like this one, a long time ago, and someone who loves you is calling you home for supper, and you have never seen their face before —` },
        ],
        next: 'd',
      },
      d: {
        speaker: 'dm',
        text: `— and then you are back, gasping, on your knees on Hollowmere's cobbles, with your companions' hands on your shoulders.

Something has changed. You can feel it: a faint pressure behind your eyes, a sense of the world as a page that has been written over and over. You can see the faint seams where it has been erased.

(You have gained Aether Resonance. Certain places, objects and echoes can now be "glimpsed" by spending Resonance — revealing hidden memories, secrets and alternative solutions. Resonance is restored by a long rest.)`,
        effects: ['unlockres', 'add resonance_awakened 1'],
        interjections: [
          { who: 'brakka', text: `Brakka hauls you up one-handed. "Breathe. In, out. You're here. That's where you are." She does not let go until you're steady.` },
          { who: 'seris', text: `Seris's sword is half-drawn. "Something touched you," she says. "Something unholy — or holy. I can't tell which." That seems to frighten her more than anything else tonight.` },
          { who: 'ilyra', text: `Ilyra is already checking your pulse, your pupils, your breath. "You're all right," she says, in a voice that has said those words to a lot of frightened people. "Whatever that was. You're all right."` },
          { who: 'kael', text: `"Right," Kael says, a little too brightly. "So that's the mysterious bell. Lovely. Very atmospheric. Can we agree that nobody touches anything for the rest of the night?"` },
          { who: 'orren', text: `Orren is looking at you strangely — not afraid; thoughtful. One hand has gone to a pouch at his belt and stays there. "Something answered," he says quietly. "In my pocket. When you fell."` },
          { who: 'tessa', text: `Tessa's face has gone pale under the freckles. "That note," she whispers. "I know that note. I've got it written down in a book of songs nobody wrote." She doesn't explain. She looks like she's going to be sick.` },
          { who: 'korr', text: `Korr has turned toward the fog, every muscle taut. "Someone's out there calling my name," he says. "Someone who's dead." His voice is very steady. His hands are not.` },
          { who: 'nima', text: `Nima's fingertips are crackling with sparks she isn't making on purpose. "Oh, that's not good," she says. "That's not good at all. That's — honestly that's a little bit amazing."` },
          { who: 'varek', text: `Varek is very still. "They're singing," he says, so quietly only you can hear. "All of them. All at once. I've never heard them so loud." He doesn't say who.` },
          { who: 'vaelis', text: `Vaelis is scribbling furiously in a notebook by the light of his own conjured flame. "Resonance-sensitivity, spontaneous onset, triggered by an acoustic Veil event," he mutters. "That's — that's not supposed to be possible. Oh, this is wonderful. I mean: terrible. Wonderful."` },
        ],
        next: 'e',
      },
      e: {
        speaker: 'dm',
        text: `Screams, now — real ones, close. A woman stumbles out of the fog clutching a child's coat with no child in it. A man is shouting at his neighbour, "Who are you? Where's my wife? Who ARE you?" — and the neighbour, bewildered, is saying "Garret, it's me, it's always been me —"

Through the chaos, a bellowing voice: "WATCH! To me! Everyone else to the inn — the Lantern & Lamb — NOW!" Captain Hale is standing by the Lantern Tree with a torch, trying to hold a town together with nothing but lungs.`,
        options: [
          { text: `Go to Captain Hale.`, tone: 'pragmatic', tags: ['protect'], end: true },
        ],
      },
    },
  },

  // ───────────────────────────────────────────────────────── Captain Hale
  {
    id: 'hale', title: 'Captain Roderic Hale',
    start: [
      { if: 'bell_rang && !hale_briefed', node: 'brief' },
      { if: 'bell_rang', node: 'hub_night' },
      { node: 'fest' },
    ],
    nodes: {
      fest: {
        speaker: 'hale',
        text: `"Evening." The captain of Hollowmere's watch is a grey-bearded slab of a man in a coat that has been mended more times than it has been washed. He is watching a table of grey-feathered sellswords through the inn window with the patient expression of a man who knows exactly how his night is going to end. "Enjoying the festival? Good. Enjoy it quietly, and we'll be friends."`,
        options: [
          { text: `"Quiet night?"`, once: true, next: 'quiet', tone: 'friendly' },
          { text: `"What happened to the cathedral?"`, once: true, next: 'cath', tone: 'curious' },
          { text: `[Soldier] "You've the look of someone who served. Which company?"`, if: 'bg:soldier', once: true, next: 'soldier', tone: 'background' },
          { text: `"Anything strange going on in town lately?"`, once: true, next: 'strange', tone: 'curious' },
          { text: `"Enjoy your night, Captain."`, end: true, tone: 'leave', effects: ['set met_hale'] },
        ],
      },
      quiet: { speaker: 'hale', text: `"It will be, if those Grey Hawks in the Lantern & Lamb pay their tab and keep their hands to themselves. Their captain, Dag Morrow, starts fights like other men start conversations." He sighs. "And I've got four watchmen, one of whom is sixteen and one of whom is drunk."`, next: 'fest' },
      cath: { speaker: 'hale', text: `"Fell down. Eighty years back, before my time — before my father's time. A storm, they say, though the old folk call it the Night of Falling Stone like there was something more to it." He jerks his chin north. "Gate's closed after dark. Kids keep daring each other to go in and coming out with broken ankles. And there's been a fellow poking about up there lately — a scholar type, staying at the inn. Asking questions about foundations."`, effects: ['set heard_scholar'], next: 'fest' },
      soldier: { speaker: 'hale', text: `His eyes flick over you, measuring, and something in his shoulders eases. "Third Lowland Foot, a long time ago. Before the Covenant swallowed the regiments." He almost smiles. "You'll know, then, how it feels when the air's wrong before a battle. It's felt wrong for a week." He lowers his voice. "If anything happens tonight — I could use someone who knows which end of a sword goes in the other fellow."`, effects: ['set hale_trusts'], next: 'fest' },
      strange: { speaker: 'hale', text: `He hesitates, which is answer enough. "People… misremembering things. The Brennans swear they had a third son. Old Hob thinks the moon was bigger last year. The Tullys moved away last month — said their house 'felt like it belonged to someone else.'" He shakes his head. "Festival nerves. It'll pass."`, next: 'fest' },
      brief: {
        speaker: 'hale',
        text: `Hale grabs your arm as you reach him. His torch is shaking; his voice is not. "You. You were by the tree when — whatever that was. You all right? Good. I need people who are all right."

He counts on his fingers. "Seven gone that I know of. Just — gone, mid-sentence. Others swear blind their families are strangers. And there are things in the fog. Dogs that aren't dogs. People that aren't people." He swallows. "I've got four watchmen and a town that's forgetting itself."`,
        effects: ['set met_hale'],
        next: 'ask',
      },
      ask: {
        speaker: 'hale', decision: true,
        text: `"Three lots of folk I know are trapped and I can't reach them: the miller's family out at the east mill, Ysolde Quill in her shop, and a boy — Pell, little lad — who ran off toward the old well looking for a sister he hasn't got." He looks north, toward the unseen cathedral. "And that bell came from up there. Whatever's doing this is up there. I can't hold the town and go up there too.

Will you help us?"`,
        options: [
          { text: `"We'll help. Your people first, then the cathedral."`, tone: 'diplomatic', tags: ['protect', 'charity'], next: 'accept', voices: { brakka: `"There are children trapped out there. Of course we help."`, seris: `"This is what we are for. We help."`, ilyra: `"People are frightened and alone in that fog. Yes. Yes, we help."` } },
          { text: `"We'll help — for a fee. Hazard pay."`, tone: 'pragmatic', tags: ['greed', 'pragmatic'], next: 'fee', voices: { kael: `"Heroics are lovely, but they don't buy boots. Ask what he's paying."`, varek: `"Name a price. Gratitude has a very short memory, and tonight memories are evidently in short supply."` } },
          { text: `"The cathedral first. Stop the cause and the rest stops too."`, tone: 'pragmatic', tags: ['boldness', 'pragmatic'], next: 'cath_first', voices: { vaelis: `"Treat the disease, not the symptoms. The answer is in that cathedral."`, nima: `"Cathedral. Obviously cathedral. The big spooky bell is in the cathedral."`, korr: `"Go to where the enemy is. End it."` } },
          { text: `[Soldier] "Give me the situation, Captain. Positions, numbers, what you've seen."`, if: 'bg:soldier || hale_trusts', tone: 'background', tags: ['authority'], next: 'soldier_brief' },
        ],
      },
      accept: { speaker: 'hale', text: `Something in his face cracks with relief, just slightly. "Thank you. Thank the Lights — thank someone." He grips your hand. "The mill's east, past the smithy. Quill's shop is on the square, south-east corner. The old well's west, by the Pell family's house."`, next: 'leads' },
      fee: { speaker: 'hale', text: `He stares at you as if you've slapped him, then laughs — one short, ugly bark. "Fifty gold. It's what's in the watch chest. Bring my people home and it's yours." He doesn't look away. "I'll remember you asked, mind."`, effects: ['set hale_pay', 'rel kael respect 2'], next: 'leads' },
      cath_first: { speaker: 'hale', text: `"Maybe you're right." He doesn't sound like he believes it. "But if you pass the mill, or the well, or Quill's place… there are people in there who won't last till dawn. Don't make me choose which of them to write off."`, next: 'leads' },
      soldier_brief: { speaker: 'hale', text: `He straightens without meaning to. "Right. Fog's thickest east and west. The things in it hunt in packs, avoid fire, don't like the Lantern Tree. Three civilian groups cut off: mill, east; Quill's shop, south-east; the old well, west. The bell came from the cathedral, north. Gate's open — my lad on watch ran." A breath. "Do what you think best, soldier. I trust your judgement."`, effects: ['set hale_trusts'], next: 'leads' },
      leads: {
        speaker: 'hale',
        text: `"And if you're going up to the cathedral — talk to Old Wenna first. She's eighty-odd and she was there when the tower fell; she was shouting about that bell like she knew it. And Sister Maren keeps whatever's left of the cathedral's records. She's at the north gate with a lantern, the stubborn woman, waiting for the missing to find their way home."`,
        effects: ['set hale_briefed', 'quest mq_bell investigate', 'quest sq_fog_rescue start', 'hub hollowmere'],
        options: [{ text: `"We'll find them."`, end: true, tone: 'friendly' }],
      },
      hub_night: {
        speaker: 'hale',
        text: [
          { if: 'questdone:sq_fog_rescue', text: `Hale nods at you with something close to reverence. "Town's holding. Because of you. Whatever's up at that cathedral — go and end it."` },
          { text: `"Any luck?" Hale's voice is hoarse from shouting. Behind him, watchmen are herding families toward the inn.` },
        ],
        options: [
          { text: `"The trapped townsfolk — it's done."`, if: 'mill_resolved && shop_resolved && well_resolved && quest:sq_fog_rescue', next: 'report', tone: 'friendly' },
          { text: `"Remind me where the trapped people are."`, if: 'quest:sq_fog_rescue', next: 'remind', tone: 'pragmatic' },
          { text: `"We found the scholar who was digging under the cathedral. He's yours."`, if: 'corvin_fate=handed_over && !corvin_delivered', next: 'corvin', effects: ['set corvin_delivered'], tone: 'pragmatic' },
          { text: `"How are you holding up, Captain?"`, once: true, next: 'holding', tone: 'compassionate', tags: ['charity'] },
          { text: `"We'll keep going."`, end: true, tone: 'leave' },
        ],
      },
      remind: { speaker: 'hale', text: `"Miller's family at the mill, east. Ysolde Quill, her shop, south-east of the square. The Pell boy, west, at the old well."`, next: 'hub_night' },
      holding: { speaker: 'hale', text: `He's quiet a moment. "My wife asked me who I was tonight," he says. "Just for a second. Then she knew me again." He looks at his hands. "I keep thinking — what if next time she doesn't?" He clears his throat. "Go on. You've work to do."`, next: 'hub_night' },
      corvin: { speaker: 'hale', text: `Hale listens to your account with his jaw getting tighter and tighter. "Digging under the cathedral. On festival night." He signals two watchmen. "He'll answer for it — to the Mayor, and to whoever comes asking from the capital. And somebody will come asking." He looks at you. "Thank you. I think."`, next: 'hub_night' },
      report: {
        speaker: 'hale',
        text: [
          { if: 'rescued_count>=3', text: `You tell him: the miller's family, Ysolde, the Pell boy — every one of them safe. Hale closes his eyes. For a moment he just stands there with the fog moving around him. "All of them," he says. "All of them." When he opens his eyes they're wet, and he doesn't care who sees.` },
          { text: `You tell him what happened — who came home, and who did not. Hale listens without interrupting. "You went into that fog for strangers," he says at last. "Some came home because of you. Don't you dare carry the rest." He grips your shoulder hard.` },
        ],
        next: 'reward',
      },
      reward: {
        speaker: 'hale',
        text: `He unbuckles the old brigandine coat from beneath his cloak and holds it out. "My captain's coat. Blessed at the cathedral, back when there was a cathedral to bless things. It'll do more good on your back than on mine tonight."`,
        effects: ['give wardens_mail', 'rep hollowmere 10'],
        options: [
          { text: `Accept it with thanks.`, if: '!hale_pay', tone: 'friendly', effects: ['complete sq_fog_rescue all'], next: 'done_r' },
          { text: `Accept it — and the fifty gold you were promised.`, if: 'hale_pay', tone: 'pragmatic', tags: ['greed'], effects: ['gold 50', 'complete sq_fog_rescue all'], next: 'done_r' },
          { text: `"Keep the gold, Captain. Buy your watch a drink when this is over."`, if: 'hale_pay', tone: 'compassionate', tags: ['charity'], effects: ['complete sq_fog_rescue all', 'rep hollowmere 5'], next: 'done_r' },
        ],
      },
      done_r: { speaker: 'hale', text: `"Now go and silence that bloody bell."`, end: true },
    },
  },

  // ───────────────────────────────────────────────────────── Sister Maren
  {
    id: 'maren', title: 'Sister Maren Ash',
    start: [{ if: 'bell_rang', node: 'night' }, { node: 'fest' }],
    nodes: {
      fest: {
        speaker: 'maren',
        text: `A slight woman in the grey of the Lucent Faith's lay sisters is handing out unlit lanterns to children, one by one, with a word for each. Her fingers are stained with ink. When she turns to you, she smiles the way some people apologise.

"Welcome to Hollowmere. You'll want a lantern — no? You've one already. Good." She glances at the two lanterns hooked to her own belt. "I'm Sister Maren. I keep the old cathedral's records, for all that there's not much cathedral left to keep them for."`,
        effects: ['set met_maren'],
        options: [
          { text: `"Tell me about the cathedral."`, once: true, next: 'cath', tone: 'curious', tags: ['curiosity'] },
          { text: `"Who was Saint Orlen?"`, once: true, next: 'orlen', tone: 'curious' },
          { text: `"You carry two lanterns."`, once: true, next: 'two', tone: 'compassionate' },
          { text: `[Religion] "The mural in your chapel — why does it leave space for seven lights?"`, once: true, check: { skill: 'religion', dc: 13 }, success: 'seventh_ok', failure: 'seventh_fail', tone: 'curious' },
          { text: `"Enjoy the festival, Sister."`, end: true, tone: 'leave' },
        ],
      },
      cath: { speaker: 'maren', text: `"Saint Orlen's was the pride of the frontier, once. Pilgrims came from as far as Ashenford. Then, eighty years ago, on what the old folk call the Night of Falling Stone, the bell tower came down. A storm, the records say. The roof followed within a decade." She hesitates. "The odd thing is, the undercroft was sealed the very same week, by order of the bishop. The records don't say why. Just: 'that what was found below may stay below.'"`, effects: ['set heard_sealed'], next: 'fest' },
      orlen: { speaker: 'maren', text: `"Brother Orlen of the Lamp. Four hundred years ago a fog came down on this valley and stayed for nine days — they say people walked out into it and never came back. Orlen climbed the bell tower and rang the bell, day and night, nine days without sleep, so the lost could follow the sound home." She smiles faintly. "They made him a saint for it. The bell was called Orlen's Voice. It was never found in the rubble, you know. Just… gone."`, effects: ['set knows_bell_missing'], next: 'fest' },
      two: {
        speaker: 'maren',
        text: [
          { if: 'maren_forgets', text: `She looks down at the two lanterns as though seeing them for the first time. "Two," she says slowly. "I — that's strange. I only needed one. For my mother." She laughs uncertainly. "I must have picked up an extra. Silly. Would you like it?"` },
          { text: `Her hand goes to them, protective. "One is for my mother. The other is for my daughter. Elsa." She says the name carefully, like setting down something fragile. "She was seven. Eight years ago she — " A pause. "No one else remembers her. Not the midwife, not the neighbours, not the parish register. I have stopped asking them to." She smiles that apologising smile. "So I hang a lantern. It's what the festival is for, isn't it?"` },
        ],
        options: [
          { text: `"I believe you."`, tone: 'compassionate', tags: ['mercy'], effects: ['set maren_believed'], next: 'believe', if: '!maren_forgets' },
          { text: `[Insight] Study her face.`, check: { skill: 'insight', dc: 12 }, success: 'insight_ok', failure: 'insight_fail', tone: 'curious', if: '!maren_forgets' },
          { text: `Change the subject gently.`, next: 'fest', tone: 'diplomatic' },
        ],
      },
      believe: { speaker: 'maren', text: `For a moment Sister Maren simply looks at you. Then her eyes fill, and she laughs — a small, startled sound — and wipes them with an inky thumb. "Thank you," she says. "You've no idea. Thank you." She presses your hand. "If there's ever anything I can do for you. Anything."`, interjections: [{ who: 'ilyra', text: `Ilyra touches Maren's arm, and says nothing at all, which is exactly right.` }], next: 'fest' },
      insight_ok: { speaker: 'dm', text: `Grief, yes — old, worn smooth by handling. But beneath it something sharper: hope. Not the gentle kind. The kind that has been offered something, recently, and is afraid to believe it. Whatever Maren has been promised, she has not told anyone.`, effects: ['set maren_hope_noticed'], next: 'fest' },
      insight_fail: { speaker: 'dm', text: `Grief, plainly. Whatever else might be there, she keeps it well hidden behind that apologetic smile.`, next: 'fest' },
      seventh_ok: { speaker: 'maren', text: `She blinks at you, then nods slowly. "You know the old prayer-books. The empty niche is for 'the Silent Light' — some theologians say it's for a saint whose name was lost, others that it's for the light within each of us." She lowers her voice. "In the oldest books, there's a seventh line in the invocation. It's always scratched out. Every copy I've ever seen. As if someone went through every book in the world with a knife."`, effects: ['set knows_silent_light'], next: 'fest' },
      seventh_fail: { speaker: 'maren', text: `"Oh, that's just tradition," she says. "A space for the saints we haven't met yet." It sounds like something she was taught as a girl, and never questioned.`, next: 'fest' },
      night: {
        speaker: 'maren',
        text: `Sister Maren stands just inside the open north gate, a lantern raised in each hand, as if she could light a path through the fog for anyone lost in it. Her face is wet. She doesn't seem to notice.

"They're coming back, aren't they?" she says when she sees you. "The ones who vanished. If there's a light to follow."`,
        options: [
          { text: `"Sister — Captain Hale says you keep the cathedral's records. We're going up there."`, if: '!item:maren_key', next: 'key', tone: 'pragmatic' },
          { text: `"What do you know about the undercroft?"`, once: true, next: 'under', tone: 'curious' },
          { text: `"Come with us. You know the cathedral better than anyone."`, once: true, next: 'come', tone: 'friendly' },
          { text: `"The ones who vanished… do you think they can be brought back?"`, once: true, next: 'back', tone: 'compassionate' },
          { text: `"Stay safe, Sister."`, end: true, tone: 'leave' },
        ],
      },
      key: {
        speaker: 'maren',
        text: `She fumbles at her belt and presses an old iron key into your palm. "The sacristy. There's a stair from it down to the undercroft — sealed with mortar eighty years ago, but the mortar's rotten. And the old records are in a chest there; I could never bear to move them all." She closes your fingers over the key. "The bell tower fell on the Night of Falling Stone. The bishop sealed the undercroft that same week, 'that what was found below may stay below.' And the bell was never found in the rubble. Never. I've read every page." Her voice drops. "Whatever was found below… I think it has come back up."`,
        effects: ['give maren_key', 'clue mq_bell maren_records', 'set met_maren'],
        next: 'night',
      },
      under: { speaker: 'maren', text: `"Catacombs. An ossuary for the old cathedral guard. A chapel. And below that — the records only call it 'the Old Floor.' The builders found it when they dug the foundations. They built the cathedral on top of it on purpose, Sister Ennis wrote, 'so that the Lamp may keep watch.'" She shivers. "I always thought that was a metaphor."`, next: 'night' },
      come: { speaker: 'maren', text: `"I can't." She lifts the lanterns a little higher. "Someone has to hold the light. If anyone finds their way back out of the fog, I want them to see it." A small, terrible smile. "I've had practice waiting for people who don't come home."`, next: 'night' },
      back: {
        speaker: 'maren',
        text: [
          { if: 'maren_forgets', text: `"Brought back?" She frowns, as though the idea had never occurred to her. "I don't know. I don't think I've ever lost anyone that way." She hesitates. "Why does that make me feel so empty?"` },
          { text: `Something flickers in her face — something quick and bright and quickly hidden. "There are people who believe it," she says carefully. "Learned people. People with… resources." She looks at the fog. "I have to believe it. You understand. I have to."` },
        ],
        next: 'night',
      },
    },
  },

  // ───────────────────────────────────────────────────────── Old Wenna
  {
    id: 'wenna', title: 'Old Wenna',
    start: [{ if: 'bell_rang', node: 'night' }, { node: 'fest' }],
    nodes: {
      fest: {
        speaker: 'wenna',
        text: `An old woman sits on a stool outside a cottage bristling with drying herbs, smoking a clay pipe and watching the cathedral ruin over the rooftops. She is tiny, ancient, and has eyes like two chips of flint.

"Well, don't loom," she says. "Sit or buy something. I sell charms, cures, and the truth, in descending order of popularity."`,
        effects: ['set met_wenna'],
        options: [
          { text: `"Show me your wares." (Trade)`, effects: ['shop wenna'], next: 'fest', tone: 'pragmatic' },
          { text: `"You keep looking at the cathedral."`, once: true, next: 'looking', tone: 'curious' },
          { text: `"Read my fortune."`, once: true, next: 'fortune', tone: 'friendly', tags: ['humor'] },
          { text: `[Nature] Examine the herbs hanging by her door.`, once: true, check: { skill: 'nature', dc: 12 }, success: 'herbs_ok', failure: 'herbs_fail', tone: 'curious' },
          { text: `"Good evening, Wenna."`, end: true, tone: 'leave' },
        ],
      },
      looking: {
        speaker: 'wenna',
        text: `"I was eight when that tower fell." She puffs on her pipe. "I remember it. Stone coming down like hail. The bell going quiet in the middle of a peal." She taps the pipe against her teeth. "And I remember being twenty-three and getting married under that same tower, with the bell ringing so loud my husband couldn't hear me say yes. Brother Halric rang it for us. Brother Halric Venn, the bell-warden, who used to let us children swing on the rope."

She looks at you sidelong. "Both memories, love. I've had them all my life. One of them can't be true. I stopped telling people about it sixty years ago, because they look at you just like you're looking at me now."`,
        effects: ['set knows_halric', 'clue mq_bell wenna_halric'],
        interjections: [
          { who: 'brakka', text: `Brakka has gone very still. "Two memories," she says. "Of the same place. One where it stands and one where it fell." She looks at the old woman as if seeing a mirror. "I know how that feels."` },
          { who: 'vaelis', text: `"Fascinating," Vaelis breathes. "Bilocal memory with a consistent divergence point. Madam, may I ask you some questions? Many questions? For several hours?" "No," says Wenna.` },
        ],
        next: 'fest',
      },
      fortune: {
        speaker: 'wenna',
        text: `She takes your hand, turns it palm-up, and does not look at it at all. She looks at your face.

"You're going to hear something tonight that nobody else hears. You're going to be offered something old and heavy, and everyone will want it from you. You'll have to choose what the world remembers." She lets go. "Two coppers."`,
        options: [
          { text: `Pay her. (1 gold, she doesn't have change)`, if: 'gold>=1', effects: ['gold -1', 'set wenna_paid'], next: 'paid', tone: 'friendly' },
          { text: `"That was alarmingly specific."`, next: 'specific', tone: 'sarcastic', tags: ['humor'] },
        ],
      },
      paid: { speaker: 'wenna', text: `She pockets the coin. "Generous. You'll need that, too." She doesn't elaborate.`, next: 'fest' },
      specific: { speaker: 'wenna', text: `"Specific fortunes cost extra. That one was free." Her flint eyes glint. "Come back after midnight if you still think I'm a fraud."`, next: 'fest' },
      herbs_ok: { speaker: 'dm', text: `Rue, angelica, rowan, and a sprig of something silver-grey you have only seen in old herbals: "memory-moss," said to grow only where the veil between the living and the dead is thin. She has a lot of it.`, effects: ['set saw_memory_moss'], next: 'fest' },
      herbs_fail: { speaker: 'dm', text: `Herbs. Definitely herbs. One of them sneezes.`, next: 'fest' },
      night: {
        speaker: 'wenna',
        text: [
          { if: 'got_wenna_charm', text: `Wenna is sitting in her doorway with a bowl of salt across her knees and a knife in her hand. "Still alive, then. Good. Go on — the bell won't silence itself."` },
          { text: `Wenna is sitting in her doorway with a bowl of salt across her knees and a knife in her hand. When she sees you, she sets both down.

"You heard it twice," she says. It isn't a question. "The second toll. Nobody else did. I saw your face."` },
        ],
        options: [
          { text: `"What's happening to me?"`, if: '!got_wenna_charm', next: 'res', tone: 'curious' },
          { text: `"The bell — you called out a name. Halric."`, once: true, next: 'halric', tone: 'curious' },
          { text: `"Show me your wares." (Trade)`, effects: ['shop wenna'], next: 'night', tone: 'pragmatic' },
          { text: `"Stay inside, Wenna."`, end: true, tone: 'leave' },
        ],
      },
      res: {
        speaker: 'wenna',
        text: `"Resonance, my granny called it. Some folk are born able to hear where the world's been written over. Others get it knocked into them." She taps your chest. "You can feel the seams now. Places where the world remembers being different. Lay your hand on them and you'll see what was there — a memory, a door that used to be, a name someone lost."

She holds up a bony finger. "But it costs. Every time, a little of you goes into the crack. Sleep and it comes back. Spend it all and keep pushing, and one day you won't come back from what you see." She presses something into your hand: knotted hair, a blue glass bead, a sprig of rue. "Wear that. It won't help much. It'll help a little."`,
        effects: ['give wenna_charm', 'set got_wenna_charm'],
        next: 'night',
      },
      halric: {
        speaker: 'wenna',
        text: `Her mouth works. "Brother Halric Venn. He rang Orlen's Voice. In one of my lives he died when the tower fell, under all that stone. In the other he rang it for eighty more years, till his hands were twisted like roots." She looks north. "That was him ringing tonight. I'd know his hands on that rope anywhere." Her voice drops to a whisper. "If you find him up there, and he's — wrong — call him by his name. Somebody should."`,
        effects: ['set knows_halric', 'clue mq_bell wenna_halric'],
        next: 'night',
      },
    },
  },

  // ───────────────────────────────────────────────────────── Resting at the inn
  {
    id: 'inn_rest', title: 'Your Rooms at the Lantern & Lamb',
    start: [{ if: 'bell_rang', node: 'night' }, { node: 'fest' }],
    nodes: {
      fest: {
        speaker: 'dm',
        text: `Tobin has given you two rooms at the top of the stairs, small and warm and smelling of lavender. Through the floorboards, the festival is very loud.`,
        options: [
          { text: `Gather the party in your room. (Open Camp: talk privately, manage the party and equipment)`, effects: ['camp'], end: true, tone: 'friendly' },
          { text: `Try to sleep.`, next: 'nosleep', tone: 'pragmatic' },
          { text: `Head back down.`, end: true, tone: 'leave' },
        ],
      },
      nosleep: { speaker: 'dm', text: `You lie down. The fiddler downstairs launches into his eleventh reprise of "The Miller's Unfortunate Goat." Sleep is not going to happen before the midnight vigil. (A short rest is still possible from the party menu.)`, next: 'fest' },
      night: {
        speaker: 'dm',
        text: `Your rooms are crowded now with blankets and frightened neighbours — Tobin has put refugees everywhere — but the bed by the window is still yours. Outside, the fog presses against the glass. The sky has not changed colour in hours.`,
        options: [
          { text: `Gather the party in your room. (Open Camp)`, effects: ['camp'], end: true, tone: 'friendly' },
          { text: `Take a long rest. (8 hours; restores HP, spells, abilities and Resonance)`, next: 'rest', tone: 'pragmatic' },
          { text: `Head back down.`, end: true, tone: 'leave' },
        ],
      },
      rest: {
        speaker: 'dm',
        text: `You sleep like the dead, which tonight is not a comfortable phrase. When you wake, it should be morning. It isn't. The fog still hangs over Hollowmere, and the sky is the colour of pewter. Dawn, it seems, is waiting for something.`,
        effects: ['rest long'],
        options: [{ text: `Get up.`, end: true }],
      },
    },
  },

  // ───────────────────────────────────────────────────────── Cathedral investigation
  {
    id: 'tower_shaft', title: 'The Fallen Tower',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `The base of the old bell tower is a heap of broken stone, roofed with sky. At its heart, a ragged hole drops away into darkness — the shaft where the tower's foundations went down, before the tower came down after them. Cold air breathes up out of it, carrying the smell of old bone.`,
        options: [
          { text: `Drop a stone and listen.`, once: true, check: { skill: 'perception', dc: 10 }, success: 'listen_ok', failure: 'listen_fail', tone: 'curious' },
          { text: `[Athletics] Climb down.`, check: { skill: 'athletics', dc: 12, advIf: 'item:rope' }, success: 'climb_ok', failure: 'climb_fail', tone: 'aggressive', tags: ['boldness'] },
          { text: `Leave it.`, end: true, tone: 'leave' },
        ],
      },
      listen_ok: { speaker: 'dm', text: `Clack… clack… clatter. About thirty feet, onto stone, not water. And something else, after: a faint metallic shiver, as if the falling stone had brushed a bell. (A rope would make the climb much safer.)`, next: 'a' },
      listen_fail: { speaker: 'dm', text: `The stone vanishes. You don't hear it land. That is either very reassuring or very much not.`, next: 'a' },
      climb_ok: { speaker: 'dm', text: `Hand over hand down the broken stonework, your companions following, until your boots meet a floor of old flagstones. You are in the undercroft.`, effects: ['goto undercroft 4 7'], end: true },
      climb_fail: { speaker: 'dm', text: `A handhold crumbles. You fall the last ten feet and land hard — but you land, and you're in. Your companions climb down after you, considerably more carefully.`, effects: ['damage 1d6 bludgeoning', 'goto undercroft 4 7'], end: true },
    },
  },
  {
    id: 'bell_rope', title: 'The Bell Rope',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `In the rubble of the tower base hangs a bell rope: thick, old, frayed hemp, its tail coiled on the stones. It hangs straight and taut. You follow it upward with your eyes — and twenty feet up, it simply ends, in mid-air, tied to nothing at all.

It sways very slightly, as if someone, somewhere, has just let go of it.`,
        options: [
          { text: `Pull the rope.`, if: '!rope_pulled', tone: 'aggressive', tags: ['boldness', 'curiosity'], effects: ['set rope_pulled', 'instab 1'], next: 'pull',
            voices: { nima: `"Pull it. Obviously pull it. When are you ever going to get to pull a rope tied to nothing?"`, orren: `"Leave it be. Some things are hanging there for a reason."`, kael: `"Don't pull the haunted rope. I can't believe I have to say that."` } },
          { text: `[Arcana] Study it without touching it.`, once: true, check: { skill: 'arcana', dc: 13 }, success: 'arc_ok', failure: 'arc_fail', tone: 'curious', tags: ['knowledge'] },
          { text: `Leave it alone.`, end: true, tone: 'leave', tags: ['caution'] },
        ],
      },
      pull: {
        speaker: 'dm',
        text: `The rope is heavier than it should be. You haul — and far below your feet, muffled by stone and earth, a bell tolls once. The floor trembles. Dust sifts down from the broken walls.

Somewhere beneath the cathedral, something huge turns toward the sound.`,
        interjections: [
          { who: 'vaelis', text: `"Well," says Vaelis. "Now it knows we're here. Excellent experimental design, truly."` },
          { who: 'korr', text: `Korr bares his teeth at the floor. "Good. Let it come."` },
          { who: 'seris', text: `"That was reckless," Seris says. But her hand is steady on her sword, and she has moved to stand beside you.` },
        ],
        next: 'a',
      },
      arc_ok: { speaker: 'dm', text: `The rope exists twice. Here, rotting in the rubble — and somewhere else, in a tower that never fell, still tied to a bell that is still ringing. The two ropes overlap like a double exposure on a painter's sketch. Where they meet, the world is very thin.`, effects: ['set knows_double_rope'], next: 'a' },
      arc_fail: { speaker: 'dm', text: `Strong magic, definitely. Old. Possibly a curse, possibly a prayer. Possibly just a very stubborn rope.`, next: 'a' },
    },
  },
  {
    id: 'altar', title: 'The High Altar',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: [
          { if: 'altar_open', text: `The altar stands as before. Behind it, the hidden door in the apse wall stands open on a stair going down into the dark.` },
          { text: `The high altar is a block of pale stone on a raised dais, carved along its face with a row of lanterns in relief. The smell of incense is strongest here: sweet, smoky, fresh. A ring of melted candle-stubs surrounds it — burned within the last hour, though there is no one here.

Count the carved lanterns: seven. In most temples of the Six Lights, there would be six.` },
        ],
        options: [
          { text: `Press the third lantern carving. (You know where to look.)`, if: '!altar_open && knows_altar_secret', tone: 'pragmatic', effects: ['reveal cathedral secret_door', 'set altar_open'], next: 'opens' },
          { text: `[Investigation] Search the altar carefully.`, if: '!altar_open', check: { skill: 'investigation', dc: 14 }, success: 'inv_ok', failure: 'inv_fail', tone: 'curious' },
          { text: `[Resonance] Touch the altar and see what it remembers. (Spend 1 Resonance)`, if: '!altar_open && resunlocked && res>=1', tone: 'resonance', tags: ['curiosity'], effects: ['res -1', 'instab 1', 'clue mq_bell altar_vision'], next: 'glimpse' },
          { text: `[Religion] Why seven lanterns?`, once: true, check: { skill: 'religion', dc: 12, advIf: 'knows_silent_light' }, success: 'rel_ok', failure: 'rel_fail', tone: 'curious', tags: ['faith'] },
          { text: `[Perception] Examine the incense and candles.`, once: true, check: { skill: 'perception', dc: 11 }, success: 'per_ok', failure: 'per_fail', tone: 'curious' },
          { text: `Step back.`, end: true, tone: 'leave' },
        ],
      },
      inv_ok: { speaker: 'dm', text: `Fresh wax on the third carved lantern — only there, pressed into the stone's grooves by a thumb, over and over. You press it. Something deep in the altar goes clunk, and with a grinding sigh, a section of the apse wall behind the altar slides inward.`, effects: ['reveal cathedral secret_door', 'set altar_open', 'xp 25'], next: 'opens' },
      inv_fail: { speaker: 'dm', text: `You run your hands over cold stone and find nothing but grime and old wax. Whatever this altar is hiding, it's hiding it well. (Perhaps someone in Hollowmere knows more — or perhaps there are other ways down.)`, next: 'a' },
      glimpse: {
        speaker: 'dm',
        text: `The stone warms under your palm. Candlelight blooms. The cathedral is whole around you, roofed and glowing, and a young monk in a bell-warden's sash hurries to the altar, glances over his shoulder, and presses the third carved lantern with his thumb. Behind the altar, a door slides open in the wall. He slips through. It closes.

Back in the ruin, your thumb is resting on the third lantern.`,
        options: [{ text: `Press it.`, effects: ['reveal cathedral secret_door', 'set altar_open', 'xp 25'], next: 'opens' }],
      },
      opens: {
        speaker: 'dm',
        text: `Behind the altar, a narrow doorway gapes in the apse wall: a tight stair spiralling down into darkness. A breath of cold air rises from it, and on that air, very faintly, the sound of a bell still humming after a toll.`,
        interjections: [
          { who: 'kael', text: `"Secret door behind an altar." Kael sounds almost offended. "Every cathedral in the world, I swear. Priests have no imagination."` },
          { who: 'orren', text: `Orren sniffs the air from the stair. "Something's been going up and down these steps. Boots. One person, many times."` },
        ],
        options: [{ text: `Done.`, end: true }],
      },
      rel_ok: { speaker: 'dm', text: `The seventh lantern is the Silent Light: the saint with no name, for whom every temple of the Six keeps an empty niche. But here, unlike anywhere you've seen, the seventh lantern wasn't chiselled off. Someone carved it, and someone else, later, tried to scrape it away — and gave up halfway, as if their hand wouldn't obey.`, next: 'a' },
      rel_fail: { speaker: 'dm', text: `Six Lights, seven lanterns. Maybe the carver couldn't count. Maybe the extra one is for luck.`, next: 'a' },
      per_ok: { speaker: 'dm', text: `The candle-stubs aren't ordinary tallow — they're temple beeswax, the kind used eighty years ago, and the incense is a blend the Lucent Faith stopped using generations back. Whoever lit these didn't bring them. They were lit somewhere else, in some other year, and burned down here.`, effects: ['set saw_old_candles'], next: 'a' },
      per_fail: { speaker: 'dm', text: `Candles. Incense. Recently lit. The smell makes your eyes water.`, next: 'a' },
    },
  },
  {
    id: 'mural', title: 'Mural of the Six Lights',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `On the north wall, a faded mural shows the Six Lights of the Lucent Faith as six robed figures, each holding a lantern aloft — the Hearth, the Lamp, the Star, the Forge, the Tide and the Dawn. Between the fourth and fifth figures there is a gap: a seventh space, painted as an empty niche with a closed door in it.`,
        options: [
          { text: `[History] Look closer at the brushwork.`, once: true, check: { skill: 'history', dc: 13 }, success: 'hist_ok', failure: 'hist_fail', tone: 'curious' },
          { text: `[Acolyte] Recite the old invocation before it.`, if: 'bg:acolyte || class:cleric || class:paladin', once: true, next: 'pray', tone: 'background', tags: ['faith'] },
          { text: `Move on.`, end: true, tone: 'leave' },
        ],
      },
      hist_ok: { speaker: 'dm', text: `The mural has been painted over an older one. Where the plaster has flaked away near the empty niche, you can see a fragment of the original: a seventh figure — a young woman in an archivist's robes, holding not a lantern but a book. Her face has been carefully, deliberately scraped off.`, effects: ['set saw_seventh_figure'], interjections: [{ who: 'seris', text: `Seris stares at the scraped face for a long time. "That's not in any catechism I was taught," she says. Her voice is very quiet.` }, { who: 'ilyra', text: `Ilyra touches the flaked plaster gently. "Someone painted over a saint," she murmurs. "Who has the authority to do that? And why does it make me so sad?"` }], next: 'a' },
      hist_fail: { speaker: 'dm', text: `Old paint, older plaster. The empty niche looks like it has always been empty.`, next: 'a' },
      pray: { speaker: 'dm', text: `You speak the invocation of the Six. When you reach the end, your tongue — unbidden — tries to shape a seventh line, a name you have never learned. It slips away before you can catch it. For a moment the painted door in the empty niche seems to stand ajar.`, effects: ['set felt_silent_light'], next: 'a' },
    },
  },
  {
    id: 'wall_marks', title: 'Scratched Marks',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `Low on the west wall, at the height of a kneeling person, the stone is covered in scratches — thousands of them, overlapping, some deep enough to have drawn the stone into powder. In places there are brown stains at the ends of the strokes.`,
        options: [
          { text: `[Arcana] Are these magical?`, once: true, check: { skill: 'arcana', dc: 13 }, success: 'arc_ok', failure: 'arc_fail', tone: 'curious', tags: ['knowledge'] },
          { text: `[History] Is this writing?`, once: true, check: { skill: 'history', dc: 13 }, success: 'arc_ok', failure: 'arc_fail', tone: 'curious', tags: ['knowledge'] },
          { text: `Leave them.`, end: true, tone: 'leave' },
        ],
      },
      arc_ok: {
        speaker: 'dm',
        text: `It is writing — Old Ithari, the dead language of the empire that came before every kingdom on the map. The same two words, scratched over and over and over, by fingernails:

REMEMBER US.`,
        effects: ['set saw_remember_us'],
        interjections: [
          { who: 'vaelis', text: `Vaelis has gone pale. "Old Ithari," he says. "Nobody alive speaks it. Nobody has spoken it for two thousand years." He swallows. "Whoever wrote this was very recently here."` },
          { who: 'varek', text: `Varek's violet eyes have narrowed. "Remember us," he repeats, so softly you barely hear it. "That's what they sing. Every night." He doesn't say who.` },
          { who: 'tessa', text: `Tessa traces one line in the air without touching it. "It's got a rhythm," she whispers. "Re-mem-ber us. Like a chorus." She looks ill.` },
        ],
        next: 'a',
      },
      arc_fail: { speaker: 'dm', text: `Scratches. Thousands of them. You decide very firmly not to think about the stains.`, next: 'a' },
    },
  },
  {
    id: 'sacristy_records', title: 'The Sacristy Records',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `A chest of mouldering ledgers and loose pages: tithe accounts, baptisms, repairs to the roof. The last entries are dated eighty years ago, in an increasingly shaky hand.`,
        options: [
          { text: `[Investigation] Find the entries about the Night of Falling Stone.`, once: true, check: { skill: 'investigation', dc: 11 }, success: 'ok', failure: 'fail', tone: 'curious' },
          { text: `Close the chest.`, end: true, tone: 'leave' },
        ],
      },
      ok: {
        speaker: 'dm',
        text: `"The tower is fallen and Br. Halric with it, though we have not found him, nor Orlen's Voice, though every stone was turned. The bell is not in the rubble. It is not anywhere."

And, a week later, in the bishop's own hand: "We have opened the Old Floor beneath the undercroft and found it already open. By my order the stair is sealed, that what was found below may stay below. May the Lamp keep watch. May the Silent Light forgive us."`,
        effects: ['clue mq_bell maren_records', 'set knows_bell_missing', 'xp 25'],
        next: 'a',
      },
      fail: { speaker: 'dm', text: `The pages crumble at your touch, and the ink has run. You make out "tower," "Halric," and "below," and then the paper comes apart in your hands.`, next: 'a' },
    },
  },

  // ───────────────────────────────────────────────────────── Undercroft
  {
    id: 'ossuary_memory', title: 'A Resonant Niche',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: [
          { if: 'halric_vision_done', text: `The niche is just a niche again: old bones, a rotted sash, a small bronze handbell.` },
          { text: `Among the bone-filled niches of the ossuary, one is different. Its bones are arranged with care, and on top of them lies a rotted sash — a bell-warden's sash — and a small bronze handbell. The air around it is warm, and your skin prickles. The world is thin here.` },
        ],
        options: [
          { text: `[Resonance] Touch the handbell. (Spend 1 Resonance)`, if: 'resunlocked && res>=1 && !halric_vision_done', tone: 'resonance', tags: ['curiosity'], effects: ['res -1', 'instab 1', 'set halric_vision_done', 'set knows_halric', 'clue mq_bell halric_vision'], next: 'vision' },
          { text: `[History] Read the worn inscription on the niche.`, once: true, check: { skill: 'history', dc: 13 }, success: 'hist_ok', failure: 'hist_fail', tone: 'curious' },
          { text: `Leave it in peace.`, end: true, tone: 'leave', tags: ['tradition'] },
        ],
      },
      vision: {
        speaker: 'dm',
        text: `The handbell is warm as a living hand.

A young monk, laughing, lets a gaggle of children take turns hauling on a bell rope that is far too heavy for them; he pretends to be pulled off his feet each time the bell swings. "Again, Brother Halric! Again!" A little girl with flint-chip eyes shrieks with delight.

An old monk, hands twisted like roots, ringing the same bell alone in a white tower at dusk, eighty years later, in a Hollowmere where the tower never fell. He rings for weddings. He rings for funerals. He rings because someone must.

And then: a night of strange stars. The tower around him shudders and dissolves like sugar in rain. He is falling — through stone, through years — still holding the rope, still holding the bell, and the bell is closing over him like a mouth —

You let go.`,
        interjections: [
          { who: 'ilyra', text: `"That poor man," Ilyra says, when you tell her. "He rang for them all his life. And now he can't stop."` },
          { who: 'korr', text: `Korr says nothing for a long moment. "A man who did his duty," he says finally, "until his duty ate him." He looks away.` },
        ],
        next: 'a',
      },
      hist_ok: { speaker: 'dm', text: `The letters are worn almost flat: "BR. H. VENN, WARDEN OF THE BELL. HE RANG US HOME." Below, scratched later by a different hand: "BUT NOT THIS TIME."`, effects: ['set knows_halric'], next: 'a' },
      hist_fail: { speaker: 'dm', text: `The inscription is too worn to read. The first letter might be a B. Or an R. Or a crack.`, next: 'a' },
    },
  },
  {
    id: 'chapel_font', title: 'The Dry Font',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `A stone font, long dry, stands before the chapel's small altar. Around its rim, worn letters spell out what looks like the words of a lullaby: "Hush now, the lantern's lit, the bell will bring you home…"`,
        options: [
          { text: `[Religion] Speak a blessing over the font.`, once: true, check: { skill: 'religion', dc: 12 }, success: 'bless', failure: 'nobless', tone: 'background', tags: ['faith'] },
          { text: `Hum the lullaby.`, if: 'quest:sq_lira', once: true, next: 'hum', tone: 'compassionate', tags: ['mercy'] },
          { text: `Step away.`, end: true, tone: 'leave' },
        ],
      },
      bless: { speaker: 'dm', text: `As you finish the blessing, the dry font fills — just for a breath — with water as clear as glass. You and your companions drink. It tastes of rain and lantern-oil and childhood. You all feel steadier. (The party regains 5 HP.)`, effects: ['heal 5'], next: 'a' },
      nobless: { speaker: 'dm', text: `Your words echo in the little chapel. Nothing happens. The font stays dry.`, next: 'a' },
      hum: { speaker: 'dm', text: `You hum the tune from Pell's music box. Somewhere in the chapel, a child's voice — thin as paper — joins in on the second line.`, next: 'a' },
    },
  },
  {
    id: 'sentinel', title: 'The Echo Sentinel',
    start: [{ if: 'sentinel_fate', node: 'gone' }, { node: 'a' }],
    nodes: {
      gone: { speaker: 'dm', text: `The plinth stands empty, or the Sentinel stands dark upon it. Either way, the way to the vault door is clear.`, end: true },
      a: {
        speaker: 'dm', decision: true,
        text: `On a raised plinth in the centre of the chamber stands a figure of grey stone, twice the height of a man, carved in the angular style of the ancient Ithari. Veins of blue crystal run through its arms and chest, pulsing slowly, like breath. Its eyes are closed. Beyond it, at the far end of the chamber, a great round door of black stone is set into the wall.

As you approach, the crystals pulse faster. A faint, glassy hum rises. The Sentinel is waking.`,
        options: [
          { text: `[Arcana] Find the shutdown glyph on its chest.`, check: { skill: 'arcana', dc: 14, advIf: 'item:corvin_notes || saw_conduit' }, success: 'disable', failure: 'wake', tone: 'curious', tags: ['knowledge', 'caution'],
            voices: { vaelis: `"Ithari constructs always have a command glyph. Give me ten seconds and something sharp to point at."`, orren: `"Don't fight what you can quiet. Look for a way to put it back to sleep."` } },
          { text: `"Corvin — you said you could read this."`, if: 'corvin_ally', tone: 'pragmatic', next: 'corvin', tags: ['pragmatic'] },
          { text: `[Resonance] See how it was meant to be put to sleep. (Spend 1 Resonance)`, if: 'resunlocked && res>=1', tone: 'resonance', effects: ['res -1', 'instab 1'], next: 'res_see', tags: ['curiosity'] },
          { text: `[Stealth] Creep past it along the wall.`, check: { skill: 'stealth', dc: 15 }, success: 'sneak_ok', failure: 'wake', tone: 'pragmatic', tags: ['stealth', 'caution'],
            voices: { kael: `"It's asleep. Let's not be rude and wake it."` } },
          { text: `Attack it before it wakes!`, tone: 'aggressive', tags: ['violence', 'boldness'], effects: ['combat enc_sentinel'],
            voices: { korr: `"Hit it while it sleeps. Honour is for things with hearts."`, nima: `"Big glowing statue. I have a lot of fire. These facts are related."`, brakka: `"It's a guard. Guards get dealt with. Shields up."` } },
          { text: `Back away.`, end: true, tone: 'leave', tags: ['caution'] },
        ],
      },
      disable: { speaker: 'dm', text: `There — half-hidden under a seam of crystal on its breastplate: a seven-pointed star with one point inverted. You press it. The Sentinel's hum drops an octave, falters, and dies. Its crystals fade to a dull, sleeping grey. The way to the vault door is clear.`, effects: ['set sentinel_fate disabled', 'xp 150'], next: 'done' },
      corvin: { speaker: 'corvin', text: `Corvin scurries forward, muttering, glasses pushed up on his forehead. "Seven-point star, inverted apex — yes, yes, there you are, you beautiful thing — " He presses the glyph with a trembling thumb. The Sentinel's light gutters and goes out. He turns to you, beaming and shaking. "I have wanted to do that," he says, "for six years."`, effects: ['set sentinel_fate disabled', 'xp 150'], next: 'done' },
      res_see: { speaker: 'dm', text: `The chamber flickers. Grey-robed figures — Ithari, tall and solemn — walk past the Sentinel, and the foremost touches a seven-pointed star, one point inverted, half-hidden in the crystal of its chest. The vision fades. You know exactly where to press.`, options: [{ text: `Press the glyph.`, next: 'disable' }] },
      sneak_ok: { speaker: 'dm', text: `You move like ghosts along the chamber wall, hardly breathing. The Sentinel's crystals pulse… pulse… and slowly settle back to their sleeping rhythm. It does not open its eyes. You reach the great door.`, effects: ['set sentinel_fate bypassed', 'xp 75'], next: 'done' },
      wake: { speaker: 'dm', text: `The Sentinel's eyes snap open — two discs of white crystal light. Stone grinds on stone as it steps down from the plinth.`, effects: ['combat enc_sentinel'], end: true },
      done: { speaker: 'dm', text: `Beyond the plinth, the black vault door waits.`, end: true },
    },
  },
  {
    id: 'vault_door', title: 'The Sealed Vault Door',
    start: [{ if: '!sentinel_fate', node: 'wakes' }, { node: 'a' }],
    nodes: {
      wakes: { speaker: 'dm', text: `As you lay a hand on the great door, the Sentinel behind you wakes with a sound like a struck glass. "UNWRITTEN. UNWELCOME."`, effects: ['combat enc_sentinel'], end: true },
      a: {
        speaker: 'dm',
        text: `The vault door is a disc of black stone ten feet across, seamless, veined with faint blue light. At its centre is a hexagonal recess, and around it, seven carved points of a star. There is no handle, no keyhole. The stone is warm. Something on the other side is ringing — very softly, continuously, like a held breath that has become a note.`,
        options: [
          { text: `Set the Vault Sigil-Stone into the recess.`, if: 'item:vault_sigil', tone: 'pragmatic', effects: ['take vault_sigil', 'set vault_open', 'xp 50'], next: 'open' },
          { text: `[Arcana] Read the lock's ward-script.`, check: { skill: 'arcana', dc: 15, advIf: 'item:corvin_notes' }, success: 'arc_ok', failure: 'arc_fail', tone: 'curious', tags: ['knowledge'] },
          { text: `"Corvin, the door."`, if: 'corvin_ally', tone: 'pragmatic', next: 'corvin' },
          { text: `[Resonance] Remember the door open. (Spend 1 Resonance)`, if: 'resunlocked && res>=1', tone: 'resonance', effects: ['res -1', 'instab 1', 'set vault_open', 'xp 50'], next: 'res_open' },
          { text: `[Athletics] Try to force it.`, check: { skill: 'athletics', dc: 25 }, success: 'arc_ok', failure: 'force_fail', tone: 'aggressive', tags: ['boldness'] },
          { text: `Step back.`, end: true, tone: 'leave' },
        ],
      },
      arc_ok: { speaker: 'dm', text: `The ward-script is a riddle in Old Ithari: "Speak the number of the Scribes, and the one who stayed." Seven points; one inverted. You touch the seven points in order, finishing on the inverted one. The door shudders.`, effects: ['set vault_open', 'xp 50'], next: 'open' },
      arc_fail: { speaker: 'dm', text: `The script swims before your eyes, half Old Ithari and half something older. You can't make sense of it — yet. (The guard-captain's coffer in the ossuary, or someone who reads Ithari, might help.)`, next: 'a' },
      force_fail: { speaker: 'dm', text: `You might as well try to shoulder open a mountain.`, next: 'a' },
      corvin: { speaker: 'corvin', text: `Corvin presses the seven points in sequence, lips moving, finishing on the inverted one. "Seven Scribes," he whispers, "and the one who stayed." The door shudders. He looks at you with shining, terrified eyes. "I'll — I'll wait here. Somebody should guard the door. That's definitely the reason."`, effects: ['set vault_open', 'xp 50'], next: 'open' },
      res_open: { speaker: 'dm', text: `You press your palm to the stone and remember — not your memory, the door's — a thousand openings, a thousand closings, Ithari hands, monks' hands, one young bell-warden's hand. The door remembers being open. It agrees to be open again.`, next: 'open' },
      open: {
        speaker: 'dm',
        text: `With a sound like a long exhalation, the black stone rolls aside into the wall. Beyond, a passage slopes down into blue-lit darkness, and the ringing is suddenly much louder.`,
        interjections: [
          { who: 'brakka', text: `Brakka sets her shield and rolls her shoulders. "Right," she says. "Together, then."` },
          { who: 'seris', text: `Seris murmurs a prayer under her breath. Then she draws her sword. "Whatever is down there, it ends tonight."` },
          { who: 'nima', text: `"I'm not scared," Nima announces, to nobody. Her sparks are blue now. "I'm excited. Those are different."` },
          { who: 'kael', text: `"For the record," Kael says, "I would like it noted that I am going down the spooky glowing tunnel voluntarily. Mark it. For my biography."` },
          { who: 'tessa', text: `Tessa takes a breath. "The note," she whispers. "It's the same note. All the way down." She squeezes your hand once, quickly, and lets go.` },
        ],
        options: [{ text: `Go down.`, end: true }],
      },
    },
  },

  // ───────────────────────────────────────────────────────── The Vault
  {
    id: 'bellwarden_meet', title: 'The Bellwarden',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm', decision: true,
        text: `The figure at the centre of the vault turns.

From the chest up, it is a man: an old monk with a face like a carved apple, eyes milky-white, a rotted bell-warden's sash across his chest. Below the chest he is bronze — the great curve of a church bell, green with age, fused seamlessly into his ribs — and from the bell's mouth hangs not a clapper but a monstrous bronze arm, swinging.

Around him, three pillars of blue crystal hum in answer to every slow swing of the bell. "Is it time?" the figure says, in a voice like a toll. "Is it time for vespers? Where is my tower? Where are the children? WHO WILL RING THEM HOME?"`,
        options: [
          { text: `"Brother Halric? Halric Venn?"`, if: 'knows_halric', check: { skill: 'persuasion', dc: 14, advIf: 'halric_vision_done' }, success: 'named_ok', failure: 'named_fail', tone: 'compassionate', tags: ['mercy'],
            voices: { ilyra: `"Call him by his name. He's still in there."`, seris: `"Speak to the man, not the monster. If there is a soul there, it deserves that."` } },
          { text: `[Insight] Watch the pillars and the bell.`, once: true, check: { skill: 'insight', dc: 12 }, success: 'pillars', failure: 'pillars_fail', tone: 'curious', tags: ['caution'] },
          { text: `"We're not here to hurt you." (Try to calm him)`, check: { skill: 'persuasion', dc: 18 }, success: 'calm_ok', failure: 'fight', tone: 'diplomatic', tags: ['diplomacy', 'mercy'] },
          { text: `Attack.`, tone: 'aggressive', tags: ['violence', 'boldness'], next: 'fight',
            voices: { korr: `"He's past saving. End it fast. That's the mercy."`, brakka: `"Shields up. Whatever he was, he'll kill us if we let him."`, nima: `"Okay. Okay okay okay. Big bell man. Let's go."` } },
        ],
      },
      pillars: { speaker: 'dm', text: `With every swing, light flows from the three crystal pillars into the bronze of his body — feeding him, shielding him. While they stand, your blows will only half-land, and the bell will knit itself back together. Shatter the pillars. (Radiant and thunder damage hurt him even while the pillars stand.)`, effects: ['set knows_pillars'], next: 'a' },
      pillars_fail: { speaker: 'dm', text: `The pillars hum. The bell swings. Something about the rhythm connects them, but you can't see how before he moves.`, next: 'a' },
      named_ok: {
        speaker: 'halric',
        text: `The bell stops mid-swing. The milky eyes find you, and for a moment — just a moment — they are clear and brown and frightened.

"Halric," he whispers. "Yes. That was… that was me. I rang for weddings." His face crumples. "I can't stop ringing. It won't let me stop. Every time I stop, the town forgets a little more. Please. Please — make it stop —"

The bell lurches back into motion, against his will. His face contorts. "RUN —"`,
        effects: ['set halric_named', 'xp 50'],
        next: 'fight',
      },
      named_fail: { speaker: 'halric', text: `"Halric…?" The name seems to hurt him. He clutches at his head with hands that are half bronze. "No — no — the bell is all there is — THE BELL IS ALL THERE IS —"`, next: 'fight' },
      calm_ok: { speaker: 'halric', text: `"Not here to hurt…" He wavers. The bell slows. Then the pillars flare, and his face contorts with a pain that isn't his. "It won't let me listen," he gasps. "Forgive me. FORGIVE ME —"`, effects: ['set halric_named'], next: 'fight' },
      fight: { speaker: 'dm', text: `The great bell swings back, and the vault fills with sound.`, effects: ['combat enc_bellwarden'], end: true },
    },
  },
  {
    id: 'bellwarden_after', title: 'Silence',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: [
          { if: 'halric_named', text: `The bell cracks in two, and the bronze falls away from him like a shell. What is left on the vault floor is only an old man — thin, white-haired, his hands twisted like roots. He looks up at you, and his eyes are brown and clear.

"Is it quiet?" he whispers. "It's quiet. Oh — it's so quiet." He smiles. "Tell Wenna — the little one with the flint eyes — tell her I'm sorry I missed her wedding. In the other place, I rang so loud for her." His eyes close. "Ring for them," he breathes. "The ones who remember. Somebody… has to…"

He is gone. The vault is silent for the first time in eighty years.` },
          { text: `With a final, discordant clang, the Bellwarden's bell splits in two. The bronze shatters; the monk's body crumbles to grey dust that drifts upward instead of falling, and then is gone.

For the first time in eighty years, the vault is silent.` },
        ],
        options: [
          { text: `[Religion] Speak the rite for the dead over him.`, if: 'halric_named', check: { skill: 'religion', dc: 10 }, success: 'rite', failure: 'rite', tone: 'compassionate', tags: ['faith', 'mercy'], effects: ['set halric_rest', 'rep dawn 5'] },
          { text: `Stand in silence for a moment.`, tone: 'compassionate', tags: ['tradition'], next: 'b' },
          { text: `Turn to the pedestal at once.`, tone: 'pragmatic', tags: ['pragmatic'], next: 'b' },
        ],
      },
      rite: { speaker: 'dm', text: `You speak the old words for the dead. When you reach the end, a single soft note sounds from the broken bell — not a toll. A farewell.`, interjections: [{ who: 'ilyra', text: `Ilyra joins you on the last line, her voice steady. Afterwards she wipes her eyes and doesn't pretend she isn't.` }, { who: 'seris', text: `Seris kneels beside you. "Rest, brother," she says. "Your watch is ended."` }], next: 'b' },
      b: {
        speaker: 'dm',
        text: `But not quite silent.

From the raised dais at the far end of the vault comes a sound, slow and patient: a beat. Like a heart, sleeping. On a pedestal of black stone sits a crystal the size of a clenched fist, pulsing with a light that is every colour and none. Each time it beats, the veins of blue in the vault walls brighten, and you feel it in your own chest.`,
        effects: ['quest mq_bell heart'],
        options: [{ text: `…`, end: true }],
      },
    },
  },
  {
    id: 'vault_inscription', title: 'Ring of Inscriptions',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `Around the base of the dais runs a ring of Old Ithari script, carved with a precision no living mason could match.`,
        options: [
          { text: `[History or Arcana] Read it.`, once: true, check: { skill: 'history', dc: 14 }, success: 'ok', failure: 'fail', tone: 'curious', tags: ['knowledge'] },
          { text: `Leave it.`, end: true, tone: 'leave' },
        ],
      },
      ok: { speaker: 'dm', text: `"HERE SLEEPS THE FIRST PAGE. HERE WAKES THE ONE WHO STAYED. LET THE SEVEN BE FORGIVEN, FOR WE COULD NOT FORGIVE OURSELVES."`, effects: ['set read_first_page'], interjections: [{ who: 'vaelis', text: `Vaelis reads it twice, lips moving. "'The First Page,'" he repeats. "Not 'a' first page. THE." He looks at the crystal, and for the first time tonight, he looks afraid.` }], next: 'a' },
      fail: { speaker: 'dm', text: `The letters are beautiful and utterly incomprehensible. One word repeats several times. You suspect it is important.`, next: 'a' },
    },
  },
  {
    id: 'heart', title: 'The Heart of Aether',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm', decision: true,
        text: `The crystal beats on its pedestal. Up close, you can see that it is not clear: it is full. Inside it, like motes in a sunbeam, drift countless tiny lights. Some of them are moving.`,
        options: [
          { text: `[Arcana] Study it before touching it.`, once: true, check: { skill: 'arcana', dc: 13 }, success: 'arc_ok', failure: 'arc_fail', tone: 'curious', tags: ['caution', 'knowledge'] },
          { text: `Touch it.`, tone: 'aggressive', tags: ['boldness', 'curiosity'], next: 'touch',
            voices: { vaelis: `"Touch it. I'll take notes. Please survive; the notes are much better if you survive."`, nima: `"Touch it touch it touch it."`, varek: `"It's calling you. I can hear it. Go on — but come back."` } },
          { text: `Leave it where it is.`, tone: 'pragmatic', tags: ['caution'], next: 'leave_it',
            voices: { orren: `"Some things are better left where they lie."`, kael: `"Every instinct I own says don't touch the glowing heart. And I have excellent instincts."` } },
        ],
      },
      arc_ok: { speaker: 'dm', text: `It is not a gem, or an artefact, or even — exactly — magic. It is a container, the way a seed is a container. The lights inside are… you're not sure. Thoughts? Memories? Lives? There are more of them than there are stars. And the pedestal beneath it is no pedestal: it is the top of something enormous that runs down into the earth — the Anchor itself — and the crystal is the only thing holding it shut.`, effects: ['set knows_heart_full'], next: 'a' },
      arc_fail: { speaker: 'dm', text: `Powerful. Ancient. Alive, possibly. Beyond that, it defies analysis — or perhaps your analysis simply isn't big enough.`, next: 'a' },
      leave_it: { speaker: 'dm', text: `You step back. The crystal beats faster, as though alarmed. Somewhere above, very faint, you hear boots on stone — many boots, moving with purpose. Someone else is coming for it. If you leave it, they will take it.`, next: 'a' },
      touch: {
        speaker: 'dm',
        text: `Your fingers close around the Heart of Aether, and the world falls open.

You see a city of white towers on the sea, its streets canals, its people singing to the tide — and you know, the way you know your own name, that they were called the Sael, and that no map has ever shown them. You see high meadows under a sky with two moons, and basalt fortresses flying banners of a kingdom called Morvaine. You see a forest so vast and old that its first tree's roots held the world together. You see a sky full of different stars.

You see all of it end. Not in fire — in silence. In an unwriting.

And then you hear them: the sleepers. Billions of them. A sea of voices, each one a single drifting light, each one dreaming. And above them, close and clear, one voice that is awake.`,
        effects: ['set heart_touched', 'give heart_of_aether', 'resmax 1', 'res 9', 'instab 2', 'xp 100'],
        next: 'maelis1',
      },
      maelis1: {
        speaker: 'maelis',
        text: `"Ah," says the voice. It is a woman's voice, calm and dry and very, very old, with an accent no one has spoken in three thousand years. "There you are. You rang the bell twice. I wondered who would hear it."

"Don't be afraid. Well — be a little afraid. It's sensible. But not of me. Not yet."`,
        options: [
          { text: `"Who are you?"`, next: 'who', tone: 'curious' },
          { text: `"What is this? What did I just see?"`, next: 'what', tone: 'curious' },
          { text: `"Get out of my head."`, next: 'out', tone: 'aggressive', tags: ['defiance'] },
        ],
      },
      who: { speaker: 'maelis', text: `"Someone who stayed behind to keep a promise. Call me Maelis; it was my name, once, when I had a face to go with it." A pause, almost amused. "Your temples keep an empty niche for me. It's very kind of them. They have no idea."`, effects: ['set met_maelis'], next: 'maelis2' },
      what: { speaker: 'maelis', text: `"The world that was. Or a little of it — the parts I could carry." The voice softens. "You've seen what your histories forgot. They forgot it because they were made to. I'm sorry. That's a long story, and we don't have time for it tonight."`, effects: ['set met_maelis'], next: 'maelis2' },
      out: { speaker: 'maelis', text: `"I'm afraid you're holding me, not the other way around." Almost gentle. "Let go, if you like. But they'll take me from your hand the moment you do, and then neither of us will get a say in what happens next."`, effects: ['set met_maelis', 'set maelis_distrust'], next: 'maelis2' },
      maelis2: {
        speaker: 'maelis',
        text: `"Listen to me. The Veil is failing — the walls between what is and what was. That poor bell-ringer was only the first crack to sing. More will come. And there are people who have been waiting a very long time for someone to pick me up."

The voice sharpens. "One of them is on the stair right now. Grey coat. Silver instruments. She has been following the tremors for weeks, and she is very good at her job."`,
        options: [
          { text: `"Why me?"`, next: 'whyme', tone: 'curious' },
          { text: `"Can I trust you?"`, next: 'trust', tone: 'pragmatic' },
          { text: `"Then help me."`, next: 'help', tone: 'friendly', effects: ['set maelis_trust'] },
        ],
      },
      whyme: { speaker: 'maelis', text: `"Because you heard. Most people can't. And because when you saw the sleepers, you didn't look away." A pause. "Or perhaps only because you were the one standing closest. Fate is mostly proximity. Don't tell the priests."`, next: 'arrive' },
      trust: { speaker: 'maelis', text: `A long silence. "No," she says at last. "Not entirely. I have done terrible things for good reasons, and good things for selfish ones, and I have had three thousand years to forget which were which." Something like a laugh. "But I will never lie to you. That much I can give."`, effects: ['set maelis_honest'], next: 'arrive' },
      help: { speaker: 'maelis', text: `"I am. I'm in your hand, and I'm not letting go." Warmth, now, unexpected. "And I'm in your head, which I apologise for; it's very cluttered in here. Now — turn around. She's here."`, next: 'arrive' },
      arrive: {
        speaker: 'dm',
        text: `The light from the Heart dims to a slow pulse in your fist. You are standing on the dais, the crystal warm against your palm — and you cannot open your hand. It isn't stuck. It simply won't. The Heart has chosen.

Footsteps at the vault's entrance. Three figures: two broad wardens in grey robes over armour, iron-shod staves in their hands — and between them, a tall woman in a long grey coat hung with silver instruments that tick and whirr. Her hair is iron-grey and cropped short; her eyes are pale and missing nothing.

"Thank you," says Seeker Ysolt Ravencourt of the Aether Conclave. "You've saved me a great deal of digging. I'll take that now."`,
        next: 'ysolt',
      },
      ysolt: {
        speaker: 'ysolt', decision: true,
        text: `She holds out a gloved hand. "The Heart of Aether, please. It is Conclave property under the Charter of Ashenford, the Arcane Hazards Accord, and roughly nine other documents I'd be delighted to recite while my wardens wait." Her instruments whirr, pointing at your fist. "Ah. Bonded. How inconvenient for you."`,
        options: [
          { text: `[Arcana] "It's bonded to me. Take it by force and you might destroy it — and us."`, once: true, check: { skill: 'arcana', dc: 13, advIf: 'knows_heart_full' }, success: 'arc_arg', failure: 'arc_arg_fail', tone: 'pragmatic', tags: ['knowledge'] },
          { text: `[Persuasion] "You saw what happened up there tonight. People forgetting their own families. Help us instead."`, check: { skill: 'persuasion', dc: 16, advIf: 'ysolt_softened' }, success: 'persuade_ok', failure: 'persuade_fail', tone: 'diplomatic', tags: ['diplomacy', 'honesty'],
            voices: { tessa: `"Talk to her. She's tired and she's clever and she doesn't like her orders. I can hear it."`, ilyra: `"She's a person under all that silver. Speak to the person."` } },
          { text: `[Noble] "My family name is not unknown to the Conclave's patrons, Seeker. Consider your next words."`, if: 'bg:noble', check: { skill: 'persuasion', dc: 13 }, success: 'persuade_ok', failure: 'persuade_fail', tone: 'background', tags: ['authority'] },
          { text: `[Deception] Hold out the Sentinel Core instead. "Fine. Take it."`, if: 'item:sentinel_core', check: { skill: 'deception', dc: 14 }, success: 'decept_ok', failure: 'decept_fail', tone: 'deceptive', tags: ['deception'],
            voices: { kael: `"Oh, I love this. Give her the rock. Give her the shiny rock."` } },
          { text: `[Resonance] Fold yourselves through the thin place and away. (Spend 1 Resonance)`, if: 'res>=1', tone: 'resonance', tags: ['boldness', 'forbidden'], effects: ['res -1'], next: 'res_escape',
            voices: { varek: `"The walls are thin here. We can step through. Trust me — or trust it."` } },
          { text: `[Athletics] The vault is unstable — bring the ceiling down between us and run!`, check: { skill: 'athletics', dc: 13 }, success: 'run_ok', failure: 'run_fail', tone: 'aggressive', tags: ['boldness'] },
          { text: `"Come and take it."`, tone: 'aggressive', tags: ['violence', 'defiance'], next: 'fight',
            voices: { korr: `"Three of them. Four of us. I like those numbers."`, seris: `"The Conclave has no right to it. If she wants a fight, she'll have one."`, brakka: `"Nobody's taking anything off my friend. Shields."` } },
        ],
      },
      arc_arg: { speaker: 'ysolt', text: `Her eyes flick to her instruments. They are ticking very fast. A muscle moves in her jaw. "…You may be right," she admits, which clearly costs her. "The binding is deep. Prising it loose could crack it." She lowers her hand an inch. "So. We have a problem, you and I."`, effects: ['set ysolt_softened'], next: 'ysolt' },
      arc_arg_fail: { speaker: 'ysolt', text: `"A charming theory," she says. "The Conclave has handled bonded artefacts before. It is unpleasant for the bearer. Not usually fatal." Her smile does not reach her eyes. "Usually."`, next: 'ysolt' },
      persuade_ok: {
        speaker: 'ysolt',
        text: `For a long moment Ysolt Ravencourt simply looks at you. Then — astonishingly — she laughs: short, tired, almost human.

"Do you know how many towns I've walked into this year after the fog? Four. Do you know how many I walked out of with everyone remembering their names?" She lowers her hand. "None."

She signals her wardens to stand down. "I'll report that the Heart was bonded and could not be recovered without risk. Which is even true." She studies you. "The Archon will not accept that for long. When he sends someone else — and he will — they won't be me. Be gone from Hollowmere before then." She turns to go, then pauses. "And if you find yourselves needing someone inside the Conclave who has doubts… I wasn't here."`,
        effects: ['set ysolt_outcome persuaded', 'rep conclave 5', 'xp 150'],
        next: 'end',
      },
      persuade_fail: { speaker: 'ysolt', text: `"Very moving." She does not look moved. "I have heard that speech in four towns this year, and every time, the people giving it were holding something that did not belong to them." She nods to her wardens. "Take it."`, next: 'fight' },
      decept_ok: { speaker: 'ysolt', text: `You uncurl your other hand to reveal the Sentinel's humming crystal core, letting it pulse convincingly in the blue light. Ysolt's instruments go briefly berserk — it is, after all, full of Ithari Aether. She takes it with careful hands. "…Thank you for your cooperation," she says, already turning away, already examining it. "The Conclave appreciates —" You are up the stair before she finishes the sentence. Far below, a moment later, you hear her swear with real eloquence.`, effects: ['take sentinel_core', 'set ysolt_outcome escaped', 'set ysolt_fooled', 'xp 150'], next: 'end' },
      decept_fail: { speaker: 'ysolt', text: `She doesn't even reach for it. "That," she says, "is a Sentinel core. The Heart is the one in your other hand, which you cannot open." Her eyes narrow. "That was insulting."`, next: 'fight' },
      res_escape: {
        speaker: 'dm',
        text: `You close your eyes and listen to the Heart, and it shows you the seams in the vault — the places where the world is only a page thick. You take your companions' hands and step sideways through one.

For a moment you are nowhere: a grey nothing full of whispering. Then you are standing in the rubble of the fallen bell tower in the cathedral above, gasping, with the night air on your faces. Far below, muffled, you hear Ysolt Ravencourt's voice rising in disbelief.`,
        effects: ['set ysolt_outcome escaped', 'xp 150'],
        next: 'end',
      },
      run_ok: { speaker: 'dm', text: `You slam your shoulder into a cracked pillar. It goes — and the vault's ceiling, eighty years unstable, comes down in a roaring cascade between you and the Seeker. Through the dust you run, up the passage, through the undercroft, up the stair, into the night, and you do not stop until the cathedral is behind you.`, effects: ['set ysolt_outcome escaped', 'xp 150'], next: 'end' },
      run_fail: { speaker: 'dm', text: `The pillar cracks — but slower than you'd hoped. Stone rains down on all of you as you scramble for the passage; Ysolt shouts something; a staff cracks across somebody's shoulders. But you make it out — bruised, bleeding, alive, and still holding the Heart.`, effects: ['damage 2d6 bludgeoning', 'set ysolt_outcome escaped', 'xp 100'], next: 'end' },
      fight: { speaker: 'dm', text: `Ysolt sighs, as if you have disappointed her personally. Silver light kindles in her hands.`, effects: ['combat enc_ysolt'], end: true },
      end: { speaker: 'dm', text: `The night is nearly over.`, effects: ['dialogue prologue_end'], end: true },
    },
  },
  {
    id: 'ysolt_defeated', title: 'The Seeker Retreats',
    start: 'a',
    nodes: {
      a: {
        speaker: 'ysolt',
        text: `Ysolt Ravencourt is on one knee, one hand pressed to a bloody side, her silver instruments cracked and sparking. Her wardens are down. She looks up at you — and, absurdly, she smiles.

"Well. That will make for an interesting report." She draws a glass sigil from her coat and snaps it between her fingers. Light swallows her. Her voice lingers a moment after she is gone: "You've made an enemy of the Conclave tonight. I do hope the Heart was worth it."`,
        effects: ['set ysolt_outcome fought'],
        options: [{ text: `…`, effects: ['dialogue prologue_end'], end: true }],
      },
    },
  },
  {
    id: 'prologue_end', title: 'Dawn',
    start: 'a',
    nodes: {
      a: {
        speaker: 'dm',
        text: `You climb up out of the dark, through the undercroft, through the ruined cathedral, out under the sky.

And the sky is changing. For the first time in what feels like days, the pewter grey is thinning in the east. The fog over Hollowmere is drawing back over the town wall like a tide going out, and as it goes, it leaves the town behind it: roofs, chimneys, the Lantern Tree, its lanterns all relit by someone in the night.

Dawn has decided to come after all.`,
        next: 'b',
      },
      b: {
        speaker: 'dm',
        text: [
          { if: 'rescued_count>=3', text: `In the square, people are spilling out of the Lantern & Lamb. The miller and his family. Ysolde Quill, still in her nightgown, haranguing a watchman. A boy named Pell. Everyone you went into the fog for came home. Captain Hale sees you coming down the cathedral road and simply starts clapping, slowly, and then the whole square is clapping, and you don't quite know where to look.` },
          { if: 'rescued_count>=1', text: `In the square, people are spilling out of the Lantern & Lamb, blinking at the dawn. Some of the people you went into the fog for are among them. Not all. Captain Hale meets you at the gate with a face that says he has been counting, and he nods to you once, hard, like a man saluting.` },
          { text: `In the square, people are spilling out of the Lantern & Lamb, blinking at the dawn. Not everyone who was lost last night came back. Captain Hale meets you at the gate. He doesn't say anything. He doesn't have to.` },
        ],
        next: 'c',
      },
      c: {
        speaker: 'dm',
        text: [
          { if: 'lira_fate=anchored', text: `By the Lantern Tree, a boy and a small girl with sleep-tousled hair are holding hands and arguing about whose turn it is to carry the music box. Their mother keeps touching the girl's hair as if she can't quite believe it is there, though she couldn't tell you why. Lira is real. Lira has always been real. Only Pell knows that she wasn't.` },
          { if: 'lira_fate=faded', text: `By the Lantern Tree, Pell sits winding a tin music box, over and over, playing a lullaby nobody else in Hollowmere knows. He is not crying. He is remembering, very hard, so that someone always will.` },
          { if: 'lira_fate=bottled', text: `In your pack, wrapped in cloth, a small glass vial is faintly warm. Sometimes, if you hold it to your ear, you can hear a child humming.` },
          { text: `Somewhere in Hollowmere, a boy named Pell is still insisting he had a sister. Fewer people are listening.` },
        ],
        next: 'd',
      },
      d: {
        speaker: 'dm',
        text: [
          { if: 'maren_forgets', text: `At the north gate, Sister Maren Ash is taking down her lantern. Just one. She hangs it on its hook and stands looking at the empty hook beside it for a long time, frowning, as if she has forgotten something important. Then she shakes her head, smiles her apologising smile, and goes to help the injured. Whatever weight held Lira in the world, it was taken from somewhere. You think you know where.` },
          { text: `At the north gate, Sister Maren Ash is taking down her two lanterns. When she sees you, her face lights with gratitude — and with something else, something quick and bright that she hides at once, the way she looks at the Heart-shaped bulge in your pack. Then she goes to help the injured.` },
        ],
        next: 'e',
      },
      e: {
        speaker: 'dm',
        text: [
          { if: 'corvin_fate=handed_over', text: `Corvin Thale is marched to the watch house in irons, still apologising to everyone, including the irons.` },
          { if: 'corvin_fate=freed', text: `At the edge of town, a figure in mud-caked boots raises a hand to you before vanishing into the woods. Corvin Thale owes you, and the Unbound do not forget their debts.` },
          { if: 'corvin_fate=ally', text: `Corvin Thale catches up with you at the gate, breathless, clutching his notes. "The Unbound will want to meet you," he says. "Soon. Before the Conclave does." He pauses. "Again."` },
          { if: 'corvin_fate=killed', text: `No one in Hollowmere will ever know what became of the scholar who lodged at the Lantern & Lamb. His room stays locked until Tobin, months from now, gives his things to the poor.` },
          { text: `Somewhere beneath the cathedral, the excavation that started all of this has fallen quiet.` },
        ],
        next: 'f',
      },
      f: {
        speaker: 'dm',
        text: `And already, the world is noticing.

A grey crow with a silver ring on its leg watches you from the cathedral roof and then flies south, toward Ashenford and the Conclave's towers. A rider in Iron Covenant colours reins in at the edge of town, takes one look at the lifting fog, and turns back toward Solmara at a gallop. By the Lantern Tree, a knight in the white and gold of the Order of the Last Dawn stands very still, watching the crowd, one gauntleted hand on her sword.

In your pack, the Heart of Aether beats, slow and patient.

"Well done," says Maelis, quietly, in the back of your mind. "That was the easy part."`,
        effects: ['complete mq_bell', 'set prologue_complete', 'chapter act1', 'rep hollowmere 5', 'clock 06:30'],
        next: 'g',
      },
      g: {
        speaker: 'dm',
        text: `PROLOGUE COMPLETE — THE BELL THAT NEVER RANG.

Act I: Whispers of the Veil awaits — the Whispering Woods, the ruins of Valdros, the city of Ashenford, and everyone who now wants what you carry.`,
        options: [{ text: `Continue.`, effects: ['epilogue'], end: true }],
      },
    },
  },
];
