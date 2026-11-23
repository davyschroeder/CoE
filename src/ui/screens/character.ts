import type { App } from '../app';
import { h, modal, clear, toast } from '../dom';
import type { Character, Ability } from '../../engine/types';
import { ABILITIES } from '../../engine/types';
import { activeParty } from '../../engine/state';
import {
  abilityScore, mod, armorClass, speed, initiativeBonus, passivePerception, saveBonus, skillBonus, features, prof, xpToNext, canLevelUp,
  needsSubclass, isAsiLevel, needsFightingStyle, spellGains, applyLevelUp, autoLevelChoices, castableSpells, preparedLimit, spellSlotsMax,
  slotsAvailable, spellAttackBonus, spellSaveDC, maxSpellLevel, computeMaxHp, mainWeapon, weaponAttackBonus, weaponDamageBonus, weaponDice, type LevelChoices,
  secretsGain, expertiseGain, anyClassSpells,
} from '../../engine/character';
import { ABILITY_NAMES, ALL_SKILLS, SKILL_ABILITY, SKILL_NAMES } from '../../rules/abilities';
import { CLASS_BY_ID, FEATS, FIGHTING_STYLES } from '../../data/classes';
import { ANCESTRY_BY_ID } from '../../data/ancestries';
import { BACKGROUND_BY_ID } from '../../data/backgrounds';
import { ACTION_BY_ID, spellsForClass } from '../../data/actions';
import { COMPANION_BY_ID } from '../../data/companions';
import { charPortrait } from '../portraits';
import { signed } from '../../core/util';
import { sfx } from '../../audio/audio';

