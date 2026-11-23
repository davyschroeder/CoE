import type { App } from '../app';
import { h, modal } from '../dom';
import { COMPANION_BY_ID } from '../../data/companions';
import { activeCompanionIds } from '../../engine/state';
import { relationshipSummary } from '../../engine/companionMind';
import { evalCond } from '../../engine/conditions';
import { ACT1_EPILOGUE } from '../../data/act1/epilogue';

/** End-of-prologue summary: consequences, companions, and the honest state of the build. */
export function showEpilogue(app: App, act = 'prologue'): void {
  if (act === 'act1') { showAct1Epilogue(app); return; }
  const s = app.state!;
  const f = s.flags;
  const lines: string[] = [];
  lines.push(`Townsfolk rescued from the fog: ${Number(f.rescued_count ?? 0)} of 3.`);
  if (f.brawl_outcome) lines.push(`The Grey Hawks: ${({ talked: 'talked down', performed: 'out-sung', bribed: 'paid off', intimidated: 'run out of town', fought: 'beaten in a brawl' } as any)[String(f.brawl_outcome)]}.${f.hawks_help ? ' They stood watch for Hollowmere when it mattered.' : ''}`);
  if (f.lira_fate) lines.push(`Lira: ${({ anchored: 'anchored into the world — real again', faded: 'allowed to fade, remembered by her brother', bottled: 'sealed in a vial you carry' } as any)[String(f.lira_fate)]}.`);
  if (f.maren_forgets) lines.push('Sister Maren no longer remembers her daughter Elsa. She does not know what she has lost.');
  if (f.corvin_fate) lines.push(`Corvin Thale: ${({ handed_over: 'in the custody of the town watch', freed: 'gone into the woods, owing you a debt', ally: 'an ally — and your contact with the Unbound', killed: 'dead in the undercroft' } as any)[String(f.corvin_fate)]}.`);
  lines.push(`Brother Halric: ${f.halric_named ? 'remembered his own name at the end' : 'destroyed without ever being named'}${f.halric_rest ? ', and was laid to rest with the old rites' : ''}.`);
  lines.push(`Seeker Ysolt Ravencourt: ${({ fought: 'defeated, and now your enemy', persuaded: 'persuaded to walk away — perhaps an ally', escaped: 'evaded — and now hunting you' } as any)[String(f.ysolt_outcome)] ?? 'unknown'}.`);
  const comps = activeCompanionIds(s).map((id) => h('li', null, h('b', null, COMPANION_BY_ID[id].name), ': ', relationshipSummary(s.companions[id])));
  modal('The Bell That Never Rang — Epilogue', (close) => h('div', { class: 'epilogue prose' },
    h('p', null, 'The fog has lifted. The bell is silent. In your pack, the Heart of Aether beats, slow and patient.'),
    h('h4', null, 'What you leave behind'),
    h('ul', null, lines.map((l) => h('li', null, l))),
    h('h4', null, 'Your companions'),
    h('ul', null, comps),
    h('div', { class: 'panel notice' },
      h('h4', null, 'End of the current build'),
      h('p', null, 'You have completed the Prologue. Act I — Whispers of the Veil (the Whispering Woods, the ruins of Valdros and Ashenford) is designed (see STORY_BIBLE.md) but not yet implemented. Your save keeps every choice above, ready to carry into Act I when it is built.'),
      h('p', null, 'You can keep exploring Hollowmere, talk to your companions at camp, and save your game.')),
    h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: () => { close(); app.autosave('epilogue'); } }, 'Continue exploring Hollowmere'),
      h('button', { class: 'btn ghost', onclick: () => { close(); app.showMenu(); } }, 'Main menu'))), { wide: true, closable: false });
  // After the epilogue the party is back in Hollowmere at dawn.
  if (s.location.mapId !== 'hollowmere') app.travel('hollowmere', 25, 14);
}

/** End of Act I: consequences so far, honest note about the build. Lines are driven by Act I flags. */
export function showAct1Epilogue(app: App): void {
  const s = app.state!;
  const f = s.flags;
  const lines = ACT1_EPILOGUE.filter((l) => { try { return evalCond(s, l.if); } catch { return false; } }).map((l) => l.text);
  modal('Whispers of the Veil — End of Act I', (close) => h('div', { class: 'epilogue prose' },
    h('p', null, 'Behind you, Valdros flickers between its lost lives. Ahead, the road to Solmara. Somewhere above it all, a man who never lies has learned your name.'),
    h('h4', null, 'What Act I has written'), h('ul', null, lines.map((l) => h('li', null, l))),
    h('h4', null, 'Your companions'), h('ul', null, activeCompanionIds(s).map((id) => h('li', null, h('b', null, COMPANION_BY_ID[id].name), ': ', relationshipSummary(s.companions[id])))),
    h('div', { class: 'panel notice' }, h('h4', null, 'End of the current build'),
      h('p', null, 'You have completed Act I. Act II — Kingdoms of Ash (Solmara, the Iron Mountains, the Ember Wastes, the Fortress of the Fallen King) is designed in STORY_BIBLE.md but not yet implemented. Your save keeps every choice.'),
      h('p', null, 'You can keep exploring Elyndra’s Act I regions, finish side quests and personal quests, and save your game.')),
    h('div', { class: 'row' },
      h('button', { class: 'btn', onclick: () => { close(); app.autosave('act I epilogue'); } }, 'Continue exploring'),
      h('button', { class: 'btn ghost', onclick: () => { close(); app.showMenu(); } }, 'Main menu'))), { wide: true, closable: false });
  void f;
}
