export interface Settings {
  cpuSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  manualDice: boolean;
  showDiceDetails: boolean;
  hideEnemyHp: boolean;
  autoEndTurn: boolean;
  textSpeed: 'instant' | 'fast' | 'normal';
  fontScale: number;
  musicVolume: number;
  sfxVolume: number;
  /** Recorded narration volume; 0 turns narration off. */
  voiceVolume: number;
  companionChatter: 'low' | 'normal' | 'high';
  language: 'en';
}

const KEY = 'coe.settings';
export const DEFAULT_SETTINGS: Settings = {
  cpuSpeed: 'normal', manualDice: false, showDiceDetails: true, hideEnemyHp: false, autoEndTurn: true,
  textSpeed: 'fast', fontScale: 1, musicVolume: 0.35, sfxVolume: 0.6, voiceVolume: 0.9, companionChatter: 'normal', language: 'en',
};

let current: Settings = { ...DEFAULT_SETTINGS };

export function loadSettings(): Settings {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) current = { ...DEFAULT_SETTINGS, ...JSON.parse(raw), language: 'en' };
  } catch { /* defaults */ }
  return current;
}

export function settings(): Settings { return current; }

export function updateSettings(patch: Partial<Settings>): Settings {
  current = { ...current, ...patch, language: 'en' };
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  return current;
}

export function cpuDelay(): number {
  return { slow: 900, normal: 500, fast: 200, instant: 0 }[current.cpuSpeed];
}
