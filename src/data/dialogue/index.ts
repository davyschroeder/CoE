import type { DialogueTree } from '../schema';
import { MAIN_DIALOGUES } from './prologueMain';
import { SIDE_DIALOGUES } from './prologueSide';
import { CAMP_DIALOGUES } from './camp';

import { CQ_DIALOGUES } from '../companionQuests';
import { ACT1 } from '../act1/index';

export const ALL_DIALOGUES: DialogueTree[] = [...MAIN_DIALOGUES, ...SIDE_DIALOGUES, ...CAMP_DIALOGUES, ...CQ_DIALOGUES, ...ACT1.dialogues];
export const DIALOGUE_BY_ID: Record<string, DialogueTree> = Object.fromEntries(ALL_DIALOGUES.map((d) => [d.id, d]));
