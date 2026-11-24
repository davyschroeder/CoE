import type { App } from '../app';
import { h, modal, clear, toast } from '../dom';
import { COMPANION_BY_ID } from '../../data/companions';
import { CLASS_BY_ID } from '../../data/classes';
import { DIALOGUE_BY_ID } from '../../data/dialogue/index';
import { companionChar } from '../../engine/state';
import { longRest } from '../../engine/rest';
import { relationshipSummary } from '../../engine/companionMind';
import { portraitSvg } from '../portraits';
import { openDialogue } from './dialogueView';
import { openCharacter } from './character';
import { openInventory } from './inventory';
import { openJournal } from './journal';
import { sfx } from '../../audio/audio';
import { getMap } from '../../engine/exploration';
import { chance } from '../../core/rng';
import { availablePersonalQuests, pendingConflicts } from '../../engine/companionQuests';
import { openCrafting } from './crafting';

/** Camp: private talks, party management, preparing spells, resting. */
export function openCamp(app: App): void {
  const s = app.state!;
  const root = h('div', { class: 'camp' });
  const render = () => {
    clear(root);
    const recruited = Object.values(s.companions).filter((c) => c.recruited && !c.left);
    const talkTree = (treeId: string) => {
      const tree = DIALOGUE_BY_ID[treeId];
      if (!tree) { toast(`Missing dialogue ${treeId}`, 'bad'); return; }
      handle.close();
      app.busy = true;
      openDialogue(app, tree, (sig) => { app.busy = false; app.handleSignals(sig).then(() => openCamp(app)); });
    };
    const personal = availablePersonalQuests(s);
    for (const cf of pendingConflicts(s)) {
      root.append(h('div', { class: 'panel conflict' },
        h('b', null, `${cf.between.map((id) => COMPANION_BY_ID[id].name.split(' ')[0]).join(' and ')} are arguing.`),
        h('span', { class: 'small muted' }, ' The rest of the party is pretending not to listen.'),
        h('button', { class: 'btn small', onclick: () => talkTree(cf.tree) }, 'Step in')));
    }
    root.append(
      h('p', { class: 'narration' }, s.location.mapId !== 'inn'
        ? 'A small fire, packs for pillows, someone on watch. Out here, away from towns and their listening walls, people say the things they would not say in the street.'
        : s.flags.bell_rang
        ? 'Candle-light, the smell of wet wool, the fog at the window. Your companions have gathered in your small room. Here, away from the town, people say the things they would not say in the street.'
        : 'Your rooms above the Lantern & Lamb. Music and laughter through the floorboards. A good place to talk.'),
      h('div', { class: 'camp-grid' }, recruited.map((cs) => {
        const d = COMPANION_BY_ID[cs.id];
        const ch = companionChar(s, cs.id);
        const active = !!ch && s.activeIds.includes(ch.id);
        const tree = DIALOGUE_BY_ID[`camp_${cs.id}`];
        return h('div', { class: 'panel camp-card' },
          h('div', { class: 'rel-head' }, h('span', { html: portraitSvg({ hue: d.hue, sigil: CLASS_BY_ID[d.classId].sigil, initials: d.name.split(' ').map((p) => p[0]).join(''), size: 56, companionId: d.id }) }),
            h('div', null, h('b', null, d.name), h('div', { class: 'muted small' }, `${d.title}${active ? ' · in party' : ' · resting at camp'}`))),
          h('div', { class: 'small' }, relationshipSummary(cs)),
          h('div', { class: 'row' },
            personal.find((q) => q.companionId === cs.id) ? h('button', { class: 'btn small personal', 'data-tip': 'Starts this companion’s personal quest', onclick: () => talkTree(personal.find((q) => q.companionId === cs.id)!.startTree) }, '✦ A personal matter…') : null,
            tree ? h('button', { class: 'btn small', onclick: () => {
              handle.close();
              app.busy = true;
              openDialogue(app, tree, (sig) => { app.busy = false; app.handleSignals(sig).then(() => openCamp(app)); });
            } }, 'Talk') : null,
            ch ? h('button', { class: 'btn small ghost', onclick: () => {
              if (active) { s.activeIds = s.activeIds.filter((x) => x !== ch.id); cs.inParty = false; }
              else if (s.activeIds.length >= 4) { toast('Only three companions can travel with you. Ask someone to stay behind first.', 'bad'); return; }
              else { s.activeIds.push(ch.id); cs.inParty = true; }
              render();
            } }, active ? 'Leave at camp' : 'Join party') : null));
      })),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => { handle.close(); openCharacter(app, undefined, { canPrepare: true }); } }, 'Prepare spells & level up'),
        h('button', { class: 'btn', onclick: () => { handle.close(); openInventory(app); } }, 'Equipment'),
        h('button', { class: 'btn', onclick: () => { handle.close(); openJournal(app); } }, 'Review quests'),
        h('button', { class: 'btn', onclick: () => { handle.close(); openCrafting(app, () => openCamp(app)); } }, 'Crafting'),
        s.flags.bell_rang ? h('button', { class: 'btn', onclick: () => {
          const m = getMap(s.location.mapId);
          const re = m.randomEncounters;
          if (m.campDanger && re && chance(m.campDanger)) { handle.close(); toast('Something finds your camp in the night!', 'bad', 4000); app.startCombat(re.encounters[Math.floor(Math.random() * re.encounters.length)], 'enemy'); return; }
          const msg = longRest(s); sfx('heal'); toast(msg, 'good', 5000); render();
        } }, 'Long rest (8 hours)') : h('button', { class: 'btn ghost', disabled: true, 'data-tip': 'Too loud to sleep before the midnight vigil.' }, 'Long rest (not now)')));
  };
  const handle = modal('Camp', root, { wide: true, onClose: () => app.explore?.refresh() });
  render();
}
