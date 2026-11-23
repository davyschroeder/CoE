import type { App } from '../app';
import { h, modal, put } from '../dom';
import { QUEST_BY_ID } from '../../data/quests';
import { FACTIONS, repTier } from '../../data/factions';
import { evalCond } from '../../engine/conditions';
import type { App as AppT } from '../app';

export function openJournal(app: App): void {
  void 0;
  const s = app.state!;
  const quests = Object.entries(s.quests);
  const order = { active: 0, completed: 1, failed: 2 } as const;
  quests.sort((a, b) => order[a[1].status] - order[b[1].status] || (QUEST_BY_ID[a[0]].category === 'main' ? -1 : 1));
  const view = h('div', { class: 'journal' });
  const list = h('div', { class: 'j-list' });
  const detail = h('div', { class: 'j-detail panel' });
  const show = (id: string) => {
    const def = QUEST_BY_ID[id], q = s.quests[id];
    const stages = Object.keys(def.stages);
    detail.replaceChildren(); put(detail, 
      h('h3', null, def.title), h('div', { class: 'muted' }, `${def.category === 'main' ? 'Main quest' : 'Side quest'} · ${q.status}`),
      h('p', { class: 'prose' }, def.summary),
      q.status === 'active' ? h('div', { class: 'objective-box' }, h('b', null, 'Objective: '), def.stages[q.stage].objective) : null,
      h('h4', null, 'Journal'),
      ...stages.filter((st) => q.stagesDone.includes(st) || st === q.stage).map((st) => h('p', { class: `j-entry ${st === q.stage && q.status === 'active' ? 'current' : 'done'}` }, def.stages[st].journal)),
      q.clues.length ? h('h4', null, 'Clues') : null,
      q.clues.length ? h('ul', null, q.clues.map((c) => h('li', null, def.clues?.[c] ?? c))) : null,
      q.outcome && def.outcomes?.[q.outcome] ? h('div', { class: 'outcome' }, h('b', null, 'Outcome: '), def.outcomes[q.outcome]) : null);
  };
  for (const [id, q] of quests) {
    list.append(h('div', { class: `j-item ${q.status}`, onclick: () => show(id) }, h('span', { class: 'j-cat' }, QUEST_BY_ID[id].category === 'main' ? '✦' : '•'), QUEST_BY_ID[id].title, h('span', { class: 'muted small' }, ` ${q.status}`)));
  }
  if (!quests.length) list.append(h('p', { class: 'muted' }, 'No quests yet.'));
  view.append(list, detail);
  if (quests.length) show(quests[0][0]);
  const tabs = h('div', { class: 'tabs' },
    h('button', { class: 'tab on', onclick: (e: Event) => { swap(e, view); } }, 'Quests'),
    h('button', { class: 'tab', onclick: (e: Event) => { swap(e, factionView(app)); } }, 'Factions'));
  const holder = h('div', null, view);
  const swap = (e: Event, el: HTMLElement) => { tabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('on')); (e.target as HTMLElement).classList.add('on'); holder.replaceChildren(el); };
  modal('Journal', h('div', null, tabs, holder), { wide: true });
}

function factionView(app: AppT): HTMLElement {
  const s = app.state!;
  const known = FACTIONS.filter((f) => (s.factions[f.id] ?? 0) !== 0 || (() => { try { return evalCond(s, f.knownIf); } catch { return false; } })());
  return h('div', { class: 'factions' }, known.map((f) => {
    const v = s.factions[f.id] ?? 0;
    const tier = repTier(v);
    return h('div', { class: 'panel faction' },
      h('div', { class: 'f-head' }, h('b', null, f.name), h('span', { class: `tier t-${tier.toLowerCase()}` }, `${tier} (${v > 0 ? '+' : ''}${v})`)),
      h('div', { class: 'bar rep' }, h('div', { class: 'fill', style: { width: `${(v + 100) / 2}%` } })),
      h('div', { class: 'small' }, h('b', null, 'Leaders: '), f.leaders, ' · ', h('b', null, 'Seat: '), f.seat),
      h('p', { class: 'small' }, f.ideology),
      h('div', { class: 'small muted' }, h('b', null, 'Strengths: '), f.strengths, ' ', h('b', null, 'Flaws: '), f.flaws),
      h('div', { class: 'small muted' }, h('b', null, 'Internal divisions: '), f.split),
      h('div', { class: 'small muted' }, h('b', null, 'Relations: '), f.relations));
  }), h('p', { class: 'muted small' }, 'Reputation tiers affect prices with aligned merchants (Hostile merchants refuse to trade) and unlock or close content.'));
}
