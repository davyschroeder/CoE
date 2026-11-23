import { createCharacter } from '../src/engine/character';
import { newGame } from '../src/engine/state';
import type { GameState } from '../src/engine/types';

export function makePlayer(classId = 'fighter', overrides: Partial<Parameters<typeof createCharacter>[0]> = {}) {
  return createCharacter({
    id: 'player', name: 'Tester', kind: 'player', ancestry: 'human', classId, background: 'soldier',
    baseAbilities: { str: 15, dex: 14, con: 14, int: 10, wis: 12, cha: 10 }, skills: classId === 'rogue' ? ['perception', 'investigation', 'sleightOfHand', 'acrobatics'] : ['perception', 'insight'],
    expertise: classId === 'rogue' ? ['perception', 'sleightOfHand'] : [], fightingStyle: classId === 'fighter' ? 'style_defense' : undefined,
    ...overrides,
  });
}

export function makeGame(companions = ['brakka', 'ilyra', 'vaelis'], classId = 'fighter'): GameState {
  return newGame({ player: makePlayer(classId), companionIds: companions, difficulty: 'adventurer', rules: { permadeath: false, limitedRest: false } });
}
