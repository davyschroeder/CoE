import type { Banter } from '../schema';

/**
 * Party banter: short exchanges between companions in the active party.
 * Progress gates: festival (!bell_rang) → fog (bell_rang) → cathedral (visited:cathedral)
 * → undercroft (found_secret_stair) → vault (visited:vault) → after (prologue_complete).
 */
export const BANTER: Banter[] = [
  // ─────────────────────────────── Vaelis & Nima — mentor and rival
  {
    id: 'vaelis_nima_fizzy_air',
    between: ['vaelis', 'nima'],
    if: '!bell_rang',
    lines: [
      { who: 'vaelis', text: "Nima, you're doing it again." },
      { who: 'nima', text: "Doing what? I'm not doing anything. I'm standing here being delightful." },
      { who: 'vaelis', text: "Your fingertips are smoking. In a town built largely of thatch." },
      { who: 'nima', text: "It's the air! It tastes all fizzy. You feel it too, don't pretend you don't." },
      { who: 'vaelis', text: "I feel it. I simply have the decency to measure it instead of setting it on fire." },
      { who: 'nima', text: "That's because you're scared of it." },
    ],
  },
  {
    id: 'vaelis_nima_do_not_touch',
    between: ['vaelis', 'nima'],
    if: 'found_secret_stair && !prologue_complete',
    lines: [
      { who: 'nima', text: "Ooh, writing! Vaelis, what does it say? Read it out loud!" },
      { who: 'vaelis', text: "Don't touch it. It says, roughly, ‘do not touch.’" },
      { who: 'nima', text: "It does not." },
      { who: 'vaelis', text: "It says something about holding and keeping. I'm extrapolating the ‘do not touch.’" },
      { who: 'nima', text: "You know what you are? A coward with a really big vocabulary." },
      { who: 'vaelis', text: "And you are a fire with legs and no firebreak. One of us will live to two hundred. I've already done it." },
    ],
    effects: ['bond vaelis nima 1'],
  },
  {
    id: 'vaelis_nima_assessing',
    between: ['vaelis', 'nima'],
    if: 'prologue_complete',
    lines: [
      { who: 'nima', text: "You looked scared down there. Really scared. Not lecture-scared." },
      { who: 'vaelis', text: "I was assessing." },
      { who: 'nima', text: "You were shaking." },
      { who: 'vaelis', text: "I was assessing vigorously. ...You did well. With the fire. You kept it pointed the right way." },
      { who: 'nima', text: "Did you just compliment me? Somebody write that down!" },
      { who: 'vaelis', text: "I'll deny it in print." },
    ],
    effects: ['bond vaelis nima 3'],
  },

  // ─────────────────────────────── Seris & Varek — knight and warlock
  {
    id: 'seris_varek_lanterns',
    between: ['seris', 'varek'],
    if: '!bell_rang',
    lines: [
      { who: 'seris', text: "Warlock. Keep your distance from the children." },
      { who: 'varek', text: "Good evening to you too, Knight-Oathsworn. I'm admiring the lanterns. Is that permitted, or shall I fetch a priest to supervise?" },
      { who: 'seris', text: "I know what you are. I can smell the bargain on you." },
      { who: 'varek', text: "How curious. All I smell on you is polish and certainty. Both flammable, I'm told." },
      { who: 'seris', text: "Mind your tongue." },
      { who: 'varek', text: "I mind it constantly. You have no idea how much I'm not saying." },
    ],
    effects: ['bond seris varek -2'],
  },
  {
    id: 'seris_varek_river',
    between: ['seris', 'varek'],
    if: 'bell_rang && !prologue_complete',
    lines: [
      { who: 'varek', text: "Your Order has a rite, I believe. For the half-erased. It involves a river." },
      { who: 'seris', text: "That practice was abolished forty years ago." },
      { who: 'varek', text: "Was it? Someone ought to have told the mob in Ashenford. I was seven. I remember the water was very cold." },
      { who: 'seris', text: "...That was not lawful." },
      { who: 'varek', text: "No. It was faithful. You'll find those are different words." },
    ],
  },
  {
    id: 'seris_varek_reflex',
    between: ['seris', 'varek'],
    if: 'bellwarden_defeated',
    lines: [
      { who: 'seris', text: "When the Bellwarden's toll came down on me, you stepped in front of it. Why?" },
      { who: 'varek', text: "A reflex. I'm told they can be cured." },
      { who: 'seris', text: "I do not understand you." },
      { who: 'varek', text: "No. But you asked. That's new." },
    ],
    effects: ['bond seris varek 2'],
  },

  // ─────────────────────────────── Seris & Kael — law and survival
  {
    id: 'seris_kael_purse',
    between: ['seris', 'kael'],
    if: '!bell_rang',
    lines: [
      { who: 'seris', text: "Return it." },
      { who: 'kael', text: "Return what?" },
      { who: 'seris', text: "The purse. The merchant's. It is in your left sleeve." },
      { who: 'kael', text: "Slander. It's in my right sleeve. Where I put it after lifting it back off the lad who lifted it off her. Look, she's got it again. See? Hero." },
      { who: 'seris', text: "...You could have said so." },
      { who: 'kael', text: "And ruin my reputation?" },
    ],
    effects: ['bond seris kael 1'],
  },
  {
    id: 'seris_kael_carried',
    between: ['seris', 'kael'],
    if: 'bell_rang && rescued_count>=1',
    lines: [
      { who: 'seris', text: "You carried that child out of the fog on your back. Without being asked." },
      { who: 'kael', text: "She was heavy. I'm going to bill her family." },
      { who: 'seris', text: "You will not." },
      { who: 'kael', text: "...No. I won't. Don't tell anyone." },
      { who: 'seris', text: "Why hide it? Kindness is not a crime." },
      { who: 'kael', text: "Where I grew up, it was a weakness. Same thing, fewer witnesses." },
    ],
    effects: ['bond seris kael 2'],
  },

  // ─────────────────────────────── Seris & Ilyra — sisters in faith
  {
    id: 'seris_ilyra_seventh_niche',
    between: ['seris', 'ilyra'],
    if: 'visited:cathedral && !prologue_complete',
    lines: [
      { who: 'ilyra', text: "You didn't light a candle for the seventh." },
      { who: 'seris', text: "We do not. The Silent Light is not to be named or petitioned. That is doctrine." },
      { who: 'ilyra', text: "I know the doctrine, Seris. I asked whether you wanted to." },
      { who: 'seris', text: "What I want is not relevant." },
      { who: 'ilyra', text: "It's always relevant. It just isn't always convenient." },
      { who: 'seris', text: "...We were taught from the same books and learned entirely different things." },
    ],
    effects: ['bond seris ilyra 1'],
  },
  {
    id: 'seris_ilyra_lira_faded',
    between: ['seris', 'ilyra'],
    if: 'lira_fate=faded',
    lines: [
      { who: 'seris', text: "Letting the girl fade was the correct course. She was not... properly real." },
      { who: 'ilyra', text: "She knew her brother's name. She was afraid of the dark. Which part wasn't real?" },
      { who: 'seris', text: "The Order teaches that echoes are—" },
      { who: 'ilyra', text: "I know what it teaches. I've buried the echoes it taught about. I think we were right too, Seris. I just don't want you pretending it was easy." },
      { who: 'seris', text: "...I am not pretending." },
    ],
    effects: ['bond seris ilyra 1'],
  },
  {
    id: 'seris_ilyra_lira_anchored',
    between: ['seris', 'ilyra'],
    if: 'lira_fate=anchored',
    lines: [
      { who: 'seris', text: "Binding an echo back into the world. The Order would call it an abomination." },
      { who: 'ilyra', text: "The Order wasn't there. Pell was. Did you see his face?" },
      { who: 'seris', text: "...I saw it." },
      { who: 'ilyra', text: "Then you know what the Order would have taken from him." },
      { who: 'seris', text: "I know. That is what frightens me." },
    ],
    effects: ['bond seris ilyra 2'],
  },

  // ─────────────────────────────── Brakka & Korr — kindred outcasts
  {
    id: 'brakka_korr_shield_low',
    between: ['brakka', 'korr'],
    if: '!bell_rang',
    lines: [
      { who: 'korr', text: "Dwarf. You hold your shield too low." },
      { who: 'brakka', text: "I hold it where a dwarf's enemy keeps his knees. You'd know, if you'd ever fought one of us." },
      { who: 'korr', text: "Tomorrow. Dawn. In the yard." },
      { who: 'brakka', text: "Dawn? Festival's on. Make it noon, and you buy the ale." },
      { who: 'korr', text: "...Noon." },
    ],
    effects: ['bond brakka korr 2'],
  },
  {
    id: 'brakka_korr_very_wide',
    between: ['brakka', 'korr'],
    if: 'bell_rang && !prologue_complete',
    lines: [
      { who: 'brakka', text: "You keep looking over your shoulder." },
      { who: 'korr', text: "The fog is loud." },
      { who: 'brakka', text: "I don't hear anything." },
      { who: 'korr', text: "I know." },
      { who: 'brakka', text: "Well. Whatever's calling, it'll have to come through me to get you. And I'm very wide." },
      { who: 'korr', text: "(A short, startled laugh.) You are." },
    ],
    effects: ['bond brakka korr 2'],
  },
  {
    id: 'brakka_korr_two_remember',
    between: ['brakka', 'korr'],
    if: 'prologue_complete',
    lines: [
      { who: 'brakka', text: "Korr. If you remembered a place, and everyone swore it never was. What would you do?" },
      { who: 'korr', text: "Ashkin have no places. We have deeds. Deeds don't fall down." },
      { who: 'brakka', text: "Mine did. A whole hall of them." },
      { who: 'korr', text: "Then sing them. I will listen. Then two remember." },
      { who: 'brakka', text: "...Kindest thing anyone's said to me in a year, you great grey boulder." },
    ],
    effects: ['bond brakka korr 3'],
  },

  // ─────────────────────────────── Tessa & Nima — best friends, a menace together
  {
    id: 'tessa_nima_high_note',
    between: ['tessa', 'nima'],
    if: '!bell_rang',
    lines: [
      { who: 'nima', text: "Tessa! What if, during your closing number, I made all the lanterns change colour?" },
      { who: 'tessa', text: "On the high note?" },
      { who: 'nima', text: "On the high note!" },
      { who: 'tessa', text: "Purple, then gold, then a tasteful green." },
      { who: 'nima', text: "Nobody's ever called anything I've done tasteful." },
      { who: 'tessa', text: "First time for everything, darling. Mostly for you." },
    ],
    effects: ['bond tessa nima 2'],
  },
  {
    id: 'tessa_nima_quiet',
    between: ['tessa', 'nima'],
    if: 'bell_rang && !prologue_complete',
    lines: [
      { who: 'nima', text: "You've gone all quiet. You never go quiet. It's creepy." },
      { who: 'tessa', text: "I'm thinking." },
      { who: 'nima', text: "About the bell? You looked like you knew the tune." },
      { who: 'tessa', text: "Everyone knows a bell, Nima. Ding. Dong." },
      { who: 'nima', text: "Okay. But if you ever want to not-talk about it, I'm very good at not-talking. Loudly. Right next to you." },
      { who: 'tessa', text: "...I know you are. Thank you." },
    ],
    effects: ['bond tessa nima 2'],
  },

  // ─────────────────────────────── Orren & Nima — he calms her, she makes him laugh
  {
    id: 'orren_nima_toffee',
    between: ['orren', 'nima'],
    if: '!bell_rang',
    lines: [
      { who: 'nima', text: "Orren, try the toffee apple. Try it! Your face will do something!" },
      { who: 'orren', text: "My face doesn't do things." },
      { who: 'nima', text: "Everyone's face does things!" },
      { who: 'orren', text: "(Chews. A long pause.) ...Hm." },
      { who: 'nima', text: "THERE! He smiled! Everyone saw it!" },
      { who: 'orren', text: "Nobody saw it. It didn't happen." },
    ],
    effects: ['bond orren nima 1'],
  },
  {
    id: 'orren_nima_breathe',
    between: ['orren', 'nima'],
    if: 'found_secret_stair && !prologue_complete',
    lines: [
      { who: 'nima', text: "Orren, my hands won't stop sparking. This place makes everything louder." },
      { who: 'orren', text: "Breathe like the trees." },
      { who: 'nima', text: "Trees don't breathe!" },
      { who: 'orren', text: "They do. Slowly. In. Out. One summer per breath." },
      { who: 'nima', text: "I don't HAVE a whole summer! ...Oh. Oh, it's working. Stop looking smug." },
      { who: 'orren', text: "Not smug. This is my face." },
    ],
    effects: ['bond orren nima 2'],
  },

  // ─────────────────────────────── Korr & Tessa — the ballads
  {
    id: 'korr_tessa_ballad',
    between: ['korr', 'tessa'],
    if: 'brawl_resolved && !prologue_complete',
    lines: [
      { who: 'tessa', text: "Korr! I've written you a ballad. ‘The Grey Mountain of the Lantern & Lamb.’ Fourteen verses." },
      { who: 'korr', text: "No." },
      { who: 'tessa', text: "Verse one: He stood like a cliff in a tempest of ale—" },
      { who: 'korr', text: "Burn it." },
      { who: 'tessa', text: "Verse two: and the drunkards went down like the wheat in the—" },
      { who: 'korr', text: "...Like the wheat in the what?" },
    ],
    effects: ['bond korr tessa 2'],
  },
  {
    id: 'korr_tessa_damp_wood',
    between: ['korr', 'tessa'],
    if: 'prologue_complete',
    lines: [
      { who: 'tessa', text: "I saw you, you know. Folding up my ballad. Tucking it in your pack." },
      { who: 'korr', text: "For starting fires." },
      { who: 'tessa', text: "You've made three fires since and it's still in there." },
      { who: 'korr', text: "...Damp wood." },
      { who: 'tessa', text: "Mm-hm. I'm writing another. The bell-monk, and you holding the line." },
      { who: 'korr', text: "...Shorter, this time. Fewer rhymes." },
    ],
    effects: ['bond korr tessa 3'],
  },

  // ─────────────────────────────── Kael & Varek — rival dealers in secrets
  {
    id: 'kael_varek_architecture',
    between: ['kael', 'varek'],
    if: '!bell_rang',
    lines: [
      { who: 'kael', text: "You've been asking Tobin about the cathedral's foundations." },
      { who: 'varek', text: "And you've been watching everyone who walks up that hill. We're both so terribly interested in architecture." },
      { who: 'kael', text: "Who's paying you?" },
      { who: 'varek', text: "Who's paying you?" },
      { who: 'kael', text: "...Lovely chat." },
      { who: 'varek', text: "Delightful. Let's never have it again." },
    ],
    effects: ['bond kael varek -1'],
  },
  {
    id: 'kael_varek_truce',
    between: ['kael', 'varek'],
    if: 'prologue_complete',
    lines: [
      { who: 'varek', text: "That letter you carry. No seal. Good paper, though. Solmara mill. The expensive kind offices buy." },
      { who: 'kael', text: "You go through my things, I go through yours. Found a very sad poem, by the way." },
      { who: 'varek', text: "...That was not a poem." },
      { who: 'kael', text: "It rhymed in places." },
      { who: 'varek', text: "Truce?" },
      { who: 'kael', text: "Truce. Until it's profitable not to be." },
    ],
    effects: ['bond kael varek 1'],
  },

  // ─────────────────────────────── Ilyra & Varek — she sees his good first
  {
    id: 'ilyra_varek_cloak',
    between: ['ilyra', 'varek'],
    if: 'bell_rang && !prologue_complete',
    lines: [
      { who: 'ilyra', text: "You gave your cloak to that old man in the fog." },
      { who: 'varek', text: "It was an unflattering cloak." },
      { who: 'ilyra', text: "It was your only one." },
      { who: 'varek', text: "Then I shall freeze elegantly." },
      { who: 'ilyra', text: "You do kind things and then insult them before anyone can say thank you. I see you, you know." },
      { who: 'varek', text: "...Please don't. It's very uncomfortable." },
    ],
    effects: ['bond ilyra varek 2'],
  },
  {
    id: 'ilyra_varek_singing',
    between: ['ilyra', 'varek'],
    if: 'visited:vault',
    lines: [
      { who: 'ilyra', text: "You're holding your head as though it hurts." },
      { who: 'varek', text: "Something is singing. It's nothing a priestess can mend." },
      { who: 'ilyra', text: "I wasn't offering to mend it. I was offering to sit with you while it sings." },
      { who: 'varek', text: "...Stay, then. But don't pray. They don't like it." },
      { who: 'ilyra', text: "Who doesn't?" },
      { who: 'varek', text: "Did I say ‘they’? Headaches make me imprecise." },
    ],
    effects: ['bond ilyra varek 2'],
  },

  // ─────────────────────────────── Vaelis & Seris — reason and dogma
  {
    id: 'vaelis_seris_questions',
    between: ['vaelis', 'seris'],
    if: 'visited:cathedral && !visited:vault',
    lines: [
      { who: 'vaelis', text: "Six statues. Six Lights. And one empty niche nobody is permitted to wonder about. Doesn't that bother you?" },
      { who: 'seris', text: "Faith does not require every question to be answered." },
      { who: 'vaelis', text: "Faith requires that certain questions never be asked. It isn't quite the same thing." },
      { who: 'seris', text: "And what does your Conclave require, wizard? Obedience to whoever has read the most?" },
      { who: 'vaelis', text: "Former Conclave. And yes, roughly. ...Touché." },
    ],
    effects: ['bond vaelis seris 1'],
  },
  {
    id: 'vaelis_seris_ember',
    between: ['vaelis', 'seris'],
    if: 'visited:vault && !prologue_complete',
    lines: [
      { who: 'vaelis', text: "Your relic is pulsing in time with the walls." },
      { who: 'seris', text: "It is the Lamp's grace, answering a holy place." },
      { who: 'vaelis', text: "Hm. Of course it is." },
      { who: 'seris', text: "Say what you mean." },
      { who: 'vaelis', text: "I mean I'd love to examine it someday. In good light. With your permission." },
      { who: 'seris', text: "You will not have it." },
    ],
    effects: ['bond vaelis seris -1'],
  },

  // ─────────────────────────────── Brakka & Kael — big-sister disapproval
  {
    id: 'brakka_kael_meat_pie',
    between: ['brakka', 'kael'],
    if: '!bell_rang',
    lines: [
      { who: 'brakka', text: "Kael. Hands where I can see them." },
      { who: 'kael', text: "They're always where you can see them. That's what makes it impressive." },
      { who: 'brakka', text: "You eaten today?" },
      { who: 'kael', text: "What? Yes. Probably. Why?" },
      { who: 'brakka', text: "(Shoves a meat pie into his hands.) Eat. You're all angles." },
      { who: 'kael', text: "...Did you just mother me?" },
    ],
    effects: ['bond brakka kael 2'],
  },
  {
    id: 'brakka_kael_little_thief',
    between: ['brakka', 'kael'],
    if: 'rescued_count>=2',
    lines: [
      { who: 'kael', text: "Those twins we pulled out of the fog. Nobody came for them." },
      { who: 'brakka', text: "Tobin took them in. Fed them stew." },
      { who: 'kael', text: "Good. Good. That's... good." },
      { who: 'brakka', text: "You care more than you let on, little thief." },
      { who: 'kael', text: "Don't call me little." },
      { who: 'brakka', text: "Everyone's little. I'm a dwarf; I'm allowed." },
    ],
    effects: ['bond brakka kael 2'],
  },

  // ─────────────────────────────── Orren & Korr — silent respect, shared watches
  {
    id: 'orren_korr_watch',
    between: ['orren', 'korr'],
    if: 'bell_rang && !found_secret_stair',
    lines: [
      { who: 'korr', text: "You don't talk." },
      { who: 'orren', text: "Neither do you." },
      { who: 'korr', text: "Good." },
      { who: 'orren', text: "Good." },
    ],
    effects: ['bond orren korr 2'],
  },
  {
    id: 'orren_korr_old_tracks',
    between: ['orren', 'korr'],
    if: 'bell_rang && !prologue_complete',
    lines: [
      { who: 'orren', text: "The fog said your name." },
      { who: 'korr', text: "You heard it?" },
      { who: 'orren', text: "Heard something. Saw your shoulders." },
      { who: 'korr', text: "...Someone I failed." },
      { who: 'orren', text: "Then it's not a lie. Just an old track." },
      { who: 'korr', text: "Old tracks do not call." },
    ],
    effects: ['bond orren korr 2'],
  },

  // ─────────────────────────────── Vaelis & Orren — desperate to study him
  {
    id: 'vaelis_orren_pocket',
    between: ['vaelis', 'orren'],
    if: 'found_secret_stair && !prologue_complete',
    lines: [
      { who: 'vaelis', text: "Orren, what's in your pocket?" },
      { who: 'orren', text: "Pocket things." },
      { who: 'vaelis', text: "Your hand hasn't left it since midnight. And I'd swear the cloth there is warmer than the rest of you." },
      { who: 'orren', text: "Halflings run hot." },
      { who: 'vaelis', text: "That is not even slightly true." },
      { who: 'orren', text: "Then stop measuring me." },
    ],
    effects: ['bond vaelis orren -1'],
  },
  {
    id: 'vaelis_orren_moss',
    between: ['vaelis', 'orren'],
    if: '!bell_rang',
    lines: [
      { who: 'vaelis', text: "My instruments say the Veil here has been trembling for three weeks." },
      { who: 'orren', text: "Swallows left three weeks ago." },
      { who: 'vaelis', text: "...You're telling me a bird figured it out before my gauge did." },
      { who: 'orren', text: "Birds have been doing it longer." },
    ],
    effects: ['bond vaelis orren 1'],
  },

  // ─────────────────────────────── Vaelis & Ilyra — faith against reason
  {
    id: 'vaelis_ilyra_habit',
    between: ['vaelis', 'ilyra'],
    if: 'bell_rang && !prologue_complete',
    lines: [
      { who: 'vaelis', text: "You prayed over that fog hound's corpse. It was a construct of unreality. It had no soul." },
      { who: 'ilyra', text: "Then the prayer cost it nothing, and me very little." },
      { who: 'vaelis', text: "That isn't an argument." },
      { who: 'ilyra', text: "No. It's a habit. Most kind things are." },
      { who: 'vaelis', text: "...I find I can't disprove that, and I resent it." },
    ],
    effects: ['bond vaelis ilyra 1'],
  },

  // ─────────────────────────────── Brakka & Tessa — determined to make her laugh
  {
    id: 'brakka_tessa_ladder',
    between: ['brakka', 'tessa'],
    if: '!bell_rang',
    lines: [
      { who: 'tessa', text: "Brakka. Why did the dwarf bring a ladder to the tavern?" },
      { who: 'brakka', text: "No." },
      { who: 'tessa', text: "Because she heard the drinks were on the house!" },
      { who: 'brakka', text: "(Stares at her. Does not blink.)" },
      { who: 'tessa', text: "Nothing? Not a twitch? I'll get you. I'll get you before the year's out." },
      { who: 'brakka', text: "You'll try. It's the trying I like." },
    ],
    effects: ['bond brakka tessa 1'],
  },
  {
    id: 'brakka_tessa_ostrem_verse',
    between: ['brakka', 'tessa'],
    if: 'prologue_complete',
    lines: [
      { who: 'tessa', text: "Tell me about Ostrem. For the songbook." },
      { who: 'brakka', text: "Why? Nobody believes it was there." },
      { who: 'tessa', text: "I collect songs nobody knows the origin of. A hall nobody remembers fits right in." },
      { who: 'brakka', text: "...The bread ovens were in the east wall. Kept the whole hall warm. Children slept against it in winter." },
      { who: 'tessa', text: "That's verse one. Keep going." },
    ],
    effects: ['bond brakka tessa 3'],
  },

  // ─────────────────────────────── Brakka & Ilyra — memories or deeds
  {
    id: 'brakka_ilyra_real',
    between: ['brakka', 'ilyra'],
    if: 'lira_fate',
    lines: [
      { who: 'brakka', text: "That girl. Lira. Was she real, priestess?" },
      { who: 'ilyra', text: "She remembered being loved. That seemed real enough to me." },
      { who: 'brakka', text: "My clan says Ostrem fell four hundred years ago. I remember breakfast there. Am I real?" },
      { who: 'ilyra', text: "You're sitting here asking me. I've never met an unreal thing that worried about it." },
      { who: 'brakka', text: "...Huh. I'll chew on that." },
    ],
    effects: ['bond brakka ilyra 2'],
  },

  // ─────────────────────────────── Kael & Tessa — two performers
  {
    id: 'kael_tessa_card_trick',
    between: ['kael', 'tessa'],
    if: '!bell_rang',
    lines: [
      { who: 'kael', text: "Pick a card." },
      { who: 'tessa', text: "Queen of Lanterns. Up your sleeve. Second fold." },
      { who: 'kael', text: "...How?" },
      { who: 'tessa', text: "You glance at your left wrist before every reveal. Also, I do this trick. Better." },
      { who: 'kael', text: "Partners?" },
      { who: 'tessa', text: "Sixty-forty. I'm the talent." },
    ],
    effects: ['bond kael tessa 2'],
  },
  {
    id: 'kael_tessa_takes_one',
    between: ['kael', 'tessa'],
    if: 'bell_rang',
    lines: [
      { who: 'kael', text: "This ‘disbanded’ company of yours. Where'd they all go?" },
      { who: 'tessa', text: "Here and there. Wherever players go." },
      { who: 'kael', text: "You say it the way I say ‘between employers.’" },
      { who: 'tessa', text: "...Do I?" },
      { who: 'kael', text: "Takes one to know one. I won't ask again." },
      { who: 'tessa', text: "Thank you. Truly." },
    ],
    effects: ['bond kael tessa 2'],
  },

  // ─────────────────────────────── Kael & Nima
  {
    id: 'kael_nima_safe_distance',
    between: ['kael', 'nima'],
    if: 'heart_touched',
    lines: [
      { who: 'nima', text: "Kael, don't you wish you'd touched it too? The Heart?" },
      { who: 'kael', text: "Touch the glowing world-magic rock that every faction on the continent is about to hunt? Gosh. Tough call." },
      { who: 'nima', text: "But the visions!" },
      { who: 'kael', text: "I've had visions. They usually come with a hangover and a bill." },
      { who: 'nima', text: "You're no fun." },
      { who: 'kael', text: "I'm loads of fun. From a safe distance." },
    ],
    effects: ['bond kael nima 1'],
  },
  {
    id: 'kael_nima_dare',
    between: ['kael', 'nima'],
    if: 'bell_rang && !visited:cathedral',
    lines: [
      { who: 'nima', text: "Bet you a silver I can light that fog on fire." },
      { who: 'kael', text: "Bet you two you set the baker on fire instead." },
      { who: 'nima', text: "That happened ONE time." },
      { who: 'kael', text: "Wait, that was a guess." },
    ],
  },

  // ─────────────────────────────── Orren & Tessa — the birds listen
  {
    id: 'orren_tessa_birds_listen',
    between: ['orren', 'tessa'],
    if: 'bell_rang && !prologue_complete',
    lines: [
      { who: 'orren', text: "That tune you hum." },
      { who: 'tessa', text: "Hm? Oh, nothing. An old song. No origin." },
      { who: 'orren', text: "Birds stop singing when you hum it." },
      { who: 'tessa', text: "That's a rude thing to say about someone's singing." },
      { who: 'orren', text: "Not rude. They're listening." },
      { who: 'tessa', text: "(Very quietly.) ...Oh." },
    ],
    effects: ['bond orren tessa 1'],
  },

  // ─────────────────────────────── Vaelis & Varek — two kinds of forbidden
  {
    id: 'vaelis_varek_corvin_notes',
    between: ['vaelis', 'varek'],
    if: 'found_secret_stair',
    lines: [
      { who: 'vaelis', text: "These Unbound field notes are appalling. Half guesswork, half crimes against penmanship." },
      { who: 'varek', text: "And yet you've been reading them for an hour." },
      { who: 'vaelis', text: "The guesswork is extremely good." },
      { who: 'varek', text: "The Unbound always did have better questions than the Conclave. Fewer answers. Better questions." },
      { who: 'vaelis', text: "And how would you know what the Conclave has?" },
      { who: 'varek', text: "How would you?" },
    ],
    effects: ['bond vaelis varek 1'],
  },

  // ─────────────────────────────── Varek & Korr — half-written, half-erased
  {
    id: 'varek_korr_one_whole',
    between: ['varek', 'korr'],
    if: 'bell_rang',
    lines: [
      { who: 'varek', text: "They call your people half-written, I hear." },
      { who: 'korr', text: "They call yours half-erased." },
      { who: 'varek', text: "Between us, we might make one whole person." },
      { who: 'korr', text: "...That was a joke." },
      { who: 'varek', text: "It was. Tell no one. I have a reputation." },
      { who: 'korr', text: "Ashkin do not gossip. We sing. I will not sing that one." },
    ],
    effects: ['bond varek korr 2'],
  },

  // ─────────────────────────────── Ilyra & Orren
  {
    id: 'ilyra_orren_leaves',
    between: ['ilyra', 'orren'],
    if: 'lira_fate=faded',
    lines: [
      { who: 'orren', text: "The girl. She went like a leaf in autumn." },
      { who: 'ilyra', text: "Is that a comfort or a grief, where you come from?" },
      { who: 'orren', text: "Both. Leaves feed the roots." },
      { who: 'ilyra', text: "...I'll remember that, the next time I sit with someone at the end." },
    ],
    effects: ['bond ilyra orren 2'],
  },

  // ─────────────────────────────── Seris & Korr — straight words
  {
    id: 'seris_korr_scholar_jailed',
    between: ['seris', 'korr'],
    if: 'corvin_fate=handed_over',
    lines: [
      { who: 'seris', text: "Surrendering the scholar to the watch was just. His dig endangered the whole town." },
      { who: 'korr', text: "He did not mean it." },
      { who: 'seris', text: "Intention does not raise the dead." },
      { who: 'korr', text: "No. I know that better than you." },
      { who: 'seris', text: "...I did not mean—" },
      { who: 'korr', text: "I know. You speak straight. It is good. Sometimes it cuts." },
    ],
    effects: ['bond seris korr 1'],
  },
  {
    id: 'seris_korr_scholar_freed',
    between: ['seris', 'korr'],
    if: 'corvin_fate=freed',
    lines: [
      { who: 'seris', text: "Releasing the Unbound scholar was a mistake." },
      { who: 'korr', text: "He wept. He tried to mend what he broke." },
      { who: 'seris', text: "The law is not moved by tears." },
      { who: 'korr', text: "Then the law has never wept." },
    ],
    effects: ['bond seris korr -1'],
  },

  // ─────────────────────────────── Nima & Varek
  {
    id: 'nima_varek_reading_lamp',
    between: ['nima', 'varek'],
    if: '!bell_rang',
    lines: [
      { who: 'nima', text: "Your eyes are AMAZING. Do they glow in the dark? Can you read by them?" },
      { who: 'varek', text: "Most people stare. You're the first to ask whether I'm a reading lamp." },
      { who: 'nima', text: "Well? Can you?" },
      { who: 'varek', text: "...Small print, yes." },
      { who: 'nima', text: "I'm SO jealous. All I get is smoke and singed eyebrows." },
      { who: 'varek', text: "Trade you." },
    ],
    effects: ['bond nima varek 2'],
  },

  // ─────────────────────────────── Kael & Orren
  {
    id: 'kael_orren_dig_tools',
    between: ['kael', 'orren'],
    if: 'found_secret_stair && !prologue_complete',
    lines: [
      { who: 'kael', text: "These dig tools are good iron. Unbound kit. Could fetch a nice price in Ashenford—" },
      { who: 'orren', text: "Leave them." },
      { who: 'kael', text: "They're just lying here!" },
      { who: 'orren', text: "So are the dead. You're not selling them." },
      { who: 'kael', text: "...Fair. Grim, but fair." },
    ],
    effects: ['bond kael orren -1'],
  },

  // ─────────────────────────────── Ilyra & Korr
  {
    id: 'ilyra_korr_a_brother',
    between: ['ilyra', 'korr'],
    if: 'bell_rang && !prologue_complete',
    lines: [
      { who: 'ilyra', text: "You flinch when the fog moves. Who do you hear?" },
      { who: 'korr', text: "No one." },
      { who: 'ilyra', text: "No one usually has a name." },
      { who: 'korr', text: "...A brother. He is dead. My hand did it." },
      { who: 'ilyra', text: "Then he's someone you can still grieve. That isn't nothing, Korr." },
      { who: 'korr', text: "Priestess. Do not tell the others." },
    ],
    effects: ['bond ilyra korr 2'],
  },

  // ─────────────────────────────── Seris & Nima
  {
    id: 'seris_nima_one_rule',
    between: ['seris', 'nima'],
    if: '!bell_rang',
    lines: [
      { who: 'nima', text: "Seris, have you ever broken a rule? Just a tiny one?" },
      { who: 'seris', text: "No." },
      { who: 'nima', text: "Not even one? Not even staying up late at the foundling house?" },
      { who: 'seris', text: "...Once. I read a book after lights-out. A romance." },
      { who: 'nima', text: "SERIS!" },
      { who: 'seris', text: "I confessed it the next morning and did a week of penance. It was worth it." },
    ],
    effects: ['bond seris nima 2'],
  },

  // ─────────────────────────────── Vaelis & Kael
  {
    id: 'vaelis_kael_corvin_ally',
    between: ['vaelis', 'kael'],
    if: 'corvin_fate=ally',
    lines: [
      { who: 'kael', text: "So the bookworm's on our side now." },
      { who: 'vaelis', text: "Corvin is on the side of whatever he's digging up. We merely happen to be standing near the hole." },
      { who: 'kael', text: "You like him." },
      { who: 'vaelis', text: "I like his questions. He is, regrettably, attached to them." },
    ],
    effects: ['bond vaelis kael 1'],
  },

  // ─────────────────────────────── Varek & Tessa — songs with no origin
  {
    id: 'varek_tessa_descending_fourths',
    between: ['varek', 'tessa'],
    if: 'bell_rang',
    lines: [
      { who: 'tessa', text: "Varek, that tune you hum. Where's it from?" },
      { who: 'varek', text: "I don't hum." },
      { who: 'tessa', text: "Three times tonight. Descending fourths, then a turn. It's in my book of songs nobody knows the origin of." },
      { who: 'varek', text: "...Then we're both carrying something with no origin. How cosy." },
      { who: 'tessa', text: "Sing it with me sometime?" },
      { who: 'varek', text: "No. (A pause.) Perhaps." },
    ],
    effects: ['bond varek tessa 1'],
  },

  // ─────────────────────────────── Brakka & Orren — the same sickness
  {
    id: 'brakka_orren_same_sickness',
    between: ['brakka', 'orren'],
    if: 'bell_rang',
    lines: [
      { who: 'orren', text: "Paths in the Woods that weren't there yesterday." },
      { who: 'brakka', text: "A hall that was standing yesterday and rubble today." },
      { who: 'orren', text: "Same sickness." },
      { who: 'brakka', text: "Aye. Whatever's doing it, it isn't choosy." },
      { who: 'orren', text: "We'll walk it back. Your hall. My paths." },
      { who: 'brakka', text: "I'll hold you to that, little warden." },
    ],
    effects: ['bond brakka orren 2'],
  },

  // ─────────────────────────────── Kael & Ilyra
  {
    id: 'kael_ilyra_tall_kid',
    between: ['kael', 'ilyra'],
    if: 'met_pell',
    lines: [
      { who: 'ilyra', text: "You're good with children, Kael. Pell barely let go of your sleeve." },
      { who: 'kael', text: "Kids like me. I'm basically a tall kid with knives." },
      { who: 'ilyra', text: "Where did you learn it?" },
      { who: 'kael', text: "...A house in Ashenford. Lot of kids. Not enough roof." },
      { who: 'ilyra', text: "Do you still visit?" },
      { who: 'kael', text: "Look, a rat! Let's go chase it." },
    ],
    effects: ['bond kael ilyra 1'],
  },

  // ─────────────────────────────── Nima & Korr — fires that aren't theirs
  {
    id: 'nima_korr_two_fires',
    between: ['nima', 'korr'],
    if: 'bell_rang && !prologue_complete',
    lines: [
      { who: 'nima', text: "Korr, does your — the angry thing — does it ever talk to you?" },
      { who: 'korr', text: "It does not talk. It wants." },
      { who: 'nima', text: "Mine talks. Sometimes. In my voice, only... older." },
      { who: 'korr', text: "Then we both carry a fire that is not ours." },
      { who: 'nima', text: "Promise you'll stop me, if I ever—" },
      { who: 'korr', text: "Yes. And you, me." },
    ],
    effects: ['bond nima korr 2'],
  },

  // ─────────────────────────────── Orren & Varek
  {
    id: 'orren_varek_reaching',
    between: ['orren', 'varek'],
    if: 'found_secret_stair && !prologue_complete',
    lines: [
      { who: 'orren', text: "Roots down here are reaching for something." },
      { who: 'varek', text: "So is everyone, I find." },
      { who: 'orren', text: "You too." },
      { who: 'varek', text: "What a perceptive halfling. Do try to stop." },
    ],
  },

  // ─────────────────────────────── Vaelis & Tessa
  {
    id: 'vaelis_tessa_no_origin',
    between: ['vaelis', 'tessa'],
    if: '!bell_rang',
    lines: [
      { who: 'tessa', text: "Vaelis! You're two hundred. You must know where this tune comes from. (She hums.)" },
      { who: 'vaelis', text: "Two hundred and twelve. And no. Every culture I've studied has a version. Nobody wrote it." },
      { who: 'tessa', text: "Somebody always writes it." },
      { who: 'vaelis', text: "Then somebody was very thoroughly forgotten." },
      { who: 'tessa', text: "...That's the saddest thing you've ever said, and you once called my lute ‘adequate.’" },
    ],
    effects: ['bond vaelis tessa 1'],
  },

  // ─────────────────────────────── Three-way exchanges
  {
    id: 'brakka_korr_seris_bellwarden',
    between: ['brakka', 'korr', 'seris'],
    if: 'bellwarden_defeated',
    lines: [
      { who: 'brakka', text: "Eighty years, ringing for a town that was gone." },
      { who: 'korr', text: "He held his post. That is honour, even mad." },
      { who: 'seris', text: "He was a monk of Aurel. He kept his vow past death and past reason." },
      { who: 'seris', text: "...I hope someone thinks so well of me, when I am gone." },
      { who: 'brakka', text: "We will, lass. Don't rush it." },
    ],
    effects: ['bond brakka seris 1', 'bond korr seris 1'],
  },
  {
    id: 'tessa_nima_vaelis_encore',
    between: ['tessa', 'nima', 'vaelis'],
    if: 'prologue_complete',
    lines: [
      { who: 'tessa', text: "Encore idea. Nima does the lanterns, I do the song, Vaelis does a learned introduction." },
      { who: 'vaelis', text: "I do not do introductions." },
      { who: 'nima', text: "He does do lectures." },
      { who: 'tessa', text: "Perfect. Ten minutes of lecture and then the lanterns explode." },
      { who: 'vaelis', text: "...Fifteen minutes. And the explosion must be thematically justified." },
    ],
    effects: ['bond tessa vaelis 1', 'bond nima vaelis 1'],
  },
];
