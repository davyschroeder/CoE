import type { App } from '../app';
import { h, modal, toast, clear } from '../dom';
import { ITEM_BY_ID, RARITY_COLORS, slotForItem, type ItemDef } from '../../data/items';
import { activeParty, addItem, removeItem, carriedWeight, carryCapacity, resonanceMax } from '../../engine/state';
import { armorClass, mainWeapon, weaponAttackBonus, weaponDamageBonus, weaponDice, recalcHp, abilityScore } from '../../engine/character';
import { CLASS_BY_ID } from '../../data/classes';
import type { Character, EquipSlot } from '../../engine/types';
import { EQUIP_SLOTS } from '../../engine/types';
import { rollDice } from '../../core/dice';
import { heal } from '../../engine/damage';
import { sfx } from '../../audio/audio';
import { charPortrait } from '../portraits';
import { signed } from '../../core/util';

const SLOT_NAMES: Record<EquipSlot, string> = { mainHand: 'Main hand', offHand: 'Off hand', body: 'Body', cloak: 'Cloak', amulet: 'Amulet', ring1: 'Ring', ring2: 'Ring' };

export function itemTip(def: ItemDef): string {
  const bits = [def.name, `${def.rarity} ${def.type}`, def.desc];
  if (def.weapon) bits.push(`Damage ${def.weapon.dice} ${def.weapon.type}; ${def.weapon.props.join(', ') || 'no properties'}${def.weapon.range ? `; range ${def.weapon.range}` : ''}`);
  if (def.armor) bits.push(`AC ${def.armor.base}${def.armor.kind === 'heavy' ? '' : ` + Dex${def.armor.dexCap !== undefined ? ` (max ${def.armor.dexCap})` : ''}`}; ${def.armor.kind}${def.armor.strReq ? `; needs STR ${def.armor.strReq}` : ''}`);
  if (def.shield) bits.push(`+${def.shield.bonus} AC`);
  if (def.cursed) bits.push(`Cursed: ${def.cursed}`);
  bits.push(`Weight ${def.weight} · Value ${def.value} gp`);
  return bits.join('\n');
}

export function canEquip(c: Character, def: ItemDef): string | null {
  const cls = CLASS_BY_ID[c.classId];
  if (def.armor && !cls.armor.includes(def.armor.kind) && !(c.subclassId === 'valor' && def.armor.kind === 'medium')) return `${c.name} is not trained in ${def.armor.kind} armour.`;
  if (def.shield && !cls.armor.includes('shield') && c.subclassId !== 'valor') return `${c.name} is not trained with shields.`;
  if (def.shield && mainWeapon(c).weapon?.props.includes('twoHanded')) return 'Cannot use a shield with a two-handed weapon.';
  return null;
}

export function equip(app: App, c: Character, itemId: string): void {
  const s = app.state!;
  const def = ITEM_BY_ID[itemId];
  const slots = slotForItem(def);
  if (!slots.length) return;
  const err = canEquip(c, def);
  if (err) { toast(err, 'bad'); return; }
  const slot = slots.find((sl) => !c.equipment[sl]) ?? slots[0];
  const prev = c.equipment[slot];
  if (removeItem(s, itemId, 1) === 0) return;
  if (prev) addItem(s, prev, 1);
  c.equipment[slot] = itemId;
  if (def.weapon?.props.includes('twoHanded') && c.equipment.offHand) { addItem(s, c.equipment.offHand, 1); delete c.equipment.offHand; }
  recalcHp(c);
  sfx('click');
}

export function unequip(app: App, c: Character, slot: EquipSlot): void {
  const id = c.equipment[slot];
  if (!id) return;
  addItem(app.state!, id, 1);
  delete c.equipment[slot];
  recalcHp(c);
}

