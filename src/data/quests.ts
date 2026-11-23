export interface QuestDef {
  id: string;
  title: string;
  category: 'main' | 'side' | 'companion' | 'faction';
  giver: string;
  summary: string;
  stages: Record<string, { objective: string; journal: string }>;
  clues?: Record<string, string>;
  outcomes?: Record<string, string>;
  xp?: number;
}

export const QUESTS: QuestDef[] = [
  {
    id: 'mq_bell', title: 'The Bell That Never Rang', category: 'main', giver: 'Hollowmere', xp: 300,
    summary: 'A bell has rung from a tower that fell eighty years ago. Hollowmere is forgetting itself.',
    stages: {
      festival: { objective: 'Enjoy the Festival of Lanterns. Meet the townsfolk, then hang your lantern on the Lantern Tree in the square.', journal: 'You arrived in Hollowmere on the last night of the Festival of Lanterns, when families hang lanterns "for those we have forgotten."' },
      midnight: { objective: 'Find Captain Hale in the square and learn what happened.', journal: 'At midnight a bell tolled from the Cathedral of Saint Orlen — whose bell tower collapsed eighty years ago. Grey fog swallowed the streets. You alone heard it toll a second time.' },
      investigate: { objective: 'Learn what you can from those who remember (Old Wenna, Sister Maren), then search the Cathedral of Saint Orlen beyond the north gate.', journal: 'Captain Hale asked for your help. People are missing, and some have woken remembering different families.' },
      cathedral: { objective: 'Search the ruined cathedral for the source of the bell and find a way below.', journal: 'The cathedral smells of burnt incense, though no one has lit any in eighty years.' },
      undercroft: { objective: 'Explore the undercroft and find where the toll is coming from.', journal: 'Beneath the cathedral lie catacombs, an old chapel, and signs of a recent excavation.' },
      vault: { objective: 'Confront whatever is ringing the bell.', journal: 'Behind the sealed door lies a vault older than the cathedral — older, perhaps, than anything in Hollowmere.' },
      heart: { objective: 'Approach the crystal at the heart of the vault.', journal: 'With the bell silenced, something in the vault is still beating.' },
      done: { objective: 'Prologue complete.', journal: 'The Heart of Aether is bound to you now. Powerful people will come looking for it.' },
    },
    clues: {
      wenna_halric: 'Old Wenna remembers the bell from her childhood — and the young monk who rang it, Brother Halric.',
      maren_records: 'Sister Maren\'s records: the bell tower fell on the Night of Falling Stone, 80 years ago. The undercroft was sealed the same week.',
      corvin_seen: 'A travelling scholar lodging at the Lantern & Lamb has been seen leaving at night with a shovel.',
      census_gap: 'The town census has names scraped away — as if someone erased people, not just ink.',
      tree_vision: 'Through resonance you glimpsed a Hollowmere where the bell tower still stands.',
      altar_vision: 'Through resonance you saw a monk pressing the third lantern-carving on the altar. Stone slid aside.',
      halric_vision: 'A memory soaked into the ossuary: a kind young monk, letting children pull the bell rope.',
      bell_inscription: 'The bell carries an inscription in Old Ithari: "I ring for the town that remembers me."',
    },
    outcomes: {
      fought: 'You drove off Seeker Ysolt Ravencourt by force. The Conclave will not forget.',
      persuaded: 'You convinced Seeker Ravencourt to walk away — for now. She may yet prove an uneasy ally.',
      escaped: 'You escaped the Seeker through the collapsing vault. She will be hunting you.',
    },
  },
  {
    id: 'sq_brawl', title: 'Trouble at the Lantern & Lamb', category: 'side', giver: 'Tobin Marsh', xp: 75,
    summary: 'Grey Hawk sellswords are making trouble at the inn on festival night.',
    stages: {
      start: { objective: 'Deal with the Grey Hawk sellswords harassing the minstrel at the Lantern & Lamb.', journal: 'Dag Morrow and his Grey Hawks refuse to pay and are bullying young Lio Fenwick, the inn\'s minstrel.' },
    },
    outcomes: {
      talked: 'You talked Dag Morrow down. The Grey Hawks paid their tab — and owed you one.',
      performed: 'You out-sang the Grey Hawks and turned their jeers into a chorus. They paid and promised to keep the peace.',
      bribed: 'You paid the Grey Hawks\' tab. Dag clapped you on the shoulder and offered his crossbows if trouble came.',
      intimidated: 'You frightened the Grey Hawks out of town. Peace — at the cost of a few extra blades on the night it mattered.',
      fought: 'You beat the Grey Hawks in a brawl. Captain Hale put Dag in the stocks.',
    },
  },
  {
    id: 'sq_fog_rescue', title: 'Lost in the Fog', category: 'side', giver: 'Captain Roderic Hale', xp: 150,
    summary: 'Townsfolk are trapped in the fog. Captain Hale cannot reach them all.',
    stages: {
      start: { objective: 'Rescue those trapped in the fog: the miller\'s family (east mill), Ysolde Quill (her shop) and the boy Pell (the old well).', journal: 'Hale has too few watchmen. Three cries for help have come from the fog.' },
    },
    outcomes: {
      all: 'Everyone you went looking for came home. Hollowmere will remember that.',
      some: 'Not everyone came home from the fog. Those who did will not forget who came for them.',
    },
  },
  {
    id: 'sq_lira', title: 'The Girl Nobody Remembers', category: 'side', giver: 'Pell', xp: 150,
    summary: 'A boy insists he has a sister named Lira. No one else remembers her — not even their mother.',
    stages: {
      ask: { objective: 'Find evidence that Lira existed.', journal: 'Pell, about ten, swears his sister Lira was beside him yesterday. His mother says he has always been an only child.' },
      search: { objective: 'Pell heard Lira singing beneath the cathedral. Look for her in the undercroft.', journal: 'At the old well, Pell told you he heard Lira\'s lullaby rising from under the ground — from beneath Saint Orlen\'s.' },
      found: { objective: 'Decide what to do about Lira\'s echo.', journal: 'In the ossuary chapel you found Lira: a faded child-shape singing to herself, half here and half somewhere else.' },
      report: { objective: 'Tell Pell what became of his sister.', journal: 'Whatever you chose, Pell deserves to hear it from you.' },
    },
    clues: {
      census: 'A line in the town census has been scraped clean, beneath Pell\'s name.',
      cradle: 'There are two small beds in Pell\'s house. His mother cannot explain the second.',
    },
    outcomes: {
      anchored: 'You anchored Lira into this world with your resonance. She is real again — but the weave took something in return.',
      faded: 'You let Lira fade gently, singing. Pell has her music box, and he remembers.',
      bottled: 'You sealed Lira\'s echo in a vial. She is preserved. Whether that is a mercy is another question.',
    },
  },
  {
    id: 'sq_corvin', title: 'The Scholar\'s Dig', category: 'side', giver: 'Hollowmere', xp: 100,
    summary: 'Someone has been digging beneath the cathedral.',
    stages: {
      rumor: { objective: 'Find the scholar who has been digging at the cathedral.', journal: 'A scholar named Corvin Thale lodges at the inn and goes out at night with a shovel.' },
      found: { objective: 'Decide what to do with Corvin Thale.', journal: 'You found Corvin Thale trapped in his own excavation. He admits his dig cracked something old.' },
    },
    outcomes: {
      handed_over: 'You handed Corvin Thale to Captain Hale. Justice — or a scapegoat.',
      freed: 'You let Corvin go. He left you his sigil and promised the Unbound would remember.',
      ally: 'Corvin helped you open the way to the vault. The Unbound owe you.',
      killed: 'Corvin Thale died in the undercroft. What he knew died with him.',
    },
  },
];

import { CQ_QUESTS } from './companionQuests';
QUESTS.push(...CQ_QUESTS);
export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
