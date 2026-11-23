/**
 * End-of-Act-I summary lines (written by the Valdros/main-story author).
 * The epilogue screen shows every line whose condition holds, so the lines of each topic are mutually
 * exclusive. Conditions use only contract flags (docs/ACT1_SPEC.md) and companion recruitment.
 */
export const ACT1_EPILOGUE: { if?: string; text: string }[] = [
  // ── Sister Maren
  { if: 'a1_maren_fate=spared', text: 'Sister Maren went home to Hollowmere and hung two lanterns on the Lantern Tree. She gave you eight years of names scraped out of the world. Somewhere, a girl who hated porridge is still waiting to be remembered.' },
  { if: 'a1_maren_fate=turned', text: 'Sister Maren still writes to the Archon, in her careful archivist\'s hand: every word a lie you chose. She keeps her second lantern lit. She has not said whether it is for Elsa or for herself.' },
  { if: 'a1_maren_fate=killed', text: 'Sister Maren died at the foot of the Valdros Anchor, between her two lanterns. Nobody put them out. Nobody in Hollowmere hangs a lantern for her, because nobody there knows why she never came home.' },
  { if: 'a1_maren_fate=absent', text: 'Sister Maren never made a bargain with the Conclave; she does not remember the daughter it would have bought. She came to Valdros to read a stone, and left knowing it was a window. She still reaches, sometimes, for an empty hook.' },

  // ── Ossaryx
  { if: 'ossaryx_fate=returned', text: 'Ossaryx, the Gloaming Wyrm, swam home to Ysmerond along a road of lanterns, and left Hollowmere\'s forgotten lights on the dais for you to carry back. Somewhere a sea without a sun has its sovereign again. It knows how to find you.' },
  { if: 'ossaryx_fate=slain', text: 'Ossaryx, the Gloaming Wyrm, died in the Senate Dome with its lanterns going out one by one. Its world lost its last keeper of lamps. One honey-coloured paper lantern from Hollowmere is still burning in your pack.' },

  // ── Severin
  { if: 'a1_severin=refused', text: 'You refused Archon Severin Cael. He thanked you for your honesty, told you which roads his Seekers were watching, and promised to be patient. He has never once lied to you.' },
  { if: 'a1_severin=listened', text: 'You listened to Archon Severin Cael and gave him no answer. He seemed to think that was a beginning. "We\'ll speak again," he said. "I\'ll make sure of it."' },
  { if: 'a1_severin=tempted', text: 'Archon Severin Cael described a world without plague or grief, and for a moment you wanted it more than anything. He saw. He keeps very good notes.' },

  // ── The Whispering Woods (Writer A)
  { if: 'a1_thornwake=helped', text: 'You stood with Caddoc Briar and the Thornwake. The Woods will heal the way the Thornwake wants them to: whether the towns on their edges survive the healing is another matter.' },
  { if: 'a1_thornwake=stopped', text: 'You stopped the Thornwake\'s sabotage. Caddoc Briar\'s radicals have scattered into the deep Woods, nursing a grudge as old as the trees.' },
  { if: 'a1_thornwake=bargained', text: 'You struck a bargain with the Thornwake. Caddoc Briar keeps it, for now, with the patience of something that thinks in centuries.' },
  { if: 'a1_stone=mended', text: 'The Whispering Stone holds again. The Woods\' paths stay where the woodcutters\' red cords say they should — mostly.' },
  { if: 'a1_stone=broken', text: 'The Whispering Stone is broken. Every morning the Woods wake a little different, and the woodcutters have started tying their cords to each other instead of to the trees.' },
  { if: 'a1_stone=left', text: 'You left the Whispering Stone as you found it: failing, slowly. The Greenmother is listening to it die.' },

  // ── Ashenford (Writer B)
  { if: 'a1_wren=saved', text: 'The Wren House still stands in Ashenford\'s Low Quarter. Its children sleep in their own beds, and none of them were taken.' },
  { if: 'a1_wren=lost', text: 'The Covenant took the Wren House. Its children are "relocated," which is a word that means nobody will tell you where.' },
  { if: 'a1_wren=deal', text: 'The Wren House stands, because a deal was struck. Somebody will come to collect on it.' },
  { if: 'a1_mob=dispersed', text: 'The Dawnblade mob went home without the drowning it came for. Ashenford pretends it never happened, which is what Ashenford does best.' },
  { if: 'a1_mob=fought', text: 'You broke the Dawnblade mob with steel and fire. Ashenford remembers your faces now; so does the Order of the Last Dawn.' },
  { if: 'a1_mob=bought', text: 'You bought off the Dawnblade mob. It was cheaper than a funeral. It will not be cheaper next time.' },
  { if: 'a1_glassworks=reconciled', text: 'At the Emberglass glassworks, a scarred father and a daughter full of lightning sat at the same table and talked until the kilns went cold.' },
  { if: 'a1_glassworks=estranged', text: 'The Emberglass glassworks\' door stayed shut. Some burns do not heal by being looked at.' },
  { if: 'a1_safehouse=allied', text: 'Under the cooper\'s shop in Ashenford, the Unbound have written your name in a ledger of friends. That is a dangerous book to be in.' },
  { if: 'a1_safehouse=visited', text: 'The Unbound know your face. They have not yet decided what you are to them.' },
  { if: 'a1_safehouse=betrayed', text: 'The Unbound safe house under the cooper\'s shop is empty now, and the Unbound know whom to thank for it.' },

  // ── Hollowmere
  { if: 'cq_seris_outcome=condemned', text: 'Hollowmere lies under the Order\'s interdict: a white cord across the south road, and townsfolk who step over it carefully, as though it might bite.' },
  { if: 'cq_seris_outcome=warded', text: 'Hollowmere lives under Seris Dawnbound\'s own lamp. Any judgment on the town must go through her first.' },
  { if: 'cq_seris_outcome=questioned', text: 'Hollowmere waits for the Order\'s answer to Seris\'s plea. Mayor Brannock has added it to her lists.' },
  { if: 'cq_seris_outcome=spared', text: 'Hollowmere was declared clean by a knight who had never lied before. The town rebuilds its roofs, and never learns what it was spared.' },
  { if: '!cq_seris_outcome', text: 'Hollowmere is rebuilding: new thatch, fewer names, a Mayor who counts everyone twice. On the Lantern Tree, a fresh lantern bears your names in a child\'s careful capitals.' },

  // ── Corvin Thale
  { if: 'corvin_fate=handed_over', text: 'Corvin Thale was left to the Covenant\'s justice in Hollowmere\'s watch house. Whether a magistrate ever heard his case depends on what you said to Captain Hale.' },
  { if: 'corvin_fate=freed', text: 'Corvin Thale is somewhere among the Unbound, writing pamphlets about a debt he means to repay.' },
  { if: 'corvin_fate=ally', text: 'Corvin Thale is your contact among the Unbound, and apologises in every message he sends.' },
  { if: 'corvin_fate=killed', text: 'Corvin Thale\'s boots were given to someone who needed them. Nobody in Hollowmere ever learned what he was digging for.' },

  // ── Seeker Ysolt Ravencourt
  { if: 'ysolt_outcome=fought', text: 'Seeker Ysolt Ravencourt has now lost to you twice. She has stopped taking it personally, which is worse.' },
  { if: 'ysolt_outcome=persuaded', text: 'Seeker Ysolt Ravencourt keeps a ledger with a column the Archon doesn\'t know about. Your name is in it.' },
  { if: 'ysolt_outcome=escaped', text: 'Seeker Ysolt Ravencourt is still hunting you. She has started to admire you for it. That is a professional failing, and she intends to correct it.' },

  // ── Companions
  { if: 'recruited:vaelis', text: 'Vaelis Thorne heard his old master say "the door is still open." He has not said whether he means to walk through it, or to brick it up.' },
  { if: 'recruited:seris', text: 'Seris Dawnbound rides with you to judge the Veil itself. Her sealed orders weigh more every mile.' },
  { if: 'recruited:brakka', text: 'Brakka Stonevein walks at your shoulder, shield up, counting roofs and exits wherever you go.' },
  { if: 'recruited:kael', text: 'Kael Veyran is still with you, still charming, and still not telling you who pays him.' },
  { if: 'recruited:nima', text: 'Nima Emberglass travels with you, crackling. The voice in her flames has been very quiet lately, which she finds more frightening than when it shouts.' },
  { if: 'recruited:orren', text: 'Orren Mossward found the Old Path his grandmother walked, and kept walking it, with you.' },
  { if: 'recruited:ilyra', text: 'Ilyra Voss lights a lantern for someone she cannot name every evening at camp. Lately she lights two.' },
  { if: 'recruited:varek', text: 'Varek Sable says the Choir has been singing more softly since Valdros. He does not say what they are singing about.' },
  { if: 'recruited:tessa', text: 'Tessa Quickthorn has a new verse for her Song of Everything Forgotten: a wyrm wound in lanterns, and a city that could not decide which city it was.' },
  { if: 'recruited:korr', text: 'Korr Ashmane walks with you, and at night by the fire he is trying, very quietly, to make a song big enough for what he saw beneath the Senate Dome.' },
];
