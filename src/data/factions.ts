/** Factions of Elyndra (canon: STORY_BIBLE.md §6). Reputation runs from -100 to +100. */
export interface FactionDef {
  id: string;
  name: string;
  leaders: string;
  seat: string;
  ideology: string;
  strengths: string;
  flaws: string;
  split: string;
  relations: string;
  /** Flag that makes the faction known in the journal (besides any non-zero reputation). */
  knownIf: string;
}

export const FACTIONS: FactionDef[] = [
  {
    id: 'hollowmere', name: 'Hollowmere', leaders: 'Mayor Edda Brannock; Captain Roderic Hale', seat: 'Hollowmere town hall', knownIf: '',
    ideology: 'A frontier town that wants to get through the winter, and the next one.',
    strengths: 'Neighbours who remember who helped them.', flaws: 'Small, frightened, and easily forgotten by the powerful.',
    split: 'Some want to call the Covenant for protection; others fear what the Covenant does to "tainted" towns.',
    relations: 'Grateful to those who came into the fog.',
  },
  {
    id: 'conclave', name: 'The Aether Conclave', leaders: 'Archon Severin Cael; High Seeker Dorran Vex; Magister Lunet Arvane; Seeker Ysolt Ravencourt', seat: 'The Obsidian Citadel', knownIf: 'heart_touched',
    ideology: 'Magic must be governed by those who understand it. The Veil is a machine — it can be repaired, and improved.',
    strengths: 'The finest mages alive, Anchor-detecting instruments, deep archives, spellcaster licensing.',
    flaws: 'Arrogance, secrecy, readiness to spend ordinary lives on theory; Veilborn treated as specimens.',
    split: 'Severin’s circle would seize the Heart; Lunet’s faction would seal the Anchors forever; Vex is loyal only to results.',
    relations: 'Uneasy partners of the Covenant; bitter enemies of the Unbound; despised by the Circle.',
  },
  {
    id: 'covenant', name: 'The Iron Covenant', leaders: 'Lord-Marshal Hester Vanbrook; Chancellor Ober Lusk; Spymaster Wendel Crane', seat: 'The Bastion of Solmara', knownIf: 'bg:soldier || prologue_complete',
    ideology: 'Order is the precondition of mercy. Central authority keeps people fed and alive.',
    strengths: 'Armies, roads, granaries, courts, the loyalty of frightened townsfolk.',
    flaws: 'Forced relocations, censorship of "unstable" testimony, Veilborn interned "for their protection".',
    split: 'Hester wants the Heart locked away; Lusk wants it as a weapon; some officers quietly aid the Unbound.',
    relations: 'Allied with the Last Dawn; rivals of the Conclave; hunters of the Unbound.',
  },
  {
    id: 'verdant', name: 'The Verdant Circle', leaders: 'The Greenmother, Aunra Vell; Thorn-Elder Caddoc Briar (Thornwake)', seat: 'The Heartwood Moot, Whispering Woods', knownIf: 'comp:orren || prologue_complete',
    ideology: 'The Veil is an unnatural wall that corrupted the natural order; the land should be allowed to heal, even if healing hurts.',
    strengths: 'Shapeshifters, beast-allies, mastery of the wild, the ability to hear the old trees.',
    flaws: 'A cold long view in which towns are weeds.',
    split: 'Aunra seeks reconciliation; the Thornwake breaks Anchors deliberately and lets towns fall to the fog.',
    relations: 'Friends of halfling woodsteads and Ashkin clans; foes of the Conclave and Covenant loggers.',
  },
  {
    id: 'dawn', name: 'The Order of the Last Dawn', leaders: 'Hierophant Oriel Vantasse; Dawnblade-Commander Isaut Merrow', seat: 'The Dawnspire, outside Solmara', knownIf: 'comp:seris || prologue_complete',
    ideology: 'The Veil’s collapse is divine judgment on a proud world. Repent, prepare, purify.',
    strengths: 'Fervent followers, healers, refugee kitchens, genuine divine power.',
    flaws: 'Fatalism; persecution of Veilborn and echoes; leaders who hide the truth.',
    split: 'Penitents serve the suffering; Dawnblades would purge everything Unwritten by fire.',
    relations: 'Allied with the Covenant; hostile to Veilborn, warlocks and the Unbound.',
  },
  {
    id: 'unbound', name: 'The Unbound', leaders: 'Odalys Fenn, "the Index"; field agent Corvin Thale', seat: 'The City Between Moments; safe houses in Ashenford and Solmara', knownIf: 'knows_unbound || corvin_fate',
    ideology: 'History has been stolen. Every erased people deserves to be remembered — whatever it costs.',
    strengths: 'Secret knowledge, forgers, informants, the only maps of the Forgotten Depths.',
    flaws: 'Recklessness at dangerous sites, cult-like devotion to "truth", a habit of using people.',
    split: 'The Index would open the Veil and restore the erased; the scholarly wing only wants to record, and fears the cost.',
    relations: 'Covertly aided by Lunet Arvane and some Covenant officers; hunted by everyone else.',
  },
];

export const FACTION_BY_ID: Record<string, FactionDef> = Object.fromEntries(FACTIONS.map((f) => [f.id, f]));

export type RepTier = 'Hostile' | 'Wary' | 'Neutral' | 'Trusted' | 'Allied';

export function repTier(v: number): RepTier {
  if (v <= -40) return 'Hostile';
  if (v <= -10) return 'Wary';
  if (v < 15) return 'Neutral';
  if (v < 50) return 'Trusted';
  return 'Allied';
}

/** Price multiplier adjustment for merchants aligned with a faction. Hostile merchants refuse to trade. */
export function tierPriceDelta(t: RepTier): number | null {
  return { Hostile: null, Wary: 0.15, Neutral: 0, Trusted: -0.1, Allied: -0.2 }[t];
}
