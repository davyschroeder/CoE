import type { App } from '../app';
import { h, modal, clear } from '../dom';
import { activeCompanionIds } from '../../engine/state';
import { COMPANION_BY_ID } from '../../data/companions';
import { relationshipSummary } from '../../engine/companionMind';
import { portraitSvg } from '../portraits';
import { CLASS_BY_ID } from '../../data/classes';

/** Party orders (strategic instructions) and companion relationships. */
export function openParty(app: App, after?: () => void): void {
  const s = app.state!;
  const root = h('div', { class: 'partyview' });
  const render = () => {
    clear(root);
    const o = s.orders;
    const toggle = (label: string, tip: string, val: boolean, set: (v: boolean) => void) =>
      h('label', { class: 'check', 'data-tip': tip }, h('input', { type: 'checkbox', checked: val, onchange: (e: Event) => { set((e.target as HTMLInputElement).checked); render(); } }), ' ', label);
    root.append(
      h('div', { class: 'panel orders' }, h('h3', null, 'Party orders'),
        h('p', { class: 'muted small' }, 'Your companions act on their own, but they listen to your strategy.'),
        h('div', { class: 'row' }, (['follow', 'initiative', 'hold'] as const).map((st) => h('button', { class: `btn small ${o.stance === st ? '' : 'ghost'}`, onclick: () => { o.stance = st; render(); },
          'data-tip': { follow: 'Follow my lead: focus the enemies I attack.', initiative: 'Take initiative: use your own judgement.', hold: 'Hold position: do not move in combat; fight from where you stand.' }[st] },
          { follow: 'Follow my lead', initiative: 'Take initiative', hold: 'Hold position' }[st]))),
        toggle('Protect the weakest member', 'Tanks guard the most wounded ally and target enemies threatening them.', o.protectWeakest, (v) => (o.protectWeakest = v)),
        toggle('Save your strongest abilities', 'Companions prefer cantrips and basic attacks unless things get dangerous.', o.conserve, (v) => (o.conserve = v)),
        toggle('Use stealth', 'Move quietly: halves random encounters and lets you try to sneak past or ambush enemies (group Stealth check).', o.stealth, (v) => (o.stealth = v)),
        toggle('Avoid unnecessary combat', 'Companions will favour talking, sneaking and retreat options when they suggest plans.', o.avoidCombat, (v) => (o.avoidCombat = v))),
      h('div', { class: 'rel-list' }, activeCompanionIds(s).map((id) => {
        const d = COMPANION_BY_ID[id], cs = s.companions[id];
        const others = activeCompanionIds(s).filter((x) => x !== id);
        return h('div', { class: 'panel rel' },
          h('div', { class: 'rel-head' }, h('span', { html: portraitSvg({ hue: d.hue, sigil: CLASS_BY_ID[d.classId].sigil, initials: d.name.split(' ').map((p) => p[0]).join(''), size: 48 }) }),
            h('div', null, h('b', null, d.name), h('div', { class: 'muted small' }, d.title), h('div', { class: 'small' }, `Mood: ${cs.mood >= 2 ? 'good' : cs.mood <= -3 ? 'bad' : 'steady'} · Stress ${Math.round(cs.stress)}/10`))),
          h('div', { class: 'small' }, relationshipSummary(cs)),
          others.length ? h('div', { class: 'small muted' }, 'With others: ', others.map((x) => `${COMPANION_BY_ID[x].name.split(' ')[0]} ${bondWord(cs.bonds[x] ?? 0)}`).join(', ')) : null,
          cs.memories.length ? h('details', null, h('summary', null, `Remembers (${cs.memories.length})`), h('ul', { class: 'small' }, cs.memories.slice(-8).reverse().map((m) => h('li', { class: m.valence > 0 ? 'good' : 'bad' }, m.text)))) : null);
      })));
  };
  render();
  modal('Party', root, { wide: true, onClose: () => { after?.(); app.explore?.refresh(); } });
}

function bondWord(v: number): string {
  return v >= 30 ? '(close friends)' : v >= 10 ? '(friendly)' : v <= -20 ? '(rivals)' : v <= -5 ? '(prickly)' : '(neutral)';
}
