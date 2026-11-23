import type { ContentModule, TravelEvent } from './module';
import { WOODS } from './woods';
import { ASHENFORD } from './ashenford';
import { VALDROS } from './valdros';
import { HOLLOWMERE_A1 } from './hollowmere';

export const ACT1_MODULES: ContentModule[] = [WOODS, ASHENFORD, VALDROS, HOLLOWMERE_A1];

export const ACT1 = {
  quests: ACT1_MODULES.flatMap((m) => m.quests ?? []),
  dialogues: ACT1_MODULES.flatMap((m) => m.dialogues ?? []),
  objects: ACT1_MODULES.flatMap((m) => m.objects ?? []),
  encounters: ACT1_MODULES.flatMap((m) => m.encounters ?? []),
  items: ACT1_MODULES.flatMap((m) => m.items ?? []),
  npcs: ACT1_MODULES.flatMap((m) => m.npcs ?? []),
  shops: ACT1_MODULES.flatMap((m) => m.shops ?? []),
  travel: ACT1_MODULES.flatMap((m) => m.travel ?? []) as TravelEvent[],
  enemies: ACT1_MODULES.flatMap((m) => m.enemies ?? []),
  enter: Object.assign({}, ...ACT1_MODULES.map((m) => m.enter ?? {})) as NonNullable<ContentModule['enter']>,
};