export function openCharacter(app: App, charId?: string, opts: { canPrepare?: boolean } = {}): void {
  const s = app.state!;
  let sel = activeParty(s).find((c) => c.id === charId) ?? activeParty(s)[0];
  const root = h('div', { class: 'charsheet' });
  const render = () => {
    clear(root);
    const c = sel;
    const cls = CLASS_BY_ID[c.classId];
    const sub = cls.subclasses.find((x) => x.id === c.subclassId);
    const w = mainWeapon(c);
    root.append(
      h('div', { class: 'tabs' }, activeParty(s).map((x) => h('button', { class: `tab ${x === sel ? 'on' : ''}`, onclick: () => { sel = x; render(); } }, h('span', { class: 'tab-p', html: charPortrait(x, 24) }), x.name.split(' ')[0], canLevelUp(x) ? ' ▲' : ''))),
      h('div', { class: 'cs-grid' },
        h('div', { class: 'cs-col panel' },
          h('div', { class: 'cs-head' }, h('div', { html: charPortrait(c, 72) }),
            h('div', null, h('h3', null, c.name), h('div', null, `${ANCESTRY_BY_ID[c.ancestry]?.name} ${cls.name} ${c.level}${sub ? ` (${sub.name})` : ''}`),
              h('div', { class: 'muted' }, BACKGROUND_BY_ID[c.background]?.name ?? ''),
              h('div', { class: 'muted small' }, `XP ${c.xp}${c.level < 20 ? ` · ${xpToNext(c)} to next level` : ''}`))),
          canLevelUp(c) ? h('button', { class: 'btn levelup', onclick: () => levelUpFlow(app, c, render) }, `▲ Level up to ${c.level + 1}`) : null,
          h('div', { class: 'stat-row' },
            stat('HP', `${c.hp}/${c.maxHp}`), stat('AC', String(armorClass(c))), stat('Speed', `${speed(c) * 5} ft`),
            stat('Init', signed(initiativeBonus(c))), stat('Prof', signed(prof(c))), stat('Passive Perc.', String(passivePerception(c)))),
          h('div', { class: 'abilities' }, ABILITIES.map((a) => h('div', { class: 'abil', 'data-tip': `${ABILITY_NAMES[a]} save ${signed(saveBonus(c, a))}${c.saveProfs.includes(a) ? ' (proficient)' : ''}` },
            h('div', { class: 'ab-name' }, a.toUpperCase()), h('div', { class: 'ab-score' }, String(abilityScore(c, a))), h('div', { class: 'ab-mod' }, signed(mod(c, a))),
            h('div', { class: `ab-save ${c.saveProfs.includes(a) ? 'prof' : ''}` }, `save ${signed(saveBonus(c, a))}`)))),
          h('p', null, h('b', null, `${w.name}: `), `${signed(weaponAttackBonus(c, w))} to hit, ${weaponDice(c, w)}${signed(weaponDamageBonus(c, w))} ${w.weapon?.type ?? ''}`),
          c.personality ? h('p', { class: 'muted small' }, `Personality: ${c.personality}`) : null,
          c.motivation ? h('p', { class: 'muted small' }, `Motivation: ${c.motivation}`) : null,
          c.companionId ? h('p', { class: 'muted small' }, COMPANION_BY_ID[c.companionId].bio) : null),
        h('div', { class: 'cs-col panel' }, h('h4', null, 'Skills'),
          h('div', { class: 'skills' }, ALL_SKILLS.map((sk) => h('div', { class: `skill ${c.skillProfs.includes(sk) ? 'prof' : ''} ${c.expertise.includes(sk) ? 'exp' : ''}` },
            h('span', null, `${c.expertise.includes(sk) ? '◆' : c.skillProfs.includes(sk) ? '●' : '○'} ${SKILL_NAMES[sk]}`), h('span', { class: 'muted small' }, SKILL_ABILITY[sk].toUpperCase()), h('b', null, signed(skillBonus(c, sk)))))),
          h('h4', null, 'Features & feats'),
          h('ul', { class: 'features' }, features(c).map((f) => h('li', { 'data-tip': f.desc }, h('b', null, f.name), h('span', { class: 'muted small' }, ` (Lv ${f.level})`))),
            c.feats.map((f) => { const d = [...FEATS, ...FIGHTING_STYLES].find((x) => x.id === f); return d ? h('li', { 'data-tip': d.desc }, h('b', null, d.name)) : null; }),
            ANCESTRY_BY_ID[c.ancestry]?.traits.map((t) => h('li', { 'data-tip': t.desc }, t.name, h('span', { class: 'muted small' }, ' (ancestry)')))),
          Object.keys(c.resources).length ? h('div', null, h('h4', null, 'Resources'), Object.entries(c.resources).map(([k, r]) => h('div', { class: 'small' }, `${k.replace(/_/g, ' ')}: ${r.max - r.used}/${r.max} (${r.recharge} rest)`))) : null),
        spellPanel(c, render, !!opts.canPrepare)));
  };
  render();
  modal('Character', root, { wide: true, onClose: () => app.explore?.refresh() });
}

function stat(label: string, v: string) { return h('div', { class: 'stat' }, h('div', { class: 'st-v' }, v), h('div', { class: 'st-l' }, label)); }

