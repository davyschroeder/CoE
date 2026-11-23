import { RECIPES, RECIPE_BY_ID, type RecipeDef } from '../data/recipes';
import { ITEM_BY_ID } from '../data/items';
import { ACTION_BY_ID } from '../data/actions';
import type { Character, GameState } from './types';
import { activeParty, addItem, addLog, advanceTime, countItem, recordRoll, removeItem } from './state';
import { skillBonus } from './character';
import { skillCheck, type CheckResult } from '../rules/checks';

/** Materials held in the shared pack (equipped items do not count). */
function packCount(s: GameState, itemId: string): number {
  return s.inventory.filter((i) => i.itemId === itemId).reduce((a, i) => a + i.qty, 0);
}

export function missingFor(s: GameState, r: RecipeDef): string[] {
  const out: string[] = [];
  for (const [id, n] of r.materials) { const have = packCount(s, id); if (have < n) out.push(`${ITEM_BY_ID[id]?.name ?? id} (${have}/${n})`); }
  if (r.gold && s.gold < r.gold) out.push(`${r.gold} gold`);
  if (r.requiresClass && !activeParty(s).some((c) => c.classId === r.requiresClass)) out.push(`a ${r.requiresClass} in the party`);
  return out;
}

export function bestCrafter(s: GameState, r: RecipeDef): Character {
  const party = activeParty(s).filter((c) => c.hp > 0 && (!r.requiresClass || c.classId === r.requiresClass));
  if (!r.skill) return party[0] ?? activeParty(s)[0];
  return [...party].sort((a, b) => skillBonus(b, r.skill!) - skillBonus(a, r.skill!))[0];
}

export interface CraftResult { success: boolean; text: string; roll?: CheckResult; }

/** Attempt a recipe. Takes an hour. A failed check loses half the materials (all of them on a failure by 5+). */
export function craft(s: GameState, recipeId: string, crafter?: Character): CraftResult {
  const r = RECIPE_BY_ID[recipeId];
  if (!r) throw new Error(`Unknown recipe ${recipeId}`);
  const missing = missingFor(s, r);
  if (missing.length) return { success: false, text: `Missing: ${missing.join(', ')}.` };
  const who = crafter ?? bestCrafter(s, r);
  advanceTime(s, 60);
  if (r.gold) s.gold -= r.gold;
  let roll: CheckResult | undefined;
  if (r.skill) {
    roll = skillCheck(who, r.skill, r.dc);
    recordRoll(s, roll);
    if (!roll.success) {
      const badly = roll.total <= (r.dc ?? 10) - 5;
      for (const [id, n] of r.materials) removeItem(s, id, badly ? n : Math.floor(n / 2));
      const text = `${who.name} ruins the attempt (${roll.total} vs DC ${r.dc}). ${badly ? 'The materials are lost.' : 'Some materials are salvaged.'}`;
      addLog(s, 'system', text);
      return { success: false, text, roll };
    }
  }
  for (const [id, n] of r.materials) removeItem(s, id, n);
  addItem(s, r.output.itemId, r.output.qty);
  const text = `${who.name} crafts ${ITEM_BY_ID[r.output.itemId].name}${r.output.qty > 1 ? ` ×${r.output.qty}` : ''}.`;
  addLog(s, 'system', text);
  return { success: true, text, roll };
}

export function availableRecipes(): RecipeDef[] { return RECIPES; }

// ─────────────────────────────── Wizard scroll copying

export function copyableScrolls(s: GameState, wizard: Character): { itemId: string; spellId: string; level: number; cost: number }[] {
  if (wizard.classId !== 'wizard') return [];
  const out: { itemId: string; spellId: string; level: number; cost: number }[] = [];
  for (const st of s.inventory) {
    const def = ITEM_BY_ID[st.itemId];
    if (def?.type !== 'scroll' || def.use?.kind !== 'spell') continue;
    const sp = ACTION_BY_ID[def.use.spellId];
    if (!sp?.classes?.includes('wizard') || wizard.knownSpells.includes(sp.id)) continue;
    out.push({ itemId: st.itemId, spellId: sp.id, level: sp.level ?? 1, cost: 50 * (sp.level ?? 1) });
  }
  return out;
}

/** Copy a spell scroll into a wizard's spellbook: Arcana DC 10 + spell level, gold cost, scroll consumed either way. */
export function copyScroll(s: GameState, wizard: Character, itemId: string): CraftResult {
  const entry = copyableScrolls(s, wizard).find((e) => e.itemId === itemId);
  if (!entry) return { success: false, text: 'That scroll cannot be copied.' };
  if (s.gold < entry.cost) return { success: false, text: `Copying costs ${entry.cost} gold in inks.` };
  if (countItem(s, itemId) < 1) return { success: false, text: 'You no longer have that scroll.' };
  s.gold -= entry.cost;
  removeItem(s, itemId, 1);
  advanceTime(s, 120);
  const roll = skillCheck(wizard, 'arcana', 10 + entry.level);
  recordRoll(s, roll);
  if (!roll.success) return { success: false, roll, text: `${wizard.name} cannot decipher the formula (${roll.total} vs DC ${10 + entry.level}); the scroll crumbles.` };
  wizard.knownSpells.push(entry.spellId);
  const text = `${wizard.name} copies ${ACTION_BY_ID[entry.spellId].name} into the spellbook.`;
  addLog(s, 'system', text);
  return { success: true, roll, text };
}
