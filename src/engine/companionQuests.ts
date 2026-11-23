import { COMPANION_QUESTS, CONFLICTS, type CompanionQuestEntry, type ConflictEntry } from '../data/companionQuests';
import type { GameState } from './types';
import { activeCompanionIds } from './state';
import { evalCond } from './conditions';

function safe(s: GameState, c: string): boolean { try { return evalCond(s, c); } catch { return false; } }

/** Personal quests a companion in the active party is ready to raise at camp. */
export function availablePersonalQuests(s: GameState): CompanionQuestEntry[] {
  const active = activeCompanionIds(s);
  return COMPANION_QUESTS.filter((q) => active.includes(q.companionId) && !s.quests[q.questId] && safe(s, q.availableIf));
}

/** Unresolved conflicts between two companions who are both in the active party. */
export function pendingConflicts(s: GameState): ConflictEntry[] {
  const active = activeCompanionIds(s);
  return CONFLICTS.filter((c) => c.between.every((id) => active.includes(id)) && !s.flags[`conflict_${c.id}_resolved`] && safe(s, c.if));
}