function spellPanel(c: Character, rerender: () => void, canPrepare: boolean): HTMLElement | null {
  const cls = CLASS_BY_ID[c.classId];
  if (cls.caster === 'none') return null;
  const max = spellSlotsMax(c);
  const castable = new Set(castableSpells(c).map((s) => s.id));
  const known = c.knownSpells.map((id) => ACTION_BY_ID[id]).filter(Boolean).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  return h('div', { class: 'cs-col panel spellbook' },
    h('h4', null, 'Spellbook'),
    h('div', { class: 'small' }, `Spell attack ${signed(spellAttackBonus(c))} · Save DC ${spellSaveDC(c)} · Highest slot ${maxSpellLevel(c) || '—'}`),
    h('div', { class: 'small' }, 'Slots: ', max.map((n, l) => n ? `L${l} ${slotsAvailable(c, l)}/${n}  ` : '').join('')),
    cls.prepares ? h('div', { class: 'small muted' }, `Prepared ${c.preparedSpells.length}/${preparedLimit(c)}${canPrepare ? ' — click a spell to prepare/unprepare' : ' — change prepared spells at camp'}`) : null,
    known.map((sp) => {
      const prepared = (sp.level ?? 0) === 0 || castable.has(sp.id);
      return h('div', { class: `spell ${prepared ? 'prep' : 'unprep'} ${canPrepare && cls.prepares && (sp.level ?? 0) > 0 ? 'clickable' : ''}`, 'data-tip': sp.desc,
        onclick: () => {
          if (!canPrepare || !cls.prepares || !(sp.level ?? 0)) return;
          if (c.preparedSpells.includes(sp.id)) c.preparedSpells = c.preparedSpells.filter((x) => x !== sp.id);
          else if (c.preparedSpells.length < preparedLimit(c)) c.preparedSpells.push(sp.id);
          else { toast(`You can prepare at most ${preparedLimit(c)} spells.`, 'bad'); return; }
          rerender();
        } },
        h('span', { class: 'lvl' }, (sp.level ?? 0) === 0 ? 'C' : String(sp.level)), sp.name, sp.concentration ? h('span', { class: 'muted small' }, ' (conc.)') : null);
    }));
}

