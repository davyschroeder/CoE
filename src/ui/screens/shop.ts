import type { App } from '../app';
import { h, modal, clear, toast } from '../dom';
import { SHOP_BY_ID } from '../../data/shops';
import { ITEM_BY_ID, RARITY_COLORS } from '../../data/items';
import { buy, sell, shopStock, sellPrice, refusesTrade } from '../../engine/shop';
import { itemTip } from './inventory';
import { sfx } from '../../audio/audio';

export function openShop(app: App, shopId: string): void {
  const s = app.state!;
  const shop = SHOP_BY_ID[shopId];
  if (!shop) { toast('This merchant has nothing to sell.', 'bad'); return; }
  if (refusesTrade(s, shop)) { toast(`${shop.name} refuses to deal with you.`, 'bad'); return; }
  const root = h('div', { class: 'shop' });
  const render = () => {
    clear(root);
    root.append(h('div', { class: 'muted' }, `Your gold: ${s.gold}`),
      h('div', { class: 'inv-grid' },
        h('div', { class: 'panel' }, h('h3', null, 'For sale'), shopStock(s, shop).map((e) => {
          const d = ITEM_BY_ID[e.itemId];
          return h('div', { class: 'item-row' }, h('span', { class: 'item-name', style: { color: RARITY_COLORS[d.rarity] }, 'data-tip': itemTip(d) }, d.name, e.qty > 1 ? ` (${e.qty})` : ''),
            h('span', { class: 'price' }, `${e.price} gp`),
            h('button', { class: 'btn small', disabled: s.gold < e.price, onclick: () => { const err = buy(s, shopId, e.itemId); if (err) toast(err, 'bad'); else sfx('coin'); render(); } }, 'Buy'));
        })),
        h('div', { class: 'panel' }, h('h3', null, 'Sell'), s.inventory.filter((i) => !ITEM_BY_ID[i.itemId]?.quest).map((i) => {
          const d = ITEM_BY_ID[i.itemId];
          return h('div', { class: 'item-row' }, h('span', { class: 'item-name', 'data-tip': itemTip(d) }, d.name, i.qty > 1 ? ` ×${i.qty}` : ''),
            h('span', { class: 'price' }, `${sellPrice(s, shop, i.itemId)} gp`),
            h('button', { class: 'btn small ghost', onclick: () => { const err = sell(s, shopId, i.itemId); if (err) toast(err, 'bad'); else sfx('coin'); render(); } }, 'Sell'));
        }))));
  };
  render();
  modal(shop.name, root, { wide: true, onClose: () => app.explore?.refresh() });
}
