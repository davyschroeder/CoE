import type { App } from '../app';
import { h, modal, clear, toast, ask } from '../dom';
import { listSaves, saveGame, deleteSave, SLOTS, exportSave, deserialize } from '../../engine/save';

export function openSaveLoad(app: App, mode: 'save' | 'load'): void {
  const root = h('div', { class: 'saveload' });
  const render = () => {
    clear(root);
    const saves = listSaves();
    const bySlot = new Map(saves.map((m) => [m.slot, m]));
    const slots = mode === 'save' ? SLOTS.filter((s) => s !== 'auto') : SLOTS;
    for (const slot of slots) {
      const m = bySlot.get(slot) as any;
      root.append(h('div', { class: `save-row ${m?.corrupt ? 'corrupt' : ''}` },
        h('div', { class: 'save-info' },
          h('b', null, slot === 'auto' ? 'Autosave' : slot === 'quick' ? 'Quicksave' : `Slot ${slot.replace('slot', '')}`),
          m ? h('div', { class: 'small' }, m.corrupt ? 'Damaged save' : `${m.playerName}, level ${m.level} — ${m.location} (${m.chapter}) · ${new Date(m.savedAt).toLocaleString()} · ${Math.floor(m.playtimeSec / 60)} min played`) : h('div', { class: 'small muted' }, 'Empty')),
        mode === 'save'
          ? h('button', { class: 'btn small', disabled: !app.state || app.busy, onclick: async () => {
              if (m && !(await ask('Overwrite save', 'Overwrite this save?', 'Overwrite'))) return;
              try { saveGame(app.state!, slot); toast('Game saved.', 'good'); render(); } catch (e: any) { toast(`Save failed: ${e.message}`, 'bad'); }
            } }, 'Save here')
          : h('button', { class: 'btn small', disabled: !m, onclick: async () => {
              if (app.state && !(await ask('Load save', 'Load this save? Unsaved progress will be lost.', 'Load'))) return;
              handle.close(); app.load(slot);
            } }, 'Load'),
        m ? h('button', { class: 'btn small ghost', onclick: async () => { if (await ask('Delete save', 'Delete this save? This cannot be undone.', 'Delete')) { deleteSave(slot); render(); } } }, 'Delete') : null));
    }
    root.append(h('div', { class: 'row' },
      app.state ? h('button', { class: 'btn small ghost', onclick: () => {
        const blob = new Blob([exportSave(app.state!)], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `aether-${app.state!.party[0].name}.json` });
        a.click();
      } }, 'Export save to file') : null,
      mode === 'load' ? h('label', { class: 'btn small ghost' }, 'Import save file', h('input', { type: 'file', accept: '.json', style: { display: 'none' }, onchange: async (e: Event) => {
        const f = (e.target as HTMLInputElement).files?.[0];
        if (!f) return;
        try { const st = deserialize(await f.text()); handle.close(); app.begin(st, false); toast('Imported save loaded.', 'good'); }
        catch (err: any) { toast(`Import failed: ${err.message}`, 'bad', 5000); }
      } })) : null));
  };
  const handle = modal(mode === 'save' ? 'Save Game' : 'Load Game', root, { wide: true });
  render();
}
