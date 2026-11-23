import type { App } from '../app';
import { h, modal, clear, toast } from '../dom';
import { RECIPES } from '../../data/recipes';
import { ITEM_BY_ID, RARITY_COLORS } from '../../data/items';
import { ACTION_BY_ID } from '../../data/actions';
import { craft, missingFor, bestCrafter, copyableScrolls, copyScroll } from '../../engine/crafting';
import { activeParty } from '../../engine/state';
import { skillBonus } from '../../engine/character';
import { SKILL_NAMES } from '../../rules/abilities';
import { itemTip } from './inventory';
import { rollCard } from './rollCard';
import { signed } from '../../core/util';
import { sfx } from '../../audio/audio';

/** Crafting (and, for wizards, copying scrolls into the spellbook). Each attempt takes an hour. */
export function openCrafting(app: App, onClose?: () => void): void {
  const s = app.state!;
  const root = h('div', { class: 'crafting' });
  let last: HTMLElement | null = null;
  const render = () => {
    clear(root);
    root.append(h('p', { class: 'muted small' }, 'Materials come from defeated creatures and exploration. Each attempt takes an hour; a failed check wastes half the materials (all of them on a bad failure).'));
    if (last) root.append(last);
    const list = h('div', { class: 'recipe-list' });
    for (const r of RECIPES) {
      const missing = missingFor(s, r);
      const who = bestCrafter(s, r);
      const out = ITEM_BY_ID[r.output.itemId];
      list.append(h('div', { class: `recipe panel ${missing.length ? 'missing' : ''}` },
        h('div', { class: 'rc-head' }, h('b', { style: { color: RARITY_COLORS[out.rarity] }, 'data-tip': itemTip(out) }, r.name), r.output.qty > 1 ? ` ×${r.output.qty}` : ''),
        h('div', { class: 'small muted' }, r.desc),
        h('div', { class: 'small' }, 'Needs: ', r.materials.length ? r.materials.map(([id, n]) => `${ITEM_BY_ID[id]?.name} ×${n}`).join(', ') : 'nothing special', r.gold ? ` · ${r.gold} gold` : '', r.requiresClass ? ` · a ${r.requiresClass}` : ''),
        r.skill && who ? h('div', { class: 'small' }, `${SKILL_NAMES[r.skill]} DC ${r.dc} — best: ${who.name} (${signed(skillBonus(who, r.skill))})`) : null,
        missing.length ? h('div', { class: 'small bad' }, `Missing: ${missing.join(', ')}`) : null,
        h('button', { class: 'btn small', disabled: missing.length > 0, onclick: () => {
          const res = craft(s, r.id);
          sfx(res.success ? 'quest' : 'miss');
          toast(res.text, res.success ? 'good' : 'bad');
          last = res.roll ? rollCard(res.roll) : null;
          render();
        } }, 'Craft')));
    }
    root.append(list);
    for (const wiz of activeParty(s).filter((c) => c.classId === 'wizard')) {
      const scrolls = copyableScrolls(s, wiz);
      root.append(h('h4', null, `${wiz.name}’s spellbook — copy scrolls`),
        scrolls.length ? h('div', null, scrolls.map((sc) => h('div', { class: 'item-row' },
          h('span', { class: 'item-name' }, `${ACTION_BY_ID[sc.spellId].name} (level ${sc.level})`),
          h('span', { class: 'small muted' }, `Arcana DC ${10 + sc.level}, ${sc.cost} gold, 2 hours`),
          h('button', { class: 'btn small', disabled: s.gold < sc.cost, onclick: () => { const res = copyScroll(s, wiz, sc.itemId); toast(res.text, res.success ? 'good' : 'bad'); last = res.roll ? rollCard(res.roll) : null; render(); } }, 'Copy'))))
          : h('p', { class: 'muted small' }, 'No wizard spell scrolls to copy.'));
    }
  };
  render();
  modal('Crafting', root, { wide: true, onClose: () => { onClose?.(); app.explore?.refresh(); } });
}
