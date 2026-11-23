import type { Cond } from './schema';

export interface ShopDef {
  id: string;
  name: string;
  owner: string;
  stock: { itemId: string; qty: number; if?: Cond }[];
  /** Price multiplier when buying from the shop, and fraction paid when selling to it. */
  buyMult: number;
  sellMult: number;
  /** Flags that improve prices (each -10%). */
  discountFlags: string[];
  /** Faction whose reputation affects prices (default: hollowmere). */
  faction?: string;
}

export const SHOPS: ShopDef[] = [
  {
    id: 'garrick', name: 'Dunmore Smithy', owner: 'garrick', buyMult: 1, sellMult: 0.5, discountFlags: ['hale_trusts'],
    stock: [
      { itemId: 'longsword', qty: 2 }, { itemId: 'shortsword', qty: 2 }, { itemId: 'battleaxe', qty: 1 }, { itemId: 'warhammer', qty: 1 },
      { itemId: 'greatsword', qty: 1 }, { itemId: 'halberd', qty: 1 }, { itemId: 'spear', qty: 3 }, { itemId: 'handaxe', qty: 3 },
      { itemId: 'mace', qty: 2 }, { itemId: 'dagger', qty: 4 }, { itemId: 'light_crossbow', qty: 1 }, { itemId: 'longbow', qty: 1 },
      { itemId: 'shield', qty: 2 }, { itemId: 'studded_leather', qty: 1 }, { itemId: 'scale_mail', qty: 1 }, { itemId: 'breastplate', qty: 1 },
      { itemId: 'chain_mail', qty: 1 }, { itemId: 'splint_armor', qty: 1 }, { itemId: 'greyhawk_bow', qty: 1, if: 'hawks_help' },
    ],
  },
  {
    id: 'ysolde', name: 'Quill\'s Sundries', owner: 'ysolde', buyMult: 1.1, sellMult: 0.5, discountFlags: ['ysolde_discount'],
    stock: [
      { itemId: 'healing_potion', qty: 5 }, { itemId: 'antitoxin', qty: 2 }, { itemId: 'lantern_oil_flask', qty: 6 }, { itemId: 'rope', qty: 3 },
      { itemId: 'crowbar', qty: 2 }, { itemId: 'thieves_tools', qty: 1 }, { itemId: 'traveler_clothes', qty: 2 }, { itemId: 'fine_clothes', qty: 1 },
      { itemId: 'dark_cloak', qty: 1 }, { itemId: 'festival_mantle', qty: 1 }, { itemId: 'scroll_cure_wounds', qty: 1 }, { itemId: 'bedroll', qty: 2 },
    ],
  },
  {
    id: 'wenna', name: 'Wenna\'s Remedies', owner: 'wenna', buyMult: 1, sellMult: 0.6, discountFlags: ['wenna_paid'],
    stock: [
      { itemId: 'healing_potion', qty: 3 }, { itemId: 'greater_healing_potion', qty: 1, if: 'bell_rang' }, { itemId: 'antitoxin', qty: 2 },
      { itemId: 'elixir_courage', qty: 2 }, { itemId: 'aether_draught', qty: 2, if: 'resunlocked' }, { itemId: 'scroll_guiding_bolt', qty: 1 },
      { itemId: 'scroll_shatter', qty: 1, if: 'bell_rang' },
    ],
  },
];

import { ACT1 } from './act1/index';
SHOPS.push(...ACT1.shops);
export const SHOP_BY_ID: Record<string, ShopDef> = Object.fromEntries(SHOPS.map((s) => [s.id, s]));