export function levelUpFlow(app: App, c: Character, after: () => void): void {
  const next = c.level + 1;
  const cls = CLASS_BY_ID[c.classId];
  const ch: LevelChoices = c.kind === 'companion' ? autoLevelChoices(c) : {};
  const gains = spellGains(c);
  const pool = spellsForClass(c.classId, Math.max(1, maxSpellLevel({ ...c, level: next } as Character)));
  const hpGain = computeMaxHp({ ...c, level: next } as Character) - c.maxHp;
  const root = h('div', { class: 'levelup' });
  const render = () => {
    clear(root);
    root.append(h('p', null, `${c.name} reaches level ${next}: +${hpGain} max HP${next % 4 === 1 && next > 1 ? ', proficiency bonus increases' : ''}.`));
    const newFeat = [...cls.features, ...(cls.subclasses.find((x) => x.id === (ch.subclassId ?? c.subclassId))?.features ?? [])].filter((f) => f.level === next);
    if (newFeat.length) root.append(h('div', null, h('b', null, 'New features: '), newFeat.map((f) => f.name).join(', ')));
    if (c.kind === 'companion') root.append(h('p', { class: 'muted' }, `${c.name.split(' ')[0]} has made their own choices below. You may change them.`));
    if (needsSubclass(c, next)) root.append(h('h4', null, 'Choose a specialisation'), h('div', { class: 'pick-grid small' }, cls.subclasses.map((sc) =>
      h('div', { class: `pick-card ${ch.subclassId === sc.id ? 'sel' : ''}`, onclick: () => { ch.subclassId = sc.id; render(); } }, h('div', { class: 'pick-title' }, sc.name), h('div', { class: 'pick-sub' }, sc.desc)))));
    if (needsFightingStyle(c, next)) root.append(h('h4', null, 'Fighting style'), h('div', { class: 'pick-grid small' }, FIGHTING_STYLES.map((fs) =>
      h('div', { class: `pick-card ${ch.fightingStyle === fs.id ? 'sel' : ''}`, onclick: () => { ch.fightingStyle = fs.id; render(); } }, h('div', { class: 'pick-title' }, fs.name), h('div', { class: 'pick-sub' }, fs.desc)))));
    if (isAsiLevel(c.classId, next)) {
      const spent = Object.values(ch.asi ?? {}).reduce((a, b) => a + (b ?? 0), 0);
      root.append(h('h4', null, `Ability Score Improvement (${spent}/2) — or take a feat`),
        h('div', { class: 'row' }, ABILITIES.map((a: Ability) => h('button', { class: `btn small ${(ch.asi?.[a] ?? 0) ? '' : 'ghost'}`, onclick: () => {
          ch.feat = undefined; ch.asi = ch.asi ?? {};
          const cur = ch.asi[a] ?? 0;
          if (spent < 2 && c.abilities[a] + cur < 20) ch.asi[a] = cur + 1; else if (cur) ch.asi[a] = cur - 1;
          render();
        } }, `${a.toUpperCase()} ${c.abilities[a]}${ch.asi?.[a] ? ` +${ch.asi[a]}` : ''}`))),
        h('div', { class: 'pick-grid small' }, FEATS.filter((f) => !c.feats.includes(f.id)).map((f) => h('div', { class: `pick-card ${ch.feat === f.id ? 'sel' : ''}`, onclick: () => { ch.feat = f.id; ch.asi = undefined; render(); } }, h('div', { class: 'pick-title' }, f.name), h('div', { class: 'pick-sub' }, f.desc)))));
    }
    if (gains.cantrips) root.append(spellPicker('New cantrips', pool.filter((p) => p.level === 0 && !c.knownSpells.includes(p.id)), (ch.newCantrips ??= []), gains.cantrips, render));
    if (gains.spells) root.append(spellPicker('New spells', pool.filter((p) => (p.level ?? 0) > 0 && !c.knownSpells.includes(p.id)), (ch.newSpells ??= []), gains.spells, render));
    const secrets = secretsGain(c);
    if (secrets) root.append(spellPicker('Magical Secrets (any class)', anyClassSpells(Math.max(1, maxSpellLevel({ ...c, level: next } as Character))).filter((p) => !c.knownSpells.includes(p.id) && !p.classes?.includes(c.classId)), (ch.secretSpells ??= []), secrets, render));
    const expN = expertiseGain(c);
    if (expN) {
      const chosen = (ch.expertise ??= []);
      root.append(h('h4', null, `Expertise (${chosen.length}/${expN})`), h('div', { class: 'pick-grid small' }, c.skillProfs.filter((sk) => !c.expertise.includes(sk)).map((sk) =>
        h('div', { class: `pick-card ${chosen.includes(sk) ? 'sel' : ''}`, onclick: () => { const i = chosen.indexOf(sk); if (i >= 0) chosen.splice(i, 1); else if (chosen.length < expN) chosen.push(sk); render(); } }, h('div', { class: 'pick-title' }, SKILL_NAMES[sk])))));
    }
    root.append(h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => {
      if (needsSubclass(c, next) && !ch.subclassId) { toast('Choose a specialisation.', 'bad'); return; }
      if (needsFightingStyle(c, next) && !ch.fightingStyle) { toast('Choose a fighting style.', 'bad'); return; }
      if (isAsiLevel(c.classId, next) && !ch.feat && Object.values(ch.asi ?? {}).reduce((a, b) => a + (b ?? 0), 0) < 2) { toast('Spend 2 ability points or choose a feat.', 'bad'); return; }
      if (expertiseGain(c) && (ch.expertise?.length ?? 0) < expertiseGain(c)) { toast('Choose your expertise skills.', 'bad'); return; }
      applyLevelUp(c, ch);
      sfx('levelup');
      toast(`${c.name} is now level ${c.level}!`, 'good');
      handle.close();
      after();
    } }, 'Confirm level up')));
  };
  const handle = modal(`Level Up — ${c.name}`, root, { wide: true });
  render();
}

function spellPicker(title: string, list: any[], chosen: string[], max: number, render: () => void): HTMLElement {
  return h('div', null, h('h4', null, `${title} (${chosen.length}/${max})`), h('div', { class: 'pick-grid small' }, list.map((sp) =>
    h('div', { class: `pick-card ${chosen.includes(sp.id) ? 'sel' : ''}`, 'data-tip': sp.desc, onclick: () => {
      const i = chosen.indexOf(sp.id);
      if (i >= 0) chosen.splice(i, 1); else if (chosen.length < max) chosen.push(sp.id);
      render();
    } }, h('div', { class: 'pick-title' }, `${sp.name}${sp.level ? ` (L${sp.level})` : ''}`), h('div', { class: 'pick-sub' }, sp.desc)))));
}
