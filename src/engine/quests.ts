import { QUEST_BY_ID } from '../data/quests';
import type { GameState } from './types';
import { addLog, awardXp } from './state';

/** Start a quest. Returns a notification string, or null if already started. */
export function startQuest(s: GameState, id: string, stage: string): string | null {
  const def = QUEST_BY_ID[id];
  if (!def) throw new Error(`Unknown quest ${id}`);
  if (!def.stages[stage]) throw new Error(`Unknown stage ${stage} for quest ${id}`);
  if (s.quests[id]) return setStage(s, id, stage);
  s.quests[id] = { status: 'active', stage, stagesDone: [], clues: [], startedAt: s.time.day };
  addLog(s, 'system', `New quest: ${def.title}`);
  return `New quest: ${def.title}${milestone(s, def.stages[stage].xp)}`;
}

/** Advance a quest. Stages can only move forward (no regressions) and completed quests are frozen. */
export function setStage(s: GameState, id: string, stage: string): string | null {
  const def = QUEST_BY_ID[id];
  const q = s.quests[id];
  if (!def || !def.stages[stage]) throw new Error(`Unknown stage ${stage} for quest ${id}`);
  if (!q) return startQuest(s, id, stage);
  if (q.status !== 'active' || q.stage === stage) return null;
  const order = Object.keys(def.stages);
  if (order.indexOf(stage) < order.indexOf(q.stage)) return null; // prevent regressions
  if (!q.stagesDone.includes(q.stage)) q.stagesDone.push(q.stage);
  q.stage = stage;
  addLog(s, 'system', `Quest updated: ${def.title}`);
  return `Quest updated: ${def.title}${milestone(s, def.stages[stage].xp)}`;
}

/** Milestone XP for reaching a stage (stages only move forward, so it is granted once). */
function milestone(s: GameState, xp: number | undefined): string {
  if (!xp) return '';
  awardXp(s, xp);
  addLog(s, 'system', `Milestone: +${xp} XP`);
  return ` (+${xp} XP)`;
}

export function addClue(s: GameState, id: string, clue: string): void {
  const def = QUEST_BY_ID[id];
  if (!def?.clues?.[clue]) throw new Error(`Unknown clue ${clue} for ${id}`);
  const q = s.quests[id];
  if (!q) return;
  if (!q.clues.includes(clue)) {
    q.clues.push(clue);
    addLog(s, 'system', `Journal: ${def.clues[clue]}`);
  }
}

/** Complete a quest once; rewards cannot be granted twice. */
export function completeQuest(s: GameState, id: string, outcome?: string): string | null {
  const def = QUEST_BY_ID[id];
  if (!def) throw new Error(`Unknown quest ${id}`);
  let q = s.quests[id];
  if (!q) { startQuest(s, id, Object.keys(def.stages)[0]); q = s.quests[id]; }
  if (q.status !== 'active') return null;
  if (!q.stagesDone.includes(q.stage)) q.stagesDone.push(q.stage);
  q.status = 'completed';
  q.outcome = outcome;
  if (def.xp) awardXp(s, def.xp);
  addLog(s, 'system', `Quest completed: ${def.title}${def.xp ? ` (+${def.xp} XP)` : ''}`);
  return `Quest completed: ${def.title}`;
}

export function failQuest(s: GameState, id: string, outcome?: string): string | null {
  const q = s.quests[id];
  if (!q || q.status !== 'active') return null;
  q.status = 'failed';
  q.outcome = outcome;
  return `Quest failed: ${QUEST_BY_ID[id].title}`;
}
