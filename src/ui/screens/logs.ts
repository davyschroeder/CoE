import type { App } from '../app';
import { h, modal } from '../dom';
import { logLine } from './explore';

export function openDiceLog(app: App): void {
  const s = app.state!;
  const rows = [...s.rolls].reverse().slice(0, 120).map((r) => h('div', { class: `dl ${r.success === undefined ? '' : r.success ? 'ok' : 'fail'}` },
    h('div', null, h('b', null, r.label), ` — ${r.who}`, r.dc !== undefined ? ` (DC ${r.dc})` : '', h('span', { class: 'dl-total' }, ` ${r.total}${r.success === undefined ? '' : r.success ? ' ✓' : ' ✗'}`)),
    h('div', { class: 'muted small' }, r.detail)));
  modal('Dice Log', h('div', { class: 'dicelog' }, rows.length ? rows : h('p', { class: 'muted' }, 'No rolls yet.')), { wide: true });
}

export function openLog(app: App): void {
  const s = app.state!;
  const box = h('div', { class: 'fulllog' }, s.log.map((e) => logLine(e)));
  modal('Chronicle', box, { wide: true });
  setTimeout(() => (box.scrollTop = box.scrollHeight), 0);
}
