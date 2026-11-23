import { SHOP_BY_ID, type ShopDef } from '../data/shops';
import { ITEM_BY_ID } from '../data/items';
import type { GameState } from './types';
import { addItem, removeItem, addLog } from './state';
import { evalCond } from './conditions';

function stockKey(shop: string, item: string) { return `_sold_${shop}_${item}`; }

export function shopStock(s: GameState, shop: ShopDef): { itemId: string; qty: number; price: number }[] {
  return shop.stock
    .filter((e) => { try { return evalCond(s, e.if); } catch { return false; } })
    .map((e) => ({ itemId: e.itemId, qty: Math.max(0, e.qty - Number(s.flags[stockKey(shop.id, e.itemId)] ?? 0)), price: buyPrice(s, shop, e.itemId) }))
    .filter((e) => e.qty > 0);
}

export function priceMult(s: GameState, shop: ShopDef): number {
  let m = shop.buyMult;
  for (const f of shop.discountFlags) if (s.flags[f]) m -= 0.1;
  const rep = s.factions.hollowmere ?? 0;
  m -= Math.min(0.15, Math.max(-0.15, rep / 200));
  return Math.max(0.5, m);
}

export function buyPrice(s: GameState, shop: ShopDef, itemId: string): number {
  return Math.max(1, Math.round(ITEM_BY_ID[itemId].value * priceMult(s, shop)));
}

export function sellPrice(_s: GameState, shop: ShopDef, itemId: string): number {
  const def = ITEM_BY_ID[itemId];
  if (def.quest) return 0;
  return Math.max(0, Math.floor(def.value * shop.sellMult));
}

export function buy(s: GameState, shopId: string, itemId: string): string | null {
  const shop = SHOP_BY_ID[shopId];
  const entry = shopStock(s, shop).find((e) => e.itemId === itemId);
  if (!entry) return 'Out of stock.';
  if (s.gold < entry.price) return 'Not enough gold.';
  s.gold -= entry.price;
  s.flags[stockKey(shopId, itemId)] = Number(s.flags[stockKey(shopId, itemId)] ?? 0) + 1;
  addItem(s, itemId, 1);
  addLog(s, 'system', `Bought ${ITEM_BY_ID[itemId].name} for ${entry.price} gold.`);
  return null;
}

export function sell(s: GameState, shopId: string, itemId: string): string | null {
  const shop = SHOP_BY_ID[shopId];
  const def = ITEM_BY_ID[itemId];
  if (def.quest) return 'You can\'t sell that.';
  if (!s.inventory.some((i) => i.itemId === itemId)) return 'You don\'t have that in your pack.';
  removeItem(s, itemId, 1);
  const p = sellPrice(s, shop, itemId);
  s.gold += p;
  addLog(s, 'system', `Sold ${def.name} for ${p} gold.`);
  return null;
}
