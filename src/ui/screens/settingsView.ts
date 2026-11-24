import type { App } from '../app';
import { h, modal, clear, put } from '../dom';
import { settings, updateSettings, type Settings } from '../../core/settings';
import { applyVolumes } from '../../audio/audio';

export function openSettings(app: App): void {
  const root = h('div', { class: 'settings' });
  const render = () => {
    clear(root);
    const st = settings();
    const sel = <K extends keyof Settings>(label: string, key: K, opts: [Settings[K], string][], tip = '') =>
      h('div', { class: 'set-row', 'data-tip': tip }, h('span', null, label), h('select', { onchange: (e: Event) => { const v = (e.target as HTMLSelectElement).value; const o = opts.find(([x]) => String(x) === v)!; set(key, o[0]); } },
        opts.map(([v, l]) => h('option', { value: String(v), selected: st[key] === v }, l))));
    const chk = <K extends keyof Settings>(label: string, key: K, tip = '') =>
      h('label', { class: 'set-row check', 'data-tip': tip }, h('span', null, label), h('input', { type: 'checkbox', checked: !!st[key], onchange: (e: Event) => set(key, (e.target as HTMLInputElement).checked as any) }));
    const rng = <K extends keyof Settings>(label: string, key: K, min: number, max: number, step: number) =>
      h('div', { class: 'set-row' }, h('span', null, label), h('input', { type: 'range', min, max, step, value: st[key] as any, oninput: (e: Event) => set(key, +(e.target as HTMLInputElement).value as any) }));
    put(root, 
      h('h4', null, 'Gameplay'),
      sel('CPU turn speed', 'cpuSpeed', [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']]),
      chk('Manual dice rolling (click to roll)', 'manualDice', 'You trigger skill-check rolls yourself. The result is still random.'),
      chk('Show detailed dice calculations', 'showDiceDetails'),
      chk('Hide exact enemy health', 'hideEnemyHp'),
      chk('Automatically end empty turns', 'autoEndTurn'),
      sel('Companion chatter', 'companionChatter', [['low', 'Low'], ['normal', 'Normal'], ['high', 'High']], 'How often companions make unprompted remarks and banter.'),
      h('h4', null, 'Display'),
      sel('Dialogue text speed', 'textSpeed', [['instant', 'Instant'], ['fast', 'Fast'], ['normal', 'Normal']]),
      rng('Font size', 'fontScale', 0.85, 1.4, 0.05),
      h('div', { class: 'set-row' }, h('span', null, 'Language'), h('span', { class: 'muted' }, 'English')),
      h('h4', null, 'Audio'),
      rng('Music volume', 'musicVolume', 0, 1, 0.05),
      rng('Effects volume', 'sfxVolume', 0, 1, 0.05),
      app.state ? h('p', { class: 'muted small' }, `Difficulty: ${app.state.difficulty}${app.state.rules.permadeath ? ' · permadeath' : ''}${app.state.rules.limitedRest ? ' · limited rest' : ''} (chosen at character creation).`) : null,
      app.state ? h('div', { class: 'set-row' }, h('span', null, 'Difficulty'), h('select', { onchange: (e: Event) => { app.state!.difficulty = (e.target as HTMLSelectElement).value as any; } },
        ['storyteller', 'adventurer', 'veteran', 'tactician'].map((d) => h('option', { value: d, selected: app.state!.difficulty === d }, d)))) : null);
  };
  const set = (k: keyof Settings, v: any) => {
    updateSettings({ [k]: v } as any);
    document.documentElement.style.setProperty('--font-scale', String(settings().fontScale));
    applyVolumes();
    render();
  };
  render();
  modal('Settings', root);
}
