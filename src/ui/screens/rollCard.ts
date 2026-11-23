import type { CheckResult } from '../../rules/checks';
import { h } from '../dom';
import { signed } from '../../core/util';
import { settings } from '../../core/settings';

/** The tabletop-style roll breakdown: "Persuasion Check — DC 15 · d20 13 · CHA +3 · Prof +2 · Total 18 · Success". */
export function rollCard(r: CheckResult): HTMLElement {
  const detailed = settings().showDiceDetails;
  const faces = r.rolls.map((v) => h('span', { class: `die ${v === r.natural ? 'kept' : 'dropped'} ${v === 20 ? 'n20' : v === 1 ? 'n1' : ''}` }, String(v)));
  return h('div', { class: `roll-card ${r.success === undefined ? '' : r.success ? 'ok' : 'fail'}` },
    h('div', { class: 'rc-title' }, `${r.label}${r.dc !== undefined ? ` — DC ${r.dc}` : ''}`, h('span', { class: 'rc-who' }, ` (${r.who})`)),
    h('div', { class: 'rc-dice' }, h('span', { class: 'muted' }, r.mode !== 'normal' ? `${r.mode}: ` : 'd20: '), ...faces),
    detailed ? h('div', { class: 'rc-parts' }, r.parts.map((p) => h('div', null, `${p.label}: ${signed(p.value)}`))) : null,
    h('div', { class: 'rc-total' }, `Total: ${r.total}`, r.success !== undefined ? h('b', null, r.success ? '  Success' : '  Failure') : null,
      r.nat20 ? h('span', { class: 'n20' }, ' Natural 20!') : r.nat1 ? h('span', { class: 'n1' }, ' Natural 1…') : null));
}