export function openInventory(app: App, charId?: string): void {
  const s = app.state!;
  let sel = activeParty(s).find((c) => c.id === charId) ?? activeParty(s)[0];
  const root = h('div', { class: 'inventory' });
  const render = () => {
    clear(root);
    const tabs = h('div', { class: 'tabs' }, activeParty(s).map((c) => h('button', { class: `tab ${c === sel ? 'on' : ''}`, onclick: () => { sel = c; render(); } }, h('span', { class: 'tab-p', html: charPortrait(c, 24) }), c.name.split(' ')[0])));
    const w = mainWeapon(sel);
    const eq = h('div', { class: 'equip panel' }, h('h3', null, `${sel.name} — equipment`),
      h('div', { class: 'muted' }, `AC ${armorClass(sel)} · ${w.name}: ${signed(weaponAttackBonus(sel, w))} to hit, ${weaponDice(sel, w)}${signed(weaponDamageBonus(sel, w))} ${w.weapon?.type ?? ''}`),
      EQUIP_SLOTS.map((slot) => {
        const id = sel.equipment[slot];
        const def = id ? ITEM_BY_ID[id] : null;
        return h('div', { class: 'slot-row' }, h('span', { class: 'slot-name' }, SLOT_NAMES[slot]),
          def ? h('span', { class: 'item-name', style: { color: RARITY_COLORS[def.rarity] }, 'data-tip': itemTip(def) }, def.name) : h('span', { class: 'muted' }, '—'),
          def ? h('button', { class: 'btn small ghost', onclick: () => { unequip(app, sel, slot); render(); } }, 'Remove') : null);
      }));
    const pack = h('div', { class: 'pack panel' }, h('h3', null, 'Party pack'),
      h('div', { class: 'muted' }, `Gold ${s.gold} · Weight ${carriedWeight(s)} / ${carryCapacity(s)} lb${carriedWeight(s) > carryCapacity(s) ? ' (encumbered!)' : ''}`),
      s.inventory.length ? null : h('p', { class: 'muted' }, 'Empty.'),
      s.inventory.map((st) => {
        const def = ITEM_BY_ID[st.itemId];
        if (!def) return null;
        const equippable = slotForItem(def).length > 0;
        const compare = equippable ? compareText(sel, def) : '';
        return h('div', { class: 'item-row' },
          h('span', { class: 'item-name', style: { color: RARITY_COLORS[def.rarity] }, 'data-tip': itemTip(def) + (compare ? `\n\n${compare}` : '') }, def.name, st.qty > 1 ? ` ×${st.qty}` : ''),
          h('span', { class: 'muted small' }, def.type),
          equippable ? h('button', { class: 'btn small', onclick: () => { equip(app, sel, st.itemId); render(); } }, 'Equip') : null,
          def.use ? h('button', { class: 'btn small', onclick: () => { useOutOfCombat(app, sel, st.itemId); render(); } }, 'Use') : null,
          compare ? h('span', { class: 'cmp small' }, compare) : null);
      }));
    root.append(tabs, h('div', { class: 'inv-grid' }, eq, pack));
  };
  render();
  modal('Inventory', root, { wide: true, onClose: () => app.explore?.refresh() });
}

function compareText(c: Character, def: ItemDef): string {
  if (def.armor) {
    const clone: Character = JSON.parse(JSON.stringify(c));
    clone.equipment.body = def.id;
    const d = armorClass(clone) - armorClass(c);
    return d ? `AC ${d > 0 ? '+' : ''}${d} vs current` : 'Same AC';
  }
  if (def.weapon) {
    const cur = mainWeapon(c);
    return `vs ${cur.name}: ${def.weapon.dice} vs ${cur.weapon?.dice}`;
  }
  return '';
}

export function useOutOfCombat(app: App, c: Character, itemId: string): void {
  const s = app.state!;
  const def = ITEM_BY_ID[itemId];
  const u = def.use;
  if (!u) return;
  if (u.kind === 'heal') {
    if (c.hp >= c.maxHp) { toast(`${c.name} is already at full health.`, 'info'); return; }
    removeItem(s, itemId, 1);
    const amt = heal(c, rollDice(u.dice).total);
    sfx('heal'); toast(`${c.name} recovers ${amt} HP.`, 'good');
  } else if (u.kind === 'resonance') {
    if (!s.resonance.unlocked) { toast('It tastes of static. Nothing happens — you have no resonance to restore.', 'info'); return; }
    if (s.resonance.current >= resonanceMax(s)) { toast('Your resonance is already full.', 'info'); return; }
    removeItem(s, itemId, 1);
    s.resonance.current = Math.min(resonanceMax(s), s.resonance.current + u.amount);
    sfx('spell'); toast('Resonance restored.', 'good');
  } else if (u.kind === 'cure') {
    removeItem(s, itemId, 1);
    c.conditions = c.conditions.filter((k) => !u.conditions.includes(k.id));
    toast(`${c.name} feels better.`, 'good');
  } else {
    toast('This item is meant to be used in combat.', 'info');
  }
  void abilityScore;
}
